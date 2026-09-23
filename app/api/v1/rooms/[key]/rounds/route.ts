import { handle, roomResponse, type RoomRouteContext, tokenOf } from '@/app/api/v1/respond';
import { startRound } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/** `POST /api/v1/rooms/{key}/rounds`: deals a board to every player and starts the round. Host only. */
export async function POST(request: Request, context: RoomRouteContext): Promise<Response> {
  const { key } = await context.params;
  return handle('start round', async () => roomResponse(await startRound(key, tokenOf(request))));
}
