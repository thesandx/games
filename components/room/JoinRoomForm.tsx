'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { AvatarPicker } from '@/components/room/AvatarPicker';
import { Avatar } from '@/components/ui/Avatar';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Speech } from '@/components/ui/Speech';
import { rememberPlayerIdentity } from '@/hooks/usePlayerIdentity';
import { AVATAR_TONE, isValidNickname, MAX_NICKNAME_LENGTH } from '@/lib/players';
import { isValidRoomKey, normaliseRoomKey, ROOM_KEY_LENGTH } from '@/lib/room-key';
import { roomTransport } from '@/services/room-transport';
import type { AvatarColor } from '@/types/playroom';

/**
 * Joining by key.
 *
 * The key is one input, not six boxes: six inputs break paste (the most common
 * way a key actually arrives), need bespoke focus and backspace handling, and
 * read as six unlabelled fields to a screen reader. The single field uses the
 * design language's `code` treatment and normalises "plz 4k9" to "PLZ4K9" as
 * you type.
 *
 * The card's peek is the player's own face, drawn from the nickname as they
 * type it: the join form is the card that matters most on this screen. A room
 * that cannot be joined is an error moment, so the mascot says it, sad.
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
          : `Keys are ${ROOM_KEY_LENGTH} characters: letters and numbers.`,
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
          'No room with that key. Check it with the host. Keys expire two hours after the last round.',
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-title">Join a room</h1>
        <p className="text-ink-soft">Ask the host for the six-character key.</p>
      </div>

      <Card
        peek={<Avatar name={nick} tone={AVATAR_TONE[color]} size="lg" />}
        className="flex flex-col gap-5"
      >
        <Input
          ref={keyRef}
          label="Room key"
          code
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
          {...(keyError === null ? {} : { error: keyError })}
        />

        <Input
          ref={nickRef}
          label="Nickname"
          hint="Everyone in the room sees this."
          value={nick}
          maxLength={MAX_NICKNAME_LENGTH}
          autoComplete="off"
          onChange={(event) => {
            setNick(event.target.value);
            if (nickError !== null) setNickError(null);
          }}
          {...(nickError === null ? {} : { error: nickError })}
        />

        <AvatarPicker value={color} onChange={setColor} name={nick} />

        {error ? (
          <div role="alert">
            <Speech mood="sad">{error}</Speech>
          </div>
        ) : null}

        <Button type="submit" size="lg" block disabled={submitting}>
          {submitting ? 'Joining…' : 'Join room'}
        </Button>
      </Card>

      <p>
        No key?{' '}
        <Link href="/create" className={buttonStyles({ variant: 'quiet' })}>
          Create your own room
        </Link>
      </p>
    </form>
  );
}
