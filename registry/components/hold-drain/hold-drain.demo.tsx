'use client'

import * as React from 'react'
import { HoldDrain, type HoldDrainState } from './hold-drain'

/**
 * The demo is the abort test, because the abort is the only claim a screenshot
 * cannot carry.
 *
 * Everything here exists to make the symmetry measurable rather than asserted:
 * the state readout, a count of how many holds were abandoned, and a duration
 * long enough that letting go at half is a decision you have time to make.
 * Committing is the boring half — anyone can fill a bar. Letting go at 70% and
 * watching 70% be paid back is the part worth building.
 */
export default function HoldDrainDemo() {
  const [state, setState] = React.useState<HoldDrainState>('idle')
  const [deleted, setDeleted] = React.useState(false)
  const [abandoned, setAbandoned] = React.useState(0)

  const probe = React.useRef<HTMLButtonElement>(null)

  // Read the attribute rather than a callback, so what is printed is what a
  // consumer's CSS would actually match — not a parallel copy of it.
  React.useEffect(() => {
    const el = probe.current
    if (!el) return
    const read = () => setState((el.dataset.state ?? 'idle') as HoldDrainState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [deleted])

  return (
    <div className="w-full max-w-md text-neutral-200">
      {deleted ? (
        <div className="flex min-h-11 items-center gap-3 font-mono text-xs text-neutral-500">
          <span>deleted</span>
          <button
            type="button"
            onClick={() => setDeleted(false)}
            className="min-h-11 px-2.5 underline-offset-4 hover:text-neutral-200 hover:underline"
          >
            put it back
          </button>
        </div>
      ) : (
        <HoldDrain
          ref={probe}
          label="Hold to delete"
          armedLabel="Release to delete"
          onConfirm={() => setDeleted(true)}
          onCancel={() => setAbandoned((n) => n + 1)}
        />
      )}

      <div className="mt-3 flex items-baseline gap-4 font-mono text-xs text-neutral-500">
        <span>
          data-state <span className="text-neutral-200">{state}</span>
        </span>
        <span>
          abandoned <span className="text-neutral-200 tabular-nums">{abandoned}</span>×
        </span>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-neutral-400">
        Let go halfway. The fill does not snap back — it is paid back, at the rate you earned it, so
        a half-hold takes half the hold to undo. Press again while it drains and it resumes from
        wherever it got to.
      </p>

      <div className="mt-8">
        <HoldDrain
          label="Shorter fuse"
          armedLabel="Release"
          duration={600}
          onConfirm={() => undefined}
          className="text-sm"
        />
        <p className="mt-3 font-mono text-xs text-neutral-500">
          duration 600 — the rate changes, the symmetry does not
        </p>
      </div>
    </div>
  )
}
