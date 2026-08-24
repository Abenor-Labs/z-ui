import { useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const COLS = 8;
const ROWS = 3;
const TILES = COLS * ROWS;

export function PixelRevealButton() {
  const [hover, setHover] = useState(false);
  const { soft, reduced } = useSiteSpring();

  return (
    <button className="lab-btn-pixel mono" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <span className="lab-btn-pixel-grid" aria-hidden="true">
        {Array.from({ length: TILES }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const delay = reduced ? 0 : (col + row) * 0.012;
          return (
            <motion.span
              key={i}
              className="lab-btn-pixel-tile"
              animate={{ scaleX: hover ? 1 : 0 }}
              transition={{ ...soft, delay }}
            />
          );
        })}
      </span>
      <span className="lab-btn-pixel-label">Decode</span>
    </button>
  );
}
