import type { ReactNode } from 'react';
import { Chase } from '../zui/Chase';
import { CodeBlock } from './CodeBlock';

/**
 * The detail pages' playground: a controls panel over a live stage over the
 * code that stage is currently running.
 *
 * Every chip row is a real `chase` instance — the site does not ship a bespoke
 * segmented control to demonstrate its own segmented control. The code block is
 * generated from the same state the stage renders from, so it can never drift
 * from what is on screen.
 */

export interface PlaygroundControl {
  /** mono group label, e.g. "Detents" — also the chip row's accessible name */
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function Playground({
  controls,
  code,
  codeCaption = 'the selection above, as you would write it',
  readouts,
  stage,
  footer,
  caption,
  children,
}: {
  controls: PlaygroundControl[];
  /** exactly what the current selection renders — never a hand-written sample */
  code: string;
  codeCaption?: string;
  /** live measured values, printed beside the stage */
  readouts?: ReactNode;
  /** extra class on the stage box (graph-bg, padding variants) */
  stage?: string;
  /** controls that belong to the instance rather than its props (spawn, remount) */
  footer?: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="pg">
      {controls.length ? (
        <div className="pg-controls">
          {controls.map((c) => (
            <div className="pg-control" key={c.label}>
              <span className="mono-label pg-control-label">{c.label}</span>
              <Chase
                label={c.label}
                options={c.options}
                value={c.value}
                onChange={c.onChange}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className={`pg-stage ${stage ?? ''}`}>
        <div className="pg-stage-live">{children}</div>
        {readouts ? <div className="pg-stage-readouts">{readouts}</div> : null}
      </div>

      {footer ? <div className="pg-footer">{footer}</div> : null}
      {caption ? <p className="playground-caption">{caption}</p> : null}

      <CodeBlock code={code} caption={codeCaption} />
    </div>
  );
}
