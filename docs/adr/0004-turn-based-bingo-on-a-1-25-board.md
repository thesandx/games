# ADR-0004: Turn-based Bingo on a 1-25 board

- **Status:** Accepted
- **Date:** 2026-09-09
- **Deciders:** Application engineering
- **Supersedes:** the 75-ball rules originally implemented alongside [ADR-0003](./0003-abstract-room-state-behind-a-transport.md)

## Context

The first implementation followed traditional 75-ball Bingo: per-column number ranges, a free centre square, a host who called numbers, players daubing their own cards, and a full house to win.

That shape has three problems for a group-chat party game:

- **The host is not a player.** Calling numbers is an administrative job. One person in the room spends the game pressing a button.
- **Daubing is busywork that can go wrong.** A player who misses a call falls behind for a reason that has nothing to do with the game, and per-player mark state is one more thing that can drift out of sync.
- **A full house takes a long time.** Rounds run long and the outcome is decided almost entirely by the deal.

## Decision

Bingo becomes **turn-based and player-driven**:

- Every player gets a 5x5 board holding the numbers 1 to 25, each exactly once, shuffled independently. There is no free square.
- Players take turns. On their turn a player claims any number nobody has taken.
- A claimed number is marked on **every** board at once, wherever it appears.
- Each completed row, column or diagonal fills one letter of B-I-N-G-O. **Five** completed lines win the round, out of the twelve that exist. Lines share cells, so one pick can fill two letters at once. One line is not a win, and a full board is not required.
- The winner must press **Call Bingo**. The claim is validated before it is awarded, and only the first valid claim takes the round.

Marking is **derived**, not stored: a cell is marked when its number is in the room's one `selected` list.

## Consequences

**Good**

- Every player acts every round. There is no host-only role during play.
- Boards cannot disagree. With no per-player mark state there is nothing to synchronise, so two clients rendering the same room render the same marks by construction.
- Rounds are short, and the choice of number is a real decision — you can take a number you need, or one you can see an opponent needs.
- Five lines rather than one gives the round a shape. A single line arrives almost immediately and would end the game before the interesting decisions start; five keeps everyone in it, and the B-I-N-G-O letters make progress legible without explaining the rule.
- Win detection is a pure function of the board and the taken list, which makes it cheap to validate server-side and easy to test exhaustively.

**Bad**

- Turn order is now state that must be maintained through joins and removals mid-round. `removePlayer` has to rebase the turn index so play does not skip somebody.
- With one number per turn and 25 numbers, a large room may exhaust the board before anyone reaches five lines. In practice a full board holds all twelve lines, so every player qualifies before the numbers run out — but no code path awards a win that is not earned, and a round where nobody claims simply stalls.
- It is no longer Bingo as most people know it, so the rules screen has to do real work.

**Neutral**

- The `Room` shape changed: `calls` and per-player `daubs` became one `selected` list plus `turnOrder` and `currentTurnIndex`. Both transports and the endpoint contract moved together, and no room state predates the change.

## Alternatives considered

### Option A — Turn-based selection on a 1-25 board (chosen)

Described above.

### Option B — Keep 75-ball, drop only the host

Have the server draw numbers on a timer instead of a host pressing a button. Fixes the host-as-administrator problem and nothing else: daubing, long rounds and a game of pure luck all remain.

### Option C — Turn-based, but auto-claim the win

Detect the line and end the round without asking. Rejected because the explicit claim is the moment of the game, and because a silent auto-win removes any tension from being one number away. It would also make a near-simultaneous finish feel arbitrary rather than earned.

### Option D — Let players mark their own cells

Keep the tapping, but derive nothing. Rejected: it adds a failure mode (a player who forgets to mark) without adding a decision, and it reintroduces per-player state that can disagree between clients.

## References

- `lib/bingo.ts` — board generation, the twelve lines, win detection
- `lib/room-engine.ts` — turn validation, atomic selection, claim validation
- `cloud/environment-variables.md` — what the rooms API must enforce
