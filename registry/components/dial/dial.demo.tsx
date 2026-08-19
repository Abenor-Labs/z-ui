'use client'

import * as React from 'react'
import { Dial, type DialState } from './dial'

/**
 * The demo is one dial and its live reading, because the component's whole
 * claim is the gap between the two: flick the knob and watch the value keep
 * changing after your hand has left. The reading comes from the component's
 * own callbacks — the demo has no second copy of the physics to drift.
 */
export default function DialDemo() {
  const [value, setValue] = React.useState(4)
  const [settled, setSettled] = React.useState(4)
  const [state, setState] = React.useState<DialState>('idle')
  const probe = React.useRef<HTMLDivElement>(null)

  // data-state read off the DOM rather than mirrored from callbacks, so what
  // is printed is what a consumer's CSS would actually match.
  React.useEffect(() => {
    const el = probe.current?.querySelector('[data-state]')
    if (!(el instanceof HTMLElement)) return
    const read = () => setState((el.dataset.state ?? 'idle') as DialState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={probe} className="flex w-full max-w-md flex-col items-center gap-5">
      <Dial
        label="Demo value"
        min={0}
        max={12}
        step={1}
        defaultValue={4}
        size={128}
        onValueChange={setValue}
        onSettle={setSettled}
      />

      <dl className="flex gap-6 font-mono text-xs text-neutral-500">
        <div className="flex gap-2">
          <dt>live</dt>
          <dd className="tabular-nums text-neutral-200">{value}</dd>
        </div>
        <div className="flex gap-2">
          <dt>settled</dt>
          <dd className="tabular-nums text-neutral-200">{settled}</dd>
        </div>
        <div className="flex gap-2">
          <dt>state</dt>
          <dd className="tabular-nums text-neutral-200">{state}</dd>
        </div>
      </dl>

      <p className="max-w-[38ch] text-center text-xs leading-relaxed text-neutral-500">
        Turn it, or flick it and let go — it spins down through the detents and the nearest one
        catches it. Grab it mid-spin and the spin is yours again. Arrow keys ratchet one detent.
      </p>
    </div>
  )
}
