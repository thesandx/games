import { describe, expect, it } from 'vitest';

import { CARD_SIZE, findWinningLines, LINES_TO_WIN } from '@/lib/bingo';
import {
  claimBingo,
  createRoom,
  currentTurnPlayerId,
  endSession,
  isExpired,
  joinRoom,
  lockRoom,
  nextRound,
  removePlayer,
  replaySession,
  ROOM_TTL_MS,
  RoomError,
  scopeRoomForPlayer,
  selectNumber,
  startRound,
} from '@/lib/room-engine';
import type { CreateRoomInput, Room, RoomSettings } from '@/types/playroom';

const SETTINGS: RoomSettings = { rounds: 2, privacy: 'Key only', maxPlayers: 3 };

const INPUT: CreateRoomInput = {
  gameId: 'bingo',
  settings: SETTINGS,
  hostName: 'Rhea',
  hostColor: 'peach',
};

function newRoom(overrides: Partial<RoomSettings> = {}): Room {
  return createRoom({ ...INPUT, settings: { ...SETTINGS, ...overrides } }, 'PLZ4K9', 'host-1');
}

/** A solo room already in play — every turn belongs to the host. */
function soloInPlay(): Room {
  return startRound(newRoom(), 'host-1');
}

/** The numbers sitting at these cell indices on a player's board. */
function numbersAt(room: Room, playerId: string, cells: readonly number[]): number[] {
  const card = room.bingo?.cards[playerId] ?? [];
  return cells.map((cell) => card[cell] as number);
}

/** The host's top row — one line, which is deliberately not a win. */
function topRowNumbers(room: Room, playerId: string): number[] {
  return numbersAt(room, playerId, [0, 1, 2, 3, 4]);
}

/**
 * Cell groups that build up lines one at a time on any board.
 * Rows 1-3 give three lines; each diagonal then needs two more cells.
 */
const CELLS_3_LINES = Array.from({ length: 15 }, (_, index) => index);
const CELLS_4_LINES = [...CELLS_3_LINES, 18, 24];
const CELLS_5_LINES = [...CELLS_4_LINES, 16, 20];

/** Plays a solo room until `values` have all been taken. */
function takeAll(room: Room, playerId: string, values: readonly number[]): Room {
  return values.reduce((current, value) => selectNumber(current, playerId, value), room);
}

/** Takes exactly the numbers that put `playerId` on five completed lines. */
function playToBingo(room: Room, playerId: string): Room {
  return takeAll(room, playerId, numbersAt(room, playerId, CELLS_5_LINES));
}

/**
 * Plays the values through, each taken by whoever is on turn.
 *
 * Marking is global, so it does not matter who takes a number — it lands on
 * every board. That is what lets one player's winning line be completed by
 * picks the whole table made.
 */
function takeInTurn(room: Room, values: readonly number[]): Room {
  return values.reduce((current, value) => {
    const turnId = currentTurnPlayerId(current);
    return turnId === null ? current : selectNumber(current, turnId, value);
  }, room);
}

describe('startRound', () => {
  it('deals every player a full 1-25 board', () => {
    const joined = joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2');
    const room = startRound(joined, 'host-1');

    for (const id of ['host-1', 'p2']) {
      const card = room.bingo?.cards[id] ?? [];
      expect(card).toHaveLength(CARD_SIZE);
      expect([...card].sort((a, b) => a - b)).toEqual(
        Array.from({ length: CARD_SIZE }, (_, index) => index + 1),
      );
    }
  });

  it('gives each player a different arrangement', () => {
    const joined = joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2');
    const room = startRound(joined, 'host-1');
    expect(room.bingo?.cards['host-1']).not.toEqual(room.bingo?.cards['p2']);
  });

  it('starts with nothing taken and the first player on turn', () => {
    const room = soloInPlay();
    expect(room.phase).toBe('playing');
    expect(room.bingo?.selected).toEqual([]);
    expect(room.bingo?.turnOrder).toEqual(['host-1']);
    expect(currentTurnPlayerId(room)).toBe('host-1');
  });

  it('is host-only', () => {
    const joined = joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2');
    expect(() => startRound(joined, 'p2')).toThrow(/host/i);
  });
});

describe('selectNumber', () => {
  function duo(): Room {
    return startRound(
      joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2'),
      'host-1',
    );
  }

  it('takes the number globally and passes the turn on', () => {
    const room = selectNumber(duo(), 'host-1', 17);
    expect(room.bingo?.selected).toEqual([17]);
    expect(currentTurnPlayerId(room)).toBe('p2');
  });

  it('refuses a player who is not on turn', () => {
    expect(() => selectNumber(duo(), 'p2', 17)).toThrow(RoomError);
    expect(() => selectNumber(duo(), 'p2', 17)).toThrow(/not your turn/i);
  });

  it('refuses a number somebody already took', () => {
    const room = selectNumber(duo(), 'host-1', 17);
    expect(() => selectNumber(room, 'p2', 17)).toThrow(/already been taken/i);
  });

  it('never lets two players take the same number', () => {
    // Both calls are applied to the SAME room value, as two racing clients
    // would be. The engine applies one at a time, so the loser is rejected.
    const room = duo();
    const first = selectNumber(room, 'host-1', 9);
    expect(first.bingo?.selected).toEqual([9]);
    expect(() => selectNumber(first, 'p2', 9)).toThrow(/already been taken/i);
  });

  it('refuses a number outside 1 to 25', () => {
    expect(() => selectNumber(duo(), 'host-1', 0)).toThrow(/between 1 and 25/i);
    expect(() => selectNumber(duo(), 'host-1', 26)).toThrow(/between 1 and 25/i);
    expect(() => selectNumber(duo(), 'host-1', 4.2)).toThrow(/between 1 and 25/i);
  });

  it('wraps the turn back to the first player', () => {
    let room = duo();
    room = selectNumber(room, 'host-1', 1);
    room = selectNumber(room, 'p2', 2);
    expect(currentTurnPlayerId(room)).toBe('host-1');
  });

  it('refuses when no round is running', () => {
    expect(() => selectNumber(newRoom(), 'host-1', 5)).toThrow(/no round/i);
  });

  it('refuses somebody who is not in the room', () => {
    expect(() => selectNumber(duo(), 'stranger', 5)).toThrow(/no longer in this room/i);
  });
});

describe('claimBingo', () => {
  it('refuses a claim with no complete line', () => {
    const room = selectNumber(soloInPlay(), 'host-1', 1);
    expect(() => claimBingo(room, 'host-1')).toThrow(/need 5 complete lines/i);
  });

  it('refuses a single completed line — one line is not a bingo', () => {
    const started = soloInPlay();
    const room = takeAll(started, 'host-1', topRowNumbers(started, 'host-1'));
    expect(
      findWinningLines(room.bingo?.cards['host-1'] ?? [], room.bingo?.selected ?? []),
    ).toHaveLength(1);
    expect(() => claimBingo(room, 'host-1')).toThrow(/you have 1/i);
  });

  it('refuses at four lines and says how many are left', () => {
    const started = soloInPlay();
    const room = takeAll(started, 'host-1', numbersAt(started, 'host-1', CELLS_4_LINES));
    expect(() => claimBingo(room, 'host-1')).toThrow(/you have 4 — 1 to go/i);
  });

  it('accepts five completed lines and ends the round', () => {
    const room = claimBingo(playToBingo(soloInPlay(), 'host-1'), 'host-1');

    expect(room.phase).toBe('round-results');
    expect(room.bingo?.winnerId).toBe('host-1');
    expect(room.bingo?.winningLines.length).toBeGreaterThanOrEqual(LINES_TO_WIN);
    expect(room.players.find((player) => player.id === 'host-1')?.score).toBe(100);
  });

  it('accepts a board that jumped past five in one pick', () => {
    // A full board holds all twelve lines. More than five must still win.
    const started = soloInPlay();
    const everything = started.bingo?.cards['host-1'] ?? [];
    const room = claimBingo(takeAll(started, 'host-1', everything), 'host-1');
    expect(room.bingo?.winningLines).toHaveLength(12);
    expect(room.bingo?.winnerId).toBe('host-1');
  });

  it('only lets the first valid call win', () => {
    const won = claimBingo(playToBingo(soloInPlay(), 'host-1'), 'host-1');
    // A second claim landing a moment later must not overwrite the winner.
    expect(() => claimBingo(won, 'host-1')).toThrow(/no round is in progress/i);
  });

  it('leaves the round running after a rejected claim', () => {
    const room = selectNumber(soloInPlay(), 'host-1', 1);
    expect(() => claimBingo(room, 'host-1')).toThrow(RoomError);
    expect(room.phase).toBe('playing');
    expect(room.bingo?.winnerId).toBeNull();
  });

  it('blocks further selections once the round is won', () => {
    const won = claimBingo(playToBingo(soloInPlay(), 'host-1'), 'host-1');
    const free = (won.bingo?.cards['host-1'] ?? []).find(
      (value) => !(won.bingo?.selected ?? []).includes(value),
    );
    expect(() => selectNumber(won, 'host-1', free ?? 25)).toThrow(/no round is in progress/i);
  });
});

describe('joinRoom', () => {
  it('deals a board and a turn slot to somebody joining mid-round', () => {
    const started = soloInPlay();
    const room = joinRoom(started, { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2');

    expect(room.bingo?.cards['p2']).toHaveLength(CARD_SIZE);
    expect(room.bingo?.turnOrder).toContain('p2');
    // The running turn is untouched.
    expect(currentTurnPlayerId(room)).toBe('host-1');
  });

  it('refuses a duplicate nickname regardless of case', () => {
    expect(() => joinRoom(newRoom(), { key: 'PLZ4K9', name: 'rhea', color: 'mint' }, 'p2')).toThrow(
      RoomError,
    );
  });

  it('refuses once the room is full', () => {
    let room = joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2');
    room = joinRoom(room, { key: 'PLZ4K9', name: 'Ana', color: 'yellow' }, 'p3');
    expect(() => joinRoom(room, { key: 'PLZ4K9', name: 'Kofi', color: 'cream' }, 'p4')).toThrow(
      /full/i,
    );
  });

  it('refuses a locked room that has already started', () => {
    const room = startRound(newRoom({ privacy: 'Locked after start' }), 'host-1');
    expect(() => joinRoom(room, { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2')).toThrow(
      /locked/i,
    );
  });
});

describe('removePlayer', () => {
  it('takes the player out of the turn order and keeps play on the same person', () => {
    let room = startRound(
      joinRoom(
        joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2'),
        { key: 'PLZ4K9', name: 'Ana', color: 'yellow' },
        'p3',
      ),
      'host-1',
    );
    room = selectNumber(room, 'host-1', 1);
    expect(currentTurnPlayerId(room)).toBe('p2');

    const after = removePlayer(room, 'host-1', 'p3');
    expect(after.bingo?.turnOrder).toEqual(['host-1', 'p2']);
    expect(after.bingo?.cards['p3']).toBeUndefined();
    // Still waiting on the same player it was waiting on.
    expect(currentTurnPlayerId(after)).toBe('p2');
  });

  it('moves play on when the player on turn is removed', () => {
    let room = startRound(
      joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2'),
      'host-1',
    );
    room = selectNumber(room, 'host-1', 1);
    expect(currentTurnPlayerId(room)).toBe('p2');

    const after = removePlayer(room, 'host-1', 'p2');
    expect(after.bingo?.turnOrder).toEqual(['host-1']);
    expect(currentTurnPlayerId(after)).toBe('host-1');
  });

  it('never removes the host', () => {
    expect(() => removePlayer(soloInPlay(), 'host-1', 'host-1')).toThrow(/host/i);
  });
});

describe('rounds and session', () => {
  function winSolo(room: Room): Room {
    return claimBingo(playToBingo(room, 'host-1'), 'host-1');
  }

  it('deals a fresh round with nothing taken', () => {
    const next = nextRound(winSolo(soloInPlay()), 'host-1');
    expect(next.round).toBe(2);
    expect(next.phase).toBe('playing');
    expect(next.bingo?.selected).toEqual([]);
    expect(next.bingo?.winnerId).toBeNull();
  });

  it('finishes the session after the last round', () => {
    const second = nextRound(winSolo(soloInPlay()), 'host-1');
    const finished = nextRound(winSolo(second), 'host-1');
    expect(finished.phase).toBe('finished');
  });

  it('refuses to advance while a round is still running', () => {
    expect(() => nextRound(soloInPlay(), 'host-1')).toThrow(/not finished/i);
  });

  it('replays the session with scores reset', () => {
    const replayed = replaySession(winSolo(soloInPlay()), 'host-1');
    expect(replayed.phase).toBe('lobby');
    expect(replayed.round).toBe(1);
    expect(replayed.bingo).toBeNull();
    expect(replayed.players.every((player) => player.score === 0)).toBe(true);
  });

  it('locks and ends on the host only', () => {
    expect(lockRoom(newRoom(), 'host-1').settings.privacy).toBe('Locked after start');
    expect(endSession(newRoom(), 'host-1').phase).toBe('finished');
  });

  it('expires two hours out', () => {
    const now = Date.UTC(2026, 0, 1);
    const room = createRoom(INPUT, 'PLZ4K9', 'host-1', now);
    expect(new Date(room.expiresAt).getTime()).toBe(now + ROOM_TTL_MS);
    expect(isExpired(room, now + ROOM_TTL_MS + 1)).toBe(true);
  });
});

describe('immutability', () => {
  it('never mutates the room it was given', () => {
    const room = soloInPlay();
    const snapshot = JSON.stringify(room);
    selectNumber(room, 'host-1', 3);
    lockRoom(room, 'host-1');
    joinRoom(room, { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2');
    expect(JSON.stringify(room)).toBe(snapshot);
  });
});

describe('scopeRoomForPlayer', () => {
  function duoInPlay(): Room {
    return startRound(
      joinRoom(newRoom(), { key: 'PLZ4K9', name: 'Dev', color: 'mint' }, 'p2'),
      'host-1',
    );
  }

  it("shows a player their own board and nobody else's", () => {
    const scoped = scopeRoomForPlayer(duoInPlay(), 'host-1');
    expect(Object.keys(scoped.bingo?.cards ?? {})).toEqual(['host-1']);
    expect(scoped.bingo?.cards['p2']).toBeUndefined();
  });

  it('shows a spectator no board at all during play', () => {
    const scoped = scopeRoomForPlayer(duoInPlay(), null);
    expect(scoped.bingo?.cards).toEqual({});
  });

  it('keeps the board itself intact — it narrows, it does not redact', () => {
    const room = duoInPlay();
    const scoped = scopeRoomForPlayer(room, 'p2');
    expect(scoped.bingo?.cards['p2']).toEqual(room.bingo?.cards['p2']);
  });

  it('leaves everything else visible', () => {
    const room = duoInPlay();
    const scoped = scopeRoomForPlayer(selectNumber(room, 'host-1', 9), 'p2');
    expect(scoped.bingo?.selected).toEqual([9]);
    expect(scoped.bingo?.turnOrder).toEqual(['host-1', 'p2']);
    expect(scoped.players).toHaveLength(2);
  });

  it("reveals the winner's board to everyone once the round is over", () => {
    const started = duoInPlay();
    const played = takeInTurn(started, numbersAt(started, 'host-1', CELLS_5_LINES));
    const won = claimBingo(played, 'host-1');

    // The loser now sees the winning board as well as their own.
    const loserView = scopeRoomForPlayer(won, 'p2');
    expect(Object.keys(loserView.bingo?.cards ?? {}).sort()).toEqual(['host-1', 'p2']);

    // And so does a spectator, but still only the winner's.
    const spectatorView = scopeRoomForPlayer(won, null);
    expect(Object.keys(spectatorView.bingo?.cards ?? {})).toEqual(['host-1']);
  });

  it('does nothing to a room with no round in progress', () => {
    const lobby = newRoom();
    expect(scopeRoomForPlayer(lobby, 'host-1')).toEqual(lobby);
  });
});
