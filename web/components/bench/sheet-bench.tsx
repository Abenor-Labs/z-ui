'use client'

import * as React from 'react'
import { Sheet } from '@/components/z-ui/sheet'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off: every state here is a consequence of a drag the
 * bench cannot dispatch its way into — `dragging` is a hand on the panel,
 * `settling` is the spring finishing what the hand started.
 */
export function SheetBench({ states, defaultSpring }: { states: string[]; defaultSpring: SpringName }) {
  const [detent, setDetent] = React.useState(1)

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <div className="w-full max-w-sm">
            <Sheet detent={detent} onDetentChange={setDetent} height={280} spring={spring}>
              <p className="pt-2 text-sm text-muted">
                Flick upward from the bottom — a fast throw lands on the top
                detent even released well short of it.
              </p>
            </Sheet>
          </div>
        )}
      />
      <p className="lbl" aria-live="polite">
        detent · {detent < 0 ? 'closed' : detent}
      </p>
    </div>
  )
}
