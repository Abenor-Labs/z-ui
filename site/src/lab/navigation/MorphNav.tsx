import { useState } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const ITEMS = [
  { key: 'home', label: 'Home', note: 'Back to the start' },
  { key: 'work', label: 'Work', note: 'Selected projects' },
  { key: 'notes', label: 'Notes', note: 'Field notes, in progress' },
  { key: 'contact', label: 'Contact', note: 'Say something' },
];

export function MorphNav() {
  const [expanded, setExpanded] = useState(false);
  const { stiff, soft, reduced } = useSiteSpring();

  return (
    <LayoutGroup>
      <motion.button
        layout
        className={`lab-morph-nav mono${expanded ? ' lab-morph-nav-expanded' : ''}`}
        onClick={() => setExpanded((v) => !v)}
        animate={{ borderRadius: expanded ? 10 : 999 }}
        transition={stiff}
        aria-expanded={expanded}
      >
        {ITEMS.map(({ key, label, note }) => (
          <motion.div layout key={key} className="lab-morph-item" transition={stiff}>
            <motion.span layout className="lab-morph-mono mono" transition={stiff}>
              {label.slice(0, 1)}
            </motion.span>
            <motion.span layout className="lab-morph-label mono" transition={stiff}>
              {label}
            </motion.span>
            {expanded ? (
              <motion.span
                className="lab-morph-note"
                initial={reduced ? false : { opacity: 0, y: 6, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ...soft, delay: reduced ? 0 : 0.08 }}
              >
                {note}
              </motion.span>
            ) : null}
          </motion.div>
        ))}
      </motion.button>
    </LayoutGroup>
  );
}
