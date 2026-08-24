import { useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const SLATS = 6;

export function ShutterButton() {
  const [hover, setHover] = useState(false);
  const { stiff, reduced } = useSiteSpring();

  return (
    <button className="lab-btn-shutter mono" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <span className="lab-btn-shutter-slats" aria-hidden="true">
        {Array.from({ length: SLATS }, (_, i) => (
          <motion.span
            key={i}
            className="lab-btn-shutter-slat"
            animate={{ scaleY: hover ? 1 : 0 }}
            transition={{ ...stiff, delay: reduced ? 0 : i * 0.03 }}
          />
        ))}
      </span>
      <span className="lab-btn-shutter-label">Open</span>
    </button>
  );
}
