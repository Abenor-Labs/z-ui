# Z-UI website

Marketing/docs site for **Z-UI** — a copy-paste registry of React micro-interactions, installed
as source into a project. Tagline: *"Micro-animations you own."*

This repo is the website only. The registry, CLI (`@abenor/z-ui`), and showcase live in
[Abenor-Labs/z-ui](https://github.com/Abenor-Labs/z-ui).

## Run

```sh
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build → dist/
npm run preview    # serve the production build
npm run typecheck  # tsc only
npm run lint       # eslint
```

## What's in here

- React + Vite + react-router SPA; Motion (`motion/react`) is the only animation dependency.
- Every component preview on the site is a faithful, interactive reimplementation of the real
  registry component's physics — flywheel dial, dual-spring chase, rigid-body heft, interruptible
  disclosure, symmetric hold-drain, late-critique validation, scramble-reveal. No videos, no
  loops, no fakes.
- `PRD.md` holds the product facts (the only source of truth), `DESIGN.md` the committed visual
  direction and build assumptions, `ARCHITECTURE.md` the technical plan, `TASKS.md` the build
  checklist.

MIT © Abenor Labs
