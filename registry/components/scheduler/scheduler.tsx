'use client'

import * as React from 'react'
import { motion, animate, useMotionValue } from 'motion/react'
import type { Transition } from 'motion/react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { useZTransition, type SpringName } from '@/lib/z-spring'
import { zcn } from '@/lib/z-cn'

/**
 * A date-and-time booking picker where the confirmation is a ghost before
 * it's a fact.
 *
 * Every scheduler on the web either commits the instant you click a time
 * slot, or shows a confirm step that looks identical whether you're
 * deciding or done. Here, hovering a slot raises the summary bar as a dim,
 * question-marked preview — "Thursday, June 12 at 2:00?" — before you've
 * committed to anything. Move off without clicking and it eases back down.
 * Click, and the same bar snaps to full opacity with the final sentence and
 * an enabled Continue. The bar is never a separate confirmation dialog; it
 * is the one place your intention becomes fact, and it looks different
 * while it's still just a guess.
 *
 * Month navigation is a spring over a single integer, not two grids
 * crossfading on a timer. `monthIndex` is the target; a motion value chases
 * it continuously, so clicking "next" three times fast doesn't restart the
 * slide three times — it retargets mid-flight and keeps whatever velocity
 * it already had, the same mechanic `Disclosure` uses for height.
 *
 * `previewing` and `committed` share a state, `browsing`, whenever no hover
 * and no selection compete for the bar — that's the one moment the bar
 * itself has nothing to show and collapses to zero height.
 *
 * Keys here match `meta.states` in component.json exactly, checked in CI.
 */
const STATES = ['browsing', 'previewing', 'committed'] as const

export type SchedulerState = (typeof STATES)[number]

const barVariants = {
  'browsing': { height: 0, opacity: 0 },
  'previewing': { height: 64, opacity: 0.6 },
  'committed': { height: 64, opacity: 1 },
} satisfies Record<SchedulerState, object>

type MotionConflicts =
  | 'onChange'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'style'

export type SchedulerProps = Omit<React.ComponentPropsWithoutRef<'div'>, MotionConflicts> & {
  style?: React.CSSProperties
  /** Controlled viewed month. Any day of the month you want shown. */
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  /** Controlled selected date. `null` means nothing is picked yet. */
  date?: Date | null
  defaultDate?: Date | null
  onDateChange?: (date: Date) => void
  /** Controlled selected time slot. Picking a new date clears this. */
  slot?: string | null
  defaultSlot?: string | null
  onSlotChange?: (slot: string) => void
  /** Fired when Continue is pressed, with the date and slot that were shown. */
  onConfirm?: (date: Date, slot: string) => void
  /** The times worth showing for a given day. A day with none is unavailable. */
  slotsForDate: (date: Date) => string[]
  /** An extra reason a day can't be picked, beyond having no slots. */
  isDateDisabled?: (date: Date) => boolean
  /** Overridable for tests and demos; defaults to the real today. */
  today?: Date
  /** Spring driving the bar reveal and the month slide. */
  spring?: SpringName | Transition
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

const REF_YEAR = 2000
const monthIndexOf = (d: Date) => (d.getFullYear() - REF_YEAR) * 12 + d.getMonth()
const dateFromIndex = (i: number) => new Date(REF_YEAR, i, 1)
const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function buildGrid(monthStart: Date) {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const total = daysInMonth(year, month)
  const cells: { date: Date; inMonth: boolean }[] = []
  for (let i = firstWeekday; i > 0; i--) cells.push({ date: new Date(year, month, 1 - i), inMonth: false })
  for (let d = 1; d <= total; d++) cells.push({ date: new Date(year, month, d), inMonth: true })
  while (cells.length % 7 !== 0) {
    const lastCell = cells[cells.length - 1]
    const next = new Date(lastCell!.date)
    next.setDate(next.getDate() + 1)
    cells.push({ date: next, inMonth: false })
  }
  return cells
}

function formatDate(d: Date) {
  return `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
}

export function Scheduler({
  month: monthProp,
  defaultMonth,
  onMonthChange,
  date: dateProp,
  defaultDate = null,
  onDateChange,
  slot: slotProp,
  defaultSlot = null,
  onSlotChange,
  onConfirm,
  slotsForDate,
  isDateDisabled,
  today: todayProp,
  spring = 'settle',
  disabled = false,
  className,
  ref,
  ...props
}: SchedulerProps) {
  const today = React.useMemo(() => todayProp ?? new Date(), [todayProp])

  // `onDateChange`/`onSlotChange` only accept a real value — clearing the
  // slot when a new date is picked (see `pick` below) is bookkeeping the
  // host never asked to hear about, so it goes through the setter directly
  // rather than through the hook's `onChange`.
  const [date, setDate] = useControllableState<Date | null>({ prop: dateProp, defaultProp: defaultDate })
  const [slot, setSlotState] = useControllableState<string | null>({ prop: slotProp, defaultProp: defaultSlot })
  const setSlot = React.useCallback(
    (next: string | null) => {
      setSlotState(next)
      if (next !== null) onSlotChange?.(next)
    },
    [onSlotChange, setSlotState],
  )
  const [hoveredSlot, setHoveredSlot] = React.useState<string | null>(null)

  const [monthIndex, setMonthIndex] = useControllableState<number>({
    prop: monthProp !== undefined ? monthIndexOf(monthProp) : undefined,
    defaultProp: monthIndexOf(defaultMonth ?? defaultDate ?? today),
    onChange: (i) => onMonthChange?.(dateFromIndex(i)),
  })

  // A controlled `date` landing in a month that isn't the one on screen
  // should bring that month on screen, not leave the selection invisible.
  React.useEffect(() => {
    if (date && monthIndexOf(date) !== monthIndex) setMonthIndex(monthIndexOf(date))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const activeDate = date ?? today
  const slots = React.useMemo(() => slotsForDate(activeDate), [slotsForDate, activeDate])

  const previewSlot = hoveredSlot && hoveredSlot !== slot ? hoveredSlot : null
  const state: SchedulerState = previewSlot ? 'previewing' : slot ? 'committed' : 'browsing'
  const transition = useZTransition(spring)

  // `animate` on a motion value already cancels whatever was in flight and
  // continues from its current position and velocity, which is the whole
  // reason the month is a number being chased rather than two grids swapping.
  const display = useMotionValue(monthIndex)
  React.useEffect(() => {
    const controls = animate(display, monthIndex, transition)
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthIndex])

  // The track renders [monthIndex - 1, monthIndex, monthIndex + 1], so the
  // current month is the middle pane and resting position is -100%, not 0.
  // Offsetting from the first pane rather than from `monthIndex` is what keeps
  // the grid and the heading describing the same month.
  //
  // A manual subscription, not `useTransform`, so the formula always closes
  // over this render's `monthIndex`.
  const trackX = useMotionValue('-100%')
  React.useEffect(() => {
    const write = (d: number) => trackX.set(`${(d - (monthIndex - 1)) * -100}%`)
    write(display.get())
    return display.on('change', write)
  }, [display, trackX, monthIndex])

  const grids = [monthIndex - 1, monthIndex, monthIndex + 1].map((i) => ({
    index: i,
    start: dateFromIndex(i),
    cells: buildGrid(dateFromIndex(i)),
  }))

  const pick = (d: Date) => {
    if (disabled) return
    setDate(d)
    onDateChange?.(d)
    setSlot(null)
  }

  return (
    <div
      ref={ref}
      data-state={disabled ? 'browsing' : state}
      aria-disabled={disabled || undefined}
      className={zcn(
        'w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--z-panel,#18181b)]',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <div className="grid sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={disabled}
              onClick={() => setMonthIndex((i) => i - 1)}
              className="grid size-8 place-items-center rounded-lg text-[var(--z-fg-muted,#a1a1aa)] transition-colors hover:text-[var(--z-fg,#e5e1e4)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronIcon dir="left" />
            </button>
            <span className="text-sm font-medium tabular-nums">
              {MONTH_NAMES[dateFromIndex(monthIndex).getMonth()]} {dateFromIndex(monthIndex).getFullYear()}
            </span>
            <button
              type="button"
              aria-label="Next month"
              disabled={disabled}
              onClick={() => setMonthIndex((i) => i + 1)}
              className="grid size-8 place-items-center rounded-lg text-[var(--z-fg-muted,#a1a1aa)] transition-colors hover:text-[var(--z-fg,#e5e1e4)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronIcon dir="right" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 pb-2 text-center">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="font-mono text-xs font-semibold tracking-wide text-[var(--z-fg-muted,#a1a1aa)]"
              >
                {w}
              </span>
            ))}
          </div>

          <div className="relative overflow-hidden">
            <motion.div className="flex" style={{ x: trackX }}>
              {grids.map((g) => (
                <div key={g.index} className="grid w-full shrink-0 grid-cols-7 gap-y-1" aria-hidden={g.index !== monthIndex}>
                  {g.cells.map((cell, i) => {
                    const cellDisabled =
                      disabled || !cell.inMonth || isDateDisabled?.(cell.date) || slotsForDate(cell.date).length === 0
                    const isToday = sameDay(cell.date, today)
                    const isSelected = sameDay(cell.date, date)
                    return (
                      <div key={i} className="grid place-items-center py-0.5">
                        <button
                          type="button"
                          disabled={cellDisabled}
                          aria-current={isToday ? 'date' : undefined}
                          aria-pressed={isSelected}
                          aria-label={formatDate(cell.date)}
                          tabIndex={g.index === monthIndex ? 0 : -1}
                          onClick={() => pick(cell.date)}
                          className={zcn(
                            'grid size-9 place-items-center rounded-full text-sm tabular-nums transition-colors',
                            !cell.inMonth && 'text-[var(--z-fg-muted,#a1a1aa)]/30',
                            cell.inMonth &&
                              !cellDisabled &&
                              !isSelected &&
                              'text-[var(--z-fg,#e5e1e4)] hover:bg-white/10',
                            cellDisabled && cell.inMonth && 'text-[var(--z-fg-muted,#a1a1aa)]/40',
                            isSelected && 'bg-[var(--z-fg,#e5e1e4)] text-[var(--z-bg,#09090b)]',
                            'disabled:pointer-events-none',
                          )}
                        >
                          {cell.date.getDate()}
                        </button>
                        {isToday && !isSelected ? (
                          <span aria-hidden className="-mt-1.5 size-1 rounded-full bg-[var(--z-signal,#818cf8)]" />
                        ) : (
                          <span aria-hidden className="-mt-1.5 size-1" />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div
          className="flex max-h-72 w-full flex-col gap-1.5 overflow-y-auto p-3 sm:w-40"
          style={{ maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent)' }}
        >
          {slots.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-[var(--z-fg-muted,#a1a1aa)]">No times available</p>
          ) : (
            slots.map((s) => {
              const isSelected = s === slot
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  aria-pressed={isSelected}
                  onClick={() => setSlot(s)}
                  onPointerEnter={() => setHoveredSlot(s)}
                  onPointerLeave={() => setHoveredSlot((h) => (h === s ? null : h))}
                  onFocus={() => setHoveredSlot(s)}
                  onBlur={() => setHoveredSlot((h) => (h === s ? null : h))}
                  className={zcn(
                    'shrink-0 rounded-lg border px-4 py-2.5 text-center text-sm tabular-nums transition-colors',
                    isSelected
                      ? 'border-transparent bg-[var(--z-fg,#e5e1e4)] text-[var(--z-bg,#09090b)]'
                      : 'border-white/10 text-[var(--z-fg,#e5e1e4)] hover:border-[var(--z-signal,#818cf8)]',
                  )}
                >
                  {s}
                </button>
              )
            })
          )}
        </div>
      </div>

      <motion.div
        initial={false}
        animate={disabled ? 'browsing' : state}
        variants={barVariants}
        transition={transition}
        className="flex items-center gap-3 overflow-hidden border-t border-white/10 px-5"
      >
        <p className="min-w-0 flex-1 truncate text-sm text-[var(--z-fg,#e5e1e4)]">
          {state === 'committed' && slot ? (
            <>Your meeting is booked for {formatDate(activeDate)} at {slot}.</>
          ) : state === 'previewing' && previewSlot ? (
            <>{formatDate(activeDate)} at {previewSlot}?</>
          ) : null}
        </p>
        <button
          type="button"
          disabled={disabled || state !== 'committed' || !slot}
          onClick={() => slot && onConfirm?.(activeDate, slot)}
          className={zcn(
            'shrink-0 rounded-lg bg-[var(--z-fg,#e5e1e4)] px-4 py-2 text-sm font-medium text-[var(--z-bg,#09090b)] transition-opacity',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          Continue
        </button>
      </motion.div>
    </div>
  )
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d={dir === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
