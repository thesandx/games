import { cn } from '@/lib/utils';

export interface RoomKeyDisplayProps {
  roomKey: string;
  /** `dark` is the near-black plaque; `light` is the lobby's white chip. */
  tone?: 'dark' | 'light';
  label?: string;
  className?: string;
}

/**
 * The six-character key, letter-spaced and set large.
 *
 * The key is read aloud and typed by hand, so it is rendered as one string with
 * an `aria-label` that spells it out — "P L Z 4 K 9" — instead of leaving a
 * screen reader to pronounce "plzfourkaynine".
 */
export function RoomKeyDisplay({ roomKey, tone = 'dark', label, className }: RoomKeyDisplayProps) {
  return (
    <div
      className={cn(
        'rounded-card text-center',
        tone === 'dark' ? 'bg-ink-1 px-5 py-5' : 'bg-white px-5 py-4',
        className,
      )}
    >
      {label ? (
        <span className={cn('block text-sm', tone === 'dark' ? 'text-white/70' : 'text-ink-3')}>
          {label}
        </span>
      ) : null}
      <span
        aria-label={`Room key ${roomKey.split('').join(' ')}`}
        className={cn(
          'font-display mt-1.5 block text-[clamp(1.75rem,7vw,2.5rem)] leading-none font-medium tracking-[0.375rem]',
          tone === 'dark' ? 'text-white' : 'text-ink-1',
        )}
      >
        {roomKey}
      </span>
    </div>
  );
}
