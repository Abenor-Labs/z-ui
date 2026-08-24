import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

export function CursorFollowButton() {
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
    <button
      ref={ref}
      className="lab-btn-follow mono"
      onPointerMove={handleMove}
      onPointerLeave={() => setPos(null)}
    >
      <motion.span
        className="lab-btn-follow-dot"
        animate={{ opacity: pos ? 1 : 0, x: (pos?.x ?? 0) - 6, y: (pos?.y ?? 0) - 6 }}
        transition={stiff}
        aria-hidden="true"
      />
      <span className="lab-btn-follow-label">Track me</span>
    </button>
  );
}
