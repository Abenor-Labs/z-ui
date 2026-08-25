import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { REPO_URL, NPM_URL } from '../data/registry';

const NAV = [
  { to: '/components', label: 'components' },
  { to: '/lab', label: 'lab' },
  { to: '/docs', label: 'docs' },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar hairline-b">
        <div className="frame topbar-inner">
          <Link to="/" className="wordmark" aria-label="Z-UI home">
            Z-UI<span className="mono wordmark-version">v0.1</span>
          </Link>
          <nav className="nav mono" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}
              >
                {n.label}
              </NavLink>
            ))}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="nav-link nav-star"
              aria-label="Star Z-UI on GitHub"
            >
              <span aria-hidden="true">★</span> star
            </a>
          </nav>
        </div>
      </header>

      <div className="frame ruled main-frame">{children}</div>

      <footer className="footer hairline-t">
        <div className="frame footer-inner">
          <div className="footer-col footer-brand">
            <span className="footer-mark">Z-UI</span>
            <span className="mono footer-note">
              Micro-animations you own. v0.1 — early; names and props may change before v1.
              Registry served from raw GitHub.
            </span>
          </div>
          <div className="footer-col mono footer-links">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              github.com/Abenor-Labs/z-ui
            </a>
            <a href={NPM_URL} target="_blank" rel="noreferrer">
              npm: @abenor/z-ui
            </a>
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
              issues
            </a>
          </div>
          <div className="footer-col mono footer-license">MIT © Abenor Labs</div>
        </div>
      </footer>
    </div>
  );
}
