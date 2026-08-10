'use client'

import * as React from 'react'
import Link from 'next/link'
import { byName } from '@/__generated__/meta.js'
import { CodePanel } from './code-panel'
import { CopyButton } from './copy-button'
import { CustomizePanel } from './customize-panel'
import { DemoCard } from './demo-card'
import { PropsTable, SCRAMBLE_PROPS } from './props-table'
import { RelatedCards } from './related'
import { DEFAULTS, snippetsFor, type ScrambleSettings } from './snippets'

const INSTALL = 'npx @abenor/z-ui add scramble-reveal'

const HINTS = [
  'pnpm dlx @abenor/z-ui add scramble-reveal',
  'bunx @abenor/z-ui add scramble-reveal',
  'or paste the file below',
]

/**
 * The file the CLI copies, at the path it lives at on `main`.
 *
 * This 404'd for as long as `origin/main` was a single scaffold commit, and the
 * label carried a qualifier saying so — this button was otherwise the one place
 * on the page that sent a reader somewhere broken without warning. The
 * 2026-08-10 merge made the path real, so the qualifier is off.
 */
const SOURCE_URL =
  'https://github.com/Abenor-Labs/z-ui/blob/main/registry/components/scramble-reveal/scramble-reveal.tsx'
const SOURCE_LIVE = true

/**
 * The header's facts are read out of the component's own manifest rather than
 * typed in here. A hand-written "3 states" outlives the day the component grows
 * a fourth; a count cannot. `byName` is generated, so its entry is optional by
 * type and anything the manifest does not carry simply drops off the row rather
 * than falling back to a number nobody measured.
 */
const MANIFEST = byName['scramble-reveal']

const FACTS = [
  MANIFEST?.states ? `${MANIFEST.states.length} states` : null,
  // Worth printing because it is the whole claim: `add` writes one file and
  // touches nothing in package.json.
  MANIFEST && MANIFEST.dependencies.length === 0 ? 'no deps' : null,
].filter((f): f is string => f !== null)

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

/** Ancestor crumbs sit at `--fg3` and lift to full ink on hover. */
const CRUMB_LINK = 'transition-colors hover:text-[var(--fg)]'

/**
 * The component-detail page: demo, install, source, props, related.
 *
 * It carries no nav and no footer of its own. The route renders inside the
 * site's `(site)` group, which already supplies both, and a page that brought a
 * second set would be asserting a second product.
 *
 * Everything below the breadcrumb reads from one `settings` object. The demo
 * runs it, the customize panel edits it, and both snippets are printed from it
 * on every render — which is the literal mechanism behind the panel's "writes
 * to code" label. Nothing is duplicated into a second source of truth, so there
 * is no state in which the code on screen describes a run other than the one
 * happening 400px above it.
 *
 * The wrapper carries no `data-theme`: the design's light block is deleted and
 * globals.css pins `color-scheme: dark` on the document, so there is no switch
 * left for the attribute to throw.
 */
export function ComponentPage() {
  const [settings, setSettings] = React.useState<ScrambleSettings>(DEFAULTS)
  const [runToken, setRunToken] = React.useState(0)

  return (
    <div className="component-page">
      <main style={{ ...CONTAINER, paddingBottom: 88 }}>
        {/* ── breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="cp-mono" style={{ paddingTop: 36 }}>
          <ol style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--fg3)' }}>
            <li>
              <Link href="/" className={CRUMB_LINK}>
                Z-UI
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              {/* The catalogue route, same destination SiteNav sends this word
                  to. A crumb has to name the level above this page, and while
                  `/components` was gone this pointed at a home-page section —
                  which was the nearest true thing, not the parent. */}
              <Link href="/components" className={CRUMB_LINK}>
                components
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" style={{ color: 'var(--fg2)' }}>
              scramble reveal
            </li>
          </ol>
        </nav>

        {/* ── header ── */}
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
            <h1 style={{ fontSize: 44, lineHeight: 1.04, letterSpacing: '-0.028em', fontWeight: 600 }}>
              Scramble reveal
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
              {SOURCE_LIVE ? null : (
                <span style={{ color: 'var(--fg3)' }}>needs the merge</span>
              )}
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

        {/* ── live demo ── */}
        <div style={{ paddingTop: 36 }}>
          <DemoCard
            settings={settings}
            runToken={runToken}
            onTrigger={(trigger) => setSettings((s) => ({ ...s, trigger }))}
          />
        </div>

        {/* ── prose ── */}
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
            It doesn&rsquo;t fade in. It resolves — like the word was already there and the page
            just finished tuning it in.
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
            Per-glyph decode with a trailing randomness window. Runs on one interval, respects{' '}
            <code className="cp-mono" style={{ color: 'var(--fg)' }}>
              prefers-reduced-motion
            </code>
            , and never reflows — the target string reserves its own width before the first frame.
          </p>
        </div>

        {/* ── install ── */}
        <section
          id="install"
          style={{
            paddingTop: 52,
            // Clears the site's fixed bar so the heading is not hidden behind it
            // when "Get component" jumps here. `--cp-chrome` is what that bar
            // costs; the page's own nav that used to be added on top of it is
            // gone.
            scrollMarginTop: 'calc(var(--cp-chrome) + 16px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 className="cp-mono" style={SECTION_LABEL}>
              Install
            </h2>
            {/* `@abenor/z-ui@0.1.1` published on 2026-08-10 and the command
                above was verified end to end against it, so the badge names the
                version rather than warning about it. It read "0.1.1 pending"
                for one day past the publish — the same way the install copy
                outlived its own warning in `5f33a80` and again in `e315c4d`.
                This badge is a claim about npm; when it changes, check npm. */}
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
              0.1.1 on npm
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
            {/* Neutral, not mint. A shell sigil is the most static mark on the
                page — it means "this is a command", it never moves — and the
                Moving Part Rule spends the accent on the other half of that. */}
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

        {/* ── code + customize ── */}
        <section
          className="grid grid-cols-1 lg:grid-cols-[1.42fr_1fr]"
          style={{ marginTop: 52, gap: 20, alignItems: 'start' }}
        >
          <CodePanel snippets={snippetsFor(settings)} />
          <CustomizePanel
            settings={settings}
            onChange={setSettings}
            onPreview={() => setRunToken((t) => t + 1)}
          />
        </section>

        {/* ── props ── */}
        <section style={{ paddingTop: 80 }}>
          <div style={{ ...SECTION_HEAD, paddingBottom: 14 }}>
            <h2 style={H2}>Props</h2>
            <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
              useScramble(options)
            </span>
          </div>
          <PropsTable rows={SCRAMBLE_PROPS} />
        </section>

        {/* ── related ── */}
        <section style={{ paddingTop: 80 }}>
          <div style={{ ...SECTION_HEAD, paddingBottom: 24 }}>
            <h2 style={H2}>Related</h2>
            {/* The design labelled these "also tagged text", which asserted a
                catalogue of siblings. Scramble reveal is the only item in the
                registry; these three are shown running but not shipped. */}
            <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
              not in the registry yet
            </span>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ marginTop: 24, gap: 20 }}
          >
            <RelatedCards current="scramble-reveal" />
          </div>
        </section>
      </main>
    </div>
  )
}
