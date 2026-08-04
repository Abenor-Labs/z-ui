# Architecture Decision Records

Decisions that were expensive to make and would otherwise be argued about again.
Each records what was decided, why, what it costs to reverse, and what would
change our mind.

Immutable after merge. A decision that changes gets a new record that supersedes
the old one, so the reasoning that turned out to be wrong stays readable.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-motion-as-the-animation-engine.md) | `motion` as the animation engine, not CSS keyframes | accepted |
| [0002](0002-first-party-cli-with-shadcn-compatible-manifests.md) | First-party CLI, with shadcn-compatible manifests | accepted |
| [0003](0003-raw-github-registry-transport.md) | Raw GitHub registry transport | accepted |
| [0004](0004-uncontrolled-by-default.md) | Uncontrolled by default, controlled optional | accepted |
| [0005](0005-react-19-ref-as-prop.md) | React 19 ref-as-prop, no `forwardRef` | accepted |
| [0006](0006-ship-our-own-class-merge-util.md) | Ship our own class merge utility | accepted |
| [0007](0007-composite-state-machine.md) | Composite state machine, and no `whileHover` | accepted |
| [0008](0008-hand-rolled-showcase.md) | Hand-rolled showcase, not a docs framework | accepted |
| [0009](0009-trunk-based-with-squash-merge.md) | Trunk-based branching, squash-merge | accepted |

## A note on 0001 through 0009

These nine were written on 2026-08-04, after the decisions were made rather than
alongside them. Backfilled records risk reading tidier than the reasoning
actually was, so each one distinguishes what was measured from what was
judgement, and 0005 and 0008 say plainly where a decision rests on judgement
about the ecosystem rather than on evidence.

0007 is the exception worth reading: it is backfilled but its evidence is
contemporaneous, because the bug it records was found by running the component
in a browser and the measurements are from that session.

Records from 0010 onward are written before or alongside the decision.
