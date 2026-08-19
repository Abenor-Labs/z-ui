import { useState } from 'react';
import { useMotionValue } from 'motion/react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Section } from '../../components/Section';
import { Readout } from '../../components/Readout';
import { SpringGraph } from '../../components/SpringGraph';
import { Dial } from '../../zui/Dial';
import { useLiveSamples } from '../../lib/useLiveSamples';
import { fixed } from '../../lib/format';

const DETENTS = ['8', '12', '24'];
const SIZES = ['96', '160', '220'];

export function DialPage() {
  const [detents, setDetents] = useState('12');
  const [size, setSize] = useState('220');
  const vel = useMotionValue(fixed(0, 2, 7));
  const detent = useMotionValue('00');
  const { push, samples } = useLiveSamples(3.2);
  const count = Number(detents);

  return (
    <Detail
      name="dial"
      preview={
        <Playground
          stage="graph-bg"
          controls={[
            {
              label: 'Detents',
              value: detents,
              onChange: setDetents,
              options: DETENTS.map((v) => ({ value: v, label: v })),
            },
            {
              label: 'Size',
              value: size,
              onChange: setSize,
              options: SIZES.map((v) => ({ value: v, label: `${v}px` })),
            },
          ]}
          code={`<Dial size={${size}} detents={${count}} />`}
          readouts={
            <>
              <Readout label="ω" value={vel} unit="rad/s" />
              <Readout label="spring" value="1300/46" unit="k/c" />
              <Readout label="detent" value={detent} unit={`/ ${count}`} />
              <Readout label="step" value={fixed(360 / count, 1, 5)} unit="deg" />
            </>
          }
          caption={
            <>
              Flick it hard, then grab it mid-spin — the wheel's velocity is yours the moment you
              touch it, and it's the spring's the moment you let go. Below the catch threshold, the
              nearest detent takes the wheel at 1300/46, seeded with whatever velocity remained.
              Changing the detent count reseeds the geometry; the physics constants do not move.
            </>
          }
        >
          <Dial
            key={detents}
            size={Number(size)}
            detents={count}
            onFrame={(t, _a, v) => {
              const rad = (v * Math.PI) / 180;
              vel.set(fixed(rad, 2, 7));
              push(t, rad);
            }}
            onDetent={(i) => detent.set(String(i).padStart(2, '0'))}
          />
        </Playground>
      }
    >
      <Section index="01" label="TELEMETRY">
        <SpringGraph samples={samples} windowSec={3} yLabel="ω (rad/s)" symmetric />
        <p className="playground-caption">
          The trace is your own interaction from the last three seconds — nothing here is recorded
          or replayed. Watch the decay curve of the freewheel, the sharp reversal when you grab it,
          and the small overshoot when a detent catches.
        </p>
      </Section>
    </Detail>
  );
}
