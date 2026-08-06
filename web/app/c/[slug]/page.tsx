import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { byName, components, type ZComponent } from '@/__generated__/meta.js'
import { code } from '@/__generated__/code.js'
import { LikeButtonBench } from '@/components/bench/like-button-bench'
import { ScrubBench } from '@/components/bench/scrub-bench'
import { UndoToastBench } from '@/components/bench/undo-toast-bench'
import { HoldToConfirmBench } from '@/components/bench/hold-to-confirm-bench'
import { DisclosureBench } from '@/components/bench/disclosure-bench'
import { SheetBench } from '@/components/bench/sheet-bench'
import { ReorderBench } from '@/components/bench/reorder-bench'
import { SlideToConfirmBench } from '@/components/bench/slide-to-confirm-bench'
import { RevertFieldBench } from '@/components/bench/revert-field-bench'
import { SchedulerBench } from '@/components/bench/scheduler-bench'
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
  return { title: item.title, description: item.description }
}

/**
 * Each component gets the bench that can actually drive it, and a blurb that
 * describes what to try. A single generic bench would either lie about what the
 * chips can force or drop the part of the interaction worth showing.
 */
const BENCH: Record<
  string,
  { note: React.ReactNode; render: (item: ZComponent) => React.ReactNode }
> = {
  'like-button': {
    note: (
      <>
        Press it, and hover it while liked. The readout is the component&rsquo;s own{' '}
        <code className="font-mono text-ink">data-state</code> attribute, read from the DOM
        rather than from React, so it shows what your CSS would actually match. The state
        buttons drive the component the way a pointer would.
      </>
    ),
    render: (item) => (
      <LikeButtonBench states={item.states} defaultSpring={item.spring as SpringName} />
    ),
  },
  scrub: {
    note: (
      <>
        Drag along the bar to seek, then keep holding and pull away from it — the further you
        travel, the finer the same horizontal movement gets. Release with speed and it keeps
        going. The handle is a spring following the value rather than the value itself, so on a
        fast drag it visibly trails and catches up.
      </>
    ),
    render: (item) => <ScrubBench states={item.states} defaultSpring={item.spring as SpringName} />,
  },
  'undo-toast': {
    note: (
      <>
        Move your pointer over the toast — the clock slows to a stop rather than freezing, and
        eases back up when you leave. Flick it sideways and it goes; nudge it and it comes back.
        The grace period is visible the whole time, so the undo window is a thing you can see
        rather than a thing you have to guess at.
      </>
    ),
    render: (item) => (
      <UndoToastBench states={item.states} defaultSpring={item.spring as SpringName} />
    ),
  },
  'hold-to-confirm': {
    note: (
      <>
        Press and keep holding. The cost is deliberate pressure over time, which is the only
        confirmation that cannot be dismissed by muscle memory. Let go early and it unwinds
        rather than snapping back — you can see exactly how much of the second you spent, and
        the component tells the host how far you got.
      </>
    ),
    render: (item) => (
      <HoldToConfirmBench states={item.states} defaultSpring={item.spring as SpringName} />
    ),
  },
  disclosure: {
    note: (
      <>
        Click the trigger, then click it again before it finishes opening. Height is a spring
        here, not a duration, so the retarget keeps whatever velocity it already had instead of
        restarting the curve from zero.
      </>
    ),
    render: (item) => (
      <DisclosureBench states={item.states} defaultSpring={item.spring as SpringName} />
    ),
  },
  sheet: {
    note: (
      <>
        Drag the panel and let go. It snaps to whichever detent your release velocity projects
        toward, not the one nearest where your hand happened to stop — a firm flick from the
        bottom can land on the top detent even released well short of it.
      </>
    ),
    render: (item) => <SheetBench states={item.states} defaultSpring={item.spring as SpringName} />,
  },
  reorder: {
    note: (
      <>
        Drag the grip on a row to a new position. The other rows don&rsquo;t move together —
        each settles with a spring softened by its own distance from the row you dragged, so the
        displacement travels down the list as a wave instead of landing all at once.
      </>
    ),
    render: (item) => <ReorderBench states={item.states} defaultSpring={item.spring as SpringName} />,
  },
  'slide-to-confirm': {
    note: (
      <>
        Drag the knob short of the end and let go. The recoil carries your release velocity
        rather than easing back, so a fast retreat visibly overshoots past the start before it
        settles — how close the attempt got is something you feel, not just a snap to zero.
      </>
    ),
    render: (item) => (
      <SlideToConfirmBench states={item.states} defaultSpring={item.spring as SpringName} />
    ),
  },
  'revert-field': {
    note: (
      <>
        Edit the value, then press Escape. It un-types back to the prior value — deleting to the
        last character the two still agree on, then typing the rest back in — instead of
        silently snapping the string.
      </>
    ),
    render: (item) => (
      <RevertFieldBench states={item.states} defaultSpring={item.spring as SpringName} />
    ),
  },
  scheduler: {
    note: (
      <>
        Hover a time without clicking — the bar at the bottom rises as a dim, question-marked
        preview of that booking. Move off and it eases back down; click and it snaps to full
        opacity instead. Click the month arrows a few times fast to feel the slide retarget
        mid-flight rather than restart.
      </>
    ),
    render: (item) => (
      <SchedulerBench states={item.states} defaultSpring={item.spring as SpringName} />
    ),
  },
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
      return c
        ? { key: f.key, target: c.target, html: c.html, raw: c.raw, lines: c.lines, sha: c.sha }
        : null
    })
    .filter((f): f is CodeFile => f !== null)

  const bench = BENCH[item.name]

  return (
    <main className="mx-auto max-w-[64rem] px-4 pb-24 md:px-16">
      <header className="border-b border-hair py-12">
        <Link href="/#components" className="lbl transition-colors hover:!text-accent">
          ← catalog
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono text-[0.6875rem] text-muted">
            {item.category}
          </span>
          <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono text-[0.6875rem] text-muted">
            spring · {item.spring}
          </span>
        </div>
        <h1 className="t-lg mt-4">{item.title}</h1>
        <p className="mt-3 max-w-2xl text-base text-muted">{item.description}</p>
      </header>

      <Section title="Bench">
        {bench ? (
          <>
            <p className="mb-5 max-w-2xl text-sm text-muted">{bench.note}</p>
            {bench.render(item)}
          </>
        ) : (
          <p className="max-w-2xl text-sm text-muted">
            No bench for this component yet. The source below is still what the CLI writes.
          </p>
        )}
      </Section>

      <Section title="Spring scale">
        <p className="mb-5 max-w-2xl text-sm text-muted">
          Reading that <code className="font-mono text-ink">bounce</code> has a damping ratio of
          0.35 conveys nothing. Firing four presets together conveys all of it. Note that{' '}
          <code className="font-mono text-ink">bounce</code> reaches 90% of target fastest of the
          four, because it passes through the target instead of easing up to it.
        </p>
        <SpringRace />
      </Section>

      <Section title="Install">
        <InstallBlock name={item.name} />
      </Section>

      <Section title="Source">
        <p className="mb-5 max-w-2xl text-sm text-muted">
          Byte-identical to the repository and to what the CLI writes. {files.length} files
          including dependencies.
        </p>
        <CodePanel files={files} />
      </Section>

      <Section title="States">
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-panel">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr>
                <th className="lbl border-b border-hair px-5 py-2.5 text-left">selector</th>
                <th className="lbl border-b border-hair px-5 py-2.5 text-left">fires when</th>
              </tr>
            </thead>
            <tbody>
              {item.states.map((s) => (
                <tr key={s}>
                  <td className="border-b border-hair px-5 py-2.5 text-accent">
                    [data-state=&quot;{s}&quot;]
                  </td>
                  <td className="border-b border-hair px-5 py-2.5 text-muted">
                    {describe(item.name, s)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <ComponentPager current={item.name} />
    </main>
  )
}

/**
 * A visitor who lands on one component from a search result has no way back into
 * the registry except the catalog link at the top. Wrapping the list means the
 * last component leads to the first, so browsing never dead-ends.
 */
function ComponentPager({ current }: { current: string }) {
  const list = components.filter((c) => c.type === 'registry:component')
  const i = list.findIndex((c) => c.name === current)
  if (i === -1 || list.length < 2) return null
  // `noUncheckedIndexedAccess` is on, and it is right to insist: the modulo
  // makes these safe but the compiler cannot know that.
  const prev = list[(i - 1 + list.length) % list.length]
  const next = list[(i + 1) % list.length]
  if (!prev || !next) return null

  return (
    <nav className="mt-16 grid gap-3 border-t border-hair pt-8 sm:grid-cols-2">
      <Link
        href={`/c/${prev.name}`}
        className="group flex flex-col gap-1 rounded-xl border border-white/10 bg-panel px-5 py-4 transition-colors hover:border-accent"
      >
        <span className="lbl">← previous</span>
        <span className="font-mono text-sm text-ink">{prev.name}</span>
      </Link>
      <Link
        href={`/c/${next.name}`}
        className="group flex flex-col items-end gap-1 rounded-xl border border-white/10 bg-panel px-5 py-4 text-right transition-colors hover:border-accent"
      >
        <span className="lbl">next →</span>
        <span className="font-mono text-sm text-ink">{next.name}</span>
      </Link>
    </nav>
  )
}

const GESTURE_STATES: Record<string, Record<string, string>> = {
  scrub: {
    idle: 'pointer elsewhere',
    hover: 'pointer over the track',
    scrubbing: 'dragging, one-to-one with the pointer',
    'scrubbing-fine': 'dragging, pointer pulled away from the track',
    settling: 'released, the handle still catching up',
  },
  'undo-toast': {
    counting: 'the grace period is running down',
    held: 'pointer over the toast, the clock stalled',
    dragging: 'being pushed sideways',
    leaving: 'past the threshold, on its way out',
  },
  'hold-to-confirm': {
    idle: 'pointer elsewhere',
    hover: 'pointer over, nothing committed',
    holding: 'held down, the charge building',
    releasing: 'let go early, the charge unwinding',
    confirmed: 'held to the end',
  },
  disclosure: {
    closed: 'collapsed, height at zero',
    hover: 'pointer over the trigger',
    opening: 'height retargeted upward, still in flight',
    open: 'settled at the content’s measured height',
    closing: 'height retargeted downward, still in flight',
  },
  sheet: {
    closed: 'translated fully out of view',
    dragging: 'a hand on the panel',
    settling: 'released, spring finishing the snap to a detent',
    open: 'settled at a detent above closed',
  },
  reorder: {
    idle: 'no row under the pointer',
    dragging: 'a row is being dragged',
    settling: 'released, the displaced rows still catching up',
  },
  'slide-to-confirm': {
    idle: 'pointer elsewhere, knob at rest',
    hover: 'pointer over the knob',
    dragging: 'a hand on the knob',
    'snapping-back': 'released short of the threshold, recoiling home',
    confirmed: 'released past the threshold',
  },
  'revert-field': {
    idle: 'unfocused',
    hover: 'pointer over, unfocused',
    editing: 'focused, the draft can differ from the committed value',
    reverting: 'Escape pressed, un-typing back to the prior value',
  },
  scheduler: {
    browsing: 'no slot hovered, none committed',
    previewing: 'a slot is hovered that differs from the committed one',
    committed: 'a slot has been clicked',
  },
}

function describe(component: string, state: string) {
  const gesture = GESTURE_STATES[component]
  if (gesture) return gesture[state] ?? state

  const liked = state.startsWith('liked')
  const base = liked ? 'toggled on' : 'toggled off'
  if (state.endsWith('-pressing') || state === 'pressing') return `${base}, pointer held down`
  if (state.endsWith('-hover') || state === 'hover') return `${base}, pointer over`
  return `${base}, pointer elsewhere`
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
