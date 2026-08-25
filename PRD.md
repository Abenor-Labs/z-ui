# PRD — Z-UI website

## PRODUCT FACTS (ground truth — do not deviate)

Name: Z-UI
Tagline: "Micro-animations you own."
Positioning: A copy-paste registry of React micro-interactions, installed as source into a project — not pulled in as a runtime dependency. Not a design system, not a layout kit, not a shadcn/ui replacement. Sits on top of whatever the developer already uses.
Core install command: npx @abenor/z-ui@latest add dial
Status: v0.1, early. CLI published, working. Eight components in the registry. Showcase site is live at https://zui-abenor.vercel.app — registry served from raw GitHub. Names/props may still change before v1.

What it refuses to be: a design system, a layout kit, a shadcn/ui replacement, anything that isn't a micro-animation.

THE EIGHT REAL COMPONENTS (showcase exactly these — no more, no fewer, no invented ones):

1. dial — category: tactile-feedback. A pulse-dial telephone dial. The number ring is fixed and the finger wheel turns over it, so the digits stay upright while you dial. Pulses are emitted on the RETURN, not the pull: a governor drives the wheel back at a constant 300 deg/sec and a cam trips one pulse every 30 degrees, so dialling 0 takes ten times as long as dialling 1. Past 85% of a digit's travel the pull registers. Needs: react only — no motion dependency. Sound is an opt-in `sound` prop, off by default, synthesised with no assets. This is the ONE component whose transition is not interruptible: the governor owns the wheel from release until it seats, because the pulse count is only honest if the return completes. Recorded as an explicit exception in DESIGN.md. The flywheel knob that previously shipped under this name is now a candidate (see CANDIDATES.md) and is NOT installable.

2. chase — category: state-morphing. A segmented control whose indicator gives chase: the edge facing the target leaves on a stiff spring, the edge behind follows on a soft spring, and the visible stretch between the two edges IS the speed — nothing scripts the squash, it emerges from the two independent springs. Needs: motion.

3. heft — category: tactile-feedback. A box of objects that behave like real objects. Drag one and everything it touches gets shoved aside; anything resting on top loses its floor and drops. Real gravity, contacts, and friction in one file. Needs: motion.

4. disclosure — category: state-morphing. A panel whose height is an interruptible spring. Press again mid-open and it reverses from wherever it currently is, carrying the velocity it already had — no snap-back to a default curve. Needs: motion.

5. hold-drain — category: tactile-feedback. A hold-to-confirm control whose abort costs what the hold earned. Let go at 70% filled and the fill drains back at the same rate it climbed — not instantly, not on a different curve. Needs: motion.

6. late-critique — category: input-utility. A form field whose criticism is late and forgiveness is instant. No error verdict lands mid-word (while the user is still typing a first attempt); the very first keystroke that fixes the value clears the error on the same frame it's typed. Needs: react only (no motion dependency).

7. scramble-reveal — category: state-morphing. Text that decodes out of random glyphs — on hover, on mount, or the first time it scrolls into view. Needs: react only (no motion dependency).

8. thinking-orb — category: state-morphing. A dotted, honestly-3D status indicator: nine hand-tuned canvas animations for nine agent states (working, searching, solving, listening, connecting, weaving, composing, breathing, shaping), z-sorted and depth-shaded, no WebGL. The one component with no driving gesture — its state is set programmatically by the consumer, not by a press, hold, drag, hover, or keystroke on the component itself. Vendored from thinking-orbs (MIT, Jakub Antalik) into one self-contained file. Needs: react only (no motion dependency).

Each component is a single self-contained .tsx file. No shared lib/ required to install first; if a component needs a primitive, that primitive ships inside the component file.

THE REAL CLI (do not invent additional commands):
- z-ui init — writes z-ui.json (add does this automatically on first run if missing)
- z-ui add <name...> — adds one or more components and their npm dependencies
- z-ui list — lists what the registry offers
- z-ui doctor — checks what's installed, changes nothing
- z-ui spring [name] — draws the actual spring curve for a component before you pick a preset
- z-ui preview <name> — shows how a component moves, before installing it
- z-ui completion <shell> — shell completion script for bash, zsh, or fish

Useful flags: --dry-run (show install plan, write nothing), --registry ./registry (install from a local clone instead of GitHub), --json (machine-readable output for list/doctor/preview), -o/--overwrite, -y/--yes.

--spring <preset> flag: retargets a component's default spring preset at install time (snap, bounce, settle, or fling). IMPORTANT nuance: every springed component currently ships bespoke, hand-tuned physics rather than using a shared preset (dial runs at 1300/46, chase runs two springs simultaneously) — so the CLI actually REFUSES to apply --spring to those components and instead tells the developer which exact numbers to edit by hand, rather than silently installing motion the original author didn't tune. This refusal is a deliberate product decision worth explaining on the site, not a bug.

Install guarantee: nothing is written to disk until everything is confirmed writable — fetch, resolve, verify, and plan all complete fully before the first byte lands.

Fallback without the CLI (shadcn-compatible):
npx shadcn@latest add https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public/r/dial.json
(Using this fallback loses install-time spring selection, preview, and doctor — you still get the file.)

REAL ARCHITECTURE DECISIONS (use as real content for the philosophy/architecture page — do not invent alternate reasoning):
- Motion engine: Motion (Framer Motion), declared per-component only when needed. Reason: real interruptible springs with velocity carry-over are required; CSS keyframes cannot reverse mid-flight, and mid-flight reversal IS the product. A component that doesn't need it doesn't declare the dependency.
- Delivery: first-party CLI (@abenor/z-ui on npm). Reason: full control over install UX. Registry items stay shadcn-schema-shaped, so npx shadcn add <url> works as a free fallback path.
- Registry transport: raw GitHub URLs behind a single constant base URL. Reason: no hosting to stand up on day one; swappable to a real domain later with no code change. Caveat: unauthenticated raw GitHub allows ~60 requests/hour per IP, which --registry ./registry avoids.
- Component API: uncontrolled by default, controlled optional. Reason: e.g. <Disclosure /> works immediately with zero setup; open / onOpenChange props exist for apps that need real control.

Repo structure (real, for reference/docs page):
z-ui/registry/ (source of truth, real TypeScript workspace, typechecked in CI) · packages/cli/ (@abenor/z-ui) · web/ (showcase site + generated registry it serves) · components/ (dev harness) · scripts/ (linters + tests that break them on purpose) · docs/ (roadmap, ADRs, specs)
web/public/r/ is generated from registry/ and committed; CI fails if they disagree.

Dev/verify commands (real, for docs if relevant): pnpm install, pnpm dev, pnpm --filter @z-ui/web dev, pnpm verify (runs typecheck → registry linter → contrast linter → generated-registry check → tests, plus suites that deliberately break each linter to prove it still catches things).

License: MIT © Abenor Labs

Voice/tone for all copy: precise, dry, technically confident. No marketing fluff. Never write phrases like "supercharge your workflow," "seamless," "next-level," or similar — the README's own voice (e.g. "That constraint is the product," "If it isn't a micro-animation, it doesn't belong here") is the model to match.

---

## Goals

1. Make the eight components' physics *felt*, not described — every preview on the site is the
   real interaction, reimplemented faithfully (velocity carry-over, dual springs, gravity/contacts),
   never a video, screenshot, or scripted loop.
2. Get a developer from landing to `npx @abenor/z-ui@latest add dial` in one screen — the install
   command is above the fold, copyable, next to a working dial.
3. Document the real CLI surface (7 commands, flags, install guarantee, `--spring` refusal,
   shadcn fallback) accurately enough to serve as the product's docs.
4. Explain the four real architecture decisions in the product's own reasoning and voice.
5. The site itself demonstrates the product's motion identity: it runs on the dial's spring
   (1300/46), and every transition is interruptible.

## Non-goals

- **Not a static gallery.** No dead preview boxes, no autoplaying loops standing in for
  interaction.
- **Not a generic SaaS template.** No testimonial wall, no pricing page, no fake logos, no
  invented social proof.
  (REVISED 2026-08-18, user-directed: this bullet previously also banned a centered hero and a
  dark surface. The landing was rebuilt on the transitions.dev model — centered hero, dark
  surface, uniform live-demo grid — so those two bans are lifted. What replaces them: every
  stage on that grid is a real component instance, and every trigger fires the component's own
  input path. See DESIGN.md → "Revision 2026-08-18".)
- **No invented surface area.** No components beyond the eight, no CLI commands beyond the
  seven, no architecture claims beyond the four decisions. v0.1 honesty stays visible
  (names/props may change before v1; registry served from raw GitHub).
- Not the showcase app that lives in the z-ui repo's `web/` — this is an independent
  marketing/docs site.
- No backend, no accounts, no analytics requirement.

## Sitemap

```
/                         Home — positioning, refusals, install command, live dial hero
/components               Component Library — chase-driven category filter, 8 live cards
/components/dial          Detail + playground + velocity-over-time graph
/components/chase         Detail + playground + stretch annotation
/components/heft          Detail + full-width sandbox + contact readout + spawn
/components/disclosure    Detail + playground + height-over-time graph
/components/hold-drain    Detail + playground + fill/rate readouts
/components/late-critique Detail + real form + timestamped decision log
/components/scramble-reveal Detail + playground (hover / mount / in-view triggers)
/components/thinking-orb  Detail + playground (nine-state select, no driving gesture)
/cli                      CLI — 7 commands, flags, install guarantee, --spring refusal, fallback
/architecture             The four architecture decisions, repo structure
/docs                     Getting started — accordions are real disclosure instances
*                         404 — heft-style fallen boxes, same physics
```

Repo / links / contact live in the footer on every page (GitHub repo, npm package, MIT © Abenor
Labs). No invented contact channels.

## Key user flows

1. **Evaluate in 10 seconds.** Land → flick the dial (interactive within 1s of load) → read
   tagline + refusals → copy install command. No scrolling required.
2. **Find a component.** `/components` → filter by category with the real chase control →
   card previews are live → click through to detail → play with the real physics → copy that
   component's install command → see its "Needs" line.
3. **Trust the install.** `/cli` → read the install guarantee → see `--dry-run` → see the
   `--spring` refusal explained as a decision, not a bug → find the shadcn fallback if they
   don't want the CLI.
4. **Understand the philosophy.** `/architecture` → four decisions with real reasoning →
   understand why CSS keyframes were rejected (mid-flight reversal is the product).
5. **Get started properly.** `/docs` → requirements → first add → what gets written →
   local registry for offline/rate-limit → contributing pointers.

## Success criteria

- [ ] Dial on the home page is flickable within 1 second of load; nothing on the page
      autoplays before first touch.
- [ ] Dial and disclosure demonstrably carry velocity through interrupts; chase visibly runs
      two independent springs (stretch emerges, is never scripted); heft has real gravity,
      contacts, and friction.
- [ ] Every one of the 13 routes renders; `npm run build` and `npm run typecheck` are clean.
- [ ] All copy passes the voice check: no banned marketing phrases anywhere.
- [ ] Zero invented components, commands, flags, or architecture claims — auditable against
      PRODUCT FACTS above.
- [ ] MICRO-DETAILS checklist in DESIGN.md verified item by item.
- [ ] `prefers-reduced-motion` collapses springs to instant state changes; dial becomes
      click-to-step.
- [ ] Physics playgrounds work with touch; nothing broken on mobile.
