import { useState } from 'react';
import { useMotionValue } from 'motion/react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Readout } from '../../components/Readout';
import { Dial } from '@z-ui/registry/dial/dial';

const SIZES = ['160', '220', '300'];
const SOUND = ['off', 'on'];

export function DialPage() {
  const [size, setSize] = useState('220');
  const [sound, setSound] = useState('off');
  const dialed = useMotionValue('—');
  const pulse = useMotionValue('0 / 0');

  /* The page shows one component and one API, because there is one component.
     The flywheel knob that used to live behind a Mode toggle here is a
     candidate now — /candidates — and showing it under a page that prints an
     install command was the reason a visitor could copy a command for
     something that does not exist. */
  const code =
    sound === 'on'
      ? `<Dial size={${size}} sound />`
      : `<Dial size={${size}} />`;

  return (
    <Detail
      name="dial"
      preview={
        <Playground
          stage="graph-bg"
          controls={[
            {
              label: 'Size',
              value: size,
              onChange: setSize,
              options: SIZES.map((v) => ({ value: v, label: `${v}px` })),
            },
            {
              label: 'Sound',
              value: sound,
              onChange: setSound,
              options: SOUND.map((v) => ({ value: v, label: v })),
            },
          ]}
          code={code}
          codeCaption="this is what installs"
          readouts={
            <>
              <Readout label="pulse" value={pulse} />
              <Readout label="dialed" value={dialed} />
              <Readout label="return" value="300" unit="deg/s" />
              <Readout label="engage" value="85" unit="%" />
            </>
          }
          caption={
            <>
              Pull any hole to the finger stop and let go — past 85% of that digit's own travel and
              the pull counts. The wheel doesn't spring home; a governor crawls it back at a constant
              300°/s, and the digit is the number of pulses the cam trips on the way — one every 30°,
              so 0 takes ten times as long as 1. That asymmetry is the whole feel, and it is why the
              pulse readout matters more than the digit.
              <br />
              <br />
              Unlike every other component here, this return cannot be grabbed mid-crawl. That is the
              mechanism, not an oversight: a real dial's governor owns the wheel until it seats, and
              the pulse count is only honest if the return runs to completion. Recorded as an
              explicit exception in DESIGN.md.
              <br />
              <br />
              Focus a hole and press Enter or Space to dial without a pointer. Sound is off by
              default — an install should be quiet — and the click is synthesised, so enabling it
              adds no assets.
            </>
          }
        >
          <Dial
            key={`${size}-${sound}`}
            size={Number(size)}
            sound={sound === 'on'}
            onDigit={(d) => dialed.set(String(d))}
            onPulse={(i, n) => pulse.set(`${i} / ${n}`)}
          />
        </Playground>
      }
    />
  );
}
