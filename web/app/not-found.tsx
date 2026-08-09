import Link from 'next/link'
import { components } from '@/__generated__/meta.js'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { componentHref } from '@/lib/registry'

/**
 * Stays at the app root rather than moving into `(site)` with the other
 * pages: Next resolves an unmatched URL against the root `not-found`, and a
 * copy inside a route group only covers that group's own segments. It wears
 * the site chrome explicitly instead of inheriting it.
 */
export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto flex min-h-[60vh] max-w-[64rem] flex-col justify-center px-4 pt-16 pb-24 md:px-16">
        <span className="lbl">404</span>
        <h1 className="t-lg mt-4">No component by that name.</h1>

        {components.length === 0 ? (
          // The registry was cleared to be rebuilt. Listing "everything in it"
          // when it holds nothing reads as a broken page rather than an empty
          // one, so the sentence changes with the count instead of standing
          // above a blank grid.
          <p className="mt-3 max-w-xl text-base text-muted">
            The registry is being rebuilt, so there is nothing to list yet.
          </p>
        ) : (
          <>
            <p className="mt-3 max-w-xl text-base text-muted">
              The registry is deliberately small — small enough to try all of it in one
              sitting. Everything in it is here:
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {components.map((c) => (
                <Link
                  key={c.name}
                  href={componentHref(c.name)}
                  className="flex items-center gap-3 rounded-xl border border-control bg-panel px-5 py-4 transition-colors hover:border-muted"
                >
                  <span className="font-mono text-sm text-ink">{c.name}</span>
                  <span className="lbl ml-auto">{c.category}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <Link href="/" className="lbl mt-10 transition-colors hover:!text-accent">
          ← home
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
