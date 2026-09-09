import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { Player } from '@/types/playroom';

export interface TurnBannerProps {
  current: Player | undefined;
  isYourTurn: boolean;
  className?: string;
}

/**
 * Whose turn it is.
 *
 * `aria-live` is on the banner so a turn change is announced rather than
 * silently repainted — a turn-based game is unplayable if you cannot tell when
 * it is your move.
 */
export function TurnBanner({ current, isYourTurn, className }: TurnBannerProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'rounded-card flex flex-wrap items-center gap-3 border-2 p-4',
        isYourTurn ? 'bg-mint border-ink-1' : 'bg-cream border-ink-1',
        className,
      )}
    >
      {current ? (
        <Avatar initial={current.initial} color={current.color} name={current.name} />
      ) : null}
      <span className="font-display text-ink-1 text-lg leading-tight font-medium">
        {current === undefined
          ? 'Waiting for the next turn'
          : isYourTurn
            ? 'Your turn — pick a number'
            : `${current.name}'s turn`}
      </span>
    </div>
  );
}
