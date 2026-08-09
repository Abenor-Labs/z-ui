import * as React from 'react'
import { components } from '@/__generated__/meta.js'

/** The page this section sits on. Everything else in the manifest is a sibling. */
const CURRENT = 'scramble-reveal'

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
 * Today that leaves nothing, and the section says so in a sentence rather than
 * filling the grid with placeholders. An empty shelf photographed as a full one
 * is the failure this replaces.
 */
const siblings = components.filter((c) => c.name !== CURRENT)

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

export function RelatedCards() {
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
          Scramble reveal is the whole registry today. The next component shows up here the moment
          it is in the manifest.
        </p>
      </div>
    )
  }

  return (
    <>
      {siblings.map((c) => (
        // `<article>`, not a link: this route is the only component page that
        // exists, so an anchor would assert a route the site does not serve and
        // put a dead stop in the tab order. No preview either — a live one needs
        // a demo per component, and a still of a motion component is the one
        // thumbnail that cannot be checked against its own description.
        <article key={c.name} className="cp-card" style={PANEL}>
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
              {c.category}
            </span>
          </div>
          <p style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg3)' }}>
            {c.description}
          </p>
        </article>
      ))}
    </>
  )
}
