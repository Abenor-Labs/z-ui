# ADR 0000: Template

**Status:** template
**Date:** YYYY-MM-DD

## Context

What forced a decision. The constraint, the conflict, or the thing that broke.
Written so someone who was not there understands why this was not obvious.

## Decision

What was decided, stated plainly and in the present tense.

## Why

The reasoning. Where a claim is measured, give the number and how it was
measured. Where it was a judgement call, say so rather than dressing it up as
evidence.

## Cost to reverse

Concrete. What has to change, how many files, and whether anyone outside this
repository is affected. This is the field that stops a decision being
relitigated over a hunch.

## What would change our mind

The observation that would make this wrong. If nothing would, the decision is
an assumption and should be labelled as one.

---

**Rules for ADRs in this repository**

- Numbered sequentially, never renumbered.
- Immutable after merge. A decision that changes gets a new ADR that says
  `Supersedes NNNN`, and the old one gets a `Superseded by NNNN` line added to
  its status. The reasoning that turned out to be wrong stays readable.
- Written when a decision is expensive to reverse, or when it will otherwise be
  argued about again in three months. Not for every choice.
