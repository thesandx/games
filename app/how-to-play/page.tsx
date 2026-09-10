import type { Metadata } from 'next';

import { HowToPlayTabs } from '@/components/games/HowToPlayTabs';

export const metadata: Metadata = {
  title: 'How to play',
  description: 'Rules for every Playroom game, and how rooms and keys work.',
};

export default function HowToPlayPage() {
  return (
    <section className="px-5 py-7 sm:py-11 lg:py-16">
      <div className="mx-auto max-w-[820px]">
        <h1 className="font-display text-ink-1 text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-normal">
          How to play
        </h1>

        <HowToPlayTabs initialTab="bingo" />

        <div className="bg-cream rounded-card mt-4 p-6">
          <h2 className="text-ink-1 mb-1.5 text-lg font-medium">Rooms and keys</h2>
          <p className="text-ink-2 text-sm leading-relaxed">
            Keys are six characters and case-insensitive. They expire two hours after the last
            round. Nothing is stored against you: close the tab and the nickname is gone.
          </p>
        </div>
      </div>
    </section>
  );
}
