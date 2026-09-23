import { handle, roomResponse, type RoomRouteContext, tokenOf } from '@/app/api/v1/respond';
import { replay } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/** `POST /api/v1/rooms/{key}/replay`: starts over in the same room, keeping the players and zeroing scores. Host only. */
export async function POST(request: Request, context: RoomRouteContext): Promise<Response> {
  const { key } = await context.params;
  return handle('replay session', async () => roomResponse(await replay(key, tokenOf(request))));
}
