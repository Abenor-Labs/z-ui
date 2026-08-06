import Link from 'next/link'
import { components, items } from '@/__generated__/meta.js'
import { CatalogCard } from '@/components/catalog-card'
import { CopyButton, CopyIcon } from '@/components/copy-button'
import { ShaderBackground } from '@/components/hero/shader-bg'
import { SpringCoil } from '@/components/hero/spring-coil'
import { Reveal } from '@/components/reveal'
import { SectionHead } from '@/components/section-head'

const INIT = 'npx @abenor/z-ui add like-button'

/**
 * The four the landing page leads with: one from each category, then the widest
 * behaviour gap between them. Anything not in the registry falls out of the
 * list automatically rather than 404ing from the home page.
 */
const FEATURED_NAMES = ['like-button', 'scrub', 'undo-toast', 'reorder']
const FEATURED = FEATURED_NAMES.map((n) => components.find((c) => c.name === n)).filter(
  (c): c is (typeof components)[number] => Boolean(c),
)

/** Counted from the manifest rather than typed in, so the hero cannot drift. */
const FILE_COUNT = new Set(
  items.flatMap((i) => i.installs.flatMap((x) => x.files.map((f) => f.key))),
).size

const STATS = [
  { value: String(components.length), label: 'components' },
  { value: String(FILE_COUNT), label: 'files in the registry' },
  { value: '0', label: 'runtime dependencies' },
]

const STACK = [
  { label: 'React 19', d: 'm8 17-6-5 6-5M16 7l6 5-6 5' },
  { label: 'Motion', d: 'M2 14c4-9 8 5 12-4' },
  {
    label: 'Tailwind CSS',
    d: 'M12 3c-4 0-5.5 2-6 5 1.5-2 3.2-1.5 4.5-.5S13 10 16 10c4 0 5.5-2 6-5-1.5 2-3.2 1.5-4.5.5S15 3 12 3ZM6 12c-4 0-5.5 2-6 5 1.5-2 3.2-1.5 4.5-.5S7 19 10 19c4 0 5.5-2 6-5-1.5 2-3.2 1.5-4.5.5S9 12 6 12Z',
  },
  { label: 'TypeScript', d: 'm4 17 6-5-6-5M12 19h8' },
]

const PRINCIPLES = [
  {
    k: '01',
    title: 'Springs, not easings',
    body: 'A duration and a curve cannot be interrupted halfway and cannot carry velocity out of a gesture. Every motion here is integrated from stiffness and damping, so releasing a drag continues it instead of restarting it.',
  },
  {
    k: '02',
    title: 'Source, not a package',
    body: 'The CLI writes the component into your repository. There is no version to bump, no wrapper API, and no upgrade that can change how your product feels without you asking for it.',
  },
  {
    k: '03',
    title: 'One derived state',
    body: 'Interaction state is computed once and published as a data-state attribute. Your CSS matches the same string the component animates from, so styling and motion cannot disagree.',
  },
]

export default function Home() {
  return (
    <main className="relative w-full overflow-hidden">
      {/* ── hero ── */}
      <section className="relative flex min-h-[clamp(620px,calc(100svh-4rem),880px)] items-center justify-center border-b border-white/5 py-20">
        {/* Full opacity on purpose: the shader's own floor is the page ground,
            so dimming the canvas would only cost the lights their range. */}
        <ShaderBackground className="pointer-events-none absolute inset-0 z-0 size-full" />
        <div className="grid-paper pointer-events-none absolute inset-0 z-[1]" />

        <div className="relative z-10 mx-auto grid w-full max-w-[80rem] grid-cols-1 items-center gap-12 px-4 md:px-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="flex flex-col">
            <Reveal>
              <div className="mb-7 flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(99,102,241,0.7)]" />
                <span className="lbl">Micro-interaction registry</span>
                <span className="lbl !text-accent">pre-alpha</span>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="t-xl text-ink">
                Physics-driven
                <br />
                UI architecture.
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                Kinetic components for React, built on springs rather than curves. The CLI
                writes the source into your project — from then on it is your file, with
                nothing to upgrade.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CopyButton
                  value={INIT}
                  copiedLabel="Copied to clipboard"
                  className="group flex items-center justify-between gap-4 rounded-lg bg-white px-5 py-3.5 font-mono text-xs text-black transition-transform duration-200 hover:scale-[0.98] active:scale-[0.96] sm:px-6 sm:text-sm"
                >
                  {/* The command is one token to a reader; breaking it across
                      two lines makes it look like two commands. */}
                  <span className="whitespace-nowrap">{INIT}</span>
                  <CopyIcon size={17} />
                </CopyButton>
                <Link
                  href="#components"
                  className="flex items-center justify-center rounded-lg border border-white/10 px-6 py-3.5 font-mono text-xs font-semibold tracking-[0.05em] transition-[border-color,box-shadow,background-color] hover:border-accent hover:bg-accent/5 hover:shadow-[0_0_20px_-2px_rgba(99,102,241,0.35)]"
                >
                  Explore primitives
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-hair pt-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="font-mono text-2xl tabular-nums text-ink">{s.value}</dt>
                    <dd className="lbl mt-0.5">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Shown on every width. The coil is the best argument on the page,
              and a mobile hero without it is three paragraphs and a button. */}
          <Reveal delay={0.1} y={26} className="order-first lg:order-none">
            <div className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8)] sm:h-[360px] lg:h-[520px]">
              <span className="absolute left-4 top-4 z-20 rounded-lg border border-white/20 bg-white/10 px-2 py-1 font-mono text-[0.6875rem] font-medium text-white backdrop-blur">
                LIVE PHYSICS
              </span>
              <SpringCoil className="absolute inset-0 size-full" />
              <span className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11" />
                  <path d="M12 11V4.5a1.5 1.5 0 0 1 3 0V11" />
                  <path d="M15 11V6.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.2-3l-2.2-3.8a1.5 1.5 0 0 1 2.6-1.5L9 15" />
                </svg>
                Press and hold
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── stack ── */}
      <section className="border-b border-white/5 bg-surface py-10">
        <div className="mx-auto flex max-w-[80rem] flex-col items-center gap-6 px-4 md:flex-row md:gap-12 md:px-16">
          <p className="lbl shrink-0 uppercase">Built on</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 md:justify-start">
            {STACK.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 font-mono text-sm text-muted transition-colors hover:text-ink"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={s.d} />
                </svg>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── principles ── */}
      <section className="mx-auto max-w-[80rem] px-4 py-24 md:px-16">
        <SectionHead index="01" eyebrow="Position" title="Three decisions, taken once.">
          Everything in the registry follows from them, which is why the components feel like
          one library rather than a folder of snippets.
        </SectionHead>

        <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-rule md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.k} delay={i * 0.07} className="bg-panel">
              <div className="flex h-full flex-col gap-3 p-7">
                <span className="lbl !text-accent">{p.k}</span>
                <h3 className="text-base font-semibold tracking-tight">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── catalog teaser ── */}
      <section id="components" className="mx-auto max-w-[80rem] scroll-mt-20 px-4 pb-24 md:px-16">
        <SectionHead index="02" eyebrow="Catalog" title="High-impact primitives.">
          Every preview below is the shipped component itself, imported from the registry rather
          than recorded. Press one.
        </SectionHead>

        {/* Four, not all of them. The full set belongs on a page with filters;
            a landing page's job is to prove the previews are real and get out. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURED.map((c, i) => (
            <Reveal key={c.name} delay={(i % 2) * 0.07}>
              <CatalogCard item={c} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8">
          <Link
            href="/components"
            className="group inline-flex items-center gap-3 rounded-lg border border-white/10 px-5 py-3 font-mono text-xs font-semibold tracking-[0.05em] transition-[border-color,background-color] hover:border-accent hover:bg-accent/5"
          >
            Browse all {components.length} components
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </Reveal>
      </section>

      {/* ── install ── */}
      <section id="install" className="mx-auto max-w-[80rem] scroll-mt-20 px-4 pb-28 md:px-16">
        <SectionHead index="03" eyebrow="Install" title="Two paths, both real.">
          The CLI copies source into your repository. There is no package to upgrade and no
          wrapper API to learn, so the file is yours to edit the moment it lands.
        </SectionHead>

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <InstallPath
              label="shadcn"
              ready
              cmd="npx shadcn@latest add https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry/r/like-button.json"
              note="Works today. The manifests are a strict superset of its registry-item schema."
            />
          </Reveal>
          <Reveal delay={0.07}>
            <InstallPath
              label="z-ui"
              ready={false}
              cmd={INIT}
              note="First-party CLI. Not published yet, and says so rather than pretending."
            />
          </Reveal>
        </div>
      </section>
    </main>
  )
}

function InstallPath({
  label,
  note,
  cmd,
  ready,
}: {
  label: string
  note: string
  cmd: string
  ready: boolean
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-panel transition-colors hover:border-white/20">
      <div className="flex items-center gap-3 border-b border-hair px-5 py-3">
        <span className="lbl !text-accent">{label}</span>
        <span
          className={
            'rounded-lg px-2 py-0.5 font-mono text-[0.6875rem] ' +
            (ready ? 'bg-accent/15 text-accent' : 'bg-white/5 text-muted')
          }
        >
          {ready ? 'ready' : 'unpublished'}
        </span>
        <CopyButton
          value={cmd}
          copiedLabel="copied"
          className="lbl ml-auto rounded-lg border border-white/10 px-2.5 py-1 transition-colors hover:!text-ink"
        >
          copy
        </CopyButton>
      </div>
      <pre className="flex-1 overflow-x-auto px-5 py-4 font-mono text-sm text-ink">{cmd}</pre>
      <p className="border-t border-hair px-5 py-3 text-sm text-muted">{note}</p>
    </div>
  )
}
