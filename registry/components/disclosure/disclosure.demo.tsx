'use client'

import * as React from 'react'
import { Disclosure, type DisclosureState } from './disclosure'

/**
 * The demo is the interruption test, because that is the only claim this
 * component makes that a screenshot cannot carry. Everything on screen exists
 * to make a reversal mid-flight visible: the state readout, the settle
 * counter, and a panel tall enough that there is real travel to interrupt.
 */
export default function DisclosureDemo() {
  const [state, setState] = React.useState<DisclosureState>('closed')
  const [settles, setSettles] = React.useState(0)
  const [controlled, setControlled] = React.useState(false)

  const probe = React.useRef<HTMLDivElement>(null)

  // Read the attribute rather than a callback, so what is printed is what a
  // consumer's CSS would actually match — not a parallel copy of it.
  React.useEffect(() => {
    const el = probe.current
    if (!el) return
    const read = () => setState((el.dataset.state ?? 'closed') as DisclosureState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full max-w-md text-neutral-200">
      <Disclosure
        ref={probe}
        label="Press me twice, quickly"
        onOpenChangeComplete={() => setSettles((n) => n + 1)}
      >
        <p className="text-sm leading-relaxed">
          Height is a spring, not a transition. Interrupt this halfway and it turns around from
          where it got to, at the speed it was already travelling — it does not stall, queue, or
          restart.
        </p>
      </Disclosure>

      <div className="mt-3 flex items-baseline gap-4 font-mono text-xs text-neutral-500">
        <span>
          data-state <span className="text-neutral-200">{state}</span>
        </span>
        <span>
          settled <span className="text-neutral-200 tabular-nums">{settles}</span>×
        </span>
      </div>

      <div className="mt-8">
        <Disclosure
          label="Controlled from outside"
          open={controlled}
          onOpenChange={setControlled}
        >
          <p className="text-sm leading-relaxed">
            The trigger reports instead of deciding. Both it and the button below drive the same
            value, so mashing both is the same as mashing one.
          </p>
        </Disclosure>
        <button
          type="button"
          onClick={() => setControlled((v) => !v)}
          className="mt-3 min-h-11 rounded-md px-2.5 font-mono text-xs text-neutral-400 underline-offset-4 hover:text-neutral-200 hover:underline"
        >
          toggle from outside
        </button>
      </div>
    </div>
  )
}
