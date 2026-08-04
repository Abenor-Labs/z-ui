# ADR 0002: First-party CLI, with shadcn-compatible manifests

**Status:** accepted
**Date:** 2026-08-04

## Context

Components have to reach a user's project somehow. shadcn's CLI already accepts
an arbitrary registry URL, handles dependency installation, Tailwind config
merging, and path alias resolution. Building an equivalent is a large amount of
unglamorous work.

## Decision

Z-UI ships its own CLI, `@abenor/z-ui`. Registry manifests are simultaneously
kept as a strict superset of shadcn's `registry-item` schema, with all Z-UI
fields nested under `meta`, which shadcn ignores.

## Why

The CLI is where Z-UI-specific install behaviour will live: spring preset
selection, motion token setup, and whatever the registry needs that a general
tool will not carry. Delegating to shadcn permanently would mean never being
able to add any of it.

The manifest compatibility is the hedge, and it costs nothing. Because the
schemas are supersets rather than parallel formats, `npx shadcn add <raw-url>`
works on these manifests today, unmodified. That means there is a working
install path while the CLI is unwritten, and a permanent fallback if it lags.

The largest single cost of a first-party CLI, resolving a consumer's `@/` alias
through `tsconfig.json` with `baseUrl` and monorepo config inheritance, is
avoided entirely by a design choice recorded in the foundation spec: `z-ui.json`
stores both the import specifier and the disk path explicitly. `init` guesses
them once and asks for confirmation; `add` contains no tsconfig resolution code.

## Cost to reverse

Low in one direction, high in the other. Abandoning the CLI and telling people
to use shadcn costs nothing, because that path already works. Going the other
way later, after publishing, would mean an unpublish or a deprecation notice.

## What would change our mind

If, once written, the CLI does nothing shadcn's does not, it should be dropped
rather than maintained. The test is whether `add` has at least one behaviour
that a general-purpose registry client could not provide.
