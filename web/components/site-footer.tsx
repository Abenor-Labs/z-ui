import Link from 'next/link'

// Only what exists. Five labels pointing at one GitHub URL is the kind of
// borrowed credibility this project's voice refuses — a dead "Status" link says
// there is a status page, and there is not.
const FOOTER_LINKS = [
  { label: 'Docs', href: '/docs' },
  { label: 'Components', href: '/#components' },
  { label: 'Install', href: '/#install' },
  { label: 'GitHub', href: 'https://github.com/Abenor-Labs/z-ui', external: true },
]

/**
 * Lifted out of the root layout when the nav and footer moved into the
 * `(site)` route group. `not-found.tsx` has to stay at the app root to catch
 * unmatched URLs, so it cannot inherit that group's layout — which is why the
 * footer is a component the two of them share rather than markup either one
 * owns.
 */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-hair bg-surface">
      <div className="mx-auto grid max-w-[80rem] grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4 md:px-16">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <span className="t-lg">Z-UI</span>
          <p className="text-base text-muted">MIT License © 2026 Abenor Labs</p>
        </div>
        <div className="col-span-2 flex flex-wrap items-start gap-x-8 gap-y-4 md:col-span-3 md:justify-end">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="lbl underline-offset-4 transition-colors hover:!text-ink hover:underline"
              {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
