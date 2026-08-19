import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate, type AnimationPlaybackControls } from 'motion/react';
import { STIFFNESS, DAMPING } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';
import { Readout } from '../components/Readout';
import { fixed } from '../lib/format';

/**
 * CANDIDATE — not in the registry, not installable.
 *
 * `reel`: the number arrives the way a wheel stops.
 *
 * Each digit column is a flywheel. A value change hands the wheel an impulse
 * sized so friction alone would land it on the target detent; the wheel spins
 * down through that friction and the target digit catches the tail with the
 * dial's spring (1300/46). A second change mid-spin restarts nothing — it adds
 * its impulse to the velocity already on the wheel.
 *
 * Large deltas spin visibly longer because they have further to fall, never
 * because a duration was scaled by the size of the change.
 */

const FRICTION = 4.2; // 1/s exponential decay of reel velocity, in digit-rows
const CATCH_V = 2.5; // rows/s below which the target digit catches the wheel

export interface ReelProps {
  value: number;
  /** minimum column count; a wider value widens the reel */
  digits?: number;
  readouts?: boolean;
  compact?: boolean;
  className?: string;
}

/** the digit shown at an absolute row index, wrapping 0..9 */
function digitAt(row: number): string {
  return String(((row % 10) + 10) % 10);
}

export function Reel({ value, digits = 3, readouts = true, compact = false, className }: ReelProps) {
  const whole = Math.trunc(value);
  const text = String(Math.abs(whole)).padStart(digits, '0');
  const rowH = compact ? 22 : 34;

  const speeds = useRef<number[]>([]);
  const speedMV = useMotionValue(0);
  const speedText = useTransform(speedMV, (v) => fixed(v, 1, 5));

  const report = useCallback(
    (i: number, v: number) => {
      speeds.current[i] = Math.abs(v);
      let fastest = 0;
      for (const s of speeds.current) if (s > fastest) fastest = s;
      speedMV.set(fastest);
    },
    [speedMV],
  );

  return (
    <div className={`reel${compact ? ' reel-compact' : ''} ${className ?? ''}`}>
      <div className="reel-window" aria-hidden="true">
        {text.split('').map((d, i) => (
          <ReelColumn key={i} index={i} digit={Number(d)} rowH={rowH} onSpeed={report} />
        ))}
      </div>
      <span className="sr-only">{whole}</span>
      {readouts ? (
        <div className="reel-readouts">
          <Readout label="value" value={String(whole)} />
          <Readout label="reel speed" value={speedText} unit="rows/s" />
        </div>
      ) : null}
    </div>
  );
}

/**
 * One column, one flywheel. `pos` is continuous in digit-rows and only ever
 * counts forward — an odometer does not run backwards to reach a lower digit.
 */
function ReelColumn({
  index,
  digit,
  rowH,
  onSpeed,
}: {
  index: number;
  digit: number;
  rowH: number;
  onSpeed: (i: number, v: number) => void;
}) {
  const reduced = useReducedMotion();
  const pos = useMotionValue(0);
  const cells = useRef<(HTMLSpanElement | null)[]>([null, null, null]);
  const target = useRef(0);
  const velocity = useRef(0);
  const raf = useRef(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);

  const paint = useCallback(
    (p: number) => {
      const base = Math.floor(p);
      const frac = p - base;
      // three cells cover the window: row above, row at the window, row below
      for (let k = 0; k < 3; k++) {
        const el = cells.current[k];
        if (!el) continue;
        el.textContent = digitAt(base + 1 - k);
        el.style.transform = `translateY(${(k - 1) * rowH + frac * rowH}px)`;
      }
    },
    [rowH],
  );

  useEffect(() => {
    paint(pos.get());
    return pos.on('change', paint);
  }, [pos, paint]);

  const catchDigit = useCallback(
    (v: number) => {
      anim.current = animate(pos, target.current, {
        type: 'spring',
        stiffness: STIFFNESS,
        damping: DAMPING,
        velocity: v,
      });
      anim.current.finished
        .then(() => {
          anim.current = null;
          velocity.current = 0;
          onSpeed(index, 0);
        })
        .catch(() => {
          /* interrupted by a fresh impulse — that impulse carried this velocity */
        });
    },
    [pos, index, onSpeed],
  );

  const spin = useCallback(() => {
    if (raf.current) return; // already integrating; the new impulse rides on velocity.current
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.032, (now - last) / 1000));
      last = now;
      velocity.current *= Math.exp(-FRICTION * dt);
      pos.set(pos.get() + velocity.current * dt);
      onSpeed(index, velocity.current);
      if (Math.abs(velocity.current) <= CATCH_V) {
        raf.current = 0;
        catchDigit(velocity.current);
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, [pos, index, onSpeed, catchDigit]);

  useEffect(() => {
    const shown = ((target.current % 10) + 10) % 10;
    const ahead = (((digit - shown) % 10) + 10) % 10;
    if (ahead === 0 && Math.abs(pos.get() - target.current) < 0.001) return;
    target.current += ahead;

    if (reduced) {
      anim.current?.stop();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      velocity.current = 0;
      pos.jump(target.current);
      onSpeed(index, 0);
      return;
    }

    const remaining = target.current - pos.get();
    // velocity carry-over: whatever the wheel already had is kept, the impulse is added
    const carried = anim.current ? pos.getVelocity() : velocity.current;
    anim.current?.stop();
    anim.current = null;
    // impulse sized so friction alone would land it; the spring only catches the tail
    velocity.current = carried + remaining * FRICTION;
    spin();
  }, [digit, reduced, pos, spin, index, onSpeed]);

  useEffect(
    () => () => {
      anim.current?.stop();
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  return (
    <span className="reel-col" style={{ height: rowH }}>
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          className="reel-cell"
          ref={(el) => {
            cells.current[k] = el;
          }}
          style={{ height: rowH, lineHeight: `${rowH}px` }}
        >
          0
        </span>
      ))}
    </span>
  );
}
