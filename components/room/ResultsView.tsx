'use client';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { ScoreTable, type ScoreTableRow } from '@/components/room/ScoreTable';
import { Button } from '@/components/ui/Button';
import { describeLine } from '@/lib/bingo';
import type { Room } from '@/types/playroom';

export interface ResultsViewProps {
  room: Room;
  isHost: boolean;
  onNextRound: () => void;
  onEndSession: () => void;
  /** Restarts the session in this room, keeping the players, zeroing scores. */
  onPlayAgain: () => void;
  busy: boolean;
}

/** The round-results screen, shown between rounds. */
export function ResultsView({
  room,
  isHost,
  onNextRound,
  onEndSession,
  onPlayAgain,
  busy,
}: ResultsViewProps) {
  const winner = room.players.find((player) => player.id === room.bingo?.winnerId);
  const lines = room.bingo?.winningLines ?? [];
  const isFinalRound = room.round >= room.settings.rounds;

  const rows: readonly ScoreTableRow[] = (room.lastRound ?? []).map((row) => ({
    id: row.playerId,
    name: row.name,
    initial: row.initial,
    color: row.color,
    note: row.note,
    value: `+${row.gain}`,
    positive: true,
  }));

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="bg-forest rounded-[22px] p-6 text-center sm:p-8 lg:p-10">
        <span className="text-sm font-medium tracking-[0.16px] text-white/85 uppercase">
          Round {room.round} of {room.settings.rounds}
        </span>
        <h1 className="font-display mt-2.5 mb-1.5 text-[clamp(1.625rem,5vw,2.25rem)] leading-tight font-normal text-white">
          {winner ? `${winner.name} called bingo` : 'Round over'}
        </h1>
        <p className="text-sm text-white/85">
          {lines.length > 0
            ? `${lines.map(describeLine).join(', ')} — on ${room.bingo?.selected.length ?? 0} numbers. Everyone else keeps points for the lines they completed.`
            : 'Everyone else keeps points for the lines they completed.'}
        </p>
      </div>

      {winner && room.bingo ? (
        <div className="mt-5">
          <h2 className="text-ink-1 mb-2 text-lg font-medium">
            {winner.name}&rsquo;s winning board
          </h2>
          <div className="mx-auto max-w-[420px]">
            <BingoBoard
              card={room.bingo.cards[winner.id] ?? []}
              selected={room.bingo.selected}
              winningLines={lines}
              label={`${winner.name}'s winning board`}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <ScoreTable rows={rows} caption={`Points earned in round ${room.round}`} />
      </div>

      {isHost ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {/*
            On the last round this screen IS the end of the session, so the
            thing most groups want next — another game with the same people —
            is offered here rather than only one screen further on. Mid-session
            it is deliberately absent: "Next round" is already the way to carry
            on, and a session reset sitting beside it is a wiped scoreboard one
            mis-tap away.
          */}
          {isFinalRound ? (
            <Button onClick={onPlayAgain} disabled={busy}>
              {busy ? 'Resetting…' : 'Play again, same room'}
            </Button>
          ) : (
            <Button onClick={onNextRound} disabled={busy}>
              {busy ? 'Dealing…' : 'Next round'}
            </Button>
          )}
          <Button variant="secondary" onClick={onEndSession} disabled={busy}>
            {isFinalRound ? 'See final scoreboard' : 'End here and see scoreboard'}
          </Button>
        </div>
      ) : (
        <p className="bg-cream rounded-card text-ink-2 mt-5 p-3.5 text-sm">
          {isFinalRound
            ? 'Waiting for the host to start another game or show the scoreboard.'
            : 'Waiting for the host to deal the next round.'}
        </p>
      )}
    </div>
  );
}
