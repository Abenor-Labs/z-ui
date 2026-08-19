import { NavLink } from 'react-router-dom';
import { REGISTRY, CATEGORIES } from '../data/registry';
import { CANDIDATES } from '../data/candidates';

/**
 * Sticky index of everything the site shows, so browsing never routes back
 * through /components. Registry first, grouped by category; the bench last,
 * clearly separated because those are not installable.
 */
export function ComponentNav() {
  return (
    <nav className="cnav" aria-label="Components">
      {CATEGORIES.map((cat) => {
        const items = REGISTRY.filter((c) => c.category === cat);
        if (!items.length) return null;
        return (
          <div className="cnav-group" key={cat}>
            <span className="mono-label cnav-heading">{cat}</span>
            <ul className="cnav-list">
              {items.map((c) => (
                <li key={c.name}>
                  <NavLink
                    to={`/components/${c.name}`}
                    className={({ isActive }) => `cnav-link${isActive ? ' cnav-active' : ''}`}
                  >
                    {c.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="cnav-group">
        <span className="mono-label cnav-heading">bench</span>
        <ul className="cnav-list">
          {CANDIDATES.map((c) => (
            <li key={c.name}>
              <NavLink
                to={`/candidates#${c.name}`}
                className={({ isActive }) => `cnav-link${isActive ? ' cnav-active' : ''}`}
              >
                {c.name}
                <span className="mono cnav-tag">cand</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
