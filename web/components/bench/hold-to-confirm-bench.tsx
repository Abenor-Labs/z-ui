'use client'

import * as React from 'react'
import { HoldToConfirm } from '@/components/z-ui/hold-to-confirm'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off. `holding` and `releasing` are a pressure that has
 * lasted a measurable amount of time, and `confirmed` is the far end of it —
 * a pointerdown alone reaches none of them. The reader has to hold it, and
 * letting go early is the half of the interaction worth feeling.
 */
export function HoldToConfirmBench({
  states,
  defaultSpring,
}: {
  states: string[]
  defaultSpring: SpringName
}) {
  const [outcome, setOutcome] = React.useState<string | null>(null)

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <HoldToConfirm
            spring={spring}
            onConfirm={() => setOutcome('confirmed')}
            onAbandon={(progress) => setOutcome(`abandoned at ${Math.round(progress * 100)}%`)}
          >
            Delete everything
          </HoldToConfirm>
        )}
      />
      <p className="lbl" aria-live="polite">
        {outcome ? `last outcome · ${outcome}` : 'press and keep holding, or let go early'}
      </p>
    </div>
  )
}
