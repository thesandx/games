import { PlayerAvatar } from '@/components/room/PlayerAvatar';
import { cn } from '@/lib/utils';
import type { Player } from '@/types/playroom';

/**
 * The horizontal player rail shown during play.
 *
 * Scrolls inside its own container so a full room never pushes the page into
 * horizontal scroll on a phone. The player on turn gets a brand fill AND a
 * surprised face, and says so in text for a screen reader, so the turn never
 * rests on colour alone.
 */
export function PlayerScoreStrip({
  players,
  currentTurnId,
}: {
  players: readonly Player[];
  currentTurnId?: string | null;
}) {
  return (
    <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 py-2">
      {players.map((player) => {
        const onTurn = player.id === currentTurnId;
        return (
          <li
            key={player.id}
            className={cn(
              'border-line rounded-pill flex flex-none items-center gap-2 border-2 py-1 pr-4 pl-1',
              onTurn ? 'bg-brand-soft' : 'bg-surface',
            )}
          >
            <PlayerAvatar player={player} size="sm" {...(onTurn ? { mood: 'wow' as const } : {})} />
            <span className="whitespace-nowrap">{player.name}</span>
            {onTurn ? <span className="sr-only">, on turn</span> : null}
            <span className="font-display tabular-nums">{player.score}</span>
          </li>
        );
      })}
    </ul>
  );
}
