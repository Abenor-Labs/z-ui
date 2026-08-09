import Link from 'next/link'
import type { Metadata } from 'next'
import { byName, components } from '@/__generated__/meta.js'
import { CopyButton } from '@/components/copy-button'
import { componentHref, manifestUrl } from '@/lib/registry'

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'How Z-UI is installed, what lands in your repository, and the two contracts every component keeps.',
}

/** The component the install commands demonstrate with. */
const EXAMPLE = components[0]?.name ?? '<component>'

/**
 * The file tree, read from the manifest rather than typed.
 *
 * `installs[].files[].target` is the exact path the CLI writes to, and the
 * npm dependency line is the union the resolver installs — so this block
 * cannot outlive the component it describes the way the hardcoded `scrub`
 * tree did.
 */
const LANDS = (() => {
  const item = byName[EXAMPLE]
  if (!item) return 'The registry is empty, so nothing lands yet.'

  const files = item.installs.flatMap((i) => i.files)
  const width = Math.max(...files.map((f) => f.target.length)) + 3
  const tree = files.map((f) => `${f.target.padEnd(width)}${f.sha}`).join('\n')

  const deps = item.dependencies
  return deps.length === 0
    ? `${tree}\n\nnpm packages added: none`
    : `${tree}\n\nnpm packages added: ${deps.join(', ')}`
})()

const SPRINGS = [
  { name: 'snap', zeta: '0.89', t90: '152ms', overshoot: '<1%', rest: '200ms', use: 'State morphs, where recoil would read as noise. The default.' },
  { name: 'bounce', zeta: '0.35', t90: '94ms', overshoot: '31%', rest: '571ms', use: 'Tactile feedback under 48px, where the recoil carries meaning.' },
  { name: 'settle', zeta: '0.74', t90: '173ms', overshoot: '3%', rest: '333ms', use: 'Reveals and continuous input. Scrub handles, drawers.' },
  { name: 'fling', zeta: '0.87', t90: '188ms', overshoot: '<1%', rest: '267ms', use: 'Gesture release carrying velocity out of a drag.' },
]

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-[64rem] px-4 pb-24 md:px-16">
      <header className="border-b border-hair py-12">
        <span className="lbl">documentation</span>
        <h1 className="t-lg mt-4">Everything is a file you own.</h1>
        <p className="mt-3 max-w-2xl text-base text-muted">
          There is no package to install and no wrapper API to learn. The CLI resolves a
          component from the registry and writes the source into your project. From that
          moment it is yours — edit the spring, rewrite the markup, delete half of it.
        </p>
      </header>

      <Section title="Install a component">
        <p className="mb-5 max-w-2xl text-sm text-muted">
          The shadcn path works now — the manifests landed on{' '}
          <code className="font-mono text-ink">main</code> on 2026-08-10 and are a strict
          superset of its registry-item schema. The first-party CLI is on npm, but{' '}
          <code className="font-mono text-ink">0.1.0</code> shipped a default registry URL
          pointing at the source tree rather than the generated manifests, so it needs{' '}
          <code className="font-mono text-ink">0.1.1</code> before its own command resolves.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Cmd
            label="shadcn"
            status="live"
            cmd={`npx shadcn@latest add ${manifestUrl(EXAMPLE)}`}
          />
          <Cmd
            label="z-ui"
            status="needs 0.1.1"
            cmd={`npx @abenor/z-ui add ${EXAMPLE}`}
          />
        </div>
      </Section>

      <Section title="What lands in your repository">
        <p className="mb-5 max-w-2xl text-sm text-muted">
          The component, plus the primitives it depends on, and nothing else. What gets added
          to <code className="font-mono text-ink">package.json</code> is whatever those files
          actually import — the list below is read from the manifest, so it cannot claim a
          file the CLI does not write.
        </p>
        {/* Was a hand-typed tree for `scrub`, a component the registry no
            longer holds, listing four files and asserting `motion` as the only
            dependency. Both were wrong: the manifest is the only thing that
            knows what `add` writes, so it is what prints. */}
        <pre className="overflow-x-auto rounded-xl border border-control bg-panel px-5 py-4 font-mono text-sm text-muted">
          {LANDS}
        </pre>
      </Section>

      <Section title="The spring scale">
        <p className="mb-5 max-w-2xl text-sm text-muted">
          Four presets, named by behaviour rather than by adjective, so choosing one is a
          decision. Damping ratio is what determines the feel:{' '}
          <code className="font-mono text-ink">ζ = c / (2√(k·m))</code>. Note that{' '}
          <code className="font-mono text-ink">bounce</code> reaches 90% of target fastest of
          the four — it passes through the target rather than easing up to it, and the long
          tail is settling you read as weight, not as latency.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-panel">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['preset', 'ζ', 't90', 'overshoot', 'rest', 'reach for it when'].map((h) => (
                  <th key={h} className="lbl border-b border-hair px-5 py-2.5 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {SPRINGS.map((s) => (
                <tr key={s.name}>
                  <td className="border-b border-hair px-5 py-2.5 text-ink">{s.name}</td>
                  <td className="border-b border-hair px-5 py-2.5 tabular-nums">{s.zeta}</td>
                  <td className="border-b border-hair px-5 py-2.5 tabular-nums">{s.t90}</td>
                  <td className="border-b border-hair px-5 py-2.5 tabular-nums">{s.overshoot}</td>
                  <td className="border-b border-hair px-5 py-2.5 tabular-nums">{s.rest}</td>
                  <td className="border-b border-hair px-5 py-2.5 font-sans text-muted">{s.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Two contracts every component keeps">
        <div className="grid gap-4 md:grid-cols-2">
          <Note title="One state drives everything">
            A single derived value feeds both <code className="font-mono text-ink">animate</code>{' '}
            and <code className="font-mono text-ink">data-state</code>, so the attribute your
            CSS matches can never disagree with what is on screen. Style any state with{' '}
            <code className="font-mono text-ink">[data-state=&quot;holding&quot;]</code> and it
            will be correct.
          </Note>
          <Note title="Reduced motion is a real path">
            Under <code className="font-mono text-ink">prefers-reduced-motion</code> the state
            still changes — instantly, and legibly. A zero-duration animation is not the same
            thing as a considered instant transition, and every component ships the latter.
          </Note>
        </div>
      </Section>

      <Section title="Components">
        {components.length === 0 ? (
          // The registry was cleared to be rebuilt. This renders from the same
          // manifest the list does, so it disappears on its own as soon as the
          // first new item is generated rather than needing to be remembered.
          <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
            <p className="text-sm text-ink">No components are published yet.</p>
            <p className="lbl mt-2">the contracts above still hold for everything that lands</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {components.map((c) => (
              <Link
                key={c.name}
                href={componentHref(c.name)}
                className="flex items-center gap-3 rounded-xl border border-control bg-panel px-5 py-4 transition-colors hover:border-muted"
              >
                <span className="font-mono text-sm text-ink">{c.name}</span>
                <span className="lbl ml-auto">{c.category}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </main>
  )
}

function Cmd({ label, cmd, status }: { label: string; cmd: string; status: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-control bg-panel">
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
      <pre className="whitespace-pre-wrap break-all px-5 py-4 font-mono text-sm text-ink">
        {cmd}
      </pre>
    </div>
  )
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel p-5">
      <h3 className="mb-2 text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-12">
      <div className="mb-5 border-b border-hair pb-2.5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}
