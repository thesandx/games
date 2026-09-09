'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AvatarPicker } from '@/components/room/AvatarPicker';
import { SettingsEditor } from '@/components/room/SettingsEditor';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { rememberPlayerIdentity } from '@/hooks/usePlayerIdentity';
import { findGame, playableGames } from '@/lib/games';
import { initialOf, isValidNickname, MAX_NICKNAME_LENGTH } from '@/lib/players';
import { cn } from '@/lib/utils';
import { roomTransport } from '@/services/room-transport';
import type { AvatarColor, GameId, RoomSettings } from '@/types/playroom';

const DEFAULT_SETTINGS: RoomSettings = {
  rounds: 5,
  privacy: 'Key only',
  maxPlayers: 20,
};

/**
 * Room creation.
 *
 * The design's right-hand panel shows a room key before the room exists. It
 * cannot: the key is minted by the transport when the room is created. The
 * panel therefore summarises the setup and the key is revealed in the lobby,
 * one screen later.
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
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const game = findGame(gameId);
  const nickValid = isValidNickname(nick);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!nickValid || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const { room, playerId } = await roomTransport.createRoom({
        gameId,
        settings,
        hostName: nick.trim(),
        hostColor: color,
      });
      // Hand the identity to the room screen before navigating, so the player
      // arrives as a member rather than a stranger.
      rememberPlayerIdentity(room.key, playerId);
      router.push(`/room/${room.key}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the room.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid items-start gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <fieldset className="border-ink-1 rounded-card border-2 p-6">
          <legend className="text-ink-1 px-1 text-lg font-medium">Game</legend>
          <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
            {games.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'rounded-card cursor-pointer border-2 p-3.5',
                  gameId === option.id ? 'bg-peach border-ink-1' : 'border-hairline bg-white',
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
                <span className="text-ink-1 block text-sm font-medium">{option.name}</span>
                <span className="text-ink-3 mt-1 block text-sm">{option.meta}</span>
              </label>
            ))}
          </div>
          <p className="text-ink-3 mt-3.5 text-sm">
            Only Bingo is playable today.{' '}
            <Link href="/games" className="text-link">
              See what else is coming
            </Link>
            .
          </p>
        </fieldset>

        <div className="border-ink-1 rounded-card flex flex-col gap-4 border-2 p-6">
          <h2 className="text-ink-1 text-lg font-medium">You</h2>
          <TextInput
            label="Nickname"
            placeholder="e.g. Rhea"
            value={nick}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="off"
            onChange={(event) => setNick(event.target.value)}
          />
          <AvatarPicker value={color} onChange={setColor} initial={initialOf(nick)} />
        </div>

        <SettingsEditor settings={settings} onChange={setSettings} />
      </div>

      <div className="border-ink-1 rounded-card flex flex-col gap-4 border-2 p-6">
        <h2 className="text-ink-1 text-lg font-medium">Your room</h2>
        <div className="bg-ink-1 rounded-card px-5 py-6 text-center">
          <span className="block text-sm text-white/70">Key</span>
          <span className="font-display mt-1.5 block text-2xl leading-none font-medium text-white">
            Generated when you create
          </span>
        </div>
        <p className="text-ink-3 text-sm leading-relaxed">
          {game?.name ?? 'Bingo'} · {settings.rounds} rounds · up to {settings.maxPlayers} players.
          Players take turns picking numbers. The key works until two hours after your last round.
        </p>

        {error ? (
          <p role="alert" className="text-coral text-sm">
            {error}
          </p>
        ) : null}

        <Button type="submit" block disabled={!nickValid || submitting}>
          {submitting ? 'Creating room…' : 'Create room and open lobby'}
        </Button>
        {!nickValid ? (
          <p className="text-ink-3 text-sm">Add a nickname to create the room.</p>
        ) : null}
        <Link href="/join" className="text-link text-center text-sm">
          I have a key instead
        </Link>
      </div>
    </form>
  );
}
