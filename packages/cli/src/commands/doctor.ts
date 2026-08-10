import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { Registry } from '../registry/fetch.ts'
import { readConfig } from '../project/config.ts'
import { rewriteImports, resolveTarget } from '../project/write.ts'
import { missingDependencies, detectPackageManager, installCommand } from '../project/deps.ts'
import { intro } from '../ui/art.ts'
import { log, c } from '../ui/log.ts'

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

/**
 * Mirrors `readReducedMotion` in scripts/motion-scan.mjs.
 *
 * Duplicated rather than imported: the scanner is a repo script and the
 * published CLI ships only `dist/`. A test asserts the two agree on real
 * component source, which is the same arrangement `digest` has with the
 * generator's `sha`.
 */
export function hasReducedMotionBranch(src: string): boolean {
  const bind = src.match(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*use[\w$]*ReducedMotion\s*\(/)
  if (!bind) return false
  return new RegExp(`if\\s*\\(\\s*!?${bind[1]}\\b`).test(src)
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

/**
 * Read-only. `doctor` never edits — a tool that silently repairs the file you
 * deliberately changed is worse than one that says nothing.
 *
 * The reduced-motion check is the third of the behaviours ADR 0002 requires of
 * a first-party CLI. Every registry component routes its transition through
 * `useZTransition`, which is what honours `prefers-reduced-motion`. Editing
 * that call out is the single most likely way someone silently breaks the
 * accessibility contract while customising their own copy, and no
 * general-purpose registry client would know to look.
 */
export async function doctor(opts: {
  version: string
  cwd: string
  registry?: string
  json?: boolean
}) {
  // Same rule `list` follows: nothing before the opening brace on stdout, or
  // the output cannot be piped.
  if (!opts.json) intro(opts.version, `checking ${opts.cwd}`)

  const config = await readConfig(opts.cwd)
  const registry = new Registry(opts.registry ?? config.registry)

  const index = await registry.index()
  const components = index.items.filter((i) => i.type === 'registry:component')

  const findings: Finding[] = []
  let installed = 0

  for (const entry of components) {
    const item = await registry.item(entry.name).catch(() => null)
    if (!item) continue

    for (const file of item.files) {
      const rel = resolveTarget(file.target ?? file.path, config)
      const abs = path.resolve(opts.cwd, rel)
      if (!existsSync(abs)) continue

      installed++
      const local = await readFile(abs, 'utf8')
      const expected = rewriteImports(file.content, config)

      if (local === expected) {
        findings.push({ level: 'ok', name: entry.name, message: 'unmodified' })
        continue
      }

      // Modified is not a problem — it is the entire premise of the library.
      // What matters is whether the modification broke a contract.
      const notes: string[] = ['edited locally']

      // Was a grep for `useZTransition(`. That symbol was deleted along with
      // registry/lib/z-spring and appears in no component, so the check ran on
      // every install and could not fire — it found nothing and reported
      // success.
      //
      // The manifest now states whether the component shipped a reduced-motion
      // branch, so this compares an edited file against a derived claim rather
      // than against one hard-coded symbol name.
      if (item.meta?.motion?.reducedMotion === 'branch' && !hasReducedMotionBranch(local)) {
        findings.push({
          level: 'warn',
          name: entry.name,
          message:
            'reduced-motion branch is gone — this component will animate through prefers-reduced-motion',
        })
        continue
      }

      const springDefault = local.match(/\bspring\s*=\s*['"](\w+)['"]/)
      const original = item.meta?.spring
      if (springDefault && original && springDefault[1] !== original) {
        notes.push(`spring changed ${original} → ${springDefault[1]}`)
      }

      findings.push({ level: 'note', name: entry.name, message: notes.join(', ') })
    }
  }

  // Every installed item, not just components. `z-cn` is a registry:lib and it
  // is what pulls in clsx and tailwind-merge — scanning only components misses
  // the dependencies of the primitives every component sits on.
  //
  // Computed before the empty-project branch, not after, so `--json` always
  // carries the field whether or not anything is installed.
  const needed = new Set<string>()
  for (const entry of index.items) {
    const item = await registry.item(entry.name).catch(() => null)
    if (!item) continue
    const present = item.files.some((file) =>
      existsSync(path.resolve(opts.cwd, resolveTarget(file.target ?? file.path, config))),
    )
    if (present) for (const d of item.dependencies ?? []) needed.add(d)
  }
  const missing = await missingDependencies(opts.cwd, [...needed])

  const report = doctorReport(findings, missing, installed)

  if (opts.json) {
    log.raw(JSON.stringify(report, null, 2))
    if (report.warnings) process.exitCode = 1
    return
  }

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
}

const rank = (l: Finding['level']) => (l === 'warn' ? 2 : l === 'note' ? 1 : 0)
