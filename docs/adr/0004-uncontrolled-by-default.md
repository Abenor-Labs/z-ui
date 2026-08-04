# ADR 0004: Uncontrolled by default, controlled optional

**Status:** accepted
**Date:** 2026-08-04

## Context

Every stateful component has to decide who owns its state. A fully controlled
API is the most predictable and the easiest to test. An uncontrolled one is the
fastest to drop in.

## Decision

Components own their state until a value is passed. `pressed`,
`defaultPressed`, and `onPressedChange` follow the Radix convention, and control
mode is decided by whether the controlled prop is `undefined`.

## Why

The showcase and the README both open with a single tag, `<LikeButton />`, and
that has to work with no wiring. Requiring `useState` for a button that bounces
puts boilerplate in front of the thing being demonstrated.

Radix naming rather than an invented vocabulary, because the audience already
has the convention in their fingers from Radix and shadcn, and a component that
lands in their project should not introduce a third pattern.

The shared implementation lives in `use-controllable-state`, which is itself a
registry item, so the behaviour is identical across components rather than
reimplemented per component.

## Cost to reverse

Moderate. Going fully controlled would break every existing usage. Going the
other way, adding uncontrolled support later, would have been additive, which is
an argument for having started controlled. That argument lost to the demo
ergonomics.

## What would change our mind

Nothing likely. This is the settled convention in the ecosystem this library
sits inside.
