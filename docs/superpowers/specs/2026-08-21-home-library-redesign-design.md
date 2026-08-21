# Home + Library redesign — bento grid, big hero, louder typography

Status: approved by user 2026-08-21. Implements feedback that the site "feels numb" —
uniform card grid, timid typography, no hero interaction, flat rhythm.

## Why

External critique (pasted into chat, not a named source) scored the site 6/10 on product
experience against 8-8.5/10 on visual design/brand personality, with the core complaint: every
card is the same box, the hero has no interaction, typography never gets loud, and the page has
no rhythm of quiet/loud sections. The fix stays inside DESIGN.md's committed palette, type
families, spring constants and "no screenshots, every preview is the real component" rule — it
changes layout and scale, not the design system's vocabulary.

This work directly **overrides** DESIGN.md Revision 2026-08-18's "the landing IS the demo grid:
eleven uniform cards" line, and **partially reverts** that revision's centered-hero decision back
toward the original committed first-frame spec (dial beside the headline). Both changes are
user-directed overrides of prior committed decisions, same pattern as A17/A18. A new dated
DESIGN.md revision entry records this — see "DESIGN.md updates" below.

## Scope

Home (`site/src/pages/Home.tsx`) and Library (`site/src/pages/Library.tsx`) only. No change to:
component internals, registry data, CLI, candidate pages, detail pages, or the `/lab/navigation`
track (separate uncommitted work, untouched by this spec).

## 1. Hero — dial pulled out of the grid

`Home.tsx`'s `<header className="lander">` changes from a centered flex column to a left-aligned
two-column layout (`lander-hero`: headline column + dial column), matching DESIGN.md's original
"Left-aligned, dense, desktop-led" layout system rather than the 2026-08-18 centered block.

- Left column: mark (unchanged), `lander-title` ("Micro-animations you own."), `lander-sub`,
  `lander-cta` pills, install pill — all existing content, same copy, no new elements.
- Right column: `RotaryDial` at 320–380px (up from the grid card's 140px), with a live mono
  readout beside it (current pulse count / active hole), in Signal orange — reusing the existing
  `onPulse` callback already exposed by `RotaryDial` (DESIGN.md A17). No new physics, no new
  component; same instance semantics as today's grid card (flickable/pullable within 1s of load,
  nothing autoplays).
- The dial's grid card in the bento (below) is removed — it now appears exactly once, in the
  hero.
- Below 900px: right column drops beneath the left column (dial still full instance, not hidden),
  consistent with the existing `@media (max-width: 900px)` collapse pattern already used elsewhere
  in `site.css`.

## 2. Bento grid — fixed columns, explicit spans

`.demo-grid` moves from `grid-template-columns: repeat(auto-fill, minmax(330px, 1fr))` to a fixed
**6-column** desktop grid (`repeat(6, 1fr)`) with `grid-auto-flow: dense`. Fluid auto-fill cannot
support stable spans across viewport widths — a fixed column count is required.

New span utility classes on `DemoCard` (extending the existing `wide` prop rather than replacing
it — `wide` becomes one of several span values):

- `span-2`: 2 columns wide, 1 row — **heft** (needs sandbox width for the drop/spawn interaction),
  **late-critique** (form input + mono event log side by side)
- `span-1` (default, unchanged card size): **chase**, **disclosure**, **hold-drain**,
  **scramble-reveal**, **reel**, **origin**, **grip**, **intent**

No row-height spans (no `2×2` tiles) — height stays uniform across a row so `grid-auto-flow:
dense` can't produce ragged gaps. This keeps the bento to a single, easy-to-reason-about axis of
variation (width only), which also bounds the CSS/testing surface for a first pass.

Breakpoints: 6 cols desktop → 4 cols at `max-width: 960px` (existing breakpoint used elsewhere) →
1 col at `max-width: 620px` (existing breakpoint). `span-2` clamps to full-row width below 4
columns so nothing overflows its track.

## 3. Card typography

No new fonts — Archivo (headings/UI) and JetBrains Mono (numbers/labels) only, per CLAUDE.md.

- `.demo-title` (card component name): scales up from its current size to `clamp(22px, 2.4vw,
  30px)`, weight 700. It becomes the dominant text element per card rather than sitting level
  with the subtitle.
- `scramble-reveal`'s card additionally sets its own name in the demo-stage area (not just the
  meta row) at a larger size, since the component's whole identity is decoding text — the card
  should look like what it does, per the critique's "component names become part of the visual
  identity" point.
- Section labels (`Section.tsx`'s `01 / REFUSALS`-style headers): weight increases, size increases
  modestly (existing `mono-label` class, values set in implementation to stay proportionate to the
  new card-title scale — no exact px prescribed here, tuned against the live page).
- `lander-title`: modest increase from `clamp(34px, 5.4vw, 58px)` since it now shares the fold
  with a large dial rather than owning the full width alone — exact clamp values tuned in
  implementation against the two-column layout.

## 4. Rhythm

No new sections added. The quiet/loud alternation the critique asked for comes from the bento's
own size variation (span-2 cards break the eye's pattern-matching after the first few cards) plus
the hero's new scale, not from inserting new content blocks — this stays inside "fix the existing
structure," not "add sections," matching the approved scope.

## 5. Library — explicitly excluded from bento

Per your call: Library (`/components`) is the filterable reference, not the showcase — uneven
card sizes fight scanning/comparison during a live filter re-flow. Library keeps its uniform
`.library-grid` (`repeat(auto-fill, minmax(300px, 1fr))`, unchanged) and the existing
`AnimatePresence`/`layout` re-flow on filter change. Changes here are typography-only:

- `.card-name` scales from 20px to match the new `.demo-title` scale (`clamp(22px, 2.4vw, 30px)`,
  weight 700) for visual consistency with Home.
- `.card` hover state strengthens: border transition unchanged in mechanism (existing
  `color-mix` hover rule), but paired with the existing site spring on a subtle lift
  (`translateY`), reusing `useSiteSpring`'s `stiff` transition already imported in `Library.tsx` —
  no new spring constants.
- Section labels match Home's new weight/size.
- The Chase-powered filter control is untouched.

## DESIGN.md updates

A new dated revision entry ("Revision 2026-08-21 — bento grid + hero reversion, user-directed")
is added, recording:

- The uniform-eleven-cards line from Revision 2026-08-18 is superseded for Home; Library keeps a
  uniform grid by explicit choice, so "uniform cards" survives there but not site-wide.
- The hero partially reverts to the original first-frame spec (dial beside headline, left-aligned,
  flickable within 1s), while keeping the 2026-08-18 palette, radii, and pill/install-pill
  elements — a partial reversion, not a full rollback of that revision.
- No PRD.md changes — this is layout/presentation only, no new components, no CLI/registry change.

## Out of scope (explicitly, so it isn't inferred later)

- No new colors, gradients, or shadows beyond the one exception and the one contact-shadow already
  committed.
- No changes to any component's physics, spring constants, or registry data.
- No row-axis (height) bento spans — width spans only, this pass.
- No change to Candidates, detail pages, CLI page, Architecture, Docs, or `/lab/navigation`.
- No new sections inserted for "rhythm" — rhythm comes from existing structure at new scale.
