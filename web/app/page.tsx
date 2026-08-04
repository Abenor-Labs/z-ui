import Link from 'next/link'
import { components } from '@/__generated__/meta.js'
import { CatalogCard } from '@/components/catalog-card'

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6">
      <section className="border-b border-rule py-20">
        <p className="lbl mb-5">micro-interactions, as source you own</p>
        <h1 className="max-w-2xl font-mono text-4xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
          Springs, not easings.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          A registry of state-driven micro-interactions for React. The CLI writes the
          component into your project. From then on it is your file, with nothing to
          upgrade and no wrapper API to learn.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/c/${components[0]?.name ?? ''}`}
            className="border border-mint px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-mint transition-colors hover:bg-mint hover:text-chassis"
          >
            Open the bench
          </Link>
          <span className="lbl">
            {components.length} component{components.length === 1 ? '' : 's'} · pre-alpha
          </span>
        </div>
      </section>

      <section className="py-14">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="lbl">catalog</span>
          <span className="lbl">press anything</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {components.map((c) => (
            <CatalogCard key={c.name} item={c} />
          ))}
        </div>
      </section>
    </main>
  )
}
