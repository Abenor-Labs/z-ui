'use client'

import { Disclosure } from '@/components/z-ui/disclosure'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off: `opening` and `closing` are entered by a click
 * landing while the height is still mid-flight, which the bench cannot
 * dispatch its way into. Click the trigger repeatedly, fast, to feel the
 * retarget instead.
 */
export function DisclosureBench({
  states,
  defaultSpring,
}: {
  states: string[]
  defaultSpring: SpringName
}) {
  return (
    <Bench
      states={states}
      defaultSpring={defaultSpring}
      forceable={false}
      render={({ spring }) => (
        <div className="w-full max-w-md divide-y divide-white/10">
          <Disclosure trigger="Click me fast, more than once" spring={spring}>
            Height is a spring here, not a duration — retargeting it mid-flight
            keeps whatever velocity it already had.
          </Disclosure>
          <Disclosure trigger="A second row, for the shared border" spring={spring}>
            Nothing special about this one — it's here so the divider between
            rows has something to divide.
          </Disclosure>
        </div>
      )}
    />
  )
}
