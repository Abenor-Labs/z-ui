'use client'

import * as React from 'react'
import { CatalogCard } from '@/components/catalog-card'
import { WIDE } from '@/lib/catalog-layout'

export type CatalogItem = {
  name: string
  title: string
  description: string
  category: string
  states: string[]
  spring: string
}

/**
 * The catalogue browser.
 *
 * Filtering happens in the client rather than through the URL router because
 * every card holds a live, stateful component — a route change would remount
 * ten of them to change which four are shown. The category is mirrored into the
 * query string so a filtered view can still be linked to, but with
 * `replaceState`, so browsing categories does not fill the back button with
 * steps the reader has to walk out of.
 */
export function CatalogBrowser({ items }: { items: CatalogItem[] }) {
  const [category, setCategory] = React.useState('all')
  const [query, setQuery] = React.useState('')

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of items) counts.set(i.category, (counts.get(i.category) ?? 0) + 1)
    return [
      { key: 'all', count: items.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([key, count]) => ({ key, count })),
    ]
  }, [items])

  // Read the category out of the URL once, so a shared link lands filtered.
  React.useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('category')
    if (c) setCategory(c)
  }, [])

  React.useEffect(() => {
    const qs = category === 'all' ? '' : `?category=${category}`
    window.history.replaceState(null, '', qs || window.location.pathname)
  }, [category])

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (category !== 'all' && i.category !== category) return false
      if (!q) return true
      return (
        i.title.toLowerCase().includes(q) ||
        i.name.includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.states.some((s) => s.includes(q))
      )
    })
  }, [items, category, query])

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 border-y border-hair py-4 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              aria-pressed={category === c.key}
              className={
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ' +
                (category === c.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-white/10 text-muted hover:border-white/25 hover:text-ink')
              }
            >
              {c.key}
              <span className="tabular-nums opacity-60">{c.count}</span>
            </button>
          ))}
        </div>

        <label className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 focus-within:border-accent md:ml-auto md:w-64">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            className="shrink-0 text-muted"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4.5 4.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, state, behaviour"
            aria-label="Search components"
            className="min-w-0 flex-1 bg-transparent font-mono text-xs text-ink outline-none placeholder:text-muted"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 font-mono text-xs text-muted hover:text-ink"
            >
               esc
            </button>
          ) : null}
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-base text-ink">Nothing matches “{query}”.</p>
          <p className="lbl mt-2">
            Try a state name like <span className="!text-accent">dragging</span>, or clear the
            filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {shown.map((c) => (
            <div key={c.name} className={WIDE.has(c.name) ? 'md:col-span-2' : undefined}>
              <CatalogCard item={c} />
            </div>
          ))}
        </div>
      )}

      <p className="lbl mt-8">
        showing {shown.length} of {items.length} · more land as they meet the bar
      </p>
    </>
  )
}
