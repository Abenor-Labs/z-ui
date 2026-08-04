# ADR 0006: Ship our own class merge utility

**Status:** accepted
**Date:** 2026-08-04

## Context

Components accept `className` and must merge it so that a consumer's utility
wins over a built-in one. Tailwind resolves conflicts by source order in the
generated stylesheet, not by specificity, so plain string concatenation makes
`className="p-4"` overriding a built-in `p-2` a coin flip.

Most of the target audience already has `cn` from shadcn's `@/lib/utils`.

## Decision

Z-UI ships `z-cn`, a registry item exporting `zcn`, wrapping `clsx` and
`tailwind-merge`.

## Why

Depending on the consumer's `cn` would couple the registry to a project it does
not control. It breaks outright for anyone not running shadcn, and breaks
silently for anyone whose `cn` has a different signature.

Naming it `zcn` rather than `cn` means it can never collide with the `cn` a
project already has. Two small dependencies that most Tailwind projects already
carry is a low price for being self-contained.

The rejected third option, no merge utility at all, was the smallest file but
made `className` overrides unreliable, which would have been a bug reported
against every component.

## Cost to reverse

Trivial. One file, one import per component.

## What would change our mind

If `tailwind-merge` stops being maintained or Tailwind gains a native
conflict-resolution mechanism, this collapses to a two-line `clsx` wrapper.
