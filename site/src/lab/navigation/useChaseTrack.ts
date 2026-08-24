import { useLayoutEffect, useRef } from 'react';
import { animate, useMotionValue, useTransform } from 'motion/react';
import { useSiteSpring } from '../../lib/springs';

export interface EdgeTarget {
  left: number;
  right: number;
}

/**
 * Two independently-sprung edges chasing a moving target rect, keyed by
 * `key` — the same mechanic as the product's own `chase` component. The
 * edge facing the target leaves stiff, the edge behind follows soft; the
 * gap between them is the speed, nothing scripts it.
 *
 * `measure` runs inside the layout effect (not during render) so it always
 * reads refs that have already attached, mirroring zui/Chase.tsx.
 */
export function useChaseTrack(key: string, measure: () => EdgeTarget | undefined) {
  const { stiff, soft, reduced } = useSiteSpring();
  const L = useMotionValue(0);
  const R = useMotionValue(0);
  const width = useTransform(() => Math.max(0, R.get() - L.get()));
  const seeded = useRef(false);

  useLayoutEffect(() => {
    const target = measure();
    if (!target) return;

    if (!seeded.current || reduced) {
      seeded.current = true;
      L.jump(target.left);
      R.jump(target.right);
      return;
    }

    const movingRight = target.left + target.right > L.get() + R.get();
    animate(L, target.left, { ...(movingRight ? soft : stiff), velocity: L.getVelocity() });
    animate(R, target.right, { ...(movingRight ? stiff : soft), velocity: R.getVelocity() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced]);

  return { L, R, width };
}
