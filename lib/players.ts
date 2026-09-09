/**
 * Player helpers — avatars, initials and score ordering.
 *
 * Avatar colours are stored as token names rather than hex values so the
 * palette stays editable from `styles/globals.css` alone.
 */

import type { AvatarColor, Player } from '@/types/playroom';

/** The five pastels the design cycles through for avatars. */
export const AVATAR_COLORS: readonly AvatarColor[] = [
  'peach',
  'mint',
  'yellow',
  'mustard',
  'cream',
] as const;

/** Tailwind background utility for an avatar colour token. */
export const AVATAR_BG: Record<AvatarColor, string> = {
  peach: 'bg-peach',
  mint: 'bg-mint',
  yellow: 'bg-yellow',
  mustard: 'bg-mustard',
  cream: 'bg-cream',
};

/**
 * First character of a nickname, uppercased. Returns an empty string for blank
 * input so the avatar renders as a plain colour disc rather than "U".
 * Uses the spread to take a full code point, so an astral character is not
 * split into half a surrogate pair.
 */
export function initialOf(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '') return '';
  return ([...trimmed][0] ?? '').toUpperCase();
}

/** Picks the first avatar colour not already taken in the room. */
export function nextAvailableColor(taken: readonly AvatarColor[]): AvatarColor {
  return AVATAR_COLORS.find((color) => !taken.includes(color)) ?? AVATAR_COLORS[0] ?? 'peach';
}

/**
 * Orders players for a scoreboard: highest score first, then alphabetically so
 * a tie renders in a stable order instead of shuffling between polls.
 */
export function rankPlayers(players: readonly Player[]): readonly Player[] {
  return [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

/** Trims a nickname to something that fits the design's avatar chips. */
export const MAX_NICKNAME_LENGTH = 16;

export function isValidNickname(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NICKNAME_LENGTH;
}
