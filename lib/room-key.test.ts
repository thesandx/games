import { describe, expect, it } from 'vitest';

import { createRoomKey, isValidRoomKey, normaliseRoomKey, ROOM_KEY_LENGTH } from '@/lib/room-key';

describe('createRoomKey', () => {
  it('is six characters', () => {
    expect(createRoomKey()).toHaveLength(ROOM_KEY_LENGTH);
  });

  it('never uses the characters people mis-transcribe', () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      expect(createRoomKey()).not.toMatch(/[IO01]/);
    }
  });

  it('produces a key its own validator accepts', () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      expect(isValidRoomKey(createRoomKey())).toBe(true);
    }
  });
});

describe('normaliseRoomKey', () => {
  it('uppercases and strips the spaces and dashes people add', () => {
    expect(normaliseRoomKey(' plz 4k9 ')).toBe('PLZ4K9');
    expect(normaliseRoomKey('plz-4k9')).toBe('PLZ4K9');
  });
});

describe('isValidRoomKey', () => {
  it('accepts a well-formed key in any case', () => {
    expect(isValidRoomKey('PLZ4K9')).toBe(true);
    expect(isValidRoomKey('plz4k9')).toBe(true);
  });

  it('rejects the wrong length', () => {
    expect(isValidRoomKey('PLZ4K')).toBe(false);
    expect(isValidRoomKey('PLZ4K99')).toBe(false);
  });

  it('rejects excluded and non-alphanumeric characters', () => {
    expect(isValidRoomKey('PLZ4KO')).toBe(false);
    expect(isValidRoomKey('PLZ4K!')).toBe(false);
  });
});
