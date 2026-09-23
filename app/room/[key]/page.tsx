import type { Metadata } from 'next';

import { RoomScreen } from '@/components/room/RoomScreen';
import { normaliseRoomKey } from '@/lib/room-key';

export const metadata: Metadata = {
  title: 'Room',
  // A room is per-session and per-key; there is nothing here to index.
  robots: { index: false, follow: false },
};

export default async function RoomPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <RoomScreen roomKey={normaliseRoomKey(key)} />
    </div>
  );
}
