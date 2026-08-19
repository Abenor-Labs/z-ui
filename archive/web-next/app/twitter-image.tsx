/**
 * The same card, under the name the other convention looks for.
 *
 * `opengraph-image` emits `og:image` and `twitter-image` emits `twitter:image`;
 * neither falls back to the other, so a site with only the first gets a bare
 * link on X. Re-exported rather than copied — two files drawing the same card
 * is two cards that drift.
 */
export { default, alt, size, contentType } from './opengraph-image'
