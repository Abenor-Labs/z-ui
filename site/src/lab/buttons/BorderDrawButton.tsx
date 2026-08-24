import { useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

export function BorderDrawButton() {
  const [hover, setHover] = useState(false);
  const { soft } = useSiteSpring();

  return (
    <button className="lab-btn-border-draw mono" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <svg className="lab-btn-border-draw-svg" aria-hidden="true">
        <motion.rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          initial={false}
          animate={{ pathLength: hover ? 1 : 0 }}
          transition={soft}
        />
      </svg>
      <span>Outline</span>
    </button>
  );
}
