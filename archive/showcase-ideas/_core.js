/* ─────────────────────────────────────────────────────────────
   Shared spring engine + demo factories for the showcase concepts.
   Same integrator and the same four presets the registry ships, so
   what these mock-ups feel like is what the components feel like.
   ───────────────────────────────────────────────────────────── */
'use strict'

const SPRINGS = {
  snap: { k: 500, c: 40 },
  bounce: { k: 400, c: 14 },
  settle: { k: 260, c: 24 },
  fling: { k: 300, c: 30 },
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

const live = new Set()
let looping = false
let last = 0
export let SPEED = { value: 1 }

function frame(t) {
  const dt = Math.min(0.05, ((t - last) / 1000) * SPEED.value)
  last = t
  for (const s of live) s.step(dt)
  if (live.size) requestAnimationFrame(frame)
  else looping = false
}
function kick() {
  if (looping) return
  looping = true
  last = performance.now()
  requestAnimationFrame(frame)
}

export class Spring {
  constructor(v, preset, cb) {
    this.x = v
    this.v = 0
    this.t = v
    this.p = preset
    this.cb = cb
    this.on = false
  }
  get preset() {
    return this.p
  }
  set preset(p) {
    this.p = p
  }
  to(t) {
    if (reduced()) return this.set(t)
    this.t = t
    if (!this.on) {
      this.on = true
      live.add(this)
      kick()
    }
  }
  set(t) {
    this.x = this.t = t
    this.v = 0
    this.on = false
    live.delete(this)
    this.cb(this.x)
  }
  push(v) {
    if (reduced()) return
    this.v = v
    if (!this.on) {
      this.on = true
      live.add(this)
      kick()
    }
  }
  step(dt) {
    const { k, c } = SPRINGS[this.p]
    const n = Math.max(1, Math.ceil(dt / 0.002))
    const h = dt / n
    for (let i = 0; i < n; i++) {
      const a = -k * (this.x - this.t) - c * this.v
      this.v += a * h
      this.x += this.v * h
    }
    if (Math.abs(this.x - this.t) < 0.0008 && Math.abs(this.v) < 0.008) {
      this.x = this.t
      this.v = 0
      this.on = false
      live.delete(this)
    }
    this.cb(this.x)
  }
}

const HEART =
  'M12 20.5 3.8 12.3a5 5 0 0 1 7.1-7.1l1.1 1.1 1.1-1.1a5 5 0 1 1 7.1 7.1Z'

/* ── like-button ───────────────────────────────────────────── */
export function likeButton(host, opts = {}) {
  host.innerHTML = `<button class="d-like" aria-pressed="false" aria-label="Like">
    <svg viewBox="0 0 24 24" width="${opts.size || 30}" height="${opts.size || 30}" fill="none">
      <path d="${HEART}" stroke-width="1.7" stroke-linejoin="round"/>
    </svg></button>`
  const btn = host.querySelector('button')
  const svg = btn.querySelector('svg')
  const path = btn.querySelector('path')
  let on = false
  const scale = new Spring(1, 'bounce', (x) => (svg.style.transform = `scale(${x.toFixed(3)})`))
  const fill = new Spring(0, 'bounce', (x) => path.setAttribute('fill-opacity', x.toFixed(3)))
  const paint = () => {
    const c = on ? 'var(--accent)' : 'currentColor'
    path.setAttribute('stroke', c)
    path.setAttribute('fill', c)
  }
  btn.addEventListener('pointerenter', () => scale.to(1.12))
  btn.addEventListener('pointerleave', () => scale.to(1))
  btn.addEventListener('pointerdown', () => scale.to(0.86))
  btn.addEventListener('pointerup', () => scale.to(1.12))
  btn.addEventListener('click', () => {
    on = !on
    btn.setAttribute('aria-pressed', String(on))
    paint()
    fill.to(on ? 1 : 0)
    scale.set(0.86)
    scale.to(1)
    opts.onChange?.(on)
  })
  paint()
  return {
    primary: scale,
    fire() {
      btn.click()
    },
    spring(p) {
      scale.preset = p
      fill.preset = p
    },
  }
}

/* ── scrub ─────────────────────────────────────────────────── */
export function scrub(host, opts = {}) {
  host.innerHTML = `<div class="d-scrub"><div class="d-track"><i class="d-buf"></i><i class="d-fill"></i><b class="d-handle"></b></div>
    <div class="d-read"><span class="v">0:00</span><span class="f">1×</span></div></div>`
  const track = host.querySelector('.d-track')
  const fillEl = host.querySelector('.d-fill')
  const handle = host.querySelector('.d-handle')
  const readV = host.querySelector('.v')
  const readF = host.querySelector('.f')
  host.querySelector('.d-buf').style.width = '72%'

  let value = 0.34
  let dragging = false
  let ratio = 1
  const pos = new Spring(value, 'settle', (x) => {
    const p = Math.max(0, Math.min(1, x))
    handle.style.left = `${p * 100}%`
    fillEl.style.width = `${p * 100}%`
    const secs = Math.round(p * 222)
    readV.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  })

  const setRatio = (r) => {
    ratio = r
    readF.textContent = r === 1 ? '1×' : `1/${Math.round(1 / r)}×`
    readF.style.color = r === 1 ? '' : 'var(--accent)'
  }
  setRatio(1)

  let startX = 0
  let startV = 0
  track.addEventListener('pointerdown', (e) => {
    dragging = true
    track.setPointerCapture(e.pointerId)
    const r = track.getBoundingClientRect()
    value = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    startX = e.clientX
    startV = value
    pos.to(value)
  })
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const r = track.getBoundingClientRect()
    // Precision rises with vertical distance from the track — the whole point.
    const away = Math.max(0, Math.abs(e.clientY - (r.top + r.height / 2)) - 16)
    const rr = 1 / (1 + away / 26)
    setRatio(rr)
    value = Math.max(0, Math.min(1, startV + ((e.clientX - startX) / r.width) * rr))
    pos.to(value)
  })
  const end = () => {
    dragging = false
    setRatio(1)
  }
  track.addEventListener('pointerup', end)
  track.addEventListener('pointercancel', end)

  return {
    primary: pos,
    fire() {
      pos.set(0.05)
      pos.to(0.72)
    },
    spring(p) {
      pos.preset = p
    },
  }
}

/* ── hold-to-confirm ───────────────────────────────────────── */
export function holdToConfirm(host, opts = {}) {
  host.innerHTML = `<button class="d-hold"><i class="d-charge"></i><span>${opts.label || 'Hold to delete'}</span></button>`
  const btn = host.querySelector('button')
  const charge = btn.querySelector('.d-charge')
  let held = false
  let raf = 0
  let p = 0
  const DUR = 1100

  const relax = new Spring(0, 'snap', (x) => {
    charge.style.transform = `scaleX(${Math.max(0, x).toFixed(4)})`
  })

  const tick = (t0) => (t) => {
    if (!held) return
    p = Math.min(1, (t - t0) / DUR)
    relax.set(p)
    if (p >= 1) {
      held = false
      btn.classList.add('done')
      setTimeout(() => {
        btn.classList.remove('done')
        relax.to(0)
      }, 850)
      return
    }
    raf = requestAnimationFrame(tick(t0))
  }

  btn.addEventListener('pointerdown', () => {
    if (btn.classList.contains('done')) return
    held = true
    const t0 = performance.now() - p * DUR
    raf = requestAnimationFrame(tick(t0))
  })
  const release = () => {
    if (!held) return
    held = false
    cancelAnimationFrame(raf)
    // Unwinds rather than snapping — you feel how close you got.
    relax.to(0)
    relax.push(-0.6)
    p = 0
  }
  btn.addEventListener('pointerup', release)
  btn.addEventListener('pointerleave', release)

  return {
    primary: relax,
    fire() {
      relax.set(0)
      relax.to(1)
      setTimeout(() => relax.to(0), 700)
    },
    spring(pr) {
      relax.preset = pr
    },
  }
}

/* ── undo-toast ────────────────────────────────────────────── */
export function undoToast(host) {
  host.innerHTML = `<div class="d-toast"><span>Deleted “Draft — pricing page”</span><button>Undo</button><i class="d-clock"></i></div>`
  const el = host.querySelector('.d-toast')
  const clock = host.querySelector('.d-clock')
  let y = 0
  let a = 1
  const put = () => {
    el.style.transform = `translateY(${y.toFixed(1)}px)`
    el.style.opacity = a.toFixed(3)
  }
  const sy = new Spring(0, 'bounce', (v) => {
    y = v
    put()
  })
  const sa = new Spring(1, 'settle', (v) => {
    a = v
    put()
  })
  let t0 = performance.now()
  let paused = false
  const drain = (t) => {
    if (!paused) {
      const p = Math.max(0, 1 - (t - t0) / 9000)
      clock.style.transform = `scaleX(${p.toFixed(4)})`
    } else {
      t0 = t - (1 - parseFloat(clock.style.transform.slice(8) || 1)) * 9000
    }
    requestAnimationFrame(drain)
  }
  requestAnimationFrame(drain)
  el.addEventListener('pointerenter', () => (paused = true))
  el.addEventListener('pointerleave', () => (paused = false))
  const replay = () => {
    sy.set(56)
    sa.set(0)
    sy.to(0)
    sa.to(1)
    t0 = performance.now()
  }
  host.querySelector('button').addEventListener('click', replay)
  return {
    primary: sy,
    fire: replay,
    spring(p) {
      sy.preset = p
    },
  }
}

export const DEMOS = {
  'like-button': {
    title: 'Like Button',
    cat: 'tactile-feedback',
    spring: 'bounce',
    states: 6,
    kb: '1.4kb',
    line: 'Overshoots on press and settles. The recoil is the message.',
    why: 'Ninety percent of the work is the twenty milliseconds after you let go.',
    build: likeButton,
  },
  scrub: {
    title: 'Scrub',
    cat: 'input-utility',
    spring: 'settle',
    states: 5,
    kb: '2.1kb',
    line: 'Precision rises as the pointer pulls away from the track.',
    why: 'A two-hour video placed to the second without ever letting go.',
    build: scrub,
  },
  'hold-to-confirm': {
    title: 'Hold To Confirm',
    cat: 'input-utility',
    spring: 'snap',
    states: 5,
    kb: '1.2kb',
    line: 'A second of deliberate pressure, unwinding if you let go.',
    why: 'The only confirmation muscle memory cannot dismiss.',
    build: holdToConfirm,
  },
  'undo-toast': {
    title: 'Undo Toast',
    cat: 'input-utility',
    spring: 'settle',
    states: 4,
    kb: '1.5kb',
    line: 'A grace period with a clock that stalls when you reach for it.',
    why: 'The undo window is a thing you can see, not a thing you guess at.',
    build: undoToast,
  },
}
