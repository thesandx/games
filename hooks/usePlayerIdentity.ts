'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { PlayerIdentity } from '@/types/playroom';

/** Fired after this tab writes an identity, so the store re-reads immediately. */
const IDENTITY_CHANGED = 'playroom:identity-changed';

/** The one place the session-storage key format is defined. */
function storageKeyFor(roomKey: string): string {
  return `playroom:me:${roomKey.toUpperCase()}`;
}

/**
 * Records the player this tab is, before navigating into the room.
 *
 * Exported for the create and join forms: they learn the player id one route
 * before the room screen mounts, and writing it here keeps the key format from
 * being spelled out in three files.
 */
export function rememberPlayerIdentity(roomKey: string, playerId: string): void {
  try {
    window.sessionStorage.setItem(storageKeyFor(roomKey), playerId);
  } catch {
    // Non-fatal: the room screen will treat this tab as a non-member and
    // offer the join form again.
  }
  window.dispatchEvent(new Event(IDENTITY_CHANGED));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(IDENTITY_CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(IDENTITY_CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Remembers which player this tab is, for one room.
 *
 * Stored in `sessionStorage`, not `localStorage`, and that choice is
 * load-bearing: session storage is per-tab, so opening a second tab makes you a
 * second player instead of hijacking the host's identity. It is what lets one
 * browser test a real multi-player room.
 *
 * Read through `useSyncExternalStore` rather than an effect. Session storage is
 * an external store, and this is the hook built for reading one: it avoids the
 * mount-then-setState cascade, and its server snapshot gives callers an honest
 * "not read yet" value so nothing redirects on the first paint.
 *
 * The snapshot is the raw player id — a string, so referential equality holds
 * and React never loops. The object is derived with `useMemo` afterwards.
 */
export function usePlayerIdentity(roomKey: string): {
  identity: PlayerIdentity | null | undefined;
  remember: (playerId: string) => void;
  forget: () => void;
} {
  const storageKey = storageKeyFor(roomKey);

  const getSnapshot = useCallback((): string | null => {
    try {
      return window.sessionStorage.getItem(storageKey);
    } catch {
      // Blocked site data: treat as "not in this room" rather than crashing.
      return null;
    }
  }, [storageKey]);

  // Undefined on the server and during hydration, which callers read as
  // "still loading" instead of "definitely not a member".
  const getServerSnapshot = useCallback((): string | null | undefined => undefined, []);

  const playerId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const identity = useMemo<PlayerIdentity | null | undefined>(() => {
    if (playerId === undefined) return undefined;
    if (playerId === null) return null;
    return { roomKey: roomKey.toUpperCase(), playerId };
  }, [playerId, roomKey]);

  const remember = useCallback((id: string) => rememberPlayerIdentity(roomKey, id), [roomKey]);

  const forget = useCallback(() => {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    window.dispatchEvent(new Event(IDENTITY_CHANGED));
  }, [storageKey]);

  return { identity, remember, forget };
}
