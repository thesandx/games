'use client';

import { ScoreTable, type ScoreTableRow } from '@/components/room/ScoreTable';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { findGame } from '@/lib/games';
import { rankPlayers } from '@/lib/players';
import { cn } from '@/lib/utils';
import type { Room } from '@/types/playroom';

export interface ScoreboardViewProps {
  room: Room;
  isHost: boolean;
  onPlayAgain: () => void;
  busy: boolean;
}

const PODIUM = [
  { place: 'First', surface: 'bg-forest', text: 'text-white' },
  { place: 'Second', surface: 'bg-mint', text: 'text-ink-1' },
  { place: 'Third', surface: 'bg-peach', text: 'text-ink-1' },
] as const;

/** The end-of-session scoreboard. */
export function ScoreboardView({ room, isHost, onPlayAgain, busy }: ScoreboardViewProps) {
  const ranked = rankPlayers(room.players);
  const game = findGame(room.gameId);
  const podium = ranked.slice(0, 3);

  const rows: readonly ScoreTableRow[] = ranked.map((player) => ({
    id: player.id,
    name: player.name,
    initial: player.initial,
    color: player.color,
    note: player.isHost ? 'Host' : '',
    value: String(player.score),
  }));

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="font-display text-ink-1 text-center text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-normal">
        Final scoreboard
      </h1>
      <p className="text-ink-3 mt-2.5 text-center text-sm">
        {room.round} {room.round === 1 ? 'round' : 'rounds'} of {game?.name ?? 'Bingo'} · room{' '}
        {room.key}
      </p>

      {podium.length > 0 ? (
        <ul className="mt-7 grid gap-4 sm:grid-cols-3">
          {podium.map((player, index) => {
            const style = PODIUM[index] ?? PODIUM[2];
            return (
              <li
                key={player.id}
                className={cn(
                  'rounded-[22px] border-[3px] border-ink-1 p-6 flex flex-col gap-2.5',
                  style.surface,
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium tracking-[0.16px] uppercase opacity-85',
                    style.text,
                  )}
                >
                  {style.place}
                </span>
                <Avatar
                  initial={player.initial}
                  color={player.color}
                  name={player.name}
                  size="lg"
                />
                <span
                  className={cn('font-display text-[22px] leading-tight font-medium', style.text)}
                >
                  {player.name}
                </span>
                <span
                  className={cn('font-display text-[32px] leading-none font-medium', style.text)}
                >
                  {player.score}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-5">
        <ScoreTable rows={rows} caption="Final standings" />
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {isHost ? (
          <Button onClick={onPlayAgain} disabled={busy}>
            {busy ? 'Resetting…' : 'Play again, same room'}
          </Button>
        ) : null}
        <ButtonLink href="/games" variant="secondary">
          Back to games
        </ButtonLink>
      </div>
    </div>
  );
}
