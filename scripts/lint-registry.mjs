/**
 * Registry lint.
 *
 * Encodes the file contract and the design laws as CI, which is the difference
 * between principles written in a document and principles that hold. Most of
 * these exist because something already went wrong:
 *
 *   - `data-state` once declared four states and emitted two, silently. A
 *     consumer's `[data-state="pressing"]` matched nothing and a typecheck
 *     could not see it. Hence the three-way STATES check.
 *   - `like-button` could not import a heart from lucide-react, because a
 *     registry component cannot assume a consumer has any icon library.
 *   - path entries in the two tsconfigs have to be added by hand for every new
 *     item, and a missing one fails confusingly far from the cause.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// ajv's default export only knows draft-07; the schemas declare 2020-12.
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = join(ROOT, 'registry')
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const json = (p) => JSON.parse(read(p))

const failures = []
const fail = (where, msg) => failures.push({ where, msg })
let checks = 0
const check = (ok, where, msg) => {
  checks++
  if (!ok) fail(where, msg)
  return ok
}

const ALLOWED_IMPORTS = new Set([
  'react',
  'motion/react',
  'clsx',
  'tailwind-merge',
  '@/lib/z-spring',
  '@/lib/z-cn',
  '@/hooks/use-controllable-state',
])

const ICON_PACKAGES = /^(lucide-react|react-icons|@heroicons|@radix-ui\/react-icons|@tabler\/icons)/

// ---- schemas -------------------------------------------------------------
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validateIndex = ajv.compile(json(join(REGISTRY, 'schema', 'registry.schema.json')))
const validateItem = ajv.compile(json(join(REGISTRY, 'schema', 'registry-item.schema.json')))

const index = json(join(REGISTRY, 'registry.json'))
check(validateIndex(index), 'registry.json', ajv.errorsText(validateIndex.errors))

const names = new Set(index.items.map((i) => i.name))

// ---- per item ------------------------------------------------------------
for (const entry of index.items) {
  const dir = join(REGISTRY, entry.path)
  const where = entry.name

  if (!check(existsSync(dir), where, `directory missing: ${entry.path}`)) continue

  const manifestPath = join(dir, 'component.json')
  if (!check(existsSync(manifestPath), where, 'component.json missing')) continue

  const manifest = json(manifestPath)
  check(validateItem(manifest), where, ajv.errorsText(validateItem.errors))
  check(manifest.name === entry.name, where, `manifest name "${manifest.name}" != index name`)
  check(manifest.type === entry.type, where, `manifest type "${manifest.type}" != index type`)

  // files[] exists on disk, and nothing shippable is left out of it
  const listed = (manifest.files ?? []).map((f) => f.path)
  for (const f of listed) {
    check(existsSync(join(dir, f)), where, `files[] lists "${f}" but it is not on disk`)
  }
  const onDisk = readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !f.includes('.demo.'))
  for (const f of onDisk) {
    check(listed.includes(f), where, `"${f}" is on disk but missing from files[] and will never ship`)
  }
  check(
    !listed.some((f) => f.includes('.demo.')),
    where,
    'demo files must not appear in files[]',
  )

  // registryDependencies resolve
  for (const dep of manifest.registryDependencies ?? []) {
    check(names.has(dep), where, `registryDependencies references unknown item "${dep}"`)
  }

  // tsconfig path entries, both workspaces
  const importSpecifier =
    manifest.type === 'registry:component'
      ? `@/components/z-ui/${manifest.name}`
      : manifest.type === 'registry:hook'
        ? `@/hooks/${manifest.name}`
        : `@/lib/${manifest.name}`
  for (const tsconfig of ['registry/tsconfig.json', 'web/tsconfig.json']) {
    const raw = read(join(ROOT, tsconfig))
    check(
      raw.includes(`"${importSpecifier}"`),
      where,
      `${tsconfig} has no paths entry for "${importSpecifier}"`,
    )
  }

  // ---- source checks ----------------------------------------------------
  for (const f of listed) {
    const src = read(join(dir, f))
    const at = `${where}/${f}`

    const imports = [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1])
    const usesMotion = imports.includes('motion/react')
    for (const imp of imports) {
      check(ALLOWED_IMPORTS.has(imp), at, `import "${imp}" is outside the allowlist`)
      check(
        !ICON_PACKAGES.test(imp),
        at,
        `imports icon package "${imp}"; icons must be inline SVG, since a consumer may have no icon library`,
      )
    }

    if (manifest.type !== 'registry:component') continue

    check(src.startsWith("'use client'"), at, "'use client' must be the first line")
    check(!/export default/.test(src), at, 'no default export; components are named exports')
    /**
     * Scoped twice, for two different reasons.
     *
     * First to files that import motion at all: a file with no motion elements
     * passes "every motion element needs initial={false}" vacuously, and
     * asserting it unconditionally forces a `motion.*` node onto components
     * whose movement has nothing to interpolate (scramble-reveal walks a
     * boundary along a string one tick at a time).
     *
     * Then to files that declare motion *targets* — an `animate` or `variants`
     * prop. `initial={false}` suppresses the enter animation from a declared
     * target, so a component with no declared target has no enter animation to
     * suppress and the prop would be a no-op added to satisfy a linter, which
     * is the same class of lie the scoping above exists to avoid. Disclosure is
     * the case: its motion elements carry a MotionValue in `style` and nothing
     * else, so `initial` has nothing to act on.
     */
    // Comments stripped first. Disclosure's header names `animate={{ height }}`
    // as the implementation it rejects, and a file explaining why it does not
    // declare a motion target must not be read as declaring one.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
    const declaresTargets = /\banimate=|\bvariants=/.test(code)
    if (usesMotion && declaresTargets) {
      check(/initial=\{false\}/.test(src), at, 'every motion element needs initial={false}')
    }
    check(/data-state=/.test(src), at, 'interactive root must carry data-state')
    check(/aria-/.test(src), at, 'interactive root must carry an aria attribute')
    // A cubic-bezier overshoots when either control point's y falls outside
    // [0, 1]. y is the 2nd and 4th parameter; the x values are clamped by CSS
    // and carry no overshoot, so checking the last parameter alone misses
    // `cubic-bezier(0.34, 1.56, 0.64, 1)`, the canonical fake bounce.
    for (const m of src.matchAll(/cubic-bezier\(([^)]+)\)/g)) {
      const [, y1, , y2] = m[1].split(',').map((n) => Number(n.trim()))
      check(
        [y1, y2].every((y) => Number.isFinite(y) && y >= 0 && y <= 1),
        at,
        `cubic-bezier(${m[1].trim()}) overshoots, imitating a spring; use a real spring preset`,
      )
    }
    check(
      !/whileHover=|whileTap=/.test(src),
      at,
      'whileHover/whileTap layer a variant that cannot see the rest of the state, which desynchronises data-state; derive one state and drive animate with it',
    )

    // The three-way check. STATES in source, meta.states in the manifest, and
    // the keys of every variants object must all agree. This is the invariant
    // that data-state actually reports what the manifest promises.
    const statesMatch = src.match(/const STATES = \[([\s\S]*?)\] as const/)
    if (check(statesMatch, at, 'component must declare `const STATES = [...] as const`')) {
      const declared = [...statesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
      check(
        JSON.stringify(declared) === JSON.stringify(manifest.meta.states),
        at,
        `STATES ${JSON.stringify(declared)} != meta.states ${JSON.stringify(manifest.meta.states)}`,
      )

      let variantObjects = 0
      for (const m of src.matchAll(/const (\w*[Vv]ariants) = \{([\s\S]*?)\n\} satisfies/g)) {
        variantObjects++
        const keys = [...m[2].matchAll(/^ {2}'([^']+)':/gm)].map((k) => k[1])
        check(
          JSON.stringify(keys) === JSON.stringify(declared),
          at,
          `${m[1]} keys ${JSON.stringify(keys)} != STATES ${JSON.stringify(declared)}`,
        )
      }
      /**
       * A variants object is the thing that maps a state onto a motion target,
       * so a file owes one exactly when it declares targets — same condition as
       * `initial={false}` above, and for the same reason.
       *
       * The rule this enforces is "a motion component's states must be mapped
       * onto motion somewhere the linter can see". There are two ways to do
       * that, not one. Variants is the declarative way and gets checked here
       * key-for-key. The other is a MotionValue the component integrates
       * directly — disclosure springs a height and derives both `data-state`
       * and its chevron from it, so there is no per-state target list, and
       * therefore nothing for a key-drift check to drift against. Requiring
       * variants of it would mean writing a target table the component does not
       * read.
       *
       * What survives in both cases is the check that matters: STATES in the
       * source equals meta.states in the manifest. That is the invariant that
       * makes `data-state` mean what the catalogue promises, and it is asserted
       * unconditionally above.
       */
      if (usesMotion && declaresTargets) {
        check(variantObjects > 0, at, 'no variants object found; expected `const xVariants = {...} satisfies`')
      }
      if (usesMotion && !declaresTargets) {
        check(
          /useMotionValue|useSpring|useTransform/.test(src),
          at,
          'imports motion but declares neither a variants/animate target nor a MotionValue; its states drive nothing',
        )
      }
    }
  }
}

// ---- report --------------------------------------------------------------
if (failures.length) {
  console.error(`\nregistry lint: ${failures.length} failure(s) across ${checks} checks\n`)
  for (const f of failures) console.error(`  ${f.where}: ${f.msg}`)
  console.error('')
  process.exit(1)
}
console.log(`registry lint clean: ${checks} checks across ${index.items.length} items`)
