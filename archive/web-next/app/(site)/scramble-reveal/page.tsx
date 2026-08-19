import type { Metadata } from 'next'
import { ComponentPage } from '@/components/component-page/component-page'
// Moved out of this route folder when a second component page appeared. Both
// routes import the same sheet; it is the page's visual language, not this
// component's.
import '@/components/component-page/component-page.css'

export const metadata: Metadata = {
  title: 'Scramble reveal',
  description:
    'Per-glyph text decode with a trailing randomness window. One interval, no dependencies, and no reflow — the target string reserves its width before the first frame.',
}

/**
 * Inside `(site)`, so the nav and the footer above and below this are the
 * site's own. The route group adds no path segment: the URL is still
 * `/scramble-reveal`.
 *
 * No `next/font` call. The design was drawn in Manrope and this route used to
 * load it — plus a second copy of JetBrains Mono — handing both variables down
 * as a class. Both faces the page actually needs are already published on
 * <html> by the root layout, and component-page.css reads them through the
 * theme's own `--font-sans` / `--font-mono`.
 */
export default function ScrambleRevealPage() {
  return <ComponentPage />
}
