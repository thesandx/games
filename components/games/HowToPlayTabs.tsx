'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/Card';
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
      <div role="tablist" aria-label="Games" className="flex flex-wrap gap-3">
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

      <div role="tabpanel" id={`panel-${entry.id}`} aria-labelledby={`tab-${entry.id}`}>
        <Card flat className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-title">{entry.title}</h2>
            <p className="text-ink-soft max-w-prose">{entry.intro}</p>
          </div>
          {/* A real sequence, so numbered. The numbers are the list's own markers. */}
          <ol className="marker:font-display flex list-decimal flex-col gap-3 pl-6">
            {entry.steps.map((step) => (
              <li key={step} className="max-w-prose pl-1">
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
