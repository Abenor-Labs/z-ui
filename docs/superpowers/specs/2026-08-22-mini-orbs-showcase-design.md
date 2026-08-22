# DESIGN — mini showcase site (`site-orbs`)

## Overview

A second, small, single-page site that shows the seven Z-UI components the way
`orbs.jakubantalik.com` shows its one component: a dark bento grid of live cards, an
install snippet, a usage snippet, and a small playground — nothing else. Standalone from
`site/` (the existing full spec-driven showcase); not a replacement, not a shared route.

If this reads well, the user intends to use this single-route site as the primary public
showcase going forward — built and finished accordingly, not as a throwaway sketch.

## Non-goals

- Not a docs site. No `/components/dial`-style detail routes, no CLI page, no
  architecture page. One route (`/`) only.
- Not a re-implementation of the components. The seven `.tsx` files are imported
  directly from `registry/components/`, unmodified — the exact bytes the CLI installs.
- Not bound by `site/`'s DESIGN.md constraints (ruled graph-paper layout, route
  transitions, etc.) — this is a separate, smaller identity that borrows the palette and
  motion constants, not the whole system.

## Architecture

**New pnpm workspace package: `site-orbs/`** (Vite + React 19 + TypeScript), added to
`pnpm-workspace.yaml`. Picked up automatically by the root `pnpm -r typecheck` / `pnpm -r
build` / `pnpm dev` filters, matching the monorepo's existing verify flow.

**Components come from the registry, not a copy.** `site-orbs/vite.config.ts` gets the
same alias `site/vite.config.ts` already uses for its one promoted component (`heft`):

```ts
resolve: { alias: { '@z-ui/registry': '../registry/components' } },
server: { fs: { allow: ['..'] } },
```

All seven are imported this way — `import { Dial } from '@z-ui/registry/dial/dial'`, etc.
— so a registry change (a prop rename, a tuned constant) shows up here with no manual
sync step, and there is no possibility of the showcase drifting from what actually
installs. `heft.tsx` additionally needs its shipped `heft.css` imported alongside it.

**No Tailwind.** Inspecting all seven `.tsx` files: the actual shipped components use
almost no utility classes — a handful of layout-only ones (`absolute`, `inset-0`,
`size-full`, `relative`, `sr-only`, plus heft's own `z-heft-box`/`z-heft-label`, which
`heft.css` already defines). Everything else is inline style reading CSS custom
properties with literal OKLCH fallbacks (`--z-accent`, `--z-line`, `--z-muted`,
`--z-fill`, `--z-radius`, `--z-track`, `--z-danger`, `--z-invalid`, `--z-valid`) — the
same `--z-*` contract across all seven, by design, per each file's own header comment
("themes cleanly in a project that defines tokens, renders correctly in one that
doesn't"). Setting those custom properties once on `:root` — mapped to the palette below
— themes every component correctly with zero per-component CSS. The site adds one ~15-line
utility stylesheet for the handful of plain layout classnames the components reference,
and nothing else. The `.demo.tsx` files sitting next to each component are registry
reference demos (heavy Tailwind, generic neutral-gray chrome) — not shipped by the CLI,
not used here; this site writes its own card chrome instead.

**Fonts:** Google Fonts CDN `<link>` for Archivo (500/700) and JetBrains Mono (400/500) —
simpler than `site/`'s self-hosted `@fontsource` packages (A11's no-third-party-request
reasoning was specific to the main site's polish pass; this is a small standalone and CDN
is the lower-effort correct call here).

**Dependencies:** `react`, `react-dom`, `motion` (needed by five of the seven
components), `vite`, `@vitejs/plugin-react`, `typescript`. No router — one route.

## Palette & type

Reused, not reinvented — the same tokens as `site/`'s committed dark palette:

- Paper `#0F0E0D` · Ink `#F4F1EA` · Recess `#1A1815` / `#211E1A` · Rule `#2A2723` ·
  Signal `#FF4D00`
- Headings/UI: Archivo 500/700. Numbers/code/labels: JetBrains Mono.
- `--z-accent: #FF4D00` on `:root` is the one line that ties every component's live/active
  bits to Signal orange; everything else (`--z-line`, `--z-muted`, `--z-fill`) maps to
  Rule/Ink-at-reduced-opacity so components read correctly against the dark background
  without per-component overrides.

## Page structure (single route)

**1. Header** — small mark, "Z-UI" wordmark + tagline ("Micro-animations you own."),
GitHub + npm icon links top-right (same URLs as `site/`'s footer, A7).

**2. Bento grid — one card per component** (not per-state: the reference repeats one
component across 8 states; Z-UI has seven distinct components, so the grid is seven
cards, each a live, real instance, labeled by its own trigger). No autoplay — stays true
to PRD's "not a static gallery" non-goal even off the main site. Mixed sizing for the
asymmetric bento rhythm:

| Component | Card size | Live interaction | Label |
|---|---|---|---|
| dial | large | flick/drag the knob | "flick to spin" |
| heft | large | drag a box | "drag a box" |
| hold-drain | large | press and hold | "hold to confirm" |
| chase | small | click a segment | "pick a segment" |
| disclosure | small | click to expand | "press to expand" |
| late-critique | small | type in the field | "type an email" |
| scramble-reveal | small | hover the text | "hover to decode" |

**3. Installation** — one code block: `npx @abenor/z-ui@latest add <name>`. A tab row
above it switches `<name>` across the seven — built from the real `Chase` component
(imported the same way as the grid), giving the tab control itself a live instance rather
than a bespoke pill row.

**4. Usage** — a matching import + JSX snippet, same tab selection as Installation.

**5. Playground** — the same `Chase` tab row selects a component; one live stage renders
it; a generated code line sits underneath. No per-component preset panels (detents/size
pickers, etc.) — that level of control belongs to `site/`'s detail pages (DESIGN.md
A15) and is explicitly out of scope for "small."

**6. Footer** — GitHub repo, npm package, MIT license — same three links as `site/`'s
footer (A7), no invented contact channels.

## Data flow

Entirely client-local component state — no backend, no fetch, matches PRD's "no backend,
no accounts, no analytics" non-goal. The Installation/Usage/Playground tab selection is
one piece of state (`selected: ComponentName`) lifted to the page and read by all three
sections, so they can't fall out of sync with each other.

## Testing / verification

- `pnpm -r typecheck` and `pnpm -r build` must both stay clean (picks up `site-orbs`
  automatically once it's in `pnpm-workspace.yaml`), per the repo's standing verify
  requirement.
- Manual check in-browser: all seven cards are flickable/draggable/typeable within the
  same session, nothing autoplays before first touch, `prefers-reduced-motion` is
  respected (each component already implements its own reduced-motion behavior
  internally — nothing extra to build here, just don't break it).

## Assumptions

- **B1 — No Tailwind.** Confirmed by reading all seven component files: only a handful of
  plain layout classnames are used outside the `--z-*` custom-property system; a small
  hand-written utility sheet covers them.
- **B2 — CDN fonts over self-hosted.** Matches the smaller scope of this site; not a
  reversal of `site/`'s A11, which is specific to that build.
- **B3 — Chase reused as the tab control** for Install/Usage/Playground, rather than a
  bespoke pill row, since the real component is already being imported for the grid card.
