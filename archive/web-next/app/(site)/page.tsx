import Link from 'next/link'
import { byName, components } from '@/__generated__/meta.js'
import { CopyButton, CopyIcon } from '@/components/copy-button'
import { DialSpecimen } from '@/components/hero/dial-specimen'
import { manifestUrl } from '@/lib/registry'
import { riseTime90 } from '@/lib/spring-math'

/**
 * The home page, and this time the masthead has a specimen.
 *
 * Four earlier versions carried a demo panel and every one was set dressing
 * for a component that could not hold the slot; the fifth stripped the panel
 * out and let the claim stand alone, with a comment promising the slot back
 * "when there is a component worth the space". The dial is that component —
 * grabbable within a second of paint, and its one behaviour (it keeps moving
 * after your hand leaves) is the product thesis performed rather than stated.
 * So the slot returns, as a mounted specimen with a live readout, not as a
 * screenshot of one.
 */

const FEATURED = byName['dial'] ?? components[0]
const EXAMPLE = FEATURED?.name ?? '<component>'
const INIT = `npx @abenor/z-ui add ${EXAMPLE}`

/**
 * Every number here reads from the manifest rather than being typed in.
 *
 * `motion-scan.mjs` recovers stiffness and damping out of the component source
 * at build time; `riseTime90` turns them into the figure, and the label names
 * which component it belongs to instead of implying the whole library moves at
 * one speed.
 */
const FEATURED_SPRING = FEATURED?.motion?.springs[0]
const T90 = FEATURED_SPRING
  ? riseTime90(FEATURED_SPRING.stiffness, FEATURED_SPRING.damping, FEATURED_SPRING.mass)
  : null

const SPECS = [
  { value: String(components.length), label: 'components' },
  ...(T90 === null ? [] : [{ value: `${T90}ms`, label: `${EXAMPLE} to 90%` }]),
  { value: '0', label: 'runtime deps' },
  { value: 'MIT', label: 'licence' },
]

/** Specification, not principles cards. Four rows under the install, where a
 *  reader who has decided to look closer will find them. */
const FACTS = [
  ['engine', 'motion — real springs, integrated from stiffness and damping, interruptible mid-flight'],
  ['delivery', 'the CLI writes .tsx into your repository; nothing is imported at runtime'],
  ['state', 'one derived value, published as data-state for your own CSS to match'],
  ['scope', 'micro-interactions only — refusing everything else is the product'],
] as const

export default function Home() {
  return (
    <main className="w-full">
      {/* ── masthead ── */}
      <section className="relative border-b border-rule">
        <div className="mx-auto max-w-[80rem] px-4 py-16 md:px-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-accent" />
                <span className="lbl">micro-interaction registry</span>
                <span className="lbl">v0.1</span>
              </div>

              {/* The italic is the system's one flourish, spent on the one
                  word the library is actually about. */}
              <h1 className="t-xl mt-7 max-w-[16ch] text-ink">
                Motion you can <em className="text-accent">interrupt</em>.
              </h1>

              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted">
                Spring-driven micro-interactions for React, installed as source you own. Everything
                here keeps its velocity when you change your mind — flick the dial and grab it back
                mid-spin. No timelines, no wrapper package, no version that can change how your
                product feels.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CopyButton
                  value={INIT}
                  copiedLabel="Copied to clipboard"
                  className="flex min-h-11 items-center justify-between gap-5 rounded-lg bg-ink px-5 font-mono text-sm text-chassis transition-colors hover:bg-ink/85"
                >
                  <span className="whitespace-nowrap">{INIT}</span>
                  <CopyIcon size={16} />
                </CopyButton>
                <Link
                  href="/components"
                  className="flex min-h-11 items-center justify-center rounded-lg border border-control px-5 font-mono text-xs font-semibold tracking-[0.05em] text-muted transition-colors hover:border-muted hover:text-ink"
                >
                  Open the catalogue
                </Link>
              </div>
            </div>

            {/* The specimen. Live, labelled, and reporting its own state —
                the first interactive surface on the page, above the fold. */}
            <div className="flex justify-center lg:justify-end">
              <DialSpecimen />
            </div>
          </div>

          {/* The specification plate, spread across the full container. */}
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-rule pt-8 sm:grid-cols-4">
            {SPECS.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-2xl tabular-nums text-ink">{s.value}</dt>
                <dd className="lbl mt-1">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── the registry, pointed at rather than unpacked ──

          The landing page curates; the inventory is what `/components` is for.
          What this page adds is the column the catalogue's tiles have no room
          for: what actually drives each component. It is deliberately
          unflattering — springs print their constants, tweens print their
          durations — because a table that only shows its good column is a
          marketing table. The good column simply has more rows in it than it
          used to. */}
      <section id="components" className="mx-auto max-w-[80rem] scroll-mt-20 px-4 pt-16 md:px-16">
        <span className="lbl">the registry</span>
        <h2 className="t-lg mt-3 max-w-[26ch] text-ink">
          {components.length === 0 ? 'Being rebuilt.' : 'Small enough to try in one sitting.'}
        </h2>

        {components.length === 0 ? (
          <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-muted">
            The registry is empty on purpose while new designs are built.
          </p>
        ) : (
          <>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-muted">
              {components.length} components across three categories — state-morphing, tactile
              feedback, and input. Each is one self-contained file with no shared library to
              install first. Scope refusal is the product: whatever is not a micro-interaction
              does not land here, however useful it would be.
            </p>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule">
                    {['component', 'gesture', 'driven by', 'category'].map((h) => (
                      <th key={h} className="lbl-xs pb-3 font-semibold text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {components.map((c) => (
                    <tr key={c.name} className="border-b border-hair">
                      <td className="py-3.5">
                        <code className="font-mono text-sm text-ink">{c.name}</code>
                      </td>
                      <td className="py-3.5 font-mono text-xs text-muted">{c.gesture}</td>
                      <td className="py-3.5 font-mono text-xs tabular-nums">
                        <span className={c.motion.springs[0] ? 'text-ink' : 'text-muted'}>
                          {driver(c)}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-xs text-muted">{c.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link
              href="/components"
              className="lbl mt-8 inline-flex min-h-11 items-center transition-colors hover:!text-accent"
            >
              open the catalogue — every demo, contract, spring and state →
            </Link>
          </>
        )}
      </section>

      {/* ── the handoff ── */}
      <section id="install" className="mx-auto max-w-[80rem] scroll-mt-20 px-4 pt-20 pb-24 md:px-16">
        <span className="lbl">the handoff</span>
        <h2 className="t-lg mt-3 max-w-[24ch] text-ink">Take the file.</h2>
        <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-muted">
          Either path lands the source in your repository and is then finished with it. No package
          to upgrade, no wrapper API to reverse-engineer, and no version that can change how your
          product feels without you asking for it.
        </p>

        <div className="mt-9 grid gap-6 md:grid-cols-2">
          <InstallPath
            label="z-ui"
            status="live"
            cmd={INIT}
            note="First-party CLI. Adds install-time spring selection and per-file digest verification that a general registry client cannot."
          />
          <InstallPath
            label="shadcn"
            status="live"
            cmd={`npx shadcn@latest add ${manifestUrl(EXAMPLE)}`}
            note="The manifests are a strict superset of its registry-item schema, so a general client resolves them with nothing added."
          />
        </div>

        <dl className="mt-12 grid gap-x-12 gap-y-5 sm:grid-cols-2">
          {FACTS.map(([k, v]) => (
            <div key={k} className="flex gap-5 border-t border-hair pt-4">
              <dt className="lbl w-16 shrink-0">{k}</dt>
              <dd className="text-sm leading-relaxed text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}

/**
 * What actually moves a component, in one cell. Read from the scanned motion
 * data: a spring prints its constants, a tween prints its duration, and one
 * with neither prints an em dash rather than an empty cell.
 */
function driver(c: (typeof components)[number]): string {
  const s = c.motion.springs[0]
  if (s) return `spring ${s.stiffness}/${s.damping}`
  const d = c.motion.durations[0]
  if (d) return `${d.ms}ms tween`
  return '—'
}

function InstallPath({
  label,
  note,
  cmd,
  status,
}: {
  label: string
  note: string
  cmd: string
  status: string
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-control bg-panel transition-colors hover:border-muted">
      <div className="flex items-center gap-3 border-b border-hair px-5 py-3">
        <span className="lbl">{label}</span>
        <span className="rounded-lg bg-panel-2 px-2 py-0.5 txt-xs text-muted">{status}</span>
        <CopyButton
          value={cmd}
          copiedLabel="copied"
          className="lbl ml-auto min-h-11 rounded-lg border border-control px-2.5 transition-colors hover:!text-ink"
        >
          copy
        </CopyButton>
      </div>
      {/* `break-all` rather than a scrollbar: the shadcn command is a 90-char
          URL, and it is the one element the reader is meant to copy whole. */}
      <pre className="flex-1 whitespace-pre-wrap break-all px-5 py-4 font-mono text-sm text-ink">
        {cmd}
      </pre>
      <p className="border-t border-hair px-5 py-3 text-sm text-muted">{note}</p>
    </div>
  )
}
