'use client';

import { PlayerList } from '@/components/room/PlayerList';
import { Button } from '@/components/ui/Button';
import { RoomKeyDisplay } from '@/components/ui/RoomKeyDisplay';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { findGame } from '@/lib/games';
import type { Room } from '@/types/playroom';

export interface LobbyViewProps {
  room: Room;
  isHost: boolean;
  onStart: () => void;
  onOpenHostControls: () => void;
  busy: boolean;
}

/** The waiting room, before the host starts the first round. */
export function LobbyView({ room, isHost, onStart, onOpenHostControls, busy }: LobbyViewProps) {
  const { copied, failed, copy } = useCopyToClipboard();
  const game = findGame(room.gameId);

  // Built inside the handler, not at render: client components are
  // server-rendered first, where `window` does not exist.
  const copyShareLink = (): void => {
    void copy(`${window.location.origin}/join?key=${room.key}`);
  };

  return (
    <div className="mx-auto grid max-w-[1120px] items-start gap-5 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-5">
        <div className="bg-cream rounded-card p-6">
          <span className="text-ink-1 text-sm font-medium tracking-[0.16px] uppercase">
            Waiting room
          </span>
          <h1 className="font-display text-ink-1 mt-2 text-[clamp(1.625rem,5vw,2.25rem)] leading-tight font-normal">
            {game?.name ?? 'Bingo'}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <RoomKeyDisplay roomKey={room.key} tone="light" />
            <Button size="sm" variant="secondary" onClick={() => void copy(room.key)}>
              {copied ? 'Copied' : 'Copy key'}
            </Button>
            <Button size="sm" variant="secondary" onClick={copyShareLink}>
              Copy link
            </Button>
          </div>
          {failed ? (
            <p role="alert" className="text-ink-2 mt-2 text-sm">
              Copying is blocked here. The key is {room.key}.
            </p>
          ) : null}
          <p className="text-ink-2 mt-3.5 text-sm">
            Share the key or the link — anyone with it lands straight in this lobby.
          </p>
        </div>

        <PlayerList players={room.players} maxPlayers={room.settings.maxPlayers} />
      </div>

      <div className="border-ink-1 rounded-card flex flex-col gap-4 border-2 p-6">
        <h2 className="text-ink-1 text-lg font-medium">This round</h2>
        <ul className="text-ink-2 flex flex-col gap-2 text-sm">
          <li>Each player gets their own board of 1 to 25.</li>
          <li>Take turns claiming a number. Every claim marks it for the whole room.</li>
          <li>Five complete lines spell BINGO and win the round.</li>
        </ul>
        <p className="text-ink-3 text-sm">
          Up to {room.settings.maxPlayers} players. Once the game starts, nobody else can join.
        </p>

        {isHost ? (
          <div className="mt-1.5 flex flex-col gap-2.5">
            <Button block onClick={onStart} disabled={busy}>
              {busy ? 'Starting…' : room.round > 1 ? 'Start next round' : 'Start game'}
            </Button>
            <Button variant="secondary" block onClick={onOpenHostControls}>
              Host controls
            </Button>
          </div>
        ) : (
          <p className="bg-cream rounded-card text-ink-2 p-3.5 text-sm">
            Waiting for the host to start. You are in — your card is dealt the moment the round
            begins.
          </p>
        )}
      </div>
    </div>
  );
}
