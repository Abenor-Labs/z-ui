import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { byName, components, type ZComponent } from '@/__generated__/meta.js'
import { code } from '@/__generated__/code.js'
import { LikeButtonBench } from '@/components/bench/like-button-bench'
import { SpringRace } from '@/components/bench/spring-race'
import { CodePanel, type CodeFile } from '@/components/code-panel'
import { InstallBlock } from '@/components/install-block'
import type { SpringName } from '@/lib/z-spring'

export function generateStaticParams() {
  return components.map((c) => ({ slug: c.name }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const item = byName[slug]
  if (!item) return {}
  return { title: item.name, description: item.description }
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const found = byName[slug]
  if (!found || found.type !== 'registry:component') notFound()
  const item = found as ZComponent

  // Every file the CLI will write, dependencies first, each carrying the digest
  // the generator computed from the same bytes it inlined into /r/.
  const files: CodeFile[] = item.installs
    .flatMap((i) => i.files)
    .map((f) => {
      const c = code[f.key]
      return c ? { key: f.key, target: c.target, html: c.html, raw: c.raw, lines: c.lines, sha: c.sha } : null
    })
    .filter((f): f is CodeFile => f !== null)

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">
      <header className="border-b border-rule py-12">
        <p className="lbl mb-4">{item.category}</p>
        <h1 className="font-mono text-3xl font-medium tracking-tight sm:text-4xl">{item.name}</h1>
        <p className="mt-3 max-w-xl text-lg text-muted">{item.description}</p>
      </header>

      <Section n="01" title="Bench">
        <p className="mb-5 max-w-xl text-sm text-muted">
          Press it, and hover it while liked. The readout is the component&rsquo;s own{' '}
          <code className="font-mono text-silkscreen">data-state</code> attribute, read from the
          DOM rather than from React, so it shows what your CSS would actually match. The state
          buttons drive the component the way a pointer would.
        </p>
        <LikeButtonBench states={item.states} defaultSpring={item.spring as SpringName} />
      </Section>

      <Section n="02" title="Spring scale">
        <p className="mb-5 max-w-xl text-sm text-muted">
          Reading that <code className="font-mono text-silkscreen">bounce</code> has a damping
          ratio of 0.35 conveys nothing. Firing four presets together conveys all of it. Note that{' '}
          <code className="font-mono text-silkscreen">bounce</code> reaches 90% of target fastest
          of the four, because it passes through the target instead of easing up to it.
        </p>
        <SpringRace />
      </Section>

      <Section n="03" title="Install">
        <InstallBlock name={item.name} />
      </Section>

      <Section n="04" title="Source">
        <p className="mb-5 max-w-xl text-sm text-muted">
          Byte-identical to the repository and to what the CLI writes. {files.length} files
          including dependencies.
        </p>
        <CodePanel files={files} />
      </Section>

      <Section n="05" title="States">
        <div className="overflow-x-auto border border-rule bg-panel">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr>
                <th className="lbl border-b border-rule px-5 py-2.5 text-left">selector</th>
                <th className="lbl border-b border-rule px-5 py-2.5 text-left">fires when</th>
              </tr>
            </thead>
            <tbody>
              {item.states.map((s) => (
                <tr key={s}>
                  <td className="border-b border-rule px-5 py-2.5 text-mint">
                    [data-state=&quot;{s}&quot;]
                  </td>
                  <td className="border-b border-rule px-5 py-2.5 text-muted">{describe(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </main>
  )
}

function describe(state: string) {
  const liked = state.startsWith('liked')
  const base = liked ? 'toggled on' : 'toggled off'
  if (state.endsWith('-pressing') || state === 'pressing') return `${base}, pointer held down`
  if (state.endsWith('-hover') || state === 'hover') return `${base}, pointer over`
  return `${base}, pointer elsewhere`
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="pt-12">
      <div className="mb-5 flex items-baseline gap-4 border-b border-rule pb-2.5">
        <span className="lbl">{n}</span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}
