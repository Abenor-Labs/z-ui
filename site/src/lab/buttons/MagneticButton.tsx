import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { useLabSpring, type LabSpringName } from '../shared/labSprings';
import { useMagneticField } from '../shared/useMagneticOffset';

export function MagneticButton({
  radius = 110,
  strength = 0.5,
  depth = 0.6,
  spring = 'smooth',
}: {
  /** capture radius from the button's own bounds, in px */
  radius?: number;
  /** fraction of the offset the button itself moves */
  strength?: number;
  /** how much further the inner label leans than the button edge — the depth cue */
  depth?: number;
  spring?: LabSpringName;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const transition = useLabSpring(spring);
  const { computeOffset, throttledMove } = useMagneticField(radius, strength);
  const offset = computeOffset(ref.current, pointer);

  return (
    <div
      className="lab-btn-field"
      onPointerMove={(e: ReactPointerEvent<HTMLDivElement>) => throttledMove(e, setPointer)}
      onPointerLeave={() => setPointer(null)}
    >
      <motion.button
        ref={ref}
        className="lab-btn-magnetic mono"
        animate={{ x: offset.x, y: offset.y }}
        transition={transition}
      >
        <motion.span animate={{ x: offset.x * depth, y: offset.y * depth }} transition={transition}>
          Hover me
        </motion.span>
      </motion.button>
    </div>
  );
}
