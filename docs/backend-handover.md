# Playroom rooms API — backend handover

This document specifies the service that replaces the placeholder at `https://api.sandeep.app/games`.

- **Stack:** FastAPI, Neon Postgres.
- **Audience:** the backend engineer who builds it.
- **Status of the client:** complete and working. It runs against a browser-local transport today. See [ADR-0003](./adr/0003-abstract-room-state-behind-a-transport.md).

Read [Two decisions you must make first](#two-decisions-you-must-make-first) before you write code. Both change the contract.

---

## Table of contents

1. [What already exists](#what-already-exists)
2. [Two decisions you must make first](#two-decisions-you-must-make-first)
3. [Identity without login](#identity-without-login)
4. [Data model](#data-model)
5. [Concurrency — the two patterns that matter](#concurrency--the-two-patterns-that-matter)
6. [Endpoints](#endpoints)
7. [Payload shapes](#payload-shapes)
8. [Errors](#errors)
9. [Real-time updates](#real-time-updates)
10. [The rules the server enforces](#the-rules-the-server-enforces)
11. [Adding the next game](#adding-the-next-game)
12. [Analytics](#analytics)
13. [Retention and cleanup](#retention-and-cleanup)
14. [Operational requirements](#operational-requirements)
15. [Switch-over checklist](#switch-over-checklist)
16. [Open questions](#open-questions)

---

## What already exists

The frontend is a Next.js App Router application. It is finished. It talks to one interface, `RoomTransport`, and never calls HTTP directly from a screen.

| File                           | What it holds                                              |
| ------------------------------ | ---------------------------------------------------------- |
| `types/playroom.ts`            | The domain model. This is the wire contract.               |
| `lib/room-engine.ts`           | Every game rule, as pure reducers over a `Room`.           |
| `lib/bingo.ts`                 | Board generation, the twelve winning lines, win detection. |
| `services/playroom-api.ts`     | The HTTP client you are writing the server for.            |
| `services/local-room-store.ts` | The browser transport it replaces.                         |

**Read `lib/room-engine.ts` first.** It is the specification of the rules in executable form. Port it to Python rather than re-deriving the rules from prose. Section [The rules the server enforces](#the-rules-the-server-enforces) lists what it does.

The client is not trusted. It disables an out-of-turn button as a convenience, but it expects the server to reject the request anyway.

---

## Two decisions you must make first

### 1. The current auth header is not safe

Today the client sends `X-Player-Id: <uuid>`. That value is also public: it appears in the room payload as `hostId`, in `bingo.turnOrder`, in `bingo.cards` keys, and on every entry in `players`.

So the identifier and the credential are the same string. Any player in a room can read another player's id from the room state and act as them. They can take that player's turn or claim their bingo.

**Fix:** split them.

- `playerId` — a UUID. Public. Stays in the room payload.
- `playerToken` — an opaque secret, 32 random bytes, base64url. Returned **once**, at create or join. Never appears in a room payload.

The client sends `Authorization: Bearer <playerToken>`. The server looks up the player by the SHA-256 hash of the token.

This needs a small frontend change: `identityHeaders()` in `services/playroom-api.ts`, and the `PlayerIdentity` type gains a `playerToken` field. It is roughly twenty lines. Do not build the unsafe version and plan to fix it later.

### 2. The product promises no data is kept

The "How to play" screen says:

> Nothing is stored against you — close the tab and the nickname is gone.

Analytics must not contradict this. Concretely:

- Do **not** issue a long-lived device or visitor id.
- Do **not** join a player across rooms.
- Do **not** retain IP addresses beyond a short abuse window.

You can still answer almost every product question. See [Analytics](#analytics). If the business needs cross-session tracking, the copy must change first. That is a product decision, not yours.

---

## Identity without login

There are no accounts. A player is an anonymous participant in exactly one room.

**On create or join, the server:**

1. Generates `player_id` (UUID v4).
2. Generates a 32-byte token, returns it base64url-encoded.
3. Stores only `sha256(token)` in `players.token_hash`.
4. Returns `{ room, playerId, playerToken }`.

**The client stores both in `sessionStorage`.** Session storage is per-tab and deliberate: it lets one browser hold two players in two tabs, which is how the app is tested. It also means a closed tab loses the identity, which matches the promise above.

**Every mutating request carries the token.** Resolve it to a player, then check that the player belongs to the room in the URL. Reject with `not-in-room` when it does not.

**A player who loses their token cannot recover it.** That is acceptable: they rejoin as a new player with a new nickname. Do not build recovery.

**Nicknames are not identity.** They are unique within one live room only, case-insensitive. They mean nothing across rooms.

---

## Data model

Postgres 16 on Neon. `gen_random_uuid()` needs `pgcrypto`, which Neon enables by default.

The split that matters: **generic tables describe a session; per-game tables describe a game.** Adding a game adds tables. It does not change the core.

### Core

```sql
CREATE TABLE games (
  id          text PRIMARY KEY,              -- 'bingo', 'scribble', 'ttt'
  name        text        NOT NULL,
  status      text        NOT NULL,          -- 'playable' | 'building'
  min_players smallint    NOT NULL,
  max_players smallint    NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE room_status AS ENUM ('active', 'expired');
CREATE TYPE room_phase  AS ENUM ('lobby', 'playing', 'round-results', 'finished');

CREATE TABLE rooms (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key            text        NOT NULL,
  game_id        text        NOT NULL REFERENCES games(id),
  host_player_id uuid,                       -- FK added after players exists
  phase          room_phase  NOT NULL DEFAULT 'lobby',
  round_number   int         NOT NULL DEFAULT 1,
  settings       jsonb       NOT NULL,       -- { rounds, privacy, maxPlayers }
  status         room_status NOT NULL DEFAULT 'active',
  version        bigint      NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL
);

-- A key is unique among ACTIVE rooms only. Expired rooms keep their key for
-- analytics, and the key becomes reusable. The predicate must be immutable,
-- so a sweeper flips status rather than the index reading now().
CREATE UNIQUE INDEX rooms_active_key ON rooms (key) WHERE status = 'active';
CREATE INDEX rooms_expiry ON rooms (expires_at) WHERE status = 'active';
```

```sql
CREATE TABLE players (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name text        NOT NULL,
  avatar_color text        NOT NULL,
  score        int         NOT NULL DEFAULT 0,
  is_host      boolean     NOT NULL DEFAULT false,
  seat         int         NOT NULL,         -- join order; seeds turn order
  token_hash   bytea       NOT NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  left_at      timestamptz
);

CREATE UNIQUE INDEX players_room_name
  ON players (room_id, lower(display_name)) WHERE left_at IS NULL;
CREATE UNIQUE INDEX players_room_seat ON players (room_id, seat);
CREATE INDEX players_token ON players (token_hash);

ALTER TABLE rooms
  ADD CONSTRAINT rooms_host_fk FOREIGN KEY (host_player_id) REFERENCES players(id);
```

```sql
CREATE TABLE rounds (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id            uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  game_id            text        NOT NULL REFERENCES games(id),
  round_number       int         NOT NULL,
  status             text        NOT NULL DEFAULT 'playing', -- playing|won|abandoned
  turn_order         uuid[]      NOT NULL,
  current_turn_index int         NOT NULL DEFAULT 0,
  winner_player_id   uuid        REFERENCES players(id),
  win_detail         jsonb,                  -- the WinningLine
  state              jsonb       NOT NULL DEFAULT '{}',  -- per-game extras
  started_at         timestamptz NOT NULL DEFAULT now(),
  ended_at           timestamptz
);

CREATE UNIQUE INDEX rounds_room_number ON rounds (room_id, round_number);
```

### Bingo

```sql
CREATE TABLE bingo_boards (
  round_id  uuid       NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id uuid       NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  cells     smallint[] NOT NULL,             -- 25 entries, a permutation of 1..25
  PRIMARY KEY (round_id, player_id),
  CONSTRAINT bingo_boards_size CHECK (array_length(cells, 1) = 25)
);

CREATE TABLE bingo_selections (
  round_id   uuid        NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  number     smallint    NOT NULL CHECK (number BETWEEN 1 AND 25),
  seq        int         NOT NULL,
  player_id  uuid        NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, number),            -- makes a double-take impossible
  UNIQUE (round_id, seq)
);
```

`PRIMARY KEY (round_id, number)` is not decoration. It is how the database — not your application code — guarantees that two players never take the same number. See the next section.

There is no marks table. **Marking is derived**: a cell is marked when its number appears in `bingo_selections` for that round. One shared list means every board agrees by construction. Do not add per-player mark state.

---

## Concurrency — the two patterns that matter

The requirement is that a client cannot win by sending a well-timed request. Two database patterns give you that. Use both.

### Taking a number

Serialise on the round row, then let the unique index be the backstop.

```sql
BEGIN;

SELECT id, status, turn_order, current_turn_index
  FROM rounds WHERE id = $1 FOR UPDATE;      -- serialises concurrent turns

-- In Python: reject unless status = 'playing'
--            and turn_order[current_turn_index] = caller's player_id
--            and 1 <= number <= 25

INSERT INTO bingo_selections (round_id, number, seq, player_id)
VALUES ($1, $2, (SELECT coalesce(max(seq), 0) + 1 FROM bingo_selections WHERE round_id = $1), $3);
-- unique_violation on (round_id, number) => respond `number-taken`

UPDATE rounds
   SET current_turn_index = (current_turn_index + 1) % cardinality(turn_order)
 WHERE id = $1;

UPDATE rooms SET version = version + 1 WHERE id = $4;

INSERT INTO events (...) VALUES (...);       -- same transaction, always

COMMIT;
```

`FOR UPDATE` makes the turn check correct. The primary key makes the number check correct even if the turn check is ever wrong.

### Claiming bingo

The first valid claim must win, and only the first.

```sql
BEGIN;
SELECT * FROM rounds WHERE id = $1 FOR UPDATE;
-- Read the board and the selections, then validate the line in Python.
-- Port findWinningLine() from lib/bingo.ts.

UPDATE rounds
   SET winner_player_id = $2, win_detail = $3, status = 'won', ended_at = now()
 WHERE id = $1 AND winner_player_id IS NULL AND status = 'playing';
-- 0 rows affected => somebody already won => respond `round-over`
COMMIT;
```

Validate against `bingo_boards.cells` and `bingo_selections`. **Never** against anything the client sends. The client does not send marks, and there is no field for it to do so.

A rejected claim must leave the round running. Do not change `status` on a failed claim.

---

## Endpoints

Base path `/v1`. All bodies are JSON. All responses use **camelCase** — Pydantic needs `alias_generator=to_camel` and `populate_by_name=True`, because the client types are TypeScript.

Every route below except `GET /v1/games` and `GET /health` requires `Authorization: Bearer <playerToken>`, except room creation and joining, which mint it.

| Method   | Path                                     | Client method                | Auth         |
| -------- | ---------------------------------------- | ---------------------------- | ------------ |
| `POST`   | `/v1/rooms`                              | `createRoom`                 | none         |
| `GET`    | `/v1/rooms/{key}`                        | `getRoom`                    | optional     |
| `POST`   | `/v1/rooms/{key}/players`                | `joinRoom`                   | none         |
| `DELETE` | `/v1/rooms/{key}/players/{playerId}`     | `removePlayer`               | host or self |
| `POST`   | `/v1/rooms/{key}/rounds`                 | `startRound`                 | host         |
| `POST`   | `/v1/rooms/{key}/rounds/current/actions` | `selectNumber`, `claimBingo` | player       |
| `POST`   | `/v1/rooms/{key}/rounds/advance`         | `nextRound`                  | host         |
| `POST`   | `/v1/rooms/{key}/lock`                   | `lockRoom`                   | host         |
| `POST`   | `/v1/rooms/{key}/end`                    | `endSession`                 | host         |
| `POST`   | `/v1/rooms/{key}/replay`                 | `replaySession`              | host         |
| `GET`    | `/v1/rooms/{key}/stream`                 | (new) real-time              | player       |
| `GET`    | `/v1/games`                              | (new) catalogue              | none         |
| `GET`    | `/health`                                | probes                       | none         |

**Every mutating endpoint returns the full `Room` object**, exactly as `GET /v1/rooms/{key}` would. The client applies the returned room directly and skips a re-fetch. Do not return `204`.

### The action envelope

One endpoint carries every in-game move. This is the seam that lets you add games without adding routes.

```
POST /v1/rooms/{key}/rounds/current/actions
{ "type": "select_number", "payload": { "value": 17 } }
{ "type": "claim_bingo",   "payload": {} }
```

Dispatch on `(game_id, type)`. An unknown type for the room's game returns `422`.

This differs from the placeholder client, which has `/round/select` and `/round/claim`. Changing it is two lines in `services/playroom-api.ts`. Take the envelope — the alternative is a new route for every move of every future game.

---

## Payload shapes

These are generated from `types/playroom.ts`. Match them exactly.

### `Room`

```json
{
  "key": "PLZ4K9",
  "gameId": "bingo",
  "hostId": "8f14e45f-ceea-467a-9a3e-1b0c6a3f0001",
  "phase": "playing",
  "round": 2,
  "players": [
    {
      "id": "8f14e45f-ceea-467a-9a3e-1b0c6a3f0001",
      "name": "Rhea",
      "initial": "R",
      "color": "peach",
      "score": 100,
      "isHost": true,
      "isReady": true
    }
  ],
  "settings": { "rounds": 5, "privacy": "Key only", "maxPlayers": 20 },
  "bingo": {
    "selected": [17, 4, 23],
    "cards": { "8f14e45f-ceea-467a-9a3e-1b0c6a3f0001": [7, 19, 2, "…25 numbers"] },
    "turnOrder": ["8f14e45f-ceea-467a-9a3e-1b0c6a3f0001"],
    "currentTurnIndex": 0,
    "winnerId": null,
    "winningLines": []
  },
  "lastRound": null,
  "createdAt": "2026-09-09T10:00:00.000Z",
  "expiresAt": "2026-09-09T12:00:00.000Z"
}
```

Rules for this object:

- `bingo` is `null` outside a live or just-finished round.
- `bingo.cards` is keyed by player id and contains **every** player's board. The client renders all of them; boards are not secret.
- `winningLines` is an **array** of `{ "kind": "row" | "column" | "diagonal", "index": 1..5, "cells": [5 ints] }`, holding every line the winner had — five or more. Empty (`[]`) while the round is running. `cells` are 0-based indices into the 25-cell array, row-major. Diagonals use `index` 1 for top-left to bottom-right and 2 for top-right to bottom-left.
- `lastRound` is populated only when `phase` is `round-results`. It is an array of `{ playerId, name, initial, color, note, gain }`, sorted by `gain` descending.
- `initial` is the first character of `name`, uppercased. Take a full code point, not `name[0]` — a surrogate pair must not be cut in half.
- Timestamps are ISO-8601 with a `Z` suffix.

### Create and join responses

```json
{ "room": { "…": "Room" }, "playerId": "uuid", "playerToken": "base64url" }
```

### Request bodies

```json
POST /v1/rooms
{ "gameId": "bingo",
  "settings": { "rounds": 5, "privacy": "Key only", "maxPlayers": 20 },
  "hostName": "Rhea", "hostColor": "peach" }

POST /v1/rooms/{key}/players
{ "name": "Dev", "color": "mint" }
```

### Validation bounds

The client enforces these. Enforce them again.

| Field                 | Rule                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `key`                 | 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Case-insensitive on input. `I`, `O`, `0` and `1` are excluded. |
| `hostName` / `name`   | Trimmed, 1 to 16 characters. Unique per live room, case-insensitive.                                                 |
| `color`               | One of `peach`, `mint`, `yellow`, `mustard`, `cream`.                                                                |
| `settings.rounds`     | Integer, 3 to 7.                                                                                                     |
| `settings.maxPlayers` | One of 8, 12, 20.                                                                                                    |
| `settings.privacy`    | `Key only` or `Locked after start`.                                                                                  |
| Bingo `value`         | Integer, 1 to 25.                                                                                                    |

Reject a nickname that is only whitespace. Normalise Unicode to NFC before the uniqueness check.

---

## Errors

Return the code the client already understands. The client shows `message` to the player verbatim, so write it as player-facing English.

```json
{ "code": "not-your-turn", "message": "It is not your turn yet." }
```

| Code             | HTTP  | When                                                |
| ---------------- | ----- | --------------------------------------------------- |
| `room-not-found` | `404` | No active room with that key.                       |
| `room-full`      | `409` | `players` has reached `settings.maxPlayers`.        |
| `room-locked`    | `409` | Privacy is `Locked after start` and play has begun. |
| `not-host`       | `403` | A host-only action from a non-host.                 |
| `not-in-room`    | `403` | The token resolves to no player in this room.       |
| `wrong-phase`    | `409` | The action does not apply in the current phase.     |
| `name-taken`     | `409` | Nickname already used in this room.                 |
| `not-your-turn`  | `409` | A selection from a player who is not on turn.       |
| `number-taken`   | `409` | The number is already in `bingo_selections`.        |
| `invalid-number` | `422` | Outside 1 to 25, or not an integer.                 |
| `invalid-claim`  | `409` | No complete row, column or diagonal on that board.  |
| `round-over`     | `409` | A second claim, or a selection after a win.         |

Any other failure returns `500` with a generic message. The client shows a generic message for anything it cannot parse, so never leak a stack trace.

`GET /v1/rooms/{key}` returns `404` for an unknown key. The client turns that into `null`, which renders the "No room with that key" screen.

---

## Real-time updates

The client polls `GET /v1/rooms/{key}` every 2 seconds today. That works on day one. Do not remove it — it is the fallback.

**Add Server-Sent Events.** `GET /v1/rooms/{key}/stream` emits the full `Room` on every change. SSE is enough because it is one-way: actions are ordinary POSTs. It needs no WebSocket infrastructure, survives proxies, and reconnects on its own.

Cheap polling: add `version` to the room row and support `If-None-Match` against it. Return `304` when the client is current. A room with twenty players idling in a lobby then costs almost nothing.

### The Neon gotcha

To fan out across workers you want Postgres `LISTEN`/`NOTIFY`. **It does not work through Neon's pooled endpoint**, which is PgBouncer in transaction mode. Pick one:

- Open the listener on Neon's **direct** (unpooled) connection string, and use the pooled one for everything else. Simplest.
- Or run Redis pub/sub and skip `LISTEN`/`NOTIFY`.
- Or run a single worker and fan out in process. Fine for launch, not for scale.

Neon also scales to zero. The first query after idle pays a cold start of a few hundred milliseconds. Either keep a warm connection or accept it on the first request of a quiet period.

---

## The rules the server enforces

Port these from `lib/room-engine.ts` and `lib/bingo.ts`. The TypeScript is the reference implementation and it has 105 passing tests behind it.

**Boards.** Each player gets the numbers 1 to 25 in a Fisher-Yates shuffle. Every number appears exactly once. There is no free square. Boards are fixed once the round starts.

**Turns.** `turn_order` is seat order, fixed when the round is dealt. After a valid selection, advance by one and wrap. A player who joins mid-round is appended to `turn_order` and dealt a board; the running turn does not move.

**Selection.** Only the player on turn. Only a number in 1 to 25. Only a number nobody has taken. The number is then marked for everybody, because marking is derived.

**Winning.** Each completed row, column or diagonal earns one letter of B-I-N-G-O. **Five** completed lines win, out of the twelve that exist. Lines share cells, so one number can complete two at once — count the lines, do not assume one per pick. One line is not a win. A full board is not required, and a full board holds all twelve lines, so a claim may carry more than five. Lines are computed from the board and the selections.

**Claiming.** A player must claim explicitly, and only once five letters are filled. Validate server-side by counting completed lines — never trust a client's count. The first valid claim ends the round; later claims get `round-over`. An invalid claim is rejected and the round continues.

**Scoring.** The winner gets 100. Every other player gets 10 for each complete line they hold. Scores accumulate across rounds within a session.

**Removal.** A host may remove any player except themselves. Mid-round this drops them from `turn_order`. If the removed player was on turn, play moves to the next player; otherwise the same player stays on turn. Do not let removal skip somebody's turn.

**Phases.** `lobby` → `playing` → `round-results` → `playing` (next round) → … → `finished`. `nextRound` from the last round goes to `finished`. `replaySession` returns to `lobby`, keeps the players, and zeroes the scores.

**Edge case with no owner yet.** With many players, 25 numbers can run out before anyone completes a line. The current client lets the round stall. Decide the behaviour and tell the frontend — see [Open questions](#open-questions).

---

## Adding the next game

The core tables carry no Bingo concepts. A new game adds tables and a strategy class. It changes no route.

Define a protocol and register one implementation per game:

```python
class GameEngine(Protocol):
    game_id: str

    def deal(self, round_id: UUID, player_ids: list[UUID]) -> None:
        """Create the per-game rows for a new round."""

    def apply_action(self, round: Round, player: Player, action: Action) -> None:
        """Validate and apply one move. Raise RoomError on a rule violation."""

    def check_win(self, round: Round, player: Player) -> WinDetail | None:
        """Return the winning detail, or None."""

    def public_state(self, round: Round) -> dict:
        """The per-game block that hangs off the Room payload."""
```

`public_state` is what becomes `room["bingo"]`. For Scribble it becomes `room["scribble"]`. The client's `Room` type gains one optional key per game, and existing screens are untouched.

Checklist for a new game:

1. Insert a row in `games`.
2. Add its tables, prefixed with the game id.
3. Implement `GameEngine` and register it.
4. Add its action types to the envelope.
5. Flip `games.status` to `playable` only when all four are done.

Keep the invariant that makes Bingo safe: **derive shared state from one append-only table with the right unique constraint, rather than storing per-player copies.**

---

## Analytics

Constraint first: no cross-session identity. See [decision 2](#2-the-product-promises-no-data-is-kept).

### The event store

Write an event in the **same transaction** as every state change. Never in a background task — an event that can be lost is not an audit log.

```sql
CREATE TABLE events (
  id          bigserial   PRIMARY KEY,
  room_id     uuid,
  round_id    uuid,
  player_id   uuid,
  game_id     text,
  type        text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_room ON events (room_id, id);
CREATE INDEX events_type_time ON events (type, occurred_at);
CREATE INDEX events_game_time ON events (game_id, occurred_at);
```

Event types to emit:

`room_created`, `player_joined`, `player_left`, `player_removed`, `room_locked`,
`round_started`, `number_selected`, `bingo_claimed`, `bingo_rejected`,
`round_won`, `round_advanced`, `session_ended`, `session_replayed`, `room_expired`.

Put the useful dimensions in `payload`. For `number_selected`: the number, the sequence, and how long the player took. For `bingo_rejected`: why. `bingo_rejected` is the one that tells you whether the rules are understood.

### Questions this answers

- How many rooms are created, and how many reach a first round? The gap is your setup drop-off.
- Median players per room, and per game.
- Median round duration, and numbers taken per round.
- How often a round exhausts 25 numbers with no winner.
- Win rate by seat position. If seat 1 wins far more often, turn order is unfair.
- Which numbers players take first. Pure curiosity, but it is the kind of thing that makes a good launch post.
- How often players claim bingo and are rejected.
- Rooms abandoned mid-round.

### Rollups

Add a nightly job into a `daily_game_stats` table: date, game id, rooms created, rounds played, distinct players, median duration. Dashboards read the rollup. They never scan `events`.

### What not to build

No user table. No device id. No funnel that follows a person between rooms. If a question needs one of those, it is a product decision first.

---

## Retention and cleanup

Rooms expire two hours after the last round. That is on screen, so it is a promise.

Run a sweeper every few minutes:

1. `UPDATE rooms SET status = 'expired' WHERE status = 'active' AND expires_at < now()`.
   The room disappears from key lookup at once. This is what frees the key.
2. After 7 days, delete `bingo_boards`, `bingo_selections`, and `players.display_name`
   (set it to `NULL` or `'player'`). Keep the rows and the ids.
3. Keep `events` and `rounds` indefinitely. They carry no name after step 2.

Anonymising rather than deleting keeps every aggregate correct while honouring the promise. Run it as a scheduled job — Cloud Scheduler hitting an authenticated endpoint, or `pg_cron` on Neon.

---

## Operational requirements

**CORS.** Allow the Cloud Run origin and `http://localhost:3000`. Allow `Authorization` and `Content-Type`. Credentials are not needed — the token is a bearer header, not a cookie.

**Rate limits.** There is no login, so nothing stops a script. Limit by IP: room creation to about 10 per hour, joins to about 30 per hour, actions to about 5 per second. Cloud Run puts the client IP first in `X-Forwarded-For`. Use the IP for rate limiting only, and do not store it beyond the window.

**Key generation.** Draw 6 characters from the 32-character alphabet — about 1.07 billion combinations. Insert and retry on unique violation, up to 5 attempts. Do not pre-check for existence; the unique index is the check.

**Idempotency.** Network retries will double-post a selection. Accept an optional `Idempotency-Key` header on action requests and store it per round. Without it, a retried "take 17" returns `number-taken` and looks like a bug to the player.

**Timeouts.** The client aborts after 8 seconds. Keep p99 well under that.

**Health.** `GET /health` must not touch the database. A probe that fails on a database blip makes Cloud Run kill a healthy container and amplifies the outage. Put the dependency check on `/health/deep` and point only dashboards at it.

**Migrations.** Alembic. The frontend reads `Room` by field name, so a rename is a breaking change. Add fields; do not repurpose them.

---

## Switch-over checklist

1. Implement the endpoints. `GET /v1/rooms/{key}` and `POST /v1/rooms` first — they unblock everything.
2. Apply the token change in `services/playroom-api.ts` and `types/playroom.ts`.
3. Point the client at the service:
   - `NEXT_PUBLIC_PLAYROOM_API_URL=https://api.sandeep.app/games/v1`
   - `NEXT_PUBLIC_PLAYROOM_TRANSPORT=remote`
4. **Rebuild the image.** Both are `NEXT_PUBLIC_*`, so they are inlined at build time. Changing them on the Cloud Run service alone does nothing. See CLAUDE.md, trap 8.
5. Verify with two browsers on two devices, not two tabs. Two tabs pass against the local transport too, so they prove nothing about the service.

The preview banner disappears on its own when the transport becomes `remote`.

---

## Open questions

Answer these with the product owner before you finish.

1. **A round with no winner.** 25 numbers, many players — the board can run out. End the round with no winner and no points? Reshuffle and continue? Award the player with the most complete lines? The client has no screen for this yet.
2. **The host leaves.** Nothing currently promotes a new host, so the room cannot start another round. Promote the longest-present player, or end the session?
3. **Reconnect.** Session storage is cleared when the tab closes, and the player is then a stranger to their own room. Is that acceptable, or is a short-lived rejoin token wanted? A rejoin token weakens the privacy promise.
4. **Does a spectator exist?** `GET /v1/rooms/{key}` currently works without a token. Anyone with a key can watch. Confirm that is intended.
5. **Analytics retention.** Is 7 days the right window before names are dropped? Legal may have a view.
