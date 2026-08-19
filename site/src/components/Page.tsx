import { Children, useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../lib/springs';

/**
 * Route transition: content settles in on the stiff spring with a 30ms
 * stagger down the ruled sections — an instrument powering on, not a fade.
 * Transform + opacity together, never opacity alone. Fully interruptible
 * (AnimatePresence re-targets mid-flight).
 */
export function Page({ title, children }: { title?: string; children: ReactNode }) {
  const { stiff, reduced } = useSiteSpring();

  useEffect(() => {
    document.title = title ? `${title} — Z-UI` : 'Z-UI — Micro-animations you own.';
  }, [title]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const items = Children.toArray(children);

  return (
    <motion.main
      className="page"
      exit={reduced ? undefined : { opacity: 0, y: -10 }}
      transition={stiff}
    >
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { ...stiff, delay: i * 0.03 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.main>
  );
}
