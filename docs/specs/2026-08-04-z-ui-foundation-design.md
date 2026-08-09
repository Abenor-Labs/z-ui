# Z-UI Foundation Design

**Date:** 2026-08-04
**Status:** Approved for implementation
**Scope:** Build-order steps 1 through 4 (registry primitives, first component, validation, CLI). Steps 5 through 7 are named at the end but belong to follow-on specs.

---

## 1. Problem

The space between "no animation" and "adopt a motion system" is empty.

Animation libraries (`motion`, GSAP) hand you primitives and leave the design to you. Component libraries (shadcn/ui, Radix) hand you components with flat motion. Asset platforms (Lottie, Rive) hand you canned playback with no state model and nothing you can restyle or interrupt.

A developer three hours into a feature, looking at a like button that just turns red, has no good option. They either write spring physics from scratch or accept that it feels cheap.

Z-UI fills that gap: designed, physical, state-driven micro-interactions delivered as source code the developer owns from the moment it lands.

## 2. Non-goals

- **A general component library.** No layout primitives, no form controls, no data display. Scope refusal is a product feature.
- **Multi-framework support.** React only for v1. Vue and Svelte are not planned and would compromise the motion quality ceiling.
- **A hosted service.** No accounts, no telemetry, no dashboard.
- **Runtime distribution.** Z-UI is never imported from `node_modules` by a consumer. The CLI writes files; that is the entire delivery mechanism.

## 3. Locked decisions

These were settled during brainstorming and are not re-opened by this document. Each now has an [architecture decision record](../adr/) carrying its full reasoning, what it costs to reverse, and what would change our mind. This table is the summary; the ADRs are the argument.

| Decision | Choice | Rationale |
| --- | --- | --- |
| Motion engine | `motion` (Framer Motion) as a declared dependency | Interruptible springs with velocity carry-over. CSS keyframes cannot reverse mid-flight, and mid-flight reversal is the product. |
| Delivery | First-party CLI, `@abenor/z-ui` | Full control of install UX. Manifests stay shadcn-schema-shaped so `npx shadcn add <url>` works as a free fallback. |
| Registry transport | Raw GitHub URLs, base URL as one config value | No hosting to stand up. Swaps to a domain later with a config edit, not a code change. |
| Component API | Uncontrolled by default, controlled optional | `<LikeButton />` works immediately; `pressed` / `onPressedChange` opt into control. |
| Ref API | React 19 ref-as-prop | No `forwardRef` wrapper. Peer dependency `react >= 19`. |
| Class merging | Own `z-cn` (clsx + tailwind-merge) | Self-contained. Never collides with a consumer's existing `cn`, works without shadcn installed. |
| Register | `product` | Components ship into other people's apps and must disappear into them. The showcase overrides to `brand` per task. |
| Accessibility floor | WCAG 2.2 AA, no exceptions | Motion is the most likely thing in this project to physically hurt someone. |

### 3.1 The overshoot carve-out

The `impeccable` motion law states: never use bounce or elastic easing, they feel dated and draw attention to the animation itself.

That law is correct, and it targets **decorative** bounce: modals that wobble in, elastic page transitions, easing applied as flavor. Z-UI's overshoot is different in kind. It encodes a physical response to a discrete user action on a small element.

Overshoot is permitted only when **all four** conditions hold:

1. The element is 48px or smaller.
2. The motion is a direct response to user input.
3. The animation is interruptible mid-flight.
4. It encodes a state change.

Anything failing all four is decoration and gets cut. Never on entrances, exits, layout, or anything the user did not just touch. This carve-out is the line between Z-UI and an npm package with bouncy buttons.

## 4. Architecture

Three parts in one pnpm workspace. `registry/` is the source of truth, `packages/cli/` reads it, `web/` displays it.

```
z-ui/
├── pnpm-workspace.yaml            packages: registry, packages/*, web
├── package.json                   private root, scripts only
├── tsconfig.base.json             strict, ES2022, bundler resolution, react-jsx
├── PRODUCT.md                     strategic design context
├── DESIGN.md                      visual design context (seed)
├── .naksha/project.json           brand tokens
├── registry/
│   ├── registry.json              the index
│   ├── schema/
│   │   ├── registry.schema.json
│   │   ├── registry-item.schema.json
│   │   └── config.schema.json
│   ├── lib/
│   │   ├── z-spring/{component.json, z-spring.ts}
│   │   └── z-cn/{component.json, z-cn.ts}
│   ├── hooks/
│   │   └── use-controllable-state/{component.json, use-controllable-state.ts}
│   └── components/
│       └── like-button/
│           ├── component.json
│           ├── like-button.tsx        shipped to users
│           └── like-button.demo.tsx   showcase only, never shipped
├── packages/
│   └── cli/                       @abenor/z-ui
└── web/                           showcase (step 6, out of scope here)
```

Three properties of this layout carry weight:

**`registry/` is a real TypeScript workspace, not a folder of strings.** It declares `react` and `motion` as devDependencies and is covered by `tsc --noEmit`. A broken component fails CI here rather than in a stranger's project.

**Components, hooks, and lib entries all use the same folder-plus-manifest shape.** Uniform resolution means the CLI has one code path instead of three.

**The demo lives beside the component, not in `web/`.** Everything about `like-button` sits in one folder. `files[]` omits the demo, so it never reaches a user's disk.

## 5. Registry schema

Two file types: one index, one manifest per item. The CLI fetches the index once, then only the manifests it needs. No large payload at any point.

### 5.1 `registry/registry.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry/schema/registry.schema.json",
  "name": "z-ui",
  "version": "0.1.0",
  "items": [
    { "name": "like-button",            "type": "registry:component", "category": "tactile-feedback", "path": "components/like-button" },
    { "name": "use-controllable-state", "type": "registry:hook",      "path": "hooks/use-controllable-state" },
    { "name": "z-spring",               "type": "registry:lib",       "path": "lib/z-spring" },
    { "name": "z-cn",                   "type": "registry:lib",       "path": "lib/z-cn" }
  ]
}
```

### 5.2 `registry/components/like-button/component.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "like-button",
  "type": "registry:component",
  "title": "Like Button",
  "description": "Heart that overshoots on press and settles with a spring.",
  "dependencies": ["motion"],
  "registryDependencies": ["use-controllable-state", "z-spring", "z-cn"],
  "files": [
    { "path": "like-button.tsx", "type": "registry:component" }
  ],
  "meta": {
    "category": "tactile-feedback",
    "states": ["idle", "hover", "pressing", "liked", "liked-hover", "liked-pressing"],
    "spring": "bounce"
  }
}
```

Three things doing real work:

**`meta` is shadcn's own free-form field.** Z-UI extras live inside it, so the manifest remains a strict superset of shadcn's registry-item schema. `npx shadcn add <raw-url>` works on it unmodified. No parallel schema to maintain, and a working install path exists before the CLI does.

**`registryDependencies` are names, not paths.** Resolved through the index, transitively, deduplicated. Five components wanting `z-spring` fetch and write it once.

**Item `type` determines the destination alias.** `registry:component` maps to the components alias, `registry:hook` to hooks, `registry:lib` to lib. This is the only routing logic the CLI needs.

## 6. Component contract

Rigid on purpose. This contract is what a generator skill later reverse-engineers, so it must be inferable from reading two real files.

### 6.1 Spring scale, `lib/z-spring/z-spring.ts`

Four presets, named by behavior rather than adjective, so choosing one is a decision instead of a vibe.

```ts
export const springs = {
  snap:   { type: 'spring', stiffness: 500, damping: 40, mass: 1 },
  bounce: { type: 'spring', stiffness: 400, damping: 14, mass: 1 },
  settle: { type: 'spring', stiffness: 260, damping: 24, mass: 1 },
  fling:  { type: 'spring', stiffness: 300, damping: 30, mass: 1 },
} as const

export type SpringName = keyof typeof springs
```

Values below are derived, not estimated. Damping ratio is `damping / (2 * sqrt(stiffness * mass))`; `t90` is the numerically solved time for the step response to first reach 90% of target, which is the honest measure of perceived response.

| Preset | Damping ratio | `t90` | Peak overshoot | Rest (2%) | Use |
| --- | --- | --- | --- | --- | --- |
| `snap` | 0.89 | 152ms | under 1% | 200ms | State morphs: play/pause, lock, mute. Overshoot here is noise. |
| `bounce` | 0.35 | 94ms | 31% | 571ms | Tactile feedback: like, bookmark. The overshoot is the message. |
| `settle` | 0.74 | 173ms | 3% | 333ms | Reveals: search pill expand, password eye. |
| `fling` | 0.87 | 188ms | under 1% | 267ms | Gesture release with velocity carry-over. |

`snap` is the library default, applied whenever a component does not declare one. A component overrides to `bounce` only when the recoil carries meaning; `like-button` is the one v1 component that does.

**On `bounce` exceeding the 500ms feedback guideline:** the guideline governs perceived response, not time to rest, and those diverge for an underdamped spring. `bounce` reaches 90% of target in 94ms, the fastest of all four presets, precisely because it overshoots rather than approaching asymptotically. The remaining travel is low-amplitude settling the user reads as physical weight, and the element stays fully interactive throughout. This is a deliberate exception and it applies to `bounce` alone.

### 6.2 Reduced motion is a branch, not a zeroed duration

```ts
export function useZTransition(preset: SpringName | Transition = 'snap'): Transition {
  const reduced = useReducedMotion()
  if (reduced) return { duration: 0 }
  return typeof preset === 'string' ? springs[preset] : preset
}
```

The rule the hook cannot enforce, stated here and checked in review: **when reduced motion is active, decorative sub-elements do not render at all.** No particles, no trails, no draw-on strokes. The state change still happens instantly and remains visible through fill and icon, which DESIGN.md's Second Channel Rule already guarantees by forbidding state encoded in hue alone.

### 6.3 File contract

Every component file, without exception:

```tsx
'use client'

import { motion } from 'motion/react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

// motion.button redeclares several React handlers with different signatures.
// Every component omits this exact set; it is part of the contract, not a
// per-component workaround.
type MotionConflicts =
  | 'onChange'
  | 'onDrag' | 'onDragStart' | 'onDragEnd'
  | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
  | 'style'

// Liked-ness and interaction are independent, so the state machine is their
// product. Declared once as a tuple; meta.states and every variants object's
// keys must equal it, and CI enforces all three agreeing. See ADR 0007.
const STATES = [
  'idle', 'hover', 'pressing',
  'liked', 'liked-hover', 'liked-pressing',
] as const

export type LikeButtonState = (typeof STATES)[number]

// `satisfies`, not an annotation: it checks exhaustiveness while leaving the
// literal type intact, which is what motion needs. Annotating widens the
// values and fails assignment.
const rootVariants = {
  'idle':           { scale: 1 },
  'hover':          { scale: 1.08 },
  'pressing':       { scale: 0.9 },
  'liked':          { scale: 1 },
  'liked-hover':    { scale: 1.08 },
  'liked-pressing': { scale: 0.9 },
} satisfies Record<LikeButtonState, object>

export type LikeButtonProps = Omit<
  React.ComponentPropsWithoutRef<'button'>, MotionConflicts
> & {
  style?: React.CSSProperties
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  // SpringName | Transition, not just a preset name: passing a scaled
  // transition is how the showcase plays a spring back in slow motion
  // without adding a second API.
  spring?: SpringName | Transition
  ref?: React.Ref<HTMLButtonElement>
}

export function LikeButton({
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  spring = 'bounce',
  className,
  ref,
  ...props
}: LikeButtonProps) {
  const [pressed, setPressed] = useControllableState({
    prop: pressedProp,
    defaultProp: defaultPressed,
    onChange: onPressedChange,
  })
  const [hovered, setHovered] = React.useState(false)
  const [pressing, setPressing] = React.useState(false)
  const transition = useZTransition(spring)

  // One derived value drives animate and data-state together, so the attribute
  // a consumer styles against can never disagree with what is on screen.
  const interaction = pressing ? 'pressing' : hovered ? 'hover' : null
  const state: LikeButtonState = pressed
    ? interaction ? (`liked-${interaction}` as LikeButtonState) : 'liked'
    : (interaction ?? 'idle')

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      data-state={state}
      initial={false}
      animate={state}
      variants={rootVariants}
      transition={transition}
      // Explicit handlers rather than whileHover/whileTap. A hover variant
      // cannot see the rest of the state, and layering one over `animate` is
      // what desynchronised data-state from the screen. See ADR 0007.
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); setPressing(false) }}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onClick={() => setPressed(!pressed)}
      className={zcn('relative grid size-11 place-items-center', className)}
      {...props}
    />
  )
}
```

Numbered rules, all machine-checkable except where noted:

1. `'use client'` is the first line of every component file.
2. Named export only. Export name is the PascalCase form of the file name. No default export.
3. Props type is exported and named `<ComponentName>Props`.
4. Toggle-shaped components use Radix naming: `pressed` / `defaultPressed` / `onPressedChange`.
5. Semantics are never delegated to the consumer. Toggles carry `aria-pressed`; icon-only controls require an accessible name.
6. `data-state` is present on the root even though `motion` drives the animation. One attribute, and it gives the file's new owner a styling hook that does not require understanding variants.
7. `initial={false}` on every motion element.
8. `className` is merged last through `zcn` so consumer classes win.
9. Remaining props spread onto the root element.
10. Hit target is at least 44x44 CSS pixels, even where the visual element is smaller. `size-11` is 44px.
11. Every module-scope `variants` object declares the same key vocabulary, matching the manifest's `meta.states` exactly. A component typically needs more than one: `like-button` has two, because the root animates `scale` while the icon animates `color` and `fillOpacity`. Declaring identical keys across all of them is what lets motion's variant propagation drive every child from the root's `animate` state, so no child tracks state itself. Use `satisfies Record<State, object>` rather than a type annotation: it checks exhaustiveness while leaving the literal type intact, whereas annotating widens the values and fails assignment to motion's `Variants`.
12. The component declares `const STATES = [...] as const` at module scope, and that tuple, `meta.states`, and every `variants` object's keys must all agree. CI enforces the three-way match. This is what makes `data-state` a guarantee rather than a hope, and it is what lets the showcase generate a state inspector from the manifest alone.
13. **No `whileHover` or `whileTap`.** They layer a variant that cannot see the rest of the component's state, which silently desynchronises `data-state` from what is on screen. Interaction states come from explicit pointer handlers, and one derived value drives `animate` and `data-state` together. Where liked-ness and interaction are independent, the state machine is their product. See [ADR 0007](../adr/0007-composite-state-machine.md), which records the measured bug that produced this rule.

**A note on forcing states programmatically**, which the showcase depends on: dispatch `pointerover` and `pointerout`, not `pointerenter` and `pointerleave`. React derives enter and leave from over and out at the document root, so a synthetic `pointerenter` reaches nothing. A component keyed off motion's own `whileHover` would need the opposite, which is a second reason rule 13 exists.

Three of these carry disproportionate weight:

**`initial={false}` is the whole "do not animate what the user did not touch" law reduced to one greppable token.** Without it every consumer inherits a mount animation they never asked for, inside an app that already has its own page transitions.

**`animate` plus `variants`, never `useAnimate` sequences.** A declarative target state is what makes mid-flight reversal free. A sequence that must play to completion is a timeline in a spring costume and fails the interruptibility principle.

**The import allowlist.** Registry sources may import from exactly `react`, `motion`, `clsx`, `tailwind-merge`, and the internal prefixes `@/lib/*`, `@/hooks/*`, `@/components/z-ui/*`. Nothing else, ever. This is what reduces the CLI's import rewriting to a string replace on a documented prefix instead of an AST transform, and it is enforced in CI.

A consequence worth stating outright, because it was discovered by building rather than by planning: **icons are inline SVG paths, never imports.** `like-button` could not import a heart from `lucide-react`. A registry component cannot assume a consumer has any icon library installed, and the allowlist catches that at authoring time rather than at install time.

## 7. CLI

`@abenor/z-ui`. Three commands at v1: `init`, `add`, `list`. Node 20 or newer, ESM, bundled with `tsup`.

Runtime dependencies held to five: `commander`, `@clack/prompts`, `zod`, `picocolors`, `execa`.

### 7.1 Config file, `z-ui.json` in the consumer's project root

```json
{
  "$schema": "https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry/schema/config.schema.json",
  "registry": "https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry",
  "tsx": true,
  "aliases": {
    "components": { "import": "@/components/z-ui", "path": "src/components/z-ui" },
    "hooks":      { "import": "@/hooks",           "path": "src/hooks" },
    "lib":        { "import": "@/lib",             "path": "src/lib" }
  }
}
```

**Each alias carries both the import specifier and the disk path, explicitly.** This is the single decision that removes the most work from building a CLI. Resolving a consumer's `@/` prefix properly means parsing `tsconfig.json` paths, handling `baseUrl`, and walking monorepo config inheritance, which is a large share of why a first-party CLI is expensive.

Instead: `init` guesses by probing for `src/` and reading `compilerOptions.paths`, presents the guess, lets the user correct it, and writes the result down. Guess and confirm once; read plain JSON forever. `add` contains no tsconfig resolution code at all.

`registry` accepts a URL **or a local filesystem path**. This is how contributors test uncommitted components (`--registry ./registry`) and how the CLI test suite runs with no network.

### 7.2 `add` flow

```
1  read z-ui.json                      missing -> "run npx @abenor/z-ui init"
2  GET {registry}/registry.json
3  resolve item + transitive registryDependencies   (DFS, dedupe, cycle-detect)
4  GET each component.json, then each file's source
5  map item type -> alias; rewrite `@/` imports to the consumer's import prefix
6  file exists? prompt      (--overwrite skips, --dry-run previews)
7  write files
8  detect package manager from lockfile; install dependencies   (--no-install skips)
9  print what landed where
```

Package manager detection reads the lockfile: `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `package-lock.json`, in that order. Absent any lockfile, prompt.

### 7.3 Errors

| Situation | Behavior | Exit |
| --- | --- | --- |
| Success | Summary of files written and dependencies installed | 0 |
| No `z-ui.json` | Instruct to run `init` | 1 |
| Unknown component name | Print nearest matches from the index | 1 |
| User declines overwrite | Report which files were skipped | 0 |
| Network or 404 | Print the exact URL attempted | 2 |
| Manifest fails schema validation | Surface the zod error path | 2 |

Every failure prints the URL it actually tried. A registry served over raw GitHub will fail in ways that are only debuggable with the URL in hand.

## 8. Validation and testing

### 8.1 `pnpm lint:registry`

Runs in CI on every pull request. Cheap to write, and it is the mechanism that stops the registry degrading into the codepen sprawl named in PRODUCT.md's anti-references.

| Check | Catches |
| --- | --- |
| Every `component.json` validates against the JSON Schema | Typos, missing required fields |
| Every path in `files[]` exists on disk | Renamed file, stale manifest |
| Every non-demo file in an item directory appears in `files[]` | A file that silently never ships |
| Every `registryDependencies` name resolves in the index | Dangling reference |
| No import outside the allowlist | Breaks the CLI's rewrite guarantee |
| Every motion element carries `initial={false}` | Unwanted mount animation |
| No `cubic-bezier` whose y control points fall outside 0 to 1 | Fake springs imitating overshoot, banned by DESIGN.md |
| Every interactive root has `data-state` and an aria attribute | Incomplete component |
| `STATES` equals `meta.states` equals every `variants` object's keys | The manifest promising states the component cannot emit |
| No `whileHover` or `whileTap` | The mechanism that desynchronised `data-state` from the screen (ADR 0007) |
| No generated tree drift (`registry:check`) | A stale `public/r/` or `__generated__/` after a source change |
| No import of an icon library | A component assuming the consumer has `lucide-react` or similar |

The last three are text-level checks that encode design law as CI. They are the difference between principles written in a document and principles that hold.

### 8.2 Test strategy

- **Registry:** `tsc --noEmit` across the workspace, plus `lint:registry`.
- **CLI:** vitest against a fixture registry on disk, reached through `--registry`. No network in tests. Assertions: files land at correct paths, imports are rewritten, transitive dependencies resolve exactly once, existing files prompt, exit codes match the table above.
- **Components:** testing-library asserting on **state**, never on pixels or animation frames. Pressing toggles `aria-pressed`. Controlled mode does not self-update. Reduced motion renders no decorative children.

Animation output is deliberately untested. Frame-level assertions on spring physics are brittle, slow, and would encode the current `motion` version's integrator as a requirement.

## 9. Build order

| # | Deliverable | Branch | Gate | In scope here |
| --- | --- | --- | --- | --- |
| 1 | `z-spring`, `z-cn`, `use-controllable-state` plus manifests | `feat/registry-primitives` | typecheck | yes |
| 2 | `like-button.tsx` plus manifest, hand-built | `feat/like-button` | typecheck | yes |
| 3 | JSON Schemas, `lint:registry`, CI workflow | `chore/registry-lint` | CI lands here | yes |
| 4 | CLI `init` / `add` / `list` | `feat/cli-core` | lint plus vitest | yes |
| 5 | Second component (`copy-button`) | `feat/copy-button` | full CI | follow-on spec |
| 6 | Showcase | `feat/showcase` | full CI | follow-on spec |
| 7 | Component generator skill | `feat/generator-skill` | full CI | follow-on spec |

Step 2 precedes step 3 so the schema is validated against a real component rather than an imagined one. Step 5 precedes step 6 because a contract validated by a single component is a coincidence, and the showcase should be built against a contract that has survived generalizing at least once.

**What actually happened, recorded rather than tidied away.** Steps 1, 2, 3 and 6 shipped; steps 4 and 5 have not. The showcase was built out of order, ahead of both the CLI and the second component, because it was asked for directly. The stated risk was real and is now live: the bench was designed against exactly one component, so `copy-button` is the first test of whether its state rail generalises to a component with a timed, self-reverting state. The ordering argument above stands; it was overruled deliberately, not forgotten.

Live status now lives in [`docs/ROADMAP.md`](../ROADMAP.md), which is the single source of what is next. This table records the plan as it was designed.

## 10. Workflow

Trunk-based. Short-lived branches, squash-merge, no `develop` branch and no release branches. One deployable artifact and one committer make gitflow pure ceremony.

- **Branch naming** matches the conventional-commit types already in the log: `feat/`, `fix/`, `chore/`, `docs/`.
- **Squash-merge only.** Merge commits and rebase-merge are disabled at the repository level. One pull request becomes one commit on `main`; the PR title becomes the commit subject. Configured 2026-08-04.
- **Head branches auto-delete on merge.** Configured 2026-08-04.
- **Branch protection turns on after step 3 merges, not before.** Requiring status checks while no CI workflow exists would make every pull request permanently un-mergeable. Once `chore/registry-lint` is on `main`: require status checks, require linear history, include administrators. Do **not** require pull request approvals while there is a single committer, as that locks the repository with nobody able to approve. Add the approval requirement the day a second human joins.

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| Raw GitHub URLs are rate-limited (60 requests/hour unauthenticated) and always serve whatever is on `main` | The `registry` config value is a single string. Moving to a hosted origin, or to a tag-pinned raw URL, is a config edit and no code change. Accepted for v1 given no domain exists. |
| Building a first-party CLI is more work than it appears | Explicit `import` plus `path` aliases in `z-ui.json` remove tsconfig resolution entirely. Manifests stay shadcn-shaped, so `npx shadcn add <url>` is a working fallback while the CLI matures. |
| Scope creep into a general component library | Named as a non-goal here and as Design Principle 5 in PRODUCT.md. Every addition must be a micro-interaction. |
| Drift toward gimmick components | Named as an anti-reference in PRODUCT.md and as a Don't in DESIGN.md. The four-condition overshoot carve-out is the concrete test. |
| `#00E5A0` fails AA contrast on light surfaces (1.65:1 on white, measured) | Documented as the Contrast Floor Rule in DESIGN.md. Two separate constraints are at work and should not be conflated: contrast forbids mint on light surfaces, while the Moving Part Rule restricts mint to the moving element as a design choice. On ink `#0A0A0B` mint measures 11.98:1 and would pass AAA, so the motion-only restriction there is deliberate, not forced. Sand on ink measures 15.61:1. |
| Contract proves wrong after the second component | Step 5 exists precisely to discover this, and it runs before the showcase and before the generator skill hard-code any assumption. |

## 12. Open questions

None blocking steps 1 through 4. The following are deliberately deferred to the follow-on specs that own them:

- Showcase framework and hosting: deferred to step 6.
- npm publishing and release automation for `@abenor/z-ui`: deferred until the CLI works end to end against the real registry.
- Component category taxonomy beyond the three v1 categories: deferred until the registry holds five or more components.
