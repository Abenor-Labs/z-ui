import { NavLink } from 'react-router-dom';
import { REGISTRY, CATEGORIES } from '../data/registry';
import { NavPreviewPanel, useNavPreview } from './NavPreview';

/**
 * Sticky index of everything the site shows, so browsing never routes back
 * through /components. Grouped by category, registry only — the candidate
 * bench came off the site with /candidates, so nothing here links to a
 * component you cannot actually install.
 *
 * Hovering a row previews the component it points at. The list owns none of
 * that behaviour: it reports which row the pointer is on and hands back the
 * element, and `useNavPreview` decides whether that is worth opening a panel
 * for. See NavPreview.tsx for why the delay is asymmetric.
 */
export function ComponentNav() {
  const { target, enter, leave, dismiss } = useNavPreview();

  return (
    <>
      <nav className="cnav" aria-label="Components" onPointerLeave={leave}>
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
                      className={({ isActive }) =>
                        `cnav-link${isActive ? ' cnav-active' : ''}${
                          target?.name === c.name ? ' cnav-peeked' : ''
                        }`
                      }
                      // pointerenter, not mouseenter: it does not fire for
                      // touch, which is the same gate the panel itself uses.
                      onPointerEnter={(e) => enter(c.name, e.currentTarget)}
                      onFocus={dismiss}
                      onClick={dismiss}
                    >
                      {c.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <NavPreviewPanel target={target} />
    </>
  );
}
