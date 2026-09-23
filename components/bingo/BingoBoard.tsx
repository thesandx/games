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
  /**
   * The number taken most recently, highlighted so the whole room can see what
   * just happened. Omit outside a live round.
   */
  latest?: number | null;
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
  latest = null,
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
    'font-display border-line text-ink rounded-input flex aspect-square w-full items-center justify-center border-2 leading-none',
    compact ? 'text-small' : 'text-heading',
  );

  return (
    <table
      className={cn(
        'border-line bg-surface rounded-card w-full table-fixed border-separate border-2',
        compact ? 'border-spacing-1 p-1.5' : 'border-spacing-1.5 p-3 sm:p-4',
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
              const isLatest = value !== undefined && value === latest;
              const pickable = interactive && canPick && !marked && value !== undefined;

              // Butter outranks peach on purpose. A completed line is the
              // thing worth seeing, and the line below the board already says
              // which number went last and who took it.
              //
              // A free cell you can take is the only pressable thing on the
              // board, so it is the only one that sits on a base and squishes.
              // Taken cells are filled ink; the screen-reader text below says
              // the same thing in words.
              const tone = isWinning
                ? 'bg-butter'
                : isLatest && marked
                  ? 'bg-peach'
                  : marked
                    ? 'bg-ink text-surface'
                    : pickable
                      ? 'squish bg-surface cursor-pointer'
                      : interactive
                        ? 'bg-sunken border-dashed'
                        : 'bg-surface';

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
                          : isLatest && marked
                            ? ', taken, the most recent number'
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
