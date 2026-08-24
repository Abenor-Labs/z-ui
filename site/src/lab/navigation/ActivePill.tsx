import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useChaseTrack } from './useChaseTrack';

const ITEMS = ['Home', 'Projects', 'Writing', 'About', 'Contact'];

export function ActivePill() {
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [active, setActive] = useState(ITEMS[0]);

  const { L, width } = useChaseTrack(active, () => {
    const el = itemRefs.current.get(active);
    if (!el) return undefined;
    return { left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth };
  });

  return (
    <div className="lab-pill-nav">
      <motion.span className="lab-pill-indicator" style={{ left: L, width }} aria-hidden="true" />
      {ITEMS.map((label) => (
        <button
          key={label}
          ref={(node) => {
            if (node) itemRefs.current.set(label, node);
            else itemRefs.current.delete(label);
          }}
          className={`lab-pill-link mono${label === active ? ' lab-pill-link-active' : ''}`}
          onClick={() => setActive(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
