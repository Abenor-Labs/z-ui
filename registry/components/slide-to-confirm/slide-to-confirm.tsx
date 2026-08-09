'use client'

import * as React from 'react'
import { motion, animate, useMotionValue, useTransform } from 'motion/react'
import type { PanInfo, Transition } from 'motion/react'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * A commit gesture that fails safe with a recoil, not a snap.
 *
 * Sliding the knob past the threshold commits — no dialog, no second tap.
 * Letting go short of it should read as "no", but a linear snap back to
 * zero says nothing about how close the attempt was. This one releases the
 * knob at whatever velocity your hand let go with and lets the spring
 * carry it — a fast retreat overshoots past the start and rocks back, a
 * slow one just drifts home. The overshoot is only visible because the
 * default spring is `bounce`, underdamped on purpose: this is the one case
 * in the spring scale's own table where the recoil is the entire message,
 * on an element well under 48px, responding to direct input.
 *
 * `snapping-back` is a real state, styled independently from `idle`, for
 * the same reason `releasing` is real on `HoldToConfirm`: it is what the
 * user is looking at in the exact moment they find out they didn't commit.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['idle', 'hover', 'dragging', 'snapping-back', 'confirmed'] as const

export type SlideToConfirmState = (typeof STATES)[number]

const knobVariants = {
  'idle': { scale: 1 },
  'hover': { scale: 1.04 },
  'dragging': { scale: 1.08 },
  'snapping-back': { scale: 1 },
  'confirmed': { scale: 1 },
} satisfies Record<SlideToConfirmState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type SlideToConfirmProps = Omit<React.ComponentPropsWithoutRef<'div'>, MotionConflicts> & {
  style?: React.CSSProperties
  /** Label shown under the track, revealed as the knob passes over it. */
  children: React.ReactNode
  /** Shown once confirmed, replacing `children`. */
  confirmedLabel?: React.ReactNode
  /** Fraction of the track the knob must clear to commit. */
  threshold?: number
  onConfirm?: () => void
  /** Spring driving hover/press feedback and the recoil. `bounce` by default
   *  — see the component doc for why this is the one place that matters. */
  spring?: SpringName | Transition
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

export function SlideToConfirm({
  children,
  confirmedLabel = 'Confirmed',
  threshold = 0.82,
  onConfirm,
  spring = 'bounce',
  disabled = false,
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  ...props
}: SlideToConfirmProps) {
  const [hovered, setHovered] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [snappingBack, setSnappingBack] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)
  const transition = useZTransition(spring)

  const state: SlideToConfirmState = confirmed
    ? 'confirmed'
    : dragging
      ? 'dragging'
      : snappingBack
        ? 'snapping-back'
        : hovered
          ? 'hover'
          : 'idle'

  const trackRef = React.useRef<HTMLDivElement>(null)
  const maxX = React.useRef(1)
  const x = useMotionValue(0)
  const progress = useTransform(x, (v) => (maxX.current > 0 ? clamp(v / maxX.current, 0, 1) : 0))
  const fill = useTransform(progress, (p) => `${p * 100}%`)
  const label = useTransform(progress, [0, 0.5, 1], [1, 0.4, 0])

  const stop = React.useRef<() => void>(() => {})

  return (
    <div
      ref={ref}
      data-state={disabled ? 'idle' : state}
      className={zcn(
        'relative h-14 w-full max-w-sm select-none overflow-hidden rounded-full border border-current/25',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
      aria-disabled={disabled || undefined}
      {...props}
    >
      <div ref={trackRef} className="absolute inset-0">
        {/* The fill wipes in behind the knob as a receipt of how far the
            drag has gone — not required to read the gesture, but it turns
            "how close was I" into something you can see rather than guess. */}
        <motion.span aria-hidden className="absolute inset-y-0 left-0 bg-current/10" style={{ width: fill }} />
        <motion.span
          aria-hidden
          style={{ opacity: label }}
          className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-medium text-[var(--z-fg-muted,#a1a1aa)]"
        >
          {confirmed ? confirmedLabel : children}
        </motion.span>
      </div>

      <motion.div
        role="slider"
        tabIndex={disabled || confirmed ? -1 : 0}
        aria-label={typeof children === 'string' ? children : 'Slide to confirm'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={confirmed ? 100 : 0}
        aria-disabled={disabled || undefined}
        initial={false}
        animate={state}
        variants={knobVariants}
        transition={transition}
        drag={disabled || confirmed ? false : 'x'}
        dragConstraints={trackRef}
        dragElastic={0.06}
        dragMomentum={false}
        style={{ x, touchAction: 'none' }}
        className={zcn(
          'absolute top-1 left-1 grid size-11 cursor-grab place-items-center rounded-full bg-current',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2',
          'active:cursor-grabbing',
        )}
        onPointerEnter={(e) => {
          setHovered(true)
          onPointerEnter?.(e)
        }}
        onPointerLeave={(e) => {
          setHovered(false)
          onPointerLeave?.(e)
        }}
        onDragStart={() => {
          const track = trackRef.current
          if (track) maxX.current = Math.max(1, track.clientWidth - 44 - 8)
          stop.current()
          setSnappingBack(false)
          setDragging(true)
        }}
        onDragEnd={(_, info: PanInfo) => {
          setDragging(false)
          if (progress.get() >= threshold) {
            const controls = animate(x, maxX.current, { ...transition, velocity: info.velocity.x })
            stop.current = () => controls.stop()
            setConfirmed(true)
            onConfirm?.()
            return
          }
          // Carries the release velocity home rather than easing back — a
          // fast retreat visibly overshoots past zero before it settles.
          setSnappingBack(true)
          const controls = animate(x, 0, {
            ...transition,
            velocity: info.velocity.x,
            onComplete: () => setSnappingBack(false),
          })
          stop.current = () => controls.stop()
        }}
        onKeyDown={(e) => {
          if (disabled || confirmed) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const track = trackRef.current
            if (track) maxX.current = Math.max(1, track.clientWidth - 44 - 8)
            stop.current()
            const controls = animate(x, maxX.current, transition)
            stop.current = () => controls.stop()
            setConfirmed(true)
            onConfirm?.()
          }
        }}
      >
        <svg viewBox="0 0 16 16" className="size-4 text-[var(--z-slide-fg,canvas)]" aria-hidden>
          <path
            d="M4 3l5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  )
}
