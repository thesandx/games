import Link from 'next/link';

import { Face } from '@/components/ui/Face';

/**
 * Site header.
 *
 * The logo is the mascot's face, not a letter in a circle. See
 * design-language.md > Recipes. It does not blink here: the header is on every
 * page, and ambient motion belongs to the mascot's key moments only.
 *
 * A Server Component: there is no state to hold.
 */
export function Header({ brandName }: { brandName: string }) {
  return (
    <header className="border-line bg-paper border-b-2">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-5 py-2 sm:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2">
          <span
            aria-hidden="true"
            className="bg-brand-soft border-line inline-grid size-10 place-items-center rounded-full border-2"
          >
            <Face size={34} />
          </span>
          <span className="font-display text-heading">{brandName}</span>
        </Link>
        <nav aria-label="Main" className="-mr-2 flex items-center">
          <Link href="/games" className="flex min-h-11 items-center px-2 font-medium">
            Games
          </Link>
          <Link href="/how-to-play" className="flex min-h-11 items-center px-2 font-medium">
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
