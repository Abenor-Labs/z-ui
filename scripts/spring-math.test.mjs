import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * The site's spring solver, against the CLI's.
 *
 * `web/lib/spring-math.ts` solves the step response in closed form.
 * `packages/cli/src/ui/spring-curve.ts` integrates it with semi-implicit Euler
 * at a fixed step. Two implementations of one physics, in two packages that
 * cannot import each other — the CLI would have to depend on the site, or the
 * site on the CLI's build output, and neither is worth it to share thirty
 * lines.
 *
 * `spring-constants.ts` already states the rule this file applies:
 *
 *   > A copy that can silently drift is worse than no copy; a copy with a
 *   > tripwire is fine.
 *
 * So this is the tripwire. It is not asserting that the numbers are correct —
 * both could be wrong together — it asserts they cannot diverge without a test
 * going red, which is the property that makes the duplicate acceptable.
 *
 * Tolerance is 2ms. The integrator samples on a fixed grid and reports the
 * first sample at or past 90%, so it can only ever overshoot the true crossing
 * by up to one step; the closed form lands on it. Agreement inside a step is
 * the two agreeing, and anything wider is a real difference in the physics.
 */

const { riseTime90 } = await import('../web/lib/spring-math.ts')
const { simulateSpring } = await import('../packages/cli/src/ui/spring-curve.ts')
const { springs } = await import('../packages/cli/src/ui/spring-constants.ts')

const TOLERANCE_MS = 2

test('the site solver and the CLI integrator agree on every published preset', () => {
  for (const [name, { stiffness, damping, mass }] of Object.entries(springs)) {
    const closedForm = riseTime90(stiffness, damping, mass)
    const integrated = simulateSpring(stiffness, damping, mass).t90

    assert.notEqual(closedForm, null, `${name}: the site solver found no rise time`)
    assert.notEqual(integrated, null, `${name}: the CLI integrator found no rise time`)

    const drift = Math.abs(closedForm - integrated)
    assert.ok(
      drift <= TOLERANCE_MS,
      `${name}: site says ${closedForm}ms, CLI says ${integrated}ms — ${drift}ms apart, over the ${TOLERANCE_MS}ms tolerance`,
    )
  }
})

test('they agree on the springs the components actually declare', async () => {
  const { components } = await import('../web/__generated__/meta.js')

  for (const c of components) {
    for (const s of c.motion?.springs ?? []) {
      const closedForm = riseTime90(s.stiffness, s.damping, s.mass)
      const integrated = simulateSpring(s.stiffness, s.damping, s.mass).t90
      if (closedForm === null && integrated === null) continue

      assert.notEqual(closedForm, null, `${c.name}/${s.name}: the site solver found no rise time`)
      assert.notEqual(integrated, null, `${c.name}/${s.name}: the CLI integrator found no rise time`)
      assert.ok(
        Math.abs(closedForm - integrated) <= TOLERANCE_MS,
        `${c.name}/${s.name}: site says ${closedForm}ms, CLI says ${integrated}ms`,
      )
    }
  }
})

/**
 * The damped and overshooting branches are different closed forms, and the
 * critically damped case is a third that both of the others divide by zero at.
 * `disclosure` sits within a percent of it — ζ ≈ 1.009 — so the branch boundary
 * is not hypothetical here, it is where a shipped component already lives.
 */
test('the solver is continuous across the critical damping boundary', () => {
  const k = 400
  const critical = 2 * Math.sqrt(k) // ζ = 1

  const below = riseTime90(k, critical * 0.999, 1)
  const at = riseTime90(k, critical, 1)
  const above = riseTime90(k, critical * 1.001, 1)

  for (const [label, value] of [['below', below], ['at', at], ['above', above]]) {
    assert.notEqual(value, null, `${label} critical damping returned null`)
  }
  assert.ok(
    Math.abs(below - at) <= 1 && Math.abs(above - at) <= 1,
    `discontinuity at ζ=1: ${below}ms → ${at}ms → ${above}ms`,
  )
})
