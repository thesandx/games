/**
 * Room keys — the six characters a host reads out to the group chat.
 *
 * The alphabet deliberately omits `I`, `O`, `0` and `1`. Keys get spoken aloud
 * and typed from memory, and those four are the pairs people transcribe wrong.
 * Keys are case-insensitive, as the "How to play" screen promises.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_KEY_LENGTH = 6;

/** Injectable randomness so tests can produce a fixed key. */
export type RandomInt = (max: number) => number;

function defaultRandom(max: number): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return (buffer[0] ?? 0) % max;
}

/** Generates a six-character room key, e.g. `PLZ4K9`. */
export function createRoomKey(random: RandomInt = defaultRandom): string {
  let key = '';
  for (let index = 0; index < ROOM_KEY_LENGTH; index += 1) {
    key += ALPHABET.charAt(random(ALPHABET.length));
  }
  return key;
}

/**
 * Normalises user input for comparison: trims, uppercases, and strips the
 * spaces and dashes people add when reading a key back ("plz 4k9").
 */
export function normaliseRoomKey(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, '');
}

/** True when the input is a well-formed key. Does not check the room exists. */
export function isValidRoomKey(input: string): boolean {
  const key = normaliseRoomKey(input);
  if (key.length !== ROOM_KEY_LENGTH) return false;
  return key.split('').every((character) => ALPHABET.includes(character));
}
