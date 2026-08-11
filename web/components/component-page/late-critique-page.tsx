'use client'

import * as React from 'react'
import { LateCritique, type LateCritiqueState } from '@/components/z-ui/late-critique'
import { CodePanel } from './code-panel'
import { type Prop } from './props-table'
import type { Snippet } from './snippets'
import { ComponentPageShell, SECTION_LABEL } from './shell'

/**
 * The late-critique page.
 *
 * Full width like its two siblings. The only knob is `quietMs`, and the whole
 * point of the component is that you should not have to think about it — a
 * slider inviting people to tune the pause would be advertising the one
 * decision the component already made for them.
 */

const NAME = 'late-critique'

const EMAIL = (v: string) =>
  v === ''
    ? 'An address is required.'
    : /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)
      ? null
      : 'That is not an address yet.'

/* ------------------------------------------------------------- snippets -- */

const SNIPPETS: Snippet[] = [
  {
    key: 'basic',
    label: 'a field',
    lang: 'tsx',
    code: `import { LateCritique } from "@/components/z-ui/late-critique"

export function Signup() {
  return (
    <LateCritique
      label="Email"
      placeholder="you@example.com"
      validate={(v) =>
        /^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$/i.test(v)
          ? null
          : "That is not an address yet."
      }
    />
  )
}`,
  },
  {
    key: 'controlled',
    label: 'controlled',
    lang: 'tsx',
    code: `// The value is yours; the verdict is the component's. onVerdict fires
// after commit, so putting it straight into your own state is safe.

const [email, setEmail] = React.useState("")
const [ok, setOk] = React.useState(false)

<LateCritique
  label="Email"
  value={email}
  onValueChange={setEmail}
  onVerdict={(s) => setOk(s === "valid")}
  validate={check}
/>

<button disabled={!ok}>Continue</button>`,
  },
  {
    key: 'styling',
    label: 'styling',
    lang: 'css',
    code: `/* Six states, and the two worth styling are the ones a
   conventional field does not have. */

[data-state="settling"] {
  /* the pause has begun, the verdict has not landed —
     this is what stops the error being an ambush */
}

[data-state="recovering"] {
  /* was wrong, now right, message on its way out */
}

/* Every token is optional and mixes out of currentColor. */
.field {
  --z-invalid: oklch(0.64 0.19 25);
  --z-valid:   oklch(0.72 0.15 155);
  --z-radius:  6px;
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
      'Visible label, and the accessible name. Rendered as a real `<label>` bound by id — a placeholder is not a label and disappears exactly when it is needed.',
  },
  {
    name: 'validate',
    type: '(value: string) => string | null',
    fallback: '—',
    description:
      'Returns the complaint, or null when the value is acceptable. Called on a pause, and on every keystroke while a complaint is already showing — that asymmetry is the component.',
  },
  {
    name: 'quietMs',
    type: 'number',
    fallback: '700',
    description:
      'Milliseconds of quiet before the field is willing to judge. Comfortably longer than the 200-300ms gap between words for a fluent typist, which is the threshold a shorter value starts firing inside.',
  },
  {
    name: 'value',
    type: 'string',
    fallback: 'undefined',
    description: 'Pass to control. Omit and the field owns its own value.',
  },
  {
    name: 'defaultValue',
    type: 'string',
    fallback: "''",
    description: 'Uncontrolled starting value. Ignored when `value` is passed.',
  },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    fallback: 'undefined',
    description: 'Fires on every keystroke, before any verdict exists.',
  },
  {
    name: 'onVerdict',
    type: '(state: LateCritiqueState) => void',
    fallback: 'undefined',
    description:
      'Fires when the verdict changes, from an effect rather than mid-render — so writing it straight into your own state does not warn.',
  },
  {
    name: '…input props',
    type: "React.ComponentPropsWithRef<'input'>",
    fallback: '—',
    description:
      'Everything else lands on the input. `aria-invalid` and `aria-describedby` are managed by the component and wired to the complaint.',
  },
]

/* ----------------------------------------------------------------- demo -- */

/**
 * The demo is the mid-word test.
 *
 * Typing badly is half of it and the boring half — plenty of fields wait. The
 * claim only lands if you then fix the value and watch the complaint go on that
 * keystroke rather than on the next pause, so the rail counts complaints and
 * the copy tells you to break it on purpose.
 */
function DemoStage() {
  const [state, setState] = React.useState<LateCritiqueState>('idle')
  const [complaints, setComplaints] = React.useState(0)

  const moving = state === 'typing' || state === 'settling' || state === 'recovering'

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
          complained <span style={{ color: 'var(--fg)' }}>{complaints}</span>×
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
        <div style={{ width: '100%', maxWidth: 420 }}>
          <LateCritique
            label="Email"
            placeholder="you@example.com"
            validate={EMAIL}
            onVerdict={(s) => {
              setState(s)
              if (s === 'invalid') setComplaints((n) => n + 1)
            }}
          />
        </div>

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
          Type it one character at a time. Then break it, wait for the complaint, and fix it.
        </p>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page -- */

export function LateCritiquePage() {
  return (
    <ComponentPageShell
      name={NAME}
      heading="Late critique"
      crumb="late critique"
      propsLabel="<LateCritique />"
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
            Validate-on-change calls you wrong on the second character of a word you had every
            intention of finishing.
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
            Criticism here waits for a pause, because a pause is the only reliable sign a thought is
            finished. Forgiveness waits for nothing: once a complaint is showing, every keystroke is
            checked and the first that fixes the value clears it on the same frame. The debounce is
            on entering the error and never on leaving it — one line of logic, and the difference
            between a field that nags and a field that is paying attention.
          </p>
        </>
      }
      code={
        /* Full width. `quietMs` is the only knob and the component's whole
           argument is that you should not have to think about it. */
        <section style={{ marginTop: 52 }}>
          <CodePanel snippets={SNIPPETS} />
        </section>
      }
    />
  )
}
