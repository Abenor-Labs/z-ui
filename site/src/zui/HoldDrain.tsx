import { useCallback, useEffect, useRef, useState, useImperativeHandle, type Ref } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Readout } from '../components/Readout';
import { fixed } from '../lib/format';
import { useReducedMotion } from '../lib/useReducedMotion';

/**
 * Faithful site reimplementation of the registry's `hold-drain`:
 * a hold-to-confirm control whose abort costs what the hold earned.
 * Let go at 70% filled and the fill drains back at the same rate it
 * climbed — not instantly, not on a different curve.
 */

export interface HoldDrainHandle {
  /** press for `ms`, then release — the drain that follows is the real one */
  hold: (ms?: number) => void;
}

export function HoldDrain({
  ref,
  rate = 60, // %/s — climb and drain are the same constant by design
  label = 'hold to confirm',
  readouts = true,
  onConfirm,
  compact = false,
}: {
  ref?: Ref<HoldDrainHandle>;
  rate?: number;
  label?: string;
  readouts?: boolean;
  onConfirm?: () => void;
  compact?: boolean;
}) {
  const fill = useMotionValue(0); // 0..100
  const rateMV = useMotionValue(0); // signed %/s, live
  const [confirmed, setConfirmed] = useState(false);
  const holding = useRef(false);
  const raf = useRef(0);
  const stepper = useRef(0);
  const running = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  // mirrored so the loop and handlers never read a stale closure if the
  // preference flips mid-hold
  const reducedRef = useRef(false);
  reducedRef.current = useReducedMotion();

  const haltAll = () => {
    cancelAnimationFrame(raf.current);
    window.clearInterval(stepper.current);
    running.current = false;
  };

  const scaleX = useTransform(fill, (f) => f / 100);
  const fillText = useTransform(fill, (f) => fixed(f, 1, 5));
  const rateText = useTransform(rateMV, (r) => (r > 0 ? `+${fixed(r, 1, 5).trim()}` : r < 0 ? fixed(r, 1, 6).trim() : '0.0'));

  const loop = useCallback(() => {
    if (running.current) return;
    running.current = true;

    // Under prefers-reduced-motion the hold survives — it is a safety
    // mechanic, not decoration — but the continuous travel does not: the fill
    // advances in quarters over the real duration, and releasing snaps to
    // zero at once because the drain has no non-animated form.
    if (reducedRef.current) {
      const from = fill.get();
      const steps = 4;
      const stepPct = 100 / steps;
      const interval = Math.max(1, (((100 - from) / rate) * 1000) / steps);
      stepper.current = window.setInterval(() => {
        const next = Math.min(100, fill.get() + stepPct);
        fill.jump(next);
        rateMV.jump(next >= 100 ? 0 : rate);
        if (next >= 100) {
          window.clearInterval(stepper.current);
          running.current = false;
          setConfirmed(true);
          onConfirmRef.current?.();
        }
      }, interval);
      return;
    }

    let last = performance.now();
    const frame = (now: number) => {
      // rAF timestamps can precede the performance.now() captured above — never integrate backwards
      const dt = Math.max(0, Math.min(0.032, (now - last) / 1000));
      last = now;
      const dir = holding.current ? 1 : -1;
      const next = Math.max(0, Math.min(100, fill.get() + dir * rate * dt));
      if (next >= 100) {
        fill.set(100);
        rateMV.set(0);
        running.current = false;
        setConfirmed(true);
        onConfirmRef.current?.();
        return;
      }
      fill.set(next);
      rateMV.set(dir * rate); // the abort costs what the hold earned: same magnitude, opposite sign
      if (!holding.current && next <= 0) {
        rateMV.set(0);
        running.current = false;
        return;
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  }, [fill, rate, rateMV]);

  const start = () => {
    if (confirmed) return;
    holding.current = true;
    loop();
  };
  const end = () => {
    holding.current = false;
    if (reducedRef.current && !confirmed) {
      // the drain is pure motion; aborting under reduced returns to zero at once
      haltAll();
      fill.jump(0);
      rateMV.jump(0);
      return;
    }
    // no stop: the drain runs on the same loop, same rate, sign flipped
  };

  const holdTimer = useRef(0);
  useImperativeHandle(
    ref,
    () => ({
      hold: (ms = 700) => {
        if (confirmed) reset();
        start();
        window.clearTimeout(holdTimer.current);
        holdTimer.current = window.setTimeout(end, ms);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmed],
  );

  const reset = () => {
    setConfirmed(false);
    fill.jump(0);
    rateMV.jump(0);
  };

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      window.clearInterval(stepper.current);
      window.clearTimeout(holdTimer.current);
    },
    [],
  );

  return (
    <div className={`holddrain${compact ? ' holddrain-compact' : ''}`}>
      <button
        className={`holddrain-track${confirmed ? ' holddrain-confirmed' : ''}`}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as Element).setPointerCapture(e.pointerId);
          start();
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') end();
        }}
        aria-label={confirmed ? 'confirmed' : `${label} — release before full and the fill drains back`}
      >
        <motion.span className="holddrain-fill" style={{ scaleX }} aria-hidden="true" />
        <span className="mono holddrain-label">{confirmed ? 'confirmed' : label}</span>
      </button>
      {readouts ? (
        <div className="holddrain-readouts">
          <Readout label="fill" value={fillText} unit="%" />
          <Readout label="rate" value={rateText} unit="%/s" />
          {confirmed ? (
            <button className="mono holddrain-reset" onClick={reset}>
              reset
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
