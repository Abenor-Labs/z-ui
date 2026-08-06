# Operating model

How work on Z-UI starts, lands, and stays at the bar. This spec covers process,
not product: what a unit of work is, what gates it, and in what order the
remaining work to v1 gets built. It does not decide what gets built — that is
[`../ROADMAP.md`](../ROADMAP.md) — or why any architectural choice was made —
that is [`../adr/`](../adr/).

**Date:** 2026-08-05

---

## 1. Why this exists

The repository has a rigorous *structural* contract and no *quality* contract.
Both halves of that sentence are measured, not asserted.

The structural half is genuinely strong. JSON Schema with
`additionalProperties: false` throughout, a 77-check linter, bidirectional
`files[]` completeness, a closed import allowlist, a fake-spring detector that
correctly checks both cubic-bezier control points, tsconfig path parity across
workspaces, and the three-way `STATES` invariant from
[ADR 0007](../adr/0007-composite-state-machine.md) — source tuple, `meta.states`,
and every variants object's keys, forced to agree.

The quality half does not exist. The entire accessibility surface of the linter
is one line:

```js
// scripts/lint-registry.mjs:132
check(/aria-/.test(src), at, 'interactive root must carry an aria attribute')
```

A whole-file regex, satisfied by the `aria-hidden` on the decorative
`<motion.svg>` at `like-button.tsx:183`. Ten real contract violations were
injected into the working tree and nine passed `registry lint clean: 77 checks`,
exit 0 — including removing `aria-pressed`, removing `aria-label`, deleting the
focus-visible declaration entirely, shrinking `size-11` to `size-6` (44px to
24px), and replacing `useZTransition(spring)` with a hardcoded transition, which
kills the reduced-motion path. Four of those are bullets that
[`../../PRODUCT.md`](../../PRODUCT.md):56 calls completeness conditions —
"A component missing any one of them is incomplete."

Three further facts set the starting position:

- **Nothing has ever landed.** `main` is at `66bd84e` and contains PRODUCT.md, a
  seed DESIGN.md, and a scaffold. It has no `registry/`, no `web/`, no
  `.github/workflows/ci.yml`, no `docs/adr/`, no `docs/ROADMAP.md`. Six pull
  requests are open and zero are merged. PRs #2 through #6 are a single linear
  chain rather than short-lived branches off trunk, and PR #1 is independent of
  all of them. Every process rule in [`../README.md`](../README.md) is written as
  a same-pull-request side effect, and none of them can fire on a branch where
  the ledger does not exist. Local `main` is additionally two commits ahead of
  `origin/main` and unpushed, so the pull requests on GitHub are based on
  `9a04e69` rather than on what a local checkout shows.
- **`in review` has no exit.** [ADR 0009](../adr/0009-trunk-based-with-squash-merge.md)
  removed approvals while there is a single committer and substituted nothing.
  Five roadmap items sit in a status nothing is defined to change.
- **The unresolved tokens are causing shipped failures.** `DESIGN.md`:36 still
  reads `Panel Grey (tonal ramp [to be resolved during implementation])` and
  `DESIGN.md`:56 leaves the type scale the same way. Because there was no token,
  `like-button.tsx`:53-58 reaches for stock Tailwind hexes — `#a3a3a3` measures
  2.52:1 on white and `#fb7185` measures 2.69:1, both under the 3:1 floor for
  non-text graphical objects, and the icon is the only element that carries the
  liked state.
  Site side, `--color-muted` `#7a756d` is 4.33:1 on chassis and 4.09:1 on panel
  against a 4.5:1 requirement for the 11px `.lbl` that `DESIGN.md`:62 calls the
  workhorse of the type scale; `--color-rule` `#232327` is 1.26:1 on chassis
  against a 3:1 requirement for UI boundaries.

One more measured correction, since it is load-bearing elsewhere: `DESIGN.md`:42
states Signal Mint measures "roughly 1.7:1 on white." Computed against
Silkscreen Sand `#E8E4DC` it is **1.30:1**. The document's own justifying number
is optimistic, and the conclusion it supports — that the system must be
dark-first — is if anything stronger than stated.

## 2. Fixed decisions

These were decided before this spec and are inputs, not open questions.

| Decision | Value |
| --- | --- |
| Exposure | Private until undeniable. No deploy, no npm publish, no announcement until the launch gate in §6 is fully met. |
| Team | One human directing agents, working near-daily. The human is the taste gate and not a code reviewer. |
| Launch surface | The full v1 set: nine components across all three categories, plus the CLI and the showcase. |
| Theme scope | Components ship light **and** dark. The showcase stays dark-first per `DESIGN.md`:22. |
| Slice target | `copy-button` drives the first vertical slice. |
| Budget | Approximately two months to launch. |

Also fixed, and out of scope for any process proposal: the nine accepted ADRs,
and the five refusals under "Explicitly not planned" in `ROADMAP.md`.

## 3. The loop

**A unit of work is a slice, not a component.** A slice takes one component from
empty directory through tokens, source, manifest, showcase page, gates, and
docs. It is not done when the component works. It is done when every surprise it
produced has been encoded as a rule. Shipping a component while its friction
stays in someone's head is a slice that failed.

**Work starts from a roadmap row.** If no row authorises it, the row is added
first, with a reason. Each step of a slice is its own squash-merged pull request
onto `main`. A single branch carrying an entire slice is forbidden: that is how
the current five-deep stack came to exist, and the value of the model is in each
step landing separately.

**`in review` exits on two things, replacing the approver ADR 0009 removed:**

1. Every gate in §4 that applies to the change is green.
2. **Browser evidence in a fixed form:** a screen recording of the component
   driven through every `meta.states` value at 4× slow motion, in both themes,
   plus one pass under `prefers-reduced-motion: reduce`, attached to the pull
   request. Not a checkbox claiming a browser was opened. ADR 0007 already
   demonstrates the standard — six states observed with real mouse input and
   measured rgb values — and it happened once because it was recorded in an ADR
   rather than in the process.

**The encoding rule.** Stated once and applied without exception:

> Any invariant asserted in PRODUCT.md or DESIGN.md that is not currently a
> failing test is a rule the next author will break.

Therefore a defect found by hand becomes a lint rule **and its mutation** in the
same pull request as the fix. This is the one discipline the repository has
already proven it can execute: ADR 0007 is a browser bug converted into a
greppable ban, a CI check, a three-way invariant, and a mutation test, in one
pass. The loop is that move run deliberately rather than under pressure.

**The pull request template only ever shrinks.** Every checkbox that becomes an
automated gate is deleted from
[`../../.github/pull_request_template.md`](../../.github/pull_request_template.md).
Without this rule the manual list grows while the automated one does not, which
is the state it is in today.

**Three judges, non-overlapping.** Agents produce the work. CI judges mechanics —
contrast, semantics, hit target, reduced motion, interruptibility, weight. The
human judges feel: whether the overshoot reads as physical and whether the moment
earned its motion. If the human is reviewing a diff for correctness, a gate is
missing and building it is the higher-value work.

## 4. The gate ladder

Ordered by dependency and cost. Every rung traces to a sentence in PRODUCT.md or
DESIGN.md, and **every gate ships with its mutation** — a gate with no test that
breaks it can be deleted silently, which is already true of the `ICON_PACKAGES`
check today.

### Rung 0 — Branch protection

Require the `verify` job on `main`. One setting, `ROADMAP.md` item 6. Until it
flips, every rung below is a suggestion with a green checkmark beside it.

### Rung 1 — Make the existing gates honest

Before adding laws, repair the ones present:

- The import extractor is quote-sensitive; swapping `'` for `"` defeats both the
  allowlist and the icon-package ban. Make it quote-agnostic and cover
  `import()`, `require()`, and side-effect imports.
- `scripts/lint-registry.test.mjs`:40-46 catches a non-zero exit code and never
  asserts the message. Deleting the entire `ICON_PACKAGES` check still reports
  9/9, because the import allowlist absorbs the case. Assert messages, one
  mutation per rule.
- The same file hardcodes `like-button` at lines 4-5 and restores sources
  without `try/finally`, so an interrupted run leaves the registry mutated.
  Iterate `registry.json`; wrap restores in `try/finally`.
- Add ESLint with `react-hooks`, so the existing `exhaustive-deps` suppression
  refers to a rule that actually runs.

### Rung 2 — Static source laws

Parse the **root element's attributes**, not the file. The current whole-file
regex is satisfied by a decorative element.

| Law | Traces to |
| --- | --- |
| A component rendering `motion` must consume `useZTransition` or `useReducedMotionConfig` | PRODUCT.md:58, reduced motion is a real path |
| Root carries an accessible name, and `aria-pressed` when the manifest declares a boolean state pair | PRODUCT.md:60, semantics are not delegated to the consumer |
| Root declares a `focus-visible:` class | PRODUCT.md:59, never removed |
| Root declares a box of at least 44px (`size-11`, `min-h-11`/`min-w-11`, or explicit px) | PRODUCT.md:61 |
| `category` and `spring` derive from one source rather than being duplicated across `registry.json`, `component.json`, and source | ADR 0007's stated general rule, so far applied only to `STATES` |

### Rung 3 — Token contrast

A dependency-free script that parses the `@theme` block in
`web/app/globals.css` plus the literal hexes in component variant objects, and
computes WCAG ratios for every foreground-on-surface and border-on-surface pair
the codebase actually uses. Fails below 4.5:1 for text and 3:1 for non-text.

Scope follows the theme split: **light and dark for `registry/`**, dark only for
`web/`. It fails on day one against `--color-muted`, `--color-rule`, and
like-button's `#a3a3a3` and `#fb7185`, which is the proof it is worth writing.

### Rung 4 — `lint:site`

Shaped exactly like `lint-registry`: a script plus a test that breaks it nine
ways.

- Every font family named in `@theme` must have a matching `@font-face` or
  `next/font` call, and the built CSS must contain at least one `@font-face`.
- A **mint allowlist**: `text-mint`, `border-mint`, and `bg-mint` fail outside a
  named set of moving-part call sites. This is the only mechanism by which the
  Moving Part Rule survives a second author.
- Raw hex and arbitrary Tailwind values (`text-[…]`, `tracking-[…]`) are banned
  in `web/` and `registry/`, forcing sizes and tracking into tokens. Five call
  sites currently retype `0.12em` by hand.
- Fail if `DESIGN.md` still contains the string
  `[to be resolved during implementation]` or the `SEED` comment on line 1.

### Rung 5 — Playwright render harness

Only what static analysis provably cannot do. Three implementation constraints,
each of which would otherwise cost a day:

- Playwright's `animations: 'disabled'` does **not** stop Motion's rAF springs.
  Use `MotionGlobalConfig.instantAnimations` via `addInitScript`.
- axe's `target-size` rule implements SC 2.5.8 at 24×24 and is disabled by
  default. Nothing off the shelf checks 44×44; write the `boundingBox()`
  assertion by hand.
- Pin `@axe-core/playwright` exactly rather than with a caret. A minor bump
  retags rules and turns a green build red with no code change; treat each
  deliberate bump as a scheduled accessibility review.

Per component, per `meta.states` value, across {dark, light} × {normal,
reduced-motion, forced-colors}, assert: accessible name present; `aria-pressed`
matches the value dimension; **computed** box at least 44×44; a focus indicator
that is computed, non-transparent, and survives `forced-colors: active`;
state-carrier contrast at least 3:1 against both a light and a dark ancestor; and
at least one non-hue property differing from the adjacent state.

Plus the two specs PRODUCT.md already claims:

- **Interruptibility.** Press twice within 60ms and assert the element never
  returns to its rest transform between presses, using
  `MotionGlobalConfig.useManualTiming` with `time.set()`.
- **Reduced motion as a real path.** Under `prefers-reduced-motion: reduce`,
  assert `data-state` changed *and* a visual property changed, with no
  intermediate frame.

### Rung 6 — Budgets

Per-component installed bytes, from the `sha` and `lines` the generator already
computes, and first-load JS from the `next build` output. Fail on regression past
a stated threshold. Weight is the pitch and is currently unmeasured.

### Deliberately deferred: screenshot visual regression

At one component it is flaky and premature, and the interruptibility spec buys
more per unit of maintenance. When it returns at breadth it lands **advisory,
not blocking** — Radix runs Chromatic with `exitZeroOnChanges: true` for this
reason. A design system changes tokens on purpose, so a diff is a review prompt
rather than a failure, and a blocking pixel gate trains the team to ignore CI.

### What stays manual, permanently

After all six rungs the template holds one item, because no machine can judge it:
*does the overshoot read as physical, and did this moment earn its motion.* That
is the human's job, and the recording from §3 is how it gets done.

## 5. Build order

### Week 0 — Phase 0, prerequisite to everything

**Corrected 2026-08-05, by inspecting the branches rather than the pull request
list.** This section originally said "rebase and merge PRs #1 through #5 in
dependency order," which describes work that does not need doing. The actual
topology:

| Branch | PR | Structure |
| --- | --- | --- |
| `docs/foundation-spec` | #1 | Independent off `main`. Four commits, documentation only. |
| `feat/registry-primitives` | #2 | Base of the chain. |
| `feat/like-button` | #3 | Contains #2. |
| `feat/showcase` | #4 | Contains #3. |
| `chore/registry-lint` | #5 | Contains #4. |
| `docs/product-system` | #6 | Contains #5, and therefore every commit in #2 through #5. |

So there is no rebasing to do and no dependency order to reconstruct. Landing #6
lands #2 through #5 verbatim and closes them; #1 lands separately.

This surfaces a real conflict with
[ADR 0009](../adr/0009-trunk-based-with-squash-merge.md), which mandates
squash-merge. Squash-merging #2 rewrites its commit, orphaning #3's base and
forcing four sequential rebase-and-force-push cycles; the result also flattens
eight atomic, well-messaged commits into five blobs. Merging #6 with history
preserved avoids both. That is a deliberate deviation from a locked ADR for the
bootstrap case only, and it gets recorded as such rather than done quietly — ADRs
are superseded, not silently ignored.

Sequence: push `main` to `origin` (a fast-forward; every branch already contains
those two commits). Land #6 with history preserved. Land #1. Confirm #2 through
#5 auto-closed. Retro-fill roadmap statuses; the same-pull-request rule is
unsatisfiable retroactively, so say that in the merge message rather than
pretending otherwise. Add PR #6 as its own roadmap row, since it introduces the
authorisation rule and satisfies no existing row. Flip branch protection
(rung 0). Correct the two factual errors in `README.md`: the `packages/` entry in
the repository layout, which does not exist, and the status banner's claim that
the registry is empty, which four registry items contradict.

### Weeks 1–3 — Slice 1, `copy-button`

Each numbered step is one pull request onto a live `main`.

1. **Tokens.** Resolve `DESIGN.md`:36 and :56 into real `@theme` values — the
   Panel Grey ramp and the type scale — light and dark for component-facing
   surfaces, dark for the site. Ship rung 3 and fix `--color-muted` and
   `--color-rule`, which it fails on immediately.
2. **Fonts.** Self-host Inter Variable and JetBrains Mono via `next/font`,
   subset to latin, with metric-matched `size-adjust` and `ascent-override`
   fallbacks. Ship the font law from rung 4 in the same pull request. Today
   `--font-sans: 'Inter var'` resolves to nothing — that family name is not
   installed on any machine — so the stack falls through to `system-ui` and the
   mono stack to Consolas on Windows. Beyond the design failure, an unloaded
   webfont produces a FOUT reflow, which is the largest untouched motion event a
   page can generate, on a site whose thesis is that nothing moves unless
   touched.
3. **Write `copy-button` blind.** A subagent authors it with `like-button.tsx`
   withheld, given only the manifest schema, the linter's error messages, and
   DESIGN.md. Every point at which it has to guess is logged. This is the
   mechanised version of "write it without consulting the exemplar": a human
   cannot unsee the reference, and the instruction has no CI enforcement, which
   makes it the step most likely to be skipped under pressure.
4. **Convert the friction log.** Each logged guess becomes a lint rule with its
   mutation, a line in `CONTRIBUTING.md`, or a scaffolder slot. `CONTRIBUTING.md`
   is written here — two versions earlier than `ROADMAP.md`:68 schedules it, and
   derived from real confusion rather than introspection.
5. **Put it on the site.** This forces the genericity work for a reason rather
   than speculatively: the hardcoded `<LikeButtonBench>` at
   `web/app/c/[slug]/page.tsx`:5 and :57, the like-button vocabulary in
   `describe()` at :108-114, and the direct `LikeButton` import at
   `web/components/bench/spring-race.tsx`:5. Build the ADR 0008 affordances
   generically in the same pass — state rail, reduced-motion branch, `data-state`
   readout with `role="status"`, slow motion, and the interrupt demo per §7.
   Purge static mint from its thirteen call sites and replace the translucent
   blurred sticky header at `web/app/layout.tsx`:17 with an opaque tonal step,
   since both violate named rules and both live in the files being edited anyway.
6. **Playwright harness.** Rung 5, built against **two** components so it cannot
   be shaped around one.
7. **Retrofit `like-button`** against everything steps 1 through 6 produced. Its
   light-theme contrast failures close here, as does its keyboard gap: the
   `pressing` dimension is driven only by pointer events at
   `like-button.tsx`:151-162, so Space and Enter transition `idle` to `liked`
   directly with `scale: 1` at both ends, and a keyboard user receives none of
   the tactile feedback that is the product thesis.
8. **`pnpm new:component`.** Scaffolds `component.json` pre-filled with the
   schema `$ref` and the `motion` dependency, the `.tsx` already importing
   `z-spring` and `use-controllable-state`, the `.demo.tsx`, and the showcase
   registration.

### Weeks 4–6 — Components three through nine

`play-pause`, `mute-unmute`, `lock-unlock`, `bookmark`, `password-eye`,
`search-pill`, `theme-switch`. The same loop, materially faster: the scaffolder
exists, the gates exist, the contract is written down. Any slice that produces a
surprise still encodes it before merging; that rule never relaxes. Rung 6 lands
here, once there is enough surface to measure.

### Week 7 — CLI

`init`, `add`, `list`, built against a contract nine components have
stress-tested rather than one. `ROADMAP.md`:39-42 already argues this ordering.
Correct the install command while here: `web/components/install-block.tsx`:6
points at `main/registry/r/`, which does not exist in the tree — the generator
writes to `web/public/r/` — and the command is marked `ready: true` while the
CLI tab is `ready: false`, making the only working install path a 404.

### Week 8 — Launch hardening

Catalog search and filtering, a craft pass over the site against the finished
token system, deploy, publish, and a `README.md` that describes what exists.

## 6. Launch gate

The wall comes down when all of the following are true. Any one false and it does
not go.

1. Nine components exist, three in each of the three v1 categories.
2. Every component is green on every applicable rung, in both themes.
3. Every component's state recording has been reviewed by the human.
4. The CLI writes working files into a scratch project outside this repository.
5. The site is deployed and serving the registry, and the printed install command
   resolves.
6. `README.md` describes what exists rather than what is intended.
7. No document in the repository contains `[to be resolved during implementation]`.

## 7. Corrections carried into the plan

**The interrupt demo as scheduled proves nothing.** `ROADMAP.md`:60 schedules
"the interrupt demo and slow-motion controls on the bench." A single spring shown
alone is indistinguishable from a well-tuned `cubic-bezier` with overshoot baked
in — precisely the thing `DESIGN.md`:103 bans and `scripts/lint-registry.mjs`
:136-144 already detects in source. The demo must be an A/B twin: two identical
instances driven by one trigger, one on `springs.snap` and one on a deliberately
good duration-and-ease, with an opt-in auto-interrupt cadence shorter than settle
time. `useZTransition` already accepts a raw `Transition`, so the ease twin is a
prop rather than a fork. This is close to free and is the only falsifiable
version of the demo.

**The bench's settle indicator is a guess.** It uses a hardcoded 620ms, which is
wrong for three of the four presets whose exact settle times this repository
already computes. Derive it.

**A timer-driven state is a new shape.** `copy-button`'s `copied` state reverts
to `idle` on a timer, which breaks the assumption — baked into `data-state`, the
bench, and `DESIGN.md`:102 — that every state transition is user-caused. That is
the reason it is the right slice target, and it needs an explicit answer rather
than an accidental one.

## 8. Document consequences

`ROADMAP.md` is rewritten rather than amended. The v0.1 ship conditions change,
because deploying and publishing now sit behind the launch gate. Item 4 splits:
the showcase *architecture* is done and its *craft* is not, and one row currently
marks both. `CONTRIBUTING.md` moves from v0.3 to slice step 4. The pull-request
number column is dropped — PR #6 already broke the assumption that roadmap item
N corresponds to PR #N, and nothing cross-checks it.

Four ADRs are owed, because each records a decision made here and an undocumented
decision gets relitigated:

| ADR | Records |
| --- | --- |
| `in review` exit criteria | The two conditions in §3 and the browser-evidence format, replacing what ADR 0009 removed |
| Theme scope | Components ship light and dark; the showcase is dark-first |
| Release model | Private until undeniable, with the launch gate in §6 as the condition |
| Uniform `motion` | ADR 0001 locks the engine on interruptibility grounds. That components not needing velocity carry-over ship it anyway, for API consistency, is currently an inference |
| Bootstrap merge method | The one-time deviation from ADR 0009's squash-merge policy described in §5 Week 0, why it applies only to landing the existing chain, and that squash-merge resumes immediately afterward |

Smaller corrections: `DESIGN.md` loses both `[to be resolved]` holes and its
`SEED` comment, and its stated mint-on-white figure is corrected from ~1.7:1 to
1.30:1. `README.md` links `docs/` at all — it currently links none of ROADMAP,
PRODUCT, DESIGN, or `adr/` — and stops describing the registry transport in the
framing [ADR 0003](../adr/0003-raw-github-registry-transport.md) explicitly
argues against. `docs/README.md` opens "Four kinds of document" above a table
listing five.

## 9. What this spec does not decide

- Which components fill the three categories beyond the nine already listed in
  `ROADMAP.md`. Scope refusal is owned by PRODUCT.md principle 5.
- Whether outside contributions are ever accepted. Worth a recorded decision
  before launch, and not a blocker for any work in §5.
- The visual design of the showcase beyond the named rules already in DESIGN.md.
  Craft work is scheduled in §5; its direction is not this spec's to set.
