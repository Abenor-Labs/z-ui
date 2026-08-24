import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

const DOCK = ['Home', 'Docs', 'Blog', 'Mail', 'Search', 'Files'];
const TOOLTIP_THRESHOLD = 1.2;

export function DockNav({
  maxScale = 1.7,
  radius = 70,
  spread = 1,
}: {
  /** peak icon scale at the cursor's exact center */
  maxScale?: number;
  /** px of influence on either side of an icon's center */
  radius?: number;
  /**
   * shape of the falloff curve: 1 is the original cosine ease. Below 1,
   * neighbours pick up more of the bump (a wider, softer peak); above 1,
   * the peak narrows and neighbours barely move (a sharper, more isolated one).
   */
  spread?: number;
}) {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const frame = useRef(0);
  const { soft } = useSiteSpring();

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const x = e.clientX;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setMouseX(x));
  };

  // one measurement pass for every icon, so the tooltip decision (which icon
  // is nearest) uses the same numbers the scale itself is built from
  const metrics = DOCK.map((_, i) => {
    const el = refs.current[i];
    if (mouseX === null || !el) return { scale: 1, lift: 0, dist: Infinity };
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(mouseX - center);
    const linear = Math.max(0, 1 - dist / radius);
    const eased = Math.sin((linear ** spread * Math.PI) / 2); // cosine ease-out — spread bends how fast neighbors fall off
    return { scale: 1 + eased * (maxScale - 1), lift: eased * -14, dist };
  });

  let peak = -1;
  let peakDist = Infinity;
  metrics.forEach((m, i) => {
    if (m.dist < peakDist) {
      peakDist = m.dist;
      peak = i;
    }
  });

  return (
    <div className="lab-dock" onPointerMove={handleMove} onPointerLeave={() => setMouseX(null)}>
      {DOCK.map((label, i) => {
        const showTooltip = i === peak && metrics[i].scale > TOOLTIP_THRESHOLD;
        return (
          <div className="lab-dock-item" key={label}>
            <motion.button
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="lab-dock-icon mono"
              animate={{ scale: metrics[i].scale, y: metrics[i].lift }}
              transition={soft}
              style={{ originY: 1 }}
            >
              {label.slice(0, 1)}
            </motion.button>
            <motion.span
              className="lab-dock-tooltip mono"
              animate={{ opacity: showTooltip ? 1 : 0, y: showTooltip ? 0 : 6 }}
              transition={soft}
            >
              {label}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
