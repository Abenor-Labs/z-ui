import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

export function ExpandingCircleButton() {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const { soft } = useSiteSpring();

  const handleEnter = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <button className="lab-btn-expand-circle mono" onPointerEnter={handleEnter} onPointerLeave={() => setOrigin(null)}>
      <AnimatePresence>
        {origin ? (
          <motion.span
            key="fill"
            className="lab-btn-expand-circle-fill"
            style={{ left: origin.x, top: origin.y }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 40, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={soft}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>
      <span className="lab-btn-expand-circle-label">Reveal</span>
    </button>
  );
}
