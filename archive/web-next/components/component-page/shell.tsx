'use client'

import * as React from 'react'
import Link from 'next/link'
import { byName, components, cliVersion } from '@/__generated__/meta.js'
import { CopyButton } from './copy-button'
import { PropsTable, type Prop } from './props-table'
import { RelatedCards } from './related'

/**
 * Everything a component page has in common with the next one.
 *
 * The two pages were written independently and ended up 1,001 lines, of which
 * roughly half was the same page twice: identical breadcrumb, identical header,
 * identical install block, identical props and related wrappers, and six layout
 * constants declared byte-for-byte in both files. Component three would have
 * cost another five hundred lines before a single frame of motion, which is the
 * kind of tax that quietly decides you are done shipping components.
 *
 * What is *not* shared stays a slot. Disclosure runs its code panel full width
 * because it has no customize panel to sit beside — "stretching the code to
 * fill the gap beats leaving a hole shaped like a control that does not exist"
 * — and a shell that forced both pages into one shape would be flattening the
 * thing the showcase exists to demonstrate. `code`, `demo` and `lede` are
 * passed in whole.
 *
 * Everything derivable is derived, from the same generated manifest the CLI
 * installs from. The install command, the hint list, the source URL and the
 * dependency facts were all typed by hand on both pages, and typed facts about
 * the package are exactly what went stale three times (`5f33a80`, `e315c4d`,
 * and the version badge). A page cannot advertise a command for a component
 * that is not in the manifest, because it no longer writes the command.
 */

export const CONTAINER: React.CSSProperties = {
  width: '100%',
  maxWidth: 1240,
  margin: '0 auto',
  padding: '0 40px',
}

export const META: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--fg3)',
}

export const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--fg3)',
}

export const H2: React.CSSProperties = { fontSize: 28, letterSpacing: '-0.02em', fontWeight: 600 }

export const SECTION_HEAD: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  borderBottom: '1px solid var(--line)',
}

/** Ancestor crumbs sit at `--fg3` and lift to full ink on hover. */
export const CRUMB_LINK = 'transition-colors hover:text-[var(--fg)]'

/**
 * The file the CLI copies, at the path it lives at on `main`.
 *
 * Built from the manifest's own file key rather than from `<name>/<name>.tsx`,
 * so a component whose file is named differently still links somewhere real.
 */
function sourceUrl(name: string): string | null {
  const key = byName[name]?.installs.find((i) => i.name === name)?.files[0]?.key
  return key ? `https://github.com/Abenor-Labs/z-ui/blob/main/registry/components/${key}` : null
}

/**
 * The header's facts, read out of the manifest rather than typed.
 *
 * A hand-written "3 states" outlives the day the component grows a fourth; a
 * count cannot. Naming the dependency is more useful than hiding it — the whole
 * claim of `add` is that you can see what it costs before you run it.
 */
function factsFor(name: string): string[] {
  const m = byName[name]
  if (!m) return []
  return [
    m.states ? `${m.states.length} states` : null,
    m.dependencies.length > 0 ? m.dependencies.join(' · ') : 'no deps',
  ].filter((f): f is string => f !== null)
}

export type ComponentPageShellProps = {
  /** Registry name. Drives the manifest lookup, the install command and the source link. */
  name: string
  /** Rendered `h1`. Passed rather than read from `title`, because display casing
   *  and manifest casing are not the same string on every component. */
  heading: string
  /** Breadcrumb leaf. */
  crumb: string
  /** The two paragraphs under the demo. */
  lede: React.ReactNode
  demo: React.ReactNode
  /** The whole code section, wrapper included — the two pages lay it out differently. */
  code: React.ReactNode
  /** What the props table is documenting, e.g. `<Disclosure />` or `useScramble(options)`. */
  propsLabel: string
  propsRows: Prop[]
}

export function ComponentPageShell({
  name,
  heading,
  crumb,
  lede,
  demo,
  code,
  propsLabel,
  propsRows,
}: ComponentPageShellProps) {
  const manifest = byName[name]
  const facts = factsFor(name)
  const source = sourceUrl(name)

  const install = `npx @abenor/z-ui add ${name}`
  const hints = [
    `pnpm dlx @abenor/z-ui add ${name}`,
    `bunx @abenor/z-ui add ${name}`,
    'or paste the file below',
  ]

  // Counted here so the label above the grid cannot contradict the grid. The
  // scramble page said "not in the registry yet" over a card for disclosure,
  // which is in the registry — true when it was the only component, false the
  // day a second one landed, and nothing to notice it.
  const siblingCount = components.filter((c) => c.name !== name).length

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
              {/* The catalogue route, same destination SiteNav sends this word to. */}
              <Link href="/components" className={CRUMB_LINK}>
                components
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" style={{ color: 'var(--fg2)' }}>
              {crumb}
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
              {heading}
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
              {manifest?.category ? (
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
                  {manifest.category}
                </span>
              ) : null}
              {facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Rendered only when the manifest yields a path. A source button
                that goes nowhere is worse than no source button. */}
            {source ? (
              <a
                href={source}
                target="_blank"
                rel="noreferrer"
                className="cp-ghost cp-mono"
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
              </a>
            ) : null}
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
        <div style={{ paddingTop: 36 }}>{demo}</div>

        {/* ── prose ── */}
        <div style={{ paddingTop: 28 }}>{lede}</div>

        {/* ── install ── */}
        <section
          id="install"
          style={{
            paddingTop: 52,
            // Clears the site's fixed bar so the heading is not hidden behind it
            // when "Get component" jumps here.
            scrollMarginTop: 'calc(var(--cp-chrome) + 16px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 className="cp-mono" style={SECTION_LABEL}>
              Install
            </h2>
            {/* Generated from packages/cli/package.json, not typed. This badge
                said "0.1.1 pending" for a day after 0.1.1 published — the third
                time install copy outlived its condition. A version that is read
                cannot rot on its own; a publish claim always can, so the badge
                no longer makes one. */}
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
              cli {cliVersion}
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
              {install}
            </code>
            <CopyButton value={install} label="copy the install command" />
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
            {hints.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </section>

        {/* ── code, laid out by the page ── */}
        {code}

        {/* ── props ── */}
        <section style={{ paddingTop: 80 }}>
          <div style={{ ...SECTION_HEAD, paddingBottom: 14 }}>
            <h2 style={H2}>Props</h2>
            <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
              {propsLabel}
            </span>
          </div>
          <PropsTable rows={propsRows} />
        </section>

        {/* ── related ── */}
        <section style={{ paddingTop: 80 }}>
          <div style={{ ...SECTION_HEAD, paddingBottom: 24 }}>
            <h2 style={H2}>Related</h2>
            {/* Only claimed when there is something to claim it about. With no
                siblings the card below says so itself, and a label repeating it
                would be two sentences competing to describe one empty grid. */}
            {siblingCount > 0 ? (
              <span className="cp-mono" style={{ fontSize: 11, color: 'var(--fg3)' }}>
                everything else in the registry
              </span>
            ) : null}
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ marginTop: 24, gap: 20 }}
          >
            <RelatedCards current={name} />
          </div>
        </section>
      </main>
    </div>
  )
}
