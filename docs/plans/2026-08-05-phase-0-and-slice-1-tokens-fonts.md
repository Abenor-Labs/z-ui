# Phase 0 + Slice 1 Steps 1–2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the six open pull requests onto a protected `main`, then resolve the two `[to be resolved during implementation]` holes in DESIGN.md — the Panel Grey ramp and the type scale — behind a contrast gate that fails before the fix and passes after, and load the fonts the design system has always named but never served.

**Architecture:** Phase 0 is a one-time git operation, executed by the human, that makes every later gate enforceable. Slice 1 Step 1 writes the contrast linter first (red), then the tokens that satisfy it (green), following the encoding rule from [the operating model spec](../specs/2026-08-05-operating-model.md) §3. Step 2 loads fonts via `next/font` and adds the site lint rules that keep a named-but-unloaded family from recurring.

**Tech Stack:** pnpm workspaces · Next.js 16.3.0 (Turbopack) · Tailwind CSS v4.3.3 (CSS-first `@theme`) · `tailwind-merge` 3.6.0 · Node 22 · `gh` 2.83.1 · zero new dependencies

---

## Two integration defects found while writing this plan

Both deliverables this plan draws on were verified independently and are correct in isolation. Composed, they break. Tasks 3 and 4 fix these; they are recorded here because they are decisions, not mechanics.

**Defect A — the contrast linter parses one `@theme` block; the new `globals.css` has two.**
`scripts/lint-contrast.mjs` matches `/@theme[^{]*\{([\s\S]*?)\n\}/`, which takes the **first** block only. The new `globals.css` puts ramps and site tokens in `@theme` and fonts plus `--color-z-*` in `@theme inline`. So the second block is invisible to the linter. Worse, rule A ("no token escapes review") would fire on all 23 ramp tokens in the first block, because `PAIRS` declares 7.

**Defect B — the light/dark component tokens are unchecked by anything.**
`--z-*` pairs live in `:root` and `.light`, which are plain CSS rules, not `@theme`. The linter never reads them. The theme scope decision — components ship light **and** dark — is therefore enforced by nothing, which is the exact failure mode the spec exists to prevent. Task 4 extends the linter to parse both rules and check every pair in both themes.

---

## File structure

| File | Responsibility | Task |
| --- | --- | --- |
| `README.md` | Correct two factual errors | 2 |
| `docs/adr/0010-bootstrap-merge-method.md` | Record the one-time ADR 0009 deviation | 2 |
| `docs/adr/README.md` | Index 0010 | 2 |
| `docs/ROADMAP.md` | Retro-fill statuses 1–6 | 2 |
| `scripts/lint-contrast.mjs` | Rung 3 gate: WCAG ratios for declared pairs, both themes, both surfaces | 3, 4 |
| `scripts/lint-contrast.test.mjs` | Mutation harness asserting messages, restoring unconditionally | 3 |
| `web/app/globals.css` | Ramps, site tokens, type scale, theme pairs | 4 |
| `registry/lib/z-cn/z-cn.ts` | `extendTailwindMerge` so custom size tokens survive merging | 5 |
| 9 call sites in `web/` | Migrate `text-[0.6875rem]` to `text-label` | 5 |
| `registry/components/like-button/like-button.tsx` | `iconVariants` that clear 3:1 on both grounds | 6 |
| `web/app/layout.tsx` | `next/font` declarations | 7 |
| `scripts/lint-site.mjs` | Rung 4 font rules | 8 |
| `scripts/lint-site.test.mjs` | Mutation harness for the font rules | 8 |
| `package.json`, `.github/workflows/ci.yml` | Wire both linters into `verify` | 3, 8 |

---

## Task 1: Phase 0 — land the stack onto a protected `main`

**Executed by the human, not by an agent.** Every command touches the remote. Read each before running it.

**Files:** none in the working tree. This task changes GitHub state only.

**Verified preconditions** (all confirmed 2026-08-05):
- `main` = `66bd84e`, `origin/main` = `9a04e69`, clean fast-forward, 2 commits unpushed.
- `docs/product-system` tip = `c4834b0` contains every head commit of PRs #2–#5.
- PR #1 (`docs/foundation-spec`) is independent; it touches exactly one file, `docs/specs/2026-08-04-z-ui-foundation-design.md`, and has **zero** file overlap with PR #6's 60-file diff.
- The `origin/main..origin/docs/product-system` range contains **zero merge commits**, so `required_linear_history: true` is compatible.
- CI already ran green on `c4834b0`: run `30926495698`, check `verify`, conclusion `success`.
- `main` is currently unprotected — the protection endpoint returns 404.
- Repo settings: `squashMergeAllowed=true`, `mergeCommitAllowed=false`, `rebaseMergeAllowed=false`.

- [ ] **Step 1: Park the uncommitted spec and plan**

The working tree holds `docs/specs/2026-08-05-operating-model.md`, `docs/plans/2026-08-05-phase-0-and-slice-1-tokens-fonts.md`, and a one-row edit to `docs/specs/README.md`. None exists on `main`, so `git switch main` would abort rather than discard them.

```bash
cd /d/ABENOR-LABS/Z-ui
git status --porcelain
git stash push -u -m "operating-model spec + phase-0 plan"
git stash list
```

Expected: `stash@{0}` exists; `git status --porcelain` is now empty.

- [ ] **Step 2: Pre-flight guards — every one asserts**

```bash
git fetch origin --prune

TIP=$(git rev-parse origin/docs/product-system)
MAIN_NOW=$(git rev-parse main)

# Guard 1 — main fast-forwards to PR #6's tip.
git merge-base --is-ancestor "$MAIN_NOW" "$TIP" \
  || { echo "FAIL: main does not fast-forward to $TIP"; exit 1; }

# Guard 2 — the load-bearing check. Every PR #2-#5 head must already be on #6.
for sha in 53dccca faa8c07 9867547 2f336e6; do
  git merge-base --is-ancestor "$sha" "$TIP" \
    || { echo "FAIL: $sha is not an ancestor of $TIP"; exit 1; }
done

# Guard 3 — the range is linear, so required_linear_history will accept it.
test -z "$(git log --merges --oneline origin/main..$TIP)" \
  || { echo "FAIL: merge commits in range"; exit 1; }

# Guard 4 — PR #1 and PR #6 share no files.
test -z "$(comm -12 \
  <(git diff --name-only main origin/docs/foundation-spec | sort) \
  <(git diff --name-only main origin/docs/product-system | sort))" \
  || { echo "FAIL: PR #1 and PR #6 overlap"; exit 1; }

# Guard 5 — main is still unprotected (a protected main rejects the direct push).
gh api "repos/Abenor-Labs/z-ui/branches/main/protection" 2>&1 | grep -q "Branch not protected" \
  || { echo "FAIL: main is already protected"; exit 1; }

echo "ALL GUARDS PASS"
```

Expected: `ALL GUARDS PASS`.

- [ ] **Step 3: Push `main`, then fast-forward it to PR #6's tip**

```bash
git push origin main
git push origin "refs/remotes/origin/docs/product-system:refs/heads/main"
git fetch origin
git rev-parse origin/main   # must equal $TIP
```

Expected: `origin/main` now equals `c4834b0`.

**Why a direct push and not `gh pr merge`:** `gh pr merge` exposes only `--merge`, `--rebase`, `--squash`. On this repo `--merge` and `--rebase` return HTTP 405 (both disallowed in settings), and `--squash` mints a new SHA — which breaks GitHub's auto-close of #2–#5, because auto-close fires only when a PR's head SHA becomes reachable from the base branch. Squashing would also flatten 8 atomic, well-messaged commits into one. This is a deliberate, one-time deviation from ADR 0009 and Step 6 records it.

- [ ] **Step 4: Block until #2–#6 all report MERGED**

Auto-close lags the push. Deleting a head branch while its PR is still open closes it grey ("Closed"), not purple ("Merged") — the exact outcome the fast-forward exists to prevent.

```bash
for n in 2 3 4 5 6; do
  gh pr view "$n" --repo Abenor-Labs/z-ui --json number,state --jq '"\(.number) \(.state)"'
done
```

Expected: all five print `MERGED`. If any prints `OPEN`, wait and re-run. **If any prints `CLOSED`, stop and delete nothing.**

- [ ] **Step 5: Sync local refs and delete the five merged branches**

```bash
git branch -f main origin/main
git switch main
git branch -d feat/registry-primitives feat/like-button feat/showcase chore/registry-lint docs/product-system
git push origin --delete feat/registry-primitives feat/like-button feat/showcase chore/registry-lint docs/product-system
git fetch origin --prune
```

- [ ] **Step 6: Squash-merge PR #1**

Squash is correct here: four documentation commits on one file, and nothing is stacked on it.

```bash
gh pr update-branch 1 --repo Abenor-Labs/z-ui
# Wait for a check to appear before watching. `gh pr checks --watch` errors
# out when zero checks exist rather than waiting for one.
until [ "$(gh pr checks 1 --repo Abenor-Labs/z-ui --json name --jq length 2>/dev/null || echo 0)" != "0" ]; do
  sleep 5
done
gh pr checks 1 --repo Abenor-Labs/z-ui --watch --fail-fast
gh pr merge 1 --repo Abenor-Labs/z-ui --squash --delete-branch
git fetch origin && git switch main && git pull --ff-only origin main
```

- [ ] **Step 7: Confirm CI is green on `main` before locking it**

```bash
git log --oneline -12
gh run list --repo Abenor-Labs/z-ui --branch main --limit 3
```

Expected: 12 commits including `c4834b0` and PR #1's squash; latest `main` run `success`.

- [ ] **Step 8: Enable branch protection**

The required check context is exactly `verify` — the job key in `.github/workflows/ci.yml`, which has no `name:` key, so the check-run name falls back to the job id. Confirmed against a live check-run.

**Ordering matters:** `ci.yml` first appears in `2f336e6`, inside PR #6's chain. Enabling protection before PR #1 lands would make PR #1 permanently unmergeable — its branch has no `ci.yml`, so `verify` could never report. Step 6 must complete before this step.

```bash
gh api --method PUT "repos/Abenor-Labs/z-ui/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["verify"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

`required_pull_request_reviews: null` is deliberate and matches ADR 0009 — requiring approvals with a single committer locks the repo with nobody able to approve.

- [ ] **Step 9: Restore the parked work**

```bash
git switch -c docs/operating-model main
git stash pop
git status --short
```

Expected: the spec, this plan, and the `docs/specs/README.md` row are back, on a branch off the new `main`.

---

## Task 2: The correction pull request

**Files:**
- Modify: `README.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/adr/README.md`
- Create: `docs/adr/0010-bootstrap-merge-method.md`

- [ ] **Step 1: Fix README error 1 — the phantom `packages/` directory**

`packages/` does not exist. It is only a reserved glob in `pnpm-workspace.yaml`. Replace the layout block:

```markdown
z-ui/
├── registry/          source of truth — the components themselves
├── scripts/           registry lint and its mutation suite
└── web/               showcase
```

- [ ] **Step 2: Fix README error 2 — the "registry is empty" banner**

Four registry items exist. Replace the status banner sentence:

```markdown
> **Status: pre-alpha.** Nothing is published yet. The CLI does not exist and
> the registry holds one component plus three primitives. Everything below
> describes what is being built. Watch the repo if you want to know when that
> changes.
```

- [ ] **Step 3: Write ADR 0010**

Create `docs/adr/0010-bootstrap-merge-method.md`:

```markdown
# ADR 0010: Bootstrap merge method, once

**Status:** accepted
**Date:** 2026-08-05

## Context

Six pull requests were open and none had merged. PRs #2 through #6 were a
single linear chain — #6's tip contained every commit of #2 through #5 — and
PR #1 was independent. ADR 0009 mandates squash-merge.

Squash-merging #2 would have rewritten its commit, orphaning #3's base and
forcing four sequential rebase-and-force-push cycles. It would also have
flattened eight atomic, well-messaged commits into five. And GitHub auto-closes
a pull request only when its head SHA becomes reachable from the base branch,
so squashing #6 would have left #2 through #5 to be closed by hand as "Closed"
rather than "Merged".

`gh pr merge` exposes no fast-forward option, and this repository disallows
both merge commits and rebase merges.

## Decision

`main` was fast-forwarded to #6's tip by direct ref push, landing #2 through #5
verbatim and auto-closing them. PR #1 was squash-merged normally. Squash-merge
resumes for all subsequent work.

## Why

The chain existed before ADR 0009 was written; #6 is the pull request that
introduced it. Applying the policy retroactively to the commits that carry it
costs history and gains nothing.

## Cost to reverse

None. This applied once, to a state that cannot recur now that branch
protection requires pull requests.

## What would change our mind

Nothing. This is a bootstrap record, not a standing policy.
```

- [ ] **Step 4: Index it**

Add to the table in `docs/adr/README.md`, after the 0009 row:

```markdown
| [0010](0010-bootstrap-merge-method.md) | Bootstrap merge method, once | accepted |
```

- [ ] **Step 5: Retro-fill the roadmap**

In `docs/ROADMAP.md`, change items 1–5 from `in review` to `done`, change item 6 from `blocked on 5` to `done`, and bump `**Last updated:**` to `2026-08-05`.

Add a row for PR #6 itself. It introduced the rule that every pull request links the roadmap item, spec, or ADR that authorised it — and it satisfies no existing row, so by its own test it is feature-shaped work with no governing artifact. Insert before item 7:

```markdown
| 6b | Product and process docs: PRODUCT, DESIGN, ROADMAP, ADRs 0001–0009, PR template | done | [#6](https://github.com/Abenor-Labs/z-ui/pull/6) |
```

Append below the table:

```markdown
**Carve-out.** Items 1 through 6 moved to `done` in a later pull request than
the one that completed them. The rule that status changes land in the same pull
request as the work is unsatisfiable retroactively — this file did not exist on
the branches doing that work. The rule applies from here forward.
```

- [ ] **Step 6: Verify and commit**

```bash
pnpm install --frozen-lockfile
pnpm verify
git add README.md docs/ROADMAP.md docs/adr/README.md docs/adr/0010-bootstrap-merge-method.md
git commit -m "docs: make the README true and record the bootstrap merge

README claimed a packages/ directory that does not exist and a registry
that is empty; four items exist. Roadmap items 1-6 are retro-filled with
an explicit carve-out, because the same-PR rule cannot apply to work whose
ledger was not on its branch. ADR 0010 records why main was fast-forwarded
rather than squashed, once."
git push -u origin docs/operating-model
```

Expected: `pnpm verify` exits 0.

---

## Task 3: The contrast gate — red first

Written before the tokens it judges. It must fail on the current tree; that failure is the proof it works.

**Files:**
- Create: `scripts/lint-contrast.mjs`
- Create: `scripts/lint-contrast.test.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the linter**

Create `scripts/lint-contrast.mjs` with the source in [Appendix A](#appendix-a--scriptslint-contrastmjs).

Three points about it, since they are the parts most likely to be "corrected" into being wrong:

The linearisation threshold is `0.03928`, not `0.04045`. `0.04045` is the mathematically consistent value and the sRGB standard's, but WCAG 2.x prints `0.03928` and every conforming checker uses it. A ratio computed the "correct" way disagrees with the tool an auditor will run.

Translucent foregrounds are composited over their surface before measuring. Without that, an `#rrggbbaa` reports the ratio of its opaque form, which is the flattering answer.

`PAIRS` is declared by hand and cannot be inferred. A foreground meets its background in the rendered DOM, not in one file — `text-muted` in `catalog-card.tsx` lands on a `bg-panel` set by the card's own root, `.lbl` sets a colour from CSS with no utility anywhere, and `code-panel.tsx` picks between `text-mint` and `text-muted` inside a ternary. Resolving those statically means evaluating the component tree, which is a renderer. What *is* inferable is whether the list is complete, and rules A, B and D do that: a declared list is only trustworthy when forgetting to declare is itself a failure.

- [ ] **Step 2: Run it and verify it FAILS**

```bash
node scripts/lint-contrast.mjs
echo "exit: $?"
```

Expected: exit `1`, with failures including:

```
  web: muted on chassis is 4.33:1, below the 4.5:1 floor for text
  web: muted on panel is 4.09:1, below the 4.5:1 floor for text
  like-button/like-button.tsx: iconVariants #a3a3a3 (idle) on #ffffff is 2.52:1, below the 3:1 floor for non-text — a white consumer app
  like-button/like-button.tsx: iconVariants #d4d4d4 (hover, pressing) on #ffffff is 1.48:1, below the 3:1 floor for non-text — a white consumer app
  like-button/like-button.tsx: iconVariants #fb7185 (liked-hover) on #ffffff is 2.69:1, below the 3:1 floor for non-text — a white consumer app
```

If it exits 0, the parser is matching nothing and the guard that should have caught that is broken. Do not proceed.

- [ ] **Step 3: Write the mutation harness**

Create `scripts/lint-contrast.test.mjs` with the source in [Appendix B](#appendix-b--scriptslint-contrasttestmjs).

It differs from `lint-registry.test.mjs` in two ways, both deliberate. It asserts the **message**, not the exit code — the contrast lint fails on the current tree by design, so exit codes carry no signal at all, and every case requires its sentence to be *new* relative to the baseline so a pre-existing failure can never be mistaken for a catch. And it restores on three paths — `finally`, signal handlers, and `uncaughtException` — because `finally` alone does not cover Ctrl-C, which terminates without unwinding and would strand a rewritten `globals.css`.

- [ ] **Step 4: Run the harness**

```bash
node scripts/lint-contrast.test.mjs
echo "exit: $?"
```

Expected: exit `0`, `5/5 baseline claims, 10/10 mutations caught`.

- [ ] **Step 5: Wire both into `verify`**

In `package.json`, add to `scripts`:

```json
"lint:contrast": "node scripts/lint-contrast.mjs",
"lint:contrast:test": "node scripts/lint-contrast.test.mjs"
```

and add `lint:contrast` and `lint:contrast:test` to the existing `verify` chain.

In `.github/workflows/ci.yml`, after the `Lint the linter` step:

```yaml
      # Colour is shipped, not rendered. A contrast mistake in a registry
      # component arrives in every project that ran `add`, as a file we can
      # no longer touch.
      - name: Lint contrast
        run: pnpm lint:contrast

      - name: Lint the contrast linter
        run: pnpm lint:contrast:test
```

- [ ] **Step 6: Commit — CI is expected to be RED**

```bash
git add scripts/lint-contrast.mjs scripts/lint-contrast.test.mjs package.json .github/workflows/ci.yml
git commit -m "test: add the contrast gate, failing

Seven real findings on the current tree: --color-muted misses AA on all
three panels, and three iconVariants colours miss 3:1 on a white consumer
app, where the CLI will put them. The gate lands before the fix so the fix
has something to turn green. CI is red until the next commit."
```

**Do not push yet.** `main` is protected and requires `verify` to pass. Task 4 turns it green; push after that.

---

## Task 4: The tokens — green

**Files:**
- Modify: `web/app/globals.css` (complete replacement)
- Modify: `scripts/lint-contrast.mjs` (fix defects A and B)

- [ ] **Step 1: Replace `globals.css`**

Use the file in [Appendix C](#appendix-c--webappglobalscss). Every ratio in its comments was recomputed with the WCAG formula and the OKLab matrices; none is estimated.

The two headline changes: `--color-muted` goes `#7a756d` → `#8d897f` (4.59:1 on the worst surface, was 3.51:1), and `--color-rule` goes `#232327` → `#6e6e75` (3.17:1, was 1.02:1).

The border change is visually large — dividers go from effectively invisible to clearly readable mid-grey. That is unavoidable under the stated floor, but note that WCAG 1.4.11 only requires 3:1 for boundaries needed to *identify a control*; purely decorative dividers are exempt, and `PAIRS` marks the section rules `decorative` for exactly this reason. If the panel now reads too heavy, do **not** add a low-contrast border token — use a surface lightness step (`bg-panel` vs `bg-panel-2`), which is what DESIGN.md §4's Milled Not Floated Rule already prescribes.

- [ ] **Step 2: Fix defect A — parse every `@theme` block, and exempt ramps**

In `scripts/lint-contrast.mjs`, replace the single-block match with a loop over all blocks, and add a ramp rule. Replace:

```js
const themeBlock = css.match(/@theme[^{]*\{([\s\S]*?)\n\}/)
if (
  !check(
    themeBlock,
    rel(GLOBALS),
    'no @theme block matched; the token parser would silently check nothing',
  )
) {
  report()
}

const tokens = new Map()
for (const m of themeBlock[1].matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  tokens.set(m[1], m[2])
}
```

with:

```js
// Tailwind v4 allows several @theme blocks and several modifiers (`inline`,
// `static`, `reference`). Matching only the first silently halves the token
// set, and a linter that checks half of what it claims to is worse than one
// that fails loudly.
const themeBlocks = [...css.matchAll(/@theme[^{]*\{([\s\S]*?)\n\}/g)]
if (
  !check(
    themeBlocks.length > 0,
    rel(GLOBALS),
    'no @theme block matched; the token parser would silently check nothing',
  )
) {
  report()
}

const tokens = new Map()
for (const block of themeBlocks) {
  for (const m of block[1].matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens.set(m[1], m[2])
  }
}

/**
 * Ramp steps are palette, not colour-in-use. A step becomes a real colour only
 * when a semantic token points at it, and it is the semantic token that carries
 * a contrast story. Demanding a declared pair per step would mean 23 entries
 * describing combinations nobody writes.
 *
 * The exemption is not free. A ramp step referenced by nothing is dead weight
 * that will eventually get reached for precisely because it is there, so every
 * step must be cited by a semantic token or deleted.
 */
const RAMP = /^(grey|sand)-\d+$/
const semanticValues = new Set()
for (const [name, hex] of tokens) if (!RAMP.test(name)) semanticValues.add(hex.toLowerCase())
for (const m of css.matchAll(/--z-[\w-]+:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  semanticValues.add(m[1].toLowerCase())
}
for (const [name, hex] of tokens) {
  if (!RAMP.test(name)) continue
  check(
    semanticValues.has(hex.toLowerCase()),
    rel(GLOBALS),
    `--color-${name} (${hex}) is a ramp step no semantic token points at; cite it or delete it`,
  )
}
```

Then scope rule A to non-ramp tokens. Replace its loop body's condition:

```js
for (const [token, hex] of tokens) {
  if (RAMP.test(token)) continue
  check(
    PAIRS.some((p) => p.fg === token || p.bg === token),
    rel(GLOBALS),
    `--color-${token} (${hex}) appears in no declared pair; every token needs a contrast story before it ships`,
  )
}
```

- [ ] **Step 3: Fix defect B — check the light and dark theme pairs**

The `--z-*` tokens live in `:root` and `.light`, which `@theme` parsing never sees. Components ship both themes, so both must be measured. Add above the `// ---- usage:` section:

```js
// ---- theme pairs: the tokens registry components actually consume ---------
/**
 * `--z-*` are declared in :root and .light, not in @theme, because @theme
 * cannot be nested in a class and the switch has to live somewhere. That puts
 * them outside every parser above, which meant the one decision the spec is
 * loudest about — components ship light AND dark — was enforced by nothing.
 *
 * Each theme is measured independently. A pair that passes in dark and fails
 * in light is a failure: the file leaves here and lands in an app whose
 * background is not ours to choose.
 */
const THEME_PAIRS = [
  { fg: 'fg', bg: 'bg', kind: 'text', role: 'component body text' },
  { fg: 'fg', bg: 'panel', kind: 'text', role: 'component text on a panel' },
  { fg: 'fg', bg: 'fill', kind: 'text', role: 'label inside a control' },
  { fg: 'fg', bg: 'fill-hover', kind: 'text', role: 'label inside a hovered control' },
  { fg: 'fg-muted', bg: 'bg', kind: 'text', role: 'secondary text' },
  { fg: 'fg-muted', bg: 'panel', kind: 'text', role: 'secondary text on a panel' },
  { fg: 'fg-muted', bg: 'fill', kind: 'text', role: 'secondary text in a control' },
  { fg: 'fg-muted', bg: 'fill-hover', kind: 'text', role: 'secondary text, hovered' },
  { fg: 'border', bg: 'bg', kind: 'ui', role: 'control boundary on the ground' },
  { fg: 'border', bg: 'panel', kind: 'ui', role: 'control boundary on a panel' },
  { fg: 'border', bg: 'fill', kind: 'ui', role: 'control boundary on a control' },
  { fg: 'border', bg: 'fill-hover', kind: 'ui', role: 'control boundary, hovered' },
  { fg: 'signal', bg: 'bg', kind: 'ui', role: 'the moving part' },
  { fg: 'on-signal', bg: 'signal', kind: 'text', role: 'glyph inside a filled indicator' },
  { fg: 'focus', bg: 'bg', kind: 'ui', role: 'focus ring' },
]

const themeRule = (selector) => {
  const m = css.match(new RegExp(`${selector}[^{]*\\{([\\s\\S]*?)\\n\\}`))
  if (!m) return null
  const out = new Map()
  for (const t of m[1].matchAll(/--z-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out.set(t[1], t[2])
  return out
}

for (const [selector, label] of [
  [':root', 'dark'],
  ['\\.light', 'light'],
]) {
  const theme = themeRule(selector)
  if (
    !check(
      theme && theme.size > 0,
      rel(GLOBALS),
      `no --z-* tokens found in ${label}; component theme pairs are unchecked`,
    )
  ) {
    continue
  }
  for (const p of THEME_PAIRS) {
    const fg = theme.get(p.fg)
    const bg = theme.get(p.bg)
    if (
      !check(
        fg && bg,
        rel(GLOBALS),
        `${label}: pair "${p.fg} on ${p.bg}" names a --z-* token that is not declared`,
      )
    ) {
      continue
    }
    const r = ratio(fg, bg)
    check(
      r >= FLOOR[p.kind],
      `theme:${label}`,
      `${p.fg} on ${p.bg} is ${fmt(r)}, below the ${FLOOR[p.kind]}:1 floor for ${NOUN[p.kind]} (${fg} on ${bg}) — ${p.role}`,
    )
  }
}
```

- [ ] **Step 4: Run the linter — web pairs and theme pairs pass, registry still fails**

```bash
node scripts/lint-contrast.mjs
echo "exit: $?"
```

Expected: exit `1`, and **no** `web:` or `theme:dark:` or `theme:light:` failures remain. The only failures should be the three `like-button/like-button.tsx` `iconVariants` lines. Task 6 closes those.

- [ ] **Step 5: Commit**

```bash
git add web/app/globals.css scripts/lint-contrast.mjs
git commit -m "feat(web): resolve the Panel Grey ramp and the type scale

DESIGN.md:36 and :56 have said '[to be resolved during implementation]'
since the seed, and that hole is why like-button reached for stock Tailwind
hexes that fail on white. Twelve grey steps and eleven sand steps, both
tinted, spaced in OKLCH L so a step near black and a step near white are
comparable. Type scale is fixed rem at ratio 1.2025.

--color-muted 4.33 -> 4.59:1, --color-rule 1.26 -> 3.17:1. Borders are
visibly heavier; that is the cost of 1.4.11 and the alternative is a
lightness step, not a dimmer border.

The linter grew two parsers it should have had: every @theme block rather
than the first, and the :root/.light rules where the component theme pairs
live and where nothing was looking."
```

---

## Task 5: `z-cn` and the nine call sites

Without this, `tailwind-merge` silently deletes every new size token.

**Files:**
- Modify: `registry/lib/z-cn/z-cn.ts` (complete replacement)
- Modify: 9 call sites across `web/`

- [ ] **Step 1: Prove the bug first**

```bash
node -e "
const { twMerge } = require('./web/node_modules/tailwind-merge');
console.log(twMerge('text-label','text-mint'));
console.log(twMerge('text-sm','text-mint'));
"
```

Expected: `text-mint` then `text-sm text-mint`. The built-in size survives; ours is deleted. `tailwind-merge` cannot read `globals.css`, so a bare `text-label` falls into its text-**colour** group and any colour class that follows removes it. Every registry component routes `className` through `zcn`, so this is the difference between the tokens working in a consumer's app and silently vanishing there.

- [ ] **Step 2: Replace `registry/lib/z-cn/z-cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge classifies `text-<x>` by shape, not by our theme. `text-sm`
 * is recognised as a size; `text-label` is not, so it lands in the text-color
 * group and the next color class deletes it. The same blindness applies to
 * our tracking and radius tokens. Registering them restores correct conflict
 * resolution.
 *
 * Any new --text-* / --tracking-* / --radius-* token added to globals.css must
 * be added here in the same commit, or it will merge as the wrong property.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['label', 'code', 'body', 'title', 'headline', 'display'] }],
      'tracking': [
        { tracking: ['label', 'label-tight', 'body', 'title', 'headline', 'display'] },
      ],
      'rounded': [{ rounded: ['panel', 'control', 'card'] }],
    },
  },
})

/**
 * Merges class names, resolving conflicting Tailwind utilities in favor of
 * the last one passed.
 *
 * Named `zcn` rather than `cn` so it never collides with the `cn` a project
 * may already have from shadcn/ui. Z-UI components always pass the consumer's
 * `className` last, which is what makes overriding a built-in utility work:
 * Tailwind resolves by source order, not specificity, so plain concatenation
 * would make overrides a coin flip.
 */
export function zcn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Verify the fix**

```bash
cd /d/ABENOR-LABS/Z-ui && node --input-type=module -e "
import { zcn } from './registry/lib/z-cn/z-cn.ts'
" 2>/dev/null || node -e "
const { extendTailwindMerge } = require('./web/node_modules/tailwind-merge');
const m = extendTailwindMerge({ extend: { classGroups: {
  'font-size': [{ text: ['label','code','body','title','headline','display'] }],
  'tracking': [{ tracking: ['label','label-tight','body','title','headline','display'] }],
  'rounded': [{ rounded: ['panel','control','card'] }],
}}});
console.log(m('text-label','text-mint'));
console.log(m('text-label','text-body'));
console.log(m('tracking-label','tracking-tight'));
console.log(m('rounded-card','rounded-full'));
"
```

Expected, in order: `text-label text-mint` · `text-body` · `tracking-tight` · `rounded-full`.

- [ ] **Step 4: Migrate the six uppercase call sites**

The repo has **nine** `text-[0.6875rem]` occurrences, not six, and they do not all take the same replacement. These six are uppercase labels. Replace `font-mono text-[0.6875rem] uppercase tracking-[0.12em]` (or `tracking-[0.14em]`) with `font-mono text-label uppercase`:

| File | Line | Note |
| --- | --- | --- |
| `web/app/page.tsx` | 21 | was `tracking-[0.14em]`, unified to 0.12em |
| `web/components/bench/bench.tsx` | 222 | |
| `web/components/bench/spring-race.tsx` | 66 | |
| `web/components/code-panel.tsx` | 51 | |
| `web/components/install-block.tsx` | 38 | |
| `web/components/install-block.tsx` | 48 | |

- [ ] **Step 5: Migrate the three NON-uppercase call sites**

These three carry no tracking and are not uppercase. A bare `text-label` would silently add 0.12em tracking and weight 500. Replace `font-mono text-[0.6875rem]` with `font-mono text-label tracking-body font-normal`:

| File | Line | Why it differs |
| --- | --- | --- |
| `web/components/code-panel.tsx` | 41 | tab labels, sentence case |
| `web/components/install-block.tsx` | 59 | note paragraph |
| `web/components/bench/spring-race.tsx` | 88 | tabular-nums `<dl>` — 0.12em would break digit alignment |

Order does not matter. The compiled `.text-label` reads `letter-spacing: var(--tw-tracking, …)` and `font-weight: var(--tw-font-weight, …)`, and the override utilities set those variables, so they win wherever they sit in the class string. The trap is omission, not order.

- [ ] **Step 6: Verify no arbitrary 11px values remain**

```bash
grep -rn "text-\[0.6875rem\]\|tracking-\[0.1" web/app web/components || echo "CLEAN"
```

Expected: `CLEAN`.

- [ ] **Step 7: Typecheck, build, commit**

```bash
pnpm typecheck
pnpm --filter @z-ui/web build
git add registry/lib/z-cn/z-cn.ts web/app/page.tsx web/components
git commit -m "fix(registry): teach zcn the theme's size tokens

twMerge('text-label','text-mint') returned 'text-mint' — the font-size
utility deleted, because tailwind-merge cannot read globals.css and files
text-label under text-colour. Every registry component routes className
through zcn, so the tokens would have vanished in consumers' apps and
worked here.

Nine call sites migrate off arbitrary values, in two groups: six uppercase
labels take text-label, three non-uppercase ones add tracking-body
font-normal so they do not silently inherit 0.12em and weight 500."
```

---

## Task 6: `like-button` icon colours — close the last red

**Files:**
- Modify: `registry/components/like-button/like-button.tsx` lines 52–59

- [ ] **Step 1: Replace `iconVariants`**

```tsx
const iconVariants = {
  // Greys ride the Panel Grey hue (OKLCH H 286) at near-zero chroma, placed
  // inside the only relative-luminance window that satisfies both grounds:
  // Y ∈ [0.10920, 0.30000]. Below 0.10920 it fails 3:1 on ink
  // (3·(Y(#0a0a0b)+0.05)−0.05); above 0.30000 it fails 3:1 on white
  // (1.05/3 − 0.05).
  'idle':           { color: '#6a6a71', fillOpacity: 0 }, // Y .1456 · 5.37:1 on #fff · 3.69:1 on #0a0a0b
  'hover':          { color: '#8f8f96', fillOpacity: 0 }, // Y .2769 · 3.21:1 on #fff · 6.16:1 on #0a0a0b
  'pressing':       { color: '#8f8f96', fillOpacity: 0 }, // Y .2769 · 3.21:1 on #fff · 6.16:1 on #0a0a0b
  'liked':          { color: '#f43f5e', fillOpacity: 1 }, // Y .2360 · 3.67:1 on #fff · 5.39:1 on #0a0a0b
  'liked-hover':    { color: '#fd576d', fillOpacity: 1 }, // Y .2880 · 3.11:1 on #fff · 6.37:1 on #0a0a0b
  'liked-pressing': { color: '#f43f5e', fillOpacity: 1 }, // Y .2360 · 3.67:1 on #fff · 5.39:1 on #0a0a0b
} satisfies Record<LikeButtonState, object>

// Measured separation between adjacent states:
//   idle -> hover          1.67:1
//   liked -> liked-hover   1.18:1   <- deliberately small; see below
//   idle -> liked          1.46:1
// The dual-ground window spans only 2.75x in luminance (0.30000 / 0.10920),
// so hover deltas cannot be large. This is legal under The Second Channel
// Rule: rootVariants already carries scale 1 -> 1.08 on hover and 1 -> 0.9 on
// press, and fillOpacity goes 0 -> 1 on like. Colour is the third channel
// here, not the first, and the component still reads with animation disabled.
```

- [ ] **Step 2: Run the full gate**

```bash
node scripts/lint-contrast.mjs
echo "exit: $?"
node scripts/lint-contrast.test.mjs
echo "exit: $?"
pnpm verify
```

Expected: contrast lint exits `0` with `contrast lint clean: N checks across 14 declared pairs and 5 registry colours`. The mutation harness's first baseline claim — "the linter fails on the real tree" — will now **break**, because the tree is clean. That is correct and expected; Step 3 fixes the harness.

- [ ] **Step 3: Update the harness baseline for a clean tree**

In `scripts/lint-contrast.test.mjs`, replace the first baseline entry:

```js
  ['the linter passes on the real tree', () => base.length === 0],
```

and replace the two baseline claims that assert against `base` content, since a clean run prints nothing. Replace:

```js
  [
    'web tokens are measured against the dark panels',
    () => base.some((l) => /^web: muted on panel is \d/.test(l)),
  ],
  [
    'registry colour is measured against a white consumer app',
    () => base.some((l) => /^like-button\/.+ on #ffffff is .+ floor for non-text/.test(l)),
  ],
```

with a single positive claim read from the clean summary line:

```js
  [
    'the linter reports a non-zero pair and colour count',
    () => {
      const out = execSync(`node ${JSON.stringify(LINTER)}`, { cwd: ROOT, stdio: 'pipe' }).toString()
      const m = out.match(/(\d+) checks across (\d+) declared pairs and (\d+) registry colours/)
      return Boolean(m) && Number(m[2]) > 0 && Number(m[3]) > 0
    },
  ],
```

- [ ] **Step 4: Re-run the harness**

```bash
node scripts/lint-contrast.test.mjs
echo "exit: $?"
```

Expected: exit `0`, `4/4 baseline claims, 10/10 mutations caught`.

- [ ] **Step 5: Commit and push — CI goes green**

```bash
git add registry/components/like-button/like-button.tsx scripts/lint-contrast.test.mjs
git commit -m "fix(like-button): icon colours that survive a white app

#a3a3a3 measured 2.52:1 on white and #fb7185 2.69:1, both under the 3:1
floor for a graphic that is the only element carrying the liked state.
They looked deliberate here because they were picked against the chassis,
where the same greys sit at 7.8:1. The CLI drops this file into someone
else's app, and our ground is not the contract.

All six states now clear 3:1 on both #ffffff and the chassis. The window
is narrow (2.75x in luminance), so hover deltas are small — legal, because
scale and fillOpacity already carry the state and colour is the third
channel here, not the first."
git push
```

Expected: `verify` green on the pull request.

---

## Task 7: Load the fonts

**Files:**
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css` (the two `--font-*` lines)

- [ ] **Step 1: Prove nothing is loaded today**

```bash
grep -rn "next/font\|@font-face" web/app web/components || echo "NO FONT LOADING"
find web/public web/app -type f \( -name "*.woff*" -o -name "*.ttf" -o -name "*.otf" \) | head
```

Expected: `NO FONT LOADING`, and no font files. `--font-sans: 'Inter var'` names a family that is not installed on any machine, so both stacks fall through — sans to `system-ui`, mono to Consolas on Windows.

- [ ] **Step 2: Add the `next/font` declarations**

At the top of `web/app/layout.tsx`, replace the imports and add both declarations:

```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

/**
 * Both faces are downloaded at build time and served from this origin. The
 * browser never talks to Google.
 *
 * `display: 'optional'` rather than 'swap' is the thesis showing up in a
 * config value. 'swap' has an unbounded swap period: the fallback paints, and
 * whenever the real face lands — 200ms later, or 4s later on a bad connection
 * — every glyph on the page repaints. Nobody touched anything. 'optional'
 * gives the font roughly 100ms, and if it misses, commits to the
 * metric-matched fallback for the rest of that pageview. The first paint is
 * the only paint. The font is still in the HTTP cache for the next
 * navigation, so a miss costs one pageview, not a session.
 *
 * `adjustFontFallback` is left at its default (true). It is what emits the
 * `size-adjust` / `ascent-override` fallback face, so the fallback occupies
 * exactly the boxes the real face would. Turning it off reintroduces reflow
 * and nothing in the UI would look wrong until it did.
 *
 * `weight` is deliberately absent. Omitting it selects the variable face and
 * next/font derives the axis range from Google's metadata. A range string like
 * '100 900' is next/font/local syntax and throws here. The variable face also
 * matters for the scale: --text-title/-headline/-display set weights 550/600/
 * 620, which only render as specified against a variable font.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-jetbrains-mono',
})
```

`subsets` is required, not optional. With `preload` at its default and `subsets` absent, `next/font` calls `nextFontError('Preload is enabled but no subsets were specified')` and the **build fails** — it does not warn.

- [ ] **Step 3: Put the variables on `<html>`**

The variable classes must land on `<html>`, because that is `:root` — the same element Tailwind declares theme variables on.

```tsx
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
```

- [ ] **Step 4: Point the theme at the variables**

In `web/app/globals.css`, inside the `@theme inline` block, the two font lines read:

```css
  /* next/font owns the family names; these two vars are the only handoff.
     Each already ends in its own metric-matched fallback face, so the entries
     after it are for the case where the CSS loads and the font files do not.
     Never name Inter or JetBrains Mono directly here — a bare family name
     reaches only the first entry of the two-entry stack and silently drops
     the metric-matched face, reintroducing the reflow this exists to prevent. */
  --font-sans: var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
```

Write **no** `@font-face` rules. `next/font` emits them automatically, into its own stylesheet, because `adjustFontFallback` defaults to true. What lands in the build:

```css
@font-face{font-family:Inter Fallback;src:local(Arial);ascent-override:90.44%;descent-override:22.52%;line-gap-override:0.0%;size-adjust:107.12%}
@font-face{font-family:JetBrains Mono Fallback;src:local(Arial);ascent-override:75.79%;descent-override:22.29%;line-gap-override:0.0%;size-adjust:134.59%}
```

and the variables become two-entry stacks: `--font-inter: "Inter", "Inter Fallback"`.

Those percentages come from Next's bundled Capsize table (`next/dist/server/capsize-font-metrics.json`, consumed by `calculateSizeAdjustValues()`): Inter `xWidthAvg 978 / unitsPerEm 2048 = 0.477539`, Arial `913 / 2048 = 0.445801`, so `sizeAdjust = 1.071193 → 107.12%` and `ascent = 1984 / (2048 × 1.071193) = 0.904360 → 90.44%`.

- [ ] **Step 5: Build and verify the fonts actually ship**

```bash
pnpm --filter @z-ui/web build
grep -ro "@font-face{font-family:Inter" web/.next/static/chunks/ | head -1
grep -ro "size-adjust:107.12%" web/.next/static/chunks/ | head -1
```

Expected: both greps match. If they do not, `adjustFontFallback` was disabled or `subsets` was dropped.

- [ ] **Step 6: Commit**

```bash
pnpm verify
git add web/app/layout.tsx web/app/globals.css
git commit -m "feat(web): actually load the fonts the design system names

globals.css has named 'Inter var' since the showcase landed. That family
is not installed on any machine, so every label, every spring value and
every prop name has been rendering in the visitor's OS default — the mono
stack falling to Consolas on Windows. DESIGN.md:52 calls JetBrains Mono
the panel's silkscreen; it has been Consolas.

display: 'optional' rather than 'swap', because swap's unbounded period
repaints every glyph on the page whenever the face lands, and this is a
site whose thesis is that nothing moves unless touched. A miss costs one
pageview. next/font emits the metric-matched fallback faces itself, so
there is no reflow either way."
```

---

## Task 8: The font lint — keep it from recurring

A named-but-unloaded family is invisible until someone looks. Two rules make it a build failure.

**Files:**
- Create: `scripts/lint-site.mjs`
- Create: `scripts/lint-site.test.mjs`
- Modify: `package.json`, `.github/workflows/ci.yml`

- [ ] **Step 1: Write the linter**

Create `scripts/lint-site.mjs`:

```js
/**
 * Site lint. The registry has a linter; the surface that sells it does not,
 * and every finding below passed CI for as long as the showcase has existed.
 *
 * Rules are numbered so a mutation test can assert WHICH rule fired. A
 * mutation caught by the wrong rule is a hole in the suite wearing a pass.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n')

const failures = []
let checks = 0
const check = (ok, rule, msg) => {
  checks++
  if (!ok) failures.push(`[${rule}] ${msg}`)
  return ok
}

const css = read('web/app/globals.css')
const layout = read('web/app/layout.tsx')

// Families next/font loads, and the CSS variable each one exposes.
const loaded = new Map()
for (const m of layout.matchAll(
  /const\s+\w+\s*=\s*(\w+)\(\{([\s\S]*?)\}\)/g,
)) {
  const family = m[1].replace(/_/g, ' ')
  const variable = m[2].match(/variable:\s*'(--[\w-]+)'/)?.[1]
  const subsets = /subsets:\s*\[/.test(m[2])
  loaded.set(family.toLowerCase(), { variable, subsets, family })
}

check(
  loaded.size > 0,
  'FONT-1',
  'no next/font call found in web/app/layout.tsx; every family named in @theme would fall through to a system default',
)

// FONT-2: every loaded family declares subsets, or the build throws.
for (const [, f] of loaded) {
  check(
    f.subsets,
    'FONT-2',
    `${f.family} omits subsets; next/font throws "Preload is enabled but no subsets were specified" and the build fails`,
  )
  check(
    f.variable,
    'FONT-3',
    `${f.family} declares no variable; @theme has no handle to reference it by`,
  )
}

// FONT-4: the variable classes must reach :root, or @theme cannot see them.
for (const [, f] of loaded) {
  if (!f.variable) continue
  check(
    /<html[^>]*className=\{[^}]*\.variable/.test(layout),
    'FONT-4',
    `${f.family}'s variable class is not applied to <html>; the custom property never lands on :root where @theme reads it`,
  )
}

// FONT-5: every --font-* token must reference a loaded family's variable.
const fontTokens = [...css.matchAll(/--font-([\w-]+):\s*([^;]+);/g)].filter(
  (m) => !m[1].startsWith('inter') && !m[1].startsWith('jetbrains'),
)
for (const m of fontTokens) {
  const value = m[2]
  const referenced = [...loaded.values()].some(
    (f) => f.variable && value.includes(`var(${f.variable})`),
  )
  check(
    referenced,
    'FONT-5',
    `--font-${m[1]} references no next/font variable; it names families nothing loads`,
  )
}

// FONT-6: a loaded family must be reached through its var(), never by name.
// A bare family name reaches only the first entry of next/font's two-entry
// stack ("Inter", "Inter Fallback") and silently drops the metric-matched
// fallback face — which passes every rule above while reintroducing reflow.
for (const m of fontTokens) {
  for (const [key, f] of loaded) {
    const named = new RegExp(`['"]${f.family}['"]`, 'i').test(m[2])
    check(
      !named,
      'FONT-6',
      `--font-${m[1]} names "${f.family}" directly; use var(${f.variable}) so the metric-matched fallback face is reached`,
    )
  }
}

// FONT-7: every --font-* token must actually be used.
for (const m of fontTokens) {
  const token = `--font-${m[1]}`
  check(
    css.split(token).length > 2,
    'FONT-7',
    `${token} is declared and never referenced; a font token nothing uses is a font nobody sees`,
  )
}

if (failures.length) {
  console.error(`\nsite lint: ${failures.length} failure(s) across ${checks} checks\n`)
  for (const f of failures) console.error(`  ${f}`)
  console.error('')
  process.exit(1)
}
console.log(`site lint clean: ${checks} checks across ${loaded.size} loaded families`)
```

- [ ] **Step 2: Run it against the fixed tree**

```bash
node scripts/lint-site.mjs
echo "exit: $?"
```

Expected: exit `0`, `site lint clean: N checks across 2 loaded families`.

- [ ] **Step 3: Write the mutation harness**

Create `scripts/lint-site.test.mjs`:

```js
/**
 * Mutation harness for the site lint.
 *
 * Every case names the RULE ID that must catch it. A mutation caught by a
 * different rule prints WRONG-RULE and fails the run — without that, a loud
 * rule absorbs a quiet one's case and the quiet rule is never exercised.
 *
 * Restores on three paths, not one: `finally` covers a throw, but Node's
 * default signal handling terminates without unwinding, so Ctrl-C would
 * otherwise strand a rewritten layout.tsx.
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LINTER = join(ROOT, 'scripts', 'lint-site.mjs')

const CSS = 'web/app/globals.css'
const LAYOUT = 'web/app/layout.tsx'
const FILES = [CSS, LAYOUT]
const abs = (f) => join(ROOT, f)

const orig = Object.fromEntries(FILES.map((f) => [f, readFileSync(abs(f), 'utf8')]))
const restore = () => {
  for (const f of FILES) writeFileSync(abs(f), orig[f])
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  try {
    process.on(sig, () => {
      restore()
      process.exit(130)
    })
  } catch {
    // Not every signal exists on every platform.
  }
}
process.on('uncaughtException', (e) => {
  restore()
  console.error(e)
  process.exit(1)
})

const edit = (file, from, to) => {
  const next = orig[file].replace(from, () => to)
  const shown = from instanceof RegExp ? String(from) : JSON.stringify(from)
  if (next === orig[file]) throw new Error(`anchor not in ${file}: ${shown}`)
  writeFileSync(abs(file), next)
}

const run = () => {
  try {
    execSync(`node ${JSON.stringify(LINTER)}`, { cwd: ROOT, stdio: 'pipe' }).toString()
    return []
  } catch (e) {
    return ((e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? ''))
      .split('\n')
      .filter((l) => /^\s+\[FONT-\d/.test(l))
      .map((l) => l.trim())
  }
}

const baseline = run()
if (baseline.length) {
  console.error('baseline is not clean; fix the tree before running the harness')
  for (const l of baseline) console.error(`  ${l}`)
  process.exit(1)
}
console.log('  HOLDS   the site lint passes on the real tree')

// [name, ruleId, mutate]
const mutations = [
  ['no next/font call at all', 'FONT-1', () =>
    edit(LAYOUT, /const inter = Inter\(\{[\s\S]*?\}\)/, 'const inter = { variable: "" }')],

  ['subsets dropped', 'FONT-2', () =>
    edit(LAYOUT, "  subsets: ['latin'],\n  display: 'optional',\n  variable: '--font-inter',", "  display: 'optional',\n  variable: '--font-inter',")],

  ['variable dropped', 'FONT-3', () =>
    edit(LAYOUT, "  variable: '--font-inter',\n", '')],

  ['variable class not on <html>', 'FONT-4', () =>
    edit(LAYOUT, /className=\{`\$\{inter\.variable\}[^`]*`\}/, 'lang="en"')],

  ['font token references nothing loaded', 'FONT-5', () =>
    edit(CSS, '--font-sans: var(--font-inter)', "--font-sans: 'Helvetica'")],

  ['family named directly instead of via var()', 'FONT-6', () =>
    edit(CSS, '--font-mono: var(--font-jetbrains-mono),', "--font-mono: 'JetBrains Mono', var(--font-jetbrains-mono),")],

  ['declared font token never used', 'FONT-7', () =>
    edit(CSS, '  --font-sans: var(--font-inter)', '  --font-unused: var(--font-inter), sans-serif;\n  --font-sans: var(--font-inter)')],
]

let caught = 0
for (const [name, rule, mutate] of mutations) {
  let ok = false
  let detail = ''
  try {
    mutate()
    const got = run()
    const hit = got.find((l) => l.startsWith(`[${rule}]`))
    const other = got.find((l) => !l.startsWith(`[${rule}]`))
    ok = Boolean(hit)
    detail = hit ?? (other ? `WRONG-RULE: ${other}` : `nothing fired; expected ${rule}`)
  } catch (e) {
    detail = `harness: ${e.message}`
  } finally {
    restore()
  }
  console.log(`${ok ? '  CAUGHT ' : '  MISSED '} ${name} (${rule})`)
  console.log(`           ${detail.slice(0, 118)}`)
  if (ok) caught++
}

console.log(`\n${caught}/${mutations.length} mutations caught by the expected rule`)
process.exit(caught === mutations.length ? 0 : 1)
```

- [ ] **Step 4: Run the harness**

```bash
node scripts/lint-site.test.mjs
echo "exit: $?"
```

Expected: exit `0`, `7/7 mutations caught by the expected rule`.

- [ ] **Step 5: Wire into `verify` and CI**

In `package.json` `scripts`:

```json
"lint:site": "node scripts/lint-site.mjs",
"lint:site:test": "node scripts/lint-site.test.mjs"
```

Add both to the `verify` chain. In `.github/workflows/ci.yml`, after the contrast steps:

```yaml
      # A family named in @theme and loaded by nothing renders as the
      # visitor's OS default, and looks fine in a screenshot.
      - name: Lint site
        run: pnpm lint:site

      - name: Lint the site linter
        run: pnpm lint:site:test
```

- [ ] **Step 6: Delete the checkbox this gate replaces**

Per the operating model spec §3, every checkbox that becomes an automated gate leaves `.github/pull_request_template.md`. Remove any line asserting fonts or contrast were checked by eye.

- [ ] **Step 7: Commit and open the pull request**

```bash
pnpm verify
git add scripts/lint-site.mjs scripts/lint-site.test.mjs package.json .github/workflows/ci.yml .github/pull_request_template.md
git commit -m "test: gate the font loading that just got fixed

Seven rules, each with a mutation asserting that RULE fires — not just
that something did. FONT-6 is the one worth having: a bare family name
passes every other rule while reaching only the first entry of next/font's
two-entry stack, dropping the metric-matched fallback and silently
reintroducing the reflow.

The template loses the checkbox this replaces. The manual list only ever
shrinks."
git push
gh pr create --fill --base main
```

---

## Definition of done

- [ ] `main` is protected, requires `verify`, and carries all six landed pull requests
- [ ] `README.md` describes the tree that exists
- [ ] `pnpm verify` runs typecheck, registry lint, registry lint test, generator drift, contrast lint, contrast lint test, site lint, site lint test, and the web build — all green
- [ ] `node scripts/lint-contrast.mjs` exits 0 with a non-zero pair and colour count
- [ ] `node scripts/lint-contrast.test.mjs` reports 10/10 mutations caught
- [ ] `node scripts/lint-site.test.mjs` reports 7/7 caught by the expected rule
- [ ] `grep -rn "text-\[0.6875rem\]" web/` returns nothing
- [ ] `DESIGN.md` no longer contains `[to be resolved during implementation]` for the ramp or the type scale — update both sections to the shipped values
- [ ] The built CSS contains `@font-face{font-family:Inter Fallback` and `size-adjust:107.12%`

---

## Appendix A — `scripts/lint-contrast.mjs`

Write this file verbatim. It is long and it is not summarisable: every guard exists to prevent a specific silent pass.

**One detail that must not be "cleaned up":** the registry scan collects *spans*, not a set of hex strings. A set would let `const SHADOW = '#f43f5e'` pass simply because `#f43f5e` also appears inside `iconVariants` — the one easy way to smuggle a colour past this lint, and the case mutation 9 exists to prove.

```js
/**
 * Contrast lint.
 *
 * Colour in this repo is shipped, not rendered. A contrast mistake in a
 * registry component is not a mistake on our site, it is a mistake in every
 * project that ran `add`, and it arrives there as a file we can no longer
 * touch. So this is CI rather than a review note. Every rule below is a scar:
 *
 *   - `iconVariants` was picked against the ink chassis, where #a3a3a3 sits at
 *     7.8:1 and looks deliberate. The CLI drops that same file into a white
 *     app, where it is 2.5:1 and the unliked heart is nearly gone. Registry
 *     colour is therefore checked against a light surface too. Our ground is
 *     not the contract.
 *   - `--color-muted` is the colour of every label and every description on the
 *     site, and it misses 4.5:1 on all three panels. Nothing caught it because
 *     nothing looked.
 *   - A contrast linter that parses nothing passes everything, which is the
 *     worst failure mode available to it: green, and lying. Hence the guards
 *     that fail when the @theme block does not match, when a token has no
 *     declared pair, when the dark surface token goes missing, and when a hex
 *     sits somewhere no state can be attributed to it.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = join(ROOT, 'registry')
const GLOBALS = join(ROOT, 'web', 'app', 'globals.css')
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const json = (p) => JSON.parse(read(p))
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/')

const failures = []
const fail = (where, msg) => failures.push({ where, msg })
let checks = 0
let registryColours = 0
const check = (ok, where, msg) => {
  checks++
  if (!ok) fail(where, msg)
  return ok
}

// ---- report --------------------------------------------------------------
// A function rather than a tail block, because the parser guards below have to
// be able to give up: with no tokens there is nothing left to say, and forty
// cascading messages would bury the one that matters.
const report = () => {
  if (failures.length) {
    console.error(`\ncontrast lint: ${failures.length} failure(s) across ${checks} checks\n`)
    for (const f of failures) console.error(`  ${f.where}: ${f.msg}`)
    console.error('')
    process.exit(1)
  }
  console.log(
    `contrast lint clean: ${checks} checks across ${PAIRS.length} declared pairs and ${registryColours} registry colours`,
  )
  process.exit(0)
}

// ---- colour maths --------------------------------------------------------
/**
 * WCAG 2.x, transcribed rather than approximated.
 *
 * The two numbers people get wrong are both here. The linearisation threshold
 * is 0.03928, not 0.04045: 0.04045 is the mathematically consistent value and
 * the sRGB standard's, but WCAG 2.x prints 0.03928 and every conforming
 * checker uses it, so a ratio computed the "correct" way disagrees with the
 * tool an auditor will run. The exponent is 2.4 applied after the
 * (c + 0.055) / 1.055 offset, not a bare 2.2 gamma; using 2.2 shifts mid greys
 * by enough to move a 4.4 across the line.
 */
const LIN = (v) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]) => 0.2126 * LIN(r) + 0.7152 * LIN(g) + 0.0722 * LIN(b)

const HEX = /^#([0-9a-fA-F]{3,8})$/
const parse = (hex) => {
  const m = HEX.exec(hex)
  if (!m) return null
  const h = m[1].length <= 4 ? [...m[1]].map((c) => c + c).join('') : m[1]
  if (h.length !== 6 && h.length !== 8) return null
  const at = (i) => parseInt(h.slice(i, i + 2), 16)
  return { rgb: [at(0), at(2), at(4)], a: h.length === 8 ? at(6) / 255 : 1 }
}

/**
 * Contrast is defined between two opaque colours, so a translucent foreground
 * is composited over its surface first. Without this an #rrggbbaa would report
 * the ratio of its fully-opaque form, which is the flattering answer.
 */
const ratio = (fgHex, bgHex) => {
  const fg = parse(fgHex)
  const bg = parse(bgHex)
  const composited = fg.rgb.map((v, i) => v * fg.a + bg.rgb[i] * (1 - fg.a))
  const [hi, lo] = [luminance(composited), luminance(bg.rgb)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}
const fmt = (r) => `${r.toFixed(2)}:1`

// 1.4.3 for text, 1.4.11 for anything else that carries meaning: an icon, a
// focus ring, the border that tells you a chip is a control.
const FLOOR = { text: 4.5, ui: 3 }
const NOUN = { text: 'text', ui: 'non-text' }

/**
 * Scope split.
 *
 * web/ is checked against dark surfaces only. globals.css sets
 * `color-scheme: dark` and paints chassis onto html; there is no light theme
 * for these tokens to be wrong in, and inventing one would generate failures
 * for a rendering that does not exist and cannot be fixed.
 *
 * registry/ gets both, because the registry's entire premise is that the file
 * leaves here. The dark surface is the chassis token read from globals.css,
 * since that is where these components are actually demonstrated. The light
 * surface is a literal #ffffff, deliberately not read from any file in this
 * repo: a consumer's background is not ours to know, and white is the floor
 * case that a default Tailwind app lands on.
 */
const LIGHT_CONSUMER = '#ffffff'

/**
 * Which pairs are real.
 *
 * Seven tokens make 42 ordered pairs, of which about a dozen ever render
 * together. Checking the product would fail on combinations nobody writes, and
 * the standard response to a linter that cries wolf is to lower its
 * thresholds, which is worse than not having one.
 *
 * So this list is declared by hand, and it is worth being plain about why
 * inference was not an option rather than implying the tool is cleverer than
 * it is. A foreground and its background meet in the rendered DOM, not in one
 * file. `text-muted` in catalog-card.tsx lands on a `bg-panel` set by the
 * card's own root; `.lbl` sets a colour from CSS with no utility anywhere;
 * code-panel.tsx chooses between `text-mint` and `text-muted` inside a
 * ternary. Resolving those statically means evaluating the component tree,
 * which is a renderer, not a linter.
 *
 * What *is* inferable is whether the list is complete, and that is what the
 * four completeness rules at the bottom of this file do. A declared list is
 * only trustworthy when forgetting to declare is itself a failure.
 *
 * `kind: 'decorative'` is an exemption, not a pass, and it costs a `why`.
 */
const PAIRS = [
  // --- the page ground ---------------------------------------------------
  { fg: 'silkscreen', bg: 'chassis', kind: 'text', role: 'body copy and headings' },
  { fg: 'muted', bg: 'chassis', kind: 'text', role: 'lbl labels, lead paragraphs, footer' },
  { fg: 'mint', bg: 'chassis', kind: 'text', role: 'brandmark, CTA label' },
  { fg: 'mint', bg: 'chassis', kind: 'ui', role: 'CTA border, focus ring' },
  {
    fg: 'rule',
    bg: 'chassis',
    kind: 'decorative',
    role: 'section rules and the header underline',
    why: '1.4.11 exempts boundaries that carry no information; these separate sections that whitespace already separates, and removing them loses nothing but taste',
  },

  // --- panels: catalog cards, bench, code, install ------------------------
  { fg: 'silkscreen', bg: 'panel', kind: 'text', role: 'component names, inline code, readouts' },
  { fg: 'muted', bg: 'panel', kind: 'text', role: 'descriptions, lbl, inactive tab labels' },
  { fg: 'mint', bg: 'panel', kind: 'text', role: 'data-state readout, active tab, selector column' },
  { fg: 'mint', bg: 'panel', kind: 'ui', role: 'active chip border, lit indicator dot' },
  { fg: 'muted', bg: 'panel', kind: 'ui', role: 'card hover border, chip hover border' },
  {
    fg: 'rule',
    bg: 'panel',
    kind: 'ui',
    // Not decorative, and this is the distinction the whole kind field exists
    // for: the same colour draws the table rules (which are) and the resting
    // chip border and the unlit indicator dot (which are not). A chip border
    // is the only thing saying that chip is a control.
    role: 'resting chip border, unlit indicator dot',
  },

  // --- panel-2 -----------------------------------------------------------
  // Declared ahead of first use so the token is covered by rule A, and so the
  // first use is vetted before it is written rather than after someone notices.
  { fg: 'silkscreen', bg: 'panel-2', kind: 'text', role: 'declared ahead of first use' },
  { fg: 'muted', bg: 'panel-2', kind: 'text', role: 'declared ahead of first use' },

  // --- control (the hover step) ------------------------------------------
  { fg: 'silkscreen', bg: 'control', kind: 'text', role: 'label inside a hovered control' },
  { fg: 'muted', bg: 'control', kind: 'text', role: 'secondary label, hovered' },
  { fg: 'rule', bg: 'control', kind: 'ui', role: 'control boundary at hover' },

  // --- mint as a fill ----------------------------------------------------
  // hover:bg-mint hover:text-chassis on the CTA, and ::selection. Mint is a
  // surface here, which is why the dark-only rule above is about the absence
  // of a light theme and not about refusing bright surfaces that exist.
  { fg: 'chassis', bg: 'mint', kind: 'text', role: 'CTA label on hover fill, ::selection' },
]

// ---- tokens --------------------------------------------------------------
const css = read(GLOBALS)
// Tailwind v4 allows several @theme blocks and several modifiers (`inline`,
// `static`, `reference`). Matching only the first silently halves the token
// set, and a linter that checks half of what it claims to is worse than one
// that fails loudly.
const themeBlocks = [...css.matchAll(/@theme[^{]*\{([\s\S]*?)\n\}/g)]
if (
  !check(
    themeBlocks.length > 0,
    rel(GLOBALS),
    'no @theme block matched; the token parser would silently check nothing',
  )
) {
  report()
}

const tokens = new Map()
for (const block of themeBlocks) {
  for (const m of block[1].matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens.set(m[1], m[2])
  }
}
if (!check(tokens.size > 0, rel(GLOBALS), 'no --color-* tokens found inside @theme')) report()

/**
 * Ramp steps are palette, not colour-in-use. A step becomes a real colour only
 * when a semantic token points at it, and it is the semantic token that carries
 * a contrast story. Demanding a declared pair per step would mean 23 entries
 * describing combinations nobody writes.
 *
 * The exemption is not free. A ramp step referenced by nothing is dead weight
 * that will eventually get reached for precisely because it is there, so every
 * step must be cited by a semantic token or deleted.
 */
const RAMP = /^(grey|sand)-\d+$/
const semanticValues = new Set()
for (const [name, hex] of tokens) if (!RAMP.test(name)) semanticValues.add(hex.toLowerCase())
for (const m of css.matchAll(/--z-[\w-]+:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  semanticValues.add(m[1].toLowerCase())
}
for (const [name, hex] of tokens) {
  if (!RAMP.test(name)) continue
  check(
    semanticValues.has(hex.toLowerCase()),
    rel(GLOBALS),
    `--color-${name} (${hex}) is a ramp step no semantic token points at; cite it or delete it`,
  )
}

// ---- rule C: no pair may name a token that is not there -------------------
// Runs first because a renamed token otherwise surfaces as a crash in the
// maths instead of a sentence about the rename.
const live = PAIRS.filter((p) => {
  const missing = [p.fg, p.bg].filter((t) => !tokens.has(t))
  const ok = check(
    missing.length === 0,
    'PAIRS',
    `pair "${p.fg} on ${p.bg}" names unknown token "${missing[0]}"; the pair is stale or the token was renamed`,
  )
  if (p.kind === 'decorative') {
    check(
      typeof p.why === 'string' && p.why.length > 0,
      'PAIRS',
      `pair "${p.fg} on ${p.bg}" is decorative but says nothing about why 1.4.11 does not apply`,
    )
  }
  return ok
})

// ---- web: declared pairs, dark surfaces only ------------------------------
for (const p of live) {
  if (p.kind === 'decorative') continue
  const fg = tokens.get(p.fg)
  const bg = tokens.get(p.bg)
  const r = ratio(fg, bg)
  check(
    r >= FLOOR[p.kind],
    'web',
    `${p.fg} on ${p.bg} is ${fmt(r)}, below the ${FLOOR[p.kind]}:1 floor for ${NOUN[p.kind]} (${fg} on ${bg}) — ${p.role}`,
  )
}

// ---- theme pairs: the tokens registry components actually consume ---------
/**
 * `--z-*` are declared in :root and .light, not in @theme, because @theme
 * cannot be nested in a class and the switch has to live somewhere. That puts
 * them outside every parser above, which meant the one decision the spec is
 * loudest about — components ship light AND dark — was enforced by nothing.
 *
 * Each theme is measured independently. A pair that passes in dark and fails
 * in light is a failure: the file leaves here and lands in an app whose
 * background is not ours to choose.
 */
const THEME_PAIRS = [
  { fg: 'fg', bg: 'bg', kind: 'text', role: 'component body text' },
  { fg: 'fg', bg: 'panel', kind: 'text', role: 'component text on a panel' },
  { fg: 'fg', bg: 'fill', kind: 'text', role: 'label inside a control' },
  { fg: 'fg', bg: 'fill-hover', kind: 'text', role: 'label inside a hovered control' },
  { fg: 'fg-muted', bg: 'bg', kind: 'text', role: 'secondary text' },
  { fg: 'fg-muted', bg: 'panel', kind: 'text', role: 'secondary text on a panel' },
  { fg: 'fg-muted', bg: 'fill', kind: 'text', role: 'secondary text in a control' },
  { fg: 'fg-muted', bg: 'fill-hover', kind: 'text', role: 'secondary text, hovered' },
  { fg: 'border', bg: 'bg', kind: 'ui', role: 'control boundary on the ground' },
  { fg: 'border', bg: 'panel', kind: 'ui', role: 'control boundary on a panel' },
  { fg: 'border', bg: 'fill', kind: 'ui', role: 'control boundary on a control' },
  { fg: 'border', bg: 'fill-hover', kind: 'ui', role: 'control boundary, hovered' },
  { fg: 'signal', bg: 'bg', kind: 'ui', role: 'the moving part' },
  { fg: 'on-signal', bg: 'signal', kind: 'text', role: 'glyph inside a filled indicator' },
  { fg: 'focus', bg: 'bg', kind: 'ui', role: 'focus ring' },
]

const themeRule = (selector) => {
  const m = css.match(new RegExp(`${selector}[^{]*\\{([\\s\\S]*?)\\n\\}`))
  if (!m) return null
  const out = new Map()
  for (const t of m[1].matchAll(/--z-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out.set(t[1], t[2])
  return out
}

for (const [selector, label] of [
  [':root', 'dark'],
  ['\\.light', 'light'],
]) {
  const theme = themeRule(selector)
  if (
    !check(
      theme && theme.size > 0,
      rel(GLOBALS),
      `no --z-* tokens found in ${label}; component theme pairs are unchecked`,
    )
  ) {
    continue
  }
  for (const p of THEME_PAIRS) {
    const fg = theme.get(p.fg)
    const bg = theme.get(p.bg)
    if (
      !check(
        fg && bg,
        rel(GLOBALS),
        `${label}: pair "${p.fg} on ${p.bg}" names a --z-* token that is not declared`,
      )
    ) {
      continue
    }
    const r = ratio(fg, bg)
    check(
      r >= FLOOR[p.kind],
      `theme:${label}`,
      `${p.fg} on ${p.bg} is ${fmt(r)}, below the ${FLOOR[p.kind]}:1 floor for ${NOUN[p.kind]} (${fg} on ${bg}) — ${p.role}`,
    )
  }
}

// ---- registry: literal hexes, both surfaces -------------------------------
/**
 * Registry colour lives in the variant objects, which is exactly where it
 * should live and also the only place the parser can attribute it to a state.
 * Same regex lint-registry uses, so the two agree on what a variants object
 * is; if that shape ever changes, both fail together rather than one drifting
 * quietly into checking nothing.
 *
 * Everything here is measured at the 3:1 non-text floor. These values animate
 * SVG fill and stroke, which 1.4.11 covers. If a component ever animates the
 * colour of actual text, it goes in REGISTRY_TEXT and gets 4.5:1 — a declared
 * exception, listed, rather than a guess made from a property name the parser
 * cannot see the element for.
 */
const REGISTRY_TEXT = new Set()

/**
 * The dark surface is the one token this file consumes by name rather than
 * through PAIRS, so rule C does not cover it. Renaming `--color-chassis`
 * therefore used to put `undefined` into `surfaces` and kill the run with a
 * TypeError out of `ratio`, which is precisely the "crash in the maths instead
 * of a sentence about the rename" that rule C exists to prevent.
 *
 * Non-fatal on purpose. Losing the dark surface costs one of two registry
 * measurements; it does not invalidate the web pairs or rules A, B and D, and
 * a linter that gives up early hides the other findings a rename produces.
 */
const CHASSIS = tokens.get('chassis')
check(
  CHASSIS,
  rel(GLOBALS),
  '--color-chassis is not declared in @theme, so registry colour has no dark surface to be measured against; the registry check is running against the light surface alone',
)

const surfaces = [
  [LIGHT_CONSUMER, 'a white consumer app'],
  ...(CHASSIS ? [[CHASSIS, 'the Z-UI chassis']] : []),
]

const index = json(join(REGISTRY, 'registry.json'))
for (const entry of index.items) {
  const dir = join(REGISTRY, entry.path)
  const manifestPath = join(dir, 'component.json')
  // A missing manifest is lint-registry's failure to report, not this one's.
  if (!existsSync(manifestPath)) continue
  const manifest = json(manifestPath)

  for (const f of manifest.files ?? []) {
    const path = join(dir, f.path)
    if (!existsSync(path)) continue
    const src = read(path)
    const at = `${entry.name}/${f.path}`

    // Spans, not a set of hex strings. A set would let `const SHADOW = '#f43f5e'`
    // pass simply because #f43f5e also appears inside iconVariants, which is
    // the one case where smuggling a colour past this lint would be easy.
    const attributed = []
    for (const block of src.matchAll(/const (\w*[Vv]ariants) = \{([\s\S]*?)\n\} satisfies/g)) {
      attributed.push([block.index, block.index + block[0].length])
      // hex -> the states that use it, so the message names the state a
      // designer would look for rather than a line number they would not.
      const uses = new Map()
      let state = '?'
      for (const line of block[2].split('\n')) {
        state = line.match(/^ {2}'([^']+)':/)?.[1] ?? state
        for (const h of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
          if (!uses.has(h[0])) uses.set(h[0], [])
          if (!uses.get(h[0]).includes(state)) uses.get(h[0]).push(state)
        }
      }

      for (const [hex, states] of uses) {
        const kind = REGISTRY_TEXT.has(hex) ? 'text' : 'ui'
        if (!check(parse(hex), at, `${block[1]} has unparseable colour "${hex}"`)) continue
        registryColours++
        for (const [surface, label] of surfaces) {
          const r = ratio(hex, surface)
          check(
            r >= FLOOR[kind],
            at,
            `${block[1]} ${hex} (${states.join(', ')}) on ${surface} is ${fmt(r)}, below the ${FLOOR[kind]}:1 floor for ${NOUN[kind]} — ${label}`,
          )
        }
      }
    }

    // ---- rule D: nothing may hide outside a variants object ---------------
    for (const h of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      check(
        attributed.some(([s, e]) => h.index >= s && h.index < e),
        at,
        `hex "${h[0]}" sits outside a variants object, where no state can be attributed to it and this lint cannot see it; move it into the variants object`,
      )
    }
  }
}

// ---- usage: what web/ actually paints -------------------------------------
/**
 * Only app/ and components/ are walked. web/__generated__ inlines registry
 * source as string literals, so scanning it would report like-button's hexes
 * as site usage and every message would name the wrong file.
 */
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p)
  }
  return out
}
const SOURCES = [join(ROOT, 'web', 'app'), join(ROOT, 'web', 'components')].flatMap((d) => walk(d))

// Longest name first so `bg-panel-2` cannot be read as `bg-panel`, and a
// trailing guard so it cannot be read the other way either. The prefix class
// covers `!text-mint` and `hover:border-mint`.
const NAMES = [...tokens.keys()].sort((a, b) => b.length - a.length).join('|')
const UTIL = new RegExp(`(?:^|[\\s"'\`!:{(+])(text|bg|border)-(${NAMES})(?![\\w-])`, 'g')
// `.lbl` sets a colour with no utility at all, and the focus ring is drawn in
// CSS. Both are real usage; neither is a Tailwind class.
const VAR = /(?:^|[;{\s])(color|background|outline|border)[\w-]*:\s*[^;]*var\(--color-([\w-]+)\)/gm

// role -> tokens seen in it, with the first file that used each, for messages.
const used = { text: new Map(), ui: new Map(), surface: new Map() }
const note = (role, token, file) => {
  if (!used[role].has(token)) used[role].set(token, file)
}

for (const path of SOURCES) {
  const src = read(path)
  const file = rel(path)
  for (const m of src.matchAll(UTIL)) {
    const role = m[1] === 'text' ? 'text' : m[1] === 'border' ? 'ui' : 'surface'
    note(role, m[2], file)
  }
  for (const m of src.matchAll(VAR)) {
    const role = m[1] === 'color' ? 'text' : m[1] === 'background' ? 'surface' : 'ui'
    note(role, m[2], file)
  }
}

// ---- rule B: every used utility resolves to a declared pair ---------------
// `text-` and `border-` say unambiguously that the token is a foreground, so
// they demand a pair in that role. `bg-` does not: it is a surface on a card
// and a graphic on a 6px indicator dot, and nothing in the source distinguishes
// those. So `bg-` asks only that the token appear somewhere in the list, and
// says so rather than pretending to a precision it has not got.
for (const [token, file] of used.text) {
  check(
    live.some((p) => p.fg === token && p.kind === 'text'),
    file,
    `"text-${token}" is used here but "${token}" is the foreground of no declared text pair`,
  )
}
for (const [token, file] of used.ui) {
  check(
    live.some((p) => p.fg === token),
    file,
    `"${token}" is drawn as a border or outline here but is the foreground of no declared pair`,
  )
}
for (const [token, file] of used.surface) {
  check(
    live.some((p) => p.bg === token || p.fg === token),
    file,
    `"bg-${token}" is used here but "${token}" appears in no declared pair, in either role`,
  )
}

// ---- rule A: no token escapes review --------------------------------------
for (const [token, hex] of tokens) {
  if (RAMP.test(token)) continue
  check(
    PAIRS.some((p) => p.fg === token || p.bg === token),
    rel(GLOBALS),
    `--color-${token} (${hex}) appears in no declared pair; every token needs a contrast story before it ships`,
  )
}

report()
```

**Note on ordering between Task 3 and Task 4.** The version above is the *final* one, including the two fixes Task 4 Steps 2 and 3 describe. If you are executing strictly task-by-task, write it without the `themeBlocks` loop, the `RAMP` block, and the `THEME_PAIRS` section in Task 3 — that is what makes Task 4's diff meaningful. If you would rather write it once, use this file as-is and treat Task 4 Steps 2–3 as already done; the expected outputs in Task 3 Step 2 are unchanged either way, because the current `globals.css` has one `@theme` block, no ramp tokens, and no `--z-*` rules.

## Appendix B — `scripts/lint-contrast.test.mjs`

Ten mutations, each asserting a *new* message relative to the baseline, plus five baseline claims. Four of the ten also assert an `absent` pattern, which is how a threshold is proved to be doing work rather than merely present:

| Mutation | Proves |
| --- | --- |
| mint → `#6a6a6a` | the text floor is 4.5 and the UI floor is genuinely not 4.5 |
| add `--color-alarm` | rule A fires on an undeclared token |
| `text-rule` on a card | rule B fires on a foreground with no text pair |
| rename `--color-mint` | rule C reports a rename rather than crashing |
| rename `--color-chassis` | the token consumed outside `PAIRS` reports, and **does not crash** |
| break `@theme` | the parser bails with one sentence, not sixty bogus ratios |
| icon → `#1a1a1a` | a colour can fail on the chassis **only** |
| icon → `#fff` | a colour can fail on white **only** |
| `const SHADOW = '#f43f5e'` | rule D catches a hex already present inside a variants object |
| silkscreen → `#ffffff` | the control: brightening a passing pair manufactures no failure |

This is the **Task 3** version, written against a tree the linter still fails on. Task 6 Step 3 replaces three of the baseline claims once the tree is clean.

```js
/**
 * Mutation harness for the contrast lint.
 *
 * Two things are done differently from lint-registry.test.mjs, both on purpose.
 *
 * It asserts the message, not the exit code. lint-registry.test.mjs takes a
 * non-zero exit as proof the mutation was caught, which means a linter that
 * fails for an unrelated reason scores a clean sweep and a linter whose message
 * is wrong scores one too. Here that shortcut is not even available: the
 * contrast lint fails on the current tree by design, so exit codes carry no
 * signal at all. Every case names the sentence it expects, and requires that
 * sentence to be *new* relative to the baseline, so a pre-existing failure can
 * never be mistaken for a catch.
 *
 * It restores unconditionally. lint-registry.test.mjs restores at the top of
 * the next iteration, so a throw anywhere in the loop leaves mutated source on
 * disk. `finally` closes that, but `finally` alone is not "unconditional":
 * Node's default signal handling terminates without unwinding, so Ctrl-C would
 * still strand a rewritten globals.css. Restore therefore hangs off three
 * paths — `finally`, the signal handlers, and `uncaughtException`.
 *
 * Mutating checked-in files is only acceptable if putting them back does not
 * depend on the happy path being taken.
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolved from this file, not from the cwd. The linter already locates itself
// this way; a harness that only works when invoked from the repo root is worse
// than the linter it tests, because its failure mode is an ENOENT on
// globals.css that reads as a missing file rather than a wrong directory.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LINTER = join(ROOT, 'scripts', 'lint-contrast.mjs')

const CSS = 'web/app/globals.css'
const SRC = 'registry/components/like-button/like-button.tsx'
const CARD = 'web/components/catalog-card.tsx'
const FILES = [CSS, SRC, CARD]
// Repo-relative for the messages, absolute for every actual write.
const abs = (f) => join(ROOT, f)

const orig = Object.fromEntries(FILES.map((f) => [f, readFileSync(abs(f), 'utf8')]))
const restore = () => {
  for (const f of FILES) writeFileSync(abs(f), orig[f])
}

/**
 * `finally` covers a throw. It does not cover a signal: Node's default SIGINT
 * handling terminates the process without unwinding, so Ctrl-C during a
 * mutation leaves rewritten source on disk. Restoring is only unconditional if
 * the signal path and the uncaught-exception path restore too.
 */
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  try {
    process.on(sig, () => {
      restore()
      process.exit(130)
    })
  } catch {
    // Not every signal exists on every platform; the ones that do are enough.
  }
}
process.on('uncaughtException', (e) => {
  restore()
  console.error(e)
  process.exit(1)
})

/**
 * A mutation whose anchor has drifted rewrites nothing and then reports MISSED,
 * which reads as a hole in the linter when it is a hole in this file. Refusing
 * to run a no-op edit is the difference between the two.
 *
 * `from` may be a string or a RegExp; either way only the first occurrence is
 * rewritten, which is what makes renaming a token's declaration while leaving
 * every `var(--color-x)` reference behind expressible in one line.
 */
const edit = (file, from, to) => {
  // `() => to` rather than `to`: String.replace expands `$&`, `$1` and `` $` ``
  // inside a replacement string, and this harness exists to inject arbitrary
  // source. A mutation containing a dollar sign would otherwise be written to
  // disk silently mangled and reported as a hole in the linter.
  const next = orig[file].replace(from, () => to)
  // JSON.stringify on a RegExp is "{}", which would make the one message this
  // guard exists to print useless for exactly the anchors most likely to drift.
  const shown = from instanceof RegExp ? String(from) : JSON.stringify(from)
  if (next === orig[file]) throw new Error(`anchor not in ${file}: ${shown}`)
  writeFileSync(abs(file), next)
}

// Only the indented `  where: msg` lines; the header and the blanks are noise.
const run = () => {
  let out = ''
  try {
    out = execSync(`node ${JSON.stringify(LINTER)}`, { cwd: ROOT, stdio: 'pipe' }).toString()
  } catch (e) {
    out = (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '')
  }
  const lines = out
    .split('\n')
    .filter((l) => /^ {2}\S/.test(l))
    .map((l) => l.trim())
  // A linter that dies is not a linter that caught something. Node prints the
  // offending source line as a code frame indented by two spaces, so a stack
  // trace arrives through the filter above disguised as a failure message.
  // Surfacing it as its own line lets every mutation below assert against it,
  // and the loop treats it as disqualifying no matter what else matched.
  if (/^\s+at .+:\d+:\d+\)?$/m.test(out) || /^[A-Za-z]*Error: /m.test(out)) {
    const first = out.match(/^[A-Za-z]*Error: .*/m)?.[0] ?? 'stack trace in output'
    lines.unshift(`linter crashed: ${first}`)
  }
  return lines
}

const base = run()
const seen = new Set(base)

/**
 * The unmutated tree, asserted directly. These are the claims no mutation can
 * make, because they are about what the linter does *not* do.
 *
 * The scope-split one has teeth: silkscreen is #e8e4dc, so if web/ tokens were
 * ever measured against a light surface it would land at 1.27:1 and that
 * assertion would fire immediately.
 */
const baseline = [
  ['the linter fails on the real tree', () => base.length > 0],
  [
    'web tokens are measured against the dark panels',
    () => base.some((l) => /^web: muted on panel is \d/.test(l)),
  ],
  [
    'registry colour is measured against a white consumer app',
    () => base.some((l) => /^like-button\/.+ on #ffffff is .+ floor for non-text/.test(l)),
  ],
  [
    'web tokens are never measured against a light surface',
    () => base.every((l) => !(l.startsWith('web:') && l.includes('#ffffff'))),
  ],
  ['the linter does not crash on the real tree', () => !base.some((l) => l.startsWith('linter crashed'))],
]

/**
 * [name, mutate, expect, absent]
 *
 * `expect` must match a failure the mutation introduced, or be null when the
 * whole claim is that nothing appears. `absent` must match nothing at all,
 * which is how a threshold or a surface is proved to be doing work rather than
 * merely present: mint at 3.66:1 has to fail as text and pass as UI, and a
 * registry colour has to fail on one surface without the other coming along
 * for the ride.
 */
const mutations = [
  ['text floor is 4.5 and the UI floor is genuinely not', () =>
    edit(CSS, '--color-mint: #00e5a0;', '--color-mint: #6a6a6a;'),
    /^web: mint on chassis is 3\.66:1, below the 4\.5:1 floor for text/,
    /mint on chassis is .+ floor for non-text/],

  ['new token with no declared pair', () =>
    edit(CSS, '  --color-mint: #00e5a0;', '  --color-mint: #00e5a0;\n  --color-alarm: #ff2d2d;'),
    /--color-alarm \(#ff2d2d\) appears in no declared pair/],

  ['text- utility with no declared text pair', () =>
    edit(CARD, 'className="lbl mt-1"', 'className="lbl mt-1 text-rule"'),
    /^web\/components\/catalog-card\.tsx: "text-rule" is used here but "rule" is the foreground of no declared text pair/],

  ['token renamed out from under a pair', () =>
    edit(CSS, '--color-mint:', '--color-accent:'),
    /^PAIRS: pair "mint on chassis" names unknown token "mint"/],

  // chassis, not mint, because chassis is the one token the linter consumes by
  // name outside PAIRS — as the dark surface for the registry check — and so
  // the one rule C cannot vouch for. Renaming it used to throw a TypeError out
  // of ratio() rather than report anything. `absent` is the whole point of the
  // case: a stack trace is not a catch.
  ['the dark surface token renamed out from under the registry check', () =>
    edit(CSS, '--color-chassis:', '--color-ink:'),
    /^web\/app\/globals\.css: --color-chassis is not declared in @theme/,
    /^linter crashed/],

  // Anchored on the linter's own parse expression rather than the literal
  // `@theme inline {` currently on disk, so the mutation keeps breaking the
  // thing the linter actually depends on even after the modifier changes
  // again. `absent` is the real assertion here: the linter must give up with
  // one sentence, not cascade sixty ratios computed from zero tokens.
  ['@theme block stops parsing', () =>
    edit(CSS, /@theme[^{]*\{/, '@thme {'),
    /^web\/app\/globals\.css: no @theme block matched/,
    /is \d+\.\d\d:1, below the/],

  ['registry colour fails on the dark chassis only', () =>
    edit(SRC, "'#a3a3a3'", "'#1a1a1a'"),
    /^like-button\/like-button\.tsx: iconVariants #1a1a1a \(idle\) on #0a0a0b is 1\.14:1/,
    /#1a1a1a \(idle\) on #ffffff/],

  ['registry colour fails on the light surface only', () =>
    edit(SRC, "'#a3a3a3'", "'#fff'"),
    /^like-button\/like-button\.tsx: iconVariants #fff \(idle\) on #ffffff is 1\.00:1/,
    /#fff \(idle\) on #0a0a0b/],

  // #f43f5e on purpose: it is already used inside iconVariants, so a rule D
  // that collected hex strings rather than source positions would wave this
  // through. It is the only easy way to smuggle a colour past this lint.
  ['hex smuggled outside a variants object', () =>
    edit(SRC, 'const rootVariants = {', "const SHADOW = '#f43f5e'\nconst rootVariants = {"),
    /^like-button\/like-button\.tsx: hex "#f43f5e" sits outside a variants object/],

  // The control. Brightening a foreground must never manufacture a failure;
  // without this the whole suite is satisfiable by a linter that fails on
  // everything.
  ['a passing pair stays passing', () =>
    edit(CSS, '--color-silkscreen: #e8e4dc;', '--color-silkscreen: #ffffff;'),
    null,
    /silkscreen on (chassis|panel|panel-2)/],
]

let held = 0
for (const [name, assert] of baseline) {
  const ok = assert()
  if (ok) held++
  console.log(`${ok ? '  HOLDS  ' : '  BROKEN '} ${name}`)
}

let caught = 0
for (const [name, mutate, expect, absent] of mutations) {
  let ok = false
  let detail = ''
  try {
    mutate()
    const got = run()
    const hit = expect && got.filter((l) => !seen.has(l)).find((l) => expect.test(l))
    const leak = absent && got.find((l) => absent.test(l))
    // Disqualifying everywhere, not just where a case thought to ask. A
    // mutation that makes the linter throw has found a bug in the linter, and
    // scoring it CAUGHT because the code frame happened to match is the exact
    // false-green this harness exists to refuse.
    const crash = got.find((l) => l.startsWith('linter crashed'))
    ok = (expect ? Boolean(hit) : true) && !leak && !crash
    detail = crash
      ? crash
      : leak
        ? `leaked: ${leak}`
        : hit || (expect ? `nothing new matched ${expect}` : 'nothing leaked')
  } catch (e) {
    detail = `harness: ${e.message}`
  } finally {
    restore()
  }
  console.log(`${ok ? '  CAUGHT ' : '  MISSED '} ${name}`)
  console.log(`           ${detail.slice(0, 118)}`)
  if (ok) caught++
}

console.log(`\n${held}/${baseline.length} baseline claims, ${caught}/${mutations.length} mutations caught`)
process.exit(held === baseline.length && caught === mutations.length ? 0 : 1)
```

## Appendix C — `web/app/globals.css`

Complete replacement, compile-verified against the repo's own `tailwindcss` 4.3.3 with a 64-candidate class list covering every existing call site. Every ratio, OKLCH value and luminance in the comments was recomputed with the WCAG formula and the OKLab matrices; none is estimated.

**`inline` is load-bearing on the second block and only cosmetic on the fonts.** Custom-property substitution happens at the element that *declares* the property. Without `inline`, `--color-z-bg: var(--z-bg)` would be declared on `:root` and frozen to the dark value, so `bg-z-bg` inside a `.light` subtree would still paint dark — wrong theme, no error. With `inline`, the utility compiles straight to `var(--z-bg)` and resolves at the consuming element.

**In hand-written CSS always write `var(--z-fg)`, never `var(--color-z-fg)`.** Utilities are safe either way; direct variable reads are not.

```css
@import 'tailwindcss';

/* Component sources live outside this workspace, so Tailwind has to be told
   where to look or every utility in a registry component is silently dropped. */
@source '../../registry/**/*.tsx';

/* ═══════════════════════════════════════════════════════════════════════════
   1. RAMPS

   Two families, both tinted, neither neutral. Panel Grey is machined edge:
   Chassis Ink's hue (OKLCH H 286) held constant with lifted lightness and
   near-zero chroma (measured C 0.002–0.011 across the twelve steps — enough
   to survive 8-bit quantization, far too little to read as colored).
   Silkscreen Sand is printed marking: warm (H 75–89), higher chroma. Ink is
   cold, the silkscreen is warm, and DESIGN.md §6 is satisfied because neither
   end is #000 or #fff.

   Steps are spaced in OKLCH L, not in sRGB, so a step near black and a step
   near white are comparable perceptual sizes.
   ═══════════════════════════════════════════════════════════════════════════ */
@theme {
  /* ── Panel Grey — DESIGN.md:36. Derived from Chassis Ink, lightness lifted,
     chroma near zero. Borders, dividers, inactive fills, second surface. ── */
  --color-grey-950: #0a0a0b; /* = Chassis Ink, the anchor. oklch(14.5% .002 286) */
  --color-grey-900: #17171b; /* oklch(20.6% .008 286) */
  --color-grey-850: #212126; /* oklch(25.0% .009 286) */
  --color-grey-800: #2c2c31; /* oklch(29.5% .009 286) */
  --color-grey-700: #424248; /* oklch(38.1% .010 286) */
  --color-grey-600: #57575e; /* oklch(45.9% .011 286) */
  --color-grey-500: #6e6e75; /* oklch(54.1% .011 286) */
  --color-grey-400: #88888f; /* oklch(62.9% .010 286) */
  --color-grey-300: #a2a2a9; /* oklch(71.4% .010 286) */
  --color-grey-200: #bdbdc3; /* oklch(80.0% .008 286) */
  --color-grey-100: #d5d5db; /* oklch(87.5% .008 286) */
  --color-grey-50: #e9e9ee; /* oklch(93.5% .007 286) */

  /* ── Silkscreen Sand — the warm marking ramp, and the light-theme ground. ── */
  --color-sand-900: #312d26; /* oklch(29.9% .014 82) */
  --color-sand-800: #46423a; /* oklch(38.0% .014 85) */
  --color-sand-700: #58534a; /* oklch(44.4% .016 82) */
  --color-sand-600: #747066; /* oklch(54.6% .016 89) */
  --color-sand-500: #8d897f; /* oklch(63.1% .015 89) */
  --color-sand-400: #a7a39a; /* oklch(71.6% .014 87) */
  --color-sand-300: #c1bdb6; /* oklch(80.0% .011 82) */
  --color-sand-250: #cecac3; /* oklch(84.0% .011 82) — light-theme hover fill */
  --color-sand-200: #d7d4cd; /* oklch(87.0% .010 88) */
  --color-sand-100: #e8e4dc; /* = Silkscreen Sand. oklch(92.0% .012 85) */
  --color-sand-50: #f9f6f2; /* oklch(97.4% .006 75) — light ground, never #fff */

  /* ── Signal Mint. Untouchable. Marks the moving part and nothing else.
     Never a text, background, or border color at rest. 1.65:1 on white is
     why the site is dark-first — see The Contrast Floor Rule. ── */
  --color-mint: #00e5a0;

  /* ═════════════════════════════════════════════════════════════════════════
     2. SITE TOKENS — dark only, no light counterpart, by design.

     Ratios are measured against all four site surfaces; the number quoted
     first is on the WORST (lightest) of them, with the chassis figure in
     parentheses. "was" figures are quoted on the same worst surface.
     ═════════════════════════════════════════════════════════════════════════ */

  /* Three milled planes (DESIGN.md §4: chassis, panel, control) plus the
     control's hover step. Measured OKLCH L: 14.52 → 18.31 → 21.95 → 24.99,
     i.e. rises of 3.8 / 3.6 / 3.0. Deliberately NOT uniform. What is uniform,
     and what makes one border token clear 3:1 in both themes, is the final
     hover step: exactly 3.0 OKLCH-L here and 3.0 in the light ramp below. */
  --color-chassis: #0a0a0b; /* oklch 14.5% — page ground */
  --color-panel: #121214; /* oklch 18.3% — panels, toolbars, code wells */
  --color-panel-2: #1a1a1e; /* oklch 22.0% — control fill at rest */
  --color-control: #212126; /* oklch 25.0% — control fill on hover */

  --color-silkscreen: #e8e4dc; /* text  12.64:1 on control (15.61:1 on chassis) ✅ AA */
  --color-muted: #8d897f; /* text   4.59:1 on control  (5.67:1 on chassis) ✅ AA — was #7a756d @ 3.51 on control (4.33 on chassis) ❌ */
  --color-rule: #6e6e75; /* border 3.17:1 on control  (3.91:1 on chassis) ✅ AA — was #232327 @ 1.02 on control (1.26 on chassis) ❌ */

  /* ═════════════════════════════════════════════════════════════════════════
     3. TYPOGRAPHY — fixed rem scale, geometric mean ratio 1.2025 (DESIGN.md:56)

     11 → 13 → 16 → 19 → 23 px (adjacent ratios 1.182 / 1.231 / 1.188 / 1.211),
     then a deliberate three-step jump to 40. The gap is not an oversight: The
     No Display Type In UI Rule forbids the 27px and 33px steps from ever
     appearing, so naming them would create tokens with no legal call site.
     ═════════════════════════════════════════════════════════════════════════ */

  --text-label: 0.6875rem; /* 11px  — Label. THE workhorse. */
  --text-label--line-height: 1;
  --text-label--letter-spacing: 0.12em; /* uppercase mono needs positive tracking */
  --text-label--font-weight: 500;

  --text-code: 0.8125rem; /* 13px  ×1.182 — code wells, install commands */
  --text-code--line-height: 1.65;
  --text-code--letter-spacing: 0em;

  --text-body: 1rem; /* 16px  ×1.231 — Body, capped 65–75ch */
  --text-body--line-height: 1.6;
  --text-body--letter-spacing: 0em;

  --text-title: 1.1875rem; /* 19px  ×1.188 — Title: Props / States / Install */
  --text-title--line-height: 1.35;
  --text-title--letter-spacing: -0.01em;
  --text-title--font-weight: 550;

  --text-headline: 1.4375rem; /* 23px  ×1.211 — Headline: catalog component names */
  --text-headline--line-height: 1.25;
  --text-headline--letter-spacing: -0.015em;
  --text-headline--font-weight: 600;

  /* ×1.739 ≈ 1.2³ — log(40/23)/log(1.2) = 3.0352. A true 1.2³ lands on
     39.7px; 40 is the rounded value and DESIGN.md:56 documents the scale as
     approximate. */
  --text-display: 2.5rem; /* 40px — Display: showcase hero ONLY */
  --text-display--line-height: 1.05;
  --text-display--letter-spacing: -0.025em;
  --text-display--font-weight: 620;

  /* Standalone tracking tokens. `--tracking-label` retires the hand-typed
     `tracking-[0.12em]` call sites; `--tracking-body` is what the three
     NON-uppercase 11px call sites need to cancel it back to zero. */
  --tracking-label: 0.12em; /* 11px uppercase mono */
  --tracking-label-tight: 0.08em; /* 13px+ uppercase mono — tracking falls as size rises */
  --tracking-body: 0em;
  --tracking-title: -0.01em;
  --tracking-headline: -0.015em;
  --tracking-display: -0.025em;

  /* ── Milled radii. A machined panel has small, consistent fillets. ── */
  --radius-panel: 0.125rem; /* 2px — panel and well edges */
  --radius-control: 0.25rem; /* 4px — buttons, inputs, chips */
  --radius-card: 0.375rem; /* 6px — catalog cards */

  /* ── The only shadow in the system. DESIGN.md §4: a shadow that exists at
     rest is a decoration and is prohibited. Apply under :active or a pressed
     data-attribute only, driven by the same spring as the interaction.

     Note: --shadow-press will NOT appear as a variable in the compiled :root.
     Tailwind's shadow utility inlines the value into --tw-shadow so it can
     splice --tw-shadow-color into each layer. That is expected. ── */
  --shadow-press: 0 1px 2px -1px oklch(0% 0 0 / 0.55), 0 6px 16px -8px oklch(0% 0 0 / 0.45);

  /* Colour transitions only. Springs come from Motion, never from a
     cubic-bezier imitating one (DESIGN.md §6). */
  --ease-panel: cubic-bezier(0.2, 0, 0, 1);

  --container-measure: 68ch; /* max-w-measure — the 65–75ch body cap */
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. FONT FAMILIES + COMPONENT TOKENS

   Fonts: next/font defines --font-inter and --font-jetbrains-mono via a
   className on <html>, which IS :root — the same element Tailwind declares
   theme vars on. Both spellings work here; `inline` is kept only so the two
   blocks read the same way.

   Component tokens: here `inline` IS required. Substitution happens at the
   element that DECLARES the property. Without `inline`, --color-z-bg would be
   declared on :root and frozen to the dark value, so bg-z-bg inside a .light
   subtree would still paint dark.
   ═══════════════════════════════════════════════════════════════════════════ */
@theme inline {
  /* next/font owns the family names; these two vars are the only handoff.
     Each already ends in its own metric-matched fallback face, so the entries
     after it are for the case where the CSS loads and the font files do not.
     Never name Inter or JetBrains Mono directly here — a bare family name
     reaches only the first entry of the two-entry stack and drops the
     metric-matched face. */
  --font-sans: var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

  /* These indirect through plain custom properties so they can flip per
     theme; @theme cannot be nested in a media query or a class, so the
     switch lives below in :root / .light. These are the only tokens
     registry/ may touch. */
  --color-z-bg: var(--z-bg);
  --color-z-panel: var(--z-panel);
  --color-z-fill: var(--z-fill);
  --color-z-fill-hover: var(--z-fill-hover);
  --color-z-fg: var(--z-fg);
  --color-z-fg-muted: var(--z-fg-muted);
  --color-z-border: var(--z-border);
  --color-z-signal: var(--z-signal);
  --color-z-on-signal: var(--z-on-signal);
  --color-z-focus: var(--z-focus);
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. THEME PAIRS — every ratio below is computed, none estimated.

   Text floor 4.5:1 (WCAG 1.4.3 AA). Border/UI-boundary floor 3:1 (1.4.11).

   :root is DARK because the site is dark-only and must not follow the OS.
   Light is opt-in via .light / [data-theme='light']. A light preview pane
   must carry `bg-z-bg text-z-fg` itself — the class only flips the
   variables, it does not paint.
   ═══════════════════════════════════════════════════════════════════════════ */
:root {
  color-scheme: dark;

  --z-bg: #0a0a0b; /* grey-950  page ground */
  --z-panel: #121214; /* panel plane */
  --z-fill: #1a1a1e; /* control fill, rest */
  --z-fill-hover: #212126; /* grey-850  control fill, hover */

  --z-fg: #e8e4dc; /* sand-100  15.61 on bg · 14.76 on panel · 13.68 on fill · 12.64 on fill-hover  ✅ AA */
  --z-fg-muted: #8d897f; /* sand-500   5.67 on bg ·  5.36 on panel ·  4.97 on fill ·  4.59 on fill-hover  ✅ AA */
  --z-border: #6e6e75; /* grey-500   3.91 on bg ·  3.70 on panel ·  3.43 on fill ·  3.17 on fill-hover  ✅ 3:1 */
  --z-signal: #00e5a0; /* mint      11.98 on bg · 11.33 on panel · 10.50 on fill ·  9.70 on fill-hover  ✅ moving part only */
  --z-on-signal: #0a0a0b; /* chassis   11.98 on mint — the glyph inside a filled indicator  ✅ AA */
  --z-focus: #00e5a0; /* mint      11.98 on bg — focus is user-caused and transient, so it is a moving part */
}

.light,
[data-theme='light'] {
  color-scheme: light;

  --z-bg: #f9f6f2; /* sand-50   never #fff (DESIGN.md §6) */
  --z-panel: #e8e4dc; /* sand-100 */
  --z-fill: #d7d4cd; /* sand-200  control fill, rest */
  --z-fill-hover: #cecac3; /* sand-250  control fill, hover — same 3.0 OKLCH-L step as dark
                              (measured light L: 97.43 → 91.98 → 87.03 → 84.02) */

  --z-fg: #17171b; /* grey-900  16.59 on bg · 14.10 on panel · 12.08 on fill · 10.95 on fill-hover · 17.88 on #fff  ✅ AA */
  --z-fg-muted: #58534a; /* sand-700   7.09 on bg ·  6.02 on panel ·  5.16 on fill ·  4.67 on fill-hover ·  7.63 on #fff  ✅ AA */
  --z-border: #6e6e75; /* grey-500   4.70 on bg ·  3.99 on panel ·  3.42 on fill ·  3.10 on fill-hover ·  5.06 on #fff  ✅ 3:1 */

  /* Mint measures 1.53 on sand-50, 1.30 on sand-100, 1.12 on sand-200,
     1.01 on sand-250 and 1.65 on #fff. The Contrast Floor Rule forbids it
     here, so the light theme solves the signal with a neutral — exactly as
     DESIGN.md:42 instructs. Mint does not appear in light at all. */
  --z-signal: #2c2c31; /* grey-800  12.89 on bg · 10.96 on panel · 9.39 on fill · 8.51 on fill-hover · 13.89 on #fff  ✅ AA */
  --z-on-signal: #f9f6f2; /* sand-50   12.89 on signal  ✅ AA */
  --z-focus: #2c2c31; /* grey-800  12.89 on bg · 13.89 on #fff  ✅ 3:1 */
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. BASE
   ═══════════════════════════════════════════════════════════════════════════ */
@layer base {
  html {
    background: var(--color-chassis);
    -webkit-text-size-adjust: 100%;
  }

  body {
    background: var(--color-chassis);
    color: var(--color-silkscreen);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Selection marks the thing the user is actively dragging over: a moving
     part, so mint is legal. 11.98:1 both directions. */
  ::selection {
    background: var(--color-mint);
    color: var(--color-chassis);
  }

  /* Inside a light pane, mint focus would measure 1.65:1. The neutral takes
     over automatically because --z-focus is redefined on .light. Written as
     var(--z-focus), never var(--color-z-focus). */
  :focus-visible {
    outline: 2px solid var(--z-focus);
    outline-offset: 2px;
  }

  /* Prose measure, per DESIGN.md §3. */
  p,
  li {
    text-wrap: pretty;
  }

  h1,
  h2,
  h3 {
    text-wrap: balance;
  }

  /* DESIGN.md: an instant swap is correct, a zero-duration animation is not.
     Transitions collapse; Motion's springs are handled in JS by useZTransition. */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */
@layer components {
  /* Mono uppercase is the panel's silkscreen: every label, every unit.
     Tracking now comes from --tracking-label instead of a hand-typed 0.14em. */
  .lbl {
    font-family: var(--font-mono);
    font-size: var(--text-label);
    line-height: var(--text-label--line-height);
    letter-spacing: var(--tracking-label);
    font-weight: var(--text-label--font-weight);
    text-transform: uppercase;
    color: var(--color-muted); /* 4.59:1 on --color-control, 5.67:1 on chassis ✅ AA */
  }

  /* Shiki emits its own background; the panel supplies the ground instead. */
  .code pre {
    background: transparent !important;
    padding: 1.25rem;
    overflow-x: auto;
    font-size: var(--text-code);
    line-height: var(--text-code--line-height);
  }

  .code code {
    font-family: var(--font-mono);
  }
}
```

## Appendix D — carried pitfalls

Things that are true, non-obvious, and will cost a day each if rediscovered.

**The mint call sites will fail the future mint allowlist.** `layout.tsx:19` (`.lbl !text-mint` wordmark), `page.tsx:21`, `spring-race.tsx:66,87`, `catalog-card.tsx:29`, `code-panel.tsx:62` and six more use mint on static elements. That is mint carrying meaning at rest, which The Moving Part Rule forbids. The token system cannot fix it; the call sites must. Out of scope for this plan — it belongs with the site-craft work in Slice 1 Step 5.

**The sticky header has no provable contrast.** `layout.tsx` uses `bg-chassis/85` with `backdrop-blur`, which compiles to `color-mix(in oklab, var(--color-chassis) 85%, transparent)`. The effective background is whatever scrolls under it, so no static ratio exists for text in that header. Safe today because everything beneath is dark; broken the moment an image or a mint fill scrolls under. It also violates DESIGN.md's Flat-At-Rest rule and its explicit glassmorphism ban.

**Tailwind's default palette is deliberately left intact.** `like-button.demo.tsx` uses `text-neutral-500` at lines 18, 28 and 43. Clearing the namespace with `--color-*: initial` would break them. If the ban on non-token colours is enforced later, migrate those three call sites first.

**Weights 550/600/620 need the variable font.** `--text-title`, `--text-headline` and `--text-display` set non-integer-stop weights. `Inter({subsets:['latin']})` with no `weight` option loads the variable face, so this holds — adding an explicit `weight` array would snap them to the nearest static instance.

**`disabled:opacity-50` composites idle to 1.75:1 on chassis.** That is below 3:1 and is *not* a violation — WCAG 1.4.11 explicitly exempts inactive controls. Do not "fix" it by raising the opacity, which would make disabled indistinguishable from idle.

**The border token sits in a narrow window.** `#6e6e75` has Y = 0.15751, and the legal window is Y ∈ [0.14653, 0.16434] — floor from `3·(Y(#212126)+0.05)−0.05`, ceiling from `(Y(#cecac3)+0.05)/3 − 0.05`. Any future change that makes the lightest dark surface lighter than `#212126`, or the darkest light surface darker than `#cecac3`, collapses that window and forces `--z-border` to split into a theme pair.

**A future `@font-face` site rule must look at the built output.** `next/font` emits its `@font-face` into its own stylesheet, not `globals.css`. A rung-4 rule asserting "the built CSS contains at least one `@font-face`" must inspect the whole app's build, or it produces a false failure. Task 8's FONT-1..7 avoid this by checking `layout.tsx` and `globals.css` directly.
