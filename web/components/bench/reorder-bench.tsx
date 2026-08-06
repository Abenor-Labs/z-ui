'use client'

import * as React from 'react'
import { Reorder } from '@/components/z-ui/reorder'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

const INITIAL = [
  { id: 'a', label: 'Draft the brief' },
  { id: 'b', label: 'Review with design' },
  { id: 'c', label: 'Ship the spec' },
  { id: 'd', label: 'Announce it' },
  { id: 'e', label: 'Watch it land' },
]

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off: every state describes the list mid-gesture, and
 * a gesture is the one thing the bench cannot dispatch on the reader's
 * behalf. Drag the top row to the bottom and watch the ones in between
 * catch up out of sync with each other, not all at once.
 */
export function ReorderBench({ states, defaultSpring }: { states: string[]; defaultSpring: SpringName }) {
  const [items, setItems] = React.useState(INITIAL)

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <div className="w-full max-w-md">
            <Reorder
              items={items}
              keyExtractor={(item) => item.id}
              onReorder={setItems}
              spring={spring}
              renderItem={(item) => <span className="text-sm text-ink">{item.label}</span>}
            />
          </div>
        )}
      />
      <p className="lbl" aria-live="polite">
        drag the grip on the far left, or focus it and use arrow keys
      </p>
    </div>
  )
}
