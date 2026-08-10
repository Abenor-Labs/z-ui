/**
 * The one thing that reads motion out of a component.
 *
 * Imported by `web/scripts/build-registry.mjs`, which emits what it finds into
 * `meta.motion`, and by `scripts/lint-registry.mjs`, which re-runs it and gates
 * on agreement. One module rather than two readers, because the entire reason
 * this exists is that hand-authored motion metadata drifted from the source it
 * described — four times, silently. A second reader would be a fifth way to
 * drift.
 *
 * Regexes rather than an AST. TypeScript 7 is the native port and exports no
 * `createSourceFile` from the npm package, and a parser dependency would be a
 * differently-shaped source reader sitting next to the one lint already uses.
 * What makes this safe is not the technique, it is that every caller treats an
 * unreadable component as a build failure. This never returns a plausible
 * guess; it returns null and something upstream stops.
 *
 * No I/O and no dependencies, so it is trivially testable and safe to import
 * from either workspace.
 */

/** The published spring scale. `packages/cli/src/ui/spring-constants.ts` mirrors
 *  this, and a CLI test asserts the two agree. */
export const PRESETS = {
  snap: { stiffness: 500, damping: 40, mass: 1 },
  bounce: { stiffness: 400, damping: 14, mass: 1 },
  settle: { stiffness: 260, damping: 24, mass: 1 },
  fling: { stiffness: 300, damping: 30, mass: 1 },
}

/**
 * Exact equality, not a tolerance.
 *
 * disclosure runs 520/46 against snap's 500/40 and the difference is the whole
 * argument of its tuning comment. A fuzzy match would label it `snap`, which is
 * exactly the false claim its manifest has been making.
 */
export function presetFor({ stiffness, damping, mass }) {
  for (const [name, p] of Object.entries(PRESETS)) {
    if (p.stiffness === stiffness && p.damping === damping && p.mass === mass) return name
  }
  return null
}

/** Block and line comments removed. disclosure's header names the implementations
 *  it rejects; a file explaining what it does not do must not be read as doing it. */
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
}

/**
 * The STATES tuple.
 *
 * Reads the raw source, not the comment-stripped copy, because this is the
 * regex `lint-registry.mjs` has always used and moving it here must not change
 * what it accepts.
 */
export function readStates(src) {
  const m = src.match(/const STATES = \[([\s\S]*?)\] as const/)
  if (!m) return null
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

/** The object literal starting at `open`, brace-matched. A lazy `[\s\S]*?` stops
 *  at the first inner `}` and truncates any nested object. */
function objectAt(code, open) {
  let depth = 0
  for (let i = open; i < code.length; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') {
      depth--
      if (depth === 0) return code.slice(open, i + 1)
    }
  }
  return null
}

/**
 * Every module-level object carrying both `stiffness` and `damping`.
 *
 * Both, not either: `restDelta`/`restSpeed` alone describe a stopping
 * threshold, and an object with only one of the two is not a spring anyone can
 * draw.
 */
export function readSprings(code) {
  const out = []
  for (const m of code.matchAll(/const ([A-Za-z_$][\w$]*)\s*=\s*\{/g)) {
    const body = objectAt(code, m.index + m[0].length - 1)
    if (!body) continue
    const num = (key) => {
      const hit = body.match(new RegExp(`\\b${key}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`))
      return hit ? Number(hit[1]) : null
    }
    const stiffness = num('stiffness')
    const damping = num('damping')
    if (stiffness === null || damping === null) continue
    const mass = num('mass') ?? 1
    out.push({
      name: m[1],
      stiffness,
      damping,
      mass,
      restDelta: num('restDelta'),
      restSpeed: num('restSpeed'),
      preset: presetFor({ stiffness, damping, mass }),
    })
  }
  return out
}

/** Names that mean "a length of time". `chance = 0.86` is a probability and
 *  `playOnce = true` is not a number; neither is a duration. */
const DURATION_NAME = /^(duration|[\w$]*[Dd]uration|[\w$]*_MS|[\w$]*Ms)$/

export function readDurations(code) {
  const byName = new Map()
  // Destructured parameter defaults: `duration = 620,`
  for (const m of code.matchAll(/\b([A-Za-z_$][\w$]*)\s*=\s*(\d+(?:\.\d+)?)\s*[,)}]/g)) {
    if (DURATION_NAME.test(m[1])) byName.set(m[1], Number(m[2]))
  }
  // Module constants: `const FADE_MS = 120`
  for (const m of code.matchAll(/const ([A-Za-z_$][\w$]*)\s*=\s*(\d+(?:\.\d+)?)\b/g)) {
    if (DURATION_NAME.test(m[1])) byName.set(m[1], Number(m[2]))
  }
  return [...byName].map(([name, ms]) => ({ name, ms }))
}

/**
 * Whether the component has a real reduced-motion path.
 *
 * Matched on the shape rather than on one hook name. `disclosure` binds
 * motion's `useReducedMotion`; `scramble-reveal` binds a `usePrefersReducedMotion`
 * it defines itself. Anchoring on a single import is how the old `useZTransition`
 * check ended up matching nothing at all.
 *
 * The branch is required, not just the binding: reading the preference and then
 * animating anyway is the failure this is here to catch.
 */
export function readReducedMotion(code) {
  const bind = code.match(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*use[\w$]*ReducedMotion\s*\(/)
  if (!bind) return null
  const id = bind[1]
  return new RegExp(`if\\s*\\(\\s*!?${id}\\b`).test(code) ? 'branch' : null
}

export function scanMotion(src) {
  const code = stripComments(src)
  return {
    states: readStates(src),
    springs: readSprings(code),
    durations: readDurations(code),
    reducedMotion: readReducedMotion(code),
  }
}
