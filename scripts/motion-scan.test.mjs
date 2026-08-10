/**
 * Two halves, in order.
 *
 * First, assertions against both real components — the scanner must read the
 * registry as it actually stands, not as a fixture written to flatter it.
 * Then mutations, which is the half that proves the scanner can fail: a reader
 * that returns something plausible for every input is indistinguishable from
 * one that works until you break its input on purpose.
 */
import { readFileSync, existsSync } from 'node:fs'
import { scanMotion, presetFor, PRESETS } from './motion-scan.mjs'

const DISCLOSURE = 'registry/components/disclosure/disclosure.tsx'
const SCRAMBLE = 'registry/components/scramble-reveal/scramble-reveal.tsx'

for (const f of [DISCLOSURE, SCRAMBLE]) {
  if (!existsSync(f)) {
    console.error(`FAILED motion-scan.test: ${f} is gone. Re-point this harness at a live component.`)
    process.exit(1)
  }
}

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const disclosure = read(DISCLOSURE)
const scramble = read(SCRAMBLE)

let failures = 0
let checks = 0
const check = (ok, msg) => {
  checks++
  if (!ok) {
    failures++
    console.error(`  FAIL  ${msg}`)
  }
}

// ---- disclosure ----------------------------------------------------------
const d = scanMotion(disclosure)
check(JSON.stringify(d.states) === JSON.stringify(['closed', 'opening', 'open', 'closing']),
  `disclosure states, got ${JSON.stringify(d.states)}`)
check(d.springs.length === 1, `disclosure should yield one spring, got ${d.springs.length}`)
check(d.springs[0]?.name === 'SPRING', `disclosure spring name, got ${d.springs[0]?.name}`)
check(d.springs[0]?.stiffness === 520, `disclosure stiffness, got ${d.springs[0]?.stiffness}`)
check(d.springs[0]?.damping === 46, `disclosure damping, got ${d.springs[0]?.damping}`)
check(d.springs[0]?.mass === 1, `disclosure mass, got ${d.springs[0]?.mass}`)
check(d.springs[0]?.restDelta === 2, `disclosure restDelta, got ${d.springs[0]?.restDelta}`)
// The manifest has claimed "snap" since it was written. 520/46 is not snap.
check(d.springs[0]?.preset === null, `disclosure spring is bespoke, got ${d.springs[0]?.preset}`)
check(d.reducedMotion === 'branch', `disclosure reduced-motion, got ${d.reducedMotion}`)

// ---- scramble-reveal -----------------------------------------------------
const s = scanMotion(scramble)
check(JSON.stringify(s.states) === JSON.stringify(['idle', 'scrambling', 'settled']),
  `scramble states, got ${JSON.stringify(s.states)}`)
check(s.springs.length === 0, `scramble has no spring, got ${s.springs.length}`)
check(s.durations.some((x) => x.name === 'duration' && x.ms === 620),
  `scramble duration 620, got ${JSON.stringify(s.durations)}`)
// It reaches for a locally-defined usePrefersReducedMotion, not motion's hook.
check(s.reducedMotion === 'branch', `scramble reduced-motion, got ${s.reducedMotion}`)
// chance = 0.86 and playOnce = true are prop defaults but not durations.
check(!s.durations.some((x) => x.name === 'chance'), 'chance must not be read as a duration')

// ---- presets -------------------------------------------------------------
check(presetFor({ stiffness: 500, damping: 40, mass: 1 }) === 'snap', 'exact snap match')
check(presetFor({ stiffness: 501, damping: 40, mass: 1 }) === null, 'near-miss is not a preset')
check(Object.keys(PRESETS).length === 4, 'four presets')

// ---- mutations -----------------------------------------------------------
const mutations = [
  ['spring constant renamed away from a recognisable shape',
    disclosure.replace('const SPRING = {', 'const SPRUNG = ['),
    (r) => r.springs.length === 0],
  ['stiffness removed',
    disclosure.replace('  stiffness: 520,\n', ''),
    (r) => r.springs.length === 0],
  ['reduced-motion branch deleted',
    disclosure.replace('    if (reduced) {', '    if (false) {'),
    (r) => r.reducedMotion === null],
  ['reduced-motion hook removed entirely',
    disclosure.replace('const reduced = useReducedMotion() ?? false', 'const reduced = false'),
    (r) => r.reducedMotion === null],
  ['STATES tuple removed',
    disclosure.replace(/const STATES = \[[\s\S]*?\] as const/, 'const STATES_LIST = []'),
    (r) => r.states === null],
  ['spring retuned onto a preset',
    disclosure.replace('stiffness: 520,', 'stiffness: 500,').replace('damping: 46,', 'damping: 40,'),
    (r) => r.springs[0]?.preset === 'snap'],
  ['duration default removed',
    scramble.replace('duration = 620,', 'duration,'),
    (r) => !r.durations.some((x) => x.name === 'duration')],
]

for (const [name, mutated, expect] of mutations) {
  checks++
  const result = scanMotion(mutated)
  const ok = expect(result)
  console.log(`  ${ok ? 'CAUGHT' : 'MISSED'}  ${name}`)
  if (!ok) failures++
}

if (failures) {
  console.error(`\nmotion-scan: ${failures} failure(s) across ${checks} checks\n`)
  process.exit(1)
}
console.log(`\nmotion-scan clean: ${checks} checks, ${mutations.length} mutations caught`)
