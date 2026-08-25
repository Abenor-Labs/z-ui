import { useEffect, useRef, useState } from 'react';
import { Chase } from '@z-ui/registry/chase/chase';
import { Dial, type DialHandle } from '@z-ui/registry/dial/dial';
import { Heft } from '@z-ui/registry/heft/heft';
import { Disclosure } from '@z-ui/registry/disclosure/disclosure';
import { ScrambleReveal } from '@z-ui/registry/scramble-reveal/scramble-reveal';
import { ThinkingOrb, type OrbState } from '@z-ui/registry/thinking-orb/thinking-orb';
import { HoldDrainDemo, type HoldDrainDemoHandle } from './HoldDrainDemo';
import { LateCritiqueDemo, type LateCritiqueDemoHandle } from './LateCritiqueDemo';
import { Preview } from './ComponentPreviews';
import { useReducedMotion } from '../lib/useReducedMotion';

/**
 * The component, demonstrating itself.
 *
 * The hover preview is `pointer-events: none`, so a static instance sitting
 * there proves nothing — you can see a dial but not that dialling 9 takes nine
 * times as long as dialling 1, which is the entire component. These drivers
 * run each one through its own real trigger on a loop, so what the panel shows
 * is the mechanism rather than a picture of the mechanism.
 *
 * Nothing here fakes a visual. Every driver goes through the public API the
 * component already had for a keyboard or a consumer: `dialDigit`, a
 * controlled `value`, `spawnCount`, a controlled `open`, `hold`, `type` and
 * `append`, a remount with the component's own `load` trigger, a `state` prop.
 * If a driver could not reach a mechanism through a real handle, it would not
 * be shown at all.
 *
 * Cadence is per-component and deliberately unequal — the loop is paced by how
 * long the real interaction takes, plus a beat to read the result. A shared
 * interval would either clip the dial or leave chase sitting still.
 *
 * Under `prefers-reduced-motion` none of this runs. An auto-looping demo is
 * precisely the thing that setting exists to refuse, so the panel falls back
 * to the static preview and the page it links to is where the motion lives.
 */

/**
 * Leading delay before the first beat: the panel's own entrance is 160ms, and
 * a demo that starts underneath it reads as a glitch rather than a start.
 */
const LEAD = 340;

/** A loop that starts after LEAD, then repeats. Cleans up on unmount, which is
 *  what stops a physics sim the moment the pointer leaves the list. */
function useBeat(period: number, fn: () => void) {
  const held = useRef(fn);
  useEffect(() => {
    held.current = fn;
  });

  useEffect(() => {
    let interval = 0;
    const lead = window.setTimeout(() => {
      held.current();
      interval = window.setInterval(() => held.current(), period);
    }, LEAD);
    return () => {
      window.clearTimeout(lead);
      window.clearInterval(interval);
    };
  }, [period]);
}

/* ------------------------------------------------------------- drivers -- */

/** 1, then 7. The whole point is that the second one takes seven times as long
 *  to come back, and you cannot see that from a single digit. */
const DIAL_SEQUENCE = [1, 7];

function DialAuto() {
  const dial = useRef<DialHandle>(null);
  const i = useRef(0);
  const [last, setLast] = useState<number | null>(null);

  // 2.9s covers the slowest digit in the sequence (7 pulses at 300°/sec is
  // ~700ms of return alone) plus the pull and a beat to read the result.
  useBeat(2900, () => {
    const digit = DIAL_SEQUENCE[i.current % DIAL_SEQUENCE.length];
    i.current += 1;
    dial.current?.dialDigit(digit);
  });

  return (
    <div className="navpv-driver">
      <Dial ref={dial} size={124} onDigit={setLast} />
      <span className="mono navpv-readout">{last === null ? 'dialling…' : `pulses: ${last}`}</span>
    </div>
  );
}

function ChaseAuto() {
  const options = [
    { value: 'one', label: 'one' },
    { value: 'two', label: 'two' },
    { value: 'three', label: 'three' },
  ];
  const [v, setV] = useState('one');
  // Fast enough that the indicator is caught mid-flight on most beats, which
  // is when the two springs are visibly disagreeing.
  useBeat(900, () => setV((cur) => options[(options.findIndex((o) => o.value === cur) + 1) % 3].value));
  return <Chase label="Filter" options={options} value={v} onValueChange={setV} />;
}

function HeftAuto() {
  const [spawn, setSpawn] = useState(0);
  const [gen, setGen] = useState(0);

  // Bodies accumulate — `spawnCount` only counts up. Four drops fill the box,
  // then the whole sim remounts, which is the honest reset rather than a
  // teleport of everything already in there.
  useBeat(1050, () =>
    setSpawn((s) => {
      if (s >= 4) {
        setGen((g) => g + 1);
        return 0;
      }
      return s + 1;
    }),
  );

  return (
    <Heft
      key={gen}
      height={132}
      spawnCount={spawn}
      initialBodies={[
        { w: 44, h: 34 },
        { w: 58, h: 28 },
      ]}
    />
  );
}

function DisclosureAuto() {
  const [open, setOpen] = useState(false);
  useBeat(1500, () => setOpen((o) => !o));
  return (
    <div style={{ width: '100%' }}>
      <Disclosure label="specs" open={open} onOpenChange={setOpen}>
        <p className="navpv-inner">Height is a spring. It reverses from wherever it is.</p>
      </Disclosure>
    </div>
  );
}

function HoldDrainAuto() {
  const hd = useRef<HoldDrainDemoHandle>(null);
  const steps = useRef<number[]>([]);

  useEffect(() => {
    const held = steps.current;
    return () => held.forEach(window.clearTimeout);
  }, []);

  /**
   * Both halves, in the order that makes the argument.
   *
   * An abort-only loop shows the mechanism — the fill draining back at the
   * rate it climbed — but it also reads as a control that is broken, because
   * nothing ever completes. A confirm-only loop shows a button. So: abort
   * first, then a hold that goes all the way and commits, then a reset.
   *
   * The reset is not decoration. `committed` is a one-shot guard in the
   * shipped component, so without it the second loop would find a dead
   * control and every beat after the first confirm would do nothing at all.
   */
  useBeat(6400, () => {
    steps.current.forEach(window.clearTimeout);
    steps.current = [
      // Releases at ~56% of a 1600ms fill: the drain takes ~900ms to pay it
      // back, at the same rate it was earned.
      window.setTimeout(() => hd.current?.hold(900), 0),
      // Past the full 1600ms fill, so this one arms and then commits.
      window.setTimeout(() => hd.current?.hold(1900), 2500),
      window.setTimeout(() => hd.current?.reset(), 5500),
    ];
  });

  return (
    <HoldDrainDemo ref={hd} duration={1600} compact readouts={false} focusOnHold={false} />
  );
}

function LateCritiqueAuto() {
  const lc = useRef<LateCritiqueDemoHandle>(null);
  const fix = useRef(0);

  useEffect(() => () => window.clearTimeout(fix.current), []);

  // One full argument per loop: type a bad address (no verdict while typing),
  // let the pause land the error, then add the character that fixes it and
  // watch the error go on that keystroke rather than on the next blur.
  useBeat(5400, () => {
    lc.current?.type('nope@nope');
    window.clearTimeout(fix.current);
    // 900ms of typing, then ~700ms for the verdict to land, then a beat.
    fix.current = window.setTimeout(() => lc.current?.append('.co'), 2600);
  });

  return <LateCritiqueDemo ref={lc} compact showLog={false} />;
}

function ScrambleAuto() {
  const [gen, setGen] = useState(0);
  // `ScrambleReveal` exposes no imperative replay — the hook behind it does,
  // the component does not. Remounting with the component's own `load` trigger
  // is a real trigger rather than a reimplementation of one.
  useBeat(2400, () => setGen((g) => g + 1));
  return (
    <span className="mono" style={{ fontSize: 13 }}>
      <ScrambleReveal key={gen} trigger="load" text="decodes out of random glyphs" />
    </span>
  );
}

/** Four of the nine, chosen because they look least alike at 64px. */
const ORB_STATES: OrbState[] = ['working', 'searching', 'weaving', 'breathing'];

function OrbAuto() {
  const [i, setI] = useState(0);
  useBeat(1900, () => setI((n) => (n + 1) % ORB_STATES.length));
  return (
    <div className="navpv-driver">
      <ThinkingOrb state={ORB_STATES[i]} size={64} theme="dark" />
      <span className="mono navpv-readout">{ORB_STATES[i]}</span>
    </div>
  );
}

/* ------------------------------------------------------------- surface -- */

export function AutoPreview({ name }: { name: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <Preview name={name} />;

  switch (name) {
    case 'dial':
      return <DialAuto />;
    case 'chase':
      return <ChaseAuto />;
    case 'heft':
      return <HeftAuto />;
    case 'disclosure':
      return <DisclosureAuto />;
    case 'hold-drain':
      return <HoldDrainAuto />;
    case 'late-critique':
      return <LateCritiqueAuto />;
    case 'scramble-reveal':
      return <ScrambleAuto />;
    case 'thinking-orb':
      return <OrbAuto />;
    default:
      return <Preview name={name} />;
  }
}
