import { describe, expect, it } from 'vitest';

import {
  availableNumbers,
  CARD_SIZE,
  createCard,
  describeLine,
  findWinningLine,
  findWinningLines,
  GRID_SIZE,
  hasBingo,
  HIGHEST_NUMBER,
  isPlayableNumber,
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

  it('has no empty cell — there is no free square', () => {
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

describe('findWinningLine', () => {
  it('finds nothing on an untouched board', () => {
    expect(findWinningLine(ORDERED, [])).toBeNull();
    expect(hasBingo(ORDERED, [])).toBe(false);
  });

  it('finds nothing for four of five in a row', () => {
    expect(findWinningLine(ORDERED, [1, 2, 3, 4])).toBeNull();
  });

  it('finds a complete row', () => {
    const line = findWinningLine(ORDERED, [1, 2, 3, 4, 5]);
    expect(line).toMatchObject({ kind: 'row', index: 1 });
    expect(line?.cells).toEqual([0, 1, 2, 3, 4]);
  });

  it('finds a complete column', () => {
    // Column 1 on the ordered board is 1, 6, 11, 16, 21.
    const line = findWinningLine(ORDERED, [1, 6, 11, 16, 21]);
    expect(line).toMatchObject({ kind: 'column', index: 1 });
    expect(line?.cells).toEqual([0, 5, 10, 15, 20]);
  });

  it('finds the leading diagonal', () => {
    // 1, 7, 13, 19, 25 at indices 0, 6, 12, 18, 24.
    const line = findWinningLine(ORDERED, [1, 7, 13, 19, 25]);
    expect(line).toMatchObject({ kind: 'diagonal', index: 1 });
    expect(line?.cells).toEqual([0, 6, 12, 18, 24]);
  });

  it('finds the other diagonal', () => {
    // 5, 9, 13, 17, 21 at indices 4, 8, 12, 16, 20.
    const line = findWinningLine(ORDERED, [5, 9, 13, 17, 21]);
    expect(line).toMatchObject({ kind: 'diagonal', index: 2 });
    expect(line?.cells).toEqual([4, 8, 12, 16, 20]);
  });

  it('does not need a full card', () => {
    expect(hasBingo(ORDERED, [1, 2, 3, 4, 5])).toBe(true);
  });
});

describe('findWinningLines', () => {
  it('reports every completed line, not just the first', () => {
    // Row 1 plus column 1 share the corner: 1,2,3,4,5 and 1,6,11,16,21.
    const lines = findWinningLines(ORDERED, [1, 2, 3, 4, 5, 6, 11, 16, 21]);
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.kind).sort()).toEqual(['column', 'row']);
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
