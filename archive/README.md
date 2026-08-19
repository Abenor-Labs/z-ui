# archive

Superseded work, kept rather than deleted. **Nothing in here is live.** No build reads it, no CI
step touches it, and nothing under `registry/`, `packages/cli/`, `web/` or `site/` imports from it.

It exists so that replacing something never means losing it.

| Directory | What it is | Why it is here |
| --- | --- | --- |
| `web-next/` | The Next.js app-router website — `app/`, `components/`, `lib/`, `assets/`, and its build config | Replaced by `site/` (Vite + React Router) on 2026-08-19. It had pages for only four of the seven components and was the reason the rebuild started |
| `showcase-ideas/` | Fourteen standalone HTML design explorations plus their shared `_base.css` / `_core.js` | Design studies that fed the site's direction. Superseded by the built site; kept because the thinking in them is not reproducible from the result |
| `prototypes/` | `lab-scrub.html`, `z-ui-preview.html` | The earliest standalone prototypes, from before the monorepo existed |
| `docs-v1/` | The original root `PRODUCT.md` and `DESIGN.md` | Replaced at root by `PRD.md` and `DESIGN.md` from the rebuild. The ADRs under `docs/adr/` still cite these by their old paths — those citations point here now, and that is accurate rather than broken |
| `gooey-sandbox/` | `GooeyKit.tsx`, `GooeyDemo.tsx` — a scratch kit built on the `liquid-gooey` npm package | Written to learn the gooey technique. The learning became `docs/specs/2026-08-19-bond-design.md`, which re-derives every primitive from the mathematics and takes no dependency. The sandbox cannot run without `liquid-gooey`, which the site no longer installs |

## What was NOT archived

`registry/`, `packages/cli/`, `web/scripts/`, `web/public/r/`, `scripts/` and `docs/adr/` are all
untouched and live. The website changed; the product did not.

## The one hard constraint

`web/public/r/` must stay exactly where it is. The published CLI hardcodes:

```
https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public
```

Every `@abenor/z-ui` install in the wild reads that path. Archiving or moving it would break all of
them. It is the reason `web/` still exists at all after its site was replaced.
