# ADR 0009: Trunk-based branching, squash-merge, protection after CI

**Status:** accepted
**Date:** 2026-08-04

## Context

The first three commits went directly to `main` during bootstrap. That stops
being acceptable once there is CI to gate on.

## Decision

Trunk-based development. Short-lived branches named after the conventional
commit types already in use, squash-merge only, head branches auto-deleted.

Branch protection is enabled only after the CI workflow is on `main`.

## Why

No `develop` branch and no release branches, because there is one deployable
artifact and one committer. Gitflow would be ceremony with no payoff.

Squash-merge only, with merge commits and rebase-merge disabled at the
repository level, so one pull request becomes one commit and `git log` on `main`
stays the changelog. Messy in-progress commits stay in the pull request where
they are useful and out of history where they are not.

The sequencing matters and is easy to get wrong: requiring status checks before
a workflow exists makes every pull request permanently unmergeable. Protection
therefore waits for the CI workflow to land.

Pull request approvals are deliberately not required while there is a single
committer, because that locks the repository with nobody able to approve. That
requirement gets added the day a second person joins.

## Cost to reverse

Trivial. Repository settings.

## What would change our mind

A second committer changes the approval rule immediately. Outside contributors
would add `CODEOWNERS` and a submission checklist. Neither changes the branching
model itself.
