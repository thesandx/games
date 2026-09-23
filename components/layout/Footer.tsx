import Link from 'next/link';

export function Footer({ brandName }: { brandName: string }) {
  return (
    <footer className="border-line border-t-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-6 sm:px-8">
        <span className="text-small text-ink-soft">
          {brandName}: party games with a room key. No account needed.
        </span>
        <span className="flex flex-wrap gap-x-4">
          <Link href="/how-to-play" className="text-small flex min-h-11 items-center font-medium">
            How to play
          </Link>
          <Link href="/games" className="text-small flex min-h-11 items-center font-medium">
            Games
          </Link>
        </span>
      </div>
    </footer>
  );
}
