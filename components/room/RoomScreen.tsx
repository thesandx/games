'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';

import { PlayView } from '@/components/bingo/PlayView';
import { HostDrawer } from '@/components/room/HostDrawer';
import { LobbyView } from '@/components/room/LobbyView';
import { ResultsView } from '@/components/room/ResultsView';
import { ScoreboardView } from '@/components/room/ScoreboardView';
import { buttonStyles } from '@/components/ui/Button';
import { Face } from '@/components/ui/Face';
import { Speech } from '@/components/ui/Speech';
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
  /**
   * The last rejected action, remembered together with the round it happened
   * in.
   *
   * Carrying the round is what stops a message outliving its own truth. Take a
   * number just as somebody else calls bingo and the server answers, correctly,
   * "This round is already over." Ten seconds later the host has played again
   * and that sentence is sitting over a freshly dealt board, right when it was
   * written, nonsense by the time it is read.
   *
   * It is derived rather than cleared by an effect, so there is no window where
   * the two disagree: the message is simply not shown once its round is gone.
   */
  const [actionError, setActionError] = useState<{ message: string; round: string } | null>(null);

  /** Identifies the round on screen. A message about another one is stale. */
  const roundKey = room ? `${room.phase}:${room.round}` : '';

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
        setActionError({
          message: cause instanceof Error ? cause.message : 'That did not work.',
          round: roundKey,
        });
        // Re-read: the local optimistic view may now disagree with the truth.
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [apply, busy, identity, refresh, roundKey],
  );

  /** The message, but only while the round it complains about is still here. */
  const visibleError =
    actionError !== null && actionError.round === roundKey ? actionError.message : null;

  const isHost = room !== null && room !== undefined && room.hostId === identity?.playerId;

  if (identity === undefined || room === undefined) {
    return <p className="text-ink-soft mx-auto w-full max-w-5xl">Loading room…</p>;
  }

  if (error !== null && room === null) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <h1 className="text-title">Could not load this room</h1>
        <div role="alert">
          <Speech mood="sad">{error}</Speech>
        </div>
      </div>
    );
  }

  if (room === null) {
    return (
      <EmptyState
        title="No room with that key"
        body={`Room ${roomKey} does not exist, or it expired. Keys stop working two hours after the last round.`}
      >
        <Link href="/join" className={buttonStyles()}>
          Try another key
        </Link>
        <Link href="/create" className={buttonStyles({ variant: 'quiet' })}>
          Create a room
        </Link>
      </EmptyState>
    );
  }

  const me = room.players.find((player) => player.id === identity?.playerId);

  if (!identity || !me) {
    return (
      <EmptyState
        title="You are not in this room"
        body={`Room ${room.key} is live with ${room.players.length} ${room.players.length === 1 ? 'player' : 'players'}. Pick a nickname to join.`}
      >
        <Link href={{ pathname: '/join', query: { key: room.key } }} className={buttonStyles()}>
          Join this room
        </Link>
      </EmptyState>
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
          actionError={visibleError}
          onSelectNumber={(value) => void run((id) => roomTransport.selectNumber(id, value))}
          onClaimBingo={() => void run((id) => roomTransport.claimBingo(id))}
          onOpenHostControls={() => setHostOpen(true)}
        />
      ) : null}

      {room.phase === 'round-results' ? (
        <ResultsView
          room={room}
          playerId={identity.playerId}
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

      {visibleError !== null && room.phase !== 'playing' ? (
        <div role="alert" className="mx-auto mt-6 w-full max-w-5xl">
          <Speech mood="sad">{visibleError}</Speech>
        </div>
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

      <p className="mx-auto mt-10 w-full max-w-5xl">
        <Link href="/games" className={buttonStyles({ variant: 'quiet' })}>
          Leave the room
        </Link>
      </p>
    </>
  );
}

/**
 * The empty-state recipe from design-language.md: a sleepy face, one line that
 * says what happened, and the action that fixes it.
 */
function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5">
      <span className="bg-sunken border-line inline-grid size-20 place-items-center rounded-full border-2">
        <Face mood="sleepy" size={72} />
      </span>
      <h1 className="text-title">{title}</h1>
      <p className="text-ink-soft max-w-prose">{body}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}
