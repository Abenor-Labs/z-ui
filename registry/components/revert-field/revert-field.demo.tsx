'use client'

import * as React from 'react'
import { RevertField } from './revert-field'

export default function RevertFieldDemo() {
  const [value, setValue] = React.useState('Abenor Labs')

  return (
    <div className="w-full max-w-sm text-neutral-200">
      <RevertField value={value} onValueChange={setValue} aria-label="Workspace name" />
      <p className="mt-4 text-sm text-neutral-500">
        Edit it, then press Escape — it un-types back to “{value}” instead of
        snapping.
      </p>
    </div>
  )
}
