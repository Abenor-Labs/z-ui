# ADR 0003: Raw GitHub registry transport

**Status:** accepted
**Date:** 2026-08-04

## Context

The CLI has to fetch component source from somewhere. No domain is owned. The
name `z-ui` on npm is taken by an unrelated Vue package, and `z-ui.dev` has not
been registered.

## Decision

The registry is served from `raw.githubusercontent.com`. The base URL is a
single string in `z-ui.json`, and it accepts a local filesystem path as well as
a URL.

## Why

There is no hosting to stand up and nothing to pay for, and it works today. The
decision is deliberately cheap to unwind: because the base is one config value
rather than a constant compiled into the CLI, moving to a hosted origin is a
config edit and no code change.

Accepting a local path in the same field is what lets contributors test
uncommitted components with `--registry ./registry`, and lets the CLI test
suite run with no network at all.

## Cost to reverse

Very low. One string. The site already serves the identical JSON at `/r/*.json`
with CORS open, so the hosted path exists and is tested before it is needed.

The real cost is not reversal but the transport's own limits, accepted knowingly:
unauthenticated raw GitHub is rate limited to roughly 60 requests an hour per
IP, and it always serves whatever is on `main` with no version pinning. For a
pre-alpha registry with a handful of users, neither has bitten yet.

## What would change our mind

Rate limiting affecting real users, or the first request for a pinned version.
Either moves this to a hosted origin, at which point tag-pinned URLs become
possible too.
