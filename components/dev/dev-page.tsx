import * as React from 'react'

// The registry is the single home for a shipped component — the CLI serves that
// exact file. This harness reaches into it rather than keeping a second copy
// under gallery/, because two copies of a 340-line file is a drift bug waiting.
import {
  Disclosure,
  type DisclosureState,
} from '../../registry/components/disclosure/disclosure'

/**
 * Plain harness. No design work here on purpose — its only jobs are to mount
 * the components, let you flip the host palette so the `currentColor` fallbacks
 * can be checked in both, and print `data-state` so the attribute can be
 * watched against the pixels.
 */

const DARK = { background: '#0f0c09', color: '#e8e4dc' }
const LIGHT = { background: '#faf9f7', color: '#17140f' }

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 font-mono text-xs tracking-wide uppercase opacity-60">{title}</h2>
      {hint ? <p className="mb-3 max-w-prose text-sm opacity-50">{hint}</p> : null}
      <div className="max-w-lg">{children}</div>
    </section>
  )
}

const LOREM = `Height is a spring here, not a transition. Click the trigger again before
this has finished opening and watch it turn around from wherever it got to,
at the speed it was already travelling.`

export function DevPage(): React.ReactElement {
  const [light, setLight] = React.useState(false)

  // Controlled example.
  const [open, setOpen] = React.useState(false)

  // Observed from the outside, to prove the attribute tracks the animation.
  const [seen, setSeen] = React.useState<DisclosureState>('closed')
  const probeRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = probeRef.current
    if (!el) return
    const read = () => setSeen((el.dataset.state ?? 'closed') as DisclosureState)
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])

  const [completions, setCompletions] = React.useState<string[]>([])

  const [extraLines, setExtraLines] = React.useState(1)

  return (
    <main
      style={light ? LIGHT : DARK}
      className="min-h-dvh px-6 py-10 font-sans text-[15px] antialiased"
    >
      <header className="mb-10 flex items-center gap-4">
        <h1 className="font-mono text-sm tracking-wide uppercase">gallery / dev</h1>
        <button
          type="button"
          onClick={() => setLight((v) => !v)}
          className="min-h-11 cursor-pointer rounded border border-current/25 px-3 text-sm hover:bg-current/10"
        >
          {light ? 'dark' : 'light'}
        </button>
      </header>

      <Row
        title="disclosure — uncontrolled"
        hint="Nothing passed but a label and children. Interrupt it mid-open; it should reverse without stalling."
      >
        <Disclosure ref={probeRef} label="What does the spring actually buy">
          <p>{LOREM}</p>
        </Disclosure>
        <p className="mt-2 font-mono text-xs opacity-60">
          data-state: <span className="opacity-100">{seen}</span>
        </p>
      </Row>

      <Row
        title="disclosure — controlled"
        hint="`open` / `onOpenChange` driven from outside. The trigger still works; it just reports instead of deciding."
      >
        <Disclosure
          label="Controlled from a button below"
          open={open}
          onOpenChange={setOpen}
          onOpenChangeComplete={(o) =>
            setCompletions((prev) => [`settled ${o ? 'open' : 'closed'}`, ...prev].slice(0, 4))
          }
        >
          <p>
            The external button and the trigger are the same source of truth, so mashing both is the
            same as mashing one.
          </p>
        </Disclosure>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="min-h-11 cursor-pointer rounded border border-current/25 px-3 text-sm hover:bg-current/10"
          >
            toggle from outside
          </button>
          <span className="font-mono text-xs opacity-60">{completions[0] ?? '—'}</span>
        </div>
      </Row>

      <Row title="disclosure — defaultOpen" hint="Starts open with no animation on mount.">
        <Disclosure defaultOpen label="Open on arrival">
          <p>No opening animation played to get here. It was just already this tall.</p>
        </Disclosure>
      </Row>

      <Row
        title="disclosure — content that changes size"
        hint="Add lines while it is open: the panel resizes instantly, the way a height:auto box would. Add them while it is closed, then open."
      >
        <Disclosure defaultOpen label="Resizes without springing">
          {Array.from({ length: extraLines }, (_, i) => (
            <p key={i}>Line {i + 1} of content that the panel has to keep fitting.</p>
          ))}
        </Disclosure>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setExtraLines((n) => n + 1)}
            className="min-h-11 cursor-pointer rounded border border-current/25 px-3 text-sm hover:bg-current/10"
          >
            add line
          </button>
          <button
            type="button"
            onClick={() => setExtraLines((n) => Math.max(1, n - 1))}
            className="min-h-11 cursor-pointer rounded border border-current/25 px-3 text-sm hover:bg-current/10"
          >
            remove line
          </button>
        </div>
      </Row>

      <Row
        title="disclosure — focusable content"
        hint="Tab into it while open, then close with the trigger: focus comes back to the trigger rather than falling to the body."
      >
        <Disclosure label="Contains a focusable thing">
          <p className="mb-3">Tab from the trigger to reach the link below.</p>
          <a href="#top" className="underline underline-offset-4">
            a link inside the panel
          </a>
        </Disclosure>
      </Row>
    </main>
  )
}
