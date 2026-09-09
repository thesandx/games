import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateRoomForm } from '@/components/room/CreateRoomForm';
import { findGame } from '@/lib/games';
import type { GameId } from '@/types/playroom';

export const metadata: Metadata = {
  title: 'Set up your room',
  description: 'Choose a game, set the rounds, and get a key to share.',
};

/**
 * `searchParams` is a Promise in Next 16, so this page is async — which is why
 * the interactive form lives in its own Client Component rather than here.
 */
export default async function CreateRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const requested = game === undefined ? undefined : findGame(game as GameId);
  const initialGame: GameId = requested?.status === 'playable' ? requested.id : 'bingo';

  return (
    <section className="px-5 py-7 sm:py-11 lg:py-16">
      <div className="mx-auto max-w-[1120px]">
        <Link href="/games" className="text-link text-sm">
          Back to games
        </Link>
        <h1 className="font-display text-ink-1 mt-3 text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-normal">
          Set up your room
        </h1>
        <CreateRoomForm initialGame={initialGame} />
      </div>
    </section>
  );
}
