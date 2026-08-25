/**
 * The eight registry components. Mirrors PRD.md PRODUCT FACTS exactly —
 * no more, no fewer, no invented ones.
 */

export type Category = 'tactile-feedback' | 'state-morphing' | 'input-utility';

export interface RegistryComponent {
  name: string;
  category: Category;
  needs: 'motion' | 'react only';
  /** one-line card blurb, derived from the fact sheet */
  blurb: string;
  /** longer principle text for the detail page, derived from the fact sheet */
  principle: string;
}

export const CATEGORIES: Category[] = ['tactile-feedback', 'state-morphing', 'input-utility'];

export const REGISTRY: RegistryComponent[] = [
  {
    name: 'dial',
    category: 'tactile-feedback',
    needs: 'react only',
    blurb:
      'A pulse-dial telephone dial. The number ring is fixed and the finger wheel turns over it, so the digits stay upright while you dial.',
    principle:
      'Pulses are emitted on the return, not the pull. A governor drives the wheel back at a constant 300°/s and a cam trips one pulse every 30°, so dialling 0 takes ten times as long as dialling 1. That asymmetry is the whole feel — and it is why this is the one component whose return cannot be grabbed mid-flight.',
  },
  {
    name: 'chase',
    category: 'state-morphing',
    needs: 'motion',
    blurb:
      'A segmented control whose indicator gives chase: the edge facing the target leaves on a stiff spring, the edge behind follows on a soft one.',
    principle:
      'The visible stretch between the two edges IS the speed. Nothing scripts the squash — it emerges from two independent springs disagreeing about how fast to travel.',
  },
  {
    name: 'heft',
    category: 'tactile-feedback',
    needs: 'motion',
    blurb:
      'A box of objects that behave like real objects. Drag one and everything it touches gets shoved aside.',
    principle:
      'Anything resting on top loses its floor and drops. Real gravity, contacts, and friction in one file — no choreography, just consequences.',
  },
  {
    name: 'disclosure',
    category: 'state-morphing',
    needs: 'motion',
    blurb: 'A panel whose height is an interruptible spring.',
    principle:
      'Press again mid-open and it reverses from wherever it currently is, carrying the velocity it already had — no snap-back to a default curve.',
  },
  {
    name: 'hold-drain',
    category: 'tactile-feedback',
    needs: 'motion',
    blurb: 'A hold-to-confirm control whose abort costs what the hold earned.',
    principle:
      'Let go at 70% filled and the fill drains back at the same rate it climbed — not instantly, not on a different curve. Commitment has a price in both directions.',
  },
  {
    name: 'late-critique',
    category: 'input-utility',
    needs: 'react only',
    blurb: 'A form field whose criticism is late and forgiveness is instant.',
    principle:
      'No error verdict lands mid-word, while the user is still typing a first attempt; the very first keystroke that fixes the value clears the error on the same frame it is typed.',
  },
  {
    name: 'scramble-reveal',
    category: 'state-morphing',
    needs: 'react only',
    blurb:
      'Text that decodes out of random glyphs — on hover, on mount, or the first time it scrolls into view.',
    principle:
      'The scramble runs once per trigger, never loops, and locks glyphs in until the real string stands.',
  },
  {
    name: 'thinking-orb',
    category: 'state-morphing',
    needs: 'react only',
    blurb:
      'A dotted, honestly-3D status indicator — nine hand-tuned canvas animations for nine agent states, no WebGL.',
    principle:
      'Not gesture-driven — nothing here waits for a press or a hover. The state is set by whatever the orb is standing in for: an agent, a job, a socket.',
  },
];

export function installCommand(name: string): string {
  return `npx @abenor/z-ui@latest add ${name}`;
}

export const REPO_URL = 'https://github.com/Abenor-Labs/z-ui';
export const NPM_URL = 'https://www.npmjs.com/package/@abenor/z-ui';
export const FALLBACK_URL = (name: string) =>
  `npx shadcn@latest add https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public/r/${name}.json`;
