import Link from 'next/link';

import { GameCard } from '@/components/games/GameCard';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { RoomKeyDisplay } from '@/components/ui/RoomKeyDisplay';
import { GAMES } from '@/lib/games';
import type { AvatarColor } from '@/types/playroom';

/**
 * Landing page — a synchronous Server Component, so it ships no JavaScript for
 * this route and React Testing Library can render it directly.
 */

const STEPS = [
  {
    number: '01',
    surface: 'bg-peach',
    title: 'Pick a game and create',
    body: 'Choose a game, set the number of rounds, and you get a six-character key.',
  },
  {
    number: '02',
    surface: 'bg-mint',
    title: 'Send the key anywhere',
    body: 'Friends open the site, type the key, and pick a nickname. An avatar is generated for them.',
  },
  {
    number: '03',
    surface: 'bg-yellow',
    title: 'Host hits start',
    body: 'Everyone drops into the same round together. Scores carry across the whole session.',
  },
] as const;

/** Illustrative only — the hero shows what a lobby looks like before you make one. */
const EXAMPLE_PLAYERS: ReadonlyArray<{ name: string; initial: string; color: AvatarColor }> = [
  { name: 'Rhea', initial: 'R', color: 'peach' },
  { name: 'Dev', initial: 'D', color: 'mint' },
  { name: 'Ana', initial: 'A', color: 'yellow' },
  { name: 'Kofi', initial: 'K', color: 'mustard' },
];

export default function HomePage() {
  const liveGames = GAMES.filter((game) => game.status === 'playable');

  return (
    <>
      <section className="px-5 pt-9 pb-6 sm:pt-14 lg:pt-21">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="bg-mint border-ink-1 text-ink-1 rounded-pill inline-block border-2 px-4 py-2 text-sm font-medium tracking-[0.16px]">
              No login. No download. Just a key.
            </span>
            <h1 className="font-display text-ink-1 mt-4 text-[clamp(2.125rem,7vw,3rem)] leading-[1.08] font-medium tracking-[-0.6px] text-pretty">
              Make a room, share the key, play in ten seconds
            </h1>
            <p className="text-ink-3 mt-3.5 max-w-[46ch] text-sm leading-relaxed">
              Bingo for the group chat, with more games on the way. One person creates a room,
              everyone else types the key. Same game on a phone, a laptop, or a TV browser.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/create">Create a room</ButtonLink>
              <ButtonLink href="/join" variant="secondary">
                Join with a key
              </ButtonLink>
            </div>
          </div>

          <div className="border-ink-1 rounded-card border-2 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-3 text-sm">Example room</span>
              <span className="text-success text-sm font-medium">4 players in</span>
            </div>
            <RoomKeyDisplay roomKey="PLZ4K9" className="mt-2.5" />
            <ul className="mt-4 flex flex-wrap gap-2">
              {EXAMPLE_PLAYERS.map((player) => (
                <li
                  key={player.name}
                  className="border-ink-1 rounded-pill flex items-center gap-2 border-2 py-1.5 pr-3 pl-1.5"
                >
                  <Avatar
                    initial={player.initial}
                    color={player.color}
                    name={player.name}
                    size="sm"
                  />
                  <span className="text-ink-2 text-sm">{player.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-cream mt-8 px-5 py-8 sm:py-12 lg:py-18">
        <div className="mx-auto max-w-[1120px]">
          <h2 className="font-display text-ink-1 text-[clamp(1.5rem,4vw,2rem)] leading-tight font-normal">
            Three steps, no accounts
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className={`rounded-card border-ink-1 border-2 p-6 ${step.surface}`}
              >
                <span className="font-display text-ink-1 text-xl leading-none font-medium">
                  {step.number}
                </span>
                <h3 className="text-ink-1 mt-2.5 mb-1.5 text-lg font-medium">{step.title}</h3>
                <p className="text-ink-2 text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-5 py-8 sm:py-12 lg:py-18">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-ink-1 text-[clamp(1.5rem,4vw,2rem)] leading-tight font-normal">
              Ready to play
            </h2>
            <Link href="/games" className="text-link text-sm font-medium">
              See all games
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-5 pb-10 sm:pb-14 lg:pb-22">
        <div className="bg-coral mx-auto grid max-w-[1120px] items-center gap-6 rounded-[22px] p-7 sm:p-10 lg:grid-cols-2 lg:p-12">
          <div>
            <span className="text-sm font-medium tracking-[0.16px] text-white/85 uppercase">
              Up to 20 players
            </span>
            <h2 className="font-display mt-2.5 mb-2 text-[clamp(1.5rem,4vw,2rem)] leading-tight font-normal text-white">
              Big group, one key, zero setup
            </h2>
            <p className="max-w-[44ch] text-sm leading-relaxed text-white">
              Rooms stay open for two hours after the last round, so late arrivals can still jump in
              mid-session.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href="/create" variant="secondary">
              Create a room
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
