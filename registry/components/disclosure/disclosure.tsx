'use client'

import * as React from 'react'
import { motion, animate, useMotionValue } from 'motion/react'
import type { Transition } from 'motion/react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * An accordion panel whose height is a spring, not a duration.
 *
 * Every disclosure on the web animates height with an eased duration, which
 * means clicking the trigger again while it is still opening has to finish
 * the first animation before the second can start — or, worse, snap to a new
 * starting point and restart the curve from zero velocity, which reads as a
 * dropped frame. A spring has no such seam: retargeting it mid-flight keeps
 * whatever velocity it already had, so tapping a trigger open-closed-open in
 * quick succession looks like one continuous motion changing its mind, not
 * three animations fighting each other.
 *
 * `opening` and `closing` are real states, not a boolean's transition. They
 * are entered the instant a retarget happens and left the instant the height
 * settles, which is also the only way the trigger's chevron can commit to a
 * direction mid-flight rather than jumping.
 *
 * Height is measured from the content's own `scrollHeight` rather than taken
 * as a prop, so the panel is correct for any content, including content that
 * reflows after mount — a `ResizeObserver` keeps the open target current.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['closed', 'hover', 'opening', 'open', 'closing'] as const

export type DisclosureState = (typeof STATES)[number]

const chevronVariants = {
  'closed': { rotate: 0 },
  'hover': { rotate: 0 },
  'opening': { rotate: 90 },
  'open': { rotate: 180 },
  'closing': { rotate: 90 },
} satisfies Record<DisclosureState, object>

const contentVariants = {
  'closed': { opacity: 0, y: -4 },
  'hover': { opacity: 0, y: -4 },
  'opening': { opacity: 1, y: 0 },
  'open': { opacity: 1, y: 0 },
  'closing': { opacity: 0.35, y: -2 },
} satisfies Record<DisclosureState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type DisclosureProps = Omit<React.ComponentPropsWithoutRef<'div'>, MotionConflicts> & {
  style?: React.CSSProperties
  /** The trigger's contents. Wrapped in a `button` the component owns. */
  trigger: React.ReactNode
  /** The panel's contents. */
  children: React.ReactNode
  /** Controlled open state. Passing this hands control to you. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Spring driving the height, the chevron, and the content reveal. */
  spring?: SpringName | Transition
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

/** `useLayoutEffect` is a no-op warning on the server; this silences it without
 *  losing the pre-paint measurement client components still need. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

export function Disclosure({
  trigger,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  spring = 'settle',
  disabled = false,
  className,
  ref,
  ...props
}: DisclosureProps) {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const [hovered, setHovered] = React.useState(false)
  const [phase, setPhase] = React.useState<'opening' | 'closing' | null>(null)
  const transition = useZTransition(spring)

  const state: DisclosureState = phase ?? (open ? 'open' : hovered ? 'hover' : 'closed')

  const contentRef = React.useRef<HTMLDivElement>(null)
  const height = useMotionValue(0)
  // Whether the panel has been measured at least once. Before that, height is
  // rendered as `auto`/`0` directly so a `defaultOpen` panel never flashes
  // shut before its first real measurement lands.
  const [measured, setMeasured] = React.useState(false)

  const id = React.useId()

  const stop = React.useRef<() => void>(() => {})

  const go = React.useCallback(
    (next: boolean) => {
      const el = contentRef.current
      if (!el) return
      stop.current()
      const target = next ? el.scrollHeight : 0
      if (transition.duration === 0) {
        // Reduced motion: the state still changes, just without a transient.
        height.set(target)
        setPhase(null)
        return
      }
      setPhase(next ? 'opening' : 'closing')
      const controls = animate(height, target, {
        ...transition,
        velocity: height.getVelocity(),
        onComplete: () => setPhase(null),
      })
      stop.current = () => controls.stop()
    },
    [height, transition],
  )

  useIsoLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const initial = open ? el.scrollHeight : 0
    height.set(initial)
    setMeasured(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useIsoLayoutEffect(() => {
    if (!measured) return
    go(open)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Content that grows while open (an image loads, a row is added) should
  // push the panel taller without waiting for a toggle to notice.
  React.useEffect(() => {
    const el = contentRef.current
    if (!el || !measured) return
    const ro = new ResizeObserver(() => {
      if (open && phase === null) height.set(el.scrollHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [measured, open, phase, height])

  return (
    <div
      ref={ref}
      data-state={disabled ? 'closed' : state}
      className={zcn('w-full', className)}
      {...props}
    >
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className={zcn(
          'flex w-full min-h-11 items-center justify-between gap-3 py-2 text-left text-sm font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <span>{trigger}</span>
        <motion.svg
          aria-hidden
          initial={false}
          animate={state}
          variants={chevronVariants}
          transition={transition}
          viewBox="0 0 16 16"
          className="size-4 shrink-0 origin-center"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      {/* The clip. Height lives here as a motion value in px so the spring
          paints on the compositor instead of forcing layout every frame. */}
      <motion.div
        aria-hidden={!open}
        style={measured ? { height, overflow: 'hidden' } : { height: open ? 'auto' : 0, overflow: 'hidden' }}
      >
        <motion.div
          id={id}
          ref={contentRef}
          role="region"
          initial={false}
          animate={state}
          variants={contentVariants}
          transition={transition}
          className="pb-3 text-sm text-muted"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}
