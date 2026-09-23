import Link from 'next/link';

import { buttonStyles, type ButtonVariant } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { GameDefinition } from '@/lib/games';
import { cn } from '@/lib/utils';

export interface GameCardProps {
  game: GameDefinition;
  /** The card's title level, so it fits the outline of the page it sits on. */
  headingLevel?: 'h2' | 'h3';
  /**
   * `primary` only where this card holds the one main action of the screen.
   * See design-language.md rule 7.
   */
  createVariant?: Extract<ButtonVariant, 'primary' | 'secondary'>;
  className?: string;
}

/**
 * A game on the browse screen.
 *
 * The card takes the game's own candy tone: colour here means "this game", not
 * decoration. It sits flat, because the buttons inside it are the things you
 * press.
 *
 * A `building` game says it is not playable instead of offering a create
 * button. That is a deliberate dead end: routing someone into a room for a game
 * with no rules implemented would strand them in a lobby that can never start.
 */
export function GameCard({
  game,
  headingLevel: Heading = 'h2',
  createVariant = 'secondary',
  className,
}: GameCardProps) {
  const playable = game.status === 'playable';

  return (
    <Card as="article" tone={game.tone} flat className={cn(className)}>
      <div className="flex h-full flex-col gap-4">
        <span className="border-line bg-surface rounded-pill text-small self-start border-2 px-3 font-medium">
          {game.tag}
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <Heading className="text-title">{game.name}</Heading>
          <p className="max-w-prose">{game.description}</p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          <div className="flex gap-1.5">
            <dt className="font-medium">Players</dt>
            <dd>{game.players}</dd>
          </div>
          {game.duration !== null ? (
            <div className="flex gap-1.5">
              <dt className="font-medium">Time</dt>
              <dd>{game.duration}</dd>
            </div>
          ) : null}
        </dl>

        {playable ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href={{ pathname: '/create', query: { game: game.id } }}
              className={buttonStyles({ variant: createVariant })}
            >
              Create room
            </Link>
            <Link href="/how-to-play" className={buttonStyles({ variant: 'quiet' })}>
              Rules
            </Link>
          </div>
        ) : (
          <p className="font-medium">In build. Not playable yet.</p>
        )}
      </div>
    </Card>
  );
}
