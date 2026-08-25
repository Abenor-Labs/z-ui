import { useCallback, useEffect, useRef, useState } from 'react';
import { useScramble } from '@z-ui/registry/scramble-reveal/scramble-reveal';
import { useReducedMotion } from '../lib/useReducedMotion';

/**
 * Animated wordmark: an SVG "Z" that rotates and draws on hover, paired with
 * character-scramble text.
 *
 * Ported from the reference, with one substitution: the reference hand-rolls a
 * scramble with its own rAF loop and glyph pool, and this registry ships
 * `scramble-reveal`. The mark runs on `useScramble` — the exact hook behind the
 * component the CLI installs. A site claiming every demo is the real component
 * cannot keep a private copy of one in its own logo.
 *
 * It is also the more correct loop. The reference advances `progress` by 1/3
 * per rAF tick, so it decodes twice as fast on a 120Hz display as on 60Hz. The
 * shipped hook is time-based, cancels cleanly on unmount, and already honours
 * prefers-reduced-motion.
 */

/** `M6 5h12L6 19h12` — 12 + √(12² + 14²) + 12 ≈ 42.4. */
const Z_PATH = 'M6 5h12L6 19h12';
const Z_LEN = 43;

export function LogoMark({ label = 'Z-UI' }: { label?: string }) {
  const reduced = useReducedMotion();
  const { text, run, ref } = useScramble<HTMLSpanElement>({ text: label });

  const [hovered, setHovered] = useState(false);
  /** Bumped per run, keyed onto the path so the draw replays each hover. */
  const [draw, setDraw] = useState(0);
  /** Drives the hover state from script rather than from a pointer. */
  const [demo, setDemo] = useState(false);
  const mounted = useRef(false);

  const play = useCallback(() => {
    if (reduced) return;
    run();
    setDraw((n) => n + 1);
  }, [reduced, run]);

  /**
   * On first load the mark performs its own hover, once.
   *
   * An affordance nobody discovers is not an affordance. The scramble and the
   * draw already fired on mount, but the rotation is the most visible part and
   * it was hover-only, so the one thing that announces "this moves" was the
   * one thing a visitor never saw until they happened to point at it.
   *
   * It runs the real thing rather than an imitation: the same state the
   * pointer sets, released again after the beat. There-and-back, because a
   * half turn that stays turned is a different mark, not a demonstration.
   *
   * 300ms in, so it does not land under the first paint and read as a glitch.
   * The ref guard is for StrictMode's double-invoke, which would otherwise
   * race two decodes on the first frame.
   */
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (reduced) return;

    const start = window.setTimeout(() => {
      play();
      setDemo(true);
    }, 300);
    const end = window.setTimeout(() => setDemo(false), 1300);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [play, reduced]);

  return (
    <span
      className={`logomark${demo ? ' logomark-demo' : ''}`}
      onPointerEnter={() => {
        setHovered(true);
        play();
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <span className="logomark-plate">
        {/* A flat signal wash where the reference had a gradient. DESIGN.md
            forbids gradients; at 32px the two are indistinguishable, so the
            rule stands and the effect survives. */}
        <span className="logomark-wash" aria-hidden="true" />

        <svg viewBox="0 0 24 24" className="logomark-z" fill="none" aria-hidden="true">
          <path
            key={draw}
            d={Z_PATH}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            className={(hovered || demo) && !reduced ? 'logomark-stroke' : undefined}
            style={{ strokeDasharray: Z_LEN }}
          />
        </svg>
      </span>

      <span className="logomark-lockup">
        <span ref={ref} className="logomark-text">
          {text}
        </span>
        <span className="mono logomark-version">v0.1</span>
      </span>
    </span>
  );
}
