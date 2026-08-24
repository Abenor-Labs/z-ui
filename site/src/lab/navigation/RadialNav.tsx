import { useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const ITEMS = ['N', 'E', 'S', 'W', 'NE', 'SW'];
const RADIUS = 92;

export function RadialNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(ITEMS[0]);
  const { stiff, soft } = useSiteSpring();
  const total = ITEMS.length;

  return (
    <div className="lab-radial-stage">
      <motion.div
        className="lab-radial-ring"
        initial={false}
        animate={{ rotate: open ? 0 : -50, opacity: open ? 1 : 0, scale: open ? 1 : 0.7 }}
        transition={stiff}
      >
        {ITEMS.map((label, i) => {
          const angle = (360 / total) * i - 90;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * RADIUS;
          const y = Math.sin(rad) * RADIUS;
          return (
            <button
              key={label}
              className={`lab-radial-item mono${active === label ? ' lab-radial-item-active' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              onClick={() => {
                setActive(label);
                setOpen(false);
              }}
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
            >
              {label}
            </button>
          );
        })}
      </motion.div>
      <motion.button
        className="lab-radial-hub mono"
        onClick={() => setOpen((v) => !v)}
        animate={{ scale: open ? 0.9 : 1 }}
        transition={soft}
        aria-expanded={open}
        aria-label="Toggle radial menu"
      >
        {active}
      </motion.button>
    </div>
  );
}
