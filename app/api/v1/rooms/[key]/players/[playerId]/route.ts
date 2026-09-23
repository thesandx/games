import { handle, roomResponse, tokenOf } from '@/app/api/v1/respond';
import { removePlayer } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/** `DELETE /api/v1/rooms/{key}/players/{playerId}`: the host removes somebody, or a player leaves. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ key: string; playerId: string }> },
): Promise<Response> {
  const { key, playerId } = await context.params;
  return handle('remove player', async () =>
    roomResponse(await removePlayer(key, tokenOf(request), playerId)),
  );
}
