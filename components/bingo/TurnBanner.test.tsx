import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TurnBanner } from '@/components/bingo/TurnBanner';
import type { Player } from '@/types/playroom';

const player: Player = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Dev',
  initial: 'D',
  color: 'mint',
  score: 0,
  isHost: false,
  isReady: true,
};

describe('TurnBanner', () => {
  it('shows the seconds the server reported', async () => {
    render(<TurnBanner current={player} isYourTurn secondsRemaining={20} />);
    expect(await screen.findByText('20s')).toBeInTheDocument();
  });

  it('counts down between reads instead of waiting for the next one', async () => {
    render(<TurnBanner current={player} isYourTurn secondsRemaining={3} />);
    expect(await screen.findByText('3s')).toBeInTheDocument();

    // The poll is two seconds apart; the count must not step in two-second
    // jumps while it waits.
    await waitFor(() => expect(screen.getByText('2s')).toBeInTheDocument(), { timeout: 2500 });
  });

  it('shows no clock when there is none', () => {
    render(<TurnBanner current={player} isYourTurn secondsRemaining={null} />);
    expect(screen.queryByText(/\ds$/)).not.toBeInTheDocument();
  });

  /**
   * The browser-only transport has no server to play a turn out on somebody's
   * behalf, so it reports no clock. A countdown there would promise something
   * nothing will deliver.
   */
  it('shows no clock when the prop goes away mid-turn', async () => {
    const { rerender } = render(<TurnBanner current={player} isYourTurn secondsRemaining={9} />);
    expect(await screen.findByText('9s')).toBeInTheDocument();

    rerender(<TurnBanner current={player} isYourTurn secondsRemaining={null} />);
    expect(screen.queryByText('9s')).not.toBeInTheDocument();
  });

  /**
   * A count that changes every second inside `aria-live` would announce itself
   * over and over and bury the thing that actually changed, whose turn it is.
   */
  it('keeps the ticking number out of the live region', async () => {
    render(<TurnBanner current={player} isYourTurn secondsRemaining={12} />);

    const live = document.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.textContent).toContain('Your turn');
    expect(live?.textContent).not.toContain('12s');

    const count = await screen.findByText('12s');
    expect(count).toHaveAttribute('aria-hidden', 'true');
  });

  it('still says whose turn it is', () => {
    render(<TurnBanner current={player} isYourTurn={false} secondsRemaining={7} />);
    expect(screen.getByText("Dev's turn")).toBeInTheDocument();
  });
});
