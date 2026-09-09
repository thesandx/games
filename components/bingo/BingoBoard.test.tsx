import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { CARD_SIZE } from '@/lib/bingo';
import type { BingoCard } from '@/types/playroom';

/** 1..25 in reading order, so the top row is 1-5 and the diagonal is 1,7,13,19,25. */
const ORDERED: BingoCard = Array.from({ length: CARD_SIZE }, (_, index) => index + 1);

describe('BingoBoard', () => {
  it('renders all 25 numbers with no free square', () => {
    render(<BingoBoard card={ORDERED} selected={[]} label="Your board" />);
    const grid = screen.getByRole('table', { name: 'Your board' });
    for (let value = 1; value <= CARD_SIZE; value += 1) {
      expect(within(grid).getByText(String(value))).toBeInTheDocument();
    }
    expect(within(grid).queryByText('FREE')).not.toBeInTheDocument();
  });

  it('is not interactive — players never mark their own cells', () => {
    render(<BingoBoard card={ORDERED} selected={[1, 2]} label="Your board" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('marks a cell once its number is taken', () => {
    render(<BingoBoard card={ORDERED} selected={[7]} label="Your board" />);
    // The marked cell carries its state in text, not colour alone.
    expect(screen.getByText('7').parentElement).toHaveTextContent('7, marked');
    expect(screen.getByText('8').parentElement).not.toHaveTextContent('marked');
  });

  it('marks every taken number at once', () => {
    render(<BingoBoard card={ORDERED} selected={[1, 2, 3]} label="Your board" />);
    for (const value of ['1', '2', '3']) {
      expect(screen.getByText(value).parentElement).toHaveTextContent(`${value}, marked`);
    }
  });

  it('calls out the cells of the winning line', () => {
    render(
      <BingoBoard
        card={ORDERED}
        selected={[1, 2, 3, 4, 5]}
        winningLine={{ kind: 'row', index: 1, cells: [0, 1, 2, 3, 4] }}
        label="Winning board"
      />,
    );
    expect(screen.getByText('3').parentElement).toHaveTextContent(
      '3, marked, part of the winning line',
    );
  });

  it('does not claim a marked cell outside the line as part of it', () => {
    render(
      <BingoBoard
        card={ORDERED}
        selected={[1, 2, 3, 4, 5, 9]}
        winningLine={{ kind: 'row', index: 1, cells: [0, 1, 2, 3, 4] }}
        label="Winning board"
      />,
    );
    expect(screen.getByText('9').parentElement).toHaveTextContent('9, marked');
    expect(screen.getByText('9').parentElement).not.toHaveTextContent('winning line');
  });

  it('names the board for assistive technology', () => {
    render(<BingoBoard card={ORDERED} selected={[]} label="Dev's board" />);
    expect(screen.getByRole('table', { name: "Dev's board" })).toBeInTheDocument();
  });
});
