'use client';

import { useEffect, useState } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { Player } from '@/types/playroom';

export interface TurnBannerProps {
  current: Player | undefined;
  isYourTurn: boolean;
  /**
   * Seconds left on this turn, or `null` when nothing is on the clock. Comes
   * from the server and is re-sent on every read, so the count below is only
   * ever a smoothing of a value the server owns.
   */
  secondsRemaining?: number | null;
  /** What went last, and who took it. Omit before anybody has taken one. */
  lastPick?: { name: string; value: number; isYou: boolean } | null;
  className?: string;
}

/** Below this the count reads as urgent rather than informational. */
const NEARLY_UP = 5;

/**
 * Whose turn it is, and how long they have left.
 *
 * The count ticks locally between reads rather than stepping down two seconds
 * at a time as the poll lands. It is anchored to the server's number every time
 * that number changes, so it can drift by at most one poll interval and cannot
 * disagree about whether the turn has actually run out. The server decides
 * that, and it decides it for players whose browser is not there to be asked.
 */
export function TurnBanner({
  current,
  isYourTurn,
  secondsRemaining = null,
  lastPick = null,
  className,
}: TurnBannerProps) {
  // Only the ticked value is state. Render stays pure, reading a clock during
  // render is not, and the React compiler is right to refuse it.
  const [remaining, setRemaining] = useState<number | null>(secondsRemaining);

  useEffect(() => {
    if (secondsRemaining === null) return;

    const deadline = Date.now() + secondsRemaining * 1000;
    const update = (): void => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));

    // The first correction is scheduled rather than called inline, which keeps
    // the effect body free of state updates, the same reason `useRoom`
    // schedules its first read instead of making it.
    const first = window.setTimeout(update, 0);
    // Four times a second, so the number never appears to skip one.
    const timer = window.setInterval(update, 250);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [secondsRemaining]);

  // The prop decides whether there is a clock at all; the state only smooths
  // it. A stale count from a previous turn can never be shown after the round
  // has stopped having one.
  const shown = secondsRemaining === null ? null : (remaining ?? secondsRemaining);

  return (
    <div
      className={cn(
        'rounded-card flex flex-wrap items-center gap-3 border-2 p-4',
        isYourTurn ? 'bg-mint border-ink-1' : 'bg-cream border-ink-1',
        className,
      )}
    >
      {current ? (
        <Avatar initial={current.initial} color={current.color} name={current.name} />
      ) : null}
      {/*
        The live region is the sentence, not the whole banner. A count that
        changes every second inside `aria-live` would announce itself over and
        over and bury the thing that actually changed.
      */}
      {/*
        Both lines sit inside the live region, and the countdown does not. They
        change together, once a turn, so they announce as one sentence. The
        count changes every second and would bury them.
      */}
      <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-0.5">
        <span className="font-display text-ink-1 text-lg leading-tight font-medium">
          {current === undefined
            ? 'Waiting for the next turn'
            : isYourTurn
              ? 'Your turn: pick a number'
              : `${current.name}'s turn`}
        </span>
        {lastPick ? (
          <span className="text-ink-3 text-sm">
            {lastPick.isYou ? 'You took' : `${lastPick.name} took`}{' '}
            <span className="text-ink-1 font-medium tabular-nums">{lastPick.value}</span>
          </span>
        ) : null}
      </div>

      {shown !== null ? (
        <span
          aria-hidden="true"
          className={cn(
            'font-display ml-auto text-lg leading-none font-medium tabular-nums',
            shown <= NEARLY_UP ? 'text-coral' : 'text-ink-3',
          )}
        >
          {shown}s
        </span>
      ) : null}
    </div>
  );
}
