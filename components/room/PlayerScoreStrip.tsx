import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { Player } from '@/types/playroom';

/**
 * The horizontal player rail shown during play.
 *
 * Scrolls inside its own container so a room of twenty never pushes the page
 * into horizontal scroll on a phone. The player on turn is outlined and says so
 * in text, rather than being marked by the outline alone.
 */
export function PlayerScoreStrip({
  players,
  currentTurnId,
}: {
  players: readonly Player[];
  currentTurnId?: string | null;
}) {
  return (
    <ul className="flex gap-2.5 overflow-x-auto py-4">
      {players.map((player) => (
        <li
          key={player.id}
          className={cn(
            'rounded-pill flex flex-none items-center gap-2 border-2 py-2 pr-3.5 pl-2',
            player.id === currentTurnId ? 'border-ink-1 bg-mint' : 'border-ink-1',
          )}
        >
          <Avatar initial={player.initial} color={player.color} name={player.name} size="sm" />
          <span className="text-ink-2 text-sm whitespace-nowrap">{player.name}</span>
          {player.id === currentTurnId ? <span className="sr-only">, on turn</span> : null}
          <span className="text-ink-1 text-sm font-medium">{player.score}</span>
        </li>
      ))}
    </ul>
  );
}
