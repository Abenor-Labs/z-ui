import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Two aliases, both pointing at code that already exists rather than copies of it.
 *
 * `@z-ui/registry/*` — the eight shipped components, read straight out of
 * registry/. Same bytes the CLI installs, so the showcase cannot drift from
 * what a visitor gets when they run the install command underneath it.
 *
 * `@site/*` — site/src, for the two tracks that are NOT in the registry: the
 * four candidates (site/src/zui) and the lab experiments (site/src/lab). Those
 * are already written, already working, and already have their own stylesheets;
 * re-implementing them here would produce a second, worse copy that drifts.
 * This page labels them as non-installable rather than pretending otherwise.
 *
 * Both directories live outside this package, so Vite is told it may read them.
 */
const registry = fileURLToPath(new URL('../registry/components', import.meta.url));
const site = fileURLToPath(new URL('../site/src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@z-ui/registry': registry,
      '@site': site,
    },
  },
  server: {
    fs: { allow: ['..'] },
  },
});
