# Z-UI

[![npm version](https://img.shields.io/npm/v/@abenor%2Fz-ui.svg)](https://www.npmjs.com/package/@abenor/z-ui)

**Micro-animations you own.**

A copy-paste registry of React micro-interactions — installed as source into your project, not pulled in as a runtime dependency you can never change.

```bash
npx @abenor/z-ui@latest add dial
```

> **Status: v0.1, early.** The CLI is published and installs working files. Eight components are in the registry. The showcase site is live at [z-ui-eight.vercel.app](https://z-ui-eight.vercel.app); the registry itself is still served from raw GitHub. Component names and props may still move before v1.

---

## What this is

Z-UI is **not** a general component library. It is a focused registry of *micro-interactions*: the small, tactile moments where an interface acknowledges you.

- **State-morphing** — a control that reverses mid-flight and carries the speed it already had
- **Tactile feedback** — a gesture whose cost is legible while you are still making it
- **Input & utility** — a field that criticises late and forgives instantly

If it isn't a micro-animation, it doesn't belong here. That constraint is the product.

## What this is not

A design system. A layout kit. A replacement for shadcn/ui. Z-UI sits *on top of* whatever you already use.

---

## Components

| Component                                                 | Category         | What it does                                                                                                                                                              | Needs      |
| --------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [`dial`](registry/components/dial)                       | tactile-feedback | A knob with a flywheel in it. Flick it and it spins down through real friction, ticking over detents until the nearest one catches it with a spring. Grab it mid-spin and the spin is yours again. | `motion` |
| [`chase`](registry/components/chase)                     | state-morphing   | A segmented control whose indicator gives chase: the edge facing the target leaves on a stiff spring, the edge behind follows on a soft one, and the stretch between them is the speed. Nothing scripts the squash. | `motion` |
| [`heft`](registry/components/heft)                       | tactile-feedback | A box of objects that behave like objects. Drag one and everything it touches is shoved aside; anything resting on top loses its floor and drops. Gravity, contacts and friction, in one file. | `motion` |
| [`disclosure`](registry/components/disclosure)           | state-morphing   | A panel whose height is an interruptible spring. Press again mid-open and it reverses from wherever it got to, carrying the speed it was already moving at.               | `motion` |
| [`hold-drain`](registry/components/hold-drain)           | tactile-feedback | A hold-to-confirm whose abort costs what the hold earned. Let go at seventy per cent and the fill is paid back at the rate it climbed.                                    | `motion` |
| [`late-critique`](registry/components/late-critique)     | input-utility    | A field whose criticism is late and whose forgiveness is instant. No verdict lands mid-word; the first keystroke that fixes the value clears the error on the same frame. | react only |
| [`scramble-reveal`](registry/components/scramble-reveal) | state-morphing   | Text that decodes out of random glyphs on hover, on mount, or when it first enters view.                                                                                  | react only |
| [`thinking-orb`](registry/components/thinking-orb)       | state-morphing   | A dotted, honestly-3D status indicator: nine hand-tuned canvas animations for nine agent states, z-sorted and depth-shaded, no WebGL. No driving gesture — the state is set by the consumer. | react only |

Each component is a single self-contained `.tsx` file. There is no shared `lib/` to install first and no internal import to resolve — a component that needed a primitive would ship the primitive.

## Install

```bash
npx @abenor/z-ui@latest add dial
```

`add` writes the actual source into `components/z-ui/` and installs any npm dependency the component declares. From that moment it is your code — edit the spring, rewrite the markup, delete half of it. No upgrade path to fight, no wrapper API to reverse-engineer.

Nothing is written until everything is known to be writable: fetch, resolve, verify and plan all complete before the first byte lands.

### CLI

| Command                  | Does                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `z-ui init`            | write`z-ui.json` (`add` does this for you on first run) |
| `z-ui add <name...>`   | add components and their dependencies                       |
| `z-ui list`            | list what the registry offers                               |
| `z-ui doctor`          | check what is installed, change nothing                     |
| `z-ui spring [name]`   | draw the actual curve before you pick one                   |
| `z-ui preview <name>`  | how a component moves, before you install it                |
| `z-ui completion <sh>` | completion script for bash, zsh or fish                     |

Useful flags: `--dry-run` (show the plan, write nothing), `--registry ./registry` (install from a clone), `--json` (machine-readable `list`, `doctor`, `preview`), `-o/--overwrite`, `-y/--yes`.

`--spring <preset>` retargets a component's default preset at install time — `snap`, `bounce`, `settle` or `fling`. Every springed component currently ships bespoke physics rather than a preset (`dial` runs 1300/46, `chase` runs two springs at once), so the CLI refuses the rewrite and tells you which numbers to edit instead of quietly installing motion the author tuned against.

### Without the CLI

Registry items are shadcn-schema-shaped, so this works as a fallback:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public/r/dial.json
```

You lose install-time spring selection, `preview`, and `doctor`. You still get the file.

## Architecture decisions

These are locked. They shape everything else. Full reasoning in [`docs/adr/`](docs/adr/).

| Decision                     | Choice                                                                        | Why                                                                                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Motion engine**      | [`motion`](https://motion.dev) (Framer Motion), declared per component       | Real interruptible springs with velocity carry-over. CSS keyframes cannot reverse mid-flight, and mid-flight reversal*is* the product. A component that does not need it does not declare it. |
| **Delivery**           | First-party CLI,[`@abenor/z-ui`](https://www.npmjs.com/package/@abenor/z-ui) | Full control over install UX. Registry items stay shadcn-schema-shaped, so`npx shadcn add <url>` works as a free fallback.                                                                    |
| **Registry transport** | Raw GitHub URLs, base URL as a single constant                                | No hosting to stand up on day one. Swaps to a domain later without a code change. Unauthenticated raw GitHub allows ~60 requests an hour per IP;`--registry ./registry` avoids it.            |
| **Component API**      | Uncontrolled by default, controlled optional                                  | `<Disclosure />` works immediately; `open` / `onOpenChange` opt into control when a real app needs it.                                                                                    |

## Repository layout

```
z-ui/
├── registry/          source of truth — the components themselves
├── packages/cli/      @abenor/z-ui
├── web/               showcase, and the generated registry it serves
├── components/        dev harness — the components, clickable, outside the site
├── scripts/           the linters, and the tests that break them on purpose
└── docs/              roadmap, ADRs, specs
```

`registry/` is a real TypeScript workspace, not a folder of strings. Components typecheck in CI, so a broken one fails here instead of in someone else's project.

`web/public/r/` is generated from `registry/` and committed. CI fails if the two disagree.

## Development

Requires Node >= 20 and pnpm.

```bash
pnpm install
pnpm dev                        # the dev harness — components, clickable, nothing else
pnpm --filter @z-ui/web dev     # the showcase site
pnpm verify                     # everything CI runs
```

`verify` is typecheck, then the registry linter, then the contrast linter, then the generated-registry check, then the tests — plus the suites that deliberately break each linter to prove it still catches things. A linter that only ever passes is worthless.

Where a change is user-visible, browser evidence is part of the verification. A green typecheck and a passing lint suite have both coexisted with a component that was visibly broken in a browser.

## Documentation

| Document                              | Answers                                               |
| ------------------------------------- | ----------------------------------------------------- |
| [`PRODUCT.md`](PRODUCT.md)           | Who this is for, what it refuses to be                |
| [`DESIGN.md`](DESIGN.md)             | Colour, type, motion energy, the named rules          |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | What is next, and what is deliberately not planned    |
| [`docs/adr/`](docs/adr/)             | Why a decision was made, and what it costs to reverse |

## License

MIT © Abenor Labs
