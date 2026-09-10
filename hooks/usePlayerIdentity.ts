'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { PlayerIdentity } from '@/types/playroom';

/** Fired after this tab writes an identity, so the store re-reads immediately. */
const IDENTITY_CHANGED = 'playroom:identity-changed';

/** The one place the session-storage key format is defined. */
function storageKeyFor(roomKey: string): string {
  return `playroom:me:${roomKey.toUpperCase()}`;
}

/** What is written to session storage. The token is half of it. */
interface StoredIdentity {
  playerId: string;
  playerToken: string;
}

function parse(raw: string | null): StoredIdentity | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value === null || typeof value !== 'object') return null;
    const { playerId, playerToken } = value as Record<string, unknown>;
    if (typeof playerId !== 'string' || typeof playerToken !== 'string') return null;
    return { playerId, playerToken };
  } catch {
    // An older tab stored a bare player id, which is no longer enough to act
    // with. Treat it as "not a member": the room screen offers the join form,
    // which is the only recovery. A lost token cannot be recovered by design.
    return null;
  }
}

/**
 * Records the player this tab is, before navigating into the room.
 *
 * Exported for the create and join forms: they learn the identity one route
 * before the room screen mounts, and writing it here keeps the key format from
 * being spelled out in three files.
 *
 * The token is a credential, so it goes to session storage and nowhere else,
 * never to a URL, a log line, or the page.
 */
export function rememberPlayerIdentity(
  roomKey: string,
  playerId: string,
  playerToken: string,
): void {
  try {
    window.sessionStorage.setItem(
      storageKeyFor(roomKey),
      JSON.stringify({ playerId, playerToken } satisfies StoredIdentity),
    );
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
 * load-bearing three times over. Session storage is per-tab, so opening a
 * second tab makes you a second player instead of hijacking the host's
 * identity, which is what lets one browser test a real multi-player room. It
 * is also what makes the product's promise true: close the tab and the identity
 * is gone, because nothing was kept against you.
 *
 * Read through `useSyncExternalStore` rather than an effect. Session storage is
 * an external store, and this is the hook built for reading one: it avoids the
 * mount-then-setState cascade, and its server snapshot gives callers an honest
 * "not read yet" value so nothing redirects on the first paint.
 *
 * The snapshot is the raw stored string, so referential equality holds and
 * React never loops. The object is parsed and derived with `useMemo` after.
 */
export function usePlayerIdentity(roomKey: string): {
  identity: PlayerIdentity | null | undefined;
  remember: (playerId: string, playerToken: string) => void;
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

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const identity = useMemo<PlayerIdentity | null | undefined>(() => {
    if (raw === undefined) return undefined;
    const stored = parse(raw);
    if (stored === null) return null;
    return {
      roomKey: roomKey.toUpperCase(),
      playerId: stored.playerId,
      playerToken: stored.playerToken,
    };
  }, [raw, roomKey]);

  const remember = useCallback(
    (playerId: string, playerToken: string) =>
      rememberPlayerIdentity(roomKey, playerId, playerToken),
    [roomKey],
  );

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
