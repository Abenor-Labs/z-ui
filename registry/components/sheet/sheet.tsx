'use client'

import * as React from 'react'
import { motion, animate, useMotionValue } from 'motion/react'
import type { PanInfo, Transition } from 'motion/react'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * A draggable panel that lands on the detent your hand meant, not the one
 * nearest where it happened to let go.
 *
 * Every bottom sheet on the web snaps to the nearest detent by position.
 * That is wrong for a fast flick: throw the panel upward and release two
 * pixels below the halfway detent, and a nearest-position snap sends it
 * backward, against the direction you just threw it. This one projects
 * where the release velocity would carry the panel — `y + v · 150ms` — and
 * snaps to whichever detent is nearest *that* point instead. A firm flick
 * from the lowest detent can land on the highest one even when the pointer
 * released far short of it, because the projection already crossed it.
 *
 * `dragging` and `settling` are split for the same reason `scrubbing` and
 * `settling` are split on `Scrub`: one is a hand on the panel, the other is
 * physics finishing a decision the hand already made.
 *
 * The component is a windowed panel, not a viewport overlay: it fills
 * whatever fixed-`height` box you put it in and slides within that box.
 * Positioning it over the rest of a page — a backdrop, a portal, scroll
 * locking — is layout the host owns, deliberately left out.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['closed', 'dragging', 'settling', 'open'] as const

export type SheetState = (typeof STATES)[number]

// The grip brightens under a hand and dims once fully closed, since there is
// nothing left to grab at. `y` itself is never a variant target — it is
// driven directly by the drag and by `settle()`, and mixing a spring-value
// target into the same variants object it retargets from would fight it.
const handleVariants = {
  'closed': { opacity: 0.3, scaleX: 0.65 },
  'dragging': { opacity: 1, scaleX: 1.15 },
  'settling': { opacity: 0.85, scaleX: 1 },
  'open': { opacity: 0.55, scaleX: 1 },
} satisfies Record<SheetState, object>

// How far ahead released velocity is projected before picking a detent.
// Higher reads as more decisive under a flick; lower hugs the pointer more.
const PROJECTION_SECONDS = 0.15

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type SheetProps = Omit<React.ComponentPropsWithoutRef<'div'>, MotionConflicts> & {
  style?: React.CSSProperties
  children: React.ReactNode
  /**
   * Fractions of `height` each detent reveals, ascending, each in (0, 1].
   * `1` reveals the full `height`. Defaults to a peek, a half, and full.
   */
  detents?: number[]
  /** Controlled index into `detents`, or `-1` for fully closed. */
  detent?: number
  /** Initial index into `detents` when uncontrolled, or `-1` for fully closed. */
  defaultDetent?: number
  onDetentChange?: (index: number) => void
  /** Px of drag travel between fully closed and the `1` detent. */
  height?: number
  /** Whether dragging past the lowest detent, fast or far enough, hides the sheet. */
  dismissible?: boolean
  /** Spring driving both the drag-release snap and the keyboard step. */
  spring?: SpringName | Transition
  ref?: React.Ref<HTMLDivElement>
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

export function Sheet({
  children,
  detents = [0.28, 0.62, 1],
  detent: detentProp,
  defaultDetent = 1,
  onDetentChange,
  height = 420,
  dismissible = true,
  spring = 'settle',
  className,
  ref,
  ...props
}: SheetProps) {
  const sorted = React.useMemo(() => [...detents].sort((a, b) => a - b), [detents])
  const [detentIndex, setDetentIndex] = React.useState(detentProp ?? defaultDetent)
  const controlled = detentProp !== undefined
  const index = controlled ? detentProp : detentIndex

  const [dragging, setDragging] = React.useState(false)
  const [settling, setSettling] = React.useState(false)
  const transition = useZTransition(spring)

  const state: SheetState = dragging ? 'dragging' : settling ? 'settling' : index < 0 ? 'closed' : 'open'

  // y = 0 at the top of the travel range (the `1` detent), y = height at
  // fully hidden. Smaller y is more open, which is what makes "nearest
  // detent" a plain min-distance search over a fixed set of y values.
  const toY = React.useCallback((i: number) => (i < 0 ? height : height * (1 - sorted[i]!)), [height, sorted])

  const y = useMotionValue(toY(controlled ? detentProp! : defaultDetent))
  const stop = React.useRef<() => void>(() => {})

  const settle = React.useCallback(
    (i: number, velocity: number, opts?: { silent?: boolean }) => {
      setSettling(true)
      stop.current()
      const controls = animate(y, toY(i), {
        ...transition,
        velocity,
        onComplete: () => setSettling(false),
      })
      stop.current = () => controls.stop()
      if (!controlled) setDetentIndex(i)
      if (!opts?.silent) onDetentChange?.(i)
    },
    [controlled, onDetentChange, toY, transition, y],
  )

  // Skip the first render: `y` was already initialized at the right spot, so
  // there is nothing to animate toward yet. Only a *later* prop change
  // should trigger a drive-to-target, and it does so without echoing
  // `onDetentChange` back at the caller who just set the prop.
  const mounted = React.useRef(false)
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (controlled) settle(detentProp!, 0, { silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, detentProp])

  const minY = toY(sorted.length - 1)
  const maxY = dismissible ? height : toY(0)

  return (
    <div
      ref={ref}
      data-state={state}
      style={{ height }}
      className={zcn('relative w-full overflow-hidden rounded-t-2xl border border-white/10 bg-panel', className)}
      {...props}
    >
      <motion.div
        role="slider"
        tabIndex={0}
        aria-label="Sheet position"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={sorted.length - 1}
        aria-valuenow={Math.max(0, index)}
        aria-valuetext={index < 0 ? 'closed' : `detent ${index + 1} of ${sorted.length}`}
        drag="y"
        dragConstraints={{ top: minY, bottom: maxY }}
        dragElastic={0.04}
        dragMomentum={false}
        style={{ y, touchAction: 'none' }}
        className="absolute inset-x-0 top-0 flex h-full cursor-grab flex-col outline-none focus-visible:ring-2 focus-visible:ring-current active:cursor-grabbing"
        onDragStart={() => {
          stop.current()
          setDragging(true)
        }}
        onDrag={() => {
          // Motion already writes `y` from the drag; clamping here just keeps
          // the projection math below honest at the extremes.
          y.set(clamp(y.get(), minY, maxY))
        }}
        onDragEnd={(_, info: PanInfo) => {
          setDragging(false)
          const projected = clamp(y.get() + info.velocity.y * PROJECTION_SECONDS, minY, maxY)
          const candidates = dismissible ? [...sorted.map((_, i) => i), -1] : sorted.map((_, i) => i)
          let best = candidates[0]!
          let bestDist = Infinity
          for (const c of candidates) {
            const d = Math.abs(toY(c) - projected)
            if (d < bestDist) {
              bestDist = d
              best = c
            }
          }
          settle(best, info.velocity.y)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault()
            settle(clamp(index + 1, dismissible ? -1 : 0, sorted.length - 1), 0)
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault()
            settle(clamp(index - 1, dismissible ? -1 : 0, sorted.length - 1), 0)
          } else if (e.key === 'Home') {
            e.preventDefault()
            settle(sorted.length - 1, 0)
          } else if (e.key === 'End') {
            e.preventDefault()
            settle(dismissible ? -1 : 0, 0)
          }
        }}
      >
        <div aria-hidden className="grid shrink-0 place-items-center py-3">
          <motion.span
            initial={false}
            animate={state}
            variants={handleVariants}
            transition={transition}
            className="h-1 w-9 origin-center rounded-full bg-current/25"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </motion.div>
    </div>
  )
}
