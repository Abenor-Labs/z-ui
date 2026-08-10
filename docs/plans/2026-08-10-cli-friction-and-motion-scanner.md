# CLI friction and the motion scanner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shorten the install path, and derive every piece of motion metadata from component source at build time so the CLI's ADR 0002 behaviours can fail again instead of passing vacuously.

**Architecture:** Slice 1 touches `packages/cli` only — no schema, no generated output. Slice 2 adds one scanner module at `scripts/motion-scan.mjs`, imported by both `web/scripts/build-registry.mjs` (which emits its output into `meta.motion`) and `scripts/lint-registry.mjs` (which re-runs it and gates on agreement). The CLI then reads `meta.motion` and never parses source at user runtime.

**Tech Stack:** Node 20+, TypeScript 7 with `--experimental-strip-types` (no build step in dev), `node:test` for the CLI suite, hand-rolled mutation harnesses for repo scripts, ajv 2020 for schema validation, pnpm workspaces.

**Spec:** [`docs/specs/2026-08-10-cli-motion-truth.md`](../specs/2026-08-10-cli-motion-truth.md)

**Not in scope:** publishing, version bumps, pushing. `packages/cli/package.json` stays at `0.1.1`.

---

## File structure

**Slice 1 — created**

| File | Responsibility |
| --- | --- |
| `packages/cli/src/commands/completion.ts` | Emit a static shell-completion script. No registry access. |

**Slice 1 — modified**

| File | Change |
| --- | --- |
| `packages/cli/src/project/spring.ts` | Add `springOutcome()`, a pure helper reporting that a `--spring` request changed nothing. |
| `packages/cli/src/commands/add.ts` | Warn on a no-op `--spring`; accept a URL positional; auto-init when `z-ui.json` is absent. |
| `packages/cli/src/commands/doctor.ts` | `--json` output; empty-state hint reads a live component name. |
| `packages/cli/src/registry/fetch.ts` | `Registry.itemFromUrl()`, and `isUrl` exported. |
| `packages/cli/src/project/config.ts` | `guessConfig()` extracted so `add` and `init` share one guess. |
| `packages/cli/src/commands/init.ts` | Consume `guessConfig()` instead of building the guess inline. |
| `packages/cli/src/index.ts` | `completion` command, `--json` on doctor, generic help examples. |
| `packages/cli/test/unit.test.ts` | Tests for each of the above. |

**Slice 2 — created**

| File | Responsibility |
| --- | --- |
| `scripts/motion-scan.mjs` | The single source reader. Exports `PRESETS`, `scanMotion()`, and the four field readers. No I/O. |
| `scripts/motion-scan.test.mjs` | Unit assertions against both real components, then a mutation harness. |
| `packages/cli/src/commands/preview.ts` | Render `meta.motion` in the terminal. |

**Slice 2 — modified**

| File | Change |
| --- | --- |
| `registry/schema/registry-item.schema.json` | Add `meta.motion`; drop `spring` from the component-required list. |
| `registry/components/disclosure/component.json` | Remove authored `meta.spring`. |
| `registry/components/scramble-reveal/component.json` | Remove authored `meta.spring`. |
| `web/scripts/build-registry.mjs` | Scan each component; emit `meta.motion` and a derived `spring`. |
| `scripts/lint-registry.mjs` | Import the scanner; gate on readability, reduced-motion, and no authored `spring`. |
| `packages/cli/src/registry/fetch.ts` | `MotionScan` type on `RegistryItem['meta']`. |
| `packages/cli/src/project/spring.ts` | `springRefusal()` — refuse `--spring` against a bespoke spring. |
| `packages/cli/src/commands/doctor.ts` | Reduced-motion check keyed off `meta.motion`, not `useZTransition`. |
| `packages/cli/src/index.ts` | `preview` command. |
| `web/__generated__/*` | Regenerated. Committed. |
| `web/components/*` | Spring badge renders real numbers. |

---

# Slice 1 — install-path friction

## Task 1: `--spring` stops failing silently

`retargetSpring` looks for `spring = 'snap'` as a destructured prop default. No live component has one. The flag is accepted and does nothing.

**Files:**
- Modify: `packages/cli/src/project/spring.ts`
- Modify: `packages/cli/src/commands/add.ts:99`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `packages/cli/test/unit.test.ts`:

```ts
describe('spring retarget against the live registry', () => {
  // The regression test for the audit in docs/specs/2026-08-10-cli-motion-truth.md.
  // `retargetSpring` was written for a prop-default convention no component
  // adopted, and nothing noticed because a zero-change rewrite is silent.
  test('disclosure has no prop-default spring, so a retarget changes nothing', () => {
    const src = readFileSync(
      new URL('../../../registry/components/disclosure/disclosure.tsx', import.meta.url),
      'utf8',
    )
    const { changed } = retargetSpring(src, 'bounce')
    assert.equal(changed, 0)
  })

  test('springOutcome reports a request that matched nothing', () => {
    const msg = springOutcome([{ retargeted: false }, { retargeted: false }], 'bounce')
    assert.match(msg ?? '', /bounce/)
    assert.match(msg ?? '', /no file/i)
  })

  test('springOutcome is silent when something was retargeted', () => {
    assert.equal(springOutcome([{ retargeted: false }, { retargeted: true }], 'bounce'), null)
  })

  test('springOutcome is silent when no spring was requested', () => {
    assert.equal(springOutcome([{ retargeted: false }], undefined), null)
  })
})
```

Add `springOutcome` to the existing spring import at the top of the file:

```ts
import { retargetSpring, assertPreset, springOutcome } from '../src/project/spring.ts'
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — `springOutcome` is not exported from `../src/project/spring.ts`.

- [ ] **Step 3: Implement `springOutcome`**

Append to `packages/cli/src/project/spring.ts`:

```ts
/**
 * A `--spring` request that rewrote nothing.
 *
 * `retargetSpring` is anchored to a destructured prop default, and a component
 * that tunes its spring as a module constant does not have one. Returning zero
 * changes is a legitimate outcome; reporting success afterwards is not — the
 * user asked for different physics and got the shipped physics.
 *
 * Kept as a pure function over the retarget flags so it is testable without a
 * filesystem, and so `add` stays a sequence of decisions rather than a place
 * where messages are composed.
 */
export function springOutcome(
  files: { retargeted: boolean }[],
  requested: string | undefined,
): string | null {
  if (!requested) return null
  if (files.some((f) => f.retargeted)) return null
  return `--spring ${requested} matched no file. This component does not expose its spring as a preset name, so its shipped physics were installed unchanged.`
}
```

- [ ] **Step 4: Run the tests**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: PASS. Total rises from 46 to 50.

- [ ] **Step 5: Wire it into `add`**

In `packages/cli/src/commands/add.ts`, immediately after the `report(files, missing, pm, spring)` call:

```ts
  report(files, missing, pm, spring)

  const springNote = springOutcome(files, spring)
  if (springNote) log.warn(springNote)
```

And extend the import on line 7:

```ts
import { assertPreset, springOutcome } from '../project/spring.ts'
```

- [ ] **Step 6: Verify by hand against the local registry**

```bash
cd packages/cli && node --experimental-strip-types src/index.ts add disclosure \
  --registry ../../registry --cwd /tmp/ztest --spring bounce --dry-run
```

Expected: the plan prints, then `! --spring bounce matched no file.` Nothing is written.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/project/spring.ts packages/cli/src/commands/add.ts packages/cli/test/unit.test.ts
git commit -m "fix(cli): a --spring that matches nothing now says so

retargetSpring hunts for \`spring = 'snap'\` as a prop default. No component
in the registry has one — disclosure tunes a module-level SPRING constant and
scramble-reveal has no spring at all — so the flag has been accepted and
ignored since it shipped. A zero-change rewrite is silent by construction,
which is why nothing caught it.

The test pins it against disclosure's real source, so the day a component does
adopt the convention, the assertion fails and gets updated deliberately."
```

---

## Task 2: stop naming components that do not exist

`src/index.ts:57-59` offers `like-button`, `scrub` and `undo-toast`. None exist; one is retired. `doctor.ts:90` tells an empty project to install `like-button`.

**Files:**
- Modify: `packages/cli/src/index.ts:55-62`
- Modify: `packages/cli/src/commands/doctor.ts:86-93`

- [ ] **Step 1: Make the help examples generic**

Help must never require a network round-trip, so it uses a placeholder rather than a live name. Replace the `Examples` block in `packages/cli/src/index.ts`:

```
  ${c.bold('Examples')}
    ${c.grey('z-ui init')}
    ${c.grey('z-ui add <name>')}
    ${c.grey('z-ui add <name> --spring settle')}
    ${c.grey('z-ui add <name> --dry-run')}
    ${c.grey('z-ui add https://example.com/r/<name>.json')}
    ${c.grey('z-ui add <name> --registry ./registry')}
    ${c.grey('z-ui list')}
    ${c.grey('z-ui doctor')}
    ${c.grey('z-ui spring bounce')}
```

- [ ] **Step 2: Make doctor's empty state read the index it already fetched**

`doctor` fetches the index at line 34, well before the empty-state branch. Replace the branch at `packages/cli/src/commands/doctor.ts:86-93`:

```ts
  if (!installed) {
    // The index is already in hand, so name something that actually resolves.
    // This line used to hardcode a component that was later deleted, and it
    // kept recommending it for as long as the literal survived.
    const example = components[0]?.name ?? '<name>'
    log.line(c.grey('  No Z-UI components found in this project.'))
    log.line(c.grey(`  Looked in ${config.aliases.components.path}/`))
    log.line()
    log.line(`  ${c.cyan(`z-ui add ${example}`)} to install one.`)
    log.line()
    return
  }
```

- [ ] **Step 3: Verify both by hand**

```bash
cd packages/cli && node --experimental-strip-types src/index.ts --help | grep -i "like-button\|scrub\|undo-toast"
```

Expected: no output, exit 1 from grep.

```bash
mkdir -p /tmp/zempty && cd packages/cli && \
  node --experimental-strip-types src/index.ts init --cwd /tmp/zempty --yes --registry ../../registry && \
  node --experimental-strip-types src/index.ts doctor --cwd /tmp/zempty --registry ../../registry
```

Expected: `z-ui add disclosure to install one.`

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/index.ts packages/cli/src/commands/doctor.ts
git commit -m "fix(cli): stop advertising components that were deleted

Help offered like-button, scrub and undo-toast as examples. None of the three
are in the registry and one is permanently retired. doctor told an empty
project to install like-button.

Help now uses a placeholder, because printing a real name there would mean a
network round-trip to render --help. doctor names components[0] from the index
it has already fetched, so it cannot go stale again."
```

---

## Task 3: `z-ui add <url>`

**Files:**
- Modify: `packages/cli/src/registry/fetch.ts`
- Modify: `packages/cli/src/commands/add.ts`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('URL positionals', () => {
  test('isUrl accepts http and https, rejects names and paths', () => {
    assert.equal(isUrl('https://example.com/r/x.json'), true)
    assert.equal(isUrl('http://example.com/r/x.json'), true)
    assert.equal(isUrl('disclosure'), false)
    assert.equal(isUrl('./registry'), false)
    assert.equal(isUrl('C:/registry'), false)
  })

  test('partitionTargets splits names from URLs, preserving order within each', () => {
    const { names, urls } = partitionTargets([
      'disclosure',
      'https://example.com/r/a.json',
      'scramble-reveal',
    ])
    assert.deepEqual(names, ['disclosure', 'scramble-reveal'])
    assert.deepEqual(urls, ['https://example.com/r/a.json'])
  })
})
```

Add to the imports:

```ts
import { isUrl } from '../src/registry/fetch.ts'
import { partitionTargets } from '../src/commands/add.ts'
```

- [ ] **Step 2: Run and confirm failure**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — neither `isUrl` nor `partitionTargets` is exported.

- [ ] **Step 3: Export `isUrl` and add `itemFromUrl`**

In `packages/cli/src/registry/fetch.ts`, change line 46 from `const isUrl` to:

```ts
export const isUrl = (s: string) => /^https?:\/\//i.test(s)
```

Then add this method to the `Registry` class, after `item()`:

```ts
  /**
   * Fetch one manifest by its own URL, bypassing the index.
   *
   * The point is not convenience. ADR 0002 keeps these manifests a strict
   * superset of shadcn's so `npx shadcn add <url>` works; this is the same
   * capability in our own client, and it is the only way to install from a
   * branch, a fork or a PR preview — none of which are in any index.
   *
   * `registryDependencies` inside the fetched item still resolve against the
   * configured registry. A manifest that names a dependency is naming a
   * registry item, not a second URL.
   */
  async itemFromUrl(url: string): Promise<RegistryItem> {
    let res: Response
    try {
      res = await fetch(url)
    } catch {
      throw new UserError(`Could not reach ${url}`)
    }
    if (!res.ok) throw new UserError(`Registry returned HTTP ${res.status} for ${url}`)
    try {
      return JSON.parse(await res.text()) as RegistryItem
    } catch {
      throw new UserError(`${url} did not return a JSON manifest.`)
    }
  }
```

- [ ] **Step 4: Add `partitionTargets` and use it in `add`**

In `packages/cli/src/commands/add.ts`, add after the `nearest` export:

```ts
/** Split what the user typed into registry names and direct manifest URLs. */
export function partitionTargets(targets: string[]): { names: string[]; urls: string[] } {
  const names: string[] = []
  const urls: string[] = []
  for (const t of targets) (isUrl(t) ? urls : names).push(t)
  return { names, urls }
}
```

Extend the fetch import at the top:

```ts
import { Registry, isUrl } from '../registry/fetch.ts'
```

Then in `add()`, replace the block that begins `log.step(\`Resolving from ...\`)` and ends with `const items = await resolve(registry, opts.components)`:

```ts
  const { names: byName, urls } = partitionTargets(opts.components)

  log.step(`Resolving from ${c.grey(registry.describe())}`)

  // Fail on an unknown name before doing any work, and suggest near misses.
  const known = new Set(index.items.map((i) => i.name))
  const unknown = byName.filter((n) => !known.has(n))
  if (unknown.length) {
    const suggestions = unknown
      .map((n) => {
        const near = nearest(n, [...known])
        return near.length ? `“${n}” — did you mean ${near.join(', ')}?` : `“${n}” is not in the registry`
      })
      .join('\n  ')
    throw new UserError(`Unknown component:\n  ${suggestions}`, 'Run `z-ui list` for the full set.')
  }

  const direct = await Promise.all(urls.map((u) => registry.itemFromUrl(u)))
  // Dependencies of a URL-fetched item resolve by name against the configured
  // registry, alongside anything the user named directly.
  const depNames = direct.flatMap((i) => i.registryDependencies ?? [])
  const resolved = await resolve(registry, [...byName, ...depNames])

  // Direct items last: `resolve` already orders dependencies before dependents,
  // and a URL-fetched item is by definition the dependent here.
  const items = [...resolved, ...direct.filter((d) => !resolved.some((r) => r.name === d.name))]
```

Then update the two later uses of `opts.components`. Both must mean "what the
user asked for", **not** "everything resolved" — `springScope` exists precisely
to keep a retarget off shared dependencies, and widening it here would restyle
every component in the project:

```ts
  // The names the user typed, plus anything they pointed at by URL. Never a
  // transitively-resolved dependency: retargeting a shared primitive restyles
  // components the user did not mention.
  const requested = new Set([...byName, ...direct.map((d) => d.name)])

  const files = await plan(items, config, opts.cwd, { spring, springScope: requested })
```

and the closing line:

```ts
  log.ok(`Added ${[...requested].map((n) => c.cyan(n)).join(', ')}.`)
```

- [ ] **Step 5: Run the tests**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify the name path still works end to end**

```bash
rm -rf /tmp/zurl && mkdir -p /tmp/zurl && cd packages/cli && \
  node --experimental-strip-types src/index.ts init --cwd /tmp/zurl --yes --registry ../../registry && \
  node --experimental-strip-types src/index.ts add disclosure --cwd /tmp/zurl --registry ../../registry --dry-run
```

Expected: plans one file, `Dry run. Nothing was written.`

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/registry/fetch.ts packages/cli/src/commands/add.ts packages/cli/test/unit.test.ts
git commit -m "feat(cli): add accepts a manifest URL, not only a registry name

ADR 0002 keeps these manifests a superset of shadcn's specifically so an
arbitrary URL installs. Our own client could not do it. This is the only way
to install from a branch, a fork or a PR preview, none of which appear in an
index.

registryDependencies inside a URL-fetched item still resolve by name against
the configured registry — a manifest naming a dependency is naming a registry
item, not a second URL."
```

---

## Task 4: `doctor --json`

**Files:**
- Modify: `packages/cli/src/commands/doctor.ts`
- Modify: `packages/cli/src/index.ts:117`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('doctor --json', () => {
  test('report shape carries findings, missing deps and a count', () => {
    const report = doctorReport(
      [
        { level: 'warn', name: 'disclosure', message: 'no reduced-motion branch' },
        { level: 'ok', name: 'scramble-reveal', message: 'unmodified' },
      ],
      ['motion'],
      2,
    )
    assert.equal(report.installed, 2)
    assert.deepEqual(report.missingDependencies, ['motion'])
    assert.equal(report.findings.length, 2)
    assert.equal(report.warnings, 1)
  })

  test('serialises to parseable JSON with nothing decorative in it', () => {
    const json = JSON.stringify(doctorReport([], [], 0))
    const back = JSON.parse(json)
    assert.deepEqual(back, { installed: 0, warnings: 0, findings: [], missingDependencies: [] })
  })
})
```

Add the import:

```ts
import { doctorReport } from '../src/commands/doctor.ts'
```

- [ ] **Step 2: Run and confirm failure**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — `doctorReport` is not exported.

- [ ] **Step 3: Implement**

In `packages/cli/src/commands/doctor.ts`, export the `Finding` type and add the builder above `doctor()`:

```ts
export type Finding = {
  level: 'ok' | 'note' | 'warn'
  name: string
  message: string
}

export type DoctorReport = {
  installed: number
  warnings: number
  findings: Finding[]
  missingDependencies: string[]
}

/** Pure, so the JSON contract is testable without touching a filesystem. */
export function doctorReport(
  findings: Finding[],
  missingDependencies: string[],
  installed: number,
): DoctorReport {
  return {
    installed,
    warnings: findings.filter((f) => f.level === 'warn').length,
    findings,
    missingDependencies,
  }
}
```

Change the signature to accept the flag:

```ts
export async function doctor(opts: { version: string; cwd: string; registry?: string; json?: boolean }) {
```

Suppress the banner when serialising — same rule `list` follows, nothing before the `{` on stdout:

```ts
  if (!opts.json) intro(opts.version, `checking ${opts.cwd}`)
```

Move the missing-dependency computation above the empty-`installed` branch so the JSON path always has it, then replace the reporting tail of the function (from the `if (!installed)` branch through the final `log.line()`) with:

```ts
  const report = doctorReport(findings, missing, installed)

  if (opts.json) {
    log.raw(JSON.stringify(report, null, 2))
    if (report.warnings) process.exitCode = 1
    return
  }

  if (!installed) {
    const example = components[0]?.name ?? '<name>'
    log.line(c.grey('  No Z-UI components found in this project.'))
    log.line(c.grey(`  Looked in ${config.aliases.components.path}/`))
    log.line()
    log.line(`  ${c.cyan(`z-ui add ${example}`)} to install one.`)
    log.line()
    return
  }

  for (const f of findings.sort((a, b) => rank(b.level) - rank(a.level))) {
    const icon = f.level === 'warn' ? c.yellow('!') : f.level === 'note' ? c.blue('~') : c.green('✓')
    log.line(`  ${icon} ${c.cyan(f.name.padEnd(18))} ${c.grey(f.message)}`)
  }

  if (missing.length) {
    const pm = detectPackageManager(opts.cwd)
    const { command, args } = installCommand(pm, missing)
    log.line()
    log.line(`  ${c.yellow('!')} Missing dependencies: ${missing.join(', ')}`)
    log.line(c.grey(`    ${command} ${args.join(' ')}`))
  }

  log.line()
  if (report.warnings) {
    log.line(`  ${c.yellow(`${report.warnings} warning${report.warnings === 1 ? '' : 's'}`)}`)
    process.exitCode = 1
  } else {
    log.ok('Nothing broken.')
  }
  log.line()
```

- [ ] **Step 4: Wire the flag through `index.ts`**

```ts
    case 'doctor':
      return doctor({ version: VERSION, cwd, registry: values.registry, json: values.json! })
```

And in the `Options` block of `HELP`, change the `--json` line:

```
        --json        machine-readable output (list, doctor)
```

- [ ] **Step 5: Run the tests**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify the output is machine-readable**

```bash
cd packages/cli && node --experimental-strip-types src/index.ts doctor \
  --cwd /tmp/zempty --registry ../../registry --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(Object.keys(JSON.parse(s))))"
```

Expected: `[ 'installed', 'warnings', 'findings', 'missingDependencies' ]`

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/doctor.ts packages/cli/src/index.ts packages/cli/test/unit.test.ts
git commit -m "feat(cli): doctor --json

doctor already builds a Finding[] and already exits 1 on a warning. It was one
serialisation away from being usable as a CI gate.

--json suppresses the banner and every decorative line, the rule list already
established: nothing before the opening brace on stdout, or the output cannot
be piped."
```

---

## Task 5: `add` initialises when it has to

Every install block on the site starts with `add`. `readConfig` throws and tells the user to run a different command first.

**Files:**
- Modify: `packages/cli/src/project/config.ts`
- Modify: `packages/cli/src/commands/init.ts`
- Modify: `packages/cli/src/commands/add.ts`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('guessConfig', () => {
  test('a src/ layout prefixes every alias path but no import specifier', () => {
    const g = guessConfig({ srcDir: true, tsx: true }, undefined)
    assert.equal(g.aliases.components.path, 'src/components/z-ui')
    assert.equal(g.aliases.components.import, '@/components/z-ui')
    assert.equal(g.aliases.hooks.path, 'src/hooks')
    assert.equal(g.aliases.lib.path, 'src/lib')
  })

  test('a root layout leaves paths unprefixed', () => {
    const g = guessConfig({ srcDir: false, tsx: true }, undefined)
    assert.equal(g.aliases.components.path, 'components/z-ui')
  })

  test('an explicit registry overrides the default', () => {
    assert.equal(guessConfig({ srcDir: false, tsx: true }, './registry').registry, './registry')
    assert.equal(guessConfig({ srcDir: false, tsx: true }, undefined).registry, DEFAULT_REGISTRY)
  })

  test('a JavaScript project is recorded as such', () => {
    assert.equal(guessConfig({ srcDir: false, tsx: false }, undefined).tsx, false)
  })
})
```

Extend the config import:

```ts
import { validate, guessConfig, DEFAULT_REGISTRY } from '../src/project/config.ts'
```

- [ ] **Step 2: Run and confirm failure**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — `guessConfig` is not exported.

- [ ] **Step 3: Extract `guessConfig` into `config.ts`**

Append to `packages/cli/src/project/config.ts`:

```ts
/**
 * The config we would write for a project, given what was detected in it.
 *
 * Lives here rather than in `init` because `add` now writes one too when none
 * exists, and two commands guessing separately is two guesses that can differ.
 */
export function guessConfig(
  detected: { srcDir: boolean; tsx: boolean },
  registry: string | undefined,
): Config {
  const prefix = detected.srcDir ? 'src/' : ''
  return {
    ...DEFAULT_CONFIG,
    registry: registry ?? DEFAULT_CONFIG.registry,
    tsx: detected.tsx,
    aliases: {
      components: { import: '@/components/z-ui', path: `${prefix}components/z-ui` },
      hooks: { import: '@/hooks', path: `${prefix}hooks` },
      lib: { import: '@/lib', path: `${prefix}lib` },
    },
  }
}
```

- [ ] **Step 4: Export `detect` from `init.ts` and use the shared guess**

In `packages/cli/src/commands/init.ts`, change `function detect` to `export function detect`, export the type, and replace the inline `guess` object in `init()` with:

```ts
  const guess = guessConfig(d, opts.registry)
```

Add the import:

```ts
import { configExists, writeConfig, guessConfig, type Config } from '../project/config.ts'
```

`DEFAULT_CONFIG` is no longer referenced in this file — drop it from the import list.

- [ ] **Step 5: Run the tests**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: PASS, and `init` behaviour unchanged.

- [ ] **Step 6: Teach `add` to initialise**

In `packages/cli/src/commands/add.ts`, replace `const config = await readConfig(opts.cwd)` with:

```ts
  const config = await loadOrInitConfig(opts)
```

And add, below `add()`:

```ts
/**
 * Read `z-ui.json`, or write one.
 *
 * `add` is the first command anyone runs — it is what every install block on
 * the site says — and refusing it with "run `z-ui init` first" makes the
 * documented one-liner a two-liner for everybody's first install.
 *
 * The guess is shown before it is written, never after. Under `--yes` or with
 * no TTY it is written unprompted, because the alternative in CI is a prompt
 * that nothing will ever answer.
 */
async function loadOrInitConfig(opts: AddOptions): Promise<Config> {
  if (configExists(opts.cwd)) return readConfig(opts.cwd)

  const d = detect(opts.cwd)
  const guess = guessConfig(d, opts.registry)

  detail('No z-ui.json — detected', [
    `${c.grey('framework')}  ${d.framework}`,
    `${c.grey('language')}   ${d.tsx ? 'TypeScript' : 'JavaScript'}`,
    `${c.grey('components')} ${guess.aliases.components.path}/`,
    `${c.grey('packages')}   ${d.pm}`,
  ])

  if (!opts.yes && isInteractive() && !(await confirm('Write z-ui.json and continue?', true))) {
    throw new UserError('Stopped without writing anything.', 'Run `z-ui init` to configure paths by hand.')
  }

  await writeConfig(opts.cwd, guess)
  log.ok('Wrote z-ui.json')
  return guess
}
```

Extend the imports at the top of `add.ts`:

```ts
import { readConfig, configExists, writeConfig, guessConfig, type Config } from '../project/config.ts'
import { detect } from './init.ts'
import { intro, detail } from '../ui/art.ts'
```

- [ ] **Step 7: Verify both branches by hand**

```bash
rm -rf /tmp/zauto && mkdir -p /tmp/zauto && cd packages/cli && \
  node --experimental-strip-types src/index.ts add disclosure \
    --cwd /tmp/zauto --registry ../../registry --yes && \
  cat /tmp/zauto/z-ui.json
```

Expected: `✓ Wrote z-ui.json`, then the component installs, then the config prints with `"components": { "import": "@/components/z-ui", "path": "components/z-ui" }`.

```bash
cd packages/cli && node --experimental-strip-types src/index.ts add disclosure \
  --cwd /tmp/zauto --registry ../../registry --yes
```

Expected on the second run: no re-init, `Everything is already up to date.`

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/project/config.ts packages/cli/src/commands/init.ts packages/cli/src/commands/add.ts packages/cli/test/unit.test.ts
git commit -m "feat(cli): add writes z-ui.json instead of refusing without one

Every install block on the site leads with \`add\`, so \`add\` is the first
command most people run, and it answered with an error naming a different
command. The documented one-liner was a two-liner for every first install.

The guess is shown before it is written and confirmed on a TTY. Under --yes or
a pipe it is written unprompted — the alternative in CI is a prompt nothing
will answer. init keeps its own path for people who want to configure first,
and both now share one guessConfig so they cannot disagree."
```

---

## Task 6: `z-ui completion`

**Files:**
- Create: `packages/cli/src/commands/completion.ts`
- Modify: `packages/cli/src/index.ts`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('completion', () => {
  for (const shell of ['bash', 'zsh', 'fish'] as const) {
    test(`${shell} script names every command`, () => {
      const script = completionScript(shell)
      for (const cmd of ['init', 'add', 'list', 'doctor', 'spring', 'completion']) {
        assert.match(script, new RegExp(`\\b${cmd}\\b`))
      }
    })
  }

  test('an unknown shell is a UserError, not a crash', () => {
    assert.throws(() => completionScript('powershell' as never), /powershell/)
  })
})
```

Add the import:

```ts
import { completionScript } from '../src/commands/completion.ts'
```

- [ ] **Step 2: Run and confirm failure**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — the module does not exist.

- [ ] **Step 3: Create `packages/cli/src/commands/completion.ts`**

```ts
import { log, UserError } from '../ui/log.ts'

/**
 * Static completion, deliberately.
 *
 * Completing component names would mean a registry request inside the user's
 * shell, on every Tab. That is a network round-trip in the one place latency is
 * unforgivable, and it breaks offline. Commands and flags are the part that
 * never changes between releases anyway.
 */
export const SHELLS = ['bash', 'zsh', 'fish'] as const
export type Shell = (typeof SHELLS)[number]

const COMMANDS = ['init', 'add', 'list', 'doctor', 'spring', 'preview', 'completion'] as const

const FLAGS = [
  '--yes',
  '--overwrite',
  '--registry',
  '--cwd',
  '--silent',
  '--spring',
  '--stiffness',
  '--damping',
  '--mass',
  '--dry-run',
  '--json',
  '--force',
  '--version',
  '--help',
] as const

const bash = () => `# z-ui bash completion. Add to ~/.bashrc:
#   eval "$(z-ui completion bash)"
_z_ui() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local commands="${COMMANDS.join(' ')}"
  local flags="${FLAGS.join(' ')}"
  if [[ "\$cur" == -* ]]; then
    COMPREPLY=( \$(compgen -W "\$flags" -- "\$cur") )
  elif [[ \$COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( \$(compgen -W "\$commands" -- "\$cur") )
  fi
}
complete -F _z_ui z-ui
`

const zsh = () => `# z-ui zsh completion. Add to ~/.zshrc:
#   eval "$(z-ui completion zsh)"
_z_ui() {
  local -a commands flags
  commands=(${COMMANDS.map((c) => `'${c}'`).join(' ')})
  flags=(${FLAGS.map((f) => `'${f}'`).join(' ')})
  if [[ \$words[CURRENT] == -* ]]; then
    compadd -- \$flags
  elif (( CURRENT == 2 )); then
    compadd -- \$commands
  fi
}
compdef _z_ui z-ui
`

const fish = () =>
  [
    '# z-ui fish completion. Write to ~/.config/fish/completions/z-ui.fish:',
    '#   z-ui completion fish > ~/.config/fish/completions/z-ui.fish',
    ...COMMANDS.map((c) => `complete -c z-ui -n __fish_use_subcommand -a ${c}`),
    ...FLAGS.map((f) => `complete -c z-ui -l ${f.replace(/^--/, '')}`),
    '',
  ].join('\n')

export function completionScript(shell: Shell): string {
  if (shell === 'bash') return bash()
  if (shell === 'zsh') return zsh()
  if (shell === 'fish') return fish()
  throw new UserError(`No completion script for “${shell}”.`, `One of: ${SHELLS.join(', ')}.`)
}

export function completion(shell: string | undefined) {
  if (!shell) {
    throw new UserError('Which shell?', `z-ui completion ${SHELLS.join('|')}`)
  }
  log.raw(completionScript(shell as Shell))
}
```

- [ ] **Step 4: Register the command in `index.ts`**

Add the import:

```ts
import { completion } from './commands/completion.ts'
```

Add the case:

```ts
    case 'completion':
      return completion(rest[0])
```

And add to the `Commands` block of `HELP`:

```
    ${c.cyan('completion')} <shell>  shell completion for bash, zsh or fish
```

- [ ] **Step 5: Run the tests**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify bash accepts the script**

```bash
cd packages/cli && node --experimental-strip-types src/index.ts completion bash | bash -n && echo "bash: syntax ok"
```

Expected: `bash: syntax ok`

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/completion.ts packages/cli/src/index.ts packages/cli/test/unit.test.ts
git commit -m "feat(cli): z-ui completion for bash, zsh and fish

Commands and flags only. Completing component names would put a registry
request inside the user's shell on every Tab — a network round-trip in the one
place latency is unforgivable, and broken offline."
```

---

## Task 7: slice 1 gate

- [ ] **Step 1: Run the full verify ladder**

```bash
cd d:/ABENOR-LABS/Z-ui && pnpm verify
```

Expected: typecheck across 4 workspaces, registry lint clean, 11/11 mutations, contrast lint clean, `lint-contrast.test` printing its known `SKIPPED`, registry check clean, CLI tests passing with the count risen from 46 and still exactly 1 skipped.

- [ ] **Step 2: If anything fails, fix it before starting slice 2**

Slice 2 changes the registry contract. Starting it against a red gate makes it impossible to tell which slice broke what.

---

# Slice 2 — the motion scanner

## Task 8: `scripts/motion-scan.mjs`

The single source reader. No I/O, no dependencies, so both the generator and the linter can import it and neither can disagree about what a component says.

**Files:**
- Create: `scripts/motion-scan.mjs`
- Create: `scripts/motion-scan.test.mjs`
- Modify: `package.json` (add the test to `verify`)

- [ ] **Step 1: Write the failing test**

Create `scripts/motion-scan.test.mjs`:

```js
/**
 * Two halves, in order.
 *
 * First, assertions against both real components — the scanner must read the
 * registry as it actually stands, not as a fixture written to flatter it.
 * Then mutations, which is the half that proves the scanner can fail: a reader
 * that returns something plausible for every input is indistinguishable from
 * one that works until you break its input on purpose.
 */
import { readFileSync, existsSync } from 'node:fs'
import { scanMotion, presetFor, PRESETS } from './motion-scan.mjs'

const DISCLOSURE = 'registry/components/disclosure/disclosure.tsx'
const SCRAMBLE = 'registry/components/scramble-reveal/scramble-reveal.tsx'

for (const f of [DISCLOSURE, SCRAMBLE]) {
  if (!existsSync(f)) {
    console.error(`FAILED motion-scan.test: ${f} is gone. Re-point this harness at a live component.`)
    process.exit(1)
  }
}

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const disclosure = read(DISCLOSURE)
const scramble = read(SCRAMBLE)

let failures = 0
let checks = 0
const check = (ok, msg) => {
  checks++
  if (!ok) {
    failures++
    console.error(`  FAIL  ${msg}`)
  }
}

// ---- disclosure ----------------------------------------------------------
const d = scanMotion(disclosure)
check(JSON.stringify(d.states) === JSON.stringify(['closed', 'opening', 'open', 'closing']),
  `disclosure states, got ${JSON.stringify(d.states)}`)
check(d.springs.length === 1, `disclosure should yield one spring, got ${d.springs.length}`)
check(d.springs[0]?.name === 'SPRING', `disclosure spring name, got ${d.springs[0]?.name}`)
check(d.springs[0]?.stiffness === 520, `disclosure stiffness, got ${d.springs[0]?.stiffness}`)
check(d.springs[0]?.damping === 46, `disclosure damping, got ${d.springs[0]?.damping}`)
check(d.springs[0]?.mass === 1, `disclosure mass, got ${d.springs[0]?.mass}`)
check(d.springs[0]?.restDelta === 2, `disclosure restDelta, got ${d.springs[0]?.restDelta}`)
// The manifest has claimed "snap" since it was written. 520/46 is not snap.
check(d.springs[0]?.preset === null, `disclosure spring is bespoke, got ${d.springs[0]?.preset}`)
check(d.reducedMotion === 'branch', `disclosure reduced-motion, got ${d.reducedMotion}`)

// ---- scramble-reveal -----------------------------------------------------
const s = scanMotion(scramble)
check(JSON.stringify(s.states) === JSON.stringify(['idle', 'scrambling', 'settled']),
  `scramble states, got ${JSON.stringify(s.states)}`)
check(s.springs.length === 0, `scramble has no spring, got ${s.springs.length}`)
check(s.durations.some((x) => x.name === 'duration' && x.ms === 620),
  `scramble duration 620, got ${JSON.stringify(s.durations)}`)
// It reaches for a locally-defined usePrefersReducedMotion, not motion's hook.
check(s.reducedMotion === 'branch', `scramble reduced-motion, got ${s.reducedMotion}`)
// chance = 0.86 and playOnce = true are prop defaults but not durations.
check(!s.durations.some((x) => x.name === 'chance'), 'chance must not be read as a duration')

// ---- presets -------------------------------------------------------------
check(presetFor({ stiffness: 500, damping: 40, mass: 1 }) === 'snap', 'exact snap match')
check(presetFor({ stiffness: 501, damping: 40, mass: 1 }) === null, 'near-miss is not a preset')
check(Object.keys(PRESETS).length === 4, 'four presets')

// ---- mutations -----------------------------------------------------------
const mutations = [
  ['spring constant renamed away from a recognisable shape',
    disclosure.replace('const SPRING = {', 'const SPRUNG = ['),
    (r) => r.springs.length === 0],
  ['stiffness removed',
    disclosure.replace('  stiffness: 520,\n', ''),
    (r) => r.springs.length === 0],
  ['reduced-motion branch deleted',
    disclosure.replace('    if (reduced) {', '    if (false) {'),
    (r) => r.reducedMotion === null],
  ['reduced-motion hook removed entirely',
    disclosure.replace('const reduced = useReducedMotion() ?? false', 'const reduced = false'),
    (r) => r.reducedMotion === null],
  ['STATES tuple removed',
    disclosure.replace(/const STATES = \[[\s\S]*?\] as const/, 'const STATES_LIST = []'),
    (r) => r.states === null],
  ['spring retuned onto a preset',
    disclosure.replace('stiffness: 520,', 'stiffness: 500,').replace('damping: 46,', 'damping: 40,'),
    (r) => r.springs[0]?.preset === 'snap'],
  ['duration default removed',
    scramble.replace('duration = 620,', 'duration,'),
    (r) => !r.durations.some((x) => x.name === 'duration')],
]

for (const [name, mutated, expect] of mutations) {
  checks++
  const result = scanMotion(mutated)
  const ok = expect(result)
  console.log(`  ${ok ? 'CAUGHT' : 'MISSED'}  ${name}`)
  if (!ok) failures++
}

if (failures) {
  console.error(`\nmotion-scan: ${failures} failure(s) across ${checks} checks\n`)
  process.exit(1)
}
console.log(`\nmotion-scan clean: ${checks} checks, ${mutations.length} mutations caught`)
```

- [ ] **Step 2: Run and confirm failure**

```bash
cd d:/ABENOR-LABS/Z-ui && node scripts/motion-scan.test.mjs
```

Expected: `Cannot find module` — `scripts/motion-scan.mjs` does not exist.

- [ ] **Step 3: Create `scripts/motion-scan.mjs`**

```js
/**
 * The one thing that reads motion out of a component.
 *
 * Imported by `web/scripts/build-registry.mjs`, which emits what it finds into
 * `meta.motion`, and by `scripts/lint-registry.mjs`, which re-runs it and gates
 * on agreement. One module rather than two readers, because the entire reason
 * this exists is that hand-authored motion metadata drifted from the source it
 * described — four times, silently. A second reader would be a fifth way to
 * drift.
 *
 * Regexes rather than an AST. TypeScript 7 is the native port and exports no
 * `createSourceFile` from the npm package, and a parser dependency would be a
 * differently-shaped source reader sitting next to the one lint already uses.
 * What makes this safe is not the technique, it is that every caller treats an
 * unreadable component as a build failure. This never returns a plausible
 * guess; it returns null and something upstream stops.
 *
 * No I/O and no dependencies, so it is trivially testable and safe to import
 * from either workspace.
 */

/** The published spring scale. `packages/cli/src/ui/spring-constants.ts` mirrors
 *  this, and a CLI test asserts the two agree. */
export const PRESETS = {
  snap: { stiffness: 500, damping: 40, mass: 1 },
  bounce: { stiffness: 400, damping: 14, mass: 1 },
  settle: { stiffness: 260, damping: 24, mass: 1 },
  fling: { stiffness: 300, damping: 30, mass: 1 },
}

/**
 * Exact equality, not a tolerance.
 *
 * disclosure runs 520/46 against snap's 500/40 and the difference is the whole
 * argument of its tuning comment. A fuzzy match would label it `snap`, which is
 * exactly the false claim its manifest has been making.
 */
export function presetFor({ stiffness, damping, mass }) {
  for (const [name, p] of Object.entries(PRESETS)) {
    if (p.stiffness === stiffness && p.damping === damping && p.mass === mass) return name
  }
  return null
}

/** Block and line comments removed. disclosure's header names the implementations
 *  it rejects; a file explaining what it does not do must not be read as doing it. */
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
}

/**
 * The STATES tuple.
 *
 * Reads the raw source, not the comment-stripped copy, because this is the
 * regex `lint-registry.mjs` has always used and moving it here must not change
 * what it accepts.
 */
export function readStates(src) {
  const m = src.match(/const STATES = \[([\s\S]*?)\] as const/)
  if (!m) return null
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

/** The object literal starting at `open`, brace-matched. A lazy `[\s\S]*?` stops
 *  at the first inner `}` and truncates any nested object. */
function objectAt(code, open) {
  let depth = 0
  for (let i = open; i < code.length; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') {
      depth--
      if (depth === 0) return code.slice(open, i + 1)
    }
  }
  return null
}

/**
 * Every module-level object carrying both `stiffness` and `damping`.
 *
 * Both, not either: `restDelta`/`restSpeed` alone describe a stopping
 * threshold, and an object with only one of the two is not a spring anyone can
 * draw.
 */
export function readSprings(code) {
  const out = []
  for (const m of code.matchAll(/const ([A-Za-z_$][\w$]*)\s*=\s*\{/g)) {
    const body = objectAt(code, m.index + m[0].length - 1)
    if (!body) continue
    const num = (key) => {
      const hit = body.match(new RegExp(`\\b${key}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`))
      return hit ? Number(hit[1]) : null
    }
    const stiffness = num('stiffness')
    const damping = num('damping')
    if (stiffness === null || damping === null) continue
    const mass = num('mass') ?? 1
    out.push({
      name: m[1],
      stiffness,
      damping,
      mass,
      restDelta: num('restDelta'),
      restSpeed: num('restSpeed'),
      preset: presetFor({ stiffness, damping, mass }),
    })
  }
  return out
}

/** Names that mean "a length of time". `chance = 0.86` is a probability and
 *  `playOnce = true` is not a number; neither is a duration. */
const DURATION_NAME = /^(duration|[\w$]*[Dd]uration|[\w$]*_?MS|[\w$]*Ms)$/

export function readDurations(code) {
  const byName = new Map()
  // Destructured parameter defaults: `duration = 620,`
  for (const m of code.matchAll(/\b([A-Za-z_$][\w$]*)\s*=\s*(\d+(?:\.\d+)?)\s*[,)}]/g)) {
    if (DURATION_NAME.test(m[1])) byName.set(m[1], Number(m[2]))
  }
  // Module constants: `const FADE_MS = 120`
  for (const m of code.matchAll(/const ([A-Za-z_$][\w$]*)\s*=\s*(\d+(?:\.\d+)?)\b/g)) {
    if (DURATION_NAME.test(m[1])) byName.set(m[1], Number(m[2]))
  }
  return [...byName].map(([name, ms]) => ({ name, ms }))
}

/**
 * Whether the component has a real reduced-motion path.
 *
 * Matched on the shape rather than on one hook name. `disclosure` binds
 * motion's `useReducedMotion`; `scramble-reveal` binds a `usePrefersReducedMotion`
 * it defines itself. Anchoring on a single import is how the old `useZTransition`
 * check ended up matching nothing at all.
 *
 * The branch is required, not just the binding: reading the preference and then
 * animating anyway is the failure this is here to catch.
 */
export function readReducedMotion(code) {
  const bind = code.match(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*use[\w$]*ReducedMotion\s*\(/)
  if (!bind) return null
  const id = bind[1]
  return new RegExp(`if\\s*\\(\\s*!?${id}\\b`).test(code) ? 'branch' : null
}

export function scanMotion(src) {
  const code = stripComments(src)
  return {
    states: readStates(src),
    springs: readSprings(code),
    durations: readDurations(code),
    reducedMotion: readReducedMotion(code),
  }
}
```

- [ ] **Step 4: Run the harness**

```bash
cd d:/ABENOR-LABS/Z-ui && node scripts/motion-scan.test.mjs
```

Expected: every assertion silent, seven `CAUGHT` lines, and a final `motion-scan clean:` summary. If any line reads `MISSED`, the scanner cannot detect that breakage and the regex needs work — do not proceed.

- [ ] **Step 5: Add it to the verify ladder**

In the root `package.json`, add the script and insert it into `verify` directly after `lint:registry:test`:

```json
    "lint:motion:test": "node scripts/motion-scan.test.mjs",
    "verify": "pnpm typecheck && pnpm lint:registry && pnpm lint:registry:test && pnpm lint:motion:test && pnpm lint:contrast && pnpm lint:contrast:test && pnpm registry:check && pnpm test"
```

- [ ] **Step 6: Commit**

```bash
git add scripts/motion-scan.mjs scripts/motion-scan.test.mjs package.json
git commit -m "feat(registry): one reader for a component's motion

Every piece of motion metadata this project holds has been authored by hand and
checked against nothing. It drifted four times without a single failing build:
--spring rewrote nothing, doctor's reduced-motion grep matched a deleted symbol,
and both manifests claim a snap preset neither component runs.

scanMotion reads states, springs, durations and the reduced-motion branch out of
the source itself. Nothing consumes it yet; the generator and the linter follow.

Regexes, not an AST: typescript@7 is the native port and exports no
createSourceFile, and a second differently-shaped source reader beside the one
lint-registry already uses would be a fifth way to drift. What makes it safe is
that every caller treats an unreadable component as a build failure — the
harness proves it by breaking disclosure seven ways and requiring each to be
caught."
```

---

## Task 9: schema, generator, manifests and gate — one commit

These cannot be split. The new gate rejects the manifests as they stand, so it has to land with their correction.

**Files:**
- Modify: `registry/schema/registry-item.schema.json`
- Modify: `registry/components/disclosure/component.json`
- Modify: `registry/components/scramble-reveal/component.json`
- Modify: `web/scripts/build-registry.mjs`
- Modify: `scripts/lint-registry.mjs`
- Modify: `scripts/lint-registry.test.mjs`

- [ ] **Step 1: Extend the schema**

In `registry/schema/registry-item.schema.json`, replace the `spring` property inside `meta.properties` with:

```json
        "motion": {
          "type": "object",
          "description": "Derived from the component source by scripts/motion-scan.mjs. Never authored by hand — the generator overwrites it, and lint-registry fails if it disagrees with a fresh scan.",
          "additionalProperties": false,
          "required": ["springs", "durations", "reducedMotion"],
          "properties": {
            "springs": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["name", "stiffness", "damping", "mass", "preset"],
                "properties": {
                  "name": { "type": "string" },
                  "stiffness": { "type": "number" },
                  "damping": { "type": "number" },
                  "mass": { "type": "number" },
                  "restDelta": { "type": ["number", "null"] },
                  "restSpeed": { "type": ["number", "null"] },
                  "preset": { "type": ["string", "null"], "enum": ["snap", "bounce", "settle", "fling", null] }
                }
              }
            },
            "durations": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["name", "ms"],
                "properties": { "name": { "type": "string" }, "ms": { "type": "number" } }
              }
            },
            "reducedMotion": { "enum": ["branch", null] }
          }
        },
        "spring": {
          "enum": ["snap", "bounce", "settle", "fling", null],
          "description": "Derived, not authored. The generator writes the preset the scanned spring matches, or null when the component tunes its own. A component.json carrying this field is rejected."
        }
```

Then change the component branch in `allOf` — `spring` is no longer authored, so it cannot be required of an authored manifest:

```json
        "properties": {
          "meta": { "required": ["category", "gesture", "states"] }
        },
        "description": "Components must declare their category, driving gesture and state machine. Spring and motion data are derived from source by the generator, never authored."
```

- [ ] **Step 2: Drop `spring` from both manifests**

Remove the `"spring": "snap"` line from `registry/components/disclosure/component.json` and from `registry/components/scramble-reveal/component.json`, including the trailing comma on the preceding `states` line where needed. `disclosure`'s `meta` becomes:

```json
  "meta": {
    "category": "state-morphing",
    "gesture": "press",
    "states": ["closed", "opening", "open", "closing"]
  }
```

- [ ] **Step 3: Gate it in `lint-registry.mjs`**

Add the import beside the others at the top:

```js
import { scanMotion } from './motion-scan.mjs'
```

Add this immediately after `const manifest = json(manifestPath)`:

```js
  // Derived, never authored. Both manifests declared `"spring": "snap"` for as
  // long as they existed; disclosure runs 520/46 and scramble-reveal runs no
  // spring at all. Nothing enforced the field, so nothing caught either.
  check(
    manifest.meta?.spring === undefined,
    where,
    '`meta.spring` is derived by the generator from the component source; remove it from component.json',
  )
```

Then inside the per-file source loop, replace the existing `statesMatch` block's opening two lines so the scanner owns the parse. Change:

```js
    const statesMatch = src.match(/const STATES = \[([\s\S]*?)\] as const/)
    if (check(statesMatch, at, 'component must declare `const STATES = [...] as const`')) {
      const declared = [...statesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
```

to:

```js
    const scan = scanMotion(src)

    // A component whose motion cannot be read cannot be previewed, and more to
    // the point cannot be checked. Unreadable is a build failure, not a
    // degraded manifest.
    if (usesMotion) {
      check(
        scan.springs.length > 0 || scan.durations.length > 0,
        at,
        'imports motion but no spring constant or duration default is readable; scripts/motion-scan.mjs found neither',
      )
    }

    // The accessibility contract from ADR 0002, generalised off the deleted
    // useZTransition and onto the shape every component actually uses: a
    // binding from a use*ReducedMotion hook, and a branch that reads it.
    check(
      scan.reducedMotion === 'branch',
      at,
      'no reduced-motion branch found; expected `const <id> = use…ReducedMotion()` and an `if (<id>)` that skips the animation',
    )

    if (check(scan.states, at, 'component must declare `const STATES = [...] as const`')) {
      const declared = scan.states
```

The rest of that block — the `meta.states` comparison, the variants loop, and the two motion-scoped checks — is unchanged.

- [ ] **Step 4: Run lint and watch it fail correctly**

```bash
cd d:/ABENOR-LABS/Z-ui && node scripts/lint-registry.mjs
```

Expected before step 2 is applied: two failures naming `meta.spring`. After step 2: clean. Run it now and confirm it is clean — if it still fails, the manifests were not fully corrected.

- [ ] **Step 5: Emit the data from the generator**

In `web/scripts/build-registry.mjs`, add the import:

```js
import { scanMotion } from '../../scripts/motion-scan.mjs'
```

Inside `collect()`, after `const files = manifest.files.map(...)`, add:

```js
    // Scanned from the file that is the component itself, not from a hook or a
    // lib shipped beside it.
    const primary = files.find((f) => f.type === 'registry:component') ?? files[0]
    const motion = manifest.type === 'registry:component' ? scanMotion(primary.content) : null
```

and change the two metadata lines in the returned object:

```js
      states: manifest.meta?.states ?? null,
      // Derived. An authored value is rejected by lint-registry.
      spring: motion?.springs.find((s) => s.preset)?.preset ?? null,
      motion,
```

Add `motion` to the emitted registry item, inside the `meta` object of `public/r/<name>.json`:

```js
        meta: {
          category: item.category,
          gesture: item.gesture,
          states: item.states,
          spring: item.spring,
          motion: item.motion,
          digests: Object.fromEntries(item.files.map((f) => [f.path, f.sha])),
        },
```

Add it to `__generated__/meta.js` too, in the `meta` map:

```js
  spring: item.spring,
  motion: item.motion,
```

- [ ] **Step 6: Update the generated types**

In the `__generated__/meta.d.ts` template inside the generator, add the motion types and correct `ZComponent`:

```ts
export type ZSpring = {
  name: string
  stiffness: number
  damping: number
  mass: number
  restDelta: number | null
  restSpeed: number | null
  /** The published preset these numbers match exactly, or null when bespoke. */
  preset: 'snap' | 'bounce' | 'settle' | 'fling' | null
}
export type ZDuration = { name: string; ms: number }
export type ZMotion = {
  springs: ZSpring[]
  durations: ZDuration[]
  reducedMotion: 'branch' | null
}
```

Add `motion: ZMotion | null` to `ZItem`, and change the `ZComponent` intersection — `spring` is now nullable, and `motion` is guaranteed:

```ts
/** Components always declare a category, a gesture and states. Spring is derived
 *  and is null for a component that tunes its own physics. */
export type ZComponent = ZItem & {
  type: 'registry:component'
  category: string
  gesture: ZGesture
  states: string[]
  spring: string | null
  motion: ZMotion
}
```

- [ ] **Step 7: Regenerate and inspect**

```bash
cd d:/ABENOR-LABS/Z-ui && pnpm --filter @z-ui/web registry && \
  node -e "const m=require('./web/public/r/disclosure.json');console.log(JSON.stringify(m.meta.motion,null,2),'\nspring:',m.meta.spring)"
```

Expected: one spring named `SPRING`, `stiffness: 520`, `damping: 46`, `preset: null`, `reducedMotion: "branch"`, and `spring: null`.

- [ ] **Step 8: Re-point the lint mutation harness**

`scripts/lint-registry.test.mjs` mutates `disclosure`'s manifest. Its first mutation sets `m.meta.states`, which still works. Add one more to the `mutations` array covering the new gate:

```js
  ['authored meta.spring reintroduced', () => {
    const m = JSON.parse(orig.man); m.meta.spring = 'snap'
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
  ['reduced-motion branch removed', () =>
    writeFileSync(SRC, orig.src.replace('    if (reduced) {', '    if (false) {'))],
```

- [ ] **Step 9: Run the whole ladder**

```bash
cd d:/ABENOR-LABS/Z-ui && pnpm verify
```

Expected: registry lint clean with a higher check count, `13/13 mutations caught`, motion-scan clean, registry check clean. `pnpm test` may fail typecheck in `web` if a component reads `spring` as a non-null string — that is the site change, handled in Task 13. If so, complete Task 13 before committing this task.

- [ ] **Step 10: Commit**

```bash
git add registry/schema/registry-item.schema.json registry/components/*/component.json \
        web/scripts/build-registry.mjs web/public/r web/__generated__ \
        scripts/lint-registry.mjs scripts/lint-registry.test.mjs
git commit -m "feat(registry): derive motion metadata instead of authoring it

meta.spring said \"snap\" on both components. disclosure runs 520/46 — near
snap's 500/40, and deliberately not equal, because the file argues an overshoot
on height reads as a rendering bug. scramble-reveal has no spring at all. The
field was never enforced, so neither claim ever failed a build.

The generator now scans each component and writes meta.motion — springs with an
exact preset match or null, durations, and whether a reduced-motion branch
exists. meta.spring is derived from the same scan. Authoring either is now a
lint failure.

Two new gates come with it: a component that imports motion must expose
something readable, and every component must have a reduced-motion branch. The
second is ADR 0002's accessibility requirement, moved off the deleted
useZTransition symbol and onto the shape components actually use — one binds
motion's useReducedMotion, the other a hook it defines itself, and matching on
a single import name is how the old check came to match nothing."
```

---

## Task 10: `z-ui preview`

**Files:**
- Create: `packages/cli/src/commands/preview.ts`
- Modify: `packages/cli/src/registry/fetch.ts`
- Modify: `packages/cli/src/index.ts`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Add the types to `fetch.ts`**

```ts
export type MotionSpring = {
  name: string
  stiffness: number
  damping: number
  mass: number
  restDelta: number | null
  restSpeed: number | null
  preset: 'snap' | 'bounce' | 'settle' | 'fling' | null
}

export type MotionScan = {
  springs: MotionSpring[]
  durations: { name: string; ms: number }[]
  reducedMotion: 'branch' | null
}
```

and extend `RegistryItem['meta']`:

```ts
  meta: {
    category?: string
    gesture?: string
    states?: string[]
    spring?: string | null
    /** Derived from source by scripts/motion-scan.mjs at build time. */
    motion?: MotionScan
    /** file path → sha256 prefix, written by the generator. */
    digests?: Record<string, string>
  }
```

- [ ] **Step 2: Write the failing test**

```ts
describe('preview', () => {
  const spring = {
    name: 'SPRING', stiffness: 520, damping: 46, mass: 1,
    restDelta: 2, restSpeed: 20, preset: null,
  }

  test('describes a bespoke spring by its numbers, not by a preset name', () => {
    assert.match(describeSpring(spring), /520/)
    assert.match(describeSpring(spring), /bespoke/i)
  })

  test('names the preset when the numbers match one exactly', () => {
    assert.match(describeSpring({ ...spring, stiffness: 500, damping: 40, preset: 'snap' }), /snap/)
  })

  test('a component with no motion data is reported, not rendered blank', () => {
    assert.throws(() => assertPreviewable({ name: 'x', meta: {} } as never), /no motion data/i)
  })
})
```

Add the import:

```ts
import { describeSpring, assertPreviewable } from '../src/commands/preview.ts'
```

- [ ] **Step 3: Run and confirm failure**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — the module does not exist.

- [ ] **Step 4: Create `packages/cli/src/commands/preview.ts`**

```ts
import { Registry, type RegistryItem, type MotionSpring } from '../registry/fetch.ts'
import { readConfig, DEFAULT_REGISTRY } from '../project/config.ts'
import { simulateSpring, dampingRatioOf, regimeOf, renderCurve } from '../ui/spring-curve.ts'
import { intro } from '../ui/art.ts'
import { log, c, UserError } from '../ui/log.ts'

/**
 * What a component's motion is, before you install it.
 *
 * Reads `meta.motion` and nothing else. The data was scanned out of the source
 * at build time, so this does no parsing on the user's machine — a component the
 * scanner could not read never reached the registry in the first place.
 *
 * The curve is the same integration `z-ui spring` draws, which is the same
 * spring-mass-damper `motion` runs. Not an illustration of one.
 */
const WINDOW_MS = 650
const WIDTH = 52
const HEIGHT = 9

export function describeSpring(s: MotionSpring): string {
  const zeta = dampingRatioOf(s.stiffness, s.damping, s.mass)
  const origin = s.preset
    ? `preset ${s.preset}`
    : 'bespoke — tuned for this component, not one of the four presets'
  return `${s.name}  stiffness ${s.stiffness}  damping ${s.damping}  mass ${s.mass}  ζ ${zeta.toFixed(2)}  ${origin}`
}

/**
 * `meta.motion` is written by the generator, so it exists in `web/public/r/` and
 * not in the authoring tree. A contributor pointing `--registry` at
 * `./registry` is reading `component.json` directly, which no longer carries a
 * spring at all — that is the whole point of deriving it. Say so rather than
 * reporting the component as broken.
 */
export function assertPreviewable(item: RegistryItem) {
  if (!item.meta?.motion) {
    throw new UserError(
      `${item.name} carries no motion data.`,
      'Motion data is generated, so a source-tree registry has none. Run `pnpm registry` and point --registry at web/public, or drop --registry to read the published one.',
    )
  }
  return item.meta.motion
}

export async function preview(opts: {
  version: string
  name?: string
  cwd: string
  registry?: string
  json: boolean
}) {
  if (!opts.name) throw new UserError('Which component?', 'z-ui preview <name> — `z-ui list` shows them.')

  const base = opts.registry ?? (await registryBase(opts.cwd))
  const registry = new Registry(base)
  const item = await registry.item(opts.name)
  const motion = assertPreviewable(item)

  if (opts.json) {
    log.raw(JSON.stringify({ name: item.name, states: item.meta.states ?? [], ...motion }, null, 2))
    return
  }

  intro(opts.version, `${item.name} — how it moves`)

  log.line(`  ${c.bold(item.title)}  ${c.grey(item.meta.gesture ?? '')}`)
  log.line(`  ${c.grey(item.description)}`)
  log.line()

  const states = item.meta.states ?? []
  if (states.length) {
    // A set, not a machine. The scanner reads the STATES tuple; it does not and
    // will not infer which state reaches which, because guessing edges is the
    // failure this whole mechanism exists to remove.
    log.line(`  ${c.bold('States')}  ${c.grey(`${states.length}, in declaration order`)}`)
    log.line(`    ${states.map((s) => c.cyan(s)).join(c.grey(' · '))}`)
    log.line()
  }

  for (const s of motion.springs) {
    const stats = simulateSpring(s.stiffness, s.damping, s.mass)
    const zeta = dampingRatioOf(s.stiffness, s.damping, s.mass)
    log.line(`  ${c.bold('Spring')}  ${describeSpring(s)}`)
    log.line(`  ${c.grey(regimeOf(zeta))}`)
    log.line()
    for (const row of renderCurve(stats.samples, { width: WIDTH, height: HEIGHT, windowMs: WINDOW_MS })) {
      log.line(`  ${row}`)
    }
    const overshoot = stats.overshootPct < 0.1 ? '0%' : `${stats.overshootPct.toFixed(1)}%`
    const t90 = stats.t90 === null ? c.yellow('never reaches 90%') : `${stats.t90}ms`
    log.line()
    log.line(`  ${c.grey('t90')} ${t90}  ${c.grey('overshoot')} ${overshoot}  ${c.grey('settle')} ${stats.settleMs}ms`)
    if (s.restDelta !== null || s.restSpeed !== null) {
      log.line(`  ${c.grey(`rest thresholds: delta ${s.restDelta ?? '—'}, speed ${s.restSpeed ?? '—'}`)}`)
    }
    log.line()
  }

  for (const d of motion.durations) {
    log.line(`  ${c.bold('Duration')}  ${c.cyan(d.name)} ${d.ms}ms`)
  }
  if (motion.durations.length) log.line()

  const reduced =
    motion.reducedMotion === 'branch'
      ? c.green('✓') + ' takes a real path under prefers-reduced-motion'
      : c.yellow('!') + ' no reduced-motion branch found'
  log.line(`  ${reduced}`)
  log.line()

  if (item.dependencies.length) {
    log.line(`  ${c.grey(`installs: ${item.dependencies.join(', ')}`)}`)
  }
  for (const f of item.files) log.line(`  ${c.grey(`→ ${f.target ?? f.path}`)}`)
  log.line()
  log.line(c.grey(`  z-ui add ${item.name}`))
  log.line()
}

/** `preview` must work before `init` has run, same as `list`. */
async function registryBase(cwd: string): Promise<string> {
  try {
    return (await readConfig(cwd)).registry
  } catch {
    return DEFAULT_REGISTRY
  }
}
```

- [ ] **Step 5: Register the command**

In `packages/cli/src/index.ts`, add the import:

```ts
import { preview } from './commands/preview.ts'
```

the case:

```ts
    case 'preview':
      return preview({
        version: VERSION,
        name: rest[0],
        cwd,
        registry: values.registry,
        json: values.json!,
      })
```

and the help line, under `Commands`:

```
    ${c.cyan('preview')} <name>   how a component moves, before you install it
```

Also extend the `--json` option description to `(list, doctor, preview)`.

- [ ] **Step 6: Run the tests**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: PASS.

- [ ] **Step 7: Look at it**

```bash
cd packages/cli && node --experimental-strip-types src/index.ts preview disclosure \
  --registry ../../web/public
```

Expected: the header, four states, `SPRING stiffness 520 damping 46 mass 1 ζ 1.01 bespoke`, `critically damped`, an ASCII curve, the stats line, rest thresholds, and a green reduced-motion tick.

Then confirm it reads a bespoke spring correctly against the local source registry too:

```bash
cd packages/cli && node --experimental-strip-types src/index.ts preview scramble-reveal \
  --registry ../../web/public
```

Expected: three states, no spring block, `Duration duration 620ms`, green reduced-motion tick.

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/commands/preview.ts packages/cli/src/registry/fetch.ts packages/cli/src/index.ts packages/cli/test/unit.test.ts
git commit -m "feat(cli): z-ui preview, the motion before the install

Renders meta.motion: the spring's real numbers, whether they match a preset or
were tuned for this component, damping ratio, regime, t90, overshoot, settle,
and the curve — integrated with the same spring-mass-damper motion runs, via
the simulation z-ui spring already owns.

States print as a set in declaration order, never as a graph. The scanner reads
the STATES tuple; inferring which state reaches which would be a guess, and a
guessed edge is the exact failure this data was introduced to remove.

No parsing on the user's machine. A component the scanner could not read never
reaches the registry."
```

---

## Task 11: `--spring` refuses a bespoke spring

**Files:**
- Modify: `packages/cli/src/project/spring.ts`
- Modify: `packages/cli/src/commands/add.ts`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('springRefusal', () => {
  const bespoke = { name: 'SPRING', stiffness: 520, damping: 46, mass: 1, restDelta: 2, restSpeed: 20, preset: null }
  const preset = { name: 'SPRING', stiffness: 500, damping: 40, mass: 1, restDelta: null, restSpeed: null, preset: 'snap' as const }
  const item = (springs: unknown[]) =>
    ({ name: 'disclosure', meta: { motion: { springs, durations: [], reducedMotion: 'branch' } } }) as never

  test('refuses when every spring is bespoke, naming the numbers', () => {
    const msg = springRefusal(item([bespoke]), 'bounce')
    assert.match(msg ?? '', /520/)
    assert.match(msg ?? '', /46/)
  })

  test('allows a preset spring through', () => {
    assert.equal(springRefusal(item([preset]), 'bounce'), null)
  })

  test('refuses a component with no spring at all', () => {
    assert.match(springRefusal(item([]), 'bounce') ?? '', /no spring/i)
  })

  test('says nothing about a component with no motion data', () => {
    assert.equal(springRefusal({ name: 'x', meta: {} } as never, 'bounce'), null)
  })
})
```

Add `springRefusal` to the spring import.

- [ ] **Step 2: Run and confirm failure**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — `springRefusal` is not exported.

- [ ] **Step 3: Implement**

Append to `packages/cli/src/project/spring.ts`:

```ts
import type { RegistryItem } from '../registry/fetch.ts'

/**
 * Whether `--spring` may touch this component at all.
 *
 * A component whose spring is bespoke is not one that forgot to use a preset.
 * disclosure runs 520/46 against snap's 500/40 and its tuning comment spends a
 * paragraph on why: the content is anchored to the top of the panel, so an
 * overshoot on height is not a bounce, it is a gap opening under the last line.
 * Rewriting it to `bounce` would produce exactly the rendering bug the author
 * tuned it to avoid.
 *
 * So this refuses rather than rewrites, and says why. Returns null when there is
 * no motion data to reason about — an older manifest is not grounds to block an
 * install.
 */
export function springRefusal(item: RegistryItem, requested: string): string | null {
  const motion = item.meta?.motion
  if (!motion) return null

  if (!motion.springs.length) {
    return `${item.name} has no spring to retarget — its motion is not spring-driven, so --spring ${requested} has nothing to act on.`
  }
  if (motion.springs.every((s) => s.preset === null)) {
    const s = motion.springs[0]!
    return `${item.name} tunes its own spring (stiffness ${s.stiffness}, damping ${s.damping}, mass ${s.mass}) rather than using a preset. Installing ${requested} over it would change physics the component was deliberately tuned against. Install it and edit ${s.name} if you want different numbers.`
  }
  return null
}
```

- [ ] **Step 4: Enforce it in `add`**

In `packages/cli/src/commands/add.ts`, immediately after the `assertPreset` line:

```ts
  const spring = opts.spring ? assertPreset(opts.spring) : undefined

  if (spring) {
    for (const item of items) {
      if (item.type !== 'registry:component') continue
      const refusal = springRefusal(item, spring)
      if (refusal) throw new UserError(refusal, 'Drop --spring to install the component as tuned.')
    }
  }
```

and extend the import:

```ts
import { assertPreset, springOutcome, springRefusal } from '../project/spring.ts'
```

- [ ] **Step 5: Run the tests**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify against the real component**

```bash
cd packages/cli && node --experimental-strip-types src/index.ts add disclosure \
  --cwd /tmp/zauto --registry ../../web/public --spring bounce --dry-run; echo "exit=$?"
```

Expected: `✗ disclosure tunes its own spring (stiffness 520, damping 46, mass 1) …`, hint, `exit=1`. Nothing written.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/project/spring.ts packages/cli/src/commands/add.ts packages/cli/test/unit.test.ts
git commit -m "fix(cli): --spring refuses a component that tuned its own

A bespoke spring is not a component that forgot to use a preset. disclosure runs
520/46 against snap's 500/40 and spends a paragraph on why: content anchored to
the top of the panel means an overshoot on height is not a bounce, it is a gap
opening under the last line. Rewriting it to bounce produces exactly the
rendering bug it was tuned to avoid.

So the flag refuses and explains, instead of rewriting or — as it did until this
week — silently doing nothing at all."
```

---

## Task 12: `doctor` audits reduced motion again

**Files:**
- Modify: `packages/cli/src/commands/doctor.ts`
- Test: `packages/cli/test/unit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('reduced-motion audit', () => {
  const src = `const reduced = useReducedMotion() ?? false
    if (reduced) { height.jump(target); return }`

  test('accepts source that binds a hook and branches on it', () => {
    assert.equal(hasReducedMotionBranch(src), true)
  })

  test('rejects source where the branch was edited out', () => {
    assert.equal(hasReducedMotionBranch(src.replace('if (reduced)', 'if (false)')), false)
  })

  test('rejects source where the hook was replaced by a literal', () => {
    assert.equal(hasReducedMotionBranch('const reduced = false\n if (reduced) {}'), false)
  })

  test('accepts a locally-defined hook, not just motion’s', () => {
    assert.equal(
      hasReducedMotionBranch('const reduced = usePrefersReducedMotion()\n if (reduced || x) {}'),
      true,
    )
  })
})
```

Add the import:

```ts
import { hasReducedMotionBranch } from '../src/commands/doctor.ts'
```

- [ ] **Step 2: Run and confirm failure**

```bash
cd packages/cli && node --test --experimental-strip-types test/unit.test.ts
```

Expected: failure — `hasReducedMotionBranch` is not exported.

- [ ] **Step 3: Replace the dead check**

In `packages/cli/src/commands/doctor.ts`, add above `doctor()`:

```ts
/**
 * Mirrors `readReducedMotion` in scripts/motion-scan.mjs.
 *
 * Duplicated rather than imported: the scanner is a repo script and the
 * published CLI ships only `dist/`. A test asserts the two agree, which is the
 * same arrangement `digest` has with the generator's `sha`.
 */
export function hasReducedMotionBranch(src: string): boolean {
  const bind = src.match(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*use[\w$]*ReducedMotion\s*\(/)
  if (!bind) return false
  return new RegExp(`if\\s*\\(\\s*!?${bind[1]}\\b`).test(src)
}
```

Then replace the `useZTransition` block (`doctor.ts:62-74`) with:

```ts
      // Was a grep for `useZTransition(`. That symbol was deleted with
      // registry/lib/z-spring and the check could not fire against any live
      // component — it found nothing and reported success, for weeks.
      //
      // The manifest now says whether the component shipped a reduced-motion
      // branch, so this compares against a claim instead of a guess.
      if (item.meta?.motion?.reducedMotion === 'branch' && !hasReducedMotionBranch(local)) {
        findings.push({
          level: 'warn',
          name: entry.name,
          message:
            'reduced-motion branch is gone — this component will animate through prefers-reduced-motion',
        })
        continue
      }
```

- [ ] **Step 4: Pin the CLI's copies against the scanner**

`packages/cli/test/unit.test.ts:270-274` skips a preset cross-check against the deleted `registry/lib/z-spring/z-spring.ts`. Replace that block — the scanner is a live anchor:

```ts
/**
 * The spring scale and the reduced-motion shape both exist twice: once here in
 * the CLI, which ships alone, and once in scripts/motion-scan.mjs, which the
 * generator and the linter share. A copy that can silently drift is worse than
 * no copy; a copy with a tripwire is fine.
 *
 * This replaces a cross-check against registry/lib/z-spring/z-spring.ts, which
 * was deleted in the registry clear-out. That test skipped rather than failed,
 * so the scale went unverified and nobody saw it in the output.
 */
const SCANNER = new URL('../../../scripts/motion-scan.mjs', import.meta.url)

describe('CLI copies match scripts/motion-scan.mjs', () => {
  test('every preset matches the scanner’s scale', async () => {
    const { PRESETS } = await import(SCANNER.href)
    assert.deepEqual(Object.keys(PRESETS).sort(), Object.keys(springs).sort())
    for (const [name, p] of Object.entries(PRESETS)) {
      assert.deepEqual({ ...springs[name as keyof typeof springs] }, p, `${name} drifted`)
    }
  })

  test('the reduced-motion matcher agrees with the scanner on real source', async () => {
    const { readReducedMotion } = await import(SCANNER.href)
    const src = readFileSync(
      new URL('../../../registry/components/disclosure/disclosure.tsx', import.meta.url),
      'utf8',
    )
    assert.equal(hasReducedMotionBranch(src), readReducedMotion(src) === 'branch')
  })
})
```

Remove the now-unused `Z_SPRING` and `hasRegistrySpring` bindings.

- [ ] **Step 5: Run the tests and confirm nothing skips**

```bash
cd packages/cli && node --test --experimental-strip-types test/*.test.ts 2>&1 | tail -8
```

Expected: `skipped 0`. A non-zero skip count means a harness is still anchored on something deleted — find it before moving on.

- [ ] **Step 6: Verify doctor catches a real edit**

```bash
rm -rf /tmp/zdoc && mkdir -p /tmp/zdoc && cd packages/cli && \
  node --experimental-strip-types src/index.ts add disclosure --cwd /tmp/zdoc --registry ../../web/public --yes && \
  node -e "const f='/tmp/zdoc/components/z-ui/disclosure.tsx';const fs=require('fs');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('if (reduced) {','if (false) {'))" && \
  node --experimental-strip-types src/index.ts doctor --cwd /tmp/zdoc --registry ../../web/public; echo "exit=$?"
```

Expected: `! disclosure  reduced-motion branch is gone …`, `1 warning`, `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/doctor.ts packages/cli/test/unit.test.ts
git commit -m "fix(cli): the reduced-motion audit can fail again

doctor greped for \`useZTransition(\`. That symbol went with registry/lib/z-spring
in the clear-out and appears in no component, so the check ran on every install
and could not fire. It found nothing and printed 'Nothing broken.'

It now compares the installed file against meta.motion.reducedMotion — a claim
the generator derived from the source — and matches on the shape rather than one
hook name, because one component binds motion's useReducedMotion and the other
binds a hook it defines itself.

Also re-points the CLI's preset cross-check, which had been skipping since
z-spring.ts was deleted, at scripts/motion-scan.mjs. The suite now reports zero
skipped."
```

---

## Task 13: the site stops showing a spring that is not there

Both components displayed a `snap` badge. `disclosure`'s spring is bespoke and `scramble-reveal` has none.

**Files:**
- Modify: whichever `web/` component renders `spring` — find it in step 1
- Modify: `web/__generated__/*` (regenerated)

- [ ] **Step 1: Find every consumer**

```bash
cd d:/ABENOR-LABS/Z-ui && grep -rn "\.spring\b" web --include=*.tsx --include=*.ts | grep -v __generated__ | grep -v node_modules
```

- [ ] **Step 2: Render the truth**

For each site that prints `item.spring`, use `item.motion` when the preset is null. A component with a bespoke spring shows its numbers; one with no spring shows its duration; one with neither shows nothing rather than a placeholder:

```tsx
function springLabel(item: ZComponent): string | null {
  if (item.spring) return item.spring
  const s = item.motion.springs[0]
  if (s) return `${s.stiffness}/${s.damping} bespoke`
  const d = item.motion.durations[0]
  if (d) return `${d.ms}ms`
  return null
}
```

Render nothing when it returns null — an empty badge is worse than no badge.

- [ ] **Step 3: Typecheck**

```bash
cd d:/ABENOR-LABS/Z-ui && pnpm typecheck
```

Expected: clean. `ZComponent.spring` is now `string | null`, so any non-null use is a compile error and this step is what surfaces the full list.

- [ ] **Step 4: Look at it**

```bash
cd d:/ABENOR-LABS/Z-ui && pnpm dev
```

Open the catalogue. Expected: `disclosure` reads `520/46 bespoke`, `scramble-reveal` reads `620ms`. Neither says `snap`.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "fix(web): the catalogue stops printing a spring neither component runs

Both cards showed a snap badge, because both manifests declared one and nothing
checked. disclosure is tuned to 520/46 and scramble-reveal has no spring at all.

A bespoke spring now shows its numbers and a duration-driven component shows its
duration. A showcase whose pitch is motion craft should not be less specific
about its springs than its own CLI is."
```

---

## Task 14: final gate

- [ ] **Step 1: Run everything from a clean tree**

```bash
cd d:/ABENOR-LABS/Z-ui && pnpm verify
```

Expected, in order: typecheck ×4 clean; registry lint clean with a check count above 42; `13/13 mutations caught`; `motion-scan clean`; contrast lint clean; `lint-contrast.test` still printing its known `SKIPPED` (out of scope, see the spec); registry check clean; CLI tests passing with **0 skipped**.

- [ ] **Step 2: Confirm the generated tree is committed**

```bash
cd d:/ABENOR-LABS/Z-ui && git status --short
```

Expected: empty. A dirty `web/__generated__` or `web/public/r` means `pnpm registry` ran after the last commit and the output was not staged — `registry:check` would fail in CI.

- [ ] **Step 3: Walk the commands once, in order, as a new user would**

```bash
rm -rf /tmp/zfinal && mkdir -p /tmp/zfinal && cd packages/cli && \
  node --experimental-strip-types src/index.ts list --registry ../../web/public && \
  node --experimental-strip-types src/index.ts preview disclosure --registry ../../web/public && \
  node --experimental-strip-types src/index.ts add disclosure --cwd /tmp/zfinal --registry ../../web/public --yes && \
  node --experimental-strip-types src/index.ts doctor --cwd /tmp/zfinal --registry ../../web/public
```

Expected: the catalogue table; the preview with a real curve; `add` writing `z-ui.json` unprompted and installing one file; `doctor` reporting `unmodified` and `Nothing broken.`

- [ ] **Step 4: Hand back**

Nothing is pushed and no version is bumped, by decision. Report what changed, what `pnpm verify` reported, and leave release sequencing to the user.

---

## Deliberately not done

- **Registry response caching.** `raw.githubusercontent.com` is CDN-fronted, and this repo has twice read propagation lag as failure. A cache converts a two-minute lag into a stale read with no expiry a user can reason about.
- **Re-pointing `scripts/lint-contrast.test.mjs`.** Still anchored on the deleted `like-button` and `web/components/catalog-card.tsx`, still printing `SKIPPED` and exiting 0. Same class of wound, separate fix — folding it in would make both harder to review. It is the obvious next piece of work.
- **A state graph in `preview`.** `disclosure` derives `data-state` from a nested ternary over `open` and `settled`. Inferring edges from that is a guess, and a guessed edge is the failure this work exists to remove.
- **`preview` against a source-tree registry.** `--registry ./registry` assembles items from `component.json`, which carries no derived motion data by design. `preview` says so and points at `web/public`. Teaching the CLI to scan source itself would put the brittle half on the user's machine, which approach 2 in the spec was rejected for.
- **Publishing.** `0.1.1` is still unpublished, and everything here would ride the same release. That is the user's call and needs an OTP only they can enter.
