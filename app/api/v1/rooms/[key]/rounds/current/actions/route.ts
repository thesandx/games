import {
  handle,
  overLimit,
  readBody,
  roomResponse,
  type RoomRouteContext,
  tokenOf,
} from '@/app/api/v1/respond';
import { actionLimiter } from '@/lib/rate-limit';
import { actionSchema } from '@/lib/room-http';
import { applyAction } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/**
 * `POST /api/v1/rooms/{key}/rounds/current/actions`: one in-game move.
 *
 * `{ "type": "select_number", "payload": { "value": 17 } }` and
 * `{ "type": "claim_bingo", "payload": {} }` are Bingo's two. One endpoint for
 * every move is what lets a new game arrive without a new route.
 */
export async function POST(request: Request, context: RoomRouteContext): Promise<Response> {
  const limited = overLimit(actionLimiter, request, { perPlayer: true });
  if (limited) return limited;

  const { key } = await context.params;
  const body = await readBody(request, actionSchema);
  if (body instanceof Response) return body;

  return handle('apply action', async () =>
    roomResponse(
      await applyAction(key, tokenOf(request), body, request.headers.get('idempotency-key')),
    ),
  );
}
