import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../../lib/useReducedMotion';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function RippleButton({
  speedMs = 500,
  maxScale = 14,
  fadeMs = 500,
}: {
  /** how long the ring takes to reach maxScale, in ms */
  speedMs?: number;
  /** peak ring scale, relative to its ~10px starting size */
  maxScale?: number;
  /** how long the ring takes to fade to transparent, in ms — independent of speed */
  fadeMs?: number;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const reduced = useReducedMotion();

  const spawn = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = nextId.current++;
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  return (
    <button className="lab-btn-ripple mono" onPointerDown={spawn}>
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="lab-btn-ripple-ring"
            style={{ left: r.x, top: r.y }}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: maxScale, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    scale: { duration: speedMs / 1000, ease: 'easeOut' },
                    opacity: { duration: fadeMs / 1000, ease: 'linear' },
                  }
            }
            onAnimationComplete={() => setRipples((cur) => cur.filter((x) => x.id !== r.id))}
            aria-hidden="true"
          />
        ))}
      </AnimatePresence>
      <span className="lab-btn-ripple-label">Click anywhere</span>
    </button>
  );
}
