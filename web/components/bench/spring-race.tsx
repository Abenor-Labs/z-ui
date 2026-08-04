'use client'

import * as React from 'react'
import { springs, type SpringName } from '@/lib/z-spring'
import { LikeButton } from '@/components/z-ui/like-button'

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
 * presets, same component, same size. Reading that bounce has a damping ratio
 * of 0.35 conveys nothing; firing these together conveys all of it.
 */
export function SpringRace() {
  const [nonce, setNonce] = React.useState(0)
  const [pressed, setPressed] = React.useState(false)

  const fire = () => {
    setPressed((p) => !p)
    setNonce((n) => n + 1)
  }

  return (
    <div className="border border-rule bg-panel">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <span className="lbl">the same press, four presets</span>
        <button
          type="button"
          onClick={fire}
          className="border border-mint px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-mint transition-colors hover:bg-mint hover:text-chassis"
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
              className="flex flex-col items-center gap-3 border-b border-r border-rule px-3 py-6 last:border-r-0 sm:border-b-0"
            >
              <LikeButton
                key={`${name}-${nonce}`}
                spring={name}
                pressed={pressed}
                onPressedChange={setPressed}
                aria-label={`Like, ${name} spring`}
              />
              <span className="lbl !text-mint">{name}</span>
              <dl className="grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5 font-mono text-[0.6875rem] tabular-nums text-muted">
                <dt>ζ</dt>
                <dd className="text-right text-silkscreen">{p.z.toFixed(2)}</dd>
                <dt>t90</dt>
                <dd className="text-right text-silkscreen">{p.t90}ms</dd>
                <dt>over</dt>
                <dd className="text-right text-silkscreen">
                  {p.overshoot < 0.01 ? '<1' : Math.round(p.overshoot * 100)}%
                </dd>
                <dt>rest</dt>
                <dd className="text-right text-silkscreen">{p.rest}ms</dd>
              </dl>
            </div>
          )
        })}
      </div>
    </div>
  )
}
