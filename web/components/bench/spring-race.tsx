'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import { springs, type SpringName } from '@/lib/z-spring'

/**
 * Derived from the same stiffness and damping the components animate from, so
 * the table cannot drift from the physics it describes.
 *
 *   damping ratio  z  = c / (2 * sqrt(k * m))
 *   peak overshoot    = exp(-pi * z / sqrt(1 - z^2))
 *   t90               = first time the step response reaches 0.9
 *   rest (2%)         = 4 / (z * w0)
 */
function physics(name: SpringName) {
  const { stiffness: k, damping: c, mass: m } = springs[name] as {
    stiffness: number
    damping: number
    mass: number
  }
  const w0 = Math.sqrt(k / m)
  const z = c / (2 * Math.sqrt(k * m))
  const wd = w0 * Math.sqrt(1 - z * z)
  const overshoot = Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z))
  const x = (t: number) =>
    1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t))
  let t90 = 0
  for (let t = 0; t < 3; t += 0.0005) {
    if (x(t) >= 0.9) {
      t90 = t
      break
    }
  }
  return {
    z,
    overshoot,
    t90: Math.round(t90 * 1000),
    rest: Math.round((4 / (z * w0)) * 1000),
  }
}

const NAMES = Object.keys(springs) as SpringName[]

/**
 * The only honest answer to "what does bounce feel like". One trigger, four
 * presets, fired together.
 *
 * Deliberately not a component. This ran on a like-button for a while, which
 * meant every component's page demonstrated its springs using a different
 * component — four hearts on the scrub page, explaining nothing about scrub.
 * A bare travelling mark isolates the spring from whatever it happens to be
 * driving, and the dashed line marks the target so overshoot is a thing you can
 * see the mark cross rather than a number in the table underneath.
 */
export function SpringRace() {
  const [out, setOut] = React.useState(false)
  const fire = () => setOut((o) => !o)

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-panel">
      <div className="flex items-center justify-between border-b border-hair px-5 py-3">
        <span className="lbl">the same press, four presets</span>
        <button
          type="button"
          onClick={fire}
          className="border border-accent px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent hover:text-chassis"
        >
          fire all
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4">
        {NAMES.map((name) => {
          const p = physics(name)
          return (
            <div
              key={name}
              className="flex flex-col items-center gap-3 border-b border-r border-hair px-3 py-6 last:border-r-0 sm:border-b-0"
            >
              {/* The track. The dashed rule is the target, so a mark that goes
                  past it and comes back is overshoot you watched happen. */}
              <div className="relative h-10 w-full" aria-hidden>
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
                <span className="absolute right-2 top-1/2 h-4 w-px -translate-y-1/2 border-l border-dashed border-white/30" />
                <motion.span
                  className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-accent"
                  initial={false}
                  animate={{ left: out ? 'calc(100% - 0.5rem - 5px)' : '5px' }}
                  transition={springs[name]}
                />
              </div>
              <span className="lbl !text-accent">{name}</span>
              <dl className="grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5 font-mono text-[0.6875rem] tabular-nums text-muted">
                <dt>ζ</dt>
                <dd className="text-right text-ink">{p.z.toFixed(2)}</dd>
                <dt>t90</dt>
                <dd className="text-right text-ink">{p.t90}ms</dd>
                <dt>over</dt>
                <dd className="text-right text-ink">
                  {p.overshoot < 0.01 ? '<1' : Math.round(p.overshoot * 100)}%
                </dd>
                <dt>rest</dt>
                <dd className="text-right text-ink">{p.rest}ms</dd>
              </dl>
            </div>
          )
        })}
      </div>
    </div>
  )
}
