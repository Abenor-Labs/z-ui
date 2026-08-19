import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from 'react';

/**
 * RotaryDial — a pulse-dial telephone dial.
 *
 * Ported as given from a reference implementation handed to the project,
 * with only the minimum changes to compile under this project's strict
 * TypeScript and to expose a `dialDigit` imperative handle so the site's
 * demo-trigger buttons keep working. The mechanism, including its return
 * NOT being interruptible mid-flight, is unchanged from what was given —
 * see DESIGN.md A18 for why that stands as a recorded exception rather
 * than being silently made to match this site's usual interrupt rule.
 *
 * Mechanism, as built:
 *   The number ring is FIXED. The finger wheel rotates over it, which is why
 *   the digits stay upright and readable while you dial.
 *   Pulses are emitted on the RETURN, not the pull. A real dial's governor
 *   returns the wheel at constant angular velocity and a cam trips one pulse
 *   per 30 degrees. Digit 1 is one pulse; 0 is ten. Dialling 0 therefore takes
 *   ten times as long as dialling 1, and that asymmetry is the whole feel.
 *
 * Geometry: finger stop at 120 deg clockwise from noon. Hole for a digit of
 *   p pulses sits at (120 - 30p) deg, so 1 lands at 3 o'clock, 0 at 6 o'clock,
 *   spanning 270 deg. Matches a standard Bell-pattern dial.
 *
 * Technique note: no dependencies, no relative imports, no layout animation.
 *   Rotation is a transform; the return loop is one rAF that stops on settle.
 */

// ---- mechanism constants -------------------------------------------------
const STOP_ANGLE = 120; // finger stop, degrees clockwise from noon
const PULSE_STEP = 30; // degrees of travel per pulse
const RETURN_SPEED = 300; // deg/sec — governor speed, ~10 pulses/sec
const ENGAGE = 0.85; // fraction of travel required to register a digit

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const LETTERS: Record<number, string> = {
  2: 'ABC',
  3: 'DEF',
  4: 'GHI',
  5: 'JKL',
  6: 'MNO',
  7: 'PRS',
  8: 'TUV',
  9: 'WXY',
};

const pulsesFor = (d: number) => (d === 0 ? 10 : d);
const angleFor = (d: number) => (STOP_ANGLE - PULSE_STEP * pulsesFor(d) + 360) % 360;
const travelFor = (d: number) => PULSE_STEP * pulsesFor(d);

// polar -> cartesian, angle clockwise from noon
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const circlePath = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

// ---- mechanical click, synthesised; no assets ----------------------------
type AudioContextCtor = typeof AudioContext;
function getAudioContextCtor(): AudioContextCtor | undefined {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  );
}

function useClicker(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const click = useCallback(
    (gain = 0.5) => {
      if (!enabled) return;
      try {
        if (!ctxRef.current) {
          const AC = getAudioContextCtor();
          if (!AC) return;
          ctxRef.current = new AC();
        }
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') void ctx.resume();

        // short filtered noise burst reads as a mechanical tick
        const len = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1900;
        bp.Q.value = 1.4;

        const g = ctx.createGain();
        g.gain.value = gain;

        src.connect(bp).connect(g).connect(ctx.destination);
        src.start();
      } catch {
        /* audio is decorative; never let it break the dial */
      }
    },
    [enabled],
  );

  useEffect(
    () => () => {
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    },
    [],
  );

  return click;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

// ---- component -----------------------------------------------------------
export interface RotaryDialHandle {
  /** the same path a number key takes: spring to the stop, then the real governed return */
  dialDigit: (digit: number) => void;
}

export interface RotaryDialProps {
  ref?: Ref<RotaryDialHandle>;
  size?: number;
  sound?: boolean;
  onDigit?: (digit: number) => void;
  onPulse?: (i: number, n: number) => void;
}

export function RotaryDial({ ref, size = 320, sound = true, onDigit, onPulse }: RotaryDialProps) {
  const SZ = size;
  const C = SZ / 2;
  const PLATE_R = SZ * 0.47; // fixed backplate
  const WHEEL_R = SZ * 0.44; // rotating finger wheel
  const HOLE_ORBIT = SZ * 0.335;
  const HOLE_R = SZ * 0.072;
  const NUM_ORBIT = HOLE_ORBIT; // digits sit UNDER the holes — read through them
  const STOP_ORBIT = SZ * 0.335;

  const [rotation, setRotation] = useState(0);
  const [active, setActive] = useState<number | null>(null); // digit being dragged
  const [returning, setReturning] = useState(false);

  const reduced = useReducedMotion();
  const click = useClicker(sound);

  // refs for the drag/return loop — kept out of state to avoid re-render churn
  const rotRef = useRef(0);
  const lastPointerAngle = useRef(0);
  const activeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const setRot = useCallback((v: number) => {
    rotRef.current = v;
    setRotation(v);
  }, []);

  const pointerAngle = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(dx, -dy) * 180) / Math.PI; // clockwise from noon
  }, []);

  // ---- return stroke: constant speed, one pulse per 30deg ----------------
  const runReturn = useCallback(
    (digit: number) => {
      const travel = travelFor(digit);
      const engaged = rotRef.current >= travel * ENGAGE;
      const counted = engaged ? pulsesFor(digit) : 0;

      setReturning(true);
      let emitted = 0;
      let prev = performance.now();

      const step = (now: number) => {
        const dt = (now - prev) / 1000;
        prev = now;
        let next = rotRef.current - RETURN_SPEED * dt;
        if (next <= 0) next = 0;

        // pulses trip as the cam passes each 30deg boundary on the way back
        if (counted) {
          const shouldHave = counted - Math.floor(next / PULSE_STEP);
          while (emitted < shouldHave && emitted < counted) {
            emitted++;
            click(0.45);
            onPulse?.(emitted, counted);
          }
        }

        setRot(next);

        if (next > 0) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          setReturning(false);
          setActive(null);
          activeRef.current = null;
          if (engaged) onDigit?.(digit);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [click, onDigit, onPulse, setRot],
  );

  // ---- pointer drag ------------------------------------------------------
  const onPointerDown = useCallback(
    (digit: number) => (e: ReactPointerEvent) => {
      if (returning || activeRef.current !== null) return;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      activeRef.current = digit;
      setActive(digit);
      lastPointerAngle.current = pointerAngle(e);
      click(0.25);
    },
    [returning, pointerAngle, click],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const digit = activeRef.current;
      if (digit === null || returning) return;

      const now = pointerAngle(e);
      let delta = now - lastPointerAngle.current;
      // unwrap across the +/-180 seam so large travels accumulate correctly
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastPointerAngle.current = now;

      const max = travelFor(digit);
      const next = Math.min(max, Math.max(0, rotRef.current + delta));

      // tick as the wheel passes each pulse boundary on the way out
      if (Math.floor(next / PULSE_STEP) !== Math.floor(rotRef.current / PULSE_STEP)) {
        click(0.16);
      }
      setRot(next);
    },
    [returning, pointerAngle, click, setRot],
  );

  const onPointerUp = useCallback(() => {
    const digit = activeRef.current;
    if (digit === null || returning) return;
    runReturn(digit);
  }, [returning, runReturn]);

  // ---- keyboard: same mechanism, no pointer required ---------------------
  const onKeyDown = useCallback(
    (digit: number) => (e: ReactKeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (returning || activeRef.current !== null) return;

      if (reduced) {
        click(0.4);
        onDigit?.(digit);
        return;
      }
      activeRef.current = digit;
      setActive(digit);
      setRot(travelFor(digit)); // snap to the stop, then run the real return
      runReturn(digit);
    },
    [returning, reduced, click, onDigit, runReturn, setRot],
  );

  // the same path a number key takes — exposed so a demo card's trigger
  // button can fire a real dial the same way pressing "5" would
  const dialDigit = useCallback(
    (digit: number) => {
      if (returning || activeRef.current !== null) return;
      if (reduced) {
        click(0.4);
        onDigit?.(digit);
        return;
      }
      activeRef.current = digit;
      setActive(digit);
      setRot(travelFor(digit));
      runReturn(digit);
    },
    [returning, reduced, click, onDigit, runReturn, setRot],
  );

  useImperativeHandle(ref, () => ({ dialDigit }), [dialDigit]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  const wheelPath = useMemo(() => {
    let d = circlePath(C, C, WHEEL_R);
    for (const digit of DIGITS) {
      const p = polar(C, C, HOLE_ORBIT, angleFor(digit));
      d += ' ' + circlePath(p.x, p.y, HOLE_R);
    }
    return d;
  }, [C, WHEEL_R, HOLE_ORBIT, HOLE_R]);

  return (
    <svg
      ref={svgRef}
      width={SZ}
      height={SZ}
      viewBox={`0 0 ${SZ} ${SZ}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: 'none', display: 'block' }}
      role="group"
      aria-label="Rotary telephone dial"
    >
      <defs>
        <radialGradient id="rd-plate" cx="36%" cy="28%">
          <stop offset="0%" stopColor="#f3ead2" />
          <stop offset="60%" stopColor="#ded2b4" />
          <stop offset="100%" stopColor="#b9ab8a" />
        </radialGradient>
        <radialGradient id="rd-wheel" cx="34%" cy="26%">
          <stop offset="0%" stopColor="#35343a" />
          <stop offset="55%" stopColor="#232228" />
          <stop offset="100%" stopColor="#141317" />
        </radialGradient>
        <radialGradient id="rd-hub" cx="38%" cy="30%">
          <stop offset="0%" stopColor="#d8d2c4" />
          <stop offset="60%" stopColor="#a9a294" />
          <stop offset="100%" stopColor="#6d675c" />
        </radialGradient>
        <filter id="rd-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* fixed backplate */}
      <circle cx={C} cy={C} r={PLATE_R} fill="url(#rd-plate)" />
      <circle cx={C} cy={C} r={PLATE_R} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />

      {/* FIXED number ring — does not rotate, which is why it stays readable */}
      <g style={{ pointerEvents: 'none' }}>
        {DIGITS.map((digit) => {
          const c = polar(C, C, NUM_ORBIT, angleFor(digit));
          const hasLetters = Boolean(LETTERS[digit]);
          return (
            <g key={digit}>
              {hasLetters && (
                <text
                  x={c.x}
                  y={c.y - HOLE_R * 0.44}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={SZ * 0.026}
                  letterSpacing={SZ * 0.005}
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fill="rgba(24,22,20,.72)"
                  style={{ userSelect: 'none' }}
                >
                  {LETTERS[digit]}
                </text>
              )}
              <text
                x={c.x}
                y={c.y + (hasLetters ? HOLE_R * 0.22 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={SZ * 0.062}
                fontFamily="Georgia, 'Times New Roman', serif"
                fill="#1a1816"
                style={{ userSelect: 'none' }}
              >
                {digit}
              </text>
            </g>
          );
        })}
      </g>

      {/* rotating finger wheel — holes punched with even-odd */}
      <g transform={`rotate(${rotation} ${C} ${C})`}>
        <path d={wheelPath} fillRule="evenodd" fill="url(#rd-wheel)" filter="url(#rd-shadow)" />
        <path d={wheelPath} fillRule="evenodd" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1" />

        {/* hit targets ride with the wheel */}
        {DIGITS.map((digit) => {
          const p = polar(C, C, HOLE_ORBIT, angleFor(digit));
          const isActive = active === digit;
          return (
            <circle
              key={digit}
              cx={p.x}
              cy={p.y}
              r={HOLE_R}
              fill={isActive ? 'rgba(255,220,140,.16)' : 'transparent'}
              stroke={isActive ? 'rgba(255,214,120,.85)' : 'transparent'}
              strokeWidth="2"
              tabIndex={0}
              role="button"
              aria-label={`Dial ${digit}`}
              onPointerDown={onPointerDown(digit)}
              onKeyDown={onKeyDown(digit)}
              style={{ cursor: returning ? 'default' : 'grab', outline: 'none' }}
            />
          );
        })}
      </g>

      {/* finger stop — mounted to the frame at the rim, hooks inward over the
          wheel. The wheel turns clockwise into this and can go no further. */}
      <g style={{ pointerEvents: 'none' }} transform={`rotate(${STOP_ANGLE} ${C} ${C})`}>
        <path
          d={`M ${C - SZ * 0.026} ${C - PLATE_R - SZ * 0.012}
              L ${C + SZ * 0.026} ${C - PLATE_R - SZ * 0.012}
              L ${C + SZ * 0.02} ${C - STOP_ORBIT + SZ * 0.03}
              Q ${C} ${C - STOP_ORBIT + SZ * 0.056} ${C - SZ * 0.02} ${C - STOP_ORBIT + SZ * 0.03}
              Z`}
          fill="#cdc5b2"
          stroke="rgba(0,0,0,.5)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d={`M ${C - SZ * 0.01} ${C - PLATE_R - SZ * 0.006}
              L ${C - SZ * 0.006} ${C - STOP_ORBIT + SZ * 0.034}`}
          stroke="rgba(255,255,255,.55)"
          strokeWidth="1.5"
          fill="none"
        />
      </g>

      {/* hub */}
      <circle cx={C} cy={C} r={SZ * 0.085} fill="url(#rd-hub)" />
      <circle cx={C} cy={C} r={SZ * 0.03} fill="#2a2a2e" />
    </svg>
  );
}
