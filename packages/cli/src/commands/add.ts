import { Registry, isUrl } from '../registry/fetch.ts'
import { resolve, npmDependencies } from '../registry/resolve.ts'
import { assertVerified } from '../registry/verify.ts'
import { readConfig, configExists, writeConfig, guessConfig, type Config } from '../project/config.ts'
import { detect } from './init.ts'
import { plan, commit, type PlannedFile } from '../project/write.ts'
import { detectPackageManager, install, missingDependencies, installCommand } from '../project/deps.ts'
import { assertPreset, springOutcome } from '../project/spring.ts'
import { confirm } from '../ui/prompt.ts'
import { multiselect } from '../ui/select.ts'
import { spinner } from '../ui/spinner.ts'
import { isInteractive } from '../ui/tty.ts'
import { intro, detail } from '../ui/art.ts'
import type { RegistryIndex } from '../registry/fetch.ts'
import { log, c, UserError } from '../ui/log.ts'

export type AddOptions = {
  version: string
  components: string[]
  cwd: string
  registry?: string
  yes: boolean
  overwrite: boolean
  dryRun: boolean
  spring?: string
}

/**
 * Ordered so that nothing is written until everything is known to be writable.
 *
 * Fetch, resolve, verify and plan all complete before the first byte lands. A
 * half-installed component whose dependency turned out to be missing is worse
 * than a clean refusal, and the only way to avoid it is to learn the whole
 * shape of the change first.
 */
export async function add(opts: AddOptions) {
  // The banner, not just `init`'s. `add` is the command on every install
  // block on the site — it is the first thing most people ever run, not
  // `init` — so it is the one place a first impression is actually spent.
  intro(opts.version, 'micro-interactions as source you own')

  const config = await loadOrInitConfig(opts)
  const registry = new Registry(opts.registry ?? config.registry)

  const spin = spinner(`Reading ${registry.describe()}`)
  let index
  try {
    index = await registry.index()
    spin.stop()
  } catch (e) {
    spin.fail('Could not read the registry')
    throw e
  }

  // No names given: pick them. A CLI that just errors when you forget the
  // argument is making you go and read a list somewhere else first.
  if (!opts.components.length) {
    if (!isInteractive()) {
      throw new UserError('No component named.', 'Try `z-ui list` to see what is available.')
    }
    opts.components = await pick(index)
    if (!opts.components.length) {
      log.line(c.grey('  Nothing selected.'))
      return
    }
  }

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

  // The names the user typed, plus anything they pointed at by URL. Never a
  // transitively-resolved dependency: retargeting a shared primitive restyles
  // components the user did not mention.
  const requested = new Set([...byName, ...direct.map((d) => d.name)])

  // One of the three behaviours ADR 0002 requires of a first-party CLI.
  assertVerified(items)

  // Validated after resolution so an unknown component is reported before a
  // typo'd preset — the component name is the thing they got wrong first.
  const spring = opts.spring ? assertPreset(opts.spring) : undefined

  const files = await plan(items, config, opts.cwd, { spring, springScope: requested })
  const deps = npmDependencies(items)
  const missing = await missingDependencies(opts.cwd, deps)
  const pm = detectPackageManager(opts.cwd)

  report(files, missing, pm, spring)

  const springNote = springOutcome(files, spring)
  if (springNote) log.warn(springNote)

  if (opts.dryRun) {
    log.line()
    log.ok('Dry run. Nothing was written.')
    return
  }

  const toWrite = await decide(files, opts)
  if (!toWrite.length && !missing.length) {
    log.ok('Everything is already up to date.')
    return
  }

  await commit(toWrite)
  for (const f of toWrite) log.ok(`${f.rel}`)

  if (missing.length) {
    const { command, args } = installCommand(pm, missing)
    log.step(`${command} ${args.join(' ')}`)
    try {
      await install(pm, missing, opts.cwd)
    } catch (e) {
      log.warn(`Dependency install failed. Run it yourself: ${command} ${args.join(' ')}`)
    }
  }

  log.line()
  log.ok(`Added ${[...requested].map((n) => c.cyan(n)).join(', ')}.`)
  log.line(c.grey('  These files are yours now. Edit them.'))
  log.line()
}

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

/**
 * The picker. Only components — primitives resolve as dependencies and
 * offering them here would invite someone to install a hook on its own.
 */
async function pick(index: RegistryIndex): Promise<string[]> {
  const components = index.items.filter((i) => i.type === 'registry:component')
  return multiselect({
    title: 'Which components?',
    choices: components.map((i) => ({
      value: i.name,
      label: i.title ?? i.name,
      tag: i.spring,
      hint: i.description,
      // Searchable but not shown, so "dragging" finds every draggable thing.
      search: [i.category, ...(i.states ?? [])].join(' '),
    })),
  })
}

/**
 * Levenshtein distance, iterative with a single row.
 *
 * A substring match is not enough: the mistakes people actually make are
 * transpositions and dropped letters — `lik-buton` for `like-button` — and
 * `includes` finds neither. Twelve lines beats a dependency.
 */
function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j]! + 1,
        row[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = row
  }
  return prev[b.length]!
}

/** Names close enough to be a plausible typo, nearest first. */
export function nearest(input: string, candidates: string[], limit = 3): string[] {
  const threshold = Math.max(2, Math.floor(input.length / 3))
  const q = input.toLowerCase()
  return candidates
    .map((name) => ({ name, d: distance(q, name.toLowerCase()) }))
    // Containment is checked both ways. Someone typing `scrubber` for `scrub`
    // is three edits away — past any sane threshold — but the real name sits
    // inside what they typed, which is the commonest guess-the-name mistake.
    .filter((x) => x.d <= threshold || x.name.includes(q) || q.includes(x.name))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.name)
}

/** Split what the user typed into registry names and direct manifest URLs. */
export function partitionTargets(targets: string[]): { names: string[]; urls: string[] } {
  const names: string[] = []
  const urls: string[] = []
  for (const t of targets) (isUrl(t) ? urls : names).push(t)
  return { names, urls }
}

function report(files: PlannedFile[], missing: string[], pm: string, spring?: string) {
  const fresh = files.filter((f) => !f.exists)
  const same = files.filter((f) => f.identical)
  const clash = files.filter((f) => f.exists && !f.identical)
  const mark = (f: PlannedFile) => (f.retargeted ? c.magenta(`  spring → ${spring}`) : '')

  log.line()
  if (fresh.length) {
    log.line(c.bold('  Will write'))
    for (const f of fresh) log.line(`    ${c.green('+')} ${f.rel}${mark(f)}`)
  }
  if (clash.length) {
    log.line(c.bold('  Already exists, differs'))
    for (const f of clash) log.line(`    ${c.yellow('~')} ${f.rel}`)
  }
  if (same.length) {
    log.line(c.grey(`  ${same.length} file${same.length === 1 ? '' : 's'} already identical, skipping`))
  }
  if (missing.length) {
    log.line()
    log.line(c.bold('  Will install'))
    log.line(`    ${c.grey(pm)} ${missing.join(' ')}`)
  }
  log.line()
}

/** Which files actually get written, after the overwrite policy is applied. */
async function decide(files: PlannedFile[], opts: AddOptions): Promise<PlannedFile[]> {
  const out: PlannedFile[] = []
  for (const f of files) {
    if (f.identical) continue
    if (!f.exists || opts.overwrite) {
      out.push(f)
      continue
    }
    // An existing file is someone's edited copy. Silently replacing it would
    // destroy the exact thing this tool tells people they own.
    if (opts.yes) {
      log.warn(`Kept your version of ${f.rel} (pass --overwrite to replace).`)
      continue
    }
    if (await confirm(`${f.rel} already exists. Overwrite?`, false)) out.push(f)
    else log.line(c.grey(`    kept ${f.rel}`))
  }
  return out
}
