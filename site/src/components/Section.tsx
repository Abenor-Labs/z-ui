import type { ReactNode } from 'react';
import { ScrambleReveal } from '../zui/ScrambleReveal';

/**
 * Ruled section: hairline divider with a schematic mono annotation
 * ("01 / REGISTRY"). Labels decode via scramble-reveal on first
 * scroll-into-view — once, never looping.
 */
export function Section({
  index,
  label,
  children,
  id,
  flush = false,
}: {
  index: string;
  label: string;
  children: ReactNode;
  id?: string;
  flush?: boolean;
}) {
  return (
    <section className={`section hairline-t${flush ? ' section-flush' : ''}`} id={id}>
      <div className="section-head">
        <ScrambleReveal text={`${index} / ${label}`} trigger="in-view" className="mono-label" />
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
