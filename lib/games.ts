/**
 * The game catalogue and its rules copy.
 *
 * Content is taken verbatim from the design so the built app reads exactly as
 * the artboards do. `status` is what the browse screen keys off:
 *   - `playable` renders the create/rules buttons
 *   - `building` renders the design's "In build — not playable yet" line
 *
 * Bingo is the only `playable` entry today. Promoting Scribble or Tic-tac-toe
 * means implementing its rules in `lib/` and a round handler in the transport —
 * flipping this flag alone would route players into a room that cannot play.
 */

import type { GameId } from '@/types/playroom';

export type GameStatus = 'playable' | 'building';

export interface GameDefinition {
  id: GameId;
  name: string;
  /** Short label on the card corner, e.g. `Live`. */
  tag: string;
  /** Player count and duration, e.g. `3-20 players · 10 min`. */
  meta: string;
  description: string;
  status: GameStatus;
  /** Whole-card surface token. `white` cards carry a hairline border instead. */
  surface: 'peach' | 'mint' | 'yellow' | 'white';
  /** Filters the browse screen offers. */
  categories: readonly string[];
}

export const GAMES: readonly GameDefinition[] = [
  {
    id: 'bingo',
    name: 'Bingo',
    tag: 'Live',
    meta: '2–20 players · 10 min',
    description:
      'Take turns claiming numbers from 1 to 25. Every pick marks that number on every board. Five complete lines spell BINGO and take the round.',
    status: 'playable',
    surface: 'peach',
    categories: ['Quick'],
  },
  {
    id: 'scribble',
    name: 'Scribble',
    tag: 'In build',
    meta: '4–12 players · 15 min',
    description: 'One person draws the word, everyone else races to type it in the guess box.',
    status: 'building',
    surface: 'mint',
    categories: ['Team'],
  },
  {
    id: 'ttt',
    name: 'Tic-tac-toe',
    tag: 'In build',
    meta: '2 players · 3 min',
    description:
      'Best of five against one friend, with a spectator queue for the rest of the room.',
    status: 'building',
    surface: 'yellow',
    categories: ['Quick'],
  },
  {
    id: 'trivia',
    name: 'Trivia',
    tag: 'Coming',
    meta: '3–20 players',
    description: 'Timed question rounds with a category vote before each set.',
    status: 'building',
    surface: 'white',
    categories: ['Team'],
  },
  {
    id: 'wordchain',
    name: 'Word chain',
    tag: 'Coming',
    meta: '3–10 players',
    description: 'Each answer has to start with the last letter of the one before it.',
    status: 'building',
    surface: 'white',
    categories: ['Quick'],
  },
  {
    id: 'mafia',
    name: 'Mafia',
    tag: 'Coming',
    meta: '6–16 players',
    description: 'Night phase, day phase, and a vote. Roles are dealt privately in the room.',
    status: 'building',
    surface: 'white',
    categories: ['Team'],
  },
];

export const BROWSE_FILTERS = ['All', 'Quick', 'Team', 'Coming soon'] as const;
export type BrowseFilter = (typeof BROWSE_FILTERS)[number];

/** Applies a browse-screen filter to the catalogue. */
export function filterGames(filter: BrowseFilter): readonly GameDefinition[] {
  if (filter === 'All') return GAMES;
  if (filter === 'Coming soon') return GAMES.filter((game) => game.status === 'building');
  return GAMES.filter((game) => game.categories.includes(filter));
}

export function findGame(id: GameId): GameDefinition | undefined {
  return GAMES.find((game) => game.id === id);
}

/** Games a host can actually open a room for. */
export function playableGames(): readonly GameDefinition[] {
  return GAMES.filter((game) => game.status === 'playable');
}

export interface HowToPlayEntry {
  id: GameId;
  title: string;
  intro: string;
  steps: readonly string[];
}

/** Tabs and copy for the "How to play" screen. */
export const HOW_TO_PLAY: readonly HowToPlayEntry[] = [
  {
    id: 'bingo',
    title: 'Bingo',
    intro:
      'Everyone gets the numbers 1 to 25 on a 5x5 board, shuffled differently. Players take turns claiming a number, and every claim marks that number on every board at once. Five completed lines spell BINGO and win the round.',
    steps: [
      'Each player gets their own shuffled board when the round starts. There is no free square.',
      'On your turn, tap any number on your board that nobody has taken. It is marked for the whole room.',
      'Nobody marks their own board — marking follows the numbers that have been taken.',
      'Each completed row, column or diagonal fills one letter of BINGO. Lines share numbers, so one pick can fill two letters at once.',
      'When all five letters are filled, press Call Bingo. One line is not enough. You do not need to fill the board.',
      'The first valid claim wins the round. An incorrect claim is rejected and play carries on.',
    ],
  },
  {
    id: 'scribble',
    title: 'Scribble',
    intro: 'One player draws a secret word while everyone else guesses in the chat box.',
    steps: [
      'The drawer picks one of three words and gets 80 seconds.',
      'Guesses appear as bubbles; close guesses are marked as near misses.',
      'Earlier correct guesses score more, and the drawer scores per correct guess.',
      'Everyone draws once before the round counter advances.',
    ],
  },
  {
    id: 'ttt',
    title: 'Tic-tac-toe',
    intro: 'Two players from the room take the board while the rest watch and queue up.',
    steps: [
      'The host picks the first pair, or the room votes.',
      'Best of five, with a 20 second clock per move.',
      'Spectators see the board live and can react between games.',
      'The winner holds the board until they lose.',
    ],
  },
];
