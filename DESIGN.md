<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Z-UI
description: A registry of spring-driven micro-interaction components, delivered as source you own.
---

# Design System: Z-UI

## 1. Overview

**Creative North Star: "The Instrument Panel"**

Not a website that happens to show components. A machined panel: ink chassis, silkscreened sand labels, and a single mint indicator that lights only when something is actually moving. The Teenage Engineering OP-1 is the anchor for the feeling, Linear and Raycast for the density and the speed, Vercel's Geist docs for how a snippet earns the center of the page. The physical-object reading is deliberate and load-bearing: this library is about tactility, and a system that looks like software about software would undercut it.

The warm neutral is what keeps this out of the terminal-green trap. Sand `#E8E4DC` on ink is a printed marking on a device, not text in a console. Every dev-tool instinct pulls toward pure black with neon, and that instinct is rejected here by name. The panel is warm where it is quiet and cold only where it moves.

Restraint is the whole strategy. The surface is nearly monochrome so that the one moment of mint reads as an event. When a control overshoots and settles, that is the loudest thing on the page, and nothing else is permitted to compete with it. Prohibited by construction: decorative gradients, glass, ambient looping motion, anything that moves without being touched.

**Key Characteristics:**
- Ink chassis, sand markings, one mint indicator
- Dark-first by necessity, not by fashion (see the Contrast Floor Rule)
- Nearly monochrome at rest; color is an event, not a surface
- Density and speed over whitespace and ceremony
- Motion is the only ornament, and it is never idle

## 2. Colors

Restrained: tinted neutrals carry the entire surface, and one saturated mint is rationed to the moving part.

### Primary
- **Signal Mint** (`#00E5A0`): The indicator. Reserved for the element currently in motion or in an active state the user just caused: a fill sweeping in, a trail, a stroke drawing, a toggle that has just landed. It is never a background, never body text, never a decorative accent on a static element. Its rarity is what makes it legible as "something happened here".

### Neutral
- **Chassis Ink** (`#0A0A0B`): The base surface. Near-black, tinted a fraction toward the brand hue rather than pure `#000`, which reads as a hole in the screen.
- **Silkscreen Sand** (`#E8E4DC`): Primary text and control markings on ink. Warm, printed, deliberately not white. This is the color that keeps the system from reading as a terminal.
- **Panel Grey** (tonal ramp `[to be resolved during implementation]`): Borders, dividers, inactive control fills, and the second surface layer for panels and toolbars. Derived from ink with lifted lightness and near-zero chroma.

### Named Rules

**The Moving Part Rule.** Mint marks what moves, never what means. If a color is carrying semantics on a static element (an error, a label, a category, a link), mint is the wrong color and something in the neutral ramp is the right one. An interface at rest shows no mint at all.

**The Contrast Floor Rule.** Signal Mint measures roughly 1.7:1 on white. It is forbidden on text, icon-only controls, and focus indicators over light surfaces. This is not a style preference; it is why the system is dark-first. Any light-theme component that reaches for mint to convey meaning has to solve contrast with a neutral instead.

**The Second Channel Rule.** State is never encoded in hue alone. Every state change carries shape, fill, or position alongside color, so the component still reads in forced-colors mode and to a color-blind user with the animation disabled.

## 3. Typography

**Display Font:** Inter (with `system-ui, sans-serif`)
**Body Font:** Inter (with `system-ui, sans-serif`)
**Label/Mono Font:** JetBrains Mono (with `ui-monospace, monospace`)

**Character:** One sans doing all structural work, one mono doing all machine work. Inter is chosen precisely because it is invisible: it must not compete with the motion, which is the actual subject. JetBrains Mono is the panel's silkscreen, used for install commands, prop names, spring values, and state labels. The pairing reads as instrument labelling rather than editorial voice.

### Hierarchy

Fixed rem scale, ratio approximately 1.2 between steps. Exact values `[to be resolved during implementation]`.

- **Display**: Reserved for the showcase hero only. Never appears in component UI.
- **Headline**: Component names in the registry catalog.
- **Title**: Section headers within a component page (Props, States, Install).
- **Body**: Prose and descriptions, capped at 65 to 75ch.
- **Label** (JetBrains Mono, uppercase, tracked): Prop names, state names, spring preset names, install commands. This is the workhorse of the system.

### Named Rules

**The Snippet Is The Hero Rule.** On any component page, the largest and most contrasted element after the live demo is the code. Prose is subordinate to both. If a page has more paragraphs than it has interactive surface, it is documenting a failure to demonstrate.

**The No Display Type In UI Rule.** Display and headline faces never appear inside a shipped component. Components carry Body and Label only, because they land inside someone else's type system and must not fight it.

## 4. Elevation

Flat by default, with tonal layering rather than shadows. Depth is conveyed by surface lightness steps in the neutral ramp: chassis, panel, control. This matches the instrument-panel metaphor, where planes are milled rather than floated, and it keeps the visual field quiet enough that motion reads clearly.

Shadows are permitted in exactly one situation: as a transient response to direct user input on an interactive element, appearing and resolving with the same spring that drives the interaction. A shadow that exists at rest is a decoration and is prohibited.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces have no shadow until the user touches them. If a screenshot of the idle state shows a shadow, the shadow is wrong.

**The Milled Not Floated Rule.** Depth comes from lightness steps in the neutral ramp, not from blur. If depth is being read from a blurred edge, replace it with a tonal step.

## 5. Components

Omitted. No components exist yet. This section gets populated by a Scan-mode run of `/impeccable document` once the first components are built.

## 6. Do's and Don'ts

### Do:
- **Do** reserve `#00E5A0` for the element currently in motion, on 10% or less of any surface.
- **Do** tint every neutral toward the brand hue. Pure `#000` and pure `#fff` are forbidden.
- **Do** convey depth with lightness steps in the neutral ramp, not with shadow.
- **Do** ship every component with default, hover, focus-visible, active, and disabled states. A component missing any of them is incomplete, not unpolished.
- **Do** give every component a real `prefers-reduced-motion` path that still communicates the state change. An instant swap is correct; a zero-duration animation is not.
- **Do** keep hit targets at 44x44 CSS pixels minimum, even where the visual element is 24px.
- **Do** let overshoot happen only when all four hold: element under 48px, direct response to user input, interruptible mid-flight, tied to a state change.

### Don't:
- **Don't** build **Lottie / Rive asset dumps**: motion with no state model, no interruptibility, and no way to restyle it. Components are code with an API, not media with a play button.
- **Don't** produce **"Awesome CSS buttons" collections**. Quantity is not a substitute for design. Every component shares one API vocabulary or it does not ship.
- **Don't** write **enterprise motion specification documents**. If a page explains more than it demonstrates, delete the prose and build the demo.
- **Don't** ship **toy and gimmick packages**: confetti cannons, cursor trails, party mode. This is the project's closest genuine failure mode.
- **Don't** animate anything the user did not touch. No mount animations, no scroll-driven reveals, no idle loops inside a shipped component.
- **Don't** use bounce or elastic easing as flavor. Overshoot is permitted only under the four conditions above, and only from real spring physics, never from a `cubic-bezier` that imitates one.
- **Don't** reach for pure black plus neon. If the surface starts reading as a terminal, the neutral has lost its warmth and Silkscreen Sand needs to come back.
- **Don't** use gradient text, `background-clip: text`, decorative glassmorphism, or colored side-stripe borders anywhere in the system.
- **Don't** put display type, custom scrollbars, or invented affordances inside a shipped component. It lands in someone else's app and must disappear into it.
