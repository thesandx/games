/**
 * Room state machine — pure reducers over a `Room`.
 *
 * Every rule of a session lives here: whose turn it is, which numbers are
 * still free, when a bingo claim is good, how points are awarded. Nothing in
 * this file performs I/O, which is what lets the same code run in the browser
 * store today and behind the HTTP API later.
 *
 * These functions are the authority, not the UI. A client that sends a
 * selection out of turn, a number someone already took, or a bingo claim on an
 * incomplete board is rejected here — the screens only decide what to *offer*.
 *
 * Each function returns a NEW room and never mutates its argument, so a
 * transport can keep the previous value for optimistic-update rollback.
 */

import {
  createCard,
  findWinningLines,
  isPlayableNumber,
  LINES_TO_WIN,
  type RandomInt,
} from '@/lib/bingo';
import { initialOf } from '@/lib/players';
import type {
  BingoCard,
  CreateRoomInput,
  JoinRoomInput,
  Player,
  Room,
  RoundResultRow,
} from '@/types/playroom';

/** Rooms stay open for two hours after the last round, per the design's copy. */
export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

/** Points for taking the round, and for each line a non-winner completed. */
const WIN_POINTS = 100;
const LINE_POINTS = 10;

export type RoomErrorCode =
  | 'room-not-found'
  | 'room-full'
  | 'room-locked'
  | 'not-host'
  | 'not-in-room'
  | 'wrong-phase'
  | 'name-taken'
  | 'not-your-turn'
  | 'number-taken'
  | 'invalid-number'
  | 'invalid-claim'
  | 'round-over';

/** A rule violation the UI is expected to show, not a crash. */
export class RoomError extends Error {
  readonly code: RoomErrorCode;

  constructor(code: RoomErrorCode, message: string) {
    super(message);
    this.name = 'RoomError';
    this.code = code;
  }
}

function requirePlayer(room: Room, playerId: string): Player {
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new RoomError('not-in-room', 'You are no longer in this room.');
  return player;
}

function requireHost(room: Room, playerId: string): void {
  if (room.hostId !== playerId) {
    throw new RoomError('not-host', 'Only the host can do that.');
  }
}

function withExpiry(room: Room, now: number): Room {
  return { ...room, expiresAt: new Date(now + ROOM_TTL_MS).toISOString() };
}

/** The id of the player whose turn it is, or `null` outside a live round. */
export function currentTurnPlayerId(room: Room): string | null {
  const bingo = room.bingo;
  if (!bingo || room.phase !== 'playing') return null;
  return bingo.turnOrder[bingo.currentTurnIndex] ?? null;
}

/** Opens a new room. The caller supplies the key and host id. */
export function createRoom(
  input: CreateRoomInput,
  key: string,
  hostId: string,
  now: number = Date.now(),
): Room {
  const host: Player = {
    id: hostId,
    name: input.hostName.trim(),
    initial: initialOf(input.hostName),
    color: input.hostColor,
    score: 0,
    isHost: true,
    isReady: true,
  };

  return {
    key,
    gameId: input.gameId,
    hostId,
    phase: 'lobby',
    round: 1,
    players: [host],
    settings: input.settings,
    bingo: null,
    lastRound: null,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ROOM_TTL_MS).toISOString(),
  };
}

/**
 * Adds a player to a room.
 *
 * Joining mid-round is allowed while the room is unlocked, so the new player is
 * dealt a board and appended to the turn order rather than left without one.
 * They are added AFTER the current position, so the running turn is unaffected.
 */
export function joinRoom(
  room: Room,
  input: JoinRoomInput,
  playerId: string,
  random?: RandomInt,
  now: number = Date.now(),
): Room {
  if (room.players.length >= room.settings.maxPlayers) {
    throw new RoomError('room-full', 'This room is full.');
  }
  if (room.settings.privacy === 'Locked after start' && room.phase !== 'lobby') {
    throw new RoomError('room-locked', 'The host locked this room after the game started.');
  }
  if (room.phase === 'finished') {
    throw new RoomError('wrong-phase', 'This session has already finished.');
  }

  const name = input.name.trim();
  const taken = room.players.some((player) => player.name.toLowerCase() === name.toLowerCase());
  if (taken) throw new RoomError('name-taken', 'Someone in this room already uses that nickname.');

  const player: Player = {
    id: playerId,
    name,
    initial: initialOf(name),
    color: input.color,
    score: 0,
    isHost: false,
    isReady: true,
  };

  const players = [...room.players, player];
  const bingo = room.bingo;
  if (!bingo || room.phase !== 'playing') {
    return withExpiry({ ...room, players }, now);
  }

  return withExpiry(
    {
      ...room,
      players,
      bingo: {
        ...bingo,
        cards: { ...bingo.cards, [playerId]: createCard(random) },
        turnOrder: [...bingo.turnOrder, playerId],
      },
    },
    now,
  );
}

/**
 * Deals a fresh board to every player and starts the round.
 *
 * Turn order is fixed here, in join order, and does not change for the rest of
 * the round except when a player leaves.
 */
export function startRound(
  room: Room,
  playerId: string,
  random?: RandomInt,
  now: number = Date.now(),
): Room {
  requireHost(room, playerId);
  if (room.phase === 'playing') throw new RoomError('wrong-phase', 'The round already started.');

  const cards: Record<string, BingoCard> = {};
  for (const player of room.players) {
    cards[player.id] = createCard(random);
  }

  return withExpiry(
    {
      ...room,
      phase: 'playing',
      lastRound: null,
      bingo: {
        selected: [],
        cards,
        turnOrder: room.players.map((player) => player.id),
        currentTurnIndex: 0,
        winnerId: null,
        winningLines: [],
      },
    },
    now,
  );
}

/**
 * Takes a number on the caller's turn and passes play to the next player.
 *
 * The four checks below are the whole of turn safety, and all four run here
 * rather than in the UI. Two players cannot take the same number because the
 * reducer is applied to one room value at a time: whichever call is applied
 * second sees the first one's number already in `selected` and is rejected.
 */
export function selectNumber(
  room: Room,
  playerId: string,
  value: number,
  now: number = Date.now(),
): Room {
  requirePlayer(room, playerId);
  if (room.phase !== 'playing') throw new RoomError('wrong-phase', 'No round is in progress.');

  const bingo = room.bingo;
  if (!bingo) throw new RoomError('wrong-phase', 'No round is in progress.');
  if (bingo.winnerId !== null) throw new RoomError('round-over', 'This round is already over.');

  if (currentTurnPlayerId(room) !== playerId) {
    throw new RoomError('not-your-turn', 'It is not your turn yet.');
  }
  if (!isPlayableNumber(value)) {
    throw new RoomError('invalid-number', 'Pick a number between 1 and 25.');
  }
  if (bingo.selected.includes(value)) {
    throw new RoomError('number-taken', `${value} has already been taken.`);
  }

  const turnCount = bingo.turnOrder.length;
  return withExpiry(
    {
      ...room,
      bingo: {
        ...bingo,
        selected: [...bingo.selected, value],
        currentTurnIndex: turnCount === 0 ? 0 : (bingo.currentTurnIndex + 1) % turnCount,
      },
    },
    now,
  );
}

/**
 * Claims bingo.
 *
 * The claim is checked against the board and the globally selected numbers, so
 * a client cannot win by asserting which of its cells are marked — marking is
 * derived, never sent.
 *
 * Near-simultaneous calls are safe because the first valid claim sets
 * `winnerId`, and any claim applied after that is refused as `round-over`. The
 * reducer runs against one room value at a time, so exactly one call can be the
 * first to see `winnerId === null`.
 */
export function claimBingo(room: Room, playerId: string, now: number = Date.now()): Room {
  requirePlayer(room, playerId);
  if (room.phase !== 'playing') throw new RoomError('wrong-phase', 'No round is in progress.');

  const bingo = room.bingo;
  if (!bingo) throw new RoomError('wrong-phase', 'No round is in progress.');
  if (bingo.winnerId !== null) {
    throw new RoomError('round-over', 'Someone already called bingo on this round.');
  }

  const card = bingo.cards[playerId];
  if (!card) throw new RoomError('not-in-room', 'You have no board for this round.');

  // Five lines, not one. Lines may share cells, so a single number can finish
  // two at once — the count is what matters, not which ones.
  const lines = findWinningLines(card, bingo.selected);
  if (lines.length < LINES_TO_WIN) {
    const short = LINES_TO_WIN - lines.length;
    throw new RoomError(
      'invalid-claim',
      `You need ${LINES_TO_WIN} complete lines to call bingo. You have ${lines.length} — ${short} to go.`,
    );
  }

  const rows: RoundResultRow[] = room.players.map((player) => {
    if (player.id === playerId) {
      return {
        playerId: player.id,
        name: player.name,
        initial: player.initial,
        color: player.color,
        note: 'Bingo',
        gain: WIN_POINTS,
      };
    }

    const lines = findWinningLines(bingo.cards[player.id] ?? [], bingo.selected).length;
    return {
      playerId: player.id,
      name: player.name,
      initial: player.initial,
      color: player.color,
      note: lines === 0 ? 'No line' : lines === 1 ? 'One line' : `${lines} lines`,
      gain: lines * LINE_POINTS,
    };
  });

  const gains = new Map(rows.map((row) => [row.playerId, row.gain]));
  const players = room.players.map((player) => ({
    ...player,
    score: player.score + (gains.get(player.id) ?? 0),
  }));

  return withExpiry(
    {
      ...room,
      phase: 'round-results',
      players,
      bingo: { ...bingo, winnerId: playerId, winningLines: lines },
      lastRound: [...rows].sort((a, b) => b.gain - a.gain),
    },
    now,
  );
}

/**
 * Advances past the results screen: deals the next round, or ends the session
 * when the configured round count is reached.
 */
export function nextRound(
  room: Room,
  playerId: string,
  random?: RandomInt,
  now: number = Date.now(),
): Room {
  requireHost(room, playerId);
  if (room.phase !== 'round-results') {
    throw new RoomError('wrong-phase', 'The round is not finished.');
  }

  if (room.round >= room.settings.rounds) {
    return withExpiry({ ...room, phase: 'finished' }, now);
  }

  const advanced: Room = { ...room, round: room.round + 1, phase: 'lobby' };
  return startRound(advanced, playerId, random, now);
}

/** Ends the session for everyone and shows the final scoreboard. */
export function endSession(room: Room, playerId: string, now: number = Date.now()): Room {
  requireHost(room, playerId);
  return withExpiry({ ...room, phase: 'finished' }, now);
}

/** Host closes the room to new keys mid-session. */
export function lockRoom(room: Room, playerId: string, now: number = Date.now()): Room {
  requireHost(room, playerId);
  return withExpiry(
    { ...room, settings: { ...room.settings, privacy: 'Locked after start' } },
    now,
  );
}

/**
 * Host removes a player.
 *
 * Mid-round this also takes them out of the turn order. The current index is
 * rebased so play continues with the same player it was waiting on, rather than
 * silently skipping whoever followed the departing player.
 */
export function removePlayer(
  room: Room,
  playerId: string,
  targetPlayerId: string,
  now: number = Date.now(),
): Room {
  requireHost(room, playerId);
  if (targetPlayerId === room.hostId) {
    throw new RoomError('not-host', 'The host cannot be removed.');
  }

  const players = room.players.filter((player) => player.id !== targetPlayerId);
  const bingo = room.bingo;
  if (!bingo) return withExpiry({ ...room, players }, now);

  const activeId = currentTurnPlayerId(room);
  const turnOrder = bingo.turnOrder.filter((id) => id !== targetPlayerId);
  const cards = { ...bingo.cards };
  delete cards[targetPlayerId];

  // Keep pointing at the player whose turn it was. If they are the one being
  // removed, the slot they vacated is now the next player along.
  const nextIndex =
    activeId === null || activeId === targetPlayerId
      ? bingo.currentTurnIndex % Math.max(turnOrder.length, 1)
      : turnOrder.indexOf(activeId);

  return withExpiry(
    {
      ...room,
      players,
      bingo: {
        ...bingo,
        cards,
        turnOrder,
        currentTurnIndex: nextIndex < 0 ? 0 : nextIndex,
      },
    },
    now,
  );
}

/** True once the room has passed its two-hour window. */
export function isExpired(room: Room, now: number = Date.now()): boolean {
  return new Date(room.expiresAt).getTime() < now;
}

/** Starts the session over in the same room, keeping the players. */
export function replaySession(room: Room, playerId: string, now: number = Date.now()): Room {
  requireHost(room, playerId);
  return withExpiry(
    {
      ...room,
      phase: 'lobby',
      round: 1,
      bingo: null,
      lastRound: null,
      players: room.players.map((player) => ({ ...player, score: 0 })),
    },
    now,
  );
}
