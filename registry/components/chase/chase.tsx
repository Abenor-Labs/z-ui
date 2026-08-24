'use client'

import * as React from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import './chase.css'

/**
 * A segmented control whose indicator gives chase.
 *
 * The pill under the selected option is not one thing that slides — it is two
 * edges with different masses. The edge facing the target leaves first, on a
 * stiff spring; the edge behind it follows on a soft one. While they disagree
 * the pill is stretched, and how stretched is exactly how fast it is going;
 * when they agree again it has landed, with the trailing edge's small
 * overshoot as the touch-down.
 *
 * Nothing scripts that squash. There is no keyframe with `scaleX` in it and no
 * duration to tune — the deformation is the disagreement between two springs,
 * so it is larger over long jumps, smaller over short ones, and it reverses
 * correctly when you change your mind mid-flight: select a third option while
 * the pill is travelling and both edges retarget with the velocity they
 * already have. The stretch through the turn is whatever the physics says it
 * is, which is why it never looks canned.
 *
 * DEPENDENCIES: react, motion. Nothing else. Paste it and own it. Styling
 * ships beside this file as chase.css — fallback values render standalone,
 * --z-* custom properties adopt a host palette.
 */

/* ---------------------------------------------------------------- tuning -- */

/**
 * The two edges. LEAD is the edge facing the direction of travel, TRAIL the
 * one behind. The gap between their stiffnesses is the whole effect: equal
 * springs make a rigid pill that merely slides; too far apart and the pill
 * tears — the lead edge arrives while the trail is still most of a segment
 * away, which reads as two objects.
 *
 * TRAIL sits under its critical damping (2*sqrt(380) ≈ 39) on purpose: the
 * few pixels of overshoot on the trailing edge are the landing. It is a moving
 * part well under 48px of travel by the time it overshoots, in direct response
 * to input, interruptible, tied to the selection change — the four conditions
 * DESIGN.md sets for overshoot, met by construction.
 */
const SPRING_LEAD = {
  type: 'spring',
  stiffness: 950,
  damping: 62,
  mass: 1,
  restDelta: 0.5,
  restSpeed: 5,
} as const

const SPRING_TRAIL = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 1,
  restDelta: 0.5,
  restSpeed: 5,
} as const

/**
 * Palette. CSS variables with fallbacks mixed from `currentColor`, so the
 * control is drawn out of the host page's own ink. The accent appears on one
 * thing: the pill's boundary while the pill is physically travelling. A
 * selected-and-resting pill is not accented — selection is a resting state,
 * and the accent marks motion.
 */
const TOKENS = {
  '--chs-line': 'var(--z-line, color-mix(in oklab, currentColor 20%, transparent))',
  '--chs-fill': 'var(--z-fill, color-mix(in oklab, currentColor 8%, transparent))',
  '--chs-muted': 'var(--z-muted, color-mix(in oklab, currentColor 58%, transparent))',
  '--chs-accent': 'var(--z-accent, oklch(0.53 0.17 45))',
  '--chs-radius': 'var(--z-radius, 999px)',
} as React.CSSProperties

/* ----------------------------------------------------------------- state -- */

/**
 * `data-state` values, on the root.
 *
 *   idle    — both edges at rest under the selected option
 *   moving  — at least one edge still has somewhere to be
 *
 * One moving state rather than a per-direction pair: unlike a disclosure,
 * direction here is not something a consumer sequences off — but the moment of
 * arrival is, and `moving → idle` is that moment, reported by the springs
 * themselves finishing rather than by a timer's guess.
 */
const STATES = ['idle', 'moving'] as const

export type ChaseState = (typeof STATES)[number]

export type ChaseOption = {
  value: string
  label: React.ReactNode
}

/* ------------------------------------------------------------- component -- */

export type ChaseProps = Omit<
  React.ComponentPropsWithRef<'div'>,
  'children' | 'onChange' | 'defaultValue'
> & {
  /** Accessible name for the group. Required: the options label themselves,
   *  the control as a whole has no text to borrow. */
  label: string
  options: ChaseOption[]
  /** Uncontrolled starting selection. Ignored when `value` is passed. */
  defaultValue?: string
  /** Pass to control. Omit and the component owns its own state. */
  value?: string
  /** Fires the instant a different option is chosen, before anything moves. */
  onValueChange?: (value: string) => void
  /** Fires when the pill has physically stopped under the selection. */
  onSettle?: (value: string) => void
}

export function Chase({
  label,
  options,
  defaultValue,
  value: valueProp,
  onValueChange,
  onSettle,
  className,
  style,
  ...rest
}: ChaseProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false

  const [uncontrolled, setUncontrolled] = React.useState(
    defaultValue ?? options[0]?.value ?? '',
  )
  const selected = valueProp ?? uncontrolled

  // Set only by both springs completing, or by the reduced-motion path
  // standing in for them. Never by a timeout.
  const [settled, setSettled] = React.useState(true)
  const state: ChaseState = settled ? 'idle' : 'moving'

  const listRef = React.useRef<HTMLDivElement>(null)
  const buttons = React.useRef(new Map<string, HTMLButtonElement>())

  /**
   * The two moving parts. Everything painted — position, width, and therefore
   * the stretch — is derived from these two numbers, so there is nothing else
   * to keep in agreement with them.
   */
  const leftEdge = useMotionValue(0)
  const rightEdge = useMotionValue(0)
  const width = useTransform(() => Math.max(0, rightEdge.get() - leftEdge.get()))

  const settleRef = React.useRef(onSettle)
  React.useEffect(() => {
    settleRef.current = onSettle
  })

  /** Increments per transition, so a completion belonging to an interrupted
   *  run cannot report the arrival of the run that replaced it. */
  const run = React.useRef(0)
  const started = React.useRef(false)
  const controls = React.useRef<{ stop: () => void }[]>([])

  const edgesOf = (value: string) => {
    const el = buttons.current.get(value)
    if (!el) return null
    return { left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth }
  }

  useIsoLayoutEffect(() => {
    const target = edgesOf(selected)
    if (!target) return

    // First commit is a starting position, not an interaction: the pill is
    // already under the default option and nothing animates or reports.
    if (!started.current) {
      started.current = true
      leftEdge.jump(target.left)
      rightEdge.jump(target.right)
      return
    }

    // Re-render that moved nothing — a parent re-render, a callback identity
    // change. Without this bail a controlled consumer re-rendering on every
    // keystroke would restart a finished transition's bookkeeping.
    if (Math.abs(leftEdge.get() - target.left) < 0.5 && Math.abs(rightEdge.get() - target.right) < 0.5) {
      return
    }

    const id = ++run.current

    if (reduced) {
      /**
       * A real path, not a fast animation: the pill simply is under the new
       * option on the next paint, `data-state` never passes through `moving`,
       * and `onSettle` still fires so nothing sequencing off it hangs for
       * precisely the people who asked for less motion.
       */
      leftEdge.jump(target.left)
      rightEdge.jump(target.right)
      setSettled(true)
      settleRef.current?.(selected)
      return
    }

    setSettled(false)

    // The edge facing the travel leads; the other trails. Travel direction is
    // read from the pill's own current position, not from option indices, so
    // an interruption mid-flight assigns the springs correctly for where the
    // pill actually is rather than where it was last at rest. Both springs
    // start from the velocity they already have — reversing mid-flight keeps
    // the momentum, which is what makes the reversal read as physical.
    const movingRight = target.left + target.right > leftEdge.get() + rightEdge.get()
    let done = 0
    const arrive = () => {
      if (run.current !== id) return
      done++
      if (done < 2) return
      setSettled(true)
      settleRef.current?.(selected)
    }

    controls.current.forEach((c) => c.stop())
    controls.current = [
      animate(leftEdge, target.left, {
        ...(movingRight ? SPRING_TRAIL : SPRING_LEAD),
        velocity: leftEdge.getVelocity(),
        onComplete: arrive,
      }),
      animate(rightEdge, target.right, {
        ...(movingRight ? SPRING_LEAD : SPRING_TRAIL),
        velocity: rightEdge.getVelocity(),
        onComplete: arrive,
      }),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, reduced])

  React.useEffect(() => () => controls.current.forEach((c) => c.stop()), [])

  /**
   * Reflow — a resize, a font arriving, an option label changing. A jump, not
   * an animation: nothing was selected, so nothing should travel. Deferred
   * while a transition is in flight, because during one the springs own the
   * edges and this would fight them.
   */
  React.useEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new ResizeObserver(() => {
      if (!settled) return
      const target = edgesOf(selected)
      if (!target) return
      leftEdge.jump(target.left)
      rightEdge.jump(target.right)
    })
    observer.observe(list)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, settled])

  const choose = (value: string) => {
    if (value === selected) return
    if (valueProp === undefined) setUncontrolled(value)
    onValueChange?.(value)
  }

  /** The radiogroup keyboard contract: arrows move selection and focus
   *  together, wrapping at the ends. Selection follows focus, so the pill —
   *  and its physics — is the visible answer to the keypress. */
  const key = (e: React.KeyboardEvent) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!dir) return
    e.preventDefault()
    const idx = options.findIndex((o) => o.value === selected)
    const next = options[(idx + dir + options.length) % options.length]
    if (!next) return
    choose(next.value)
    buttons.current.get(next.value)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-state={state}
      onKeyDown={key}
      ref={listRef}
      style={{ ...TOKENS, ...style }}
      className={['chs', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {/* The pill. Behind the labels, drawn entirely from the two edges. Its
          boundary lights while it travels and goes quiet when it lands —
          keyed off the same data-state a consumer's CSS would match, which
          makes this styling the standing proof the attribute tracks reality. */}
      <motion.span aria-hidden="true" style={{ x: leftEdge, width }} className="chs-pill" />

      {options.map((o) => {
        const isSelected = o.value === selected
        return (
          <button
            key={o.value}
            ref={(el) => {
              if (el) buttons.current.set(o.value, el)
              else buttons.current.delete(o.value)
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => choose(o.value)}
            className="chs-option"
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Measurement must land before paint or the mount frame shows the pill at
 * width zero in the corner. On the server there is no layout to measure, so
 * fall back rather than trip React's useLayoutEffect warning.
 */
const useIsoLayoutEffect = typeof document === 'undefined' ? React.useEffect : React.useLayoutEffect
