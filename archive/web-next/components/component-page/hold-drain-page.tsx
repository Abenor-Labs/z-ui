'use client'

import * as React from 'react'
import { HoldDrain, type HoldDrainState } from '@/components/z-ui/hold-drain'
import { CodePanel } from './code-panel'
import { type Prop } from './props-table'
import type { Snippet } from './snippets'
import { ComponentPageShell, SECTION_LABEL } from './shell'

/**
 * The hold-drain page.
 *
 * Same chrome as its two siblings, and the same structural choice disclosure
 * made: no customize panel, because there is nothing here worth a slider.
 * `duration` is the only knob and changing it changes the rate, not the
 * behaviour — the symmetry the component exists for is identical at 400ms and
 * at 4s. A control that only proves the claim is scale-invariant would be
 * spending the page's best real estate on its least interesting fact.
 */

const NAME = 'hold-drain'

/* ------------------------------------------------------------- snippets -- */

const SNIPPETS: Snippet[] = [
  {
    key: 'guard',
    label: 'guarding a delete',
    lang: 'tsx',
    code: `import { HoldDrain } from "@/components/z-ui/hold-drain"

export function DangerRow({ id }: { id: string }) {
  const [gone, setGone] = React.useState(false)
  if (gone) return null

  return (
    <HoldDrain
      label="Hold to delete"
      armedLabel="Release to delete"
      onConfirm={() => { setGone(true); destroy(id) }}
    />
  )
}`,
  },
  {
    key: 'reuse',
    label: 'reusing one',
    lang: 'tsx',
    code: `// \`committed\` is terminal on purpose: a guarded destructive action
// should leave with the thing it guarded. To use the control again,
// remount it — a self-resetting confirm button would be claiming
// the action was undone when it was not.

<HoldDrain key={attempt} label="Hold to send" onConfirm={send} />

// bump \`attempt\` when you genuinely want a fresh control.`,
  },
  {
    key: 'styling',
    label: 'styling',
    lang: 'css',
    code: `/* data-state is set by the fill itself, never by a timer,
   so it cannot disagree with what is on screen. */

[data-state="draining"] {
  /* the abort is being paid for — the one state a
     conventional hold-to-confirm does not have */
}

[data-state="armed"] .label {
  font-variation-settings: "wght" 620;
}

/* Every token is optional and mixes out of currentColor. */
.danger {
  --z-danger: oklch(0.62 0.21 22);
  --z-track:  color-mix(in oklab, currentColor 8%, transparent);
  --z-radius: 6px;
}`,
  },
]

/* ---------------------------------------------------------------- props -- */

const PROPS: Prop[] = [
  {
    name: 'label',
    type: 'React.ReactNode',
    fallback: '—',
    description:
      'Resting label, and the accessible name while idle. Say what the hold will do, not that it is a hold — the fill already says that.',
  },
  {
    name: 'armedLabel',
    type: 'React.ReactNode',
    fallback: 'label',
    description:
      'Shown once the fill completes. This is the beat where the control has stopped asking and started waiting, and saying so is the difference between a guard and a delay.',
  },
  {
    name: 'committedLabel',
    type: 'React.ReactNode',
    fallback: 'armedLabel',
    description: 'Shown after the action fires. Rarely seen, because the guarded thing is usually gone by then.',
  },
  {
    name: 'duration',
    type: 'number',
    fallback: '1200',
    description:
      'Milliseconds of held time required to arm, and therefore also the time a full drain takes. A partial hold costs its own fraction of this in both directions.',
  },
  {
    name: 'onConfirm',
    type: '() => void',
    fallback: '—',
    description: 'Fires once, on the release that happens while armed. Never on a release during the fill.',
  },
  {
    name: 'onCancel',
    type: '() => void',
    fallback: 'undefined',
    description:
      'Fires when a drain completes and the control is back at rest — not at the moment of release. An abort is not finished until it has been paid for.',
  },
  {
    name: '…button props',
    type: "React.ComponentPropsWithRef<'button'>",
    fallback: '—',
    description:
      '`onClick` is excluded, and deliberately: a click is a press and a release collapsed into one event, which is the exact distinction this control is built on.',
  },
]

/* ----------------------------------------------------------------- demo -- */

/**
 * The demo is the abort test, because the abort is the only claim a still
 * cannot carry. Committing is the boring half — anyone can fill a bar. The
 * readout counts abandonments rather than confirmations for the same reason.
 */
function DemoStage() {
  const [state, setState] = React.useState<HoldDrainState>('idle')
  const [attempt, setAttempt] = React.useState(0)
  const [deleted, setDeleted] = React.useState(false)
  const [abandoned, setAbandoned] = React.useState(0)
  const probe = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const el = probe.current
    if (!el) return
    const read = () => setState((el.dataset.state ?? 'idle') as HoldDrainState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [deleted, attempt])

  const moving = state === 'filling' || state === 'draining'

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
          gap: 16,
          height: 46,
          padding: '0 16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          className="cp-mono"
          style={{ display: 'flex', alignItems: 'center', gap: 9, ...SECTION_LABEL }}
        >
          {/* Lit only while the fill is physically moving, in either direction.
              Same Moving Part Rule the sibling pages follow, and the same proof
              that data-state tracks the pixels. */}
          <span
            aria-hidden
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: moving ? 'var(--acc)' : 'var(--fg3)',
            }}
          />
          <span>{moving ? state : `at rest · ${state}`}</span>
        </div>
        <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
          abandoned <span style={{ color: 'var(--fg)' }}>{abandoned}</span>×
        </span>
      </div>

      <div
        style={{
          minHeight: 330,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 26,
          padding: '48px 32px',
          background: 'var(--bg)',
        }}
      >
        {deleted ? (
          <div
            className="cp-mono"
            style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--fg3)' }}
          >
            <span>deleted</span>
            <button
              type="button"
              className="cp-ghost"
              style={{ minHeight: 44, padding: '0 14px', fontSize: 12 }}
              onClick={() => {
                setDeleted(false)
                // A fresh control, not a reset one. `committed` is terminal by
                // design, so putting the row back means mounting a new guard.
                setAttempt((n) => n + 1)
              }}
            >
              put it back
            </button>
          </div>
        ) : (
          <HoldDrain
            key={attempt}
            ref={probe}
            label="Hold to delete"
            armedLabel="Release to delete"
            onConfirm={() => setDeleted(true)}
            onCancel={() => setAbandoned((n) => n + 1)}
          />
        )}

        <p
          style={{
            margin: 0,
            maxWidth: '46ch',
            textAlign: 'center',
            fontSize: 13.5,
            lineHeight: 1.6,
            color: 'var(--fg2)',
          }}
        >
          Let go halfway. Then press again while it is draining.
        </p>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page -- */

export function HoldDrainPage() {
  return (
    <ComponentPageShell
      name={NAME}
      heading="Hold drain"
      crumb="hold drain"
      propsLabel="<HoldDrain />"
      propsRows={PROPS}
      demo={<DemoStage />}
      lede={
        <>
          <p
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              letterSpacing: '-0.012em',
              color: 'var(--fg)',
              maxWidth: '44ch',
              textWrap: 'pretty',
            }}
          >
            Most hold-to-confirms snap back to zero the moment you let go. You did three quarters of
            the work and the control says you did none.
          </p>
          <p
            style={{
              marginTop: 14,
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--fg2)',
              maxWidth: '58ch',
            }}
          >
            This one pays the fill back at the rate it climbed, so a half-hold takes half the hold to
            undo and the guard reads as something with inertia rather than a delay imposed on you.
            Press again mid-drain and it resumes from wherever it got to. It is the one component
            here that does not spring — a spring&rsquo;s rate depends on distance remaining, so a
            spring drain would outrun the fill that earned it and the symmetry would be the first
            thing to go.
          </p>
        </>
      }
      code={
        /* Full width, like disclosure. `duration` is the only knob and it changes
           the rate rather than the behaviour, so a panel of controls would be
           three sliders proving the claim is scale-invariant. */
        <section style={{ marginTop: 52 }}>
          <CodePanel snippets={SNIPPETS} />
        </section>
      }
    />
  )
}
