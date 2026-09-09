import { describe, expect, it } from 'vitest';

import {
  AVATAR_COLORS,
  initialOf,
  isValidNickname,
  MAX_NICKNAME_LENGTH,
  nextAvailableColor,
  rankPlayers,
} from '@/lib/players';
import type { Player } from '@/types/playroom';

function player(name: string, score: number): Player {
  return {
    id: name,
    name,
    initial: initialOf(name),
    color: 'peach',
    score,
    isHost: false,
    isReady: true,
  };
}

describe('initialOf', () => {
  it('takes the first character, uppercased', () => {
    expect(initialOf('rhea')).toBe('R');
    expect(initialOf('  dev ')).toBe('D');
  });

  it('returns nothing for a blank name', () => {
    expect(initialOf('   ')).toBe('');
  });

  it('does not split an astral character in half', () => {
    // A naive charAt(0) would return half a surrogate pair here.
    expect(initialOf('𝒜nna')).toBe('𝒜');
  });
});

describe('nextAvailableColor', () => {
  it('picks the first colour nobody has taken', () => {
    expect(nextAvailableColor(['peach'])).toBe('mint');
  });

  it('falls back to the first colour once every one is taken', () => {
    expect(nextAvailableColor(AVATAR_COLORS)).toBe('peach');
  });
});

describe('rankPlayers', () => {
  it('orders by score, then name, so ties do not shuffle', () => {
    const ranked = rankPlayers([player('Ana', 10), player('Dev', 30), player('Bo', 10)]);
    expect(ranked.map((entry) => entry.name)).toEqual(['Dev', 'Ana', 'Bo']);
  });

  it('does not mutate the input', () => {
    const players = [player('Ana', 10), player('Dev', 30)];
    rankPlayers(players);
    expect(players.map((entry) => entry.name)).toEqual(['Ana', 'Dev']);
  });
});

describe('isValidNickname', () => {
  it('requires a non-blank name within the length cap', () => {
    expect(isValidNickname('Rhea')).toBe(true);
    expect(isValidNickname('   ')).toBe(false);
    expect(isValidNickname('x'.repeat(MAX_NICKNAME_LENGTH))).toBe(true);
    expect(isValidNickname('x'.repeat(MAX_NICKNAME_LENGTH + 1))).toBe(false);
  });
});
