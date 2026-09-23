import 'server-only';

import { NextResponse } from 'next/server';
import type { z } from 'zod';

import { logger } from '@/lib/logger';
import { bucketKey, type SlidingWindowLimiter } from '@/lib/rate-limit';
import { RoomError } from '@/lib/room-engine';
import { bearerToken, clientAddress, describeIssue, ERROR_STATUS } from '@/lib/room-http';
import type { Room } from '@/types/playroom';

/**
 * Shared plumbing for the rooms API route handlers in `app/api/v1/`.
 *
 * Not a route: only files named `route.ts` are served. The handlers stay thin,
 * parse at the boundary, call one function in `services/room-store.ts`, and
 * answer through these helpers, so every route speaks the same error contract.
 *
 * The contract: a rule violation is `{ "code", "message" }` with the status
 * from `ERROR_STATUS`, and the client shows `message` to the player verbatim.
 * Anything else is a generic 500. The detail goes to the log, never to the
 * player, so a stack trace cannot leak.
 */

/** A mutation must never be answered from a cache. */
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export function roomResponse(room: Room): NextResponse {
  return NextResponse.json(room, { headers: NO_STORE });
}

export function errorResponse(error: unknown, route: string): NextResponse {
  if (error instanceof RoomError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: ERROR_STATUS[error.code], headers: NO_STORE },
    );
  }
  logger.error('Rooms API request failed', error, { route });
  return NextResponse.json(
    { code: 'server-error', message: 'Something went wrong on our side. Try again in a moment.' },
    { status: 500, headers: NO_STORE },
  );
}

/** Runs a handler body and turns anything it throws into the error contract. */
export async function handle(route: string, run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    return errorResponse(error, route);
  }
}

/**
 * Parses and validates a JSON body. Returns the error response to send instead
 * when the body is not acceptable, so a handler reads:
 *
 *   const body = await readBody(request, schema);
 *   if (body instanceof Response) return body;
 */
export async function readBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.infer<S> | Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'invalid-request', message: 'The request body must be JSON.' },
      { status: 422, headers: NO_STORE },
    );
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { code: 'invalid-request', message: describeIssue(parsed.error) },
      { status: 422, headers: NO_STORE },
    );
  }
  return parsed.data;
}

/** The caller's bearer token, or null for a spectator. */
export function tokenOf(request: Request): string | null {
  return bearerToken(request.headers.get('authorization'));
}

/**
 * A 429 to send when this caller is over the limit, or null to carry on.
 *
 * `perPlayer` counts each player separately rather than each address. A whole
 * party on one home network shares one address, so an address-only limit on
 * moves would throttle a room of honest players. Minting a new player is itself
 * limited by address, so this does not open a way around the limit.
 */
export function overLimit(
  limiter: SlidingWindowLimiter,
  request: Request,
  { perPlayer = false }: { perPlayer?: boolean } = {},
): Response | null {
  const address = clientAddress(request.headers.get('x-forwarded-for')) ?? 'unknown';
  const player = perPlayer ? (tokenOf(request) ?? '') : '';
  const result = limiter.check(bucketKey(`${address}|${player}`));
  if (result.ok) return null;
  return NextResponse.json(
    { code: 'rate-limited', message: result.message },
    { status: 429, headers: { ...NO_STORE, 'Retry-After': String(result.retryAfterSeconds) } },
  );
}

/** Route segment params, as Next.js passes them: a promise. */
export interface RoomRouteContext {
  params: Promise<{ key: string }>;
}
