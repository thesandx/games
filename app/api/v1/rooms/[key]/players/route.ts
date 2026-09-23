import { NextResponse } from 'next/server';

import { handle, overLimit, readBody, type RoomRouteContext } from '@/app/api/v1/respond';
import { joinLimiter } from '@/lib/rate-limit';
import { joinRoomSchema } from '@/lib/room-http';
import { joinRoom } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/** `POST /api/v1/rooms/{key}/players`: joins a room and mints that player's identity. */
export async function POST(request: Request, context: RoomRouteContext): Promise<Response> {
  const limited = overLimit(joinLimiter, request);
  if (limited) return limited;

  const { key } = await context.params;
  const body = await readBody(request, joinRoomSchema);
  if (body instanceof Response) return body;

  return handle('join room', async () =>
    NextResponse.json(await joinRoom(key, body), {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    }),
  );
}
