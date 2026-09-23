import { PlayerAvatar } from '@/components/room/PlayerAvatar';
import { cn } from '@/lib/utils';
import type { AvatarColor } from '@/types/playroom';

export interface ScoreTableRow {
  id: string;
  name: string;
  color: AvatarColor;
  /** Secondary text, e.g. `Two lines` or `Host`. */
  note: string;
  /** Right-aligned figure. Pre-formatted, so `+120` and `340` both work. */
  value: string;
}

/**
 * The ranked list shared by the round-results and final-scoreboard screens.
 * Rows are separated by a 2px `sunken` rule: outlines stay 2px, and the ink
 * outline is kept for the table's own edge.
 */
export function ScoreTable({ rows, caption }: { rows: readonly ScoreTableRow[]; caption: string }) {
  return (
    <div className="border-line bg-surface rounded-card overflow-x-auto border-2">
      <table className="w-full border-separate border-spacing-0">
        <caption className="sr-only">{caption}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Player</th>
            <th scope="col">Detail</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const cell = cn('py-3 align-middle', index > 0 && 'border-sunken border-t-2');
            return (
              <tr key={row.id}>
                <td className={cn(cell, 'text-small text-ink-soft w-12 pl-4 tabular-nums')}>
                  #{index + 1}
                </td>
                <td className={cell}>
                  <span className="flex min-w-0 items-center gap-3">
                    <PlayerAvatar player={row} />
                    <span className="truncate font-medium">{row.name}</span>
                  </span>
                </td>
                <td className={cn(cell, 'text-small text-ink-soft px-4 text-right')}>{row.note}</td>
                <td className={cn(cell, 'font-display pr-4 text-right tabular-nums')}>
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
