/**
 * Per-address rate limits for the rooms API.
 *
 * There is no login, so nothing else stops a script. The limits are the ones
 * the rooms API has always had: room creation about 10 an hour, joins about 30
 * an hour, in-game actions about 5 a second.
 *
 * Two properties are deliberate:
 *
 * - **The address is never stored.** It is hashed with a per-process salt, used
 *   as a bucket key, and dropped when the window ends. The product promises
 *   nothing is kept against a player, and an address in a database would break
 *   that promise.
 * - **It is per process.** Three Cloud Run instances allow roughly three times
 *   the limit. That is the right trade for a party game: a shared limiter needs
 *   a shared store, and the limit exists to stop a script, not to be exact.
 *
 * The limits are per address, and a whole party on one home network shares an
 * address. The numbers leave room for that: a room of eight on one router makes
 * far fewer than five moves a second, because play is turn-based.
 */

import { createHmac, randomBytes } from 'node:crypto';

/** Rotated per process, so a bucket key cannot be reversed or correlated. */
const SALT = randomBytes(16);

/** Prune once the map grows past this, so a limiter cannot exhaust memory. */
const MAX_BUCKETS = 20_000;

export type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number; message: string };

/** Counts hits per key in a moving window. */
export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    readonly limit: number,
    readonly windowMs: number,
    readonly message: string,
  ) {}

  /** Records one hit, or refuses it with how long to wait. */
  check(key: string, now: number = Date.now()): LimitResult {
    if (this.hits.size > MAX_BUCKETS) this.prune(now);

    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((at) => at > cutoff);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      return { ok: false, retryAfterSeconds, message: this.message };
    }

    recent.push(now);
    this.hits.set(key, recent);
    return { ok: true };
  }

  /** Drops buckets whose hits have all left the window. */
  prune(now: number = Date.now()): void {
    const cutoff = now - this.windowMs;
    for (const [key, hits] of this.hits) {
      const recent = hits.filter((at) => at > cutoff);
      if (recent.length === 0) this.hits.delete(key);
      else this.hits.set(key, recent);
    }
  }

  /** How many buckets exist. For tests. */
  get size(): number {
    return this.hits.size;
  }
}

/** A salted hash of the caller's address. The address itself is not kept. */
export function bucketKey(address: string | null): string {
  return createHmac('sha256', SALT)
    .update(address ?? 'unknown')
    .digest('hex')
    .slice(0, 32);
}

export const createLimiter = new SlidingWindowLimiter(
  10,
  60 * 60 * 1000,
  'Too many rooms created from here. Wait a little and try again.',
);

export const joinLimiter = new SlidingWindowLimiter(
  30,
  60 * 60 * 1000,
  'Too many join attempts from here. Wait a little and try again.',
);

export const actionLimiter = new SlidingWindowLimiter(
  5,
  1000,
  'You are going too fast. Try that again in a second.',
);
