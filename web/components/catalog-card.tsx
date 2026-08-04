'use client'

import Link from 'next/link'
import { LikeButton } from '@/components/z-ui/like-button'

/**
 * The card preview is the live component, not a video or a screenshot. At this
 * catalog size that is simply cheaper and truer; if the registry ever reaches a
 * few dozen components this becomes a captured-media problem instead.
 */
const PREVIEW: Record<string, React.ReactNode> = {
  'like-button': <LikeButton aria-label="Like, catalog preview" />,
}

export function CatalogCard({
  item,
}: {
  item: { name: string; title: string; description: string; category: string; states: string[] }
}) {
  return (
    <Link
      href={`/c/${item.name}`}
      className="group flex flex-col border border-rule bg-panel transition-colors hover:border-muted"
    >
      <div className="grid min-h-32 place-items-center border-b border-rule">
        {PREVIEW[item.name] ?? null}
      </div>
      <div className="flex flex-col gap-1.5 px-5 py-4">
        <span className="lbl !text-mint">{item.category}</span>
        <span className="font-mono text-sm text-silkscreen">{item.name}</span>
        <span className="text-sm text-muted">{item.description}</span>
        <span className="lbl mt-1">{item.states.length} states</span>
      </div>
    </Link>
  )
}
