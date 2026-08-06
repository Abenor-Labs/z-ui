'use client'

import * as React from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import type { PanInfo, Transition } from 'motion/react'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * The window between a destructive action and its consequence.
 *
 * Every product needs this and almost every product builds it from scratch,
 * because the hard parts are not the markup. The timer has to be visible, so
 * the user can judge how long they have. It has to pause the moment a pointer
 * approaches — not freeze, pause, which means the drain decelerates rather than
 * stopping between frames. And the toast has to be throwable, because the
 * fastest way to say "yes I meant it" is to flick the thing off the screen.
 *
 * The timer is a rAF accumulator rather than a `setTimeout`, for one reason: a
 * timeout cannot be paused. Pausing a timeout means clearing it, storing the
 * remainder, and setting a new one, which drifts a little every cycle and
 * cannot express "slowing to a stop". Here `remaining` is a number that some
 * frames decrement and some frames do not.
 *
 * Dismissal reads velocity, not distance. A short sharp flick means the same
 * thing as a long slow drag, and only one of those is expressible as a
 * threshold on position.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['counting', 'held', 'dragging', 'leaving'] as const

export type UndoToastState = (typeof STATES)[number]

// `y` appears in every variant because it appears in `initial`. A property that
// is animated from but never animated to simply stays where it started, which
// is a silent, easily-missed way to ship a component 28px out of place.
const rootVariants = {
  'counting': { y: 0, scale: 1 },
  'held': { y: 0, scale: 1.02 },
  'dragging': { y: 0, scale: 1.02 },
  'leaving': { y: 8, scale: 0.96 },
} satisfies Record<UndoToastState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type UndoToastProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  MotionConflicts
> & {
  style?: React.CSSProperties
  /** What was done. Kept short — this is a receipt, not an explanation. */
  children: React.ReactNode
  /** Milliseconds before the action becomes permanent. */
  duration?: number
  /** The user took it back. */
  onUndo?: () => void
  /** The window closed, or the toast was thrown away. The action stands. */
  onCommit?: () => void
  /** Label on the undo control. */
  actionLabel?: string
  /** Spring driving entry, hold and throw. */
  spring?: SpringName | Transition
  ref?: React.Ref<HTMLDivElement>
}

export function UndoToast({
  children,
  duration = 5000,
  onUndo,
  onCommit,
  actionLabel = 'Undo',
  spring = 'settle',
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  ...props
}: UndoToastProps) {
  const [held, setHeld] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [leaving, setLeaving] = React.useState(false)
  const transition = useZTransition(spring)

  const state: UndoToastState = leaving
    ? 'leaving'
    : dragging
      ? 'dragging'
      : held
        ? 'held'
        : 'counting'

  // Remaining time is a motion value so the drain repaints without re-rendering
  // the tree sixty times a second.
  const remaining = useMotionValue(duration)
  const progress = useTransform(remaining, (r) => Math.max(0, r / duration))
  const x = useMotionValue(0)
  // Fading with distance is what makes a throw feel like a decision rather than
  // an accident — you can see it going before you have let go.
  const dragFade = useTransform(x, [-260, -40, 0, 40, 260], [0, 1, 1, 1, 0])

  const done = React.useRef(false)
  const finish = React.useCallback(
    (undo: boolean) => {
      if (done.current) return
      done.current = true
      setLeaving(true)
      if (undo) onUndo?.()
      else onCommit?.()
    },
    [onCommit, onUndo],
  )

  // Pausing is a rate, not a switch: the drain eases to a stop over ~180ms and
  // eases back up, so reaching for the toast never looks like a dropped frame.
  const paused = held || dragging || leaving
  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    let rate = 1
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const wanted = paused ? 0 : 1
      rate += (wanted - rate) * Math.min(1, dt / 180)
      const next = remaining.get() - dt * rate
      remaining.set(next)
      if (next <= 0) {
        finish(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused, remaining, finish])

  return (
    <motion.div
      ref={ref}
      role="status"
      aria-live="polite"
      data-state={state}
      // The entry is the one place a mount animation is correct: this component
      // exists because something just happened, and arriving is the message.
      // No `opacity` here. It is owned by `dragFade` through `style`, and a
      // motion value only writes when its source changes — so an initial
      // opacity of 0 would never be lifted, because `x` sits at rest until the
      // first drag. The toast would mount invisible and appear only once you
      // pushed it. The entrance is carried by `y` and `scale` instead.
      initial={{ y: 28, scale: 0.97 }}
      animate={state}
      variants={rootVariants}
      transition={transition}
      drag="x"
      dragElastic={0.14}
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_, info: PanInfo) => {
        setDragging(false)
        // Velocity, not distance. A flick and a long drag mean the same thing.
        const thrown = Math.abs(info.velocity.x) > 420 || Math.abs(info.offset.x) > 150
        if (thrown) finish(false)
        else x.set(0)
      }}
      style={{ x, opacity: dragFade }}
      onPointerEnter={(e) => {
        setHeld(true)
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        setHeld(false)
        onPointerLeave?.(e)
      }}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      // Deliberately styled as an inverted surface: currentColor becomes the
      // ground and the host's background becomes the text. A toast has to read
      // as a layer above the page, and inverting is the only way to guarantee
      // separation without knowing what the page is painted with. Override the
      // whole thing with `className` if your design system says otherwise.
      className={zcn(
        'relative flex touch-none items-center gap-3 overflow-hidden',
        'rounded-lg bg-current px-4 py-3 shadow-lg',
        'cursor-grab select-none active:cursor-grabbing',
        className,
      )}
      {...props}
    >
      {/* Content sits in the inverted layer, so it takes the page's own ground
          colour. `mix-blend-difference` would be cheaper and would fail on any
          non-neutral surface. */}
      <span className="text-sm text-[var(--z-toast-fg,canvas)]">{children}</span>

      <button
        type="button"
        onClick={() => finish(true)}
        aria-label={actionLabel}
        className={zcn(
          'ml-auto grid h-11 shrink-0 place-items-center rounded px-2',
          'text-sm font-semibold text-[var(--z-toast-fg,canvas)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-toast-fg,canvas)]',
        )}
      >
        {actionLabel}
      </button>

      {/* The clock. It drains, and you can see exactly how long is left. */}
      <motion.span
        aria-hidden
        initial={false}
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[var(--z-toast-fg,canvas)] opacity-45"
        style={{ scaleX: progress }}
      />
    </motion.div>
  )
}
