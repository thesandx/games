import type { Metadata } from 'next';

import { HowToPlayTabs } from '@/components/games/HowToPlayTabs';

export const metadata: Metadata = {
  title: 'How to play',
  description: 'Rules for every Playroom game, and how rooms and keys work.',
};

export default function HowToPlayPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-title">How to play</h1>

      <HowToPlayTabs initialTab="bingo" />

      <section className="bg-sunken rounded-card flex flex-col gap-2 p-5 sm:p-6">
        <h2 className="text-heading">Rooms and keys</h2>
        <p className="max-w-prose">
          Keys are six characters and case-insensitive. They expire two hours after the last round.
          Nothing is stored against you: close the tab and the nickname is gone.
        </p>
      </section>
    </div>
  );
}
