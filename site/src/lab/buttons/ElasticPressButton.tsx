import { useState } from 'react';
import { motion } from 'motion/react';
import { useLabSpring, type LabSpringName } from '../shared/labSprings';

export function ElasticPressButton({
  depth = 0.5,
  spring = 'smooth',
  contactShadow = true,
}: {
  /** 0 (no squash) to 1 (max squash) */
  depth?: number;
  spring?: LabSpringName;
  /** the project's own pressed-state convention — a hard 1px-offset shadow, on by default */
  contactShadow?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const transition = useLabSpring(spring);

  const scaleX = pressed ? 1 + depth * 0.24 : 1;
  const scaleY = pressed ? 1 - depth * 0.3 : 1;

  return (
    <motion.button
      className={`lab-btn-elastic mono${pressed && contactShadow ? ' contact' : ''}`}
      animate={{ scaleX, scaleY }}
      transition={transition}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      Press and hold
    </motion.button>
  );
}
