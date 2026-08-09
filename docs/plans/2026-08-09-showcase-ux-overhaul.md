# Z-UI showcase: UX audit and overhaul plan

**Date:** 2026-08-09  
**Method:** six independent audit lenses (hero thesis, interaction mechanics, visual consistency, journey/IA, competitive benchmark, copy/voice), each finding then adversarially verified against source by a separate agent. 67 findings survived, 5 were refuted and excluded.

---

## The verdict

The site has no proof. Every claim Z-UI makes — interruptible, velocity-carrying, real numbers, five minutes to install — is written as a sentence somewhere and demonstrated nowhere, and the one object given the most pixels and the most animation is the one object that cannot be installed. That inversion is the root: the hero renders an abstract coil (an argument about the library's *existence*) instead of a shipped component under a real gesture (an argument about the library's *value*), and it does so 2.5 viewport-heights above the first thing a visitor can buy. Below that, the failure repeats at smaller scale — the largest number in the hero (`0 runtime dependencies`) is false three ways over, the "ready" install command 404s because `origin/main` holds a single scaffold commit, and the primary CTA physically shrinks and shoves its neighbour when you press it. The craft in this repo is real and in places better than anything in the category — the MutationObserver `data-state` readout, the contrast linter, the drift tripwire on the spring constants. It is spent almost entirely on surfaces a visitor reaches only after deciding to trust a page that has not yet earned it.

---

## Every issue found

Merged where findings share one root cause; merges are marked.

### P0 — the site is either lying or unbuyable

- **CopyButton discards its children on success** — `web/components/copy-button.tsx:44` — the hero CTA collapses ~90px and drags "Explore primitives" left for 1600ms, so a second click intended as re-copy navigates to `#components` instead. *(Merges 5 findings: `copy-button-reflow`, `copy-button-collapses-the-cta-row`, `copy-result-single-channel`, `copy-confirmation-copy`, and the `copiedLabel` half of `every-copy-affordance-installs-like-button`. One line is the cause; 7 call sites are the blast radius: `app/page.tsx:100`, `:312`, `site-nav.tsx:45`, `:88`, `code-panel.tsx:42`, `install-block.tsx:45`, `docs/page.tsx:147`.)*
- **The hero centrepiece cannot be installed** — `web/components/hero/spring-coil.tsx` (whole file), `app/page.tsx:131-158` — the site's largest, most animated, most captioned object has no manifest, no `add` command, no `data-state`, and proves nothing about any shipped component. *(Merges `hero-object-proves-nothing-buyable` + `hero-should-be-the-artifact-under-a-real-gesture`. See §The hero problem.)*
- **Interruptibility is asserted on five surfaces and demonstrated on zero** — `app/page.tsx:48`, `app/c/[slug]/page.tsx:98-100`, `:107-116`, `:127-138`, `:151-163`, `docs/page.tsx:53` — the library's only real differentiator is gated behind read-a-paragraph → execute-a-precisely-timed double-click → already-know-what-retargeting-looks-like. `disclosure-bench.tsx:26` sets `forceable={false}`, so the site ships no mechanism to fire it.
- **Every install command 404s, and the path is not the reason** — `docs/page.tsx:42`, `install-block.tsx:12-13`, `app/page.tsx:271`, `packages/cli/src/project/config.ts:8-9` — `git log --oneline origin/main` returns exactly one commit (`9a04e69 chore: scaffold monorepo`); HEAD is 20 ahead and `git ls-tree origin/main -- web/` is empty, so `raw.githubusercontent.com/.../main/<anything>` fails regardless of path. The tab badged **ready** is the one that fails. Worse: a partial fix already landed and produced three-way drift — `install-block.tsx:13` and `page.tsx:271` now say `main/web/public`, `docs/page.tsx:42` still says `main/registry/r`, `config.ts:9` still says `main/registry`.
- **`0 runtime dependencies` is false, and the true number is 3** — `app/page.tsx:31`, `app/layout.tsx:20`, `docs/page.tsx:49-54` — all 10 manifests declare `["motion"]`, and `registry/lib/z-cn` declares `["clsx","tailwind-merge"]`, which `packages/cli/src/registry/resolve.ts:54-58` unions across the graph. So `add scrub` installs three packages. The docs page written to correct the hero ("nothing except motion") is also wrong. It is the only hand-typed stat on a row whose other two are derived from the manifest specifically "so the hero cannot drift". *(Merges 4 findings: `zero-runtime-dependencies-is-false`, `hero-claims-zero-runtime-dependencies`, `zero-dependency-is-false`, ticket 1 of `publish-the-cost`.)*

### P1 — credibility and evaluation damage

- **Thirteen-plus controls are under the 44×44 target the project publishes for itself** — `bench.tsx:243` (26px), `code-panel.tsx:35`/`:45` (25/26px), `install-block.tsx:38`/`:48` (24/26px), `catalog-browser.tsx:142`/`:188`/`:219` (30/18/28px), `spring-race.tsx:67` (26px), `page.tsx:315`, `docs/page.tsx:150`, `site-nav.tsx:33-42` (16px), `:47` (32px), `layout.tsx:47-56` (16px) — the two rows a phone visitor must hit to evaluate anything (the file tabs and the bench chips) are 24-26px with 4px gaps; a missed tap reads as "the demo is broken". `PRODUCT.md:61` and `DESIGN.md:96` both state the rule; `registry/` obeys it, the site does not.
- **`border-white/10` is 1.37:1 on interactive boundaries while `--color-control` exists at 3.74:1 for exactly this** — `page.tsx:112`/`:238`/`:315`, `docs/page.tsx:150`, `catalog-browser.tsx:160`/`:188`/`:219`, `c/[slug]/page.tsx:296`/`:303` — a measured WCAG 1.4.11 failure, on a codebase whose own `globals.css:42-46` documents the rule and ships the token. The identical copy button is `border-control` in `code-panel.tsx:45` and `border-white/10` in `page.tsx:315`, so which a contributor copies is a coin flip.
- **Opacity-modified text below the contrast floor, invisible to the linter** — `page.tsx:207` (2.58:1 at 30px, fails even the 3:1 large-text floor), `catalog-browser.tsx:153` (3.22:1 at 12px), `catalog-card.tsx:246` (3.92:1 at 12px, on all ten cards — it is the *gesture hint*, the one word telling a reader how to make the preview move). `lint-contrast.mjs:534`'s regex stops at the `/`, so `text-muted/50` registers as compliant.
- **Signal Mint is the site's generic hover colour and is painted on ~6 static elements at rest** — `page.tsx:76` (a 6px mint dot attached to nothing), plus 9× `hover:border-accent`, 4× `hover:!text-accent`, 2× `hover:bg-accent/5`; at rest: `code-panel.tsx:36`, `install-block.tsx:39`, `spring-race.tsx:67`, and `bench.tsx:245` ×3-at-mount — `DESIGN.md:42` states "An interface at rest shows no mint at all" twice. Only `bench.tsx:157-161` uses it correctly.
- **`--color-hair` is 1.02:1 on `--color-panel` — dividers inside panels are not rendered** — `globals.css:30`, consumed at ~14 sites inside `bg-panel` containers including the States table on all ten component pages and the stage/readout seam in every bench. `lint-contrast.mjs:208-214` declares the pair `decorative` and line 299 skips it, so no floor is asserted at all.
- **45 white/black alpha literals against 34 `border-hair` / 7 `border-control`** — site-wide; 29× `border-white/10` — a distributed cool cast (dE76 ≈ 4.9 against the warm equivalent) on a palette built specifically to avoid it. Note: a fixed-hex replacement would *regress* borders on `panel-2` from 1.36:1 to 1.17:1 — the fix must stay an alpha.
- **Mobile first screen is 49% decoration with the headline clipped** — `page.tsx:131-134` — `order-first` puts the 280px canvas above the h1; 64 nav + 80 padding + 280 canvas + 48 gap = 472px of 576px visible, so the second headline line, the paragraph and the CTA row are all below the fold. `order-first` is a one-token delete.
- **The Source panel opens on `hooks/use-controllable-state.ts` on all ten pages** — `c/[slug]/page.tsx:172-182`, `code-panel.tsx:22-23,43` — `files` is built dependencies-first and `useState(0)` lands on the shared hook, so the default copy hands over the wrong file. `DESIGN.md:68` is satisfied with the wrong code, ten times.
- **No call-site snippet anywhere on the site** — `c/[slug]/page.tsx:212-270` — five sections (Bench, Spring scale, Install, Source, States) and not one `import` or `<Scrub …/>` a reader can paste. The five-minute promise stops one step short.
- **No props reference on any page** — `c/[slug]/page.tsx:212-270`; `registry/schema/registry-item.schema.json:50` sets `additionalProperties: false` on `meta`, so props cannot be added ad hoc — while `DESIGN.md:63` names "Props" as a required section and every `*Props` type already carries per-prop JSDoc that nothing renders.
- **The spring numbers have four sources and two definitions of "rest"** — `docs/page.tsx:12-17` (hardcoded), `spring-race.tsx:16-41` (analytic `4/(ζω₀)`), `packages/cli/src/ui/spring-curve.ts:35-66` (1ms semi-implicit Euler, last exit from ±2%), `z-spring.ts:14-18` (hand-transcribed) — running both integrators over the shipped constants: snap 200 vs 209ms, bounce 571 vs 546ms, settle 333 vs 354ms, fling 267 vs 252ms. The new `z-ui spring` command (commit `a3223b0`) prints one set; `/docs` prints the other.
- **The persistent nav copies `add like-button` on every route** — `site-nav.tsx:8`, rendered at `:45-51` and `:88` — the retired component, on the site's most-seen surface, disagreeing with `page.tsx:10` directly beneath it.
- **Exactly one `:active` state exists on the entire site** — `page.tsx:103` is the only hit; missing at `bench.tsx:238-251`, `code-panel.tsx:29-48`, `install-block.tsx:31-51`, `site-nav.tsx:33-73`, `spring-race.tsx:64-70`, `catalog-browser.tsx:134-222`, `c/[slug]/page.tsx:294-307`, `layout.tsx:47-56` — `DESIGN.md:94` names five required states.
- **Bench tuning never reaches the install command, and `z-ui spring` is unadvertised** — `install-block.tsx:20-24` emits `add ${name}` with no flag while `packages/cli/src/project/spring.ts:33-43` implements install-time spring retargeting and `commands/spring.ts:79` prints `--spring <name>` — grep for `--spring` across `web/` returns zero. The one capability no general registry client can replicate is 100% unpublished.
- **The homepage spends ~1,900px on positioning before the first installable demo** — `page.tsx:66`→`:163`→`:193`→`:218` — hero (836px), then the "Built on" logo strip, then three prose principles, then the first CatalogCard. `PRODUCT.md:48`: "Demonstrate, never explain."
- **No OG image, no `metadataBase`, no sitemap, no `llms.txt`** — `app/layout.tsx:14-21` declares only `title` and `description` — a motion library whose only distribution channel is people sharing links renders a blank grey card every time. *(The OG image is the P1 here; sitemap is P3, llms.txt/Open-in-v0 are unvalidated bets — do not batch them.)*
- **`add` throws without `init` and the site never says the word** — `packages/cli/src/project/config.ts:96-100`, `commands/add.ts:41` — `grep init web/app web/components` returns zero hits. Latent only because nothing is published; it lands the day it publishes.
- **The hero primary CTA is pure `#fff`/`#000`** — `page.tsx:103` — `DESIGN.md:92` forbids both by name, and `site-nav.tsx:80` has already been fixed to `bg-ink`/`text-chassis`, so two "copy the install command" buttons in one viewport are painted in two different whites.
- **The H1 claims a category while every other headline claims a behaviour** — `page.tsx:83-87`, `layout.tsx:16` — "Physics-driven UI architecture." beside "Every component, running.", "Everything is a file you own.", "Two paths, both real." The biggest type on the site is the least testable sentence on it. *(Judgement call, not a defect — treat as a proposal.)*

### P2 — craft debt and misplacement

- **Three `backdrop-blur` surfaces** — `site-nav.tsx:51`, `page.tsx:135`, `:139` — `DESIGN.md:107` bans decorative glassmorphism outright and `:82` (Milled Not Floated) says depth is lightness steps, not blur. `page.tsx:135` stacks glass + pure-white alpha fill + pure-white text on one 60×20px badge.
- **`.lbl` is the declared label voice; 11 sites retype it by hand** — `page.tsx:103`/`:112`/`:139`/`:238`, `scrub-bench.tsx:45`, `undo-toast-bench.tsx:66`, `catalog-browser.tsx:142`/`:181`/`:188`/`:195`, `site-nav.tsx:83` — plus 3 `tracking-[0.05em]` arbitrary values reconstructing it. At ≥640px the two adjacent hero CTAs differ in size, weight *and* tracking.
- **Two tab strips in one scroll disagree on font family** — `code-panel.tsx:35` is `txt-xs` (sans 0.75rem), `install-block.tsx:38` is `lbl-xs` (mono 0.6875rem) — same role, adjacent sections of the same page. Same copy button is square/sand-edged in `code-panel.tsx:45` and rounded/grey-edged in `docs/page.tsx:150`.
- **Tab switching resizes the panel** — `install-block.tsx:25,58-62` — the default tab is shadcn, so the "Not published yet" note row is absent on first paint and appears (+38px) on the reader's first exploratory click. *(The CodePanel half is a convention, not a defect; `max-h-[32rem] overflow-auto` fixes it anyway.)*
- **Both hero canvases bind `pointermove` to `window`** — `spring-coil.tsx:319`, `shader-bg.tsx:193` — both call `getBoundingClientRect()` *before* the visibility check, so every pointer move anywhere on a very tall page forces two layout reads for the page's whole lifetime. No `pointerleave` reset, so tilt sticks wherever the pointer last was. `SAMPLES = 420` at a 520px panel is ~43% oversampled.
- **"13 files in the registry" is the wrong axis** — `page.tsx:24-32` — it is stat 1 (10 components) plus three utilities. Two of the three hero numbers fail a sceptical reader.
- **The hero is built entirely from white/black alpha over an unused warm ramp** — `page.tsx:66`, `:76`, `:103`, `:112`, `:134`, `:135`, `:139` — `rgba(255,255,255,.2)` over `panel-2` drops the R−B gap 15→12.
- **"Spring scale" is byte-identical on all ten component pages and discusses a preset 8 of 10 don't use** — `c/[slug]/page.tsx:225-233` — only `like-button` and `slide-to-confirm` ship `bounce`. Meanwhile `/docs`, whose *subject* is the preset scale, gets a static table and no `<SpringRace/>`. It is misplaced, not redundant.
- **The bounce paragraph is hardcoded on ten pages** — `c/[slug]/page.tsx:226-231`, duplicated at `docs/page.tsx:66-70` — prose asserting that prose does not work, printed above the demo that proves it, on a page whose header chip at `:204-206` already states the component's real preset.
- **The bench never joins a chip to a line of source** — `bench.tsx:62,165-168,193-199` — `defaultSpring` is consumed only as initial state and never surfaced as "the default"; no line says "this chip is that line". *(Mitigated: the spring mirrors to the URL and the header prints `spring · {item.spring}`.)*
- **`/docs` is the anti-reference it warns about** — `docs/page.tsx:1-17,63-97` — zero interactive elements, a hardcoded damping-ratio table, while `spring-race.tsx` computes the same four numbers live one directory away and is mounted only on `/c/[slug]`.
- **Tailwind v4 is an undeclared hard requirement** — `docs/page.tsx:48-60` lists four destination paths and no prerequisites; `scrub.tsx` has no styles outside utility classes; the manifest already admits it via `z-cn: ["clsx","tailwind-merge"]`. Becomes P1 the day install works.
- **No package-manager tabs, no manual-install path, no global palette** — `install-block.tsx:21-24` hardcodes `npx` while `packages/cli/src/project/deps.ts:15` implements `detectPackageManager` — and `catalog-browser.tsx:86-126` already ships `/`-to-focus search over name/gesture/**state**, scoped to one page. Promotion, not construction.
- **Two bench chip labels are wrong, not just vague** — `bench.tsx:210` says `↻ replay` on a site that twice insists "Nothing below is a recording"; `bench.tsx:201-207` labels `full` for `reducedMotion: 'user'`, so a visitor with reduce enabled system-wide clicks "full" and still gets reduced motion.
- **The install card congratulates itself for being honest** — `page.tsx:280` and `docs/page.tsx:35-37` both carry "and says so rather than pretending", which also leaked in from a source comment at `install-block.tsx:16-19`. `install-block.tsx:60` already has the clean sentence.
- **"Primitives" names both the product and its plumbing** — `page.tsx:114`/`:219` vs `docs/page.tsx:50` — and "High-impact primitives." is the one unmeasurable heading on a page of falsifiable ones.
- **`/components` metadata tells search engines to filter by a control that no longer exists** — `app/components/page.tsx:8` says "Filter by category"; the browser filters by gesture. Invisible today (SERP-only); P1 at launch.
- **Reduced motion cannot be compared side by side** — `bench.tsx:145-147,201-207` offers `full`/`reduced` as mutually exclusive chips, requiring toggle-remember-toggle — while `z-spring.ts:52-54` says in a comment that `useReducedMotionConfig` was chosen *specifically* to enable the side-by-side. And `z-spring.ts:62` returns `{ duration: 0 }` while `docs/page.tsx:110-111` explicitly denies that is what ships.

### P3 — real but small

- **Mobile menu has no Escape and no outside-press dismiss** — `site-nav.tsx:18-23,53-92` — `aria-expanded`/`aria-controls` *are* wired, and `catalog-browser.tsx:86-110` already implements the pattern. Skip the focus-move; it is a regression for a non-modal disclosure.
- **No type scale exists** — `globals.css` @theme declares zero `--text-*` tokens; `DESIGN.md:58` marks the values `[to be resolved during implementation]`. One visible symptom: `page.tsx:207`'s decorative ordinal at `text-4xl` is the largest thing in its section.
- **The nav "Install" link routes off a page that has its own Install section** — `site-nav.tsx:13`, `layout.tsx:28-30`; and `page.tsx:111` "Explore primitives" → `#components` (4 cards) while the nav's "Components" → `/components` (10). Two labels, two destinations. *(The back-link claim is already fixed at `c/[slug]/page.tsx:191`.)*
- **Two manifest descriptions exceed the ~155-char SERP render** — `scheduler` (213ch) and `reorder` (193ch) truncate mid-sentence. The 12-to-23-word spread is fine; leave it.
- **`detent · 1` is misleading, not just unscaled** — `sheet-bench.tsx:36` prints the raw index while the sheet sits at the *middle* of three; the shipped component's own `aria-valuetext` (`sheet.tsx:167`) already says "detent 2 of 3".
- **Two strings speak internal language** — `catalog-browser.tsx:239` "more land as they meet the bar" (every *other* use of "the bar" on this site means the scrub track), and `bench.tsx:184-191`'s apology for the absent state row, which renders on **9 of 10** components — the only forceable bench is like-button's, i.e. the one retired from showcase duty. The entire 40-line force-a-state mechanism is now dead weight.
- **The ambition guardrails are worth writing down, but not for the stated reason** — `DESIGN.md` — the claim that this codebase "drifts toward ambient motion under pressure" is refuted by its own source: `reveal.tsx` is gutted, `shader-bg.tsx:133` pins the clock to a constant, `spring-coil.tsx:235-247` self-terminates. Adopt the constraints; rewrite the rationale to "keep this as new instruments land."

---

## The hero problem

**The argument.** Drop the rulebook for a moment — the coil satisfies two of `PRODUCT.md`'s four overshoot conditions, has a genuine `prefers-reduced-motion` path (`spring-coil.tsx:92,247,252-258`), and is driven by the real published presets. Arguing it is "decoration" or "ambient" is refutable in ten seconds by anyone who opens the file, so don't.

The unanswerable argument needs no rule. **It is the only object in the hero with no `add` command behind it.** `PRODUCT.md:13` defines the secondary audience as deciding "within seconds whether the motion is genuinely better than what they would have written themselves." A coil has no baseline to be better than. There is no version of a spring coil that a developer three hours into a feature was going to write. So the biggest, most animated, most captioned thing on the page produces exactly zero evidence about the decision the visitor is there to make — while the four things that *would* produce that evidence sit ~1,900px below, behind a logo strip and three paragraphs. That is the "toy and gimmick" shape `PRODUCT.md:38` names as this project's closest genuine risk, arrived at independently by the user and by four of six audit lenses.

Second charge: it costs. `role="img"` + no `tabIndex` means the hero's only interaction is keyboard-unreachable, and `page.tsx:155` prints "Press and hold" — an instruction a keyboard user cannot follow and a touch user often cannot complete, because adding `touch-action: none` to a panel occupying 49% of the mobile first screen would kill scrolling. The instruction is a lie on the device where a large share of first visits land.

### Recommended replacement: **The Second Tap**

**On screen.** The hero's right panel holds two `Disclosure` instances, stacked, identical content, identical width. Left is labelled `transition: height 300ms ease-out`. Right is labelled `spring settle · ζ 0.74 · t90 173ms`. Below them, one button: **Open both**. Below that, one line of mono: `<Disclosure spring={{ duration: 0.3, ease: 'easeOut' }} />` on the left, `<Disclosure spring="settle" />` on the right.

**What the visitor does.** Press *Open both*. Both panels open; they look broadly similar — that is fine, that is the setup. Then press it again while they are still moving. The eased panel must finish or restart its curve from zero velocity, which reads as a stall then a snap. The spring panel reverses from wherever it is, carrying the velocity it already had, as one continuous motion changing its mind. The button label changes to **Press again, mid-flight** after the first press, because the second press *is* the demo.

**What they learn in 3 seconds.** That the difference is not aesthetic, it is mechanical; that it shows up in the exact interaction users actually perform (the impatient re-tap); and — critically — **that it is one prop on one component**, not an architecture they have to adopt.

**Why this beats the coil.** It is the same shipped file both times: `DisclosureProps.spring` is typed `SpringName | Transition` (`disclosure.tsx:75`) and `useZTransition` (`z-spring.ts:58-64`) passes an arbitrary `Transition` straight through — so `spring={{duration:0.3, ease:'easeOut'}}` is legal, real, and not a strawman. Nobody can accuse you of hand-building a bad easing to lose against. The argument is *already written* at `disclosure.tsx:12-20` — "clicking the trigger again while it is still opening has to finish the first animation before the second can start... A spring has no such seam" — the hero's only job is to stop printing that sentence and start firing it. It closes both P0s at once (`hero-object-proves-nothing-buyable` and `interruption-never-demonstrated`), it brings its own keyboard path, `aria-expanded`, 44px target and reduced-motion branch, and it puts a real `npx @abenor/z-ui add disclosure` under the fold-line object for the first time.

**Registry components used:** `disclosure` ×2. No `like-button`. Fallback if height animation reads too subtle at mobile height: `slide-to-confirm` ×2 driven by one programmatic reversal — but disclosure is the better pick because the *retarget* is the point and height makes retargeting visible without a gesture.

**Cost:** M. Delete `spring-coil.tsx` (~350 lines) and `shader-bg.tsx`; write ~80 lines of hero panel. Argue the shader deletion on `DESIGN.md:17` ("decorative gradients" banned by name), not on ambient-motion grounds — its clock is pinned and that argument loses.

### Credible alternative if that is too large a swing

**Lift `SpringRace` into the hero.** `web/components/bench/spring-race.tsx` already exists, already recomputes ζ/overshoot/t90/rest from the live `springs` object at render (lines 16-41), already fires four presets from one trigger, and `fire = () => setOut(o => !o)` already means a mid-flight re-press reverses — so it demonstrates interruptibility *today*. It is currently mounted only at `c/[slug]/page.tsx:232`, where it is byte-identical on ten pages and explains none of them. Moving it to the hero costs an **S**, fixes `spring-race-is-duplicate-content-on-ten-pages` in the same commit, and puts four real numbers above the fold. It is weaker than The Second Tap — a travelling dot is still not a component you can buy — but it is honest, it is built, and it can ship this week.

---

## The plan

### Wave 1 — Stop the bleeding *(ships today; every item is a one-liner except the first)*

**Outcome:** the site stops physically misbehaving when you press it, and stops printing numbers that its own manifests contradict. A visitor's first click no longer moves the button out from under their pointer.

| Work | Files | Effort |
|---|---|---|
| Grid-stack CopyButton: both labels in one cell (`gridArea:'1/1'`), toggle opacity, keep the icon slot alive and swap glyph copy→check→alert, add `<span className="sr-only" role="status" aria-live="polite">` | `copy-button.tsx:44` (fixes 7 call sites) | M |
| Derive the dependency count instead of typing it: `new Set(items.flatMap(i => i.dependencies)).size` → 3; drop "Zero-dependency" from the OG description; correct the docs sentence | `page.tsx:31`, `layout.tsx:20`, `docs/page.tsx:49-54` | S |
| Point the nav at the same command as the hero | `site-nav.tsx:8` | S |
| Export `REGISTRY_BASE` and consume it in all four places | `install-block.tsx:12-13`, `docs/page.tsx:42`, `page.tsx:271`, `packages/cli/src/project/config.ts:9` | S |
| CTA: `bg-white text-black` → `bg-ink text-chassis`, match nav's `hover:bg-ink/85 active:bg-ink/75`, delete `hover:scale-[0.98]` so press is a legible 4% | `page.tsx:103` | S |
| Delete the static mint dot | `page.tsx:76` | S |
| Delete both hero badges (kills LIVE PHYSICS, "Press and hold", `bg-white/10`, `bg-black/50`, 2× `backdrop-blur`) | `page.tsx:135-137`, `:139-156` | S |
| Delete `order-first`, base height 280→180 — recovers the clipped headline, paragraph and CTA row on mobile | `page.tsx:133-134` | S |
| Open the Source panel on the component: `Math.max(0, files.findIndex(f => f.key.startsWith(item.name + '/')))` | `code-panel.tsx:22` | S |
| Delete the bounce paragraph (improves all ten pages from one file) | `c/[slug]/page.tsx:226-231` | S |
| Delete `opacity-70` / `opacity-60`; `text-muted/50` → `text-muted`, cap ordinals at `text-2xl sm:text-3xl` | `catalog-card.tsx:246`, `catalog-browser.tsx:153`, `page.tsx:207` | S |
| Render no state row when `forceable={false}` (9 of 10 pages currently show an apology) | `bench.tsx:184-191` | S |
| Always render the install note row, `visibility:hidden` on the ready tab; `max-h-[32rem] overflow-auto` on `.code` | `install-block.tsx:58-62`, `code-panel.tsx:51` | S |
| `↻ replay` → `↻ reset`; motion row → `prefers-reduced-motion` / `no-preference` / `reduce`; detent readout mirrors `aria-valuetext` | `bench.tsx:210`, `:201-207`, `sheet-bench.tsx:36` | S |
| Delete "and says so rather than pretending" ×2 | `page.tsx:280`, `docs/page.tsx:36-37` | S |
| Move `pointermove` off `window` onto the hero `<section>` (NOT the canvas — it is `pointer-events-none`), add `pointerleave` reset | `spring-coil.tsx:319`, `shader-bg.tsx:193` | S |

### Wave 2 — Make it obtainable *(blocked on one decision the user must make)*

**Outcome:** the command on the page actually installs something. Right now nothing in this product can be acquired by anyone.

- **Pick a host.** There is no `metadataBase`, no `NEXT_PUBLIC_SITE_URL`, nothing in `web/next.config.ts`. Either merge to `main` so `raw.githubusercontent.com/.../main/web/public/r/*.json` resolves, or deploy and serve `/r/*.json` from the site's own origin. Everything else in this wave is blocked on this. **S once decided.**
- Build-time self-fetch assertion in `web/scripts/build-registry.mjs` — the only thing that keeps the `ready` badge honest. **S**
- `add` falls back to `DEFAULT_CONFIG` (`config.ts:43-53`) when `z-ui.json` is absent and prints the aliases it assumed, instead of throwing (`config.ts:96-100`). A first install should not require a ceremony file. **S**
- `requires: React 19 · motion · Tailwind CSS v4` in the docs "What lands" block and every Install section — cite `tailwind-merge` in the manifest as the proof. Same paragraph as the dependency-count fix. **S**

### Wave 3 — The hero *(the user's own complaint)*

**Outcome:** in the first three seconds a visitor watches a real component do the thing no other library's component does, and can install it from the same viewport.

- Build **The Second Tap** (§above). Delete `spring-coil.tsx` and `shader-bg.tsx`. **L**
- Reuse `<InstallBlock name="disclosure" />` in the hero — it already defaults to the shadcn tab and already renders "Not published yet" honestly. Kills the bespoke CTA and its four palette violations at once. **S**
- Reorder the page: catalog directly under the hero; the three principles compressed to one-line assertions below it; delete the "Built on" strip and fold Tailwind + motion into Install as a prerequisite line. **M** — this also discharges half of the Tailwind finding.
- Move `<SpringRace/>` to `/docs` (where its subject *is* the preset scale) and move Install directly under Bench on `/c/[slug]`. **S**

### Wave 4 — The control layer

**Outcome:** every control on the site is hittable on a phone, has a visible edge, and answers a press.

- One `.control` class in `globals.css @layer components` carrying border/hover/**active**/focus; press = one tonal step (`panel`→`panel-2`), `scale(0.97)` with `springs.snap` reserved for sub-48px. Apply at ~12 call sites. **M**
- `min-h-11 inline-flex items-center` on chips/tabs/panel copy buttons (visual size unchanged), `py-3 -my-3` on nav and footer links, `before:absolute before:-inset-3` on the esc button. **M**
- Declare `--color-edge: rgb(232 228 220 / 0.10)` — Silkscreen Sand at 10%, warm, holds ~1.33:1 on all four grounds the way `white/10` does — and codemod 29 `border-white/10` → `border-edge`, `-white/20|30` → `border-control`, the `bg-white/5|10|15` pills → `bg-panel-2`. Add `--color-hair-2: #2f261e` (1.20:1 on panel) for the ~14 dividers inside panels. **M**
- Purge accent: 9× `hover:border-accent` → `hover:border-control`, 4× `hover:!text-accent` → `hover:text-ink` (drop the `!` — Tailwind v4 layer order already wins), delete both `hover:bg-accent/5`, and fix the four at-rest sites. Use `catalog-browser.tsx:148`'s fill-inversion idiom for selected states, not mint. **M**
- Extend `lint-contrast.mjs` with three denylists: `-white/\d`/`-black/\d` scoped to `<button|<input|role="button"`, literal `bg-white|text-black|backdrop-blur|<tailwind palette name>` under `web/app` + `web/components`, and `text-[\w-]+/\d+`/`opacity-\d+` on text-bearing elements. **S** — note `lint-contrast.mjs:587` will demand PAIRS entries for `edge` and `hair-2`, and a decorative-perceptibility floor breaks **three** existing pairs, so retune in one commit or CI lands red.
- Convert 11 raw `font-mono text-xs` sites to `.lbl`, add a colourless `.lbl-ctl` sibling, delete 3 `tracking-[0.05em]`, make `code-panel.tsx:35` use `lbl-xs` to match `install-block.tsx:38`. **S**

### Wave 5 — The page a decided reader needs

**Outcome:** a reader who has decided can get from "I want this" to working code without opening a 330-line file.

- **Use it** block between Bench and Install, generated from an `@example` JSDoc tag via `build-registry.mjs`, shipped as `meta.usage`. **M**
- **Props** table from the existing `*Props` JSDoc — add `meta.props` to the schema (relax `additionalProperties:false` at `registry-item.schema.json:50`), gate it by copying the three-way STATES check at `lint-registry.mjs:151-170`, render with the existing States table markup. `DESIGN.md:63` already specified this section. **M**
- Lift `spring` state out of `Bench` into the page and pass it down: `<InstallBlock name={item.name} spring={spring !== item.spring ? spring : undefined} />` → the command becomes `add scrub --spring bounce`. **S**
- One canonical spring computation: pick `simulateSpring` (`spring-curve.ts:35-66`), relabel the column with its definition ("last exit from the ±2% band"), delete the hardcoded array at `docs/page.tsx:12-17`, and extend the tripwire at `packages/cli/test/unit.test.ts:270-282` to regenerate the `z-spring.ts:14-18` doc table. **S**
- `app/opengraph-image.tsx` + `openGraph`/`metadataBase` in layout; `app/sitemap.ts` off the same `components` array. **M** — hold `llms.txt` and Open-in-v0 until someone confirms v0 ingests this manifest shape.

---

## Signature moves

**1. The Second Tap in the hero.**
Two instances of the same shipped `Disclosure`, one prop different, one trigger, and the payoff is the interruption. Only Z-UI can run this: the A/B is not a mock-up, it is `spring?: SpringName | Transition` (`disclosure.tsx:75`) accepting a real `Transition` on the same code path, so the eased side is the *actual* component behaving the way every other library's disclosure behaves. Cost: **L**, and it deletes ~500 lines of canvas. Toy risk: **low** — the subject is a shipped component under the gesture users actually perform.

**2. One trace strip, two modes.**
A single canvas inside the bench readout row (`bench.tsx:151-169`) that plots the driven MotionValue against time while you drag. Mode A: your own gesture, drawn. Mode B: two traces with a programmatic reversal fired at a fixed *t* — the Interrupt instrument becomes a *mode* of the strip rather than a second widget. Only Z-UI can ship this because the bench already reads state from the DOM via MutationObserver and already owns the frame loop; the drawing is the missing 20%. Prototyped and never shipped: `showcase-ideas/5-oscilloscope.html:58-60`. Cost: **L** (collapses the separate L + M of the two findings into roughly one L). **Toy risk: this is the one that can tip.** An oscilloscope is a gadget unless it is bound by rules — enforce in code: draws only while a gesture or settle is in flight, freezes the last trace at rest, never runs on mount, renders a square-wave step under `prefers-reduced-motion`. If any of those four slip, delete it.

**3. Install-time spring retargeting, published.**
`packages/cli/src/project/spring.ts:33-43` rewrites the `spring = 'settle'` literal at install time, and commit `a3223b0` shipped a whole `z-ui spring` command whose closing line prints `z-ui add <name> --spring <name>`. The website mentions none of it — grep for `--spring` across `web/` returns zero. Wire the bench's chip choice into the install command, and put the CLI's ASCII curve gallery (`commands/spring.ts:84-103`, it pastes straight into a `<pre>`) on `/docs`. **No general registry client can do this** — shadcn's registry format has no concept of rewriting a value at install time. Cost: **S**. Toy risk: none; it is the most product-shaped idea in the set.

**4. Reduced motion, side by side, on one trigger.**
`z-spring.ts:52-54` says in a comment that `useReducedMotionConfig` was chosen precisely so a docs page could "demonstrate the reduced-motion branch beside the full one without asking the reader to change an OS setting." That demo was never built. No competitor shows their reduced-motion path at all. Cost: **M** — but **sequence a reconciliation first**: `z-spring.ts:62` returns `{ duration: 0 }` while `docs/page.tsx:110-111` says "A zero-duration animation is not the same thing as a considered instant transition, and every component ships the latter." Run the compare mode privately across all ten components before shipping it publicly; a view that reveals `duration: 0` beside a page denying it is worse than no view. Toy risk: none — this is the opposite of a toy.

**5. Publish the cost.**
`code-panel.tsx:53-57` already prints lines + sha and claims "matches /r/". Add gzipped bytes per component *including its transitive registry deps*, computed in `build-registry.mjs`. Every copy-paste registry hides this number; a source-distribution library that publishes it is making the one comparison npm packages can't dodge. Cost: **M**, and it is strictly downstream of Wave 1's honest dependency count — do not ship a byte number while the dependency number is still `0`. Toy risk: none.

---

## What is already good

Do not touch these.

- **`bench.tsx:98-111`** reads `data-state` off the DOM with a MutationObserver rather than from React state, explicitly so that if the two ever disagree the bench *shows* the disagreement. And `bench.tsx:35-129` drives components by dispatching real `PointerEvent`s — the author verified that React's synthetic delegation reconstructs from `pointerover`, not `pointerenter`. This is the best instrument on the site and nothing in the category has an equivalent.
- **`scripts/lint-contrast.mjs`** transcribes WCAG 2.x rather than approximating it (with a comment on why the linearisation threshold is 0.03928 and not 0.04045), composites translucent foregrounds before taking the ratio instead of reporting the flattering opaque number, and *fails* when a token has no declared pair. It is designed to not be green-and-lying. Its two blind spots (opacity utilities, alpha literals) are the P1s above — close them, don't rewrite it.
- **`packages/cli/test/unit.test.ts:270-282`** regex-parses `z-spring.ts` and asserts the CLI's constants match, with the comment "A copy that can silently drift is worse than no copy; a copy with a tripwire is fine." The spring-numbers fix is extending this pattern one level up, not introducing discipline that is missing.
- **`reveal.tsx`** was gutted to a bare `<div>` with a comment admitting its previous doc-comment argued against the pattern while shipping it. `grep -rn 'shadow-' app components` returns zero. `shader-bg.tsx:133` pins the clock to a constant; `spring-coil.tsx:235-247` self-terminates at rest. Three ambient-motion violations hunted down and removed, each with the rule cited in code. That discipline is real.
- **The per-component bench notes** (`c/[slug]/page.tsx:44-164`) and the **state glosses** (`:312-369`) are the best writing in the repository — "drag the knob short of the end and let go", "a hand on the panel", "released, the handle still catching up". Physical nouns, imperative openings, falsifiable consequences. That is the voice `PRODUCT.md` specifies, executed.
- **`catalog-browser.tsx:143-150`** gets the hardest call right: the selected chip is a fill inversion (`border-ink bg-ink text-chassis`), not a hue, with the reasoning inline — "a chip that stays selected is an interface at rest, and mint at rest would compete with the components." Copy this idiom everywhere in Wave 4.
- **One global focus ring** (`globals.css:119-122`), never reinvented, and the entire land→browse→open→copy flow is completable keyboard-only with a visible indicator at every step. Most component-library sites fail this outright.
- **`min-h-[clamp(620px,calc(100svh-4rem),880px)]`** correctly subtracts the nav and uses `svh` so a mobile URL-bar collapse does not resize the hero. `scroll-mt-20` against a 64px nav gives 16px of deliberate clearance. Someone measured.
- **`not-found.tsx`** turns a mistyped slug into the whole registry plus the scope-refusal argument. **`InstallBlock` defaults to `active = 1`** — the shadcn tab, not the vanity first-party one. The honest default was chosen over the flattering one.
