import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

let gooCount = 0;

export function GooeyButton() {
  const [hover, setHover] = useState(false);
  const { soft } = useSiteSpring();
  const filterId = useRef(`lab-goo-${gooCount++}`).current;

  return (
    <div className="lab-btn-gooey-wrap">
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
          </filter>
        </defs>
      </svg>
      <div className="lab-btn-gooey-goo" style={{ filter: `url(#${filterId})` }} aria-hidden="true">
        <span className="lab-btn-gooey-pill" />
        <motion.span
          className="lab-btn-gooey-blob"
          animate={{ x: hover ? 46 : 0, scale: hover ? 1 : 0.001 }}
          transition={soft}
        />
      </div>
      <button
        className="lab-btn-gooey mono"
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
      >
        Merge
      </button>
    </div>
  );
}
