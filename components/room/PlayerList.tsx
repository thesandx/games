import { Avatar } from '@/components/ui/Avatar';
import type { Player } from '@/types/playroom';

export interface PlayerListProps {
  players: readonly Player[];
  maxPlayers: number;
}

/**
 * The lobby's player grid.
 *
 * The dashed "Waiting for more…" tile is shown only while there is room left,
 * so a full lobby does not advertise space it does not have.
 */
export function PlayerList({ players, maxPlayers }: PlayerListProps) {
  return (
    <div className="border-ink-1 rounded-card border-2 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-ink-1 text-lg font-medium">Players</h2>
        <span className="text-ink-3 text-sm">
          {players.length} of {maxPlayers}
        </span>
      </div>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <li
            key={player.id}
            className="border-ink-1 rounded-card flex items-center gap-2.5 border-2 p-3"
          >
            <Avatar initial={player.initial} color={player.color} name={player.name} />
            <span className="min-w-0">
              <span className="text-ink-1 block truncate text-sm font-medium">{player.name}</span>
              <span className="text-success block text-sm">{player.isHost ? 'Host' : 'Ready'}</span>
            </span>
          </li>
        ))}
        {players.length < maxPlayers ? (
          <li className="border-ink-1 rounded-card text-ink-3 flex items-center gap-2.5 border-2 border-dashed p-3 text-sm">
            Waiting for more…
          </li>
        ) : null}
      </ul>
    </div>
  );
}
