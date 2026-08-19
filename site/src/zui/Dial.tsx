import { useEffect, useRef, useCallback, useImperativeHandle, type Ref } from 'react';
import { motion, useMotionValue, animate, type AnimationPlaybackControls } from 'motion/react';
import { STIFFNESS, DAMPING } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';
import { VelocityTracker } from '../lib/velocity';

/**
 * Faithful site reimplementation of the registry's `dial`:
 * a knob with a flywheel in it. Flick it and it spins down through real
 * friction, ticking over detents until the nearest one catches it with a
 * spring (1300/46). Grab it mid-spin and the spin is yours again —
 * interrupt + velocity carry-over, both directions.
 *
 * Under prefers-reduced-motion the freewheel is disabled and the dial
 * becomes click-to-step.
 */

const FRICTION = 1.5; // 1/s exponential decay of angular velocity
const CATCH_V = 160; // deg/s below which the nearest detent catches the wheel

/** imperative surface used by the landing demo cards: a real impulse, not a canned animation */
export interface DialHandle {
  flick: (velocity?: number) => void;
}

export interface DialProps {
  ref?: Ref<DialHandle>;
  size?: number;
  detents?: number;
  /** telemetry: called on every angle change with (tSeconds, angleDeg, velocityDegPerSec) */
  onFrame?: (t: number, angle: number, velocity: number) => void;
  onDetent?: (index: number) => void;
  className?: string;
}

export function Dial({ ref, size = 160, detents = 12, onFrame, onDetent, className }: DialProps) {
  const reduced = useReducedMotion();
  const step = 360 / detents;

  const rotation = useMotionValue(0);
  const root = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(SVGLineElement | null)[]>([]);

  const mode = useRef<'rest' | 'drag' | 'freewheel' | 'catch'>('rest');
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const raf = useRef(0);
  const tracker = useRef(new VelocityTracker());
  const lastPointerAngle = useRef(0);
  const lastDetent = useRef(0);
  const flashTimer = useRef(0);

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onDetentRef = useRef(onDetent);
  onDetentRef.current = onDetent;

  // telemetry: every rotation change reports angle + velocity (deg/s)
  useEffect(() => {
    return rotation.on('change', (deg) => {
      onFrameRef.current?.(performance.now() / 1000, deg, rotation.getVelocity());
      const d = Math.round(deg / step);
      if (d !== lastDetent.current) {
        lastDetent.current = d;
        onDetentRef.current?.(((d % detents) + detents) % detents);
        // flash the passed bezel tick in Signal — a measured event, not ornament
        const tick = tickRefs.current[((d % detents) + detents) % detents];
        if (tick) {
          tick.style.stroke = 'var(--signal)';
          window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => {
            for (const t of tickRefs.current) if (t) t.style.stroke = '';
          }, 120);
        }
      }
    });
  }, [rotation, step, detents]);

  const stopAll = useCallback(() => {
    anim.current?.stop();
    anim.current = null;
    cancelAnimationFrame(raf.current);
  }, []);

  const catchDetent = useCallback(
    (velocity: number) => {
      mode.current = 'catch';
      const target = Math.round(rotation.get() / step) * step;
      anim.current = animate(rotation, target, {
        type: 'spring',
        stiffness: STIFFNESS,
        damping: DAMPING,
        velocity,
      });
      anim.current.finished.then(() => {
        if (mode.current === 'catch') mode.current = 'rest';
      });
    },
    [rotation, step],
  );

  const freewheel = useCallback(
    (v0: number) => {
      mode.current = 'freewheel';
      let v = v0;
      let last = performance.now();
      const loop = (now: number) => {
        const dt = Math.max(0, Math.min(0.032, (now - last) / 1000));
        last = now;
        v *= Math.exp(-FRICTION * dt);
        rotation.set(rotation.get() + v * dt);
        if (Math.abs(v) <= CATCH_V) {
          catchDetent(v);
          return;
        }
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    },
    [rotation, catchDetent],
  );

  // a card's "flick" button hands the wheel an impulse and then gets out of the way —
  // friction, detents and the catch spring run exactly as they do under a real thumb
  useImperativeHandle(
    ref,
    () => ({
      flick: (velocity = 900) => {
        if (reduced) {
          const step2 = 360 / detents;
          rotation.jump(Math.round(rotation.get() / step2) * step2 + step2);
          return;
        }
        stopAll();
        freewheel(velocity);
      },
    }),
    [reduced, detents, rotation, stopAll, freewheel],
  );

  const pointerAngle = (e: { clientX: number; clientY: number }) => {
    const r = root.current!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (reduced) return; // click-to-step handled in onClick
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    stopAll(); // interrupt: freewheel or catch spring — the spin is yours again
    mode.current = 'drag';
    lastPointerAngle.current = pointerAngle(e);
    tracker.current.reset();
    tracker.current.push(rotation.get());
    root.current?.classList.add('grabbing', 'dial-pressed');
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (mode.current !== 'drag') return;
    const a = pointerAngle(e);
    let d = a - lastPointerAngle.current;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    lastPointerAngle.current = a;
    rotation.set(rotation.get() + d);
    tracker.current.push(rotation.get());
  };

  const onPointerUp = () => {
    if (mode.current !== 'drag') return;
    root.current?.classList.remove('grabbing', 'dial-pressed');
    const v = tracker.current.read(); // deg/s — velocity carry-over into the freewheel
    if (Math.abs(v) > CATCH_V) freewheel(v);
    else catchDetent(v);
  };

  const stepTo = (dir: 1 | -1) => {
    const v = rotation.getVelocity();
    stopAll();
    const target = Math.round(rotation.get() / step) * step + dir * step;
    if (reduced) {
      rotation.jump(target);
      mode.current = 'rest';
    } else {
      mode.current = 'catch';
      anim.current = animate(rotation, target, {
        type: 'spring',
        stiffness: STIFFNESS,
        damping: DAMPING,
        velocity: v,
      });
      anim.current.finished.then(() => {
        if (mode.current === 'catch') mode.current = 'rest';
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      stepTo(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      stepTo(-1);
    }
  };

  useEffect(() => () => stopAll(), [stopAll]);

  // bezel: minor ticks every 10°, major ticks at detents
  const minors = Array.from({ length: 36 }, (_, i) => i * 10);
  const majors = Array.from({ length: detents }, (_, i) => i * step);
  const R = 50;

  return (
    <div
      ref={root}
      className={`dial grabbable ${className ?? ''}`}
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={reduced ? () => stepTo(1) : undefined}
      onKeyDown={onKeyDown}
      role="slider"
      aria-label={reduced ? 'Dial — click to step one detent' : 'Dial — drag or flick to spin'}
      aria-valuemin={0}
      aria-valuemax={detents - 1}
      aria-valuenow={((lastDetent.current % detents) + detents) % detents}
      tabIndex={0}
    >
      <svg viewBox="-60 -60 120 120" className="dial-bezel" aria-hidden="true">
        {minors.map((a) => (
          <line
            key={`m${a}`}
            x1={0}
            y1={-R - 4}
            x2={0}
            y2={-R - 7}
            transform={`rotate(${a})`}
            stroke="var(--rule)"
            strokeWidth="1"
          />
        ))}
        {majors.map((a, i) => (
          <line
            key={`M${a}`}
            ref={(el) => {
              tickRefs.current[i] = el;
            }}
            className="dial-tick"
            x1={0}
            y1={-R - 3}
            x2={0}
            y2={-R - 9}
            transform={`rotate(${a})`}
            stroke="var(--ink)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <motion.div className="dial-rotor" style={{ rotate: rotation }}>
        <svg viewBox="-60 -60 120 120" aria-hidden="true">
          <circle r={R} fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
          <circle r={R - 10} fill="none" stroke="var(--rule)" strokeWidth="1" />
          {/* flywheel mass */}
          {[45, 135, 225, 315].map((a) => (
            <circle
              key={a}
              cx={Math.cos((a * Math.PI) / 180) * (R - 22)}
              cy={Math.sin((a * Math.PI) / 180) * (R - 22)}
              r="2.5"
              fill="var(--rule)"
            />
          ))}
          {/* the dial's indicator — Signal */}
          <line x1={0} y1={-14} x2={0} y2={-R + 4} stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" />
          <circle r="4" fill="var(--ink)" />
        </svg>
      </motion.div>
    </div>
  );
}
