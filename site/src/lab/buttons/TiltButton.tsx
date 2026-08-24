import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

export function TiltButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const { soft } = useSiteSpring();
  const frame = useRef(0);

  const handleMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setTilt({ rx: py * -14, ry: px * 14 }));
  };

  return (
    <div className="lab-btn-tilt-stage">
      <motion.button
        ref={ref}
        className="lab-btn-tilt mono"
        style={{ transformPerspective: 480 }}
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry, scale: tilt.rx || tilt.ry ? 1.04 : 1 }}
        transition={soft}
        onPointerMove={handleMove}
        onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
      >
        Tilt me
      </motion.button>
    </div>
  );
}
