/**
 * The single producer.
 *
 * Reads registry/ and writes every derived artifact the site needs:
 *   public/r/<name>.json   the registry item the CLI fetches, source inlined
 *   __generated__/meta.js  plain data, no demo imports, safe for RSC
 *   __generated__/code.js  Shiki-highlighted HTML plus the byte-identical raw
 *
 * One script rather than two, because the moment code display and demo
 * metadata have separate producers they drift, and the drift lands on
 * meta.states, which is the field the state rail keys off.
 *
 * `--check` re-runs everything in memory and fails if the committed output
 * differs. That is the CI guard against a stale generated tree.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHighlighter } from 'shiki'
import { scanMotion } from '../../scripts/motion-scan.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const WEB = resolve(HERE, '..')
const REGISTRY = resolve(WEB, '..', 'registry')
const CHECK = process.argv.includes('--check')

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12)
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')

/**
 * The CLI version the site advertises, read rather than typed.
 *
 * Both component pages hard-coded a version badge beside the install command,
 * and both went stale: they read "0.1.1 pending" for a day after 0.1.1
 * published. That is the third time install copy outlived the condition it
 * described — `5f33a80`, `e315c4d`, and this badge — and the cause was the same
 * every time: a fact about the package, typed into a page with no way to notice
 * it changed.
 *
 * Reading `packages/cli/package.json` closes it, and `registry:check` is the
 * gate: bump the CLI and the generated output drifts until someone reruns
 * `pnpm registry`, which CI already fails on.
 *
 * It is a claim about the version, not about npm. Nothing on a static page can
 * prove a publish happened, so the badge no longer tries to.
 */
const CLI_VERSION = JSON.parse(read(resolve(WEB, '..', 'packages', 'cli', 'package.json'))).version

/** Destination inside a consumer project, by item type. */
const TARGET = {
  'registry:component': (f) => `components/z-ui/${f}`,
  'registry:hook': (f) => `hooks/${f}`,
  'registry:lib': (f) => `lib/${f}`,
  // A stylesheet lands beside the component it dresses, not in a css/ silo:
  // the consumer imports it from the component file by a relative path.
  'registry:style': (f) => `components/z-ui/${f}`,
}

function collect() {
  const index = JSON.parse(read(join(REGISTRY, 'registry.json')))
  const items = index.items.map((entry) => {
    const dir = join(REGISTRY, entry.path)
    const manifest = JSON.parse(read(join(dir, 'component.json')))
    const files = manifest.files.map((f) => {
      const raw = read(join(dir, f.path))
      return {
        path: f.path,
        type: f.type,
        target: f.target ?? TARGET[f.type](f.path),
        content: raw,
        sha: sha(raw),
      }
    })
    // Scanned from the file that is the component itself, not from a hook or a
    // lib shipped beside it.
    const primary = files.find((f) => f.type === 'registry:component') ?? files[0]
    const motion = manifest.type === 'registry:component' ? scanMotion(primary.content) : null

    return {
      name: manifest.name,
      type: manifest.type,
      title: manifest.title,
      description: manifest.description,
      category: manifest.meta?.category ?? entry.category ?? null,
      gesture: manifest.meta?.gesture ?? null,
      states: manifest.meta?.states ?? null,
      // Derived. An authored value is rejected by lint-registry.
      spring: motion?.springs.find((s) => s.preset)?.preset ?? null,
      motion,
      dependencies: manifest.dependencies ?? [],
      registryDependencies: manifest.registryDependencies ?? [],
      dir: entry.path,
      files,
    }
  })
  return { index, items }
}

/** Resolve registryDependencies transitively, deduped, dependencies before dependents. */
function resolveDeps(item, byName, seen = new Set()) {
  const out = []
  for (const dep of item.registryDependencies) {
    if (seen.has(dep)) continue
    seen.add(dep)
    const d = byName[dep]
    if (!d) throw new Error(`${item.name} depends on unknown item "${dep}"`)
    out.push(...resolveDeps(d, byName, seen), d)
  }
  return out
}

const outputs = new Map()
const emit = (rel, body) => outputs.set(rel, body)

const { index, items } = collect()
const byName = Object.fromEntries(items.map((i) => [i.name, i]))

// ---- public/r/<name>.json : what the CLI fetches -------------------------
for (const item of items) {
  emit(
    `public/r/${item.name}.json`,
    JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name: item.name,
        type: item.type,
        title: item.title,
        description: item.description,
        dependencies: item.dependencies,
        registryDependencies: item.registryDependencies,
        files: item.files.map((f) => ({
          path: f.path,
          type: f.type,
          target: f.target,
          content: f.content,
        })),
        // Everything Z-UI-specific nests under `meta`, which shadcn ignores
        // (ADR 0002). `digests` is what lets our CLI verify that the bytes it
        // received are the bytes this generator hashed, rather than trusting
        // the transport — the same claim the site makes on every source panel.
        meta: {
          category: item.category,
          gesture: item.gesture,
          states: item.states,
          spring: item.spring,
          motion: item.motion,
          digests: Object.fromEntries(item.files.map((f) => [f.path, f.sha])),
        },
      },
      null,
      2,
    ) + '\n',
  )
}

emit(
  'public/r/index.json',
  JSON.stringify(
    {
      name: index.name,
      version: index.version,
      homepage: index.homepage,
      // Enriched so `z-ui list` can print a useful table from one request
      // rather than fetching every item to learn its spring.
      items: index.items.map((i) => {
        const full = byName[i.name]
        return full
          ? { ...i, title: full.title, description: full.description, spring: full.spring, states: full.states }
          : i
      }),
    },
    null,
    2,
  ) + '\n',
)

// ---- __generated__/meta.js : plain data, no demo modules ----------------
const meta = items.map((item) => ({
  name: item.name,
  type: item.type,
  title: item.title,
  description: item.description,
  category: item.category,
  gesture: item.gesture,
  states: item.states,
  spring: item.spring,
  motion: item.motion,
  dependencies: item.dependencies,
  // Flattened so a page can list every file it will write without walking.
  installs: [...resolveDeps(item, byName), item].map((i) => ({
    name: i.name,
    files: i.files.map((f) => ({ key: `${i.name}/${f.path}`, target: f.target, sha: f.sha })),
  })),
}))

emit(
  '__generated__/meta.js',
  `// GENERATED by scripts/build-registry.mjs. Do not edit.\n` +
    `export const items = ${JSON.stringify(meta, null, 2)}\n` +
    `export const byName = Object.fromEntries(items.map((i) => [i.name, i]))\n` +
    `export const components = items.filter((i) => i.type === 'registry:component')\n` +
    `export const cliVersion = ${JSON.stringify(CLI_VERSION)}\n`,
)

// The generator owns the types too. Without this, TypeScript infers the shape
// from the JSON literal and unions `states: string[]` with `states: null`,
// because lib and hook items have no states.
emit(
  '__generated__/meta.d.ts',
  `// GENERATED by scripts/build-registry.mjs. Do not edit.
export type ZFile = { key: string; target: string; sha: string }
export type ZInstall = { name: string; files: ZFile[] }
export type ZItemType = 'registry:component' | 'registry:hook' | 'registry:lib'
/** The input that drives the component's signature motion. */
export type ZGesture = 'press' | 'drag' | 'hold' | 'hover' | 'type'

export type ZPreset = 'snap' | 'bounce' | 'settle' | 'fling'

export type ZSpring = {
  name: string
  stiffness: number
  damping: number
  mass: number
  restDelta: number | null
  restSpeed: number | null
  /** The published preset these numbers match exactly, or null when bespoke. */
  preset: ZPreset | null
}
export type ZDuration = { name: string; ms: number }

/** Scanned out of the component source by scripts/motion-scan.mjs at build
 *  time. Never authored — lint-registry rejects a hand-written copy. */
export type ZMotion = {
  states: string[] | null
  springs: ZSpring[]
  durations: ZDuration[]
  reducedMotion: 'branch' | null
}

export type ZItem = {
  name: string
  type: ZItemType
  title: string
  description: string
  category: string | null
  gesture: ZGesture | null
  states: string[] | null
  spring: ZPreset | null
  motion: ZMotion | null
  dependencies: string[]
  installs: ZInstall[]
}

/**
 * Components always declare a category, a gesture and states, and always carry
 * scanned motion data. The spring field stays nullable: it names the preset the
 * component's own numbers match exactly, and a component that tuned its own
 * physics matches none.
 */
export type ZComponent = ZItem & {
  type: 'registry:component'
  category: string
  gesture: ZGesture
  states: string[]
  motion: ZMotion
}

export declare const items: ZItem[]
export declare const byName: Record<string, ZItem | undefined>
export declare const components: ZComponent[]
/** Read from packages/cli/package.json at build time, never typed into a page. */
export declare const cliVersion: string
`,
)

// ---- __generated__/code.js : highlighted + byte-identical raw ------------
const highlighter = await createHighlighter({
  themes: ['vesper'],
  langs: ['tsx', 'ts', 'json', 'bash'],
})

const code = {}
for (const item of items) {
  for (const f of item.files) {
    code[`${item.name}/${f.path}`] = {
      html: highlighter.codeToHtml(f.content, {
        lang: f.path.endsWith('.json') ? 'json' : f.path.endsWith('.tsx') ? 'tsx' : 'ts',
        theme: 'vesper',
      }),
      raw: f.content,
      lines: f.content.split('\n').length,
      sha: f.sha,
      target: f.target,
    }
  }
}

emit(
  '__generated__/code.js',
  `// GENERATED by scripts/build-registry.mjs. Do not edit.\n` +
    `export const code = ${JSON.stringify(code, null, 2)}\n`,
)

emit(
  '__generated__/code.d.ts',
  `// GENERATED by scripts/build-registry.mjs. Do not edit.
export type ZCode = {
  /** Shiki output, already highlighted at build time. */
  html: string
  /** Byte-identical to the file on disk and to files[].content in /r/. */
  raw: string
  lines: number
  sha: string
  /** Where the CLI writes this file inside a consumer project. */
  target: string
}

/** Keyed \`<item>/<file>\`, e.g. \`like-button/like-button.tsx\`. */
export declare const code: Record<string, ZCode | undefined>
`,
)

// ---- write or check ------------------------------------------------------
let drift = 0
for (const [rel, body] of outputs) {
  const abs = join(WEB, rel)
  if (CHECK) {
    const current = existsSync(abs) ? read(abs) : null
    if (current !== body.replace(/\r\n/g, '\n')) {
      console.error(`drift: ${rel}`)
      drift++
    }
  } else {
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, body)
  }
}

if (CHECK) {
  if (drift) {
    console.error(`\n${drift} generated file(s) out of date. Run: pnpm registry`)
    process.exit(1)
  }
  console.log(`registry check clean (${outputs.size} files)`)
} else {
  console.log(
    `registry built: ${items.length} items, ${outputs.size} files, ` +
      `${meta.filter((m) => m.type === 'registry:component').length} component(s)`,
  )
}
