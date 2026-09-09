import { describe, expect, it } from 'vitest';

import { CARD_SIZE, GRID_SIZE } from '@/lib/bingo';
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

/** The numbers making up the host's top row, in board order. */
function topRowNumbers(room: Room, playerId: string): number[] {
  const card = room.bingo?.cards[playerId] ?? [];
  return card.slice(0, GRID_SIZE) as number[];
}

/** Plays a solo room until `values` have all been taken. */
function takeAll(room: Room, playerId: string, values: readonly number[]): Room {
  return values.reduce((current, value) => selectNumber(current, playerId, value), room);
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
    expect(() => claimBingo(room, 'host-1')).toThrow(/no complete row, column or diagonal/i);
  });

  it('accepts a completed row and ends the round', () => {
    const started = soloInPlay();
    const room = claimBingo(takeAll(started, 'host-1', topRowNumbers(started, 'host-1')), 'host-1');

    expect(room.phase).toBe('round-results');
    expect(room.bingo?.winnerId).toBe('host-1');
    expect(room.bingo?.winningLine).toMatchObject({ kind: 'row', index: 1 });
    expect(room.players.find((player) => player.id === 'host-1')?.score).toBe(100);
  });

  it('only lets the first valid call win', () => {
    const started = soloInPlay();
    const won = claimBingo(takeAll(started, 'host-1', topRowNumbers(started, 'host-1')), 'host-1');
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
    const started = soloInPlay();
    const won = claimBingo(takeAll(started, 'host-1', topRowNumbers(started, 'host-1')), 'host-1');
    expect(() => selectNumber(won, 'host-1', 24)).toThrow(/no round is in progress/i);
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
    return claimBingo(takeAll(room, 'host-1', topRowNumbers(room, 'host-1')), 'host-1');
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
