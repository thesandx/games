'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { AvatarPicker } from '@/components/room/AvatarPicker';
import { Avatar } from '@/components/ui/Avatar';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { rememberPlayerIdentity } from '@/hooks/usePlayerIdentity';
import { DEFAULT_ROOM_SETTINGS, findGame, playableGames } from '@/lib/games';
import { AVATAR_TONE, isValidNickname, MAX_NICKNAME_LENGTH } from '@/lib/players';
import { cn } from '@/lib/utils';
import { roomTransport } from '@/services/room-transport';
import type { AvatarColor, GameId } from '@/types/playroom';

/**
 * Room creation.
 *
 * The key is minted by the transport when the room is created, so this screen
 * does not show one. It summarises the setup, and the key is revealed in the
 * lobby, one screen later.
 *
 * The "You" card carries the host's face as its peek, drawn from the nickname
 * as they type it. That is the one peeking card on the screen.
 *
 * There is no settings section. Rounds, capacity and who may join are fixed:
 * see `DEFAULT_ROOM_SETTINGS`. They were controls that asked the host to decide
 * something before they had any reason to care.
 */
export function CreateRoomForm({ initialGame }: { initialGame: GameId }) {
  const router = useRouter();
  const games = playableGames();
  const fallback = games[0]?.id ?? 'bingo';

  const [gameId, setGameId] = useState<GameId>(
    games.some((game) => game.id === initialGame) ? initialGame : fallback,
  );
  const [nick, setNick] = useState('');
  const [color, setColor] = useState<AvatarColor>('peach');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickError, setNickError] = useState<string | null>(null);
  const nickRef = useRef<HTMLInputElement>(null);

  const game = findGame(gameId);
  const settings = DEFAULT_ROOM_SETTINGS;

  /**
   * The submit button stays enabled on an empty nickname. A disabled button
   * gives no reason for being disabled, pressing it and being shown the field
   * that needs filling is how a person finds out what is missing.
   */
  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (submitting) return;

    if (!isValidNickname(nick)) {
      setNickError('Enter a nickname so the room knows who you are.');
      nickRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setNickError(null);
    setError(null);
    try {
      const { room, playerId, playerToken } = await roomTransport.createRoom({
        gameId,
        settings,
        hostName: nick.trim(),
        hostColor: color,
      });
      // Hand the identity to the room screen before navigating, so the player
      // arrives as a member rather than a stranger. The token comes back once
      // and only here. It is never in a room payload, so losing it means
      // rejoining as somebody new.
      rememberPlayerIdentity(room.key, playerId, playerToken);
      router.push(`/room/${room.key}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the room.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-heading font-display mb-3">Game</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {games.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'rounded-card border-line flex cursor-pointer flex-col gap-1 border-2 p-4',
                  'has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2',
                  gameId === option.id ? 'bg-butter' : 'bg-surface border-dashed',
                )}
              >
                <input
                  type="radio"
                  name="game"
                  value={option.id}
                  checked={gameId === option.id}
                  onChange={() => setGameId(option.id)}
                  className="sr-only"
                />
                <span className="font-display">{option.name}</span>
                <span className="text-small">For {option.players} players</span>
              </label>
            ))}
          </div>
          <p className="text-small text-ink-soft">
            Only Bingo is playable today.{' '}
            <Link
              href="/games"
              className="text-ink decoration-brand font-medium underline decoration-2 underline-offset-4"
            >
              See what else is coming
            </Link>
            .
          </p>
        </fieldset>

        <Card
          flat
          peek={<Avatar name={nick} tone={AVATAR_TONE[color]} size="lg" />}
          className="flex flex-col gap-4"
        >
          <h2 className="text-heading">You</h2>
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
        </Card>
      </div>

      <Card flat className="flex flex-col gap-4">
        <h2 className="text-heading">Your room</h2>
        <p className="max-w-prose">
          One round of {game?.name ?? 'Bingo'}, for up to {settings.maxPlayers} players. Players
          take turns picking numbers, and the room locks once the game starts. You get the key in
          the lobby, and it works until two hours after the round.
        </p>

        {error ? (
          <p role="alert" className="flex items-center gap-1.5 font-medium">
            <span aria-hidden="true" className="bg-danger inline-block size-2.5 rounded-full" />
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" block disabled={submitting}>
          {submitting ? 'Creating room…' : 'Create room'}
        </Button>
        <p>
          <Link href="/join" className={buttonStyles({ variant: 'quiet' })}>
            I have a key instead
          </Link>
        </p>
      </Card>
    </form>
  );
}
