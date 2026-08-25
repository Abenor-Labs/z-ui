import { useEffect, useRef, useState, useImperativeHandle, type Ref } from 'react';
import { useMotionValue, useTransform } from 'motion/react';
import { HoldDrain } from '@z-ui/registry/hold-drain/hold-drain';
import { Readout } from './Readout';

/**
 * Demo chrome around the promoted `hold-drain` control.
 *
 * The button is the exact file the CLI installs. What the registry does not
 * ship — live fill/rate readouts, the reset chip, and the `hold()` replay that
 * drives demo cards — lives here, sampled from the outside: the fill element's
 * painted width and the root's own `data-state` are the only things this
 * wrapper reads. Kept out of the component on purpose; none of it survives the
 * install.
 */

export interface HoldDrainDemoHandle {
  /** hold for `ms`, then release — via the keyboard path, so the component's own handlers run */
  hold: (ms?: number) => void;
  /**
   * Remount the control back to `idle`.
   *
   * `committed` is a one-shot guard in the shipped component — it returns
   * early on every press once it is set, which is correct for a confirm button
   * and fatal for anything replaying it on a loop. A remount is the registry's
   * own reset story, so this is the same escape the reset chip uses.
   */
  reset: () => void;
}

export function HoldDrainDemo({
  ref,
  duration = 1600,
  label = 'hold to confirm',
  /**
   * The shipped component falls back `committedLabel ?? armedLabel ?? label`,
   * so passing only `label` means the button says the same thing while idle,
   * while armed, and after it has fired. "Confirmed." exists in the component
   * already — but only in the visually-hidden aria-live region, which meant
   * every sighted visitor watched a hold complete and change nothing. These
   * two defaults put the state a screen reader was already being told on the
   * face of the button.
   */
  armedLabel = 'release to confirm',
  committedLabel = 'confirmed',
  readouts = true,
  compact = false,
  focusOnHold = true,
}: {
  ref?: Ref<HoldDrainDemoHandle>;
  /** ms to fill — also the time a full drain takes */
  duration?: number;
  label?: string;
  armedLabel?: string;
  committedLabel?: string;
  readouts?: boolean;
  compact?: boolean;
  /**
   * Whether `hold()` focuses the button first. On a demo card that is right —
   * the focus ring is part of what is being shown. Inside the aria-hidden
   * hover preview it is not: nothing there is reachable, and pulling focus
   * into it every few seconds would move it off whatever the reader was
   * actually on. The dispatched key events bubble to React either way, so
   * focus was never load-bearing for the replay.
   */
  focusOnHold?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLElement | null>(null);
  const [committed, setCommitted] = useState(false);
  /** Bumped by `reset()`. A counter rather than a boolean flip, so a reset
   *  still remounts when the control never reached `committed`. */
  const [generation, setGeneration] = useState(0);

  const fill = useMotionValue(0); // 0..100, sampled
  const rateMV = useMotionValue(0); // %/s, derived
  const fillText = useTransform(fill, (f) => f.toFixed(1));
  const rateText = useTransform(rateMV, (r) =>
    r > 0 ? `+${r.toFixed(1)}` : r < 0 ? r.toFixed(1) : '0.0',
  );

  // Sample the shipped component's painted state once per frame while it moves.
  useEffect(() => {
    let raf = 0;
    let lastT = performance.now();
    let lastFill = 0;

    const loop = (now: number) => {
      const btn = hostRef.current?.querySelector<HTMLButtonElement>('button[data-state]');
      if (btn && fillRef.current) {
        const state = btn.dataset.state ?? 'idle';
        const track = btn.getBoundingClientRect();
        const bar = fillRef.current.getBoundingClientRect();
        const pct = track.width > 0 ? Math.max(0, Math.min(100, (bar.width / track.width) * 100)) : 0;
        const dt = Math.max(0.001, (now - lastT) / 1000);
        const moving = state === 'filling' || state === 'draining';
        const rate = moving ? ((pct - lastFill) / dt) | 0 : 0;
        fill.set(pct);
        rateMV.set(moving ? Math.abs(rate) * (state === 'draining' ? -1 : 1) : 0);
        lastFill = pct;
      }
      lastT = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fill, rateMV]);

  // capture the fill span once rendered
  const setHost = (el: HTMLDivElement | null) => {
    hostRef.current = el;
    fillRef.current = el?.querySelector<HTMLElement>('.hd-fill') ?? null;
  };

  const holdTimer = useRef(0);
  useImperativeHandle(
    ref,
    () => ({
      hold: (ms = 700) => {
        const btn = hostRef.current?.querySelector<HTMLButtonElement>('button[data-state]');
        if (!btn) return;
        if (focusOnHold) btn.focus();
        // The keyboard path runs the component's own handlers: keydown fills,
        // keyup releases (or commits when armed). Synthetic pointer events
        // would trip the pointer-capture call for a pointer that does not exist.
        btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        window.clearTimeout(holdTimer.current);
        holdTimer.current = window.setTimeout(() => {
          btn.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
        }, ms);
      },
      reset: () => {
        window.clearTimeout(holdTimer.current);
        setCommitted(false);
        setGeneration((g) => g + 1);
      },
    }),
    [focusOnHold],
  );

  return (
    <div className={`holddrain${compact ? ' holddrain-compact' : ''}`} ref={setHost}>
      {/* keyed remount is the registry's own reset story for a committed guard */}
      <HoldDrain
        key={`${duration}-${generation}-${committed ? 'c' : 'i'}`}
        label={label}
        armedLabel={armedLabel}
        committedLabel={committedLabel}
        duration={duration}
        onConfirm={() => setCommitted(true)}
      />
      {readouts ? (
        <div className="holddrain-readouts">
          <Readout label="fill" value={fillText} unit="%" />
          <Readout label="rate" value={rateText} unit="%/s" />
          {committed ? (
            <button className="mono holddrain-reset" onClick={() => setCommitted(false)}>
              reset
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
