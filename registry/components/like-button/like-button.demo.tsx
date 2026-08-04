'use client'

import * as React from 'react'
import { LikeButton } from '@/components/z-ui/like-button'
import { springs, type SpringName } from '@/lib/z-spring'

/**
 * Showcase only. Never listed in component.json `files[]`, so the CLI never
 * writes it into a consumer project.
 */
export default function LikeButtonDemo() {
  const [controlled, setControlled] = React.useState(false)

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-center gap-4">
        <LikeButton />
        <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">
          uncontrolled
        </span>
      </section>

      <section className="flex items-center gap-4">
        <LikeButton pressed={controlled} onPressedChange={setControlled} />
        <button
          type="button"
          onClick={() => setControlled((v) => !v)}
          className="font-mono text-xs uppercase tracking-wide text-neutral-500 underline underline-offset-4"
        >
          toggle from outside: {String(controlled)}
        </button>
      </section>

      {/*
        The comparison that makes the spring scale legible. Reading that
        `bounce` has a damping ratio of 0.35 conveys nothing; pressing these
        four in a row conveys all of it.
      */}
      <section className="flex flex-wrap items-center gap-6">
        {(Object.keys(springs) as SpringName[]).map((name) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <LikeButton spring={name} aria-label={`Like, ${name} spring`} />
            <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">
              {name}
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}
