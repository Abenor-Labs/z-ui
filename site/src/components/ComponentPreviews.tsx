import { useState } from 'react';
import { Chase } from '../zui/Chase';
import { Dial } from '../zui/Dial';
import { Heft } from '@z-ui/registry/heft/heft';
import { Disclosure } from '../zui/Disclosure';
import { HoldDrain } from '../zui/HoldDrain';
import { LateCritique } from '../zui/LateCritique';
import { ScrambleReveal } from '../zui/ScrambleReveal';

/**
 * Compact live instances of each registry component — shared by the
 * library cards and the home registry grid. Interactive, never screenshots.
 */

function MiniChase() {
  const [v, setV] = useState('two');
  return (
    <Chase
      options={[
        { value: 'one', label: 'one' },
        { value: 'two', label: 'two' },
        { value: 'three', label: 'three' },
      ]}
      value={v}
      onChange={setV}
    />
  );
}

export function Preview({ name }: { name: string }) {
  switch (name) {
    case 'dial':
      return <Dial mode="rotary" size={96} />;
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
          <Disclosure title="specs">
            <p className="playground-caption">
              Height is a spring. Close me mid-open — I reverse from wherever I am.
            </p>
          </Disclosure>
        </div>
      );
    case 'hold-drain':
      return <HoldDrain compact readouts={false} />;
    case 'late-critique':
      return <LateCritique compact showLog={false} />;
    case 'scramble-reveal':
      return (
        <span className="mono" style={{ fontSize: 14 }}>
          <ScrambleReveal trigger="hover" text="text that decodes out of random glyphs." />
        </span>
      );
    default:
      return null;
  }
}
