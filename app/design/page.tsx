import type { Metadata } from 'next';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Face } from '@/components/ui/Face';
import { Input } from '@/components/ui/Input';
import { RoomKeyDisplay } from '@/components/ui/RoomKeyDisplay';
import { Speech } from '@/components/ui/Speech';
import { Sticker } from '@/components/ui/Sticker';

export const metadata: Metadata = {
  title: 'Design',
  robots: { index: false, follow: false },
};

const SWATCHES = [
  { name: 'paper', className: 'bg-paper', use: 'Page background' },
  { name: 'surface', className: 'bg-surface', use: 'Cards, inputs' },
  { name: 'ink', className: 'bg-ink', use: 'Text and outlines' },
  { name: 'brand', className: 'bg-brand', use: 'The main action' },
  { name: 'butter', className: 'bg-butter', use: 'Bingo, first place' },
  { name: 'soda', className: 'bg-soda', use: 'Scribble, second place' },
  { name: 'grape', className: 'bg-grape', use: 'Tic-tac-toe' },
  { name: 'peach', className: 'bg-peach', use: 'The number just taken' },
];

const PLAYERS = ['sandy', 'momo', 'captain_k', 'bubbles', 'rajma chawal'];

const TONES = ['brand-soft', 'butter', 'soda', 'grape', 'peach'] as const;

/**
 * The living style guide. It renders every primitive in components/ui/ with
 * real content. When you add or change one, show it here in the same PR.
 * Not indexed; safe to ship.
 */
export default function DesignPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-5 py-12 sm:px-8 sm:py-20">
      <header className="flex flex-col gap-4">
        <span className="bg-brand-soft border-line shadow-mochi inline-grid size-20 place-items-center rounded-full border-2">
          <Face size={64} blink label="The Mochi face" />
        </span>
        <h1 className="text-hero">Mochi</h1>
        <p className="text-ink-soft max-w-prose">
          Soft on the outside, firm underneath. Chunky outlines and a hard base keep things clear;
          faces, blush and a little bounce keep them friendly.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Colour</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map((swatch) => (
            <li key={swatch.name} className="flex flex-col gap-2">
              <span
                className={`border-line rounded-input block h-16 border-2 ${swatch.className}`}
              />
              <span className="font-medium">{swatch.name}</span>
              <span className="text-small text-ink-soft">{swatch.use}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Type</h2>
        <p className="font-display text-hero">Bingo night</p>
        <RoomKeyDisplay roomKey="PLZ4K9" label="Room key" />
        <p className="max-w-prose">
          Body text is Zen Maru Gothic: rounded, calm and easy to read at 16px. Headings are Mochiy
          Pop One, which carries the personality. Nothing else.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Buttons and chips</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Create room</Button>
          <Button variant="secondary">Copy key</Button>
          <Button variant="quiet">Rules</Button>
          <Button variant="secondary" disabled>
            Room is locked
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Chip selected>All</Chip>
          <Chip>Quick</Chip>
          <Chip>Team</Chip>
        </div>
        <p className="text-small text-ink-soft">
          Press one. It sinks onto its base: the squish. A selected chip shows a check as well as
          the fill.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Join a room</h2>
        <Card peek={<Avatar name="momo" size="lg" />}>
          <div className="flex flex-col gap-4">
            <Input label="Room key" code maxLength={6} autoComplete="off" placeholder="PLZ4K9" />
            <Input label="Nickname" hint="Everyone in the room sees this." />
            <Button block size="lg">
              Join room
            </Button>
          </div>
        </Card>
        <Input label="Room key" code defaultValue="PLZ4K" error="Keys are 6 letters or numbers." />
        <Card flat>
          <p>A flat card holds information and sits without a base, like the rules panel.</p>
        </Card>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Players</h2>
        <ul className="flex flex-wrap gap-3">
          {PLAYERS.map((name) => (
            <li
              key={name}
              className="border-line bg-surface rounded-pill flex items-center gap-2 border-2 py-1 pr-4 pl-1"
            >
              <Avatar name={name} size="sm" />
              <span className="font-medium">{name}</span>
            </li>
          ))}
        </ul>
        <p className="text-small text-ink-soft">
          A player can choose their colour. The face still comes from the nickname.
        </p>
        <ul className="flex flex-wrap gap-3">
          {TONES.map((tone) => (
            <li key={tone}>
              <Avatar name="sandy" tone={tone} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Moments</h2>
        <Speech>momo joined. That makes five of you.</Speech>
        <Speech mood="sad">No room with that key. Check it with the host.</Speech>
        <Card
          tone="brand-soft"
          peek={<Avatar name="bubbles" size="lg" mood="wow" />}
          className="flex flex-col gap-1"
        >
          <Sticker kind="sparkle" size={36} className="animate-pop absolute top-4 right-5" />
          <Sticker kind="heart" size={22} className="animate-pop absolute top-12 right-14" />
          <p className="font-display text-key">Bingo!</p>
          <p className="text-ink-soft">bubbles took the round in 14 numbers.</p>
        </Card>
      </section>
    </div>
  );
}
