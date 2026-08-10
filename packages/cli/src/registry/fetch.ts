import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { UserError } from '../ui/log.ts'

export type RegistryFile = {
  path: string
  type: string
  target?: string
  content: string
}

export type MotionSpring = {
  name: string
  stiffness: number
  damping: number
  mass: number
  restDelta: number | null
  restSpeed: number | null
  /** The published preset these numbers match exactly, or null when bespoke. */
  preset: 'snap' | 'bounce' | 'settle' | 'fling' | null
}

/** Scanned out of the component source by scripts/motion-scan.mjs at build
 *  time, so nothing here is parsed on a consumer's machine. */
export type MotionScan = {
  states?: string[] | null
  springs: MotionSpring[]
  durations: { name: string; ms: number }[]
  reducedMotion: 'branch' | null
}

export type RegistryItem = {
  name: string
  type: string
  title: string
  description: string
  dependencies: string[]
  registryDependencies: string[]
  files: RegistryFile[]
  meta: {
    category?: string
    gesture?: string
    states?: string[]
    /** Derived, so null for a component that tunes its own physics. */
    spring?: string | null
    motion?: MotionScan
    /** file path → sha256 prefix, written by the generator. */
    digests?: Record<string, string>
  }
}

export type IndexEntry = {
  name: string
  type: string
  category?: string
  title?: string
  description?: string
  spring?: string
  states?: string[]
}

export type RegistryIndex = {
  name: string
  version: string
  homepage?: string
  items: IndexEntry[]
}

export const isUrl = (s: string) => /^https?:\/\//i.test(s)

/**
 * One code path for both transports.
 *
 * ADR 0003 makes the registry base a single config string that accepts a
 * filesystem path as well as a URL. That is what lets a contributor test an
 * uncommitted component with `--registry ./registry`, and what lets this
 * package's own test suite run with no network at all.
 */
export class Registry {
  // An explicit field, not a parameter property: those emit code rather than
  // erase, so Node's type-stripping loader rejects them. Keeping the source
  // strip-compatible is what lets `node src/index.ts` run with no build step.
  readonly base: string

  constructor(base: string) {
    this.base = base
  }

  get isLocal() {
    return !isUrl(this.base)
  }

  /**
   * A local base can be either of two layouts, and they are not interchangeable.
   *
   * `./registry` is the authoring tree: `registry.json` plus a directory per
   * component. `./web/public` is the generator's output: `r/index.json` plus a
   * manifest per component with source inlined and motion data derived.
   *
   * Only the built layout carries `meta.motion`, because that field is scanned
   * at build time by design. Without this distinction `--registry ./web/public`
   * looked for a `registry.json` that is never written there, and `preview`
   * could not be run against a local build at all — it needed a web server to
   * read files sitting on the same disk.
   */
  private get isBuilt() {
    return this.isLocal && existsSync(path.resolve(this.base, 'r', 'index.json'))
  }

  describe() {
    return this.isLocal ? path.resolve(this.base) : this.base
  }

  private async read(rel: string): Promise<string> {
    if (this.isLocal) {
      // A local registry is the source tree, which has no built `r/` folder.
      const file = path.resolve(this.base, rel)
      try {
        return await readFile(file, 'utf8')
      } catch {
        throw new UserError(`Not found in local registry: ${file}`)
      }
    }

    const url = `${this.base.replace(/\/+$/, '')}/${rel}`
    let res: Response
    try {
      res = await fetch(url)
    } catch (e) {
      throw new UserError(
        `Could not reach the registry at ${url}`,
        'Check your connection, or pass --registry ./registry to read from disk.',
      )
    }
    if (res.status === 403 || res.status === 429) {
      // A documented limit of ADR 0003, not something the user did wrong.
      throw new UserError(
        `The registry rate-limited this request (HTTP ${res.status}).`,
        'Unauthenticated raw.githubusercontent.com allows ~60 requests an hour per IP. Wait, or use --registry ./registry against a clone.',
      )
    }
    if (res.status === 404) {
      // A bare "HTTP 404" reads as "you typed the name wrong" and sends people
      // looking in the wrong place. Both real causes are worth naming: the
      // component may not exist, or the base may be pointing at the source tree
      // rather than the generator's output — which is the mistake this CLI's
      // own default shipped with in 0.1.0.
      throw new UserError(
        `Registry returned HTTP 404 for ${url}`,
        'Either no component by that name is published, or the registry base is wrong — it must point one level above the generated `r/` folder. `z-ui list` shows what is actually there.',
      )
    }
    if (!res.ok) throw new UserError(`Registry returned HTTP ${res.status} for ${url}`)
    return res.text()
  }

  async index(): Promise<RegistryIndex> {
    const authoring = this.isLocal && !this.isBuilt
    const raw = await this.read(authoring ? 'registry.json' : 'r/index.json')
    const parsed = JSON.parse(raw) as RegistryIndex
    if (!Array.isArray(parsed.items)) throw new UserError('Registry index has no `items` array.')
    // The generator enriches the published index with title, spring and states.
    // The authoring `registry.json` has none of that, so a source-tree read
    // fills it in from each component.json — otherwise `list` would print a
    // worse table for contributors than for everyone else.
    if (authoring) await this.enrich(parsed)
    return parsed
  }

  private async enrich(index: RegistryIndex) {
    await Promise.all(
      (index.items as (IndexEntry & { path?: string })[]).map(async (entry) => {
        if (!entry.path) return
        try {
          const raw = await readFile(
            path.resolve(this.base, entry.path, 'component.json'),
            'utf8',
          )
          const meta = JSON.parse(raw) as {
            title?: string
            description?: string
            meta?: { spring?: string; states?: string[] }
          }
          entry.title = meta.title
          entry.description = meta.description
          entry.spring = meta.meta?.spring
          entry.states = meta.meta?.states
        } catch {
          // A component that cannot be read is still listed, just bare.
        }
      }),
    )
  }

  async item(name: string): Promise<RegistryItem> {
    if (this.isLocal && !this.isBuilt) return this.localItem(name)
    const raw = await this.read(`r/${name}.json`)
    return JSON.parse(raw) as RegistryItem
  }

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

  /**
   * A local registry is the authoring layout, so the item has to be assembled
   * from `component.json` plus the files beside it. Reading the source rather
   * than a build artefact is the point: it is what makes `--registry ./registry`
   * able to test a component that has not been generated yet.
   */
  private async localItem(name: string): Promise<RegistryItem> {
    const index = await this.index()
    const entry = (index.items as (IndexEntry & { path?: string })[]).find((i) => i.name === name)
    if (!entry?.path) throw new UserError(`No component named “${name}” in the local registry.`)

    const dir = path.resolve(this.base, entry.path)
    const meta = JSON.parse(await readFile(path.join(dir, 'component.json'), 'utf8')) as {
      name: string
      type: string
      title: string
      description: string
      dependencies?: string[]
      registryDependencies?: string[]
      files: { path: string; type: string; target?: string }[]
      meta?: RegistryItem['meta']
    }

    const files: RegistryFile[] = []
    for (const f of meta.files) {
      files.push({
        path: f.path,
        type: f.type,
        target: f.target ?? defaultTarget(f.path, f.type),
        content: await readFile(path.join(dir, f.path), 'utf8'),
      })
    }

    return {
      name: meta.name,
      type: meta.type,
      title: meta.title,
      description: meta.description,
      dependencies: meta.dependencies ?? [],
      registryDependencies: meta.registryDependencies ?? [],
      files,
      // No digests from a local read. Verification against a hash computed from
      // the same bytes we just read would prove nothing.
      meta: { ...(meta.meta ?? {}), digests: undefined },
    }
  }
}

function defaultTarget(file: string, type: string) {
  if (type === 'registry:hook') return `hooks/${file}`
  if (type === 'registry:lib') return `lib/${file}`
  return `components/z-ui/${file}`
}
