import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'

/**
 * The Z-UI site's own chrome.
 *
 * A route group adds no path segment, so `/`, `/docs` and `/scramble-reveal`
 * are all still exactly that. Every page a visitor navigates to lives in here;
 * what stays outside is `not-found.tsx`, which Next resolves at the app root
 * for unmatched URLs and which therefore mounts the same two components by
 * hand.
 *
 * `pt-16` is here rather than on each page because the nav is `position:fixed`
 * and takes its 64px out of the flow. Pages that pin something below the bar
 * need the number too — see `--cp-chrome` in scramble-reveal's stylesheet.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <div className="pt-16">{children}</div>
      <SiteFooter />
    </>
  )
}
