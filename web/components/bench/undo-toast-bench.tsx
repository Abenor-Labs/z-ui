'use client'

import * as React from 'react'
import { UndoToast } from '@/components/z-ui/undo-toast'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off. `counting` is a clock, `dragging` is a gesture, and
 * `leaving` is the end of one — none of them is a pointer position the bench
 * could dispatch its way into. The reader deletes something and then interferes
 * with the grace period, which is the whole interaction.
 */
export function UndoToastBench({
  states,
  defaultSpring,
}: {
  states: string[]
  defaultSpring: SpringName
}) {
  const [pending, setPending] = React.useState<string | null>('Draft — pricing page')
  const [log, setLog] = React.useState<string | null>(null)
  const [nonce, setNonce] = React.useState(0)

  const fire = () => {
    setLog(null)
    setPending('Draft — pricing page')
    setNonce((n) => n + 1)
  }

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <div className="grid min-h-24 w-full max-w-md place-items-center">
            {pending ? (
              <UndoToast
                key={nonce}
                // The component inverts: it takes its ground from the host's
                // text colour and its own text from `--z-toast-fg`, so both
                // have to name what the bench stage is painted with.
                style={{ '--z-toast-fg': 'var(--color-panel)' } as React.CSSProperties}
                className="text-ink"
                spring={spring}
                duration={5000}
                onUndo={() => {
                  setPending(null)
                  setLog('restored')
                }}
                onCommit={() => {
                  setPending(null)
                  setLog('permanent')
                }}
              >
                Deleted “{pending}”
              </UndoToast>
            ) : (
              <button
                type="button"
                onClick={fire}
                className="rounded-lg border border-white/10 px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                delete something else
              </button>
            )}
          </div>
        )}
      />
      <p className="lbl" aria-live="polite">
        {log ? `last outcome · ${log}` : 'hover the toast to stall the clock, or flick it sideways'}
      </p>
    </div>
  )
}
