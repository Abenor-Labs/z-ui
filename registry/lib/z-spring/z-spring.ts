'use client'

import { useReducedMotionConfig } from 'motion/react'
import type { Transition } from 'motion/react'

/**
 * The Z-UI spring scale.
 *
 * Named by behavior, not by adjective, so choosing one is a decision rather
 * than a vibe. Damping ratio is what actually determines the feel:
 *
 *   ζ = damping / (2 * sqrt(stiffness * mass))
 *
 *                      t90     overshoot   rest (2%)
 *   snap    ζ 0.89    152ms          <1%      200ms
 *   bounce  ζ 0.35     94ms          31%      571ms
 *   settle  ζ 0.74    173ms           3%      333ms
 *   fling   ζ 0.87    188ms          <1%      267ms
 *
 * `t90` is time to reach 90% of the target: the honest measure of perceived
 * response. Note that `bounce` gets there fastest of the four precisely
 * because it overshoots. Its long tail is settling the user reads as physical
 * weight, not latency, and the element stays interactive throughout.
 *
 * `snap` is the default. Reach for `bounce` only when the recoil itself
 * carries meaning, and only on an element 48px or smaller responding to
 * direct user input.
 */
export const springs = {
  /** State morphs: play/pause, lock, mute. Overshoot here would be noise. */
  snap: { type: 'spring', stiffness: 500, damping: 40, mass: 1 },
  /** Tactile feedback: like, bookmark. The overshoot is the message. */
  bounce: { type: 'spring', stiffness: 400, damping: 14, mass: 1 },
  /** Reveals: search pill expand, password eye. */
  settle: { type: 'spring', stiffness: 260, damping: 24, mass: 1 },
  /** Gesture release, carrying velocity out of a drag. */
  fling: { type: 'spring', stiffness: 300, damping: 30, mass: 1 },
} as const satisfies Record<string, Transition>

export type SpringName = keyof typeof springs

/**
 * Resolves a preset name to a transition, honoring `prefers-reduced-motion`.
 *
 * Reduced motion returns a zero-duration transition so the state change is
 * instant rather than absent. The other half of the contract lives in the
 * component: when reduced motion is active, decorative sub-elements
 * (particles, trails, draw-on strokes) must not render at all. A hook cannot
 * enforce that, so components consult this preference directly for it.
 *
 * `useReducedMotionConfig`, not `useReducedMotion`: the former also honors an
 * enclosing `<MotionConfig reducedMotion="always" | "never">`, which is what
 * lets a docs page demonstrate the reduced-motion branch beside the full one
 * without asking the reader to change an OS setting. It returns
 * `boolean | null` and is null during SSR, so compare against `true`
 * explicitly and let the server render the full-motion markup.
 */
export function useZTransition(
  preset: SpringName | Transition = 'snap',
): Transition {
  const reduced = useReducedMotionConfig() === true
  if (reduced) return { duration: 0 }
  return typeof preset === 'string' ? springs[preset] : preset
}
