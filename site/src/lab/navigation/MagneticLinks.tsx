import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { useLabSpring, type LabSpringName } from '../shared/labSprings';

const LINKS = ['Work', 'Studio', 'Journal', 'Contact'];

function MagneticLink({
  label,
  pointer,
  radius,
  strength,
  spring,
}: {
  label: string;
  pointer: { x: number; y: number } | null;
  radius: number;
  strength: number;
  spring: LabSpringName;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const transition = useLabSpring(spring);

  let tx = 0;
  let ty = 0;
  if (pointer && ref.current) {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      const pull = (1 - dist / radius) * strength;
      tx = dx * pull;
      ty = dy * pull;
    }
  }

  return (
    <motion.button ref={ref} className="lab-magnetic-link mono" animate={{ x: tx, y: ty }} transition={transition}>
      <motion.span animate={{ x: tx * 0.5, y: ty * 0.5 }} transition={transition}>
        {label}
      </motion.span>
    </motion.button>
  );
}

export function MagneticLinks({
  radius = 120,
  strength = 0.6,
  spring = 'smooth',
}: {
  /** capture radius from a link's center, in px */
  radius?: number;
  /** fraction of the offset translated when the pointer sits on the center */
  strength?: number;
  spring?: LabSpringName;
}) {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const frame = useRef(0);

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setPointer({ x: clientX, y: clientY }));
  };

  return (
    <div className="lab-magnetic-field" onPointerMove={handleMove} onPointerLeave={() => setPointer(null)}>
      {LINKS.map((label) => (
        <MagneticLink key={label} label={label} pointer={pointer} radius={radius} strength={strength} spring={spring} />
      ))}
    </div>
  );
}
