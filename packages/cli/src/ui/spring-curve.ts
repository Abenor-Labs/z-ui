/**
 * Spring physics, simulated rather than guessed.
 *
 * `motion` drives every registry component with a real spring-mass-damper —
 * `x'' = (stiffness·(1 - x) - damping·x') / mass` — not an easing curve with a
 * spring-shaped name. Integrating that same equation here means `z-ui spring`
 * shows the actual curve a component will move on, not an illustration of one.
 * A fixed 1ms step is overkill for a terminal chart but cheap enough that
 * getting the physics right costs nothing.
 */
export type Sample = { t: number; x: number }

export type CurveStats = {
  samples: Sample[]
  /** How far past the 1.0 target the curve travels, as a percentage. 0 for a spring that never overshoots. */
  overshootPct: number
  /** ms to first reach 90% of target — the honest measure of perceived response. `null` if it never gets there inside the simulation window. */
  t90: number | null
  /** ms until the curve enters the 2% settle band and never leaves it again inside the window. */
  settleMs: number
  /** True if the simulation window ended before the curve settled — the reported settleMs is a lower bound, not the real one. */
  unsettled: boolean
}

const DT_MS = 1
const SETTLE_BAND = 0.02

/**
 * Semi-implicit (symplectic) Euler: velocity updates from the current
 * position before position updates from the new velocity. Plain Euler drifts
 * energy into the system at this step size and makes a critically-damped
 * spring visibly overshoot, which would misreport the one thing this exists
 * to show accurately.
 */
export function simulateSpring(
  stiffness: number,
  damping: number,
  mass: number,
  windowMs = 1600,
): CurveStats {
  const dt = DT_MS / 1000
  let x = 0
  let v = 0
  const samples: Sample[] = [{ t: 0, x: 0 }]
  let t90: number | null = null
  let lastOutsideBand = 0
  let maxX = 0

  for (let t = DT_MS; t <= windowMs; t += DT_MS) {
    const accel = (stiffness * (1 - x) - damping * v) / mass
    v += accel * dt
    x += v * dt
    samples.push({ t, x })
    if (x > maxX) maxX = x
    if (t90 === null && x >= 0.9) t90 = t
    if (Math.abs(x - 1) > SETTLE_BAND) lastOutsideBand = t
  }

  return {
    samples,
    overshootPct: Math.max(0, (maxX - 1) * 100),
    t90,
    settleMs: lastOutsideBand,
    unsettled: lastOutsideBand >= windowMs - DT_MS,
  }
}

/** ζ = c / (2√(k·m)). Below 1 overshoots, at 1 is critical, above 1 is sluggish. */
export function dampingRatioOf(stiffness: number, damping: number, mass: number): number {
  return damping / (2 * Math.sqrt(stiffness * mass))
}

export function regimeOf(zeta: number): string {
  if (zeta < 0.999) return 'underdamped — overshoots'
  if (zeta <= 1.001) return 'critically damped'
  return 'overdamped — no overshoot, slower to arrive'
}

/**
 * A line chart, not a scatter of dots. Each column picks the nearest
 * simulated sample and fills every row between it and the previous column's
 * row, which is what makes a 1ms-resolution simulation read as a continuous
 * curve at terminal width instead of a sparse trail.
 *
 * The fill is plain `#`, not a Unicode block glyph. `█` (U+2588) is missing
 * from Consolas, Windows' default terminal font, which falls back to a
 * hollow placeholder box instead of a solid fill — the curve becomes
 * unreadable on the one platform this most needs to work on out of the box.
 * ASCII has no glyph-coverage risk on any font, anywhere.
 */
export function renderCurve(
  samples: Sample[],
  opts: { width: number; height: number; windowMs: number },
): string[] {
  const { width, height, windowMs } = opts
  const cols: number[] = []
  for (let c = 0; c < width; c++) {
    const t = width === 1 ? 0 : (c / (width - 1)) * windowMs
    const idx = Math.min(samples.length - 1, Math.round(t / DT_MS))
    cols.push(samples[idx]?.x ?? samples[samples.length - 1]!.x)
  }

  const maxVal = Math.max(1, ...cols) * 1.05
  const minVal = Math.min(0, ...cols)
  const span = maxVal - minVal || 1
  const rowOf = (v: number) =>
    Math.min(height - 1, Math.max(0, Math.round(((maxVal - v) / span) * (height - 1))))

  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(' '))

  // The 1.0 target, dashed so the curve reads on top of it rather than
  // merging into a solid row wherever a spring settles exactly on it.
  const targetRow = rowOf(1)
  for (let c = 0; c < width; c += 2) grid[targetRow]![c] = '·'

  let prevRow = rowOf(cols[0]!)
  for (let c = 0; c < width; c++) {
    const row = rowOf(cols[c]!)
    const [from, to] = row < prevRow ? [row, prevRow] : [prevRow, row]
    for (let r = from; r <= to; r++) grid[r]![c] = '#'
    prevRow = row
  }

  return grid.map((row) => row.join(''))
}
