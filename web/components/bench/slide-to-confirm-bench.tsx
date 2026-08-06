'use client'

import * as React from 'react'
import { SlideToConfirm } from '@/components/z-ui/slide-to-confirm'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off: `dragging` and `snapping-back` are read from a
 * gesture in flight, which the bench cannot dispatch its way into. Let go
 * short of the end, more than once, to feel the recoil read your speed.
 */
export function SlideToConfirmBench({
  states,
  defaultSpring,
}: {
  states: string[]
  defaultSpring: SpringName
}) {
  const [count, setCount] = React.useState(0)
  const [nonce, setNonce] = React.useState(0)

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <div className="w-full max-w-sm">
            <SlideToConfirm
              key={nonce}
              spring={spring}
              onConfirm={() => {
                setCount((c) => c + 1)
                window.setTimeout(() => setNonce((n) => n + 1), 900)
              }}
            >
              Slide to end trip
            </SlideToConfirm>
          </div>
        )}
      />
      <p className="lbl" aria-live="polite">
        {count > 0 ? `confirmed ${count}×` : 'let go short of the end, then try a fast flick'}
      </p>
    </div>
  )
}
