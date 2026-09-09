import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { Huninn } from 'next/font/google';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { TransportNotice } from '@/components/layout/TransportNotice';
import { env } from '@/lib/env';

/**
 * Huninn is the design system's stand-in for the licensed Haas Grotesk family.
 * It ships a single weight (400), so the 500 steps in the type scale are
 * synthesised by the browser — that is the source system's documented
 * behaviour, not an oversight here.
 *
 * Loaded through `next/font` rather than a Google Fonts `<link>`: the file is
 * self-hosted at build time, which removes a third-party request and the
 * layout shift that comes with it.
 *
 * Expected build warning: "Failed to find font override values for font
 * `Huninn`". Next.js keeps precalculated metrics only for the fonts it knows,
 * and Huninn is not among them, so it cannot synthesise a metric-matched
 * fallback face. The font itself loads and self-hosts normally; only the
 * fallback metrics are absent. `adjustFontFallback: false` does NOT silence it
 * under Turbopack — it was tried and removed rather than left as dead config.
 */
const huninn = Huninn({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-huninn',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: 'Playroom — party games with a room key',
    template: `%s | Playroom`,
  },
  description:
    'Bingo, Scribble and Tic-tac-toe for the group chat. Create a room, share the six-character key, and play in ten seconds. No login, no download.',
  robots: {
    index: env.isProduction,
    follow: env.isProduction,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The design commits to a white canvas; there is no dark palette to match.
  themeColor: '#ffffff',
};

/**
 * Root layout — a Server Component, and it must stay one.
 *
 * Adding `'use client'` here would turn the entire application into a client
 * bundle. Interactive pieces declare `'use client'` themselves, at the leaves.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={huninn.variable} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col antialiased">
        <TransportNotice />
        <Header brandName="Playroom" />
        <main className="flex-1">{children}</main>
        <Footer brandName="Playroom" />
      </body>
    </html>
  );
}
