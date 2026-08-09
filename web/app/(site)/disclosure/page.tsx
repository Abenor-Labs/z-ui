import type { Metadata } from 'next'
import { DisclosurePage } from '@/components/component-page/disclosure-page'
import '@/components/component-page/component-page.css'

export const metadata: Metadata = {
  title: 'Disclosure',
  description:
    'A panel whose height is an interruptible spring. Press again mid-open and it reverses from wherever it got to, carrying the speed it was already moving at.',
}

/**
 * Inside `(site)`, so the nav and the footer are the site's own and the route
 * group adds no path segment — the URL is `/disclosure`, which is what
 * `componentHref` promises and what `hasComponentPage` now vouches for.
 */
export default function Page() {
  return <DisclosurePage />
}
