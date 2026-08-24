import type { Category } from './registry';

/**
 * CANDIDATES — components under evaluation. NOT product facts.
 *
 * PRD.md PRODUCT FACTS says eight components, and it still means eight: nothing
 * here is in the registry, has a CLI command, or can be installed. This file is
 * the lab bench, kept separate from registry.ts so the two can never be confused.
 * See CANDIDATES.md for the full slate and the source study behind it.
 */

export interface CandidateComponent {
  name: string;
  category: Category;
  needs: 'motion' | 'react only';
  /** the one-sentence rule the component exists to prove */
  principle: string;
  /** how the behavior is produced — the honest mechanism, not a description of the look */
  mechanic: string;
  /** the mechanic this was derived from, named plainly */
  learnedFrom: string;
  /** what it deliberately did not inherit */
  refuses: string;
}

export const CANDIDATES: CandidateComponent[] = [
  {
    name: 'reel',
    category: 'state-morphing',
    needs: 'motion',
    principle: 'The number arrives the way a wheel stops.',
    mechanic:
      'Each digit column is a flywheel. A value change hands it an impulse sized so friction alone would land it on the target digit; the wheel spins down through that friction and the digit catches the tail on 1300/46. A change mid-spin adds its impulse to the velocity already on the wheel instead of restarting.',
    learnedFrom: 'transitions.dev spinning-counter — a slot reel driven by a fixed duration and motion blur.',
    refuses: 'Duration constants, motion blur, per-digit stagger timing. Large deltas spin longer because they have further to fall.',
  },
  {
    name: 'origin',
    category: 'state-morphing',
    needs: 'motion',
    principle: 'A surface opens from where you touched it, and closes toward where you are now.',
    mechanic:
      'The reveal is a clip-path circle anchored to the real pointer coordinate. The radius runs on the stiff spring, the anchor on the soft one, so closing re-aims at the pointer’s current position and the centre slides there while the radius collapses. An interrupt reverses from the current radius, carrying its velocity.',
    learnedFrom:
      'originkit radial-reveal-button and magnetic-hover-button — a CSS wipe anchored to the pointer’s entry point.',
    refuses: 'Fixed-duration clips, color wipes, and remembering only the point that opened it.',
  },
  {
    name: 'grip',
    category: 'tactile-feedback',
    needs: 'motion',
    principle: 'Objects do not start moving the instant you push them.',
    mechanic:
      'Two friction coefficients on one body. Under the break-loose threshold the pull builds and nothing moves; past it the body lurches free on the stiff spring and then trails the pointer by the kinetic lag. Reverse or stop and the lag collapses, it re-sticks, and the next push has to earn the break-loose again.',
    learnedFrom:
      'originkit gravitygallery’s mouse-constraint stiffness, plus heft’s own contact model.',
    refuses: 'A physics engine, a return spring, and any glide after release. Friction already took the energy.',
  },
  {
    name: 'intent',
    category: 'input-utility',
    needs: 'react only',
    principle: 'A fixed delay is a guess. The pointer already told you.',
    mechanic:
      'No open timer and no close timer. Pointer speed and heading decide: aimed at the target opens it on that frame, sweeping past at the same distance leaves it shut, slowing down nearby counts as arriving. While open, a heading that still points at the surface keeps it open, so the diagonal trip never crosses a dead zone.',
    learnedFrom: 'transitions.dev tooltip — delay on open, instant on close, both hardcoded.',
    refuses: 'Hover-intent timers of any length. The threshold is geometric, not temporal.',
  },
];
