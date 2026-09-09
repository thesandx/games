import { AVATAR_BG } from '@/lib/players';
import { cn } from '@/lib/utils';
import type { AvatarColor } from '@/types/playroom';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  initial: string;
  color: AvatarColor;
  size?: AvatarSize;
  /** Accessible name. Pass the player's nickname. */
  name: string;
  className?: string;
}

const SIZES: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

/**
 * A player's pastel disc.
 *
 * The initial is decorative — the nickname is almost always rendered beside it,
 * so the disc carries the name in `aria-label` and hides the letter from the
 * accessibility tree rather than reading "R" twice.
 */
export function Avatar({ initial, color, size = 'md', name, className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'text-ink-1 border-ink-1 inline-flex flex-none items-center justify-center rounded-full border-2 font-medium',
        AVATAR_BG[color],
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden="true">{initial}</span>
    </span>
  );
}
