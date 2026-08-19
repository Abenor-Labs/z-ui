import { useCallback, useEffect, useRef, useState } from 'react';
import type { Sample } from '../components/SpringGraph';

/**
 * Ring buffer of (t, v) samples + a low-cost live view for SpringGraph.
 * Pushes are free (ref only); the React state view refreshes on rAF and
 * only when the buffer actually advanced.
 */
export function useLiveSamples(windowSec = 3.2) {
  const buf = useRef<Sample[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);

  const push = useCallback(
    (t: number, v: number) => {
      buf.current.push({ t, v });
      const cut = t - windowSec;
      while (buf.current.length && buf.current[0].t < cut) buf.current.shift();
    },
    [windowSec],
  );

  useEffect(() => {
    let raf = 0;
    let lastT = -1;
    const loop = () => {
      const b = buf.current;
      const lt = b.length ? b[b.length - 1].t : -1;
      if (lt !== lastT) {
        lastT = lt;
        setSamples([...b]);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { push, samples };
}
