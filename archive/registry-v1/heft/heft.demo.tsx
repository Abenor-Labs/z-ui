'use client'

import * as React from 'react'
import { Heft, HeftItem, type HeftState } from './heft'

/**
 * The demo is a pile, because a pile is the only arrangement where moving one
 * thing has consequences for things you did not touch.
 *
 * Six bodies of three sizes. Pull the one at the bottom of a stack and what was
 * resting on it drops; shove one along the floor and it ploughs the rest ahead
 * of it. Neither is scripted — there is one solver and it does not know which
 * body your hand is on.
 */
export default function HeftDemo() {
  const [state, setState] = React.useState<HeftState>('idle')
  const [settles, setSettles] = React.useState(0)
  const probe = React.useRef<HTMLDivElement>(null)

  // Read the attribute rather than a callback, so what is printed is what a
  // consumer's CSS would actually match, not a parallel copy of it.
  React.useEffect(() => {
    const el = probe.current?.querySelector('[data-state]')
    if (!(el instanceof HTMLElement)) return
    const read = () => setState((el.dataset.state ?? 'idle') as HeftState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={probe} className="w-full max-w-md text-neutral-200">
      <Heft onSettle={() => setSettles((n) => n + 1)} className="h-56 w-full">
        <HeftItem label="Large disc">
          <span className="block size-14 rounded-full bg-neutral-100" />
        </HeftItem>
        <HeftItem label="Large disc, second">
          <span className="block size-14 rounded-full bg-neutral-400" />
        </HeftItem>
        <HeftItem label="Medium disc">
          <span className="block size-10 rounded-full bg-neutral-500" />
        </HeftItem>
        <HeftItem label="Medium disc, second">
          <span className="block size-10 rounded-full bg-neutral-600" />
        </HeftItem>
        <HeftItem label="Small disc">
          <span className="block size-7 rounded-full bg-neutral-300" />
        </HeftItem>
        <HeftItem label="Small disc, second">
          <span className="block size-7 rounded-full bg-neutral-700" />
        </HeftItem>
      </Heft>

      <dl className="mt-4 flex gap-6 font-mono text-xs text-neutral-500">
        <div className="flex gap-2">
          <dt>state</dt>
          <dd className="tabular-nums text-neutral-200">{state}</dd>
        </div>
        <div className="flex gap-2">
          <dt>settled</dt>
          <dd className="tabular-nums text-neutral-200">{settles}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Stack two, then pull the bottom one out. Or pick one up, carry it to the far wall and let go
        mid-swing — it keeps the speed your hand gave it and takes the pile with it.
      </p>
    </div>
  )
}
