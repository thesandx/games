'use client';

import { useEffect, useRef } from 'react';

import { PlayerAvatar } from '@/components/room/PlayerAvatar';
import { Button } from '@/components/ui/Button';
import type { Player, Room } from '@/types/playroom';

export interface HostDrawerProps {
  open: boolean;
  onClose: () => void;
  room: Room;
  onLock: () => void;
  onRemovePlayer: (playerId: string) => void;
  onEndSession: () => void;
}

/**
 * Host-only controls, as a sheet on the right.
 *
 * Built on the native `<dialog>` element rather than a div with a backdrop:
 * the platform supplies the focus trap, the Escape handler, inertness of the
 * page behind it, and `::backdrop`. Re-implementing those by hand is where
 * custom modals usually go wrong.
 *
 * There is no "Pause the round" and no number-calling action. Play is
 * turn-based and player-driven: the host has no way to call a number, and
 * nothing in the room model can pause a round. A button that silently does
 * nothing is worse than an absent one.
 */
export function HostDrawer({
  open,
  onClose,
  room,
  onLock,
  onRemovePlayer,
  onEndSession,
}: HostDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const locked = room.settings.privacy === 'Locked after start';
  const others: readonly Player[] = room.players.filter((player) => player.id !== room.hostId);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="host-controls-title"
      className="border-line bg-surface text-ink rounded-sheet backdrop:bg-ink/40 m-0 ml-auto h-dvh max-h-none w-full max-w-sm rounded-r-none border-2 p-6"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="host-controls-title" className="text-title">
            Host controls
          </h2>
          <Button
            variant="secondary"
            onClick={onClose}
            aria-label="Close host controls"
            className="size-12 px-0"
          >
            <span aria-hidden="true">×</span>
          </Button>
        </div>

        <Button variant="secondary" block onClick={onLock} disabled={locked}>
          {locked ? 'Room is locked' : 'Lock the room'}
        </Button>

        <section className="flex flex-col gap-3">
          <h3 className="text-heading">Players</h3>
          {others.length === 0 ? (
            <p className="text-ink-soft">Nobody else has joined yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {others.map((player) => (
                <li
                  key={player.id}
                  className="border-line rounded-card flex items-center gap-3 border-2 py-1 pr-2 pl-2"
                >
                  <PlayerAvatar player={player} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                  <Button
                    variant="quiet"
                    onClick={() => onRemovePlayer(player.id)}
                    aria-label={`Remove ${player.name}`}
                    className="px-2"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Button variant="secondary" block onClick={onEndSession}>
          End session for everyone
        </Button>
      </div>
    </dialog>
  );
}
