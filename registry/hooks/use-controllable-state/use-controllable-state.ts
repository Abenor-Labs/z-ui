'use client'

import * as React from 'react'

export type UseControllableStateParams<T> = {
  /** The controlled value. Passing anything other than `undefined` puts the component in controlled mode. */
  prop?: T | undefined
  /** The initial value in uncontrolled mode. */
  defaultProp: T
  /** Called with the next value whenever it actually changes, in both modes. */
  onChange?: (state: T) => void
}

/**
 * State that is uncontrolled by default and controlled when a value is passed.
 *
 * This is what lets `<LikeButton />` work with no wiring while
 * `<LikeButton pressed={x} onPressedChange={setX} />` hands control to the
 * consumer. Mode is decided by whether `prop` is `undefined`, checked on every
 * render, matching the Radix convention consumers already expect.
 *
 * Two details worth knowing before editing this file:
 *
 * `onChange` is held in a ref and refreshed on every render, so an inline
 * arrow function passed by the consumer never causes `setValue` to change
 * identity. Without it, every component using this hook would re-render its
 * children on each parent render.
 *
 * `setValue` closes over the current `value` rather than reading it from a ref
 * mutated during render. The tradeoff: two calls in the same tick both resolve
 * against the same value, so the second is a no-op when it targets the same
 * result. For toggles that is the correct behavior anyway, and it avoids
 * mutating a ref during render, which is unsafe under concurrent rendering.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, (next: React.SetStateAction<T>) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultProp)

  const isControlled = prop !== undefined
  const value = isControlled ? prop : uncontrolled

  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })

  const setValue = React.useCallback(
    (next: React.SetStateAction<T>) => {
      const nextValue =
        typeof next === 'function'
          ? (next as (prev: T) => T)(value)
          : next

      if (Object.is(nextValue, value)) return

      // In controlled mode the consumer owns the value; we only report.
      if (!isControlled) setUncontrolled(nextValue)
      onChangeRef.current?.(nextValue)
    },
    [value, isControlled],
  )

  return [value, setValue]
}
