# ADR 0001: motion as the animation engine

**Status:** accepted
**Date:** 2026-08-04

## Context

The initial project brief contradicted itself. It said the library would lean
"CSS-first, native springs, over a hard Framer Motion dependency, to stay
lightweight and not lock into React only", while the sample manifest in the same
document listed `"dependencies": ["motion"]`.

That contradiction had to be resolved before a single component could be
written, because it determines the shape of every source file in the registry.

## Decision

`motion` (Framer Motion) is a declared dependency of components that need it.
Z-UI is React-only.

## Why

Interruptibility. A user who taps twice quickly must see the second tap answered
from wherever the first had reached, carrying its velocity. CSS keyframes and
`linear()` easing cannot reverse mid-flight; they can only restart or complete.

Mid-flight reversal is not a detail of the product, it is the product. The
difference between Z-UI and a stylesheet of bouncy transitions is that these
components respond to interruption physically. PRODUCT.md states this as design
principle 2, and it is the acceptance test for every component.

The cost is real and accepted: a runtime dependency, and React only. The
alternative was a lighter library that could not do the one thing it exists to
do.

## Cost to reverse

High, and it grows with every component. Reversing means rewriting every
component's animation, replacing the spring scale with precomputed
`linear()` easings, and accepting that interruption becomes a restart. It would
also invalidate `useZTransition` and the `spring` prop, which are part of the
public API of every component.

Outside this repository: anyone who has run `add` keeps their copy working,
since they own the file. But they would be on an abandoned pattern.

## What would change our mind

A CSS or Web Animations API primitive that supports genuine interruptible spring
physics with velocity carry-over, broadly available across browsers. `linear()`
easing is not that, since it is a sampled curve with no state.
