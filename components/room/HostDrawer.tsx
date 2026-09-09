'use client';

import { useEffect, useRef } from 'react';

import { Avatar } from '@/components/ui/Avatar';
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
 * Host-only controls, as a right-hand drawer.
 *
 * Built on the native `<dialog>` element rather than a div with a backdrop:
 * the platform supplies the focus trap, the Escape handler, inertness of the
 * page behind it, and `::backdrop`. Re-implementing those by hand is where
 * custom modals usually go wrong.
 *
 * The design's "Pause the round" and number-calling actions are intentionally
 * not here. Play is turn-based and player-driven: the host has no way to call a
 * number, and nothing in the room model can pause a round. A button that
 * silently does nothing is worse than an absent one.
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
      className="ml-auto h-dvh max-h-none w-full max-w-[380px] border-l border-hairline bg-white p-6 backdrop:bg-ink-1/35"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="host-controls-title" className="font-display text-ink-1 text-2xl font-normal">
            Host controls
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close host controls"
            className="border-ink-1 text-ink-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-[14px] border-2 bg-white text-lg"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="secondary" block onClick={onLock} disabled={locked}>
            {locked ? 'Room is locked' : 'Lock the room'}
          </Button>
        </div>

        <div>
          <h3 className="text-ink-1 mb-2.5 text-lg font-medium">Players</h3>
          {others.length === 0 ? (
            <p className="text-ink-3 text-sm">Nobody else has joined yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {others.map((player) => (
                <li
                  key={player.id}
                  className="border-ink-1 rounded-card flex items-center gap-2.5 border-2 p-2.5"
                >
                  <Avatar
                    initial={player.initial}
                    color={player.color}
                    name={player.name}
                    size="sm"
                  />
                  <span className="text-ink-1 min-w-0 flex-1 truncate text-sm">{player.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemovePlayer(player.id)}
                    className="text-link min-h-[44px] cursor-pointer px-2 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="secondary" block onClick={onEndSession}>
          End session for everyone
        </Button>
      </div>
    </dialog>
  );
}
