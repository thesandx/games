import type { Metadata } from 'next';

import { GameBrowser } from '@/components/games/GameBrowser';

export const metadata: Metadata = {
  title: 'Pick a game',
  description: 'Every Playroom game, and which ones are playable today.',
};

export default function GamesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-title">Pick a game</h1>
        <p className="text-ink-soft max-w-prose">
          Bingo is playable now. The others are in build. Every game runs in the browser, on any
          screen size.
        </p>
      </div>
      <GameBrowser />
    </div>
  );
}
