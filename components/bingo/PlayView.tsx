'use client';

import Link from 'next/link';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { BingoProgress } from '@/components/bingo/BingoProgress';
import { TurnBanner } from '@/components/bingo/TurnBanner';
import { PlayerScoreStrip } from '@/components/room/PlayerScoreStrip';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Speech } from '@/components/ui/Speech';
import { describeLine, findWinningLines, HIGHEST_NUMBER, LINES_TO_WIN } from '@/lib/bingo';
import { findGame } from '@/lib/games';
import { currentTurnPlayerId } from '@/lib/room-engine';
import type { BingoCard, Room } from '@/types/playroom';

export interface PlayViewProps {
  room: Room;
  playerId: string;
  isHost: boolean;
  onSelectNumber: (value: number) => void;
  onClaimBingo: () => void;
  onOpenHostControls: () => void;
  busy: boolean;
  /** Rule violations from the engine, e.g. picking out of turn. */
  actionError: string | null;
}

/**
 * Bingo in play.
 *
 * One grid, not two. The board is the picker: every board already holds all 25
 * numbers, so a separate number pad would be the same 25 buttons twice. Free
 * cells are tappable on your turn; taken cells are filled and inert. That also
 * removes the need for a "taken" list. The board already shows what has gone.
 *
 * You see your own board and nobody else's. The other players' grids are not
 * merely hidden here: the transport does not send them, so there is nothing to
 * find in the payload either. The winner's board is revealed on the results
 * screen once the round is over.
 */
export function PlayView({
  room,
  playerId,
  isHost,
  onSelectNumber,
  onClaimBingo,
  onOpenHostControls,
  busy,
  actionError,
}: PlayViewProps) {
  const game = findGame(room.gameId);
  const bingo = room.bingo;
  const selected = bingo?.selected ?? [];
  const card: BingoCard = bingo?.cards[playerId] ?? [];

  const turnPlayerId = currentTurnPlayerId(room);
  const lastPick = bingo?.lastPick ?? null;
  const lastPicker = room.players.find((person) => person.id === lastPick?.playerId);
  const currentPlayer = room.players.find((player) => player.id === turnPlayerId);
  const isYourTurn = turnPlayerId === playerId;

  // Recomputed from the board and the taken numbers, exactly as the engine
  // does, so the button only appears when a claim would actually be accepted.
  const myLines = findWinningLines(card, selected);
  const canCallBingo = myLines.length >= LINES_TO_WIN;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading">
          {game?.name ?? 'Bingo'}, round {room.round} of {room.settings.rounds}
        </h1>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-small text-ink-soft">
            Key <span className="font-display tracking-widest">{room.key}</span>
          </span>
          {isHost ? (
            <Button variant="secondary" onClick={onOpenHostControls}>
              Host controls
            </Button>
          ) : null}
        </span>
      </div>

      <PlayerScoreStrip players={room.players} currentTurnId={turnPlayerId} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <BingoProgress earned={Math.min(myLines.length, LINES_TO_WIN)} />
        {/*
          Explanatory copy, not state, so a phone drops it. On a small screen it
          pushed the board below the fold, and the board is what a player came
          for. The letters and the "n of 5 lines" count stay at every width.
          Those are state, and the same rule is why the count is text beside a
          row of coloured tiles rather than colour alone. The full rule is one
          tap away under Rules.
        */}
        <p className="text-small text-ink-soft hidden max-w-xs sm:block">
          One letter per completed row, column or diagonal. Lines share numbers, so a single pick
          can fill more than one letter.
        </p>
      </div>

      {/*
        The one primary action of the round, and only when a claim would be
        accepted. It pops in once, when the fifth line lands.
      */}
      {canCallBingo ? (
        <Card
          tone="butter"
          className="animate-pop flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex flex-col gap-1">
            <p className="font-display text-key">Bingo!</p>
            <p>All {LINES_TO_WIN} lines are complete. Claim it before somebody else does.</p>
          </div>
          <Button size="lg" onClick={onClaimBingo} disabled={busy}>
            {busy ? 'Claiming…' : 'Call Bingo'}
          </Button>
        </Card>
      ) : null}

      {actionError ? (
        <div role="alert">
          <Speech mood="sad">{actionError}</Speech>
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex max-w-xl flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-heading">Your board</h2>
            <span className="text-small text-ink-soft">
              {selected.length} of {HIGHEST_NUMBER} numbers taken
            </span>
          </div>

          <BingoBoard
            card={card}
            selected={selected}
            winningLines={myLines}
            label="Your board"
            onPick={onSelectNumber}
            canPick={isYourTurn && !busy}
            latest={lastPick?.value ?? null}
          />

          {/*
            Directly under the board, because that is where a player is looking.
            At the top of the page it sat above the score strip and the progress
            card, so on a phone you scrolled past it to reach the board and then
            could not see whose turn it was without scrolling back.
          */}
          <TurnBanner
            current={currentPlayer}
            isYourTurn={isYourTurn}
            secondsRemaining={bingo?.turnSecondsRemaining ?? null}
            lastPick={
              lastPick
                ? {
                    // A player who has since left keeps their pick on the
                    // board, so fall back rather than dropping the line.
                    name: lastPicker?.name ?? 'A player who left',
                    value: lastPick.value,
                    isYou: lastPick.playerId === playerId,
                  }
                : null
            }
          />

          <p className="text-small text-ink-soft">
            {isYourTurn
              ? 'Tap any free number to take it. It is marked on every board in the room.'
              : 'Numbers are marked here as they are taken.'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card flat className="flex flex-col gap-2">
            <h2 className="text-heading">Completed lines</h2>
            {myLines.length === 0 ? (
              <p className="text-ink-soft">None yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {myLines.map((line) => (
                  <li key={`${line.kind}-${line.index}`}>{describeLine(line)}</li>
                ))}
              </ul>
            )}
          </Card>
          <Link
            href="/how-to-play"
            className={buttonStyles({ variant: 'quiet', className: 'self-start' })}
          >
            Rules
          </Link>
        </div>
      </div>
    </div>
  );
}
