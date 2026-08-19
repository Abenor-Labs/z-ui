'use client'

import * as React from 'react'
import { CodePanel } from './code-panel'
import { CustomizePanel } from './customize-panel'
import { DemoCard } from './demo-card'
import { SCRAMBLE_PROPS } from './props-table'
import { ComponentPageShell } from './shell'
import { DEFAULTS, snippetsFor, type ScrambleSettings } from './snippets'

/**
 * The scramble-reveal page: what is specific to scramble-reveal, and nothing
 * else.
 *
 * Breadcrumb, header, install block, props and related wrappers all live in
 * `ComponentPageShell` — they were identical to disclosure's copy of them, down
 * to six byte-for-byte layout constants declared in both files. What remains
 * here is the demo, the two paragraphs describing it, and the one structural
 * choice this page makes that its sibling does not.
 *
 * Everything below reads from one `settings` object. The demo runs it, the
 * customize panel edits it, and the snippets are printed from it on every
 * render — which is the literal mechanism behind the panel's "writes to code"
 * label. Nothing is duplicated into a second source of truth, so there is no
 * state in which the code on screen describes a run other than the one
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
    <ComponentPageShell
      name="scramble-reveal"
      // Sentence case, where the manifest title is "Scramble Reveal". The
      // heading is display copy and the manifest is an identifier; they are
      // allowed to differ, so this is passed rather than derived.
      heading="Scramble reveal"
      crumb="scramble reveal"
      propsLabel="useScramble(options)"
      propsRows={SCRAMBLE_PROPS}
      demo={
        <DemoCard
          settings={settings}
          runToken={runToken}
          onTrigger={(trigger) => setSettings((s) => ({ ...s, trigger }))}
        />
      }
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
        </>
      }
      code={
        /* Two columns, unlike disclosure's full-width panel: this component has
           settings worth turning, so the code and the controls that rewrite it
           sit side by side. */
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
      }
    />
  )
}
