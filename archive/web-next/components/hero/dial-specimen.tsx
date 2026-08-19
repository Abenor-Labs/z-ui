'use client'

import * as React from 'react'
import { Dial, type DialState } from '@/components/z-ui/dial'
import { byName } from '@/__generated__/meta.js'

/**
 * The masthead's specimen, mounted like one: the shipped component, a live
 * reading, and the constants that drive it — scanned out of the source at
 * build time, not typed into this file.
 *
 * Four earlier heroes died here because the registry had nothing that could
 * carry the slot (a WebGL coil, a spring-versus-ease twin, a scroll reel, an
 * enlarged accordion — all set dressing for a collapsible panel). The dial is
 * the first component built to be grabbed within one second of the page
 * painting: no reading required, no state to reach, and the one thing it does
 * — keep spinning after your hand leaves — is the product thesis happening in
 * front of you.
 */

const SPRING = byName['dial']?.motion?.springs[0] ?? null
const RANGE = { min: 0, max: 12 } as const

export function DialSpecimen() {
  const [value, setValue] = React.useState(4)
  const [state, setState] = React.useState<DialState>('idle')
  const probe = React.useRef<HTMLDivElement>(null)

  // data-state read off the DOM, not mirrored from callbacks: what the plate
  // prints is what a consumer's own CSS selector would actually match.
  React.useEffect(() => {
    const el = probe.current?.querySelector('[data-state]')
    if (!(el instanceof HTMLElement)) return
    const read = () => setState((el.dataset.state ?? 'idle') as DialState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])

  const moving = state !== 'idle'

  return (
    <div
      ref={probe}
      className="w-full max-w-[24rem] overflow-hidden rounded-xl border border-control bg-surface"
    >
      {/* The plate's header: what this is, and what it is doing right now. */}
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <span className="lbl">specimen — dial</span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${moving ? 'bg-accent' : 'bg-control'}`}
          />
          {/* aria-live, because the reading is the demo for anyone not watching
              the needle: the state names arrive as the physics changes phase. */}
          <span aria-live="polite" className={`lbl-xs ${moving ? 'text-accent' : 'text-muted'}`}>
            {state}
          </span>
        </span>
      </div>

      {/* The instrument itself, on its own patch of graph paper. */}
      <div className="grid-paper flex items-center justify-center py-10">
        <Dial
          label="Demo dial. Flick it and it coasts to a detent."
          min={RANGE.min}
          max={RANGE.max}
          step={1}
          defaultValue={4}
          size={188}
          onValueChange={setValue}
          className="text-ink"
        />
      </div>

      {/* The readout row. Every number is either live or scanned from the
          component source by motion-scan at build time; nothing is typed in,
          so nothing here can drift from the file the CLI ships. */}
      <dl className="grid grid-cols-3 border-t border-rule">
        <div className="border-r border-hair px-5 py-3">
          <dt className="lbl-xs text-muted">value</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums text-ink">
            {value}
            <span className="text-muted">/{RANGE.max}</span>
          </dd>
        </div>
        <div className="border-r border-hair px-5 py-3">
          <dt className="lbl-xs text-muted">detent spring</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums text-ink">
            {SPRING ? `${SPRING.stiffness}/${SPRING.damping}` : '—'}
          </dd>
        </div>
        <div className="px-5 py-3">
          <dt className="lbl-xs text-muted">timeline</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums text-ink">none</dd>
        </div>
      </dl>
    </div>
  )
}
