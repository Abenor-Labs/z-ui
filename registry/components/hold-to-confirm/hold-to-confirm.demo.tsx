'use client'

import * as React from 'react'
import { HoldToConfirm } from './hold-to-confirm'

export default function HoldToConfirmDemo() {
  const [gone, setGone] = React.useState(false)
  const [abandoned, setAbandoned] = React.useState<number | null>(null)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 text-neutral-200">
      {gone ? (
        <button
          type="button"
          onClick={() => {
            setGone(false)
            setAbandoned(null)
          }}
          className="h-11 rounded-lg border border-white/15 px-4 text-sm"
        >
          Restore workspace
        </button>
      ) : (
        <HoldToConfirm
          duration={1200}
          onConfirm={() => setGone(true)}
          onAbandon={(p) => setAbandoned(p)}
        >
          Hold to delete workspace
        </HoldToConfirm>
      )}

      <p className="text-sm text-neutral-500">
        {gone
          ? 'Deleted.'
          : abandoned !== null
            ? `Let go at ${Math.round(abandoned * 100)}%.`
            : 'Press and keep holding. Let go early and it unwinds.'}
      </p>
    </div>
  )
}
