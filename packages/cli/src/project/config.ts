import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { UserError } from '../ui/log.ts'

export const CONFIG_FILE = 'z-ui.json'

export const DEFAULT_REGISTRY =
  'https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry'

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
