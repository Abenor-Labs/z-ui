import { useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'motion/react';
import { Readout } from '../../components/Readout';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { LAB_SPRING_PRESETS, type LabSpringName } from '../shared/labSprings';

const DIGIT_H = 56;

/**
 * One wheel of the odometer. Like a real drum, it sits exactly on its digit
 * at rest and only advances the wheel to its left while it rolls from 9
 * toward 10 — the carry is chained from the ones wheel up, so 999 → 1000
 * rolls all three drums together but 137 reads as exactly 137.
 *
 * The strip renders 0–9 plus a second 0 at the end. At the wrap the position
 * jumps 9.99 → 0.01, but both positions show a 0 centered in the window, so
 * the jump is invisible — the same trick a real drum's repeated 0 plays.
 */
function Wheel({ display, place }: { display: MotionValue<number>; place: number }) {
  const y = useTransform(display, (v) => {
    v = Math.max(0, v);
    // chain the fractional carry from the ones wheel up to this one
    let prevPos = 0;
    let pos = 0;
    for (let p = 0; p <= place; p++) {
      // the ones wheel rolls continuously with the value; higher wheels step
      // and only move between steps through the carry chained up from below
      const own = p === 0 ? v : Math.floor(v / 10 ** p);
      pos = (own % 10) + Math.min(1, Math.max(0, prevPos - 9));
      prevPos = pos;
    }
    return -(pos % 10) * DIGIT_H;
  });
  return (
    <div className="lab-odo-wheel" aria-hidden="true">
      <motion.div className="lab-odo-strip" style={{ y }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <span key={i} className="mono">
            {d}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Odometer counter: the target changes, every wheel runs to it on a spring,
 * and retargeting mid-roll carries velocity — the motion value is never
 * recreated, only re-aimed, which is the whole point of the demo.
 *
 * Reduced motion: the spring is bypassed entirely and the value jumps.
 */
export function Odometer({
  value,
  digits = 4,
  spring = 'snappy',
}: {
  value: number;
  digits?: number;
  spring?: LabSpringName;
}) {
  const reduced = useReducedMotion();
  const { stiffness, damping } = LAB_SPRING_PRESETS[spring];

  const springMV = useSpring(value, { stiffness, damping });
  const jumpMV = useMotionValue(value);
  useEffect(() => {
    if (reduced) jumpMV.set(value);
  }, [reduced, jumpMV, value]);

  const display = reduced ? jumpMV : springMV;
  const velocity = useVelocity(display);

  const valueText = useTransform(display, (v) => Math.round(Math.max(0, v)).toString());
  const velocityText = useTransform(velocity, (v) => Math.round(v).toString());

  const places = Array.from({ length: digits }, (_, i) => digits - 1 - i);

  return (
    <div className="lab-odo">
      <div className="lab-odo-wheels" role="img" aria-label={`counter at ${Math.round(value)}`}>
        {places.map((p) => (
          <Wheel key={p} display={display} place={p} />
        ))}
      </div>
      <div className="lab-odo-readouts">
        <Readout label="value" value={valueText} />
        <Readout label="velocity" value={velocityText} unit="u/s" />
      </div>
    </div>
  );
}

/**
 * The stage wrapper: the odometer plus the target buttons that drive it.
 * Clicking a second target while the first roll is still running is the
 * demo — the wheels reverse with the momentum they had.
 */
export function OdometerDemo({
  digits = 4,
  spring = 'snappy',
}: {
  digits?: number;
  spring?: LabSpringName;
}) {
  const [target, setTarget] = useState(137);
  const max = 10 ** digits - 1;
  const targets = [0, 42, 137, 999].filter((t) => t <= max);

  return (
    <div className="lab-odo-demo">
      <Odometer value={target} digits={digits} spring={spring} />
      <div className="lab-odo-targets">
        {targets.map((t) => (
          <button
            key={t}
            type="button"
            className={`btn-mono mono${t === target ? ' lab-odo-target-active' : ''}`}
            onClick={() => setTarget(t)}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          className="btn-mono mono"
          onClick={() => setTarget(Math.floor(Math.random() * (max + 1)))}
        >
          random
        </button>
      </div>
    </div>
  );
}
