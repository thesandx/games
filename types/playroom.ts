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
  /**
   * Boards, keyed by player id — but only the ones the caller may see.
   *
   * During a round this holds the caller's own board and nothing else: a player
   * never sees another player's grid. Once somebody wins, the winner's board is
   * added so the results screen can show the lines that took the round.
   *
   * The narrowing happens in the transport, not the UI. See
   * `scopeRoomForPlayer` in `lib/room-engine.ts`.
   */
  cards: Record<string, BingoCard>;
  /** Player ids in turn order, fixed when the round is dealt. */
  turnOrder: readonly string[];
  /** Index into `turnOrder` of the player whose turn it is. */
  currentTurnIndex: number;
  /** Set once someone calls a verified bingo. */
  winnerId: string | null;
  /**
   * The completed lines the win was awarded for — five or more, since one line
   * is not a win. Empty while the round is still running. Shown highlighted on
   * the winner's board.
   */
  winningLines: readonly WinningLine[];
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

/**
 * Identifies the caller to the transport for player-scoped actions.
 *
 * `playerId` and `playerToken` are deliberately two different things. The id is
 * public — it appears in `hostId`, in `bingo.turnOrder` and on every entry in
 * `players`, so every player in a room can read every other player's id. If the
 * id were also the credential, any player could take another player's turn or
 * claim their bingo. The token is the credential, it is returned exactly once
 * at create or join, and it never appears in a room payload.
 */
export interface PlayerIdentity {
  roomKey: string;
  /** Public. Safe to render, safe to compare, useless as proof of identity. */
  playerId: string;
  /** Secret. Sent as `Authorization: Bearer`, never logged, never displayed. */
  playerToken: string;
}

/** What create and join hand back. The token is not repeated anywhere else. */
export interface JoinedRoom {
  room: Room;
  playerId: string;
  playerToken: string;
}

/**
 * The full set of room operations every transport must implement.
 *
 * `services/playroom-api.ts` satisfies this over HTTP;
 * `services/local-room-store.ts` satisfies it in the browser.
 */
export interface RoomTransport {
  createRoom(input: CreateRoomInput): Promise<JoinedRoom>;
  joinRoom(input: JoinRoomInput): Promise<JoinedRoom>;
  /**
   * Reads a room, scoped to the caller. The viewer decides which boards come
   * back; omit it for a spectator, who sees none until the winner is revealed.
   *
   * It takes the whole identity rather than an id because the server decides
   * scope from the credential. An id alone would let anyone name any player and
   * be handed that player's board.
   */
  getRoom(key: string, viewer?: PlayerIdentity): Promise<Room | null>;
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
  /**
   * Opens a live channel that pushes the room on every change.
   *
   * Optional, because not every transport has one: the browser store has no
   * server to stream from and relies on its `storage` events instead. Callers
   * must keep polling either way — a push that never arrives has to degrade to
   * a room that is at most one poll interval stale, never to a stuck screen.
   *
   * Returns an unsubscribe function.
   */
  subscribe?(
    key: string,
    viewer: PlayerIdentity | undefined,
    onRoom: (room: Room) => void,
  ): () => void;
}
