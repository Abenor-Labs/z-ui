# ADR 0007: Composite state machine, and no whileHover

**Status:** accepted
**Date:** 2026-08-04

## Context

`like-button` originally used the obvious shape: `animate={pressed ? 'liked' :
'idle'}` with `whileHover` and `whileTap` layered on top, and four declared
states.

Running it in a browser found two bugs. Neither was caught by `tsc`, and neither
was caught by eleven ad-hoc contract checks that all passed, because those
checks verified that variant keys matched `meta.states` without ever asking
whether `data-state` could actually emit them.

**Measured, before the fix:**

| condition | icon colour | fill |
| --- | --- | --- |
| liked, at rest | `rgb(244, 63, 94)` | 1 |
| liked, hovered | `rgb(212, 212, 212)` | 0 |

Hovering a liked heart reverted it to grey and unfilled. `motion` applies the
hover variant over the animate variant, and a hover variant cannot know whether
the button is liked.

The second bug was silent: `meta.states` declared four values while `data-state`
emitted only `idle` and `liked`. A consumer writing
`[data-state="pressing"]` would have matched nothing, with no error anywhere.

## Decision

Liked-ness and interaction are independent dimensions, so the state machine is
their product: `idle`, `hover`, `pressing`, `liked`, `liked-hover`,
`liked-pressing`.

One derived value drives `animate` and `data-state` together. `whileHover` and
`whileTap` are banned in registry components, replaced by explicit pointer
handlers, with precedence pressing over hover over liked.

Every component declares `const STATES = [...] as const`, and CI enforces that
this tuple, `meta.states`, and the keys of every variants object all agree.

## Why

Two values that must never disagree should be derived from one source rather
than kept in sync. `data-state` is a public API surface, since it is what a
consumer styles against, and it silently lying is worse than it being absent.

The ban on `whileHover` is not stylistic. It is the specific mechanism that
caused both bugs, and it is greppable, which makes it enforceable.

**Verified after the fix, with real mouse input rather than synthetic events:**
all six states observed in sequence, `liked-hover` holds fill 1, and leaving
mid-press releases rather than sticking.

## Cost to reverse

Moderate, and it grows with the registry. Every component would need its
variants and handlers rewritten, `meta.states` regenerated, and the lint rule
removed. Consumers styling against six states would break.

## Consequences

- The decorative ring in `like-button` was removed. Its burst keyframes would
  replay on every hover after a like, and on desktop the burst would never fire
  at all, because a click always arrives with the pointer already inside. It was
  independently the weakest part of the component.
- Forcing a hover state programmatically now requires dispatching `pointerover`,
  not `pointerenter`. React derives enter and leave from over and out at the
  document root, so a synthetic `pointerenter` reaches nothing. A component keyed
  off `motion`'s own `whileHover` would need the opposite, which is a second
  reason components own their pointer handlers.

## What would change our mind

A component whose interaction states genuinely are independent of its value
state, where the product would be a combinatorial explosion rather than six
entries. At that point the answer is probably two attributes rather than
abandoning the derivation.
