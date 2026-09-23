import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { TransportNotice } from '@/components/layout/TransportNotice';
import { env } from '@/lib/env';

/**
 * Mochi typefaces, self-hosted from public/fonts (Latin subsets, ~72 KB total).
 * Self-hosting means the build never calls Google Fonts, so the Docker build
 * works offline. See .github/instructions/design-language.md > Type.
 */
const mochiy = localFont({
  src: '../public/fonts/mochiypopone-400.woff2',
  weight: '400',
  variable: '--font-mochiy',
  display: 'swap',
});

const zenMaru = localFont({
  src: [
    { path: '../public/fonts/zenmarugothic-400.woff2', weight: '400' },
    { path: '../public/fonts/zenmarugothic-500.woff2', weight: '500' },
    { path: '../public/fonts/zenmarugothic-700.woff2', weight: '700' },
  ],
  variable: '--font-zen-maru',
  display: 'swap',
});

/**
 * The product theme. Playroom is a party game, so it takes the `playroom`
 * theme and its high cute budget. Set once per product, here only.
 */
const THEME: 'playroom' | 'calm' | 'night' = 'playroom';

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: 'Playroom: party games with a room key',
    template: `%s | Playroom`,
  },
  description:
    'Bingo for the group chat. Create a room, share the six-character key, and play in the browser without an account.',
  robots: {
    index: env.isProduction,
    follow: env.isProduction,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Matches --color-paper for the active theme. Change both together.
  themeColor: '#fff7fa',
};

/**
 * Root layout. A Server Component, and it must stay one.
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
    <html
      lang="en"
      data-theme={THEME}
      className={`${mochiy.variable} ${zenMaru.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <TransportNotice />
        <Header brandName="Playroom" />
        <main className="flex-1">{children}</main>
        <Footer brandName="Playroom" />
      </body>
    </html>
  );
}
