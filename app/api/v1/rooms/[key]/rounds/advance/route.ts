import { handle, roomResponse, type RoomRouteContext, tokenOf } from '@/app/api/v1/respond';
import { advanceRound } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/** `POST /api/v1/rooms/{key}/rounds/advance`: deals the next round, or ends the session at the configured count. Host only. */
export async function POST(request: Request, context: RoomRouteContext): Promise<Response> {
  const { key } = await context.params;
  return handle('advance round', async () =>
    roomResponse(await advanceRound(key, tokenOf(request))),
  );
}
