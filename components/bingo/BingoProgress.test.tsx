import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BingoProgress } from '@/components/bingo/BingoProgress';
import { BINGO_LETTERS, LINES_TO_WIN } from '@/lib/bingo';

describe('BingoProgress', () => {
  it('shows one letter per line needed', () => {
    render(<BingoProgress earned={0} />);
    expect(BINGO_LETTERS).toHaveLength(LINES_TO_WIN);
    for (const letter of BINGO_LETTERS) {
      expect(screen.getByText(letter)).toBeInTheDocument();
    }
  });

  it('states the count in text, not colour alone', () => {
    render(<BingoProgress earned={3} />);
    expect(screen.getByText(`3 of ${LINES_TO_WIN} lines`)).toBeInTheDocument();
  });

  it('says nothing about calling bingo before five lines', () => {
    render(<BingoProgress earned={4} />);
    expect(screen.queryByText(/you can call bingo/i)).not.toBeInTheDocument();
  });

  it('invites the claim once all five are filled', () => {
    render(<BingoProgress earned={LINES_TO_WIN} />);
    expect(screen.getByText(/you can call bingo/i)).toBeInTheDocument();
  });
});
