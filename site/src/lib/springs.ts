import { useReducedMotion } from './useReducedMotion';

/**
 * The site's entire motion identity. Never re-declare these numbers inline.
 * STIFF is the dial's own spring — the site runs on the product's physics.
 */
export const STIFF = { type: 'spring', stiffness: 1300, damping: 46 } as const;
export const SOFT = { type: 'spring', stiffness: 300, damping: 30 } as const;

export const INSTANT = { duration: 0 } as const;

/**
 * The one tween on the site, and it earns the exception.
 *
 * Both springs above are underdamped on purpose — critical damping for 1300 is
 * ~72 and for 300 is ~35, and STIFF/SOFT sit under both, so each one overshoots
 * and comes back. That is correct for anything the user is pushing: a knob, a
 * panel they can grab, an indicator chasing a target. It is wrong for something
 * that merely appears near the cursor, where an overshoot reads as a wobble
 * rather than as weight, and it is wrong at tooltip speed, where SOFT's settle
 * is more than twice the budget.
 *
 * 160ms is the tooltip/small-popover tier. The curve is a strong ease-out —
 * built-in `ease-out` is too weak to register at this duration.
 */
export const REVEAL = { duration: 0.16, ease: [0.23, 1, 0.32, 1] } as const;

/** A content swap inside an already-open surface. Opacity only, faster still. */
export const SWAP = { duration: 0.12, ease: [0.23, 1, 0.32, 1] } as const;

export type SiteTransition =
  | typeof STIFF
  | typeof SOFT
  | typeof INSTANT
  | typeof REVEAL
  | typeof SWAP;

/** Springs collapse to instant state changes under prefers-reduced-motion. */
export function useSiteSpring(): {
  stiff: SiteTransition;
  soft: SiteTransition;
  reveal: SiteTransition;
  swap: SiteTransition;
  reduced: boolean;
} {
  const reduced = useReducedMotion();
  return reduced
    ? { stiff: INSTANT, soft: INSTANT, reveal: INSTANT, swap: INSTANT, reduced }
    : { stiff: STIFF, soft: SOFT, reveal: REVEAL, swap: SWAP, reduced };
}

/** Raw constants for hand-rolled integrators (dial catch, graphs). */
export const STIFFNESS = 1300;
export const DAMPING = 46;
