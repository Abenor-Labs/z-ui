'use client'

import * as React from 'react'
import { motion, useMotionValue, useReducedMotion } from 'motion/react'

/**
 * A box of objects that behave like objects.
 *
 * The box does not move. You reach into it, pick something up, and everything
 * that thing touches finds out: neighbours are shoved aside, anything resting
 * on top loses its floor and drops, and the pile rearranges itself into
 * whatever shape it can hold. Let go mid-throw and what you were holding keeps
 * going.
 *
 * There is no timeline in this file and there could not be one. What happens
 * next is a function of where every body is, how fast it is going, and what it
 * is touching — and the only input to that is your hand. You cannot write down
 * in advance how long a pile should take to collapse.
 *
 * The simulation is small and complete: gravity, a semi-implicit Euler
 * integrator on fixed sub-steps, penalty contacts against the walls and between
 * every pair of bodies, Coulomb friction, and a sleep test that ends the
 * animation frame loop the moment nothing is moving. Circles rather than boxes,
 * because a circle needs no orientation and rotation would double the state for
 * a component this size.
 *
 * DEPENDENCIES: react, motion. Nothing else. Paste it and own it.
 */

/* ---------------------------------------------------------------- tuning -- */

/**
 * The contact spring. Every collision in this file is this, twice — once
 * against the walls, once between each overlapping pair.
 *
 * Contacts are penalties, not impulses: two overlapping bodies are pushed apart
 * by a force proportional to how far they have interpenetrated, damped by how
 * fast they are separating. Impulse solvers are the other standard answer and
 * they are stiffer, more correct, and much longer — and they make contact
 * infinitely rigid, which is wrong for what this is. A penalty contact has a
 * little give, so a dragged object presses into a pile before the pile yields,
 * and that give is most of what makes the thing feel like objects instead of
 * sprites refusing to overlap.
 *
 * `stiffness` is the wall you feel. Below about 600 bodies visibly sink into
 * each other; above about 3000 the integrator needs more sub-steps than the
 * frame budget allows and the pile buzzes. `damping` is how much of the
 * approach speed is absorbed — drop it and the box turns into a ball pit, raise
 * it and everything lands dead.
 */
const SPRING = {
  type: 'spring',
  stiffness: 1400,
  damping: 70,
  mass: 1,
} as const

/**
 * The radius, in pixels, that weighs 1.
 *
 * Mass has to be expressed against a reference or the numbers stop meaning
 * anything. Contact acceleration is `stiffness · depth / mass`, so mass and
 * stiffness are read in the same units — and the first version of this file set
 * mass to raw area, `πr²`, which is about 1520 for a 44px disc. That made the
 * floor roughly fifteen hundred times too soft to hold one up, and every body
 * in the box sank straight through it and kept going. The bug was invisible in
 * the source and unmissable the moment a browser ran it.
 *
 * Squared, so a disc twice the diameter is four times the body and genuinely
 * shoves a smaller one; scaled, so a typical disc lands near 1 and the contact
 * spring is tuned against a number a person can hold in their head.
 */
const MASS_REF = 20

/** Pixels per second squared. Tuned by eye against a ~200px box: real gravity
 *  at this scale reads as slow motion, because the box is not two metres tall. */
const GRAVITY = 2600

/** Tangential friction at a contact, as a fraction of the normal force. Enough
 *  that a stack holds its shape; low enough that a shoved pile still slides. */
const FRICTION = 0.28

/** Velocity lost per second to the air. Keeps a long throw from ringing. */
const DRAG_COEFF = 0.6

/** Below this speed a body counts as quiet for the frame. Pixels/second. */
const SLEEP_SPEED = 8

/** Consecutive quiet frames before a body is asleep. About a tenth of a
 *  second, which is longer than any apex a body reaches inside a box. */
const SLEEP_FRAMES = 7

/** Integrator sub-step. A pile at this contact stiffness is unstable above
 *  roughly 1/200s, and the frame budget is spent long before 1/1000s buys
 *  anything visible. */
const STEP_S = 1 / 300

/** Keyboard nudge, in pixels per second of impulse. Large enough that one press
 *  visibly disturbs the pile rather than twitching one body. */
const NUDGE = 420

/**
 * Palette. Every value is a CSS variable with a fallback derived from
 * `currentColor` rather than a hex, so the component mixes its hairlines out of
 * whatever ink the host is using.
 *
 * The accent appears on one thing: the body currently held. Nothing at rest is
 * accented, because the accent marks what is being moved.
 */
const TOKENS = {
  '--hft-line': 'var(--z-line, color-mix(in oklab, currentColor 18%, transparent))',
  '--hft-fill': 'var(--z-fill, color-mix(in oklab, currentColor 5%, transparent))',
  '--hft-accent': 'var(--z-accent, oklch(0.53 0.17 45))',
  '--hft-radius': 'var(--z-radius, 10px)',
} as React.CSSProperties

/* ----------------------------------------------------------------- state -- */

/**
 * `data-state` values, on the box.
 *
 *   idle      — every body is asleep, and no animation frame is scheduled
 *   dragging  — a body is held
 *   settling  — nothing is held and the pile has not stopped moving
 *
 * `settling` is the window the component exists to show: you let go, and the
 * consequences keep happening without you. A consumer sequencing anything off
 * this box needs to know the difference between "the user stopped" and "the box
 * stopped", and those are not the same moment.
 */
const STATES = ['idle', 'dragging', 'settling'] as const

export type HeftState = (typeof STATES)[number]

/* ---------------------------------------------------------------- bodies -- */

type Body = {
  /** Centre, in container coordinates. */
  x: number
  y: number
  vx: number
  vy: number
  r: number
  /** Squared and scaled against MASS_REF, so a bigger disc shoves a smaller one
   *  while the number stays near 1. See MASS_REF for why raw area failed. */
  m: number
  /** Zero while held: an infinitely heavy body pushes and is not pushed. */
  inv: number
  /** Consecutive sub-frames spent below the sleep speed. See the sleep test. */
  still: number
  asleep: boolean
  held: boolean
  mx: ReturnType<typeof useMotionValue<number>>
  my: ReturnType<typeof useMotionValue<number>>
  el: HTMLElement
}

type Registry = {
  register: (el: HTMLElement, mx: Body['mx'], my: Body['my']) => () => void
  grab: (el: HTMLElement, e: React.PointerEvent) => void
  nudge: (el: HTMLElement, dx: number, dy: number) => void
  reduced: boolean
}

const HeftContext = React.createContext<Registry | null>(null)

/* ------------------------------------------------------------------- box -- */

export type HeftProps = Omit<
  React.ComponentPropsWithRef<'div'>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
> & {
  children: React.ReactNode
  /** Accessible name for the box itself. Its contents carry their own. */
  label?: string
  /** Fires once, when the last body falls asleep. */
  onSettle?: () => void
}

export function Heft({
  children,
  label = 'A box of objects. Drag one; the others react.',
  onSettle,
  className,
  style,
  ...rest
}: HeftProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false

  const boxRef = React.useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<HeftState>('idle')

  const bodies = React.useRef<Body[]>([])
  const raf = React.useRef(0)
  const last = React.useRef(0)
  const held = React.useRef<Body | null>(null)
  const pointer = React.useRef({ id: -1, x: 0, y: 0, px: 0, py: 0 })

  const settleRef = React.useRef(onSettle)
  React.useEffect(() => {
    settleRef.current = onSettle
  })

  const write = (b: Body) => {
    b.mx.set(b.x - b.r)
    b.my.set(b.y - b.r)
  }

  /* ----------------------------------------------------------- the solver */

  /**
   * One sub-step. Integrate, then satisfy contacts.
   *
   * Order matters: forces first, then positions, then contact correction on the
   * new positions. Correcting before integrating leaves a body one step inside
   * a wall on every frame, which is visible as a permanent shimmer along the
   * floor of the box.
   */
  const step = React.useCallback((h: number, w: number, ht: number) => {
    const list = bodies.current
    const { stiffness: k, damping: c } = SPRING

    for (const b of list) {
      if (b.held) continue
      b.vy += GRAVITY * h
      const d = Math.exp(-DRAG_COEFF * h)
      b.vx *= d
      b.vy *= d
      b.x += b.vx * h
      b.y += b.vy * h
    }

    // ---- walls. A penalty spring per penetrated side, plus friction along it.
    for (const b of list) {
      if (b.held) continue

      const push = (depth: number, nx: number, ny: number) => {
        if (depth <= 0) return
        const rel = b.vx * nx + b.vy * ny
        const f = k * depth - c * rel
        if (f <= 0) return
        b.vx += nx * f * b.inv * h
        b.vy += ny * f * b.inv * h
        // Coulomb friction on the tangent, which is what lets a pile hold a
        // slope instead of flowing flat like a liquid.
        const tx = -ny
        const ty = nx
        const vt = b.vx * tx + b.vy * ty
        const damp = Math.min(1, (FRICTION * f * b.inv * h) / (Math.abs(vt) || 1))
        b.vx -= tx * vt * damp
        b.vy -= ty * vt * damp
      }

      push(b.r - b.x, 1, 0)
      push(b.x + b.r - w, -1, 0)
      push(b.r - b.y, 0, 1)
      push(b.y + b.r - ht, 0, -1)
    }

    // ---- pairs. O(n²), which is correct at the size this component is for:
    // a box holds a handful of things, and a broad phase would cost more to
    // read than it saves to run.
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        if (!a || !b) continue

        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.hypot(dx, dy)
        const min = a.r + b.r
        if (dist >= min) continue

        // Two bodies dropped at the same coordinate have no separating
        // direction. Pick one rather than dividing by zero.
        if (dist === 0) {
          dx = 0
          dy = -1
          dist = 1e-6
        }

        const nx = dx / dist
        const ny = dy / dist
        const depth = min - dist
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        const f = k * depth - c * rel
        if (f <= 0) continue

        a.vx -= nx * f * a.inv * h
        a.vy -= ny * f * a.inv * h
        b.vx += nx * f * b.inv * h
        b.vy += ny * f * b.inv * h

        const tx = -ny
        const ty = nx
        const vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty
        const inv = a.inv + b.inv
        if (inv > 0) {
          const damp = Math.min(1, (FRICTION * f * inv * h) / (Math.abs(vt) || 1))
          a.vx += tx * vt * damp * (a.inv / inv)
          a.vy += ty * vt * damp * (a.inv / inv)
          b.vx -= tx * vt * damp * (b.inv / inv)
          b.vy -= ty * vt * damp * (b.inv / inv)
        }
      }
    }

    /**
     * The backstop. Nothing leaves the box, whatever the solver did.
     *
     * The penalty contacts above are a soft constraint: they push back in
     * proportion to how far something has already gone wrong, which means a
     * sufficiently wrong frame — a mistuned stiffness, a tab waking after a
     * long task, a body thrown at a wall faster than one sub-step can arrest —
     * can still put a body outside. That happened. Every disc in the first
     * build fell through the floor and kept falling, because a soft constraint
     * that is too soft is not a constraint at all.
     *
     * So the walls are also a hard clamp, applied last, with the outward
     * component of velocity discarded. The penalty spring is what the walls
     * *feel* like; this is what they *are*. A component whose contents can end
     * up two thousand pixels below a 149px box has no business shipping a
     * subtler answer than this.
     */
    for (const b of list) {
      if (b.held) continue
      if (b.x < b.r) {
        b.x = b.r
        if (b.vx < 0) b.vx = 0
      } else if (b.x > w - b.r) {
        b.x = w - b.r
        if (b.vx > 0) b.vx = 0
      }
      if (b.y < b.r) {
        b.y = b.r
        if (b.vy < 0) b.vy = 0
      } else if (b.y > ht - b.r) {
        b.y = ht - b.r
        if (b.vy > 0) b.vy = 0
      }
    }
  }, [])

  const tick = React.useCallback(
    (now: number) => {
      raf.current = 0
      const box = boxRef.current
      if (!box) return

      const prev = last.current || now
      last.current = now
      const frame = Math.min(0.05, (now - prev) / 1000)
      const steps = Math.max(1, Math.min(24, Math.ceil(frame / STEP_S)))
      const h = frame / steps

      const w = box.clientWidth
      const ht = box.clientHeight

      // The held body is kinematic: it goes exactly where the pointer is, and
      // carries the pointer's velocity so that letting go mid-throw throws it.
      const grabbed = held.current
      if (grabbed) {
        const p = pointer.current
        grabbed.vx = frame > 0 ? (p.x - p.px) / frame : 0
        grabbed.vy = frame > 0 ? (p.y - p.py) / frame : 0
        grabbed.x = p.x
        grabbed.y = p.y
        p.px = p.x
        p.py = p.y
      }

      for (let i = 0; i < steps; i++) step(h, w, ht)

      let awake = false
      for (const b of bodies.current) {
        if (b.held) {
          write(b)
          awake = true
          continue
        }
        /**
         * Slow for several frames running, not slow once.
         *
         * A body at the top of a bounce is momentarily stationary and is not
         * remotely at rest, so a single-frame speed test puts a mid-air disc to
         * sleep. The first version tried to exclude that by also requiring the
         * body to be touching the floor — and expressed "touching the floor" as
         * a position test, which a disc that had fallen *through* the floor
         * satisfied even more comfortably than one sitting on it. The box
         * reported `idle` while visibly empty.
         *
         * A run of quiet frames needs no notion of support and cannot be
         * satisfied by being in the wrong place. Falling is never quiet for
         * long, because gravity is still adding to the speed every step.
         */
        const speed = Math.hypot(b.vx, b.vy)
        b.still = speed < SLEEP_SPEED ? b.still + 1 : 0

        if (b.still >= SLEEP_FRAMES) {
          b.vx = 0
          b.vy = 0
          b.asleep = true
        } else {
          b.asleep = false
          awake = true
        }
        write(b)
      }

      if (awake) {
        raf.current = requestAnimationFrame(tick)
        return
      }

      // Nothing is moving. The loop ends here rather than idling, which is what
      // makes "no motion without input" a property of the code rather than a
      // promise in a comment.
      last.current = 0
      setState('idle')
      settleRef.current?.()
    },
    [step],
  )

  const kick = React.useCallback(() => {
    if (reduced || raf.current) return
    last.current = 0
    raf.current = requestAnimationFrame(tick)
  }, [reduced, tick])

  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  /* --------------------------------------------------------- registration */

  /**
   * Bodies are laid out along the floor, already at rest.
   *
   * Dropping them in from the top would be a mount animation, which DESIGN.md
   * bans outright and which this component would otherwise be the loudest
   * possible violation of. They start where a settled pile would be, and the
   * first thing that ever moves is the thing you move.
   */
  const place = React.useCallback(() => {
    const box = boxRef.current
    if (!box) return
    const w = box.clientWidth
    const ht = box.clientHeight
    let cursor = 0
    for (const b of bodies.current) {
      if (b.held) continue
      cursor += b.r
      b.x = Math.min(w - b.r, cursor)
      b.y = ht - b.r
      cursor += b.r + 4
      b.vx = 0
      b.vy = 0
      b.still = SLEEP_FRAMES
      b.asleep = true
      write(b)
    }
  }, [])

  const register = React.useCallback(
    (el: HTMLElement, mx: Body['mx'], my: Body['my']) => {
      const r = el.offsetWidth / 2 || 12
      // Squared and scaled against MASS_REF, so a disc twice as wide is four
      // times the body while the number itself stays near 1.
      const m = Math.max(0.05, (r / MASS_REF) ** 2)
      const body: Body = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        r,
        m,
        inv: 1 / m,
        still: 0,
        asleep: true,
        held: false,
        mx,
        my,
        el,
      }
      bodies.current.push(body)
      place()
      return () => {
        bodies.current = bodies.current.filter((b) => b !== body)
        place()
      }
    },
    [place],
  )

  React.useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const observer = new ResizeObserver(() => place())
    observer.observe(box)
    return () => observer.disconnect()
  }, [place])

  /* ---------------------------------------------------------- interaction */

  const find = (el: HTMLElement) => bodies.current.find((b) => b.el === el) ?? null

  const grab = React.useCallback(
    (el: HTMLElement, e: React.PointerEvent) => {
      const box = boxRef.current
      const body = find(el)
      if (!box || !body || reduced) return

      const rect = box.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top

      body.held = true
      body.inv = 0
      held.current = body
      pointer.current = { id: e.pointerId, x: px, y: py, px, py }

      el.setPointerCapture(e.pointerId)
      setState('dragging')
      kick()
    },
    [kick, reduced],
  )

  const move = (e: React.PointerEvent) => {
    const box = boxRef.current
    if (!box || !held.current || e.pointerId !== pointer.current.id) return
    const rect = box.getBoundingClientRect()
    const b = held.current
    // Clamped to the box: a held body cannot be dragged through a wall, which
    // is what keeps the walls meaning something while you are holding one.
    pointer.current.x = Math.max(b.r, Math.min(box.clientWidth - b.r, e.clientX - rect.left))
    pointer.current.y = Math.max(b.r, Math.min(box.clientHeight - b.r, e.clientY - rect.top))
  }

  const drop = (e: React.PointerEvent) => {
    const b = held.current
    if (!b || e.pointerId !== pointer.current.id) return
    b.held = false
    b.inv = 1 / b.m
    b.asleep = false
    b.still = 0
    held.current = null
    pointer.current.id = -1
    try {
      b.el.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    setState('settling')
    kick()
  }

  /**
   * Keyboard gets the physics, not a shortcut past it.
   *
   * An arrow key gives the focused body an impulse — the same velocity a small
   * flick would — and everything downstream of that is the same solver. This
   * project has already shipped one component whose tactile feedback was
   * pointer-only, which put the entire product thesis out of reach of anyone
   * not using a mouse.
   */
  const nudge = React.useCallback(
    (el: HTMLElement, dx: number, dy: number) => {
      const body = find(el)
      if (!body || reduced) return
      body.vx += dx
      body.vy += dy
      body.asleep = false
      body.still = 0
      setState('settling')
      kick()
    },
    [kick, reduced],
  )

  const registry = React.useMemo<Registry>(
    () => ({ register, grab, nudge, reduced }),
    [register, grab, nudge, reduced],
  )

  return (
    <HeftContext.Provider value={registry}>
      <div
        ref={boxRef}
        data-state={state}
        role="group"
        aria-label={label}
        onPointerMove={move}
        onPointerUp={drop}
        onPointerCancel={drop}
        style={{ ...TOKENS, touchAction: 'none', ...style }}
        className={[
          'relative touch-none select-none overflow-hidden',
          'rounded-[var(--hft-radius)] border border-[var(--hft-line)] bg-[var(--hft-fill)]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </div>
    </HeftContext.Provider>
  )
}

/* ------------------------------------------------------------------ item -- */

export type HeftItemProps = Omit<
  React.ComponentPropsWithRef<'div'>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
> & {
  /** Accessible name. Each body is individually focusable and draggable, so
   *  each needs one; there is no visible label to borrow. */
  label: string
}

export function HeftItem({
  label,
  className,
  style,
  children,
  ...rest
}: HeftItemProps): React.ReactElement {
  const ctx = React.useContext(HeftContext)
  const ref = React.useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  React.useEffect(() => {
    const el = ref.current
    if (!ctx || !el) return
    return ctx.register(el, x, y)
  }, [ctx, x, y])

  /**
   * Under reduced motion nothing simulates. The bodies keep the static layout
   * the box gave them, dragging is inert, and `data-state` never leaves `idle`.
   *
   * That is the honest path here rather than a slower version of the same
   * thing. This component is inertia and collision; there is no gentler
   * rendering of a pile collapsing, so what it offers instead is a legible
   * arrangement that does not move at all.
   */
  if (ctx?.reduced) {
    return (
      <div
        ref={ref}
        className={['relative', className].filter(Boolean).join(' ')}
        style={style}
        aria-label={label}
        {...rest}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-roledescription="draggable object"
      onPointerDown={(e) => {
        e.preventDefault()
        if (ref.current) ctx?.grab(ref.current, e)
      }}
      onKeyDown={(e) => {
        const map: Record<string, [number, number]> = {
          ArrowLeft: [-NUDGE, 0],
          ArrowRight: [NUDGE, 0],
          ArrowUp: [0, -NUDGE],
          ArrowDown: [0, NUDGE],
        }
        const d = map[e.key]
        if (!d || !ref.current) return
        e.preventDefault()
        ctx?.nudge(ref.current, d[0], d[1])
      }}
      style={{ x, y, position: 'absolute', top: 0, left: 0, ...style }}
      className={[
        'cursor-grab touch-none will-change-transform active:cursor-grabbing',
        'outline-none focus-visible:outline-2 focus-visible:outline-solid',
        'focus-visible:outline-offset-2 focus-visible:outline-[var(--hft-accent)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
