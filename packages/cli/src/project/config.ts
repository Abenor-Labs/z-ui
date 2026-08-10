import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { UserError } from '../ui/log.ts'

export const CONFIG_FILE = 'z-ui.json'

/**
 * The generator's output directory, not the source tree.
 *
 * `web/scripts/build-registry.mjs` writes the published manifests to
 * `web/public/r/`, and a remote read appends `r/index.json` or `r/<name>.json`
 * to this base — so the base has to stop one level above that folder. Pointed
 * at `main/registry` this resolved to `main/registry/r/index.json`, which has
 * never existed: `registry/` is where components are authored and no `.json`
 * manifest is ever written into it.
 *
 * That was invisible for as long as every path 404'd for the same reason
 * (nothing was on `main`). The merge on 2026-08-10 made `main` real and left
 * exactly one URL still wrong, which is the same drift `5f33a80` fixed across
 * three site call sites and did not reach into here.
 *
 * `web/lib/registry.ts` holds the site's copy of this constant. They are two
 * packages that cannot import from each other; if one moves, move both.
 */
export const DEFAULT_REGISTRY =
  'https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public'

/**
 * Shape is fixed by registry/schema/config.schema.json, which is committed and
 * authoritative. Do not drift from it: the schema is what validates the file in
 * a consumer's editor, and the two disagreeing is worse than either being wrong.
 */
export type Alias = {
  /** Import specifier prefix, e.g. "@/components/z-ui". */
  import: string
  /** Directory on disk relative to the project root. */
  path: string
}

export type Config = {
  $schema?: string
  registry: string
  tsx: boolean
  aliases: {
    components: Alias
    hooks: Alias
    lib: Alias
  }
}

export const ALIAS_KEYS = ['components', 'hooks', 'lib'] as const
export type AliasKey = (typeof ALIAS_KEYS)[number]

/**
 * Storing the import specifier and the disk path as two explicit fields is what
 * keeps tsconfig resolution out of the CLI entirely — ADR 0002 identifies that
 * as the single largest cost of a first-party CLI. `init` guesses both once and
 * asks for confirmation; `add` contains no `baseUrl` handling.
 */
export const DEFAULT_CONFIG: Config = {
  $schema:
    'https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry/schema/config.schema.json',
  registry: DEFAULT_REGISTRY,
  tsx: true,
  aliases: {
    components: { import: '@/components/z-ui', path: 'components/z-ui' },
    hooks: { import: '@/hooks', path: 'hooks' },
    lib: { import: '@/lib', path: 'lib' },
  },
}

export const configPath = (cwd: string) => path.join(cwd, CONFIG_FILE)
export const configExists = (cwd: string) => existsSync(configPath(cwd))

function fail(reason: string): never {
  throw new UserError(`${CONFIG_FILE} is not valid: ${reason}`, 'Delete it and run `z-ui init`.')
}

/** Validated by hand. Three fields deep, and a validator dependency would cost
 *  more in `npx` start-up latency than it saves here. */
export function validate(raw: unknown): Config {
  if (typeof raw !== 'object' || raw === null) fail('expected an object')
  const o = raw as Record<string, unknown>

  if (typeof o.registry !== 'string' || !o.registry) fail('`registry` must be a non-empty string')
  if (typeof o.aliases !== 'object' || o.aliases === null) fail('`aliases` must be an object')

  const aliases = o.aliases as Record<string, unknown>
  for (const k of ALIAS_KEYS) {
    const e = aliases[k]
    if (typeof e !== 'object' || e === null) fail(`\`aliases.${k}\` is missing`)
    const entry = e as Record<string, unknown>
    if (typeof entry.import !== 'string' || !entry.import) {
      fail(`\`aliases.${k}.import\` must be a non-empty string`)
    }
    if (typeof entry.path !== 'string' || !entry.path) {
      fail(`\`aliases.${k}.path\` must be a non-empty string`)
    }
  }

  return {
    $schema: typeof o.$schema === 'string' ? o.$schema : undefined,
    registry: o.registry,
    tsx: o.tsx !== false,
    aliases: {
      components: aliases.components as Alias,
      hooks: aliases.hooks as Alias,
      lib: aliases.lib as Alias,
    },
  }
}

export async function readConfig(cwd: string): Promise<Config> {
  const file = configPath(cwd)
  if (!existsSync(file)) {
    throw new UserError(`No ${CONFIG_FILE} in ${cwd}`, 'Run `z-ui init` to create one.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(file, 'utf8'))
  } catch {
    fail('it is not parseable JSON')
  }
  return validate(parsed)
}

export async function writeConfig(cwd: string, config: Config) {
  await writeFile(configPath(cwd), JSON.stringify(config, null, 2) + '\n', 'utf8')
}

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
