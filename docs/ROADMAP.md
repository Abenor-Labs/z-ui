# Roadmap

The single source of what is next and why. Status changes land in the same pull
request as the work, never in a separate bookkeeping commit.

**Last updated:** 2026-08-04

---

## Now: v0.1, "it works"

The smallest version that delivers the actual promise, which is that someone
runs one command and owns a component. Anything less and the pitch is a
screenshot. Anything more delays the feedback that would change what gets built
next.

**Ships when all five are true:**

1. `@abenor/z-ui` is published and `add` writes working files into a real project
2. Three components exist, one per v1 category, so the contract is proven against more than a coincidence
3. The site is deployed and serving the registry
4. CI is green on `main` and branch protection is on
5. The README describes what exists rather than what is intended

| # | Item | Status | PR |
| --- | --- | --- | --- |
| 1 | Foundation spec | in review | [#1](https://github.com/Abenor-Labs/z-ui/pull/1) |
| 2 | Registry primitives: `z-spring`, `z-cn`, `use-controllable-state` | in review | [#2](https://github.com/Abenor-Labs/z-ui/pull/2) |
| 3 | `like-button` | in review | [#3](https://github.com/Abenor-Labs/z-ui/pull/3) |
| 4 | Showcase: catalog, bench, registry serving | in review | [#4](https://github.com/Abenor-Labs/z-ui/pull/4) |
| 5 | Registry schemas, lint, CI | in review | [#5](https://github.com/Abenor-Labs/z-ui/pull/5) |
| 6 | Branch protection on `main` | blocked on 5 | |
| 7 | `copy-button` | not started | |
| 8 | CLI: `init`, `add`, `list` | not started | |
| 9 | `play-pause` | not started | |
| 10 | Deploy the site | not started | |
| 11 | Publish `@abenor/z-ui` to npm | not started | |

**Sequencing note.** Item 7 comes before item 8 deliberately. A contract
validated by a single component is a coincidence, and the CLI encodes
assumptions about component shape that are cheaper to correct before they are
published than after.

---

## Next: v0.2, "it's a library"

Breadth. Full coverage of the three v1 categories, which is the point at which
a visitor can browse rather than inspect a single specimen.

- **State-morphing:** `play-pause`, `mute-unmute`, `lock-unlock`
- **Tactile feedback:** `like-button`, `copy-button`, `bookmark`
- **Input and utility:** `password-eye`, `search-pill`, `theme-switch`

Also in v0.2, because they only earn their keep once there are enough
components to need them:

- Catalog search and filtering by category and state
- Captured media for catalog cards, if live previews stop being cheap
- The interrupt demo and slow-motion controls on the bench

---

## Later: v0.3, "it scales"

- The component generator skill, reverse-engineered from real components rather than guessed
- `CONTRIBUTING.md` and a component submission checklist derived from the file contract
- A custom domain, replacing the raw GitHub registry transport ([ADR 0003](adr/0003-raw-github-registry-transport.md))

---

## Explicitly not planned

Recorded so these do not get relitigated. Each is a "no" with a reason, not a
"not yet".

| Idea | Why not |
| --- | --- |
| Vue, Svelte, or web component ports | The motion quality ceiling depends on `motion`'s interruptible springs. A port would either ship worse motion or drag a second engine in. |
| Layout, form, or data-display components | Not micro-interactions. Scope refusal is the product, see PRODUCT.md principle 5. |
| A props playground with free-form sliders | The spring presets are the API. 21st.dev provisioned a controls schema and never shipped it, which is the expected outcome. |
| Runtime distribution from `node_modules` | Defeats the entire premise. The CLI writing files is the delivery mechanism. |
| Accounts, telemetry, or a submission dashboard | No server, no data, nothing to run. |

---

## How this file works

- Status values are `not started`, `in progress`, `in review`, `done`, `blocked on N`.
- An item moves to `done` in the same pull request that completes it.
- New items are added only with a reason. If the reason is "it would be nice", it goes in v0.2 or gets declined above.
- Decisions that shape the roadmap live in [`adr/`](adr/), not here. This file says what and when; ADRs say why.
