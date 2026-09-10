import type { Metadata } from 'next';

import { GameBrowser } from '@/components/games/GameBrowser';

export const metadata: Metadata = {
  title: 'Pick a game',
  description: 'Every Playroom game, and which ones are playable today.',
};

export default function GamesPage() {
  return (
    <section className="px-5 py-7 sm:py-11 lg:py-16">
      <div className="mx-auto max-w-[1120px]">
        <h1 className="font-display text-ink-1 text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-normal">
          Pick a game
        </h1>
        <p className="text-ink-3 mt-2.5 text-sm">
          Bingo is playable now. The rest are in build. Everything runs in the browser on any
          screen size.
        </p>
        <GameBrowser />
      </div>
    </section>
  );
}
