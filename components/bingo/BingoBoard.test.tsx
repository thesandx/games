import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { CARD_SIZE } from '@/lib/bingo';
import type { BingoCard } from '@/types/playroom';

/** 1..25 in reading order, so the top row is 1-5 and cell i holds i+1. */
const ORDERED: BingoCard = Array.from({ length: CARD_SIZE }, (_, index) => index + 1);

describe('BingoBoard', () => {
  it('renders all 25 numbers with no free square', () => {
    render(<BingoBoard card={ORDERED} selected={[]} label="Your board" />);
    const grid = screen.getByRole('table', { name: 'Your board' });
    for (let value = 1; value <= CARD_SIZE; value += 1) {
      expect(within(grid).getAllByText(String(value)).length).toBeGreaterThan(0);
    }
    expect(within(grid).queryByText('FREE')).not.toBeInTheDocument();
  });

  it('is read-only when no picker is wired up', () => {
    render(<BingoBoard card={ORDERED} selected={[1, 2]} label="Dev's board" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('offers only free numbers on your turn', () => {
    render(
      <BingoBoard card={ORDERED} selected={[3]} label="Your board" onPick={vi.fn()} canPick />,
    );
    // 3 is taken, so it is not offered; 4 is free.
    expect(screen.queryByRole('button', { name: 'Take 3' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take 4' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(CARD_SIZE - 1);
  });

  it('takes the number the player tapped', () => {
    const onPick = vi.fn();
    render(<BingoBoard card={ORDERED} selected={[]} label="Your board" onPick={onPick} canPick />);
    fireEvent.click(screen.getByRole('button', { name: 'Take 17' }));
    expect(onPick).toHaveBeenCalledWith(17);
  });

  it('offers nothing when it is not your turn', () => {
    render(
      <BingoBoard
        card={ORDERED}
        selected={[]}
        label="Your board"
        onPick={vi.fn()}
        canPick={false}
      />,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('marks a cell once its number is taken', () => {
    render(<BingoBoard card={ORDERED} selected={[7]} label="Your board" />);
    expect(screen.getByText('7').parentElement).toHaveTextContent('7, taken');
    expect(screen.getByText('8').parentElement).toHaveTextContent('8, free');
  });

  it('calls out the cells of every completed line', () => {
    render(
      <BingoBoard
        card={ORDERED}
        selected={[1, 2, 3, 4, 5, 6, 11, 16, 21]}
        winningLines={[
          { kind: 'row', index: 1, cells: [0, 1, 2, 3, 4] },
          { kind: 'column', index: 1, cells: [0, 5, 10, 15, 20] },
        ]}
        label="Your board"
      />,
    );
    // A cell in the row, and a cell in the column, are both called out.
    expect(screen.getByText('3').parentElement).toHaveTextContent(
      '3, taken, part of a completed line',
    );
    expect(screen.getByText('21').parentElement).toHaveTextContent(
      '21, taken, part of a completed line',
    );
  });

  it('does not claim a taken cell outside any line', () => {
    render(
      <BingoBoard
        card={ORDERED}
        selected={[1, 2, 3, 4, 5, 9]}
        winningLines={[{ kind: 'row', index: 1, cells: [0, 1, 2, 3, 4] }]}
        label="Your board"
      />,
    );
    expect(screen.getByText('9').parentElement).toHaveTextContent('9, taken');
    expect(screen.getByText('9').parentElement).not.toHaveTextContent('completed line');
  });

  it('names the board for assistive technology', () => {
    render(<BingoBoard card={ORDERED} selected={[]} label="Dev's board" />);
    expect(screen.getByRole('table', { name: "Dev's board" })).toBeInTheDocument();
  });

  /**
   * The latest number is peach so the room can see what just happened. A cell
   * in a completed line stays yellow, because a completed line is the thing
   * worth seeing and the line under the banner already names the last pick.
   */
  it('marks the latest number, and lets a completed line outrank it', () => {
    const card = Array.from({ length: 25 }, (_, index) => index + 1);
    render(
      <BingoBoard
        card={card}
        selected={[1, 2, 3, 4, 5]}
        winningLines={[{ kind: 'row', index: 1, cells: [0, 1, 2, 3, 4] }]}
        latest={5}
        label="Winner board"
      />,
    );

    // 5 is both the latest pick and part of the completed row: yellow wins.
    const inLine = screen.getByText('5').parentElement;
    expect(inLine?.className).toContain('bg-yellow');
    expect(inLine?.className).not.toContain('bg-peach');
  });

  it('paints the latest number peach when it completes nothing', () => {
    const card = Array.from({ length: 25 }, (_, index) => index + 1);
    render(<BingoBoard card={card} selected={[7, 12]} latest={12} label="Board" />);

    const latest = screen.getByText('12').parentElement;
    expect(latest?.className).toContain('bg-peach');

    // An older number stays plain ink.
    const older = screen.getByText('7').parentElement;
    expect(older?.className).toContain('bg-ink-1');
  });

  it('says which number is the latest without relying on colour', () => {
    const card = Array.from({ length: 25 }, (_, index) => index + 1);
    render(<BingoBoard card={card} selected={[7, 12]} latest={12} label="Board" />);
    expect(screen.getByText(/12, taken, the most recent number/)).toBeInTheDocument();
  });
});
