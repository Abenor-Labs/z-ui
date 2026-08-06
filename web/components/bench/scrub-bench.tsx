'use client'

import * as React from 'react'
import { Scrub } from '@/components/z-ui/scrub'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

const DURATION = 222

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * The demo is a real import of the shipped component, not a copy. If the
 * registry source breaks, this page breaks with it, which is the point.
 *
 * The state chips are off: `scrubbing-fine` is entered by pulling the pointer
 * away from the track mid-drag, which no pair of synthetic events reproduces.
 * Claiming a chip could put the component there would be a lie the bench exists
 * to prevent.
 */
export function ScrubBench({ states, defaultSpring }: { states: string[]; defaultSpring: SpringName }) {
  const [value, setValue] = React.useState(0.32)
  const [seeked, setSeeked] = React.useState<string | null>(null)

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <div className="w-full max-w-lg">
            <Scrub
              value={value}
              onValueChange={setValue}
              onValueCommit={(v) => setSeeked(clock(v * DURATION))}
              spring={spring}
              buffered={0.78}
              formatValue={(v) => `${clock(v * DURATION)} of ${clock(DURATION)}`}
              aria-label="Seek"
            />
            <div className="flex justify-between font-mono text-xs tabular-nums text-muted">
              <span>{clock(value * DURATION)}</span>
              <span>{clock(DURATION)}</span>
            </div>
          </div>
        )}
      />
      <p className="lbl" aria-live="polite">
        {seeked ? `last commit · ${seeked}` : 'drag the bar, then pull away from it'}
      </p>
    </div>
  )
}
