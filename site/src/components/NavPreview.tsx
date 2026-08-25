import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AutoPreview } from './AutoPreview';
import { useSiteSpring } from '../lib/springs';
import { REGISTRY } from '../data/registry';

/**
 * The hover preview that hangs off the component index.
 *
 * Three decisions carry it.
 *
 * **It is a tooltip, not a menu.** The panel is `pointer-events: none`. A
 * hover surface the cursor can enter needs safe-triangle tracking, an escape
 * hatch and a focus contract, and it would put a live physics sim under a
 * cursor that is on its way somewhere else. That is also why the contents
 * drive themselves — see AutoPreview.tsx. A component you cannot touch has to
 * demonstrate itself or it is just a screenshot with extra steps.
 *
 * **Cold open is delayed, warm swaps are instant.** Sweeping down the list to
 * reach `late-critique` crosses six rows. With no intent delay that is six
 * previews, five of them mounted and thrown away. So the first open waits
 * 140ms — and once the panel is up, moving between rows swaps the contents
 * with no delay and no re-entrance, because the surface is already there and
 * re-animating it would be a lie about what changed.
 *
 * **It never exists on touch.** `hover: hover` and `pointer: fine` are both
 * required. A tap fires a synthetic hover, and a preview that appears on the
 * same tap that navigates is a panel nobody asked for, over a page they are
 * already leaving.
 */

const COLD_DELAY = 140;
/** Leaving the list is not the same as being done with it — the 1px gap
 *  between two rows is a leave, and closing on it would strobe the panel. */
const CLOSE_GRACE = 90;

const PANEL_W = 300;
/** Gap between the row and the panel, and the minimum clearance to the
 *  viewport edge before the panel stops tracking the row. */
const GUTTER = 16;
const EDGE = 12;

const BLURB = new Map(REGISTRY.map((c) => [c.name, c]));

/** True only where a real pointer can actually hover. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return fine;
}

export interface NavPreviewTarget {
  name: string;
  el: HTMLElement;
}

/**
 * Owns the open/close intent for a list of rows. The list itself stays dumb —
 * it reports which row the pointer is on and hands back that row's element.
 * The element, not its rect: a rect captured on pointerenter is stale the
 * moment the page scrolls, and the panel re-reads it every time it needs to.
 */
export function useNavPreview() {
  const [target, setTarget] = useState<NavPreviewTarget | null>(null);
  const fine = useFinePointer();

  // Mirrored in a ref so `enter` can tell a cold open from a warm swap without
  // re-creating itself on every target change.
  const openRef = useRef(false);
  const timer = useRef(0);

  useEffect(() => {
    openRef.current = target !== null;
  }, [target]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const enter = useCallback(
    (name: string, el: HTMLElement) => {
      if (!fine) return;
      window.clearTimeout(timer.current);
      const commit = () => setTarget({ name, el });
      if (openRef.current) commit();
      else timer.current = window.setTimeout(commit, COLD_DELAY);
    },
    [fine],
  );

  const leave = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTarget(null), CLOSE_GRACE);
  }, []);

  /** Clicking through to the page should not leave a panel hanging over it. */
  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setTarget(null);
  }, []);

  return { target, enter, leave, dismiss, enabled: fine };
}

/* ------------------------------------------------------------------ panel -- */

export function NavPreviewPanel({ target }: { target: NavPreviewTarget | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {target ? <Card key="nav-preview" target={target} /> : null}
    </AnimatePresence>,
    document.body,
  );
}

function Card({ target }: { target: NavPreviewTarget }) {
  const { reveal, swap, reduced } = useSiteSpring();
  const ref = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  /**
   * Position is measured, never assumed: the panel is as tall as whichever
   * component is inside it, and it is centred on the row and then clamped to
   * the viewport, so both numbers have to be real. Runs in a layout effect so
   * the first painted frame is already in the right place.
   */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const place = () => {
      const row = target.el.getBoundingClientRect();
      const h = el.getBoundingClientRect().height;
      const half = h / 2;
      setPos({
        left: row.right + GUTTER,
        top: Math.min(
          Math.max(row.top + row.height / 2, EDGE + half),
          window.innerHeight - EDGE - half,
        ),
      });
    };

    place();

    // The height changes when the contents swap; the row moves when the page
    // scrolls. Both invalidate the placement, neither is a re-entrance.
    const observer = new ResizeObserver(place);
    observer.observe(el);
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  }, [target]);

  const meta = BLURB.get(target.name);
  const rest = 'translateY(-50%) translateX(0px) scale(1)';

  return (
    <motion.aside
      ref={ref}
      className="navpv"
      aria-hidden="true"
      style={{
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        width: PANEL_W,
        // Nothing paints until the first measurement lands, or the panel would
        // animate in from 0,0 on the very first hover of the session.
        visibility: pos ? 'visible' : 'hidden',
      }}
      initial={{
        opacity: 0,
        transform: reduced ? rest : 'translateY(-50%) translateX(-6px) scale(0.97)',
      }}
      animate={{ opacity: 1, transform: rest }}
      exit={{
        opacity: 0,
        transform: reduced ? rest : 'translateY(-50%) translateX(-4px) scale(0.98)',
      }}
      transition={reveal}
    >
      {/* Only the contents cross-fade on a warm swap. The surface is already
          open and has not moved anywhere that needs explaining. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={target.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={swap}
          className="navpv-body"
        >
          <div className="navpv-stage">
            <AutoPreview name={target.name} />
          </div>
          <div className="navpv-meta">
            <span className="navpv-name">{target.name}</span>
            {meta ? <span className="mono navpv-cat">{meta.category}</span> : null}
          </div>
          {meta ? <p className="navpv-blurb">{meta.blurb}</p> : null}
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
}
