# ADR 0008: Hand-rolled showcase, not a docs framework

**Status:** accepted
**Date:** 2026-08-04

## Context

The showcase could be built on Fumadocs, Nextra, or a hand-rolled Next App
Router site. This was researched before building: five competitor teardowns
(21st.dev, shadcn/ui, ReactBits and Aceternity, Magic UI and motion-primitives,
Base UI and Radix) and three infrastructure investigations covering preview
isolation, code display, and framework choice.

The research agent that examined docs frameworks recommended Fumadocs, on the
strength of `@fumadocs/story` being a close fit for the hardest requirement.

## Decision

Hand-rolled Next 16 App Router site. Inline previews, one build script, Shiki at
build time. `@next/mdx` for prose pages only.

## Why

The framework recommendation was rejected after examining what `@fumadocs/story`
actually does. It derives controls from TypeScript prop types, which yields a
`spring` dropdown and nothing at all for the state rail, the reduced-motion
branch, the interrupt demo, slow-motion, or the `data-state` readout. Those are
the affordances that make a micro-animation legible, and they are the reason the
site exists.

Fumadocs' default page is a prose column, while DESIGN.md requires the demo and
then the code above prose, and PRODUCT.md principle 4 says any page with more
prose than interaction has failed. Its own recommended escape is
`fumadocs-cli customize`, which hands back the layout source, meaning the end
state is this file structure anyway, minus the days spent ejecting.

Estimated effort was comparable: roughly 11 days to a credible hand-rolled v1
against 12 to 14 fighting a theme.

Inline rather than iframe previews, because every comparable site (shadcn, Base
UI, Radix, Magic UI, motion-primitives, ReactBits) renders inline. 21st.dev uses
iframes because it runs 5,737 pieces of community-submitted arbitrary
JavaScript. Z-UI has one first-party component and expects around twenty.

## Cost to reverse

High and rising. The bench, the catalog, the code panel, and the install tabs
are all bespoke. Moving to a framework later means rebuilding the chrome and
re-solving preview mounting, keeping only the build script.

## What would change our mind

If `@fumadocs/story` ships state-variant stepping and multi-instance comparison,
the gap narrows to design-language fit. The cost to check was estimated at half
a day and was not spent, which is worth recording honestly: this decision was
made on a reading of Story's design rather than on a prototype.
