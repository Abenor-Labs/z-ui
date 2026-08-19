/**
 * Ambient module declarations for asset imports a registry component might
 * ship beside itself (e.g. heft.css). A consumer project typically gets this
 * for free from its own bundler's types (vite/client, etc.) — this exists so
 * the registry package's own standalone `tsc --noEmit` can typecheck a
 * component that ships a stylesheet without assuming any particular bundler.
 */
declare module '*.css';
