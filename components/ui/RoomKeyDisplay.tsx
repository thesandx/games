import { cn } from '@/lib/utils';

export interface RoomKeyDisplayProps {
  roomKey: string;
  label?: string;
  className?: string;
}

/**
 * The six-character key, letter-spaced and set large.
 *
 * One of the few things the design language centres, and the only uppercase
 * text it allows. See design-language.md > Type and > Layout.
 *
 * The key is read aloud and typed by hand, so it is rendered as one string with
 * an `aria-label` that spells it out, "P L Z 4 K 9", instead of leaving a
 * screen reader to pronounce "plzfourkaynine".
 */
export function RoomKeyDisplay({ roomKey, label, className }: RoomKeyDisplayProps) {
  return (
    <div
      className={cn(
        'border-line bg-surface rounded-card flex flex-col items-center gap-1 border-2 px-5 py-4 text-center',
        className,
      )}
    >
      {label ? <span className="text-small text-ink-soft">{label}</span> : null}
      <span
        aria-label={`Room key ${roomKey.split('').join(' ')}`}
        className="font-display text-key tracking-[0.3em] uppercase"
      >
        {roomKey}
      </span>
    </div>
  );
}
