import type { MetadataRoute } from 'next'
import { components } from '@/__generated__/meta.js'
import { componentHref, hasComponentPage } from '@/lib/registry'
import { SITE_URL } from '@/lib/site'

/**
 * The component routes are filtered through `hasComponentPage`, not generated
 * from the manifest.
 *
 * `componentHref` is a convention rather than a guarantee — an item can be in
 * the registry with no page behind it — and a sitemap is a claim to a crawler
 * that a URL resolves. Listing every manifest entry would be advertising 404s
 * to a search engine, which is the same failure the install commands and the
 * related grid were both already fixed for, arriving through a third door.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/components`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...components
      .filter((c) => hasComponentPage(c.name))
      .map((c) => ({
        url: `${SITE_URL}${componentHref(c.name)}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
  ]
}
