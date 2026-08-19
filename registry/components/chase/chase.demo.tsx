'use client'

import * as React from 'react'
import { Chase, type ChaseState } from './chase'

/**
 * Four options rather than two, because the component's claim is about
 * distance: the stretch is physics, so a jump across three segments deforms
 * the pill visibly more than a jump to the neighbour. Two options would make
 * every jump the same jump and the claim unfalsifiable.
 */
export default function ChaseDemo() {
  const [value, setValue] = React.useState('day')
  const [state, setState] = React.useState<ChaseState>('idle')
  const probe = React.useRef<HTMLDivElement>(null)

  // Read off the DOM so what is printed is what a consumer's CSS would match.
  React.useEffect(() => {
    const el = probe.current?.querySelector('[data-state]')
    if (!(el instanceof HTMLElement)) return
    const read = () => setState((el.dataset.state ?? 'idle') as ChaseState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={probe} className="flex w-full max-w-md flex-col items-center gap-5">
      <Chase
        label="Range"
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'all', label: 'All time' },
        ]}
        defaultValue="day"
        onValueChange={setValue}
      />

      <dl className="flex gap-6 font-mono text-xs text-neutral-500">
        <div className="flex gap-2">
          <dt>value</dt>
          <dd className="tabular-nums text-neutral-200">{value}</dd>
        </div>
        <div className="flex gap-2">
          <dt>state</dt>
          <dd className="tabular-nums text-neutral-200">{state}</dd>
        </div>
      </dl>

      <p className="max-w-[40ch] text-center text-xs leading-relaxed text-neutral-500">
        Jump from Day to All time and the pill stretches with its own speed. Change your mind while
        it is travelling — both edges turn around with the velocity they already have.
      </p>
    </div>
  )
}
