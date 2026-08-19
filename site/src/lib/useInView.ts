import { useEffect, useRef, useState, type RefObject } from 'react';

/** One-shot IntersectionObserver: fires true once, then disconnects. */
export function useInView<T extends Element>(threshold = 0.4): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, threshold]);

  return [ref, seen];
}
