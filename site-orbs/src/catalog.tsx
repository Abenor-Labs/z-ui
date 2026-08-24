import { useState, type ReactNode } from 'react';

/* ---- six of the eight, from site/src/zui ---------------------------------
 *
 * The same import set as site/src/components/ComponentPreviews.tsx, so this
 * page and the full site show one build of each component rather than two.  */
import { Dial } from '@site/zui/Dial';
import { Chase } from '@site/zui/Chase';
import { Disclosure } from '@site/zui/Disclosure';
import { HoldDrain } from '@site/zui/HoldDrain';
import { LateCritique } from '@site/zui/LateCritique';
import { ScrambleReveal } from '@site/zui/ScrambleReveal';

/* ---- the two with no site build, read straight from registry/ ------------ */
import { Heft } from '@z-ui/registry/heft/heft';
import { ThinkingOrb } from '@z-ui/registry/thinking-orb/thinking-orb';

/**
 * The eight names in PRD.md → PRODUCT FACTS, and nothing else. Every card
 * prints `npx @abenor/z-ui@latest add <name>` on click, so an entry that is not
 * installable would be a lie told in one click.
 */
export interface Entry {
  /** the registry name — this is what `add <name>` receives, verbatim */
  name: string;
  /** the one-line mechanism, in the product's voice */
  note: string;
  /** columns out of six */
  span: 2 | 3 | 4;
  /** roomy stage, for the two that need the height */
  tall?: boolean;
  /** dark cell — heft and thinking-orb do not follow a CSS token swap */
  dark?: boolean;
  render: () => ReactNode;
}

/* Chase owns its selection, so the card holds the state its caller would. */
function ChaseDemo() {
  const [v, setV] = useState('moving');
  return (
    <Chase
      value={v}
      onChange={setV}
      options={[
        { value: 'idle', label: 'idle' },
        { value: 'moving', label: 'moving' },
        { value: 'settled', label: 'settled' },
      ]}
    />
  );
}

export const CATALOG: Entry[] = [
  {
    name: 'dial',
    span: 2,
    tall: true,
    note: 'A rotary face you drag to a stop and let go. It returns under its own governor at 300°/s, tripping one pulse every 30° on the way back.',
    render: () => <Dial mode="rotary" size={168} />,
  },
  {
    name: 'heft',
    span: 4,
    tall: true,
    dark: true,
    note: 'Objects that behave like objects. Drag one and everything it touches gets shoved aside; anything resting on top loses its floor and drops.',
    render: () => (
      <Heft
        height={196}
        initialBodies={[
          { w: 46, h: 36 },
          { w: 62, h: 30 },
          { w: 38, h: 46 },
        ]}
      />
    ),
  },
  {
    name: 'chase',
    span: 2,
    note: 'The edge facing the target leaves on a stiff spring, the edge behind follows on a soft one. The stretch between them is not scripted — it emerges.',
    render: () => <ChaseDemo />,
  },
  {
    name: 'disclosure',
    span: 4,
    note: 'A panel whose height is an interruptible spring. Press again mid-open and it reverses from where it is, carrying the velocity it already had.',
    render: () => (
      <div style={{ width: '100%', maxWidth: 460 }}>
        <Disclosure title="press to expand">
          <p style={{ fontSize: 12, lineHeight: 1.6 }}>
            Press again mid-open. It reverses from wherever it actually is — nothing snaps back to a
            default curve.
          </p>
        </Disclosure>
      </div>
    ),
  },
  {
    name: 'late-critique',
    span: 3,
    note: 'Criticism is late and forgiveness is instant. No verdict lands mid-word; the first keystroke that fixes the value clears the error on the same frame.',
    render: () => (
      <div style={{ width: '100%', maxWidth: 340 }}>
        <LateCritique compact showLog={false} />
      </div>
    ),
  },
  {
    name: 'hold-drain',
    span: 3,
    note: 'A hold-to-confirm whose abort costs what the hold earned. Let go at 70% and the fill drains back at the rate it climbed.',
    render: () => (
      <div style={{ width: '100%', maxWidth: 360 }}>
        <HoldDrain readouts={false} label="hold to confirm" />
      </div>
    ),
  },
  {
    name: 'scramble-reveal',
    span: 4,
    note: 'Text that rests encoded and decodes as the event — on hover, on mount, or the first time it scrolls into view.',
    render: () => (
      <span className="mono" style={{ fontSize: 15 }}>
        <ScrambleReveal text="hover — text that decodes out of random glyphs" trigger="hover" />
      </span>
    ),
  },
  {
    name: 'thinking-orb',
    span: 2,
    dark: true,
    note: 'A dotted, honestly-3D status indicator. Nine hand-tuned canvas animations, z-sorted and depth-shaded, no WebGL.',
    render: () => <ThinkingOrb state="working" size={64} theme="dark" />,
  },
];
