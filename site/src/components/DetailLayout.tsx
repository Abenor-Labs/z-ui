import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Page } from './Page';
import { ComponentNav } from './ComponentNav';
import { CodeBlock } from './CodeBlock';
import { Chase } from '@z-ui/registry/chase/chase';
import { useSiteSpring } from '../lib/springs';
import { useRegistrySource, type SourceState } from '../lib/registrySource';
import { FALLBACK_URL, installCommand, REGISTRY, type RegistryComponent } from '../data/registry';

const REGISTRY_BY_NAME = new Map(REGISTRY.map((c) => [c.name, c]));

export function byName(name: string): RegistryComponent {
  const c = REGISTRY_BY_NAME.get(name);
  if (!c) throw new Error(`unknown component: ${name}`);
  return c;
}

type Tab = 'preview' | 'source' | 'install';

const TABS: Tab[] = ['preview', 'source', 'install'];

/**
 * transitions.dev 14 — skeleton loader and reveal. The registry read is a real
 * network round-trip, so the panel pulses a placeholder in the same slot and
 * cross-fades to whatever the registry actually answered.
 */
function SourceSkeleton() {
  return (
    <div className="source-skel-bars" aria-hidden="true">
      <span className="skel-bar skel-bar-bar" />
      <span className="skel-bar skel-bar-w70" />
      <span className="skel-bar skel-bar-w90" />
      <span className="skel-bar skel-bar-w50" />
      <span className="skel-bar skel-bar-w80" />
      <span className="skel-bar skel-bar-w60" />
    </div>
  );
}

/** the published registry file, or an honest account of why there isn't one */
function SourcePanel({
  state,
  name,
}: {
  /** loading never reaches here — the skeleton owns that state */
  state: Exclude<SourceState, { status: 'loading' }>;
  name: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  const { stiff } = useSiteSpring();

  if (state.status === 'unpublished') {
    return (
      <div className="detail-note-block">
        <p className="mono detail-note">registry: 404 — nothing published under “{name}”</p>
        <p className="playground-caption">
          The registry publishes all eight components today. This one runs on the site as a
          faithful reimplementation, but no file ships under this name yet, so there is nothing
          honest to print here — and the shadcn fallback command on the Install tab will fail
          until it does.
        </p>
        <a className="mono detail-link" href={state.url} target="_blank" rel="noreferrer">
          {state.url} ↗
        </a>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="detail-note-block">
        <p className="mono detail-note">registry unreachable — {state.message}</p>
        <p className="playground-caption">
          Raw GitHub allows about 60 requests an hour per IP. Nothing is cached from a failed read;
          reload to try again, or open the file directly.
        </p>
        <a className="mono detail-link" href={state.url} target="_blank" rel="noreferrer">
          {state.url} ↗
        </a>
      </div>
    );
  }

  const file = state.item.files[0];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
    } catch {
      // clipboard unavailable; the source is selectable in the block below
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const lines = file.content.split('\n').length;

  return (
    <div className="source-panel">
      <div className="source-bar mono">
        <span className="source-path">{file.path}</span>
        <span className="source-facts">
          {lines} lines
          {state.item.dependencies?.length ? ` · deps: ${state.item.dependencies.join(', ')}` : ' · no deps'}
        </span>
        <button className="demo-copy mono source-copy" onClick={copy} aria-label="Copy source">
          <span className="demo-copy-window" aria-hidden="true">
            <motion.span className="demo-copy-stack" animate={{ y: copied ? -14 : 0 }} transition={stiff}>
              <span className="demo-copy-row">⧉</span>
              <span className="demo-copy-row demo-copy-done">✓</span>
            </motion.span>
          </span>
        </button>
      </div>
      <pre className="source-code mono" tabIndex={0}>
        <code>{file.content}</code>
      </pre>
      <p className="mono detail-note">
        this is the file <code>z-ui add {name}</code> writes — fetched from the registry, not
        reprinted from this site
      </p>
    </div>
  );
}

function InstallPanel({ comp, state }: { comp: RegistryComponent; state: SourceState }) {
  return (
    <div className="install-panel">
      <CodeBlock
        code={installCommand(comp.name)}
        caption={`needs: ${comp.needs}${
          comp.needs === 'motion'
            ? ' — declared by this component, installed by add'
            : ' — no motion dependency'
        }`}
      />
      <CodeBlock
        code={FALLBACK_URL(comp.name)}
        caption="shadcn-compatible fallback — you still get the file, but lose install-time spring selection, preview, and doctor"
      />
      {state.status === 'unpublished' ? (
        <p className="mono detail-warn">
          ⚠ this fallback URL currently returns 404 — {comp.name} is not published to the registry yet
        </p>
      ) : null}
    </div>
  );
}

export function Detail({
  name,
  preview,
  children,
  title,
}: {
  name: string;
  /** the live playground — the Preview tab's whole content */
  preview: ReactNode;
  /** measured sections shown under the tabs, always visible */
  children?: ReactNode;
  title?: string;
}) {
  const comp = byName(name);
  const [tab, setTab] = useState<Tab>('preview');
  const navigate = useNavigate();
  const source = useRegistrySource(name, true);

  const index = REGISTRY.findIndex((c) => c.name === name);
  const prev = REGISTRY[(index - 1 + REGISTRY.length) % REGISTRY.length];
  const next = REGISTRY[(index + 1) % REGISTRY.length];

  // ← / → walk the registry, but never steal the arrow keys from a control that uses them
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el) {
        const tag = el.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (el.isContentEditable) return;
        if (el.getAttribute('role') === 'slider' || el.closest('[role="slider"]')) return;
      }
      navigate(`/components/${e.key === 'ArrowLeft' ? prev.name : next.name}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, prev.name, next.name]);

  return (
    <Page title={title ?? comp.name}>
      <div className="detail-shell">
        <aside className="detail-aside">
          <ComponentNav />
        </aside>

        <div className="detail-main">
          <header className="detail-head">
            <div className="detail-head-row">
              <h1>{comp.name}</h1>
              <div className="detail-steps mono">
                <Link to={`/components/${prev.name}`} className="step-btn" aria-label={`Previous: ${prev.name}`}>
                  ←
                </Link>
                <Link to={`/components/${next.name}`} className="step-btn" aria-label={`Next: ${next.name}`}>
                  →
                </Link>
              </div>
            </div>
            <p className="detail-principle">{comp.principle}</p>
            <div className="detail-meta mono">
              <span>category: {comp.category}</span>
              <span>needs: {comp.needs}</span>
              <span>one self-contained .tsx</span>
              <span className={source.status === 'ready' ? 'detail-pub' : 'detail-unpub'}>
                {source.status === 'ready'
                  ? 'in the registry'
                  : source.status === 'unpublished'
                    ? 'not published yet'
                    : 'registry: reading…'}
              </span>
            </div>
          </header>

          {/* the indicator is a real chase instance — the same control the
              /components filter uses, so the site never demonstrates a moving
              indicator it does not ship */}
          <Chase
            className="detail-tabs"
            label="Component views"
            options={TABS.map((t) => ({ value: t, label: t }))}
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
          />

          <div className="tabpanel" role="tabpanel">
            {tab === 'preview' ? preview : null}
            {tab === 'source' ? (
              <div className={`t-skel source-skel${source.status === 'loading' ? '' : ' is-revealed'}`}>
                <div className="t-skel-skeleton is-pulsing">
                  <SourceSkeleton />
                </div>
                <div className="t-skel-content">
                  {source.status === 'loading' ? null : (
                    <SourcePanel state={source} name={name} />
                  )}
                </div>
              </div>
            ) : null}
            {tab === 'install' ? <InstallPanel comp={comp} state={source} /> : null}
          </div>

          {children}

          <div className="detail-foot mono">
            <Link to={`/components/${prev.name}`}>← {prev.name}</Link>
            <Link to={`/components/${next.name}`}>{next.name} →</Link>
          </div>
        </div>
      </div>
    </Page>
  );
}
