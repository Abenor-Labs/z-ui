import type { Metadata } from 'next'
import { LateCritiquePage } from '@/components/component-page/late-critique-page'
import '@/components/component-page/component-page.css'

export const metadata: Metadata = {
  title: 'Late Critique',
  description:
    'A field whose criticism is late and whose forgiveness is instant. No verdict lands mid-word — it waits for a pause — and once it is complaining, the first keystroke that fixes the value clears it on the same frame.',
}

/**
 * Inside `(site)`, so the nav and the footer are the site's own and the route
 * group adds no path segment — the URL is `/late-critique`, which is what
 * `componentHref` promises and what `hasComponentPage` vouches for.
 */
export default function Page() {
  return <LateCritiquePage />
}
