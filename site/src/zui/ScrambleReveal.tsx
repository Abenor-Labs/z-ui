import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from '../lib/useInView';
import { useReducedMotion } from '../lib/useReducedMotion';

/**
 * Faithful site reimplementation of the registry's `scramble-reveal`:
 * text decodes out of random glyphs — on hover, on mount, or the first time
 * it scrolls into view. Runs once per trigger, never loops.
 * Needs: react only (no motion dependency) — true here as well.
 */

const GLYPHS = '#/\\<>[]{}=+*%0123456789';

function scrambled(text: string): string {
  return Array.from(text, (c) =>
    c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
  ).join('');
}

export interface ScrambleRevealProps {
  text: string;
  trigger?: 'hover' | 'mount' | 'in-view';
  className?: string;
  /** total decode time scales mildly with length around this base (ms) */
  baseDuration?: number;
}

export function ScrambleReveal({
  text,
  trigger = 'mount',
  className,
  baseDuration = 380,
}: ScrambleRevealProps) {
  const reduced = useReducedMotion();
  // resting state is encoded — for every trigger. Decoding is the event.
  const [display, setDisplay] = useState(() => scrambled(text));
  const raf = useRef(0);
  const running = useRef(false);
  const [inViewRef, seen] = useInView<HTMLSpanElement>(0.1);

  const run = useCallback(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }
    if (running.current) return;
    running.current = true;
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const D = baseDuration + text.length * 14;
    // chars lock left-to-right with jitter
    const locks = Array.from(
      text,
      (_, i) => (i / Math.max(1, text.length)) * D * 0.55 + Math.random() * D * 0.45,
    );
    const step = (now: number) => {
      const t = now - start;
      let out = '';
      let done = true;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === ' ' || t >= locks[i]) {
          out += c;
        } else {
          done = false;
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setDisplay(out);
      if (!done) {
        raf.current = requestAnimationFrame(step);
      } else {
        running.current = false;
      }
    };
    raf.current = requestAnimationFrame(step);
  }, [text, reduced, baseDuration]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    if (trigger === 'mount') run();
  }, [trigger, run]);

  useEffect(() => {
    if (trigger === 'in-view' && seen) run();
  }, [trigger, seen, run]);

  useEffect(() => {
    if (reduced) setDisplay(text);
  }, [reduced, text]);

  // hover trigger: leaving re-encodes, so the next hover decodes again
  const reEncode = () => {
    if (reduced) return;
    cancelAnimationFrame(raf.current);
    running.current = false;
    setDisplay(scrambled(text));
  };

  // handlers live on a wrapper whose hit target never mutates; the inner span's
  // per-frame text replacement must not be able to fire spurious enter/leave
  return (
    <span
      ref={trigger === 'in-view' ? inViewRef : undefined}
      className={className}
      onPointerEnter={trigger === 'hover' ? run : undefined}
      onPointerLeave={trigger === 'hover' ? reEncode : undefined}
      onFocus={trigger === 'hover' ? run : undefined}
      onBlur={trigger === 'hover' ? reEncode : undefined}
      tabIndex={trigger === 'hover' ? 0 : undefined}
      aria-label={text}
      role="text"
    >
      <span style={{ pointerEvents: 'none' }} aria-hidden="true">
        {display}
      </span>
    </span>
  );
}
