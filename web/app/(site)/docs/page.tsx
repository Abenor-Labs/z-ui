import Link from 'next/link'
import type { Metadata } from 'next'
import { components } from '@/__generated__/meta.js'
import { CopyButton } from '@/components/copy-button'

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'How Z-UI is installed, what lands in your repository, and the two contracts every component keeps.',
}

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
          The manifests are a strict superset of shadcn&rsquo;s registry-item schema, so its
          CLI works today. The first-party CLI is not published yet and this page says so
          rather than pretending otherwise.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Cmd
            label="shadcn"
            ready
            cmd="npx shadcn@latest add https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry/r/scrub.json"
          />
          <Cmd label="z-ui" ready={false} cmd="npx @abenor/z-ui add scrub" />
        </div>
      </Section>

      <Section title="What lands in your repository">
        <p className="mb-5 max-w-2xl text-sm text-muted">
          The component, plus the primitives it depends on. Nothing else, and nothing is
          added to <code className="font-mono text-ink">package.json</code> except{' '}
          <code className="font-mono text-ink">motion</code>, which is a real dependency
          because interruptible springs are the product.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-panel px-5 py-4 font-mono text-sm text-muted">
{`components/ui/scrub.tsx           the component
lib/z-spring.ts                   the spring scale
lib/z-cn.ts                       class merge
hooks/use-controllable-state.ts   controlled/uncontrolled`}
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
                  <td className="border-b border-hair px-5 py-2.5 text-accent">{s.name}</td>
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
        <div className="grid gap-3 sm:grid-cols-2">
          {components.map((c) => (
            <Link
              key={c.name}
              href={`/c/${c.name}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel px-5 py-4 transition-colors hover:border-accent"
            >
              <span className="font-mono text-sm text-ink">{c.name}</span>
              <span className="lbl ml-auto">{c.category}</span>
            </Link>
          ))}
        </div>
      </Section>
    </main>
  )
}

function Cmd({ label, cmd, ready }: { label: string; cmd: string; ready: boolean }) {
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-panel">
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
      <pre className="overflow-x-auto px-5 py-4 font-mono text-sm text-ink">{cmd}</pre>
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
