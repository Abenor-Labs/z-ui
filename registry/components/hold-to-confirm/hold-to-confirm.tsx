'use client'

import * as React from 'react'
import { motion, useMotionValue } from 'motion/react'
import type { Transition } from 'motion/react'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * A commit that costs a second of deliberate pressure.
 *
 * The point is not the delay. A confirmation dialog also costs a second and
 * teaches people to click through it without reading, because the cost is paid
 * in attention rather than in intent. Holding cannot be done absent-mindedly:
 * the finger is on the thing being destroyed for the whole window, and letting
 * go is always available.
 *
 * Releasing early does not zero the ring. It drains back, at roughly twice the
 * fill rate, and that asymmetry is the whole design. A ring that snaps to empty
 * says the attempt never happened; a ring that unwinds says it was heard and
 * withdrawn. The same asymmetry is why filling is slightly eased near the end
 * — the last fifth is where doubt lives, so it is the part that takes longest.
 *
 * `releasing` is a real state rather than a transition out of `holding`,
 * because it is the state that most needs styling: it is what the user sees at
 * the moment they change their mind.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['idle', 'hover', 'holding', 'releasing', 'confirmed'] as const

export type HoldToConfirmState = (typeof STATES)[number]

const rootVariants = {
  'idle': { scale: 1 },
  'hover': { scale: 1.02 },
  'holding': { scale: 0.97 },
  'releasing': { scale: 1 },
  'confirmed': { scale: 1 },
} satisfies Record<HoldToConfirmState, object>

const ringVariants = {
  'idle': { opacity: 0 },
  'hover': { opacity: 0.35 },
  'holding': { opacity: 1 },
  'releasing': { opacity: 0.7 },
  'confirmed': { opacity: 1 },
} satisfies Record<HoldToConfirmState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type HoldToConfirmProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  MotionConflicts
> & {
  style?: React.CSSProperties
  children: React.ReactNode
  /** Milliseconds of continuous pressure required. */
  duration?: number
  /** Fired once, when the hold completes. */
  onConfirm?: () => void
  /** Fired when a hold is abandoned, with how far it got, 0 to 1. */
  onAbandon?: (progress: number) => void
  /** Spring driving the press and the completion. */
  spring?: SpringName | Transition
  ref?: React.Ref<HTMLButtonElement>
}

export function HoldToConfirm({
  children,
  duration = 1200,
  onConfirm,
  onAbandon,
  spring = 'snap',
  className,
  disabled,
  ref,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  ...props
}: HoldToConfirmProps) {
  const [hovered, setHovered] = React.useState(false)
  const [holding, setHolding] = React.useState(false)
  const [releasing, setReleasing] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)
  const transition = useZTransition(spring)

  const state: HoldToConfirmState = confirmed
    ? 'confirmed'
    : holding
      ? 'holding'
      : releasing
        ? 'releasing'
        : hovered
          ? 'hover'
          : 'idle'

  // Progress is a motion value: the ring repaints on the compositor while React
  // re-renders only when the state name changes, a handful of times per gesture.
  const progress = useMotionValue(0)

  const held = React.useRef(false)
  const fired = React.useRef(false)

  const begin = React.useCallback(() => {
    if (disabled || fired.current) return
    held.current = true
    setReleasing(false)
    setHolding(true)
  }, [disabled])

  const end = React.useCallback(() => {
    if (!held.current) return
    held.current = false
    setHolding(false)
    if (progress.get() > 0.001 && !fired.current) {
      setReleasing(true)
      onAbandon?.(progress.get())
    }
  }, [onAbandon, progress])

  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const p = progress.get()

      if (held.current) {
        // Eased, not linear. The last fifth is where doubt lives, so it is the
        // part that takes longest — the control leans back as you commit.
        const resistance = 1 - 0.45 * Math.max(0, p - 0.55) / 0.45
        const next = p + (dt / duration) * resistance
        if (next >= 1) {
          progress.set(1)
          fired.current = true
          held.current = false
          setHolding(false)
          setConfirmed(true)
          onConfirm?.()
          return
        }
        progress.set(next)
      } else if (p > 0 && !fired.current) {
        // Twice the fill rate. Withdrawing should be visibly easier than
        // committing, and it should still be visible.
        const next = p - (dt / duration) * 2.1
        if (next <= 0) {
          progress.set(0)
          setReleasing(false)
        } else progress.set(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, onConfirm, progress])

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : undefined}
      // The ring is a progress indicator for a gesture, so it is announced as
      // one. Without this a screen-reader user is holding a button that appears
      // to do nothing for a second and a bit.
      aria-describedby={undefined}
      data-state={state}
      initial={false}
      animate={state}
      variants={rootVariants}
      transition={transition}
      onPointerEnter={(e) => {
        setHovered(true)
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        setHovered(false)
        end()
        onPointerLeave?.(e)
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        begin()
        onPointerDown?.(e)
      }}
      onPointerUp={(e) => {
        end()
        onPointerUp?.(e)
      }}
      onPointerCancel={(e) => {
        end()
        onPointerCancel?.(e)
      }}
      // Space and Enter auto-repeat while held, which is exactly the signal a
      // hold needs — `e.repeat` distinguishes the first press from the rest.
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault()
          begin()
        }
        onKeyDown?.(e)
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') end()
        onKeyUp?.(e)
      }}
      className={zcn(
        'relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-lg',
        'border border-current/30 px-4 text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/* The fill is behind the label and clipped by the button, so the control
          is consumed by its own progress rather than decorated with it. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={state}
        variants={ringVariants}
        transition={transition}
        className="absolute inset-0 origin-left bg-current/15"
        style={{ scaleX: progress }}
      />
      <span className="relative">{children}</span>

      {/* A hairline that tracks the same value, so the edge of the decision is
          readable even when the fill is subtle. */}
      <svg
        aria-hidden
        viewBox="0 0 100 1"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 w-full"
      >
        <motion.line
          x1="0"
          y1="0.5"
          x2="100"
          y2="0.5"
          stroke="currentColor"
          strokeWidth="1"
          pathLength={1}
          style={{ pathLength: progress }}
        />
      </svg>

      <span className="sr-only" role="status" aria-live="polite">
        {confirmed ? 'Confirmed' : holding ? 'Keep holding to confirm' : ''}
      </span>
    </motion.button>
  )
}
