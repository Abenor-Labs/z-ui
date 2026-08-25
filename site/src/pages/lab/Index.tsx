import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { Section } from '../../components/Section';

const CATEGORIES: { to: string; label: string; count: number; status: 'built' | 'unbuilt'; builtCount?: number }[] = [
  { to: '/lab/navigation', label: 'navigation', count: 8, status: 'built' },
  { to: '/lab/buttons', label: 'buttons', count: 15, status: 'built' },
  { to: '/lab/text', label: 'text & typography', count: 15, status: 'built', builtCount: 1 },
  { to: '/lab/cards', label: 'cards', count: 15, status: 'unbuilt' },
  { to: '/lab/toggles', label: 'toggles & switches', count: 10, status: 'unbuilt' },
  { to: '/lab/loaders', label: 'loaders', count: 15, status: 'unbuilt' },
  { to: '/lab/cursors', label: 'cursors', count: 10, status: 'unbuilt' },
  { to: '/lab/scroll', label: 'scroll animations', count: 12, status: 'unbuilt' },
  { to: '/lab/inputs', label: 'inputs & forms', count: 11, status: 'unbuilt' },
];

export function LabIndex() {
  return (
    <Page title="Lab">
      <div className="detail-head">
        <h1>lab</h1>
        <div className="detail-meta mono">
          <span>site-only</span>
          <span>not in the registry</span>
          <span>no CLI command</span>
        </div>
        <p className="detail-principle">
          A bench for interaction patterns: nothing here installs, and none of it is a product
          fact. Categories get built one at a time; unbuilt ones are listed so the scope is
          visible rather than implied.
        </p>
      </div>

      <Section index="01" label="CATEGORIES">
        <ul className="lab-index-list">
          {CATEGORIES.map((c) => (
            <li key={c.to} className="lab-index-row">
              {c.status === 'built' ? (
                <Link to={c.to} className="lab-index-link mono">
                  {c.label}
                </Link>
              ) : (
                <span className="lab-index-link lab-index-link-unbuilt mono">{c.label}</span>
              )}
              <span className="mono lab-index-meta">
                {c.count} planned · {c.status === 'built' ? (c.builtCount && c.builtCount < c.count ? `${c.builtCount} built` : 'built') : 'not started'}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}
