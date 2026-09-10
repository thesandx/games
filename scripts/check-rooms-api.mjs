#!/usr/bin/env node
//
// Check a live rooms API against the contract this client expects.
//
// The unit tests exercise the browser transport, and the API has its own tests.
// Neither proves the two agree on the wire. That is what this does. Run it
// after changing `services/playroom-api.ts`, `types/playroom.ts`, or anything
// in the service's `app/apps/playroom/`.
//
// Usage:
//   pnpm check:rooms-api                                        # localhost:8000
//   API=http://localhost:8099/games/v1 pnpm check:rooms-api
//
// It creates a real room and plays part of a round, so point it at a
// development service, never at production.

const API = (process.env.API ?? 'http://localhost:8000/games/v1').replace(/\/+$/, '');

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail === undefined ? '' : `, ${JSON.stringify(detail)}`}`);
  }
}

async function call(method, path, { body, token, headers } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text === '' ? null : JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return { status: response.status, body: parsed, headers: response.headers };
}

const SETTINGS = { rounds: 1, privacy: 'Locked after start', maxPlayers: 8 };

// The exact field list `types/playroom.ts` declares. A missing key is a
// breaking change even when nothing throws, because a screen reads it by name.
const ROOM_FIELDS = [
  'key',
  'gameId',
  'hostId',
  'phase',
  'round',
  'players',
  'settings',
  'bingo',
  'lastRound',
  'createdAt',
  'expiresAt',
];
const PLAYER_FIELDS = ['id', 'name', 'initial', 'color', 'score', 'isHost', 'isReady'];
const BINGO_FIELDS = [
  'selected',
  'cards',
  'turnOrder',
  'currentTurnIndex',
  'winnerId',
  'winningLines',
];

console.log(`Checking ${API}\n`);

const health = await call('GET', '/games').catch((cause) => ({ status: 0, body: String(cause) }));
if (health.status !== 200) {
  console.error(`Cannot reach the rooms API at ${API}. Is the service running?`);
  process.exit(2);
}
check('GET /games answers without a token', health.status === 200);

const created = await call('POST', '/rooms', {
  body: { gameId: 'bingo', settings: SETTINGS, hostName: 'ScriptHost', hostColor: 'peach' },
});
check('POST /rooms returns 201', created.status === 201, created.body);
if (created.status !== 201) process.exit(1);

const { room, playerId: hostId, playerToken: hostToken } = created.body;
const key = room.key;

check('the create response carries a token', typeof hostToken === 'string' && hostToken.length > 0);
check(
  'Room has every field the client reads',
  ROOM_FIELDS.every((field) => field in room),
  ROOM_FIELDS.filter((field) => !(field in room)),
);
check(
  'Player has every field the client reads',
  PLAYER_FIELDS.every((field) => field in room.players[0]),
  PLAYER_FIELDS.filter((field) => !(field in room.players[0])),
);
check('bingo is null in the lobby', room.bingo === null);
check('lastRound is null in the lobby', room.lastRound === null);
check('timestamps end in Z', room.createdAt.endsWith('Z') && room.expiresAt.endsWith('Z'));
check('the key is six characters', /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(key), key);

const joined = await call('POST', `/rooms/${key}/players`, {
  body: { name: 'ScriptGuest', color: 'mint' },
});
check('POST join returns 201', joined.status === 201, joined.body);
const guestToken = joined.body?.playerToken;
const guestId = joined.body?.playerId;

const spectator = await call('GET', `/rooms/${key}`);
check(
  'no token appears in a room payload',
  !JSON.stringify(spectator.body).includes(hostToken) &&
    !JSON.stringify(spectator.body).includes(guestToken),
);

const stolen = await call('POST', `/rooms/${key}/rounds`, { token: hostId });
check(
  'a public player id is refused as a credential',
  stolen.status === 403 && stolen.body.code === 'not-in-room',
  stolen.body,
);

const started = await call('POST', `/rooms/${key}/rounds`, { token: hostToken });
check('the host starts the round', started.status === 200 && started.body.phase === 'playing');
check(
  'bingo has every field the client reads',
  BINGO_FIELDS.every((field) => field in started.body.bingo),
  BINGO_FIELDS.filter((field) => !(field in (started.body.bingo ?? {}))),
);
check(
  'the caller gets their own board and no other',
  Object.keys(started.body.bingo.cards).join() === hostId,
  Object.keys(started.body.bingo.cards),
);

const guestView = await call('GET', `/rooms/${key}`, { token: guestToken });
check(
  'the other player gets a different board',
  Object.keys(guestView.body.bingo.cards).join() === guestId,
);

// The validator comes from a read. Mutating routes do not set one: the client
// only caches what it read, so there would be nothing for it to validate.
const hostView = await call('GET', `/rooms/${key}`, { token: hostToken });
const etag = hostView.headers.get('etag');
check('a read sets an ETag', typeof etag === 'string' && etag.length > 0, etag);

const notModified = await call('GET', `/rooms/${key}`, {
  token: hostToken,
  headers: { 'If-None-Match': etag ?? '' },
});
check('an unchanged room answers 304', notModified.status === 304, notModified.status);

const outOfTurn = await call('POST', `/rooms/${key}/rounds/current/actions`, {
  token: guestToken,
  body: { type: 'select_number', payload: { value: 3 } },
});
check(
  'a move out of turn is refused with a code the client knows',
  outOfTurn.status === 409 && outOfTurn.body.code === 'not-your-turn',
  outOfTurn.body,
);

const took = await call('POST', `/rooms/${key}/rounds/current/actions`, {
  token: hostToken,
  body: { type: 'select_number', payload: { value: 3 } },
  headers: { 'Idempotency-Key': `${hostId}:select_number:{"value":3}` },
});
check('a move on turn is accepted', took.status === 200 && took.body.bingo.selected[0] === 3);

const retried = await call('POST', `/rooms/${key}/rounds/current/actions`, {
  token: hostToken,
  body: { type: 'select_number', payload: { value: 3 } },
  headers: { 'Idempotency-Key': `${hostId}:select_number:{"value":3}` },
});
check(
  'a retried move is not a second move',
  retried.status === 200 && retried.body.bingo.selected.length === 1,
  retried.body?.bingo?.selected,
);

const earlyClaim = await call('POST', `/rooms/${key}/rounds/current/actions`, {
  token: guestToken,
  body: { type: 'claim_bingo', payload: {} },
});
check(
  'a claim with no lines is refused, not accepted',
  earlyClaim.status === 409 && earlyClaim.body.code === 'invalid-claim',
  earlyClaim.body,
);

await call('POST', `/rooms/${key}/end`, { token: hostToken });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
