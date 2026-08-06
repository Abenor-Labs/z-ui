'use client'

import * as React from 'react'
import { springs, type SpringName } from '@/lib/z-spring'

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
 * Tilt and compression are integrated from the published spring scale — the
 * same stiffness and damping the registry components animate from — so the
 * hero cannot claim a feel the library does not actually have.
 */

type Preset = { stiffness: number; damping: number; mass: number }

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
    let spin = 0

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

      // Emissive bloom, one wide soft stroke beneath everything.
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = 'rgba(79,70,229,.11)'
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
        ctx.strokeStyle = `rgb(${Math.round((49 + 130 * lam) * fog)},${Math.round(
          (46 + 110 * lam) * fog,
        )},${Math.round((129 + 126 * lam) * fog)})`
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
        ctx.strokeStyle = `rgba(200,205,255,${(hi * 0.5).toFixed(3)})`
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

    const loop = (ms: number) => {
      raf = 0
      const dt = prev ? Math.min(0.05, (ms - prev) / 1000) : 0.016
      prev = ms
      spin += dt * 0.3
      tiltX.step(dt)
      tiltZ.step(dt)
      squash.step(dt)
      paint()
      if (visible && !document.hidden && !reduce.matches) raf = requestAnimationFrame(loop)
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
    }

    const compress = () => squash.to(0.52)
    const release = () => squash.to(1)

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
