'use client'

import * as React from 'react'
import { CopyButton } from './copy-button'
import { Code } from './highlight'
import type { Snippet } from './snippets'

/**
 * A tabbed source panel. It stores nothing but which tab is showing.
 *
 * Snippets arrive already written, rather than being derived here from a
 * settings object. That is what lets scramble-reveal's page rebuild them on
 * every render from the values its customize panel edits — the "writes to code"
 * claim is only true if there is exactly one place that knows what
 * `ease: "snap"` means, and it is not this file — while a page with no controls
 * hands over two fixed strings and gets the same tabs, copy button and
 * scrollable region for free.
 */
export function CodePanel({ snippets }: { snippets: Snippet[] }) {
  const [active, setActive] = React.useState(0)
  const id = React.useId()

  // Clamped rather than trusted: `active` outlives a snippet list, and
  // `noUncheckedIndexedAccess` is right to insist the read can miss.
  const current = snippets[Math.min(active, snippets.length - 1)] ?? snippets[0]!

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: 'var(--s1)',
        minWidth: 0,
      }}
    >
      <div
        role="tablist"
        // Not "language". Both tabs are the same React file; what differs is
        // which of its two exports the reader is calling.
        aria-label="Usage"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          height: 44,
          padding: '0 8px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {snippets.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            id={`${id}-tab-${s.key}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            onClick={() => setActive(i)}
            className="cp-tab cp-mono"
            style={{
              height: 44,
              padding: '0 12px',
              fontSize: 11.5,
              background: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </button>
        ))}

        {/* The language, so the colouring is attributable to something rather
            than being decoration a reader has to decode. `ml-auto` moves here
            off the copy button, which now sits next to it. */}
        <span
          className="cp-mono ml-auto"
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--fg3)',
            paddingRight: 4,
          }}
        >
          {current.lang}
        </span>
        <CopyButton
          value={current.code}
          size="sm"
          label={`copy the ${current.label} snippet`}
        />
      </div>

      <pre
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${current.key}`}
        // Focusable because it scrolls: a keyboard reader has no other way to
        // reach an overflowing region's scrollbar.
        tabIndex={0}
        className="cp-mono"
        style={{
          padding: 22,
          fontSize: 12.5,
          lineHeight: 1.8,
          color: 'var(--fg2)',
          overflow: 'auto',
          minHeight: 340,
          margin: 0,
        }}
      >
        {/* Keyed by tab so the token spans are rebuilt rather than reconciled
            across two different snippets, which would otherwise leave a span
            carrying the previous tab's class for a frame. */}
        <Code key={current.key} code={current.code} lang={current.lang} />
      </pre>
    </div>
  )
}
