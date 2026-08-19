'use client'

import * as React from 'react'
import { motion, useMotionValue, useReducedMotion } from 'motion/react'

/**
 * A knob with a flywheel in it.
 *
 * Drag it and it turns under your hand, degree for degree. Flick it and it
 * keeps going — spinning down through real friction, ticking over detents
 * while it is fast, and finally getting caught by the nearest one, which grabs
 * it with a spring and rings it to rest. Grab it mid-spin and the spin is
 * yours again, at the speed it was actually going.
 *
 * There is no timeline here. Where the needle ends up is a function of the
 * angular velocity your hand left in it, and nothing else. The same flick lands
 * on a different detent from a different starting angle, which is the property
 * that makes it feel like a machine part instead of a menu.
 *
 * Two regimes, one loop. While the wheel is fast it coasts: velocity decays
 * exponentially and the detents are terrain it passes over. When it drops below
 * the capture speed the nearest detent takes it: a spring pulls the needle in,
 * slightly underdamped, so it arrives with the small over-rotation and return
 * that a real indexed knob has. The regime switch is a speed threshold, not a
 * timer, so interrupting either phase is just… turning the knob.
 *
 * DEPENDENCIES: react, motion. Nothing else. Paste it and own it.
 */

/* ---------------------------------------------------------------- tuning -- */

/**
 * The detent spring. Engages only below CAPTURE_SPEED, so it is the arrival,
 * not the ride.
 *
 * Critical damping for stiffness 1300 is 2*sqrt(1300) ≈ 72; damping 46 is
 * deliberately under it. The overshoot this buys is a couple of degrees of
 * needle — a moving part a few pixels long, in direct response to input,
 * interruptible at any frame, tied to the value landing — which is the one
 * situation DESIGN.md permits overshoot in. Raise damping to ~72 for a knob
 * that noses into its detent without the ring.
 */
const SPRING = {
  type: 'spring',
  stiffness: 1300,
  damping: 46,
  mass: 1,
} as const

/**
 * Velocity lost to friction while coasting, per second, as an exponential
 * decay constant. 3.2 means a flick keeps ~4% of its speed after one second:
 * a hard spin crosses most of the range, a lazy one crosses a detent or two.
 * Lower is icier, higher is stiffer grease.
 */
const FRICTION = 3.2

/** Degrees per second under which the nearest detent captures the needle.
 *  Above it the wheel is still travelling and no detent has a claim on it. */
const CAPTURE_SPEED = 150

/** How much of an over-rotation past either end the needle actually shows.
 *  The rest is thrown away — the wheel is against a hard stop, and what a
 *  hard stop feels like is most of your motion not happening. */
const OVERDRAG = 0.2

/** Needle speed and remaining error below which the wheel is asleep.
 *  Degrees/second and degrees. */
const REST_SPEED = 6
const REST_DELTA = 0.25

/** The sweep of the whole range, centred on twelve o'clock. 270° is the
 *  hi-fi convention: enough travel that detents are distinct angles, with a
 *  dead quarter at the bottom so min and max cannot be confused. */
const SWEEP = 270

/**
 * Palette. CSS variables with fallbacks mixed from `currentColor`, so the knob
 * is drawn out of whatever ink the host page uses. The accent has one job:
 * the needle while the wheel is physically in motion. A knob at rest shows no
 * accent at all — including the knob that is merely *selected*.
 */
const TOKENS = {
  '--dl-line': 'var(--z-line, color-mix(in oklab, currentColor 24%, transparent))',
  '--dl-tick': 'var(--z-muted, color-mix(in oklab, currentColor 45%, transparent))',
  '--dl-face': 'var(--z-fill, color-mix(in oklab, currentColor 5%, transparent))',
  '--dl-accent': 'var(--z-accent, oklch(0.53 0.17 45))',
} as React.CSSProperties

/* ----------------------------------------------------------------- state -- */

/**
 * `data-state` values, on the root.
 *
 *   idle     — at rest on a detent; no animation frame is scheduled
 *   turning  — a pointer is on it and the needle is following the hand
 *   coasting — nobody is touching it and it is still moving
 *
 * `coasting` is the component's reason to exist: the window between your hand
 * leaving and the value landing, where the interface is doing physics rather
 * than waiting out a duration. A consumer disabling a form while the value is
 * unsettled needs exactly this distinction, and `aria-valuenow` alone cannot
 * carry it.
 */
const STATES = ['idle', 'turning', 'coasting'] as const

export type DialState = (typeof STATES)[number]

/* ------------------------------------------------------------- component -- */

export type DialProps = Omit<
  React.ComponentPropsWithRef<'div'>,
  'children' | 'onChange' | 'defaultValue'
> & {
  /** Accessible name. Required: a knob has no text of its own to borrow. */
  label: string
  min?: number
  max?: number
  /** Distance between detents, in value units. Every detent is a tick mark. */
  step?: number
  /** Uncontrolled starting value. Ignored when `value` is passed. */
  defaultValue?: number
  /** Pass to control. The needle springs to externally-set values. */
  value?: number
  /** Fires every time the needle crosses onto a different detent — during a
   *  drag and during a coast alike. This is the live reading. */
  onValueChange?: (value: number) => void
  /** Fires once, when the wheel has physically stopped on a detent. */
  onSettle?: (value: number) => void
  /** Outer size in pixels. Everything inside scales with it. */
  size?: number
}

export function Dial({
  label,
  min = 0,
  max = 10,
  step = 1,
  defaultValue,
  value: valueProp,
  onValueChange,
  onSettle,
  size = 112,
  className,
  style,
  ...rest
}: DialProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false

  const detents = Math.max(1, Math.round((max - min) / step))
  const degPerDetent = SWEEP / detents
  const toAngle = (v: number) => ((v - min) / (max - min)) * SWEEP - SWEEP / 2
  const toValue = (index: number) => min + index * step

  const initial = valueProp ?? defaultValue ?? min
  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  /**
   * The one moving part. Angle in degrees, −SWEEP/2 at min, +SWEEP/2 at max,
   * bound straight into the needle's rotation so a frame of physics is a frame
   * of paint with no React render between them.
   */
  const angle = useMotionValue(toAngle(clamp(initial)))

  const [state, setState] = React.useState<DialState>('idle')
  // The detent the needle most recently crossed onto. This is aria-valuenow
  // and the value every callback reports; the angle is presentation.
  const [detent, setDetent] = React.useState(() =>
    Math.round((toAngle(clamp(initial)) + SWEEP / 2) / degPerDetent),
  )

  const omega = React.useRef(0)
  /**
   * A commanded destination, as a detent index, or null when the wheel is on
   * its own. A flick has no goal — where it lands is physics. A keyboard step
   * and a controlled `value` DO have one, and "spring toward the nearest"
   * cannot express it: with fine detents the nearest detent to the current
   * angle is the one you are already on, and the needle would never leave.
   */
  const goal = React.useRef<number | null>(null)
  const raf = React.useRef(0)
  const last = React.useRef(0)
  // The unresisted drag angle. Displayed angle compresses what is past the
  // stops; this keeps the true position so backing off feels 1:1 again.
  const virtual = React.useRef(0)
  const pointer = React.useRef({ id: -1, angle: 0, t: 0 })
  const rootRef = React.useRef<HTMLDivElement>(null)

  const changeRef = React.useRef(onValueChange)
  const settleRef = React.useRef(onSettle)
  React.useEffect(() => {
    changeRef.current = onValueChange
    settleRef.current = onSettle
  })

  /** Report the detent under the needle, but only on the frame it changes —
   *  this is the tick of the ratchet, not a stream. */
  const report = React.useCallback(
    (a: number) => {
      const idx = Math.min(detents, Math.max(0, Math.round((a + SWEEP / 2) / degPerDetent)))
      setDetent((prev) => {
        if (prev === idx) return prev
        changeRef.current?.(toValue(idx))
        return idx
      })
      return idx
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detents, degPerDetent, min, step],
  )

  /* ------------------------------------------------------------ the loop */

  const stop = React.useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = 0
  }, [])

  const settleAt = React.useCallback(
    (idx: number) => {
      angle.set(toAngle(toValue(idx)))
      omega.current = 0
      goal.current = null
      setState('idle')
      settleRef.current?.(toValue(idx))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [angle, min, max, step],
  )

  const tick = React.useCallback(
    (now: number) => {
      raf.current = 0
      const dt = Math.min(0.032, (now - (last.current || now)) / 1000)
      last.current = now

      let a = angle.get()
      let w = omega.current
      const limit = SWEEP / 2

      const beyond = a < -limit || a > limit
      if (goal.current === null && Math.abs(w) > CAPTURE_SPEED && !beyond) {
        // Coasting. Friction is the only force; the detents are terrain.
        w *= Math.exp(-FRICTION * dt)
      } else {
        // Captured. The commanded detent if there is one; otherwise the
        // nearest — or the end stop, if the throw went past it.
        const idx =
          goal.current ??
          Math.round((Math.min(limit, Math.max(-limit, a)) + limit) / degPerDetent)
        const rest = idx * degPerDetent - limit
        const accel = -SPRING.stiffness * (a - rest) - SPRING.damping * w
        w += accel * dt

        if (Math.abs(w) < REST_SPEED && Math.abs(a - rest) < REST_DELTA) {
          report(rest)
          settleAt(idx)
          return
        }
      }

      a += w * dt
      omega.current = w
      angle.set(a)
      report(a)
      raf.current = requestAnimationFrame(tick)
    },
    [angle, degPerDetent, report, settleAt],
  )

  const kick = React.useCallback(() => {
    if (raf.current) return
    last.current = 0
    raf.current = requestAnimationFrame(tick)
  }, [tick])

  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  /* -------------------------------------------------------------- gestures */

  /** Pointer angle around the knob centre, in degrees, twelve o'clock = 0. */
  const angleOf = (e: { clientX: number; clientY: number }) => {
    const rect = rootRef.current!.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    return (Math.atan2(dx, -dy) * 180) / Math.PI
  }

  const down = (e: React.PointerEvent) => {
    if (!rootRef.current) return
    stop()
    // A hand on the knob cancels any commanded destination. The interruption
    // contract is that grabbing it mid-anything is just holding it.
    goal.current = null
    pointer.current = { id: e.pointerId, angle: angleOf(e), t: e.timeStamp }
    virtual.current = angle.get()
    omega.current = 0
    rootRef.current.setPointerCapture(e.pointerId)
    setState('turning')
  }

  const move = (e: React.PointerEvent) => {
    const p = pointer.current
    if (e.pointerId !== p.id) return

    // Relative rotation, so grabbing the knob anywhere does not snap the
    // needle to the pointer. The delta is normalised to (−180, 180] to
    // survive the pointer crossing the six o'clock line.
    const now = angleOf(e)
    let delta = now - p.angle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360

    const dt = Math.max(1, e.timeStamp - p.t) / 1000
    pointer.current = { id: p.id, angle: now, t: e.timeStamp }

    virtual.current += delta
    const limit = SWEEP / 2
    // Past the stops, most of the motion does not happen. That resistance IS
    // the stop — a wall you can feel through a mouse.
    const v = virtual.current
    const shown = v > limit ? limit + (v - limit) * OVERDRAG : v < -limit ? -limit + (v + limit) * OVERDRAG : v

    // Velocity from the pointer's own timing, lightly smoothed, so the wheel
    // keeps what the hand was really doing at release rather than one frame.
    omega.current = omega.current * 0.7 + ((shown - angle.get()) / dt) * 0.3
    angle.set(shown)
    report(shown)
  }

  const up = (e: React.PointerEvent) => {
    if (e.pointerId !== pointer.current.id) return
    pointer.current.id = -1
    try {
      rootRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }

    if (reduced) {
      /**
       * The reduced-motion path is a real path: the wheel has no flywheel.
       * Release quantises to the nearest detent on the next paint, the same
       * callbacks fire in the same order, and no frame loop ever starts.
       * Dragging itself is untouched — the needle under a hand is direct
       * manipulation, not animation.
       */
      const limit = SWEEP / 2
      const a = Math.min(limit, Math.max(-limit, angle.get()))
      const idx = Math.round((a + limit) / degPerDetent)
      report(idx * degPerDetent - limit)
      settleAt(idx)
      return
    }

    setState('coasting')
    kick()
  }

  /**
   * Keyboard turns the same wheel. An arrow key is a one-detent throw: it
   * leaves the needle just short of the target with the spring engaged, so a
   * held-down key ratchets and each step arrives the way a flick's last
   * detent does. Nothing here bypasses the physics to write the value.
   */
  const key = (e: React.KeyboardEvent) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? -1
          : 0
    const jump = e.key === 'Home' ? 0 : e.key === 'End' ? detents : null
    if (!dir && jump === null) return
    e.preventDefault()
    stop()

    const limit = SWEEP / 2
    const here = Math.round((Math.min(limit, Math.max(-limit, angle.get())) + limit) / degPerDetent)
    const idx = jump !== null ? jump : Math.min(detents, Math.max(0, here + dir))

    if (reduced) {
      report(idx * degPerDetent - limit)
      settleAt(idx)
      return
    }

    // The spring does the travel, with whatever speed the wheel already has
    // as its initial velocity — a held-down arrow key ratchets, and a step
    // pressed mid-ring keeps the ring's motion through the turn.
    goal.current = idx
    setState('coasting')
    kick()
  }

  /**
   * A controlled value change from outside is a command, not a gesture, and it
   * arrives on the same spring a keyboard step does. Ignored mid-drag: the
   * hand on the knob outranks the program behind it.
   */
  React.useEffect(() => {
    if (valueProp === undefined || state === 'turning') return
    const idx = Math.round((clamp(valueProp) - min) / step)
    if (idx === detent && state === 'idle') return
    if (reduced) {
      report(idx * degPerDetent - SWEEP / 2)
      settleAt(idx)
      return
    }
    const target = idx * degPerDetent - SWEEP / 2
    if (Math.abs(angle.get() - target) < REST_DELTA) return
    goal.current = idx
    setState('coasting')
    kick()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueProp])

  /* ------------------------------------------------------------- rendering */

  // Tick ring geometry. One tick per detent while they are legible; past 48
  // the ring thins itself out rather than fusing into a grey band.
  const every = Math.max(1, Math.ceil(detents / 48))
  const ticks: React.ReactElement[] = []
  for (let i = 0; i <= detents; i += every) {
    const a = ((i * degPerDetent - SWEEP / 2) * Math.PI) / 180
    const major = i === 0 || i === detents
    const r1 = major ? 40 : 43
    ticks.push(
      <line
        key={i}
        x1={50 + Math.sin(a) * r1}
        y1={50 - Math.cos(a) * r1}
        x2={50 + Math.sin(a) * 47}
        y2={50 - Math.cos(a) * 47}
        stroke={major ? 'var(--dl-tick)' : 'var(--dl-line)'}
        strokeWidth={major ? 2 : 1.25}
        strokeLinecap="round"
      />,
    )
  }

  return (
    <div
      ref={rootRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={toValue(detent)}
      data-state={state}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
      style={{ ...TOKENS, width: size, height: size, touchAction: 'none', ...style }}
      className={[
        'group/dl relative inline-block cursor-grab touch-none select-none active:cursor-grabbing',
        'rounded-full outline-none focus-visible:outline-2 focus-visible:outline-solid',
        'focus-visible:outline-offset-4 focus-visible:outline-[var(--dl-accent)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {/* The static plate: tick ring and face. Nothing in this SVG moves. */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        {ticks}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="var(--dl-face)"
          stroke="var(--dl-line)"
          strokeWidth="1.5"
        />
      </svg>

      {/* The needle. One element rotates and it is this one; everything else
          is chassis. Accent while physically moving, in either regime — keyed
          off the same data-state a consumer's CSS would use, which makes this
          styling the standing proof the attribute tracks reality. */}
      <motion.div
        aria-hidden="true"
        style={{ rotate: angle }}
        className="absolute inset-0 will-change-transform"
      >
        <span
          className={[
            'absolute left-1/2 top-[19%] block h-[17%] w-[3%] -translate-x-1/2 rounded-full',
            'bg-[var(--dl-tick)]',
            'group-data-[state=turning]/dl:bg-[var(--dl-accent)]',
            'group-data-[state=coasting]/dl:bg-[var(--dl-accent)]',
          ].join(' ')}
        />
      </motion.div>
    </div>
  )
}
