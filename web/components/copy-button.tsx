'use client'

import * as React from 'react'

/**
 * One copy affordance for the whole site. The label swaps rather than firing a
 * toast, because the button is already where the reader is looking.
 *
 * Clipboard access can be denied — over plain http, or by permission — so the
 * failure is surfaced on the button instead of being swallowed into a success
 * state the reader would then act on.
 */
export function CopyButton({
  value,
  children,
  className,
  copiedLabel = 'Copied',
  'aria-label': ariaLabel,
}: {
  value: string
  children?: React.ReactNode
  className?: string
  copiedLabel?: string
  'aria-label'?: string
}) {
  const [state, setState] = React.useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('failed')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1600)
  }

  return (
    <button type="button" onClick={copy} className={className} aria-label={ariaLabel}>
      {state === 'idle' ? children : state === 'copied' ? copiedLabel : 'Copy failed'}
    </button>
  )
}

export function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
