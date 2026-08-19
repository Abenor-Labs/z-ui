'use client'

import * as React from 'react'
import { useScramble } from '@/components/z-ui/scramble-reveal'
import { CHARSETS, DEMO_TEXT, TRIGGERS, type ScrambleSettings, type TriggerKey } from './snippets'

const LABEL: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--fg3)',
}

/**
 * Mirrors the no-reflow stack `<ScrambleReveal>` builds internally. The hook
 * hands back a raw string rather than an element, which is the right trade for
 * a harness that also needs `run` on a toolbar button — but it means the box
 * has to be sized by the answer here instead. The ghost is the target string,
 * in flow and invisible; the churning glyphs are painted out of flow over it,
 * so nothing they do can feed back into the track.
 */
const GHOST: React.CSSProperties = { gridArea: '1 / 1', visibility: 'hidden' }
const PAINT: React.CSSProperties = {
  gridArea: '1 / 1',
  position: 'absolute',
  inset: 0,
  width: '100%',
}

/**
 * The live demo. One `useScramble` drives both the text and the toolbar, so the
 * "re-run" button restarts the same instance the trigger armed rather than a
 * second one racing it.
 *
 * The hook's ref goes on the stage, not on the text: `hover` and `view` both
 * key off whatever it is attached to, and the design's pointer target is the
 * whole 330px panel. Hanging it on a 56px line would make the reader aim.
 */
export function DemoCard({
  settings,
  onTrigger,
  runToken,
}: {
  settings: ScrambleSettings
  onTrigger: (t: TriggerKey) => void
  /** Bumped by the customize panel's "preview". A counter rather than a
      callback ref, so the request survives `run` being re-created every time a
      setting changes. */
  runToken: number
}) {
  const { text, running, run, ref } = useScramble<HTMLDivElement>({
    text: DEMO_TEXT,
    duration: settings.duration,
    ease: settings.ease,
    // The slider counts in whole percent because a 0..1 range input with a 0.01
    // step is a worse control; the hook's unit is the fraction.
    chance: settings.chance / 100,
    chars: CHARSETS[settings.charset],
    trigger: settings.trigger,
    // A demo whose only affordance is hover has to answer the second hover too.
    playOnce: false,
  })

  const latest = React.useRef(run)
  React.useEffect(() => {
    latest.current = run
  })

  // Skips the mount pass: `trigger: "load"` already ran once by then, and a
  // second start would show the first two frames twice.
  const armed = React.useRef(false)
  React.useEffect(() => {
    if (armed.current) latest.current()
    else armed.current = true
  }, [runToken])

  const live = TRIGGERS.find((t) => t.key === settings.trigger)?.live ?? 'on hover'

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--s1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          height: 46,
          padding: '0 8px 0 16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {/* The design lit this dot mint and left it lit. A dot that is always
              on is mint at rest, which the Moving Part Rule forbids — so it is
              bound to `running` instead and marks the one thing on this card
              that actually moves. Hue is not the only channel: it also grows,
              and the readout under the stage says the word. */}
          <span
            aria-hidden
            style={{
              // Fixed box, scaled contents. Growing the box would push the label
              // 2px sideways every time a run starts, on a card whose whole
              // claim is that nothing reflows.
              width: 6,
              height: 6,
              flex: 'none',
              borderRadius: 999,
              background: running ? 'var(--acc)' : 'var(--line2)',
              transform: running ? 'scale(1)' : 'scale(0.66)',
              transition:
                'background-color 220ms var(--ease), transform 220ms var(--ease)',
            }}
          />
          <span className="cp-mono" style={{ ...LABEL, whiteSpace: 'nowrap' }}>
            live · {live}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            role="group"
            aria-label="Trigger"
            style={{
              display: 'flex',
              gap: 2,
              padding: 3,
              border: '1px solid var(--line)',
              borderRadius: 7,
            }}
          >
            {TRIGGERS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={settings.trigger === t.key}
                onClick={() => onTrigger(t.key)}
                className="cp-seg cp-mono"
                style={{ height: 26, padding: '0 11px', fontSize: 11, whiteSpace: 'nowrap' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={run}
            className="cp-ghost cp-mono"
            style={{ height: 32, padding: '0 11px', fontSize: 11.5, whiteSpace: 'nowrap' }}
          >
            re-run ↻
          </button>
        </div>
      </div>

      <div
        ref={ref}
        style={{
          minHeight: 330,
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: '56px 32px',
        }}
      >
        <div
          className="cp-mono"
          style={{
            position: 'relative',
            display: 'grid',
            whiteSpace: 'pre',
            fontSize: 56,
            lineHeight: 1.1,
            letterSpacing: '-0.045em',
            fontWeight: 500,
            color: 'var(--fg)',
            textAlign: 'center',
            maxWidth: '100%',
          }}
        >
          <span aria-hidden style={GHOST}>
            {DEMO_TEXT}
          </span>
          <span aria-hidden style={PAINT}>
            {text}
          </span>
          {/* The name is the answer, always. Announcing forty frames of `!<>-_`
              is the failure this replaces. */}
          <span className="sr-only">{DEMO_TEXT}</span>
        </div>

        <p
          className="cp-mono"
          style={{ fontSize: 11, color: 'var(--fg3)', textAlign: 'center' }}
        >
          <span style={{ color: running ? 'var(--acc)' : 'var(--fg3)' }}>
            {running ? 'resolving' : 'settled'}
          </span>
          {' · '}
          {settings.duration}ms
          {' · '}
          {settings.ease}
          {' · '}
          chance {(settings.chance / 100).toFixed(2)}
        </p>
      </div>
    </div>
  )
}
