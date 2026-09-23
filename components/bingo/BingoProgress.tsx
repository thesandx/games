import { BINGO_LETTERS, LINES_TO_WIN } from '@/lib/bingo';
import { cn } from '@/lib/utils';

export interface BingoProgressProps {
  /** Completed lines so far, capped at five by the caller. */
  earned: number;
  className?: string;
}

/**
 * Each letter keeps its own tone, so B is always peach and O is always
 * strawberry. A colour picked at random per render would reshuffle on every
 * state change and read as a glitch; a fixed mapping lets a player recognise
 * how far along they are at a glance. O lands on the brand tone as the payoff.
 */
const LETTER_TONE = ['bg-peach', 'bg-soda', 'bg-butter', 'bg-grape', 'bg-brand'] as const;

/**
 * The B-I-N-G-O letters, one per completed line.
 *
 * The win is cumulative, five lines, not one, so a player needs to see how
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
              'font-display border-line rounded-input text-heading flex size-11 items-center justify-center border-2 leading-none',
              // An earned letter is filled AND solid; a letter still to come is
              // dashed, so the difference is in the outline as well as the fill.
              index < earned
                ? cn('text-ink', LETTER_TONE[index] ?? LETTER_TONE[0])
                : 'bg-surface text-ink-soft border-dashed',
            )}
          >
            {letter}
          </li>
        ))}
      </ul>
      <p className="text-small text-ink-soft">
        {earned} of {LINES_TO_WIN} lines
        {earned >= LINES_TO_WIN ? '. You can call bingo' : ''}
      </p>
    </div>
  );
}
