# DESIGN — Z-UI website

Everything under "Committed direction" is decided fact. Anything decided later during the build
goes under "Assumptions", clearly marked as an assumption, never presented as a product fact.

## Committed direction

### Identity

"Instrument, not brochure." The site looks and behaves like a precision measuring instrument for
motion — an oscilloscope crossed with an engineer's lab notebook. Every decorative element must be
a REAL artifact of the product (actual spring curves, actual velocity readouts), never ornament.

### Palette (exact hex, no additions) — REVISED 2026-08-18

The site is DARK. The two neutrals swapped roles rather than being replaced: what was the ink is
now the raised surface family, and what was the paper is now the text.

- Paper (page background): `#0F0E0D`
- Ink (text, hard contact edges): `#F4F1EA`
- Recess (cards, stages, code blocks): `#1A1815`, one step up: `#211E1A`
- Rule (hairlines, borders, gridlines): `#2A2723`

Superseded light values, kept for the record: Paper `#F4F1EA`, Ink `#1A1815`, Rule `#D8D2C4`,
Recess `#EAE6DB`.
- Signal: `#FF4D00`  (international orange — the ONLY accent; reserved exclusively for live/interactive/measured things: spring curves, active states, the dial's indicator, velocity numbers)
- Rule:   `#D8D2C4`  (hairlines, borders, graph gridlines)
- Recess: `#EAE6DB`  (inset panels, code blocks)

No gradients anywhere, with exactly one exception (2026-08-18): a single radial glow behind the
landing's hero mark, `rgba(255,77,0,0.22)` fading to transparent. It appears once on the whole
site. No box-shadows except a single 1px-offset hard shadow on pressed/dragged elements (objects
have contact, not glow).

Radii were introduced with the same revision: 14px cards, 10px stages, pill buttons. The rest of
the site remains square.

### Type (exact)

- Headings + UI: Archivo (Google Fonts), tight tracking, weights 500/700 only
- All numbers, code, measurements, labels: JetBrains Mono — every live physical value on screen
  (velocity, spring stiffness, fill %) renders in mono in Signal orange, updating in real time
- No Inter anywhere.

### Layout system

- Ruled like graph paper: visible 1px hairline column rules on desktop, content snapping to an
  8pt grid
- Section dividers are hairlines with mono labels ("01 / REGISTRY"), like schematic annotations
- Left-aligned, dense, desktop-led. No centered hero, no vague headline floating in whitespace.

### First frame (literal spec) — SUPERSEDED 2026-08-18, see "Revision 2026-08-18" below

Above the fold: headline "Micro-animations you own." set huge in Archivo, left-aligned. To its
right, a REAL working dial — the actual flywheel physics (interrupt + velocity carry-over,
detents, spring catch). Next to the dial, a live mono readout: current velocity (rad/s) and the
active spring constants (1300/46), printed in Signal orange, updating every frame. Below: the
install command `npx @abenor/z-ui@latest add dial` in a Recess-colored block with a copy
affordance. The user must be able to flick the dial within 1 second of load. Nothing autoplays;
the page is still until touched.

### Motion identity (one personality, everywhere)

- Default site spring: stiffness 1300, damping 46 (the dial's own numbers — the site runs on the
  product's physics)
- Soft-follow spring for secondary elements: 300/30
- EVERYTHING is interruptible; if a transition cannot be reversed mid-flight, it doesn't ship
- Route transitions: content settles in on the stiff spring with a 20–40ms stagger down the ruled
  sections — like an instrument powering on, not a fade
- No opacity-only transitions, no ease-in-out CSS keyframes, no autoplaying loops

### Showcase specs (per component — the site's actual centerpieces; each must match the described
physics exactly, reimplemented for the site, not screenshots or fakes)

- dial: hero placement as above; its detail page adds a live-drawn velocity-over-time graph
  (SVG polyline) plotting the last 3 seconds of the user's own interaction
- chase: IS the category filter on the Component Library page — the filter control is a real
  chase instance (two independent springs, stiff leading edge, soft trailing edge, emergent
  stretch); annotate the stretch with a hairline + mono label on first interaction
- heft: full-width sandbox on its page — real gravity, contacts, friction; a "spawn object"
  button adds boxes; live contact-count readout in mono
- disclosure: the docs page's own accordions ARE disclosure instances (dogfooding); detail page
  shows a height-over-time graph proving velocity carry-over on interrupt
- hold-drain: fill % and drain rate as live mono readouts; one dry caption sentence explaining
  the abort-cost principle
- late-critique: real form on its page (e.g. an email field); a mono event log beside it prints
  timestamped validation decisions as they happen, proving "no verdict mid-word, forgiveness
  same-frame"
- scramble-reveal: every page's section labels use it on first scroll-into-view — once per label,
  never looping

### Micro-details (non-negotiable checklist — verified in-browser 2026-08-14)

- [x] `::selection` uses Signal orange with Paper text (computed: rgb(255,77,0) / rgb(244,241,234))
- [x] Custom `:focus-visible` — 1px Ink outline offset 2px, no default blue ring
- [x] `cursor: grab / grabbing` on all draggable physics elements (dial, heft boxes)
- [x] Code blocks: Recess bg, mono, one-click copy whose confirmation state change uses the site
      spring (not a toast) — verified: label stack springs with visible 1300/46 overshoot
- [x] 404: heft-style fallen boxes; same physics; same voice — drop on first touch, no autoplay
- [x] `prefers-reduced-motion`: springs collapse to instant state changes, dial becomes
      click-to-step — documented below
- [x] Responsive: desktop-led as flagship, nothing broken at 390px; physics playgrounds use
      pointer events + touch-action: none for touch

### Reduced motion (committed behavior)

When `prefers-reduced-motion: reduce`:
- All Motion springs collapse to instant state changes (duration 0).
- The dial's freewheel is disabled; the dial becomes click-to-step — each click advances one
  detent instantly. Readouts still update.
- scramble-reveal renders its final text immediately, no glyph cycling.
- Route transitions render the new page in place, no settle.
- Heft remains draggable but boxes teleport-resolve rather than tumble (single relaxation step,
  no continuous gravity animation is required to read the page).

---

## Revision 2026-08-18 (user-directed)

The landing was rebuilt on the transitions.dev model. What changed, and what did not:

**Changed**
- Hero is centered: a bordered mark tile with a single radial glow, the headline, a 3-line
  subhead, two pill CTAs (Browse / GitHub), and the install command as a pill below them.
- Site palette is dark (see Palette above). This is site-wide, not landing-only — colors live in
  one token file and a half-dark site reads as a bug.
- The landing IS the demo grid: eleven uniform cards (seven registry + four candidates), each
  `stage / trigger / title / one-line mechanism / copy-install`. The old left-aligned hero with
  the dial beside the headline is gone; the dial is now the first card in the grid.
- Cards and stages have radii; pills exist.

**Deliberately not changed**
- Every stage holds a REAL component instance. Nothing is a video, a screenshot, or a loop.
- The card trigger is not an "Animate" button. It fires the component's own input path and then
  gets out of the way: `flick` hands the dial an impulse and its own friction takes over;
  `hold 700ms` presses and releases so the real drain runs; `type a bad address` replays
  keystrokes through the field's own input handler and the verdict lands on the real idle timer.
  The one simulated input is intent's `simulate approach`, which dispatches a pointer path — the
  decision it produces is the component's own, and the card label says the input is simulated.
- Signal orange still means live/measured. Numbers still render mono in Signal.
- Springs, interruptibility, and reduced-motion behavior are untouched.

**Cost of the change, recorded honestly**: PRD.md's "no centered hero / no dark" non-goal was
overridden by the user, and DESIGN.md's original first-frame spec (dial beside the headline,
flickable within 1s) no longer describes the page — the dial is now one card down, still live and
still flickable, but no longer above the fold on short viewports.

## Revision 2026-08-18b — transitions.dev motion tokens (user-directed)

The site's chrome had no transitions at all: every hover, border and tab change was instant, which
is what read as "not smooth" next to transitions.dev. The `transitions-dev` and `transitions-polish`
skills were installed and applied, with a hard scope line.

**Installed** — `src/styles/motion.css`
- The shared motion-token scale, copied from the skill's `_root.css`: `--duration-*`, `--ease-*`,
  `--distance-*`, `--scale-*`, `--blur-*`.
- Transition **16 · tabs sliding** was installed and then removed. The detail page's
  preview/source/install bar now runs on a real `chase` instance — the same control the
  /components filter uses, given a `label` prop for its own accessible name. Measured in-browser:
  the indicator travels left 3px → 153px while its width goes 78 → 160 → 78, so the stretch is the
  emergent one, not a tweened pill. A site selling an emergent-stretch indicator should not ship a
  CSS pill doing the same job two clicks away.
- Transition **14 · skeleton loader and reveal**, verbatim, on the registry read. The panel pulses
  a placeholder in the same slot and cross-fades to whatever the registry answered.
- A polish pass over chrome only: hover in at `--duration-quick`, resting state at
  `--duration-fast`, both on `--ease-smooth-out`; `scroll-behavior: smooth` with a reduced-motion
  guard.

**The scope line — nothing above touches a component that owns physics.** The seven registry
components and the four candidates keep their springs, their friction integrators and their
velocity carry-over. A duration cannot carry velocity through an interrupt, and that is the
product's whole claim: /architecture argues CSS keyframes cannot reverse mid-flight, so the
components must not be built from them. Chrome is not the product, so chrome can be tokenized.

Both snippets ship with their `prefers-reduced-motion` guard intact, plus a guard covering the
polish-pass selectors.

---

## Assumptions

Decisions made during the build that the creative direction did not specify. These are site
implementation choices, NOT product facts.

- **A1 — Detent count and dial geometry.** The site's dial renders 12 detents (every 30°),
  160px hero diameter. PRODUCT FACTS specify detents but not their count; 12 reads as an
  instrument bezel.
- **A2 — Chase spring numbers.** PRODUCT FACTS say chase "runs two springs simultaneously" but
  give no constants. The site's chase uses 1300/46 for the leading edge and 300/30 for the
  trailing edge — the site's own committed motion identity — and labels them as the site's
  implementation, not the registry component's shipped values.
- **A3 — Hold-drain rate.** Climb rate 60%/s (~1.67s to confirm), drain at the same 60%/s.
  PRODUCT FACTS fix only the symmetry (drain rate = climb rate), not the rate itself.
- **A4 — Late-critique idle window.** A verdict is considered "late enough" after 700ms of
  typing silence or on blur. PRODUCT FACTS fix the behavior (no verdict mid-word, same-frame
  forgiveness), not the exact idle threshold.
- **A5 — Heft engine.** The site's heft sandbox is a bespoke axis-aligned rigid-body integrator
  (gravity, impulse contacts, friction, no rotation) written for this site. The real registry
  component's internals are not claimed or copied.
- **A6 — CLI page terminal output. SUPERSEDED 2026-08-18.** Output on /cli was illustrative
  rendering in the product's voice. It is now real: transcripts captured by running
  `npx @abenor/z-ui@latest` (v0.1.1) in a scratch project on 2026-08-18, stored verbatim in
  `src/data/cliRecordings.ts`, with only npm's own install noise trimmed and marked in place. The
  page replays them two ways — a recorded cast with a play/pause transport, and a shell that
  answers typed commands from the same set and refuses to invent anything outside it. What the
  capture revealed about PRODUCT FACTS is written up in CLI-FINDINGS.md, unresolved on purpose. REVISED 2026-08-18: /cli is now an interactive shell rather than
  static transcripts — it parses the seven real commands and the documented flags, accepts
  `z-ui add dial`, `npx @abenor/z-ui@latest add dial` or bare `add dial`, and supports Tab
  completion, ↑/↓ history, Ctrl+L and `clear`. It invents no commands: an unknown verb prints the
  seven and stops. Two outputs are computed rather than written: `list` reads the registry data,
  and `spring <name>` plots the damped step response from the component's real constants
  (dial 1300/46 → 7.4% overshoot, settles ~170ms) as ASCII. The banner says "simulated shell"
  so nobody reads it as a captured session. Nothing autoplays; it is still until typed in.
- **A7 — Links.** GitHub repo URL `github.com/Abenor-Labs/z-ui` is taken from the shadcn
  fallback URL in PRODUCT FACTS; npm package page from `@abenor/z-ui`. No other contact
  channels exist in the facts, so the footer offers only these plus GitHub issues.
- **A8 — Framework.** React + Vite + react-router (client-rendered). Reasoning recorded in
  ARCHITECTURE.md.
- **A9 — Scramble glyph set.** `#/\\<>[]{}=+*%—0123456789` — reads as instrument noise, not
  matrix-rain. Duration ~500–700ms, chars lock left-to-right with jitter, ~2 shuffles per
  frame-step. Runs once per label.
- **A10 — 404 composition.** Three heft boxes glyphed "4", "0", "4" drop into the sandbox on
  first pointer interaction (page loads still; spec forbids autoplay) — the pile they land in is
  the 404 graphic. Since the engine is axis-aligned (A5), "fallen over" reads as
  dropped-and-scattered, not rotated.
- **A11 — Fonts self-hosted** via @fontsource packages (Archivo 500/700, JetBrains Mono 400/500)
  rather than Google Fonts CDN — no third-party request, no FOUT flash of wrong font on repeat
  visits.
- **A12 — Compact live previews** (mini dial, three-segment chase, three-box heft, one-line
  disclosure, small hold-drain bar, small email field, hover-scramble line) are shared by the
  library cards AND the home page registry grid — interactive per the no-dead-previews
  constraint, reduced in size only. The home registry section was revised from a text table to
  this live grid after review: showing beats describing.
- **A13 — Candidate lab route.** `/candidates` is a site-only bench for components that are NOT
  in the registry: reel, origin, grip, intent. PRODUCT FACTS still says seven components, and the
  page says so in its own header — no install command, no CLI mention, no registry card. The
  slate they came from, and the source study behind it, live in CANDIDATES.md at the repo root.
  A candidate becomes a component only when the CLI can install it and PRODUCT FACTS is updated.
- **A14 — Candidate physics constants.** grip breaks loose at 22px of pull and trails by 8px;
  intent counts a pointer as aimed within 32 degrees plus the target's own angular size, slow
  below 70px/s, committed inside 280px; reel decays at 4.2/s and catches below 2.5 rows/s. These
  are site-implementation numbers for unreleased components, not shipped values.
- **A15 — Detail-page playground** (adopted 2026-08-19, user-directed, modeled on the playground
  at orbs.jakubantalik.com): every component detail page is a controls panel over a live stage over
  the code that stage is currently running. Each control group is a real `chase` instance — the
  site does not ship a bespoke segmented control in order to demonstrate its own segmented control.
  The code block is generated from the same state the stage renders from, so it cannot drift from
  what is on screen. The preset sets are site-authored, not product facts: dial 8/12/24 detents at
  96/160/220px; chase 2/3/5 options with annotate off/on; heft scenes stack / scatter / tower /
  crowd at 260/420px; disclosure short/long content; hold-drain 30/60/120 %/s; late-critique log
  off/on and full/compact; scramble-reveal hover/mount/in-view at 240/380/600ms. The reference
  playground's speed multiplier and pause transport were deliberately NOT adopted in this pass —
  an honest time-scale means every component reads a scale factor (rAF integrators multiply dt;
  springs scale as k·s², c·s), which is a seven-component change and was deferred by decision.
- **A16 — Heft solver constants.** VEL_ITERATIONS 8, POS_ITERATIONS 3, POS_PERCENT 0.8, SLOP 0.5px,
  with warm starting (accumulated normal and friction impulses cached per contact between
  substeps). The slop is load-bearing, not sloppiness: penetration is corrected to 0.5px and no
  further, because a contact driven to exactly zero penetration disappears from the manifold list
  and the body free-falls for a substep — a hard wall clamp was measured doing exactly that, with
  resting bodies reaching 14400 px/s. Warm starting is what lets a stack converge in a bounded
  iteration count; without it a seven-box stack still crept at 13 px/s after 16 iterations and
  never slept.
- **A17 — Dial's rotary face** (built 2026-08-19, user-directed). `<Dial mode="rotary">` renders a
  ten-digit rotary phone face on the same component; `mode="flywheel"` (default) is unchanged and
  is what PRD.md documents and the CLI installs — see PRD.md's dial entry for the explicit carve-out.
  Geometry: the finger stop is fixed on the bezel at 120° (4 o'clock, clockwise from 12); the ten
  holes sit 30° apart on the rotor, so pull distance runs from 60° (digit 1) to 330° (digit 0) —
  verified against the design table headlessly before any component code was written. Motion:
  dragging a hole clamps rotation to `[0, pullDistance(digit)]`, a hard wall both directions, matching
  a real dial's rigid mechanism; releasing past a 30° commit threshold starts a constant 300°/s
  governed return (not a decay — a literal fixed-speed crawl), and the last 15° hand off to the same
  1300/46 spring the flywheel's detents catch with. Interruptible both ways: grabbing mid-return
  re-identifies the nearest hole to the pointer and redirects to it, same as the flywheel's
  freewheel-to-catch interrupt. `onDetent` fires once, on seat, not on every partial pull. Reduced
  motion replaces the whole gesture with click-a-hole → instant home → immediate fire, per the site's
  stricter-than-`duration:0` rule. Numbers are printed on a static faceplate layer and revealed
  through an SVG mask cut into the rotor, so they hold still while the rotor turns — the detail most
  reproductions get wrong — and the mask id is generated per-instance via `useId()` so multiple dials
  on one page cannot collide. `dial`'s CANDIDATES-style promotion into the registry (mirroring heft's
  CSS-shipping unification) was deliberately left for a later, separately-decided pass — this build is
  site-scoped only, per the original design.
