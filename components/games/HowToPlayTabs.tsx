'use client';

import { useState } from 'react';

import { Chip } from '@/components/ui/Chip';
import { HOW_TO_PLAY } from '@/lib/games';
import type { GameId } from '@/types/playroom';

/**
 * Rules, one game at a time.
 *
 * A real tab pattern: the tablist is keyboard-navigable and each panel is
 * associated with its tab, so the relationship is not carried by position
 * alone.
 */
export function HowToPlayTabs({ initialTab }: { initialTab: GameId }) {
  const [active, setActive] = useState<GameId>(initialTab);
  const entry = HOW_TO_PLAY.find((item) => item.id === active) ?? HOW_TO_PLAY[0];

  if (!entry) return null;

  return (
    <>
      <div role="tablist" aria-label="Games" className="mt-5 flex flex-wrap gap-2">
        {HOW_TO_PLAY.map((item) => (
          <Chip
            key={item.id}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={`panel-${item.id}`}
            selected={active === item.id}
            onClick={() => setActive(item.id)}
          >
            {item.title}
          </Chip>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${entry.id}`}
        aria-labelledby={`tab-${entry.id}`}
        className="border-ink-1 rounded-card mt-5 border-2 p-6"
      >
        <h2 className="font-display text-ink-1 text-[26px] leading-tight font-normal">
          {entry.title}
        </h2>
        <p className="text-ink-3 mt-2.5 text-sm leading-relaxed">{entry.intro}</p>
        <ol className="mt-5 flex flex-col gap-3">
          {entry.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="bg-ink-1 flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-medium text-white"
              >
                {index + 1}
              </span>
              <span className="text-ink-2 text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
