'use client'

import * as React from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import './disclosure.css'

/**
 * A disclosure whose height is a spring, and whose spring can be interrupted.
 *
 * The obvious implementation is `height: auto` under a CSS transition, or
 * `animate={{ height: open ? 'auto' : 0 }}`. Both are wrong in the same way:
 * they describe a journey from A to B. Press the trigger halfway through an
 * open and a journey has to be thrown away and a new one planned from wherever
 * it got to, at rest. The panel stalls for a frame, then crawls back at the
 * speed of a fresh animation rather than the speed it was already moving.
 *
 * What this file does instead is treat height as a physical quantity with a
 * position and a velocity that persist independently of any animation. A
 * reversal mid-flight is not a new journey; it is the same mass with the sign
 * of the force flipped. It keeps its speed through the turn.
 *
 * That is the whole trick, and it is four lines (see `animate` below). The rest
 * of the file is the things that break once height stops being `auto`:
 * measurement, clipping, reflow, focus, and the reduced-motion path.
 *
 * DEPENDENCIES: react, motion. Nothing else. Paste it and own it.
 */

/* ---------------------------------------------------------------- tuning -- */

/**
 * The spring. Edit these three numbers; everything else follows.
 *
 * Critical damping for stiffness 520 / mass 1 is 2*sqrt(520) ≈ 45.6, so this is
 * sitting a hair above critical. That is deliberate: drop `damping` and the
 * open overshoots, and because the content is anchored to the top of the panel
 * an overshoot on height is not a bounce, it is a gap opening under the last
 * line and closing again. Bounce that reads as delightful on an X translation
 * reads as a rendering bug here. Raise `stiffness` for a snappier panel; the
 * two move together, so retune `damping` to ~2*sqrt(stiffness) when you do.
 *
 * `restDelta` and `restSpeed` are in pixels and pixels/second, because that is
 * what this spring animates. Motion's defaults are tuned for 0-to-1 progress
 * values and are far too tight for a 300px height — they keep the animation
 * technically alive long after it is visually finished, and `data-state` and
 * the completion callback both wait on that.
 *
 * These two are a measured trade, not a guess. Tighter thresholds mean a
 * smaller final snap to the exact target but a longer dead tail where nothing
 * moves and the state still says `opening`; looser means the reverse. At
 * 2px/20px-per-second the panel jumps ~1px on its last frame (invisible
 * against a hairline) and the state lands within about one frame of the
 * motion stopping. At Motion's kind of defaults the tail was 30-40ms.
 */
const SPRING = {
  type: 'spring',
  stiffness: 520,
  damping: 46,
  mass: 1,
  restDelta: 2,
  restSpeed: 20,
} as const

/**
 * Palette. Every value is a CSS variable with a fallback, and every fallback is
 * derived from `currentColor` rather than written as a hex, so the component
 * takes the host's ink colour and mixes its own hairlines out of it. Drop it on
 * a dark page and the rules are light; drop it on a light page and they are
 * dark. No theme class, no media query, no configuration.
 *
 * The accent is the one literal colour, and it appears on exactly two things:
 * the focus ring, and the chevron while the panel is physically in motion. A
 * panel that is merely open is not accented — open is a resting state, and the
 * accent is reserved for what is live.
 */
const TOKENS = {
  '--dsc-line': 'var(--z-line, color-mix(in oklab, currentColor 18%, transparent))',
  '--dsc-hover': 'var(--z-hover, color-mix(in oklab, currentColor 7%, transparent))',
  '--dsc-muted': 'var(--z-muted, color-mix(in oklab, currentColor 58%, transparent))',
  '--dsc-accent': 'var(--z-accent, oklch(0.53 0.17 45))',
  '--dsc-radius': 'var(--z-radius, 4px)',
} as React.CSSProperties

/* ----------------------------------------------------------------- state -- */

/**
 * `data-state` values.
 *
 *   closed   — at rest, height 0, content out of the a11y tree
 *   opening  — spring running toward the content height
 *   open     — at rest, height equals content height, clipping released
 *   closing  — spring running toward 0
 *
 * The two moving states are separate rather than one `animating` because the
 * direction is the only thing a consumer ever wants to key off: fading a
 * shadow in on the way out, holding a sibling open until this one has left.
 *
 * Both halves come from the same two facts — `open`, which is what sets the
 * spring's target, and `settled`, which is set by the spring itself finishing.
 * Neither is a timer running alongside the animation and guessing when it is
 * done, so the attribute cannot drift: halt the spring and `settled` never
 * flips.
 *
 * One honest gap, measured rather than assumed. `settled` rides Motion's
 * completion callback, and that callback lands about a frame after the frame
 * that painted the final height — so `opening` outlives the last moving pixel
 * by roughly 15ms at the tuning below. React is not the cause; it commits in
 * the same frame the callback fires. See SPRING for the trade that sets it.
 */
const STATES = ['closed', 'opening', 'open', 'closing'] as const

export type DisclosureState = (typeof STATES)[number]

/**
 * Measurement has to happen before paint or a `defaultOpen` panel renders at
 * height 0 for one frame. On the server there is no paint and no layout, so
 * fall back rather than trip React's useLayoutEffect warning.
 */
const useIsoLayoutEffect = typeof document === 'undefined' ? React.useEffect : React.useLayoutEffect

/* ------------------------------------------------------------ component -- */

export type DisclosureProps = Omit<React.ComponentPropsWithRef<'div'>, 'children' | 'onChange'> & {
  /** The trigger's visible text, and its accessible name. */
  label: React.ReactNode
  children: React.ReactNode
  /** Uncontrolled starting state. Ignored when `open` is passed. */
  defaultOpen?: boolean
  /** Pass to control. Omit and the component owns its own state. */
  open?: boolean
  /** Fires the instant the trigger is used, before anything moves. */
  onOpenChange?: (open: boolean) => void
  /**
   * Fires when the panel has physically stopped, with the state it stopped in.
   * Also fires on the reduced-motion path, where "stopped" is immediate.
   * Does not fire when a transition is interrupted — the interrupting
   * transition's own completion is the one that reports.
   */
  onOpenChangeComplete?: (open: boolean) => void
}

export function Disclosure({
  label,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  onOpenChangeComplete,
  className,
  style,
  // `ref` rides through in `rest` onto the root div — React 19 passes it as an
  // ordinary prop, so there is nothing here to forward by hand.
  ...rest
}: DisclosureProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false

  const reactId = React.useId()
  const triggerId = `${reactId}-trigger`
  const panelId = `${reactId}-panel`

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen

  // Set only by the spring completing, or by the reduced-motion path standing
  // in for it. Never by a timeout.
  const [settled, setSettled] = React.useState(true)

  const state: DisclosureState = open
    ? settled
      ? 'open'
      : 'opening'
    : settled
      ? 'closed'
      : 'closing'

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  /**
   * The measured content height, kept twice on purpose.
   *
   * The state copy exists to re-render and re-run the reflow effect. The ref
   * copy exists because the animation effect and the chevron's transform both
   * need the *current* height at the moment they run, and neither of them
   * should re-subscribe or restart just because the number changed. Writing
   * both in one place is what keeps them from disagreeing.
   */
  const contentHeightRef = React.useRef(0)
  const [contentHeight, setContentHeight] = React.useState(0)

  const height = useMotionValue(0)

  /**
   * A spring aimed at 0 can undershoot past it, and a negative height is not a
   * value CSS has an opinion about — Chrome clamps, others have historically
   * not. Clamping here rather than stiffening the spring keeps the physics
   * intact: the value model still swings below zero and carries that velocity
   * back out if the panel is reopened mid-close, it just is not painted there.
   */
  const paintedHeight = useTransform(height, (h) => (h < 0 ? 0 : h))

  /**
   * The chevron is driven by the spring, not by `open`.
   *
   * A CSS transition on the icon would be the obvious thing and it would be
   * visibly wrong the first time someone interrupts: the panel reverses at 60%
   * and the arrow, on its own fixed-duration clock, keeps going to 100% before
   * turning around. Reading the height back out means there is one moving part
   * in this component and the arrow is a view of it.
   *
   * It reads the ref rather than closing over the state so it cannot serve a
   * stale full-height after a reflow.
   */
  const rotate = useTransform(paintedHeight, (h) => {
    const full = contentHeightRef.current
    if (full <= 0) return 0
    const progress = h / full
    return (progress > 1 ? 1 : progress) * 90
  })

  // Held in a ref so an inline arrow in the consumer's JSX does not re-key the
  // animation effect, and so the callback that fires is the current one.
  const completeRef = React.useRef(onOpenChangeComplete)
  React.useEffect(() => {
    completeRef.current = onOpenChangeComplete
  })

  /** True whenever no spring is running. Mirrors `settled` for effect use. */
  const atRestRef = React.useRef(true)
  const startedRef = React.useRef(false)
  /** The `open` the animation effect last acted on, so it can tell a real
   *  toggle from a re-run that changed nothing. */
  const lastOpenRef = React.useRef(open)

  /**
   * Measurement.
   *
   * `getBoundingClientRect().height`, not `offsetHeight`: the latter rounds to
   * whole pixels, and rounding a 300.6px panel down to 300 clips the descenders
   * off the last line for as long as it is open.
   *
   * Declared first so it runs before the animation effect on mount, which is
   * what lets a `defaultOpen` panel jump straight to a real height instead of
   * flashing collapsed for a frame.
   */
  useIsoLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return

    const measure = () => {
      const next = el.getBoundingClientRect().height
      contentHeightRef.current = next
      setContentHeight(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /**
   * The animation. This is the file.
   */
  useIsoLayoutEffect(() => {
    const target = open ? contentHeightRef.current : 0

    const settle = () => {
      atRestRef.current = true
      setSettled(true)
      completeRef.current?.(open)
    }

    // First commit. `defaultOpen` is a starting position, not an interaction,
    // so nothing animates and nothing reports a completed transition.
    if (!startedRef.current) {
      startedRef.current = true
      lastOpenRef.current = open
      height.jump(target)
      return
    }

    // Re-run that did not change the direction of travel, and nothing is in
    // flight to correct: React StrictMode's double-invoke, a `reduced` change
    // while at rest. Bail before touching the value, or a mounted-and-closed
    // panel would spend a frame in `closing` on every dev-mode remount.
    if (atRestRef.current && lastOpenRef.current === open) return
    lastOpenRef.current = open

    // Closing while focus is inside the panel would otherwise drop focus to
    // <body> the moment `inert` lands, losing the user's place in the document.
    // Only pulled back when it was actually in there — a consumer closing this
    // programmatically from elsewhere on the page keeps its own focus.
    if (!open && contentRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus()
    }

    if (reduced) {
      /**
       * A real path, not a zero-duration spring. No animation object is
       * created, so there is nothing to interrupt and nothing to carry — the
       * height simply is the new height on the next paint, `data-state` goes
       * straight from `closed` to `open` with no intermediate, and the chevron
       * lands rotated because it is derived from the same value.
       *
       * `settle()` still runs, so `onOpenChangeComplete` still fires. A page
       * that sequences off it would otherwise hang forever for precisely the
       * people who asked for less motion.
       */
      height.jump(target)
      settle()
      return
    }

    atRestRef.current = false
    setSettled(false)

    /**
     * The interruption contract, in one call.
     *
     * Velocity belongs to the MotionValue, not to the animation driving it —
     * it is computed from the value's own last two frames. So when the cleanup
     * below stops a half-finished open, the speed the panel was travelling at
     * survives the stop, and this `animate` picks it up as the new spring's
     * initial velocity (motion's default for springs is exactly that).
     *
     * The result is that a reversal is continuous. Nothing queues behind
     * anything, nothing restarts from zero, and there is no frame where the
     * panel is stationary. Press it four times in half a second and you are
     * pushing a real object around.
     */
    const controls = animate(height, target, { ...SPRING, onComplete: settle })
    return () => controls.stop()
  }, [height, open, reduced])

  /**
   * Reflow while open — a window resize, a font loading, children changing.
   *
   * This is a `jump`, not an animation, and that is the point: springing here
   * would animate the panel on every frame of a window drag. It defers
   * entirely whenever a spring is running, because during a transition the
   * spring owns the value and this effect would fight it for control.
   */
  useIsoLayoutEffect(() => {
    if (!atRestRef.current || !open) return
    height.jump(contentHeight)
  }, [contentHeight, height, open])

  const toggle = () => {
    const next = !open
    if (openProp === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <div
      data-state={state}
      // The border lives on the root, not the trigger, so the whole thing is
      // one box that grows rather than a button with text falling out below it.
      className={['dsc', className].filter(Boolean).join(' ')}
      style={{ ...TOKENS, ...style }}
      {...rest}
    >
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        // The only two attributes that make this a disclosure to a screen
        // reader. `aria-expanded` is on the trigger, never on the panel.
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="dsc-trigger"
      >
        <span>{label}</span>

        {/* Fixed 16px box so the row's height never depends on the icon.
            Accent is on while the panel is physically moving, and off the
            instant it stops — in either direction. Keyed off the same
            data-state a consumer would use, so this styling is also the
            proof that the attribute tracks reality. */}
        <motion.span
          aria-hidden="true"
          style={{ rotate }}
          className="dsc-chevron"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
            <path
              d="M6 3.5 10.5 8 6 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      </button>

      <motion.div
        id={panelId}
        // `inert` the moment the panel is heading closed, not when it arrives:
        // tabbing into something that is on its way out is worse than losing a
        // few hundred milliseconds of reachability. It also removes the subtree
        // from the a11y tree, which is why there is no separate aria-hidden.
        inert={!open}
        style={{
          height: paintedHeight,
          // Layout is preserved (that is what keeps ResizeObserver reporting a
          // real height while closed) but the content is taken out of find-in-
          // page and out of the a11y tree completely. `display: none` would do
          // the second thing and destroy the first.
          visibility: state === 'closed' ? 'hidden' : 'visible',
        }}
        // Clipping is released only once the panel is at rest and open, so a
        // focus ring or a popover inside the content is not shaved off at the
        // boundary for the rest of the session. During any motion it clips,
        // because that is what makes the reveal a reveal.
        className="dsc-panel"
      >
        {/*
          The content carries its own formatting context (`display: flow-root`
          in disclosure.css), so a child's top margin is contained and therefore
          measured. Without it a `<p>` inside would collapse its margin out
          through this box and the measured height would be short by exactly
          that margin — the panel opens to slightly less than its content and
          clips.

          The divider is on the content, not on the panel, so at height 0 it
          is clipped away with everything else instead of drawing a stray
          hairline under a closed trigger.
        */}
        <div ref={contentRef} className="dsc-content">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
