'use client';

import { HIGHEST_NUMBER, LOWEST_NUMBER } from '@/lib/bingo';
import { cn } from '@/lib/utils';

export interface NumberPickerProps {
  selected: readonly number[];
  onPick: (value: number) => void;
  /** False when it is somebody else's turn, or the round is over. */
  enabled: boolean;
  busy?: boolean;
}

/**
 * The 1-25 pad a player picks from on their turn.
 *
 * Taken numbers stay visible but disabled rather than disappearing, so the pad
 * does not reflow under someone mid-tap and everyone can see what has gone.
 * Being disabled here is a convenience: the engine rejects an out-of-turn or
 * already-taken pick regardless of what the UI allows.
 */
export function NumberPicker({ selected, onPick, enabled, busy = false }: NumberPickerProps) {
  const taken = new Set(selected);
  const numbers = Array.from(
    { length: HIGHEST_NUMBER - LOWEST_NUMBER + 1 },
    (_, index) => index + LOWEST_NUMBER,
  );

  return (
    <div className="border-ink-1 rounded-card border-2 p-4">
      <h2 className="text-ink-1 mb-1 text-lg font-medium">Pick a number</h2>
      <p className="text-ink-3 mb-3 text-sm">
        {enabled
          ? 'Your pick is marked on every board in the room.'
          : 'You can pick when your turn comes round.'}
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {numbers.map((value) => {
          const isTaken = taken.has(value);
          return (
            <button
              key={value}
              type="button"
              disabled={isTaken || !enabled || busy}
              aria-label={isTaken ? `${value}, already taken` : `Pick ${value}`}
              onClick={() => onPick(value)}
              className={cn(
                'font-display rounded-cell flex aspect-square items-center justify-center border-2 text-[clamp(0.875rem,3.4vw,1.25rem)] leading-none font-medium',
                isTaken
                  ? 'bg-ink-1 border-ink-1 cursor-not-allowed text-white/60'
                  : enabled && !busy
                    ? 'bg-white border-ink-1 text-ink-1 active:bg-mint cursor-pointer'
                    : 'bg-neutral-50 border-neutral-500 text-ink-3 cursor-not-allowed',
              )}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
