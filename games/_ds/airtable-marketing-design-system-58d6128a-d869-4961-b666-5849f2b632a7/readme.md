# Airtable Marketing Design System

A design system for Airtable's **public marketing surfaces** — homepage, platform pages, pricing, and the articles hub. It is not a product/app design system: nothing here covers the base editor, grid views, or in-app chrome.

## Source material

Everything in this project was derived from a single supplied file:

- `uploads/DESIGN-airtable.md` — a token-and-component extraction of Airtable's marketing site (front-matter tokens for colors, typography, radii, spacing, and ~30 component specs, plus prose on layout, elevation, responsive behaviour, and do's/don'ts).

No codebase, Figma file, repository, screenshots, font binaries, logo files, icon set, or imagery were provided. Consequences, all of them deliberate:

- **No logo.** The brand mark is rendered as plain display type via the `Wordmark` component. Nothing was drawn or reconstructed.
- **No imagery.** Every image slot in the kit renders `MediaPlaceholder`, a labelled dashed frame. No invented illustrations or fake screenshots.
- **Fonts substituted.** Haas Grotesk / Haas Groot Disp are licensed; **Huninn** (justfont, via Google Fonts) stands in at the user's request. It ships a single weight (400), so the 475 / 500 / 575 / 600 steps in the weight ladder are browser-synthesised rather than drawn.
- **Icons substituted.** The source defines no icon set; Lucide's 2px outline icons are loaded from CDN and masked to `currentColor`.
- **No hover states.** The source documents Default and Active/Pressed only, under an explicit no-hover policy. Components follow that.

## Products represented

One product surface: the **marketing website**. Within it the source identifies two dialects that must not be mixed:

1. **The editorial system** (homepage, platform, articles) — display and text type at 400–500, 12px and 10px radii, near-black CTA.
2. **The pricing sub-system** — Inter Display at weight 475/575, pill-shaped CTAs, its own type scale. The pill radius appears nowhere else in the system.

---

## Content fundamentals

**Register.** Declarative and matter-of-fact, in the voice of someone describing what a tool does rather than selling it. Claims are concrete and bounded ("Ship the tool your team needs this week, not next quarter"), never superlative. There is no exclamation, no hype adjective stack, no "revolutionary/seamless/effortless."

**Person.** Second person for the reader's team ("your data, your workflows, your teams"), third person for the product ("Airtable brings…"). First-person plural appears only where the company is genuinely the actor ("Tell us how your team works"). Never "I."

**Casing.** Sentence case everywhere — headlines, buttons, nav items, card titles, footer column heads. The only uppercase is the small tracked category caption on article cards (`PRODUCT`, `OPERATIONS`) and eyebrow labels on signature cards. No title case, no all-caps headlines.

**Headlines.** One clause, no terminal period, 4–9 words. They state an outcome, not a feature: "Production apps in prototype speed", "Build apps that move your business forward", "Every team, one source of truth". A headline never asks a question except in the pre-CTA position ("Not sure which plan fits?").

**Body copy.** One to three sentences per block, 14px, and it earns its place by adding a fact the headline could not carry. Sub-headlines complete the headline rather than restating it.

**Buttons.** Verb-first and short: "Sign up for free", "Book demo", "Get started for free", "Contact sales", "Read the report". Never "Learn more" as a primary action; never "Submit". The free-tier CTA always names the price ("for free") because that is the offer.

**Numbers.** Written out with their unit and a source when used as proof ("46% less time in status meetings", "3 weeks to first production app", "50,000 records per base"). Never a bare stat with no referent.

**Emoji: never.** Not in copy, not as icons, not in headings. There is no emoji anywhere in this system.

**Punctuation.** Em dashes sparingly and only mid-sentence; no ampersands in prose (fine in footer column heads); numerals for all figures; Oxford comma.

**Legal/consent copy** is the one place the voice tightens and the type goes bold (600) — "Accept all cookies", "Cookie preferences". It reads as a required notice, not a designed surface.

---

## Visual foundations

**Atmosphere.** White canvas, dark ink type, and a great deal of whitespace. The page reads like a print magazine: headline, supporting copy, a small image cluster, then breathing room. Brand voltage is delivered in bursts by full-bleed signature cards, not by the background.

**Color.** Near-black `#181d26` is the primary — it is the CTA fill, the display type colour, and the dark signature surface, all the same value. Link blue `#1b61c9` is *only* a text colour; treating it as the button colour is the single most common misreading of this system. The signature palette (coral `#aa2d00`, forest `#0a2e0e`, cream `#f5e9d4`) and demo pastels (peach, mint, yellow, mustard) appear only as whole-card surfaces, never as small accents, borders, or icon tints. Maximum two non-white surface colours per page band sequence.

**Type.** Display sizes run at weight 400 (500 at 48px only). A 40px h1 is not bold, and pushing display type to 600/700 is the fastest way to make this system look like a generic SaaS template. Emphasis comes from size, colour contrast, and signature surfaces. Body copy holds at 14px/400 across heroes, cards, nav, and footer — there is no second body size. Weight 500 marks sub-titles, labels, and buttons; 600 exists only for legal surfaces. The pricing page swaps in its own display stack at 475/575 (one weight in the current Huninn substitution).

**Spacing.** 4px base grid, and every major band gets 96px of vertical padding — that constant is the page's metronome. Card padding is bound to role: 48px signature, 32px feature and pricing, 24px cream callout, 16px demo grid. Content sits in a 1280px container inset 48px; beyond 1440px the page adds outer margin rather than scaling type up.

**Backgrounds.** Flat colour, always. No gradients, no mesh, no aurora, no spotlight, no noise, no texture, no repeating pattern, no full-bleed photographic background. The single decorative exception is the articles hero's uneven vertical colour bands on `#1d1f25` — one page only, not a system pattern.

**Cards.** Rounded 10px for content cards and callouts, 12px for signature cards and primary CTAs, 6px for inputs. No drop shadows on cards at all. White cards carry a 1px `#dddddd` hairline; coloured cards carry nothing — the contrast against white canvas is the elevation. Demo-grid cards get deliberately uneven heights; uniform heights read as a spec sheet.

**Shadows.** Two only, both on buttons: a faint blue-cast rest shadow under the primary CTA (`0 1px 2px rgba(27,97,201,.10)`) and a 2px blue focus ring. There is no elevation ladder, no soft-glow language, no layered shadow system anywhere.

**Borders.** 1px, one of two tones: `#dddddd` hairline for inputs, dividers, secondary buttons and white cards; `#9297a0` for disabled secondary buttons. Focus recolours to `#458fff`. No 2px borders except the small ink rule marking the active tab in a tabbed feature card, and no coloured left-border accent stripes.

**Transparency and blur.** Neither is used. No glassmorphism, no translucent overlays, no backdrop blur, no protection gradients over imagery — because imagery never sits under type. Type on a coloured surface uses full-opacity white; the only alpha in the system is inside the two button shadows and a 0.85 opacity on signature-card eyebrows.

**Hover, press, focus.** No hover styling — the source's no-hover policy is intentional and components honour it. Press darkens: primary `#181d26` → `#0d1218`, links `#1b61c9` → `#1a3866`. No scale-down, no lift, no shadow change on press. Focus is the 2px blue ring.

**Animation.** Not specified in the source. This system therefore ships one conservative default: 120–180ms colour/border transitions on `cubic-bezier(0.2,0,0.2,1)` for interactive state changes, and nothing else — no entrance animations, no scroll reveals, no parallax, no bounce or spring easing. Treat additions as a decision to confirm, not a gap to fill.

**Layout rules.** Nothing is fixed or sticky — the 64px top nav scrolls with the page and stays white over dark sections; it never inverts. Bands alternate surface by rule: white → signature → white → cream → dark → gray CTA → footer. Two consecutive white bands read as a typography blog; two consecutive coloured bands break the pacing.

**Imagery.** Product UI screenshots and flat vector illustrations, colour-matched warm (peach/cream/mustard grounds) rather than cool. No photography of people, no grain, no duotone, no black-and-white treatment. Screenshots keep native 4:3 or 16:10 ratios and crop into 10px-radius frames; article thumbnails are 16:9; testimonial avatars are perfect circles; hero illustrations bleed full width with no rounding. None of this imagery was supplied — placeholders mark every slot.

---

## Iconography

- **No icon set was supplied.** Substituted: [Lucide](https://lucide.dev) static SVGs from `unpkg.com/lucide-static@latest`, loaded as CSS masks so glyphs inherit `currentColor`. 2px outline stroke, which matches the system's hairline-and-ink restraint. **Flagged for replacement** if Airtable's own glyph set exists.
- Access it through the `Icon` component (`<Icon name="chevron-down" size={16} />`), never as an `<img>` or a hand-written SVG.
- Sizes: 16px inline with 14px text, 20px default, 24px in nav and standalone controls. No other sizes.
- **Where icons appear:** a chevron beside top-nav items that open menus; an arrow after a CTA label; a magnifier inside search inputs; a green check in pricing feature lists and comparison cells (an em dash marks absence); arrows inside 40px circular icon buttons.
- **Where they do not:** headlines, body copy, card titles, footer links, and stat callouts carry no icons. There is no icon-per-feature grid pattern in this system.
- No filled, duotone, or multicolour glyphs. No emoji. No unicode characters as icons — the one unicode glyph in use is the em dash in a comparison table's empty cell.
- There is no icon font and no sprite sheet; `assets/` holds no icon binaries because none were provided.

---

## Index

**Root**
- `styles.css` — the single entry point consumers link. `@import` lines only.
- `thumbnail.html` — project tile.
- `readme.md` — this file. `SKILL.md` — Agent-Skills wrapper.

**`tokens/`** — `fonts.css` (Huninn substitution + family tokens), `colors.css` (base + semantic), `typography.css` (sizes, weights, line-heights, role composites), `spacing.css`, `shape.css` (radii), `elevation.css` (the two shadows + motion defaults), `base.css` (element resets, link colours).

**`guidelines/`** — 24 specimen cards feeding the Design System tab, grouped **Colors** (ink, neutrals, signature surfaces, demo pastels, semantic, actions in use), **Type** (display, titles, body, legal, pricing dialect, weights, substitution note), **Spacing** (scale, band rhythm, card padding, container), **Shape** (radius scale, radius by role), **Elevation** (ladder, depth by colour block), **Brand** (wordmark placeholder, iconography, band pacing).

**Components** — 23 exports, grouped by concern. Every family in the source's `components:` front matter is covered.

| Group | Components |
|---|---|
| `components/buttons/` | `Button` (primary · secondary · pricingPill · legal, with pressed and disabled), `IconButton`, `TextLink` |
| `components/surfaces/` | `HeroBand`, `SignatureCard` (coral · forest · dark), `CalloutCard`, `FeatureCardTabbed`, `DemoGridCard`, `ArticleCard`, `CtaBand` (light · dark), `LogoStrip`, `MediaPlaceholder` |
| `components/navigation/` | `TopNav`, `Footer`, `TopicFilterRail` |
| `components/forms/` | `TextInput` |
| `components/pricing/` | `PricingTierCard`, `PricingComparisonRow` |
| `components/signature/` | `RainbowStripeHero` |
| `components/brand/` | `Wordmark`, `Icon` |
| `components/layout/` | `Band`, `CardGrid` |

Each directory holds `<Name>.jsx`, `<Name>.d.ts` (props contract), `<Name>.prompt.md` (what & when), and one `@dsCard` HTML showing states side by side.

**`ui_kits/marketing-site/`** — `index.html` (interactive: nav switches pages, pricing toggles annual/monthly, articles rail and search filter the grid), `Shell.jsx`, `Home.jsx`, `Pricing.jsx`, `Articles.jsx`, `README.md`.

**`assets/`** — empty. No logos, icons, fonts, or imagery were supplied.

### Intentional additions

Four components have no direct entry in the source's component list. Each is a mechanical necessity rather than a new design:

- `Band` and `CardGrid` — the source describes the 96px rhythm, 1280px container, and 3/4-up grids as layout prose; these encode it so screens stop re-deriving it.
- `Icon` — a wrapper over the substituted Lucide set, so the substitution lives in one file.
- `MediaPlaceholder` — marks where supplied imagery belongs, instead of inventing artwork.

`Wordmark` is likewise a placeholder standing in for a logo asset that does not exist here.

### Known gaps carried over from the source

Hover behaviour (policy), animation and transition timings, input error/success states, comparison-table checkmark and divider tokens, and the exact pastel hexes (sampled from screenshots, may shift seasonally).
