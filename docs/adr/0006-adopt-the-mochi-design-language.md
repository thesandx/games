# ADR-0006: Adopt the Mochi design language from the template

- **Status:** Accepted
- **Date:** 2026-09-23
- **Deciders:** Playroom maintainers

## Context

Playroom was built to a port of the Airtable Marketing Design System, in a "Playroom Kawaii" variant. It used a near-black button fill, whole-card signature colours, one typeface with a synthesised 500 weight, and no shadows.

The template this application comes from, `nextjs-cloudrun-template`, now ships a design language of its own: Mochi. Mochi has tokens, seven primitives, three themes, a written rulebook and lint checks that enforce the token rules. It was designed with party games as its first use.

Two design systems in two related repositories means two sets of rules to learn and two sets of primitives to maintain. The Airtable port also had no enforcement: a raw hex value or an off-scale size passed CI.

## Decision

We will build every Playroom screen in the Mochi design language, with the `playroom` theme.

- The tokens in `styles/globals.css` and the fonts in `public/fonts/` are copied from the template.
- The seven primitives are copied into `components/ui/`. `Chip` and `RoomKeyDisplay` stay, restyled in Mochi.
- Three variants are added: `Card flat`, `Avatar tone` and an `Input` that takes a `ref`. Each one appears on `/design`.
- The `template/design-language` lint block is copied into `eslint.config.mjs`.
- `.github/instructions/design-language.md` is the rulebook. Its "Playroom specifics" section records how the rules apply here.

The stored player colours (`peach`, `mint`, `yellow`, `mustard`, `cream`) are part of the rooms API contract. They do not change. `AVATAR_TONE` in `lib/players.ts` maps each one to a Mochi tone.

## Alternatives considered

### Option A: adopt Mochi (chosen)

One design language across the template and the product. The rules are written down and the token rules are lint checks. Faces, the mascot and the squish suit a party game.

### Option B: keep the Airtable port

It works and it is consistent. But it is a second system to maintain beside the template, and nothing enforces it. Every new screen would need a reviewer who knows both.

### Option C: keep the Airtable tokens and add the Mochi lint

The lint refuses default colours and off-scale sizes by name. The Airtable tokens (`ink-1`, `neutral-500`, `text-sm`) would fail it. Rewriting the lint for another palette gives the cost of Option A without its benefit.

## Consequences

**Good**

- A token rule broken in `app/` or `components/` fails `pnpm lint`.
- The template and Playroom share primitives, so a fix in one can move to the other.
- The home page shows the key entry and a playable practice board, not a description.

**Bad**

- Every screen changed at once. Screenshots in older pull requests no longer match.
- The copied primitives can drift from the template. A change to one must be copied to the other by hand.
- A player's avatar is a face drawn from the nickname, not an initial. A player who renames gets a new face.

**Neutral**

- The "Playroom Kawaii" skill now summarises Mochi and points at `design-language.md`.

## Revisit when

- The template's Mochi primitives change in a way Playroom does not copy within one release.
- Playroom needs a dark look. Mochi has a `night` theme, but its cute budget is low.

## References

- `.github/instructions/design-language.md`
- The Mochi pull request in `nextjs-cloudrun-template` (#28)
