'use client'

import * as React from 'react'
import {
  ScrambleReveal,
  SCRAMBLE_SETS,
  useScramble,
  type ScrambleSetName,
} from './scramble-reveal'

const SETS = Object.keys(SCRAMBLE_SETS) as ScrambleSetName[]

export default function ScrambleRevealDemo() {
  const [set, setSet] = React.useState<ScrambleSetName>('symbols')
  const [runs, setRuns] = React.useState(0)

  // The hook on its own returns a bare string, and a bare string reflows. The
  // no-reflow stack lives in ScrambleReveal; this readout gets away without it
  // because it is monospaced and tabular, which is the only case where the
  // shortcut is true.
  const readout = useScramble({
    text: 'DECODE COMPLETE',
    trigger: 'load',
    chars: SCRAMBLE_SETS[set],
    duration: 900,
    onComplete: () => setRuns((n) => n + 1),
  })

  return (
    <div className="w-full max-w-md text-neutral-200">
      <ScrambleReveal
        as="h2"
        text="Scramble Reveal"
        chars={SCRAMBLE_SETS[set]}
        trigger="hover"
        playOnce={false}
        className="text-2xl font-medium tracking-tight"
      />

      <ScrambleReveal
        as="p"
        text="Decodes when it first enters view."
        chars={SCRAMBLE_SETS[set]}
        trigger="view"
        duration={780}
        className="mt-2 text-sm text-neutral-500"
      />

      <div className="mt-8 flex items-center gap-2">
        {SETS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSet(name)}
            aria-pressed={set === name}
            className={
              'rounded-md px-2.5 py-1 font-mono text-xs transition-colors ' +
              (set === name
                ? 'bg-neutral-200 text-neutral-900'
                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200')
            }
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-baseline gap-4">
        <span className="font-mono text-sm tabular-nums text-neutral-300">{readout.text}</span>
        <button
          type="button"
          onClick={readout.run}
          disabled={readout.running}
          className="font-mono text-xs text-neutral-500 underline-offset-4 hover:text-neutral-200 hover:underline disabled:opacity-40"
        >
          replay
        </button>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-neutral-500">
        Hover the heading to re-decode it. Spaces never scramble, so the word
        boundaries hold while the glyphs churn.
        <span className="block pt-2 text-neutral-300">
          {runs} completed {runs === 1 ? 'run' : 'runs'}
        </span>
      </p>
    </div>
  )
}
