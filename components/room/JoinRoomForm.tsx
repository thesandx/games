'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { AvatarPicker } from '@/components/room/AvatarPicker';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { rememberPlayerIdentity } from '@/hooks/usePlayerIdentity';
import { initialOf, isValidNickname, MAX_NICKNAME_LENGTH } from '@/lib/players';
import { isValidRoomKey, normaliseRoomKey, ROOM_KEY_LENGTH } from '@/lib/room-key';
import { roomTransport } from '@/services/room-transport';
import type { AvatarColor } from '@/types/playroom';

/**
 * Joining by key.
 *
 * The design draws the key as six separate boxes. This is one input instead:
 * six inputs break paste (the most common way a key actually arrives), need
 * bespoke focus and backspace handling, and read as six unlabelled fields to a
 * screen reader. The single field is letter-spaced to keep the same rhythm and
 * normalises "plz 4k9" to "PLZ4K9" as you type.
 */
export function JoinRoomForm({ initialKey }: { initialKey: string }) {
  const router = useRouter();
  const [key, setKey] = useState(normaliseRoomKey(initialKey));
  const [nick, setNick] = useState('');
  const [color, setColor] = useState<AvatarColor>('mint');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [nickError, setNickError] = useState<string | null>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const nickRef = useRef<HTMLInputElement>(null);

  /**
   * Both fields are checked on submit rather than gating the button. A disabled
   * button says "you cannot continue" without saying why; showing the field
   * that needs attention does.
   */
  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (submitting) return;

    const keyOk = isValidRoomKey(key);
    const nickOk = isValidNickname(nick);

    setKeyError(
      keyOk
        ? null
        : key.trim() === ''
          ? 'Enter the six-character key the host gave you.'
          : `Keys are ${ROOM_KEY_LENGTH} characters, letters and numbers.`,
    );
    setNickError(nickOk ? null : 'Enter a nickname so the room knows who you are.');

    if (!keyOk || !nickOk) {
      // Focus the first field that needs attention, top-down.
      (keyOk ? nickRef : keyRef).current?.focus();
      return;
    }

    setSubmitting(true);
    setError(null);
    const normalised = normaliseRoomKey(key);

    try {
      const room = await roomTransport.getRoom(normalised);
      if (!room) {
        setError(
          'No room with that key. Check it with the host — keys expire two hours after the last round.',
        );
        setSubmitting(false);
        return;
      }

      const { playerId, playerToken } = await roomTransport.joinRoom({
        key: normalised,
        name: nick.trim(),
        color,
      });
      // Hand the identity to the room screen before navigating, so the player
      // arrives as a member rather than a stranger. The token comes back once
      // and only here.
      rememberPlayerIdentity(normalised, playerId, playerToken);
      router.push(`/room/${normalised}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not join that room.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[460px]">
      <h1 className="font-display text-ink-1 text-center text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-normal">
        Join a room
      </h1>
      <p className="text-ink-3 mt-2.5 text-center text-sm">
        Ask the host for the six-character key.
      </p>

      <div className="border-ink-1 rounded-card mt-6 flex flex-col gap-5 border-2 p-6">
        <TextInput
          ref={keyRef}
          label="Room key"
          value={key}
          onChange={(event) => {
            setKey(normaliseRoomKey(event.target.value));
            if (keyError !== null) setKeyError(null);
          }}
          maxLength={ROOM_KEY_LENGTH}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="PLZ4K9"
          className="[&_input]:font-display [&_input]:h-16 [&_input]:text-center [&_input]:text-2xl [&_input]:font-medium [&_input]:tracking-[0.5em] [&_input]:uppercase"
          {...(keyError === null ? {} : { error: keyError })}
        />

        <TextInput
          ref={nickRef}
          label="Nickname"
          placeholder="e.g. Dev"
          value={nick}
          maxLength={MAX_NICKNAME_LENGTH}
          autoComplete="off"
          onChange={(event) => {
            setNick(event.target.value);
            if (nickError !== null) setNickError(null);
          }}
          {...(nickError === null ? {} : { error: nickError })}
        />

        <AvatarPicker
          value={color}
          onChange={setColor}
          initial={initialOf(nick)}
          label="Your avatar"
        />

        {error ? (
          <p role="alert" className="text-coral text-sm">
            {error}
          </p>
        ) : null}

        <Button type="submit" block disabled={submitting}>
          {submitting ? 'Joining…' : 'Join room'}
        </Button>
      </div>

      <p className="text-ink-3 mt-4 text-center text-sm">
        No key?{' '}
        <Link href="/create" className="text-link">
          Create your own room
        </Link>
      </p>
    </form>
  );
}
