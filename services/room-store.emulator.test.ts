// @vitest-environment node

import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ROOM_SETTINGS } from '@/lib/games';
import { RoomError } from '@/lib/room-engine';
import { getFirestore } from '@/services/firestore.client';
import {
  advanceRound,
  applyAction,
  createRoom,
  end,
  HOST_IDLE_MS,
  joinRoom,
  lock,
  readRoom,
  removePlayer,
  replay,
  startRound,
  TURN_SECONDS,
  watchRoom,
} from '@/services/room-store';
import type { JoinedRoom, Room } from '@/types/playroom';

/**
 * The rooms API against the real Firestore emulator.
 *
 * These SKIP when `FIRESTORE_EMULATOR_HOST` is unset, which keeps `pnpm test`,
 * and therefore `pnpm validate`, green on a clean checkout. Run them with:
 *
 *     pnpm test:emulator
 *
 * CI runs the same script in its own job.
 *
 * Why an emulator rather than mocks: what needs proving is Firestore's
 * behaviour under our transactions. Whether two moves sent at the same instant
 * really serialise, whether exactly one of two claims wins. A mock would answer
 * the way the author expected, which is the assumption under test.
 */

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '';
const describeEmulator = emulatorHost === '' ? describe.skip : describe;

/** Cells that make five complete lines on any board: rows 1-3 and both diagonals. */
const FIVE_LINE_CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18, 24, 16, 20];

async function openRoom(hostName = 'Rhea', maxPlayers = 8): Promise<JoinedRoom> {
  return createRoom({
    gameId: 'bingo',
    settings: { ...DEFAULT_ROOM_SETTINGS, maxPlayers },
    hostName,
    hostColor: 'peach',
  });
}

async function read(key: string, token: string | null): Promise<Room> {
  const result = await readRoom(key, token);
  if (result.kind !== 'room') throw new Error('Expected a room body');
  return result.room;
}

async function rejection(promise: Promise<unknown>): Promise<RoomError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof RoomError) return error;
    throw error;
  }
  throw new Error('Expected the call to be rejected');
}

/** The real clock, captured before any test replaces `Date.now`. */
const realNow = Date.now.bind(Date);
let clockOffset = 0;

/**
 * Moves the clock the server reads, and nothing else. Only `Date.now` moves;
 * timers stay real, because the Firestore client runs on them.
 */
function advanceClock(ms: number): void {
  clockOffset += ms;
  vi.spyOn(Date, 'now').mockImplementation(() => realNow() + clockOffset);
}

async function eventsFor(key: string): Promise<string[]> {
  const snapshot = await getFirestore().collection('events').where('roomKey', '==', key).get();
  return snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => a['occurredAt'].toMillis() - b['occurredAt'].toMillis())
    .map((data) => String(data['type']));
}

describeEmulator('room store (emulator)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clockOffset = 0;
  });

  afterAll(async () => {
    await getFirestore().terminate();
  });

  describe('create, join and read', () => {
    it('opens a room and reads it back as the host', async () => {
      const host = await openRoom();
      expect(host.room.key).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
      expect(host.playerToken.length).toBeGreaterThan(40);

      const room = await read(host.room.key, host.playerToken);
      expect(room.hostId).toBe(host.playerId);
      expect(room.phase).toBe('lobby');
      expect(room.players.map((player) => player.name)).toEqual(['Rhea']);
    });

    it('never puts a token or a token hash in the payload', async () => {
      const host = await openRoom();
      const text = JSON.stringify(await read(host.room.key, host.playerToken));
      expect(text).not.toContain(host.playerToken);
      expect(text).not.toContain('tokenHash');
    });

    it('is case-insensitive about the key', async () => {
      const host = await openRoom();
      const room = await read(host.room.key.toLowerCase(), null);
      expect(room.key).toBe(host.room.key);
    });

    it('answers room-not-found for a key nobody issued', async () => {
      expect((await rejection(readRoom('ZZZZZZ', null))).code).toBe('room-not-found');
      expect((await rejection(readRoom('not a key', null))).code).toBe('room-not-found');
    });

    it('treats a token from another room as not-in-room, not as a spectator', async () => {
      const first = await openRoom();
      const second = await openRoom();
      const error = await rejection(readRoom(first.room.key, second.playerToken));
      expect(error.code).toBe('not-in-room');
    });

    it('refuses a nickname already in the room, whatever its case', async () => {
      const host = await openRoom('Rhea');
      const error = await rejection(joinRoom(host.room.key, { name: 'rhea', color: 'mint' }));
      expect(error.code).toBe('name-taken');
    });

    it('lets exactly one of two players racing for one nickname have it', async () => {
      const host = await openRoom();
      const results = await Promise.allSettled([
        joinRoom(host.room.key, { name: 'Dev', color: 'mint' }),
        joinRoom(host.room.key, { name: 'DEV', color: 'yellow' }),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const room = await read(host.room.key, null);
      expect(room.players).toHaveLength(2);
    });

    it('reports itself full at the cap', async () => {
      const host = await openRoom('Rhea', 2);
      await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });
      const error = await rejection(joinRoom(host.room.key, { name: 'Ana', color: 'cream' }));
      expect(error.code).toBe('room-full');
    });

    it('refuses a room opened for more players than the game takes', async () => {
      const error = await rejection(
        createRoom({
          gameId: 'bingo',
          settings: { ...DEFAULT_ROOM_SETTINGS, maxPlayers: 21 },
          hostName: 'Rhea',
          hostColor: 'peach',
        }),
      );
      expect(error.code).toBe('room-full');
    });

    it('refuses a game that is not playable yet', async () => {
      const error = await rejection(
        createRoom({
          gameId: 'scribble',
          settings: DEFAULT_ROOM_SETTINGS,
          hostName: 'Rhea',
          hostColor: 'peach',
        }),
      );
      expect(error.code).toBe('wrong-phase');
    });
  });

  describe('a round', () => {
    async function twoPlayersInPlay(): Promise<{ host: JoinedRoom; guest: JoinedRoom }> {
      const host = await openRoom();
      const guest = await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });
      await startRound(host.room.key, host.playerToken);
      return { host, guest };
    }

    it('lets only the host start it', async () => {
      const host = await openRoom();
      const guest = await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });
      const error = await rejection(startRound(host.room.key, guest.playerToken));
      expect(error.code).toBe('not-host');
    });

    it("shows each player their own board and nobody else's", async () => {
      const { host, guest } = await twoPlayersInPlay();
      const asHost = await read(host.room.key, host.playerToken);
      const asGuest = await read(host.room.key, guest.playerToken);
      const asSpectator = await read(host.room.key, null);

      expect(Object.keys(asHost.bingo?.cards ?? {})).toEqual([host.playerId]);
      expect(Object.keys(asGuest.bingo?.cards ?? {})).toEqual([guest.playerId]);
      expect(asSpectator.bingo?.cards).toEqual({});
      expect([...(asHost.bingo?.cards[host.playerId] ?? [])].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 25 }, (_, index) => index + 1),
      );
    });

    it('puts the turn on the clock', async () => {
      const { host } = await twoPlayersInPlay();
      const room = await read(host.room.key, host.playerToken);
      expect(room.bingo?.turnSecondsRemaining).toBeGreaterThan(TURN_SECONDS - 3);
      expect(room.bingo?.turnSecondsRemaining).toBeLessThanOrEqual(TURN_SECONDS);
    });

    it('enforces turn order and passes play on', async () => {
      const { host, guest } = await twoPlayersInPlay();
      const key = host.room.key;

      expect((await rejection(selectAs(key, guest.playerToken, 5))).code).toBe('not-your-turn');
      const after = await selectAs(key, host.playerToken, 5);
      expect(after.bingo?.selected).toEqual([5]);
      expect(after.bingo?.lastPick).toEqual({ value: 5, playerId: host.playerId });
      expect(after.bingo?.turnOrder[after.bingo.currentTurnIndex]).toBe(guest.playerId);

      expect((await rejection(selectAs(key, guest.playerToken, 5))).code).toBe('number-taken');
      expect((await rejection(selectAs(key, guest.playerToken, 26))).code).toBe('invalid-number');
    });

    it('lets only one of two simultaneous moves through', async () => {
      const { host } = await twoPlayersInPlay();
      const results = await Promise.allSettled([
        selectAs(host.room.key, host.playerToken, 3),
        selectAs(host.room.key, host.playerToken, 4),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const room = await read(host.room.key, null);
      expect(room.bingo?.selected).toHaveLength(1);
    });

    it('treats a retried move with the same idempotency key as one move', async () => {
      const { host } = await twoPlayersInPlay();
      const move = { type: 'select_number', payload: { value: 9 } };
      await applyAction(host.room.key, host.playerToken, move, 'retry-9');
      const replayed = await applyAction(host.room.key, host.playerToken, move, 'retry-9');
      expect(replayed.bingo?.selected).toEqual([9]);
    });

    it('rejects a move type the game does not have', async () => {
      const { host } = await twoPlayersInPlay();
      const error = await rejection(
        applyAction(host.room.key, host.playerToken, { type: 'fly', payload: {} }, null),
      );
      expect(error.code).toBe('wrong-phase');
    });

    it('plays a timed-out turn for the player who has gone', async () => {
      const { host, guest } = await twoPlayersInPlay();
      advanceClock((TURN_SECONDS + 1) * 1000);

      // The guest's read settles the host's expired turn.
      const room = await read(host.room.key, guest.playerToken);
      expect(room.bingo?.selected).toHaveLength(1);
      expect(room.bingo?.lastPick?.playerId).toBe(host.playerId);
      expect(room.bingo?.turnOrder[room.bingo.currentTurnIndex]).toBe(guest.playerId);
      expect(await eventsFor(host.room.key)).toContain('turn_timed_out');
    });
  });

  describe('winning', () => {
    /** A room where the host alone takes every turn. */
    async function soloInPlay(): Promise<JoinedRoom> {
      const host = await openRoom();
      await startRound(host.room.key, host.playerToken);
      return host;
    }

    async function takeFiveLines(host: JoinedRoom): Promise<void> {
      const room = await read(host.room.key, host.playerToken);
      const card = room.bingo?.cards[host.playerId] ?? [];
      for (const cell of FIVE_LINE_CELLS) {
        await selectAs(host.room.key, host.playerToken, card[cell] as number);
      }
    }

    it('rejects an early claim, records it, and keeps the round running', async () => {
      const host = await soloInPlay();
      const error = await rejection(claimAs(host.room.key, host.playerToken));
      expect(error.code).toBe('invalid-claim');
      expect((await read(host.room.key, null)).phase).toBe('playing');
      expect(await eventsFor(host.room.key)).toContain('bingo_rejected');
    });

    it('accepts five lines once, and only once, under a simultaneous double claim', async () => {
      const host = await soloInPlay();
      await takeFiveLines(host);

      const results = await Promise.allSettled([
        claimAs(host.room.key, host.playerToken),
        claimAs(host.room.key, host.playerToken),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);

      const room = await read(host.room.key, null);
      expect(room.phase).toBe('round-results');
      expect(room.bingo?.winnerId).toBe(host.playerId);
      expect(room.bingo?.turnSecondsRemaining).toBeNull();
      // The reveal: a spectator now sees the winning board.
      expect(Object.keys(room.bingo?.cards ?? {})).toEqual([host.playerId]);
      expect(room.players[0]?.score).toBe(100);
      expect(room.lastRound?.[0]?.note).toBe('Bingo');
    });

    it('ends the session after the last round, and replays with scores reset', async () => {
      const host = await soloInPlay();
      await takeFiveLines(host);
      await claimAs(host.room.key, host.playerToken);

      const finished = await advanceRound(host.room.key, host.playerToken);
      expect(finished.phase).toBe('finished');
      expect(finished.bingo).toBeNull();

      const replayed = await replay(host.room.key, host.playerToken);
      expect(replayed.phase).toBe('lobby');
      expect(replayed.players[0]?.score).toBe(0);

      const again = await startRound(host.room.key, host.playerToken);
      expect(again.bingo?.selected).toEqual([]);
    });
  });

  describe('the host', () => {
    it('can lock the room, remove a player and end the session', async () => {
      const host = await openRoom();
      const guest = await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });

      const locked = await lock(host.room.key, host.playerToken);
      expect(locked.settings.privacy).toBe('Locked after start');

      const removed = await removePlayer(host.room.key, host.playerToken, guest.playerId);
      expect(removed.players.map((player) => player.id)).toEqual([host.playerId]);
      // The removed player's token no longer works.
      expect((await rejection(readRoom(host.room.key, guest.playerToken))).code).toBe(
        'not-in-room',
      );

      const ended = await end(host.room.key, host.playerToken);
      expect(ended.phase).toBe('finished');
    });

    it('lets a player leave on their own', async () => {
      const host = await openRoom();
      const guest = await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });
      await removePlayer(host.room.key, guest.playerToken, guest.playerId);
      expect(await eventsFor(host.room.key)).toContain('player_left');
    });

    it('is handed to a player who is still here once the host goes quiet', async () => {
      const host = await openRoom();
      const guest = await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });

      advanceClock(HOST_IDLE_MS + 1_000);
      const room = await read(host.room.key, guest.playerToken);
      expect(room.hostId).toBe(guest.playerId);
      expect(room.players.find((player) => player.id === guest.playerId)?.isHost).toBe(true);
      expect(await eventsFor(host.room.key)).toContain('host_promoted');
    });

    it('is not replaced while the host keeps reading', async () => {
      const host = await openRoom();
      const guest = await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });

      advanceClock(40_000);
      await read(host.room.key, host.playerToken);
      advanceClock(40_000);
      const room = await read(host.room.key, guest.playerToken);
      expect(room.hostId).toBe(host.playerId);
    });
  });

  describe('reads', () => {
    it('answers not-modified for a caller who already holds the current version', async () => {
      const host = await openRoom();
      const first = await readRoom(host.room.key, host.playerToken);
      const second = await readRoom(
        host.room.key,
        host.playerToken,
        (version, viewerId) => version === first.version && viewerId === host.playerId,
      );
      expect(second.kind).toBe('not-modified');
    });

    it('stops answering once the room has expired', async () => {
      const host = await openRoom();
      advanceClock(2 * 60 * 60 * 1000 + 1_000);
      expect((await rejection(readRoom(host.room.key, null))).code).toBe('room-not-found');
    });

    it('pushes a change to a live listener', async () => {
      const host = await openRoom();
      const seen: Room[] = [];

      const stop = watchRoom(host.room.key, host.playerToken, {
        room: (room) => seen.push(room),
        closed: () => undefined,
        failed: (error) => {
          throw error;
        },
      });

      try {
        await vi.waitFor(() => expect(seen.length).toBeGreaterThan(0));
        await joinRoom(host.room.key, { name: 'Dev', color: 'mint' });
        await vi.waitFor(() => expect(seen.at(-1)?.players).toHaveLength(2));
      } finally {
        stop();
      }
    });
  });
});

function selectAs(key: string, token: string, value: number): Promise<Room> {
  return applyAction(key, token, { type: 'select_number', payload: { value } }, null);
}

function claimAs(key: string, token: string): Promise<Room> {
  return applyAction(key, token, { type: 'claim_bingo', payload: {} }, null);
}
