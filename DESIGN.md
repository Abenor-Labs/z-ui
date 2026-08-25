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
- The landing IS the demo grid: eleven uniform cards (seven gesture-driven registry components +
  four candidates), each `stage / trigger / title / one-line mechanism / copy-install`. The old
  left-aligned hero with the dial beside the headline is gone; the dial is now the first card in
  the grid. See A20: thinking-orb, the eighth registry component, has no driving gesture and
  sits out of this action-per-card grid on purpose.
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

**The scope line — nothing above touches a component that owns physics.** Seven of the eight
registry components and the four candidates keep their springs, their friction integrators and
their velocity carry-over (thinking-orb is the one exception — parametric canvas animation, no
spring, no interrupt to carry velocity through; see A20). A duration cannot carry velocity
through an interrupt, and that is the product's whole claim: /architecture argues CSS keyframes
cannot reverse mid-flight, so the
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
  in the registry: reel, origin, grip, intent. PRODUCT FACTS still says eight components, and the
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
  springs scale as k·s², c·s), which is an eight-component change and was deferred by decision.
- **A16 — Heft solver constants.** VEL_ITERATIONS 8, POS_ITERATIONS 3, POS_PERCENT 0.8, SLOP 0.5px,
  with warm starting (accumulated normal and friction impulses cached per contact between
  substeps). The slop is load-bearing, not sloppiness: penetration is corrected to 0.5px and no
  further, because a contact driven to exactly zero penetration disappears from the manifold list
  and the body free-falls for a substep — a hard wall clamp was measured doing exactly that, with
  resting bodies reaching 14400 px/s. Warm starting is what lets a stack converge in a bounded
  iteration count; without it a seven-box stack still crept at 13 px/s after 16 iterations and
  never slept.
- **A17 — Dial's rotary face** (built 2026-08-19, revised same day, user-directed). `<Dial
  mode="rotary">` renders a ten-digit pulse-dial telephone face on the same component;
  `mode="flywheel"` (default) is unchanged and is what PRD.md documents and the CLI installs — see
  PRD.md's dial entry for the explicit carve-out.

  **Geometry, pulse-derived.** The finger stop is fixed on the bezel at 120° (4 o'clock, clockwise
  from 12). A real pulse dial encodes a digit as that many pulses of the return cam — one trip per
  30° of travel — so a digit's pull is exactly `pulses × 30°`, no slack: 30° for digit 1, up to 300°
  for digit 0 (ten pulses, since a zero-pulse train is indistinguishable from nothing). This
  superseded a first pass whose hole-rest formula had an unexplained extra 30° of travel per digit
  that didn't correspond to any counted pulse — caught when an independently-written reference
  implementation, handed to the project mid-build, converged on the exact `pulses × 30°` relationship
  from a different derivation. Two implementations reaching the same numbers from different starting
  points was the check that the corrected formula, not the original, is the one a real dial actually
  uses. Re-verified headlessly against the corrected table before any component code changed:
  pull distance still lands exactly on `pulses × 30` for all ten digits, holes still self-identify at
  their own rest angle, pull-distance and nearest-hole math still agree at the stop, and a simulated
  1°-step return produces a monotonic pulse count landing exactly on the digit's pulse count for all
  ten digits.

  **Motion.** Dragging a hole clamps rotation to `[0, pullDistance(digit)]`, a hard wall both
  directions, matching a real dial's rigid mechanism. Releasing engages only past `ENGAGE_FRACTION`
  (0.85) of *that digit's own* travel — proportional, not the flat absolute-degree threshold the
  first pass used, because a flat threshold demanded wildly different commitment for a short digit
  (1, 30° total) versus a long one (0, 300° total). Engaging starts a constant 300°/s governed return
  — a literal fixed-speed crawl, not a decay curve — and the last 15° hand off to the same 1300/46
  spring the flywheel's detents catch with. Interruptible both ways: grabbing mid-return
  re-identifies the nearest hole to the pointer and redirects to it, same as the flywheel's
  freewheel-to-catch interrupt — kept deliberately even though the reference implementation that
  prompted this revision does not allow it (its `onPointerDown` refuses to grab while returning);
  every other component on this site reverses mid-flight and this one does not get an exception.
  `onDetent` fires once, on seat. A new `onPulse(count, total)` fires on every pulse actually tripped
  during the return — computed from `pulsesTripped()`, not merely counted from a timer — and the
  currently-active hole's Signal ring thickens briefly on each trip, the visual read of the cam's
  click. Reduced motion replaces the whole gesture with click-a-hole → instant home → immediate fire,
  per the site's stricter-than-`duration:0` rule.

  **Rendering.** Numbers, and letters where the historical pattern has them (2 ABC through 9 WXY, no
  letters on 1 or 0, matching the Bell System layout), are printed on a static faceplate layer and
  revealed through the rotor. The rotor's ten holes are cut with a single SVG path under
  `fill-rule="evenodd"` — one outer circle plus ten hole subpaths — rather than the first pass's
  separate `<mask>` element; simpler, and removes the id-collision class of bug entirely rather than
  merely guarding against it with `useId()`.

  `dial`'s CANDIDATES-style promotion into the registry (mirroring heft's CSS-shipping unification)
  was deliberately left for a later, separately-decided pass — this build is site-scoped only, per
  the original design. Not adopted from the reference implementation: gradients, a soft drop-shadow
  filter, a serif font, and roughly a dozen hardcoded hex colors, all of which conflict with this
  file's committed palette (tokens.css custom properties only, no new colors, no gradients except the
  one named exception, no box-shadow except the single hard 1px contact shadow). Also not adopted:
  synthesized Web Audio clicks — no other component on the site has sound, and adding it to exactly
  one would be a real inconsistency rather than a small addition, so it stayed out pending an explicit
  decision to add sound as a site-wide thing.

- **A18 — the reference component itself replaces A17 on Home and `/components/dial`** (2026-08-19,
  same day, user-directed, reversing part of A17). The user's instruction was "use this component,"
  meaning the literal reference file, not a synthesis of ideas from it. A17 had instead merged the
  reference's pulse-counting and letters into the project's own `Dial.tsx` while keeping this site's
  usual rules — token colors, no gradients, interruptible mid-flight. That merge was the wrong call:
  told to place specific code on specific pages, adapting it into different code that merely shares
  some behavior is not the same request answered, even if the adaptation is defensible on its own
  terms.

  `site/src/zui/RotaryDial.tsx` is that reference file, ported with the minimum change that makes it
  compile: TypeScript types added throughout (it arrived as plain JS with no annotations), the unused
  `React` namespace import dropped (this project's JSX transform is automatic), and one integration
  seam — a `dialDigit` imperative handle via `useImperativeHandle`, so the homepage's existing
  demo-trigger button pattern keeps working — added because every other card on the landing page has
  one and removing it from just this card would be its own inconsistency. No other line of its
  mechanism, styling, or interaction logic was changed.

  This means, as given and not smoothed over:
  - It renders with three `radialGradient`s, a `feDropShadow` filter, a Georgia/Times serif face, and
    roughly a dozen literal hex colors — none of it drawn from `tokens.css`, all of it in direct
    conflict with this file's "colors only via custom properties, no new colors, no gradients except
    the one named exception" rule stated above. Recorded as an explicit, acknowledged exception on
    these two pages, not a silent violation.
  - Its return is **not interruptible**. `onPointerDown` refuses to grab the wheel while
    `returning` is true. This is the one rule repeated hardest across this entire project — "if it
    can't reverse mid-flight, it doesn't ship" — and this component breaks it, deliberately, on the
    user's explicit and twice-repeated instruction. It is the only component on the site that does.
  - It has no connection to the shared 1300/46 spring; its return is pure constant-speed rAF motion
    to zero, no spring settle phase at all.
  - It synthesizes mechanical click sounds via the Web Audio API, `sound=true` by default — the only
    audio anywhere on the site.
  - It is not in the registry and is not what `z-ui add dial` installs. `/components/dial`'s code
    block and caption say this plainly rather than let a visitor assume it.

  A17's merged version — token-compliant, interruptible, spring-catch on seat, no audio — was not
  deleted. It remains `Dial.tsx`'s `mode="rotary"`, and is still what the library grid preview at
  96px renders (`ComponentPreviews.tsx` was not touched by this revision; the instruction named the
  homepage and the component page specifically). So the site now shows two different rotary-dial
  implementations depending on where you look, for a recorded reason rather than an accidental one:
  the reference is the destination and the flagship; the merged version is what a component that
  actually followed this project's own rules would look like, kept because deleting verified,
  working, rule-honoring code to make room for code that knowingly breaks those rules was never asked
  for.
- **A19 — `/lab/navigation`** (built 2026-08-21, user-directed): eight navigation interactions
  (magnetic links, cursor-follow underline, active pill, morphing nav, dock, expanding menu,
  circular menu, radial nav), reached from the top nav's `lab` link. This is a new, explicitly
  separate track from the registry — same status as `/candidates`, not a promotion path for it.
  Nothing here has a CLI command, an install target, or a `registry/components/` file, and PRD.md's
  eight is unchanged by this page. The brief that prompted it asked for an "acid/lime" accent; that
  color does not exist in `tokens.css` and was not added — `--signal` (orange) is used throughout,
  per the no-new-colors rule and because the page is meant to read as this site, not a separate
  product skin. Underline and pill indicators reuse the two-edge stiff/trailing-soft chase mechanic
  (`lab/navigation/useChaseTrack.ts`) rather than re-deriving it, mirroring `zui/Chase.tsx`'s L/R
  motion-value technique. Code tabs were requested; existing `Playground`/`CodeBlock` infrastructure
  was reused instead of building a new tab UI, so each demo shows one illustrative usage snippet, not
  live-generated code reflecting interaction state (the eight components are gesture-driven, not
  prop-driven, so there is no selection state to generate code from the way the detail-page
  playgrounds do). Only the Navigation category from the source brief (buttons, text, cards,
  toggles, loaders, cursors, scroll, inputs, navigation) was built; the rest is unbuilt scope, not a
  rejected one.
- **A20 — `thinking-orb`, the eighth registry component** (added 2026-08-22, user-directed).
  Vendored from `thinking-orbs` (MIT, Jakub Antalik, github.com/Jakubantalik/thinking-orbs): nine
  hand-tuned canvas animations for nine agent states (working, searching, solving, listening,
  connecting, weaving, composing, breathing, shaping), z-sorted and depth-shaded on a plain 2D
  canvas, no WebGL. The upstream package spans sixteen modules across component/presets/theme/a
  nine-file draw engine; ported into one self-contained `.tsx` with zero runtime imports beyond
  `react`, because that is the registry's contract — geometry and tuning unchanged, only the module
  boundaries collapsed. PRD.md PRODUCT FACTS moved from seven components to eight; every "seven"
  reference describing component count across `.claude/CLAUDE.md`, PRD.md, README.md, this file,
  and the site's own copy was audited and updated to eight in the same pass — "seven commands"
  (the CLI surface) is a separate fact and stayed seven, unaffected.
  Two things make this component structurally unlike the other seven. First, it declares no
  Motion spring, no friction integrator, no interrupt/velocity-carry-over — the "scope line" above
  no longer holds for all eight registry components without this carve-out (see the paragraph
  above A13). Second, and the reason it needed a schema change rather than just a manifest entry:
  `registry-item.schema.json`'s `meta.gesture` enum was `press | drag | hold | hover | type`, and
  none of those five is honest here — nothing on the orb waits for a press, a hold, a drag, a
  hover, or a keystroke. Its `state` prop is set by whatever it stands in for (an agent, a job, a
  socket), not by anything the reader does to the component. `none` was added to the enum
  (`registry-item.schema.json` and the generator's hand-authored `ZGesture` type in
  `web/scripts/build-registry.mjs`, which is not derived from the schema and needed its own edit)
  rather than picking the least-wrong of the five existing values. Nothing on the CLI side
  (`packages/cli`) types `gesture` as an enum, so no CLI change was needed.
  On the site: `/components` shows it as the eighth live card, same grid, same rules; its detail
  page (`/components/thinking-orb`) uses the standard `Playground` state-select pattern (Chase
  chips choose the state, the code block reflects the selection exactly, same as every prop-driven
  detail page) plus an "ALL NINE" section showing every state at once. It does NOT appear in the
  Home landing `demo-grid` (see A12/A13 above it): that grid's whole premise is one card per
  gesture-driven component, `action` button wired to the component's own input path, and
  thinking-orb has no such input to wire — forcing a fabricated trigger onto it would misrepresent
  the one property that makes it different. The eleven-card landing count is therefore unchanged;
  the eighth registry component is real but sits outside that specific grid on purpose.

- **A21 — `site-orbs` rebuilt on a light "paper" palette, outside this document's committed
  direction** (2026-08-24, user-directed, from a supplied HTML design). The one-page showcase now
  reads its own `--ob-*` properties: paper `#E7E5DF`, slab `#14161A`, volt `#C8FF4D`, Bricolage
  Grotesque for display and Instrument Sans for UI. That departs from four decisions recorded
  above — the site is dark, Archivo/JetBrains Mono are the two faces, `--signal` orange is the only
  accent, and there are no box-shadows beyond the single 1px hard shadow. The page uses soft
  elevation shadows and a hover lift, both of which the rest of the product does not.

  The departure is scoped and does not leak: `site/` is untouched, and the components themselves
  are not restyled — they are asked for a different token state, not overridden. The cards are warm
  paper (`#F2F0EB`) and re-declare the light half of tokens.css on `.ob-cell`, using the values this
  document already records above as the superseded light direction: Paper `#F4F1EA`, Ink `#1A1815`,
  Rule `#D8D2C4`, Recess `#EAE6DB`. That palette was never wrong, only set aside, and the six site
  components still render correctly under it — verified, every text pair at or above 4.5:1.

  An earlier revision of this entry made every card dark instead. That was a workaround for the
  components reading a dark tokens.css, not a decision, and it cost two things: the page's warm
  paper (`#E7E5DF`, R>G>B) fought the cool slate cards (`#1E2126`, B>G>R) on opposite colour
  temperatures, and flattening all eight cards to one surface threw away the light-grid /
  dark-accent rhythm the supplied design was built on.

  `--signal` is per-surface rather than global, because one accent cannot serve both: volt
  `#C8FF4D` on the dark terminal and dark cells, olive `#4C7A0B` on light cards. Both values come
  from the supplied design, which used exactly that pair for the same reason.

  Two cells stay dark deliberately — `heft` reads its own `--z-*` namespace with dark fallbacks and
  `thinking-orb` is a canvas driven by a `theme` prop, so neither follows a CSS token swap. Keeping
  them dark makes that a rhythm rather than an exception.

  Two conventions carried over from the previous build because they are load-bearing, not stylistic:
  every chrome class is prefixed `ob-` (site.css is loaded for the component classes and already
  defines `.hero`, `.wordmark` and `.footer` — the first build of this page lost its hero layout to
  exactly that collision), and the card is a `<div>` rather than a `<button>`, since Chase,
  HoldDrain and Disclosure each contain a real `<button>` and nesting them is invalid HTML that
  React refuses to hydrate.

  The eight names, the version string, and the install command are read from PRODUCT FACTS, not
  from the supplied design, which had listed seven components that do not exist (`button`, `toggle`,
  `badge`, `input`, `card`, `progress`, `tooltip`) and a version of `v1.4.0`.

- **A22 — the registry promotion, and `dial` settles as the knob** (2026-08-24). Five of the six
  diverging components were promoted heft-style: chase, scramble-reveal, late-critique, disclosure,
  and hold-drain now ship their own stylesheet beside the component (Tailwind utility classes were
  themselves a de-share failure — this site does not run Tailwind, and the files' own headers
  promised "react, motion. Nothing else"), and the site renders the registry files through
  `@z-ui/registry` with the demo chrome — decision logs, readouts, annotations, telemetry — living
  in pages and thin wrappers that are visibly not the product. `site-orbs` reads the same five
  files. What you see is what npx downloads is now true for seven of eight.

  The sixth exposed a product question rather than a mechanical one. The registry's `dial` — the
  file npx ships — is a 270° hi-fi knob with value semantics. The site was demoing a 360° flywheel
  and a rotary phone face, neither of which any visitor could install; A17/A18 had deferred exactly
  this unification. Decided 2026-08-24: **the knob stays `dial`.** The flywheel and the rotary face
  move to the candidates track (`/candidates`, `data/candidates.ts`), clearly labeled
  non-installable — the same honesty rule `/components/dial` already applied to RotaryDial in A18.
  Home's dial card and the library grid preview render the shipped knob; `/components/dial` offers
  all three faces with the knob first and the other two captioned as candidates. The mechanics are
  recorded, not deleted: the flywheel's entry lives on the bench like reel's, and the merged-mode
  implementation survives at `site/src/zui/Dial.tsx`.

- **A22 — `dial` is the rotary face, and it is the one component that is not interruptible**
  (2026-08-24, user-directed). The flywheel knob that shipped under this name is now a candidate;
  `npx @abenor/z-ui add dial` installs the pulse-dial telephone face. The knob and the flywheel were
  both removed from `/components/dial`, which had been showing three "modes" behind a toggle while
  printing one install command — a visitor could select `flywheel`, read a registry badge, copy a
  `<Flywheel />` snippet, and install something else entirely.

  **The exception, stated plainly.** CLAUDE.md says every transition must be interruptible or it does
  not ship. This one is not: from release until the wheel seats, the governor owns it, and
  `onPointerDown` is ignored. That is the mechanism rather than a shortcut — a real dial cannot be
  caught on its way back, and the digit is a *count of pulses tripped during the return*, so a return
  that can be interrupted reports a number that was never dialled. Every other component in the
  registry still honours the rule; this is the only carve-out, and it is carved out for the one
  reason that survives scrutiny — interrupting it would make the component lie about its output.

  Three things changed on the way in, none of them cosmetic:

  - **Sound is off by default.** The dial synthesises its own mechanical click with no assets, but a
    component that starts making noise the moment it is installed is one nobody asked to be loud.
    `sound` opts in; with it off, `AudioContext` is never constructed.
  - **SVG ids are per-instance.** `rd-plate` / `rd-wheel` / `rd-hub` were module-level constants, so
    a second dial on the same page reused the first one's gradients and painted wrong. They are
    derived from `useId()` now. This was a real bug, found on promotion, not a style preference.
  - **Paint moved out of the file and into `dial.css`,** which ships beside it. Twelve hardcoded
    hexes became `--z-dial-*` custom properties carrying those hexes as fallbacks, so the default
    look is byte-identical and a consumer can retheme without forking. The fallbacks are literal
    colours rather than `--z-paper` / `--z-ink` on purpose: the plate is a light object and the wheel
    a dark one, and mapping them to page tokens would turn the number plate black on a dark site and
    make the digits unreadable. The radial gradients and the serif numerals stay — they are what the
    object looks like, and DESIGN.md's no-gradient rule is about page chrome, not about a rendering
    of a physical dial.

  The component gained a `data-state` of `idle | dialing | returning` and a `STATES` declaration to
  satisfy the registry lint, and lost its `motion` dependency entirely — it is react-only now.

---

## Revision 2026-08-24 (user-directed) — the site collapses to four routes

The site had eight top-level routes. It has four: `/`, `/components`, `/lab`, `/docs`.

**What went, and why.**

- **`/candidates` deleted.** The bench was a public page for components that have no install
  command and may never get one. Every visitor it reached was a visitor shown something they
  cannot have. `ComponentNav`'s "bench" group went with it, so nothing in the component index
  links to an uninstallable name any more. `/components` still says the bench exists, in one
  sentence, without linking anywhere.
- **`/architecture` deleted, content preserved.** Its four decisions are real PRODUCT FACTS
  content, not page-specific writing, so they moved into `/docs` as section 04 rather than being
  lost. A whole route for four paragraphs was the wrong container, not the wrong content.
- **`/cli` deleted.** This is the one that mattered. That page was a reference file ported
  verbatim on instruction (A18-style standing), and it documented `init add list view` against
  components named `rotary-dial`, `gooey-fab`, `gooey-tabs` — a fictional surface, which was
  tolerable only while the page was clearly an artifact sitting at its own route. Renaming it to
  "docs" would have promoted fiction to documentation, and PRD.md's seven commands and eight
  components are the only CLI surface the site is allowed to claim. So the route did not get
  renamed; it got replaced.
- **`/docs` is now the whole reference.** Getting-started (which was already real), the CLI
  surface, the architecture decisions, requirements, troubleshooting, contributing. Its terminal
  frames are `CliCast` and `Console` — both already in the tree, both unused until now, and both
  replaying output captured from the published CLI (`src/data/cliRecordings.ts`) rather than
  mocking a session up. That is why they were reached for instead of porting the deleted page's
  `.term` styling: the honest terminal already existed.

**The landing page is a header and one hero.** The demo grid, the REFUSALS list and the OWNERSHIP
list all moved off it — not rewritten, removed. Each of those things has a page that owns it, and
a landing page that repeats them is a second, worse copy of each. What a first-time visitor is
owed is what this is and how to get it, so the hero carries exactly two controls: **Browse** into
`/components`, and the install command as a copy button (`pnpm dlx @abenor/z-ui@latest add dial`).
GitHub moved out of the hero and into the topbar as a **★ star** link, where a repo link belongs.

The install button briefly printed the pnpm form (`pnpm dlx`), recorded here as an assumption
because PRD.md's canonical line is the `npx` one. That is settled rather than assumed now: the
button prints `npx @abenor/z-ui@latest add dial`, the same string PRD.md and `/docs` both use, and
the site no longer states an install path from two directions.

**Left in the tree deliberately, not deleted:** `src/zui/*` and `src/data/candidates.ts` are now
unreferenced. CLAUDE.md's rule is that these are site reimplementations kept until a specific one
earns promotion on evidence, and the repo archives rather than deletes. They still typecheck and
Vite drops them from the bundle, so the cost is zero and the record survives.

**Incidental win:** deleting `/cli` removed the last third-party font request. The IBM Plex
`<link>` tags in `index.html` existed only for that page; every route now self-hosts via
`@fontsource`, as originally intended.

---

## Revision 2026-08-25 (user-directed) — the bench comes back, as a section not a route

Deleting `/candidates` orphaned five finished components. `reel`, `origin`, `grip`, `intent` and
the flywheel `Dial` were built, verified in-browser, and then unreachable — the site was showing
eight and hiding five. That is a worse outcome than the page we removed.

They return as a **bench section on `/components`**, not as a restored route. The route is still
the wrong container (one page for five cards, plus a nav item advertising things nobody can
install). The section already existed at index 03; it just said the five were "not shown here",
which was an apology standing in for the work.

**A bench card is a sibling of a registry card, not a twin.** Same grid, so the five read as the
same *kind* of object as the eight. Dashed border, transparent ground, name not a link, and
"no install command" where the registry card puts its dependency line — so the difference survives
a glance rather than needing a careful read. Nobody should be able to copy a name out of the bench
and expect `add` to know it.

**They are interactive, not auto-driven** — the opposite call from the nav hover preview, for the
opposite reason. That panel is `pointer-events: none`, so its contents have to demonstrate
themselves. This sits inline on a page where putting your hands on the thing is the entire
argument, and a component that has not earned an install command has only that one case to make.

**On "why only eight" (recorded, because it keeps coming up).** Eight is a headcount, not a cap.
PRD.md:9 is a status line — a true count at a point in time. PRD.md:94's "No invented surface
area" is an anti-drift guardrail aimed at documentation: do not write about a ninth that does not
exist. The actual product constraint is about *kind*, not *count* — "anything that isn't a
micro-animation". A ninth is therefore allowed; what it costs is atomicity. `Eight` is asserted in
about twelve places (PRD.md ×3, .claude/CLAUDE.md ×2, Docs.tsx ×4, Home.tsx, Library.tsx,
DetailLayout.tsx, data/registry.ts) and the generated `web/public/r/` must be rebuilt from
`registry/`, all in one commit, or the site starts contradicting itself and CI fails the
generated-registry check. A chore, not a barrier.

The destination question from CANDIDATES.md ("expand the registry / keep eight and ship site-only /
build in the registry repo") is still **open**. This change does not settle it and deliberately
does not touch PRD.md: a site bench claims nothing about the registry, which is exactly why it
could ship while the decision waits.
