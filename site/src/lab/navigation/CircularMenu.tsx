import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const ITEMS = ['Home', 'Search', 'Notify', 'Profile', 'Settings'];
const RADIUS = 96;
const START_ANGLE = -150;
const END_ANGLE = -30;

export function CircularMenu() {
  const [open, setOpen] = useState(false);
  const { stiff, soft, reduced } = useSiteSpring();
  const total = ITEMS.length;

  return (
    <div className="lab-circular-stage">
      <AnimatePresence>
        {open
          ? ITEMS.map((label, i) => {
              const angle =
                total === 1 ? (START_ANGLE + END_ANGLE) / 2 : START_ANGLE + ((END_ANGLE - START_ANGLE) * i) / (total - 1);
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * RADIUS;
              const y = Math.sin(rad) * RADIUS;
              return (
                <motion.button
                  key={label}
                  className="lab-circular-item mono"
                  initial={reduced ? false : { x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  transition={{ ...soft, delay: reduced ? 0 : i * 0.035 }}
                  title={label}
                  onClick={() => setOpen(false)}
                >
                  {label.slice(0, 1)}
                </motion.button>
              );
            })
          : null}
      </AnimatePresence>
      <motion.button
        className="lab-circular-hub mono"
        onClick={() => setOpen((v) => !v)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={stiff}
        aria-expanded={open}
        aria-label="Toggle menu"
      >
        +
      </motion.button>
    </div>
  );
}
