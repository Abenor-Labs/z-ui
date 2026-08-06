'use client'

import * as React from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import type { Transition } from 'motion/react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { springs, useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * A seek bar whose precision depends on how far the pointer has travelled away
 * from the track.
 *
 * On the track, dragging is one-to-one. Pull away and the same horizontal
 * movement covers proportionally less of the range, so a two-hour video can be
 * placed to the second without ever letting go. iOS has done this for years and
 * the web has almost entirely ignored it.
 *
 * Two things distinguish this from the iOS behaviour it borrows. The falloff is
 * continuous rather than four discrete tiers, so there is no perceptible step
 * where the ratio changes under your finger. And the handle is a spring
 * following the value rather than the value itself, so on a fast drag the
 * handle visibly trails and catches up — the only part of this component that a
 * duration-and-easing implementation cannot reproduce, because it needs a
 * velocity that easings do not have.
 *
 * The states are pure interaction. There is no value dimension to multiply
 * against, because a position is not a mode. `scrubbing-fine` is a genuinely
 * separate state rather than a flag on `scrubbing`: consumers style the two
 * differently, and it is the moment the component is doing the thing it exists
 * for.
 *
 * Keys here match `meta.states` in component.json exactly. That is checked in
 * CI, not merely a convention.
 */
const STATES = ['idle', 'hover', 'scrubbing', 'scrubbing-fine', 'settling'] as const

export type ScrubState = (typeof STATES)[number]

// `satisfies`, not an annotation: it proves every state has a variant and no
// extras appear, while leaving the literal types intact for motion.
const trackVariants = {
  'idle': { scaleY: 1 },
  'hover': { scaleY: 1.6 },
  'scrubbing': { scaleY: 1.6 },
  'scrubbing-fine': { scaleY: 1.6 },
  'settling': { scaleY: 1 },
} satisfies Record<ScrubState, object>

const knobVariants = {
  'idle': { scale: 1 },
  'hover': { scale: 1.3 },
  'scrubbing': { scale: 1.65 },
  'scrubbing-fine': { scale: 1.65 },
  'settling': { scale: 1.15 },
} satisfies Record<ScrubState, object>

const readoutVariants = {
  'idle': { opacity: 0, y: 3 },
  'hover': { opacity: 0, y: 3 },
  'scrubbing': { opacity: 0, y: 3 },
  'scrubbing-fine': { opacity: 1, y: 0 },
  'settling': { opacity: 0, y: 3 },
} satisfies Record<ScrubState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type ScrubProps = Omit<React.ComponentPropsWithoutRef<'div'>, MotionConflicts> & {
  style?: React.CSSProperties
  /** Controlled position, 0 to 1. Passing this hands control to you. */
  value?: number
  /** Initial position when uncontrolled. */
  defaultValue?: number
  /** Fires on every change, including each frame of a drag. */
  onValueChange?: (value: number) => void
  /**
   * Fires once, when the gesture ends and the value has stopped moving.
   * Seek on this, not on `onValueChange`, unless you want a request per frame.
   */
  onValueCommit?: (value: number) => void
  /** Loaded-ahead portion, 0 to 1. Omit to hide the buffer bar. */
  buffered?: number
  /**
   * Pixels of vertical travel that halve the drag ratio. Lower is more
   * aggressive. 45 puts 1:4 within comfortable thumb reach.
   */
  falloff?: number
  /** Let a flick keep travelling after release. */
  momentum?: boolean
  /** Spring driving the handle's chase. A preset name, or any Transition. */
  spring?: SpringName | Transition
  /** Renders the accessible value. Defaults to a percentage. */
  formatValue?: (value: number) => string
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function Scrub({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  onValueCommit,
  buffered,
  falloff = 45,
  momentum = true,
  spring = 'settle',
  formatValue = (v) => `${Math.round(v * 100)}%`,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Seek',
  ref,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  ...props
}: ScrubProps) {
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
  })

  const [hovered, setHovered] = React.useState(false)
  const [scrubbing, setScrubbing] = React.useState(false)
  const [fine, setFine] = React.useState(false)
  const [settling, setSettling] = React.useState(false)
  const transition = useZTransition(spring)

  const state: ScrubState = scrubbing
    ? fine
      ? 'scrubbing-fine'
      : 'scrubbing'
    : settling
      ? 'settling'
      : hovered
        ? 'hover'
        : 'idle'

  const trackRef = React.useRef<HTMLDivElement>(null)

  // The position is a motion value rather than React state, so a drag paints at
  // the compositor's rate instead of re-rendering the tree sixty times a second.
  const target = useMotionValue(value)
  const cfg = typeof spring === 'string' ? springs[spring] : springs.settle
  // The handle chases the value. On a fast drag it trails and catches up, and
  // that lag is the only part of this component an easing cannot produce.
  const shown = useSpring(target, { stiffness: cfg.stiffness, damping: cfg.damping, mass: cfg.mass })

  // What one-to-one dragging would have reached, kept so the component can show
  // the gap that fine control opened up.
  const ghost = useMotionValue(value)
  const ratio = useMotionValue(1)

  React.useEffect(() => {
    target.set(value)
    ghost.set(value)
  }, [value, target, ghost])

  const drag = React.useRef({ x: 0, velocity: 0, raf: 0 })

  const commit = React.useCallback(
    (next: number) => {
      const v = clamp(next)
      target.set(v)
      setValue(v)
      return v
    },
    [setValue, target],
  )

  const stopMomentum = React.useCallback(() => {
    if (drag.current.raf) cancelAnimationFrame(drag.current.raf)
    drag.current.raf = 0
  }, [])

  React.useEffect(() => stopMomentum, [stopMomentum])

  return (
    <motion.div
      ref={ref}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={formatValue(value)}
      aria-disabled={disabled || undefined}
      data-state={disabled ? 'idle' : state}
      initial={false}
      className={zcn(
        // The vertical padding is the hit target and the precision axis at once:
        // 20px either side of a 4px track is 44px, and it is also the room the
        // pointer needs to pull away into.
        'relative w-full cursor-grab touch-none py-5 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2',
        'active:cursor-grabbing',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
      onPointerEnter={(e) => {
        setHovered(true)
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        setHovered(false)
        onPointerLeave?.(e)
      }}
      onPointerDown={(e) => {
        if (disabled) return
        stopMomentum()
        setSettling(false)
        e.currentTarget.setPointerCapture(e.pointerId)
        const rect = trackRef.current?.getBoundingClientRect()
        if (rect) {
          const next = commit((e.clientX - rect.left) / rect.width)
          ghost.set(next)
        }
        drag.current.x = e.clientX
        drag.current.velocity = 0
        ratio.set(1)
        setFine(false)
        setScrubbing(true)
        onPointerDown?.(e)
      }}
      onPointerMove={(e) => {
        if (!scrubbing) return onPointerMove?.(e)
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect) return
        const away = Math.abs(e.clientY - (rect.top + rect.height / 2))
        // Continuous, deliberately not tiered. There is no step to feel.
        const r = 1 / (1 + away / falloff)
        ratio.set(r)
        setFine(r < 0.92)

        const dx = e.clientX - drag.current.x
        drag.current.x = e.clientX
        const step = dx / rect.width
        drag.current.velocity = step * r * 60
        ghost.set(clamp(ghost.get() + step))
        commit(target.get() + step * r)
        onPointerMove?.(e)
      }}
      onPointerUp={(e) => {
        if (!scrubbing) return onPointerUp?.(e)
        setScrubbing(false)
        setFine(false)
        const v0 = drag.current.velocity
        onPointerUp?.(e)

        if (!momentum || Math.abs(v0) < 0.02) {
          onValueCommit?.(target.get())
          return
        }
        // A flick keeps travelling and decays, so the gesture ends where the
        // hand meant rather than where it happened to stop.
        setSettling(true)
        let v = v0
        let last = performance.now()
        const tick = (now: number) => {
          const dt = Math.min(0.05, (now - last) / 1000)
          last = now
          const next = clamp(target.get() + v * dt)
          target.set(next)
          setValue(next)
          v *= Math.pow(0.04, dt)
          if (Math.abs(v) > 0.004 && next > 0 && next < 1) {
            drag.current.raf = requestAnimationFrame(tick)
          } else {
            drag.current.raf = 0
            setSettling(false)
            onValueCommit?.(next)
          }
        }
        drag.current.raf = requestAnimationFrame(tick)
      }}
      onKeyDown={(e) => {
        if (disabled) return onKeyDown?.(e)
        const step = e.shiftKey ? 0.002 : 0.02
        let next: number | null = null
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + step
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - step
        else if (e.key === 'PageUp') next = value + 0.1
        else if (e.key === 'PageDown') next = value - 0.1
        else if (e.key === 'Home') next = 0
        else if (e.key === 'End') next = 1
        if (next === null) return onKeyDown?.(e)
        e.preventDefault()
        const v = commit(next)
        ghost.set(v)
        onValueCommit?.(v)
        onKeyDown?.(e)
      }}
      {...props}
    >
      {/* the ratio, which only speaks once fine control is changing the answer */}
      <motion.span
        aria-hidden
        initial={false}
        animate={state}
        variants={readoutVariants}
        transition={transition}
        className="pointer-events-none absolute inset-x-0 top-0 text-center font-mono text-[0.6875rem] tracking-wide"
      >
        <RatioLabel ratio={ratio} />
      </motion.span>

      <motion.div
        ref={trackRef}
        initial={false}
        animate={state}
        variants={trackVariants}
        transition={transition}
        className="relative h-1 w-full origin-center rounded-full bg-current/20"
      >
        {buffered !== undefined ? (
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-full bg-current/25"
            style={{ width: `${clamp(buffered) * 100}%` }}
          />
        ) : null}

        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-0 origin-left rounded-full bg-current"
          style={{ scaleX: shown, width: '100%' }}
        />

        {/* where one-to-one dragging would have landed — the gap is the point */}
        <motion.span
          aria-hidden
          initial={false}
          animate={state}
          variants={readoutVariants}
          transition={transition}
          className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-current/50"
          style={{ left: useTrackOffset(ghost) }}
        />

        <motion.span
          aria-hidden
          initial={false}
          animate={state}
          variants={knobVariants}
          transition={transition}
          className="absolute top-1/2 size-3 rounded-full bg-current"
          style={{ left: useTrackOffset(shown), translateX: '-50%', translateY: '-50%' }}
        />
      </motion.div>
    </motion.div>
  )
}

/** Maps a 0..1 motion value onto the track without a render pass. */
function useTrackOffset(v: ReturnType<typeof useMotionValue<number>>) {
  const pct = useMotionValue('0%')
  React.useEffect(() => {
    const write = (n: number) => pct.set(`${clamp(n) * 100}%`)
    write(v.get())
    return v.on('change', write)
  }, [v, pct])
  return pct
}

function RatioLabel({ ratio }: { ratio: ReturnType<typeof useMotionValue<number>> }) {
  const [text, setText] = React.useState('1 : 1')
  React.useEffect(
    () => ratio.on('change', (r) => setText(`1 : ${(1 / Math.max(r, 0.001)).toFixed(1)}`)),
    [ratio],
  )
  return <>{text}</>
}
