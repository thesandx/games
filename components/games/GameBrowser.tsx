'use client';

import { useState } from 'react';

import { GameCard } from '@/components/games/GameCard';
import { Chip } from '@/components/ui/Chip';
import { BROWSE_FILTERS, type BrowseFilter, filterGames } from '@/lib/games';

/**
 * The browse screen's filter row and grid.
 *
 * A Client Component because the filter is local UI state. It is deliberately
 * NOT in the URL, since a filtered game list is not a destination anyone links
 * to or expects the back button to step through.
 */
export function GameBrowser() {
  const [filter, setFilter] = useState<BrowseFilter>('All');
  const games = filterGames(filter);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter games">
        {BROWSE_FILTERS.map((option) => (
          <Chip key={option} selected={filter === option} onClick={() => setFilter(option)}>
            {option}
          </Chip>
        ))}
      </div>

      {games.length === 0 ? (
        <p className="text-ink-3 mt-6 text-sm">No games match that filter yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <li key={game.id}>
              <GameCard game={game} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
