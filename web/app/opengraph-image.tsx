import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { byName, components } from '@/__generated__/meta.js'
import { riseTime90, sampleResponse } from '@/lib/spring-math'

export const alt =
  'Z-UI — micro-interactions you own, shown as the plotted step response of a real component spring'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The card plots a spring this repository actually ships.
 *
 * A social card is the one surface where a motion library cannot demonstrate
 * anything — it is a still image, and a still image of a component mid-gesture
 * is a screenshot of a frame nobody chose. So it draws the curve instead: the
 * featured component's stiffness and damping, recovered from its source by
 * `motion-scan.mjs` at build time, integrated by the same `response` function
 * the home page's rise-time stat is derived from. If someone retunes that
 * spring, this picture changes with it.
 *
 * Mono throughout, which is the site's own voice for anything a developer is
 * meant to read as a value rather than as prose. The signal appears only on
 * the curve — DESIGN.md reserves it for the moving part, and on this card the
 * curve is the only thing that moves.
 */

/**
 * The face is vendored into `web/assets/` rather than resolved out of
 * `node_modules`.
 *
 * `next/font/google` gives the site JetBrains Mono as woff2, which satori
 * cannot parse — it reads ttf, otf and woff only — and the files it writes
 * into `.next` are content-hashed, so there is no stable path to point at.
 * Reaching into a package instead would make this route depend on a
 * dependency's internal file layout, which is not a thing a package promises
 * across versions.
 *
 * Copied verbatim from `@fontsource/jetbrains-mono@5.3.0`, latin subset,
 * weights 400 and 700. Together 55KB, well inside the 500KB satori budget.
 *
 * `process.cwd()` rather than a path relative to this file: the route is
 * compiled into `.next` before it runs, so its own location moves and the
 * project root does not.
 */
const fontPath = (weight: 400 | 700) =>
  join(process.cwd(), `assets/jetbrains-mono-latin-${weight}-normal.woff`)

// The Lab Sheet palette, mirrored from globals.css: the card is the site's
// first frame seen from outside, so it renders on the same paper.
const CHASSIS = '#f5f1e6'
const PANEL = '#e9e3d0'
const INK = '#211d12'
const MUTED = '#5d5748'
const RULE = '#d6ceb6'
const CONTROL = '#7e7661'
const ACCENT = '#a03d00'

/** Sample count. Enough columns that the top edges read as a curve rather than
 *  as a staircase at the width the card is actually viewed at. */
const BARS = 132

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    readFile(fontPath(400)),
    readFile(fontPath(700)),
  ])

  // The dial by name: its detent spring sits under critical damping, so the
  // plotted response genuinely crosses the target line — the one spring in
  // the registry whose curve shows character rather than an asymptote.
  const featured = byName['dial'] ?? components[0]
  const spring = featured?.motion?.springs[0]
  const curve = spring
    ? sampleResponse(spring.stiffness, spring.damping, spring.mass, BARS)
    : null
  const t90 = spring ? riseTime90(spring.stiffness, spring.damping, spring.mass) : null

  /*
   * Headroom, and the target line, exist only for a spring that overshoots.
   *
   * A damped spring asymptotes onto its target, so drawing the line puts a
   * dashed rule underneath the flat part of the trace, where it is invisible
   * and reads as a smudge. The top of the plot is the target in that case, and
   * saying so twice says it worse. An overshooting spring genuinely crosses the
   * line and needs room above it to be seen doing so.
   */
  const peak = curve ? Math.max(...curve.map((s) => s.value)) : 1
  const overshoots = peak > 1.001
  const ceiling = overshoots ? peak * 1.12 : 1
  const targetPct = (1 / ceiling) * 100

  const command = `npx @abenor/z-ui add ${featured?.name ?? '<component>'}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: CHASSIS,
          padding: '64px 72px',
          fontFamily: 'JetBrains Mono',
        }}
      >
        {/* ── wordmark row ── */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: INK, letterSpacing: '-0.05em' }}>
            Z-UI
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 17,
              color: MUTED,
              letterSpacing: '0.14em',
            }}
          >
            MICRO-INTERACTION REGISTRY
          </div>
        </div>

        {/* ── claim ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.045em',
              lineHeight: 1.05,
            }}
          >
            Micro-animations
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.045em',
              lineHeight: 1.05,
            }}
          >
            you own.
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 23, color: MUTED }}>
            Springs, not easings. The CLI writes the source into your project.
          </div>
        </div>

        {/* ── the curve: a real component's step response ── */}
        {curve && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                height: 116,
                width: '100%',
                borderBottom: `1px solid ${RULE}`,
              }}
            >
              {/* The target the spring is travelling to. Neutral ramp and
                  dashed, because the line is the one thing here that does not
                  move — the trace rises to meet it, it does not rise. */}
              {overshoots && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: `${targetPct}%`,
                    height: 0,
                    borderTop: `1px dashed ${CONTROL}`,
                    display: 'flex',
                  }}
                />
              )}
              {/* Each column is drawn as its top edge, not as a filled bar.
                  Bars put roughly half the card's area in the signal, which
                  DESIGN.md spends on the moving part precisely because it is
                  rare; a 3px edge over a barely-there wash says the same shape
                  at a fraction of the ink, and reads as an instrument trace
                  rather than a chart of nothing. */}
              {curve.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: `${Math.max(2, (s.value / ceiling) * 100)}%`,
                    borderTop: `3px solid ${ACCENT}`,
                    backgroundColor: 'rgba(160,61,0,0.08)',
                    // The tail is where the spring has arrived and stopped
                    // being interesting, so it recedes rather than holding the
                    // same volume as the rise.
                    opacity: 0.5 + 0.5 * (1 - i / (curve.length - 1)),
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 13,
                fontSize: 16,
                color: MUTED,
              }}
            >
              <div style={{ display: 'flex' }}>
                {featured?.name} · stiffness {spring?.stiffness} · damping {spring?.damping}
              </div>
              <div style={{ display: 'flex', marginLeft: 'auto' }}>{t90}ms to 90% of target</div>
            </div>
          </div>
        )}

        {/* ── the command ── */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: PANEL,
              border: `1px solid ${RULE}`,
              borderRadius: 8,
              padding: '16px 24px',
              fontSize: 24,
              color: INK,
            }}
          >
            {command}
          </div>
          <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 17, color: MUTED }}>
            MIT · Abenor Labs
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'JetBrains Mono', data: regular, weight: 400, style: 'normal' },
        { name: 'JetBrains Mono', data: bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
