import Link from 'next/link';

export function Footer({ brandName }: { brandName: string }) {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-4 px-5 py-6">
        <span className="text-ink-3 text-sm">
          {brandName} — play with friends, no account needed
        </span>
        <span className="flex flex-wrap gap-4">
          <Link href="/how-to-play" className="text-link text-sm">
            How to play
          </Link>
          <Link href="/games" className="text-link text-sm">
            Games
          </Link>
        </span>
      </div>
    </footer>
  );
}
