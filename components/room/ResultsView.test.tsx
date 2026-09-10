import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ResultsView } from '@/components/room/ResultsView';
import type { Room } from '@/types/playroom';

const WINNER = '11111111-1111-4111-8111-111111111111';
const LOSER = '22222222-2222-4222-8222-222222222222';

/** Board captions are what name a grid; the score table is a `<table>` too. */
function boardCaptions(): string[] {
  return [...document.querySelectorAll('table caption')]
    .map((caption) => caption.textContent ?? '')
    .filter((text) => /board/i.test(text));
}

function room(): Room {
  // Two different arrangements of the same 25 numbers, which is the whole
  // reason a comparison is worth showing.
  const winnerCard = Array.from({ length: 25 }, (_, index) => index + 1);
  const loserCard = [...winnerCard].reverse();

  return {
    key: 'PLZ4K9',
    gameId: 'bingo',
    hostId: WINNER,
    phase: 'round-results',
    round: 1,
    players: [
      {
        id: WINNER,
        name: 'Sandy',
        initial: 'S',
        color: 'mint',
        score: 100,
        isHost: true,
        isReady: true,
      },
      {
        id: LOSER,
        name: 'Anushka',
        initial: 'A',
        color: 'peach',
        score: 10,
        isHost: false,
        isReady: true,
      },
    ],
    settings: { rounds: 1, privacy: 'Locked after start', maxPlayers: 8 },
    bingo: {
      // The first row of the winner's board, so it has exactly one line.
      selected: [1, 2, 3, 4, 5],
      cards: { [WINNER]: winnerCard, [LOSER]: loserCard },
      turnOrder: [WINNER, LOSER],
      currentTurnIndex: 0,
      winnerId: WINNER,
      winningLines: [{ kind: 'row', index: 1, cells: [0, 1, 2, 3, 4] }],
      turnSecondsRemaining: null,
      lastPick: { value: 5, playerId: WINNER },
    },
    lastRound: [
      { playerId: WINNER, name: 'Sandy', initial: 'S', color: 'mint', note: 'Bingo', gain: 100 },
      {
        playerId: LOSER,
        name: 'Anushka',
        initial: 'A',
        color: 'peach',
        note: 'One line',
        gain: 10,
      },
    ],
    createdAt: '2026-09-10T10:00:00.000Z',
    expiresAt: '2026-09-10T12:00:00.000Z',
  };
}

const handlers = {
  isHost: false,
  busy: false,
  onNextRound: vi.fn(),
  onEndSession: vi.fn(),
  onPlayAgain: vi.fn(),
};

describe('ResultsView', () => {
  /**
   * Every board holds the same 25 numbers in a different order, so the only
   * way to see why somebody else got there first is to put the two side by
   * side. Replacing a player's board with the winner's answered "who won" and
   * threw away "how close was I".
   */
  it('keeps the viewer their own board beside the winner’s', () => {
    render(<ResultsView room={room()} playerId={LOSER} {...handlers} />);

    expect(boardCaptions()).toEqual(['Your board', "Sandy's winning board"]);
    expect(screen.getByRole('heading', { name: 'Your board' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Sandy’s winning board/ })).toBeInTheDocument();
  });

  it('shows the viewer the numbers they actually held', () => {
    render(<ResultsView room={room()} playerId={LOSER} {...handlers} />);

    // The loser's board is the reverse arrangement, so 25 sits where the
    // winner's 1 does. Rendering the winner's grid twice would lose that.
    const own = screen.getByRole('table', { name: 'Your board' });
    const first = own.querySelectorAll('td')[0];
    expect(first?.textContent).toContain('25');
  });

  it('does not show the winner their own board twice', () => {
    render(<ResultsView room={room()} playerId={WINNER} {...handlers} />);

    expect(boardCaptions()).toEqual(['Your winning board']);
  });
});
