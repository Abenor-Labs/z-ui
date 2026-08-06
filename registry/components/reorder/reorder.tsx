'use client'

import * as React from 'react'
import { motion, animate, useMotionValue } from 'motion/react'
import type { Transition } from 'motion/react'
import { springs, useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * A drag-to-reorder list where a displaced row's neighbours don't all move
 * together — the displacement travels down the list as a wave.
 *
 * Every reorderable list moves the rows out of the way with one shared
 * animation, so five rows shifting up all arrive at the same instant. Here
 * each settling row's spring is retuned by its own distance from the row
 * that was being dragged: `stiffness / (1 + distance · 0.35)`. A neighbour
 * reacts almost immediately; a row four slots away is visibly still
 * catching up after the near ones have settled. That lag is what makes the
 * list read as one physical stack being disturbed rather than N independent
 * boxes swapping on cue.
 *
 * Rows are a fixed `rowHeight` rather than measured, which is the one real
 * simplification here: a fully general height-per-row drag list is a much
 * larger component, and this one is honest about not being it.
 *
 * `dragging` and `settling` describe the list as a whole; which single row
 * is under the pointer is a separate `data-dragging` attribute on that row,
 * not part of the state contract, the same way `Sheet` keeps "which detent"
 * out of its states.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['idle', 'dragging', 'settling'] as const

export type ReorderState = (typeof STATES)[number]

// A faint wash across the whole list while it's disturbed — most visible on
// the row physics below, but this is what tells you the list itself, not
// just one row, is mid-gesture.
const listVariants = {
  'idle': { backgroundColor: 'rgba(255, 255, 255, 0)' },
  'dragging': { backgroundColor: 'rgba(255, 255, 255, 0.035)' },
  'settling': { backgroundColor: 'rgba(255, 255, 255, 0.015)' },
} satisfies Record<ReorderState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type ReorderProps<T> = Omit<React.ComponentPropsWithoutRef<'div'>, MotionConflicts> & {
  style?: React.CSSProperties
  items: T[]
  keyExtractor: (item: T, index: number) => string
  renderItem: (item: T, index: number) => React.ReactNode
  /** Fired once, when a drag or a keyboard move ends on a new order. */
  onReorder?: (next: T[]) => void
  /** Px height of every row. Fixed, not measured — see the component doc. */
  rowHeight?: number
  /** Spring driving settled rows; distance from the dragged row softens it. */
  spring?: SpringName | Transition
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

export function Reorder<T>({
  items,
  keyExtractor,
  renderItem,
  onReorder,
  rowHeight = 56,
  spring = 'snap',
  disabled = false,
  className,
  ref,
  ...props
}: ReorderProps<T>) {
  const keys = React.useMemo(() => items.map(keyExtractor), [items, keyExtractor])
  const byKey = React.useMemo(() => new Map(items.map((it, i) => [keys[i]!, it])), [items, keys])

  // `order` is the live, possibly-mid-drag arrangement of keys. It starts
  // from `items` and only reports back to the caller when a move completes.
  const [order, setOrder] = React.useState(keys)
  React.useEffect(() => {
    // The caller changed `items` from outside a drag — resync.
    setOrder((prev) => (prev.length === keys.length && prev.every((k, i) => k === keys[i]) ? prev : keys))
  }, [keys])

  const [draggedKey, setDraggedKey] = React.useState<string | null>(null)
  const draggedIndex = draggedKey ? order.indexOf(draggedKey) : -1
  const [settling, setSettling] = React.useState(false)
  const settleTimer = React.useRef(0)

  const state: ReorderState = draggedKey ? 'dragging' : settling ? 'settling' : 'idle'
  const cfg = typeof spring === 'string' ? springs[spring] : { stiffness: 260, damping: 24, mass: 1 }
  const transition = useZTransition(spring)
  // A `{ duration: 0 }` result means one thing everywhere in this file: skip
  // the spring entirely and place rows instantly, same as every other
  // component's reduced-motion path — including the row physics below,
  // which don't run through `transition` directly since they retune it per
  // row and so check this flag themselves.
  const reduced = transition.duration === 0

  const startOrderRef = React.useRef(order)

  const commit = React.useCallback(
    (next: string[]) => {
      const before = startOrderRef.current
      const changed = before.length !== next.length || before.some((k, i) => k !== next[i])
      if (changed) onReorder?.(next.map((k) => byKey.get(k)).filter((v): v is T => v !== undefined))
    },
    [byKey, onReorder],
  )

  const settleFor = React.useCallback(() => {
    setSettling(true)
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => setSettling(false), 420)
  }, [])

  const moveBy = React.useCallback(
    (key: string, delta: -1 | 1) => {
      setOrder((cur) => {
        const from = cur.indexOf(key)
        const to = clamp(from + delta, 0, cur.length - 1)
        if (from === to) return cur
        const next = [...cur]
        next.splice(from, 1)
        next.splice(to, 0, key)
        startOrderRef.current = cur
        settleFor()
        commit(next)
        return next
      })
    },
    [commit, settleFor],
  )

  React.useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  return (
    <motion.div
      ref={ref}
      data-state={state}
      initial={false}
      animate={state}
      variants={listVariants}
      transition={transition}
      style={{ height: order.length * rowHeight }}
      className={zcn('relative w-full rounded-lg', className)}
      {...props}
    >
      {order.map((key, slot) => {
        const item = byKey.get(key)
        if (item === undefined) return null
        const index = keys.indexOf(key)
        return (
          <ReorderRow
            key={key}
            slot={slot}
            total={order.length}
            rowHeight={rowHeight}
            distance={draggedIndex < 0 ? 0 : Math.abs(slot - draggedIndex)}
            stiffness={cfg.stiffness}
            damping={cfg.damping}
            mass={cfg.mass}
            reduced={reduced}
            dragging={key === draggedKey}
            disabled={disabled}
            onGrab={() => {
              startOrderRef.current = order
              setDraggedKey(key)
            }}
            onDragTo={(rawY) => {
              const targetSlot = clamp(Math.round(rawY / rowHeight), 0, order.length - 1)
              setOrder((cur) => {
                const from = cur.indexOf(key)
                if (from === targetSlot) return cur
                const next = [...cur]
                next.splice(from, 1)
                next.splice(targetSlot, 0, key)
                return next
              })
            }}
            onRelease={() => {
              setDraggedKey(null)
              settleFor()
              commit(order)
            }}
            onStep={(delta) => moveBy(key, delta)}
          >
            {renderItem(item, index)}
          </ReorderRow>
        )
      })}
      <p className="sr-only" aria-live="polite">
        {state === 'dragging' && draggedKey
          ? `Position ${draggedIndex + 1} of ${order.length}`
          : ''}
      </p>
    </motion.div>
  )
}

function ReorderRow({
  slot,
  total,
  rowHeight,
  distance,
  stiffness,
  damping,
  mass,
  reduced,
  dragging,
  disabled,
  onGrab,
  onDragTo,
  onRelease,
  onStep,
  children,
}: {
  slot: number
  total: number
  rowHeight: number
  distance: number
  stiffness: number
  damping: number
  mass: number
  reduced: boolean
  dragging: boolean
  disabled: boolean
  onGrab: () => void
  onDragTo: (y: number) => void
  onRelease: () => void
  onStep: (delta: -1 | 1) => void
  children: React.ReactNode
}) {
  const y = useMotionValue(slot * rowHeight)
  const stop = React.useRef<() => void>(() => {})
  const drag = React.useRef({ startClientY: 0, startY: 0 })

  React.useEffect(() => {
    if (dragging) return
    stop.current()
    const target = slot * rowHeight
    if (reduced) {
      y.set(target)
      return
    }
    // Rows farther from the one that was dragged react with lower
    // stiffness — literally slower to respond — which is what makes the
    // shift travel down the list instead of every row landing in lockstep.
    const softened = stiffness / (1 + distance * 0.35)
    const controls = animate(y, target, {
      type: 'spring',
      stiffness: softened,
      damping,
      mass,
      velocity: y.getVelocity(),
    })
    stop.current = () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, dragging, reduced])

  return (
    <motion.div
      data-dragging={dragging || undefined}
      style={{ y, height: rowHeight, touchAction: 'none' }}
      className={zcn(
        'absolute inset-x-0 top-0 flex items-center gap-3 rounded-lg border border-white/10 bg-panel px-3',
        dragging && 'z-10 border-accent shadow-lg',
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`Reorder row, position ${slot + 1} of ${total}`}
        aria-roledescription="sortable"
        className={zcn(
          'grid h-8 w-6 shrink-0 place-items-center rounded text-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
          disabled ? 'cursor-default opacity-40' : 'cursor-grab active:cursor-grabbing',
        )}
        onPointerDown={(e) => {
          if (disabled) return
          e.currentTarget.setPointerCapture(e.pointerId)
          stop.current()
          drag.current = { startClientY: e.clientY, startY: y.get() }
          onGrab()
        }}
        onPointerMove={(e) => {
          if (!dragging) return
          const dy = e.clientY - drag.current.startClientY
          const next = drag.current.startY + dy
          y.set(next)
          onDragTo(next)
        }}
        onPointerUp={() => {
          if (!dragging) return
          const target = slot * rowHeight
          if (reduced) {
            y.set(target)
          } else {
            const controls = animate(y, target, {
              type: 'spring',
              stiffness,
              damping,
              mass,
              velocity: y.getVelocity(),
            })
            stop.current = () => controls.stop()
          }
          onRelease()
        }}
        onPointerCancel={() => {
          if (dragging) onRelease()
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            onStep(-1)
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            onStep(1)
          }
        }}
      >
        <svg viewBox="0 0 10 16" className="h-3.5 w-2.5" fill="currentColor" aria-hidden>
          <circle cx="2.5" cy="2.5" r="1.25" />
          <circle cx="7.5" cy="2.5" r="1.25" />
          <circle cx="2.5" cy="8" r="1.25" />
          <circle cx="7.5" cy="8" r="1.25" />
          <circle cx="2.5" cy="13.5" r="1.25" />
          <circle cx="7.5" cy="13.5" r="1.25" />
        </svg>
      </button>
      <div className="min-w-0 flex-1 py-3">{children}</div>
    </motion.div>
  )
}
