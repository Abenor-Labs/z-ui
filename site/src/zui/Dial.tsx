import { useEffect, useRef, useCallback, useImperativeHandle, type Ref } from 'react';
import { motion, useMotionValue, useTransform, animate, type AnimationPlaybackControls } from 'motion/react';
import { STIFFNESS, DAMPING } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';
import { VelocityTracker } from '../lib/velocity';
import {
  FINGER_STOP_DEG,
  HOLE_RADIUS_PX,
  HOLE_R_PX,
  GOVERNOR_SPEED,
  SEAT_HANDOFF_DEG,
  ENGAGE_FRACTION,
  LETTERS,
  holeRestAngle,
  pullDistance,
  pulsesFor,
  pulsesTripped,
  from3OClock,
  nearestDigit,
  polar,
  circlePathD,
} from '../lib/rotary';

/**
 * Two faces on one shared spring.
 *
 * `mode="flywheel"` (default, and the registry's shipped behavior): a knob
 * with a flywheel in it. Flick it and it spins down through real friction,
 * ticking over detents until the nearest one catches it with a spring
 * (1300/46). Grab it mid-spin and the spin is yours again — interrupt +
 * velocity carry-over, both directions.
 *
 * `mode="rotary"` (site display only — see PRD.md): a ten-digit rotary phone
 * face. Pull a hole to the fixed finger stop and let go; the rotor crawls
 * home at a constant governed speed and the last 15° hand off to the same
 * 1300/46 spring that catches the flywheel's detents. Grab it mid-return and
 * it's yours again, same as the flywheel — the physical mechanism differs,
 * the interrupt rule does not.
 *
 * Under prefers-reduced-motion the freewheel/governor are disabled; the
 * flywheel becomes click-to-step, the rotary face becomes click-a-hole.
 */

const FRICTION = 1.5; // 1/s exponential decay of angular velocity
const CATCH_V = 160; // deg/s below which the nearest detent catches the wheel

/** imperative surface used by the landing demo cards: a real impulse, not a canned animation */
export interface DialHandle {
  /** flywheel mode only */
  flick: (velocity?: number) => void;
  /** rotary mode only: pulls the given digit to the stop, then lets it return */
  dialDigit: (digit: number) => void;
}

export interface DialProps {
  ref?: Ref<DialHandle>;
  mode?: 'flywheel' | 'rotary';
  size?: number;
  detents?: number;
  /** telemetry: called on every angle change with (tSeconds, angleDeg, velocityDegPerSec) */
  onFrame?: (t: number, angle: number, velocity: number) => void;
  /** flywheel: fires on every detent crossing. rotary: fires once, when a dialed digit seats */
  onDetent?: (index: number) => void;
  /** rotary only: fires on every pulse tripped during the return — a real pulse-dial
   *  encodes the digit as a count of these, one per 30° of return travel */
  onPulse?: (count: number, total: number) => void;
  className?: string;
}

export function Dial({
  ref,
  mode = 'flywheel',
  size = 160,
  detents = 12,
  onFrame,
  onDetent,
  onPulse,
  className,
}: DialProps) {
  const reduced = useReducedMotion();
  const rotary = mode === 'rotary';
  const step = 360 / detents;

  const rotation = useMotionValue(0);
  const root = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(SVGLineElement | null)[]>([]);
  const pulseRingRef = useRef<SVGCircleElement | null>(null);

  const state = useRef<'rest' | 'drag' | 'freewheel' | 'return' | 'catch'>('rest');
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const raf = useRef(0);
  const tracker = useRef(new VelocityTracker());
  const lastPointerAngle = useRef(0);
  const lastDetent = useRef(0);
  const flashTimer = useRef(0);
  const pulseFlashTimer = useRef(0);

  // rotary-only bookkeeping: which hole this gesture is pulling, and the
  // limit it pulls to. pendingDigit is null when a release should NOT fire
  // onDetent (aborted, pulled short of the digit's own engage threshold).
  const activeDigit = useRef(0);
  const pullLimit = useRef(0);
  const pendingDigit = useRef<number | null>(null);
  const lastPulseCount = useRef(0);

  const onPulseRef = useRef(onPulse);
  onPulseRef.current = onPulse;

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onDetentRef = useRef(onDetent);
  onDetentRef.current = onDetent;

  // telemetry: every rotation change reports angle + velocity (deg/s). The
  // detent-flash bookkeeping only means something on the flywheel's repeating
  // grid — rotary's hole positions are a sparse, unevenly-spaced set, so it
  // skips that half of the subscription entirely.
  useEffect(() => {
    return rotation.on('change', (deg) => {
      onFrameRef.current?.(performance.now() / 1000, deg, rotation.getVelocity());
      if (rotary) return;
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
  }, [rotation, step, detents, rotary]);

  const stopAll = useCallback(() => {
    anim.current?.stop();
    anim.current = null;
    cancelAnimationFrame(raf.current);
  }, []);

  // ——— flywheel: friction decay, then a detent catches it ———

  const catchDetent = useCallback(
    (velocity: number) => {
      state.current = 'catch';
      const target = Math.round(rotation.get() / step) * step;
      anim.current = animate(rotation, target, {
        type: 'spring',
        stiffness: STIFFNESS,
        damping: DAMPING,
        velocity,
      });
      anim.current.finished.then(() => {
        if (state.current === 'catch') state.current = 'rest';
      });
    },
    [rotation, step],
  );

  const freewheel = useCallback(
    (v0: number) => {
      state.current = 'freewheel';
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

  // ——— rotary: constant-speed governed return, then the same spring seats it ———

  const seat = useCallback(() => {
    state.current = 'catch';
    anim.current = animate(rotation, 0, {
      type: 'spring',
      stiffness: STIFFNESS,
      damping: DAMPING,
      velocity: -GOVERNOR_SPEED,
    });
    anim.current.finished.then(() => {
      if (state.current !== 'catch') return; // interrupted before it seated
      state.current = 'rest';
      if (pendingDigit.current !== null) onDetentRef.current?.(pendingDigit.current);
      pendingDigit.current = null;
    });
  }, [rotation]);

  const governorReturn = useCallback(() => {
    state.current = 'return';
    lastPulseCount.current = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.032, (now - last) / 1000));
      last = now;
      const next = Math.max(SEAT_HANDOFF_DEG, rotation.get() - GOVERNOR_SPEED * dt);
      rotation.set(next);

      // an aborted pull (pendingDigit null) is a real dial's finger sliding
      // out of the hole before the stop — nothing was ever committed, so no
      // pulses trip on the way back, same as the real mechanism.
      if (pendingDigit.current !== null) {
        const digit = activeDigit.current;
        const count = pulsesTripped(digit, next);
        if (count !== lastPulseCount.current) {
          lastPulseCount.current = count;
          onPulseRef.current?.(count, pulsesFor(digit));
          const ring = pulseRingRef.current;
          if (ring) {
            ring.style.strokeWidth = '4';
            window.clearTimeout(pulseFlashTimer.current);
            pulseFlashTimer.current = window.setTimeout(() => {
              if (ring) ring.style.strokeWidth = '2';
            }, 90);
          }
        }
      }

      if (next <= SEAT_HANDOFF_DEG) {
        seat();
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, [rotation, seat]);

  // rotary's "dial this digit" impulse — the outbound half is a real spring
  // pull to the stop, not a canned animation, so grabbing it mid-pull behaves
  // exactly like grabbing a hand-dragged pull. Shared by the imperative
  // handle, the number-key shortcut, and (once reduced motion is off) both.
  const startDial = useCallback(
    (digit: number) => {
      if (reduced) {
        rotation.jump(0);
        onDetentRef.current?.(digit);
        return;
      }
      stopAll();
      activeDigit.current = digit;
      pullLimit.current = pullDistance(digit);
      state.current = 'catch';
      anim.current = animate(rotation, pullLimit.current, {
        type: 'spring',
        stiffness: STIFFNESS,
        damping: DAMPING,
        velocity: 0,
      });
      anim.current.finished.then(() => {
        if (state.current !== 'catch') return; // interrupted before it reached the stop
        pendingDigit.current = digit;
        governorReturn();
      });
    },
    [reduced, rotation, stopAll, governorReturn],
  );

  // a card's "flick" button hands the wheel an impulse and then gets out of the way —
  // friction, detents and the catch spring run exactly as they do under a real thumb.
  // dialDigit does the rotary equivalent via startDial.
  useImperativeHandle(
    ref,
    () => ({
      flick: (velocity = 900) => {
        if (rotary) return;
        if (reduced) {
          const step2 = 360 / detents;
          rotation.jump(Math.round(rotation.get() / step2) * step2 + step2);
          return;
        }
        stopAll();
        freewheel(velocity);
      },
      dialDigit: (digit) => {
        if (rotary) startDial(digit);
      },
    }),
    [reduced, detents, rotation, rotary, stopAll, freewheel, startDial],
  );

  const pointerAngle = (e: { clientX: number; clientY: number }) => {
    const r = root.current!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (reduced) return; // click-to-step / click-a-hole handled in onClick
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    stopAll(); // interrupt: whatever was moving — the spin, or the return — is yours again
    lastPointerAngle.current = pointerAngle(e);
    tracker.current.reset();
    tracker.current.push(rotation.get());
    root.current?.classList.add('grabbing', 'dial-pressed');

    if (rotary) {
      // re-grab: the nearest hole to the pointer right now becomes the new
      // active digit, even mid-return — a real dial lets you catch the
      // rotor and redirect it to a different hole.
      const from12 = from3OClock(pointerAngle(e));
      activeDigit.current = nearestDigit(from12, rotation.get());
      pullLimit.current = pullDistance(activeDigit.current);
      pendingDigit.current = null;
    }
    state.current = 'drag';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (state.current !== 'drag') return;
    const a = pointerAngle(e);
    let d = a - lastPointerAngle.current;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    lastPointerAngle.current = a;
    const next = rotary
      ? Math.max(0, Math.min(pullLimit.current, rotation.get() + d))
      : rotation.get() + d;
    rotation.set(next);
    tracker.current.push(rotation.get());
  };

  const onPointerUp = () => {
    if (state.current !== 'drag') return;
    root.current?.classList.remove('grabbing', 'dial-pressed');
    if (rotary) {
      // engaged if pulled at least ENGAGE_FRACTION of THIS digit's own travel —
      // proportional, not a flat degree count, so a short digit (1, 30° total)
      // and a long one (0, 300° total) demand the same commitment, not the
      // same distance
      const engaged = rotation.get() >= pullLimit.current * ENGAGE_FRACTION;
      pendingDigit.current = engaged ? activeDigit.current : null;
      governorReturn();
      return;
    }
    const v = tracker.current.read(); // deg/s — velocity carry-over into the freewheel
    if (Math.abs(v) > CATCH_V) freewheel(v);
    else catchDetent(v);
  };

  const onRotaryClick = (e: React.MouseEvent) => {
    if (!reduced || !rotary) return;
    const from12 = from3OClock(pointerAngle(e));
    const digit = nearestDigit(from12, 0);
    rotation.jump(0);
    onDetentRef.current?.(digit);
  };

  const stepTo = (dir: 1 | -1) => {
    const v = rotation.getVelocity();
    stopAll();
    const target = Math.round(rotation.get() / step) * step + dir * step;
    if (reduced) {
      rotation.jump(target);
      state.current = 'rest';
    } else {
      state.current = 'catch';
      anim.current = animate(rotation, target, {
        type: 'spring',
        stiffness: STIFFNESS,
        damping: DAMPING,
        velocity: v,
      });
      anim.current.finished.then(() => {
        if (state.current === 'catch') state.current = 'rest';
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (rotary) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        startDial(Number(e.key));
      }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      stepTo(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      stepTo(-1);
    }
  };

  useEffect(() => () => stopAll(), [stopAll]);

  const R = 50;

  // bezel: minor ticks every 10°, major ticks at detents (flywheel only)
  const minors = Array.from({ length: 36 }, (_, i) => i * 10);
  const majors = Array.from({ length: detents }, (_, i) => i * step);

  // live position of the hole currently being pulled or returned — a real
  // measured position, not a decoration, so it earns Signal color the same
  // way the flywheel's passed-tick flash does.
  const activeHoleX = useTransform(rotation, (r) => {
    const { x } = polar(holeRestAngle(activeDigit.current) + r, HOLE_RADIUS_PX);
    return x;
  });
  const activeHoleY = useTransform(rotation, (r) => {
    const { y } = polar(holeRestAngle(activeDigit.current) + r, HOLE_RADIUS_PX);
    return y;
  });

  const digits = Array.from({ length: 10 }, (_, i) => i); // 0..9, dialed via holeRestAngle
  const showLabels = size >= 120;

  return (
    <div
      ref={root}
      className={`dial grabbable ${className ?? ''}`}
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={rotary ? onRotaryClick : reduced ? () => stepTo(1) : undefined}
      onKeyDown={onKeyDown}
      role={rotary ? 'group' : 'slider'}
      aria-label={
        rotary
          ? reduced
            ? 'Rotary dial — click a hole to dial that digit'
            : 'Rotary dial — pull a hole to the stop, or press a number key'
          : reduced
            ? 'Dial — click to step one detent'
            : 'Dial — drag or flick to spin'
      }
      aria-valuemin={rotary ? undefined : 0}
      aria-valuemax={rotary ? undefined : detents - 1}
      aria-valuenow={rotary ? undefined : ((lastDetent.current % detents) + detents) % detents}
      tabIndex={0}
    >
      {rotary ? (
        <svg viewBox="-60 -60 120 120" className="dial-rotary" aria-hidden="true">
          {/* static faceplate: base disc, the fixed finger stop, and every digit
              (with its letters, where the pattern has them) printed at hole
              radius — visible through the hole cut in the rotor above
              whenever that hole sits at rest */}
          <circle r={R} fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
          <circle r={R - 10} fill="none" stroke="var(--rule)" strokeWidth="1" />
          {showLabels &&
            digits.map((d) => {
              const { x, y } = polar(holeRestAngle(d), HOLE_RADIUS_PX);
              const letters = LETTERS[d];
              return (
                <g key={d}>
                  {letters && (
                    <text
                      x={x}
                      y={y - HOLE_R_PX * 0.55}
                      className="mono dial-letters"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="var(--rule)"
                    >
                      {letters}
                    </text>
                  )}
                  <text
                    x={x}
                    y={y + (letters ? HOLE_R_PX * 0.3 : 0)}
                    className="mono dial-digit"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--ink)"
                  >
                    {d}
                  </text>
                </g>
              );
            })}
          {/* the finger stop — a fixed mechanical fact, not a live value, so it
              stays ink rather than signal */}
          <g transform={`rotate(${FINGER_STOP_DEG})`}>
            <line x1={0} y1={-R - 2} x2={0} y2={-R - 10} stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* the rotor: one path, its ten holes cut by an evenodd fill rule
              rather than a separate mask element — the faceplate's digits
              show through exactly where a hole sits */}
          <motion.g style={{ rotate: rotation }}>
            <path
              d={
                circlePathD(0, 0, R - 3) +
                ' ' +
                digits
                  .map((d) => {
                    const { x, y } = polar(holeRestAngle(d), HOLE_RADIUS_PX);
                    return circlePathD(x, y, HOLE_R_PX);
                  })
                  .join(' ')
              }
              fillRule="evenodd"
              fill="var(--recess)"
              stroke="var(--rule)"
              strokeWidth="1"
            />
            <circle r="4" fill="var(--ink)" />
          </motion.g>

          {/* the hole currently being pulled or returned — measured, so it's
              Signal, and it thickens briefly on every pulse tripped during
              the return, the visual equivalent of the cam's click */}
          {state.current !== 'rest' && (
            <motion.circle
              ref={pulseRingRef}
              cx={activeHoleX}
              cy={activeHoleY}
              r={HOLE_R_PX + 1.5}
              fill="none"
              stroke="var(--signal)"
              strokeWidth="2"
            />
          )}
        </svg>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
