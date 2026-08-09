'use client'

import * as React from 'react'
import { CopyButton } from './copy-button'
import { snippetsFor, type ScrambleSettings } from './snippets'

/**
 * The left half of the customize pair. Nothing here is stored: the snippets are
 * derived from `settings` on every render, which is the whole reason the panel
 * on the right can claim it "writes to code" — there is no second copy of the
 * options to fall out of date.
 */
export function CodePanel({ settings }: { settings: ScrambleSettings }) {
  const [active, setActive] = React.useState(0)
  const id = React.useId()

  const snippets = snippetsFor(settings)
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

        <CopyButton
          value={current.code}
          size="sm"
          label={`copy the ${current.label} snippet`}
          className="ml-auto"
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
        {current.code}
      </pre>
    </div>
  )
}
