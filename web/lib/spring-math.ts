/**
 * The step response of the springs the components actually declare.
 *
 * The home page printed `173ms` as a typed string next to two derived numbers,
 * under a comment claiming every number on the page reads from the manifest.
 * It happened to be correct — it is `disclosure`'s rise time to within a tenth
 * of a millisecond — but nothing connected the two, so retuning the spring
 * would have left the headline asserting the old figure. `motion-scan.mjs`
 * already recovers stiffness, damping and mass out of the source at build time;
 * this turns those into the number the page wants to say.
 *
 * Validated against the two presets whose figures are published on the docs
 * page before being used anywhere: `snap` (k 500, c 40) returns 151ms against a
 * stated 152ms, and `bounce` (k 400, c 14) returns 93ms against a stated 94ms.
 * Both stated values are rounded from a different implementation, so agreeing
 * to the millisecond is the check passing, not a coincidence to explain away.
 */

/** A unit step driven by stiffness `k`, damping `c` and mass `m`, at time `t`. */
export function response(k: number, c: number, m: number, t: number): number {
  const wn = Math.sqrt(k / m)
  const zeta = c / (2 * Math.sqrt(k * m))

  // Critically damped is the measure-zero case between the two branches below,
  // and both degenerate there — the underdamped form divides by an `wd` of
  // zero, the overdamped form by a root gap of zero. Treated on its own rather
  // than left to whichever way the floating point happens to fall.
  if (Math.abs(zeta - 1) < 1e-9) {
    return 1 - (1 + wn * t) * Math.exp(-wn * t)
  }

  if (zeta < 1) {
    const wd = wn * Math.sqrt(1 - zeta * zeta)
    return (
      1 -
      Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + ((zeta * wn) / wd) * Math.sin(wd * t))
    )
  }

  const gap = wn * Math.sqrt(zeta * zeta - 1)
  const r1 = -zeta * wn + gap
  const r2 = -zeta * wn - gap
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
}

/**
 * Milliseconds until the spring first reaches 90% of its target.
 *
 * Bisection rather than a closed form: the underdamped case has no elementary
 * inverse, and an overshooting spring crosses 90% more than once — the first
 * crossing is the one a reader means by "how long until it is there", so the
 * search is bracketed to end at it rather than solved for all roots.
 *
 * Returns null instead of a number when no crossing is found inside the
 * bracket, so a spring that never arrives cannot be reported as one that
 * arrives instantly.
 */
export function riseTime90(k: number, c: number, m: number): number | null {
  if (!(k > 0) || !(c > 0) || !(m > 0)) return null

  const TARGET = 0.9
  const CEILING = 10 // seconds; a UI spring taking longer is a defect, not a datum
  const STEP = 0.001

  let lo = 0
  let hi = -1
  for (let t = STEP; t <= CEILING; t += STEP) {
    if (response(k, c, m, t) >= TARGET) {
      hi = t
      lo = t - STEP
      break
    }
  }
  if (hi < 0) return null

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (response(k, c, m, mid) >= TARGET) hi = mid
    else lo = mid
  }
  return Math.round(hi * 1000)
}

/**
 * The same curve, sampled evenly, for anything that wants to draw it.
 *
 * The window is derived rather than passed: four times the rise time shows the
 * approach, whatever overshoot there is, and enough of the settle to read as
 * settled. A fixed window would clip a slow spring and leave a fast one as a
 * step against a flat line.
 */
export function sampleResponse(
  k: number,
  c: number,
  m: number,
  count: number,
): { t: number; value: number }[] | null {
  const t90 = riseTime90(k, c, m)
  if (t90 === null || count < 2) return null

  const window = (t90 / 1000) * 4
  return Array.from({ length: count }, (_, i) => {
    const t = (i / (count - 1)) * window
    return { t, value: response(k, c, m, t) }
  })
}
