import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const LABEL = 'Inspect';

export function SpotlightButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const { stiff } = useSiteSpring();
  const frame = useRef(0);

  const handleMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setPos({ x, y }));
  };

  return (
    <button ref={ref} className="lab-btn-spotlight mono" onPointerMove={handleMove} onPointerLeave={() => setPos(null)}>
      <span className="lab-btn-spotlight-label lab-btn-spotlight-label-a">{LABEL}</span>
      <motion.span
        className="lab-btn-spotlight-mask"
        initial={false}
        animate={{ clipPath: pos ? `circle(38px at ${pos.x}px ${pos.y}px)` : 'circle(0px at 50% 50%)' }}
        transition={stiff}
        aria-hidden="true"
      >
        <span className="lab-btn-spotlight-label lab-btn-spotlight-label-b">{LABEL}</span>
      </motion.span>
    </button>
  );
}
