import { ButtonLink } from '@/components/ui/ButtonLink';
import type { GameDefinition } from '@/lib/games';
import { cn } from '@/lib/utils';

export interface GameCardProps {
  game: GameDefinition;
  className?: string;
}

const SURFACES: Record<GameDefinition['surface'], string> = {
  peach: 'bg-peach',
  mint: 'bg-mint',
  yellow: 'bg-yellow',
  white: 'bg-white',
};

/**
 * A game on the browse screen.
 *
 * A `building` game renders the design's "In build — not playable yet" line
 * instead of a create button. That is a deliberate dead end: routing someone
 * into a room for a game with no rules implemented would strand them in a
 * lobby that can never start.
 */
export function GameCard({ game, className }: GameCardProps) {
  const playable = game.status === 'playable';

  return (
    <div
      className={cn(
        'rounded-card border-ink-1 flex min-h-[220px] flex-col gap-3.5 border-2 p-6',
        SURFACES[game.surface],
        className,
      )}
    >
      <span className="text-ink-1/85 text-sm font-medium tracking-[0.16px] uppercase">
        {game.tag}
      </span>
      <div className="flex-1">
        <h2 className="font-display text-ink-1 text-[26px] leading-tight font-medium">
          {game.name}
        </h2>
        <p className="text-ink-2 mt-2 text-sm leading-relaxed">{game.description}</p>
      </div>
      <span className="text-ink-2 text-sm">{game.meta}</span>

      {playable ? (
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink size="sm" href={{ pathname: '/create', query: { game: game.id } }}>
            Create room
          </ButtonLink>
          <ButtonLink size="sm" variant="secondary" href="/how-to-play">
            Rules
          </ButtonLink>
        </div>
      ) : (
        <span className="text-ink-3 text-sm font-medium">In build — not playable yet</span>
      )}
    </div>
  );
}
