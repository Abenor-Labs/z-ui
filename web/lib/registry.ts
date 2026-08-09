/**
 * Where the published manifests live, in one place.
 *
 * This string had drifted three ways across the codebase — `main/web/public`
 * here, `main/registry/r` on the docs page, `main/registry` in the CLI's
 * config — so at most one of them could have been right, and the site printed
 * all three as though each were the install command.
 *
 * The path is the generator's output directory: `web/scripts/build-registry.mjs`
 * writes to `web/public/r/`, which is what a deploy serves and what a raw
 * GitHub URL can reach. Anything pointing at `registry/` addresses the source
 * tree, where no `.json` manifest is ever written.
 *
 * Nothing here resolves until the repository is merged to `main` — `origin/main`
 * is currently a single scaffold commit. The constant is the canonical shape,
 * not a promise that it answers today; every surface that prints it is
 * responsible for saying so.
 */
export const REGISTRY_BASE =
  'https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public/r'

/** The full manifest URL a shadcn-compatible client would fetch. */
export const manifestUrl = (name: string) => `${REGISTRY_BASE}/${name}.json`

/**
 * Where a component's own page lives.
 *
 * Top-level, because that is what `/scramble-reveal` actually is. The old
 * `/c/<name>` route was deleted with the registry, and two places went on
 * linking to it — the docs listing and the 404 page — so a reader who clicked
 * either one landed on a 404 served by a page whose whole job is to recover
 * from one.
 *
 * This is a convention, not a guarantee: nothing asserts that a component in
 * the manifest has a route. It holds today because the registry has one item
 * and that item has a page. When the next component lands without one, or the
 * `[slug]` template comes back, this function is the single edit — which is
 * the reason it exists rather than the template literal being retyped at each
 * call site.
 */
export const componentHref = (name: string) => `/${name}`

/**
 * Which components actually have that route.
 *
 * The convention above is a convention, not a guarantee — nothing asserts that
 * an item in the manifest has a page. The catalogue and the related grid both
 * ask this before rendering a link, so neither can advertise a route that 404s;
 * that is the same failure the install commands were already fixed for.
 *
 * Add the name here in the same change that adds the route, never before. One
 * line in one place, which is the reason this is a set and not a guess repeated
 * at each call site.
 */
const PAGES = new Set(['scramble-reveal', 'disclosure'])

export const hasComponentPage = (name: string) => PAGES.has(name)
