'use client';

import { PlayerList } from '@/components/room/PlayerList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RoomKeyDisplay } from '@/components/ui/RoomKeyDisplay';
import { Speech } from '@/components/ui/Speech';
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

/**
 * The mascot's one line in the lobby. It reacts to the last person in, which is
 * the moment worth marking. It never tells anyone what to do next: the
 * interface does that.
 */
function lobbyLine(room: Room): string {
  const count = room.players.length;
  const newest = room.players.at(-1);
  if (count <= 1 || newest === undefined) return 'Just you so far.';
  return `${newest.name} joined. That makes ${count} of you.`;
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
    <div className="mx-auto grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-title">{game?.name ?? 'Bingo'} waiting room</h1>
          <p className="text-ink-soft max-w-prose">
            Share the key or the link. Anyone with it lands straight in this lobby.
          </p>
        </div>

        <RoomKeyDisplay roomKey={room.key} label="Room key" />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void copy(room.key)}>
            {copied ? 'Key copied' : 'Copy key'}
          </Button>
          <Button variant="secondary" onClick={copyShareLink}>
            Copy link
          </Button>
        </div>
        {failed ? (
          <p role="alert" className="text-small">
            Copying is blocked here. The key is {room.key}.
          </p>
        ) : null}

        <Speech>{lobbyLine(room)}</Speech>

        <PlayerList players={room.players} maxPlayers={room.settings.maxPlayers} />
      </div>

      <Card flat className="flex flex-col gap-4">
        <h2 className="text-heading">This round</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Each player gets their own board of 1 to 25.</li>
          <li>Take turns claiming a number. Every claim marks it for the whole room.</li>
          <li>Five complete lines spell BINGO and win the round.</li>
        </ul>
        <p className="text-small text-ink-soft">
          Up to {room.settings.maxPlayers} players. Once the game starts, nobody else can join.
        </p>

        {isHost ? (
          <div className="flex flex-col gap-3">
            <Button size="lg" block onClick={onStart} disabled={busy}>
              {busy ? 'Starting…' : room.round > 1 ? 'Start next round' : 'Start game'}
            </Button>
            <Button variant="secondary" block onClick={onOpenHostControls}>
              Host controls
            </Button>
          </div>
        ) : (
          <p className="bg-sunken rounded-input p-4">
            Waiting for the host to start. You are in, and your board is dealt the moment the round
            begins.
          </p>
        )}
      </Card>
    </div>
  );
}
