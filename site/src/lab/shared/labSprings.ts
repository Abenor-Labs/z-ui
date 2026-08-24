import { useReducedMotion } from '../../lib/useReducedMotion';
import { INSTANT } from '../../lib/springs';

export type LabTransition = { type: 'spring'; stiffness: number; damping: number } | typeof INSTANT;

/**
 * Named spring feels for the lab's "spring feel" / "release spring" controls.
 * Lab-only — the product's motion identity is exactly two springs (STIFF,
 * SOFT in lib/springs.ts) and stays that way. These six exist so a control
 * can make a real, audible-in-motion difference without the lab borrowing
 * or diluting the product's own pair.
 *
 * Critical damping is 2*sqrt(stiffness) at mass 1 — noted per preset so the
 * "why does this one bounce and this one doesn't" is answered in the file.
 */
export const LAB_SPRING_PRESETS = {
  gentle: { type: 'spring', stiffness: 120, damping: 20 }, // damping < ~21.9 critical: barely underdamped, slow
  smooth: { type: 'spring', stiffness: 220, damping: 26 }, // damping < ~29.7 critical: settles clean, no visible overshoot
  snappy: { type: 'spring', stiffness: 420, damping: 28 }, // damping < ~41 critical: fast, one tight overshoot
  bouncy: { type: 'spring', stiffness: 480, damping: 12 }, // damping << ~43.8 critical: fast with a real bounce
  heavy: { type: 'spring', stiffness: 90, damping: 26 }, // damping > ~19 critical: overdamped, slow, dead — no bounce
  wild: { type: 'spring', stiffness: 700, damping: 8 }, // damping << ~52.9 critical: fast, multiple oscillations
} as const;

export type LabSpringName = keyof typeof LAB_SPRING_PRESETS;

export const LAB_SPRING_NAMES: LabSpringName[] = ['gentle', 'smooth', 'snappy', 'bouncy', 'heavy', 'wild'];

export const LAB_SPRING_OPTIONS = LAB_SPRING_NAMES.map((name) => ({ value: name, label: name }));

/**
 * Reduced motion collapses to instant here exactly as it does for the
 * product's own STIFF/SOFT — a simpler transition, never a vanished one.
 */
export function useLabSpring(name: LabSpringName): LabTransition {
  const reduced = useReducedMotion();
  return reduced ? INSTANT : LAB_SPRING_PRESETS[name];
}
