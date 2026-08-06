'use client'

import * as React from 'react'
import { RevertField } from '@/components/z-ui/revert-field'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

/**
 * The demo is a real import of the shipped component, not a copy.
 *
 * The state chips are off: `reverting` is entered by pressing Escape mid-edit,
 * which is a keystroke the bench cannot dispatch into an already-focused
 * field on the reader's behalf. Edit the value, then press Escape.
 */
export function RevertFieldBench({
  states,
  defaultSpring,
}: {
  states: string[]
  defaultSpring: SpringName
}) {
  const [value, setValue] = React.useState('Abenor Labs')

  return (
    <div className="grid gap-3">
      <Bench
        states={states}
        defaultSpring={defaultSpring}
        forceable={false}
        render={({ spring }) => (
          <div className="w-full max-w-sm">
            <RevertField value={value} onValueChange={setValue} spring={spring} aria-label="Workspace name" />
          </div>
        )}
      />
      <p className="lbl" aria-live="polite">
        current · “{value}” — edit it, then press Escape
      </p>
    </div>
  )
}
