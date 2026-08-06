/**
 * The published spring scale, duplicated here on purpose.
 *
 * The CLI cannot import from `registry/lib/z-spring/z-spring.ts` — that file is
 * a React module carrying `'use client'` and a `motion` import, and pulling it
 * in would make this package depend on React to draw a wordmark.
 *
 * Kept honest by a test that reads the registry source and asserts these match.
 * A copy that can silently drift is worse than no copy; a copy with a tripwire
 * is fine.
 */
export const springs = {
  snap: { stiffness: 500, damping: 40, mass: 1 },
  bounce: { stiffness: 400, damping: 14, mass: 1 },
  settle: { stiffness: 260, damping: 24, mass: 1 },
  fling: { stiffness: 300, damping: 30, mass: 1 },
} as const

export type SpringName = keyof typeof springs

/** ζ = c / (2√(k·m)). Below 1 overshoots; `bounce` is the only one that does. */
export const dampingRatio = (name: SpringName) => {
  const { stiffness, damping, mass } = springs[name]
  return damping / (2 * Math.sqrt(stiffness * mass))
}
