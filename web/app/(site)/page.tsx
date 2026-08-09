import Link from 'next/link'
import { components } from '@/__generated__/meta.js'
import { CopyButton, CopyIcon } from '@/components/copy-button'
import { ShaderBackground } from '@/components/hero/shader-bg'
import { SpringCoil } from '@/components/hero/spring-coil'
import { Reveal } from '@/components/reveal'
import { SectionHead } from '@/components/section-head'
import { componentHref, manifestUrl } from '@/lib/registry'

/**
 * A real component name when there is one, the placeholder only while the
 * registry is empty. A command a reader can copy and run beats a command they
 * have to edit first, and `<component>` was being printed next to a live
 * catalogue.
 */
const EXAMPLE = components[0]?.name ?? '<component>'
const INIT = `npx @abenor/z-ui add ${EXAMPLE}`

/**
 * The registry was emptied on 2026-08-09 to be rebuilt from new designs, so
 * every number here reads from the manifest rather than being typed in. While
 * the catalogue is empty this page says so instead of showing a grid of
 * nothing — `components.length` going to zero is the whole point of counting it
 * rather than asserting it.
 */
const STATS = [
  { value: String(components.length), label: 'components' },
  { value: '173ms', label: 'to 90% of target' },
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
                <span className="size-1.5 rounded-full bg-control" />
                <span className="lbl">Micro-interaction registry</span>
                <span className="lbl">pre-alpha</span>
              </div>
            </Reveal>

            <Reveal>
              <h1 className="t-xl text-ink">
                Physics-driven
                <br />
                UI architecture.
              </h1>
            </Reveal>

            <Reveal>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                Kinetic components for React, built on springs rather than curves. The CLI
                writes the source into your project — from then on it is your file, with
                nothing to upgrade.
              </p>
            </Reveal>

            <Reveal>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CopyButton
                  value={INIT}
                  copiedLabel="Copied to clipboard"
                  className="group flex items-center justify-between gap-4 rounded-lg bg-ink px-5 py-3.5 font-mono text-xs text-chassis transition-transform duration-200 hover:scale-[0.98] active:scale-[0.96] sm:px-6 sm:text-sm"
                >
                  {/* The command is one token to a reader; breaking it across
                      two lines makes it look like two commands. */}
                  <span className="whitespace-nowrap">{INIT}</span>
                  <CopyIcon size={17} />
                </CopyButton>
                <Link
                  href="/components"
                  className="flex items-center justify-center rounded-lg border border-white/10 px-6 py-3.5 font-mono text-xs font-semibold tracking-[0.05em] transition-colors hover:border-accent hover:bg-accent/5"
                >
                  Explore components
                </Link>
              </div>
            </Reveal>

            <Reveal>
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

          {/* Back to the coil while the registry is empty. The scrub hero that
              stood here demonstrated the shipped component, which is the right
              instinct and no longer possible — it imported `@/components/z-ui/scrub`.
              This one owes nothing to the registry, so the hero keeps working
              through the rebuild and gets replaced the moment there is a real
              component worth putting here. */}
          <Reveal className="order-first lg:order-none">
            <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-white/10 bg-panel-2 sm:h-[360px] lg:h-[440px]">
              <SpringCoil className="absolute inset-0 size-full" />
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

        {/* A manifest, not a feature grid — three uniform cards in a row is
            the templated shape this section used to be. A spec sheet reads
            these as an ordered list with a strong leading numeral, not as
            interchangeable tiles, and it costs nothing to build: no card
            frame, no forced equal height, no rounded container. */}
        <div className="border-t border-hair">
          {PRINCIPLES.map((p) => (
            <Reveal key={p.k} className="grid gap-3 border-b border-hair py-9 sm:grid-cols-[4.5rem_1fr] sm:gap-8 sm:py-10">
              <span className="font-mono text-3xl tabular-nums text-muted/50 sm:text-4xl">{p.k}</span>
              <div className="flex flex-col gap-2.5">
                <h3 className="text-base font-semibold tracking-tight sm:text-lg">{p.title}</h3>
                <p className="max-w-xl text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── catalog ── */}
      <section id="components" className="mx-auto max-w-[80rem] scroll-mt-20 px-4 pb-24 md:px-16">
        <SectionHead
          index="02"
          eyebrow="Catalog"
          title={components.length === 0 ? 'Being rebuilt.' : 'Being rebuilt, in public.'}
        >
          The previous set was removed rather than patched. What lands here is designed first
          and built against the same gates that were already in place — the manifest schema,
          the state-machine lint, and the contrast floor all survived the clear-out.
        </SectionHead>

        {/* An empty grid is worse than an honest sentence, and a sentence
            claiming emptiness over a registry that has items is worse than
            both. Which one shows is `components.length`, the same value the
            stat above counts, so the two cannot contradict each other. */}
        <Reveal>
          {components.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-6 py-14 text-center">
              <p className="text-base text-ink">Nothing is published yet.</p>
              <p className="lbl mx-auto mt-2 max-w-md">
                the registry is empty on purpose · new designs in progress
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Names only. The full card — gesture, spring, states — is what
                  /components is for, and duplicating it here would be a second
                  place to keep true. */}
              {components.map((c) => (
                <Link
                  key={c.name}
                  href={componentHref(c.name)}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border border-control bg-panel px-5 py-4 transition-colors hover:border-muted"
                >
                  <span className="text-base font-semibold tracking-tight text-ink">
                    {c.title}
                  </span>
                  <span className="font-mono text-xs text-muted">{c.name}</span>
                  <span className="lbl ml-auto">{c.category}</span>
                </Link>
              ))}
              <Link
                href="/components"
                className="lbl self-start py-2 transition-colors hover:!text-accent"
              >
                the whole catalog →
              </Link>
            </div>
          )}
        </Reveal>
      </section>

      {/* ── install ── */}
      <section id="install" className="mx-auto max-w-[80rem] scroll-mt-20 px-4 pb-28 md:px-16">
        <SectionHead index="03" eyebrow="Install" title="Two paths, one file.">
          Either way the source lands in your repository and the CLI is done with it. There is no
          package to upgrade and no wrapper API to learn.
        </SectionHead>

        {/* Neither command resolves yet, and both cards say which thing is
            missing rather than sharing one vague "unpublished". They are
            blocked on different steps: the manifests exist and are correct,
            they are just not on `main` yet, so the shadcn path needs only the
            merge. The first-party CLI needs that and an npm publish. Claiming
            "ready" here — as this section did, over a URL that 404s — is the
            one failure the rest of the page is built to avoid. */}
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <InstallPath
              label="shadcn"
              status="needs the merge"
              cmd={`npx shadcn@latest add ${manifestUrl(EXAMPLE)}`}
              note="The manifests are a strict superset of its registry-item schema, so this works the moment the registry is on main."
            />
          </Reveal>
          <Reveal>
            <InstallPath
              label="z-ui"
              status="needs the merge, then npm"
              cmd={INIT}
              note="First-party CLI. Adds install-time spring selection and digest verification that a general registry client cannot."
            />
          </Reveal>
        </div>
      </section>
    </main>
  )
}

/**
 * `status` is a sentence, not a boolean.
 *
 * It was `ready: boolean`, which forced both cards to pick from one word each
 * and made "ready" available to a command that 404s. Naming the missing step
 * costs the same row and cannot be true of a path that does not resolve.
 */
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
          className="lbl ml-auto rounded-lg border border-control px-2.5 py-1 transition-colors hover:!text-ink"
        >
          copy
        </CopyButton>
      </div>
      {/* `break-all` rather than a scrollbar. The shadcn command is a 90-char
          URL; letting it scroll hid two thirds of it behind a track the reader
          has to notice and drag, on the one element they are meant to copy. It
          wraps instead, and the card grows to fit. */}
      <pre className="flex-1 whitespace-pre-wrap break-all px-5 py-4 font-mono text-sm text-ink">
        {cmd}
      </pre>
      <p className="border-t border-hair px-5 py-3 text-sm text-muted">{note}</p>
    </div>
  )
}
