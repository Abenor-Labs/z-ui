'use client'

import * as React from 'react'

/**
 * ThinkingOrb — a dotted, honestly-3D status indicator: nine hand-tuned
 * animated states on a plain 2D canvas (no ctx.filter, no SVG filters, no
 * WebGL), so every mode paints identically in Chrome, Safari and Firefox.
 * One shared wall clock (performance.now) keeps every mounted instance in
 * phase; each instance runs its own rAF loop but pauses automatically while
 * offscreen (IntersectionObserver) or when the tab is hidden.
 *
 * Vendored from thinking-orbs (https://github.com/Jakubantalik/thinking-orbs),
 * MIT License, Copyright (c) 2026 Jakub Antalik:
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a
 *   copy of this software and associated documentation files (the
 *   "Software"), to deal in the Software without restriction, including
 *   without limitation the rights to use, copy, modify, merge, publish,
 *   distribute, sublicense, and/or sell copies of the Software, subject to
 *   the above copyright notice and this permission notice being included in
 *   all copies or substantial portions of the Software. THE SOFTWARE IS
 *   PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
 *
 * Ported into one file because this registry ships zero-runtime-dependency,
 * self-contained components — the upstream package spans sixteen modules
 * (component, presets, theme, and a nine-file draw engine). The geometry and
 * tuning below are unchanged; only the module boundaries are collapsed and
 * the reduced-motion binding adapted to this registry's own contract.
 */

// ---- state surface ---------------------------------------------------

/**
 * The nine shipped states — each a hand-tuned animation:
 * - `working`    — particles on tilted orbits
 * - `searching`  — a scan meridian sweeps a dotted globe
 * - `solving`    — bands scramble in quarter turns, then click back
 * - `listening`  — a waveform rolls through latitude rings
 * - `connecting` — a constellation wires itself, packets running the edges
 * - `weaving`    — three strands plait around the sphere
 * - `composing`  — an undulating multi-band sash
 * - `breathing`  — a face-on ring slowly morphing
 * - `shaping`    — a dotted outline morphs circle -> triangle -> square
 */
const STATES = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
] as const

export type OrbState = (typeof STATES)[number]

/**
 * Rendered size in CSS pixels. Exactly two tuned presets ship: 64
 * (chat-avatar scale) and 20 (inline-text scale). Each size carries its own
 * dot count, dot size and speed tuning — they are separate designs, not a
 * scale factor.
 */
export type OrbSize = 64 | 20

/**
 * Theme mode.
 *
 * `auto` (default) resolves in three layers, live-updating on change: a
 * `data-theme="dark|light"` attribute or `dark`/`light` class on any
 * ancestor, then `prefers-color-scheme`, then a dark fallback before the
 * client has painted. `dark`/`light` pin the palette regardless of context.
 * Dark renders light ink on the transparent canvas; light renders dark ink.
 */
export type OrbTheme = 'auto' | 'dark' | 'light'

export interface ThinkingOrbProps extends Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, 'style'> {
  /** Which animation to show. @default 'working' */
  state?: OrbState
  /** Tuned size preset — 64 or 20 CSS px. @default 64 */
  size?: OrbSize
  /** Theme mode; `auto` detects from the host project. @default 'auto' */
  theme?: OrbTheme
  /** Animation speed multiplier on top of the preset's baked speed. @default 1 */
  speed?: number
  /** Freeze the animation on the current frame. @default false */
  paused?: boolean
  style?: React.CSSProperties
}

// ---- shared draw primitives -------------------------------------------

interface Dot {
  x: number
  y: number
  z: number
  r: number
  /** Ink value: 0 = darkest ink on paper. Mirrored on dark themes. */
  white: number
  a?: number
}

/** A stroked edge between two projected points (the `connecting` web). */
interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
  white: number
  a?: number
  w: number
}

/** One rendered instant: a complete, z-sorted, radius-clamped set of draw instructions. */
interface OrbFrame {
  dots: Dot[]
  lines: Line[]
}

type Projector = (x: number, y: number, z: number) => [number, number, number]

interface ModeOpts {
  [key: string]: number | undefined
}

type ModeFrame = (size: number, t: number, opts: ModeOpts) => OrbFrame

function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f
}

function frac(x: number): number {
  return x - Math.floor(x)
}

/** Deterministic hash in [0, 1). */
function hashD(a: number, b: number): number {
  const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return h - Math.floor(h)
}

/** Value noise on a 2D lattice — smooth, deterministic, cheap. */
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  let fx = x - xi
  let fy = y - yi
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const a = hashD(xi, yi)
  const b = hashD(xi + 1, yi)
  const c = hashD(xi, yi + 1)
  const d = hashD(xi + 1, yi + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

/** Stable directions on a unit sphere (Fibonacci lattice). */
function fibDir(i: number, n: number): [number, number, number] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (2 * (i + 0.5)) / n
  const rad = Math.sqrt(1 - y * y)
  const a = i * golden
  return [rad * Math.cos(a), y, rad * Math.sin(a)]
}

/** Shortest signed angular distance, wrapped to (-pi, pi]. */
function angleDelta(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b))
}

/** Shared spin + tilt + orthographic projection. */
function makeProj(yaw: number, tilt: number, cx: number, cy: number, scale: number): Projector {
  const st = Math.sin(tilt)
  const ct = Math.cos(tilt)
  const sy = Math.sin(yaw)
  const cyw = Math.cos(yaw)
  return (x, y, z) => {
    const x1 = x * cyw + z * sy
    const z1 = -x * sy + z * cyw
    const y1 = y * ct - z1 * st
    const z2 = y * st + z1 * ct
    return [cx + x1 * scale, cy - y1 * scale, z2]
  }
}

/** Dot radii were tuned for a 300pt frame; sub-linear scaling keeps small spinners legible. */
function radiusScale(size: number, pow: number): number {
  return (size / 300) ** pow
}

/**
 * Turn raw mode output into a finished frame: drop invisible marks, clamp
 * radii to the mode's floor, and z-sort far -> near into draw order.
 */
function finalizeFrame(dots: Dot[], lines: Line[], rMin = 0.3): OrbFrame {
  const visible: Dot[] = []
  for (const d of dots) {
    if ((d.a ?? 1) < 0.02) continue
    d.r = Math.max(rMin, d.r)
    visible.push(d)
  }
  visible.sort((a, b) => a.z - b.z)
  return { dots: visible, lines: lines.filter((l) => (l.a ?? 1) >= 0.02) }
}

/**
 * Painter: z-sort far->near, matte grayscale dots. On dark substrates the ink
 * value is mirrored (1 - white) so near dots read bright — the same depth
 * language on an inverted substrate.
 */
function paintDots(ctx: CanvasRenderingContext2D, dots: Dot[], dark: boolean): void {
  for (const d of dots) {
    const alpha = d.a ?? 1
    const w = Math.min(1, Math.max(0, d.white))
    const g = Math.round((dark ? 1 - w : w) * 255)
    ctx.fillStyle = `rgba(${g},${g},${g},${alpha})`
    ctx.beginPath()
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Stroke pass for edge-based modes. Runs before dots so nodes sit on top. */
function paintLines(ctx: CanvasRenderingContext2D, lines: Line[], dark: boolean): void {
  for (const l of lines) {
    const alpha = l.a ?? 1
    const w = Math.min(1, Math.max(0, l.white))
    const g = Math.round((dark ? 1 - w : w) * 255)
    ctx.strokeStyle = `rgba(${g},${g},${g},${alpha})`
    ctx.lineWidth = l.w
    ctx.beginPath()
    ctx.moveTo(l.x1, l.y1)
    ctx.lineTo(l.x2, l.y2)
    ctx.stroke()
  }
}

function paintFrame(ctx: CanvasRenderingContext2D, frame: OrbFrame, dark: boolean): void {
  if (frame.lines.length) paintLines(ctx, frame.lines, dark)
  paintDots(ctx, frame.dots, dark)
}

// ---- mode geometry: one builder per drawn shape ------------------------

// Orbits: particles on tilted orbits — "working". Coreless: ghost paths
// plus the particles doing the work.
const frameOrbits: ModeFrame = (size, t, o) => {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.82
  const pt = makeProj(t * 0.12, 0.3, cx, cy, 1)
  const rs = radiusScale(size, o.rsPow ?? 0.6)

  const dots: Dot[] = []
  const orbitN = o.orbitN ?? 12
  const ghostN = o.ghostN ?? 40
  const particles = o.particles ?? 3

  for (let orb = 0; orb < orbitN; orb++) {
    const h1 = hashD(orb, 1.7)
    const h2 = hashD(orb, 5.2)
    const h3 = hashD(orb, 8.9)
    const ro = R * (0.45 + 0.52 * h1)
    const th = h1 * 2 * Math.PI
    const phi = Math.acos(2 * h2 - 1)
    const nx = Math.sin(phi) * Math.cos(th)
    const ny = Math.cos(phi)
    const nz = Math.sin(phi) * Math.sin(th)
    let ux = -ny
    let uy = nx
    const uz = 0
    const ul = Math.max(1e-6, Math.sqrt(ux * ux + uy * uy))
    ux /= ul
    uy /= ul
    const vx = ny * uz - nz * uy
    const vy = nz * ux - nx * uz
    const vz = nx * uy - ny * ux
    const speed = (0.25 + 0.55 * h3) * (h3 > 0.5 ? 1 : -1)

    for (let k = 0; k < ghostN; k++) {
      const a = (k / ghostN) * 2 * Math.PI
      const [px, py, z] = pt(
        (ux * Math.cos(a) + vx * Math.sin(a)) * ro,
        (uy * Math.cos(a) + vy * Math.sin(a)) * ro,
        (uz * Math.cos(a) + vz * Math.sin(a)) * ro,
      )
      const depth = (z / ro + 1) / 2
      dots.push({
        x: px,
        y: py,
        z,
        r: (o.ghostR ?? 0.9) * rs,
        white: 0.72,
        a: (o.ghostA ?? 0.5) * (0.4 + 0.6 * depth),
      })
    }
    for (let m = 0; m < particles; m++) {
      const a = t * speed + (m / particles) * 2 * Math.PI + h2 * 6
      const [px, py, z] = pt(
        (ux * Math.cos(a) + vx * Math.sin(a)) * ro,
        (uy * Math.cos(a) + vy * Math.sin(a)) * ro,
        (uz * Math.cos(a) + vz * Math.sin(a)) * ro,
      )
      const depth = (z / ro + 1) / 2
      dots.push({
        x: px,
        y: py,
        z,
        r: ((o.partR ?? 1.2) + (o.partRDepth ?? 1.6) * depth) * rs,
        white: 0.3 - 0.22 * depth,
      })
    }
  }
  return finalizeFrame(dots, [], o.rMin)
}

// --- shared solver heartbeat for rubik: scramble, then click back solved ---

interface Move {
  axis: 0 | 1 | 2
  lo: number
  hi: number
  ang: number
}

function solveCycle(time: number, count: number, slotDur: number, rest: number) {
  const cyc = 2 * count * slotDur + rest
  const tc = time % cyc
  const amount = new Array<number>(count).fill(0)
  let active = -1
  if (tc < 2 * count * slotDur) {
    const slot = Math.floor(tc / slotDur)
    const p = (tc - slot * slotDur) / slotDur
    const cl = Math.min(1, p / 0.7)
    const ep = 1 - (1 - cl) ** 3
    if (slot < count) {
      for (let i = 0; i < slot; i++) amount[i] = 1
      amount[slot] = ep
      active = slot
    } else {
      const u = 2 * count - 1 - slot
      for (let i = 0; i < u; i++) amount[i] = 1
      amount[u] = 1 - ep
      active = u
    }
  }
  return { amount, active }
}

function applyMoves(
  pt3: [number, number, number],
  moves: Move[],
  sc: { amount: number[]; active: number },
): [number, number, number, boolean] {
  let [x, y, z] = pt3
  let inActive = false
  for (let i = 0; i < moves.length; i++) {
    if (sc.amount[i]! <= 0) continue
    const mv = moves[i]!
    const coord = mv.axis === 0 ? x : mv.axis === 1 ? y : z
    if (coord < mv.lo || coord >= mv.hi) continue
    if (i === sc.active) inActive = true
    const a = mv.ang * sc.amount[i]!
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    if (mv.axis === 0) {
      const y2 = y * ca - z * sa
      z = y * sa + z * ca
      y = y2
    } else if (mv.axis === 1) {
      const x2 = x * ca + z * sa
      z = -x * sa + z * ca
      x = x2
    } else {
      const x2 = x * ca - y * sa
      y = x * sa + y * ca
      x = x2
    }
  }
  return [x, y, z, inActive]
}

function makeMoves(count: number): Move[] {
  const moves: Move[] = []
  for (let i = 0; i < count; i++) {
    const axis = Math.min(2, Math.floor(hashD(i, 2.3) * 3)) as 0 | 1 | 2
    const lo = -1.0 + 0.5 * Math.min(3, Math.floor(hashD(i, 5.9) * 4))
    const dir = hashD(i, 7.7) < 0.5 ? 1 : -1
    moves.push({ axis, lo, hi: lo + 0.5, ang: (dir * Math.PI) / 2 })
  }
  return moves
}

// Globe: lat/long field, a scan meridian sweeps — "searching".
const frameGlobe: ModeFrame = (size, t, o) => {
  const spin = 0.5
  const cx = size / 2
  const cy = size / 2
  const radius = (size / 2) * 0.82
  const tilt = 0.4 + 0.06 * Math.sin(t * 0.35)
  const pt = makeProj(t * spin, tilt, cx, cy, radius)
  const scan = t * (spin + (1.7 - spin) * (o.scanMul ?? 1))
  const rs = radiusScale(size, o.rsPow ?? 0.6)
  const dimBase = o.dimBase ?? 1

  const dots: Dot[] = []
  const latRings = o.latRings ?? 17
  const lonDensity = o.lonDensity ?? 44
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI
    const cosLat = Math.cos(lat)
    const sinLat = Math.sin(lat)
    const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity))
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * 2 * Math.PI
      const [px, py, z] = pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon))
      const depth = (z + 1) / 2
      const d = angleDelta(lon + t * spin, scan)
      const boost = Math.exp(-(d * d) / 0.18) * Math.max(0, z)
      dots.push({
        x: px,
        y: py,
        z,
        r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (o.rBoost ?? 1) * boost) * rs,
        white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth,
        a: dimBase + (1 - dimBase) * Math.min(1, boost),
      })
    }
  }
  return finalizeFrame(dots, [], o.rMin)
}

// Rubik: bands twist in quarter turns, scramble -> solve — "solving".
const frameRubik: ModeFrame = (size, t, o) => {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.82
  const pt = makeProj(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), cx, cy, R)
  const rs = radiusScale(size, o.rsPow ?? 0.6)
  const moveCount = o.moveCount ?? 14
  const moves = makeMoves(moveCount)
  const sc = solveCycle(t, moveCount, 0.42, 1.2)

  const dots: Dot[] = []
  const latRings = o.latRings ?? 15
  const lonDensity = o.lonDensity ?? 40
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI
    const cosLat = Math.cos(lat)
    const sinLat = Math.sin(lat)
    const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity))
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * 2 * Math.PI
      const [x, y, z, inActive] = applyMoves([cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon)], moves, sc)
      const [px, py, zr] = pt(x, y, z)
      const depth = (zr + 1) / 2
      dots.push({
        x: px,
        y: py,
        z: zr,
        r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (inActive ? (o.rActive ?? 0.3) : 0)) * rs,
        white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth - (inActive ? 0.14 : 0),
      })
    }
  }
  return finalizeFrame(dots, [], o.rMin)
}

// Wave: a waveform rolls through the rings — "listening".
const frameWave: ModeFrame = (size, t, o) => {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.874
  const pt = makeProj(t * 0.18, 0.38, cx, cy, 1)
  const rs = radiusScale(size, o.rsPow ?? 0.6)

  const dots: Dot[] = []
  const rings = o.rings ?? 15
  const lonDensity = o.lonDensity ?? 40
  for (let ri = 0; ri <= rings; ri++) {
    const lat = -Math.PI / 2 + (ri / rings) * Math.PI
    const cosLat = Math.cos(lat)
    const sinLat = Math.sin(lat)
    const w = 0.62 * Math.sin(t * 2.1 - ri * 0.52) + 0.38 * Math.sin(t * 1.27 + ri * 0.83)
    const rr = R * (0.88 + 0.105 * w)
    const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity))
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * 2 * Math.PI
      const [px, py, z] = pt(cosLat * Math.cos(lon) * rr, sinLat * rr, cosLat * Math.sin(lon) * rr)
      const depth = (z / R + 1) / 2
      const crest = Math.max(0, w)
      dots.push({
        x: px,
        y: py,
        z,
        r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth) * (1 + 0.4 * crest) * rs,
        white: 0.66 - 0.56 * depth - 0.1 * crest,
      })
    }
  }
  return finalizeFrame(dots, [], o.rMin)
}

// Web: a constellation wires itself, packets running the edges — "connecting".
const frameWeb: ModeFrame = (size, t, o) => {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.8 * (o.spread ?? 1)
  const pt = makeProj(t * 0.12, 0.32, cx, cy, R)
  const rs = radiusScale(size, o.rsPow ?? 0.6)

  const nodeN = o.nodeN ?? 30
  const thr = o.thr ?? 0.72
  const nodeR = o.nodeR ?? 1.4
  const nodeRDepth = o.nodeRDepth ?? 1.8

  const nodes: Array<[number, number, number]> = []
  for (let i = 0; i < nodeN; i++) {
    const d = fibDir(i, nodeN)
    const x = d[0] + 0.3 * (vnoise(i * 0.31 + 9, t * 0.24) - 0.5) * 2
    const y = d[1] + 0.3 * (vnoise(i * 0.53 + 27, t * 0.21) - 0.5) * 2
    const z = d[2] + 0.3 * (vnoise(i * 0.77 + 55, t * 0.27) - 0.5) * 2
    const l = Math.sqrt(x * x + y * y + z * z)
    nodes.push([x / l, y / l, z / l])
  }

  const lines: Line[] = []
  const dots: Dot[] = []

  for (let i = 0; i < nodeN; i++) {
    const ni = nodes[i]!
    for (let j = i + 1; j < nodeN; j++) {
      const nj = nodes[j]!
      const dx = ni[0] - nj[0]
      const dy = ni[1] - nj[1]
      const dz = ni[2] - nj[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist >= thr) continue
      const [x1, y1, z1] = pt(ni[0], ni[1], ni[2])
      const [x2, y2, z2] = pt(nj[0], nj[1], nj[2])
      const depth = ((z1 + z2) / 2 + 1) / 2
      lines.push({
        x1,
        y1,
        x2,
        y2,
        white: 0.42,
        a: (1 - dist / thr) * (0.3 + 0.55 * depth),
        w: Math.max(0.6, (o.lineW ?? 0.8) * rs),
      })
    }
  }

  for (let i = 0; i < nodeN; i++) {
    const ni = nodes[i]!
    const [px, py, z] = pt(ni[0], ni[1], ni[2])
    const depth = (z + 1) / 2
    const pulse = 1 + 0.25 * Math.sin(t * 1.4 + i * 2.7)
    dots.push({
      x: px,
      y: py,
      z,
      r: (nodeR + nodeRDepth * depth) * pulse * rs,
      white: 0.55 - 0.45 * depth,
    })
  }

  const signals = o.signals ?? 5
  for (let s = 0; s < signals; s++) {
    const seg = Math.floor(t * 0.55 + s * 7.31)
    const a = Math.floor(hashD(seg, s * 3.1 + 1.7) * nodeN)
    const b = Math.floor(hashD(seg, s * 5.7 + 4.2) * nodeN)
    if (a === b) continue
    const na = nodes[a]!
    const nb = nodes[b]!
    const f = frac(t * 0.55 + s * 7.31)
    const x = lerp(na[0], nb[0], f)
    const y = lerp(na[1], nb[1], f)
    const z = lerp(na[2], nb[2], f)
    const l = Math.max(1e-6, Math.sqrt(x * x + y * y + z * z))
    const [px, py, zr] = pt(x / l, y / l, z / l)
    const depth = (zr + 1) / 2
    dots.push({
      x: px,
      y: py,
      z: zr,
      r: (nodeR * 1.5 + nodeRDepth * depth) * rs,
      white: 0.05,
      a: 0.5 + 0.5 * depth,
    })
  }

  return finalizeFrame(dots, lines, o.rMin)
}

// Braid: three strands plait around the sphere — "weaving".
const frameBraid: ModeFrame = (size, t, o) => {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.76
  const pt = makeProj(t * 0.4, 0.3, cx, cy, 1)
  const rs = radiusScale(size, o.rsPow ?? 0.6)

  const dots: Dot[] = []
  const ghostN = o.ghostN ?? 150
  for (let i = 0; i < ghostN; i++) {
    const d = fibDir(i, ghostN)
    const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R)
    const depth = (z / R + 1) / 2
    dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth })
  }

  const strandN = o.strandN ?? 52
  const turns = o.turns ?? 3
  for (let s = 0; s < 3; s++) {
    const phase = (s / 3) * 2 * Math.PI
    for (let i = 0; i < strandN; i++) {
      const u = (frac(i / strandN + t * 0.045) * 2 - 1) * 0.96
      const surf = Math.sqrt(Math.max(0, 1 - u * u))
      const endFade = Math.min(1, (1 - Math.abs(u)) / 0.1)
      const a = u * Math.PI * turns + phase
      const weave = 1 + 0.075 * Math.sin(u * Math.PI * turns * 2 + phase * 2 + t * 0.8)
      const rr = surf * R * weave
      const [px, py, zr] = pt(Math.cos(a) * rr, u * R * weave, Math.sin(a) * rr)
      const depth = (zr / R + 1) / 2
      dots.push({
        x: px,
        y: py,
        z: zr,
        r: ((o.rBase ?? 1.2) + (o.rDepth ?? 1.8) * depth) * rs,
        white: 0.55 - 0.45 * depth,
        a: endFade * (0.45 + 0.55 * depth),
      })
    }
  }
  return finalizeFrame(dots, [], o.rMin)
}

// Ribbon: an undulating sash of parallel strands rides a great circle —
// "composing". Also drives "breathing" (ring) via the `faceOn` flag: a
// face-on circle whose radius, not its out-of-plane offset, undulates.
const frameRibbon: ModeFrame = (size, t, o) => {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) * 0.78
  const spin = o.spin ?? 1
  const camTilt = 0.3
  const pt = makeProj(t * 0.1 * spin, camTilt, cx, cy, 1)
  const rs = radiusScale(size, o.rsPow ?? 0.6)

  const dots: Dot[] = []
  const ghostN = o.ghostN ?? 150
  for (let i = 0; i < ghostN; i++) {
    const d = fibDir(i, ghostN)
    const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R)
    const depth = (z / R + 1) / 2
    dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth })
  }

  const ya = t * 0.24 * spin
  const ta = o.faceOn ? -camTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin
  const ux = Math.cos(ya)
  const uy = 0
  const uz = Math.sin(ya)
  const vx = -uz * Math.sin(ta)
  const vy = Math.cos(ta)
  const vz = ux * Math.sin(ta)
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx

  const wobAmp = 0.23 * (o.wobMul ?? 1)
  const baseR = o.faceOn ? R / (1 + 0.85 * wobAmp) : R

  const baseLanes = o.lanes ?? 5
  const segs = o.segs ?? 88
  const lanes = Math.max(1, Math.round(baseLanes * (o.bandMul ?? 1)))
  for (let w = 0; w < lanes; w++) {
    const laneOff = (w - (lanes - 1) / 2) * 0.075
    const edge = Math.abs(w - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2)
    for (let k = 0; k < segs; k++) {
      const a = (k / segs) * 2 * Math.PI
      const wob =
        (0.16 * Math.sin(a * 3 - t * 1.7 + w * 0.22) + 0.07 * Math.sin(a * 5 + t * 1.1)) * (o.wobMul ?? 1)
      const radial = o.faceOn ? 1 + wob : 1
      const off = o.faceOn ? laneOff : laneOff + wob
      const x = ux * Math.cos(a) + vx * Math.sin(a) + nx * off
      const y = uy * Math.cos(a) + vy * Math.sin(a) + ny * off
      const z = uz * Math.cos(a) + vz * Math.sin(a) + nz * off
      const l = Math.sqrt(x * x + y * y + z * z)
      const rr = baseR * radial
      const [px, py, zr] = pt((x / l) * rr, (y / l) * rr, (z / l) * rr)
      const depth = (zr / R + 1) / 2
      dots.push({
        x: px,
        y: py,
        z: zr,
        r: ((o.rBase ?? 1.1) + (o.rDepth ?? 1.7) * depth) * (1 - 0.25 * edge) * rs,
        white: 0.52 - 0.44 * depth + 0.18 * edge,
        a: 0.4 + 0.6 * depth,
      })
    }
  }
  return finalizeFrame(dots, [], o.rMin)
}

// Morph: a dotted outline cycling circle -> triangle -> square -> circle —
// "shaping". Each shape is a closed path parameterised by arc length
// (top-centre start, clockwise); every frame blends the two neighbouring
// paths, then lays dots evenly along the blended outline.

type Path = (f: number) => [number, number]

function smoothE(x: number): number {
  return x * x * (3 - 2 * x)
}

function polyPath(verts: ReadonlyArray<readonly [number, number]>): Path {
  const V = verts.length
  const L: number[] = []
  let total = 0
  for (let i = 0; i < V; i++) {
    const a = verts[i]!
    const b = verts[(i + 1) % V]!
    const l = Math.hypot(b[0] - a[0], b[1] - a[1])
    L.push(l)
    total += l
  }
  return (f) => {
    let target = f * total
    let i = 0
    while (target > L[i]! && i < V - 1) {
      target -= L[i]!
      i++
    }
    const a = verts[i]!
    const b = verts[(i + 1) % V]!
    const ff = L[i] ? Math.min(1, target / L[i]!) : 0
    return [a[0] + (b[0] - a[0]) * ff, a[1] + (b[1] - a[1]) * ff]
  }
}

const MORPH_CIRCLE: Path = (f) => {
  const a = -Math.PI / 2 + f * 2 * Math.PI
  return [Math.cos(a) * 0.24, Math.sin(a) * 0.24]
}
const MORPH_TRIANGLE = polyPath([
  [0.0, -0.26],
  [0.24, 0.16],
  [-0.24, 0.16],
])
// 5-vertex walk so the path starts at top-centre like the other shapes
const MORPH_SQUARE = polyPath([
  [0, -0.2],
  [0.2, -0.2],
  [0.2, 0.2],
  [-0.2, 0.2],
  [-0.2, -0.2],
])
const MORPH_CYCLE: Path[] = [MORPH_CIRCLE, MORPH_TRIANGLE, MORPH_SQUARE]

// low floor keeps sparse outlines possible while never degenerating
function morphN(d: number): number {
  return Math.max(6, Math.round(34 * d))
}

const MORPH_HOLD = 1.4
const MORPH_MORPH = 0.9
const MORPH_SEG = MORPH_HOLD + MORPH_MORPH

const frameMorph: ModeFrame = (size, t, o) => {
  const K = MORPH_CYCLE.length
  const tc = t % (MORPH_SEG * K)
  const k = Math.floor(tc / MORPH_SEG)
  const local = tc - k * MORPH_SEG
  const m = local > MORPH_HOLD ? smoothE((local - MORPH_HOLD) / MORPH_MORPH) : 0
  const sprd = o.spread ?? 1

  const pA = MORPH_CYCLE[k]!
  const pB = MORPH_CYCLE[(k + 1) % K]!
  const M = 160
  const pts: Array<[number, number]> = []
  for (let i = 0; i < M; i++) {
    const f = i / M
    const a = pA(f)
    const b = pB(f)
    pts.push([(a[0] + (b[0] - a[0]) * m) * sprd, (a[1] + (b[1] - a[1]) * m) * sprd])
  }
  const L: number[] = []
  let total = 0
  for (let i = 0; i < M; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % M]!
    const l = Math.hypot(b[0] - a[0], b[1] - a[1])
    L.push(l)
    total += l
  }

  const n = morphN(o.iconD ?? 1)
  const re = (o.rDot ?? 0.021) * 1.35 * sprd
  const pulse = 1 + 0.02 * Math.sin(local * 3.1)

  const dots: Dot[] = []
  const c2 = size / 2
  let seg = 0
  let acc = 0
  for (let k2 = 0; k2 < n; k2++) {
    const target = (k2 / n) * total
    while (acc + L[seg]! < target && seg < M - 1) {
      acc += L[seg]!
      seg++
    }
    const a = pts[seg]!
    const b = pts[(seg + 1) % M]!
    const f = L[seg] ? Math.min(1, (target - acc) / L[seg]!) : 0
    const x = (a[0] + (b[0] - a[0]) * f) * pulse
    const y = (a[1] + (b[1] - a[1]) * f) * pulse
    dots.push({
      x: c2 + x * size,
      y: c2 + y * size,
      z: 0,
      r: Math.max(0.35, re * size),
      white: 0.1,
    })
  }
  return finalizeFrame(dots, [], o.rMin)
}

// ---- mode registry + density profiles ----------------------------------

type ModeKey = 'orbits' | 'globe' | 'rubik' | 'wave' | 'web' | 'braid' | 'ribbon' | 'ring' | 'morph'

const MODE_FRAMES: Record<ModeKey, ModeFrame> = {
  orbits: frameOrbits,
  globe: frameGlobe,
  rubik: frameRubik,
  wave: frameWave,
  web: frameWeb,
  braid: frameBraid,
  ribbon: frameRibbon,
  // ring shares ribbon's geometry — the `faceOn` profile flag switches it
  ring: frameRibbon,
  morph: frameMorph,
}

const STATE_TO_MODE: Record<OrbState, ModeKey> = {
  working: 'orbits',
  searching: 'globe',
  solving: 'rubik',
  listening: 'wave',
  connecting: 'web',
  weaving: 'braid',
  composing: 'ribbon',
  breathing: 'ring',
  shaping: 'morph',
}

// 2-D lattices (rings x dots-per-ring) come in pairs — each side takes
// sqrt(scale) so the TOTAL dot count scales by `scale`; flat lists scale
// linearly. `iconD` sets the morph outline's sampling density.
const COUNT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['latRings', 'lonDensity'],
  ['rings', 'lonDensity'],
  ['lanes', 'segs'],
]
const COUNT_KEYS = ['orbitN', 'ghostN', 'nodeN', 'strandN', 'signals'] as const
const ICON_DENSITY_KEYS = ['iconD'] as const
const RADIUS_KEYS = [
  'rBase',
  'rDepth',
  'rActive',
  'rDot',
  'ghostR',
  'partR',
  'partRDepth',
  'nodeR',
  'nodeRDepth',
] as const

function scaleCounts(opts: ModeOpts, scale: number): ModeOpts {
  const out: ModeOpts = { ...opts }
  const done = new Set<string>()
  const rt = Math.sqrt(scale)
  for (const [a, b] of COUNT_PAIRS) {
    const va = out[a]
    const vb = out[b]
    if (va != null && vb != null && !done.has(a) && !done.has(b)) {
      out[a] = Math.max(2, Math.round(va * rt))
      out[b] = Math.max(2, Math.round(vb * rt))
      done.add(a)
      done.add(b)
    }
  }
  for (const k of COUNT_KEYS) {
    const v = out[k]
    // 0 means the mode opted out of that layer entirely (ring has no ghost
    // sphere) — scaling must not resurrect it as a single stray dot
    if (v != null && v !== 0 && !done.has(k)) out[k] = Math.max(1, Math.round(v * scale))
  }
  for (const k of ICON_DENSITY_KEYS) {
    const v = out[k]
    if (v != null) out[k] = Math.max(0.02, v * scale)
  }
  return out
}

function scaleRadii(opts: ModeOpts, scale: number): ModeOpts {
  const out: ModeOpts = { ...opts }
  for (const k of RADIUS_KEYS) {
    const v = out[k]
    if (v != null) out[k] = v * scale
  }
  out.rSizeMul = (out.rSizeMul ?? 1) * scale
  return out
}

/** Base (fine) density profiles per mode, before preset multipliers. */
const BASE_PROFILES: Record<ModeKey, ModeOpts> = {
  globe: { latRings: 17, lonDensity: 44, rBase: 0.6, rDepth: 1.7, rBoost: 1.0, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
  orbits: { orbitN: 12, ghostN: 40, ghostR: 0.9, ghostA: 0.5, particles: 3, partR: 1.2, partRDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  rubik: { latRings: 15, lonDensity: 40, moveCount: 14, rBase: 0.6, rDepth: 1.7, rActive: 0.3, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
  wave: { rings: 15, lonDensity: 40, rBase: 0.6, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
  web: { nodeN: 30, thr: 0.72, signals: 5, nodeR: 1.4, nodeRDepth: 1.8, lineW: 0.8, rsPow: 0.6, rMin: 0.3 },
  braid: { strandN: 52, turns: 3.0, ghostN: 150, rBase: 1.2, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  ribbon: { lanes: 5, segs: 88, ghostN: 150, rBase: 1.1, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
  // ring shares ribbon's painter; faceOn cancels the camera tilt and moves
  // the undulation onto the radius, and there is no ghost sphere behind it
  ring: { lanes: 5, segs: 88, ghostN: 0, faceOn: 1, rBase: 1.1, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
  morph: { rDot: 0.021, iconD: 1, rMin: 0.25 },
}

interface Preset {
  speed: number
  count: number
  size: number
  /** Extra mode opts merged verbatim after scaling. */
  extra?: ModeOpts
}

/** The shipped tunings: nine states x two sizes, baked from the tuning session. */
const PRESETS: Record<ModeKey, Record<OrbSize, Preset>> = {
  orbits: { 64: { speed: 1.885, count: 1, size: 1 }, 20: { speed: 3.9, count: 0.238, size: 2.4 } },
  globe: {
    64: { speed: 2.015, count: 0.42, size: 1.15, extra: { scanMul: 4.08, dimBase: 0.45 } },
    20: { speed: 2.665, count: 0.105, size: 1.75, extra: { scanMul: 4.335, dimBase: 0.45 } },
  },
  rubik: { 64: { speed: 1.82, count: 0.35, size: 1.05 }, 20: { speed: 1.95, count: 0.088, size: 1.9 } },
  wave: { 64: { speed: 4.388, count: 0.341, size: 1 }, 20: { speed: 3.998, count: 0.105, size: 1.6 } },
  web: { 64: { speed: 3.315, count: 1.35, size: 0.95 }, 20: { speed: 6.63, count: 0.25, size: 1.52 } },
  braid: { 64: { speed: 1.625, count: 0.5, size: 1 }, 20: { speed: 2.75, count: 0.1125, size: 1.36 } },
  ribbon: {
    64: { speed: 2.34, count: 0.25, size: 0.85, extra: { spin: 0, bandMul: 3.9, wobMul: 1 } },
    20: { speed: 3.12, count: 0.051, size: 1.073, extra: { spin: 0, bandMul: 4.94, wobMul: 1 } },
  },
  ring: {
    64: { speed: 3.24, count: 0.25, size: 0.956, extra: { spin: 0, bandMul: 3.627, wobMul: 0.368 } },
    20: { speed: 3.78, count: 0.028, size: 1.622, extra: { spin: 0, bandMul: 3.968, wobMul: 0.565 } },
  },
  morph: {
    64: { speed: 2.405, count: 0.702, size: 0.395, extra: { spread: 1.45 } },
    20: { speed: 2.08, count: 0.53, size: 1.011, extra: { spread: 1.45 } },
  },
}

interface Resolved {
  mode: ModeKey
  speed: number
  opts: ModeOpts
}

const presetCache = new Map<string, Resolved>()

/** Resolve a (state, size) pair to its mode + fully-scaled draw options. */
function resolvePreset(state: OrbState, size: OrbSize): Resolved {
  const key = `${state}-${size}`
  const hit = presetCache.get(key)
  if (hit) return hit

  const mode = STATE_TO_MODE[state]
  const preset = PRESETS[mode][size]
  let opts: ModeOpts = { ...BASE_PROFILES[mode] }
  if (preset.count !== 1) opts = scaleCounts(opts, preset.count)
  if (preset.size !== 1) opts = scaleRadii(opts, preset.size)
  if (preset.extra) opts = { ...opts, ...preset.extra }

  const resolved: Resolved = { mode, speed: preset.speed, opts }
  presetCache.set(key, resolved)
  return resolved
}

// ---- theme + reduced motion --------------------------------------------

function ancestorTheme(el: Element | null): boolean | null {
  let node: Element | null = el
  while (node) {
    const attr = node.getAttribute('data-theme')
    if (attr === 'dark') return true
    if (attr === 'light') return false
    if (node.classList.contains('dark')) return true
    if (node.classList.contains('light')) return false
    node = node.parentElement
  }
  return null
}

function systemDark(): boolean {
  return typeof matchMedia === 'undefined' || matchMedia('(prefers-color-scheme: dark)').matches
}

/** Resolve the effective dark/light substrate for a mounted element. */
function useResolvedDark(theme: OrbTheme, hostRef: React.RefObject<Element | null>): boolean {
  const [dark, setDark] = React.useState(true)

  React.useEffect(() => {
    if (theme === 'dark') {
      setDark(true)
      return
    }
    if (theme === 'light') {
      setDark(false)
      return
    }

    const resolve = () => {
      const fromTree = ancestorTheme(hostRef.current)
      setDark(fromTree ?? systemDark())
    }
    resolve()

    const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null
    const onMq = () => resolve()
    mq?.addEventListener('change', onMq)

    let mo: MutationObserver | null = null
    if (typeof MutationObserver !== 'undefined' && hostRef.current) {
      mo = new MutationObserver(resolve)
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
        subtree: true,
      })
    }

    return () => {
      mq?.removeEventListener('change', onMq)
      mo?.disconnect()
    }
  }, [theme, hostRef])

  return dark
}

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

// Module scope so the identity is stable across renders.
function subscribeToReducedMotion(notify: () => void) {
  if (typeof matchMedia === 'undefined') return () => {}
  const mq = matchMedia(REDUCE_QUERY)
  mq.addEventListener('change', notify)
  return () => mq.removeEventListener('change', notify)
}

/** Live `prefers-reduced-motion` — reduced users get a static frame. */
function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    () => typeof matchMedia !== 'undefined' && matchMedia(REDUCE_QUERY).matches,
    () => false,
  )
}

// ---- the component -------------------------------------------------------

const ORB_LABELS: Record<OrbState, string> = {
  working: 'Working…',
  searching: 'Searching…',
  solving: 'Solving…',
  listening: 'Listening…',
  connecting: 'Connecting…',
  weaving: 'Weaving…',
  composing: 'Composing…',
  breathing: 'Thinking…',
  shaping: 'Shaping…',
}

export function ThinkingOrb({
  state = 'working',
  size = 64,
  theme = 'auto',
  speed = 1,
  paused = false,
  style,
  'aria-label': ariaLabel,
  ...rest
}: ThinkingOrbProps) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const dark = useResolvedDark(theme, ref)
  const reduced = usePrefersReducedMotion()

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { mode, speed: baseSpeed, opts } = resolvePreset(state, size)
    const draw = MODE_FRAMES[mode]
    const effSpeed = baseSpeed * speed

    const frame = (tSec: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      paintFrame(ctx, draw(size, tSec, opts), dark)
    }

    // reduced motion -> one static, deterministic frame
    if (reduced) {
      frame(0.6)
      return
    }

    let raf = 0
    let running = false
    const loop = () => {
      frame((performance.now() / 1000) * effSpeed)
      if (running) raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || paused) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // draw at least one frame even when paused/offscreen
    frame((performance.now() / 1000) * effSpeed)

    // pause offscreen + on hidden tabs — free when not visible
    let visible = true
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry ? entry.isIntersecting : true
            if (visible && document.visibilityState !== 'hidden') start()
            else stop()
          })
        : null
    io?.observe(canvas)
    const onVis = () => {
      if (document.visibilityState === 'hidden') stop()
      else if (visible) start()
    }
    document.addEventListener('visibilitychange', onVis)
    if (!io) start()

    return () => {
      stop()
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [state, size, dark, speed, paused, reduced])

  return (
    <canvas
      ref={ref}
      role="img"
      data-state={state}
      aria-label={ariaLabel ?? ORB_LABELS[state]}
      style={{ width: size, height: size, display: 'block', ...style }}
      {...rest}
    />
  )
}
