import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `@z-ui/registry/*` resolves to the registry sources themselves.
 *
 * The site used to carry its own reimplementation of every component, which
 * meant a visitor watched one implementation and installed another. Where a
 * component has been promoted, the site now renders the exact file the CLI
 * ships — same physics, same stylesheet, same bytes. A divergence between the
 * demo and the install becomes impossible rather than merely unlikely.
 *
 * The registry lives outside this package, so Vite is told it may read it.
 */
const registry = fileURLToPath(new URL('../registry/components', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@z-ui/registry': registry },
  },
  server: {
    fs: { allow: ['..'] },
  },
});
