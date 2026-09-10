'use client';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { ScoreTable, type ScoreTableRow } from '@/components/room/ScoreTable';
import { Button } from '@/components/ui/Button';
import { describeLine, findWinningLines, LINES_TO_WIN } from '@/lib/bingo';
import type { BingoCard, Room } from '@/types/playroom';

export interface ResultsViewProps {
  room: Room;
  /** The viewer, so their own board can be shown beside the winner's. */
  playerId: string;
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
  playerId,
  isHost,
  onNextRound,
  onEndSession,
  onPlayAgain,
  busy,
}: ResultsViewProps) {
  const winner = room.players.find((player) => player.id === room.bingo?.winnerId);
  const lines = room.bingo?.winningLines ?? [];
  const isFinalRound = room.round >= room.settings.rounds;

  const selected = room.bingo?.selected ?? [];
  const myCard: BingoCard = room.bingo?.cards[playerId] ?? [];
  const winnerCard: BingoCard = winner ? (room.bingo?.cards[winner.id] ?? []) : [];
  // The lines the viewer finished, recomputed the same way the engine does, so
  // "you had three" is shown on the board rather than only counted in a row.
  const myLines = findWinningLines(myCard, selected);
  // When the viewer IS the winner there is nothing to compare against, so the
  // one board stays centred and full width rather than sitting in half a grid.
  const isWinner = winner?.id === playerId;
  const showBoth = myCard.length > 0 && winnerCard.length > 0 && !isWinner;

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

      {/*
        Both boards, not just the winner's.
        Every board holds the same 25 numbers in a different order, so the only
        way to see why somebody else got there first is to put the two next to
        each other. Replacing the player's own board with the winner's answered
        "who won" and threw away "how close was I".

        Stacked on a phone and side by side from tablet width up, which is the
        first point at which two 5x5 grids are still readable in half the
        column each.
      */}
      {showBoth ? (
        <div className="mt-5 grid items-start gap-5 md:grid-cols-2">
          <section>
            <h2 className="text-ink-1 mb-2 text-lg font-medium">Your board</h2>
            <BingoBoard
              card={myCard}
              selected={selected}
              winningLines={myLines}
              label="Your board"
            />
            <p className="text-ink-3 mt-2 text-sm">
              {myLines.length === 0
                ? 'No completed lines.'
                : `${myLines.map(describeLine).join(', ')} — ${myLines.length} of ${LINES_TO_WIN}.`}
            </p>
          </section>

          <section>
            <h2 className="text-ink-1 mb-2 text-lg font-medium">
              {winner?.name}&rsquo;s winning board
            </h2>
            <BingoBoard
              card={winnerCard}
              selected={selected}
              winningLines={lines}
              label={`${winner?.name}'s winning board`}
            />
            <p className="text-ink-3 mt-2 text-sm">
              {lines.map(describeLine).join(', ')} — {lines.length} of {LINES_TO_WIN}.
            </p>
          </section>
        </div>
      ) : winner && winnerCard.length > 0 ? (
        <div className="mt-5">
          <h2 className="text-ink-1 mb-2 text-lg font-medium">
            {isWinner ? 'Your winning board' : `${winner.name}\u2019s winning board`}
          </h2>
          <div className="mx-auto max-w-[420px]">
            <BingoBoard
              card={winnerCard}
              selected={selected}
              winningLines={lines}
              label={isWinner ? 'Your winning board' : `${winner.name}'s winning board`}
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
