import { useState } from 'react';
import { Chase } from '@z-ui/registry/chase/chase';
import { Dial } from '@z-ui/registry/dial/dial';
import { Heft } from '@z-ui/registry/heft/heft';
import { Disclosure } from '@z-ui/registry/disclosure/disclosure';
import { HoldDrainDemo } from './HoldDrainDemo';
import { LateCritiqueDemo } from './LateCritiqueDemo';
import { ScrambleReveal } from '@z-ui/registry/scramble-reveal/scramble-reveal';
import { ThinkingOrb } from '@z-ui/registry/thinking-orb/thinking-orb';

/**
 * Compact live instances of each registry component — the library cards, and
 * the reduced-motion fallback behind the nav hover preview. Interactive,
 * never screenshots.
 *
 * The hover preview's normal path is AutoPreview.tsx, which drives each
 * component through its own trigger on a loop. This file stays hands-on: it
 * is used where a cursor can actually reach the component, plus the one case
 * where a loop is the wrong answer entirely.
 */

function MiniChase() {
  const [v, setV] = useState('two');
  return (
    <Chase
      label="Filter"
      options={[
        { value: 'one', label: 'one' },
        { value: 'two', label: 'two' },
        { value: 'three', label: 'three' },
      ]}
      value={v}
      onValueChange={setV}
    />
  );
}

export function Preview({ name }: { name: string }) {
  switch (name) {
    case 'dial':
      return <Dial size={128} />;
    case 'chase':
      return <MiniChase />;
    case 'heft':
      return (
        <Heft
          height={128}
          initialBodies={[
            { w: 46, h: 36 },
            { w: 62, h: 30 },
            { w: 38, h: 46 },
          ]}
        />
      );
    case 'disclosure':
      return (
        <div style={{ width: '100%' }}>
          <Disclosure label="specs">
            <p className="playground-caption">
              Height is a spring. Close me mid-open — I reverse from wherever I am.
            </p>
          </Disclosure>
        </div>
      );
    case 'hold-drain':
          return <HoldDrainDemo compact readouts={false} />;
    case 'late-critique':
      return <LateCritiqueDemo compact showLog={false} />;
    case 'scramble-reveal':
      return (
        <span className="mono" style={{ fontSize: 14 }}>
          <ScrambleReveal trigger="hover" text="text that decodes out of random glyphs." />
        </span>
      );
    case 'thinking-orb':
      return <ThinkingOrb state="working" size={64} theme="dark" />;
    default:
      return null;
  }
}

