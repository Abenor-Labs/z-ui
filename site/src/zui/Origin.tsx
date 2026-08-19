import { useCallback, useEffect, useRef, useState, useImperativeHandle, type ReactNode, type Ref } from 'react';
import { motion, useMotionValue, useTransform, animate, type AnimationPlaybackControls } from 'motion/react';
import { STIFF, SOFT, INSTANT } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';
import { Readout } from '../components/Readout';
import { fixed } from '../lib/format';

/**
 * CANDIDATE — not in the registry, not installable.
 *
 * `origin`: a surface opens from where you touched it, and closes toward
 * where you are now.
 *
 * The reveal is a clip-path circle anchored to the real pointer coordinate.
 * The radius runs on the stiff spring; the anchor itself runs on the soft one,
 * so a close re-aims at the pointer's current position and the centre slides
 * there while the radius collapses. Interrupt mid-open and the radius reverses
 * from where it actually is, carrying its velocity — it never restarts from the
 * point that opened it.
 */

export interface OriginHandle {
  /** open from a point inside the surface, given as 0..1 fractions of its box */
  openAt: (fx?: number, fy?: number) => void;
  close: () => void;
}

export interface OriginProps {
  ref?: Ref<OriginHandle>;
  label?: string;
  children: ReactNode;
  readouts?: boolean;
  compact?: boolean;
  className?: string;
}

export function Origin({ ref, label = 'open panel', children, readouts = true, compact = false, className }: OriginProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  const surface = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const radius = useMotionValue(0);
  const anims = useRef<AnimationPlaybackControls[]>([]);

  const clipPath = useTransform<number, string>(
    [cx, cy, radius],
    ([x, y, r]: number[]) => `circle(${Math.max(0, r)}px at ${x}px ${y}px)`,
  );

  const radiusText = useTransform(radius, (r) => fixed(Math.max(0, r), 0, 4));
  const anchorText = useTransform<number, string>(
    [cx, cy],
    ([x, y]: number[]) => `${Math.round(x)},${Math.round(y)}`,
  );

  const stopAll = useCallback(() => {
    for (const a of anims.current) a.stop();
    anims.current = [];
  }, []);

  /** distance from an anchor to the farthest corner — the radius that covers the surface */
  const coverRadius = (x: number, y: number, w: number, h: number) =>
    Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y));

  const anchorFrom = useCallback((clientX: number, clientY: number) => {
    const r = surface.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0, w: 0, h: 0 };
    return {
      x: Math.max(0, Math.min(r.width, clientX - r.left)),
      y: Math.max(0, Math.min(r.height, clientY - r.top)),
      w: r.width,
      h: r.height,
    };
  }, []);

  const run = useCallback(
    (target: number, anchor: { x: number; y: number }) => {
      const carried = radius.getVelocity();
      stopAll();
      if (reduced) {
        cx.jump(anchor.x);
        cy.jump(anchor.y);
        radius.jump(target);
        return;
      }
      anims.current = [
        // the anchor follows on the soft spring — the centre slides, it never teleports
        animate(cx, anchor.x, SOFT),
        animate(cy, anchor.y, SOFT),
        // the radius runs stiff, seeded with whatever velocity it already had
        animate(radius, target, { ...STIFF, velocity: carried }),
      ];
    },
    [cx, cy, radius, reduced, stopAll],
  );

  const openFrom = useCallback(
    (clientX: number, clientY: number) => {
      const a = anchorFrom(clientX, clientY);
      // opening always re-anchors: the surface remembers the touch that opened it
      cx.jump(a.x);
      cy.jump(a.y);
      setOpen(true);
      run(coverRadius(a.x, a.y, a.w, a.h), a);
    },
    [anchorFrom, cx, cy, run],
  );

  const close = useCallback(() => {
    const p = pointer.current;
    const rect = surface.current?.getBoundingClientRect();
    // closes toward where the pointer is NOW, not where it opened
    const a = p && rect ? anchorFrom(p.x, p.y) : { x: cx.get(), y: cy.get(), w: 0, h: 0 };
    setOpen(false);
    run(0, a);
  }, [anchorFrom, cx, cy, run]);

  // the pointer's current position is the close anchor, so it is tracked while open
  useEffect(() => {
    if (!open) return;
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  useImperativeHandle(
    ref,
    () => ({
      openAt: (fx = 0.2, fy = 0.25) => {
        const r = surface.current?.getBoundingClientRect();
        if (!r) return;
        const cxp = r.left + r.width * fx;
        const cyp = r.top + r.height * fy;
        pointer.current = { x: cxp, y: cyp };
        openFrom(cxp, cyp);
      },
      close,
    }),
    [openFrom, close],
  );

  useEffect(() => () => stopAll(), [stopAll]);

  const onTrigger = (e: React.PointerEvent) => {
    if (open) {
      // the tracked pointer is the close anchor — the press must not overwrite it
      close();
      return;
    }
    pointer.current = { x: e.clientX, y: e.clientY };
    openFrom(e.clientX, e.clientY);
  };

  /** pressing the surface dismisses it, and the collapse aims at that press */
  const onSurfacePointerDown = (e: React.PointerEvent) => {
    if (!open) return;
    pointer.current = { x: e.clientX, y: e.clientY };
    close();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (open) {
      close();
      return;
    }
    // no pointer involved: the trigger itself is the anchor
    const t = trigger.current?.getBoundingClientRect();
    if (!t) return;
    openFrom(t.left + t.width / 2, t.bottom);
  };

  return (
    <div className={`origin${compact ? ' origin-compact' : ''} ${className ?? ''}`}>
      <button
        ref={trigger}
        className="btn-mono origin-trigger"
        onPointerDown={onTrigger}
        onKeyDown={onTriggerKey}
        aria-expanded={open}
      >
        {open ? 'close' : label}
      </button>

      <div className="origin-surface" ref={surface} onPointerDown={onSurfacePointerDown}>
        <motion.div
          className="origin-clip"
          style={{ clipPath, WebkitClipPath: clipPath }}
          transition={reduced ? INSTANT : STIFF}
          aria-hidden={!open}
        >
          <div className="origin-content" inert={!open}>
            {children}
          </div>
        </motion.div>
      </div>

      {readouts ? (
        <div className="origin-readouts">
          <Readout label="radius" value={radiusText} unit="px" />
          <Readout label="anchor" value={anchorText} unit="x,y" />
        </div>
      ) : null}
    </div>
  );
}
