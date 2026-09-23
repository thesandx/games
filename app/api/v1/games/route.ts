import { NextResponse } from 'next/server';

import { GAMES } from '@/lib/games';

/**
 * `GET /api/v1/games`: the public catalogue.
 *
 * Served from `lib/games.ts`, the same list the browse screen renders, so the
 * two cannot disagree. `playable` is set only where an engine exists.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    GAMES.map((game) => ({
      id: game.id,
      name: game.name,
      status: game.status,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
    })),
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
