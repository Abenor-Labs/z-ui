'use client'

import * as React from 'react'
import { motion, animate } from 'motion/react'
import type { Transition } from 'motion/react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * A text field where Escape rewinds an edit as something you watch happen,
 * not a snap back to the old value.
 *
 * Every "press Escape to cancel" input restores the prior value in the same
 * frame, which is correct but unreadable — there is nothing to distinguish
 * "cancelled" from "the field was never touched". This one deletes the
 * typed suffix back to the last character the draft and the prior value
 * still agree on, then, if the prior value continued past that point,
 * types it back in. Both phases are driven by a spring stepping across
 * character indices rather than a fixed-duration tween, so the same
 * `spring` prop that shapes every other component's motion also shapes how
 * this one un-types.
 *
 * The two phases only run when there is a shared prefix worth walking from;
 * an edit that changed the very first character just cuts and re-types
 * from index zero, which is what the diff degenerates to correctly.
 *
 * `reverting` is a real state, not a transition out of `editing` — it is
 * what the field looks like while the rewind is visibly running, which is
 * the entire point of building this instead of calling `.focus()` and
 * resetting a string.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['idle', 'hover', 'editing', 'reverting'] as const

export type RevertFieldState = (typeof STATES)[number]

// The one visible surface that isn't the text itself: a thin indicator that
// widens and brightens with how "live" the field currently is. It's what
// lets `reverting` read as distinct from `editing` even mid-rewind, when the
// text alone is busy doing something else.
const underlineVariants = {
  'idle': { scaleX: 0.3, opacity: 0.35 },
  'hover': { scaleX: 0.55, opacity: 0.6 },
  'editing': { scaleX: 1, opacity: 1 },
  'reverting': { scaleX: 1, opacity: 0.6 },
} satisfies Record<RevertFieldState, object>

type MotionConflicts = 'style'

export type RevertFieldProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'value' | 'defaultValue' | MotionConflicts
> & {
  style?: React.CSSProperties
  /** Controlled committed value. Passing this hands control to you. */
  value?: string
  /** Initial committed value when uncontrolled. */
  defaultValue?: string
  /** Fires once, when an edit commits — on blur or Enter, not per keystroke. */
  onValueChange?: (value: string) => void
  /** Fires once the Escape rewind finishes, with the value it landed on. */
  onRevert?: (value: string) => void
  /** Spring stepping the rewind across character indices. */
  spring?: SpringName | Transition
  disabled?: boolean
  ref?: React.Ref<HTMLInputElement>
}

function sharedPrefixLength(a: string, b: string) {
  const max = Math.min(a.length, b.length)
  let i = 0
  while (i < max && a[i] === b[i]) i++
  return i
}

export function RevertField({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onRevert,
  spring = 'snap',
  disabled = false,
  className,
  ref,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  onChange,
  ...props
}: RevertFieldProps) {
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
  })

  const [hovered, setHovered] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [reverting, setReverting] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const transition = useZTransition(spring)

  const state: RevertFieldState = reverting ? 'reverting' : editing ? 'editing' : hovered ? 'hover' : 'idle'

  const priorRef = React.useRef(value)
  const stop = React.useRef<() => void>(() => {})
  const innerRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => innerRef.current!, [])

  // If the committed value changes from outside while the field is at rest,
  // the draft and the revert target should track it.
  React.useEffect(() => {
    if (!editing) {
      setDraft(value)
      priorRef.current = value
    }
  }, [value, editing])

  const revert = React.useCallback(
    (from: string, to: string) => {
      stop.current()
      if (from === to) {
        setEditing(false)
        innerRef.current?.blur()
        return
      }
      const p = sharedPrefixLength(from, to)

      if (transition.duration === 0) {
        setDraft(to)
        setValue(to)
        setEditing(false)
        onRevert?.(to)
        innerRef.current?.blur()
        return
      }

      setReverting(true)
      const finish = () => {
        setDraft(to)
        setValue(to)
        setReverting(false)
        setEditing(false)
        onRevert?.(to)
        innerRef.current?.blur()
      }

      const controls = animate(from.length, p, {
        ...transition,
        onUpdate: (v) => setDraft(from.slice(0, Math.round(v))),
        onComplete: () => {
          if (to.length <= p) {
            finish()
            return
          }
          const growControls = animate(p, to.length, {
            ...transition,
            onUpdate: (v) => setDraft(to.slice(0, Math.round(v))),
            onComplete: finish,
          })
          stop.current = () => growControls.stop()
        },
      })
      stop.current = () => controls.stop()
    },
    [onRevert, setValue, transition],
  )

  return (
    <div className="relative w-full">
      <input
        ref={innerRef}
        type="text"
        disabled={disabled}
        data-state={disabled ? 'idle' : state}
        value={draft}
        aria-label={props['aria-label'] ?? 'Editable value'}
        className={zcn(
          'min-h-11 w-full rounded-lg border border-current/25 bg-transparent px-3 text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
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
        onFocus={(e) => {
          stop.current()
          setReverting(false)
          priorRef.current = value
          setDraft(value)
          setEditing(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          if (reverting) return onBlur?.(e)
          setEditing(false)
          if (draft !== value) setValue(draft)
          onBlur?.(e)
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          onChange?.(e)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && editing) {
            e.preventDefault()
            revert(draft, priorRef.current)
          } else if (e.key === 'Enter' && editing) {
            e.preventDefault()
            innerRef.current?.blur()
          }
          onKeyDown?.(e)
        }}
        {...props}
      />
      <motion.span
        aria-hidden
        initial={false}
        animate={state}
        variants={underlineVariants}
        transition={transition}
        className="pointer-events-none absolute inset-x-3 -bottom-1 h-px origin-left bg-current"
      />
    </div>
  )
}
