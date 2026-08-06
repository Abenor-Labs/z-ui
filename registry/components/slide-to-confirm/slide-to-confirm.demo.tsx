'use client'

import * as React from 'react'
import { SlideToConfirm } from './slide-to-confirm'

export default function SlideToConfirmDemo() {
  const [count, setCount] = React.useState(0)

  return (
    <div className="w-full max-w-sm text-neutral-200">
      <SlideToConfirm key={count} onConfirm={() => setCount((c) => c + 1)}>
        Slide to end trip
      </SlideToConfirm>
      <p className="mt-4 text-sm text-neutral-500">
        Let go short of the end and watch it overshoot on the way back.
        {count > 0 ? ` Confirmed ${count}×.` : ''}
      </p>
    </div>
  )
}
