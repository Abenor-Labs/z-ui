/**
 * Where this site is served from, in one place.
 *
 * `metadataBase`, `robots.ts` and `sitemap.ts` all need an absolute origin and
 * all three would otherwise retype it — which is exactly how `REGISTRY_BASE`
 * came to exist in three mutually contradictory versions before it was pulled
 * into one constant. Same failure, same fix, ahead of it happening this time.
 *
 * A Vercel subdomain rather than a custom domain, deliberately: the registry
 * transport is a separate decision with a published CLI depending on it
 * ([ADR 0003](../../docs/adr/0003-raw-github-registry-transport.md)), and
 * moving the site does not have to wait on moving that. When a domain lands,
 * this string is the edit.
 */
export const SITE_URL = 'https://z-ui.vercel.app'
