# Spec: `heft`, contents with weight

**Status:** draft, awaiting approval
**Date:** 2026-08-14
**Touches:** `registry/components/heft/`, `registry/registry.json`, `registry/tsconfig.json`, `web/tsconfig.json`, `web/app/(site)/heft/`, `web/components/gallery/component-gallery.tsx`, `web/lib/registry.ts`, `docs/ROADMAP.md`

---

## Why this is next

The registry has four components and one spring. `disclosure` integrates
stiffness and damping; `hold-drain`, `late-critique` and `scramble-reveal` run
on durations. Every surface of this project — the README's first line, PRODUCT
principle 2, ADR 0001's entire justification for depending on `motion` — claims
interruptible physics, and three quarters of the registry does not need it.

That is not a documentation defect. It is what happens when nothing is chosen
*because* it requires velocity carry-over. A component that would work equally
well on a 300ms ease is a component whose motion is decoration, and four of them
in a row is a library arguing for a property none of its work depends on.

`heft` cannot be built without it. Contents that lag a moving container, arrive
after it, overshoot and settle are inertia — there is no duration that produces
them, because the input is the container's acceleration and the container's
acceleration is whatever the reader's hand just did.

Second reason, less structural and just as real: the landing page has no
flagship. Four demo panels were built and discarded on 2026-08-13 — a WebGL
coil, an abstract spring-versus-ease twin, a scroll-driven reel, a disclosure at
three sizes — and each failed for the same reason rather than four different
ones. The best specimen in the registry is a collapsible panel. A box whose
contents shift when you shake it is a thing people pick up.

## What it is

A container you drag. The things inside it have weight, arrive late, press
against the walls, and settle.

The pitch is one sentence and it is testable: **move the box, and what's inside
finds out a moment later.**

## The model

Work in container-local coordinates and the whole component is one equation.

The container follows the pointer **1:1** — no spring, no smoothing, no lag.
Direct manipulation has to be instant; a box that trails your hand feels broken
rather than heavy, and the weight is supposed to be *inside* it.

Each child integrates in the box's non-inertial reference frame:

```
x'' = (−k·x − c·x') / m  −  a_container
```

`x` is the child's offset from its home position, in container-local space.
The first term is an ordinary spring pulling it home. The second term is the
component:

> When a reference frame accelerates, everything in it feels a pseudo-force in
> the opposite direction, proportional to its own mass.

That is why a passenger is pushed back when a car pulls away, and it is why the
contents of a box slide when the box starts moving. It is not a metaphor for the
behaviour; it is the behaviour.

### Per-item mass

Each child carries its own `mass`. Identical masses produce contents that move
as one rigid block, which reads as a background image sliding — the thing this
component exists not to be. Different masses lag by different amounts and settle
at different times, and that difference is what makes the box read as holding
*several things* rather than one texture.

Default `mass = 1`. The showcase demo uses `1`, `1.6`, `0.7`.

### Walls

Contents are bounded to the container's inner box. Past the boundary they resist
rather than stop:

```
offset = sign(v) · (max + pow(|v| − max, 0.7))
```

A hard clamp reads as contents hitting a wall and dying. The exponent lets them
press into it and recover, which is what a whipped box looks like. The exponent
matches the rubber-band already used by the elastic-draggable prototype and by
`hold-drain`'s bounds, so the system has one resistance curve rather than three.

No collision between children. They may overlap. Broad-phase collision and
impulse resolution would need a fixed-timestep solver and would not fit in one
self-contained file — and it would convert a micro-interaction into a small
physics engine, which is the scope refusal in PRODUCT principle 5 arriving by a
side door.

## States

```
idle → dragging → settling → idle
```

| State | Means |
| --- | --- |
| `idle` | Nothing is moving. No rAF is scheduled. |
| `dragging` | A pointer is down and the container is tracking it. |
| `settling` | The pointer is released, or a keyboard nudge has fired, and contents are still catching up. |

One derived value, published on `data-state`, per [ADR 0007](../adr/0007-composite-state-machine.md).
The three-way invariant applies: the `STATES` tuple in source, `meta.states` in
the manifest, and the keys of the variants object must agree, and
`lint-registry` fails when they do not.

## API

Uncontrolled by default, per [ADR 0004](../adr/0004-uncontrolled-by-default.md).
Two named exports from one file; no shared `lib/` to install first.

```tsx
import { Heft, HeftItem } from '@/components/z-ui/heft'

<Heft>
  <HeftItem>◆</HeftItem>
  <HeftItem mass={1.6}>▲</HeftItem>
  <HeftItem mass={0.7}>●</HeftItem>
</Heft>
```

| Prop | On | Default | Means |
| --- | --- | --- | --- |
| `bounds` | `Heft` | `'parent'` | Where the container may travel. `'parent'` or `'none'`. |
| `onSettle` | `Heft` | — | Fires once, when the last child comes to rest. |
| `spring` | `Heft` | `{ stiffness: 220, damping: 18 }` | The contents' spring. Deliberately softer than `disclosure`'s 520/46: a stiff box has no visible lag, and the lag is the product. |
| `mass` | `HeftItem` | `1` | Relative weight. Higher lags further and settles later. |

`HeftItem` reads its physics from context rather than props threaded through
the tree. The context is defined and consumed inside the same file, so nothing
crosses a module boundary a consumer has to resolve.

## The rules it has to satisfy, and how

Recorded rather than assumed, because three of these have been broken before in
this repository.

**The overshoot bounds** — element under 48px, direct response to input,
interruptible mid-flight, tied to a state transition — hold without special
pleading. The container never overshoots; it tracks the pointer exactly. Only
the contents overshoot, and contents are small. All four conditions are met by
construction rather than by argument.

**No idle loop.** The rAF is scheduled only while `dragging` or `settling`, and
cancelled on settle. DESIGN.md's ban on animating what the user did not touch is
structural here: with no pointer down and everything at rest there is no loop to
run. This is the property the deleted hero canvases failed.

**Keyboard gets the physics.** Arrow keys nudge the container one step, and the
contents lag and settle from that nudge exactly as they do from a drag. The
operating model already caught this gap once — `like-button` drove its
`pressing` dimension from pointer events only, so *"a keyboard user receives
none of the tactile feedback that is the product thesis."* Not repeating it.
`Escape` and `Home` return the container to origin.

**Reduced motion is a real path, not a disabled animation.** The container still
drags: that is the reader's own hand, not an animation, and freezing it would
break direct manipulation rather than calm it. The contents stop lagging and
hold their home positions. `data-state` still transitions through `dragging`, so
the state change is communicated with no inertia at all.

**Accessibility.** The container is a `role="group"` with an accessible name and
`tabindex={0}`; a visible `focus-visible` ring that is never removed and clears
AA against both surfaces; a minimum 44×44 box, which a container exceeds
trivially. Contents are transformed, never reordered, so reading order and the
accessibility tree are untouched by any amount of shaking. The border must
survive `forced-colors: active`.

**Colour.** Mint marks what moves, so the contents may carry it and the
container may not. Contents are a small fraction of the container's area, which
keeps the 10%-of-surface ceiling comfortably. State is never hue alone: the
container's border lifts a tonal step on `dragging`, and the contents visibly
displace, which is the second channel.

## The scope question

A container that accepts children edges toward the layout primitives PRODUCT
principle 5 refuses, and the refusal is the product rather than a limitation to
grow out of. So this is argued, not waved through.

`heft` decides no layout. It sets no size, no spacing, no direction, no
alignment; children keep whatever layout the consumer gave them and are
displaced by a transform. What it provides is a behaviour applied to arbitrary
content — the same shape as a draggable, which nobody would call a layout
primitive.

The test that keeps this honest: if a future prop starts describing where
children *go* rather than how they *move*, the refusal has been breached and the
prop does not land.

## Weight

Target under 3kb installed. `motion` is already a peer for anyone who took
`disclosure` or `hold-drain`, so the marginal cost to those projects is the file
alone.

## Verification

Beyond the 94 registry checks and the contrast gate, which apply to everything:

| Test | Asserts |
| --- | --- |
| **Interrupt** | Reverse the drag direction mid-flight; assert no child returns to its home position between reversals, and that child velocity never discontinuously zeroes. This is the acceptance test for the whole component. |
| **Mass differentiation** | Two children with masses 1 and 1.6, driven by one drag, are never at the same offset while `settling`. Guards against the rigid-block failure. |
| **Wall resistance** | Drive the container hard enough to push a child past its bound; assert the child exceeds the bound but by a compressed amount, and returns. A hard clamp fails this. |
| **Reduced motion** | Under `prefers-reduced-motion: reduce`, assert `data-state` transitions to `dragging` *and* every child's transform stays at its home value throughout. |
| **Keyboard parity** | An arrow-key nudge produces a non-zero child offset. Fails if physics is pointer-only. |
| **No idle loop** | After settle, assert no animation frame is requested for 500ms. |
| **Lint mutation** | Swapping the spring for a duration tween trips the springless-motion rule added on 2026-08-14. |

Browser evidence, per the operating model's `in review` exit criteria: a
recording driven through every `meta.states` value at 4× slow motion, in both
themes, plus one pass under `prefers-reduced-motion: reduce`.

## What this spec does not decide

- **The name.** `heft` is the working title; `loose-cargo` is the alternative.
  Both describe the claim rather than the mechanism, which is the registry's
  naming habit.
- **Whether the container returns to origin on release.** It stays where it is
  in this design. A spring-home variant is a prop, not a redesign, and it is not
  needed to prove the thesis.
- **Whether it takes the landing page's flagship slot.** That slot is currently
  empty and reserved. It gets filled when something earns it, judged in a
  browser, not scheduled here.

## Owed before this lands

`docs/ROADMAP.md` was last updated 2026-08-04 and authorises none of this — it
still lists nine components, of which zero shipped, and describes a registry
that was cleared on 2026-08-09. The operating model requires that work start
from a roadmap row, so a row is owed. Adding one line to a file that is stale in
every other line is bookkeeping rather than authorisation, so the roadmap is
rewritten against reality in the same pull request, which the operating model
already scheduled in §8 and which never happened.
