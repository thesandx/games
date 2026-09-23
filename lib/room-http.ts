/**
 * The wire rules of the rooms API: request bodies, error statuses, the
 * credential header and the cache validator.
 *
 * Pure on purpose. The route handlers in `app/api/v1/` compose these with
 * `services/room-store.ts`, and everything here is tested without a database.
 *
 * The bounds below are enforced twice. The client enforces them so a player
 * gets an instant message; the server enforces them again because the client is
 * not trusted.
 */

import { z } from 'zod';

import { AVATAR_COLORS } from '@/lib/players';
import type { RoomErrorCode } from '@/lib/room-engine';
import type { AvatarColor, GameId } from '@/types/playroom';

/** HTTP status per error code. The client keys off the code, not the status. */
export const ERROR_STATUS: Record<RoomErrorCode, number> = {
  'room-not-found': 404,
  'room-full': 409,
  'room-locked': 409,
  'not-host': 403,
  'not-in-room': 403,
  'wrong-phase': 409,
  'name-taken': 409,
  'not-your-turn': 409,
  'number-taken': 409,
  'invalid-number': 422,
  'invalid-claim': 409,
  'round-over': 409,
};

/** Nicknames are 1 to 16 characters, counted as code points, not UTF-16 units. */
const MAX_NICKNAME = 16;

const nickname = z
  .string()
  .max(64)
  .transform((value) => value.normalize('NFC').trim())
  .refine((value) => value.length > 0, 'Enter a nickname so the room knows who you are.')
  .refine((value) => [...value].length <= MAX_NICKNAME, 'Nicknames are at most 16 characters.');

export const avatarColor = z.enum(AVATAR_COLORS as unknown as [AvatarColor, ...AvatarColor[]]);

export const GAME_IDS: readonly [GameId, ...GameId[]] = [
  'bingo',
  'scribble',
  'ttt',
  'trivia',
  'wordchain',
  'mafia',
];

export const roomSettingsSchema = z.object({
  rounds: z.number().int().min(1).max(20),
  privacy: z.enum(['Key only', 'Locked after start']),
  maxPlayers: z.number().int().min(2).max(20),
});

export const createRoomSchema = z.object({
  gameId: z.enum(GAME_IDS),
  settings: roomSettingsSchema,
  hostName: nickname,
  hostColor: avatarColor,
});

export const joinRoomSchema = z.object({
  name: nickname,
  color: avatarColor,
});

/**
 * The envelope every in-game move travels in. One endpoint carries every move
 * of every game, dispatched on `(gameId, type)`, so a new game adds no route.
 */
export const actionSchema = z.object({
  type: z.string().min(1).max(64),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type CreateRoomBody = z.infer<typeof createRoomSchema>;
export type JoinRoomBody = z.infer<typeof joinRoomSchema>;
export type ActionBody = z.infer<typeof actionSchema>;

/** The first problem with a body, phrased for a player. */
export function describeIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) return 'That request was not understood.';
  const field = issue.path.join('.');
  return field === '' ? issue.message : `${field}: ${issue.message}`;
}

/**
 * The credential out of an `Authorization: Bearer <token>` header, or `null`.
 *
 * Absent is legitimate: a caller with no token is a spectator on a read.
 */
export function bearerToken(header: string | null): string | null {
  if (header === null) return null;
  const [scheme, ...rest] = header.trim().split(/\s+/);
  const value = rest.join(' ').trim();
  if (scheme?.toLowerCase() !== 'bearer' || value === '') return null;
  return value;
}

/**
 * The validator for a room read.
 *
 * The viewer is part of it because two callers of the same room version get
 * different boards. Weak, because the body is equivalent rather than
 * byte-identical: the turn clock inside it moves on every second.
 */
export function roomEtag(version: number, viewerId: string | null): string {
  return `W/"${version}-${viewerId ?? 'anon'}"`;
}

/** True when an `If-None-Match` header names this validator. It may hold a list. */
export function etagMatches(header: string | null, etag: string): boolean {
  if (header === null) return false;
  return header
    .split(',')
    .map((tag) => tag.trim())
    .includes(etag);
}

/**
 * The caller's address, for rate limiting only. Cloud Run puts the client
 * address first in `X-Forwarded-For`.
 */
export function clientAddress(forwardedFor: string | null): string | null {
  const first = forwardedFor?.split(',')[0]?.trim();
  return first === undefined || first === '' ? null : first;
}
