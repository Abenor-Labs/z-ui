#!/usr/bin/env node
import { createRequire } from 'node:module'
import { parseArgs } from 'node:util'
import { log, c, setSilent, UserError } from './ui/log.ts'
import { init } from './commands/init.ts'
import { add } from './commands/add.ts'
import { list } from './commands/list.ts'
import { doctor } from './commands/doctor.ts'
import { spring } from './commands/spring.ts'

/**
 * Read, not retyped. This was a literal `'0.1.0'`, and the 0.1.1 release caught
 * it printing the old number in the banner, in `--version` and in the
 * `_generatedBy` stamp `doctor` compares against — three lies from one constant
 * nobody remembered to bump.
 *
 * `createRequire` rather than a JSON import: import attributes are still behind
 * a flag on the Node versions in `engines`, and this file has to run both from
 * `dist/` and straight from source under `--experimental-strip-types`.
 * `../package.json` resolves from either, because `src/` and `dist/` sit at the
 * same depth.
 */
const VERSION = createRequire(import.meta.url)('../package.json').version as string

const HELP = `
  ${c.bold('z-ui')} ${c.grey(VERSION)}  ${c.grey('micro-interaction components as source you own')}

  ${c.bold('Usage')}
    z-ui <command> [options]

  ${c.bold('Commands')}
    ${c.cyan('init')}              write z-ui.json
    ${c.cyan('add')} <name...>     add components and their dependencies
    ${c.cyan('list')}              list what the registry offers
    ${c.cyan('doctor')}            check what is installed, change nothing
    ${c.cyan('spring')} [name]     draw the actual curve before you pick one

  ${c.bold('Options')}
    -y, --yes         accept defaults, skip prompts
    -o, --overwrite   replace files that already exist
    -r, --registry    registry URL or local path
    -c, --cwd         project directory
    -s, --silent      suppress output
        --spring <p>  install with a different default preset
                      ${c.grey('snap · bounce · settle · fling')}
        --stiffness   custom physics for spring (with --damping, --mass)
        --damping     ${c.grey('z-ui spring --stiffness 300 --damping 20 --mass 1')}
        --mass
        --dry-run     show the plan, write nothing
        --json        machine-readable output (list)
        --force       overwrite z-ui.json (init)
    -v, --version
    -h, --help

  ${c.bold('Examples')}
    ${c.grey('z-ui init')}
    ${c.grey('z-ui add like-button scrub')}
    ${c.grey('z-ui add like-button --spring settle')}
    ${c.grey('z-ui add undo-toast --dry-run')}
    ${c.grey('z-ui add scrub --registry ./registry')}
    ${c.grey('z-ui doctor')}
    ${c.grey('z-ui spring bounce')}
`

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: true,
    options: {
      yes: { type: 'boolean', short: 'y', default: false },
      overwrite: { type: 'boolean', short: 'o', default: false },
      registry: { type: 'string', short: 'r' },
      cwd: { type: 'string', short: 'c', default: process.cwd() },
      silent: { type: 'boolean', short: 's', default: false },
      spring: { type: 'string' },
      stiffness: { type: 'string' },
      damping: { type: 'string' },
      mass: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      version: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  setSilent(values.silent === true)

  if (values.version) return log.raw(VERSION)

  const [command, ...rest] = positionals
  if (!command || values.help) return log.line(HELP)

  const cwd = values.cwd as string

  switch (command) {
    case 'init':
      return init({
        cwd,
        yes: values.yes!,
        force: values.force!,
        registry: values.registry,
        version: VERSION,
      })
    case 'add':
      return add({
        version: VERSION,
        components: rest,
        cwd,
        registry: values.registry,
        yes: values.yes!,
        overwrite: values.overwrite!,
        dryRun: values['dry-run']!,
        spring: values.spring,
      })
    case 'doctor':
      return doctor({ version: VERSION, cwd, registry: values.registry })
    case 'spring':
      return spring({
        version: VERSION,
        name: rest[0],
        stiffness: toNumber(values.stiffness, 'stiffness'),
        damping: toNumber(values.damping, 'damping'),
        mass: toNumber(values.mass, 'mass'),
      })
    case 'list':
    case 'ls':
      return list({
        version: VERSION,
        registry: values.registry ?? (await registryFromConfig(cwd)),
        json: values.json!,
      })
    default:
      throw new UserError(`Unknown command: ${command}`, 'Run `z-ui --help`.')
  }
}

/** `undefined` stays `undefined` — `spring` distinguishes "not passed" from
 *  "passed and invalid" to decide whether it is drawing a preset or a custom
 *  transition. `Number('')` is `0`, not `NaN`, so an explicit empty check
 *  comes first. */
function toNumber(v: string | undefined, flag: string): number | undefined {
  if (v === undefined) return undefined
  const n = Number(v)
  if (v.trim() === '' || Number.isNaN(n)) {
    throw new UserError(`--${flag} must be a number, got "${v}".`)
  }
  return n
}

/** `list` should work before `init` has ever run, so a missing config falls
 *  back to the published registry rather than failing. */
async function registryFromConfig(cwd: string) {
  const { readConfig, DEFAULT_REGISTRY } = await import('./project/config.ts')
  try {
    return (await readConfig(cwd)).registry
  } catch {
    return DEFAULT_REGISTRY
  }
}

main().catch((error: unknown) => {
  // `process.exitCode`, never `process.exit()`. Exiting synchronously while
  // writes to stderr are still queued aborts the process on Windows — libuv
  // asserts on a closing handle — which replaces our exit code with 127 and
  // prints a crash after a perfectly good error message. Setting the code lets
  // the event loop drain and end on its own.
  if (error instanceof UserError) {
    log.error(error.message)
    if (error.hint) log.line(c.grey(`  ${error.hint}`))
    process.exitCode = 1
    return
  }
  // Anything reaching here is our bug, not the user's. Show the stack.
  log.error('Unexpected error. This is a bug in z-ui.')
  console.error(error)
  process.exitCode = 2
})
