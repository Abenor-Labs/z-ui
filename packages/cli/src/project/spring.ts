import { UserError } from '../ui/log.ts'

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
