import { useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const LABEL = 'EXPLORE';

export function SplitTextButton() {
  const [hover, setHover] = useState(false);
  const { stiff, reduced } = useSiteSpring();
  const chars = LABEL.split('');

  return (
    <button className="lab-btn-split mono" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <span className="lab-btn-split-row">
        {chars.map((ch, i) => (
          <motion.span
            key={`a-${i}`}
            className="lab-btn-split-ch"
            animate={{ y: hover ? '-100%' : '0%' }}
            transition={{ ...stiff, delay: reduced ? 0 : i * 0.02 }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
      <span className="lab-btn-split-row lab-btn-split-row-b" aria-hidden="true">
        {chars.map((ch, i) => (
          <motion.span
            key={`b-${i}`}
            className="lab-btn-split-ch"
            animate={{ y: hover ? '0%' : '100%' }}
            transition={{ ...stiff, delay: reduced ? 0 : i * 0.02 }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
    </button>
  );
}
