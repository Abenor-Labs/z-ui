import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { STIFFNESS, DAMPING } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';

/**
 * Faithful site reimplementation of the registry's `disclosure`:
 * a panel whose height is an interruptible spring. Press again mid-open and
 * it reverses from wherever it currently is, carrying the velocity it
 * already had — no snap-back to a default curve.
 *
 * API mirrors the real component's shape: uncontrolled by default,
 * `open` / `onOpenChange` for apps that need real control.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  onHeightSample,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** telemetry for the height-over-time graph: (tSeconds, heightPx) */
  onHeightSample?: (t: number, h: number) => void;
}) {
  const reduced = useReducedMotion();
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;

  const h = useMotionValue(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  const sampleRef = useRef(onHeightSample);
  sampleRef.current = onHeightSample;

  useEffect(() => {
    return h.on('change', (v) => sampleRef.current?.(performance.now() / 1000, v));
  }, [h]);

  const measure = useCallback(() => contentRef.current?.scrollHeight ?? 0, []);

  const settle = useCallback(
    (target: number) => {
      if (reduced) {
        h.jump(target);
        return;
      }
      // same MotionValue re-targeted mid-flight: velocity carries over — that IS the component
      animate(h, target, {
        type: 'spring',
        stiffness: STIFFNESS,
        damping: DAMPING,
        velocity: h.getVelocity(),
      });
    },
    [h, reduced],
  );

  useEffect(() => {
    const target = open ? measure() : 0;
    if (!mounted.current) {
      mounted.current = true;
      h.jump(target);
      return;
    }
    settle(target);
  }, [open, h, measure, settle]);

  // content resize while open → re-target (measurement, not a new animation curve)
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (open) settle(measure());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, measure, settle]);

  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  return (
    <div className="disclosure">
      <button className="disclosure-head" onClick={toggle} aria-expanded={open}>
        <motion.span
          className="disclosure-marker mono"
          animate={{ rotate: open ? 45 : 0 }}
          transition={
            reduced ? { duration: 0 } : { type: 'spring', stiffness: STIFFNESS, damping: DAMPING }
          }
          aria-hidden="true"
        >
          +
        </motion.span>
        <span className="disclosure-title">{title}</span>
      </button>
      <motion.div className="disclosure-clip" style={{ height: h }}>
        <div ref={contentRef} className="disclosure-content">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
