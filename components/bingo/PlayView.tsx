'use client';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { NumberPicker } from '@/components/bingo/NumberPicker';
import { SelectedNumbers } from '@/components/bingo/SelectedNumbers';
import { TurnBanner } from '@/components/bingo/TurnBanner';
import { PlayerScoreStrip } from '@/components/room/PlayerScoreStrip';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { describeLine, findWinningLine } from '@/lib/bingo';
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

/** Bingo in play: turn-based number picking against a fixed board. */
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

  // Recomputed from the board and the selected numbers, exactly as the engine
  // does — so the button only appears when a claim would actually be accepted.
  const myLine = findWinningLine(card, selected);
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

      {myLine ? (
        <div className="bg-forest rounded-card mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-2xl leading-tight font-medium text-white">BINGO!</p>
            <p className="mt-1 text-sm text-white/85">
              {describeLine(myLine)} is complete. Claim it before somebody else does.
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

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <NumberPicker
            selected={selected}
            onPick={onSelectNumber}
            enabled={isYourTurn}
            busy={busy}
          />
          <SelectedNumbers selected={selected} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-ink-1 mb-2 text-lg font-medium">Your board</h2>
            {/* The completed line is highlighted as soon as it exists, so the
                board itself shows what the Call Bingo button is offering. */}
            <BingoBoard card={card} selected={selected} winningLine={myLine} label="Your board" />
            <p className="text-ink-3 mt-2 text-sm">
              Marked automatically as numbers are taken. Complete any row, column or diagonal.
            </p>
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
            {others.map((player) => (
              <li key={player.id} className="flex flex-col gap-2">
                <span className="text-ink-2 truncate text-sm font-medium">{player.name}</span>
                <BingoBoard
                  card={bingo?.cards[player.id] ?? []}
                  selected={selected}
                  label={`${player.name}'s board`}
                  compact
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
