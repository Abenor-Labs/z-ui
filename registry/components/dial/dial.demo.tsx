'use client'

import * as React from 'react'
import { Dial, type DialState } from './dial'

/**
 * The demo is one dial and the pulse train it emits, because the pulse train is
 * the component's whole claim: the digit is not a value the dial reports, it is
 * a count of clicks the governor trips on the way back. Dialling 0 takes ten
 * times as long as dialling 1, and the readings below are the only way to see
 * that rather than just feel it.
 *
 * Every number comes from the component's own callbacks — the demo keeps no
 * second copy of the mechanism to drift from it.
 */
export default function DialDemo() {
  const [dialed, setDialed] = React.useState<number | null>(null)
  const [pulse, setPulse] = React.useState<{ i: number; n: number } | null>(null)
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
        size={240}
        onDigit={setDialed}
        onPulse={(i, n) => setPulse({ i, n })}
      />

      <dl className="flex gap-6 font-mono text-xs text-neutral-500">
        <div className="flex gap-2">
          <dt>dialed</dt>
          <dd className="tabular-nums text-neutral-200">{dialed ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt>pulses</dt>
          <dd className="tabular-nums text-neutral-200">
            {pulse ? `${pulse.i} / ${pulse.n}` : '—'}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>state</dt>
          <dd className="tabular-nums text-neutral-200">{state}</dd>
        </div>
      </dl>

      <p className="max-w-[38ch] text-center text-xs leading-relaxed text-neutral-500">
        Put a finger in a hole, pull to the stop, let go. The pulses trip on the way back, one every
        30 degrees — so 1 is one click and 0 is ten. Enter or Space on a focused hole dials it too.
        Pass <code>sound</code> for the mechanical click.
      </p>
    </div>
  )
}
