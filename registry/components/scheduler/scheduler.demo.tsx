'use client'

import * as React from 'react'
import { Scheduler } from './scheduler'

const CLOSED_WEEKDAYS = new Set([0, 6])
const SLOTS = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00']

function slotsForDate(date: Date) {
  if (CLOSED_WEEKDAYS.has(date.getDay())) return []
  // Pretend the 17th–19th are fully booked, so a few real days read as
  // unavailable in the grid.
  const d = date.getDate()
  if (d >= 17 && d <= 19) return []
  return SLOTS
}

export default function SchedulerDemo() {
  const [booked, setBooked] = React.useState<string | null>(null)

  return (
    <div className="text-neutral-200">
      <Scheduler
        slotsForDate={slotsForDate}
        onConfirm={(date, slot) =>
          setBooked(`${date.toDateString()} at ${slot}`)
        }
      />
      {booked ? <p className="mt-4 text-sm text-neutral-400">Confirmed: {booked}</p> : null}
    </div>
  )
}
