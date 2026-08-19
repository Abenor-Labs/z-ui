'use client'

import * as React from 'react'

const FAILED_LABEL = 'Copy failed'

/**
 * The wrapper is the button's only child, so it takes over the row properties
 * the call site set on the button (`items-center gap-4`, `justify-between`) and
 * re-publishes them down the inherit chain — `children` now sit one level
 * deeper and would otherwise lose the gap that separates a command from its
 * icon.
 *
 * One track that absorbs free space: when the button is stretched rather than
 * shrink-to-fit — the hero at phone width, where its column parent stretches it
 * — the layers get the button's full width, so `justify-between` still reaches
 * both edges. minmax(0, …) so a narrow viewport clamps instead of overflowing.
 */
const STACK: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  flexGrow: 1,
  alignItems: 'inherit',
  justifyContent: 'inherit',
  gap: 'inherit',
}

/**
 * Every label occupies the same cell, so the track is sized by the widest of
 * them and the box measures identically in all three states — the swap moves
 * nothing beside it. The failure string is part of that measurement too: a
 * shift on the error path is still a shift, and it costs a little trailing
 * space at rest on buttons whose idle label is much shorter than "Copy failed".
 */
const LAYER: React.CSSProperties = {
  gridArea: '1 / 1',
  display: 'flex',
  alignItems: 'inherit',
  justifyContent: 'inherit',
  gap: 'inherit',
}

/* Crossfade, not a cut — but it follows a click on this button, and the global
   reduced-motion rule already flattens it, so `motion-reduce` here is the local
   statement of that contract rather than a second mechanism. */
const layerClass = (active: boolean) =>
  'transition-opacity duration-150 motion-reduce:transition-none' +
  (active ? '' : ' pointer-events-none opacity-0')

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
    <>
      <button type="button" onClick={copy} className={className} aria-label={ariaLabel}>
        <span style={STACK}>
          <span style={LAYER} className={layerClass(state === 'idle')}>
            {children}
          </span>
          {/* Visual only. A button is named for what it does, not for what just
              happened, so the name stays with `children` in every state and the
              outcome goes to the live region below — mutating the name under a
              focused reader announces the wrong thing. */}
          <span aria-hidden style={LAYER} className={layerClass(state === 'copied')}>
            {copiedLabel}
          </span>
          <span aria-hidden style={LAYER} className={layerClass(state === 'failed')}>
            {FAILED_LABEL}
          </span>
        </span>
      </button>
      {/* Outside the button: text inside it would join the accessible name.
          Rendered empty from the start so the region exists before it changes,
          which is what makes the change get announced at all. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied' ? copiedLabel : state === 'failed' ? FAILED_LABEL : ''}
      </span>
    </>
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
