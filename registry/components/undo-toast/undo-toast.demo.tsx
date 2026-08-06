'use client'

import * as React from 'react'
import { UndoToast } from './undo-toast'

export default function UndoToastDemo() {
  const [items, setItems] = React.useState(['Draft — pricing page', 'Draft — changelog'])
  const [pending, setPending] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-md flex-col gap-4 text-neutral-200">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3">
          <span className="text-sm">{item}</span>
          <button
            type="button"
            onClick={() => {
              setItems((prev) => prev.filter((i) => i !== item))
              setPending(item)
            }}
            className="ml-auto h-11 px-2 text-sm text-neutral-400"
          >
            Delete
          </button>
        </div>
      ))}

      {pending ? (
        <UndoToast
          duration={5000}
          onUndo={() => {
            setItems((prev) => [...prev, pending])
            setPending(null)
          }}
          onCommit={() => setPending(null)}
        >
          Deleted “{pending}”
        </UndoToast>
      ) : null}
    </div>
  )
}
