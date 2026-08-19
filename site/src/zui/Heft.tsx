import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';
import { VelocityTracker } from '../lib/velocity';

/**
 * Faithful site reimplementation of the registry's `heft`:
 * a box of objects that behave like real objects. Drag one and everything it
 * touches gets shoved aside; anything resting on top loses its floor and
 * drops. Real gravity, contacts, and friction in one file.
 *
 * Engine: axis-aligned rigid bodies, fixed-timestep impulse solver.
 * Rendering is transform-only (translate3d), written imperatively per frame.
 */

const G = 1800; // px/s²
const SUBSTEP = 1 / 120;
const VEL_ITERATIONS = 8; // sequential-impulse passes per substep
const POS_ITERATIONS = 3; // penetration passes — position only, adds no energy
const POS_PERCENT = 0.8; // fraction of penetration corrected per pass
const FRICTION = 0.5; // Coulomb-ish
const SLOP = 0.5; // allowed penetration; contacts must persist to stay solved
const SLEEP_SPEED = 5; // px/s
const SLEEP_FRAMES = 24;

export interface HeftBodySpec {
  w: number;
  h: number;
  label?: string;
  fontSize?: number;
  x?: number;
  y?: number;
}

interface Body {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  invMass: number;
  kinematic: boolean;
  label?: string;
  fontSize?: number;
}

/** one contact resolved this substep; `b === null` means a static wall */
interface Manifold {
  a: Body;
  b: Body | null;
  nx: number; // unit normal — the direction `a` separates along
  ny: number;
  key: string; // warm-start identity, stable while the contact persists
  invSum: number;
  jn: number; // accumulated normal impulse
  jt: number; // accumulated tangent (friction) impulse
}

export function Heft({
  height = 360,
  initialBodies,
  startAsleep = false,
  onContacts,
  spawnCount = 0,
}: {
  height?: number;
  initialBodies: HeftBodySpec[];
  /** bodies hold position until first pointer interaction (404: nothing autoplays) */
  startAsleep?: boolean;
  onContacts?: (n: number) => void;
  /** increment to drop a new object in */
  spawnCount?: number;
}) {
  const reduced = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const bodies = useRef<Body[]>([]);
  const els = useRef(new Map<number, HTMLDivElement>());
  const raf = useRef(0);
  const running = useRef(false);
  const stillFrames = useRef(0);
  const nextId = useRef(0);
  const lastContacts = useRef(-1);
  const drag = useRef<{
    id: number;
    dx: number;
    dy: number;
    tx: VelocityTracker;
    ty: VelocityTracker;
    targetX: number;
    targetY: number;
  } | null>(null);
  const [ids, setIds] = useState<number[]>([]);
  const deepOverlap = useRef(false);
  /** warm-start store: accumulated impulses keyed by contact identity */
  const contactCache = useRef(new Map<string, { jn: number; jt: number }>());
  const onContactsRef = useRef(onContacts);
  onContactsRef.current = onContacts;

  const bounds = useCallback(() => {
    const el = container.current;
    return { w: el?.clientWidth ?? 600, h: el?.clientHeight ?? height };
  }, [height]);

  // ——— engine ———

  const step = useCallback((dt: number): number => {
    const { w: W, h: H } = bounds();
    const bs = bodies.current;
    const cache = contactCache.current;

    const d = drag.current;
    if (d) {
      const b = bs.find((x) => x.id === d.id);
      if (b) {
        b.vx = d.tx.read();
        b.vy = d.ty.read();
        b.x = d.targetX;
        b.y = d.targetY;
      }
    }

    for (const b of bs) {
      if (b.kinematic) continue;
      b.vy += G * dt;
    }

    // ——— manifolds: walls (floor + sides, open top), then body pairs ———
    const ms: Manifold[] = [];
    const add = (a: Body, b: Body | null, nx: number, ny: number, key: string) => {
      const prev = cache.get(key);
      ms.push({
        a,
        b,
        nx,
        ny,
        key,
        invSum: a.invMass + (b ? b.invMass : 0),
        jn: prev ? prev.jn : 0,
        jt: prev ? prev.jt : 0,
      });
    };

    for (const b of bs) {
      if (b.kinematic) continue;
      if (b.y + b.h > H) add(b, null, 0, -1, `${b.id}|floor`);
      if (b.x < 0) add(b, null, 1, 0, `${b.id}|left`);
      if (b.x + b.w > W) add(b, null, -1, 0, `${b.id}|right`);
    }
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i];
        const b = bs[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox <= 0 || oy <= 0) continue;
        if (a.invMass + b.invMass === 0) continue;
        // resolve along the axis of least penetration
        const yAxis = oy <= ox;
        const s = yAxis
          ? a.y + a.h / 2 < b.y + b.h / 2
            ? -1
            : 1
          : a.x + a.w / 2 < b.x + b.w / 2
            ? -1
            : 1;
        add(a, b, yAxis ? 0 : s, yAxis ? s : 0, `${a.id}|${b.id}|${yAxis ? 'y' : 'x'}|${s}`);
      }
    }

    // impulse along the contact normal (jn) and its tangent t = (-ny, nx) (jt)
    const applyImpulse = (m: Manifold, jn: number, jt: number) => {
      const ix = m.nx * jn - m.ny * jt;
      const iy = m.ny * jn + m.nx * jt;
      if (!m.a.kinematic) {
        m.a.vx += ix * m.a.invMass;
        m.a.vy += iy * m.a.invMass;
      }
      if (m.b && !m.b.kinematic) {
        m.b.vx -= ix * m.b.invMass;
        m.b.vy -= iy * m.b.invMass;
      }
    };

    // warm start: last substep's impulse is this substep's first guess. Without it
    // a stack cannot converge in a bounded iteration count — the pile creeps, never
    // sleeps, and gravity accumulates in every resting body.
    for (const m of ms) if (m.jn !== 0 || m.jt !== 0) applyImpulse(m, m.jn, m.jt);

    for (let it = 0; it < VEL_ITERATIONS; it++) {
      for (const m of ms) {
        if (m.invSum === 0) continue;
        const { a, b, nx, ny } = m;
        const bvx = b ? b.vx : 0;
        const bvy = b ? b.vy : 0;
        // separating speed along a's outward normal; negative means still closing
        const sn = (a.vx - bvx) * nx + (a.vy - bvy) * ny;
        const oldN = m.jn;
        // clamp the ACCUMULATED impulse, not the increment — contacts push, never pull
        m.jn = Math.max(0, oldN - sn / m.invSum);
        const dn = m.jn - oldN;
        const st = (a.vx - bvx) * -ny + (a.vy - bvy) * nx;
        const maxF = FRICTION * m.jn;
        const oldT = m.jt;
        m.jt = Math.max(-maxF, Math.min(maxF, oldT - st / m.invSum));
        applyImpulse(m, dn, m.jt - oldT);
      }
    }
    for (const m of ms) cache.set(m.key, { jn: m.jn, jt: m.jt });
    if (cache.size > 512) {
      const live = new Set(ms.map((m) => m.key));
      for (const k of cache.keys()) if (!live.has(k)) cache.delete(k);
    }

    for (const b of bs) {
      if (b.kinematic) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }

    // penetration is corrected positionally, so the solver never injects energy.
    // SLOP is deliberately left behind: a contact must stay slightly overlapped or
    // it drops out of the manifold list and the body free-falls for a substep.
    let worst = 0;
    for (let it = 0; it < POS_ITERATIONS; it++) {
      for (const m of ms) {
        if (m.invSum === 0) continue;
        const { a, b, nx, ny } = m;
        let pen: number;
        if (!b) {
          pen = nx === 0 ? a.y + a.h - H : nx > 0 ? -a.x : a.x + a.w - W;
        } else {
          const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (ox <= 0 || oy <= 0) continue;
          pen = ny === 0 ? ox : oy;
        }
        if (it === 0 && pen > worst) worst = pen;
        if (pen <= SLOP) continue;
        const corr = (POS_PERCENT * (pen - SLOP)) / m.invSum;
        if (!a.kinematic) {
          a.x += nx * corr * a.invMass;
          a.y += ny * corr * a.invMass;
        }
        if (b && !b.kinematic) {
          b.x -= nx * corr * b.invMass;
          b.y -= ny * corr * b.invMass;
        }
      }
    }

    deepOverlap.current = worst > SLOP * 4;
    return ms.length;
  }, [bounds]);

  const render = useCallback(() => {
    for (const b of bodies.current) {
      const el = els.current.get(b.id);
      if (el) el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
    }
  }, []);

  const settleInstant = useCallback(() => {
    // reduced motion: relax to rest synchronously, render once
    for (let i = 0; i < 1200; i++) {
      step(SUBSTEP);
      const moving = bodies.current.some(
        (b) => !b.kinematic && (Math.abs(b.vx) > SLEEP_SPEED || Math.abs(b.vy) > SLEEP_SPEED),
      );
      if (!moving && i > 10) break;
    }
    render();
  }, [step, render]);

  const loop = useCallback(() => {
    let last = performance.now();
    const frame = (now: number) => {
      const elapsed = Math.max(0, Math.min(0.033, (now - last) / 1000));
      last = now;
      let contacts = 0;
      let acc = elapsed;
      while (acc > 0) {
        const dt = Math.min(SUBSTEP, acc);
        contacts = step(dt);
        acc -= dt;
      }
      render();
      if (contacts !== lastContacts.current) {
        lastContacts.current = contacts;
        onContactsRef.current?.(contacts);
      }
      const moving =
        drag.current !== null ||
        deepOverlap.current ||
        bodies.current.some((b) => Math.abs(b.vx) > SLEEP_SPEED || Math.abs(b.vy) > SLEEP_SPEED);
      stillFrames.current = moving ? 0 : stillFrames.current + 1;
      if (stillFrames.current > SLEEP_FRAMES) {
        running.current = false;
        return; // sleep — no idle rAF burn, no autoplaying motion
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  }, [step, render]);

  const wake = useCallback(() => {
    stillFrames.current = 0;
    if (reduced) {
      settleInstant();
      return;
    }
    if (!running.current) {
      running.current = true;
      loop();
    }
  }, [loop, reduced, settleInstant]);

  // ——— seeding ———

  useEffect(() => {
    const { w: W, h: H } = bounds();
    const bs: Body[] = [];
    // auto-placed bodies fill a row along the floor and wrap onto the next row up.
    // Clamping them all to the same x instead would seed the pile deeply
    // interpenetrated, which no solver can unpick cleanly.
    let cursor = 16;
    let rowFloor = H;
    let rowH = 0;
    for (const spec of initialBodies) {
      const auto = spec.x === undefined;
      if (auto && cursor + spec.w > W - 8 && cursor > 16) {
        rowFloor -= rowH;
        cursor = 16;
        rowH = 0;
      }
      const id = nextId.current++;
      bs.push({
        id,
        x: spec.x ?? Math.min(cursor, Math.max(0, W - spec.w - 8)),
        y: spec.y ?? rowFloor - spec.h,
        w: spec.w,
        h: spec.h,
        vx: 0,
        vy: 0,
        invMass: 1 / ((spec.w * spec.h) / 1000),
        kinematic: false,
        label: spec.label,
        fontSize: spec.fontSize,
      });
      if (auto) {
        cursor += spec.w + 14;
        if (spec.h > rowH) rowH = spec.h;
      }
    }
    bodies.current = bs;
    setIds(bs.map((b) => b.id));
    if (!startAsleep) {
      // settle the seed stack once so nothing hovers
      requestAnimationFrame(() => {
        render();
        wake();
      });
    } else {
      requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // spawn on demand
  const spawned = useRef(0);
  useEffect(() => {
    if (spawnCount <= spawned.current) return;
    const { w: W } = bounds();
    for (; spawned.current < spawnCount; spawned.current++) {
      const id = nextId.current++;
      const w = 40 + ((id * 37) % 50);
      const h = 32 + ((id * 53) % 46);
      bodies.current.push({
        id,
        x: W / 2 - w / 2 + (((id * 91) % 120) - 60),
        y: -h - 4,
        w,
        h,
        vx: 0,
        vy: 60,
        invMass: 1 / ((w * h) / 1000),
        kinematic: false,
        label: `OBJ-${String(id + 1).padStart(2, '0')}`,
      });
    }
    setIds(bodies.current.map((b) => b.id));
    wake();
  }, [spawnCount, wake, bounds]);

  // ——— drag ———

  const onPointerDown = (e: React.PointerEvent) => {
    const target = (e.target as HTMLElement).closest('[data-heft-id]') as HTMLElement | null;
    wake();
    if (!target) return;
    e.preventDefault();
    const id = Number(target.dataset.heftId);
    const b = bodies.current.find((x) => x.id === id);
    const rect = container.current!.getBoundingClientRect();
    if (!b) return;
    b.kinematic = true;
    b.invMass = 0;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    drag.current = {
      id,
      dx: px - b.x,
      dy: py - b.y,
      tx: new VelocityTracker(),
      ty: new VelocityTracker(),
      targetX: b.x,
      targetY: b.y,
    };
    drag.current.tx.push(b.x);
    drag.current.ty.push(b.y);
    target.classList.add('contact');
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    container.current?.classList.add('grabbing');
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const rect = container.current!.getBoundingClientRect();
    const { w: W, h: H } = bounds();
    const b = bodies.current.find((x) => x.id === d.id);
    if (!b) return;
    d.targetX = Math.max(0, Math.min(W - b.w, e.clientX - rect.left - d.dx));
    d.targetY = Math.max(-b.h, Math.min(H - b.h, e.clientY - rect.top - d.dy));
    d.tx.push(d.targetX);
    d.ty.push(d.targetY);
    if (reduced) settleInstant();
    else wake();
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    const b = bodies.current.find((x) => x.id === d.id);
    if (b) {
      b.kinematic = false;
      b.invMass = 1 / ((b.w * b.h) / 1000);
      b.vx = d.tx.read();
      b.vy = d.ty.read();
      els.current.get(b.id)?.classList.remove('contact');
    }
    drag.current = null;
    container.current?.classList.remove('grabbing');
    wake();
  };

  return (
    <div
      ref={container}
      className="heft graph-bg"
      style={{ height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {ids.map((id) => {
        const b = bodies.current.find((x) => x.id === id);
        if (!b) return null;
        return (
          <div
            key={id}
            ref={(el) => {
              if (el) els.current.set(id, el);
              else els.current.delete(id);
            }}
            data-heft-id={id}
            className="heft-box grabbable"
            style={{
              width: b.w,
              height: b.h,
              transform: `translate3d(${b.x}px, ${b.y}px, 0)`,
              fontSize: b.fontSize,
            }}
          >
            {b.label ? <span className="mono heft-label">{b.label}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
