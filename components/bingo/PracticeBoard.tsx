'use client';

import { useState } from 'react';

import { BingoBoard } from '@/components/bingo/BingoBoard';
import { BingoProgress } from '@/components/bingo/BingoProgress';
import { Button } from '@/components/ui/Button';
import { findWinningLines, LINES_TO_WIN } from '@/lib/bingo';

/**
 * One fixed board, the same on server and client. A shuffle at render time
 * would draw a different board on each side and fail hydration.
 */
const PRACTICE_CARD: readonly number[] = [
  7, 19, 2, 23, 11, 14, 4, 25, 9, 16, 21, 12, 1, 18, 5, 3, 24, 15, 8, 20, 10, 17, 6, 13, 22,
];

/**
 * A board to try on the home page, alone and with no room.
 *
 * The design language asks the landing page to show the product working rather
 * than describe it. This is the real board and the real line rules, with one
 * player taking every turn. Nothing is sent anywhere.
 */
export function PracticeBoard() {
  const [selected, setSelected] = useState<readonly number[]>([]);
  const lines = findWinningLines(PRACTICE_CARD, selected);
  const done = lines.length >= LINES_TO_WIN;

  return (
    <div className="flex flex-col gap-4">
      <BingoProgress earned={Math.min(lines.length, LINES_TO_WIN)} />
      <div className="max-w-md">
        <BingoBoard
          card={PRACTICE_CARD}
          selected={selected}
          winningLines={lines}
          latest={selected.at(-1) ?? null}
          label="Practice board"
          onPick={(value) => setSelected((taken) => [...taken, value])}
          canPick={!done}
        />
      </div>
      <div aria-live="polite">
        {done ? (
          <p className="font-display text-key animate-pop">Bingo!</p>
        ) : (
          <p className="text-ink-soft">
            {selected.length === 0
              ? 'Tap a number to take it.'
              : `${selected.length} numbers taken.`}
          </p>
        )}
      </div>
      {selected.length > 0 ? (
        <div>
          <Button variant="secondary" onClick={() => setSelected([])}>
            Clear the board
          </Button>
        </div>
      ) : null}
    </div>
  );
}
