'use client'

import { LikeButton } from '@/components/z-ui/like-button'
import { Bench } from '@/components/bench/bench'
import type { SpringName } from '@/lib/z-spring'

/**
 * The demo is a real import of the shipped component, not a copy. If the
 * registry source breaks, this page breaks with it, which is the point.
 */
export function LikeButtonBench({
  states,
  defaultSpring,
}: {
  states: string[]
  defaultSpring: SpringName
}) {
  return (
    <Bench
      states={states}
      defaultSpring={defaultSpring}
      render={({ pressed, setPressed, spring }) => (
        <div className="scale-[2] sm:scale-[2.6]">
          <LikeButton pressed={pressed} onPressedChange={setPressed} spring={spring} />
        </div>
      )}
    />
  )
}
