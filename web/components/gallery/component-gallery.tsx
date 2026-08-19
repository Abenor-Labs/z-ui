'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ZComponent } from '@/__generated__/meta.js'
import { Chase } from '@/components/z-ui/chase'
import { Dial } from '@/components/z-ui/dial'
import { Disclosure } from '@/components/z-ui/disclosure'
import { Heft, HeftItem } from '@/components/z-ui/heft'
import { HoldDrain } from '@/components/z-ui/hold-drain'
import { LateCritique } from '@/components/z-ui/late-critique'
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
  // `concealed`: the tile rests as a static field of glyphs and the hover is a
  // genuine reveal. The previous version rested on the decoded string, which
  // made the gesture backwards — hovering scrambled a line the reader had
  // already read, then put it back.
  const { text, run, ref } = useScramble<HTMLDivElement>({
    text: 'decode("z-ui")',
    trigger: 'hover',
    concealed: true,
    playOnce: false,
    duration: 720,
  })

  /**
   * The listener goes on the card, not on this box, and not because of the
   * gesture-size argument alone. The card's title is a stretched link —
   * `after:absolute after:inset-0` over the whole `li` — so the pointer's
   * hit target inside the tile is the anchor's pseudo-element, and the
   * anchor is a *sibling* of this preview, not an ancestor. `pointerenter`
   * fires on the hit target and its ancestors only; the hook's own listener
   * on this div was therefore unreachable by any real pointer, which went
   * unnoticed for exactly as long as the resting frame happened to be the
   * decoded string. The `li` IS in the hit target's ancestor chain, so it is
   * the one element that both receives the event and means "the reader
   * arrived at this card".
   */
  React.useEffect(() => {
    const li = ref.current?.closest('li')
    if (!li) return
    const enter = () => run()
    li.addEventListener('pointerenter', enter)
    return () => li.removeEventListener('pointerenter', enter)
  }, [ref, run])

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
 * Hold drain, at a tile-sized duration.
 *
 * 900ms rather than the component's 1200ms default: the claim is that letting
 * go early costs exactly what the hold earned, and a reader has to be willing
 * to hold twice to check that. Long enough to abandon deliberately, short
 * enough that doing it twice is not a chore.
 *
 * The confirm resets itself. A tile that ends in a terminal state is a tile
 * that demonstrates once and then sits there spent, and this grid is the first
 * thing a visitor touches.
 */
function HoldDrainPreview() {
  const [confirmed, setConfirmed] = React.useState(false)

  React.useEffect(() => {
    if (!confirmed) return
    const id = setTimeout(() => setConfirmed(false), 1400)
    return () => clearTimeout(id)
  }, [confirmed])

  return (
    <div className="w-[212px]">
      <HoldDrain
        label="hold to delete"
        armedLabel="release"
        committedLabel="deleted"
        duration={900}
        onConfirm={() => setConfirmed(true)}
      />
    </div>
  )
}

/**
 * Late critique, with a rule strict enough to fail by accident.
 *
 * The component's whole claim is about *when* the verdict lands, not what it
 * is, so the validator is the most ordinary one there is. What the preview has
 * to make reachable is the pair of moments: type half an address and no error
 * appears mid-word, then fix it and the error clears on the same keystroke
 * rather than after another quiet period.
 */
function LateCritiquePreview() {
  return (
    <div className="w-[236px]">
      <LateCritique
        label="email"
        placeholder="you@example.com"
        validate={(v) =>
          v.length === 0 ? null : /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v) ? null : 'Not an address yet.'
        }
      />
    </div>
  )
}

/**
 * Heft, as a pile.
 *
 * Five bodies rather than three, and three sizes rather than one, because the
 * claim is that moving one thing has consequences for things you did not touch
 * — and a sparse box of identical discs never gives you the stack that makes
 * that visible. Sized to the tile's 184px row with room above the pile to throw
 * something into.
 *
 * One accent disc among four neutrals. Mint marks what moves, and in a box
 * where everything can move, marking all of it would mark nothing.
 */
function HeftPreview() {
  return (
    <div className="size-full p-4">
      <Heft label="A box of five objects. Drag one; the others react." className="size-full">
        <HeftItem label="Large disc">
          <span className="block size-11 rounded-full bg-accent" />
        </HeftItem>
        <HeftItem label="Large disc, second">
          <span className="block size-11 rounded-full bg-muted" />
        </HeftItem>
        <HeftItem label="Medium disc">
          <span className="block size-8 rounded-full bg-control" />
        </HeftItem>
        <HeftItem label="Small disc">
          <span className="block size-6 rounded-full bg-muted" />
        </HeftItem>
        <HeftItem label="Small disc, second">
          <span className="block size-6 rounded-full bg-control" />
        </HeftItem>
      </Heft>
    </div>
  )
}

/**
 * Dial, at a size a flick can actually be aimed at.
 *
 * Nothing else in the tile: the component reports its value through its own
 * needle, and a duplicate readout here would be a second thing to keep true.
 * The catalogue page's tile row is 184px; 132px of knob leaves air above and
 * below for the focus ring at its 4px offset.
 */
function DialPreview() {
  return (
    <Dial
      label="Demo dial. Flick it and it coasts to a detent."
      min={0}
      max={12}
      step={1}
      defaultValue={4}
      size={132}
      className="text-ink"
    />
  )
}

/**
 * Chase, with four unevenly-sized options on purpose: the stretch is physics,
 * so the long jump from the first label to the widest one deforms the pill
 * visibly more than a hop to the neighbour — which is the claim, falsifiable
 * in two clicks.
 */
function ChasePreview() {
  return (
    <Chase
      label="Range"
      options={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'all', label: 'All time' },
      ]}
      defaultValue="day"
      className="text-ink"
    />
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
  'hold-drain': { node: HoldDrainPreview, interactive: true },
  'late-critique': { node: LateCritiquePreview, interactive: true },
  heft: { node: HeftPreview, interactive: true },
  dial: { node: DialPreview, interactive: true },
  chase: { node: ChasePreview, interactive: true },
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

      {/* Two columns, not three. At four components a three-up grid leaves one
          tile alone on the second row beside two empty cells, which reads as a
          layout that broke rather than a catalogue that is deliberately small.
          Two columns divide four evenly and give each demo half the width to
          be legible in — these are interactions, not thumbnails. */}
      <ul className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
