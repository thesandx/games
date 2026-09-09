/**
 * Bingo rules — pure functions, no I/O, no randomness the caller cannot control.
 *
 * The board is a 5x5 grid holding the numbers 1 to 25, each exactly once,
 * shuffled independently for every player. There is no free square: all 25
 * cells carry a number.
 *
 * Play is turn-based and player-driven. On their turn a player picks any number
 * that has not been taken; that number is then marked on EVERY board in the
 * room, wherever it appears. Nobody marks their own cells.
 *
 * A player wins with any complete row, column, or diagonal — twelve lines in
 * total. Filling the whole card is not required.
 *
 * Cells are stored row-major, so index `i` sits at row `i / 5` and column
 * `i % 5` — the same order the 5-column CSS grid renders them in.
 */

export const GRID_SIZE = 5;
export const CARD_SIZE = GRID_SIZE * GRID_SIZE;
/** Numbers run 1..25, and every one of them appears on every board. */
export const LOWEST_NUMBER = 1;
export const HIGHEST_NUMBER = CARD_SIZE;

/** A board: 25 cells holding 1..25 in a per-player random order. */
export type BingoCard = readonly number[];

export type LineKind = 'row' | 'column' | 'diagonal';

export interface WinningLine {
  kind: LineKind;
  /** Row/column number (1-based), or 1 and 2 for the two diagonals. */
  index: number;
  /** The five cell indices that make up the line. */
  cells: readonly number[];
}

/** Returns a random integer in [0, max). */
function defaultRandom(max: number): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  // Rejection-free modulo is fine here: the bias over a 32-bit range for a
  // max of at most 25 is far below anything a party game could notice.
  return (buffer[0] ?? 0) % max;
}

/** Injectable source of randomness so tests can be deterministic. */
export type RandomInt = (max: number) => number;

/**
 * Deals one board: the numbers 1..25 in a random order.
 *
 * Fisher-Yates, so every arrangement is equally likely and — because the pool
 * is a permutation of 1..25 — every number appears exactly once by construction
 * rather than by a uniqueness check afterwards.
 */
export function createCard(random: RandomInt = defaultRandom): BingoCard {
  const cells = Array.from({ length: CARD_SIZE }, (_, index) => index + LOWEST_NUMBER);

  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swap = random(index + 1);
    const current = cells[index] as number;
    cells[index] = cells[swap] as number;
    cells[swap] = current;
  }

  return cells;
}

/** Builds the twelve winning lines once, at module load. */
function buildLines(): readonly WinningLine[] {
  const lines: WinningLine[] = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    lines.push({
      kind: 'row',
      index: row + 1,
      cells: Array.from({ length: GRID_SIZE }, (_, column) => row * GRID_SIZE + column),
    });
  }

  for (let column = 0; column < GRID_SIZE; column += 1) {
    lines.push({
      kind: 'column',
      index: column + 1,
      cells: Array.from({ length: GRID_SIZE }, (_, row) => row * GRID_SIZE + column),
    });
  }

  lines.push({
    kind: 'diagonal',
    index: 1,
    cells: Array.from({ length: GRID_SIZE }, (_, step) => step * GRID_SIZE + step),
  });
  lines.push({
    kind: 'diagonal',
    index: 2,
    cells: Array.from(
      { length: GRID_SIZE },
      (_, step) => step * GRID_SIZE + (GRID_SIZE - 1 - step),
    ),
  });

  return lines;
}

export const WINNING_LINES = buildLines();

/** True when a number is within the playable range. */
export function isPlayableNumber(value: number): boolean {
  return Number.isInteger(value) && value >= LOWEST_NUMBER && value <= HIGHEST_NUMBER;
}

/**
 * Every number not yet taken. The turn UI renders this as the pickable set, and
 * the engine checks against it before accepting a selection.
 */
export function availableNumbers(selected: readonly number[]): readonly number[] {
  const taken = new Set(selected);
  const available: number[] = [];
  for (let value = LOWEST_NUMBER; value <= HIGHEST_NUMBER; value += 1) {
    if (!taken.has(value)) available.push(value);
  }
  return available;
}

/**
 * Cell indices that are marked on this board.
 *
 * Marking is derived from the globally selected numbers rather than stored per
 * player, which is what makes every board agree by construction — there is no
 * per-player mark state that could drift out of sync.
 */
export function markedCells(card: BingoCard, selected: readonly number[]): readonly number[] {
  const taken = new Set(selected);
  const marked: number[] = [];
  card.forEach((value, index) => {
    if (taken.has(value)) marked.push(index);
  });
  return marked;
}

/** Every complete line on this board, given what has been selected. */
export function findWinningLines(
  card: BingoCard,
  selected: readonly number[],
): readonly WinningLine[] {
  const taken = new Set(selected);
  return WINNING_LINES.filter((line) =>
    line.cells.every((cell) => {
      const value = card[cell];
      return value !== undefined && taken.has(value);
    }),
  );
}

/**
 * The line a claim is awarded for, or `null` when the board has none.
 *
 * This is the whole of bingo validation: it reads only the board and the
 * globally selected numbers, so a client cannot manufacture a win by sending
 * its own idea of which cells are marked.
 */
export function findWinningLine(card: BingoCard, selected: readonly number[]): WinningLine | null {
  return findWinningLines(card, selected)[0] ?? null;
}

/** True when this board has at least one complete row, column or diagonal. */
export function hasBingo(card: BingoCard, selected: readonly number[]): boolean {
  return findWinningLine(card, selected) !== null;
}

/** Human-readable name for a line, e.g. `Row 3` or `Diagonal ↘`. */
export function describeLine(line: WinningLine): string {
  if (line.kind === 'row') return `Row ${line.index}`;
  if (line.kind === 'column') return `Column ${line.index}`;
  return line.index === 1 ? 'Diagonal ↘' : 'Diagonal ↙';
}
