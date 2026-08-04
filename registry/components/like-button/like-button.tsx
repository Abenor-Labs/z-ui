'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * Variant sets share one key vocabulary: idle, hover, pressing, liked. Motion
 * propagates the active variant name from the root to its children, so naming
 * them identically is what lets the icon and the ring react without any of
 * them tracking state themselves.
 *
 * Those keys match `meta.states` in component.json exactly. That is not a
 * convention, it is checked in CI, and it is what lets the showcase build a
 * state inspector from the manifest alone.
 */
const rootVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.08 },
  pressing: { scale: 0.9 },
  liked: { scale: 1 },
}

const iconVariants = {
  idle: { color: '#a3a3a3', fillOpacity: 0 },
  hover: { color: '#d4d4d4', fillOpacity: 0 },
  pressing: { color: '#d4d4d4', fillOpacity: 0 },
  liked: { color: '#f43f5e', fillOpacity: 1 },
}

/**
 * Decorative. Rendered only when motion is allowed. The keyframed opacity
 * needs a duration rather than a spring, so this variant overrides the
 * transition it inherits from the root.
 */
const ringVariants = {
  idle: { scale: 0.6, opacity: 0 },
  hover: { scale: 0.6, opacity: 0 },
  pressing: { scale: 0.6, opacity: 0 },
  liked: {
    scale: [0.6, 1.9],
    opacity: [0.45, 0],
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
}

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
  /** Spring preset driving the press response. */
  spring?: SpringName
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
  ...props
}: LikeButtonProps) {
  const [pressed, setPressed] = useControllableState({
    prop: pressedProp,
    defaultProp: defaultPressed,
    onChange: onPressedChange,
  })
  const transition = useZTransition(spring)
  const reduced = useReducedMotion()

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      data-state={pressed ? 'liked' : 'idle'}
      initial={false}
      animate={pressed ? 'liked' : 'idle'}
      whileHover="hover"
      whileTap="pressing"
      variants={rootVariants}
      transition={transition}
      onClick={() => setPressed(!pressed)}
      className={zcn(
        'relative grid size-11 place-items-center rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/*
        Dropped entirely under reduced motion rather than animated to zero
        duration. A user who asked for less motion should not receive a ring
        that appears and vanishes in one frame.
      */}
      {!reduced && (
        <motion.span
          aria-hidden
          variants={ringVariants}
          className="pointer-events-none absolute size-6 rounded-full border-2 border-rose-500"
        />
      )}

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
