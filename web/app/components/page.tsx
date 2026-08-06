import type { Metadata } from 'next'
import { components } from '@/__generated__/meta.js'
import { CatalogBrowser, type CatalogItem } from '@/components/catalog-browser'

export const metadata: Metadata = {
  title: 'Components',
  description:
    'Every component in the Z-UI registry, live. Filter by category, search by behaviour, and press any of them.',
}

export default function ComponentsPage() {
  // Narrowed to what a card actually reads. The generated meta also carries the
  // install graph, which is a page's worth of JSON to ship to the client for a
  // grid that never looks at it.
  const items: CatalogItem[] = components.map((c) => ({
    name: c.name,
    title: c.title,
    description: c.description,
    category: c.category,
    states: c.states,
    spring: c.spring,
  }))

  const stateCount = items.reduce((n, i) => n + i.states.length, 0)

  return (
    <main className="mx-auto max-w-[80rem] px-4 pb-28 md:px-16">
      <header className="py-14">
        <span className="lbl">catalog</span>
        <h1 className="t-lg mt-4 max-w-2xl">Every component, running.</h1>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Nothing below is a recording. Each card imports the same source the CLI writes into
          your project, so if a component breaks, this page breaks with it. Press them.
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <dt className="font-mono text-2xl tabular-nums text-ink">{items.length}</dt>
            <dd className="lbl mt-0.5">components</dd>
          </div>
          <div>
            <dt className="font-mono text-2xl tabular-nums text-ink">{stateCount}</dt>
            <dd className="lbl mt-0.5">documented states</dd>
          </div>
          <div>
            <dt className="font-mono text-2xl tabular-nums text-ink">4</dt>
            <dd className="lbl mt-0.5">springs in the scale</dd>
          </div>
        </dl>
      </header>

      <CatalogBrowser items={items} />
    </main>
  )
}
