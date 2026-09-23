import { NextResponse } from 'next/server';

import { handle, overLimit, readBody } from '@/app/api/v1/respond';
import { createLimiter } from '@/lib/rate-limit';
import { createRoomSchema } from '@/lib/room-http';
import { createRoom } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/**
 * `POST /api/v1/rooms`: opens a room and mints the host's identity.
 *
 * `playerToken` is returned here and never again. It is not in the room
 * payload, and a player who loses it rejoins as somebody new.
 */
export async function POST(request: Request): Promise<Response> {
  const limited = overLimit(createLimiter, request);
  if (limited) return limited;

  const body = await readBody(request, createRoomSchema);
  if (body instanceof Response) return body;

  return handle('create room', async () =>
    NextResponse.json(await createRoom(body), {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    }),
  );
}
