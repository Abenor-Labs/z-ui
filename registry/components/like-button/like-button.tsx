'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import type { Transition } from 'motion/react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * Liked-ness and interaction are two dimensions, so the state machine is their
 * product rather than either one alone. Six states, not four.
 *
 * The obvious shape, `animate={pressed ? 'liked' : 'idle'}` with `whileHover`
 * layered on top, is wrong in a way that is easy to miss and obvious once
 * seen: motion applies the hover variant over the animate variant, and a hover
 * variant cannot know whether the button is liked. Hovering a liked heart
 * reverts it to grey and unfilled.
 *
 * One derived value drives `animate` and `data-state` together, so the
 * attribute a consumer styles against can never disagree with what is on
 * screen. Precedence is pressing, then hover, then liked.
 *
 * Keys here match `meta.states` in component.json exactly. That is not a
 * convention, it is checked in CI, and it is what lets a showcase build a
 * state inspector from the manifest alone.
 */
const STATES = [
  'idle',
  'hover',
  'pressing',
  'liked',
  'liked-hover',
  'liked-pressing',
] as const

export type LikeButtonState = (typeof STATES)[number]

// `satisfies`, not an annotation: it checks that every state has a variant and
// no extras sneak in, while leaving the literal type intact so motion still
// accepts these as Variants. Annotating them as Record<State, object> would
// widen the values and fail assignment.
const rootVariants = {
  'idle': { scale: 1 },
  'hover': { scale: 1.08 },
  'pressing': { scale: 0.9 },
  'liked': { scale: 1 },
  'liked-hover': { scale: 1.08 },
  'liked-pressing': { scale: 0.9 },
} satisfies Record<LikeButtonState, object>

// Greys ride a near-zero-chroma neutral, placed inside the only
// relative-luminance window that satisfies both grounds this file can land
// on: a white consumer app and the Z-UI chassis.
// idle 5.37 to 1 white, 3.69 to 1 chassis. hover/pressing 3.21 to 1 white,
// 6.16 to 1 chassis. liked/liked-pressing 3.67 to 1 white, 5.39 to 1 chassis.
// liked-hover 3.11 to 1 white, 6.37 to 1 chassis.
const iconVariants = {
  'idle':           { color: '#6a6a71', fillOpacity: 0 },
  'hover':          { color: '#8f8f96', fillOpacity: 0 },
  'pressing':       { color: '#8f8f96', fillOpacity: 0 },
  'liked':          { color: '#f43f5e', fillOpacity: 1 },
  'liked-hover':    { color: '#fd576d', fillOpacity: 1 },
  'liked-pressing': { color: '#f43f5e', fillOpacity: 1 },
} satisfies Record<LikeButtonState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type LikeButtonProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  MotionConflicts
> & {
  style?: React.CSSProperties
  /** Controlled liked state. Passing this hands control to you. */
  pressed?: boolean
  /** Initial liked state when uncontrolled. */
  defaultPressed?: boolean
  /** Fired with the next state whenever it changes. */
  onPressedChange?: (pressed: boolean) => void
  /**
   * Spring driving the press response. A preset name, or any motion
   * `Transition` when you need to scale or override the physics.
   */
  spring?: SpringName | Transition
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * A like toggle that overshoots on press and settles.
 *
 * The overshoot is the point: `bounce` reaches 90% of target in 94ms, faster
 * than any other preset in the scale, because it passes through the target
 * rather than easing up to it. That is what reads as physical.
 */
export function LikeButton({
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  spring = 'bounce',
  className,
  'aria-label': ariaLabel = 'Like',
  ref,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onClick,
  ...props
}: LikeButtonProps) {
  const [pressed, setPressed] = useControllableState({
    prop: pressedProp,
    defaultProp: defaultPressed,
    onChange: onPressedChange,
  })
  const [hovered, setHovered] = React.useState(false)
  const [pressing, setPressing] = React.useState(false)
  const transition = useZTransition(spring)

  const interaction = pressing ? 'pressing' : hovered ? 'hover' : null
  const state: LikeButtonState = pressed
    ? interaction
      ? (`liked-${interaction}` as LikeButtonState)
      : 'liked'
    : (interaction ?? 'idle')

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
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
        // A pointer that leaves mid-press never delivers pointerup here, so
        // the press is released on the way out or the button sticks pressed.
        setPressing(false)
        onPointerLeave?.(e)
      }}
      onPointerDown={(e) => {
        setPressing(true)
        onPointerDown?.(e)
      }}
      onPointerUp={(e) => {
        setPressing(false)
        onPointerUp?.(e)
      }}
      onPointerCancel={(e) => {
        setPressing(false)
        onPointerCancel?.(e)
      }}
      onClick={(e) => {
        setPressed(!pressed)
        onClick?.(e)
      }}
      className={zcn(
        'relative grid size-11 place-items-center rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
        variants={iconVariants}
        aria-hidden
      >
        <path d="M12 20.7l-1.45-1.32C5.4 14.86 2 11.78 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.28-3.4 6.36-8.55 10.88L12 20.7z" />
      </motion.svg>
    </motion.button>
  )
}
