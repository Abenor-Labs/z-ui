'use client'

import * as React from 'react'
import { Reorder } from './reorder'

const INITIAL = [
  { id: 'a', label: 'Draft the brief' },
  { id: 'b', label: 'Review with design' },
  { id: 'c', label: 'Ship the spec' },
  { id: 'd', label: 'Announce it' },
]

export default function ReorderDemo() {
  const [items, setItems] = React.useState(INITIAL)

  return (
    <div className="w-full max-w-md text-neutral-200">
      <Reorder
        items={items}
        keyExtractor={(item) => item.id}
        onReorder={setItems}
        renderItem={(item) => <span className="text-sm">{item.label}</span>}
      />
    </div>
  )
}
