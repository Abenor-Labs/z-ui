import * as React from 'react'
import Link from 'next/link'
import { components } from '@/__generated__/meta.js'
import { componentHref, hasComponentPage } from '@/lib/registry'

/**
 * Derived from the built manifest, never from a hand-written list.
 *
 * The imported design shipped three cards here — Weight wave, Text mask reveal,
 * Odometer — each with a live hover preview of a component that has never
 * existed in this repository. None of the three is on the roadmap either, so
 * relabelling them "coming" would have traded one invented fact for a second
 * one. Reading `__generated__/meta.js` is the only version that cannot drift:
 * it is the same manifest the CLI installs from, so a card can appear here only
 * once the component is real enough to be installed.
 *
 * `current` is a prop rather than a module constant because there is now more
 * than one component page, and a hardcoded name would have made the second one
 * list itself as its own sibling.
 */

const PANEL: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 10,
  background: 'var(--bg)',
  padding: '15px',
}

const TAG: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--fg3)',
}

export function RelatedCards({ current }: { current: string }) {
  const siblings = components.filter((c) => c.name !== current)

  if (siblings.length === 0) {
    const count = components.length

    return (
      // Spans whatever the parent grid is currently at — one, two or three
      // tracks — so a single note never sits in column one with two holes
      // beside it.
      <div className="cp-card" style={{ ...PANEL, gridColumn: '1 / -1', padding: '18px 20px' }}>
        <span className="cp-mono" style={TAG}>
          registry · {count} {count === 1 ? 'component' : 'components'}
        </span>
        <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg2)' }}>
          This is the whole registry today. The next component shows up here the moment it is in
          the manifest.
        </p>
      </div>
    )
  }

  return (
    <>
      {siblings.map((c) => {
        const body = (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{c.title}</h3>
              <span className="cp-mono" style={TAG}>
                {c.gesture}
              </span>
            </div>
            <p style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg3)' }}>
              {c.description}
            </p>
          </>
        )

        // A link only where the route exists. An anchor to a component without a
        // page would assert a route the site does not serve and put a dead stop
        // in the tab order, which is why this was an `<article>` for as long as
        // scramble-reveal was the only page.
        return hasComponentPage(c.name) ? (
          <Link key={c.name} href={componentHref(c.name)} className="cp-card" style={PANEL}>
            {body}
          </Link>
        ) : (
          <article key={c.name} className="cp-card" style={PANEL}>
            {body}
          </article>
        )
      })}
    </>
  )
}
