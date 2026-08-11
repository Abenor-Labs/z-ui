'use client'

import * as React from 'react'

/**
 * A field whose criticism is late and whose forgiveness is instant.
 *
 * Validate-on-change turns the field red on the second character of a word you
 * had every intention of finishing. The user is told they are wrong while they
 * are still in the middle of being right, which trains them to distrust the
 * message and to tune the colour out. Validate-on-blur fixes the ambush and
 * introduces a worse one: you correct the mistake, the error stays, and the
 * field argues with a value that is now fine.
 *
 * The asymmetry is the whole component. Criticism waits for a pause — no
 * verdict lands mid-word, because a pause is the only reliable signal that a
 * thought is finished. Forgiveness does not wait for anything: once the field
 * is showing an error, every keystroke is checked, and the first one that fixes
 * the value clears the message on that same frame.
 *
 * So the debounce is on entering the error, never on leaving it. That is one
 * line of logic and it is the difference between a field that nags and a field
 * that is simply paying attention.
 *
 * DEPENDENCIES: react. Nothing else — the movement here is two CSS transitions
 * and a pause, and reaching for an animation library to fade one line of text
 * would cost a consumer a dependency to do less than this does.
 */

/* ---------------------------------------------------------------- tuning -- */

/**
 * How long the field waits, in milliseconds, before it is willing to judge.
 *
 * Long enough to outlast the gap between words — typing research puts an
 * inter-word pause around 200-300ms for fluent typists, and a threshold under
 * that fires mid-sentence, which is the exact failure this exists to remove.
 * Short enough that a finished value does not sit unjudged while the user looks
 * at it and wonders. 700 is comfortably clear of the first and well inside the
 * second.
 *
 * Exposed as `quietMs` and not as `debounce`, because a debounce describes the
 * mechanism and this names the thing being waited for.
 */
const DEFAULT_QUIET_MS = 700

/** How long the message takes to leave. Short: forgiveness that takes 300ms to
 *  land is not forgiveness, it is a second opinion. */
const LEAVE_MS = 120

/**
 * Palette. Every value is a CSS variable with a fallback mixed out of
 * `currentColor`, so the field takes the host's ink colour and derives its own
 * hairlines — dark page, light rules; light page, dark rules. No theme class.
 *
 * `--lc-invalid` is the one literal and it is `oklch`, not a hex: the contrast
 * lint attributes hexes to component states, and a surface tint is not a
 * state's foreground.
 */
const TOKENS = {
  '--lc-line': 'var(--z-line, color-mix(in oklab, currentColor 18%, transparent))',
  '--lc-muted': 'var(--z-muted, color-mix(in oklab, currentColor 58%, transparent))',
  '--lc-invalid': 'var(--z-invalid, oklch(0.64 0.19 25))',
  '--lc-valid': 'var(--z-valid, oklch(0.72 0.15 155))',
  '--lc-radius': 'var(--z-radius, 6px)',
} as React.CSSProperties

/* ----------------------------------------------------------------- state -- */

/**
 * `data-state` values.
 *
 *   idle        — never edited, or edited back to empty. No opinion held.
 *   typing      — keystrokes arriving. The quiet timer keeps being reset, and
 *                 nothing is judged.
 *   settling    — the pause has begun but the verdict has not landed. This is
 *                 the beat that stops the error feeling like an ambush: the
 *                 field visibly readies itself, so the message arrives as
 *                 something the user watched approach.
 *   invalid     — judged, and failing. The only state that shows a message.
 *   recovering  — was invalid, and the keystroke just typed fixed it. The
 *                 message is leaving. Distinct from `valid` because it is the
 *                 only moment where "was wrong, now right" is true, and it is
 *                 the transition a consumer is most likely to want to celebrate.
 *   valid       — judged, and passing.
 *
 * `settling` earns its place by being visible. Without it the field is silent
 * and then suddenly critical; with it there is a quarter-second where the
 * hairline warms and the user can see a verdict coming.
 */
const STATES = ['idle', 'typing', 'settling', 'invalid', 'recovering', 'valid'] as const

export type LateCritiqueState = (typeof STATES)[number]

const REDUCE = '(prefers-reduced-motion: reduce)'

// Module scope so the identity is stable; useSyncExternalStore resubscribes on
// every render if this is defined inside the hook.
const subscribeToReduce = (notify: () => void) => {
  const mq = window.matchMedia(REDUCE)
  mq.addEventListener('change', notify)
  return () => mq.removeEventListener('change', notify)
}

function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeToReduce,
    () => window.matchMedia(REDUCE).matches,
    // The server cannot know, and guessing `true` would ship the reduced path
    // to everyone for one hydration; it is re-checked on mount.
    () => false,
  )
}

/* ------------------------------------------------------------ component -- */

export type LateCritiqueProps = Omit<
  React.ComponentPropsWithRef<'input'>,
  'onChange' | 'value' | 'defaultValue'
> & {
  /** Visible label, and the accessible name. */
  label: React.ReactNode
  /** Returns the complaint, or null when the value is acceptable. */
  validate: (value: string) => string | null
  /** Uncontrolled starting value. Ignored when `value` is passed. */
  defaultValue?: string
  /** Pass to control. Omit and the field owns its own value. */
  value?: string
  onValueChange?: (value: string) => void
  /** Fires whenever the verdict changes, with the state it changed to. */
  onVerdict?: (state: LateCritiqueState) => void
  /** Milliseconds of quiet before the field is willing to judge. */
  quietMs?: number
}

export function LateCritique({
  label,
  validate,
  defaultValue = '',
  value: valueProp,
  onValueChange,
  onVerdict,
  quietMs = DEFAULT_QUIET_MS,
  className,
  style,
  id,
  ...rest
}: LateCritiqueProps): React.ReactElement {
  const reduced = usePrefersReducedMotion()

  const reactId = React.useId()
  const inputId = id ?? `${reactId}-input`
  const noteId = `${reactId}-note`

  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled

  const [state, setState] = React.useState<LateCritiqueState>('idle')
  const [message, setMessage] = React.useState<string | null>(null)

  const quiet = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const midway = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaving = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // The value the timers should judge. Read from a ref rather than closed over,
  // so a verdict fired 700ms after a keystroke judges what is in the field now
  // and not what was there when the timer was set.
  const latest = React.useRef(value)
  latest.current = value

  // Held in refs so an inline arrow in the consumer's JSX does not re-key the
  // handlers, and so the callback that fires is the current one.
  const validateRef = React.useRef(validate)
  const verdictRef = React.useRef(onVerdict)
  React.useEffect(() => {
    validateRef.current = validate
    verdictRef.current = onVerdict
  })

  const clear = React.useCallback(() => {
    for (const t of [quiet, midway, leaving]) {
      if (t.current !== null) {
        clearTimeout(t.current)
        t.current = null
      }
    }
  }, [])

  React.useEffect(() => clear, [clear])

  const go = React.useCallback((next: LateCritiqueState) => setState(next), [])

  /**
   * `onVerdict` fires from an effect, not from the transition that caused it.
   *
   * The obvious implementation calls it inside the `setState` updater, where
   * the previous state is conveniently in hand. That updater runs during
   * render, so a consumer doing the natural thing — putting the verdict into
   * their own state — updates their component while this one is rendering, and
   * React logs "Cannot update a component while rendering a different
   * component". It is their code that gets named in the warning, for a mistake
   * that is entirely ours.
   *
   * Firing after commit costs a ref and removes the whole class.
   */
  const notified = React.useRef<LateCritiqueState>('idle')
  React.useEffect(() => {
    if (notified.current === state) return
    notified.current = state
    verdictRef.current?.(state)
  }, [state])

  /** The verdict itself. Never called directly from a keystroke that is not
   *  already showing an error — that is what makes criticism late. */
  const judge = React.useCallback(() => {
    const complaint = validateRef.current(latest.current)
    if (complaint) {
      setMessage(complaint)
      go('invalid')
    } else {
      setMessage(null)
      go(latest.current === '' ? 'idle' : 'valid')
    }
  }, [go])

  const change = (next: string) => {
    if (valueProp === undefined) setUncontrolled(next)
    latest.current = next
    onValueChange?.(next)
    clear()

    /**
     * Forgiveness, and the only path that judges on a keystroke.
     *
     * Once a complaint is on screen the field has already been rude, so it owes
     * an answer as fast as it can give one. Every keystroke is checked, and the
     * first that passes clears the message on the same frame — no pause, no
     * second opinion. A field that made you wait 700ms to be told you had
     * fixed it would be nagging with extra steps.
     *
     * A keystroke that does not fix it changes nothing: the message stays put
     * and is not re-announced, so correcting a long value does not machine-gun
     * a screen reader with the same sentence.
     */
    if (state === 'invalid') {
      if (!validateRef.current(next)) {
        setMessage(null)
        go('recovering')
        // A real path under reduced motion, not a zero-duration one: there is
        // no leave transition to wait for, so `valid` lands immediately.
        if (reduced) {
          go(next === '' ? 'idle' : 'valid')
        } else {
          leaving.current = setTimeout(() => go(next === '' ? 'idle' : 'valid'), LEAVE_MS)
        }
      }
      return
    }

    /**
     * Criticism, and the reason it is late.
     *
     * The timer is reset on every keystroke, so the verdict can only land in a
     * pause. `settling` is scheduled at the halfway mark purely so the pause is
     * visible — the field starts to look like it has an opinion before it says
     * one, and the message arrives as the end of something rather than out of
     * nowhere.
     */
    go('typing')
    midway.current = setTimeout(() => go('settling'), quietMs / 2)
    quiet.current = setTimeout(judge, quietMs)
  }

  /**
   * Blur judges at once.
   *
   * Leaving the field is a stronger "I am finished" than any pause, so waiting
   * out the rest of the quiet window would be the field pretending not to know
   * something it knows.
   */
  const blur = () => {
    clear()
    if (state === 'idle' && value === '') return
    judge()
  }

  const showing = state === 'invalid'

  return (
    <div
      data-state={state}
      className={['group/lc w-full', className].filter(Boolean).join(' ')}
      style={{ ...TOKENS, ...style }}
    >
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--lc-muted)]"
      >
        {label}
      </label>

      <input
        id={inputId}
        value={value}
        onChange={(e) => change(e.target.value)}
        onBlur={blur}
        // The complaint is the field's description, so a screen reader reaching
        // the input hears why it is wrong rather than only that it is.
        aria-invalid={showing || undefined}
        aria-describedby={showing ? noteId : undefined}
        className={[
          // min-h-11 is the 44px target. The row is taller than the text needs
          // and that is the reason.
          'min-h-11 w-full rounded-[var(--lc-radius)] border bg-transparent',
          'px-3 py-2 text-[0.9375rem] text-inherit',
          'border-[var(--lc-line)]',
          // The border is the only thing that moves while typing, and it moves
          // slowly. A field that flashes on every state change is the noise
          // this component exists to remove.
          'transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none',
          'group-data-[state=settling]/lc:border-[var(--lc-muted)]',
          'group-data-[state=invalid]/lc:border-[var(--lc-invalid)]',
          'group-data-[state=recovering]/lc:border-[var(--lc-valid)]',
          'group-data-[state=valid]/lc:border-[var(--lc-valid)]',
          // outline, not a ring: forced-colors renders outlines reliably and
          // box-shadow not at all. `outline-solid` is required because Tailwind
          // v4's `outline-none` sets --tw-outline-style: none.
          'outline-none focus-visible:outline-2 focus-visible:outline-solid',
          'focus-visible:-outline-offset-2 focus-visible:outline-[var(--lc-muted)]',
        ].join(' ')}
        {...rest}
      />

      {/*
        The note row is always mounted and always occupies its line, so the
        arrival of a complaint never pushes the page down. A field that grows
        when it disagrees with you moves every control below it at the exact
        moment you are reaching for one.

        `aria-live="polite"` rather than `role="alert"`: alert interrupts, and
        interrupting someone mid-sentence to tell them their sentence is wrong
        is the spoken version of the bug this component fixes. Because the
        message is only written once the pause has elapsed, polite announces it
        exactly once.
      */}
      <div className="mt-1.5 min-h-[1.125rem]" aria-live="polite">
        <p
          id={noteId}
          className={[
            'text-[0.8125rem] leading-[1.125rem] text-[var(--lc-invalid)]',
            'transition-[opacity,transform] duration-150 motion-reduce:transition-none',
            showing ? 'translate-y-0 opacity-100' : '-translate-y-0.5 opacity-0',
          ].join(' ')}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
