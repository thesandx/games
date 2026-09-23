import { handle, roomResponse, type RoomRouteContext, tokenOf } from '@/app/api/v1/respond';
import { lock } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/** `POST /api/v1/rooms/{key}/lock`: closes the room to new players. Host only. */
export async function POST(request: Request, context: RoomRouteContext): Promise<Response> {
  const { key } = await context.params;
  return handle('lock room', async () => roomResponse(await lock(key, tokenOf(request))));
}
