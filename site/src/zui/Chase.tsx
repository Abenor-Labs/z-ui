import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useSiteSpring } from '../lib/springs';

/**
 * Faithful site reimplementation of the registry's `chase`:
 * a segmented control whose indicator gives chase. The edge facing the
 * target leaves on a stiff spring; the edge behind follows on a soft one.
 * The visible stretch between the two edges IS the speed — nothing scripts
 * the squash, it emerges from the two independent springs.
 *
 * Spring constants here are the site's motion identity (stiff 1300/46,
 * soft 300/30) — the registry component ships its own hand-tuned pair.
 */

export interface ChaseOption {
  value: string;
  label: string;
}

export function Chase({
  options,
  value,
  onChange,
  annotateFirstMove = false,
  className,
  label = 'Filter',
}: {
  options: ChaseOption[];
  value: string;
  onChange: (v: string) => void;
  /** hairline + mono label pointing at the emergent stretch, once */
  annotateFirstMove?: boolean;
  className?: string;
  /** accessible name for the tablist — this control is reused beyond the filter */
  label?: string;
}) {
  const { stiff, soft, reduced } = useSiteSpring();
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  const L = useMotionValue(0);
  const R = useMotionValue(0);
  const width = useTransform(() => Math.max(0, R.get() - L.get()));
  const measured = useRef(false);
  const [annotation, setAnnotation] = useState<'idle' | 'showing' | 'done'>('idle');
  const annotationTimer = useRef(0);

  useLayoutEffect(() => {
    const el = itemRefs.current.get(value);
    if (!el) return;
    const targetL = el.offsetLeft;
    const targetR = el.offsetLeft + el.offsetWidth;

    if (!measured.current || reduced) {
      measured.current = true;
      L.jump(targetL);
      R.jump(targetR);
      return;
    }

    const movingRight = targetL + targetR > L.get() + R.get();
    // the edge facing the target leaves stiff; the edge behind follows soft
    animate(L, targetL, {
      ...(movingRight ? soft : stiff),
      velocity: L.getVelocity(),
    });
    animate(R, targetR, {
      ...(movingRight ? stiff : soft),
      velocity: R.getVelocity(),
    });

    if (annotateFirstMove && annotation === 'idle') {
      setAnnotation('showing');
      annotationTimer.current = window.setTimeout(() => setAnnotation('done'), 3200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  // re-seat on real container resize only (measurement, not motion) —
  // RO fires once on observe, which must not clobber a live animation
  const valueRef = useRef(value);
  valueRef.current = value;
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let lastW = list.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (list.offsetWidth === lastW) return;
      lastW = list.offsetWidth;
      const el = itemRefs.current.get(valueRef.current);
      if (!el) return;
      L.jump(el.offsetLeft);
      R.jump(el.offsetLeft + el.offsetWidth);
    });
    ro.observe(list);
    return () => ro.disconnect();
  }, [L, R]);

  useLayoutEffect(() => () => window.clearTimeout(annotationTimer.current), []);

  return (
    <div className={`chase-wrap ${className ?? ''}`}>
      <div className="chase" ref={listRef} role="tablist" aria-label={label}>
        <motion.div className="chase-indicator" style={{ left: L, width }} aria-hidden="true" />
        {options.map((o) => (
          <button
            key={o.value}
            ref={(el) => {
              if (el) itemRefs.current.set(o.value, el);
              else itemRefs.current.delete(o.value);
            }}
            role="tab"
            aria-selected={o.value === value}
            className={`chase-item mono${o.value === value ? ' chase-item-active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {annotation === 'showing' ? (
          <motion.div
            className="chase-annotation"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={soft}
          >
            <span className="chase-annotation-line" aria-hidden="true" />
            <span className="mono chase-annotation-text">
              stretch = two springs disagreeing · leading 1300/46 · trailing 300/30 · nothing
              scripted
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
