# CLI-FINDINGS — what the published CLI actually does

Captured 2026-08-18 by running `npx @abenor/z-ui@latest` (**v0.1.1**) in an empty scratch project.
Transcripts live in `src/data/cliRecordings.ts` and drive the /cli page.

**Nothing in PRD.md has been changed.** PRD "PRODUCT FACTS" is the stated source of truth, and
several of its claims do not match the shipped tool. Those conflicts are listed here for a decision
rather than silently resolved.

## Conflicts with PRODUCT FACTS

| # | PRD says | The CLI does | Consequence for the site |
| --- | --- | --- | --- |
| 1 | "Seven components in the registry" | `z-ui list` reports **4**: disclosure, hold-drain, late-critique, scramble-reveal | dial, chase and heft are not installable. Their shadcn fallback URLs 404 — the component pages already say "not published yet" and warn on the Install tab |
| 2 | `z-ui spring [name]` "draws the actual spring curve for a component" | `spring` takes a **preset** — `snap · bounce · settle · fling`. `z-ui spring disclosure` errors with "Unknown preset". Component curves come from `z-ui preview <name>` | /cli previously described `spring` wrongly; the page now shows `spring settle` and `preview disclosure` as separate things |
| 3 | Flags: `--dry-run --registry --json -o -y --spring` | Also real: `--stiffness`, `--damping`, `--mass`, `-c/--cwd`, `-s/--silent`, `--force`, `-v/--version`, `-h/--help` | /cli flags table now lists all of them, sourced from the captured `--help` |
| 4 | Install guarantee: "nothing is written to disk until everything is confirmed writable" | Holds for component files. But `add --dry-run` **does** write `z-ui.json` first — it prints `✓ Wrote z-ui.json` and then `✓ Dry run. Nothing was written.` | The guarantee is about component files, not config. /cli wording narrowed to match |
| 5 | Registry transport: `…/main/web/public/r/<name>.json` | The CLI reads `…/main/web/public` and the index reports itself as `z-ui 0.1.0` while the binary is 0.1.1 | The shadcn fallback URL on the site still points at `/r/<name>.json`, which is where the JSON really is — but only for the four published items |
| 6 | Site motion identity is dial's 1300/46, "the site runs on the product's physics" | disclosure — the flagship published component — is **520/46, mass 1, ζ 1.01, overdamped**: t90 173ms, overshoot 0%, settle 262ms | The site's springs are dial's, and dial is unpublished. The claim is currently about a component nobody can install |
| 7 | Components install as "a single self-contained .tsx" | Confirmed: `components/z-ui/disclosure.tsx`, one file, deps installed separately (`npm motion`) | No change needed |
| 8 | `doctor` "checks what's installed, changes nothing" | Confirmed, and it is sharper than documented: it reports per-component `unmodified`, flags missing dependencies, and ends `✓ Nothing broken.` | /cli cast shows the real output |

## Options for #1 and #6 (your call)

- **A.** Update PRD PRODUCT FACTS to describe v0.1.1 as shipped: four published components, three
  written but unpublished, `spring` as a preset command. Most honest, and the site is already
  half-way there.
- **B.** Leave PRD as the target spec and treat the gap as a publishing task in the z-ui repo:
  generate and commit `dial.json`, `chase.json`, `heft.json` so reality catches up to the doc.
- **C.** Leave both alone. The site keeps flagging unpublished components per page, which works but
  reads oddly next to "seven components in the registry" on the home page.

## Verbatim curiosities worth keeping

- The refusal text is better than the site's paraphrase was: *"disclosure tunes its own spring
  (stiffness 520, damping 46, mass 1) rather than using a preset. Installing settle over it would
  change physics the component was deliberately tuned against. Install it and edit SPRING if you
  want different numbers."*
- `preview` prints its own ASCII curve plus `✓ takes a real path under prefers-reduced-motion` and
  the rest thresholds (`delta 2, speed 20`). The CLI documents its own reduced-motion behavior.
- `spring settle` reports `ζ 0.74 underdamped — overshoots`, `t90 172ms`, `overshoot 2.9%`,
  `settle 354ms`.
