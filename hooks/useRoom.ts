'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ROOM_CHANGE_EVENT } from '@/services/local-room-store';
import { isLocalTransport, roomTransport } from '@/services/room-transport';
import type { Room } from '@/types/playroom';

/**
 * Keeps one room in sync.
 *
 * Two sources feed it. The local transport pushes a `ROOM_CHANGE_EVENT` in the
 * writing tab and a `storage` event in every other tab, so play feels instant.
 * A poll runs underneath as the general mechanism, and it is the only one that
 * works once the remote transport is switched on.
 *
 * `refresh` is exposed so an action can pull the authoritative room immediately
 * instead of waiting out the poll interval.
 */
const POLL_INTERVAL_MS = 2_000;

export function useRoom(roomKey: string): {
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

  const refresh = useCallback(async () => {
    const current = generation.current;
    try {
      const next = await roomTransport.getRoom(roomKey);
      if (generation.current !== current) return;
      setRoom(next);
      setError(null);
    } catch (cause) {
      if (generation.current !== current) return;
      setError(cause instanceof Error ? cause.message : 'Could not load this room.');
    }
  }, [roomKey]);

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

  return { room, error, refresh, apply };
}
