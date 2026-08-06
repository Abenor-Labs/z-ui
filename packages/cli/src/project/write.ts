import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Config, AliasKey } from './config.ts'
import type { RegistryItem } from '../registry/fetch.ts'
import { retargetSpring, type Preset } from './spring.ts'

/**
 * The specifiers the registry authors against, paired with the config key that
 * replaces them. Sorted longest-first so `@/components/z-ui` is matched before
 * any shorter prefix that shares its head.
 */
const SOURCES = (
  [
    { key: 'components', from: '@/components/z-ui' },
    { key: 'hooks', from: '@/hooks' },
    { key: 'lib', from: '@/lib' },
  ] satisfies { key: AliasKey; from: string }[]
).sort((a, b) => b.from.length - a.from.length)

/**
 * Rewrite the registry's `@/` specifiers to the consumer's configured aliases.
 *
 * Deliberately a substitution over a closed set of known prefixes rather than an
 * AST pass. What a registry component may import is fixed — it is the three
 * alias kinds — so parsing the file to discover them would answer a question we
 * already know the answer to, and would drag a TypeScript parser into a CLI
 * that otherwise has no runtime dependencies at all.
 */
export function rewriteImports(content: string, config: Config): string {
  let out = content
  for (const { key, from } of SOURCES) {
    const to = config.aliases[key].import
    if (to === from) continue
    // Only inside a quoted specifier, so the same string in a comment or in
    // prose is left alone.
    out = out
      .replaceAll(`'${from}/`, `'${to}/`)
      .replaceAll(`"${from}/`, `"${to}/`)
      .replaceAll(`'${from}'`, `'${to}'`)
      .replaceAll(`"${from}"`, `"${to}"`)
  }
  return out
}

/** Map a registry file's `target` onto a real path under the project root. */
export function resolveTarget(target: string, config: Config): string {
  const t = target.replace(/^\/+/, '')
  for (const { key, from } of SOURCES) {
    const bare = from.slice(2) // "@/components/z-ui" → "components/z-ui"
    if (t === bare || t.startsWith(bare + '/')) {
      const rest = t.slice(bare.length).replace(/^\/+/, '')
      return path.join(config.aliases[key].path, rest)
    }
  }
  return t
}

export type PlannedFile = {
  item: string
  /** Relative to the project root, for display. */
  rel: string
  abs: string
  content: string
  exists: boolean
  /** The file exists and its bytes already match what we would write. */
  identical: boolean
  /** The default spring preset was rewritten on the way in. */
  retargeted: boolean
}

export type PlanOptions = {
  /** Rewrite the default preset in components the user named explicitly. */
  spring?: Preset
  /** Only these items get the spring rewrite — never their dependencies. */
  springScope?: Set<string>
}

export async function plan(
  items: RegistryItem[],
  config: Config,
  cwd: string,
  opts: PlanOptions = {},
): Promise<PlannedFile[]> {
  const out: PlannedFile[] = []
  for (const item of items) {
    for (const file of item.files) {
      const rel = resolveTarget(file.target ?? file.path, config)
      const abs = path.resolve(cwd, rel)

      let content = rewriteImports(file.content, config)

      // Scoped to what the user asked for. Retargeting a shared primitive would
      // restyle every component in the project, which is not what someone
      // passing --spring to one component is asking for.
      let retargeted = false
      const inScope =
        opts.spring && item.type === 'registry:component' && (!opts.springScope || opts.springScope.has(item.name))
      if (inScope) {
        const result = retargetSpring(content, opts.spring!)
        content = result.content
        retargeted = result.changed > 0
      }

      const exists = existsSync(abs)
      let identical = false
      if (exists) {
        try {
          identical = (await readFile(abs, 'utf8')) === content
        } catch {
          identical = false
        }
      }
      out.push({
        item: item.name,
        rel: rel.split(path.sep).join('/'),
        abs,
        content,
        exists,
        identical,
        retargeted,
      })
    }
  }
  return out
}

export async function commit(files: PlannedFile[]) {
  for (const f of files) {
    await mkdir(path.dirname(f.abs), { recursive: true })
    await writeFile(f.abs, f.content, 'utf8')
  }
}
