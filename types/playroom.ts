/**
 * Playroom domain model.
 *
 * These types are the contract in two directions at once:
 *   - the shape `services/playroom-api.ts` expects back from
 *     `https://api.sandeep.app/games`
 *   - the shape `services/local-room-store.ts` produces while that endpoint is
 *     still being built
 *
 * Keeping one model for both is what makes the swap a one-line change in
 * `services/room-transport.ts` rather than a rewrite of every screen.
 */

import type { WinningLine } from '@/lib/bingo';
import type { IsoDateString } from '@/types/index';

/** Every game in the catalogue, playable or not. */
export type GameId = 'bingo' | 'scribble' | 'ttt' | 'trivia' | 'wordchain' | 'mafia';

/**
 * Pastel token names used for player avatars. Stored as a token name rather
 * than a hex value so the palette stays swappable from `styles/globals.css`.
 */
export type AvatarColor = 'peach' | 'mint' | 'yellow' | 'mustard' | 'cream';

/** Whether late arrivals can still use the key. */
export type RoomPrivacy = 'Key only' | 'Locked after start';

/** Where a room is in its lifecycle. Drives which screen a player sees. */
export type RoomPhase = 'lobby' | 'playing' | 'round-results' | 'finished';

export interface Player {
  id: string;
  name: string;
  /** First character of the nickname, uppercased. Rendered in the avatar. */
  initial: string;
  color: AvatarColor;
  /** Cumulative score across every round of the session. */
  score: number;
  isHost: boolean;
  isReady: boolean;
}

export interface RoomSettings {
  /** Games played before the final scoreboard. */
  rounds: number;
  privacy: RoomPrivacy;
  maxPlayers: number;
}

/**
 * A single player's board: 25 cells holding the numbers 1..25, each exactly
 * once, shuffled independently per player. There is no free square.
 */
export type BingoCard = readonly number[];

export interface BingoState {
  /**
   * Numbers taken so far, in the order they were chosen. This is the single
   * source of truth for what is marked: a cell is marked when its number is in
   * here, on every board at once. No per-player mark state exists, so boards
   * cannot drift out of sync with each other.
   */
  selected: readonly number[];
  /** Board per player id. Every player gets a different arrangement. */
  cards: Record<string, BingoCard>;
  /** Player ids in turn order, fixed when the round is dealt. */
  turnOrder: readonly string[];
  /** Index into `turnOrder` of the player whose turn it is. */
  currentTurnIndex: number;
  /** Set once someone calls a verified bingo. */
  winnerId: string | null;
  /** The line the win was awarded for, shown on the winner's board. */
  winningLine: WinningLine | null;
}

export type { WinningLine } from '@/lib/bingo';

/** Points a player earned in the round that just ended. */
export interface RoundResultRow {
  playerId: string;
  name: string;
  initial: string;
  color: AvatarColor;
  /** Human-readable achievement, e.g. `Bingo` or `Two lines`. */
  note: string;
  gain: number;
}

export interface Room {
  key: string;
  gameId: GameId;
  hostId: string;
  phase: RoomPhase;
  /** 1-based. Equals `settings.rounds` on the final round. */
  round: number;
  players: readonly Player[];
  settings: RoomSettings;
  /** Present only while `gameId` is `bingo` and a round is in flight. */
  bingo: BingoState | null;
  /** Populated when `phase` is `round-results`. */
  lastRound: readonly RoundResultRow[] | null;
  createdAt: IsoDateString;
  /** Rooms expire two hours after the last round, per the design's copy. */
  expiresAt: IsoDateString;
}

/** Payload for creating a room. The server owns key generation. */
export interface CreateRoomInput {
  gameId: GameId;
  settings: RoomSettings;
  hostName: string;
  hostColor: AvatarColor;
}

/** Payload for joining an existing room by key. */
export interface JoinRoomInput {
  key: string;
  name: string;
  color: AvatarColor;
}

/** Identifies the caller to the transport for player-scoped actions. */
export interface PlayerIdentity {
  roomKey: string;
  playerId: string;
}

/**
 * The full set of room operations every transport must implement.
 *
 * `services/playroom-api.ts` satisfies this over HTTP;
 * `services/local-room-store.ts` satisfies it in the browser.
 */
export interface RoomTransport {
  createRoom(input: CreateRoomInput): Promise<{ room: Room; playerId: string }>;
  joinRoom(input: JoinRoomInput): Promise<{ room: Room; playerId: string }>;
  getRoom(key: string): Promise<Room | null>;
  startRound(identity: PlayerIdentity): Promise<Room>;
  /**
   * Takes a number on the caller's turn. The transport rejects the call when it
   * is not their turn, when the number is already taken, or when the round is
   * not running — the client's view of whose turn it is never decides this.
   */
  selectNumber(identity: PlayerIdentity, value: number): Promise<Room>;
  claimBingo(identity: PlayerIdentity): Promise<Room>;
  nextRound(identity: PlayerIdentity): Promise<Room>;
  endSession(identity: PlayerIdentity): Promise<Room>;
  /** Restarts the session in the same room, keeping the players, zeroing scores. */
  replaySession(identity: PlayerIdentity): Promise<Room>;
  lockRoom(identity: PlayerIdentity): Promise<Room>;
  removePlayer(identity: PlayerIdentity, targetPlayerId: string): Promise<Room>;
}
