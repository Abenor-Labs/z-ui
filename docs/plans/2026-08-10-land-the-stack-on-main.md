# Land the stack on `main`

**Supersedes Task 1 of `2026-08-05-phase-0-and-slice-1-tokens-fonts.md`.** That
task was written against preconditions verified on 2026-08-05 and every one of
them has moved: it names `docs/product-system` tip `c4834b0` as the integration
point, and 37 commits have landed since — including the registry clear-out, the
palette re-mix, a second component, and the npm publish. The shape of the
operation is unchanged; the commits, the branch and the conflict analysis are
not. Read this one.

**Executed by the human.** Every step past the pre-flight touches the remote.

---

## Why this is the last blocker

`@abenor/z-ui@0.1.0` is on npm and works. `z-ui init` writes a registry URL
pointing at `main`, `main` holds one scaffold commit, so `add` returns 404 for
anyone who is not standing in a clone of this repository. The CLI names that
blocker in its error message now instead of failing confusingly, but naming it
is not fixing it. This is the fix.

## State, verified 2026-08-10

| Fact | Value |
| --- | --- |
| `origin/main` | `9a04e69` — one scaffold commit |
| Working branch | `slice-1-tokens-fonts` |
| Range `origin/main..HEAD` | 37 commits, **0 merge commits** |
| Behind `origin/main` | 0 — a clean fast-forward |
| Local `main` | 2 commits ahead of `origin/main`, and an ancestor of HEAD |
| `main` protection | none — the protection endpoint 404s |
| Repo merge settings | squash only (`merge:false`, `rebase:false`), public |
| Working tree | clean |
| `pnpm verify` | green — typecheck ×4, registry lint 42/2, 11/11 mutations, contrast 143/25, drift check, 45 CLI tests |

Zero merge commits in the range is what makes `required_linear_history`
compatible. Confirm it has not changed before enabling protection:

```bash
git log --merges --oneline origin/main..HEAD   # expect no output
```

## What happens to the six open PRs

Five of them are already in this branch. Their head commits are ancestors of
HEAD, so pushing HEAD to `main` lands their content; merging them afterwards
would be merging commits that are already there.

| PR | Branch | Head is an ancestor of HEAD? | Action |
| --- | --- | --- | --- |
| #6 | `docs/product-system` | yes | close, superseded |
| #5 | `chore/registry-lint` | yes | close, superseded |
| #4 | `feat/showcase` | yes | close, superseded |
| #3 | `feat/like-button` | yes | close, superseded |
| #2 | `feat/registry-primitives` | yes | close, superseded |
| #1 | `docs/foundation-spec` | **no** — 4 commits | close, spec already carried over |

PR #1 was the one that needed a decision. It adds
`docs/specs/2026-08-04-z-ui-foundation-design.md`, which exists nowhere else, and
also rewrites `DESIGN.md` to a strictly earlier draft — two
`[to be resolved during implementation]` holes against this branch's one. Commit
`530be05` carries the spec file across on its own, so #1 can be closed with
nothing lost and nothing walked back.

Note that #3 and #4 land content that later commits delete: `like-button` was
removed on 2026-08-09 and is permanently out of scope, and the catalogue-and-bench
showcase was removed before that. Their commits stay in history; the tree they
produce does not survive to the tip. That is correct and needs no action.

## Steps

### 1. Pre-flight — every line asserts

```bash
cd /d/ABENOR-LABS/Z-ui
git fetch origin --prune

test -z "$(git status --porcelain)"                        && echo "tree clean"
test "$(git rev-parse origin/main)" = "9a04e69$(git rev-parse origin/main | cut -c8-)" \
  || echo "origin/main moved — re-read this plan before continuing"
git merge-base --is-ancestor origin/main HEAD              && echo "fast-forward is clean"
test -z "$(git log --merges --oneline origin/main..HEAD)"  && echo "history is linear"
pnpm verify
```

If any line is silent where it should print, stop.

### 2. Push the branch to `main`

`main` is unprotected right now, which is the only reason this is possible in one
step. Do it before enabling protection, not after.

```bash
git push origin HEAD:main
```

Fast-forward, no force. Local `main` is an ancestor of HEAD, so nothing of it is
lost; sync the local branch afterwards:

```bash
git fetch origin
git branch -f main origin/main
```

### 3. Watch CI

`.github/workflows/ci.yml` runs on push to `main`: typecheck, registry lint, the
lint mutation harness, contrast lint and its harness, the generated-registry
drift check, and the CLI tests. It is the same set `pnpm verify` just ran
locally, on Node 22 with a frozen lockfile.

```bash
gh run watch
```

A frozen-lockfile failure here means `pnpm-lock.yaml` is behind — the last
commits added a workspace package. It was regenerated, but CI is the check that
matters.

### 4. Close the six PRs

Only after CI is green, so the comment is true when it is written.

```bash
for n in 1 2 3 4 5 6; do
  gh pr close "$n" --comment "Superseded. The content of this PR is on \`main\` as of the 2026-08-10 fast-forward — see docs/plans/2026-08-10-land-the-stack-on-main.md for the mapping. Closing rather than merging because these commits are already ancestors of the tip."
done
```

PR #1's comment should say something different, because it is the one that was
not merged wholesale:

```bash
gh pr close 1 --comment "Superseded. The foundation spec is on \`main\` as commit 530be05; the DESIGN.md rewrite in this PR is an earlier draft than the current one and was deliberately not taken."
```

### 5. Protect `main`

```bash
gh api -X PUT repos/Abenor-Labs/z-ui/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=verify' \
  -f 'enforce_admins=false' \
  -f 'required_pull_request_reviews=null' \
  -f 'restrictions=null' \
  -F 'required_linear_history=true' \
  -F 'allow_force_pushes=false' \
  -F 'allow_deletions=false'
```

`enforce_admins=false` deliberately: this is a solo repository and locking
yourself out of your own `main` on the day you protect it is the classic way to
need a support ticket. Turn it on when there is a second maintainer.

`required_pull_request_reviews=null` for the same reason — a required review with
one maintainer is a wall with no door.

Confirm:

```bash
gh api repos/Abenor-Labs/z-ui/branches/main/protection --jq '{checks:.required_status_checks.contexts, linear:.required_linear_history.enabled, force:.allow_force_pushes.enabled}'
```

### 6. Verify the thing this was all for

The registry is served from `raw.githubusercontent.com`, which caches. Give it a
minute, the way npm's read CDN needed two.

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry/r/index.json
```

Once that is `200`, the published CLI works with no flags, from anywhere:

```bash
cd "$(mktemp -d)"
npx -y @abenor/z-ui@latest init --yes
npx -y @abenor/z-ui@latest add disclosure --yes
```

That is the first time `add` will have worked for a stranger.

## Afterwards

Three things become false the moment this lands, and each is a place the site or
the docs currently tells the truth about being broken:

- The install cards on `/`, `/docs`, `/scramble-reveal` and `/disclosure` carry
  an `unpublished` chip and a "needs the merge" qualifier. The npm half is
  already stale — the package is published — and the merge half becomes stale here.
- `packages/cli/README.md` has a **Status** section describing the 404 and the
  `--registry ./registry` workaround.
- The 404 branch in `packages/cli/src/registry/fetch.ts` says the hosted registry
  "is not published yet". It should go back to a plain 404 message, and that
  needs a version bump and a second publish.

None of them is urgent and all of them are lies once `main` is real.
