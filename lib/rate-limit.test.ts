import { describe, expect, it } from 'vitest';

import { bucketKey, SlidingWindowLimiter } from '@/lib/rate-limit';

describe('SlidingWindowLimiter', () => {
  it('allows up to the limit inside one window, then refuses', () => {
    const limiter = new SlidingWindowLimiter(2, 1_000, 'slow down');
    expect(limiter.check('a', 0).ok).toBe(true);
    expect(limiter.check('a', 100).ok).toBe(true);
    const refused = limiter.check('a', 200);
    expect(refused).toEqual({ ok: false, retryAfterSeconds: 1, message: 'slow down' });
  });

  it('counts each key on its own', () => {
    const limiter = new SlidingWindowLimiter(1, 1_000, 'slow down');
    expect(limiter.check('a', 0).ok).toBe(true);
    expect(limiter.check('b', 0).ok).toBe(true);
  });

  it('lets hits age out of the window', () => {
    const limiter = new SlidingWindowLimiter(1, 1_000, 'slow down');
    expect(limiter.check('a', 0).ok).toBe(true);
    expect(limiter.check('a', 500).ok).toBe(false);
    expect(limiter.check('a', 1_001).ok).toBe(true);
  });

  it('says how long to wait, rounded up to a whole second', () => {
    const limiter = new SlidingWindowLimiter(1, 60_000, 'slow down');
    limiter.check('a', 0);
    const refused = limiter.check('a', 10_500);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.retryAfterSeconds).toBe(50);
  });

  it('forgets idle buckets when pruned', () => {
    const limiter = new SlidingWindowLimiter(1, 1_000, 'slow down');
    limiter.check('a', 0);
    limiter.prune(5_000);
    expect(limiter.size).toBe(0);
  });
});

describe('bucketKey', () => {
  it('is stable for one address and never contains it', () => {
    expect(bucketKey('203.0.113.9')).toBe(bucketKey('203.0.113.9'));
    expect(bucketKey('203.0.113.9')).not.toContain('203.0.113.9');
    expect(bucketKey('203.0.113.9')).not.toBe(bucketKey('203.0.113.10'));
  });
});
