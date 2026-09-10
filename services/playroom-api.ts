/**
 * HTTP client for the Playroom rooms API.
 *
 * Base URL comes from `NEXT_PUBLIC_PLAYROOM_API_URL`, which points at the
 * service's `/v1` prefix. This module is the ONLY place that knows the wire
 * format; screens talk to `services/room-transport.ts` instead.
 *
 * The endpoint contract this client expects:
 *
 *   GET    /games                          -> GameSummary[]
 *   POST   /rooms                          -> { room, playerId, playerToken }
 *   GET    /rooms/:key                     -> room            (404 when unknown)
 *   POST   /rooms/:key/players             -> { room, playerId, playerToken }
 *   DELETE /rooms/:key/players/:playerId   -> room
 *   POST   /rooms/:key/rounds              -> room
 *   POST   /rooms/:key/rounds/current/actions -> room   body { type, payload }
 *   POST   /rooms/:key/rounds/advance      -> room
 *   POST   /rooms/:key/lock                -> room
 *   POST   /rooms/:key/end                 -> room
 *   POST   /rooms/:key/replay              -> room
 *   GET    /rooms/:key/stream              -> text/event-stream of rooms
 *
 * Two design points are worth stating because both were different in the first
 * draft of this file and both changed for a reason:
 *
 * **The caller is identified by `Authorization: Bearer <playerToken>`, not by
 * an `X-Player-Id` header.** A player id is public — it is in `hostId`, in
 * `bingo.turnOrder` and on every entry in `players` — so an id-as-credential
 * lets any player in a room act as any other. See `PlayerIdentity`.
 *
 * **Every in-game move goes to one action endpoint** carrying
 * `{ type, payload }`, rather than to a route per move. That is the seam that
 * lets a second game be added without adding routes to this file.
 *
 * The server owns board visibility, turn order, the taken-number set and bingo
 * validation. `bingo.cards` comes back holding only the caller's board — plus
 * the winner's once the round is over — because the server scoped it, not
 * because this client hid anything.
 *
 * A rule violation comes back as 4xx with `{ "code": ..., "message": ... }`
 * where `code` is one of `RoomErrorCode`. That is what lets the UI show
 * "It is not your turn yet" instead of a generic failure.
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { RoomError, type RoomErrorCode } from '@/lib/room-engine';
import type {
  CreateRoomInput,
  JoinedRoom,
  JoinRoomInput,
  PlayerIdentity,
  Room,
  RoomTransport,
} from '@/types/playroom';

/**
 * Every outbound call is bounded. An unbounded fetch inside a 2-second poll
 * loop stacks up requests until the tab runs out of sockets.
 */
const TIMEOUT_MS = 8_000;

/** Reconnect delay for the event stream, and its ceiling. */
const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

const KNOWN_CODES: readonly RoomErrorCode[] = [
  'room-not-found',
  'room-full',
  'room-locked',
  'not-host',
  'not-in-room',
  'wrong-phase',
  'name-taken',
  'not-your-turn',
  'number-taken',
  'invalid-number',
  'invalid-claim',
  'round-over',
];

function isRoomErrorCode(value: unknown): value is RoomErrorCode {
  return typeof value === 'string' && (KNOWN_CODES as readonly string[]).includes(value);
}

/** Turns a non-2xx response into a `RoomError` the UI can render. */
async function toError(response: Response): Promise<Error> {
  let code: unknown;
  let message: unknown;
  try {
    const body: unknown = await response.json();
    if (body !== null && typeof body === 'object') {
      code = (body as Record<string, unknown>)['code'];
      message = (body as Record<string, unknown>)['message'];
    }
  } catch {
    // A non-JSON error body is not itself an error worth reporting; fall
    // through to the status-based message below.
  }

  const text = typeof message === 'string' ? message : `Request failed (${response.status}).`;
  if (isRoomErrorCode(code)) return new RoomError(code, text);
  if (response.status === 404)
    return new RoomError('room-not-found', 'That room no longer exists.');
  return new Error(text);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${env.playroomApiUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
      // `no-store` by default: a mutation must never be answered from a cache.
      // The room read overrides it — see `getRoom`.
      cache: init.cache ?? 'no-store',
    });
  } catch (cause) {
    logger.error('Rooms API request failed', { path, cause: String(cause) });
    throw new Error('Could not reach the rooms service. Check your connection and try again.');
  }

  if (!response.ok) throw await toError(response);
  return (await response.json()) as T;
}

/**
 * The credential, as a header.
 *
 * This is the whole of client-side auth. The token goes in a header rather than
 * in a query string or a cookie: a URL ends up in access logs and browser
 * history, and a cookie would need CORS credentials the service does not want.
 */
function identityHeaders(identity: PlayerIdentity): Record<string, string> {
  return { Authorization: `Bearer ${identity.playerToken}` };
}

/**
 * A key that makes retrying one move safe.
 *
 * It is derived from the move itself, not generated per call, and that is the
 * point. The failure this guards against is a request that reached the server
 * and succeeded while its response was lost: the player sees nothing happen and
 * presses again. A fresh key each time would take the number twice; the same
 * key returns the response the first attempt already produced.
 *
 * The server scopes stored keys to one round, so taking 17 again in a later
 * round is a new move, not a replay.
 */
function idempotencyKey(identity: PlayerIdentity, type: string, payload: unknown): string {
  return `${identity.playerId}:${type}:${JSON.stringify(payload)}`;
}

function post<T>(path: string, identity: PlayerIdentity, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: identityHeaders(identity),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** Sends one in-game move through the shared action envelope. */
function action(identity: PlayerIdentity, type: string, payload: object = {}): Promise<Room> {
  return request<Room>(`/rooms/${encodeURIComponent(identity.roomKey)}/rounds/current/actions`, {
    method: 'POST',
    headers: {
      ...identityHeaders(identity),
      'Idempotency-Key': idempotencyKey(identity, type, payload),
    },
    body: JSON.stringify({ type, payload }),
  });
}

/**
 * Reads a Server-Sent Events stream with `fetch` rather than `EventSource`.
 *
 * `EventSource` cannot set request headers, so using it would mean putting the
 * player's token in the query string — into access logs, proxy logs and browser
 * history. Reading the body as a stream keeps the credential in a header. The
 * cost is that reconnection is this function's job rather than the browser's,
 * which is what the backoff below is.
 */
function subscribeToRoom(
  key: string,
  viewer: PlayerIdentity | undefined,
  onRoom: (room: Room) => void,
): () => void {
  const controller = new AbortController();
  let attempt = 0;
  let stopped = false;
  let timer: number | undefined;

  async function connect(): Promise<void> {
    const url = `${env.playroomApiUrl}/rooms/${encodeURIComponent(key)}/stream`;
    const response = await fetch(url, {
      // No timeout signal: a stream is meant to stay open. The abort
      // controller is what closes it.
      signal: controller.signal,
      headers: {
        Accept: 'text/event-stream',
        ...(viewer ? identityHeaders(viewer) : {}),
      },
      cache: 'no-store',
    });

    if (!response.ok || response.body === null) {
      throw new Error(`Stream failed (${response.status})`);
    }

    attempt = 0;
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;

      buffer += value;
      // Frames are separated by a blank line. Anything after the last blank
      // line is a partial frame and stays in the buffer.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const dataLines = frame
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());
        if (dataLines.length === 0) continue; // a heartbeat comment

        // The server closes the stream deliberately for a room that no longer
        // exists, or a token that no longer belongs to it. Retrying that is
        // pointless — stop, and let the poll render the real answer.
        if (frame.includes('event: closed')) {
          stopped = true;
          controller.abort();
          return;
        }

        // An event this client does not model is not an error: the server may
        // send new event types before this file learns about them.
        if (!frame.includes('event: room')) continue;

        try {
          onRoom(JSON.parse(dataLines.join('\n')) as Room);
        } catch (cause) {
          logger.warn('Ignored an unreadable room frame', { cause: String(cause) });
        }
      }
    }
  }

  function schedule(): void {
    if (stopped) return;
    // Exponential backoff, capped. A room whose server is down must not have
    // every open tab retrying it every second.
    const delay = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
    attempt += 1;
    timer = window.setTimeout(() => void run(), delay);
  }

  async function run(): Promise<void> {
    if (stopped) return;
    try {
      await connect();
    } catch (cause) {
      if (stopped) return;
      logger.debug('Room stream dropped; will retry', { cause: String(cause) });
    }
    schedule();
  }

  void run();

  return () => {
    stopped = true;
    if (timer !== undefined) window.clearTimeout(timer);
    controller.abort();
  };
}

/** The remote implementation of `RoomTransport`. */
export const playroomApi: RoomTransport = {
  createRoom(input: CreateRoomInput) {
    return request<JoinedRoom>('/rooms', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  joinRoom(input: JoinRoomInput) {
    return request<JoinedRoom>(`/rooms/${encodeURIComponent(input.key)}/players`, {
      method: 'POST',
      body: JSON.stringify({ name: input.name, color: input.color }),
    });
  },

  /**
   * Reads a room.
   *
   * `cache: 'no-cache'` is the one deliberate departure from the `no-store`
   * every other call uses, and it is doing real work. It tells the browser to
   * keep the response but revalidate it every time, so the browser sends
   * `If-None-Match` itself and turns the server's `304` back into the body it
   * already holds. Every player polls this every two seconds whether or not
   * anything changed; this is what stops each of those being a full download.
   *
   * Sending the validator by hand instead does not work: with `no-store` the
   * browser has nothing to revalidate, so Chrome fails the request outright
   * rather than surfacing the `304` — which silently breaks the poll, and the
   * poll is the fallback that has to work when the event stream does not.
   *
   * The server pairs this with `Vary: Authorization`, so two players reading
   * the same URL never share a cached room.
   */
  async getRoom(key: string, viewer?: PlayerIdentity) {
    try {
      return await request<Room>(`/rooms/${encodeURIComponent(key)}`, {
        cache: 'no-cache',
        // Identifies the caller so the server can scope which boards it
        // returns. Absent for a spectator, who gets none until the reveal.
        ...(viewer === undefined ? {} : { headers: identityHeaders(viewer) }),
      });
    } catch (error) {
      if (error instanceof RoomError && error.code === 'room-not-found') return null;
      throw error;
    }
  },

  startRound: (identity) =>
    post<Room>(`/rooms/${encodeURIComponent(identity.roomKey)}/rounds`, identity),
  selectNumber: (identity, value) => action(identity, 'select_number', { value }),
  claimBingo: (identity) => action(identity, 'claim_bingo'),
  nextRound: (identity) =>
    post<Room>(`/rooms/${encodeURIComponent(identity.roomKey)}/rounds/advance`, identity),
  lockRoom: (identity) =>
    post<Room>(`/rooms/${encodeURIComponent(identity.roomKey)}/lock`, identity),
  endSession: (identity) =>
    post<Room>(`/rooms/${encodeURIComponent(identity.roomKey)}/end`, identity),
  replaySession: (identity) =>
    post<Room>(`/rooms/${encodeURIComponent(identity.roomKey)}/replay`, identity),
  removePlayer: (identity, targetPlayerId) =>
    request<Room>(
      `/rooms/${encodeURIComponent(identity.roomKey)}/players/${encodeURIComponent(targetPlayerId)}`,
      { method: 'DELETE', headers: identityHeaders(identity) },
    ),

  subscribe: subscribeToRoom,
};
