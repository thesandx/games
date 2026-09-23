import { NextResponse } from 'next/server';

import { handle, type RoomRouteContext, tokenOf } from '@/app/api/v1/respond';
import { etagMatches, roomEtag } from '@/lib/room-http';
import { readRoom } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// Live data on every request. A cached room is a wrong room.
export const dynamic = 'force-dynamic';

/**
 * `GET /api/v1/rooms/{key}`: reads a room, scoped to the caller.
 *
 * Auth is optional but it changes the answer. A valid token gets that player's
 * board; no token is a spectator and gets none until the winner is revealed.
 *
 * Every client polls this every two seconds, so an unchanged room answers
 * `304` without being serialised. The validator carries the viewer as well as
 * the version, because two callers of one version get different boards.
 */
export async function GET(request: Request, context: RoomRouteContext): Promise<Response> {
  const { key } = await context.params;
  const ifNoneMatch = request.headers.get('if-none-match');

  return handle('read room', async () => {
    const read = await readRoom(key, tokenOf(request), (version, viewerId) =>
      etagMatches(ifNoneMatch, roomEtag(version, viewerId)),
    );

    const headers = {
      ETag: roomEtag(read.version, read.viewerId),
      // `no-cache`, not `no-store`. The browser may keep this response but
      // must revalidate before reusing it, which is the poll's semantics and
      // lets the browser send `If-None-Match` on its own. See getRoom in
      // services/playroom-api.ts.
      'Cache-Control': 'private, no-cache',
      // Two players read one URL with different tokens and get different
      // boards. Without this the browser cache could serve one to the other.
      Vary: 'Authorization',
    };

    if (read.kind === 'not-modified') return new Response(null, { status: 304, headers });
    return NextResponse.json(read.room, { headers });
  });
}
