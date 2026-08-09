'use client'

import * as React from 'react'
import {
  CHARSET_KEYS,
  DEFAULTS,
  EASE_KEYS,
  type CharsetKey,
  type EaseKey,
  type ScrambleSettings,
} from './snippets'

const ROW: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 9,
  fontSize: 11,
}

const OPTIONS: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 6,
}

const OPTION: React.CSSProperties = { height: 30, fontSize: 10.5 }

/** Label plus live readout. Every control in the panel is introduced this way. */
function Field({
  id,
  label,
  value,
  children,
}: {
  id: string
  label: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="cp-mono" style={ROW}>
        <label htmlFor={id} style={{ color: 'var(--fg2)' }}>
          {label}
        </label>
        <span style={{ color: 'var(--fg3)' }}>{value}</span>
      </div>
      {children}
    </div>
  )
}

/**
 * The panel that makes the header's "writes to code" claim true.
 *
 * It owns no state. Every control is a controlled input over the single
 * settings object the page holds, which is the same object the demo runs from
 * and the same one the snippets are printed from — so there is no path where
 * the code shown and the text moving disagree about the chance value.
 */
export function CustomizePanel({
  settings,
  onChange,
  onPreview,
}: {
  settings: ScrambleSettings
  onChange: (next: ScrambleSettings) => void
  onPreview: () => void
}) {
  const id = React.useId()

  // A grouped set of equal-width options; used twice, for easing and charset.
  const group = <K extends string>(
    name: string,
    keys: readonly K[],
    selected: K,
    pick: (k: K) => void,
  ) => (
    <div role="group" aria-label={name} style={OPTIONS}>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={k === selected}
          onClick={() => pick(k)}
          className="cp-seg cp-mono"
          style={OPTION}
        >
          {k}
        </button>
      ))}
    </div>
  )

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: 'var(--s1)',
        position: 'sticky',
        // The 20px gap the design left under the bar above it. That bar is the
        // site's own fixed nav now — the page-local one the design drew is
        // deleted — so the offset is the site chrome plus the gap, and nothing
        // else. See the `--cp-chrome` note in the route's stylesheet.
        top: 'calc(var(--cp-chrome) + 20px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          height: 44,
          padding: '0 16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span
          className="cp-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--fg3)',
          }}
        >
          Customize
        </span>
        {/* The design ran this in mint. It is a standing label — it says what
            the panel is for and never changes — so under the Moving Part Rule
            it takes the neutral ramp instead, one step above the "Customize"
            eyebrow beside it so it still reads as the annotation it is. The
            arrow does the pointing the colour used to. */}
        <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg2)' }}>
          writes to code ↖
        </span>
      </div>

      <div
        style={{
          padding: '20px 18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <Field
          id={`${id}-duration`}
          label="duration"
          value={`${settings.duration}ms`}
        >
          <input
            id={`${id}-duration`}
            className="cp-range"
            type="range"
            min={120}
            max={1800}
            step={20}
            value={settings.duration}
            onChange={(e) => onChange({ ...settings, duration: Number(e.target.value) })}
          />
        </Field>

        <Field id={`${id}-ease`} label="easing" value={settings.ease}>
          {group<EaseKey>('easing', EASE_KEYS, settings.ease, (ease) =>
            onChange({ ...settings, ease }),
          )}
        </Field>

        <Field
          id={`${id}-chance`}
          label="chance"
          value={(settings.chance / 100).toFixed(2)}
        >
          <input
            id={`${id}-chance`}
            className="cp-range"
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.chance}
            // Percent on the wire, fraction at the hook. The readout shows the
            // fraction because that is the number the snippet will print.
            aria-valuetext={(settings.chance / 100).toFixed(2)}
            onChange={(e) => onChange({ ...settings, chance: Number(e.target.value) })}
          />
        </Field>

        <Field id={`${id}-charset`} label="charset" value={settings.charset}>
          {group<CharsetKey>('charset', CHARSET_KEYS, settings.charset, (charset) =>
            onChange({ ...settings, charset }),
          )}
        </Field>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderTop: '1px solid var(--line)',
            paddingTop: 18,
          }}
        >
          <button
            type="button"
            onClick={onPreview}
            className="cp-ghost cp-mono"
            style={{ flex: 1, height: 34, fontSize: 11 }}
          >
            preview ▸
          </button>
          <button
            type="button"
            // Trigger is deliberately preserved: it belongs to the demo's
            // toolbar, not to this panel, and resetting a control the reader
            // did not touch from here reads as a bug.
            onClick={() => onChange({ ...DEFAULTS, trigger: settings.trigger })}
            className="cp-mono"
            style={{
              height: 34,
              padding: '0 14px',
              background: 'transparent',
              border: 0,
              fontSize: 11,
              color: 'var(--fg3)',
            }}
          >
            reset
          </button>
        </div>
      </div>
    </div>
  )
}
