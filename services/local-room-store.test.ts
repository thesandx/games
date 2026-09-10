import { beforeEach, describe, expect, it } from 'vitest';

import { CARD_SIZE, LINES_TO_WIN } from '@/lib/bingo';
import { localRoomStore } from '@/services/local-room-store';
import type { CreateRoomInput, PlayerIdentity, Room } from '@/types/playroom';

/**
 * Drives the real transport against jsdom's `localStorage`, so the whole path a
 * screen takes, create, join, deal, take turns, claim, is exercised rather
 * than just the pure reducers underneath it.
 */

const INPUT: CreateRoomInput = {
  gameId: 'bingo',
  settings: { rounds: 2, privacy: 'Key only', maxPlayers: 4 },
  hostName: 'Rhea',
  hostColor: 'peach',
};

beforeEach(() => {
  window.localStorage.clear();
});

/**
 * The identity a transport call needs.
 *
 * The token is a placeholder. This store does not check credentials and says
 * so in its module comment. There is no trust boundary inside one browser, so
 * a check here would be theatre. The field exists so the same call shape works
 * against the real service, which does check it.
 */
function identityFor(roomKey: string, playerId: string): PlayerIdentity {
  return { roomKey, playerId, playerToken: `local-${playerId}` };
}

/**
 * Cells that put a board on five completed lines: rows 1-3, then the two cells
 * each diagonal still needs. Five lines is a win; fewer is not.
 */
const CELLS_5_LINES = [...Array.from({ length: 15 }, (_, index) => index), 18, 24, 16, 20];

/** The numbers at those cells on a player's board. Needs that player's view. */
function bingoNumbers(room: Room, playerId: string): number[] {
  const card = room.bingo?.cards[playerId] ?? [];
  return CELLS_5_LINES.map((cell) => card[cell] as number);
}

/** The player's top row, one line, deliberately not enough to win. */
function topRow(room: Room, playerId: string): number[] {
  return (room.bingo?.cards[playerId] ?? []).slice(0, 5) as number[];
}

describe('localRoomStore', () => {
  it('creates a room and reads it back by key', async () => {
    const { room, playerId } = await localRoomStore.createRoom(INPUT);
    expect(room.key).toHaveLength(6);
    expect(room.hostId).toBe(playerId);
    expect((await localRoomStore.getRoom(room.key))?.key).toBe(room.key);
  });

  it('is case-insensitive about keys', async () => {
    const { room } = await localRoomStore.createRoom(INPUT);
    expect(await localRoomStore.getRoom(room.key.toLowerCase())).not.toBeNull();
  });

  it('returns null for a key that was never issued', async () => {
    expect(await localRoomStore.getRoom('ZZZZZZ')).toBeNull();
  });

  it('deals each player a full 1-25 board', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await localRoomStore.startRound(identityFor(room.key, hostId));

    // Each player reads their own view, and each sees a complete board.
    for (const id of [hostId, guestId]) {
      const view = await localRoomStore.getRoom(room.key, identityFor(room.key, id));
      const card = view?.bingo?.cards[id] ?? [];
      expect([...card].sort((a, b) => a - b)).toEqual(
        Array.from({ length: CARD_SIZE }, (_, index) => index + 1),
      );
    }
  });

  it('gives the two players different arrangements', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await localRoomStore.startRound(identityFor(room.key, hostId));

    const hostCard = (await localRoomStore.getRoom(room.key, identityFor(room.key, hostId)))?.bingo
      ?.cards[hostId];
    const guestCard = (await localRoomStore.getRoom(room.key, identityFor(room.key, guestId)))
      ?.bingo?.cards[guestId];
    expect(hostCard).not.toEqual(guestCard);
  });

  it("never sends one player another player's board", async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    const started = await localRoomStore.startRound(identityFor(room.key, hostId));

    // The host's own view, straight off a mutation.
    expect(Object.keys(started.bingo?.cards ?? {})).toEqual([hostId]);

    // And off a read.
    const guestView = await localRoomStore.getRoom(room.key, identityFor(room.key, guestId));
    expect(Object.keys(guestView?.bingo?.cards ?? {})).toEqual([guestId]);

    // A caller with no identity sees no board at all.
    const spectatorView = await localRoomStore.getRoom(room.key);
    expect(spectatorView?.bingo?.cards).toEqual({});
  });

  it('enforces turn order across two players', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await localRoomStore.startRound(identityFor(room.key, hostId));

    // The guest cannot move first.
    await expect(localRoomStore.selectNumber(identityFor(room.key, guestId), 11)).rejects.toThrow(
      /not your turn/i,
    );

    const afterHost = await localRoomStore.selectNumber(identityFor(room.key, hostId), 11);
    expect(afterHost.bingo?.selected).toEqual([11]);

    // Now the host cannot move again.
    await expect(localRoomStore.selectNumber(identityFor(room.key, hostId), 12)).rejects.toThrow(
      /not your turn/i,
    );

    const afterGuest = await localRoomStore.selectNumber(identityFor(room.key, guestId), 12);
    expect(afterGuest.bingo?.selected).toEqual([11, 12]);
  });

  it('never lets the same number be taken twice', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await localRoomStore.startRound(identityFor(room.key, hostId));
    await localRoomStore.selectNumber(identityFor(room.key, hostId), 7);

    await expect(localRoomStore.selectNumber(identityFor(room.key, guestId), 7)).rejects.toThrow(
      /already been taken/i,
    );

    expect((await localRoomStore.getRoom(room.key))?.bingo?.selected).toEqual([7]);
  });

  it('rejects a number outside 1 to 25', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = identityFor(room.key, hostId);
    await localRoomStore.startRound(identity);
    await expect(localRoomStore.selectNumber(identity, 99)).rejects.toThrow(/between 1 and 25/i);
  });

  it('marks a taken number for every player at once', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await localRoomStore.startRound(identityFor(room.key, hostId));
    await localRoomStore.selectNumber(identityFor(room.key, hostId), 13);

    // Marking is derived from one shared list, so it cannot differ per player.
    for (const id of [hostId, guestId]) {
      const view = await localRoomStore.getRoom(room.key, identityFor(room.key, id));
      expect(view?.bingo?.selected).toContain(13);
      expect(view?.bingo?.cards[id]).toContain(13);
    }
  });

  it("reveals the winner's board to the other players once the round ends", async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    const identity = identityFor(room.key, hostId);
    const started = await localRoomStore.startRound(identity);

    // Two players, so turns alternate. Marking is global, so it does not
    // matter who takes each number. It lands on the host's board either way.
    let onTurn = hostId;
    for (const value of bingoNumbers(started, hostId)) {
      await localRoomStore.selectNumber(identityFor(room.key, onTurn), value);
      onTurn = onTurn === hostId ? guestId : hostId;
    }
    await localRoomStore.claimBingo(identity);

    const guestView = await localRoomStore.getRoom(room.key, identityFor(room.key, guestId));
    expect(Object.keys(guestView?.bingo?.cards ?? {}).sort()).toEqual([guestId, hostId].sort());
    expect(guestView?.bingo?.winnerId).toBe(hostId);
  });

  it('rejects a bingo claim with no complete line', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = identityFor(room.key, hostId);
    await localRoomStore.startRound(identity);
    await localRoomStore.selectNumber(identity, 1);

    await expect(localRoomStore.claimBingo(identity)).rejects.toThrow(/need 5 complete lines/i);
    // The round keeps running.
    expect((await localRoomStore.getRoom(room.key))?.phase).toBe('playing');
  });

  it('rejects a claim on a single completed line', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = identityFor(room.key, hostId);
    const started = await localRoomStore.startRound(identity);

    for (const value of topRow(started, hostId)) {
      await localRoomStore.selectNumber(identity, value);
    }

    await expect(localRoomStore.claimBingo(identity)).rejects.toThrow(/you have 1/i);
    expect((await localRoomStore.getRoom(room.key))?.phase).toBe('playing');
  });

  it('plays a solo round through to a validated five-line win', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = identityFor(room.key, hostId);
    const started = await localRoomStore.startRound(identity);

    for (const value of bingoNumbers(started, hostId)) {
      await localRoomStore.selectNumber(identity, value);
    }

    const won = await localRoomStore.claimBingo(identity);
    expect(won.phase).toBe('round-results');
    expect(won.bingo?.winnerId).toBe(hostId);
    expect(won.bingo?.winningLines.length).toBeGreaterThanOrEqual(LINES_TO_WIN);
    expect(won.players.find((player) => player.id === hostId)?.score).toBe(100);
  });

  it('blocks selections and a second claim once the round is won', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = identityFor(room.key, hostId);
    const started = await localRoomStore.startRound(identity);
    for (const value of bingoNumbers(started, hostId)) {
      await localRoomStore.selectNumber(identity, value);
    }
    await localRoomStore.claimBingo(identity);

    const free = (started.bingo?.cards[hostId] ?? []).find(
      (value) => !bingoNumbers(started, hostId).includes(value),
    );
    await expect(localRoomStore.selectNumber(identity, free ?? 25)).rejects.toThrow(/no round/i);
    await expect(localRoomStore.claimBingo(identity)).rejects.toThrow(/no round/i);
  });

  it('stops a non-host from starting the round', async () => {
    const { room } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await expect(localRoomStore.startRound(identityFor(room.key, guestId))).rejects.toThrow(
      /host/i,
    );
  });

  it('persists across reads, so another tab sees the same state', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = identityFor(room.key, hostId);
    await localRoomStore.startRound(identity);
    await localRoomStore.selectNumber(identity, 5);

    // A second "tab" only has the key; everything else comes from storage.
    const seenElsewhere = await localRoomStore.getRoom(room.key);
    expect(seenElsewhere?.bingo?.selected).toEqual([5]);
    expect(seenElsewhere?.bingo?.turnOrder).toHaveLength(1);
  });
});
