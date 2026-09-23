import type { Metadata } from 'next';

import { JoinRoomForm } from '@/components/room/JoinRoomForm';

export const metadata: Metadata = {
  title: 'Join a room',
  description: 'Enter a six-character room key to join a game.',
};

/**
 * Accepts `?key=PLZ4K9` so the home page's key form and the lobby's "Copy
 * link" land someone here with the key already filled in. They only pick a
 * nickname.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <JoinRoomForm initialKey={key ?? ''} />
    </div>
  );
}
