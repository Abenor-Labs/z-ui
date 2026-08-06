'use client'

import * as React from 'react'
import { Scheduler } from '@/components/z-ui/scheduler'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

const CLOSED_WEEKDAYS = new Set([0, 6])
const SLOTS = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15']

function slotsForDate(date: Date) {
  if (CLOSED_WEEKDAYS.has(date.getDay())) return []
  const d = date.getDate()
  if (d >= 17 && d <= 19) return []
  return SLOTS
}

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off: `previewing` is a hover the bench cannot
 * dispatch its way into on the reader's behalf, and `committed` follows
 * from a real click. Hover a few times without clicking, then commit one.
 */
export function SchedulerBench({ states, defaultSpring }: { states: string[]; defaultSpring: SpringName }) {
  const [confirmed, setConfirmed] = React.useState<string | null>(null)

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <Scheduler
            spring={spring}
            slotsForDate={slotsForDate}
            onConfirm={(date, slot) => setConfirmed(`${date.toDateString()} · ${slot}`)}
          />
        )}
      />
      <p className="lbl" aria-live="polite">
        {confirmed ? `confirmed · ${confirmed}` : 'hover a time without clicking, then commit one'}
      </p>
    </div>
  )
}
