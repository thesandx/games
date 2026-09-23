import { PlayerAvatar } from '@/components/room/PlayerAvatar';
import { Card } from '@/components/ui/Card';
import type { Player } from '@/types/playroom';

export interface PlayerListProps {
  players: readonly Player[];
  maxPlayers: number;
}

/**
 * The lobby's player list.
 *
 * The dashed "Waiting for more" slot is shown only while there is room left,
 * so a full lobby does not advertise space it does not have.
 */
export function PlayerList({ players, maxPlayers }: PlayerListProps) {
  return (
    <Card flat className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-heading">Players</h2>
        <span className="text-small text-ink-soft">
          {players.length} of {maxPlayers}
        </span>
      </div>
      <ul className="flex flex-wrap gap-3">
        {players.map((player) => (
          <li
            key={player.id}
            className="border-line bg-surface rounded-pill flex min-w-0 items-center gap-2 border-2 py-1 pr-4 pl-1"
          >
            <PlayerAvatar player={player} size="sm" />
            <span className="truncate font-medium">{player.name}</span>
            {player.isHost ? <span className="text-small text-ink-soft">host</span> : null}
          </li>
        ))}
        {players.length < maxPlayers ? (
          <li className="border-line text-ink-soft rounded-pill flex min-h-11 items-center border-2 border-dashed px-4">
            Waiting for more
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
