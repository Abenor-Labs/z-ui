import { useEffect, useState } from 'react';

/**
 * The Source tab shows the REAL registry file or nothing.
 *
 * The site's own src/zui/*.tsx are faithful reimplementations for this site
 * (DESIGN.md A5) — printing them here as "the component" would misrepresent
 * what `z-ui add` actually writes. So this fetches the published registry item
 * from raw GitHub and, when a component has not been published yet, says so.
 *
 * Unauthenticated raw GitHub allows roughly 60 requests/hour per IP, so every
 * answer (including a 404) is cached in sessionStorage for the tab's lifetime.
 */

export const REGISTRY_RAW_BASE =
  'https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public/r';

export interface RegistryFile {
  path: string;
  type?: string;
  content: string;
}

export interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  meta?: Record<string, unknown>;
}

export type SourceState =
  | { status: 'loading' }
  /** published: this is the file `z-ui add <name>` writes */
  | { status: 'ready'; item: RegistryItem; url: string }
  /** the registry answered 404 — the component is not published under this name */
  | { status: 'unpublished'; url: string }
  /** offline, rate-limited, or malformed */
  | { status: 'error'; message: string; url: string };

const CACHE_PREFIX = 'zui:registry:';

function readCache(name: string): SourceState | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + name);
    return raw ? (JSON.parse(raw) as SourceState) : null;
  } catch {
    return null;
  }
}

function writeCache(name: string, state: SourceState) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + name, JSON.stringify(state));
  } catch {
    // storage unavailable or full — the fetch simply repeats next time
  }
}

export function useRegistrySource(name: string, enabled: boolean): SourceState {
  const url = `${REGISTRY_RAW_BASE}/${name}.json`;
  const [state, setState] = useState<SourceState>(
    () => readCache(name) ?? { status: 'loading' },
  );

  useEffect(() => {
    if (!enabled) return;
    const cached = readCache(name);
    if (cached) {
      setState(cached);
      return;
    }

    const ac = new AbortController();
    setState({ status: 'loading' });

    (async () => {
      let next: SourceState;
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (res.status === 404) {
          next = { status: 'unpublished', url };
        } else if (!res.ok) {
          next = { status: 'error', message: `registry responded ${res.status}`, url };
        } else {
          const item = (await res.json()) as RegistryItem;
          next = Array.isArray(item.files) && item.files.length
            ? { status: 'ready', item, url }
            : { status: 'error', message: 'registry item carries no files', url };
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        next = { status: 'error', message: e instanceof Error ? e.message : 'fetch failed', url };
      }
      writeCache(name, next);
      setState(next);
    })();

    return () => ac.abort();
  }, [name, url, enabled]);

  return state;
}
