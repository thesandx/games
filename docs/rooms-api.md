# Playroom rooms API

This document specifies the rooms API: how it stores a room, how it keeps play fair, and what goes over the wire.

- **Where it runs:** in this application. The route handlers are in `app/api/v1/`. The service is `services/room-store.ts`.
- **Where it stores data:** Firestore in Native mode, in a named database, in `asia-south1`. That is the same region as the Cloud Run service.
- **The client:** `services/playroom-api.ts`, with `NEXT_PUBLIC_PLAYROOM_TRANSPORT=remote`. The base URL is `/api/v1` on the same origin, so there is no CORS.

The API used to be a separate FastAPI service on Neon Postgres. [ADR-0007](./adr/0007-serve-the-rooms-api-from-this-app-on-firestore.md) records why it moved here. The wire contract did not change, so no screen changed.

---

## Table of contents

1. [How the code is arranged](#how-the-code-is-arranged)
2. [Identity without login](#identity-without-login)
3. [Data model](#data-model)
4. [Concurrency](#concurrency)
5. [Endpoints](#endpoints)
6. [Payload shapes](#payload-shapes)
7. [Errors](#errors)
8. [Real-time updates](#real-time-updates)
9. [The rules the server enforces](#the-rules-the-server-enforces)
10. [Adding the next game](#adding-the-next-game)
11. [Analytics](#analytics)
12. [Retention](#retention)
13. [Operational requirements](#operational-requirements)
14. [Testing the API](#testing-the-api)

---

## How the code is arranged

| File                           | What it holds                                                             |
| ------------------------------ | ------------------------------------------------------------------------- |
| `types/playroom.ts`            | The domain model. This is the wire contract.                              |
| `lib/room-engine.ts`           | Every game rule, as pure reducers over a `Room`.                          |
| `lib/bingo.ts`                 | Board generation, the twelve lines, win detection.                        |
| `lib/room-http.ts`             | Request bodies, error statuses, the bearer header, the ETag.              |
| `lib/rate-limit.ts`            | Per-address and per-player rate limits.                                   |
| `services/room-store.ts`       | Firestore: transactions, tokens, the turn clock, host promotion, the log. |
| `services/firestore.client.ts` | The lazy Firestore client, pinned to the named database.                  |
| `app/api/v1/`                  | Route handlers. Each one parses, calls one function, and answers.         |
| `services/playroom-api.ts`     | The HTTP client the screens use.                                          |
| `services/local-room-store.ts` | The browser transport. It runs the same reducers with no server.          |

**The rules live in one place.** `lib/room-engine.ts` is the only code that decides whose turn it is, which numbers are free, and when a claim is good. The browser transport and the server both call it. So the two transports cannot disagree about a rule.

`services/room-store.ts` adds only what needs a server: a transaction, a credential, a clock, and a log.

The client is not trusted. It disables an out-of-turn button as a convenience, but the server rejects the request anyway.

---

## Identity without login

There are no accounts. A player is an anonymous participant in exactly one room.

**On create or join, the server:**

1. Generates a player id (UUID v4). The id is public.
2. Generates a 32-byte token and returns it base64url-encoded.
3. Stores only the SHA-256 hash of the token.
4. Returns `{ room, playerId, playerToken }`.

The token is returned **once**. It never appears in a room payload. See [ADR-0005](./adr/0005-split-the-player-id-from-the-player-token.md).

**The client stores both in `sessionStorage`.** Session storage is per tab. One browser can hold two players in two tabs, and a closed tab loses the identity.

**Every mutating request carries the token** as `Authorization: Bearer <playerToken>`. The server resolves it to a player in the room in the URL. It rejects the request with `not-in-room` when there is no such player.

**A lost token cannot be recovered.** The player joins again with a new nickname. Recovery would need a durable device id, and the "How to play" screen promises not to keep one.

**Nicknames are not identity.** They are unique in one live room only, and the check ignores case. The server trims each nickname and normalises it to NFC before it compares.

---

## Data model

**One document per room: `rooms/{KEY}`.** The document id is the room key, for example `rooms/PLZ4K9`.

The document holds the whole session:

| Field           | What it holds                                                                  |
| --------------- | ------------------------------------------------------------------------------ |
| `room`          | The full `Room`, with every board. It is narrowed per caller on the way out.   |
| `tokenHashes`   | Player id to the SHA-256 of that player's token.                               |
| `seats`         | Player id to seat. Seats never repeat, so seat fairness is measurable.         |
| `version`       | Increases on every change a viewer can see. It drives the ETag and the stream. |
| `sessionId`     | One id per room instance. Events carry it, because a key is used again later.  |
| `roundId`       | A new id for each dealt round. `roundSeq` counts rounds and never resets.      |
| `turnExpiresAt` | When the current turn runs out, in epoch milliseconds.                         |
| `hostSeenAt`    | When the host last made a request, in epoch milliseconds.                      |
| `appliedKeys`   | The idempotency keys already applied in this round.                            |
| `expireAt`      | A Timestamp copy of `room.expiresAt`. The TTL policy reads it.                 |

`services/room-store.ts` validates the document with zod each time it reads it.

### Why one document

Model around the access pattern. The pattern here is simple: every player reads the room every two seconds.

- **One read per poll.** A room in one document costs one read. A normalised model (rooms, players, rounds, boards, selections) costs five.
- **One transaction per move.** Every move reads and writes one document. That is what makes the concurrency rules below hold.
- **Everything is bounded.** A room holds at most 20 players, 25 numbers and one board of 25 per player. A full room is a few kilobytes, far below the 1 MiB limit. There is no array that can grow without limit.
- **The write rate is low.** One document takes about one sustained write per second. A turn-based game of people makes far fewer writes than that. The host's presence is written at most once every 15 seconds.

### Why the key is the document id

The data-modeling rules say "use auto-generated ids". Their reason is write hotspots: sequential and timestamp ids send every write to one end of the key range. A room key is six random characters from a 32-character alphabet, so it spreads across the key range like an auto id.

Using the key as the id gives two things:

- A read is one `get`, not a query.
- A create transaction can read the key's document and prove the key is free. Firestore has no unique index, so this is the uniqueness check.

### Index exemptions

Firestore indexes every field by default, nested fields too. A room document holds up to 20 boards, and nothing queries them. `firestore.indexes.json` exempts `room`, `tokenHashes`, `seats` and `appliedKeys` on `rooms`, and `payload` on `events`. Without the exemptions, one move would write hundreds of index entries.

---

## Concurrency

The requirement: a client cannot win by sending a well-timed request.

**Every move is a Firestore transaction on the room document.** `transact()` in `services/room-store.ts` reads the room, applies the reducer, and writes the result. Firestore serialises two transactions on one document. The second one reads the first one's result.

### Taking a number

Two players send "take 17" at the same moment. Both transactions read the room. Firestore commits one. The other one retries, reads the room again with 17 taken, and the engine rejects it with `number-taken`. The turn check works the same way: the second move sees that the turn has passed.

### Claiming bingo

Two claims arrive at the same moment. Exactly one transaction sees `winnerId === null`. The other one reads the winner and gets `round-over`.

The server checks a claim against the stored board and the taken numbers. The client does not send marks, and there is no field for it to do so.

A rejected claim leaves the round running. The transaction writes the `bingo_rejected` event, commits, and then returns the error.

### Keys

Room creation draws a key and runs a transaction. The transaction reads `rooms/{KEY}`. If a live room is there, it tries a new key, up to five times. If no live room is there, it writes the new room. Two creates that race for one key are serialised, so the second one sees the first one's room.

An expired room's key can be used again. The new room replaces the old document.

---

## Endpoints

Base path `/api/v1`. All bodies are JSON. All fields are camelCase.

Every route except `GET /api/v1/games` needs `Authorization: Bearer <playerToken>`. The exceptions are room creation and joining, which mint the token, and the room read, where the token is optional.

| Method   | Path                                         | Client method                | Auth         |
| -------- | -------------------------------------------- | ---------------------------- | ------------ |
| `POST`   | `/api/v1/rooms`                              | `createRoom`                 | none         |
| `GET`    | `/api/v1/rooms/{key}`                        | `getRoom`                    | optional     |
| `POST`   | `/api/v1/rooms/{key}/players`                | `joinRoom`                   | none         |
| `DELETE` | `/api/v1/rooms/{key}/players/{playerId}`     | `removePlayer`               | host or self |
| `POST`   | `/api/v1/rooms/{key}/rounds`                 | `startRound`                 | host         |
| `POST`   | `/api/v1/rooms/{key}/rounds/current/actions` | `selectNumber`, `claimBingo` | player       |
| `POST`   | `/api/v1/rooms/{key}/rounds/advance`         | `nextRound`                  | host         |
| `POST`   | `/api/v1/rooms/{key}/lock`                   | `lockRoom`                   | host         |
| `POST`   | `/api/v1/rooms/{key}/end`                    | `endSession`                 | host         |
| `POST`   | `/api/v1/rooms/{key}/replay`                 | `replaySession`              | host         |
| `GET`    | `/api/v1/rooms/{key}/stream`                 | `subscribe`                  | optional     |
| `GET`    | `/api/v1/games`                              | the catalogue                | none         |
| `GET`    | `/api/health`                                | probes                       | none         |

**The room read changes with the token.** A request with a valid token gets that player's board in `bingo.cards`. A request with no token is a spectator and gets no board. A token that names nobody in the room gets `not-in-room`, because it is almost always a stale tab.

**Every mutating endpoint returns the `Room` for the caller**, exactly as the read would return it. The client applies it directly and does not read again. No endpoint returns `204`.

### The action envelope

One endpoint carries every in-game move. A new game adds move types, not routes.

```
POST /api/v1/rooms/{key}/rounds/current/actions
{ "type": "select_number", "payload": { "value": 17 } }
{ "type": "claim_bingo",   "payload": {} }
```

A move type that the game does not have returns `wrong-phase`.

---

## Payload shapes

`types/playroom.ts` is the source of these shapes. `lib/room-http.ts` validates every request body with zod.

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
  "settings": { "rounds": 1, "privacy": "Locked after start", "maxPlayers": 8 },
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
- `bingo.cards` is keyed by player id and is **scoped to the caller**. During a round it holds the caller's own board and nothing else. A player must never receive another player's grid. Once the round is won, add the winner's board so the results screen can show the winning lines. A caller with no token is a spectator and gets `{}`. Sending every board and expecting the client to hide the rest is not equivalent: the payload is one dev-tools tab away.
- `winningLines` is an **array** of `{ "kind": "row" | "column" | "diagonal", "index": 1..5, "cells": [5 ints] }`, holding every line the winner had, five or more. Empty (`[]`) while the round is running. `cells` are 0-based indices into the 25-cell array, row-major. Diagonals use `index` 1 for top-left to bottom-right and 2 for top-right to bottom-left.
- `lastRound` is populated only when `phase` is `round-results`. It is an array of `{ playerId, name, initial, color, note, gain }`, sorted by `gain` descending.
- `initial` is the first character of `name`, uppercased. Take a full code point, not `name[0]`. A surrogate pair must not be cut in half.
- Timestamps are ISO-8601 with a `Z` suffix.

### Create and join responses

```json
{ "room": { "…": "Room" }, "playerId": "uuid", "playerToken": "base64url" }
```

### Request bodies

```json
POST /api/v1/rooms
{ "gameId": "bingo",
  "settings": { "rounds": 1, "privacy": "Locked after start", "maxPlayers": 8 },
  "hostName": "Rhea", "hostColor": "peach" }

POST /api/v1/rooms/{key}/players
{ "name": "Dev", "color": "mint" }
```

### Validation bounds

The client enforces these. Enforce them again.

| Field                 | Rule                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `key`                 | 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Case-insensitive on input. `I`, `O`, `0` and `1` are excluded. |
| `hostName` / `name`   | Trimmed, 1 to 16 characters. Unique per live room, case-insensitive.                                                 |
| `color`               | One of `peach`, `mint`, `yellow`, `mustard`, `cream`.                                                                |
| `settings.rounds`     | Integer, 1 or more. The client always sends `1`.                                                                     |
| `settings.maxPlayers` | Integer, 2 to 20. The client always sends `8`.                                                                       |
| `settings.privacy`    | `Key only` or `Locked after start`. The client always sends `Locked after start`.                                    |
| Bingo `value`         | Integer, 1 to 25.                                                                                                    |

Reject a nickname that is only whitespace. Normalise Unicode to NFC before the uniqueness check.

---

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
| `number-taken`   | `409` | The number is already in `bingo.selected`.          |
| `invalid-number` | `422` | Outside 1 to 25, or not an integer.                 |
| `invalid-claim`  | `409` | No complete row, column or diagonal on that board.  |
| `round-over`     | `409` | A second claim, or a selection after a win.         |

Two more codes exist outside the rule table. The client shows their `message` as it is:

| Code              | HTTP  | When                                                            |
| ----------------- | ----- | --------------------------------------------------------------- |
| `invalid-request` | `422` | The body is not JSON, or a field breaks the validation bounds.  |
| `rate-limited`    | `429` | Too many requests from one caller. `Retry-After` says how long. |

Any other failure returns `500` with `server-error` and a generic message. The detail goes to the log. A stack trace never reaches a player.

`GET /api/v1/rooms/{key}` returns `404` for an unknown key. The client turns that into `null`, which renders the "No room with that key" screen.

---

---

## Real-time updates

Three mechanisms keep a screen current. They work together.

1. **The poll.** The client reads the room every two seconds. It always runs, because it is the only mechanism that works in every case.
2. **Cheap polls.** The read sends an `ETag` made of the room version and the viewer. The browser sends it back in `If-None-Match`. An unchanged room answers `304` with no body. The response also carries `Cache-Control: private, no-cache` and `Vary: Authorization`, so two players never share a cached room.
3. **The stream.** `GET /api/v1/rooms/{key}/stream` is Server-Sent Events. It sends an `event: room` frame with the full `Room` on every change.

**The stream is a Firestore snapshot listener.** A move written by any Cloud Run instance reaches a stream held open by any other instance. No broker and no pub/sub is necessary. Each stream scopes the room to its own viewer, so two viewers never receive the same boards.

The stream sends a comment frame every 20 seconds, so proxies do not close a quiet connection. Cloud Run ends a request after `--timeout` (300 seconds), and the client connects again by itself.

A room that does not exist, or a token that is not in the room, gets one `event: closed` frame with `{ code, message }`. The client stops connecting again after that frame.

The client reads the stream with `fetch`, not `EventSource`, because `EventSource` cannot send the `Authorization` header. A token in a query string would go into access logs.

---

## The rules the server enforces

`lib/room-engine.ts` is the reference, and `lib/room-engine.test.ts` tests it.

**Settings are fixed, not chosen.** Every room opens with one round, a cap of eight players, and `Locked after start`. These come from `DEFAULT_ROOM_SETTINGS` in `lib/games.ts`. The server keeps `settings` on the room and validates the range, so a later game can use other values. `maxPlayers` must be in the game's range from `lib/games.ts`, 2 to 20 for Bingo.

**Boards.** Each player gets the numbers 1 to 25 in a Fisher-Yates shuffle. There is no free square. A board does not change after the round starts.

**Board visibility.** A player sees their own board only. `scopeRoomForPlayer` narrows `bingo.cards` on the way out of every handler. The winner's board becomes visible to the room when the round ends.

**Turns.** Turn order is join order, fixed when the round is dealt. A valid selection moves the turn on by one and wraps. A player who joins mid-round goes to the end of the turn order and gets a board. The current turn does not move.

**The turn clock.** A player has 20 seconds (`TURN_SECONDS`). The clock starts again each time the turn changes hands. When a turn runs out, the next read of the room takes a random free number for that player. The client reports the time left in `bingo.turnSecondsRemaining`, a duration, not a deadline, so a wrong device clock cannot change it. The action route does not enforce the clock: a tap sent at 19 seconds that arrives at 21 is a move the player made.

**Selection.** Only the player on turn. Only a whole number from 1 to 25. Only a number that nobody has taken. The number is then marked on every board.

**Winning.** Each complete row, column or diagonal earns one letter of B-I-N-G-O. Five lines win, out of twelve. One number can complete two lines, so the server counts lines.

**Claiming.** A player must claim, and only with five lines. The first valid claim ends the round. Later claims get `round-over`. An invalid claim is rejected and the round continues.

**Scoring.** The winner gets 100. Each other player gets 10 for each complete line. Scores add up across the rounds of a session.

**A board with no winner.** If all 25 numbers go and nobody claims, the round ends. The player who took the last number gets 100, with the note `Closed the board`. The others get 0, with `No bingo called`. At that point every board holds all twelve lines, so "most lines" cannot decide anything, and line points would pay each loser more than the winner.

**Removal.** The host can remove any player except the host. A player can remove themselves. Mid-round, the player leaves the turn order. If they were on turn, play moves to the next player. If not, the same player stays on turn.

**The host.** If the host makes no request for 60 seconds, the next player who reads the room becomes the host. That player is present, which is what a host needs. `hostId` changes in the payload, and the screens follow it.

**Phases.** `lobby` to `playing` to `round-results` to `playing` (the next round), and then `finished`. A round starts from the lobby only. `nextRound` after the last round goes to `finished`. `replaySession` goes back to `lobby`, keeps the players and sets the scores to zero.

---

## Adding the next game

The room document carries no Bingo concept outside `room.bingo`. A new game adds its own block and its own reducers.

1. Add its reducers to `lib/`, with tests, like `lib/room-engine.ts`.
2. Add its block to `Room` in `types/playroom.ts`, next to `bingo`.
3. Add its move types to `applyAction` in `services/room-store.ts`.
4. Set its `status` to `playable` in `lib/games.ts` only when steps 1 to 3 are done.

Keep the property that makes Bingo safe: **derive shared state from one list inside one document**, and change it only in a transaction.

---

## Analytics

Constraint first: no identity across sessions. There is no user table, no device id, and no stored address.

**The event log is the `events` collection.** Each event is written in the same transaction as the change it describes. An event that can be lost is not an audit log.

Each event holds `sessionId`, `roomKey`, `gameId`, `roundId`, `playerId`, `type`, `payload` and `occurredAt`. It holds no nickname and no address.

Event types:

`room_created`, `player_joined`, `player_left`, `player_removed`, `room_locked`, `round_started`, `round_advanced`, `number_selected`, `turn_timed_out`, `bingo_claimed`, `bingo_rejected`, `round_won`, `board_exhausted`, `host_promoted`, `session_ended`, `session_replayed`.

Useful payload fields:

- `number_selected`: the number, the sequence, the seat, the time the player took (`thinkingMs`), and `auto: true` for a timed-out turn.
- `bingo_rejected`: how many lines the board held. A rejection at four lines is a player who misread the rule.
- `round_won`: the line count and how many numbers went.

To analyse the events, export them to BigQuery. Do not scan `events` from a dashboard.

---

## Retention

Rooms expire two hours after the last change. That is on screen, so it is a promise.

- **On read.** A room whose `expiresAt` has passed is treated as not found at once. This keeps the promise to the second.
- **In storage.** A TTL policy on `rooms.expireAt` deletes the document, with every nickname and board in it. Firestore runs TTL deletes within about a day of expiry, and they are not billed as writes. `scripts/firestore-deploy.sh` enables the policy from `firestore.indexes.json`.
- **Events stay.** They carry no nickname, so they keep nothing against a player after the room is gone.

No scheduled job is necessary.

---

## Operational requirements

**Region.** Cloud Run and the Firestore database are both in `asia-south1`. A read from Cloud Run to Firestore stays in one region. Firestore's location is permanent.

**Identity.** The service runs as `<app-slug>-runtime`. That account holds `roles/datastore.user` under an IAM condition on this one database. See CLAUDE.md, traps 13 and 19.

**Rate limits.** There is no login, so a limit is what stops a script.

| Route           | Limit      | Counted per        |
| --------------- | ---------- | ------------------ |
| Create a room   | 10 an hour | address            |
| Join a room     | 30 an hour | address            |
| In-game actions | 5 a second | address and player |

Actions are counted per player because a whole party on one home network shares one address. The address is hashed with a salt that changes per process, and it is never stored. Each Cloud Run instance counts on its own, so the real limit is a little higher. That is acceptable: the limit exists to stop a script.

**Idempotency.** A network retry can send a move twice. The client sends an `Idempotency-Key` header on each action. The server stores it for the round, scoped to the player. A retry returns the current room and does not apply the move again.

**Timeouts.** The client stops waiting after 8 seconds. A move is one transaction on one document in the same region, so it answers in tens of milliseconds.

**Health.** `GET /api/health` does not touch Firestore. A probe that fails on a database blip makes Cloud Run stop a healthy container.

**Schema changes.** The frontend reads `Room` by field name, so a rename is a breaking change. Add fields; do not reuse them. The stored document has `schemaVersion: 1`. Increase it when a change needs old documents to be read differently.

---

## Testing the API

| Command                | What it proves                                                                 |
| ---------------------- | ------------------------------------------------------------------------------ |
| `pnpm test`            | The rules, the wire helpers and the rate limiter. No database.                 |
| `pnpm test:emulator`   | `services/room-store.ts` against the Firestore emulator, concurrency included. |
| `pnpm check:rooms-api` | The route handlers and the HTTP client agree on the wire.                      |

`pnpm check:rooms-api` needs a running app with `NEXT_PUBLIC_PLAYROOM_TRANSPORT=remote` and a Firestore. See [`docs/local-development.md`](./local-development.md).

Verify a deploy with two browsers on two devices, not two tabs. Two tabs also pass against the local transport, so they prove nothing about the server.
