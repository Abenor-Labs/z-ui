---
name: Z-UI
description: A registry of spring-driven micro-interaction components, delivered as source you own.
---

# Design System: Z-UI

## 1. Overview

**Creative North Star: "The Lab Sheet"**

Not a website that happens to show components. A sheet of engineering paper with live instruments mounted on it: warm cream ground, ink linework, serif display type set like a drawing title block, and a single rust signal that lights only on whatever is physically moving. The reference points are a Braun instruction sheet, a drafting table, and a specimen board — not a code editor.

**Revision note (2026-08-14):** this replaces "The Instrument Panel", the dark warm-brown ramp that preceded it. Two dark ramps died for one structural reason: near-black plus one accent is the default dev-tool costume whatever the hue, and warming the browns only picked a different instance of it. So the ground flipped. A motion library's site is wall-to-wall dark demos everywhere else; paper is the differentiated position, and it photographs the components like specimens instead of dressing them like screenshots. The physical-object reading is still deliberate and load-bearing — this library is about tactility — but the object is now the drawing of the machine, with the machine parts themselves inset and operable.

The one dark surface left is the plate that carries source code. That inversion is the system's depth story: paper is where things are touched, ink plates are where things are read.

**Key Characteristics:**
- Paper chassis, ink markings, one rust signal
- Light-first; dark exists only as the code plate, which is the ink token itself
- Nearly monochrome at rest; color is an event, not a surface
- Serif display voice in a single weight — hierarchy from size and space, never boldness
- Motion is the only ornament, and it is never idle

## 2. Colors

Restrained: warm paper neutrals carry the entire surface, and one desaturated signal colour is rationed to the moving part.

### Primary
- **Signal Rust** (`#A03D00`): The indicator. Burnt orange at ink-adjacent depth — a printed warning on an instrument sheet, not a glowing LED. Reserved for the element currently in motion or an active state the user just caused: a needle mid-spin, a pill mid-travel, a copied confirmation decaying. Never a background, never body text, never decoration on a static element. Clears the 4.5:1 text floor on every ground it appears against (5.9:1 on chassis, 5.2:1 on panel), so unlike the mint it replaces it may also label, sparingly.

### Neutral
- **Paper** (`#F5F1E6`): The base surface (`chassis`). Warm cream, R > G > B, unmistakably not white.
- **Ink** (`#211D12`): Primary text, control markings, and the code plate's ground. Warm near-black; never pure `#000`.
- **Sheet ramp**: `#EFEADB` (surface) → `#E9E3D0` (panel) → `#DFD7BF` (panel-2) → `#7E7661` (control border). Tonal steps of the same yellowed-paper family; every step warm, none borrowed from a framework ramp.
- **Rules**: `#D6CEB6` (rule) and `#E0D9C4` (hair) — drafting linework, 1.4.11-exempt dividers only.

### Named Rules

**The Moving Part Rule.** Rust marks what moves, never what merely means. If a colour is carrying semantics on a static element, something in the neutral ramp is the right choice. An interface at rest shows almost no rust at all.

**The Contrast Floor Rule.** Every foreground/ground pair the site paints is enforced by `scripts/lint-contrast.mjs` at the WCAG floors — 4.5:1 for text, 3:1 for meaningful non-text — measured with the spec's own math, not by eye. Registry components are additionally checked against a white consumer app, because the file leaves this repo.

**The Second Channel Rule.** State is never encoded in hue alone. Every state change carries shape, fill, or position alongside colour, so the component still reads in forced-colors mode and to a color-blind user with the animation disabled.

**The Ink Plate Rule.** Dark surfaces exist for exactly one job: mounting source code, using the ink token as ground so the site has one story about what dark is. A dark panel that carries anything other than code is wearing a costume.

## 3. Typography

**Display Font:** Instrument Serif (with `Georgia, serif`)
**Body Font:** Instrument Sans (with `system-ui, sans-serif`)
**Label/Mono Font:** IBM Plex Mono (with `ui-monospace, monospace`)

**Character:** The serif is the drawing's title block — one weight, 400, which is the constraint that keeps the display voice honest: hierarchy comes from size and space, never from piling on boldness. Its italic is the system's single flourish, spent on at most one word per page. The sans does every sentence and disappears doing it. Plex Mono is the silkscreen: install commands, prop names, spring constants, state labels — anything a developer reads as a value.

### Hierarchy

- **Display** (`t-xl`, serif): Reserved for the masthead. Never appears in component UI.
- **Title** (`t-lg`, serif): Section and page headers.
- **Body** (sans): Prose and descriptions, capped at 65–75ch.
- **Label** (`lbl` / `lbl-xs`, mono, tracked): The workhorse — eyebrows, units, paths, states.

### Named Rules

**The Snippet Is The Hero Rule.** On any component page, the largest and most contrasted element after the live demo is the code. Prose is subordinate to both.

**The No Display Type In UI Rule.** Serif faces never appear inside a shipped component. Components carry Body and Label only, because they land inside someone else's type system and must not fight it.

## 4. Elevation

Flat by default, with tonal layering rather than shadows: paper planes are steps in the sheet ramp, and the one true depth change — code — inverts to the ink plate. Shadows are permitted in exactly one situation: as a transient response to direct user input, appearing and resolving with the same spring that drives the interaction.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces have no shadow until the user touches them. If a screenshot of the idle state shows a shadow, the shadow is wrong.

**The Milled Not Floated Rule.** Depth comes from tonal steps, not from blur. If depth is being read from a blurred edge, replace it with a step.

## 5. Components

Seven ship. The masthead's specimen is `dial` — the first component built to carry that slot: grabbable within a second of paint, and its one behaviour (it keeps spinning after your hand leaves) is the product thesis performed rather than stated. Every component: real spring or honest tween, `data-state` published, reduced-motion branch, 44px targets, keyboard path through the same physics.

## 6. Do's and Don'ts

### Do:
- **Do** reserve Signal Rust for the element in motion or the state just caused, on 10% or less of any surface.
- **Do** tint every neutral toward the paper family. Pure `#000` and pure `#fff` are forbidden.
- **Do** convey depth with tonal steps; reserve dark ground for the code plate alone.
- **Do** ship every component with default, hover, focus-visible, active, and disabled states.
- **Do** give every component a real `prefers-reduced-motion` path that still communicates the state change. An instant swap is correct; a zero-duration animation is not.
- **Do** keep hit targets at 44x44 CSS pixels minimum, even where the visual element is smaller.
- **Do** let overshoot happen only when all four hold: element under 48px, direct response to user input, interruptible mid-flight, tied to a state change.

### Don't:
- **Don't** build Lottie / Rive asset dumps: motion with no state model is media, not a component.
- **Don't** produce "Awesome CSS buttons" collections. Every component shares one API vocabulary or it does not ship.
- **Don't** write enterprise motion specification documents. If a page explains more than it demonstrates, delete the prose and build the demo.
- **Don't** ship toy and gimmick packages: confetti cannons, cursor trails, party mode.
- **Don't** animate anything the user did not touch. No mount animations, no scroll-driven reveals, no idle loops inside a shipped component.
- **Don't** use bounce or elastic easing as flavor. Overshoot comes from real spring physics under the four conditions above, never from a `cubic-bezier` that imitates one.
- **Don't** let the paper drift toward grey or the panels toward Tailwind stone. If a neutral stops reading warm, the sheet has lost its material.
- **Don't** use gradient text, `background-clip: text`, decorative glassmorphism, or colored side-stripe borders anywhere in the system.
- **Don't** put display type, custom scrollbars, or invented affordances inside a shipped component. It lands in someone else's app and must disappear into it.
