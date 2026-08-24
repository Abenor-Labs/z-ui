import { useState } from 'react';
import { useMotionValue } from 'motion/react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Section } from '../../components/Section';
import { Readout } from '../../components/Readout';
import { SpringGraph } from '../../components/SpringGraph';
import { Dial as Knob } from '@z-ui/registry/dial/dial';
import { Dial as Flywheel } from '../../zui/Dial';
import { RotaryDial } from '../../zui/RotaryDial';
import { useLiveSamples } from '../../lib/useLiveSamples';
import { fixed } from '../../lib/format';

const MODES = ['knob', 'flywheel', 'rotary'];
const DETENTS = ['8', '12', '24'];
const SIZES = ['96', '160', '220'];

export function DialPage() {
  const [mode, setMode] = useState<'knob' | 'flywheel' | 'rotary'>('knob');
  const [detents, setDetents] = useState('12');
  const [size, setSize] = useState('220');
  const [knobValue, setKnobValue] = useState(5);
  const vel = useMotionValue(fixed(0, 2, 7));
  const detent = useMotionValue('00');
  const pulse = useMotionValue('0 / 0');
  const { push, samples } = useLiveSamples(3.2);
  const count = Number(detents);

  // `dial` in the registry is the knob; the flywheel and the rotary face are
  // candidates — real working components, deliberately not installable.
  const code =
    mode === 'knob'
      ? `<Dial\n  label="level"\n  min={0}\n  max={10}\n/>`
      : mode === 'flywheel'
        ? `<Flywheel size={${size}} detents={${count}} />`
        : `<RotaryDial size={${size}} />`;

  const codeCaption =
    mode === 'knob'
      ? 'this is what installs'
      : 'a candidate: not in the registry, no install command — see /candidates. The knob above is the shipped dial.';

  const controls = [
    {
      label: 'Mode',
      value: mode,
      onChange: (v: string) => setMode(v as 'knob' | 'flywheel' | 'rotary'),
      options: MODES.map((v) => ({ value: v, label: v })),
    },
    ...(mode === 'flywheel'
      ? [
          {
            label: 'Detents',
            value: detents,
            onChange: setDetents,
            options: DETENTS.map((v) => ({ value: v, label: v })),
          },
        ]
      : []),
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
          codeCaption={codeCaption}
          readouts={
            mode === 'knob' ? (
              <Readout label="value" value={String(knobValue)} unit={`/ 10`} />
            ) : mode === 'rotary' ? (
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
            mode === 'knob' ? (
              <>
                Drag it, flick it, or arrow it. While fast the wheel coasts through friction; below
                capture speed the nearest detent takes the needle on its spring. There is no timeline
                anywhere in the file — where the needle lands is a function of the angular velocity
                your hand left in it, which is why the same flick lands on a different detent from a
                different starting angle. This is the registry's own default — what a real install
                ships.
              </>
            ) : mode === 'rotary' ? (
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
                remained. This face is a candidate, not the installable dial.
              </>
            )
          }
        >
          {mode === 'knob' ? (
            <Knob label="level" min={0} max={10} size={Number(size)} onValueChange={setKnobValue} />
          ) : mode === 'rotary' ? (
            <RotaryDial
              size={Number(size)}
              onDigit={(d) => detent.set(String(d))}
              onPulse={(i, n) => pulse.set(`${i} / ${n}`)}
            />
          ) : (
            <Flywheel
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
      {mode !== 'flywheel' ? null : (
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
