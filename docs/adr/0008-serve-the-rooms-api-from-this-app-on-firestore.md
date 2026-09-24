# ADR-0008: Serve the rooms API from this app, on Firestore in asia-south1

- **Status:** Accepted
- **Date:** 2026-09-23
- **Deciders:** Application engineering
- **Relates to:** [ADR-0003](./0003-abstract-room-state-behind-a-transport.md), [ADR-0005](./0005-split-the-player-id-from-the-player-token.md), [`docs/rooms-api.md`](../rooms-api.md)

## Context

The rooms API was a separate FastAPI service, the `playroom` app in the `anuvia` repository. It stored rooms in Neon Postgres. The frontend ran on Cloud Run in `asia-southeast1` (Singapore).

The players are in India. Each move crossed from the browser to Singapore, then to a Postgres host in another place, and back. Every player polls the room every two seconds, so this distance is paid on every screen, all the time.

The template this repository comes from now provides a data layer: a named Firestore database per app, in the same region as the Cloud Run service, reached with the runtime service account and no key. Its default region is `asia-south1` (Mumbai).

Three more facts shaped the decision:

- Every game rule already exists in TypeScript, in `lib/room-engine.ts`, with tests. The Python service was a port of it, so the rules existed twice.
- Neon's pooled endpoint does not carry `LISTEN`/`NOTIFY`, so the Python service pushed live updates from one process only. A second instance saw nothing.
- Two services meant two deploys, two sets of credentials, and CORS between them.

## Decision

We will serve the rooms API from this application, as route handlers in `app/api/v1/`, and store rooms in Firestore. Cloud Run, Artifact Registry and the database all go in `asia-south1`.

- One document per room, `rooms/{KEY}`, holds the whole session. Every move is one Firestore transaction on it.
- The document id is the room key. The key is random, so it causes no write hotspot, and the create transaction uses it to prove a key is free.
- The rules stay in `lib/room-engine.ts`. The server calls the same reducers as the browser transport.
- Live updates come from a Firestore snapshot listener, streamed as Server-Sent Events.
- A Firestore TTL policy deletes expired rooms. No scheduled job exists.
- The wire contract does not change. The client's base URL becomes `/api/v1` on the same origin.

## Alternatives considered

### Option A: this app, on Firestore, in asia-south1 (chosen)

One service, one deploy, one region. A room read is one document read in the same region as the server. Every rule has one implementation. The snapshot listener works across instances with no broker. The template supplies the database, the IAM condition and the deploy steps, so the setup is the same as every other app from the template.

### Option B: keep FastAPI and Neon, and move both to India

Moving the service to `asia-south1` and choosing a Neon region near it would cut most of the distance. But the rules would still exist twice, the live stream would still work on one instance only, and there would still be two services to deploy. Neon also scales to zero, so the first request after a quiet period pays a cold start.

### Option C: keep FastAPI, and replace Neon with Firestore

This removes Postgres but keeps the second service and the second copy of the rules. It changes the most code for the least gain.

### Option D: a normalised Firestore model

Collections for rooms, players, rounds, boards and selections, like the Postgres tables. Each poll would read five collections instead of one document, and a move would need a transaction over many documents. That is a relational schema inside a NoSQL database, which costs more and is slower. A room is small and bounded, so one document fits.

## Consequences

**Good**

- A move and a poll stay inside one region, near the players.
- One implementation of the rules. The browser transport and the server cannot disagree.
- Live updates reach every Cloud Run instance.
- No second service, no CORS, no database password.
- A poll costs one document read, and an unchanged room answers `304`.

**Bad**

- A room document takes about one sustained write per second. Turn-based play is far below that, but a future real-time game with many writes per second needs a different shape, such as a subcollection.
- The Python service's tests and its analytics tables do not carry over. The events now go to the `events` collection, and reports need an export to BigQuery.
- Rate limits count per Cloud Run instance, so the real limit is a little higher than the number in the code.
- A Firestore location is permanent. Moving from `asia-south1` later means a new database and a copy of every document.

**Neutral**

- Host promotion changed. The Python service promoted the lowest remaining seat. This one promotes the player whose read found the host idle, because that player is present. The room is never handed to somebody who also left.
- The browser transport stays, for a checkout with no Google Cloud account.

## Revisit when

- A game needs more than about one write per second to one room.
- Most players are no longer in India.
- Firestore pricing for reads changes enough that polling costs more than a WebSocket service.

## References

- [`docs/rooms-api.md`](../rooms-api.md), the contract and the data model
- `services/room-store.ts`, and its emulator tests in `services/room-store.emulator.test.ts`
- [Firestore best practices](https://cloud.google.com/firestore/docs/best-practices)
- [Firestore TTL policies](https://cloud.google.com/firestore/docs/ttl)
