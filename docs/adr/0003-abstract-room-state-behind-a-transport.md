# ADR-0003: Abstract room state behind a transport interface

- **Status:** Accepted
- **Date:** 2026-09-09
- **Deciders:** Application engineering

## Context

Playroom is a multiplayer party-game app. A host opens a room, shares a six-character key, and other players join. Every player must see the same room: the same lobby, the same taken numbers, the same scoreboard.

That state has to live somewhere both players can reach. At the time of building, the intended home for it — the rooms API at `https://api.sandeep.app/games` — did not exist yet.

This left a problem. Every screen in the design depends on room state. Building them against an endpoint that does not answer produces an application where nothing can be reviewed, demonstrated, or tested. Waiting for the API to exist before building any screen wastes the time the API takes to build.

A second constraint applies regardless of timing. Game rules must be enforced by whatever owns the state. Play is turn-based, so the state owner must decide whose turn it is, which numbers are still free, and whether a bingo claim is good. A client that decides any of those for itself is a client that can be edited to take two turns in a row, take a number somebody already has, or always win.

## Decision

We will define a single `RoomTransport` interface in `types/playroom.ts` and give it two implementations:

- `services/playroom-api.ts` — HTTP against the rooms API.
- `services/local-room-store.ts` — the browser's `localStorage`.

`services/room-transport.ts` selects between them from `NEXT_PUBLIC_PLAYROOM_TRANSPORT`. No screen imports either implementation directly.

The rules themselves live in `lib/room-engine.ts` as pure reducers over a `Room`. Both transports apply the same functions, so the local store enforces exactly the rules the server will.

## Consequences

**Good**

- The application is fully playable before the API exists. Two tabs on one machine play a real game against each other, with real rules.
- Switching to the real API is one environment variable and a rebuild. No screen changes.
- The rules are tested once, as pure functions, and those tests hold for both transports.
- The interface doubles as the API specification. `services/playroom-api.ts` documents the exact endpoints and error shape the server must implement.

**Bad**

- Two implementations of the same interface must be kept in step. Adding an operation means adding it in three places: the interface, the HTTP client, and the local store.
- The local transport can drift into supporting things the HTTP API will not. Guarding against that is a review responsibility, not something the types enforce.
- Local rooms are confined to one browser. This is invisible in the code and would be misleading on screen, so `components/layout/TransportNotice.tsx` states it in the interface while the transport is `local`.

**Neutral**

- Rule enforcement is duplicated by design. `lib/room-engine.ts` runs client-side today, and the server must run equivalent checks when it lands. The engine is written to be portable so the same code can serve both, but a server that reuses it is a decision for the API, not a guarantee of this one.

## Alternatives considered

### Option A — Transport interface with a local fallback (chosen)

Described above.

### Option B — Build against the API only, and wait

Honest about where state belongs, and no second implementation to maintain. Rejected because it makes every screen unreviewable until the API is finished, and defers the discovery of interface problems to the point where they are most expensive to fix.

### Option C — Mock the HTTP layer with fixtures

Intercept `fetch` and return canned rooms. Cheaper than a real store, and a common pattern. Rejected because fixtures do not enforce rules: a fixture can return a room where a player has won, but it cannot decide whether a bingo claim is valid. The result exercises the layout and nothing else, and the game logic would stay unverified until the API arrived.

### Option D — Ship a real server route in this app

Implement rooms in `app/api/rooms/` with an in-memory store. Real multiplayer across devices, immediately. Rejected because the state would not survive a restart and would not be shared between Cloud Run instances, forcing `max-instances=1`. It also builds a rooms service in the wrong repository, given that one is already planned elsewhere.

## References

- `types/playroom.ts` — the interface and the domain model
- `lib/room-engine.ts` — the rules, as pure reducers
- `cloud/environment-variables.md` — the endpoint contract and the switch-over procedure
