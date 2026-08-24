import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

export interface MagneticOffset {
  x: number;
  y: number;
}

/**
 * Pointer-proximity offset for magnetic hover effects: zero outside `radius`
 * of the element's own bounds, otherwise a fraction of the pointer's
 * distance from center, scaled by `strength`. The caller owns the spring —
 * this hook only measures the field and rAF-throttles the pointer read.
 */
export function useMagneticField(radius = 90, strength = 0.45) {
  const frame = useRef(0);

  function computeOffset(el: HTMLElement | null, pointer: { x: number; y: number } | null): MagneticOffset {
    if (!pointer || !el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist >= radius) return { x: 0, y: 0 };
    const pull = (1 - dist / radius) * strength;
    return { x: dx * pull, y: dy * pull };
  }

  function throttledMove(e: ReactPointerEvent<HTMLElement>, onMove: (p: { x: number; y: number }) => void) {
    if (e.pointerType === 'touch') return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => onMove({ x: clientX, y: clientY }));
  }

  return { computeOffset, throttledMove };
}
