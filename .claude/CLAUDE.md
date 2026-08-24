# Working instructions — Z-UI monorepo

This is the whole product: the registry, the CLI that installs from it, and the website.

## Layout

- `registry/components/` — the eight shipped components, one self-contained .tsx each.
- `packages/cli/` — the published `@abenor/z-ui` CLI. Do not move it.
- `web/` — registry build only. `scripts/build-registry.mjs` reads `registry/` and writes
  `web/public/r/`. **That path is a hard contract**: the published CLI hardcodes
  `raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public`. Moving it breaks every
  installed CLI.
- `site/` — the website (Vite + React Router). Replaced the Next app now in `archive/web-next/`.
- `archive/` — superseded work, kept rather than deleted. Nothing here is live.

The components under `site/src/zui/` are site reimplementations and differ from the registry
originals. That divergence is known and accepted; a registry component is only replaced when a
specific one earns it on evidence.

## Source of truth

- **PRD.md → "PRODUCT FACTS" is the only source of truth about the product.** Never invent, rename,
  or extend components, CLI commands, flags, architecture reasoning, or product claims beyond it.
  There are exactly eight components and exactly seven CLI commands. If a fact isn't in PRD.md,
  it isn't a fact.
- **DESIGN.md holds committed creative decisions.** Anything decided during the build that isn't
  already specified there goes into its "Assumptions" section, clearly marked as an assumption.
- **Re-read PRD.md and DESIGN.md before any major decision** (new page, new copy block, new
  interaction, dependency change). Drift is the failure mode this file exists to prevent.

## Coding conventions

- TypeScript strict. React function components only. No class components.
- Motion (`motion/react`) drives every showcase interaction that needs a spring; custom rAF
  integrators are allowed where a flywheel/rigid-body sim is the honest implementation, but detent
  catches and settles still run through Motion springs.
- Shared spring constants live in `src/lib/springs.ts` — never re-declare 1300/46 or 300/30 inline.
- Animate transforms and clip only. No layout-thrashing animations (no animating `top/left/width`
  on layout-participating elements; physics sandboxes use `transform: translate(...)`).
- Every transition must be interruptible. If it can't reverse mid-flight, it doesn't ship.
- All numbers/measurements/labels render in JetBrains Mono; headings/UI in Archivo 500/700.
- Colors only via CSS custom properties from `src/styles/tokens.css`. No new colors, no gradients,
  no box-shadows except the single 1px-offset hard shadow on pressed/dragged elements.
- Copy voice: precise, dry, technically confident. Banned: "supercharge", "seamless",
  "next-level", "effortless", "blazing", and their relatives. Model sentence: "That constraint
  is the product."

## Verification

- `npm run build` and `npm run typecheck` must pass before any phase is called done.
- Check TASKS.md items off as they complete; don't batch-check at the end.
