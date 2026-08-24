import { useCallback, useEffect, useRef, useState } from 'react';
import { CATALOG, type Entry } from './catalog';

const REPO = 'https://github.com/Abenor-Labs/z-ui';
const NPM = 'https://www.npmjs.com/package/@abenor/z-ui';

/** The published version. PRD.md → PRODUCT FACTS; not a marketing number. */
const VERSION = '0.1.1';

const cmdFor = (name: string) => `npx @abenor/z-ui@latest add ${name}`;

/**
 * The terminal reads whichever component the pointer is over, and freezes on
 * the last one clicked. Hovering is a preview; clicking is the copy.
 */
function Slab({ name, status }: { name: string; status: string }) {
  return (
    <div className="ob-slab">
      <div className="ob-slab-bar">
        <div className="ob-dots">
          <span />
          <span />
          <span />
        </div>
        <div className="ob-slab-tag">{status}</div>
      </div>
      <div className="ob-slab-body">
        <div className="ob-slab-cmd">
          <u>$</u>npx <em>@abenor/z-ui@latest</em> add <mark>{name}</mark>
          <span className="ob-caret" />
        </div>
        <div className="ob-slab-note">Point at a component below and the command follows it. Click to copy.</div>
      </div>
    </div>
  );
}

function Cell({
  entry,
  copied,
  onPoint,
  onCopy,
}: {
  entry: Entry;
  copied: boolean;
  onPoint: () => void;
  onCopy: () => void;
}) {
  /* The card is a div, not a button. Chase, HoldDrain and Disclosure each
     contain their own <button>, and a button inside a button is invalid HTML —
     React refuses to hydrate it and the inner control stops receiving clicks.
     The card keeps the pointer convenience; the copy affordance in the footer
     is a real button, so the action is still reachable by keyboard. */
  return (
    <div
      className={`ob-cell ob-span-${entry.span}${entry.tall ? ' ob-tall' : ''}${entry.dark ? ' ob-dark' : ''}${copied ? ' ob-copied' : ''}`}
      onMouseEnter={onPoint}
      onClick={onCopy}
    >
      {/* The stage swallows its own clicks so a drag on the dial or a shove in
          heft is the component's gesture, never the card's copy. */}
      <div className="ob-cell-stage" onClick={(e) => e.stopPropagation()}>
        {entry.render()}
      </div>
      <div className="ob-cell-foot">
        <div className="ob-cell-name">
          {entry.name}
          <button
            type="button"
            className="ob-cell-copy"
            onFocus={onPoint}
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            aria-label={`Copy install command for ${entry.name}`}
          >
            {copied ? 'copied ✓' : 'copy'}
          </button>
        </div>
        <div className="ob-cell-meta">{entry.note}</div>
      </div>
    </div>
  );
}

export function App() {
  const [pointed, setPointed] = useState(CATALOG[0].name);
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState('terminal — zsh');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async (name: string) => {
    setPointed(name);
    try {
      await navigator.clipboard.writeText(cmdFor(name));
      setCopied(name);
      setStatus('copied to clipboard');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setCopied(null);
        setStatus('terminal — zsh');
      }, 2000);
    } catch {
      /* Clipboard is permission-gated and can simply refuse. Say so rather
         than reporting a copy that never happened. */
      setStatus('copy failed — select the command above');
    }
  }, []);

  return (
    <div className="ob-wrap">
      <section className="ob-hero">
        <div className="ob-eyebrow">
          <span>React components</span>
          <s />
          <span>v{VERSION}</span>
        </div>
        <h1 className="ob-wordmark">
          z-ui<i>.</i>
        </h1>
        <p className="ob-sub">
          Eight components you paste into your own repo.{' '}
          <b>No package to upgrade, no styles to fight.</b>
        </p>
      </section>

      <Slab name={pointed} status={status} />

      <div className="ob-sec-head">
        <h2>The set</h2>
        <p>Click to copy</p>
      </div>

      <div className="ob-grid">
        {CATALOG.map((e) => (
          <Cell
            key={e.name}
            entry={e}
            copied={copied === e.name}
            onPoint={() => setPointed(e.name)}
            onCopy={() => copy(e.name)}
          />
        ))}
      </div>

      <footer className="ob-footer">
        <span>@abenor/z-ui — mit</span>
        <span>
          <a href={REPO}>github</a> · <a href={NPM}>npm</a>
        </span>
      </footer>
    </div>
  );
}
