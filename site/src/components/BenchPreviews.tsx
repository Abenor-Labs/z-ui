import { useRef, useState } from 'react';
import { Dial as Flywheel } from '../zui/Dial';
import { Reel } from '../zui/Reel';
import { Origin } from '../zui/Origin';
import { Grip } from '../zui/Grip';
import { Intent } from '../zui/Intent';

/**
 * Compact live instances of the five bench components.
 *
 * These are interactive rather than auto-driven, which is the opposite call
 * from the nav hover preview and for the opposite reason: those sit in a
 * panel the cursor cannot enter, these sit inline on a page where the whole
 * argument is that you should put your hands on them. A bench component has
 * not earned an install command yet, so being touched is the only case it
 * gets to make.
 *
 * Kept beside ComponentPreviews.tsx, never merged into it. The registry eight
 * and the bench five must not share a surface that could confuse which is
 * which — same reason data/candidates.ts is a separate file from registry.ts.
 */

function ReelBench() {
  const [value, setValue] = useState(1379);
  return (
    <div className="bench-live">
      <Reel value={value} digits={4} readouts={false} />
      <div className="bench-controls">
        <button className="btn-mono" onClick={() => setValue((v) => v + 248)}>
          +248
        </button>
        <button className="btn-mono" onClick={() => setValue((v) => v + 1379)}>
          +1379
        </button>
        <button className="btn-mono" onClick={() => setValue(0)}>
          reset
        </button>
      </div>
    </div>
  );
}

function OriginBench() {
  return (
    <Origin label="open panel" readouts={false} compact>
      <p className="bench-body">Anchored to the press. It closes toward wherever you are.</p>
    </Origin>
  );
}

function IntentBench() {
  return (
    <Intent label="hover me" compact readouts={false}>
      <span className="mono bench-note">no timer decided this</span>
    </Intent>
  );
}

function GripBench() {
  // Width is bounded rather than fixed at the component's 420 default: this
  // sits in a grid cell, and a control that overflows its card to demonstrate
  // friction has demonstrated the wrong thing.
  const wrap = useRef<HTMLDivElement>(null);
  return (
    <div ref={wrap} className="bench-grip">
      <Grip width={272} height={100} compact readouts={false} />
    </div>
  );
}

export function BenchPreview({ name }: { name: string }) {
  switch (name) {
    case 'flywheel':
      return <Flywheel size={132} detents={12} />;
    case 'reel':
      return <ReelBench />;
    case 'origin':
      return <OriginBench />;
    case 'grip':
      return <GripBench />;
    case 'intent':
      return <IntentBench />;
    default:
      return null;
  }
}
