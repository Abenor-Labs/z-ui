'use client'

import * as React from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { springs } from '@/lib/z-spring'

/**
 * Scroll entrances, on the same spring scale the registry ships.
 *
 * A site selling spring physics that scrolls like a document is arguing against
 * itself. But the entrances are `settle`, not `bounce` — page chrome that
 * overshoots competes with the components, which are the only things here that
 * have earned the right to be springy.
 *
 * `once`, because content that re-animates every time it passes the viewport is
 * a decoration rather than an arrival.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const reduced = useReducedMotionConfig() === true

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -80px 0px' }}
      transition={{ ...springs.settle, delay }}
    >
      {children}
    </motion.div>
  )
}
