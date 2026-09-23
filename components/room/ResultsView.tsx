'use client';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { PlayerAvatar } from '@/components/room/PlayerAvatar';
import { ScoreTable, type ScoreTableRow } from '@/components/room/ScoreTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Speech } from '@/components/ui/Speech';
import { Sticker } from '@/components/ui/Sticker';
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

/**
 * The round-results screen, shown between rounds.
 *
 * It follows the win-state recipe in design-language.md: the winner's face
 * peeks over the result card, the result pops in once, two stickers, and the
 * mascot says one line. Then the screen is quiet.
 */
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
    color: row.color,
    note: row.note,
    value: `+${row.gain}`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Card
        tone="brand-soft"
        {...(winner ? { peek: <PlayerAvatar player={winner} size="lg" mood="wow" /> } : {})}
        className="flex flex-col gap-2"
      >
        <Sticker kind="sparkle" size={32} className="animate-pop absolute top-4 right-5" />
        <Sticker kind="star" size={20} className="animate-pop absolute top-12 right-14" />
        <p className="text-small">
          Round {room.round} of {room.settings.rounds}
        </p>
        <h1 className="text-title animate-pop pr-16">
          {winner ? `${winner.name} called bingo` : 'Round over'}
        </h1>
        <p className="max-w-prose">
          {lines.length > 0
            ? `${lines.map(describeLine).join(', ')}. That took ${room.bingo?.selected.length ?? 0} numbers. Everyone else keeps points for the lines they completed.`
            : 'Everyone else keeps points for the lines they completed.'}
        </p>
      </Card>

      {winner ? (
        <Speech mood="wow">
          {isWinner ? 'You got all five lines first.' : `${winner.name} got there first.`}
        </Speech>
      ) : null}

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
        <div className="grid items-start gap-6 md:grid-cols-2">
          <section className="flex flex-col gap-3">
            <h2 className="text-heading">Your board</h2>
            <BingoBoard
              card={myCard}
              selected={selected}
              winningLines={myLines}
              label="Your board"
            />
            <p className="text-small text-ink-soft">
              {myLines.length === 0
                ? 'No completed lines.'
                : `${myLines.length} of ${LINES_TO_WIN}: ${myLines.map(describeLine).join(', ')}.`}
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading">{winner?.name}&rsquo;s winning board</h2>
            <BingoBoard
              card={winnerCard}
              selected={selected}
              winningLines={lines}
              label={`${winner?.name}'s winning board`}
            />
            <p className="text-small text-ink-soft">
              {lines.length} of {LINES_TO_WIN}: {lines.map(describeLine).join(', ')}.
            </p>
          </section>
        </div>
      ) : winner && winnerCard.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-heading">
            {isWinner ? 'Your winning board' : `${winner.name}\u2019s winning board`}
          </h2>
          <div className="w-full max-w-md">
            <BingoBoard
              card={winnerCard}
              selected={selected}
              winningLines={lines}
              label={isWinner ? 'Your winning board' : `${winner.name}'s winning board`}
            />
          </div>
        </div>
      ) : null}

      <ScoreTable rows={rows} caption={`Points earned in round ${room.round}`} />

      {isHost ? (
        <div className="flex flex-wrap gap-3">
          {/*
            On the last round this screen IS the end of the session, so the
            thing most groups want next, another game with the same people,
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
        <p className="bg-sunken rounded-input p-4">
          {isFinalRound
            ? 'Waiting for the host to start another game or show the scoreboard.'
            : 'Waiting for the host to deal the next round.'}
        </p>
      )}
    </div>
  );
}
