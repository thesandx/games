import { BINGO_LETTERS, LINES_TO_WIN } from '@/lib/bingo';
import { cn } from '@/lib/utils';

export interface BingoProgressProps {
  /** Completed lines so far, capped at five by the caller. */
  earned: number;
  className?: string;
}

/**
 * Each letter keeps its own colour, so B is always peach and O is always coral.
 * A colour picked at random per render would reshuffle on every state change
 * and read as a glitch; a fixed mapping lets a player recognise how far along
 * they are at a glance. O lands on the signature coral as the payoff letter.
 */
const LETTER_TONE = [
  'bg-peach border-ink-1 text-ink-1',
  'bg-mint border-ink-1 text-ink-1',
  'bg-yellow border-ink-1 text-ink-1',
  'bg-mustard border-ink-1 text-ink-1',
  'bg-coral border-ink-1 text-white',
] as const;

/**
 * The B-I-N-G-O letters, one per completed line.
 *
 * The win is cumulative — five lines, not one — so a player needs to see how
 * far along they are. The letters are the game's own scorekeeping device, and
 * they say what "five lines" means without a sentence of explanation.
 *
 * The count is also given as text, because a filled letter is a colour
 * difference and colour alone is not a signal.
 */
export function BingoProgress({ earned, className }: BingoProgressProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <ul className="flex gap-1.5" aria-hidden="true">
        {BINGO_LETTERS.map((letter, index) => (
          <li
            key={letter}
            className={cn(
              'font-display rounded-cell flex h-11 w-11 items-center justify-center border-2 text-xl leading-none font-medium transition-colors',
              index < earned
                ? (LETTER_TONE[index] ?? LETTER_TONE[0])
                : 'border-neutral-500 text-ink-3 bg-white',
            )}
          >
            {letter}
          </li>
        ))}
      </ul>
      <p className="text-ink-3 text-sm">
        {earned} of {LINES_TO_WIN} lines
        {earned >= LINES_TO_WIN ? ' — you can call bingo' : ''}
      </p>
    </div>
  );
}
