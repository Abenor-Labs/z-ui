'use client'

import * as React from 'react'
import { LateCritique, type LateCritiqueState } from './late-critique'

/**
 * The demo is the mid-word test.
 *
 * Type `a@b` slowly and a validate-on-change field calls you wrong at the `@`.
 * This one says nothing until you stop. Then fix it and watch the complaint
 * leave on the keystroke that fixed it rather than 700ms later — the asymmetry
 * is the claim, and it is only visible if you do both halves.
 */
const email = (v: string) =>
  v === '' ? 'An address is required.' : /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v) ? null : 'That is not an address yet.'

export default function LateCritiqueDemo() {
  const [state, setState] = React.useState<LateCritiqueState>('idle')
  const [judgements, setJudgements] = React.useState(0)

  return (
    <div className="w-full max-w-md text-neutral-200">
      <LateCritique
        label="Email"
        placeholder="you@example.com"
        validate={email}
        onVerdict={(s) => {
          setState(s)
          if (s === 'invalid') setJudgements((n) => n + 1)
        }}
      />

      <div className="mt-3 flex items-baseline gap-4 font-mono text-xs text-neutral-500">
        <span>
          data-state <span className="text-neutral-200">{state}</span>
        </span>
        <span>
          complained <span className="text-neutral-200 tabular-nums">{judgements}</span>×
        </span>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-neutral-400">
        Type an address one character at a time. Nothing turns red mid-word — the field waits for
        you to stop. Then break it and fix it: the complaint leaves on the keystroke that fixes it,
        not on the next pause.
      </p>

      <div className="mt-8">
        <LateCritique
          label="Username"
          placeholder="at least three characters, letters only"
          quietMs={400}
          validate={(v) =>
            v.length < 3
              ? 'Three characters or more.'
              : /[^a-z0-9]/i.test(v)
                ? 'Letters and numbers only.'
                : null
          }
        />
        <p className="mt-3 font-mono text-xs text-neutral-500">
          quietMs 400 — a shorter fuse, the same asymmetry
        </p>
      </div>
    </div>
  )
}
