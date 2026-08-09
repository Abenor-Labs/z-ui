'use client'

import * as React from 'react'

const REVERT_MS = 1500

/**
 * The design's copy affordance: one 14px slot holding both glyphs stacked, so
 * the check does not push the label and the label's fixed track does not push
 * the button. All of the state styling lives in the route's stylesheet under
 * `.cp-copy` — the two icons need to see each other's state through a common
 * ancestor, and a `data-copied` flag on the button is the only selector that
 * gives them that without a class permutation per icon.
 *
 * The design has two states. A clipboard write can still be refused — insecure
 * origin, or a denied permission — and rather than invent a third visual, a
 * refusal simply leaves the button at rest and reports through the live region.
 * Flashing "copied" over a clipboard that was never written is the one outcome
 * worse than no feedback.
 */
export function CopyButton({
  value,
  label,
  size = 'md',
  className = '',
}: {
  value: string
  /** Accessible name. Contains the visible word so 2.5.3 holds, and unlike the
      visible label it does not change under a focused reader mid-announcement. */
  label: string
  size?: 'md' | 'sm'
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    let ok = true
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      ok = false
    }
    setCopied(ok)
    setFailed(!ok)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setCopied(false)
      setFailed(false)
    }, REVERT_MS)
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        data-copied={copied}
        data-size={size}
        className={`cp-copy cp-mono ${className}`}
      >
        <span className="cp-copy-slot" aria-hidden>
          <svg
            className="cp-copy-glyph"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4.6" y="4.6" width="8.4" height="8.4" rx="1.6" />
            <path d="M10.2 2.4a1.6 1.6 0 0 0-1.4-1.4H2.6A1.6 1.6 0 0 0 1 2.6v6.2a1.6 1.6 0 0 0 1.4 1.4" />
          </svg>
          <svg
            className="cp-copy-check"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 7.4 5.4 11 12 3.4" />
          </svg>
        </span>
        <span className="cp-copy-label">{copied ? 'copied' : 'copy'}</span>
      </button>
      {/* Outside the button, or it would join the accessible name and undo the
          stable `aria-label` above. Present from first paint so the region is
          already registered when its text changes. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : failed ? 'Copy failed' : ''}
      </span>
    </>
  )
}
