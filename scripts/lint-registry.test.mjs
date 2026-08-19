import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const SRC = 'registry/components/disclosure/disclosure.tsx'
const MAN = 'registry/components/disclosure/component.json'

/**
 * This harness proves the linter by breaking a real component and checking it
 * complains. It was pointed at `like-button` until that component was deleted,
 * and then skipped loudly through the empty-registry window rather than
 * pretending to pass.
 *
 * It now mutates `disclosure`, which is a deliberate choice over
 * `scramble-reveal`: disclosure imports motion, so it is the only component in
 * the registry that exercises the motion-scoped branches at all. Those branches
 * are the ones most recently changed and the ones most likely to be loosened by
 * accident.
 *
 * Disclosure drives a MotionValue rather than a variants table, so the two
 * mutations that used to inject variant drift are replaced by one that matters
 * more: it adds an `animate` prop and asserts the linter *starts* demanding
 * `initial={false}` and a variants object. That is the exact boundary of the
 * scoping — a component that declares a motion target owes both; one that
 * integrates a value owes neither — and it is worth a test precisely because
 * getting it wrong looks like a passing build.
 */
if (!existsSync(SRC) || !existsSync(MAN)) {
  console.error(`SKIPPED lint-registry.test: ${SRC} is gone.`)
  console.error(`         re-point SRC/MAN in this file at a component that imports motion.`)
  process.exit(0)
}

const orig = { src: readFileSync(SRC, 'utf8'), man: readFileSync(MAN, 'utf8') }

const mutations = [
  ['STATES vs meta.states drift', () => {
    const m = JSON.parse(orig.man); m.meta.states = ['closed', 'open']
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
  ['icon library import', () =>
    writeFileSync(SRC, orig.src.replace(
      "import * as React from 'react'",
      "import * as React from 'react'\nimport { ChevronRight } from 'lucide-react'",
    ))],
  ['import outside the allowlist', () =>
    writeFileSync(SRC, orig.src.replace(
      "import * as React from 'react'",
      "import * as React from 'react'\nimport { create } from 'zustand'",
    ))],
  ['whileHover reintroduced', () =>
    writeFileSync(SRC, orig.src.replace('        aria-hidden="true"', '        aria-hidden="true"\n        whileHover="lift"'))],
  ['data-state removed', () =>
    writeFileSync(SRC, orig.src.replace(/      data-state=\{state\}\n/, ''))],
  ['STATES tuple removed', () =>
    writeFileSync(SRC, orig.src.replace(/const STATES = \[[^\]]*\] as const/, 'const STATES_LIST = []'))],
  ['default export added', () =>
    writeFileSync(SRC, orig.src + '\nexport default Disclosure\n')],
  ['fake spring cubic-bezier', () =>
    writeFileSync(SRC, orig.src.replace(
      'const SPRING = {',
      "const fake = 'cubic-bezier(0.34, 1.56, 0.64, 1)'\nconst SPRING = {",
    ))],
  [
    // The scoping boundary. Adding a declared motion target must switch both
    // motion-scoped checks back on; if this is MISSED, a component could ship
    // an animate prop with no initial={false} and no state-keyed variants.
    'animate target added without variants or initial={false}',
    () => writeFileSync(SRC, orig.src.replace(
      '        style={{ rotate }}',
      '        style={{ rotate }}\n        animate={{ opacity: 1 }}',
    )),
  ],
  ['file dropped from files[]', () => {
    const m = JSON.parse(orig.man); m.files = []
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
  ['unknown registryDependency', () => {
    const m = JSON.parse(orig.man); m.registryDependencies = ['does-not-exist']
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
  // meta.spring is derived by the generator now. An authored one is exactly the
  // drift that let both manifests claim "snap" while neither component ran it.
  ['authored meta.spring reintroduced', () => {
    const m = JSON.parse(orig.man); m.meta.spring = 'snap'
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
  // The accessibility gate. Reading the preference and animating anyway is the
  // failure the old useZTransition grep was supposed to catch and never could.
  ['reduced-motion branch removed', () =>
    writeFileSync(SRC, orig.src.replace('    if (reduced) {', '    if (false) {'))],
  /*
   * The thesis gate, added 2026-08-14.
   *
   * Swapping disclosure's spring for a duration-and-ease is the exact drift
   * that had already happened three times in a four-component registry without
   * anything noticing: import the engine ADR 0001 justifies on interruptible
   * springs, then use it to run a tween. The linter was exhaustive about
   * structure and silent about whether a component does the thing the library
   * is for.
   *
   * This mutation is the one that keeps the rule honest, because the rule
   * carries an exceptions list and an exceptions list is how a check quietly
   * becomes a no-op. If someone adds `disclosure` to it, this goes red.
   */
  ['spring replaced by a duration tween', () =>
    writeFileSync(SRC, orig.src
      .replace("  type: 'spring',", "  type: 'tween',")
      .replace('  stiffness: 520,', '  duration: 0.4,')
      .replace('  damping: 46,', "  ease: 'easeOut',"))],
]

let caught = 0
for (const [name, mutate] of mutations) {
  writeFileSync(SRC, orig.src); writeFileSync(MAN, orig.man)
  mutate()
  let failed = false, msg = ''
  try { execSync('node scripts/lint-registry.mjs', { stdio: 'pipe' }) }
  catch (e) { failed = true; msg = (e.stderr?.toString() || '').split('\n').filter(l => l.trim().length && !l.includes('failure(s)'))[0]?.trim() ?? '' }
  console.log(`${failed ? '  CAUGHT ' : '  MISSED '} ${name}`)
  if (failed) { caught++; console.log(`           ${msg.slice(0, 110)}`) }
}

writeFileSync(SRC, orig.src); writeFileSync(MAN, orig.man)
console.log(`\n${caught}/${mutations.length} mutations caught`)
process.exit(caught === mutations.length ? 0 : 1)
