# bond — design

**Status:** approved design, not built. Candidate #15, site-only.
**Date:** 2026-08-19
**Depends on:** the liquid/gooey Phase 1 research (technique space, `liquid-gooey` 0.1.0 teardown,
prior art, license policy).

> **Not a product fact.** PRD.md PRODUCT FACTS says seven components. `bond` lives on
> `/candidates` under the same terms as reel / origin / grip / intent (DESIGN.md A13): no install
> command, no CLI mention, no registry card. It becomes a component only when the CLI can install
> it and PRODUCT FACTS is updated to match.

---

## 1. Principle

> **The state is not a flag. It is whether the two are still one.**

Two masses share a surface. Pull them apart and the neck between them thins and fails; push them
back within bridge distance and it reforms. The boolean is not represented by the topology — it
**is** the topology. Nothing sets the state; the state is read off whether the bridge holds.

This is why goo earns a place here rather than being texture. The merge carries the only
information the control has.

### Why this passes the candidate filter

| Filter | How |
| --- | --- |
| 1. Micro-animation, not chrome | The animation is the control's entire truth condition |
| 2. Emerges from a rule, not a timeline | Break point is where the summed alpha field crosses the iso-level; nothing is keyframed |
| 3. Interruptible, carries state | Grab mid-settle and the spring's velocity is yours, same path as `dial`'s catch |
| 4. One principle, one sentence | Above |
| 5. Single self-contained `.tsx` | The SVG-goo primitive ships inside `Bond.tsx` |
| 6. No WebGL / gradients / glow / autoplay | Flat token fills, one SVG filter, still until touched |

### What it refuses

Frosted glass, tint, droplet spray, specular rims, refraction. Asymmetric break/form thresholds —
that is candidate #12 `hysteresis`'s principle and `bond` will not poach it. The break gap and the
form gap are the same number.

---

## 2. API

```tsx
<Bond
  joined={linked}
  onJoinedChange={setLinked}
  blur={18}
  contrast={18}
  axis="x"
>
  <input aria-label="width" … />
  <input aria-label="height" … />
</Bond>
```

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `joined` | `boolean` | — | Controlled state. Uncontrolled if omitted, with `defaultJoined` |
| `defaultJoined` | `boolean` | `true` | Uncontrolled initial state |
| `onJoinedChange` | `(joined: boolean) => void` | — | Fires **on the neck crossing**, not on release |
| `blur` | `number` | `18` | Gaussian sigma. Also sets the break threshold — see §5 |
| `contrast` | `number` | `18` | Edge hardness. Intercept is derived from it, never passed |
| `axis` | `'x' \| 'y'` | `'x'` | Separation axis |
| `label` | `string` | `'bond'` | Accessible name for the switch |
| `children` | exactly two elements | — | Measured and mirrored; must have transparent backgrounds |

Exactly two children. A child count other than two is a development-time error, not a silent
degrade. `bond` applies `background: transparent` to its direct children itself rather than
trusting callers to remember — the blob underneath is their surface, and an opaque child would
simply hide it.

### The handle

The children are the two masses, and both are interactive content (number fields in the demo), so
neither can host the drag — pointer-down on an `<input>` belongs to text selection. `bond` therefore
renders its own **handle**, centred in the gap:

- It is the `role="switch"` element. Click or Space/Enter toggles.
- It is the drag target. Dragging it along `axis` sets `gap = 2 × |displacement from centre|`; the
  two children separate symmetrically by `gap / 2` each, so the handle stays under the pointer and
  visibly rides the neck as it thins.
- It is **content, not mass** — it is not mirrored into the silhouette. It renders as a hairline
  mono glyph on the sharp layer, above the merged surface. Making it a third rect would put a lump
  in the middle of the neck and confuse the one thing the shape is supposed to say.
- At rest it returns to the centre of whatever gap it left behind. It is a grip on the neck, not a
  latch that stays where it was dropped.

---

## 3. Two-layer architecture

The goo never touches the content. This is the one architectural idea taken from the research, and
everything else follows from it.

- **Silhouette layer** — an SVG at `z-index: -1` inside `isolation: isolate`, holding one
  `<rect rx>` per child mirroring that child's measured box and border-radius. The filter runs
  here and only here.
- **Content layer** — the real children in normal flow, above, unfiltered. They carry transparent
  backgrounds; the blob underneath is their surface.

Consequences, all three load-bearing:

1. Text, number fields and focus rings stay pixel-sharp, because they are never filter inputs.
2. The children remain fully interactive and accessible — a filtered HTML subtree is not.
3. Safari renders it. The filter is applied to **SVG content**, never as `filter: url(#…)` on an
   HTML element; that specific pairing is the combination WebKit gets wrong.

**Measurement.** Each child's rect comes from `offsetWidth` / `offsetHeight` plus computed
`border-radius`, positioned by an `offsetParent` walk that deliberately ignores transforms — the
silhouette mirrors motion on its own track, driven from the same `MotionValue` (§6).

---

## 4. Filter chain

Inline in `Bond.tsx`, three primitives:

```
feGaussianBlur  in=SourceGraphic  stdDeviation={blur}                  -> blur
feColorMatrix   in=blur  type=matrix
                1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 {contrast} {intercept}
                                                                       -> goo
feComposite     in=SourceGraphic  in2=goo  operator=atop                -> shape
```

**The intercept is computed, never written:**

```ts
const intercept = Math.round((0.5 - contrast * (5 / 12)) * 100) / 100;
```

Solving `contrast·alpha + intercept = 0.5` with that substitution gives `alpha = 5/12 ≈ 0.4167` for
**any** contrast. The iso-surface threshold is locked; `contrast` becomes a safe edge-hardness knob
rather than a magic number that also silently moves the threshold.

| contrast | intercept | crossing alpha |
| --- | --- | --- |
| 12 | −4.5 | 0.4167 |
| **18** | **−7.0** | 0.4167 |
| 30 | −12.0 | 0.4167 |

At `contrast = 18` this reproduces the canonical `18 / -7` exactly — that equality is the check
that the derivation is right, and it is asserted in the test suite (§12).

`feComposite operator="atop"` rather than `feBlend`: `atop` keeps source colour only where goo
alpha exists, which is what flat-filled paths want.

**Filter region.** `pad = Math.ceil(blur * 3 + 8)`, `filterUnits="userSpaceOnUse"`, region
`x=-pad y=-pad w=W+2·pad h=H+2·pad`. A Gaussian is visually dead past ~3 sigma, so 3 sigma is the
minimum slack that avoids a hard rectangular clip through a blob. At `blur=18`, `pad = 62`.

**Not present, deliberately:** no `feMorphology`, so the binarize-before-morphology rule does not
arise. No shadow chain at all — DESIGN.md permits no box-shadow except the single 1px hard contact
shadow, so the reference implementation's `ShadowPass` / `InsetPass` / CSS-shadow parsing / the
`stdDeviation = blur/2` conversion are all out of scope. No `feTurbulence`, so its region-cost
landmine does not apply.

---

## 5. The threshold is derived, not chosen

```
breakGap    = blur
joinedRest  = 0
partedRest  = blur * 2.5
```

Two blobs bridge while their blurred alpha fields still sum past alpha = 5/12 across the gap, which
puts the failure point at `gap ≈ blur`. The research's calibration agrees: 8px apart barely bridges
at `blur=5` and merges cleanly at `blur=12`.

So the mechanic has **no px constant of its own**. Change the blur token and the break distance,
the parted rest and the filter padding all retune together. This is the same argument the intercept
formula makes one level down: derive the threshold, expose the knob.

At the three playground presets:

| blur | breakGap | partedRest | pad |
| --- | --- | --- | --- |
| 12 | 12 | 30 | 44 |
| 18 | 18 | 45 | 62 |
| 28 | 28 | 70 | 92 |

---

## 6. Motion and state

One `MotionValue`, `gap`, is the whole state of the component.

**Drag.** The handle's displacement writes `gap` directly — measured input, not an animation. Both
children translate by `gap / 2` away from centre along `axis` (transform only, never layout). Range
is clamped at 0 (the two cannot interpenetrate). Past `partedRest` the excess is rubber-banded:
`gap = partedRest + (raw − partedRest) * 0.4`.

**Commit fires on the crossing, not on release.** `joined` is a pure function of `gap < breakGap`;
`onJoinedChange` fires whenever that boolean actually changes value. Dragging back across re-joins.
Release does not decide the state — it only decides which rest the value settles into. No deadband:
if the pointer genuinely oscillates across the threshold, the state genuinely oscillates, and
pretending otherwise would be a hysteresis mechanic wearing a disguise.

**Settle.** On release, `animate(gap, joined ? joinedRest : partedRest, { ...STIFF, velocity })`
using the shared 1300/46 from `src/lib/springs.ts`. Seeded with the release velocity via the
existing `VelocityTracker`.

**Interrupt.** Pointer-down during a settle stops the animation and hands the value back to the
pointer with its velocity intact — the same pattern as `dial`'s catch and `heft`'s drag.

**One clock.** The silhouette rects are written from `gap.on('change')`, the same subscription the
content transform uses. Nothing is driven by a CSS transition. A main-thread stall therefore
freezes both layers together; content cannot sail away from its own liquid.

**Keyboard.** Space / Enter animates `gap` to the opposite rest through that same spring, so a
keyboard user watches the neck break rather than seeing a jump.

---

## 7. Accessibility and reduced motion

- `role="switch"` on the handle, `aria-checked={joined}`, named by `label`. It takes one tab stop,
  between the two children in DOM order. The children keep their own labels and remain independently
  focusable and operable — the switch never traps or proxies them.
- Focus-visible outline on the switch affordance, per the site's existing 1px `--ink` treatment.
- **Reduced motion:** the two topologies render statically — joined draws one merged silhouette,
  parted draws two — with a crossfade between them and no animated filter. This is a real fallback
  state, not `duration: 0`. The research's reference implementation snaps while continuing to render
  goo; Z-UI's rule is stricter and `bond` diverges from it deliberately.

---

## 8. Readouts

All four derive from the single measured quantity, `gap`:

| Label | Value | Unit |
| --- | --- | --- |
| `gap` | current separation | px |
| `neck` | `clamp(1 − gap / breakGap, 0, 1)` | — |
| `blur` | sigma | px |
| `state` | `joined` / `parted` | — |

Rendered through the existing `Readout` component, mono, Signal orange, per DESIGN.md.

---

## 9. Site surfaces

- **`/candidates`** — a new entry alongside reel / origin / grip / intent, carrying the principle
  sentence, the mechanic, what it learned from, and what it refuses.
- **CANDIDATES.md** — candidate #15 written into the slate under `tactile-feedback`.
- **Playground** — built on the `Playground` shell: chip rows for Blur (12 / 18 / 28) and Contrast
  (12 / 18 / 30), a stage with the W/H field pair, readouts, and the generated code block. The
  Contrast row makes the intercept derivation visible as a live thing rather than a footnote —
  moving it changes edge hardness and visibly does *not* move the break distance.
- **Demo subject:** two number fields, W and H. Joined means the aspect ratio is locked; pulling
  them apart unlinks them. The physical metaphor is exact and needs no caption to land.

---

## 10. Cleanup

`liquid-gooey` comes out of `package.json`. Per the research's license policy, every primitive is
re-derived from the stated mathematics and no code is copied; the package was a reference read, not
a dependency to inherit.

`src/sandbox/GooeyKit.tsx` and `src/sandbox/GooeyDemo.tsx` are written entirely against the
package's `<Liquid>` / `<Liquid.Item>` API and cannot survive its removal. They were scratch built
to learn the technique; this spec is that learning. Both files and the unlisted `/sandbox/gooey`
route are deleted in the same change that removes the dependency.

**Attribution.** `Bond.tsx` carries a header naming the technique lineage: Lucas Bebber for the goo
filter, Blinn's 1982 blobby model for the iso-surface reading, and `liquid-gooey` (MIT, Jakub
Antalik) for the intercept derivation specifically. Ships MIT.

---

## 11. Non-goals

- Rotation-aware silhouettes.
- More than two masses. `cohere` (n-way selection fusion) is the queued second consumer and the
  proof that the primitive generalizes; it is not this component.
- Refraction / "liquid glass". Different mechanism, separate research track.
- Shadows of any kind on the merged surface.
- Extraction of the goo primitive into a shared module. Candidate filter #5 requires each component
  to be self-contained; `cohere` will carry its own copy, and that duplication is the stated cost of
  the registry's model.

---

## 12. Verification

- `npm run typecheck`, `npm run build`, `npx eslint src` clean.
- Numeric test asserting the intercept derivation: for contrast in {6, 12, 18, 30, 60} the alpha
  crossing is 5/12 to within 1e-9, and contrast 18 yields exactly `−7`.
- Numeric test asserting `breakGap`, `partedRest` and `pad` all move with `blur`. The only px
  constant in the component is the 8px region slack; `2.5` (parted rest) and `0.4` (rubber band) are
  ratios, and the test asserts there is no third distance written in pixels.
- SSR render of the candidates page and the playground without crashing.
- Manual, in browser: neck fails at the calculated distance; grabbing mid-settle carries velocity;
  the state flips on the crossing and back; keyboard toggle shows the break; reduced motion shows
  two static topologies; Safari renders the merge.

Note: browser verification has been unavailable for the last two sessions (no playwright/puppeteer
MCP). If that is still true when this is built, the manual line stays unchecked and is reported as
unverified rather than assumed.
