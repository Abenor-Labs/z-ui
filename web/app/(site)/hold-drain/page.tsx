import type { Metadata } from 'next'
import { HoldDrainPage } from '@/components/component-page/hold-drain-page'
import '@/components/component-page/component-page.css'

export const metadata: Metadata = {
  title: 'Hold Drain',
  description:
    'A hold-to-confirm whose abort costs what the hold earned. Let go at seventy per cent and the fill is paid back at the rate it climbed, taking exactly as long to undo as it took to earn.',
}

/**
 * Inside `(site)`, so the nav and the footer are the site's own and the route
 * group adds no path segment — the URL is `/hold-drain`, which is what
 * `componentHref` promises and what `hasComponentPage` vouches for.
 */
export default function Page() {
  return <HoldDrainPage />
}
