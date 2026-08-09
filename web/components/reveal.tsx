import * as React from 'react'

/**
 * Not an entrance anymore. This used to animate every child in on scroll —
 * DESIGN.md bans exactly that ("Don't animate anything the user did not
 * touch. No mount animations, no scroll-driven reveals..."), and the
 * component's own previous comment argued against itself while shipping the
 * pattern anyway. Children render directly now. The wrapper stays because
 * every call site already relies on it being a block-level container for
 * layout, not because it does anything.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}
