'use client'

import * as React from 'react'
import Link from 'next/link'
import { byName } from '@/__generated__/meta.js'
import { Disclosure, type DisclosureState } from '@/components/z-ui/disclosure'
import { CodePanel } from './code-panel'
import { CopyButton } from './copy-button'
import { PropsTable, type Prop } from './props-table'
import type { Snippet } from './snippets'
import { RelatedCards } from './related'

/**
 * The disclosure page.
 *
 * It shares the chrome with `/scramble-reveal` — same stylesheet, same code
 * panel, same props table, same related grid — and diverges in the one place
 * that matters: there is no customize panel, because there is nothing to
 * customize. Disclosure takes an open state and children; the spring is a
 * constant in the file you own. A page that grew three sliders to look like its
 * sibling would be inventing an API, so this one spends the space on the demo
 * instead, which is where the whole claim lives.
 */

const NAME = 'disclosure'
const INSTALL = 'npx @abenor/z-ui add disclosure'

const HINTS = [
  'pnpm dlx @abenor/z-ui add disclosure',
  'bunx @abenor/z-ui add disclosure',
  'or paste the file below',
]

/** On `main` since the 2026-08-10 merge, same as its sibling. */
const SOURCE_URL =
  'https://github.com/Abenor-Labs/z-ui/blob/main/registry/components/disclosure/disclosure.tsx'
const SOURCE_LIVE = true

const MANIFEST = byName[NAME]

const FACTS = [
  MANIFEST?.states ? `${MANIFEST.states.length} states` : null,
  // Disclosure does need motion, and saying so is more useful than the "no
  // deps" its sibling can claim. The number is read from the manifest so it
  // cannot outlive a change to what the CLI installs.
  MANIFEST && MANIFEST.dependencies.length > 0 ? MANIFEST.dependencies.join(' · ') : 'no deps',
].filter((f): f is string => f !== null)

/**
 * `STATES` is read from the manifest rather than retyped, so the rail below
 * cannot list a state the component does not emit. That is the same three-way
 * contract the registry lint enforces, held one layer further out.
 */
const STATES = MANIFEST?.states ?? []

const CONTAINER: React.CSSProperties = {
  width: '100%',
  maxWidth: 1240,
  margin: '0 auto',
  padding: '0 40px',
}

const META: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--fg3)',
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--fg3)',
}

const H2: React.CSSProperties = { fontSize: 28, letterSpacing: '-0.02em', fontWeight: 600 }

const SECTION_HEAD: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  borderBottom: '1px solid var(--line)',
}

const CRUMB_LINK = 'transition-colors hover:text-[var(--fg)]'

/* ------------------------------------------------------------- snippets -- */

const SNIPPETS: Snippet[] = [
  {
    key: 'uncontrolled',
    label: 'uncontrolled',
    lang: 'tsx',
    code: `import { Disclosure } from "@/components/z-ui/disclosure"

export function Details() {
  return (
    <Disclosure label="What changed in 2.1">
      <p>The height is a spring, so a second press
         mid-open reverses from where it got to.</p>
    </Disclosure>
  )
}`,
  },
  {
    key: 'controlled',
    label: 'controlled',
    lang: 'tsx',
    code: `import * as React from "react"
import { Disclosure } from "@/components/z-ui/disclosure"

export function OnlyOneOpen() {
  const [open, setOpen] = React.useState<string | null>(null)

  return SECTIONS.map((s) => (
    <Disclosure
      key={s.id}
      label={s.label}
      open={open === s.id}
      onOpenChange={(next) => setOpen(next ? s.id : null)}
      onOpenChangeComplete={(o) => o && track("opened", s.id)}
    >
      {s.body}
    </Disclosure>
  ))
}`,
  },
  {
    key: 'styling',
    label: 'styling',
    lang: 'css',
    code: `/* data-state is on the root and is set by the spring
   itself, never by a timer — so it cannot disagree
   with what is on screen. */

[data-state="opening"] .caret,
[data-state="closing"] .caret {
  color: var(--z-accent);
}

[data-state="open"] {
  border-color: var(--z-line);
}

/* Override the palette the component mixes out of
   currentColor. Every one of them is optional. */
.panel {
  --z-line:   color-mix(in oklab, #fff 18%, transparent);
  --z-accent: oklch(0.75 0.19 145);
  --z-radius: 4px;
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
      "The trigger's visible text, and its accessible name. Named `label` rather than `title` because the latter is an HTML attribute on the root and the two would collide.",
  },
  {
    name: 'children',
    type: 'React.ReactNode',
    fallback: '—',
    description:
      'The panel contents. Measured with a ResizeObserver, so it may change size at any time — while open, the panel matches instantly rather than springing, which is what a window resize needs.',
  },
  {
    name: 'defaultOpen',
    type: 'boolean',
    fallback: 'false',
    description:
      'Starting position for the uncontrolled case. It is a position, not an interaction: nothing animates on mount and no completion is reported.',
  },
  {
    name: 'open',
    type: 'boolean',
    fallback: 'undefined',
    description:
      'Pass to control. Omitted, the component owns its own state. The trigger keeps working either way — controlled, it reports instead of deciding.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    fallback: 'undefined',
    description: 'Fires the instant the trigger is used, before anything moves.',
  },
  {
    name: 'onOpenChangeComplete',
    type: '(open: boolean) => void',
    fallback: 'undefined',
    // Stated plainly because the alternative reading — that every toggle
    // reports — is the one that produces a double-count bug in a consumer's
    // analytics the first time someone mashes the trigger.
    description:
      'Fires when the panel has physically stopped, with the state it stopped in. An interrupted transition does not report; the one that interrupts it does. Also fires on the reduced-motion path, where stopping is immediate.',
  },
  {
    name: '…div props',
    type: "React.ComponentPropsWithRef<'div'>",
    fallback: '—',
    description:
      'Everything else lands on the root, `ref` and `className` included. `style` merges over the component’s own custom properties rather than replacing them.',
  },
]

/* ----------------------------------------------------------------- demo -- */

/**
 * The demo is the acceptance test, on the page.
 *
 * There is only one claim worth making about this component and it is invisible
 * in a still: that a second press mid-flight continues from where the first got
 * to, carrying its speed. So the stage gives it enough travel to be interrupted
 * inside one gesture, and the rail underneath reads `data-state` off the DOM —
 * not off a callback, and not off a copy of the component's state — so what is
 * printed is literally what a consumer's CSS would match.
 */
function DemoStage() {
  const [state, setState] = React.useState<DisclosureState>('closed')
  const [settles, setSettles] = React.useState(0)
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const read = () => setState((el.dataset.state ?? 'closed') as DisclosureState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])

  const moving = state === 'opening' || state === 'closing'

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
          {/* Lit only while the panel is physically moving. The Moving Part Rule
              is the whole reason this dot is here rather than a static "live"
              badge — it is the page telling the truth about the same instant
              the component is. */}
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
          settled <span style={{ color: 'var(--fg)' }}>{settles}</span>×
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
        <div style={{ width: '100%', maxWidth: 460 }}>
          <Disclosure
            ref={root}
            label="Press me twice, quickly"
            onOpenChangeComplete={() => setSettles((n) => n + 1)}
          >
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Height here is a value with a position and a velocity, not a journey from A to B.
              Reverse it halfway and it is the same mass with the sign of the force flipped — it
              keeps its speed through the turn. Nothing queues, nothing restarts, and there is no
              frame where the panel is stationary.
            </p>
          </Disclosure>
        </div>

        {/* The state rail. Every value the manifest declares, in order, with the
            live one lit — so a reader can see that `closing` is a real state
            they can style and not an implementation detail. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {STATES.map((s) => {
            const on = s === state
            return (
              <span
                key={s}
                className="cp-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 24,
                  padding: '0 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  border: `1px solid ${on ? 'var(--color-muted)' : 'var(--line)'}`,
                  background: on ? 'var(--s2)' : 'transparent',
                  color: on ? 'var(--fg)' : 'var(--fg3)',
                }}
              >
                {s}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page -- */

export function DisclosurePage() {
  return (
    <div className="component-page">
      <main style={{ ...CONTAINER, paddingBottom: 88 }}>
        <nav aria-label="Breadcrumb" className="cp-mono" style={{ paddingTop: 36 }}>
          <ol style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--fg3)' }}>
            <li>
              <Link href="/" className={CRUMB_LINK}>
                Z-UI
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/components" className={CRUMB_LINK}>
                components
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" style={{ color: 'var(--fg2)' }}>
              disclosure
            </li>
          </ol>
        </nav>

        <div
          style={{
            marginTop: 26,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{ fontSize: 44, lineHeight: 1.04, letterSpacing: '-0.028em', fontWeight: 600 }}
            >
              Disclosure
            </h1>
            <div
              className="cp-mono"
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
                ...META,
              }}
            >
              {MANIFEST?.category ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 24,
                    padding: '0 10px',
                    border: '1px solid var(--line)',
                    borderRadius: 999,
                  }}
                >
                  {MANIFEST.category}
                </span>
              ) : null}
              {FACTS.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noreferrer"
              className="cp-ghost cp-mono"
              title={SOURCE_LIVE ? undefined : 'Resolves once the registry is merged to main'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 36,
                padding: '0 14px',
                fontSize: 12,
              }}
            >
              source ↗
              {SOURCE_LIVE ? null : <span style={{ color: 'var(--fg3)' }}>needs the merge</span>}
            </a>
            <a
              href="#install"
              className="cp-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 36,
                padding: '0 16px',
                fontSize: 14,
              }}
            >
              Get component
            </a>
          </div>
        </div>

        <div style={{ paddingTop: 36 }}>
          <DemoStage />
        </div>

        <div style={{ paddingTop: 28 }}>
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
            Most disclosures plan a journey. Interrupt one and it throws the plan away and starts a
            new one, from rest.
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
            This one springs a height, so velocity survives the reversal. It clips only while
            moving, releases the clip once open so a focus ring inside is not shaved off, measures
            with a{' '}
            <code className="cp-mono" style={{ color: 'var(--fg)' }}>
              ResizeObserver
            </code>{' '}
            so reflow does not strand it, pulls focus back to the trigger when you close on
            something focused, and under{' '}
            <code className="cp-mono" style={{ color: 'var(--fg)' }}>
              prefers-reduced-motion
            </code>{' '}
            skips the intermediate states entirely while still firing the completion callback.
          </p>
        </div>

        <section
          id="install"
          style={{ paddingTop: 52, scrollMarginTop: 'calc(var(--cp-chrome) + 16px)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 className="cp-mono" style={SECTION_LABEL}>
              Install
            </h2>
            <span
              className="cp-mono"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 18,
                padding: '0 7px',
                borderRadius: 4,
                background: 'var(--s2)',
                color: 'var(--fg2)',
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              0.1.1 pending
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              height: 56,
              padding: '0 8px 0 18px',
              border: '1px solid var(--line)',
              borderRadius: 8,
              background: 'var(--s1)',
            }}
          >
            <span className="cp-mono" aria-hidden style={{ color: 'var(--fg3)', flex: 'none' }}>
              $
            </span>
            <code
              className="cp-mono"
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13.5,
                color: 'var(--fg)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {INSTALL}
            </code>
            <CopyButton value={INSTALL} label="copy the install command" />
          </div>

          <div
            className="cp-mono"
            style={{
              marginTop: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              fontSize: 11,
              color: 'var(--fg3)',
            }}
          >
            {HINTS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </section>

        {/* Full width, not the sibling page's two-column split. There is no
            customize panel to sit beside it, and stretching the code to fill
            the gap beats leaving a hole shaped like a control that does not
            exist. */}
        <section style={{ marginTop: 52 }}>
          <CodePanel snippets={SNIPPETS} />
        </section>

        <section style={{ paddingTop: 80 }}>
          <div style={{ ...SECTION_HEAD, paddingBottom: 14 }}>
            <h2 style={H2}>Props</h2>
            <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
              &lt;Disclosure /&gt;
            </span>
          </div>
          <PropsTable rows={PROPS} />
        </section>

        <section style={{ paddingTop: 80 }}>
          <div style={{ ...SECTION_HEAD, paddingBottom: 24 }}>
            <h2 style={H2}>Related</h2>
            <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
              everything else in the registry
            </span>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ marginTop: 24, gap: 20 }}
          >
            <RelatedCards current={NAME} />
          </div>
        </section>
      </main>
    </div>
  )
}
