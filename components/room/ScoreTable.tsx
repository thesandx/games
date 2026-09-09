import { Avatar } from '@/components/ui/Avatar';
import type { AvatarColor } from '@/types/playroom';

export interface ScoreTableRow {
  id: string;
  name: string;
  initial: string;
  color: AvatarColor;
  /** Secondary text, e.g. `Two lines` or `3 wins`. */
  note: string;
  /** Right-aligned figure. Pre-formatted, so `+120` and `340` both work. */
  value: string;
  /** Renders the value in the success green used for round gains. */
  positive?: boolean;
}

/** The ranked list shared by the round-results and final-scoreboard screens. */
export function ScoreTable({ rows, caption }: { rows: readonly ScoreTableRow[]; caption: string }) {
  return (
    <table className="border-ink-1 rounded-card w-full border-separate border-spacing-0 overflow-hidden border-2">
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
        {rows.map((row, index) => (
          <tr key={row.id}>
            <td className="border-b border-hairline px-4 py-3.5 align-middle">
              <span className="text-ink-3 text-sm">#{index + 1}</span>
            </td>
            <td className="border-b border-hairline py-3.5 align-middle">
              <span className="flex items-center gap-3">
                <Avatar initial={row.initial} color={row.color} name={row.name} />
                <span className="text-ink-1 truncate text-sm font-medium">{row.name}</span>
              </span>
            </td>
            <td className="border-b border-hairline px-4 py-3.5 text-right align-middle">
              <span className="text-ink-3 text-sm">{row.note}</span>
            </td>
            <td className="border-b border-hairline px-4 py-3.5 text-right align-middle">
              <span
                className={
                  row.positive
                    ? 'text-success text-sm font-medium'
                    : 'text-ink-1 text-sm font-medium'
                }
              >
                {row.value}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
