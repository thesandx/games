# ADR-0005: Split the player id from the player token

- **Status:** Accepted
- **Date:** 2026-09-09
- **Deciders:** Application engineering
- **Relates to:** [ADR-0003](./0003-abstract-room-state-behind-a-transport.md), [`docs/backend-handover.md`](../backend-handover.md)

## Context

Before the rooms API existed, the client identified a player with one value. It sent `X-Player-Id: <uuid>` on every mutating request, and `services/local-room-store.ts` used the same value to decide which boards a caller could see.

That value is also public. It appears in the room payload as `hostId`, in `bingo.turnOrder`, as the keys of `bingo.cards`, and on every entry in `players`. Every player in a room can read every other player's id.

So the identifier and the credential were the same string. Any player could copy another player's id out of the room state and act as them: take their turn, claim their bingo, or — for the host's id — start rounds, remove players and end the session. The local transport did not care, because there is no trust boundary inside one browser. A network service does.

This had to be settled before the service was built. Building the unsafe version and fixing it later would have meant a breaking wire change after the client shipped.

## Decision

Two values, with two different jobs.

- **`playerId`** — a UUID. Public. Stays in the room payload, and is used for rendering, for turn order, and for comparing "is this me".
- **`playerToken`** — 32 random bytes, base64url. A credential. Returned **once**, from create or join, and never present in any room payload.

The client sends `Authorization: Bearer <playerToken>`. The server stores only `sha256(token)` and looks the player up by that hash, then checks that the player belongs to the room in the URL.

`PlayerIdentity` carries both. Both live in `sessionStorage`, per tab.

A player who loses their token cannot recover it. There is no recovery flow, and that is deliberate — see the consequences.

## Consequences

**Good**

- Reading the room payload no longer tells you how to act as anybody in it. The credential is not in the payload at all, so the attack needs the network or the other player's tab, not the dev-tools panel.
- The token is checked at one place on the server, and every route goes through it.
- Session storage is per-tab, so two tabs are still two players. That is how the app is tested, and it survives the change.
- It matches the product's promise. Nothing is stored against a person: the token is a per-room credential, it identifies no one across rooms, and closing the tab destroys it.

**Bad**

- Closing a tab loses the identity, and the player cannot get it back. They rejoin under a new nickname with a new board and a zero score.
- A recovery flow would need something durable to key off — a long-lived device id or cookie — which is exactly what the "How to play" screen promises not to keep. Recovery and that promise cannot both hold, and the promise won.
- Every transport method that acts as a player now takes the full `PlayerIdentity` rather than an id string, including `getRoom`. That is more to pass around, and it is the point: a caller cannot ask for a board by naming a player.

**Neutral**

- The browser transport mints a token it never checks. There is no trust boundary inside one browser, so checking it would be theatre — but minting it keeps the two transports the same shape, so a missing-token bug fails in both rather than only against the service.
