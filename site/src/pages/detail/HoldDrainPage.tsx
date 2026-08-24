import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { HoldDrainDemo } from '../../components/HoldDrainDemo';

const DURATIONS = ['800', '1600', '3200'];

export function HoldDrainPage() {
  const [duration, setDuration] = useState('1600');

  return (
    <Detail
      name="hold-drain"
      preview={
        <Playground
          stage="graph-bg"
          controls={[
            {
              label: 'Duration',
              value: duration,
              onChange: setDuration,
              options: DURATIONS.map((v) => ({ value: v, label: `${v}ms` })),
            },
          ]}
          code={`<HoldDrain\n  label="hold to confirm"\n  duration={${duration}}\n  onConfirm={confirm}\n/>`}
          caption={`An abort costs what the hold earned: let go and the fill drains over exactly the time it took to climb. At ${duration}ms a full commit takes ${(Number(duration) / 1000).toFixed(2)}s — and so does giving up on one. Hold to the end and release while it's armed; that release is what confirms.`}
        >
          <HoldDrainDemo key={duration} duration={Number(duration)} />
        </Playground>
      }
    />
  );
}
