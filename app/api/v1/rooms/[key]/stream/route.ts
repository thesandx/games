import { type RoomRouteContext, tokenOf } from '@/app/api/v1/respond';
import { logger } from '@/lib/logger';
import { watchRoom } from '@/services/room-store';

// The Firestore SDK uses gRPC and Node APIs, so this handler runs on Node.
export const runtime = 'nodejs';
// A stream is live by definition. Nothing here may be cached or prerendered.
export const dynamic = 'force-dynamic';

/**
 * A comment frame on a quiet room. Proxies and Cloud Run close an idle
 * connection, and a comment is the cheapest thing that stops them.
 */
const HEARTBEAT_MS = 20_000;

/**
 * `GET /api/v1/rooms/{key}/stream`: Server-Sent Events, the full `Room` on
 * every change.
 *
 * The push comes from a Firestore snapshot listener, so a move written by any
 * Cloud Run instance reaches a stream held by any other. The client keeps its
 * two-second poll as the fallback, because a stream can drop silently.
 *
 * The credential is a bearer header, not a query parameter: a token in a URL
 * ends up in access logs and browser history. The client reads this with
 * `fetch`, because `EventSource` cannot set headers.
 *
 * A room that does not exist, or a token that is not in it, is reported as an
 * `event: closed` frame rather than an error status. The client stops
 * reconnecting on that frame and lets its poll render the real answer.
 */
export async function GET(request: Request, context: RoomRouteContext): Promise<Response> {
  const { key } = await context.params;
  const token = tokenOf(request);
  const encoder = new TextEncoder();

  let stop: () => void = () => undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      let unsubscribe: () => void = () => undefined;

      const send = (text: string): void => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch (cause) {
          // The client went away between the check and the write.
          logger.debug('Dropped a frame on a closed room stream', { cause: String(cause) });
          close();
        }
      };

      const frame = (event: string, data: unknown): void =>
        send(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      const heartbeat = setInterval(() => send(': keep-alive\n\n'), HEARTBEAT_MS);

      function close(): void {
        if (!open) return;
        open = false;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed by the runtime when the client disconnected.
          logger.debug('Room stream was already closed');
        }
      }

      stop = close;
      request.signal.addEventListener('abort', close);

      unsubscribe = watchRoom(key, token, {
        room: (room) => frame('room', room),
        closed: (error) => {
          frame('closed', { code: error.code, message: error.message });
          close();
        },
        failed: (error) => {
          // End the stream; the client reconnects with backoff, and its poll
          // carries the room in the meantime.
          logger.error('Room stream listener failed', error, { roomKey: key });
          close();
        },
      });
      // `watchRoom` may have closed synchronously, for an invalid key.
      if (!open) unsubscribe();
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      // Tells buffering proxies not to hold every frame until the end.
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}
