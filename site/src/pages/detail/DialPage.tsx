import { useState } from 'react';
import { useMotionValue } from 'motion/react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Section } from '../../components/Section';
import { Readout } from '../../components/Readout';
import { SpringGraph } from '../../components/SpringGraph';
import { Dial } from '../../zui/Dial';
import { RotaryDial } from '../../zui/RotaryDial';
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
  const pulse = useMotionValue('0 / 0');
  const { push, samples } = useLiveSamples(3.2);
  const count = Number(detents);
  const rotary = mode === 'rotary';

  const code = rotary ? `<RotaryDial size={${size}} />` : `<Dial size={${size}} detents={${count}} />`;

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
              ? 'RotaryDial is a separate reference component, not a mode of the installable dial — it is not in the registry and z-ui add dial does not ship it. See the flywheel below for what actually installs'
              : 'the selection above, as you would write it — this is also what installs'
          }
          readouts={
            rotary ? (
              <>
                <Readout label="pulse" value={pulse} />
                <Readout label="dialed" value={detent} />
                <Readout label="return" value="300" unit="deg/s" />
                <Readout label="engage" value="85" unit="%" />
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
                Pull any hole to the stop and let go — past 85% of that digit's own travel and the
                pull counts. The wheel doesn't spring home; it crawls back at a constant 300°/s, and
                the digit is the number of pulses the cam trips on the way — one per 30°, so 0 takes
                ten times as long as 1. Unlike every other physics on this site, this return does not
                take a spring catch and cannot be re-grabbed mid-crawl — a deliberate exception,
                recorded rather than silently made to match. Press a number key to dial without a
                pointer.
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
          {rotary ? (
            <RotaryDial
              size={Number(size)}
              onDigit={(d) => detent.set(String(d))}
              onPulse={(i, n) => pulse.set(`${i} / ${n}`)}
            />
          ) : (
            <Dial
              size={Number(size)}
              detents={count}
              onFrame={(t, _a, v) => {
                const rad = (v * Math.PI) / 180;
                vel.set(fixed(rad, 2, 7));
                push(t, rad);
              }}
              onDetent={(i) => detent.set(String(i).padStart(2, '0'))}
            />
          )}
        </Playground>
      }
    >
      {rotary ? null : (
        <Section index="01" label="TELEMETRY">
          <SpringGraph samples={samples} windowSec={3} yLabel="ω (rad/s)" symmetric />
          <p className="playground-caption">
            The trace is your own interaction from the last three seconds — nothing here is
            recorded or replayed. Watch the decay curve of the freewheel, the sharp reversal when
            you grab it, and the small overshoot when a detent catches.
          </p>
        </Section>
      )}
    </Detail>
  );
}
