'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ZComponent } from '@/__generated__/meta.js'
import { Disclosure } from '@/components/z-ui/disclosure'
import { useScramble } from '@/components/z-ui/scramble-reveal'
import { componentHref, hasComponentPage } from '@/lib/registry'

/**
 * The catalogue, as tiles that run.
 *
 * The rule the layout is built around: every preview is the shipped component,
 * imported through the same `@/components/z-ui/*` specifier a consumer gets
 * after the CLI writes the file. Not a video, not a GIF, not a re-implementation
 * that drifts from the source the week after it is written. If a tile is wrong,
 * the component is wrong.
 *
 * That is also why the card is a `div` and only the title is a link. Half these
 * previews are interactive — a disclosure has a button in it — and a button
 * inside an anchor is invalid markup that browsers resolve by breaking one of
 * them. Kinetic's own gallery does the same thing for the same reason.
 */

/* ------------------------------------------------------------- previews -- */

/**
 * Scramble reveal, driven from the card rather than from itself.
 *
 * `useScramble` rather than `<ScrambleReveal>` because the hover target has to
 * be the whole tile, and the component attaches its listener to its own text
 * node. The trade is the no-reflow ghost stack, which lives in the component —
 * safe to give up here and nowhere else: this string is monospaced and every
 * substitution is one glyph wide, so the box cannot change size.
 */
function ScramblePreview() {
  const { text, ref } = useScramble<HTMLDivElement>({
    text: 'decode("z-ui")',
    trigger: 'hover',
    playOnce: false,
    duration: 720,
  })

  // The ref goes on a box that fills the tile, not on the text. Hovering a
  // 14-character string is a different gesture from hovering the card, and the
  // card is what the reader is aiming at.
  return (
    <div ref={ref} className="flex size-full items-center justify-center">
      <span className="font-mono text-[17px] whitespace-pre text-ink">{text}</span>
    </div>
  )
}

/**
 * Disclosure, at the size it would actually be used.
 *
 * Narrow on purpose: the interruption is easiest to see when the travel is
 * short enough to reverse inside one gesture.
 */
function DisclosurePreview() {
  return (
    <div className="w-[236px]">
      <Disclosure label="what changed">
        <p className="text-[12.5px] leading-[1.5]">
          Press again before this settles. It turns around from here, at the speed it is already
          going.
        </p>
      </Disclosure>
    </div>
  )
}

/**
 * Keyed by registry name, so a component that lands without a preview shows a
 * tile that says so rather than an empty box that reads as a broken build.
 *
 * `interactive` decides who wins a click inside the tile. The card is a link
 * over its whole area (see `Card`), and for a preview that only responds to
 * hover that is exactly right — clicking the scramble should open its page. A
 * preview you are meant to press is different: swallowing that press to
 * navigate instead would make the tile a liar. Those tiles are raised above the
 * link, so the demo takes the click and the rest of the card still opens.
 */
const PREVIEWS: Record<string, { node: () => React.ReactElement; interactive: boolean }> = {
  'scramble-reveal': { node: ScramblePreview, interactive: false },
  disclosure: { node: DisclosurePreview, interactive: true },
}

function Preview({ name }: { name: string }) {
  const entry = PREVIEWS[name]
  if (!entry) {
    return <span className="lbl">no preview yet</span>
  }
  const Node = entry.node
  return <Node />
}

/* --------------------------------------------------------------- filter -- */

/**
 * Pills are built from the gestures actually present, never from a fixed list.
 * A hardcoded set is how a catalogue ends up offering a filter that returns
 * nothing, which is a worse answer than not offering it.
 *
 * Gesture rather than category is the axis because it is the question a reader
 * has: what do I have to do to see this work. `category` says what kind of
 * thing it is, and every component in the registry is currently the same kind.
 */
function gesturesIn(items: ZComponent[]): string[] {
  return [...new Set(items.map((c) => c.gesture))].sort()
}

/* ----------------------------------------------------------------- grid -- */

export function ComponentGallery({ items }: { items: ZComponent[] }) {
  const [gesture, setGesture] = React.useState<string>('all')

  const gestures = React.useMemo(() => gesturesIn(items), [items])
  const shown = gesture === 'all' ? items : items.filter((c) => c.gesture === gesture)

  // Only worth showing when there is more than one thing to choose between.
  const filterable = gestures.length > 1

  return (
    <>
      {/* The count sits on the filter row rather than up in the page header,
          because it is the one number that changes when a pill is pressed and
          it should be next to the thing that changed it. */}
      <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-rule pb-7">
        {filterable ? (
          <>
            <Pill label="all" active={gesture === 'all'} onSelect={() => setGesture('all')} />
            {gestures.map((g) => (
              <Pill key={g} label={g} active={gesture === g} onSelect={() => setGesture(g)} />
            ))}
          </>
        ) : null}
        <span className="lbl ml-auto shrink-0" aria-live="polite">
          {gesture === 'all'
            ? `${items.length} component${items.length === 1 ? '' : 's'}`
            : `${shown.length} on ${gesture}`}
        </span>
      </div>

      <ul className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <Card key={c.name} item={c} />
        ))}
      </ul>
    </>
  )
}

/**
 * Selected is weight, fill and ink — not accent.
 *
 * DESIGN.md reserves the accent for what is physically moving, and a chosen
 * filter is the most static state on the page. Kinetic fills its active pill
 * with green; here the same information is carried by a lifted surface, a
 * brighter border and lit ink, with `aria-pressed` saying it a fourth way so
 * nothing depends on seeing colour at all.
 */
function Pill({
  label,
  active,
  onSelect,
}: {
  label: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={[
        // 30px tall to match the artifact, with the hit target padded out to 44
        // by a transparent ::before. The visual can be small; the target cannot.
        'relative h-[30px] cursor-pointer rounded-full border px-3.5 font-mono text-[11px]',
        'transition-colors before:absolute before:inset-x-0 before:-top-[7px]',
        "before:-bottom-[7px] before:content-['']",
        'outline-none focus-visible:outline-2 focus-visible:outline-solid',
        'focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'border-muted bg-panel-2 font-medium text-ink'
          : 'border-control text-muted hover:text-ink',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

/**
 * The whole card opens the component's page, via one stretched link rather than
 * an anchor wrapped round everything.
 *
 * Wrapping is the obvious version and it is invalid here: half these previews
 * contain a `<button>`, and a button inside an anchor is markup browsers
 * resolve by breaking one of the two. A `::after` spread over the card keeps
 * exactly one link in the tab order, keeps the accessible name to the title
 * alone — "Disclosure", not the title plus the tag plus the whole description —
 * and lets an interactive preview sit above it and take its own clicks.
 */
function Card({ item }: { item: ZComponent }) {
  const linked = hasComponentPage(item.name)
  const interactive = PREVIEWS[item.name]?.interactive ?? false

  return (
    <li
      className={[
        'group relative overflow-hidden rounded-[10px] border border-control bg-chassis',
        'transition-colors hover:border-muted',
        // The ring belongs to the card because the link is the card. `has-`
        // rather than `focus-within` so tabbing into an interactive preview
        // does not light up the whole tile as though it were the link.
        'has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-solid',
        'has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent',
      ].join(' ')}
    >
      {/* Fixed 184px so the grid rows are even whatever a preview does inside.
          A tile that sizes to its content makes the row jump the first time a
          demo runs, which is the one thing a gallery of motion must not do. */}
      <div
        className={[
          'flex h-[184px] items-center justify-center border-b border-control bg-surface',
          'transition-colors group-hover:border-muted',
          interactive ? 'relative z-10' : '',
        ].join(' ')}
      >
        <Preview name={item.name} />
      </div>

      <div className="px-[18px] pt-4 pb-[18px]">
        <div className="flex items-center justify-between gap-3">
          {linked ? (
            <Link
              href={componentHref(item.name)}
              className="text-[15px] font-semibold text-ink outline-none group-hover:underline group-hover:underline-offset-4 after:absolute after:inset-0 after:content-['']"
            >
              {item.title}
            </Link>
          ) : (
            // No page. A title that looks like a link and 404s is the failure
            // this repo has already fixed once; plain text is the honest render
            // until the route exists.
            <span className="text-[15px] font-semibold text-ink">{item.title}</span>
          )}
          <span className="shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
            {item.gesture}
          </span>
        </div>
        <p className="mt-[9px] text-[13px] leading-[1.55] text-muted">{item.description}</p>
      </div>
    </li>
  )
}
