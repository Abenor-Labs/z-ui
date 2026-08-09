import * as React from 'react'

type Prop = {
  name: string
  type: string
  fallback: string
  description: string
}

const PROPS: Prop[] = [
  {
    name: 'text',
    type: 'string',
    fallback: '—',
    // The reflow claim belongs to <ScrambleReveal>, which paints the churning
    // glyphs out of flow over an invisible copy of this string. The hook returns
    // a bare string and reserves nothing, and the table sits under a
    // `useScramble(options)` heading, so the row has to say which one does it.
    description:
      'The real string. Also the accessible name, and the width ScrambleReveal reserves before frame one.',
  },
  {
    name: 'duration',
    type: 'number',
    fallback: '620',
    // Not a promise of wall-clock time. A tick is `duration / (length + 5)`
    // rounded, floored at 24ms — below that a tick is shorter than a display
    // frame and the flicker just reads as grey. The panel's slider bottoms out
    // at 120ms, where a fifteen-glyph run takes 480, so the floor is the first
    // thing a reader moving that control will actually hit.
    description:
      'Total decode time in ms, split into one tick per glyph. A tick never goes below 24ms, so low values stretch.',
  },
  {
    name: 'ease',
    type: '"out" | "in-out" | "snap"',
    fallback: '"out"',
    // The source design documents this as driving the settle order. It cannot:
    // a glyph is its true character or a random one, so there is no quantity for
    // a curve to interpolate and the hook never reads the value. It rides
    // through to data-ease and into the snippets, and the table says so, because
    // a props table that describes an argument the hook ignores is worse than
    // no row at all.
    description:
      'Carried, not applied — nothing here interpolates. Surfaces on data-ease for consumers to key off.',
  },
  {
    name: 'chance',
    type: 'number',
    fallback: '0.86',
    // Only glyphs at or ahead of the decode head are eligible; anything more
    // than six ticks behind it is settled and this value cannot touch it.
    description:
      'Odds an unsettled glyph re-randomises on a tick, clamped to 0–1. Lower is calmer. Spaces never scramble.',
  },
  {
    name: 'chars',
    type: 'string',
    fallback: '"!<>-_/[]{}=+*^?#"',
    // Named the three pools that actually ship. The row read "hex, katakana, or
    // your own set" — katakana is not in SCRAMBLE_SETS, and naming it alongside
    // a real key reads as a fourth export rather than as an example.
    description:
      'Pool the scrambler draws from. SCRAMBLE_SETS ships symbols, hex and binary; an empty string falls back to symbols.',
  },
  {
    name: 'trigger',
    type: '"hover" | "load" | "view"',
    fallback: '"hover"',
    description:
      'When the run starts. hover and view both key off the element ref the hook hands back.',
  },
  {
    name: 'playOnce',
    type: 'boolean',
    fallback: 'true',
    // Gates the trigger only. run() is imperative and always fires, which is
    // what keeps the demo's "re-run" button working under the default.
    description:
      'Ignore repeat triggers after the first run. run() is unaffected, and a new text re-arms it.',
  },
  {
    name: 'onComplete',
    type: '() => void',
    fallback: 'undefined',
    // The reduced-motion path fires it too, and that is the half worth saying:
    // a page sequencing reveals off this callback would otherwise stall forever
    // for exactly the users who asked for less motion.
    description: 'Fires once per completed run, reduced motion included. Chain a second reveal off it.',
  },
]

const HEAD: React.CSSProperties = {
  padding: '16px 0 12px',
  paddingRight: 24,
  textAlign: 'left',
  fontWeight: 400,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--fg3)',
  borderBottom: '1px solid var(--line)',
  verticalAlign: 'bottom',
}

const CELL: React.CSSProperties = {
  padding: '15px 0',
  paddingRight: 24,
  borderBottom: '1px solid var(--line)',
  verticalAlign: 'baseline',
}

/**
 * A real `<table>` rather than the design's four-column grid. The grid renders
 * identically at these widths, and the column geometry is preserved exactly
 * through `<colgroup>` — but eight rows of name/type/default/description read
 * as a table to anything that is not looking at it, and a `role="table"` div
 * stack is a reimplementation of markup the browser already ships.
 */
export function PropsTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          minWidth: 760,
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        {/* 24px wider than the design's tracks apiece, because the gap it sets
            between columns lives inside the cell as padding here. */}
        <colgroup>
          <col style={{ width: 194 }} />
          <col style={{ width: 214 }} />
          <col style={{ width: 154 }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th className="cp-mono" style={HEAD} scope="col">
              name
            </th>
            <th className="cp-mono" style={HEAD} scope="col">
              type
            </th>
            <th className="cp-mono" style={HEAD} scope="col">
              default
            </th>
            <th className="cp-mono" style={{ ...HEAD, paddingRight: 0 }} scope="col">
              description
            </th>
          </tr>
        </thead>
        <tbody>
          {PROPS.map((p) => (
            <tr key={p.name}>
              <th
                className="cp-mono"
                scope="row"
                style={{
                  ...CELL,
                  textAlign: 'left',
                  fontWeight: 400,
                  fontSize: 12.5,
                  color: 'var(--fg)',
                }}
              >
                {p.name}
              </th>
              <td className="cp-mono" style={{ ...CELL, fontSize: 12, color: 'var(--fg3)' }}>
                {p.type}
              </td>
              <td className="cp-mono" style={{ ...CELL, fontSize: 12, color: 'var(--fg2)' }}>
                {p.fallback}
              </td>
              <td
                style={{
                  ...CELL,
                  paddingRight: 0,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'var(--fg2)',
                }}
              >
                {p.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
