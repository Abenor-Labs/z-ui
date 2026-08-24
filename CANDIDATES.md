# CANDIDATES — component ideas under evaluation

**Status: PROPOSAL. Not product facts.** PRD.md PRODUCT FACTS still says eight components.
Nothing here is real until it ships in the registry AND PRODUCT FACTS is updated to match.
Nothing here is copied from another library — each entry names the mechanic it learned from
and what it refuses to inherit.

## Source study (2026-08-18)

| Source | What it is | What is worth taking |
| --- | --- | --- |
| originkit.dev | 179 free React/Framer components, copy-paste, live prop panels | Isolated mechanics under heavy decoration: drag-velocity tilt, chain coupling with falloff, smoothstep proximity fields, pointer-entry-anchored clip reveals, enter-edge detection, energy-based sim sleep, hover-leave hysteresis, measured text width to kill scramble jitter |
| transitions.dev | 27 CSS transitions plus a five-dimension motion token scale (duration, distance, scale, blur, easing) | Its taxonomy of interaction moments, and its doctrine as a foil: every transition there is a timeline, and a timeline cannot reverse mid-flight |
| orbs.jakubantalik.com | One component (`ThinkingOrb`), nine states, npm `thinking-orbs` | State-machine-as-single-visual; a state selects a parameter set rather than a separate animation |
| agentation.com | Annotation overlay that exports DOM context to coding agents | Nothing — not a component library. Possible build-time tool for this repo, unrelated to the registry |

## The filter every candidate passed

1. It is a micro-animation. If it is layout, chrome, or ornament it does not belong here.
2. The behavior emerges from a rule — physics, thresholds, measured input — never from a scripted
   timeline. If it can be written as `@keyframes`, it is not a Z-UI component.
3. It is interruptible, and an interrupt carries the state it already had.
4. It states one principle in one sentence.
5. It is a single self-contained `.tsx`. Any primitive it needs ships inside it.
6. No WebGL, no shaders, no particles as ornament, no gradients, no glow, no autoplay.

## Build status

Wave 1 is built and running on `/candidates` (site-only, not registry): **reel**, **origin**,
**grip**, **intent**. Verified in-browser 2026-08-18 — reel carries velocity through a mid-spin
retarget, grip holds under 22px of pull and lurches past it, origin's anchor slides to the press
that dismissed it while the radius collapses, intent opens on heading alone with no timer running.
The remaining ten below are unbuilt.

## Candidates

### tactile-feedback

**1. `slack` — a row that inherits the drag late**
Principle: *The neighbors do not copy the drag. They inherit it, late, and less.*
Mechanic: items are coupled by a spring chain with an explicit coupling constant. Drag one and the
displacement propagates outward at finite speed with per-link falloff; on release the energy travels
back out as a wave rather than every item snapping home on the same curve. Live readout: tension per
link.
Learned from: `elastic-text` (originkit) — letters follow a dragged letter with elastic falloff.
Refuses: being a text effect, WebGL, and the variable-font angle. Generic children, real coupling
constant, tension measured and printed.

**2. `dock` — magnification as a function of attention**
Principle: *How much you magnify something is how long you spent near it.*
Mechanic: proximity field with smoothstep falloff, scaled by pointer speed — a fast pass barely
blooms, a slow scrub blooms fully, because influence integrates over dwell instead of reading raw
distance. Readouts: pointer speed in px/s, active influence radius.
Learned from: `magneticcarousel` (originkit) dock falloff; `avatar-group-hover` (transitions.dev)
distance falloff.
Refuses: distance-only magnification, blur/dim of inactive items, image-gallery framing.

**3. `toss` — momentum decides, not distance**
Principle: *Distance does not decide whether it leaves. Momentum does.*
Mechanic: drag a card; on release the exit test is kinetic, not positional. Below escape velocity it
returns with its velocity carried into the return spring; above it, it leaves and the residual push
is handed to the card underneath. Readouts: exit velocity, escape threshold.
Learned from: `swipe-stack` (originkit), which uses a minimum swipe *distance*.
Refuses: 3D fan, perspective stacking, tilt for looks. The stack is flat; only the decision is
interesting.

**4. `slosh` — a level that has inertia**
Principle: *It stops moving when it runs out of energy, not when the clock runs out.*
Mechanic: a 1D shallow-water line inside a slider or level control. Drag the value and the liquid
lags, overshoots, and reflects off both walls; the sim sleeps when total energy drops below epsilon
and wakes on the next input. Readout: energy, sleeping/awake.
Learned from: `water-button` (originkit) — real 1D shallow-water physics with auto-sleep.
Refuses: frosted glass, tint, spray droplets, hover ornament. One hairline surface, one Signal line,
one number.

**5. `peel` — lift measured in contact**
Principle: *Lift is measured in contact, not in blur.*
Mechanic: drag a card corner; tilt derives from drag velocity, the 1px hard shadow offset is the
contact distance, and release pastes it back on a spring seeded with the velocity it had. Grab it
mid-paste and the lift is yours again.
Learned from: `draggablesticker` / `sticker-peel` (originkit) — velocity-driven tilt, shadow
interpolating between resting and lifted.
Refuses: WebGL bone-mesh curl, sheen, soft shadows. DESIGN.md already says objects have contact, not
glow — this component is that rule as a control.

**6. `grip` — static friction before kinetic**
Principle: *Objects do not start moving the instant you push them.*
Mechanic: stick-slip. The element resists until applied displacement exceeds a break-loose threshold,
then friction drops and it moves freely; let go and it holds where it stuck. Readouts: applied force,
break-loose threshold, stuck/slipping.
Learned from: `gravitygallery`'s mouse-constraint stiffness (originkit), plus heft's own contact
model.
Refuses: Matter.js, a whole physics world. One body, two friction coefficients.

### state-morphing

**7. `origin` — the surface remembers where it was touched**
Principle: *A surface opens from where you touched it, and closes toward where you are now.*
Mechanic: clip-path circle anchored to the real pointer coordinate; the radius is a spring, so an
interrupt mid-open reverses from the current radius and re-anchors to the pointer's *current*
position, not the one it opened from.
Learned from: `radial-reveal-button` and `magnetic-hover-button` (originkit) anchor the wipe to entry
point; `menu-dropdown` (transitions.dev) is origin-aware.
Refuses: fixed-duration clip transitions, color wipes, entry-point-only memory.

**8. `reel` — the number arrives the way a wheel stops**
Principle: *The number arrives the way a wheel stops.*
Mechanic: digits ride a flywheel — friction spin-down onto detents, spring catch on the nearest
digit. A value change during a spin retargets and carries velocity; large deltas spin visibly longer
because they have further to fall, not because a duration was scaled.
Learned from: `spinning-counter` (transitions.dev, linear reel plus motion blur), `number-pop-in`.
Refuses: motion blur, per-digit stagger timing, any duration constant. Shares dial's physics family.

**9. `handoff` — the old value hands its velocity to the new one**
Principle: *The old value hands its velocity to the new one.*
Mechanic: one spring drives both outgoing and incoming content. They cross rather than cross-fade; a
change mid-swap retargets the same spring, so rapid updates never queue and never restart.
Learned from: `text-states-swap` and `icon-swap` (transitions.dev) — blur plus duration cross-fades.
Refuses: blur lanes, opacity-only transitions, queued animations.

**10. `tick` — an indicator that is measuring something**
Principle: *A loading indicator that is not measuring anything is a lie.*
Mechanic: an oscillator whose frequency and amplitude bind to a supplied real rate — tokens/s,
bytes/s, queue depth. No input rate, no motion: it holds still and says so.
Learned from: `ThinkingOrb` (orbs) — one visual, nine named states.
Refuses: named vibes as states, decorative breathing, canvas glow. The state is the data.

### input-utility

**11. `intent` — the pointer already told you**
Principle: *A fixed delay is a guess. The pointer already told you.*
Mechanic: open and close decided by pointer trajectory and speed rather than a timer — heading at the
target opens it now; sweeping past leaves it shut; leaving toward the surface keeps it open. Live
readout of the predicted approach.
Learned from: `tooltip` (transitions.dev) — delay-on-open, instant-on-close, both fixed constants.
Refuses: hardcoded 150ms intent delays.

**12. `hysteresis` — leaving costs more than entering**
Principle: *Leaving costs more than entering.*
Mechanic: two thresholds instead of one. Enter at radius A, exit at radius B greater than A, so a
formation holds while the pointer travels between its own members and never flickers on the boundary.
Learned from: `interactive-grid` (originkit) — a debounced leave keeps the formation intact.
Refuses: debounce timers. The threshold is spatial, not temporal.

**13. `scrub` — precision is what you slow down for**
Principle: *Precision is what you slow down for.*
Mechanic: drag-to-change number field where step size is a function of pointer speed — fast drag
takes coarse steps, slow drag resolves to fine ones, and the transition between them is continuous,
so one gesture goes coarse-to-fine without a modifier key.
Learned from: dial's detents, plus `dynamic-weight`'s per-frame proximity interpolation (originkit).
Refuses: modifier-key precision modes, fixed step counts.

**14. `grace` — the animation is the deadline**
Principle: *The animation is the deadline.*
Mechanic: a destructive action stays reversible for exactly as long as its own animation is still
running. Cancelling reverses from the current position with velocity carried; there is no separate
timer to disagree with what the user can see.
Learned from: `toast` (transitions.dev) and hold-drain's abort-cost family, inverted.
Refuses: a countdown that runs independently of the visible motion.

## Refinements to existing components (not new registry entries)

- **scramble-reveal**: measure the final string's rendered width and lock the box before scrambling so
  the label cannot reflow mid-decode. Learned from `encrypt-button` (originkit).
- **scramble-reveal**: freeze the random glyph order per string so a re-trigger reproduces the same
  decode, reshuffling only when the string changes. Learned from `weight-hover` (originkit).
- **heft**: raise the most recently dragged body above its neighbors on grab. Learned from
  `draggablesticker` (originkit).

## Open decision

Registry expansion changes PRODUCT FACTS ("Eight components in the registry"). Options recorded, not
chosen: expand the registry and update PRD.md; keep eight and ship these as site-only demos; or build
them in the z-ui registry repo instead of here.
