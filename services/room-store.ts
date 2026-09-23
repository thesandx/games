import 'server-only';

import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';

import {
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  Timestamp,
} from '@google-cloud/firestore';
import { z } from 'zod';

import { availableNumbers, findWinningLines, isPlayableNumber } from '@/lib/bingo';
import { findGame } from '@/lib/games';
import { logger } from '@/lib/logger';
import {
  claimBingo,
  createRoom as createRoomState,
  currentTurnPlayerId,
  endSession,
  isBoardExhausted,
  isExpired,
  joinRoom as joinRoomState,
  lockRoom,
  nextRound,
  removePlayer as removePlayerState,
  replaySession,
  ROOM_TTL_MS,
  RoomError,
  scopeRoomForPlayer,
  selectNumber,
  startRound as startRoundState,
} from '@/lib/room-engine';
import {
  type ActionBody,
  avatarColor,
  type CreateRoomBody,
  GAME_IDS,
  type JoinRoomBody,
  roomSettingsSchema,
} from '@/lib/room-http';
import { createRoomKey, isValidRoomKey, normaliseRoomKey } from '@/lib/room-key';
import { getFirestore } from '@/services/firestore.client';
import type { JoinedRoom, Room } from '@/types/playroom';

/**
 * The rooms API, on Firestore.
 *
 * **One document per room.** `rooms/{KEY}` holds the whole session: players,
 * scores, the round, every board, and the token hashes that say who is who.
 * That shape follows the access pattern, which is one thing above all: every
 * player reads the room every two seconds. One document makes that one read,
 * and it makes every move one transaction on one document, which is what turns
 * "two players took 17 at once" into a rule the database enforces rather than a
 * race the code hopes to win.
 *
 * Everything in it is bounded, which is what makes a single document safe:
 * at most 20 players, at most 25 numbers, one board of 25 per player. A full
 * room is a few kilobytes, far under Firestore's 1 MiB ceiling. One document
 * also takes about one sustained write a second, and a turn-based game of
 * humans makes far fewer than that.
 *
 * **The document id is the room key.** Keys are six random characters from a
 * 32-character alphabet, so they spread across the key range exactly as an
 * auto-id does; the hotspot rule against chosen ids is about sequential and
 * timestamp ids, which these are not. Using the key as the id is what lets a
 * create transaction prove a key is free, and lets a read be one `get`.
 *
 * **The rules are not here.** Every rule of play lives in `lib/room-engine.ts`,
 * the same pure reducers the browser transport runs. This file adds only what
 * needs a server: transactions, credentials, the turn clock, host promotion,
 * idempotent retries and the audit log.
 *
 * **Nothing here outlives the room for long.** Each document carries `expireAt`,
 * a Timestamp that mirrors the room's two-hour expiry, and a Firestore TTL
 * policy on that field deletes the room, with every nickname and board in it,
 * after it expires. See `firestore.indexes.json` and `scripts/firestore-deploy.sh`.
 */

const ROOMS = 'rooms';
const EVENTS = 'events';

/**
 * How long a player has to take their turn. Past this, the turn is played for
 * them and passes on. The client never hard-codes it: it renders the seconds
 * the server reports.
 */
export const TURN_SECONDS = 20;
const TURN_MS = TURN_SECONDS * 1000;

/**
 * A host who has not been seen for this long is replaced, provided somebody
 * else is looking. Two seconds is the client's poll interval, so a minute of
 * silence is a closed tab rather than a slow network.
 */
export const HOST_IDLE_MS = 60_000;

/**
 * The host's `hostSeenAt` is written only when it is at least this stale.
 * Without it every two-second poll from the host would be a write.
 */
const SEEN_WRITE_INTERVAL_MS = 15_000;

/** Attempts before key generation gives up. ~1.07 billion keys exist. */
const KEY_ATTEMPTS = 5;

/** Idempotency keys are truncated to this length before they are stored. */
const IDEMPOTENCY_KEY_MAX = 128;

// ---------------------------------------------------------------------------
// The stored shape
// ---------------------------------------------------------------------------

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  initial: z.string(),
  color: avatarColor,
  score: z.number().int(),
  isHost: z.boolean(),
  isReady: z.boolean(),
});

const winningLineSchema = z.object({
  kind: z.enum(['row', 'column', 'diagonal']),
  index: z.number().int(),
  cells: z.array(z.number().int()),
});

const roomSchema = z.object({
  key: z.string(),
  gameId: z.enum(GAME_IDS),
  hostId: z.string(),
  phase: z.enum(['lobby', 'playing', 'round-results', 'finished']),
  round: z.number().int(),
  players: z.array(playerSchema),
  settings: roomSettingsSchema,
  bingo: z
    .object({
      selected: z.array(z.number().int()),
      cards: z.record(z.string(), z.array(z.number().int())),
      turnOrder: z.array(z.string()),
      currentTurnIndex: z.number().int(),
      winnerId: z.string().nullable(),
      winningLines: z.array(winningLineSchema),
      turnSecondsRemaining: z.number().nullable(),
      lastPick: z.object({ value: z.number().int(), playerId: z.string() }).nullable(),
    })
    .nullable(),
  lastRound: z
    .array(
      z.object({
        playerId: z.string(),
        name: z.string(),
        initial: z.string(),
        color: avatarColor,
        note: z.string(),
        gain: z.number().int(),
      }),
    )
    .nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
});

const storedSchema = z.object({
  schemaVersion: z.literal(1),
  /** One id per room instance. Events carry it; the key alone is reused. */
  sessionId: z.string(),
  /** Bumped on every change a viewer can see. Drives the ETag and the stream. */
  version: z.number().int(),
  /** The whole room, every board included. Narrowed on the way out. */
  room: roomSchema,
  /** player id -> SHA-256 of their token. The token itself is never stored. */
  tokenHashes: z.record(z.string(), z.string()),
  /** player id -> seat. Seats never repeat, so seat fairness is measurable. */
  seats: z.record(z.string(), z.number().int()),
  nextSeat: z.number().int(),
  /** Epoch ms the host was last seen. See `HOST_IDLE_MS`. */
  hostSeenAt: z.number(),
  /** A fresh id per dealt round, and a sequence that never resets. */
  roundId: z.string().nullable(),
  roundSeq: z.number().int(),
  /** Epoch ms the current turn runs out, or null when nothing is on the clock. */
  turnExpiresAt: z.number().nullable(),
  /** Epoch ms of the last move, for the time a player took to choose. */
  lastMoveAt: z.number().nullable(),
  /** Idempotency keys already applied in this round, scoped to the player. */
  appliedKeys: z.array(z.string()),
});

/** One room as stored. `room` is the full, unscoped `Room`. */
export interface StoredRoom extends Omit<z.infer<typeof storedSchema>, 'room'> {
  room: Room;
}

interface EventSpec {
  type: string;
  playerId?: string;
  payload?: Record<string, unknown>;
}

/** What one transaction decided. `next` is null when nothing changes. */
interface Outcome<T> {
  next: StoredRoom | null;
  events: EventSpec[];
  value: T;
  /** A rule violation to raise AFTER the events commit, e.g. a rejected claim. */
  error?: RoomError;
}

// ---------------------------------------------------------------------------
// Keys, tokens and documents
// ---------------------------------------------------------------------------

function notFound(): RoomError {
  return new RoomError('room-not-found', 'That room no longer exists.');
}

function roomRef(key: string): DocumentReference {
  const normalised = normaliseRoomKey(key);
  if (!isValidRoomKey(normalised)) throw notFound();
  return getFirestore().collection(ROOMS).doc(normalised);
}

/** A fresh player credential: 32 random bytes, base64url, returned once. */
function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** The only form of a token that is ever stored. */
function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function toDocument(stored: StoredRoom): DocumentData {
  return {
    ...stored,
    // The TTL policy reads this field. It has to be a Timestamp, not a string,
    // or Firestore ignores it and the room is never deleted.
    expireAt: Timestamp.fromMillis(Date.parse(stored.room.expiresAt)),
  };
}

/**
 * The stored room behind a snapshot, or `null` when there is no live room.
 *
 * Expiry is applied here, on every read, rather than left to the TTL policy.
 * TTL deletion runs up to a day late; the two-hour promise is kept by this
 * check, and the policy only bounds how long an expired document lingers.
 */
function liveRoom(snapshot: DocumentSnapshot, now: number): StoredRoom | null {
  if (!snapshot.exists) return null;

  const parsed = storedSchema.safeParse(snapshot.data());
  if (!parsed.success) {
    logger.error('A stored room failed validation', parsed.error, { roomKey: snapshot.id });
    throw new Error('A stored room is unreadable.');
  }

  const stored: StoredRoom = parsed.data;
  return isExpired(stored.room, now) ? null : stored;
}

// ---------------------------------------------------------------------------
// Identity and payload
// ---------------------------------------------------------------------------

/**
 * The player a bearer token names, `null` for no token (a spectator).
 *
 * A token that names nobody in this room is an error, not a spectator. It is
 * almost always a stale tab, and silently downgrading it would show that player
 * a board-less room with no explanation.
 */
export function viewerOf(stored: StoredRoom, token: string | null): string | null {
  if (token === null) return null;
  const hash = hashToken(token);
  for (const [playerId, candidate] of Object.entries(stored.tokenHashes)) {
    if (candidate === hash && stored.room.players.some((player) => player.id === playerId)) {
      return playerId;
    }
  }
  throw new RoomError('not-in-room', 'You are no longer in this room.');
}

function requireCaller(stored: StoredRoom, token: string | null): string {
  const caller = viewerOf(stored, token);
  if (caller === null) throw new RoomError('not-in-room', 'You are no longer in this room.');
  return caller;
}

/** Seconds left on the current turn, or null when nothing is on the clock. */
function turnSecondsRemaining(stored: StoredRoom, now: number): number | null {
  const bingo = stored.room.bingo;
  if (stored.turnExpiresAt === null || stored.room.phase !== 'playing') return null;
  if (bingo === null || bingo.winnerId !== null) return null;
  return Math.max(0, Math.ceil((stored.turnExpiresAt - now) / 1000));
}

/**
 * The `Room` one caller may see.
 *
 * Board visibility is enforced here and nowhere else: the caller's own board,
 * plus the winner's once the round is over. `bingo` is null outside a live or
 * just-finished round.
 */
export function roomForViewer(stored: StoredRoom, viewerId: string | null, now: number): Room {
  const scoped = scopeRoomForPlayer(stored.room, viewerId);
  const live = scoped.phase === 'playing' || scoped.phase === 'round-results';
  return {
    ...scoped,
    bingo:
      live && scoped.bingo !== null
        ? { ...scoped.bingo, turnSecondsRemaining: turnSecondsRemaining(stored, now) }
        : null,
  };
}

// ---------------------------------------------------------------------------
// Applying a change
// ---------------------------------------------------------------------------

function turnSignature(room: Room): string {
  return `${room.bingo?.selected.length ?? -1}:${currentTurnPlayerId(room) ?? ''}`;
}

/**
 * Wraps a reducer's result into the next stored room.
 *
 * Three pieces of bookkeeping happen here, so no operation can forget them:
 *   - the version moves on, which invalidates every ETag and wakes streams;
 *   - a freshly dealt round gets a new id and a clean idempotency list;
 *   - the turn clock restarts whenever the turn changes hands, a deal, a pick,
 *     or the player on turn leaving, and stops when nothing is on the clock.
 *     A player who inherits the turn from somebody who left does not inherit
 *     their last two seconds.
 */
function settle(
  previous: StoredRoom,
  room: Room,
  now: number,
  patch: Partial<StoredRoom> = {},
): StoredRoom {
  let next: StoredRoom = { ...previous, ...patch, room, version: previous.version + 1 };

  const dealt = room.phase === 'playing' && previous.room.phase !== 'playing';
  if (dealt) {
    next = {
      ...next,
      roundId: randomUUID(),
      roundSeq: previous.roundSeq + 1,
      appliedKeys: [],
      lastMoveAt: now,
    };
  }

  const onTheClock =
    room.phase === 'playing' && room.bingo !== null && room.bingo.winnerId === null;
  if (!onTheClock) {
    next.turnExpiresAt = null;
  } else if (dealt || turnSignature(previous.room) !== turnSignature(room)) {
    next.turnExpiresAt = now + TURN_MS;
  }

  return next;
}

/** Marks the host as present when the host is the one acting. */
function seen(stored: StoredRoom, callerId: string, now: number): Partial<StoredRoom> {
  return callerId === stored.room.hostId ? { hostSeenAt: now } : {};
}

/**
 * Runs one read-decide-write cycle in a Firestore transaction.
 *
 * The transaction is what makes the rules hold under concurrency. Two players
 * sending "take 17" at the same instant are serialised: the second one's
 * transaction re-reads the room with 17 already taken and is rejected by the
 * engine. The same holds for two bingo claims: exactly one sees no winner.
 *
 * Events are written in the same transaction as the change they describe. An
 * event that can be lost is not an audit log.
 */
async function transact<T>(
  key: string,
  decide: (current: StoredRoom, now: number) => Outcome<T>,
): Promise<{ value: T; stored: StoredRoom }> {
  const db = getFirestore();
  const ref = roomRef(key);

  const settled = await db.runTransaction(async (tx) => {
    const now = Date.now();
    const current = liveRoom(await tx.get(ref), now);
    if (current === null) throw notFound();

    const outcome = decide(current, now);
    const after = outcome.next ?? current;

    if (outcome.next !== null) tx.set(ref, toDocument(outcome.next));
    for (const event of outcome.events) {
      tx.create(db.collection(EVENTS).doc(), eventDocument(after, event, now));
    }

    return { value: outcome.value, stored: after, error: outcome.error };
  });

  if (settled.error !== undefined) throw settled.error;
  return { value: settled.value, stored: settled.stored };
}

/**
 * One audit row. Carries ids and seats, never a nickname or an address, so it
 * keeps nothing against a player once the room itself is deleted.
 */
function eventDocument(stored: StoredRoom, event: EventSpec, now: number): DocumentData {
  return {
    sessionId: stored.sessionId,
    roomKey: stored.room.key,
    gameId: stored.room.gameId,
    roundId: stored.roundId,
    playerId: event.playerId ?? null,
    type: event.type,
    payload: event.payload ?? {},
    occurredAt: Timestamp.fromMillis(now),
  };
}

function seatOf(stored: StoredRoom, playerId: string): number | null {
  return stored.seats[playerId] ?? null;
}

/** The events one selection produces, including the end of an exhausted board. */
function selectionEvents(
  previous: StoredRoom,
  next: StoredRoom,
  playerId: string,
  value: number,
  now: number,
  auto: boolean,
): EventSpec[] {
  const numbersTaken = next.room.bingo?.selected.length ?? 0;
  const events: EventSpec[] = [
    {
      type: 'number_selected',
      playerId,
      payload: {
        number: value,
        seq: numbersTaken,
        // Seat is what makes turn-order fairness measurable.
        seat: seatOf(previous, playerId),
        thinkingMs: previous.lastMoveAt === null ? null : now - previous.lastMoveAt,
        ...(auto ? { auto: true } : {}),
      },
    },
  ];

  if (next.room.phase === 'round-results' && isBoardExhausted(next.room)) {
    events.push(
      { type: 'board_exhausted', playerId, payload: { numbersTaken } },
      {
        type: 'round_won',
        playerId,
        payload: { lines: null, numbersTaken, reason: 'board_exhausted' },
      },
    );
  }
  return events;
}

// ---------------------------------------------------------------------------
// Maintenance a read drives: the turn clock and host promotion
// ---------------------------------------------------------------------------

function turnIsDue(stored: StoredRoom, now: number): boolean {
  return (
    stored.room.phase === 'playing' &&
    stored.room.bingo !== null &&
    stored.room.bingo.winnerId === null &&
    stored.turnExpiresAt !== null &&
    stored.turnExpiresAt <= now
  );
}

/**
 * Takes a number for a player whose time ran out.
 *
 * It is a real move: the same reducer, the same turn advance, the same
 * end-of-round rule. Only the chooser differs, and the events record that, so
 * a timed-out turn is never mistaken for a played one.
 */
function playTimedOutTurn(
  current: StoredRoom,
  now: number,
): { next: StoredRoom; events: EventSpec[] } | null {
  const onTurn = currentTurnPlayerId(current.room);
  const free = availableNumbers(current.room.bingo?.selected ?? []);
  if (onTurn === null || free.length === 0) return null;

  const value = free[randomInt(free.length)];
  if (value === undefined) return null;

  const next = settle(current, selectNumber(current.room, onTurn, value, now), now, {
    lastMoveAt: now,
  });
  return {
    next,
    events: [
      ...selectionEvents(current, next, onTurn, value, now, true),
      { type: 'turn_timed_out', playerId: onTurn, payload: { seat: seatOf(current, onTurn) } },
    ],
  };
}

function hostIsIdle(stored: StoredRoom, viewerId: string | null, now: number): boolean {
  return (
    viewerId !== null && viewerId !== stored.room.hostId && now - stored.hostSeenAt > HOST_IDLE_MS
  );
}

/**
 * Hands the host role to the player who noticed the host had gone.
 *
 * Only the host can start or advance a round, so a lobby whose host closed the
 * tab would never begin. The new host is the viewer whose read found the host
 * idle: that player is provably present, which is the one property a host
 * needs. Choosing by seat instead could hand the room to somebody who left too.
 */
function promote(current: StoredRoom, successorId: string, now: number): StoredRoom {
  const room: Room = {
    ...current.room,
    hostId: successorId,
    players: current.room.players.map((player) => ({
      ...player,
      isHost: player.id === successorId,
    })),
    expiresAt: new Date(now + ROOM_TTL_MS).toISOString(),
  };
  return settle(current, room, now, { hostSeenAt: now });
}

function maintain(current: StoredRoom, token: string | null, now: number): Outcome<null> {
  const viewerId = viewerOf(current, token);
  let next: StoredRoom | null = null;
  const events: EventSpec[] = [];

  if (turnIsDue(current, now)) {
    const played = playTimedOutTurn(current, now);
    if (played !== null) {
      next = played.next;
      events.push(...played.events);
    }
  }

  const base = next ?? current;
  if (viewerId !== null && hostIsIdle(base, viewerId, now)) {
    next = promote(base, viewerId, now);
    events.push({
      type: 'host_promoted',
      playerId: viewerId,
      payload: { reason: 'host_idle', seat: seatOf(base, viewerId) },
    });
  } else if (
    viewerId !== null &&
    viewerId === base.room.hostId &&
    now - base.hostSeenAt > SEEN_WRITE_INTERVAL_MS
  ) {
    // No version bump: nothing a viewer sees has changed, so every cached
    // room stays valid.
    next = { ...base, hostSeenAt: now };
  }

  return { next, events, value: null };
}

function maintenanceDue(stored: StoredRoom, viewerId: string | null, now: number): boolean {
  return (
    turnIsDue(stored, now) ||
    hostIsIdle(stored, viewerId, now) ||
    (viewerId !== null &&
      viewerId === stored.room.hostId &&
      now - stored.hostSeenAt > SEEN_WRITE_INTERVAL_MS)
  );
}

// ---------------------------------------------------------------------------
// Public operations. Each returns the room scoped to its caller.
// ---------------------------------------------------------------------------

/** Opens a room and mints the host's identity. */
export async function createRoom(body: CreateRoomBody): Promise<JoinedRoom> {
  const game = findGame(body.gameId);
  if (game === undefined || game.status !== 'playable') {
    throw new RoomError('wrong-phase', 'That game is not playable yet.');
  }
  const { maxPlayers } = body.settings;
  if (maxPlayers < game.minPlayers || maxPlayers > game.maxPlayers) {
    throw new RoomError(
      'room-full',
      `${game.name} takes ${game.minPlayers} to ${game.maxPlayers} players.`,
    );
  }

  const db = getFirestore();
  const token = newToken();
  const hostId = randomUUID();

  // Try a key, and retry on a live collision. The transaction's read of the
  // key document is the uniqueness check: two creates racing for one key are
  // serialised, and the second sees the first one's room.
  for (let attempt = 0; attempt < KEY_ATTEMPTS; attempt += 1) {
    const key = createRoomKey();
    const ref = roomRef(key);

    const created = await db.runTransaction(async (tx) => {
      const now = Date.now();
      if (liveRoom(await tx.get(ref), now) !== null) return null;

      const stored: StoredRoom = {
        schemaVersion: 1,
        sessionId: randomUUID(),
        version: 1,
        room: createRoomState(
          {
            gameId: body.gameId,
            settings: body.settings,
            hostName: body.hostName,
            hostColor: body.hostColor,
          },
          key,
          hostId,
          now,
        ),
        tokenHashes: { [hostId]: hashToken(token) },
        seats: { [hostId]: 1 },
        nextSeat: 2,
        hostSeenAt: now,
        roundId: null,
        roundSeq: 0,
        turnExpiresAt: null,
        lastMoveAt: null,
        appliedKeys: [],
      };

      tx.set(ref, toDocument(stored));
      for (const event of [
        {
          type: 'room_created',
          playerId: hostId,
          payload: { maxPlayers, rounds: body.settings.rounds },
        },
        { type: 'player_joined', playerId: hostId, payload: { seat: 1 } },
      ]) {
        tx.create(db.collection(EVENTS).doc(), eventDocument(stored, event, now));
      }
      return { stored, now };
    });

    if (created !== null) {
      return {
        room: roomForViewer(created.stored, hostId, created.now),
        playerId: hostId,
        playerToken: token,
      };
    }
  }

  logger.error('Could not allocate a free room key', undefined, { attempts: KEY_ATTEMPTS });
  throw new RoomError('room-not-found', 'Could not open a room just now. Try again.');
}

/** Joins a room by key and mints that player's identity. */
export async function joinRoom(key: string, body: JoinRoomBody): Promise<JoinedRoom> {
  const token = newToken();
  const playerId = randomUUID();

  const { stored } = await transact(key, (current, now) => {
    const room = joinRoomState(
      current.room,
      { key: current.room.key, name: body.name, color: body.color },
      playerId,
      undefined,
      now,
    );
    const seat = current.nextSeat;
    return {
      next: settle(current, room, now, {
        tokenHashes: { ...current.tokenHashes, [playerId]: hashToken(token) },
        seats: { ...current.seats, [playerId]: seat },
        nextSeat: seat + 1,
      }),
      events: [{ type: 'player_joined', playerId, payload: { seat } }],
      value: null,
    };
  });

  return { room: roomForViewer(stored, playerId, Date.now()), playerId, playerToken: token };
}

export type RoomRead =
  | { kind: 'room'; room: Room; version: number; viewerId: string | null }
  | { kind: 'not-modified'; version: number; viewerId: string | null };

/**
 * Reads a room, scoped to the caller, and settles anything the read is due.
 *
 * The read drives two clocks, because nothing else can. A player who has
 * closed their tab cannot time their own turn out, and a host who has gone
 * cannot hand over the room. Everybody in a room reads it every two seconds,
 * so whoever is still looking settles both.
 *
 * The common case costs one document read and no write.
 *
 * @param isCurrent tells the caller's validator apart from a stale one, so an
 *   unchanged room answers `304` without being serialised.
 */
export async function readRoom(
  key: string,
  token: string | null,
  isCurrent: (version: number, viewerId: string | null) => boolean = () => false,
): Promise<RoomRead> {
  const now = Date.now();
  let stored = liveRoom(await roomRef(key).get(), now);
  if (stored === null) throw notFound();

  let viewerId = viewerOf(stored, token);
  if (maintenanceDue(stored, viewerId, now)) {
    stored = (await transact(key, (current, at) => maintain(current, token, at))).stored;
    viewerId = viewerOf(stored, token);
  }

  if (isCurrent(stored.version, viewerId)) {
    return { kind: 'not-modified', version: stored.version, viewerId };
  }
  return {
    kind: 'room',
    room: roomForViewer(stored, viewerId, Date.now()),
    version: stored.version,
    viewerId,
  };
}

/** Applies a host or player operation that is a single reducer call. */
async function operate(
  key: string,
  token: string | null,
  run: (current: StoredRoom, callerId: string, now: number) => Outcome<null>,
): Promise<Room> {
  let callerId = '';
  const { stored } = await transact(key, (current, now) => {
    callerId = requireCaller(current, token);
    return run(current, callerId, now);
  });
  return roomForViewer(stored, callerId, Date.now());
}

/** Deals a board to every player and starts the round. Host only. */
export function startRound(key: string, token: string | null): Promise<Room> {
  return operate(key, token, (current, callerId, now) => {
    const room = startRoundState(current.room, callerId, undefined, now);
    return {
      next: settle(current, room, now, seen(current, callerId, now)),
      events: [
        {
          type: 'round_started',
          playerId: callerId,
          payload: { players: room.players.length, round: room.round },
        },
      ],
      value: null,
    };
  });
}

/** Deals the next round, or ends the session at the configured count. */
export function advanceRound(key: string, token: string | null): Promise<Room> {
  return operate(key, token, (current, callerId, now) => {
    const room = nextRound(current.room, callerId, undefined, now);
    const events: EventSpec[] =
      room.phase === 'finished'
        ? [{ type: 'session_ended', playerId: callerId, payload: { reason: 'rounds_complete' } }]
        : [
            {
              type: 'round_started',
              playerId: callerId,
              payload: { players: room.players.length, round: room.round },
            },
            { type: 'round_advanced', playerId: callerId, payload: { round: room.round } },
          ];
    return { next: settle(current, room, now, seen(current, callerId, now)), events, value: null };
  });
}

/** Closes the room to new players. Host only. */
export function lock(key: string, token: string | null): Promise<Room> {
  return operate(key, token, (current, callerId, now) => ({
    next: settle(current, lockRoom(current.room, callerId, now), now, seen(current, callerId, now)),
    events: [{ type: 'room_locked', playerId: callerId }],
    value: null,
  }));
}

/** Ends the session for everyone and shows the final scoreboard. Host only. */
export function end(key: string, token: string | null): Promise<Room> {
  return operate(key, token, (current, callerId, now) => ({
    next: settle(
      current,
      endSession(current.room, callerId, now),
      now,
      seen(current, callerId, now),
    ),
    events: [{ type: 'session_ended', playerId: callerId, payload: { reason: 'host_ended' } }],
    value: null,
  }));
}

/** Starts over in the same room, keeping the players and zeroing scores. */
export function replay(key: string, token: string | null): Promise<Room> {
  return operate(key, token, (current, callerId, now) => ({
    next: settle(
      current,
      replaySession(current.room, callerId, now),
      now,
      seen(current, callerId, now),
    ),
    events: [{ type: 'session_replayed', playerId: callerId }],
    value: null,
  }));
}

/** The host removes somebody, or a player removes themselves. */
export function removePlayer(key: string, token: string | null, targetId: string): Promise<Room> {
  return operate(key, token, (current, callerId, now) => {
    const room = removePlayerState(current.room, callerId, targetId, now);
    const tokenHashes = { ...current.tokenHashes };
    delete tokenHashes[targetId];
    return {
      next: settle(current, room, now, { ...seen(current, callerId, now), tokenHashes }),
      events: [
        {
          type: callerId === targetId ? 'player_left' : 'player_removed',
          playerId: targetId,
          payload: { seat: seatOf(current, targetId) },
        },
      ],
      value: null,
    };
  });
}

/**
 * Applies one in-game move from the action envelope.
 *
 * An `Idempotency-Key` makes a network retry safe. The key is scoped to the
 * caller before it is stored, so it can never be replayed by somebody else, and
 * a replay answers with the current room rather than applying the move twice.
 * Without it, a retried "take 17" returns `number-taken` and looks like a bug.
 *
 * The turn clock is deliberately NOT enforced here. A tap sent at nineteen
 * seconds that arrives at twenty-one is a player who did take their turn.
 */
export function applyAction(
  key: string,
  token: string | null,
  action: ActionBody,
  idempotencyKey: string | null,
): Promise<Room> {
  return operate(key, token, (current, callerId, now) => {
    // A move after the round was decided is `round-over`, not `wrong-phase`:
    // "someone already called bingo" rather than "no round is in progress".
    if (current.room.phase === 'round-results') {
      throw new RoomError('round-over', 'This round is already over.');
    }
    if (current.room.phase !== 'playing' || current.room.bingo === null) {
      throw new RoomError('wrong-phase', 'No round is in progress.');
    }

    const scopedKey =
      idempotencyKey === null
        ? null
        : `${callerId}:${idempotencyKey}`.slice(0, IDEMPOTENCY_KEY_MAX);
    if (scopedKey !== null && current.appliedKeys.includes(scopedKey)) {
      return { next: null, events: [], value: null };
    }
    const appliedKeys =
      scopedKey === null ? current.appliedKeys : [...current.appliedKeys, scopedKey];

    if (action.type === 'select_number') {
      const value = action.payload['value'];
      if (typeof value !== 'number' || !isPlayableNumber(value)) {
        throw new RoomError('invalid-number', 'Pick a number between 1 and 25.');
      }
      const next = settle(current, selectNumber(current.room, callerId, value, now), now, {
        ...seen(current, callerId, now),
        lastMoveAt: now,
        appliedKeys,
      });
      return {
        next,
        events: selectionEvents(current, next, callerId, value, now, false),
        value: null,
      };
    }

    if (action.type === 'claim_bingo') {
      let room: Room;
      try {
        room = claimBingo(current.room, callerId, now);
      } catch (error) {
        if (!(error instanceof RoomError) || error.code !== 'invalid-claim') throw error;
        // A rejected claim leaves the round running, but it still happened.
        // A rejection at four lines is a player who misread the rule; at one,
        // a player who did not know there was one.
        const held = findWinningLines(
          current.room.bingo.cards[callerId] ?? [],
          current.room.bingo.selected,
        ).length;
        return {
          next: null,
          events: [{ type: 'bingo_rejected', playerId: callerId, payload: { lines: held } }],
          value: null,
          error,
        };
      }

      const lines = room.bingo?.winningLines.length ?? 0;
      const numbersTaken = room.bingo?.selected.length ?? 0;
      return {
        next: settle(current, room, now, { ...seen(current, callerId, now), appliedKeys }),
        events: [
          { type: 'bingo_claimed', playerId: callerId, payload: { lines } },
          { type: 'round_won', playerId: callerId, payload: { lines, numbersTaken } },
        ],
        value: null,
      };
    }

    throw new RoomError('wrong-phase', 'That move does not exist in this game.');
  });
}

// ---------------------------------------------------------------------------
// Live updates
// ---------------------------------------------------------------------------

export interface RoomWatcher {
  room(room: Room): void;
  /** The stream should end: the room is gone, or the caller is not in it. */
  closed(error: RoomError): void;
  failed(error: unknown): void;
}

/**
 * Pushes the room to one viewer on every change, across every instance.
 *
 * A Firestore snapshot listener fires wherever the change was written, so a
 * move made on one Cloud Run instance reaches a stream held open by another.
 * No broker and no pub/sub is needed, and the client's two-second poll stays
 * as the fallback for a stream that drops.
 *
 * Each viewer re-scopes the room for itself. Two viewers of one room must
 * never receive the same boards.
 */
export function watchRoom(key: string, token: string | null, watcher: RoomWatcher): () => void {
  let ref: DocumentReference;
  try {
    ref = roomRef(key);
  } catch (error) {
    watcher.closed(error instanceof RoomError ? error : notFound());
    return () => undefined;
  }

  let lastVersion = -1;
  return ref.onSnapshot(
    (snapshot) => {
      try {
        const now = Date.now();
        const stored = liveRoom(snapshot, now);
        if (stored === null) {
          watcher.closed(notFound());
          return;
        }
        // A host-presence write changes nothing a viewer sees. Skip it.
        if (stored.version === lastVersion) return;
        lastVersion = stored.version;
        watcher.room(roomForViewer(stored, viewerOf(stored, token), now));
      } catch (error) {
        if (error instanceof RoomError) watcher.closed(error);
        else watcher.failed(error);
      }
    },
    (error) => watcher.failed(error),
  );
}
