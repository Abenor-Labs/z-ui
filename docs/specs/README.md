# Specs

One per feature, written before the code, named `YYYY-MM-DD-<topic>.md`.

A spec says how something works in enough detail to build it. It is not
immutable the way an ADR is: when building proves a spec wrong, the spec is
corrected in the same pull request that found the problem, and the correction is
described in the commit message.

That has already happened four times on the foundation spec, and every one came
from building or running rather than from review:

| Correction | Found by |
| --- | --- |
| Spring timings were estimated rather than derived | Computing them while writing `z-spring` |
| Contrast figures were approximated | Measuring them |
| Rule 11 assumed one variants object; a real component needs three | Building `like-button` |
| The import allowlist forbids icon libraries, so icons are inline SVG | Trying to import a heart |

| Spec | Covers | Status |
| --- | --- | --- |
| `2026-08-04-z-ui-foundation-design.md` | Registry schema, component contract, CLI, validation | in review ([#1](https://github.com/Abenor-Labs/z-ui/pull/1)) |
| [`2026-08-05-operating-model.md`](2026-08-05-operating-model.md) | How work starts and lands, the gate ladder, build order to v1, the launch gate | in review |
| [`2026-08-10-cli-motion-truth.md`](2026-08-10-cli-motion-truth.md) | Install-path friction, and deriving motion metadata from source so the CLI's ADR 0002 behaviours can fail again | draft |
