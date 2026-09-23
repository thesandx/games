import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateRoomForm } from '@/components/room/CreateRoomForm';
import { buttonStyles } from '@/components/ui/Button';
import { findGame } from '@/lib/games';
import type { GameId } from '@/types/playroom';

export const metadata: Metadata = {
  title: 'Set up your room',
  description: 'Choose a game, set the rounds, and get a key to share.',
};

/**
 * `searchParams` is a Promise in Next 16, so this page is async, which is why
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-16">
      <div className="flex flex-col items-start gap-3">
        <Link href="/games" className={buttonStyles({ variant: 'quiet' })}>
          Back to games
        </Link>
        <h1 className="text-title">Set up your room</h1>
      </div>
      <CreateRoomForm initialGame={initialGame} />
    </div>
  );
}
