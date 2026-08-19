import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * CANDIDATE — not in the registry, not installable.
 *
 * `intent`: a fixed delay is a guess. The pointer already told you.
 *
 * No open timer and no close timer. The pointer's own speed and heading decide:
 * aimed at the target and the surface opens on that frame; sweeping past at the
 * same distance and it stays shut; slowing down near it counts as arriving.
 * While it is open, a heading that still points at the surface keeps it open —
 * the diagonal trip from trigger to surface never crosses a dead zone.
 *
 * react only — no motion dependency. The decision is the component.
 */

const SLOW = 70; // px/s below which the pointer reads as arriving, not passing
const CONE = 32; // degrees of heading error still counted as aimed at the target
const REACH = 280; // px — beyond this an aimed pointer is not committed yet
const NEAR = 140; // px — inside this a slow pointer counts as dwelling

export type Verdict = 'over' | 'approaching' | 'dwelling' | 'sweeping' | 'away';

export interface IntentProps {
  label?: string;
  children: ReactNode;
  readouts?: boolean;
  compact?: boolean;
  onVerdict?: (v: Verdict) => void;
  className?: string;
}

function centerOf(el: HTMLElement | null) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
}

function inside(r: DOMRect, x: number, y: number) {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

export function Intent({
  label = 'hover me',
  children,
  readouts = true,
  compact = false,
  onVerdict,
  className,
}: IntentProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const speedOut = useRef<HTMLSpanElement>(null);
  const angleOut = useRef<HTMLSpanElement>(null);
  const verdictOut = useRef<HTMLSpanElement>(null);

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  const vel = useRef({ x: 0, y: 0 });
  const onVerdictRef = useRef(onVerdict);
  onVerdictRef.current = onVerdict;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const prev = last.current;
      last.current = { x: e.clientX, y: e.clientY, t: now };
      if (prev) {
        const dt = Math.max(0.001, (now - prev.t) / 1000);
        // exponential smoothing: one jittery sample must not flip the verdict
        vel.current = {
          x: vel.current.x * 0.6 + ((e.clientX - prev.x) / dt) * 0.4,
          y: vel.current.y * 0.6 + ((e.clientY - prev.y) / dt) * 0.4,
        };
      }

      const t = centerOf(trigger.current);
      const s = centerOf(surface.current);
      if (!t) return;

      const speed = Math.hypot(vel.current.x, vel.current.y);
      // when the surface is open the aim that matters is the aim at the surface
      const aimAt = openRef.current && s ? s : t;
      const dx = aimAt.x - e.clientX;
      const dy = aimAt.y - e.clientY;
      const distance = Math.hypot(dx, dy);

      let angle = 180;
      if (speed > 1 && distance > 1) {
        const cos = (vel.current.x * dx + vel.current.y * dy) / (speed * distance);
        angle = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
      }

      // a target three steps away subtends a wider angle than one across the room:
      // the cone that counts as "aimed" is the fixed tolerance plus the target's own size
      const spread =
        (Math.atan2(Math.max(aimAt.rect.width, aimAt.rect.height) / 2, Math.max(1, distance)) *
          180) /
        Math.PI;
      // leaving costs more than entering — an open surface holds through a wider cone
      const cone = Math.min(80, CONE + spread) * (openRef.current ? 1.5 : 1);

      const over =
        inside(t.rect, e.clientX, e.clientY) ||
        (openRef.current && s ? inside(s.rect, e.clientX, e.clientY) : false);

      let verdict: Verdict;
      if (over) verdict = 'over';
      else if (speed < SLOW && distance < NEAR) verdict = 'dwelling';
      else if (angle < cone && distance < REACH) verdict = 'approaching';
      else if (distance < REACH) verdict = 'sweeping';
      else verdict = 'away';

      const shouldOpen = verdict === 'over' || verdict === 'dwelling' || verdict === 'approaching';
      if (shouldOpen !== openRef.current) {
        openRef.current = shouldOpen;
        setOpen(shouldOpen);
      }

      if (speedOut.current) speedOut.current.textContent = speed.toFixed(0).padStart(4, ' ');
      if (angleOut.current) angleOut.current.textContent = angle.toFixed(0).padStart(3, ' ');
      if (verdictOut.current) verdictOut.current.textContent = verdict;
      onVerdictRef.current?.(verdict);
    };

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div className={`intent${compact ? ' intent-compact' : ''} ${className ?? ''}`}>
      <div className="intent-stage">
        <button
          ref={trigger}
          className="btn-mono intent-trigger"
          onFocus={() => {
            openRef.current = true;
            setOpen(true);
          }}
          onBlur={() => {
            openRef.current = false;
            setOpen(false);
          }}
          aria-describedby="intent-surface"
        >
          {label}
        </button>
        <div
          id="intent-surface"
          ref={surface}
          className={`intent-surface${open ? ' intent-open' : ''}`}
          role="tooltip"
          hidden={!open}
        >
          {children}
        </div>
      </div>
      {readouts ? (
        <div className="intent-readouts">
          <div className="readout-row">
            <span className="mono-label readout-label">pointer</span>
            <span className="readout" ref={speedOut}>
              0
            </span>
            <span className="mono readout-unit">px/s</span>
          </div>
          <div className="readout-row">
            <span className="mono-label readout-label">heading error</span>
            <span className="readout" ref={angleOut}>
              180
            </span>
            <span className="mono readout-unit">deg</span>
          </div>
          <div className="readout-row">
            <span className="mono-label readout-label">verdict</span>
            <span className="readout" ref={verdictOut}>
              away
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
