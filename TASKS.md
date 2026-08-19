# TASKS — Z-UI website

Check items off as they complete. Order is binding: do not start a phase before the previous
one's items are done.

## Phase 1 — Setup

- [x] .claude/CLAUDE.md (working instructions, source-of-truth rule)
- [x] PRD.md (verbatim product facts + goals/non-goals + sitemap + flows + success criteria)
- [x] DESIGN.md (committed creative direction + Assumptions section)
- [x] ARCHITECTURE.md (framework reasoning, structure, motion plan, primitives plan)
- [x] TASKS.md (this file)
- [x] package.json, .gitignore, README.md
- [x] Vite + TypeScript strict + ESLint + Prettier configs
- [x] Dependencies installed (react, react-router, motion, fontsource)

## Phase 2 — Foundation

- [x] tokens.css (palette, type, 8pt grid) — colors exist nowhere else
- [x] base.css (reset, ::selection, :focus-visible, hairline utilities, reduced-motion)
- [x] lib/springs.ts (STIFF 1300/46, SOFT 300/30, reduced-motion collapse)
- [x] lib hooks: useReducedMotion, useInView, VelocityTracker, useLiveSamples, format
- [x] Shell (ruled grid frame, column rules), Nav, Footer (repo/npm/license links)
- [x] Section (hairline + "NN / LABEL" mono label), Page transition (30ms stagger, stiff spring)
- [x] CodeBlock with spring-animated copy affordance; Readout; SpringGraph; Terminal
- [x] Routes wired for all pages incl. 404 catch-all; AnimatePresence transitions

## Phase 3 — Flagship physics

- [x] ScrambleReveal (needed by Section labels site-wide)
- [x] Dial: flywheel friction, detent ticks, spring catch at 1300/46, interrupt + velocity
      carry-over, reduced-motion click-to-step
      — verified live: flick → 9.17 rad/s freewheel, detent counter ticking, 64-pt telemetry
- [x] Home: headline left, dial right, live rad/s + 1300/46 readout, install command block,
      refusals copy — dial interactive < 1s, nothing autoplays
- [x] Chase: two independent edge springs (stiff leads, soft trails), emergent stretch,
      first-interaction hairline annotation
      — verified live: indicator width 50 → 300 peak → 122 settle (stretch is emergent)
- [x] Library: chase as the real category filter; 7 live compact previews; animated re-filtering

## Phase 4 — Remaining playgrounds

- [x] Heft page: full-width sandbox, gravity/contacts/friction, spawn button, contact readout
      — verified live: pulling a support box drops the stack above; contacts readout updates
- [x] Disclosure page: playground + height-over-time graph proving carry-over
      — verified live: interrupt at 158px reversed continuously, no snap
- [x] HoldDrain page: symmetric climb/drain, fill % + rate readouts, one dry caption
      — verified live: +60.0 %/s climb, −60.0 %/s drain, full hold → confirmed
- [x] LateCritique page: real email field + timestamped mono decision log
      — verified live: verdicts withheld mid-word, idle verdict, same-frame clear in the log
- [x] ScrambleReveal page: hover / mount / in-view playground
- [x] Dial page: playground + last-3s velocity graph
- [x] Chase page: playground + annotation

## Phase 5 — Content pages

- [x] /cli: 7 commands with examples, flags, install guarantee, --spring refusal featured,
      shadcn fallback
- [x] /architecture: the four real decisions + repo structure
- [x] /docs: getting started; accordions are real Disclosure instances (verified interruptible)
- [x] Footer repo/links/contact final
- [x] 404 per spec (heft physics, dry voice) — verified: boxes drop on first touch only

## Phase 6 — Polish

- [x] MICRO-DETAILS checklist in DESIGN.md, item by item (see DESIGN.md — all checked)
- [x] Anti-pattern sweep: grep clean for gradients / Inter / ease-in-out; every box-shadow is
      the single contact-shadow token on pressed or dragged elements only
- [x] Responsive + touch pass (390px viewport checked; registry table scrolls; physics use
      pointer events + touch-action none)
- [x] Performance pass: all animation is transform/clip; heft renders imperative translate3d
      and sleeps when still; dial/hold-drain integrators clamp dt and idle at rest
- [x] `npm run build` + `npm run typecheck` + `npm run lint` clean; all 12 routes rendered in
      a real browser (Playwright), zero console errors

## Phase 7 — Final self-review

- [x] Voice audit: grep clean for banned marketing phrases in all site copy
- [x] Fact audit: exactly 7 components, exactly 7 CLI commands, exactly the documented flags
      and 4 architecture decisions — nothing invented
- [x] DESIGN.md Assumptions section complete (A1–A12)
- [x] Summary to user: what was built, how to run, assumptions to review

## Bugs found & fixed during verification

- rAF first-frame timestamps can precede performance.now() → negative dt killed the hold-drain
  loop at fill=0 and could perturb dial/heft integration. Fixed: dt clamped ≥ 0 everywhere;
  hold-drain zero-exit only when not holding.
- Chase ResizeObserver re-ran on every value change and its observe-fire jumped both edges to
  the target, deleting the animation. Fixed: observe once, ignore non-resize fires.
- Heft could sleep while boxes were still slightly interpenetrated (velocity-only sleep test).
  Fixed: sleep blocked while residual penetration exists.
- Flex-centered card previews collapsed heft/hold-drain to zero width. Fixed with explicit
  width: 100%.

## Phase 8 — Candidate bench (site-only; PRODUCT FACTS unchanged)

- [x] Source study of originkit.dev, transitions.dev, orbs.jakubantalik.com, agentation.com —
      mechanics extracted, written up in CANDIDATES.md with what each candidate refuses to inherit
- [x] CANDIDATES.md: 14-candidate slate + 3 refinements to existing components
- [x] `reel` — per-digit flywheel, impulse sized to friction, spring catch, mid-spin retarget
- [x] `origin` — pointer-anchored clip circle, stiff radius + soft anchor, closes toward the pointer
- [x] `grip` — stick-slip, 22px break-loose, 8px kinetic lag, holds where it stuck
- [x] `intent` — heading/speed verdict with no open or close timer, cone widened by target size
- [x] `/candidates` route + nav entry + bench link from /components; header states not-in-registry
- [x] DESIGN.md Assumptions A13–A14 recorded
- [x] typecheck + lint + build clean; all four exercised in a real browser (Chrome via Puppeteer)
- [x] Reduced-motion verified in-browser under --force-prefers-reduced-motion: reel jumps to the
      new value with no spin, origin's clip jumps to the exact cover radius and collapses in one
      frame, grip's lurch becomes a jump, intent has no motion to reduce
- [ ] Wave 2 (slack, dock, toss, slosh, peel, handoff, tick, hysteresis, scrub, grace)

## Phase 9 — Landing rebuilt on the transitions.dev model (user-directed)

- [x] Palette flipped to dark site-wide in tokens.css; graph-paper tile restroked to #2A2723
- [x] Centered hero: mark tile + single radial glow + pill CTAs + install pill
- [x] DemoCard: uniform stage, real-input trigger, title + one-line mechanism, copy-install
- [x] Imperative handles so a card trigger can fire real input — Dial.flick, HoldDrain.hold,
      LateCritique.type (native setter + real InputEvents), Origin.openAt, Grip.push
- [x] Landing grid: 11 live cards (7 registry + 4 candidates, badged)
- [x] PRD.md non-goal revised (centered-hero/dark ban lifted, recorded as user-directed)
- [x] DESIGN.md: palette revised, first frame marked superseded, "Revision 2026-08-18" written
- [x] typecheck + lint + build clean; all 11 triggers exercised in-browser, zero console errors
- [x] Reduced-motion pass over the new landing: flick steps one detent instantly, origin's clip
      jumps to full radius, reel/grip jump, scramble renders final text — zero console errors
- [x] Contrast audit against the dark palette — hero title 17.1, subhead 8.16, card title 15.71,
      card subtitle 5.52, trigger 17.1, install pill 6.55, primary CTA 17.1, signal readouts 5.8,
      candidate badge 5.8. All ≥ 4.5 (WCAG AA for small text)
- [ ] Dead light-theme CSS (.hero*, .hero-instrument, .hero-readouts) still in site.css — unused
      since the landing rebuild, safe to delete

## Phase 10 — Detail pages rebuilt (sidebar + tabs + real registry source)

- [x] ComponentNav: sticky sidebar, registry grouped by category, bench listed separately
- [x] Prev / next arrows + ← / → keyboard, guarded so role=slider and text inputs keep their keys
- [x] Tabs: preview / source / install
- [x] registrySource.ts: fetches the published registry item from raw GitHub, sessionStorage
      cache (raw GitHub allows ~60 req/hour), honest 404 and error states
- [x] Install tab warns when the shadcn fallback URL 404s for that component
- [x] Seven detail pages migrated to the `preview` prop; measured sections stay below the tabs
- [x] Verified in-browser: disclosure renders its real 463-line registry file; dial reports
      "not published yet"; arrow keys navigate from the page but not from a focused dial
- [ ] REGISTRY GAP: registry/components on Abenor-Labs/z-ui holds four items — disclosure,
      hold-drain, late-critique, scramble-reveal. dial, chase and heft are not published, so
      their shadcn fallback commands 404. PRD PRODUCT FACTS still says seven.

## Phase 11 — transitions.dev skills applied (chrome only)

- [x] `transitions review` run over the project: zero pre-existing CSS transitions, @keyframes or
      cubic-beziers — every chrome state change was instant, which is what read as unsmooth
- [x] motion.css: shared token scale installed from the skill's _root.css
- [x] 16 · tabs sliding installed, then replaced: the detail tab bar is a real chase instance, so
      the site has ONE mechanism for a moving indicator and it is the product's own. Verified:
      width 78 → 160 → 78 while travelling 3px → 153px. The skill's snippet and its variables were
      removed from motion.css rather than left as dead CSS
- [x] 14 · skeleton loader and reveal installed verbatim on the registry read
- [x] polish pass on chrome: hover-in --duration-quick, resting --duration-fast, --ease-smooth-out,
      smooth anchor scrolling, all behind a prefers-reduced-motion guard
- [x] Scope held: no component physics touched — springs, integrators and velocity carry-over
      unchanged in all eleven components
- [x] Verified in-browser: pill tweens 3px→80px over 250ms and snaps without animation on first
      paint; skeleton classes flip and cross-fade; hover transitions report 0.25s/0.15s on the
      token easing
- [x] DESIGN.md "Revision 2026-08-18b" records the scope line

- [x] Chase gained an optional `label` prop so the tablist can be named per use (Filter vs
      Component views); no other change to its physics

## Phase 12 — /cli becomes an actual CLI

- [x] cliEngine.ts: parser + output for the seven real commands and the documented flags; refuses
      unknown verbs by printing the seven; no invented surface area
- [x] `spring <name>` plots the damped step response from the real constants as ASCII — dial
      1300/46 computes to 7.4% overshoot, ~170ms settle (matches exp(-πζ/√(1-ζ²)) for ζ=0.638)
- [x] `add --spring <preset>` runs the real refusal, naming the numbers to edit by hand
- [x] `add --dry-run` prints the plan and writes nothing; plain `add` states the write guarantee
- [x] Console.tsx: prompt, history (↑/↓), Tab completion with shell-style ambiguous-candidate
      listing, Ctrl+L, clear button, click-to-focus, example chips. No fake typing, no autoplay
- [x] Static Terminal.tsx deleted — the console replaces it
- [x] Bug found and fixed by testing: flag values were parsed as positional args, so
      `add dial --spring settle` reported "no component named settle"
- [x] DESIGN.md A6 revised to cover the interactive shell
- [x] typecheck + lint + build clean; every command exercised in-browser

## Phase 12 — /cli looks and behaves like a CLI

- [x] Recreated Console + engine lost in the session restart; deleted Terminal.tsx import that was
      breaking the dev server (`Failed to resolve import "../components/Terminal"`)
- [x] Ran the real published CLI (v0.1.1) in a scratch project and captured eight transcripts:
      --help, list, preview disclosure, spring settle, add --dry-run, add --spring settle (the
      refusal), add -y, doctor
- [x] src/data/cliRecordings.ts — verbatim transcripts, line kinds classified by the CLI's own
      glyphs (✓ ✗ › │ ◇), npm noise trimmed and marked
- [x] CliCast — the recorded session replayed: types the command, prints the real output, play /
      pause / restart, step jump buttons, per-step notes. No autoplay; reduced motion renders the
      whole transcript at once and hides the transport
- [x] Console — types resolve against the recordings; anything unrecorded says so and points at
      the real command instead of faking output
- [x] /cli rewritten: cast → shell → commands → flags (all ten real ones) → refusal → guarantee →
      fallback
- [x] DESIGN.md A6 marked superseded; CLI-FINDINGS.md records eight conflicts between PRODUCT
      FACTS and the shipped CLI
- [x] typecheck + lint + build clean; every new module transforms 200 in the dev server
- [ ] Browser DOM verification of the cast transport — the puppeteer/playwright MCP servers are
      disconnected this session, so this pass was compile-and-serve only
- [ ] Decision needed on CLI-FINDINGS.md #1 and #6 (four published components vs seven documented;
      site springs are dial's and dial is unpublished)

## Phase 13 — heft physics repair + orbs-style playground (2026-08-19)

- [x] Reproduced the heft failure headlessly before touching it: the solver's contact test read
      `rel < 0`, which is the SEPARATING case, so resting bodies got positional correction but no
      normal impulse — a box dropped on a box measured vy = 5400 px/s after 3s, a 4-box stack sat
      12.13px interpenetrated, and nothing ever slept (permanent rAF burn)
- [x] Proved the second failure was convergence, not tuning: with the test corrected, a 7-box stack
      still crept at 13 px/s at 16 iterations; swept iterations, wall-solve order and correction
      bias to rule each out
- [x] Rewrote step() as a manifold solver — build contacts (walls + pairs) → warm start from cached
      impulses → 8 velocity iterations with accumulated-impulse clamping and Coulomb friction →
      integrate positions → 3 position-only penetration passes
- [x] Fixed seeding: auto-placed bodies now wrap onto a new row instead of clamping to an identical
      x, which used to seed the pile deeply interpenetrated on narrow containers
- [x] Rejected a hard wall clamp after measuring it regress resting bodies to 14400 px/s; recorded
      why in a comment and in DESIGN.md A16
- [x] Verified by extracting the shipped step() from Heft.tsx via esbuild and running it headless:
      7/7 scenarios settle (drop, 4/12-box stacks, page seed, thrown box, 25 spawned, drag the
      bottom box out) at <= 0.50px penetration, all asleep; 25 bodies cost 0.9% of the frame budget
- [x] New Playground shell (src/components/Playground.tsx): controls panel → live stage + readouts
      → optional footer → generated code block
- [x] All seven detail pages rebuilt on it with preset control groups (DESIGN.md A15)
- [x] typecheck + lint + build clean; all seven pages render under react-dom/server with their
      controls and code block present
- [ ] Browser DOM verification of the new playground — still no playwright/puppeteer MCP this
      session, so this pass was compile-and-render only, same limitation as Phase 12
- [ ] Speed multiplier + pause transport from the reference playground (deferred by decision, A15)
- [x] Rotary-dial face for `dial` — built 2026-08-19, see Phase 15

## Phase 14 — the two repos became one (2026-08-19, unattended)

Context: `z-ui updated` was a separate directory holding a rebuilt site and a second
implementation of all seven components. This repo held the registry, the CLI and the publishing
pipeline. Phase 14 merged them without losing either.

- [x] Committed the old working tree before touching anything — 55 dirty files and three
      finished components (`dial`, `chase`, `heft`) that had never been tracked at all. Split
      into two commits: the publish set isolated so it can be cherry-picked onto `main`, then an
      unreviewed snapshot of the rest. (Correction: this was first recorded as also including
      "3 unpushed commits". Those three were ahead of `main` but already on the remote as
      `fix/first-contact` — open as PR #13. Only the new work was ever unpushed.)
- [x] Established the branch topology, which was not what it looked like: `publish/dial-chase-heft`
      and `site/vite-swap` were cut from `fix/first-contact`, so every new commit stacks on top of
      an open PR rather than on `main`
- [x] Established that this is not a port but a choice: the registry components are already
      self-contained (351–702 lines, zero relative imports) and the site's are separate
      reimplementations. `heft` differs by physics *model* — circular penalty solver here,
      axis-aligned sequential impulses there. Registry components were therefore left alone
- [x] Confirmed the real constraint before moving anything: the published CLI hardcodes
      `raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public`, so `web/public/r/` is a
      fixed repo path. ADR 0003 means it is fetched from raw GitHub, not served by the site —
      so the website itself was free to move
- [x] `web/` reduced to the registry build: `scripts/build-registry.mjs`, `public/`,
      `__generated__/`. Its package.json dropped Next, React and Tailwind and kept shiki
- [x] `site/` added as `@z-ui/site` in the pnpm workspace — the Vite rebuild, building clean
- [x] `liquid-gooey` removed from the site along with its sandbox route and import
- [x] Nothing deleted. `archive/` created with a README explaining every entry: `web-next/`
      (the Next app), `showcase-ideas/` (14 HTML studies), `prototypes/`, `docs-v1/` (the
      original PRODUCT.md and DESIGN.md), `gooey-sandbox/`
- [x] Root docs replaced with the rebuild's PRD / DESIGN / CANDIDATES / ARCHITECTURE /
      CLI-FINDINGS / TASKS. `.claude/CLAUDE.md` rewritten — this repo is no longer "the website,
      not the registry"; it is both
- [x] `components/` and `z-ui.json` untracked as CLI hand-test scaffolding, kept on disk, with
      ignore rules anchored so they cannot swallow `web/components` or `site/src/components`
- [x] CI retargeted: it built `@z-ui/web`, which no longer has a build script
- [x] Verified: `site` builds; `build-registry.mjs --check` clean at 12 files; anchored ignore
      rules confirmed against the real directories; 67 renames recorded at 100% similarity so
      archived history survives
- [x] Ran the repo's own gates rather than assuming the move was clean — three had broken:
  - `lint:registry` read `web/tsconfig.json` to check alias resolution in both workspaces. The
    Vite site does not import registry components at all, so the check now covers only
    `registry/tsconfig.json`. Passes at 165 checks across 7 items
  - `test:spring-math` broke because `web/lib/spring-math.ts` had been archived with the Next
    app. That was my error — it is shared math, not site UI. Restored to `web/lib/`, 3 tests pass
  - `lint:contrast` and its test parse Tailwind v4 `@theme` blocks and `text-*`/`bg-*` utilities.
    Their subject is the archived Next app; the Vite site uses plain custom properties, so
    repointing them would parse nothing and pass without checking anything. Archived alongside
    the app at `archive/web-next/scripts/` and removed from CI and `verify` rather than left to
    fail or, worse, pass falsely
- [x] Fixed doc drift the move caused: the CLI's `DEFAULT_REGISTRY` comment named
      `web/lib/registry.ts` as the site's copy of the URL. It now names
      `site/src/lib/registrySource.ts` and `site/src/data/registry.ts`
- [x] Final sweep, all green: lint:registry, lint:registry:test, lint:motion:test,
      registry:check, test:spring-math, CLI test, CLI typecheck, CLI build

### Not done, deliberately

- [ ] **Nothing pushed.** Three local commits sit on `publish/dial-chase-heft` and
      `site/vite-swap`. Pushing publishes to a public repo and that decision was not mine to make
- [ ] **`pnpm install` not run for real** — only the lockfile was regenerated. CI runs
      `--frozen-lockfile`, so the lockfile must be correct before the first push
- [ ] **No browser verification.** Still no playwright/puppeteer MCP, third session running.
      The site compiles and the registry check passes; nobody has looked at the pixels
- [ ] **Deploy config untouched.** There is no `vercel.json` or `netlify.toml` in the repo, so
      the build command lives in a hosting dashboard. Whoever owns that must change the
      framework preset from Next to Vite and the output directory to `site/dist`
- [ ] **`README.md` at root still describes the old site.** Left alone rather than rewritten
      unattended
- [ ] ADR cross-links to `PRODUCT.md` / `DESIGN.md` now resolve into `archive/docs-v1/`.
      Accurate, but the ADRs were not edited
- [ ] **The site has no contrast gate.** The old one was Tailwind-specific and is archived. A
      replacement written against `site/src/styles/tokens.css` custom properties is owed, and
      until it exists a colour mistake in the site ships unchecked. Registry components are
      unaffected — nothing about their colour handling changed
- [ ] `site/src/zui/` and `registry/components/` remain two implementations of the same seven
      names. Deliberate. Each registry component is replaced only when a specific one earns it
      on evidence, the way `heft` did on 2026-08-19

## Phase 15 — dial gets a rotary face (2026-08-19)

Designed in conversation, then parked when the session pivoted to the playground/heft work.
Recapped and built once the user asked where it had gone.

- [x] `site/src/lib/rotary.ts` — pure geometry, no React/motion: `holeRestAngle`, `pullDistance`,
      `nearestDigit`, `angleDelta`, `from3OClock`, `polar`. Verified headlessly against the
      original design table before any component code was written: all ten pull distances (60°
      digit 1 through 330° digit 0) match exactly, every hole self-identifies at its own rest
      angle, and pull-distance math agrees with nearest-hole math at the stop for all ten digits
- [x] `Dial.tsx` gains `mode?: 'flywheel' | 'rotary'` (default `flywheel`, unchanged) and a
      `dialDigit(n)` handle method alongside the existing `flick()`. Rotary adds: hard-walled drag
      clamped to `[0, pullDistance(digit)]`; a 30° commit threshold below which release aborts with
      no digit fired; a constant-300°/s governed return (a real rAF loop, not a decay) handing the
      last 15° to the shared 1300/46 spring; interruptible in both directions — grabbing mid-return
      re-identifies the nearest hole and redirects; `onDetent` fires once, on seat; number keys 0-9
      dial directly; reduced motion collapses the whole gesture to click-a-hole → instant home →
      immediate fire
      - self-review caught two real defects before they shipped: a duplicated
        `dialDigitViaKey`/imperative-handle pair (extracted to one shared `startDial`), and the
        rotary `<svg>` missing its sizing class entirely — it would have rendered at the browser's
        default 300×150 inside every `.dial` box
      - digits are printed on a static faceplate layer and revealed through an SVG mask cut into
        the rotor, so they hold still while the rotor turns rather than spinning with it; mask id
        generated via `useId()` per instance so multiple simultaneous dials can't collide — checked
        by SSR-rendering three pages that each mount a dial and confirming one mask ref apiece
- [x] Wired: Home hero card (`mode="rotary"`, action button now "dial 5" → `dialDigit(5)`, subtitle
      rewritten to describe what's actually on screen instead of the flywheel), `ComponentPreviews`
      mini grid (`mode="rotary"`, digit labels auto-hide below 120px), `DialPage` (Mode chip
      alongside the existing Detents/Size controls — Detents hides itself in rotary mode since it's
      meaningless there; readouts, caption and the telemetry-graph caption all branch per mode; the
      code block explicitly notes `mode="rotary"` is a site display flag, not installable API)
- [x] PRD.md's dial entry gets one appended sentence carving out the rotary display mode; the
      flywheel description above it, which the CLI actually installs, is untouched
- [x] DESIGN.md A17 records the geometry, the motion rules, and the deliberate scope boundary:
      this is a site-only build, not a registry promotion — unlike heft, dial has real registry
      history to consider more carefully, and unifying it was left for a separate decision
- [x] Verified: typecheck, eslint, and build all clean; SSR-rendered DialPage, Home, and the 96px
      preview and confirmed all three render without a runtime crash, with digit labels present at
      >=120px and correctly absent at 96px
- [ ] No browser verification — same standing gap as every UI change this week, still no
      playwright/puppeteer MCP this session
- [ ] `dial`'s registry promotion (shipping `mode` as real installable API, unifying site and
      registry the way heft was unified) — deliberately deferred, not forgotten; see DESIGN.md A17

### Phase 15 revision — pulse mechanism, same day

The user handed over an independently-written reference `RotaryDial` implementation with direct
feedback that the first pass was worse. It was.

- [x] Found the real gap: the reference counts actual pulses (one per 30° of return travel, digit N
      = N pulses, 0 = ten) and prints letters under the digits (2 ABC .. 9 WXY); the first pass fired
      a single "digit chosen" event with no pulse model and no letters at all — the part that most
      makes something read as a phone rather than a spinning circle was missing entirely
- [x] Found a real geometry bug in the process: the first pass's pull distances (60°..330°) carried
      an extra, uncounted 30° of slack per digit versus the reference's (30°..300°). Two
      implementations independently deriving `pulses × 30°` was the tell that the corrected formula
      is the one a real dial uses, not the original — re-verified headlessly (pull distance, hole
      self-identification, nearest-hole agreement at the stop, and a simulated 1°-step return
      producing a monotonic pulse count landing exactly on each digit's true count, for all ten
      digits) before touching component code
- [x] Adopted: real `pulsesTripped()`-driven `onPulse` firing with a visual click (Signal ring
      thickens per trip), letters, proportional 85%-of-own-travel engagement replacing the flat 30°
      threshold, and the reference's evenodd single-path hole construction in place of the `<mask>`
      approach — simpler, and removes an entire bug class rather than guarding against it
- [x] Declined, and said so rather than silently dropping it: the reference's `onPointerDown` refuses
      to grab the wheel while it is returning. This project's one most-repeated rule is that a
      transition that cannot reverse mid-flight does not ship (CLAUDE.md). Kept the dial
      interruptible mid-return; every other component on this site works this way and this one does
      not get an exception
- [x] Declined: gradients, a soft drop-shadow filter, a serif font, and roughly a dozen hardcoded hex
      colors — all conflict with tokens.css being the only place colors exist. Declined: synthesized
      click sounds, since no other component has audio and adding it to exactly one is a real
      inconsistency, not a small addition
- [x] Full gate sweep re-run after the rewrite: registry lint/test, motion scan, registry:check,
      spring-math, CLI test, site typecheck/lint/build all pass. SSR-verified structurally, not just
      "does it crash": confirmed exactly 8 letter labels (digits 2-9), 1 evenodd path with exactly 11
      subpaths (1 rotor circle + 10 holes), and holes still cut correctly even when digit labels are
      hidden at 96px
- [ ] Still no browser verification — the pulse click's visual timing (90ms thicken) and the letters'
      legibility at small sizes are both things that want an actual look, not just a render check

### Phase 15 correction — the merge was the wrong answer, same day

Told directly: "i asked you to put that code in homepage, and component page no?" The user meant the
literal reference file on those two pages, not a synthesis of it. The prior revision's merge, however
defensible on its own terms, answered a different request than the one given.

- [x] `site/src/zui/RotaryDial.tsx` — the reference component ported as given. TypeScript types added
      throughout (arrived as untyped JS), unused `React` import dropped, one `dialDigit` imperative
      handle added so the homepage's demo-trigger button still works. No other line of its mechanism,
      styling, or interaction logic changed
- [x] Wired onto Home (hero card, replacing `Dial mode="rotary"`) and `/components/dial` (the
      rotary side of the Mode toggle, replacing the same). `ComponentPreviews.tsx` (the library grid)
      was left alone — the instruction named the homepage and the component page, not the grid — so it
      still renders the A17 merged `Dial.tsx` at 96px
- [x] Recorded rather than smoothed over, in DESIGN.md A18: this component is not interruptible
      mid-return (the one rule this whole project repeats hardest, broken here on explicit
      instruction), carries no connection to the shared 1300/46 spring, uses gradients/serif/hardcoded
      colors outside tokens.css, and adds Web Audio clicks — the only sound on the site. The
      DialPage code block and caption say plainly that this is not what `z-ui add dial` installs
- [x] DialPage's rotary readouts rebuilt around what this component actually exposes (pulse count,
      last dialed digit, the 300deg/s return, the 85% engage threshold) rather than keep showing
      ω/spring readouts a component with no velocity telemetry and no spring connection can't honestly
      report. The TELEMETRY/SpringGraph section is flywheel-only now, since rotary has no velocity
      signal to graph
- [x] Full gate sweep re-run: registry lint/test, motion scan, registry:check, spring-math, CLI test,
      site typecheck/lint/build all pass. SSR-verified Home and DialPage render the new component
      without crashing (10 hole targets, 6 gradient references matching the 3 defined gradients each
      used once); confirmed the AudioContext code path never executes during SSR since it is only
      touched inside pointer/key event handlers, never at render time
- [ ] The site now carries two different rotary-dial implementations depending on which page you're
      on — recorded as a deliberate outcome in DESIGN.md A18, not an oversight, but worth knowing if
      it reads as inconsistent later
