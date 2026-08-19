# Product

## Register

product

## Users

React developers who already have a design system and do not want another one. They are shipping a real application, they hit a moment that feels dead (a like button that just turns red, a copy action with no acknowledgment, a toggle that snaps), and they want that one moment to feel alive without adopting a dependency that owns their markup.

Their context is mid-task. They are not browsing for inspiration; they are three hours into a feature and something feels cheap. The job to be done is narrow and urgent: make this one interaction feel physical, in under five minutes, without a new abstraction to learn or a runtime to justify in code review.

Secondary audience: developers evaluating the library, who arrive at the showcase first and decide within seconds whether the motion is genuinely better than what they would have written themselves.

## Product Purpose

Z-UI is a registry of micro-interaction components delivered as source code. The CLI writes real `.tsx` files into the user's project. From that moment the code is theirs: editable, deletable, not subject to an upgrade path.

It exists because the space between "no animation" and "adopt a motion system" is empty. Animation libraries give you primitives and leave the design to you. Component libraries give you components and leave the motion flat. Asset platforms give you canned playback with no state model. Z-UI occupies the gap: designed, physical, state-driven interactions that arrive as code you own.

Success looks like a developer running `add`, opening the file, changing one spring value, and never thinking about Z-UI again. Adoption measured in files written, not in packages installed. The library succeeding means becoming invisible.

Explicit non-goal: becoming a general component library. Scope refusal is a product feature, not a limitation to grow out of.

## Brand Personality

Precise and playful. Three words: **physical, exact, unpretentious.**

The voice knows the difference between a spring and an easing curve and expects the reader to care. It is confident without being solemn: this is a library about delight, written by people who take delight seriously enough to measure it. Short sentences. Real numbers. Occasional dryness. No exclamation marks, no "magical," no "beautiful."

Emotional goal at the moment of use: recognition. The developer presses the demo, feels the overshoot settle, and thinks "that is what I was trying to build."

## Anti-references

- **Lottie / Rive asset dumps.** Heavy JSON blobs with no state model, uncontrollable playback, impossible to restyle or interrupt. Z-UI components are code with an API, not media with a play button.
- **"Awesome CSS buttons" collections** (Uiverse-style codepen sprawl). Hundreds of unrelated effects, no consistent API, no accessibility, no reduced-motion path. Quantity as a substitute for design.
- **Enterprise motion specification documents.** Exhaustive theory, token taxonomies, motion principles, nothing installable. Z-UI demonstrates rather than explains; if a doc page has more prose than interaction, it has failed.
- **Toy and gimmick packages.** Confetti cannons, cursor trails, party mode. Delightful in a demo, deleted in week two. This is the failure mode of leaning too hard toward delight, and the closest genuine risk to this project.

## Design Principles

1. **Overshoot must mean something.** Motion is permitted only when it encodes a state change the user caused. Bounce as flavor is banned; bounce as physical feedback is the product. The bounds are hard: element under 48px, direct response to user input, interruptible mid-flight, tied to a state transition. Anything failing all four is decoration and gets cut.

2. **Interruptible or it is not physics.** A user who taps twice fast must see the second tap answered from wherever the first one had reached, carrying its velocity. Animations that must complete before accepting new input are timelines wearing a spring costume. This is the reason `motion` is a dependency rather than CSS keyframes, and it is the acceptance test for every component.

3. **The handoff is the product.** Value is delivered when source lands in someone's repo, not when they read the docs. Every decision gets judged by what the file looks like on arrival: readable, self-contained, obvious where to edit, no cleverness the owner has to decode before changing a number.

4. **Demonstrate, never explain.** The showcase is the documentation. Prose is the fallback for what the interaction cannot show by itself. Any component that needs a paragraph to justify its motion has motion that is not working.

5. **Refuse scope.** Every request to add a layout primitive, a form control, or a "just one more" general component gets declined. The registry stays small enough that a person can try all of it in one sitting.

## Accessibility & Inclusion

**Floor: WCAG 2.2 AA.** No component ships below it. This is stricter than usual for a motion library because motion is the single most likely thing here to physically hurt someone.

Every component ships with all of the following. A component missing any one of them is incomplete, not "shipping without polish":

- **Reduced motion is a real path, not a disabled animation.** `prefers-reduced-motion: reduce` swaps to an instant or opacity-only state change that still communicates the state. Setting duration to zero and calling it done is not acceptable; the user must still be able to tell what happened.
- **Keyboard operable**, with a visible `:focus-visible` indicator that is never removed and meets AA contrast against both surfaces.
- **Correct semantics.** Toggles carry `aria-pressed`, icon-only controls carry accessible names. Semantics are not delegated to the consumer, because most consumers will not add them and the ecosystem gets worse by default.
- **Hit target minimum 44x44 CSS pixels**, even where the visual element is 24px.
- **AA contrast in both light and dark themes.**

**Standing palette constraint:** the brand primary `#00E5A0` measures roughly 1.7:1 on white. It cannot carry text, icon-only controls, or focus indicators on light surfaces. Mint is a motion color: trails, fills, glows, the part that moves. Ink and neutral tones carry all text and all state that must be legible. Any component reaching for mint to convey meaning rather than movement is misusing it.

**Color is never the only channel.** State changes carry shape, position, or fill in addition to hue, so state remains readable to color-blind users and in forced-colors mode.
