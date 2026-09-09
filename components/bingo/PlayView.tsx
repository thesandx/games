'use client';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { BingoProgress } from '@/components/bingo/BingoProgress';
import { TurnBanner } from '@/components/bingo/TurnBanner';
import { PlayerScoreStrip } from '@/components/room/PlayerScoreStrip';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
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
 * removes the need for a "taken" list — the board already shows what has gone.
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
  const currentPlayer = room.players.find((player) => player.id === turnPlayerId);
  const isYourTurn = turnPlayerId === playerId;

  // Recomputed from the board and the taken numbers, exactly as the engine
  // does — so the button only appears when a claim would actually be accepted.
  const myLines = findWinningLines(card, selected);
  const canCallBingo = myLines.length >= LINES_TO_WIN;
  const others = room.players.filter((player) => player.id !== playerId);

  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <span className="text-ink-1 text-sm font-medium">
          {game?.name ?? 'Bingo'} · Round {room.round} of {room.settings.rounds}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-ink-3 text-sm">Key {room.key}</span>
          {isHost ? (
            <button
              type="button"
              onClick={onOpenHostControls}
              className="border-ink-1 text-ink-1 min-h-[44px] cursor-pointer rounded-[14px] border-2 bg-white px-3 text-sm font-medium"
            >
              Host controls
            </button>
          ) : null}
        </span>
      </div>

      <PlayerScoreStrip players={room.players} currentTurnId={turnPlayerId} />

      <TurnBanner current={currentPlayer} isYourTurn={isYourTurn} />

      <div className="border-ink-1 rounded-card mt-4 flex flex-wrap items-center justify-between gap-4 border-2 p-5">
        <BingoProgress earned={Math.min(myLines.length, LINES_TO_WIN)} />
        <p className="text-ink-3 max-w-[34ch] text-sm">
          One letter per completed row, column or diagonal. Lines share numbers, so a single pick
          can fill more than one letter.
        </p>
      </div>

      {canCallBingo ? (
        <div className="bg-forest rounded-card mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-2xl leading-tight font-medium text-white">BINGO!</p>
            <p className="mt-1 text-sm text-white/85">
              All {LINES_TO_WIN} lines are complete. Claim it before somebody else does.
            </p>
          </div>
          <Button variant="secondary" onClick={onClaimBingo} disabled={busy}>
            {busy ? 'Claiming…' : 'Call Bingo'}
          </Button>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-coral mt-4 text-sm">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-ink-1 text-lg font-medium">Your board</h2>
            <span className="text-ink-3 text-sm">
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
          />

          <p className="text-ink-3 text-sm">
            {isYourTurn
              ? 'Tap any free number to take it. It is marked on every board in the room.'
              : `Waiting for ${currentPlayer?.name ?? 'the next player'}. Numbers are marked here as they are taken.`}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border-ink-1 rounded-card border-2 p-4">
            <h2 className="text-ink-1 mb-2 text-lg font-medium">Completed lines</h2>
            {myLines.length === 0 ? (
              <p className="text-ink-3 text-sm">None yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {myLines.map((line) => (
                  <li key={`${line.kind}-${line.index}`} className="text-ink-2 text-sm">
                    {describeLine(line)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ButtonLink size="sm" variant="secondary" href="/how-to-play">
            Rules
          </ButtonLink>
        </div>
      </div>

      {others.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-ink-1 mb-3 text-lg font-medium">Everyone else</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((player) => {
              const theirCard = bingo?.cards[player.id] ?? [];
              const theirLines = findWinningLines(theirCard, selected);
              return (
                <li key={player.id} className="flex flex-col gap-2">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-ink-2 truncate text-sm font-medium">{player.name}</span>
                    <span className="text-ink-3 text-sm">
                      {Math.min(theirLines.length, LINES_TO_WIN)}/{LINES_TO_WIN}
                    </span>
                  </span>
                  <BingoBoard
                    card={theirCard}
                    selected={selected}
                    label={`${player.name}'s board`}
                    compact
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
