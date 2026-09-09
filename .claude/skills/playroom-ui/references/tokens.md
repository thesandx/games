# Tokens and components

Companion to [`../SKILL.md`](../SKILL.md). Tokens are defined in
[`styles/globals.css`](../../../../styles/globals.css) under `@theme`; Tailwind v4 generates the
utilities from the token names, so `--color-mint` gives `bg-mint`, `text-mint` and `border-mint`.

## Colour

### Ink — type and the primary action

| Token               | Value     | Utility                                | Use for                                                 |
| ------------------- | --------- | -------------------------------------- | ------------------------------------------------------- |
| `--color-ink-1`     | `#181d26` | `bg-ink-1` `text-ink-1` `border-ink-1` | Display type, primary CTA fill, every 2px object border |
| `--color-ink-2`     | `#333840` | `text-ink-2`                           | Body copy                                               |
| `--color-ink-3`     | `#41454d` | `text-ink-3`                           | Muted and secondary copy                                |
| `--color-ink-press` | `#0d1218` | `active:bg-ink-press`                  | Pressed state of the primary button                     |

### Neutrals

| Token                 | Value     | Use for                                 |
| --------------------- | --------- | --------------------------------------- |
| `--color-white`       | `#ffffff` | The canvas, and secondary button fill   |
| `--color-neutral-50`  | `#f8fafc` | Inert surfaces — an untaken board cell  |
| `--color-neutral-200` | `#e0e2e6` | Strong surface                          |
| `--color-neutral-300` | `#dddddd` | Aliased as `hairline`                   |
| `--color-neutral-500` | `#9297a0` | Disabled borders and inert cell borders |
| `--color-neutral-900` | `#1d1f25` | Elevated dark surface                   |

### Signature palette — whole-card surfaces only

| Token             | Value     | Text on it | Typical use                                           |
| ----------------- | --------- | ---------- | ----------------------------------------------------- |
| `--color-coral`   | `#aa2d00` | white      | The closing CTA band; error text                      |
| `--color-forest`  | `#0a2e0e` | white      | Round-result banner, first place, the BINGO panel     |
| `--color-cream`   | `#f5e9d4` | ink        | Callout bands, the lobby card, waiting notices        |
| `--color-peach`   | `#fcab79` | ink        | Card surface, avatar, taken-number chips              |
| `--color-mint`    | `#a8d8c4` | ink        | Card surface, avatar, "your turn" banner, press state |
| `--color-yellow`  | `#f4d35e` | ink        | Card surface, avatar, completed-line highlight        |
| `--color-mustard` | `#d9a441` | ink        | Card surface, avatar                                  |

### Semantic

| Token                 | Value     | Use for                              |
| --------------------- | --------- | ------------------------------------ |
| `--color-link`        | `#1b61c9` | Text links. **Never a button fill.** |
| `--color-link-active` | `#1a3866` | Pressed link                         |
| `--color-blue-400`    | `#458fff` | The focus ring                       |
| `--color-success`     | `#006400` | Score gains, ready state             |
| `--color-hairline`    | `#dddddd` | 1px dividers and table rules         |

## Type

| Token            | Stack                | Use for                                            |
| ---------------- | -------------------- | -------------------------------------------------- |
| `--font-display` | Huninn → system sans | Headings, room keys, board numerals, BINGO letters |
| `--font-text`    | Huninn → system sans | Body, labels, buttons                              |
| `--font-mono`    | ui-monospace stack   | Reserved; unused in the app today                  |

Huninn is loaded through `next/font/google` in `app/layout.tsx` and exposed as `--font-huninn`, which
`--font-display` and `--font-text` both point at. It is the licensed Haas Grotesk family's stand-in
and **ships one weight (400)** — every 500 is synthesised by the browser.

Scale in use: body `text-sm` (14px) · titles `text-lg` · card headings `text-[26px]` · page headings
`text-[clamp(1.75rem,5vw,2.5rem)]` · hero `text-[clamp(2.125rem,7vw,3rem)]`.

## Shape and motion

| Token             | Value                       | Utility         | Use for                                             |
| ----------------- | --------------------------- | --------------- | --------------------------------------------------- |
| `--radius-card`   | `20px`                      | `rounded-card`  | Cards, panels, player chips, drawers                |
| `--radius-pill`   | `999px`                     | `rounded-pill`  | Buttons, filter chips, avatar chips                 |
| `--radius-input`  | `14px`                      | `rounded-input` | Text inputs, small controls                         |
| `--radius-cell`   | `16px`                      | `rounded-cell`  | Board cells, BINGO letter tiles                     |
| `--ease-standard` | `cubic-bezier(0.2,0,0.2,1)` | —               | The only easing. 120–180ms, colour and border only. |

## Component inventory

Reuse these. Adding a second variant of one of them is almost always the wrong move.

### `components/ui/` — generic, no data fetching, props in

| Component        | Notes                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`         | `variant` primary/secondary, `size` md (52px) / sm (44px), `block`. Exports `buttonClasses` so links can share the styling.               |
| `ButtonLink`     | A real `<a>` that looks like a button. Use for navigation — never a `<Link>` inside a `<button>`.                                         |
| `TextInput`      | Always-visible label, optional `hint` and `error`, wired via `aria-describedby`. Takes a `ref` so a form can focus the field it rejected. |
| `Card`           | `surface` white/cream/peach/mint/yellow/coral/forest, `outlined` for the 2px ink border.                                                  |
| `Avatar`         | Pastel disc, sizes sm/md/lg. Name goes in `aria-label`; the initial is `aria-hidden`.                                                     |
| `Chip`           | Selectable pill. Uses `aria-pressed`, or `aria-selected` when given `role="tab"`.                                                         |
| `RoomKeyDisplay` | The letter-spaced key. `aria-label` spells it out character by character.                                                                 |

### `components/layout/`

`Header` · `Footer` · `TransportNotice` (the preview banner, hides itself when the transport is remote)

### Feature components

`components/bingo/` — `BingoBoard` (read-only or interactive), `BingoProgress`, `TurnBanner`, `PlayView`
`components/room/` — `LobbyView`, `ResultsView`, `ScoreboardView`, `RoomScreen`, `HostDrawer`,
`PlayerList`, `PlayerScoreStrip`, `ScoreTable`, `AvatarPicker`, `CreateRoomForm`, `JoinRoomForm`
`components/games/` — `GameCard`, `GameBrowser`, `HowToPlayTabs`

## Where a new file goes

Per `CLAUDE.md`, and it decides this before anything else:

| Writing                             | Goes in                 |
| ----------------------------------- | ----------------------- |
| A page at a URL                     | `app/<route>/page.tsx`  |
| A generic button/card/input         | `components/ui/`        |
| Header, footer, page shell          | `components/layout/`    |
| A component for one feature         | `components/<feature>/` |
| A `use…` hook                       | `hooks/use<Thing>.ts`   |
| A pure function, no I/O             | `lib/`                  |
| Anything calling an external system | `services/`             |
| A global style or design token      | `styles/globals.css`    |

Naming: components `PascalCase.tsx`, hooks `camelCase.ts`, utilities `kebab-case.ts`, tests
`<subject>.test.tsx` colocated beside the subject.

## Server versus client

Default to a Server Component. `'use client'` needs state, effects, event handlers or browser APIs —
nothing else qualifies, and it belongs at the leaves. Never in `app/layout.tsx`: that turns the whole
application into a client bundle.
