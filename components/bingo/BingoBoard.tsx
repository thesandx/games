'use client';

import { GRID_SIZE } from '@/lib/bingo';
import { cn } from '@/lib/utils';
import type { BingoCard, WinningLine } from '@/types/playroom';

export interface BingoBoardProps {
  card: BingoCard;
  /** Numbers taken so far. A cell is marked when its number is in here. */
  selected: readonly number[];
  /** Completed lines to highlight. Empty for a board with none. */
  winningLines?: readonly WinningLine[];
  /** Accessible name, e.g. "Your board" or "Dev's board". */
  label: string;
  /**
   * Supplied only for the player's own board. The board IS the picker: there
   * is no separate number pad, because every board already holds all 25
   * numbers. Tapping a free cell takes that number for the whole room.
   */
  onPick?: (value: number) => void;
  /** False when it is somebody else's turn, or the round is over. */
  canPick?: boolean;
  /** Smaller type and tighter gaps, for the other-players grid. */
  compact?: boolean;
  className?: string;
}

/**
 * A player's 5x5 board.
 *
 * Marking is derived from the globally taken numbers, never stored per player
 * and never toggled by hand. That is what guarantees every board in the room
 * agrees without any synchronisation step.
 *
 * Rendered as a table because the structure carries meaning: wins are rows,
 * columns and diagonals, so a screen-reader user needs the grid, not a flat
 * list of 25 numbers.
 */
export function BingoBoard({
  card,
  selected,
  winningLines = [],
  label,
  onPick,
  canPick = false,
  compact = false,
  className,
}: BingoBoardProps) {
  const taken = new Set(selected);
  const winning = new Set(winningLines.flatMap((line) => line.cells));
  const interactive = onPick !== undefined;

  const rows = Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, column) => row * GRID_SIZE + column),
  );

  const cellBase = cn(
    'font-display flex aspect-square w-full items-center justify-center rounded-cell border-2 leading-none font-medium',
    compact ? 'text-[clamp(0.5rem,2vw,0.75rem)]' : 'text-[clamp(0.875rem,3.4vw,1.25rem)]',
  );

  return (
    <table
      className={cn(
        'border-ink-1 rounded-card w-full table-fixed border-separate border-2',
        compact ? 'border-spacing-[3px] p-1.5' : 'border-spacing-1.5 p-4',
        className,
      )}
    >
      <caption className="sr-only">{label}</caption>
      <tbody>
        {rows.map((cells, rowIndex) => (
          <tr key={rowIndex}>
            {cells.map((index) => {
              const value = card[index];
              const marked = value !== undefined && taken.has(value);
              const isWinning = winning.has(index);
              const pickable = interactive && canPick && !marked && value !== undefined;

              const tone = isWinning
                ? 'bg-yellow border-ink-1 text-ink-1'
                : marked
                  ? 'bg-ink-1 border-ink-1 text-white'
                  : pickable
                    ? 'bg-white border-ink-1 text-ink-1 active:bg-mint cursor-pointer'
                    : 'bg-neutral-50 border-neutral-500 text-ink-3';

              return (
                <td key={index} className="p-0">
                  {pickable ? (
                    <button
                      type="button"
                      onClick={() => onPick(value)}
                      aria-label={`Take ${value}`}
                      className={cn(cellBase, tone)}
                    >
                      {value}
                    </button>
                  ) : (
                    <span className={cn(cellBase, tone, interactive && 'cursor-not-allowed')}>
                      <span aria-hidden="true">{value}</span>
                      <span className="sr-only">
                        {value}
                        {isWinning
                          ? ', taken, part of a completed line'
                          : marked
                            ? ', taken'
                            : ', free'}
                      </span>
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
