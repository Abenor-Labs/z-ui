import { useReducedMotion } from './useReducedMotion';

/**
 * The site's entire motion identity. Never re-declare these numbers inline.
 * STIFF is the dial's own spring — the site runs on the product's physics.
 */
export const STIFF = { type: 'spring', stiffness: 1300, damping: 46 } as const;
export const SOFT = { type: 'spring', stiffness: 300, damping: 30 } as const;

export const INSTANT = { duration: 0 } as const;

export type SiteTransition = typeof STIFF | typeof SOFT | typeof INSTANT;

/** Springs collapse to instant state changes under prefers-reduced-motion. */
export function useSiteSpring(): { stiff: SiteTransition; soft: SiteTransition; reduced: boolean } {
  const reduced = useReducedMotion();
  return reduced
    ? { stiff: INSTANT, soft: INSTANT, reduced }
    : { stiff: STIFF, soft: SOFT, reduced };
}

/** Raw constants for hand-rolled integrators (dial catch, graphs). */
export const STIFFNESS = 1300;
export const DAMPING = 46;
