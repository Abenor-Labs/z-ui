'use client'

import * as React from 'react'
import { Sheet } from './sheet'

export default function SheetDemo() {
  const [detent, setDetent] = React.useState(1)

  return (
    <div className="mx-auto w-full max-w-sm text-neutral-200">
      <Sheet detent={detent} onDetentChange={setDetent} height={360}>
        <div className="grid gap-2 pt-2">
          <p className="text-sm text-neutral-400">
            Flick upward from the bottom — a fast enough throw lands on the top
            detent even if you let go well short of it.
          </p>
          <p className="font-mono text-xs text-neutral-500">detent {detent}</p>
        </div>
      </Sheet>
    </div>
  )
}
