import { beforeEach, describe, expect, it } from 'vitest';

import { CARD_SIZE, GRID_SIZE } from '@/lib/bingo';
import { localRoomStore } from '@/services/local-room-store';
import type { CreateRoomInput, Room } from '@/types/playroom';

/**
 * Drives the real transport against jsdom's `localStorage`, so the whole path a
 * screen takes — create, join, deal, take turns, claim — is exercised rather
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

/** The numbers in a player's top row — the cheapest line to complete. */
function topRow(room: Room, playerId: string): number[] {
  return (room.bingo?.cards[playerId] ?? []).slice(0, GRID_SIZE) as number[];
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

  it('gives every player a different full 1-25 board', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    await localRoomStore.joinRoom({ key: room.key, name: 'Dev', color: 'mint' });
    const started = await localRoomStore.startRound({ roomKey: room.key, playerId: hostId });

    const cards = Object.values(started.bingo?.cards ?? {});
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect([...card].sort((a, b) => a - b)).toEqual(
        Array.from({ length: CARD_SIZE }, (_, index) => index + 1),
      );
    }
    expect(cards[0]).not.toEqual(cards[1]);
  });

  it('enforces turn order across two players', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await localRoomStore.startRound({ roomKey: room.key, playerId: hostId });

    // The guest cannot move first.
    await expect(
      localRoomStore.selectNumber({ roomKey: room.key, playerId: guestId }, 11),
    ).rejects.toThrow(/not your turn/i);

    const afterHost = await localRoomStore.selectNumber(
      { roomKey: room.key, playerId: hostId },
      11,
    );
    expect(afterHost.bingo?.selected).toEqual([11]);

    // Now the host cannot move again.
    await expect(
      localRoomStore.selectNumber({ roomKey: room.key, playerId: hostId }, 12),
    ).rejects.toThrow(/not your turn/i);

    const afterGuest = await localRoomStore.selectNumber(
      { roomKey: room.key, playerId: guestId },
      12,
    );
    expect(afterGuest.bingo?.selected).toEqual([11, 12]);
  });

  it('never lets the same number be taken twice', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await localRoomStore.startRound({ roomKey: room.key, playerId: hostId });
    await localRoomStore.selectNumber({ roomKey: room.key, playerId: hostId }, 7);

    await expect(
      localRoomStore.selectNumber({ roomKey: room.key, playerId: guestId }, 7),
    ).rejects.toThrow(/already been taken/i);

    expect((await localRoomStore.getRoom(room.key))?.bingo?.selected).toEqual([7]);
  });

  it('rejects a number outside 1 to 25', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = { roomKey: room.key, playerId: hostId };
    await localRoomStore.startRound(identity);
    await expect(localRoomStore.selectNumber(identity, 99)).rejects.toThrow(/between 1 and 25/i);
  });

  it('marks a taken number on every board at once', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    await localRoomStore.joinRoom({ key: room.key, name: 'Dev', color: 'mint' });
    await localRoomStore.startRound({ roomKey: room.key, playerId: hostId });
    const after = await localRoomStore.selectNumber({ roomKey: room.key, playerId: hostId }, 13);

    // Marking is derived from one shared list, so it cannot differ per board.
    expect(after.bingo?.selected).toContain(13);
    for (const card of Object.values(after.bingo?.cards ?? {})) {
      expect(card).toContain(13);
    }
  });

  it('rejects a bingo claim with no complete line', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = { roomKey: room.key, playerId: hostId };
    await localRoomStore.startRound(identity);
    await localRoomStore.selectNumber(identity, 1);

    await expect(localRoomStore.claimBingo(identity)).rejects.toThrow(/no complete row/i);
    // The round keeps running.
    expect((await localRoomStore.getRoom(room.key))?.phase).toBe('playing');
  });

  it('plays a solo round through to a validated win', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = { roomKey: room.key, playerId: hostId };
    const started = await localRoomStore.startRound(identity);

    for (const value of topRow(started, hostId)) {
      await localRoomStore.selectNumber(identity, value);
    }

    const won = await localRoomStore.claimBingo(identity);
    expect(won.phase).toBe('round-results');
    expect(won.bingo?.winnerId).toBe(hostId);
    expect(won.bingo?.winningLine).toMatchObject({ kind: 'row', index: 1 });
    expect(won.players.find((player) => player.id === hostId)?.score).toBe(100);
  });

  it('blocks selections and a second claim once the round is won', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = { roomKey: room.key, playerId: hostId };
    const started = await localRoomStore.startRound(identity);
    for (const value of topRow(started, hostId)) {
      await localRoomStore.selectNumber(identity, value);
    }
    await localRoomStore.claimBingo(identity);

    await expect(localRoomStore.selectNumber(identity, 25)).rejects.toThrow(/no round/i);
    await expect(localRoomStore.claimBingo(identity)).rejects.toThrow(/no round/i);
  });

  it('stops a non-host from starting the round', async () => {
    const { room } = await localRoomStore.createRoom(INPUT);
    const { playerId: guestId } = await localRoomStore.joinRoom({
      key: room.key,
      name: 'Dev',
      color: 'mint',
    });
    await expect(
      localRoomStore.startRound({ roomKey: room.key, playerId: guestId }),
    ).rejects.toThrow(/host/i);
  });

  it('persists across reads, so another tab sees the same state', async () => {
    const { room, playerId: hostId } = await localRoomStore.createRoom(INPUT);
    const identity = { roomKey: room.key, playerId: hostId };
    await localRoomStore.startRound(identity);
    await localRoomStore.selectNumber(identity, 5);

    // A second "tab" only has the key; everything else comes from storage.
    const seenElsewhere = await localRoomStore.getRoom(room.key);
    expect(seenElsewhere?.bingo?.selected).toEqual([5]);
    expect(seenElsewhere?.bingo?.turnOrder).toHaveLength(1);
  });
});
