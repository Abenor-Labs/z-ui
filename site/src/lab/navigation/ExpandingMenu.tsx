import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const ITEMS = ['Overview', 'Capabilities', 'Pricing', 'Changelog', 'Contact'];

export function ExpandingMenu() {
  const [open, setOpen] = useState(false);
  const { stiff, soft, reduced } = useSiteSpring();

  return (
    <div className="lab-expand-wrap">
      <motion.div
        layout
        className="lab-expand-panel"
        animate={{ borderRadius: open ? 14 : 999 }}
        transition={stiff}
      >
        <motion.button
          layout
          className="lab-expand-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <motion.span
            className="lab-expand-bar"
            animate={{ rotate: open ? 45 : 0, y: open ? 0 : -5 }}
            transition={stiff}
          />
          <motion.span className="lab-expand-bar" animate={{ opacity: open ? 0 : 1 }} transition={soft} />
          <motion.span
            className="lab-expand-bar"
            animate={{ rotate: open ? -45 : 0, y: open ? 0 : 5 }}
            transition={stiff}
          />
        </motion.button>

        <AnimatePresence mode="popLayout">
          {open ? (
            <motion.ul layout className="lab-expand-list">
              {ITEMS.map((label, i) => (
                <motion.li
                  key={label}
                  initial={reduced ? false : { opacity: 0, y: 10, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduced ? undefined : { opacity: 0, y: -6, filter: 'blur(6px)' }}
                  transition={{ ...soft, delay: reduced ? 0 : i * 0.04 }}
                >
                  <button className="lab-expand-item mono">{label}</button>
                </motion.li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
