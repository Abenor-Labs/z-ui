import { useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const LABEL = 'Fill me up';

export function LiquidFillButton() {
  const [hover, setHover] = useState(false);
  const { soft } = useSiteSpring();

  return (
    <button className="lab-btn-liquid mono" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <motion.span
        className="lab-btn-liquid-fill"
        initial={false}
        animate={{ scaleY: hover ? 1 : 0 }}
        transition={soft}
        aria-hidden="true"
      />
      <span className="lab-btn-liquid-label lab-btn-liquid-label-a">{LABEL}</span>
      <motion.span
        className="lab-btn-liquid-label lab-btn-liquid-label-b"
        initial={false}
        animate={{ clipPath: hover ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }}
        transition={soft}
        aria-hidden="true"
      >
        {LABEL}
      </motion.span>
    </button>
  );
}
