'use client'

import * as React from 'react'

/**
 * Text that decodes out of noise.
 *
 * This is the one item in the set with no runtime dependency on `motion`, and
 * it is not a spring in disguise. There is no continuous quantity here to
 * integrate — a glyph is either its true character or a random one — so a
 * spring would have nothing to act on and a duration-plus-easing curve would
 * have nothing to interpolate. What actually moves is a boundary walking along
 * a string, one glyph per tick. That is a timer, so this ships as a timer.
 *
 * The mechanic in full: a decode head advances one index per tick. Everything
 * more than HEAD_LAG ticks behind the head is settled and never changes again.
 * Everything at or ahead of the head re-randomises with probability `chance`
 * and otherwise shows its true glyph, which is why the word flashes legible
 * before it resolves instead of snapping from noise to answer.
 */

/**
 * `data-state` values.
 *
 * Not a motion state machine — a decode has three rests and consumers style the
 * middle one (dim it, tint it, hang a caret off it) far more often than either
 * end. `idle` and `settled` are deliberately distinct: "has not run yet" and
 * "has finished" render the same string but mean opposite things to a page that
 * is sequencing several of these.
 */
const STATES = ['idle', 'scrambling', 'settled'] as const

export type ScrambleState = (typeof STATES)[number]

/**
 * The pools the effect draws from. `symbols` reads as corruption, `hex` as a
 * memory dump, `binary` as a wire. They are exported because a consumer
 * choosing a pool by name should not have to retype sixteen characters and get
 * one of them wrong.
 */
export const SCRAMBLE_SETS = {
  symbols: '!<>-_/[]{}=+*^?#',
  hex: '0123456789abcdef',
  binary: '01',
} as const

export type ScrambleSetName = keyof typeof SCRAMBLE_SETS

/** Ticks the settle boundary trails the decode head by — the randomness window. */
const HEAD_LAG = 6
/** Below this a tick is shorter than a display frame and the flicker just reads as grey. */
const MIN_TICK = 24

/**
 * How many ticks a run actually takes, which is what `duration` has to be
 * divided by if it is to mean what the prop says it means.
 *
 * Frame 1 is painted at t=0 with head=1, and the last interval fires when
 * `head - HEAD_LAG` first reaches the end — head = length + HEAD_LAG, at
 * t = (length + HEAD_LAG - 1) ticks. Derived from HEAD_LAG rather than carried
 * as its own constant: the two are the same fact, and a hand-picked slack drifts
 * the moment the trailing window is retuned.
 */
const ticksFor = (length: number) => length + HEAD_LAG - 1

export type ScrambleTrigger = 'hover' | 'load' | 'view'
export type ScrambleEase = 'out' | 'in-out' | 'snap'

export type UseScrambleOptions = {
  /** The real string. It is also the accessible name, and the box the effect is painted into. */
  text: string
  /** Total decode time in ms. Quantised to a whole number of ticks, floored at 24ms each. */
  duration?: number
  /**
   * Carried, not applied. In the source design this names the order glyphs
   * settle in; nothing in this implementation interpolates, so there is no
   * curve for it to drive. It rides through to `data-ease` so a consumer can
   * key off it, and it is in the API because removing it would silently change
   * the meaning of snippets that already pass it. It does not currently alter a
   * single frame, and pretending otherwise would be the easiest lie in the file.
   */
  ease?: ScrambleEase
  /** Probability, 0 to 1, that an unsettled glyph re-randomises on a given tick. */
  chance?: number
  /** Pool to draw random glyphs from. */
  chars?: string
  /** What starts the decode. `hover` and `view` need `ref` attached. */
  trigger?: ScrambleTrigger
  /** Gates the *trigger* only. `run()` is imperative and always runs, so a replay button still works. */
  playOnce?: boolean
  /** Fires once per completed run, including the reduced-motion path. */
  onComplete?: () => void
}

export type UseScrambleResult<T extends HTMLElement = HTMLElement> = {
  /** The current output. Equal to `text` before the first run and after the last. */
  text: string
  running: boolean
  /** Restart the decode from the first frame, cancelling any run in flight. */
  run: () => void
  state: ScrambleState
  ref: React.RefObject<T | null>
}

/**
 * One frame, taken from the source design's `run()` so the sequence matches
 * glyph for glyph. `charAt` rather than indexing because `noUncheckedIndexedAccess`
 * would otherwise widen every branch to `string | undefined` for a read that
 * cannot miss.
 */
function frame(target: string, head: number, pool: string, chance: number): string {
  let out = ''
  for (let i = 0; i < target.length; i++) {
    const glyph = target.charAt(i)
    if (i < head - HEAD_LAG) out += glyph
    // Spaces never scramble. Word boundaries are the only structure the reader
    // has while the glyphs are noise; scrambling them turns a decoding phrase
    // into an undifferentiated block.
    else if (glyph === ' ') out += ' '
    else if (Math.random() < chance) out += pool.charAt(Math.floor(Math.random() * pool.length))
    else out += glyph
  }
  return out
}

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
    // The server cannot know, and guessing `true` would ship a static string to
    // everyone for one hydration; the reduced path is re-checked on mount.
    () => false,
  )
}

export function useScramble<T extends HTMLElement = HTMLElement>({
  text,
  duration = 620,
  chance = 0.86,
  chars = SCRAMBLE_SETS.symbols,
  trigger = 'hover',
  playOnce = true,
  onComplete,
}: UseScrambleOptions): UseScrambleResult<T> {
  const ref = React.useRef<T>(null)
  const timer = React.useRef<number | null>(null)
  const played = React.useRef(false)
  const [out, setOut] = React.useState(text)
  const [state, setState] = React.useState<ScrambleState>('idle')

  const reduced = usePrefersReducedMotion()

  // Held in a ref so a consumer's inline arrow does not re-key the interval,
  // and so the callback that fires is the one that was current when the run
  // finished rather than when it started.
  const complete = React.useRef(onComplete)
  React.useEffect(() => {
    complete.current = onComplete
  })

  const stop = React.useCallback(() => {
    if (timer.current === null) return
    clearInterval(timer.current)
    timer.current = null
  }, [])

  const run = React.useCallback(() => {
    stop()
    played.current = true

    const settle = () => {
      setOut(text)
      setState('settled')
      complete.current?.()
    }

    // A real path, not a zero-duration animation: under `reduce` no interval is
    // ever created, so there is nothing to schedule, throttle or tear down.
    // `onComplete` still fires, because a page sequencing reveals off it would
    // otherwise stall forever for exactly the users who asked for less motion.
    if (reduced || text.length === 0) {
      settle()
      return
    }

    // An empty pool would concatenate '' for every glyph and silently erase the
    // string, so fall back rather than render nothing.
    const pool = chars.length > 0 ? chars : SCRAMBLE_SETS.symbols
    const p = chance < 0 ? 0 : chance > 1 ? 1 : chance
    const tick = Math.max(MIN_TICK, Math.round(duration / ticksFor(text.length)))

    let head = 1
    setState('scrambling')
    // Frame 1 is painted synchronously rather than one tick later. The frame
    // sequence is identical to the design's — the whole schedule simply starts
    // at t=0 instead of t=tick — but on `load` and `view` it removes a tick of
    // the finished string being legible before it scrambles, which gives the
    // answer away.
    setOut(frame(text, head, pool, p))

    // One interval for the whole string. Per-glyph timers would be N timers
    // drifting against each other, and the head only advances once per tick
    // anyway, so there is nothing for the extra ones to do.
    timer.current = window.setInterval(() => {
      head++
      // The design builds the final frame and then throws it away for TARGET;
      // short-circuiting produces the same output without the wasted pass.
      if (head - HEAD_LAG >= text.length) {
        stop()
        settle()
        return
      }
      setOut(frame(text, head, pool, p))
    }, tick)
  }, [chance, chars, duration, reduced, stop, text])

  const runRef = React.useRef(run)
  React.useEffect(() => {
    runRef.current = run
  })

  // A new target abandons whatever is mid-decode: the old head index means
  // nothing against a different string. Resetting `played` lets the trigger
  // arm again, so changing the text of a `playOnce` reveal reveals the new one.
  React.useEffect(() => {
    stop()
    played.current = false
    setOut(text)
    setState('idle')
  }, [stop, text])

  // Turning the preference on mid-run has to land immediately. Waiting for the
  // interval to finish would honour the setting only for people who set it
  // before the page loaded.
  React.useEffect(() => {
    if (!reduced || timer.current === null) return
    stop()
    setOut(text)
    setState('settled')
    complete.current?.()
  }, [reduced, stop, text])

  React.useEffect(() => {
    const gate = () => {
      if (playOnce && played.current) return
      runRef.current()
    }

    if (trigger === 'load') {
      gate()
      return
    }

    const el = ref.current
    if (!el) return

    if (trigger === 'hover') {
      // pointerenter, not mouseenter: it covers pen and the hover-capable
      // touch cases too, and unlike pointerover it does not re-fire as the
      // pointer crosses child elements.
      el.addEventListener('pointerenter', gate)
      return () => el.removeEventListener('pointerenter', gate)
    }

    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      // Disconnect before running: a re-entry while the decode is still on
      // screen would otherwise queue a second gate call for a repeat run.
      io.disconnect()
      gate()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [playOnce, text, trigger])

  // Declared last so it is the last cleanup to run on unmount, after the
  // trigger listeners are gone and nothing can schedule a new interval.
  React.useEffect(() => stop, [stop])

  return { text: out, running: state === 'scrambling', run, state, ref }
}

/**
 * The no-reflow stack.
 *
 * `ghost` is the real string, in flow, invisible, and inert. It alone sizes the
 * box, so the box is the size of the answer from the first frame. `paint` is
 * the animating text, absolutely positioned into the same grid area — out of
 * flow, so however wide a run of random glyphs happens to be it can never
 * feed back into the track and move anything. That is the part a plain grid
 * stack gets wrong: two in-flow items in one cell size the cell to the *wider*
 * of the two, which is the scrambled one, in any proportional face.
 *
 * `white-space: pre` on the root, inherited by both layers, keeps the two
 * measuring the same way and keeps the algorithm's spaces from collapsing. The
 * cost is honest: this is a single-line effect. A wrapped target would have the
 * ghost and the paint breaking at different indices in a proportional font.
 */
const GHOST: React.CSSProperties = { gridArea: '1 / 1', visibility: 'hidden' }
const PAINT: React.CSSProperties = { gridArea: '1 / 1', position: 'absolute', top: 0, left: 0 }

/**
 * The accessible name, and the only node in here a screen reader sees.
 *
 * `aria-label` on the root would be the shorter spelling and it does not work:
 * `span`, `div` and `p` map to the generic role, which prohibits naming, so the
 * label is dropped by most AT. A visually hidden text node is the one technique
 * that names all five of the tags `as` accepts. It carries the final string and
 * never changes, so the name cannot stutter as the glyphs churn — the failure
 * mode this replaces is a reader announcing forty frames of `!<>-_`.
 *
 * `user-select: none` so a copy of the visible line yields the line once.
 */
const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
  userSelect: 'none',
}

export type ScrambleRevealProps = UseScrambleOptions & {
  as?: 'span' | 'h1' | 'h2' | 'p' | 'div'
  className?: string
}

export function ScrambleReveal({
  as = 'span',
  className,
  ...options
}: ScrambleRevealProps): React.ReactElement {
  const { text, state, ref } = useScramble(options)

  // Widening to ElementType is what lets one ref serve five tags. A union of
  // intrinsic elements resolves `ref` to an intersection no single element
  // instance satisfies, and the alternative is five near-identical JSX branches.
  const Tag = as as React.ElementType

  return (
    <Tag
      ref={ref}
      data-state={state}
      data-ease={options.ease ?? 'out'}
      className={className}
      style={{
        position: 'relative',
        display: as === 'span' ? 'inline-grid' : 'grid',
        whiteSpace: 'pre',
      }}
    >
      <span aria-hidden="true" style={GHOST}>
        {options.text}
      </span>
      <span aria-hidden="true" style={PAINT}>
        {text}
      </span>
      <span style={SR_ONLY}>{options.text}</span>
    </Tag>
  )
}
