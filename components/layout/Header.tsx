import Link from 'next/link';

/**
 * Site header.
 *
 * The design's "Screens" dropdown is deliberately absent: it existed to jump
 * between artboards in the design canvas, and in a shipped app its job is done
 * by the routes themselves.
 *
 * A Server Component, with the dropdown gone there is no state left to hold.
 */
export function Header({ brandName }: { brandName: string }) {
  return (
    <header className="border-b border-hairline bg-white">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="bg-peach text-ink-1 border-ink-1 font-display inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 text-[17px] leading-none font-medium"
          >
            P
          </span>
          <span className="font-display text-ink-1 text-lg leading-none font-medium tracking-[-0.2px]">
            {brandName}
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1.5">
          <Link href="/games" className="text-ink-3 flex min-h-[44px] items-center px-2.5 text-sm">
            Games
          </Link>
          <Link
            href="/how-to-play"
            className="text-ink-3 flex min-h-[44px] items-center px-2.5 text-sm"
          >
            How to play
          </Link>
        </nav>
      </div>
    </header>
  );
}
