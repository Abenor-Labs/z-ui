# Spec: the CLI's motion data, made true

**Status:** draft, awaiting approval
**Date:** 2026-08-10
**Touches:** `packages/cli`, `web/scripts/build-registry.mjs`, `scripts/lint-registry.mjs`, `registry/schema/registry-item.schema.json`, both component manifests

---

## Why this is next

The CLI reads well and behaves well. Two thousand three hundred lines, five
commands, a hand-rolled TTY layer, error discipline that sets `process.exitCode`
rather than calling `process.exit` because libuv aborts on a closing handle. It
is not the problem.

The problem is that most of what makes it *ours* stopped being true and nothing
said so.

[ADR 0002](../adr/0002-first-party-cli-with-shadcn-compatible-manifests.md)
records a kill condition: if the CLI does nothing a general-purpose registry
client could not do, it should be dropped rather than maintained. Three
behaviours were written to satisfy it. Against the registry as it exists today:

| Behaviour | State |
| --- | --- |
| Digest verification — `registry/verify.ts` | **Live.** The generator writes `meta.digests`, the CLI hashes received bytes and refuses on mismatch. Real, and load-bearing. |
| Install-time `--spring` retarget — `project/spring.ts` | **Dead.** `DEFAULT_DECL` hunts for `spring = 'snap'` as a destructured prop default. Neither live component has a `spring` prop. `z-ui add disclosure --spring bounce` rewrites nothing, reports nothing, and exits 0. |
| Reduced-motion audit — `commands/doctor.ts` | **Dead.** It greps for `useZTransition(`. That symbol appears nowhere in `registry/`; `registry/lib/z-spring` was deleted in the clear-out. The check cannot fire. |

Both dead checks fail *open*. They find nothing, conclude nothing is wrong, and
print success. This is the same failure that left `scripts/lint-contrast.test.mjs`
printing `SKIPPED` and exiting 0 for days: a test anchored to a tree that moved.

There is a fourth instance of it in the data itself. `disclosure/component.json`
and `scramble-reveal/component.json` both declare `"spring": "snap"`.
`snap` is `{ stiffness: 500, damping: 40, mass: 1 }`. `disclosure` actually runs
`{ stiffness: 520, damping: 46, mass: 1 }` — near, not equal, and deliberately
so; the file argues at length that an overshoot on height reads as a rendering
bug rather than a bounce. `scramble-reveal` runs no spring at all. It is an
interval-driven glyph scramble with a `duration = 620` prop and a tick loop.

Nothing enforces `meta.spring`, so nothing caught either.

The through-line: **every piece of motion metadata this project holds is
authored by hand, and none of it is checked against the source it describes.**
Fixing that is the work. A new `preview` command falls out of it almost for
free, and the two dead differentiators come back to life as a consequence rather
than as a separate repair.

## What this is not

Not a rewrite. Not a dependency. Not a release.

Version numbers and publishing are explicitly out of scope — the work lands in
the tree, gets tested locally, and release sequencing is decided afterward.
`packages/cli/package.json` stays at `0.1.1`.

---

## Slice 1 — install-path friction

Five changes, no new subsystems, no schema movement. Independently testable and
independently revertible.

### 1. `add` initialises when it has to

`readConfig` throws `No z-ui.json in <cwd>` with a hint to run `z-ui init`. Every
install block on the site says `npx @abenor/z-ui add <name>`, so the first
command a new user runs is the one that refuses.

`add` gains the `detect()` logic `init` already has: framework, `src/`,
TypeScript, package manager. It shows the guess and, on a TTY, asks once. Under
`--yes` or a non-interactive stdin it writes the guess and says so on one line.
`init` remains, unchanged, for people who want to configure before installing.

### 2. `add <url>`

A positional matching `^https?://` is treated as a manifest URL rather than a
registry name: fetch it directly, skip the index lookup and the near-miss
suggestion path. `registryDependencies` still resolve against the configured
registry.

This makes the shadcn-compatibility hedge a first-class path instead of a line
in the docs, and it is the only way to install from a branch or a PR preview.

### 3. `doctor --json`

`doctor` already builds a `Finding[]` and already sets `process.exitCode = 1`
when any finding is a warning. It is one serialisation away from a usable CI
gate. Output is `{ findings, missingDependencies, installed }`. `--json`
suppresses the banner and every decorative line, following the rule `list`
already established: nothing before the `[` on stdout.

### 4. The registry stops being quoted from memory

`src/index.ts` lines 57–59 offer `like-button`, `scrub` and `undo-toast` as
examples. None of the three exist. One of them is permanently retired. Line 90
of `doctor.ts` tells a user with an empty project to run `z-ui add like-button`.

Both take a name from the index at runtime. Help falls back to a literal
`<name>` when there is no index to read — help must never require a network
round-trip.

### 5. `z-ui completion bash|zsh|fish`

A static script on stdout. Command names and flag names only; no registry
lookup, so it stays correct offline and adds no latency to a shell startup.

### 6. `--spring` stops lying, provisionally

Slice 2 teaches `--spring` what a spring actually looks like in this registry.
Until then, `retargetSpring` reporting zero changed files must produce a warning
rather than silence. A flag that is accepted and ignored is worse than a flag
that is rejected.

### Testing

`packages/cli/test/unit.test.ts` holds 45 tests and the three new behaviours are
pure functions over strings and objects. The auto-init decision, the URL
positional predicate, and the JSON shape are all directly testable.

The `--spring` warning gets a regression test that feeds it `disclosure`'s real
source text — the test that, had it existed, would have caught the dead regex.

---

## Slice 2 — one scanner, and the truth downstream of it

### Why a scanner, and why not a parser

The data `preview` needs does not exist. `meta` is `additionalProperties: false`
over exactly four fields: `category`, `gesture`, `states`, `spring`. There is no
transition data, no reduced-motion declaration, and the one spring field is
wrong on both components.

Three ways to get it, considered:

1. **Author it in `component.json`.** Rejected. It adds a second place for the
   truth to live, which is precisely the arrangement that produced the four
   drifts above. Lint can check that state *names* agree; it cannot cheaply
   check that a declared `340ms` matches the JSX.
2. **Parse in the CLI at preview time.** Rejected. Zero drift by construction,
   but it puts a brittle TSX scan on the user's machine, where a component the
   scan misreads degrades silently in someone else's terminal.
3. **Derive at build time and carry it in the manifest.** Chosen. No authoring
   burden, no runtime parsing, and — the deciding property — a component the
   scanner cannot read fails `pnpm verify` instead of producing a quiet wrong
   answer. The failure moves into the gate where this project already catches
   things.

The obvious implementation of (3) is TypeScript's own parser. That is not
available: the repo is on `typescript@7.0.2`, the native port, which exports
none of `createSourceFile`, `forEachChild` or `SyntaxKind` from the npm package.
Verified, not assumed.

Adding a parser dependency was considered. It would be a devDependency of the
`web` workspace, where the generator lives, so it would cost a consumer nothing
at install time — the CLI's own dependency list is untouched either way. (That
list is not empty: `figlet` is a runtime dependency, for the banner. The comment
in `project/write.ts` claiming otherwise predates it.)

It is rejected on a stronger ground than weight. `scripts/lint-registry.mjs`
already scans component source with targeted regexes, already gates the build on
what it finds, and its mutation harness catches 11 of 11 deliberate breakages.
A second, differently-shaped source reader would mean two tools disagreeing about
what a component says — which is the failure mode this whole spec exists to
close. The mechanism that works is extended rather than duplicated.
[ADR 0006](../adr/0006-ship-our-own-class-merge-util.md) points the same way.

The precedent that decides it is `scripts/lint-registry.mjs`, which already
scans component source with targeted regexes, already gates the build on what it
finds, and whose mutation harness catches 11 of 11 deliberate breakages. The
mechanism works here. It is extended rather than replaced.

### `scripts/motion-scan.mjs`

One module, `scanMotion(source) → { states, springs, durations, reducedMotion }`,
imported by two consumers: `web/scripts/build-registry.mjs` emits its output into
the manifest, and `scripts/lint-registry.mjs` re-runs it and asserts the emitted
data still agrees. A shared module rather than two copies, so unlike the `sha`
duplication between the generator and `registry/verify.ts` there is no
"must stay identical" comment to honour.

What it extracts, all of it module-level and all of it already conventional:

- **`states`** — `const STATES = [...] as const`. `lint-registry.mjs` owns this
  regex today; it moves into the scanner and lint imports it back, so the
  three-way STATES check keeps working from a single definition.
- **`springs`** — a brace-matched module-level `const X = { … }` containing both
  `stiffness` and `damping`. Brace-matched rather than a lazy `[\s\S]*?`, because
  `disclosure`'s `SPRING` carries a twenty-five-line doc comment and nested
  braces defeat the greedy form. Keeps `mass`, `restDelta`, `restSpeed`.
- **`preset` per spring** — `{ stiffness, damping, mass }` compared against the
  published scale (`snap` 500/40/1, `bounce` 400/14/1, `settle` 260/24/1,
  `fling` 300/30/1). Exact match yields the name; anything else yields `null`,
  meaning bespoke. `disclosure` yields `null`.
- **`durations`** — numeric prop defaults in the component signature
  (`duration = 620`) and module constants ending `_MS`.
- **`reducedMotion`** — `useReducedMotion` imported *and* referenced in a
  branch, yielding `"branch"`; otherwise `null`.

### What the scanner does not claim

No state graph. `disclosure` derives its `data-state` from a nested ternary over
`open` and `settled`, and `scramble-reveal` from a different shape entirely.
Turning those into edges is not reliably extractable, and a scanner that guesses
edges reproduces the exact failure this spec exists to remove. States are
reported as a set, not a machine.

### Gates

`pnpm verify` fails when:

- a component imports `motion` but the scanner finds neither a spring nor a
  duration — its motion is unreadable, and unreadable is not publishable;
- `reducedMotion` is `null`. This is the accessibility contract from ADR 0002,
  generalised off the deleted `useZTransition` and onto the thing every
  component actually does;
- an authored `meta.spring` disagrees with the scanned preset.

The third gate fails on both components as they stand. That is the point, and it
means the manifests are corrected in the same commit that introduces the gate,
not in a follow-up.

### Schema and manifest

`registry-item.schema.json` gains `meta.motion` and opens `additionalProperties`
for it. `meta.spring` stops being authored: it is removed from both
`component.json` files and written by the generator from the scan.

**Downstream, outside the CLI.** `build-registry.mjs` feeds `meta.spring` into
`web/__generated__/meta.js`, and the catalogue prints it. Both components
currently show a `snap` badge that is false. Once derived, `disclosure` has no
preset to show. The badge renders the real numbers — `520/46 bespoke` — rather
than disappearing: a showcase whose entire pitch is motion craft should not be
less specific about its springs than its own CLI is.

### `z-ui preview <name>`

Renders from `meta.motion` alone. No parsing on the user's machine, no second
request beyond the index.

Per spring: the numbers, preset or bespoke, damping ratio ζ, the regime, time to
90%, settle time, overshoot percentage, and the ASCII curve. Every one of those
is already computed by `src/ui/spring-curve.ts`, which integrates the real
spring-mass-damper with semi-implicit Euler rather than drawing an
easing curve with a spring-shaped name. `preview` is a second caller of work
that already exists.

Around it: title, gesture, the state set, durations, the reduced-motion line,
dependencies, and the paths the files would land at. `--json` alongside, same
banner-suppression rule as `list` and `doctor`.

### The two repairs this unlocks

**`--spring`** consults `meta.motion.springs[].preset`.

- Bespoke → refuse, naming the numbers and the reason. Rewriting `disclosure`'s
  520/46 to `bounce`'s 400/14 would make a height animation overshoot, which the
  file's own tuning comment identifies as a rendering bug rather than a
  delight. Silently doing it is worse than not offering it.
- Preset → rewrite the named constant's `stiffness`, `damping` and `mass`,
  leaving `restDelta` and `restSpeed` alone; those are tuned to the animated
  quantity's units, not to the preset.

The dead `spring = 'snap'` prop-default regex is deleted.

**`doctor`** drops the `useZTransition(` grep. Where the manifest says
`reducedMotion: "branch"`, it asserts the local copy still imports
`useReducedMotion` and still branches on it. This fires on both live components,
which restores the third ADR 0002 behaviour to something that can actually fail.

### Testing

`scripts/motion-scan.test.mjs`, built in the shape of `lint-registry.test.mjs`:
mutate a real component's source and require the scanner to catch it. Delete the
reduced-motion branch. Rename the spring constant. Move 520 to 500. Drop
`STATES`. Each must be caught, and the harness must report how many mutations it
ran so a silent skip is visible in the output.

Anchored on `disclosure`, which is live. Never on a path that can be deleted out
from under it — anchoring to a deleted path is what killed `doctor`'s
reduced-motion check and what still has `scripts/lint-contrast.test.mjs`
printing `SKIPPED`.

CLI-side: `--spring` refusal on a bespoke spring, and the `preview` renderer
against a fixture manifest.

---

## Out of scope

- **Registry response caching.** `raw.githubusercontent.com` is CDN-fronted, and
  this repo has twice read propagation lag as failure. A local cache converts a
  two-minute lag into a stale read with no expiry a user can reason about.
- **Re-pointing `scripts/lint-contrast.test.mjs`.** It is the same class of
  wound — anchored on the deleted `like-button` and on `web/components/catalog-card.tsx`,
  skipping silently. It is worth fixing and it is not this change; folding it in
  would make both harder to review.
- **Publishing, version numbers, and `main`.** Deferred by decision.

## Sequencing

Slice 1 does not depend on slice 2 and can be reviewed and tested alone.

Slice 2 has one ordering constraint inside it: the scanner, the schema change,
the manifest corrections and the third gate are a single commit, because the
gate fails against the manifests as they currently stand.

## What would change our mind

If the scanner needs a special case per component, the convention it relies on
is not a convention and this approach is wrong — author the data in
`component.json` and enforce what can be enforced. Two components is a thin
sample; the third one to arrive is the real test.
