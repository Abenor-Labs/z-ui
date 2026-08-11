import { existsSync } from 'node:fs'
import path from 'node:path'
import { configExists, writeConfig, guessConfig, type Config } from '../project/config.ts'
import { detectPackageManager } from '../project/deps.ts'
import { ask } from '../ui/prompt.ts'
import { toggle } from '../ui/select.ts'
import { isInteractive } from '../ui/tty.ts'
import { intro, detail, outro } from '../ui/art.ts'
import { log, c, UserError } from '../ui/log.ts'

export type Detected = {
  framework: string
  srcDir: boolean
  tsx: boolean
  pm: string
}

/**
 * Look before asking. Every question this command does not have to ask is one
 * the reader does not have to have an opinion about.
 */
export function detect(cwd: string): Detected {
  const has = (f: string) => existsSync(path.join(cwd, f))
  const srcDir = has('src')
  const tsx = has('tsconfig.json')

  let framework = 'React'
  if (has('next.config.ts') || has('next.config.js') || has('next.config.mjs')) framework = 'Next.js'
  else if (has('vite.config.ts') || has('vite.config.js')) framework = 'Vite'
  else if (has('remix.config.js') || has('react-router.config.ts')) framework = 'React Router'
  else if (has('astro.config.mjs')) framework = 'Astro'

  return { framework, srcDir, tsx, pm: detectPackageManager(cwd) }
}

/**
 * Guess, show the guess, then let it be corrected.
 *
 * `init` writes one file and nothing else — it does not touch tsconfig,
 * tailwind, or package.json, because none of them need to change for a
 * component to work.
 */
export async function init(opts: {
  cwd: string
  yes: boolean
  force: boolean
  registry?: string
  version: string
}) {
  if (configExists(opts.cwd) && !opts.force) {
    throw new UserError(`z-ui.json already exists in ${opts.cwd}`, 'Pass --force to overwrite it.')
  }

  const d = detect(opts.cwd)
  const guess = guessConfig(d, opts.registry)

  intro(opts.version, 'micro-interactions as source you own')

  detail('Detected', [
    `${c.grey('framework')}  ${d.framework}`,
    `${c.grey('language')}   ${d.tsx ? 'TypeScript' : 'JavaScript'}`,
    `${c.grey('layout')}     ${d.srcDir ? 'src/ directory' : 'project root'}`,
    `${c.grey('packages')}   ${d.pm}`,
  ])

  const config =
    opts.yes || !isInteractive() ? guess : (await confirmPaths(guess)) ?? guess

  await writeConfig(opts.cwd, config)

  detail('Wrote z-ui.json', [
    `${c.green('components')}  ${config.aliases.components.path}/  ${c.grey('→')}  ${c.cyan(config.aliases.components.import)}`,
    `${c.green('hooks')}       ${config.aliases.hooks.path}/  ${c.grey('→')}  ${c.cyan(config.aliases.hooks.import)}`,
    `${c.green('lib')}         ${config.aliases.lib.path}/  ${c.grey('→')}  ${c.cyan(config.aliases.lib.import)}`,
  ])

  outro(`${c.cyan('z-ui add')}  ${c.grey('to pick components, or')}  ${c.cyan('z-ui list')}  ${c.grey('to see them all')}`)
}

async function confirmPaths(guess: Config): Promise<Config | null> {
  const ok = await toggle('Use these locations?', true)
  if (ok) return guess

  log.line(c.grey('  Two values per location: where files land, and what imports say.'))
  log.line()

  return {
    ...guess,
    aliases: {
      components: {
        path: await ask('Components directory?', guess.aliases.components.path),
        import: await ask('Components import alias?', guess.aliases.components.import),
      },
      hooks: {
        path: await ask('Hooks directory?', guess.aliases.hooks.path),
        import: await ask('Hooks import alias?', guess.aliases.hooks.import),
      },
      lib: {
        path: await ask('Lib directory?', guess.aliases.lib.path),
        import: await ask('Lib import alias?', guess.aliases.lib.import),
      },
    },
  }
}
