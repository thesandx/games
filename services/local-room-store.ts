/**
 * Browser-backed implementation of `RoomTransport`.
 *
 * Why this exists: the rooms API at `NEXT_PUBLIC_PLAYROOM_API_URL` is not live
 * yet, and an app whose every screen fails on a dead endpoint cannot be
 * reviewed. This store keeps rooms in `localStorage` and applies the same pure
 * reducers from `lib/room-engine.ts` that the server will, so the screens
 * exercise real rules rather than fixtures.
 *
 * What it genuinely supports: one browser profile, across as many tabs and
 * windows as you like — open a second tab, join with the key, and the two play
 * against each other. Writes propagate through the `storage` event.
 *
 * What it cannot do: reach another device. That is what the remote transport is
 * for. Nothing here should grow features the HTTP API will not also have —
 * when the endpoint lands, flip `NEXT_PUBLIC_PLAYROOM_TRANSPORT` to `remote`
 * and this file stops being reachable.
 */

import {
  claimBingo as applyClaim,
  createRoom as applyCreate,
  endSession as applyEnd,
  isExpired,
  joinRoom as applyJoin,
  lockRoom as applyLock,
  nextRound as applyNextRound,
  removePlayer as applyRemove,
  replaySession as applyReplay,
  RoomError,
  selectNumber as applySelect,
  startRound as applyStart,
} from '@/lib/room-engine';
import { createRoomKey } from '@/lib/room-key';
import type {
  CreateRoomInput,
  JoinRoomInput,
  PlayerIdentity,
  Room,
  RoomTransport,
} from '@/types/playroom';

const ROOM_PREFIX = 'playroom:room:';

/** Broadcast channel name; tabs use it to react without waiting for a poll. */
export const ROOM_CHANGE_EVENT = 'playroom:room-changed';

function storage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error(
      'The local room store is browser-only. Render its callers as Client Components.',
    );
  }
  return window.localStorage;
}

function keyFor(roomKey: string): string {
  return `${ROOM_PREFIX}${roomKey.toUpperCase()}`;
}

function read(roomKey: string): Room | null {
  let raw: string | null;
  try {
    raw = storage().getItem(keyFor(roomKey));
  } catch {
    // Private mode and blocked site data both throw on access.
    return null;
  }
  if (raw === null) return null;

  try {
    const room = JSON.parse(raw) as Room;
    if (isExpired(room)) {
      storage().removeItem(keyFor(roomKey));
      return null;
    }
    return room;
  } catch {
    return null;
  }
}

function write(room: Room): Room {
  try {
    storage().setItem(keyFor(room.key), JSON.stringify(room));
    // `storage` only fires in OTHER tabs, so dispatch locally too and give
    // every listener one code path.
    window.dispatchEvent(new CustomEvent(ROOM_CHANGE_EVENT, { detail: room.key }));
  } catch {
    throw new Error('This browser is blocking local storage, so rooms cannot be saved here.');
  }
  return room;
}

function requireRoom(roomKey: string): Room {
  const room = read(roomKey);
  if (!room) throw new RoomError('room-not-found', 'That room no longer exists.');
  return room;
}

function newId(): string {
  return globalThis.crypto.randomUUID();
}

/** Generates a key that is not already taken in this browser. */
function freeRoomKey(): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = createRoomKey();
    if (read(candidate) === null) return candidate;
  }
  return createRoomKey();
}

/**
 * Applies a reducer to the stored room and persists the result.
 *
 * Read, reduce and write run in one synchronous block with no `await` between
 * them. JavaScript is single-threaded per tab and `localStorage` writes are
 * synchronous, so no other tab can observe or overwrite the half-applied state:
 * this read-modify-write is atomic in practice. That is what lets two numbers
 * chosen at the same instant serialise — the second call reads the first one's
 * result and is rejected by the engine.
 *
 * A real server gets this from its own transaction. Nothing here relies on the
 * caller behaving; the rejection comes from `lib/room-engine.ts`.
 */
function mutate(roomKey: string, reducer: (room: Room) => Room): Room {
  return write(reducer(requireRoom(roomKey)));
}

/**
 * Every method is `async`, and that is not cosmetic. `mutate` throws a
 * `RoomError` synchronously; without `async` these functions would throw at the
 * call site instead of returning a rejected promise, so a caller using
 * `.catch()` would take an uncaught exception. `async` turns every throw into a
 * rejection and makes the local store behave exactly like the HTTP one.
 */
export const localRoomStore: RoomTransport = {
  async createRoom(input: CreateRoomInput) {
    const playerId = newId();
    const room = write(applyCreate(input, freeRoomKey(), playerId));
    return { room, playerId };
  },

  async joinRoom(input: JoinRoomInput) {
    const playerId = newId();
    const room = mutate(input.key, (current) => applyJoin(current, input, playerId));
    return { room, playerId };
  },

  async getRoom(key: string) {
    return read(key);
  },

  async startRound(identity: PlayerIdentity) {
    return mutate(identity.roomKey, (room) => applyStart(room, identity.playerId));
  },

  async selectNumber(identity: PlayerIdentity, value: number) {
    return mutate(identity.roomKey, (room) => applySelect(room, identity.playerId, value));
  },

  async claimBingo(identity: PlayerIdentity) {
    return mutate(identity.roomKey, (room) => applyClaim(room, identity.playerId));
  },

  async nextRound(identity: PlayerIdentity) {
    return mutate(identity.roomKey, (room) => applyNextRound(room, identity.playerId));
  },

  async lockRoom(identity: PlayerIdentity) {
    return mutate(identity.roomKey, (room) => applyLock(room, identity.playerId));
  },

  async endSession(identity: PlayerIdentity) {
    return mutate(identity.roomKey, (room) => applyEnd(room, identity.playerId));
  },

  async replaySession(identity: PlayerIdentity) {
    return mutate(identity.roomKey, (room) => applyReplay(room, identity.playerId));
  },

  async removePlayer(identity: PlayerIdentity, targetPlayerId: string) {
    return mutate(identity.roomKey, (room) => applyRemove(room, identity.playerId, targetPlayerId));
  },
};
