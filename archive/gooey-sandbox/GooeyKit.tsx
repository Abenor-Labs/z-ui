import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { Liquid } from 'liquid-gooey';

// ════════════════════════════════════════════════════════════════
// SANDBOX — components built on liquid-gooey (npm, MIT, v0.1.0)
//
// Ported from liquidgooey.txt. The sample was written against a
// different API shape; corrected against the real package:
//
//  1. <Liquid> takes blur / contrast / fill / shadow / filterPadding.
//     There is NO `type` prop — the effect lives on the item:
//     <Liquid.Item effect="morph" | "move">.
//  2. Position must be COMPONENT-DRIVEN: pass x / y / scale to
//     Liquid.Item and the library springs the element and its liquid
//     in sync. The sample's "animate the child's transform yourself"
//     pattern renders the blobs but produces no goo and no trail —
//     `observe` only re-measures, it does not drive the surface.
//  3. The merged silhouette is painted with the group's `fill`, so the
//     colour goes on <Liquid>, not only on the child.
//  4. Items must be IN FLOW, and must have a real layout box. For an
//     x/y-driven item the library injects an inline-block WRAPPER and
//     measures *that* with offsetWidth/offsetHeight — so:
//       - a `position: absolute` child leaves the wrapper 0x0 (no goo),
//       - a bare <span> child is `display: inline`, so width/height are
//         ignored and the wrapper is 0x0 as well (also no goo),
//       - `observe` recovers the size but pins the rect to the layout
//         origin, so the liquid stops following the motion.
//     Every blob below is therefore `display: block` with an explicit
//     size, and overlap is done by grid-stacking the wrapper divs the
//     library injects as direct children of the group — hence the
//     `> :first-child > div { grid-area: 1/1 }` selectors.
//  5. The filter region is sized from the group's offsetWidth/Height.
//     A 0x0 group clips the goo to a stub around the origin, so every
//     group gets a real box, plus `filterPadding` where blobs travel
//     outside it.
//
// Still true from the sample: keep text and fine detail OUTSIDE the
// filtered layer and stack it on top.
// This is a scratch demo, not a Z-UI registry component.
// ════════════════════════════════════════════════════════════════

const PURPLE = '#7c5cff';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

type Action = { label: string; icon: ReactNode; onClick?: () => void };
type TabDef = { label: string; value: string };
type DockItem = { label: string; icon: ReactNode; onClick?: () => void };

// ---------------------------------------------------------------
// 1. GooeyFab — plus button that splits into a fan of actions.
//    Actions start stacked under the trigger so they read as one
//    blob, then neck apart as they travel outward.
// ---------------------------------------------------------------
export function GooeyFab({
  actions = [],
  radius = 78,
  blur = 12,
  contrast = 20,
}: {
  actions?: Action[];
  radius?: number;
  blur?: number;
  contrast?: number;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const spread = 90; // degrees of arc
  const start = 180; // pointing left-ish

  const offset = (i: number) => {
    const step = actions.length > 1 ? spread / (actions.length - 1) : 0;
    const angle = ((start + i * step) * Math.PI) / 180;
    return {
      x: open ? Math.cos(angle) * radius : 0,
      y: open ? Math.sin(angle) * radius : 0,
    };
  };

  return (
    <div className="gfab" data-open={open}>
      <Liquid
        blur={reduced ? 0 : blur}
        contrast={contrast}
        fill={PURPLE}
        filterPadding={radius + 60}
      >
        <Liquid.Item>
          <span className="gfab-trigger-blob" />
        </Liquid.Item>
        {actions.map((a, i) => {
          const { x, y } = offset(i);
          return (
            <Liquid.Item
              key={a.label}
              x={x}
              y={y}
              scale={open ? 1 : 0.42}
              transition={reduced ? { duration: 0 } : 'bouncy'}
              delay={reduced ? 0 : open ? i * 30 : (actions.length - i) * 20}
            >
              <span className="gfab-action" />
            </Liquid.Item>
          );
        })}
      </Liquid>

      {/* icons ride above the goo layer, undistorted */}
      <div className="gfab-icons" aria-hidden={!open}>
        {actions.map((a, i) => {
          const { x, y } = offset(i);
          return (
            <button
              key={a.label}
              className="gfab-icon-btn"
              title={a.label}
              onClick={a.onClick}
              tabIndex={open ? 0 : -1}
              style={{
                transform: `translate(${x}px, ${y}px)`,
                opacity: open ? 1 : 0,
                transitionDelay: `${open ? i * 30 + 90 : 0}ms`,
              }}
            >
              {a.icon}
            </button>
          );
        })}
      </div>

      <button
        className="gfab-trigger"
        aria-expanded={open}
        aria-label={open ? 'Close actions' : 'Open actions'}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="gfab-plus" data-open={open}>
          +
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------
// 2. GooeyTabs — the active pill detaches, stretches across, and
//    re-forms on the new tab. effect="move" gives it the rubber tail.
// ---------------------------------------------------------------
export function GooeyTabs({
  tabs = [],
  value,
  onChange,
  blur = 9,
  contrast = 18,
}: {
  tabs?: TabDef[];
  value: string;
  onChange: (v: string) => void;
  blur?: number;
  contrast?: number;
}) {
  const [rects, setRects] = useState<{ left: number; width: number }[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  const measure = useCallback(() => {
    if (!listRef.current) return;
    const parent = listRef.current.getBoundingClientRect();
    const next = Array.from(listRef.current.children).map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - parent.left, width: r.width };
    });
    setRects(next);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [measure, tabs.length]);

  const activeIndex = tabs.findIndex((t) => t.value === value);
  const active = rects[activeIndex];

  return (
    <div className="gtabs">
      <Liquid
        blur={reduced ? 0 : blur}
        contrast={contrast}
        fill="rgba(124,92,255,.92)"
        filterPadding={40}
      >
        <Liquid.Item
          effect="move"
          move={{ springiness: 0.34, wobble: 0.62, stretch: 0.42, trail: 0.62 }}
          x={active?.left ?? 0}
          transition={reduced ? { duration: 0 } : { stiffness: 300, damping: 24 }}
        >
          <span className="gtabs-pill" style={{ width: active?.width ?? 0 }} />
        </Liquid.Item>
      </Liquid>

      <div className="gtabs-list" ref={listRef} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={t.value === value}
            className="gtabs-tab"
            onClick={() => onChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// 3. GooeyToggle — the handle necks out of the track and re-forms.
//    Track and handle are both Items, so they stay fused mid-travel.
// ---------------------------------------------------------------
export function GooeyToggle({
  checked,
  onChange,
  label,
  blur = 7,
  contrast = 24,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  blur?: number;
  contrast?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <label className="gtoggle">
      <input
        type="checkbox"
        className="gtoggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="gtoggle-visual" data-on={checked}>
        <Liquid
          blur={reduced ? 0 : blur}
          contrast={contrast}
          fill={checked ? 'rgba(124,92,255,.85)' : 'rgba(255,255,255,.20)'}
          filterPadding={20}
        >
          <Liquid.Item>
            <span className="gtoggle-track" />
          </Liquid.Item>
          <Liquid.Item
            x={checked ? 29 : 3}
            transition={reduced ? { duration: 0 } : 'bouncy'}
          >
            <span className="gtoggle-handle" />
          </Liquid.Item>
        </Liquid>
      </span>
      {label && <span className="gtoggle-label">{label}</span>}
    </label>
  );
}

// ---------------------------------------------------------------
// 4. GooeyDock — neighbours bulge toward the hovered icon and fuse
//    with it, then release. Distance falloff drives the scale.
// ---------------------------------------------------------------
export function GooeyDock({
  items = [],
  blur = 12,
  contrast = 20,
}: {
  items?: DockItem[];
  blur?: number;
  contrast?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const scaleFor = (i: number) => {
    if (hover === null) return 1;
    const d = Math.abs(hover - i);
    if (d === 0) return 1.35;
    if (d === 1) return 1.15;
    if (d === 2) return 1.05;
    return 1;
  };
  const liftFor = (i: number) => {
    if (hover === null) return 0;
    const d = Math.abs(hover - i);
    return d === 0 ? -14 : d === 1 ? -7 : d === 2 ? -2 : 0;
  };

  return (
    <div className="gdock" onMouseLeave={() => setHover(null)}>
      <Liquid blur={reduced ? 0 : blur} contrast={contrast} fill={PURPLE} filterPadding={40}>
        {items.map((it, i) => (
          <Liquid.Item
            key={it.label}
            y={liftFor(i)}
            scale={scaleFor(i)}
            transition={reduced ? { duration: 0 } : 'snappy'}
          >
            <span className="gdock-blob" />
          </Liquid.Item>
        ))}
      </Liquid>

      <div className="gdock-icons">
        {items.map((it, i) => (
          <button
            key={it.label}
            className="gdock-btn"
            title={it.label}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={it.onClick}
            style={{
              transform: `translateY(${liftFor(i)}px) scale(${scaleFor(i)})`,
            }}
          >
            {it.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// 5. GooeyLoader — orbiting dots that repeatedly merge at the centre.
//    Driven from a rAF loop rather than CSS keyframes: the liquid
//    surface only follows positions the library itself owns.
// ---------------------------------------------------------------
export function GooeyLoader({
  size = 72,
  dots = 3,
  orbit = 15,
  period = 1400,
  blur = 8,
  contrast = 26,
}: {
  size?: number;
  dots?: number;
  orbit?: number;
  period?: number;
  blur?: number;
  contrast?: number;
}) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      setT(((now - start) % period) / period);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, period]);

  // radius breathes so the dots fuse into one mass and separate again
  const r = orbit * (0.25 + 0.75 * (0.5 - Math.cos(t * Math.PI * 4) / 2));

  return (
    <span className="gloader" style={{ width: size, height: size }}>
      <Liquid blur={reduced ? 0 : blur} contrast={contrast} fill={PURPLE} filterPadding={28}>
        {Array.from({ length: dots }).map((_, i) => {
          const a = t * Math.PI * 2 + (i / dots) * Math.PI * 2;
          return (
            <Liquid.Item
              key={i}
              x={Math.cos(a) * r}
              y={Math.sin(a) * r}
              transition={{ duration: 0 }}
            >
              <span className="gloader-dot" />
            </Liquid.Item>
          );
        })}
      </Liquid>
    </span>
  );
}

// ---------------------------------------------------------------
// 6. GooeyCursor — Move effect following the pointer inside a region.
//    Good for hero sections; scope it, don't attach to the document.
// ---------------------------------------------------------------
export function GooeyCursor({
  children,
  blur = 14,
  contrast = 18,
}: {
  children?: ReactNode;
  blur?: number;
  contrast?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion();

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left - 30, y: e.clientY - r.top - 30 });
  };

  return (
    <div
      className="gcursor"
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setPos(null)}
    >
      <Liquid blur={reduced ? 0 : blur} contrast={contrast} fill="#6a48e0" filterPadding={60}>
        <Liquid.Item
          effect="move"
          move={{ springiness: 0.3, wobble: 0.5, stretch: 0.55, trail: 0.8 }}
          x={pos?.x ?? -200}
          y={pos?.y ?? -200}
          transition={reduced ? { duration: 0 } : { stiffness: 260, damping: 22 }}
        >
          <span className="gcursor-blob" />
        </Liquid.Item>
      </Liquid>
      <div className="gcursor-content">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------
// Styles — one block so the kit drops in as a single file.
// ---------------------------------------------------------------
export function GooeyStyles() {
  return (
    <style>{`
      /* Every Liquid group needs a real box: the filter region is
         measured from it, and a 0x0 group clips the goo away. */

      /* ---- FAB ---- */
      .gfab { position: relative; width: 64px; height: 64px; }
      .gfab > :first-child {
        position: absolute; inset: 0;
        display: grid; place-items: center;
      }
      .gfab > :first-child > div { grid-area: 1 / 1; }
      .gfab-trigger-blob,
      .gfab-action {
        display: block;
        width: 64px; height: 64px; border-radius: 50%;
        background: linear-gradient(135deg, #7c5cff, #4aa8ff);
      }
      .gfab-action { width: 56px; height: 56px; }
      .gfab-icons { position: absolute; inset: 0; pointer-events: none; }
      .gfab-icon-btn {
        position: absolute; top: 12px; left: 12px;
        width: 40px; height: 40px; border: 0; background: none;
        color: #fff; font-size: 17px; cursor: pointer; pointer-events: auto;
        display: grid; place-items: center;
        transition: transform .42s cubic-bezier(.34,1.4,.5,1), opacity .2s;
      }
      .gfab-trigger {
        position: absolute; inset: 0; border: 0; background: none;
        color: #fff; cursor: pointer; display: grid; place-items: center;
      }
      .gfab-plus {
        font-size: 30px; line-height: 1; font-weight: 300;
        transition: transform .35s cubic-bezier(.34,1.4,.5,1);
      }
      .gfab-plus[data-open="true"] { transform: rotate(135deg); }

      /* ---- Tabs ---- */
      .gtabs { position: relative; display: inline-block; }
      .gtabs-pill {
        display: block; height: 38px; border-radius: 999px;
        background: rgba(124,92,255,.92);
        transition: width .34s cubic-bezier(.3,1.2,.5,1);
      }
      .gtabs-list { position: absolute; inset: 0; display: flex; }
      .gtabs-tab {
        border: 0; background: none; cursor: pointer;
        padding: 0 20px; height: 38px;
        font-size: 14px; font-weight: 550; color: #cfcbe6;
        transition: color .2s;
      }
      .gtabs-tab[aria-selected="true"] { color: #fff; }

      /* ---- Toggle ---- */
      .gtoggle { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; }
      .gtoggle-input {
        position: absolute; width: 1px; height: 1px;
        clip: rect(0 0 0 0); overflow: hidden;
      }
      .gtoggle-visual { position: relative; width: 56px; height: 30px; display: block; }
      .gtoggle-visual > :first-child {
        position: absolute; inset: 0;
        display: grid; align-items: center; justify-items: start;
      }
      .gtoggle-visual > :first-child > div { grid-area: 1 / 1; }
      .gtoggle-track {
        display: block;
        width: 56px; height: 30px; border-radius: 999px;
        background: rgba(255,255,255,.16);
        transition: background .25s;
      }
      .gtoggle-visual[data-on="true"] .gtoggle-track { background: rgba(124,92,255,.75); }
      .gtoggle-handle {
        display: block;
        width: 24px; height: 24px; border-radius: 50%; background: #fff;
      }
      .gtoggle-input:focus-visible + .gtoggle-visual { outline: 2px solid #7c5cff; outline-offset: 4px; border-radius: 999px; }
      .gtoggle-label { font-size: 14px; color: #d6d3e8; }

      /* ---- Dock ---- */
      .gdock { position: relative; display: inline-block; padding: 22px 12px; }
      .gdock > :first-child { display: flex; gap: 10px; }
      .gdock-blob, .gdock-btn {
        width: 52px; height: 52px; border-radius: 50%;
      }
      .gdock-blob {
        display: block;
        background: linear-gradient(135deg, #7c5cff, #4aa8ff);
      }
      .gdock-icons {
        position: absolute; top: 22px; left: 12px;
        display: flex; gap: 10px;
      }
      .gdock-btn {
        border: 0; background: none; color: #fff; font-size: 19px;
        cursor: pointer; display: grid; place-items: center;
        transition: transform .3s cubic-bezier(.34,1.4,.5,1);
      }
      .gdock-btn:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

      /* ---- Loader ---- */
      .gloader { position: relative; display: inline-block; }
      .gloader > :first-child {
        position: absolute; inset: 0;
        display: grid; place-items: center;
      }
      .gloader > :first-child > div { grid-area: 1 / 1; }
      .gloader-dot {
        display: block;
        width: 22px; height: 22px;
        border-radius: 50%; background: #7c5cff;
      }

      /* ---- Cursor ---- */
      .gcursor { position: relative; overflow: hidden; }
      .gcursor > :first-child {
        position: absolute; inset: 0;
        display: grid; place-items: start;
      }
      .gcursor > :first-child > div { grid-area: 1 / 1; }
      .gcursor-blob {
        display: block;
        width: 60px; height: 60px; border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #a78bff, #5b3fd6);
      }
      .gcursor-content { position: relative; }

      @media (prefers-reduced-motion: reduce) {
        .gfab-icon-btn, .gfab-plus, .gtabs-pill, .gtoggle-track, .gdock-btn {
          transition: none !important;
        }
      }
    `}</style>
  );
}
