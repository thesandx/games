---
name: playroom-ui
description: 'The design system for this repository: the Mochi design language, "playroom" theme. Colour, type, shape, motion, copy voice and accessibility rules, plus the component inventory to reuse before building anything new. USE WHEN writing or changing ANY user-facing UI here: a new page or route, a new component, restyling an existing one, adding a form, a modal, a card, a button, or reviewing a diff that touches app/, components/ or styles/. DO NOT USE FOR non-visual work, game rules in lib/, transports in services/, docs, or CI config.'
---

# Playroom UI

Playroom is built in the **Mochi** design language, with the `playroom` theme. The rulebook is
[`.github/instructions/design-language.md`](../../../.github/instructions/design-language.md). Read it
in full before you write UI. This skill is the short version and the checklist.

The tokens are in [`styles/globals.css`](../../../styles/globals.css). The primitives are in
`components/ui/`. The living reference renders at `/design`.

## Before you write anything

1. **Reuse before you build.** `components/ui/` has `Button` (and `buttonStyles` for a link that looks
   like a button), `Card`, `Input`, `Avatar`, `Face`, `Speech`, `Sticker`, `Chip` and
   `RoomKeyDisplay`. For a room player, use `components/room/PlayerAvatar`. If a primitive is missing
   a variant, add the variant there, show it on `/design`, and test it.
2. **Tokens only.** No raw hex, no arbitrary `bg-[...]`, `shadow-[...]` or `rounded-[...]`, no
   default Tailwind colour, size, radius or shadow. `pnpm lint` fails on each of these.
3. **Mobile first, 320px up.** Unprefixed utilities are the phone layout. Touch targets are 44px or
   more. The body never scrolls sideways.

## The rules people break most

- **Ink is not black.** Text and outlines use `ink` and `line`. Text on a coloured fill is `text-ink`.
- **Outlines are 2px.** `border-2 border-line`. No 1px hairlines.
- **Shadows go straight down**, and only on things you can press. A card that only holds information
  is `Card flat`.
- **Radius follows hierarchy:** `rounded-input`, `rounded-card`, `rounded-sheet`, `rounded-pill`.
- **One primary button per screen.** Everything else is `secondary` or `quiet`.
- **Six type sizes only:** `text-hero` (once per page), `text-title`, `text-heading`, `text-body`,
  `text-small`, `text-key`. Display type is Mochiy Pop One at weight 400. Never bold it.
- **Colour has a job.** `brand` means "do this" or "selected". Candy tones mean identity: this game,
  this player, this place. See the tone table in design-language.md > Playroom specifics.
- **Faces on purpose.** On avatars, the mascot, empty states, errors and wins. Never on buttons, form
  fields or navigation.
- **Motion answers the user.** `animate-pop` for a win or a join, `animate-wobble` for an error. No
  scroll animation, no looping decoration.

## Words

- Sentence case. Verb phrases on buttons that name the result: "Create room", "Join room".
- Errors say what happened and how to fix it. No apologies.
- No ALL-CAPS labels, no `01 / 02 / 03` markers, no middle-dot meta strings, no emoji, no trailing
  arrows. See the banned list and the anti-slop list in design-language.md.
- **No em dashes or en dashes, ever** (U+2014, U+2013). See
  [`CLAUDE.md`](../../../CLAUDE.md#never-use-an-em-dash).
- The mascot speaks only inside `Speech`: one line, under about 12 words, reacting to what happened.

## Accessibility patterns already here

- State is never carried by colour alone. A taken cell says ", taken" in `sr-only` text. The BINGO
  letters print "3 of 5 lines". A selected chip shows a check.
- The right ARIA for the role: a toggle uses `aria-pressed`, a tab uses `aria-selected`. `Chip`
  handles both.
- The host drawer is a native `<dialog>`. Use the platform before a library.
- Every input has a visible label. A placeholder is not a label.
- Navigation is a link, an action is a button. Use `buttonStyles` on a `Link`, never a button in a link.
- The board is a `<table>`. Turn changes sit in an `aria-live` region.

## Traps

- **Tailwind v4 makes utilities from `@theme` names.** A class for a token that does not exist is
  silently empty. After you remove or rename a token, search `app/` and `components/` for it.
- **The lint reads literal class strings only.** A class name built at runtime from a variable
  escapes it.
- **`exactOptionalPropertyTypes` is on.** Do not pass `className={undefined}`. Use `cn(className)`
  or a conditional spread.
- **Client components are server-rendered first.** Reading `window` at render time crashes the build.

## Checklist before you call UI work done

- [ ] Works at 320px and at desktop width, no horizontal scroll
- [ ] One primary button per viewport
- [ ] Budgets: one peek, one `Speech`, two stickers, one `shadow-mochi-lg` per viewport
- [ ] Nothing from the anti-slop list or the banned words
- [ ] State readable without colour; correct ARIA for the role
- [ ] New or changed primitive shown on `/design`, with a colocated test
- [ ] `pnpm validate` green
- [ ] Remove one thing: take away the least necessary decoration, then look again
