'use client'

import * as React from 'react'
import { MotionConfig } from 'motion/react'
import { springs, type SpringName } from '@/lib/z-spring'

/**
 * The instrument the whole site exists for.
 *
 * A micro-animation is invisible in a screenshot and meaningless in a static
 * grid, so the bench does three things a video cannot: it reports the state the
 * component is actually in, it forces states the reader would not think to
 * trigger, and it puts the whole configuration in the URL so an interaction can
 * be linked to rather than described.
 */

/**
 * Forcing a state means driving the component the way a user would, not
 * reaching inside it.
 *
 * `pointerover`, not `pointerenter`: React derives enter and leave from
 * over and out at the root, so a synthetic `pointerenter` reaches nothing.
 * Verified against React 19.2 and motion 12.43; a component that keys off
 * motion's own `whileHover` would need `pointerenter` instead, which is one
 * reason registry components own their pointer handlers explicitly.
 */
function decompose(state: string) {
  return {
    pressed: state.startsWith('liked'),
    hover: state === 'hover' || state.endsWith('-hover'),
    press: state === 'pressing' || state.endsWith('-pressing'),
  }
}

function fire(el: Element, type: string) {
  el.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerType: 'mouse', isPrimary: true, button: 0 }),
  )
}

export type BenchProps = {
  states: string[]
  defaultSpring: SpringName
  render: (args: {
    pressed: boolean
    setPressed: (v: boolean) => void
    spring: SpringName
  }) => React.ReactNode
}

export function Bench({ states, defaultSpring, render }: BenchProps) {
  const [spring, setSpring] = React.useState<SpringName>(defaultSpring)
  const [reduced, setReduced] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [forced, setForced] = React.useState<string | null>(null)
  const [nonce, setNonce] = React.useState(0)
  const [live, setLive] = React.useState<string>('idle')
  const [moving, setMoving] = React.useState(false)

  const stageRef = React.useRef<HTMLDivElement>(null)

  // Read the state cold from the URL once, so a shared link lands on the
  // configuration it promises.
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const s = q.get('spring')
    if (s && s in springs) setSpring(s as SpringName)
    if (q.get('rm') === '1') setReduced(true)
    const st = q.get('state')
    if (st && states.includes(st)) setForced(st)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const q = new URLSearchParams()
    if (spring !== defaultSpring) q.set('spring', spring)
    if (reduced) q.set('rm', '1')
    if (forced) q.set('state', forced)
    const qs = q.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [spring, reduced, forced, defaultSpring])

  /**
   * The readout watches the DOM attribute rather than React state, so it
   * reports what a consumer's CSS would actually match. If those two ever
   * disagree the bench shows the disagreement instead of hiding it.
   */
  React.useEffect(() => {
    const root = stageRef.current?.querySelector('[data-state]')
    if (!root) return
    setLive(root.getAttribute('data-state') ?? 'idle')
    const obs = new MutationObserver(() => {
      const next = root.getAttribute('data-state') ?? 'idle'
      setLive(next)
      setMoving(true)
      window.clearTimeout((obs as unknown as { t?: number }).t)
      ;(obs as unknown as { t?: number }).t = window.setTimeout(() => setMoving(false), 620)
    })
    obs.observe(root, { attributes: true, attributeFilter: ['data-state'] })
    return () => obs.disconnect()
  }, [nonce])

  const applyForce = React.useCallback((state: string | null) => {
    setForced(state)
    const el = stageRef.current?.querySelector('[data-state]')
    if (!el) return
    if (state === null) {
      fire(el, 'pointerup')
      fire(el, 'pointerout')
      return
    }
    const { pressed: p, hover, press } = decompose(state)
    setPressed(p)
    // Always leave first so the component starts from a known interaction.
    fire(el, 'pointerup')
    fire(el, 'pointerout')
    if (hover || press) fire(el, 'pointerover')
    if (press) fire(el, 'pointerdown')
  }, [])

  const replay = () => {
    setForced(null)
    setPressed(false)
    setNonce((n) => n + 1)
  }

  return (
    <div className="border border-rule bg-panel">
      {/* stage */}
      <div
        ref={stageRef}
        key={nonce}
        className="grid min-h-52 place-items-center border-b border-rule px-6 py-12"
      >
        <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
          {render({ pressed, setPressed, spring })}
        </MotionConfig>
      </div>

      {/* readout */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-rule px-5 py-3">
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={
              'size-1.5 rounded-full transition-colors duration-150 ' +
              (moving ? 'bg-mint' : 'bg-rule')
            }
          />
          <span className="lbl">data-state</span>
          <code className="font-mono text-sm text-mint">{live}</code>
        </span>
        <span className="flex items-center gap-2.5">
          <span className="lbl">spring</span>
          <code className="font-mono text-sm text-silkscreen">{spring}</code>
        </span>
      </div>

      {/* controls */}
      <div className="grid gap-3 px-5 py-4">
        <Row label="state">
          {states.map((s) => (
            <Chip key={s} active={forced === s} onClick={() => applyForce(s)}>
              {s}
            </Chip>
          ))}
          <Chip active={forced === null} onClick={() => applyForce(null)}>
            release
          </Chip>
        </Row>

        <Row label="spring">
          {(Object.keys(springs) as SpringName[]).map((s) => (
            <Chip key={s} active={spring === s} onClick={() => setSpring(s)}>
              {s}
            </Chip>
          ))}
        </Row>

        <Row label="motion">
          <Chip active={!reduced} onClick={() => setReduced(false)}>
            full
          </Chip>
          <Chip active={reduced} onClick={() => setReduced(true)}>
            reduced
          </Chip>
          <span className="ml-2">
            <Chip active={false} onClick={replay}>
              ↻ replay
            </Chip>
          </span>
        </Row>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="lbl w-14 shrink-0">{label}</span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'border px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors ' +
        (active
          ? 'border-mint text-mint'
          : 'border-rule text-muted hover:border-muted hover:text-silkscreen')
      }
    >
      {children}
    </button>
  )
}
