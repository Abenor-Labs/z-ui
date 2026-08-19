import { useCallback, useEffect, useRef, useState, useImperativeHandle, type Ref } from 'react';
import { motion, useMotionValue, useTransform, animate, type AnimationPlaybackControls } from 'motion/react';
import { STIFF } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';
import { VelocityTracker } from '../lib/velocity';
import { Readout } from '../components/Readout';
import { fixed } from '../lib/format';

/**
 * CANDIDATE — not in the registry, not installable.
 *
 * `grip`: objects do not start moving the instant you push them.
 *
 * Two friction coefficients, one body. While stuck, the pull builds and the
 * body does not move at all; past the break-loose threshold it lurches free on
 * the stiff spring and then trails the pointer by the kinetic lag. Reverse or
 * stop and the lag collapses, the body re-sticks, and the next push has to earn
 * the break-loose again. Release changes nothing — it holds where it stuck.
 */

const BREAK = 22; // px of pull needed to break static friction
const KINETIC = 8; // px the body trails the pointer once it is sliding

export interface GripHandle {
  /** push with a given pull in px — under the break-loose threshold nothing moves */
  push: (pullPx?: number) => void;
}

export interface GripProps {
  ref?: Ref<GripHandle>;
  width?: number;
  height?: number;
  label?: string;
  readouts?: boolean;
  compact?: boolean;
  className?: string;
}

export function Grip({
  ref,
  width = 420,
  height = 96,
  label = 'grip',
  readouts = true,
  compact = false,
  className,
}: GripProps) {
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const tracker = useRef(new VelocityTracker());

  const x = useMotionValue(0);
  const pullMV = useMotionValue(0);
  const [sliding, setSliding] = useState(false);
  const slidingRef = useRef(false);
  const dragging = useRef(false);
  const pointerX = useRef(0);

  const boxW = compact ? 56 : 72;
  const limit = useCallback(
    () => Math.max(0, (track.current?.clientWidth ?? width) - boxW - 2),
    [width, boxW],
  );

  const pullText = useTransform(pullMV, (p) => fixed(Math.abs(p), 1, 5));
  const stateText = sliding ? 'slipping' : 'stuck';

  const setSlide = (v: boolean) => {
    slidingRef.current = v;
    setSliding(v);
  };

  const apply = useCallback(
    (px: number) => {
      const max = limit();
      const pull = px - x.get();
      pullMV.set(pull);

      if (!slidingRef.current) {
        if (Math.abs(pull) <= BREAK) return; // static friction holds: the body does not move
        // break-loose: the lurch is the difference between the two coefficients
        setSlide(true);
        const target = Math.max(0, Math.min(max, px - Math.sign(pull) * KINETIC));
        if (reduced) {
          x.jump(target);
          return;
        }
        anim.current?.stop();
        anim.current = animate(x, target, { ...STIFF, velocity: tracker.current.read() });
        return;
      }

      // sliding: the body trails by the kinetic lag, and re-sticks when the lag collapses
      if (Math.abs(pull) < KINETIC) {
        setSlide(false);
        return;
      }
      anim.current?.stop();
      anim.current = null;
      x.set(Math.max(0, Math.min(max, px - Math.sign(pull) * KINETIC)));
    },
    [x, pullMV, reduced, limit],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragging.current = true;
    setSlide(false);
    tracker.current.reset();
    pointerX.current = e.clientX - r.left - boxW / 2;
    tracker.current.push(x.get());
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    pointerX.current = e.clientX - r.left - boxW / 2;
    apply(pointerX.current);
    tracker.current.push(x.get());
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setSlide(false);
    pullMV.set(0);
    // no return spring, no glide: friction already took the energy
  };

  const nudge = (dir: 1 | -1) => {
    const max = limit();
    const target = Math.max(0, Math.min(max, x.get() + dir * (BREAK + KINETIC)));
    anim.current?.stop();
    if (reduced) x.jump(target);
    else anim.current = animate(x, target, STIFF);
  };

  // the demo card pushes with a real pull value; 16px stays stuck, 40px breaks loose
  useImperativeHandle(
    ref,
    () => ({
      push: (pullPx = 40) => {
        slidingRef.current = false;
        setSliding(false);
        apply(x.get() + pullPx);
        pullMV.set(pullPx);
      },
    }),
    [apply, x, pullMV],
  );

  useEffect(
    () => () => {
      anim.current?.stop();
    },
    [],
  );

  return (
    <div className={`grip${compact ? ' grip-compact' : ''} ${className ?? ''}`}>
      <div
        className="grip-track graph-bg"
        ref={track}
        style={{ height, maxWidth: width }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div
          className={`grip-box grabbable${sliding ? ' grip-slipping' : ''}`}
          style={{ x, width: boxW }}
          role="slider"
          tabIndex={0}
          aria-label={`${label} — drag; static friction holds until the pull breaks it loose`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((x.get() / Math.max(1, limit())) * 100)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              nudge(1);
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              nudge(-1);
            }
          }}
        >
          <span className="mono grip-box-label">{sliding ? 'slip' : 'stuck'}</span>
        </motion.div>
      </div>
      {readouts ? (
        <div className="grip-readouts">
          <Readout label="pull" value={pullText} unit="px" />
          <Readout label="break-loose" value={String(BREAK)} unit="px" />
          <Readout label="kinetic lag" value={String(KINETIC)} unit="px" />
          <Readout label="state" value={stateText} />
        </div>
      ) : null}
    </div>
  );
}
