'use client'

import * as React from 'react'

/**
 * The hero object: a coil that tilts toward the pointer and compresses when you
 * press it, then springs back past its rest length before settling.
 *
 * It is drawn in 2d canvas rather than with a 3d library. The geometry is a
 * helix sampled along its centreline, painted back to front as round-capped
 * segments whose width follows perspective, so the tube occludes itself
 * correctly for the cost of a depth sort. A WebGL scene graph would be a few
 * hundred kilobytes to draw one object that never changes topology.
 *
 * The constants below were `registry/lib/z-spring`, imported so the hero could
 * not claim a feel the library did not have. That lib went with the registry in
 * the 2026-08-09 clear-out, so they are inlined here rather than left dangling.
 * This is a site-only file and never ships through the CLI, so it is allowed to
 * carry them — but when the new scale lands, this copy is the thing that will
 * silently disagree with it. Re-point it then.
 */

type Preset = { stiffness: number; damping: number; mass: number }

const springs = {
  snap: { stiffness: 500, damping: 40, mass: 1 },
  bounce: { stiffness: 400, damping: 14, mass: 1 },
  settle: { stiffness: 260, damping: 24, mass: 1 },
  fling: { stiffness: 300, damping: 30, mass: 1 },
} as const satisfies Record<string, Preset>

type SpringName = keyof typeof springs

class Spring {
  x: number
  v = 0
  target: number
  private k: number
  private c: number
  private m: number

  constructor(value: number, preset: SpringName) {
    this.x = value
    this.target = value
    const p = springs[preset] as unknown as Preset
    this.k = p.stiffness
    this.c = p.damping
    this.m = p.mass
  }

  to(t: number) {
    this.target = t
  }

  /** Substepped so a dropped frame cannot blow the integrator up. */
  step(dt: number) {
    const n = Math.max(1, Math.ceil(dt / 0.002))
    const h = dt / n
    for (let i = 0; i < n; i++) {
      const a = (-this.k * (this.x - this.target) - this.c * this.v) / this.m
      this.v += a * h
      this.x += this.v * h
    }
  }

  settle() {
    this.x = this.target
    this.v = 0
  }
}

const R = 1.6 // coil radius
const TUBE = 0.2 // tube radius
const TURNS = 6
const SAMPLES = 420
const HEIGHT = 11 // world height at rest
const CAM_Z = 10
const FOV = 75

/** Unit light direction, matching the point light the scene was designed to. */
const LIGHT = (() => {
  const l = Math.hypot(10, 10, 10)
  return [10 / l, 10 / l, 10 / l] as const
})()

/** y is stored as 0..1 so compression can scale the pitch every frame. */
const POINTS = Array.from({ length: SAMPLES }, (_, i) => {
  const u = i / (SAMPLES - 1)
  const t = u * TURNS * Math.PI * 2
  return [Math.cos(t) * R, u - 0.5, Math.sin(t) * R, Math.cos(t), Math.sin(t)] as const
})

export function SpringCoil({ className }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scene = canvas.parentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

    const tiltX = new Spring(0, 'settle')
    const tiltZ = new Spring(0, 'settle')
    const squash = new Spring(1, 'bounce')

    let W = 0
    let H = 0
    let scale = 1
    // Fixed, not free-running. A coil that spins on its own is motion nobody
    // touched — DESIGN.md forbids that by name. The three-quarter angle here
    // is just a pleasant static viewing angle; tilt and compression are the
    // only things that move, and only in response to the pointer.
    const spin = 0.6

    const sync = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      W = w
      H = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // World height visible at the coil's depth under a 75° camera.
      scale = h / (2 * CAM_Z * Math.tan(((FOV * Math.PI) / 180) / 2))
    }

    type Seg = { sx: number; sy: number; w: number; z: number; lam: number }
    const seg: Seg[] = Array.from({ length: SAMPLES }, () => ({
      sx: 0,
      sy: 0,
      w: 0,
      z: 0,
      lam: 0,
    }))
    const order = Array.from({ length: SAMPLES - 1 }, (_, i) => i)

    const project = () => {
      const cy = Math.cos(spin)
      const sy = Math.sin(spin)
      const cx = Math.cos(tiltX.x)
      const sxv = Math.sin(tiltX.x)
      const cz = Math.cos(tiltZ.x)
      const szv = Math.sin(tiltZ.x)
      const span = HEIGHT * squash.x

      for (let i = 0; i < SAMPLES; i++) {
        const p = POINTS[i]!

        // y-spin, then x-tilt, then z-tilt.
        const x = p[0] * cy + p[2] * sy
        const y = p[1] * span
        const z = -p[0] * sy + p[2] * cy

        const y2 = y * cx - z * sxv
        const z2 = y * sxv + z * cx
        const x3 = x * cz - y2 * szv
        const y3 = x * szv + y2 * cz

        // The outward radial normal, carried through the same rotations.
        const nx = p[3] * cy + p[4] * sy
        const nz = -p[3] * sy + p[4] * cy
        const ny2 = -nz * sxv
        const nz2 = nz * cx
        const nx3 = nx * cz - ny2 * szv
        const ny3 = nx * szv + ny2 * cz

        const k = CAM_Z / Math.max(0.1, CAM_Z - z2)
        const s = seg[i]!
        s.sx = W / 2 + x3 * k * scale
        s.sy = H / 2 - y3 * k * scale
        s.w = Math.max(0.6, TUBE * 2 * k * scale)
        s.z = z2
        s.lam = Math.max(0, nx3 * LIGHT[0] + ny3 * LIGHT[1] + nz2 * LIGHT[2])
      }
    }

    const paint = () => {
      project()
      ctx.clearRect(0, 0, W, H)
      ctx.lineCap = 'round'

      // Painter's algorithm: far segments first, so the coil occludes itself.
      order.sort((a, b) => seg[a]!.z + seg[a + 1]!.z - (seg[b]!.z + seg[b + 1]!.z))

      // Ambient bounce, one wide soft stroke beneath everything. Not emissive
      // any more — a machined part does not glow — so at rest this is only the
      // warm spill the key leaves around the body: --color-control #7e7161.
      // Under compression it lerps to Signal Mint #479c78, which is the single
      // place the accent is admissible here. The coil is the moving part and a
      // held press is the only moment it is moving, so mint appears exactly
      // then and nowhere else. `press` is normalised against the 0.52 target
      // `compress()` sets, and clamped, so the bounce preset overshooting back
      // past rest length cannot drive it negative or leave mint behind.
      const press = Math.max(0, Math.min(1, (1 - squash.x) / 0.48))
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = `rgba(${Math.round(126 - 55 * press)},${Math.round(
        113 + 43 * press,
      )},${Math.round(97 + 23 * press)},.11)`
      for (const i of order) {
        const a = seg[i]!
        const b = seg[i + 1]!
        ctx.lineWidth = a.w * 2.6
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }

      // The tube: lambert over the emissive floor, with depth fading the back.
      ctx.globalCompositeOperation = 'source-over'
      for (const i of order) {
        const a = seg[i]!
        const b = seg[i + 1]!
        const lam = (a.lam + b.lam) / 2
        const fog = 0.3 + 0.7 * Math.max(0, Math.min(1, (a.z + R) / (2 * R)))
        // Anodised warm metal rather than a lit tube. The shadow end is
        // --color-control #7e7161 at 55%, one ramp step clear of the ground so
        // the far side still reads as a form; the lit end runs to (216,202,180),
        // between --color-control and Silkscreen Sand. Metal takes its colour
        // from the light, so both ends carry the key's warmth instead of a
        // pigment of their own — that is the difference between a milled part
        // and a moulded one. The peak stays under --color-ink, so the object
        // never outbrightens the headline sitting next to it.
        ctx.strokeStyle = `rgb(${Math.round((69 + 147 * lam) * fog)},${Math.round(
          (62 + 140 * lam) * fog,
        )},${Math.round((53 + 127 * lam) * fog)})`
        ctx.lineWidth = a.w
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }

      // Specular: narrow, only where the tube turns to face the light.
      ctx.globalCompositeOperation = 'lighter'
      for (const i of order) {
        const a = seg[i]!
        const b = seg[i + 1]!
        const lam = (a.lam + b.lam) / 2
        if (lam < 0.72) continue
        const hi = ((lam - 0.72) / 0.28) ** 2
        // A specular is the light source reflected, not the surface, so this is
        // the key's own colour: Silkscreen Sand pushed toward its amber. It is
        // deliberately not mint — this pass fires at rest on every segment that
        // happens to face the light, and additive mint over a lambert this
        // bright clips to white anyway, so it would cost the rule and buy no hue.
        ctx.strokeStyle = `rgba(248,232,208,${(hi * 0.5).toFixed(3)})`
        ctx.lineWidth = a.w * 0.34
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    let raf = 0
    let prev = 0
    let visible = false

    // Only tiltX/tiltZ/squash move now, and only toward a target the pointer
    // set. Once all three are at rest, there is nothing left to animate —
    // continuing to schedule frames would be exactly the "moves without
    // being touched" pattern removing `spin` was meant to end.
    const AT_REST = 0.0005
    const settled = (s: Spring) => Math.abs(s.x - s.target) < AT_REST && Math.abs(s.v) < AT_REST
    const allSettled = () => settled(tiltX) && settled(tiltZ) && settled(squash)

    const loop = (ms: number) => {
      raf = 0
      const dt = prev ? Math.min(0.05, (ms - prev) / 1000) : 0.016
      prev = ms
      tiltX.step(dt)
      tiltZ.step(dt)
      squash.step(dt)
      paint()
      if (visible && !document.hidden && !reduce.matches && !allSettled()) raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (raf || !visible || document.hidden) return
      if (reduce.matches) {
        tiltX.settle()
        tiltZ.settle()
        squash.settle()
        paint()
        return
      }
      prev = 0
      raf = requestAnimationFrame(loop)
    }

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      const mx = ((e.clientX - r.left) / r.width) * 2 - 1
      const my = 1 - ((e.clientY - r.top) / r.height) * 2
      tiltX.to(Math.max(-1.4, Math.min(1.4, my)) * 0.3)
      tiltZ.to(Math.max(-1.4, Math.min(1.4, mx)) * 0.3)
      start()
    }

    const compress = () => {
      squash.to(0.52)
      start()
    }
    const release = () => {
      squash.to(1)
      start()
    }

    sync()
    const ro = new ResizeObserver(() => {
      sync()
      paint()
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      start()
    })
    io.observe(canvas)

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    scene?.addEventListener('pointerdown', compress)
    scene?.addEventListener('pointerup', release)
    scene?.addEventListener('pointercancel', release)
    scene?.addEventListener('pointerleave', release)
    document.addEventListener('visibilitychange', start)
    reduce.addEventListener('change', start)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      scene?.removeEventListener('pointerdown', compress)
      scene?.removeEventListener('pointerup', release)
      scene?.removeEventListener('pointercancel', release)
      scene?.removeEventListener('pointerleave', release)
      document.removeEventListener('visibilitychange', start)
      reduce.removeEventListener('change', start)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="A spring coil that tilts toward the pointer and compresses when pressed"
      className={className}
    />
  )
}
