import { describe, expect, it } from 'vitest';

import {
  availableNumbers,
  BINGO_LETTERS,
  CARD_SIZE,
  createCard,
  describeLine,
  findWinningLines,
  GRID_SIZE,
  hasBingo,
  HIGHEST_NUMBER,
  isNumberAvailable,
  isPlayableNumber,
  lettersEarned,
  LINES_TO_WIN,
  LOWEST_NUMBER,
  markedCells,
  type RandomInt,
  WINNING_LINES,
} from '@/lib/bingo';
import type { BingoCard } from '@/types/playroom';

/** A board laid out 1..25 in reading order, so line maths is easy to follow. */
const ORDERED: BingoCard = Array.from({ length: CARD_SIZE }, (_, index) => index + 1);

const takeFirst: RandomInt = () => 0;

describe('createCard', () => {
  it('has 25 cells', () => {
    expect(createCard(takeFirst)).toHaveLength(CARD_SIZE);
  });

  it('holds every number from 1 to 25 exactly once', () => {
    const card = createCard();
    expect([...card].sort((a, b) => a - b)).toEqual(
      Array.from({ length: CARD_SIZE }, (_, index) => index + 1),
    );
  });

  it('has no empty cell. There is no free square', () => {
    const card = createCard();
    expect(card.every((value) => typeof value === 'number')).toBe(true);
    expect(card).not.toContain(null);
  });

  it('shuffles independently, so two players get different arrangements', () => {
    // Two identical arrangements from 25! possibilities would be a real bug,
    // not bad luck; ten draws makes a false failure vanishingly unlikely.
    const cards = Array.from({ length: 10 }, () => createCard().join(','));
    expect(new Set(cards).size).toBeGreaterThan(1);
  });
});

describe('WINNING_LINES', () => {
  it('is five rows, five columns and two diagonals', () => {
    expect(WINNING_LINES).toHaveLength(GRID_SIZE * 2 + 2);
    expect(WINNING_LINES.filter((line) => line.kind === 'row')).toHaveLength(GRID_SIZE);
    expect(WINNING_LINES.filter((line) => line.kind === 'column')).toHaveLength(GRID_SIZE);
    expect(WINNING_LINES.filter((line) => line.kind === 'diagonal')).toHaveLength(2);
  });

  it('gives every line five distinct cells inside the board', () => {
    for (const line of WINNING_LINES) {
      expect(line.cells).toHaveLength(GRID_SIZE);
      expect(new Set(line.cells).size).toBe(GRID_SIZE);
      expect(line.cells.every((cell) => cell >= 0 && cell < CARD_SIZE)).toBe(true);
    }
  });
});

describe('isPlayableNumber', () => {
  it('accepts 1 through 25 only', () => {
    expect(isPlayableNumber(LOWEST_NUMBER)).toBe(true);
    expect(isPlayableNumber(HIGHEST_NUMBER)).toBe(true);
    expect(isPlayableNumber(0)).toBe(false);
    expect(isPlayableNumber(26)).toBe(false);
    expect(isPlayableNumber(7.5)).toBe(false);
    expect(isPlayableNumber(Number.NaN)).toBe(false);
  });
});

describe('availableNumbers', () => {
  it('starts as all 25', () => {
    expect(availableNumbers([])).toHaveLength(CARD_SIZE);
  });

  it('drops what has been taken', () => {
    const available = availableNumbers([3, 17]);
    expect(available).toHaveLength(CARD_SIZE - 2);
    expect(available).not.toContain(3);
    expect(available).not.toContain(17);
  });
});

describe('markedCells', () => {
  it('marks a cell wherever its number appears on the board', () => {
    // On the ordered board, number 7 sits at index 6.
    expect(markedCells(ORDERED, [7])).toEqual([6]);
  });

  it('marks nothing when nothing has been taken', () => {
    expect(markedCells(ORDERED, [])).toEqual([]);
  });

  it('ignores numbers that are not on the board', () => {
    expect(markedCells([1, 2, 3], [99])).toEqual([]);
  });
});

/**
 * On the ORDERED board, cell index i holds number i + 1. These groups are
 * chosen so each step adds exactly one line and no accidental column.
 */
const ROWS_1_TO_3 = Array.from({ length: 15 }, (_, index) => index + 1); // 3 lines
const PLUS_DIAGONAL_1 = [...ROWS_1_TO_3, 19, 25]; // 4 lines
const PLUS_DIAGONAL_2 = [...PLUS_DIAGONAL_1, 17, 21]; // 5 lines

describe('findWinningLines', () => {
  it('finds nothing on an untouched board', () => {
    expect(findWinningLines(ORDERED, [])).toEqual([]);
  });

  it('finds nothing for four of five in a row', () => {
    expect(findWinningLines(ORDERED, [1, 2, 3, 4])).toEqual([]);
  });

  it('finds a complete row', () => {
    const lines = findWinningLines(ORDERED, [1, 2, 3, 4, 5]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ kind: 'row', index: 1 });
    expect(lines[0]?.cells).toEqual([0, 1, 2, 3, 4]);
  });

  it('finds a complete column', () => {
    // Column 1 on the ordered board is 1, 6, 11, 16, 21.
    const lines = findWinningLines(ORDERED, [1, 6, 11, 16, 21]);
    expect(lines[0]).toMatchObject({ kind: 'column', index: 1 });
    expect(lines[0]?.cells).toEqual([0, 5, 10, 15, 20]);
  });

  it('finds the leading diagonal', () => {
    const lines = findWinningLines(ORDERED, [1, 7, 13, 19, 25]);
    expect(lines[0]).toMatchObject({ kind: 'diagonal', index: 1 });
    expect(lines[0]?.cells).toEqual([0, 6, 12, 18, 24]);
  });

  it('finds the other diagonal', () => {
    const lines = findWinningLines(ORDERED, [5, 9, 13, 17, 21]);
    expect(lines[0]).toMatchObject({ kind: 'diagonal', index: 2 });
    expect(lines[0]?.cells).toEqual([4, 8, 12, 16, 20]);
  });

  it('counts overlapping lines separately', () => {
    // Row 1 and column 1 share the corner cell, and both count.
    const lines = findWinningLines(ORDERED, [1, 2, 3, 4, 5, 6, 11, 16, 21]);
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.kind).sort()).toEqual(['column', 'row']);
  });

  it('reports all twelve lines on a full board', () => {
    const everything = Array.from({ length: CARD_SIZE }, (_, index) => index + 1);
    expect(findWinningLines(ORDERED, everything)).toHaveLength(12);
  });
});

describe('hasBingo', () => {
  it('is false for one line, one line is not a win', () => {
    expect(findWinningLines(ORDERED, [1, 2, 3, 4, 5])).toHaveLength(1);
    expect(hasBingo(ORDERED, [1, 2, 3, 4, 5])).toBe(false);
  });

  it('is false at four lines', () => {
    expect(findWinningLines(ORDERED, PLUS_DIAGONAL_1)).toHaveLength(4);
    expect(hasBingo(ORDERED, PLUS_DIAGONAL_1)).toBe(false);
  });

  it('is true at exactly five lines', () => {
    expect(findWinningLines(ORDERED, PLUS_DIAGONAL_2)).toHaveLength(LINES_TO_WIN);
    expect(hasBingo(ORDERED, PLUS_DIAGONAL_2)).toBe(true);
  });

  it('does not need a full board', () => {
    expect(PLUS_DIAGONAL_2.length).toBeLessThan(CARD_SIZE);
    expect(hasBingo(ORDERED, PLUS_DIAGONAL_2)).toBe(true);
  });
});

describe('lettersEarned', () => {
  it('is one letter per completed line', () => {
    expect(lettersEarned(ORDERED, [])).toBe(0);
    expect(lettersEarned(ORDERED, [1, 2, 3, 4, 5])).toBe(1);
    expect(lettersEarned(ORDERED, ROWS_1_TO_3)).toBe(3);
    expect(lettersEarned(ORDERED, PLUS_DIAGONAL_1)).toBe(4);
  });

  it('caps at five, because BINGO has five letters', () => {
    const everything = Array.from({ length: CARD_SIZE }, (_, index) => index + 1);
    expect(BINGO_LETTERS).toHaveLength(LINES_TO_WIN);
    expect(findWinningLines(ORDERED, everything)).toHaveLength(12);
    expect(lettersEarned(ORDERED, everything)).toBe(LINES_TO_WIN);
  });
});

describe('isNumberAvailable', () => {
  it('is true only for a playable number nobody has taken', () => {
    expect(isNumberAvailable(7, [])).toBe(true);
    expect(isNumberAvailable(7, [7])).toBe(false);
    expect(isNumberAvailable(0, [])).toBe(false);
    expect(isNumberAvailable(26, [])).toBe(false);
  });
});

describe('describeLine', () => {
  it('names each kind of line', () => {
    expect(describeLine({ kind: 'row', index: 3, cells: [] })).toBe('Row 3');
    expect(describeLine({ kind: 'column', index: 2, cells: [] })).toBe('Column 2');
    expect(describeLine({ kind: 'diagonal', index: 1, cells: [] })).toBe('Diagonal ↘');
    expect(describeLine({ kind: 'diagonal', index: 2, cells: [] })).toBe('Diagonal ↙');
  });
});
