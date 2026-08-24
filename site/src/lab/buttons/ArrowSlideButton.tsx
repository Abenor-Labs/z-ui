import { useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

export function ArrowSlideButton() {
  const [hover, setHover] = useState(false);
  const { stiff } = useSiteSpring();

  return (
    <button className="lab-btn-arrow mono" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <span>Continue</span>
      <span className="lab-btn-arrow-track" aria-hidden="true">
        <motion.span
          className="lab-btn-arrow-glyph"
          animate={{ x: hover ? 22 : 0, opacity: hover ? 0 : 1 }}
          transition={stiff}
        >
          →
        </motion.span>
        <motion.span
          className="lab-btn-arrow-glyph lab-btn-arrow-glyph-b"
          animate={{ x: hover ? 0 : -22, opacity: hover ? 1 : 0 }}
          transition={stiff}
        >
          →
        </motion.span>
      </span>
    </button>
  );
}
