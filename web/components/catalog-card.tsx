'use client'

import * as React from 'react'
import Link from 'next/link'
import { LikeButton } from '@/components/z-ui/like-button'
import { Scrub } from '@/components/z-ui/scrub'
import { UndoToast } from '@/components/z-ui/undo-toast'
import { HoldToConfirm } from '@/components/z-ui/hold-to-confirm'
import { Disclosure } from '@/components/z-ui/disclosure'
import { Sheet } from '@/components/z-ui/sheet'
import { Reorder } from '@/components/z-ui/reorder'
import { SlideToConfirm } from '@/components/z-ui/slide-to-confirm'
import { RevertField } from '@/components/z-ui/revert-field'
import { Scheduler } from '@/components/z-ui/scheduler'
import { WIDE } from '@/lib/catalog-layout'

/**
 * The card preview is the live component, not a video or a screenshot. At this
 * catalog size that is simply cheaper and truer; if the registry ever reaches a
 * few dozen components this becomes a captured-media problem instead.
 */
function ScrubPreview() {
  const [value, setValue] = React.useState(0.38)
  return (
    <div className="w-full max-w-xs px-2">
      <Scrub value={value} onValueChange={setValue} buffered={0.72} aria-label="Scrub, preview" />
    </div>
  )
}

/**
 * The preview holds a grace period long enough that it will not lapse during a
 * visit. Letting the real duration run here would expire the card into empty
 * space, and restarting it on commit would remount the toast on a loop — a
 * catalogue tile should sit still until the reader touches it.
 *
 * Undoing restarts it, because that is the one outcome the reader chose.
 */
function UndoToastPreview() {
  const [nonce, setNonce] = React.useState(0)
  return (
    <div className="w-full max-w-sm px-2">
      <UndoToast
        key={nonce}
        // The component inverts: `bg-current` takes the ground from the host's
        // text colour, and its own text takes `--z-toast-fg`. Both have to be
        // told what this card is actually painted with.
        style={{ '--z-toast-fg': 'var(--color-panel)' } as React.CSSProperties}
        className="text-ink"
        duration={600_000}
        onUndo={() => setNonce((n) => n + 1)}
      >
        Deleted “Draft — pricing page”
      </UndoToast>
    </div>
  )
}

/**
 * Nothing is destroyed here, so confirming just resets. The preview has to
 * survive being held all the way down without ending up in a terminal state
 * the next reader cannot get out of.
 */
function HoldToConfirmPreview() {
  const [nonce, setNonce] = React.useState(0)
  return (
    <HoldToConfirm key={nonce} onConfirm={() => setTimeout(() => setNonce((n) => n + 1), 900)}>
      Delete everything
    </HoldToConfirm>
  )
}

/**
 * Deliberately closed. An open accordion nearly fills the tile and leaves no
 * room for the thing the component is actually for — press it twice quickly and
 * the height reverses from wherever it got to.
 */
function DisclosurePreview() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-white/10 bg-surface px-4">
      <Disclosure trigger={<span className="text-sm">Damping ratio</span>}>
        <p className="pb-4 text-sm leading-relaxed text-muted">
          ζ below 1 overshoots. Interrupt it mid-open and the height carries its velocity
          straight into the new target.
        </p>
      </Disclosure>
    </div>
  )
}

/** The sheet slides inside whatever fixed-height box it is given, so the card
 *  provides one rather than letting it reach for the viewport. */
function SheetPreview() {
  return (
    <div className="relative h-44 w-full max-w-xs overflow-hidden rounded-lg bg-black/20">
      <Sheet height={176} detents={[0.32, 0.72, 1]} defaultDetent={1}>
        <div className="px-4 pb-4 pt-1">
          <p className="text-sm font-medium">Now playing</p>
          <p className="mt-1 text-xs text-muted">Drag the panel — it snaps where you threw it.</p>
        </div>
      </Sheet>
    </div>
  )
}

const ROWS = ['Overshoot', 'Damping', 'Stiffness']

function ReorderPreview() {
  const [items, setItems] = React.useState(ROWS)
  return (
    <div className="w-full max-w-xs">
      <Reorder
        items={items}
        onReorder={setItems}
        rowHeight={44}
        keyExtractor={(row) => row}
        // The component owns the row chrome and the grab handle, so the render
        // prop supplies content only. `select-none` because dragging a row
        // otherwise sweeps a text selection across the list.
        renderItem={(row) => <span className="select-none text-sm">{row}</span>}
      />
    </div>
  )
}

/** Confirming resets after a beat, so the tile cannot be left in a terminal
 *  state the next reader has no way out of. */
function SlideToConfirmPreview() {
  const [nonce, setNonce] = React.useState(0)
  return (
    <div className="w-full max-w-xs">
      <SlideToConfirm
        key={nonce}
        onConfirm={() => setTimeout(() => setNonce((n) => n + 1), 1100)}
      >
        Slide to deploy
      </SlideToConfirm>
    </div>
  )
}

function RevertFieldPreview() {
  return (
    <div className="w-full max-w-xs">
      <RevertField defaultValue="production-cluster" aria-label="Cluster name, preview" />
      <p className="lbl mt-2.5">edit it, then press escape</p>
    </div>
  )
}

const SLOTS = ['09:00', '09:30', '10:00', '11:00', '13:30', '14:00', '15:30', '16:00']

/**
 * The month has to come from the real clock, and the real clock differs between
 * the server render and the client one. Rather than freeze the calendar to a
 * build-time date, the preview waits for mount — a calendar is the one control
 * where showing the wrong month is worse than showing nothing for a frame.
 */
function SchedulerPreview() {
  const [today, setToday] = React.useState<Date | null>(null)
  React.useEffect(() => setToday(new Date()), [])

  if (!today) return <div className="h-[264px] w-full max-w-2xl" aria-hidden />

  return (
    <div className="w-full max-w-2xl">
      <Scheduler
        today={today}
        defaultMonth={today}
        slotsForDate={(d) => (d.getDay() === 0 || d.getDay() === 6 ? [] : SLOTS)}
        isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
      />
    </div>
  )
}

const PREVIEW: Record<string, React.ReactNode> = {
  'like-button': <LikeButton aria-label="Like, catalog preview" />,
  scrub: <ScrubPreview />,
  'undo-toast': <UndoToastPreview />,
  'hold-to-confirm': <HoldToConfirmPreview />,
  disclosure: <DisclosurePreview />,
  sheet: <SheetPreview />,
  reorder: <ReorderPreview />,
  'slide-to-confirm': <SlideToConfirmPreview />,
  'revert-field': <RevertFieldPreview />,
  scheduler: <SchedulerPreview />,
}

export function CatalogCard({
  item,
}: {
  item: { name: string; title: string; description: string; category: string; states: string[] }
}) {
  const wide = WIDE.has(item.name)

  return (
    <div
      className={
        'group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-panel transition-[border-color,box-shadow] focus-within:border-accent hover:border-accent hover:shadow-[0_0_12px_2px_rgba(99,102,241,0.2)] ' +
        (wide ? 'h-auto min-h-80' : 'h-80')
      }
    >
      {/* The preview is a live, interactive component, so it cannot sit inside
          the anchor — pressing the demo would navigate mid-gesture. The link is
          the title in the footer instead, stretched over the card's dead space. */}
      <div className="grid flex-1 place-items-center bg-linear-to-br from-white/5 to-transparent p-8">
        {PREVIEW[item.name] ?? null}
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-hair bg-surface p-4">
        <div className="min-w-0">
          <Link
            href={`/c/${item.name}`}
            className="lbl !text-ink after:absolute after:inset-0 hover:!text-accent"
          >
            {item.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/10 px-2 font-mono text-[0.6875rem] text-muted">
              {item.category}
            </span>
            <span className="rounded-lg bg-white/10 px-2 font-mono text-[0.6875rem] text-muted">
              {item.states.length} states
            </span>
          </div>
        </div>
        <span aria-hidden className="text-muted transition-colors group-hover:text-ink">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m8 17-6-5 6-5M16 7l6 5-6 5" />
          </svg>
        </span>
      </div>
    </div>
  )
}
