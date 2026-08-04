# Docs

Four kinds of document, each with one job. If a question is not answered by the
one that owns it, the answer is missing rather than elsewhere.

| Document | Answers | Changes |
| --- | --- | --- |
| [`../PRODUCT.md`](../PRODUCT.md) | Who this is for, what it refuses to be, the principles work is judged against | Rarely. A change here is a change of direction. |
| [`../DESIGN.md`](../DESIGN.md) | What it looks like. Colour, type, motion energy, the named rules | When the visual system evolves. Regenerate from code once there is more of it. |
| [`ROADMAP.md`](ROADMAP.md) | What is next, in what order, and what is deliberately not planned | Every time work lands, in the same pull request. |
| [`adr/`](adr/) | Why a decision was made, what it costs to reverse, what would change our mind | Never. Superseded, not edited. |
| [`specs/`](specs/) | How a feature works, in enough detail to build it | Before the code. Corrected when building proves it wrong. |

## The rule that makes this work

Every pull request links the roadmap item, spec, or ADR that authorised it. If
none applies, that is worth noticing rather than hiding: it is fine for a fix and
a warning sign for a feature.

## What has already been learned

Four corrections to the foundation spec came from building or running the code,
and none came from review. That is not an argument against specs, it is an
argument for writing them, building against them quickly, and correcting them in
the same pull request that found the problem.

The specific pattern worth keeping: a green typecheck and a passing lint suite
have both coexisted with a component that was visibly broken in a browser. Where
a change is user-visible, browser evidence is part of the verification, not a
nicety.
