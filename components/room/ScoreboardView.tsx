'use client';

import Link from 'next/link';

import { PlayerAvatar } from '@/components/room/PlayerAvatar';
import { ScoreTable, type ScoreTableRow } from '@/components/room/ScoreTable';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card, type CardTone } from '@/components/ui/Card';
import { findGame } from '@/lib/games';
import { rankPlayers } from '@/lib/players';
import type { Room } from '@/types/playroom';

export interface ScoreboardViewProps {
  room: Room;
  isHost: boolean;
  onPlayAgain: () => void;
  busy: boolean;
}

/**
 * The podium places. Each place keeps one tone, so first is always butter. The
 * place is also written out, because the tone alone says nothing.
 */
const PODIUM: ReadonlyArray<{ place: string; tone: CardTone }> = [
  { place: 'First', tone: 'butter' },
  { place: 'Second', tone: 'soda' },
  { place: 'Third', tone: 'peach' },
];

/** The end-of-session scoreboard. */
export function ScoreboardView({ room, isHost, onPlayAgain, busy }: ScoreboardViewProps) {
  const ranked = rankPlayers(room.players);
  const game = findGame(room.gameId);
  const podium = ranked.slice(0, 3);

  const rows: readonly ScoreTableRow[] = ranked.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    note: player.isHost ? 'Host' : '',
    value: String(player.score),
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-title">Final scoreboard</h1>
        <p className="text-ink-soft">
          {room.round} {room.round === 1 ? 'round' : 'rounds'} of {game?.name ?? 'Bingo'} in room{' '}
          {room.key}.
        </p>
      </div>

      {podium.length > 0 ? (
        <ol className="grid gap-5 sm:grid-cols-3">
          {podium.map((player, index) => {
            const style = PODIUM[index] ?? PODIUM[2] ?? { place: 'Third', tone: 'peach' };
            return (
              <Card
                key={player.id}
                as="li"
                tone={style.tone}
                flat
                className="flex flex-col items-start gap-2"
              >
                <span className="text-small font-medium">{style.place}</span>
                <PlayerAvatar
                  player={player}
                  size="lg"
                  {...(index === 0 ? { mood: 'wow' as const, className: 'animate-pop' } : {})}
                />
                <span className="font-display text-heading break-all">{player.name}</span>
                <span className="font-display text-key tabular-nums">{player.score}</span>
              </Card>
            );
          })}
        </ol>
      ) : null}

      <ScoreTable rows={rows} caption="Final standings" />

      <div className="flex flex-wrap items-center gap-3">
        {isHost ? (
          <Button onClick={onPlayAgain} disabled={busy}>
            {busy ? 'Resetting…' : 'Play again, same room'}
          </Button>
        ) : null}
        <Link href="/games" className={buttonStyles({ variant: 'secondary' })}>
          Back to games
        </Link>
      </div>
    </div>
  );
}
