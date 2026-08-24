import { useState, type ReactNode } from 'react';

/**
 * Fits a real, live demo instance into a small grid card. `scale` shrinks the
 * rendered node with a CSS transform — the component itself is unmodified
 * and still fully interactive; nothing here is a screenshot or a static mock.
 */
export function LabMiniPreview({ children, scale = 0.55 }: { children: ReactNode; scale?: number }) {
  return (
    <div className="lab-mini-preview">
      <div className="lab-mini-preview-scale" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

export interface LabDemoEntry {
  id: string;
  index: string;
  name: string;
  /** short sidebar sub-label, e.g. "Cursor proximity" */
  trigger: string;
  /** the full <LabPlayground> for this demo */
  playground: ReactNode;
  /** a compact, still-live instance for the sibling grid */
  preview: ReactNode;
}

/**
 * The sidebar + focused-demo + sibling-grid shell for a /lab category page.
 * Reuses the registry detail pages' own `.detail-shell`/`.detail-aside` grid
 * rather than inventing a second one — the shapes are the same idea (a list
 * of items, one shown at a time), just switching in-page state instead of
 * routing, since none of this has its own URL to give each demo.
 */
export function LabCategoryPage({ entries, gridLabel }: { entries: LabDemoEntry[]; gridLabel: string }) {
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const active = entries.find((e) => e.id === selectedId) ?? entries[0];
  const others = entries.filter((e) => e.id !== active.id);

  return (
    <div className="detail-shell">
      <aside className="detail-aside">
        <nav aria-label="Demos in this category">
          <ul className="lab-side-list">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={`lab-side-link${e.id === active.id ? ' lab-side-active' : ''}`}
                  onClick={() => setSelectedId(e.id)}
                >
                  <span className="mono lab-side-index">{e.index}</span>
                  <span className="lab-side-text">
                    <span className="lab-side-name">{e.name}</span>
                    <span className="mono lab-side-trigger">{e.trigger}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="lab-main">
        {active.playground}

        {others.length ? (
          <div className="lab-more">
            <span className="mono-label">{gridLabel}</span>
            <div className="lab-more-grid">
              {others.map((e) => (
                <button key={e.id} type="button" className="lab-more-card" onClick={() => setSelectedId(e.id)}>
                  <div className="lab-more-preview">{e.preview}</div>
                  <div className="lab-more-card-foot">
                    <span className="mono lab-more-index">{e.index}</span>
                    <span className="lab-more-name">{e.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
