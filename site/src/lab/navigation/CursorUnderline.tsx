import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useChaseTrack } from './useChaseTrack';

const LINKS = ['Overview', 'Field notes', 'Archive', 'Contact'];

export function CursorUnderline() {
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [active, setActive] = useState(LINKS[0]);
  const [hovered, setHovered] = useState<string | null>(null);
  const shown = hovered ?? active;

  const { L, width } = useChaseTrack(shown, () => {
    const el = itemRefs.current.get(shown);
    if (!el) return undefined;
    return { left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth };
  });

  return (
    <div className="lab-underline-nav" onPointerLeave={() => setHovered(null)}>
      {LINKS.map((label) => (
        <button
          key={label}
          ref={(node) => {
            if (node) itemRefs.current.set(label, node);
            else itemRefs.current.delete(label);
          }}
          className={`lab-underline-link mono${label === active ? ' lab-underline-link-active' : ''}`}
          onPointerEnter={() => setHovered(label)}
          onFocus={() => setHovered(label)}
          onBlur={() => setHovered(null)}
          onClick={() => setActive(label)}
        >
          {label}
        </button>
      ))}
      <motion.span className="lab-underline-bar" style={{ left: L, width }} aria-hidden="true" />
    </div>
  );
}
