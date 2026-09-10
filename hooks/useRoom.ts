'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ROOM_CHANGE_EVENT } from '@/services/local-room-store';
import { isLocalTransport, roomTransport } from '@/services/room-transport';
import type { PlayerIdentity, Room } from '@/types/playroom';

/**
 * Keeps one room in sync.
 *
 * Three sources feed it, and the layering is deliberate:
 *
 * 1. **The poll**, every two seconds. It is the only mechanism that works in
 *    every case, so it always runs. Everything else is an accelerator.
 * 2. **The event stream**, when the transport has one. It pushes the room the
 *    moment it changes, which is the difference between a turn landing
 *    instantly and landing up to two seconds late.
 * 3. **Local storage events**, for the browser transport, which has no server
 *    to stream from.
 *
 * The poll is not switched off when the stream connects. A stream can drop
 * silently, and a proxy can hold a frame; a room that is at most two seconds
 * stale is a much better failure than a screen that has quietly stopped.
 *
 * `refresh` is exposed so an action can pull the authoritative room immediately
 * instead of waiting out the poll interval.
 */
const POLL_INTERVAL_MS = 2_000;

export function useRoom(
  roomKey: string,
  /** Scopes which boards come back. Omit before the viewer is known. */
  viewer?: PlayerIdentity,
): {
  room: Room | null | undefined;
  error: string | null;
  refresh: () => Promise<void>;
  /** Applies a room a mutation already returned, skipping a fetch round-trip. */
  apply: (room: Room) => void;
} {
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  // Guards against a slow poll landing after the component unmounts, and
  // against an in-flight fetch overwriting a fresher mutation result.
  const generation = useRef(0);
  // One read at a time. A second read of the same room while one is still open
  // buys nothing — it can only return the same answer — and it costs something
  // real: the browser revalidates this URL against its cache, and two requests
  // contending for one cache entry make the browser drop one of them.
  const inFlight = useRef<Promise<void> | null>(null);

  // The identity is an object rebuilt on every render, so the effects below
  // key off its two stable strings rather than the object itself. Without
  // this the stream would tear down and reconnect on every render.
  const playerId = viewer?.playerId;
  const playerToken = viewer?.playerToken;

  const refresh = useCallback((): Promise<void> => {
    // Coalesce rather than queue: a caller asking for the room while a read is
    // open wants the current room, and that is exactly what the open read will
    // return.
    if (inFlight.current !== null) return inFlight.current;

    const current = generation.current;
    const read = (async () => {
      try {
        const identity =
          playerId !== undefined && playerToken !== undefined
            ? { roomKey, playerId, playerToken }
            : undefined;
        const next = await roomTransport.getRoom(roomKey, identity);
        if (generation.current !== current) return;
        setRoom(next);
        setError(null);
      } catch (cause) {
        if (generation.current !== current) return;
        setError(cause instanceof Error ? cause.message : 'Could not load this room.');
      } finally {
        inFlight.current = null;
      }
    })();

    inFlight.current = read;
    return read;
  }, [playerId, playerToken, roomKey]);

  const apply = useCallback((next: Room) => {
    generation.current += 1;
    setRoom(next);
    setError(null);
  }, []);

  useEffect(() => {
    // The first read is scheduled rather than called inline. Fetching is a
    // subscription to an external system, and starting it on a timer keeps the
    // effect body free of state updates — the same reason the poll below is a
    // callback rather than a synchronous call.
    const first = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);

    // Same-tab writes from the local store.
    const onLocalChange = (): void => void refresh();
    // Cross-tab writes. `storage` never fires in the tab that wrote.
    const onStorage = (event: StorageEvent): void => {
      if (event.key === null || event.key.includes(roomKey.toUpperCase())) void refresh();
    };

    if (isLocalTransport) {
      window.addEventListener(ROOM_CHANGE_EVENT, onLocalChange);
      window.addEventListener('storage', onStorage);
    }

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      if (isLocalTransport) {
        window.removeEventListener(ROOM_CHANGE_EVENT, onLocalChange);
        window.removeEventListener('storage', onStorage);
      }
    };
  }, [refresh, roomKey]);

  useEffect(() => {
    const subscribe = roomTransport.subscribe;
    if (subscribe === undefined) return;

    const identity =
      playerId !== undefined && playerToken !== undefined
        ? { roomKey, playerId, playerToken }
        : undefined;

    // A pushed room goes through the same generation counter as a mutation
    // result, so an in-flight poll started before the push cannot overwrite it.
    return subscribe(roomKey, identity, (next) => {
      generation.current += 1;
      setRoom(next);
      setError(null);
    });
  }, [playerId, playerToken, roomKey]);

  return { room, error, refresh, apply };
}
