import Link from 'next/link'
import { components } from '@/__generated__/meta.js'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[64rem] flex-col justify-center px-4 py-24 md:px-16">
      <span className="lbl">404</span>
      <h1 className="t-lg mt-4">No component by that name.</h1>
      <p className="mt-3 max-w-xl text-base text-muted">
        The registry is deliberately small — small enough to try all of it in one sitting.
        Everything in it is here:
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {components.map((c) => (
          <Link
            key={c.name}
            href={`/c/${c.name}`}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel px-5 py-4 transition-colors hover:border-accent"
          >
            <span className="font-mono text-sm text-ink">{c.name}</span>
            <span className="lbl ml-auto">{c.category}</span>
          </Link>
        ))}
      </div>

      <Link href="/" className="lbl mt-10 transition-colors hover:!text-accent">
        ← home
      </Link>
    </main>
  )
}
