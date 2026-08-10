import { UserError } from '../ui/log.ts'
import type { RegistryItem } from '../registry/fetch.ts'

export const PRESETS = ['snap', 'bounce', 'settle', 'fling'] as const
export type Preset = (typeof PRESETS)[number]

export const isPreset = (s: string): s is Preset => (PRESETS as readonly string[]).includes(s)

export function assertPreset(s: string): Preset {
  if (!isPreset(s)) {
    throw new UserError(
      `“${s}” is not a spring preset.`,
      `One of: ${PRESETS.join(', ')}. Named by behaviour, not by adjective.`,
    )
  }
  return s
}

/**
 * Every registry component declares its default preset the same way, as a
 * destructured default in the component signature:
 *
 *   spring = 'bounce',
 *
 * This rewrites that one literal. It is anchored to `spring` specifically, so
 * `useZTransition`'s own `preset = 'snap'` default in z-spring.ts is untouched —
 * changing that would silently restyle every component in the project rather
 * than the one being installed.
 *
 * Install-time preset selection is the first of the three behaviours ADR 0002
 * requires of a first-party CLI: a general registry client copies bytes and has
 * no concept of a spring scale.
 */
const DEFAULT_DECL = /(\bspring\s*=\s*)(['"])(snap|bounce|settle|fling)\2/g

export function retargetSpring(content: string, preset: Preset): { content: string; changed: number } {
  let changed = 0
  const out = content.replace(DEFAULT_DECL, (_m, head: string, quote: string, current: string) => {
    if (current === preset) return `${head}${quote}${current}${quote}`
    changed++
    return `${head}${quote}${preset}${quote}`
  })
  return { content: out, changed }
}

/**
 * A `--spring` request that rewrote nothing.
 *
 * `retargetSpring` is anchored to a destructured prop default, and a component
 * that tunes its spring as a module constant does not have one. Returning zero
 * changes is a legitimate outcome; reporting success afterwards is not — the
 * user asked for different physics and got the shipped physics.
 *
 * Kept as a pure function over the retarget flags so it is testable without a
 * filesystem, and so `add` stays a sequence of decisions rather than a place
 * where messages are composed.
 */
export function springOutcome(
  files: { retargeted: boolean }[],
  requested: string | undefined,
): string | null {
  if (!requested) return null
  if (files.some((f) => f.retargeted)) return null
  return `--spring ${requested} matched no file. This component does not expose its spring as a preset name, so its shipped physics were installed unchanged.`
}

/**
 * Whether `--spring` may touch this component at all.
 *
 * A component whose spring is bespoke is not one that forgot to use a preset.
 * disclosure runs 520/46 against snap's 500/40 and its tuning comment spends a
 * paragraph on why: the content is anchored to the top of the panel, so an
 * overshoot on height is not a bounce, it is a gap opening under the last line
 * and closing again. Rewriting it to `bounce` would produce exactly the
 * rendering bug the author tuned it to avoid.
 *
 * So this refuses rather than rewrites, and says why. Returns null when there
 * is no motion data to reason about — an older manifest is not grounds to
 * block an install.
 */
export function springRefusal(item: RegistryItem, requested: string): string | null {
  const motion = item.meta?.motion
  if (!motion) return null

  if (!motion.springs.length) {
    return `${item.name} has no spring to retarget — its motion is not spring-driven, so --spring ${requested} has nothing to act on.`
  }
  if (motion.springs.every((s) => s.preset === null)) {
    const s = motion.springs[0]!
    return `${item.name} tunes its own spring (stiffness ${s.stiffness}, damping ${s.damping}, mass ${s.mass}) rather than using a preset. Installing ${requested} over it would change physics the component was deliberately tuned against. Install it and edit ${s.name} if you want different numbers.`
  }
  return null
}
