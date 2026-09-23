import { describe, expect, it } from 'vitest';

import {
  actionSchema,
  bearerToken,
  clientAddress,
  createRoomSchema,
  describeIssue,
  etagMatches,
  joinRoomSchema,
  roomEtag,
} from '@/lib/room-http';

describe('request bodies', () => {
  const settings = { rounds: 1, privacy: 'Locked after start', maxPlayers: 8 };

  it('accepts what the client sends, trimmed and in NFC', () => {
    const parsed = createRoomSchema.parse({
      gameId: 'bingo',
      settings,
      hostName: '  José ',
      hostColor: 'peach',
    });
    expect(parsed.hostName).toBe('José');
  });

  it('refuses a blank nickname and one over 16 characters', () => {
    expect(joinRoomSchema.safeParse({ name: '   ', color: 'mint' }).success).toBe(false);
    expect(joinRoomSchema.safeParse({ name: 'a'.repeat(17), color: 'mint' }).success).toBe(false);
  });

  it('counts a nickname in characters, not UTF-16 units', () => {
    // Sixteen astral characters are 32 UTF-16 units and still a legal name.
    expect(joinRoomSchema.safeParse({ name: '\u{1D400}'.repeat(16), color: 'mint' }).success).toBe(
      true,
    );
  });

  it('refuses a colour outside the palette and settings out of range', () => {
    expect(joinRoomSchema.safeParse({ name: 'Dev', color: 'blue' }).success).toBe(false);
    const tooMany = createRoomSchema.safeParse({
      gameId: 'bingo',
      settings: { ...settings, maxPlayers: 21 },
      hostName: 'Rhea',
      hostColor: 'peach',
    });
    expect(tooMany.success).toBe(false);
    if (!tooMany.success) expect(describeIssue(tooMany.error)).toMatch(/^settings\.maxPlayers/);
  });

  it('defaults an action payload to an empty object', () => {
    expect(actionSchema.parse({ type: 'claim_bingo' })).toEqual({
      type: 'claim_bingo',
      payload: {},
    });
  });
});

describe('bearerToken', () => {
  it('reads the token and ignores the scheme case', () => {
    expect(bearerToken('Bearer abc')).toBe('abc');
    expect(bearerToken('bearer  abc ')).toBe('abc');
  });

  it('treats anything else as no token', () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken('Basic abc')).toBeNull();
    expect(bearerToken('Bearer ')).toBeNull();
  });
});

describe('the room validator', () => {
  it('differs per viewer, so two players never share a cached room', () => {
    expect(roomEtag(3, 'p1')).not.toBe(roomEtag(3, 'p2'));
    expect(roomEtag(3, null)).toBe('W/"3-anon"');
  });

  it('matches a header that lists it among others', () => {
    const etag = roomEtag(3, 'p1');
    expect(etagMatches(`W/"2-p1", ${etag}`, etag)).toBe(true);
    expect(etagMatches(null, etag)).toBe(false);
    expect(etagMatches('W/"2-p1"', etag)).toBe(false);
  });
});

describe('clientAddress', () => {
  it('takes the first forwarded address', () => {
    expect(clientAddress('203.0.113.9, 10.0.0.1')).toBe('203.0.113.9');
    expect(clientAddress(null)).toBeNull();
    expect(clientAddress('')).toBeNull();
  });
});
