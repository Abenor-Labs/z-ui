import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Everything is crawlable, including `/r/`.
 *
 * The manifests under `/r/` are a published interface — a shadcn client
 * fetches them by URL and the install command on the home page prints one — so
 * excluding them would be hiding the product's delivery mechanism from the one
 * search that would find it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
