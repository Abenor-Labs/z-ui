# ARCHITECTURE — Z-UI website

## Framework: React + Vite + react-router (client-rendered SPA)

Chosen over Next.js because:

- The site is a fixed set of 12 routes with no server data, no auth, no ISR — SSR buys nothing
  the site needs and complicates the one thing the site is about: continuously-running,
  pointer-driven physics that must be interactive within 1 second. A Vite SPA ships one small
  bundle, hydrates nothing, and the dial is live as soon as React mounts.
- Route transitions are a specified part of the experience ("instrument powering on"). With
  react-router + Motion's `AnimatePresence` keyed on location, enter/exit choreography is direct
  and fully interruptible. Next's app-router transitions fight this.
- No server runtime keeps deploys trivial (static hosting anywhere), matching the product's own
  "no hosting to stand up on day one" temperament.

Trade-off accepted: no per-route SSR for SEO. Mitigated with real `<title>`/meta per route and a
crawlable, fully static HTML shell. Acceptable for a v0.1 product site.

## Folder structure

```
src/
  main.tsx              entry; fonts, styles, router mount
  App.tsx               routes + AnimatePresence route transitions
  styles/
    tokens.css          palette, type, grid — the only place colors exist
    base.css            reset, selection, focus-visible, rules/hairlines, utilities
  lib/
    springs.ts          STIFF (1300/46), SOFT (300/30), reduced-motion collapse — shared, never inlined
    useReducedMotion.ts single media-query hook
    usePointerAngle.ts  pointer→angle math for the dial
    useInView.ts        one-shot IntersectionObserver (scramble labels)
    format.ts           mono readout formatting (fixed-width numbers)
  zui/                  faithful reimplementations of the seven registry components
    Dial.tsx            flywheel: friction integrator + Motion spring detent catch
    Chase.tsx           two independent springs per edge (stiff leads, soft trails)
    Heft.tsx            axis-aligned rigid bodies: gravity, impulse contacts, friction
    Disclosure.tsx      height as an interruptible Motion spring w/ velocity carry-over
    HoldDrain.tsx       symmetric climb/drain integrator
    LateCritique.tsx    late-verdict validation + same-frame forgiveness + decision log
    ScrambleReveal.tsx  glyph decode on hover / mount / first in-view
  components/           site chrome
    Shell.tsx           ruled-grid page frame, nav, footer
    Section.tsx         hairline divider + "01 / REGISTRY" mono label (scrambles into view)
    PageTransition.tsx  per-section settle w/ 30ms stagger on the stiff spring
    CodeBlock.tsx       Recess block, mono, spring-animated copy affordance
    Readout.tsx         live mono value in Signal orange
    SpringGraph.tsx     SVG polyline plotter (velocity/height over time)
    Terminal.tsx        illustrative CLI output rendering (marked as illustrative)
  data/
    registry.ts         the 7 components: name, category, needs, blurb, install cmd — mirrors PRD facts
  pages/
    Home.tsx  Library.tsx  Cli.tsx  Architecture.tsx  Docs.tsx  NotFound.tsx
    detail/   one page per component (Dial…ScrambleReveal), each with its playground + extras
```

## Motion

**Motion (`motion/react`) drives every showcase interaction that needs it** — confirmed. It is
the only animation dependency, mirroring the product's own engine choice for the product's own
reason: interruptible springs with velocity carry-over. Where a component's honest physics is not
a spring (the dial's freewheel friction, heft's gravity/contacts), a rAF integrator does the
integration and **hands off to a Motion spring for every catch/settle** (`animate(mv, target,
{ type: 'spring', stiffness, damping, velocity })`), so interruption and carry-over stay real
end to end.

## Reimplementation plan — the seven interactions

1. **Dial.** `MotionValue<number>` for rotation. Drag: pointer capture, angle from
   `usePointerAngle`, per-frame velocity estimate (EMA over last moves). Release: rAF freewheel —
   `v *= exp(-friction·dt)`, `θ += v·dt`, detent tick events on every 30° crossing; when |v| drops
   under the catch threshold, `animate()` to nearest detent at stiffness 1300 damping 46 with the
   live velocity passed in. Pointer down at ANY time stops freewheel/spring and hands the value
   back to the finger — interrupt + velocity carry-over both directions. Reduced motion:
   click-to-step. Detail page: ring buffer of (t, ω) → `SpringGraph` polyline, last 3s.
2. **Chase.** Two `MotionValue`s: indicator left edge, right edge, animated separately. On target
   change, compute direction; the edge facing the target gets the stiff spring, the trailing edge
   the soft one. Width = R − L via `useTransform` — the stretch is emergent, never keyframed.
   First-interaction annotation: hairline + mono label on the stretched indicator.
3. **Heft.** Fixed-timestep (≤8ms substeps) axis-aligned rigid-body loop in one component:
   gravity, AABB overlap tests, impulse resolution with positional correction, Coulomb-ish
   friction on contacts, rest sleeping. Dragged body is kinematic (infinite mass, velocity from
   pointer history) and shoves the rest through the same contact solver; remove a support and the
   stack above loses its floor. Render = `transform: translate3d` only. Contact-pair count
   exposed per frame for the mono readout.
4. **Disclosure.** Height `MotionValue`; toggle animates to measured content height or 0 on the
   stiff spring. Because the same MotionValue re-targets mid-flight, velocity carries over on
   interrupt for free — that IS the demo. Detail page records (t, h) into `SpringGraph`.
   Docs page accordions are these instances.
5. **HoldDrain.** One rAF integrator: held → fill += rate·dt; released → fill −= rate·dt (same
   constant, sign flipped). Confirm at 100%. Readouts: fill %, signed rate. Pointer + keyboard
   (Space/Enter hold) both drive it.
6. **LateCritique.** Keystroke handler: while typing a first attempt, verdicts are withheld;
   an idle timer (or blur) is the earliest a verdict may land. Once an error is visible, every
   keystroke re-validates synchronously in the same event — a fixing keystroke clears the error
   in that render (same frame). Every decision appends a timestamped line to the mono log.
7. **ScrambleReveal.** rAF glyph cycler; chars lock in left-to-right with jitter until the real
   string stands. Trigger prop: hover | mount | in-view (one-shot via `useInView`). Site-wide:
   `Section` labels use in-view mode, once per label.

## Routing & transitions

`BrowserRouter` → `Routes` keyed by `location.pathname` inside `AnimatePresence`. Pages are
composed of `Section`s; `PageTransition` gives each section `initial {y: 14, opacity: 0} →
animate {y: 0, opacity: 1}` on the STIFF spring with `delay: index × 0.03` (30ms, inside the
specified 20–40ms band) — transform + opacity, never opacity alone. Exit is the same motion
reversed, faster. AnimatePresence keeps mid-navigation interrupts live. Reduced motion: no
transition, content renders in place. 404 is a catch-all route.

## Shared animation primitives (no per-page copy-paste)

- `lib/springs.ts` exports `STIFF` (1300/46) and `SOFT` (300/30) transition objects plus
  `useSiteSpring()` which collapses both to `{ duration: 0 }` under reduced motion. Every
  Motion call site imports from here.
- `SpringGraph` is the single SVG plotter used by dial (velocity) and disclosure (height).
- `Readout` is the single live-mono-value renderer (Signal orange, fixed-width).
- Pointer-velocity estimation lives once in `lib` and is shared by dial and heft.

## Tooling

TypeScript strict · ESLint (typescript-eslint + react-hooks) · Prettier · scripts:
`dev` / `build` (tsc -b && vite build) / `preview` / `typecheck` / `lint` / `format`.
