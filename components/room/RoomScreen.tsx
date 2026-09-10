'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';

import { PlayView } from '@/components/bingo/PlayView';
import { HostDrawer } from '@/components/room/HostDrawer';
import { LobbyView } from '@/components/room/LobbyView';
import { ResultsView } from '@/components/room/ResultsView';
import { ScoreboardView } from '@/components/room/ScoreboardView';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { usePlayerIdentity } from '@/hooks/usePlayerIdentity';
import { useRoom } from '@/hooks/useRoom';
import { roomTransport } from '@/services/room-transport';
import type { PlayerIdentity, Room } from '@/types/playroom';

/**
 * The room, for every phase.
 *
 * One route rather than four, and that is deliberate. Phase is owned by the
 * room, not by the URL: when the host starts a round every player must move at
 * once. With a route per phase each client would have to be redirected on its
 * next poll, which shows people a screen that is already stale.
 *
 * Every action goes through `run`, which applies the room the transport hands
 * back. The transport is the authority: a pick made out of turn, on a taken
 * number, or a bingo claim on an incomplete board comes back as an error and
 * the local view is re-read rather than patched optimistically.
 */
export function RoomScreen({ roomKey }: { roomKey: string }) {
  const { identity } = usePlayerIdentity(roomKey);
  const { room, error, apply, refresh } = useRoom(roomKey, identity ?? undefined);
  const [hostOpen, setHostOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /**
   * Runs a transport call, applies the room it returns, and turns a rule
   * violation into a message instead of an unhandled rejection.
   */
  const run = useCallback(
    async (action: (id: PlayerIdentity) => Promise<Room>) => {
      if (!identity || busy) return;
      setBusy(true);
      setActionError(null);
      try {
        apply(await action(identity));
      } catch (cause) {
        setActionError(cause instanceof Error ? cause.message : 'That did not work.');
        // Re-read: the local optimistic view may now disagree with the truth.
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [apply, busy, identity, refresh],
  );

  const isHost = room !== null && room !== undefined && room.hostId === identity?.playerId;

  if (identity === undefined || room === undefined) {
    return <p className="text-ink-3 mx-auto max-w-[1120px] text-sm">Loading room…</p>;
  }

  if (error !== null && room === null) {
    return (
      <div className="mx-auto max-w-[460px] text-center">
        <h1 className="font-display text-ink-1 text-2xl font-normal">Could not load this room</h1>
        <p className="text-ink-3 mt-3 text-sm">{error}</p>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="mx-auto max-w-[460px] text-center">
        <h1 className="font-display text-ink-1 text-2xl font-normal">No room with that key</h1>
        <p className="text-ink-3 mt-3 text-sm">
          Room {roomKey} does not exist, or it expired — keys stop working two hours after the last
          round.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/join">Try another key</ButtonLink>
          <ButtonLink href="/create" variant="secondary">
            Create a room
          </ButtonLink>
        </div>
      </div>
    );
  }

  const me = room.players.find((player) => player.id === identity?.playerId);

  if (!identity || !me) {
    return (
      <div className="mx-auto max-w-[460px] text-center">
        <h1 className="font-display text-ink-1 text-2xl font-normal">You are not in this room</h1>
        <p className="text-ink-3 mt-3 text-sm">
          Room {room.key} is live with {room.players.length}{' '}
          {room.players.length === 1 ? 'player' : 'players'}. Pick a nickname to join.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href={{ pathname: '/join', query: { key: room.key } }}>
            Join this room
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <>
      {room.phase === 'lobby' ? (
        <LobbyView
          room={room}
          isHost={isHost}
          busy={busy}
          onStart={() => void run((id) => roomTransport.startRound(id))}
          onOpenHostControls={() => setHostOpen(true)}
        />
      ) : null}

      {room.phase === 'playing' ? (
        <PlayView
          room={room}
          playerId={identity.playerId}
          isHost={isHost}
          busy={busy}
          actionError={actionError}
          onSelectNumber={(value) => void run((id) => roomTransport.selectNumber(id, value))}
          onClaimBingo={() => void run((id) => roomTransport.claimBingo(id))}
          onOpenHostControls={() => setHostOpen(true)}
        />
      ) : null}

      {room.phase === 'round-results' ? (
        <ResultsView
          room={room}
          isHost={isHost}
          busy={busy}
          onNextRound={() => void run((id) => roomTransport.nextRound(id))}
          onEndSession={() => void run((id) => roomTransport.endSession(id))}
          onPlayAgain={() => void run((id) => roomTransport.replaySession(id))}
        />
      ) : null}

      {room.phase === 'finished' ? (
        <ScoreboardView
          room={room}
          isHost={isHost}
          busy={busy}
          onPlayAgain={() => void run((id) => roomTransport.replaySession(id))}
        />
      ) : null}

      {actionError !== null && room.phase !== 'playing' ? (
        <p role="alert" className="text-coral mx-auto mt-4 max-w-[1120px] text-sm">
          {actionError}
        </p>
      ) : null}

      {isHost ? (
        <HostDrawer
          open={hostOpen}
          onClose={() => setHostOpen(false)}
          room={room}
          onLock={() => void run((id) => roomTransport.lockRoom(id))}
          onRemovePlayer={(target) => void run((id) => roomTransport.removePlayer(id, target))}
          onEndSession={() => {
            setHostOpen(false);
            void run((id) => roomTransport.endSession(id));
          }}
        />
      ) : null}

      <p className="mx-auto mt-8 max-w-[1120px] text-center">
        <Link href="/games" className="text-link text-sm">
          Leave the room
        </Link>
      </p>
    </>
  );
}
