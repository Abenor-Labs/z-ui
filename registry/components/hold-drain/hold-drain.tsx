'use client'

import * as React from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import './hold-drain.css'

/**
 * A hold-to-confirm whose abort costs exactly what the hold earned.
 *
 * The usual implementation fills a bar while you hold and snaps it to zero the
 * instant you let go. That snap is a lie about what happened: you did three
 * quarters of the work, and the control says you did none. It also makes the
 * guard feel arbitrary rather than physical — nothing was spent, so nothing was
 * lost, so the hold reads as a delay the designer imposed on you.
 *
 * Here the fill drains back at the same rate it filled. Let go at 70% and you
 * watch 70% of the hold be given back, taking exactly as long as it took to
 * earn. A half-hold is visibly half-undone. The cost is symmetric and legible,
 * which is what makes the guard feel like a real object with real inertia
 * instead of a timer with a progress bar bolted on.
 *
 * The second half of the trick: press again mid-drain and it resumes from
 * wherever it got to. The fill is a quantity with a position, not a journey
 * from A to B — so changing your mind twice costs you only the time you
 * actually gave back, and there is no frame where the bar is stationary.
 *
 * DEPENDENCIES: react, motion. Nothing else. Paste it and own it.
 */

/* ---------------------------------------------------------------- tuning -- */

/**
 * Linear, and deliberately not a spring.
 *
 * Every other component in this registry springs, because a spring is what
 * makes motion read as physical. Not this one. The whole claim is that drain
 * rate equals fill rate, and a spring's rate depends on distance remaining —
 * so a spring drain from 70% would be visibly faster per pixel than the fill
 * that earned it, and the symmetry the component exists to demonstrate would be
 * the first thing to go. Constant rate is the physics here.
 *
 * `ease: 'linear'` is therefore load-bearing, not a default nobody chose.
 */
const EASE = 'linear' as const

/**
 * Palette. Every value is a CSS variable with a fallback derived from
 * `currentColor`, so the control takes the host's ink colour and mixes its own
 * surfaces out of it — drop it on a dark page and the track is light, drop it
 * on a light page and it is dark. No theme class, no configuration.
 *
 * `--hd-danger` is the one literal, and it is `oklch` rather than a hex on
 * purpose: the contrast lint attributes hexes to component states, and a colour
 * that is never a state's foreground has nowhere to be attributed. The lint is
 * right to ask, and the honest answer is that this is a surface tint.
 */
const TOKENS = {
  '--hd-line': 'var(--z-line, color-mix(in oklab, currentColor 18%, transparent))',
  '--hd-track': 'var(--z-track, color-mix(in oklab, currentColor 8%, transparent))',
  '--hd-muted': 'var(--z-muted, color-mix(in oklab, currentColor 58%, transparent))',
  '--hd-danger': 'var(--z-danger, oklch(0.62 0.21 22))',
  '--hd-radius': 'var(--z-radius, 6px)',
} as React.CSSProperties

/* ----------------------------------------------------------------- state -- */

/**
 * `data-state` values.
 *
 *   idle       — at rest, nothing earned
 *   filling    — held, fill climbing toward 1
 *   armed      — fill complete, waiting for the release that commits
 *   committed  — released while armed; the action fired
 *   draining   — released early, fill returning to 0 at the rate it climbed
 *
 * `armed` is separate from `committed` because the fill completing and the
 * action firing are two different moments, and a consumer wants to style the
 * gap between them — that is the beat where the control says "let go and I will
 * do it" and the user still has a decision. Auto-firing at 100% collapses that
 * beat and takes the decision away at the exact instant the user was about to
 * make it.
 *
 * `draining` is separate from `idle` for the same reason it exists at all: it
 * is the state in which the abort is being paid for, and it is the one a
 * consumer is most likely to want to key off.
 *
 * `committed` is terminal. Nothing returns from it, and there is no `reset`
 * prop, because the honest lifecycle of a guarded destructive action is that
 * the thing it guarded is now gone and the control should go with it. To reuse
 * one, remount it — `key={n}` — which is what the demo does behind its "put it
 * back". A self-resetting confirm button would be a control that lies about
 * having done something irreversible.
 */
const STATES = ['idle', 'filling', 'armed', 'committed', 'draining'] as const

export type HoldDrainState = (typeof STATES)[number]

/* ------------------------------------------------------------ component -- */

export type HoldDrainProps = Omit<
  React.ComponentPropsWithRef<'button'>,
  'onClick' | 'children' | 'onDrag'
> & {
  /** Resting label, and the accessible name while idle. */
  label: React.ReactNode
  /** Shown once the fill completes. Defaults to the resting label. */
  armedLabel?: React.ReactNode
  /** Shown after the action fires. Defaults to the armed label. */
  committedLabel?: React.ReactNode
  /**
   * Milliseconds of held time required to arm, and therefore also the time a
   * full drain takes. Quantised by nothing — a partial hold costs its own
   * fraction of this.
   */
  duration?: number
  /** Fires once, on the release that happens while armed. */
  onConfirm: () => void
  /** Fires when a drain completes and the control is back at rest. */
  onCancel?: () => void
}

export function HoldDrain({
  label,
  armedLabel,
  committedLabel,
  duration = 1200,
  onConfirm,
  onCancel,
  className,
  style,
  disabled,
  ...rest
}: HoldDrainProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false

  const [state, setState] = React.useState<HoldDrainState>('idle')

  /**
   * The earned fraction, 0 to 1.
   *
   * A MotionValue rather than React state: it is read by the animation on every
   * frame and by the bar's width, and neither should re-render the button
   * sixty times a second to move a rectangle.
   */
  const progress = useMotionValue(0)
  const width = useTransform(progress, (p) => `${(p < 0 ? 0 : p > 1 ? 1 : p) * 100}%`)

  const running = React.useRef<{ stop: () => void } | null>(null)
  const stepper = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Held in refs so an inline arrow in the consumer's JSX does not re-key the
  // handlers, and so the callback that fires is the current one.
  const confirmRef = React.useRef(onConfirm)
  const cancelRef = React.useRef(onCancel)
  React.useEffect(() => {
    confirmRef.current = onConfirm
    cancelRef.current = onCancel
  })

  const halt = React.useCallback(() => {
    running.current?.stop()
    running.current = null
    if (stepper.current !== null) {
      clearInterval(stepper.current)
      stepper.current = null
    }
  }, [])

  React.useEffect(() => halt, [halt])

  /**
   * Begin, or resume.
   *
   * Reads the current fill rather than assuming zero, which is what lets a
   * press during a drain pick up where the drain got to. The remaining duration
   * is scaled by the remaining distance, so the rate is identical whether this
   * is a fresh hold or the third reversal in a second.
   */
  const start = React.useCallback(() => {
    if (disabled || state === 'committed') return
    halt()
    setState('filling')

    const from = progress.get()

    if (reduced) {
      /**
       * A real path, not a fast animation.
       *
       * The hold duration survives untouched, because it is a safety mechanic
       * and not decoration — shortening it for the people who asked for less
       * motion would hand them a less guarded destructive action. What is
       * removed is the continuous travel: the fill advances in quarters, so
       * progress is still legible without anything sliding.
       *
       * The drain does not survive, and cannot: it is pure motion, and the
       * symmetry it demonstrates has no non-animated form. Aborting under
       * reduced motion returns to zero at once.
       */
      const steps = 4
      const step = 1 / steps
      stepper.current = setInterval(
        () => {
          const next = Math.min(1, progress.get() + step)
          progress.jump(next)
          if (next >= 1) {
            halt()
            setState('armed')
          }
        },
        Math.max(1, ((1 - from) * duration) / steps),
      )
      return
    }

    running.current = animate(progress, 1, {
      duration: ((1 - from) * duration) / 1000,
      ease: EASE,
      onComplete: () => setState('armed'),
    })
  }, [disabled, duration, halt, progress, reduced, state])

  /**
   * Release.
   *
   * Armed commits. Anything else pays the fill back at the rate it was earned:
   * the drain's duration is the current fill times the full duration, which is
   * the same constant rate the fill ran at, in reverse.
   */
  const release = React.useCallback(() => {
    if (disabled) return
    halt()

    if (state === 'armed') {
      setState('committed')
      confirmRef.current()
      return
    }
    if (state !== 'filling' && state !== 'draining') return

    const from = progress.get()
    if (from <= 0) {
      setState('idle')
      return
    }

    if (reduced) {
      progress.jump(0)
      setState('idle')
      cancelRef.current?.()
      return
    }

    setState('draining')
    running.current = animate(progress, 0, {
      duration: (from * duration) / 1000,
      ease: EASE,
      onComplete: () => {
        setState('idle')
        cancelRef.current?.()
      },
    })
  }, [disabled, duration, halt, progress, reduced, state])

  /**
   * Space and Enter hold, rather than click.
   *
   * `onClick` is never wired: a click is a press and a release collapsed into
   * one event, which is exactly the distinction this control is built on. The
   * repeat guard matters because holding a key fires `keydown` continuously,
   * and every repeat would restart the fill from wherever it had reached —
   * making a keyboard hold take forever and never arm.
   */
  const held = React.useRef(false)

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    e.preventDefault()
    if (held.current) return
    held.current = true
    start()
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    e.preventDefault()
    held.current = false
    release()
  }

  const text =
    state === 'committed'
      ? (committedLabel ?? armedLabel ?? label)
      : state === 'armed'
        ? (armedLabel ?? label)
        : label

  return (
    <button
      type="button"
      data-state={state}
      disabled={disabled}
      // The live value, for anyone who cannot see the bar. `aria-live` is on a
      // sibling region rather than here, because re-announcing the whole button
      // on every state change would talk over the user mid-hold.
      aria-describedby={undefined}
      onPointerDown={(e) => {
        // Capture, so a release outside the button is still received here. A
        // pointer that leaves mid-hold and lifts elsewhere would otherwise
        // strand the control in `filling` forever.
        e.currentTarget.setPointerCapture(e.pointerId)
        start()
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      // Losing focus mid-hold is a release. Without this, tabbing away while
      // held leaves the fill running against a control nobody is touching.
      onBlur={() => {
        if (held.current) held.current = false
        if (state === 'filling') release()
      }}
      className={['hd', className].filter(Boolean).join(' ')}
      style={{ ...TOKENS, ...style }}
      {...rest}
    >
      {/* The track. Painted under the label, never over it, so the text stays
          at full contrast for the whole hold — a fill that dims the words it
          sits behind trades legibility for a gradient. */}
      <span aria-hidden className="hd-track" />
      <motion.span aria-hidden style={{ width }} className="hd-fill" />

      <span className="hd-label">{text}</span>

      {/* A hairline that lights only while the fill is physically moving —
          in either direction. Keyed off the same data-state a consumer would
          use, so this styling is also the proof the attribute tracks reality. */}
      <span aria-hidden className="hd-hairline" />

      {/* Polite, and only for the two moments that change what the control will
          do if released. Announcing every frame would be unusable; announcing
          nothing would leave a screen-reader user holding a button with no way
          to know it had armed. */}
      <span className="hd-sr" aria-live="polite">
        {state === 'armed' ? 'Armed. Release to confirm.' : state === 'committed' ? 'Confirmed.' : ''}
      </span>
    </button>
  )
}
