'use client'

import * as React from 'react'
import { Scrub } from './scrub'

const DURATION = 222

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function ScrubDemo() {
  const [position, setPosition] = React.useState(0.32)
  const [seeked, setSeeked] = React.useState<string | null>(null)

  return (
    <div className="w-full max-w-md text-neutral-200">
      <div className="mb-6 flex items-baseline gap-3">
        <span className="text-base font-medium">Overshoot</span>
        <span className="text-sm text-neutral-500">Abenor Labs</span>
      </div>

      <Scrub
        value={position}
        onValueChange={setPosition}
        onValueCommit={(v) => setSeeked(clock(v * DURATION))}
        buffered={0.78}
        formatValue={(v) => `${clock(v * DURATION)} of ${clock(DURATION)}`}
      />

      <div className="flex justify-between font-mono text-xs text-neutral-500 tabular-nums">
        <span>{clock(position * DURATION)}</span>
        <span>{clock(DURATION)}</span>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-neutral-500">
        Drag along the bar to seek. Keep holding and pull away from it — the further
        you go, the finer it gets. Release with speed and it keeps travelling.
        {seeked ? <span className="block pt-2 text-neutral-300">Seeked to {seeked}</span> : null}
      </p>
    </div>
  )
}
