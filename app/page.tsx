import Link from 'next/link';

import { PracticeBoard } from '@/components/bingo/PracticeBoard';
import { GameCard } from '@/components/games/GameCard';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Face } from '@/components/ui/Face';
import { Input } from '@/components/ui/Input';
import { GAMES } from '@/lib/games';
import { ROOM_KEY_LENGTH } from '@/lib/room-key';

/**
 * Landing page, a synchronous Server Component, so React Testing Library can
 * render it directly.
 *
 * It follows the party-game recipe in design-language.md: the first viewport
 * holds the key entry, the one primary action. The join form is a plain GET
 * to /join, so it works before any JavaScript loads. /join then asks for a
 * nickname with the key already filled in.
 *
 * Below the fold is the real board, playable, then the games.
 */
export default function HomePage() {
  const liveGames = GAMES.filter((game) => game.status === 'playable');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-5 py-10 sm:gap-24 sm:px-8 sm:py-16">
      <section className="flex flex-col gap-5">
        <h1 className="text-hero">Bingo for your group chat</h1>
        <p className="text-ink-soft max-w-prose">
          One person creates a room and shares the six-character key. Everyone else types it here.
          It works in any browser, on a phone, a laptop or a TV.
        </p>

        <Card
          peek={
            <span className="bg-brand-soft border-line inline-grid size-14 place-items-center rounded-full border-2">
              <Face size={48} blink />
            </span>
          }
        >
          <form action="/join" method="get" className="flex flex-col gap-4">
            <Input
              label="Room key"
              name="key"
              code
              maxLength={ROOM_KEY_LENGTH}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="PLZ4K9"
            />
            <Button type="submit" size="lg" block>
              Join game
            </Button>
          </form>
        </Card>

        <p>
          Hosting?{' '}
          <Link href="/create" className={buttonStyles({ variant: 'quiet' })}>
            Create a room
          </Link>
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Try the board</h2>
        <p className="text-ink-soft max-w-prose">
          This is the board you play on. In a room, players take turns and every number taken is
          marked on every board. Here you take all of them.
        </p>
        <PracticeBoard />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-title">Games</h2>
        <ul className="flex flex-col gap-5">
          {liveGames.map((game) => (
            <li key={game.id}>
              <GameCard game={game} headingLevel="h3" />
            </li>
          ))}
        </ul>
        <p>
          <Link href="/games" className={buttonStyles({ variant: 'quiet' })}>
            See every game
          </Link>
        </p>
      </section>
    </div>
  );
}
