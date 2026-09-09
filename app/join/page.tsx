import type { Metadata } from 'next';

import { JoinRoomForm } from '@/components/room/JoinRoomForm';

export const metadata: Metadata = {
  title: 'Join a room',
  description: 'Enter a six-character room key to join a game in progress.',
};

/**
 * Accepts `?key=PLZ4K9` so the lobby's "Copy link" lands someone here with the
 * key already filled in — they only pick a nickname.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  return (
    <section className="flex justify-center px-5 py-7 sm:py-11 lg:py-16">
      <JoinRoomForm initialKey={key ?? ''} />
    </section>
  );
}
