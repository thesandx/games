import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoomScreen } from '@/components/room/RoomScreen';
import { rememberPlayerIdentity } from '@/hooks/usePlayerIdentity';
import { RoomError } from '@/lib/room-engine';
import type { Room } from '@/types/playroom';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

/**
 * The transport is stubbed rather than driven, because the failure this file is
 * about cannot be produced through the UI: the screen only offers a move it
 * believes is legal, and the browser store is synchronous, so client and server
 * never disagree there. The disagreement is the whole point. The player taps a
 * number that was legal when the board was painted and is not legal by the time
 * the request lands.
 */
const transport = {
  getRoom: vi.fn(),
  selectNumber: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  startRound: vi.fn(),
  claimBingo: vi.fn(),
  nextRound: vi.fn(),
  endSession: vi.fn(),
  replaySession: vi.fn(),
  lockRoom: vi.fn(),
  removePlayer: vi.fn(),
};

vi.mock('@/services/room-transport', () => ({
  get roomTransport() {
    return transport;
  },
  isLocalTransport: false,
}));

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

function room(overrides: Partial<Room> = {}): Room {
  return {
    key: 'PLZ4K9',
    gameId: 'bingo',
    hostId: ME,
    phase: 'playing',
    round: 1,
    players: [
      { id: ME, name: 'Sandy', initial: 'S', color: 'mint', score: 0, isHost: true, isReady: true },
      {
        id: OTHER,
        name: 'Anushka',
        initial: 'A',
        color: 'peach',
        score: 0,
        isHost: false,
        isReady: true,
      },
    ],
    settings: { rounds: 1, privacy: 'Locked after start', maxPlayers: 8 },
    bingo: {
      selected: [],
      cards: { [ME]: Array.from({ length: 25 }, (_, index) => index + 1) },
      turnOrder: [ME, OTHER],
      currentTurnIndex: 0,
      winnerId: null,
      winningLines: [],
      turnSecondsRemaining: 20,
      lastPick: null,
    },
    lastRound: null,
    createdAt: '2026-09-10T10:00:00.000Z',
    expiresAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.clearAllMocks();
  rememberPlayerIdentity('PLZ4K9', ME, 'secret-token');
});

async function pickTheFirstFreeNumber(): Promise<void> {
  // Every free cell is its own button, so this is findAll, not find.
  const cells = await screen.findAllByRole('button', { name: /^Take \d+$/ });
  fireEvent.click(cells[0] as HTMLElement);
}

describe('RoomScreen', () => {
  /**
   * From a real game. A player takes a number just as somebody else calls
   * bingo, so the server correctly refuses it with "This round is already
   * over." The host then plays again, and that sentence is still on screen,
   * over a freshly dealt board with one number taken.
   *
   * The message was true when it was written and nonsense a moment later,
   * which is worse than showing nothing.
   */
  it('drops an action error once the round it belonged to has ended', async () => {
    const live = room();
    const ended = room({
      phase: 'round-results',
      bingo: { ...live.bingo!, winnerId: OTHER, selected: [7] },
      lastRound: [
        {
          playerId: OTHER,
          name: 'Anushka',
          initial: 'A',
          color: 'peach',
          note: 'Bingo',
          gain: 100,
        },
      ],
    });

    // The read moves on to the finished round, exactly as it would in play.
    transport.getRoom.mockResolvedValueOnce(live).mockResolvedValue(ended);
    transport.selectNumber.mockRejectedValue(
      new RoomError('round-over', 'This round is already over.'),
    );

    render(<RoomScreen roomKey="PLZ4K9" />);
    await pickTheFirstFreeNumber();

    // The move was genuinely attempted and genuinely refused, so this test
    // cannot pass by never producing an error in the first place.
    await waitFor(() => expect(transport.selectNumber).toHaveBeenCalled());

    // Wait for the room to move on FIRST. The assertion below is a negative,
    // and checking it before the screen changes would pass without proving
    // anything at all.
    await screen.findByText(/called bingo/i);

    // The complaint about a round that has ended does not come with it.
    expect(screen.queryByText('This round is already over.')).not.toBeInTheDocument();
  });

  /**
   * The other half of the rule. Over-clearing would be its own bug: a player
   * who taps out of turn has to be able to read why nothing happened.
   */
  it('keeps an error that is still true while the same round runs', async () => {
    transport.getRoom.mockResolvedValue(room());
    transport.selectNumber.mockRejectedValue(
      new RoomError('not-your-turn', 'It is not your turn yet.'),
    );

    render(<RoomScreen roomKey="PLZ4K9" />);
    await pickTheFirstFreeNumber();

    const message = await screen.findByText('It is not your turn yet.');
    expect(message).toBeInTheDocument();

    // Survives the 2-second poll, which re-reads the same unchanged round.
    await new Promise((resolve) => setTimeout(resolve, 2400));
    expect(screen.getByText('It is not your turn yet.')).toBeInTheDocument();
  });
});
