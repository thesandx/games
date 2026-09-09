import { GRID_SIZE } from '@/lib/bingo';
import { cn } from '@/lib/utils';
import type { BingoCard, WinningLine } from '@/types/playroom';

export interface BingoBoardProps {
  card: BingoCard;
  /** Numbers taken so far. A cell is marked when its number is in here. */
  selected: readonly number[];
  /** Highlighted once the round is won. */
  winningLine?: WinningLine | null;
  /** Accessible name, e.g. "Your board" or "Dev's board". */
  label: string;
  /** Smaller type and tighter gaps, for the other-players grid. */
  compact?: boolean;
  className?: string;
}

/**
 * A player's 5x5 board.
 *
 * Read-only by design. Marking is derived from the globally selected numbers,
 * never stored per player and never toggled by hand — that is what guarantees
 * every board in the room agrees without any synchronisation step.
 *
 * Rendered as a table because the structure carries meaning: wins are rows,
 * columns and diagonals, so a screen-reader user needs the grid, not a flat
 * list of 25 numbers.
 */
export function BingoBoard({
  card,
  selected,
  winningLine,
  label,
  compact = false,
  className,
}: BingoBoardProps) {
  const taken = new Set(selected);
  const winning = new Set(winningLine?.cells ?? []);

  const rows = Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, column) => row * GRID_SIZE + column),
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

              return (
                <td key={index} className="p-0">
                  <span
                    className={cn(
                      'font-display flex aspect-square items-center justify-center rounded-cell border-2 leading-none font-medium',
                      compact
                        ? 'text-[clamp(0.5rem,2vw,0.75rem)]'
                        : 'text-[clamp(0.875rem,3.4vw,1.25rem)]',
                      isWinning
                        ? 'bg-yellow border-ink-1 text-ink-1'
                        : marked
                          ? 'bg-ink-1 border-ink-1 text-white'
                          : 'bg-neutral-50 border-neutral-500 text-ink-3',
                    )}
                  >
                    {value}
                    {isWinning ? (
                      <span className="sr-only">, marked, part of the winning line</span>
                    ) : marked ? (
                      <span className="sr-only">, marked</span>
                    ) : null}
                  </span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
