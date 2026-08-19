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

const MODES = ['rotary', 'flywheel'];
const DETENTS = ['8', '12', '24'];
const SIZES = ['96', '160', '220'];

export function DialPage() {
  const [mode, setMode] = useState<'rotary' | 'flywheel'>('rotary');
  const [detents, setDetents] = useState('12');
  const [size, setSize] = useState('220');
  const vel = useMotionValue(fixed(0, 2, 7));
  const detent = useMotionValue('00');
  const { push, samples } = useLiveSamples(3.2);
  const count = Number(detents);
  const rotary = mode === 'rotary';

  const code = rotary
    ? `<Dial mode="rotary" size={${size}} />`
    : `<Dial size={${size}} detents={${count}} />`;

  const controls = [
    {
      label: 'Mode',
      value: mode,
      onChange: (v: string) => setMode(v as 'rotary' | 'flywheel'),
      options: MODES.map((v) => ({ value: v, label: v })),
    },
    ...(rotary
      ? []
      : [
          {
            label: 'Detents',
            value: detents,
            onChange: setDetents,
            options: DETENTS.map((v) => ({ value: v, label: v })),
          },
        ]),
    {
      label: 'Size',
      value: size,
      onChange: setSize,
      options: SIZES.map((v) => ({ value: v, label: `${v}px` })),
    },
  ];

  return (
    <Detail
      name="dial"
      preview={
        <Playground
          stage="graph-bg"
          controls={controls}
          code={code}
          codeCaption={
            rotary
              ? 'what this instance is running — mode="rotary" is a site display flag, not part of the installed component. z-ui add dial ships the flywheel below'
              : 'the selection above, as you would write it — this is also what installs'
          }
          readouts={
            rotary ? (
              <>
                <Readout label="ω" value={vel} unit="rad/s" />
                <Readout label="spring" value="1300/46" unit="k/c" />
                <Readout label="dialed" value={detent} />
                <Readout label="governor" value="300" unit="deg/s" />
              </>
            ) : (
              <>
                <Readout label="ω" value={vel} unit="rad/s" />
                <Readout label="spring" value="1300/46" unit="k/c" />
                <Readout label="detent" value={detent} unit={`/ ${count}`} />
                <Readout label="step" value={fixed(360 / count, 1, 5)} unit="deg" />
              </>
            )
          }
          caption={
            rotary ? (
              <>
                Pull any hole to the fixed stop and let go. The rotor doesn't spring home — it
                crawls back at a constant 300°/s, and only the last 15° hand off to the 1300/46
                catch. Grab it mid-crawl and the pull is yours again, redirected to whichever hole
                you just caught. Press a number key to dial without a pointer.
              </>
            ) : (
              <>
                Flick it hard, then grab it mid-spin — the wheel's velocity is yours the moment you
                touch it, and it's the spring's the moment you let go. Below the catch threshold,
                the nearest detent takes the wheel at 1300/46, seeded with whatever velocity
                remained. This is the registry's own default — what a real install ships.
              </>
            )
          }
        >
          <Dial
            key={`${mode}-${detents}`}
            mode={mode}
            size={Number(size)}
            detents={count}
            onFrame={(t, _a, v) => {
              const rad = (v * Math.PI) / 180;
              vel.set(fixed(rad, 2, 7));
              push(t, rad);
            }}
            onDetent={(i) => detent.set(rotary ? String(i) : String(i).padStart(2, '0'))}
          />
        </Playground>
      }
    >
      <Section index="01" label="TELEMETRY">
        <SpringGraph samples={samples} windowSec={3} yLabel="ω (rad/s)" symmetric />
        <p className="playground-caption">
          {rotary
            ? "The trace is your own interaction from the last three seconds. A pull shows as a spike while you drag; letting go drops the curve onto a flat plateau near -5.2 rad/s — the governor holding a literal constant speed, not decaying like the flywheel's friction — until the last 15° hand off and you see the spring's small overshoot at the very end."
            : 'The trace is your own interaction from the last three seconds — nothing here is recorded or replayed. Watch the decay curve of the freewheel, the sharp reversal when you grab it, and the small overshoot when a detent catches.'}
        </p>
      </Section>
    </Detail>
  );
}
