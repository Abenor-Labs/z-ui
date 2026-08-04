# ADR 0005: React 19 ref-as-prop, no forwardRef

**Status:** accepted
**Date:** 2026-08-04

## Context

Components need to forward a ref to their root element. React 19 made `ref` an
ordinary prop and deprecated `forwardRef`. React 18 still requires the wrapper.

## Decision

`ref` is a normal prop. `react >= 19` is a peer dependency. No `forwardRef`
anywhere in the registry.

## Why

Design principle 3 in PRODUCT.md says the handoff is the product, and that every
decision is judged by what the file looks like when it lands in someone's
repository. `forwardRef` adds a wrapper, a generic type pair, and a
`displayName` line to a file whose entire selling point is that its new owner
can read it in ten seconds.

React 19 shipped in 2024. Targeting it in 2026 is not an early bet.

## Cost to reverse

Low and mechanical. Wrapping each component in `forwardRef` is a per-file change
with no design implications. It would be done only to support React 18.

## What would change our mind

Real demand from people stuck on React 18. So far there is none, because there
are no users yet, which is worth stating plainly: this decision was made on
judgement about the ecosystem, not on evidence from an audience.
