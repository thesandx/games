/**
 * HTTP client for the Playroom rooms API.
 *
 * Base URL comes from `NEXT_PUBLIC_PLAYROOM_API_URL`, currently the placeholder
 * `https://api.sandeep.app/games`. This module is the ONLY place that knows the
 * wire format; screens talk to `services/room-transport.ts` instead.
 *
 * The endpoint contract this client expects:
 *
 *   POST   /rooms                          -> { room, playerId }
 *   GET    /rooms/:key                     -> room            (404 when unknown)
 *   POST   /rooms/:key/players             -> { room, playerId }
 *   DELETE /rooms/:key/players/:playerId   -> room
 *   POST   /rooms/:key/round/start         -> room
 *   POST   /rooms/:key/round/select        -> room   body { value }
 *   POST   /rooms/:key/round/claim         -> room
 *   POST   /rooms/:key/round/next          -> room
 *   POST   /rooms/:key/lock                -> room
 *   POST   /rooms/:key/end                 -> room
 *   POST   /rooms/:key/replay              -> room
 *
 * The caller is identified by an `X-Player-Id` header rather than a body field,
 * so every mutating route reads it the same way.
 *
 * The server owns turn order, the taken-number set and bingo validation. It
 * must reject a selection made out of turn or on a number already taken, and a
 * bingo claim must be checked against the board and the selected numbers — not
 * against anything the client says is marked. `lib/room-engine.ts` holds those
 * rules as pure functions and can run unchanged on the server.
 *
 * A rule violation should come back as 4xx with `{ "code": ..., "message": ... }`
 * where `code` is one of `types/playroom.ts`'s `RoomErrorCode`. That is what
 * lets the UI show "It is not your turn yet" instead of a generic failure.
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { RoomError, type RoomErrorCode } from '@/lib/room-engine';
import type {
  CreateRoomInput,
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
      cache: 'no-store',
    });
  } catch (cause) {
    logger.error('Rooms API request failed', { path, cause: String(cause) });
    throw new Error('Could not reach the rooms service. Check your connection and try again.');
  }

  if (!response.ok) throw await toError(response);
  return (await response.json()) as T;
}

function identityHeaders(identity: PlayerIdentity): HeadersInit {
  return { 'X-Player-Id': identity.playerId };
}

function post<T>(path: string, identity: PlayerIdentity, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: identityHeaders(identity),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** The remote implementation of `RoomTransport`. */
export const playroomApi: RoomTransport = {
  createRoom(input: CreateRoomInput) {
    return request<{ room: Room; playerId: string }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  joinRoom(input: JoinRoomInput) {
    return request<{ room: Room; playerId: string }>(
      `/rooms/${encodeURIComponent(input.key)}/players`,
      { method: 'POST', body: JSON.stringify({ name: input.name, color: input.color }) },
    );
  },

  async getRoom(key: string) {
    try {
      return await request<Room>(`/rooms/${encodeURIComponent(key)}`);
    } catch (error) {
      if (error instanceof RoomError && error.code === 'room-not-found') return null;
      throw error;
    }
  },

  startRound: (identity) => post<Room>(`/rooms/${identity.roomKey}/round/start`, identity),
  selectNumber: (identity, value) =>
    post<Room>(`/rooms/${identity.roomKey}/round/select`, identity, { value }),
  claimBingo: (identity) => post<Room>(`/rooms/${identity.roomKey}/round/claim`, identity),
  nextRound: (identity) => post<Room>(`/rooms/${identity.roomKey}/round/next`, identity),
  lockRoom: (identity) => post<Room>(`/rooms/${identity.roomKey}/lock`, identity),
  endSession: (identity) => post<Room>(`/rooms/${identity.roomKey}/end`, identity),
  replaySession: (identity) => post<Room>(`/rooms/${identity.roomKey}/replay`, identity),
  removePlayer: (identity, targetPlayerId) =>
    request<Room>(`/rooms/${identity.roomKey}/players/${encodeURIComponent(targetPlayerId)}`, {
      method: 'DELETE',
      headers: identityHeaders(identity),
    }),
};
