import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CodeBlock } from '../../components/CodeBlock';
import { useSiteSpring } from '../../lib/springs';
import { LabControlRow } from './LabControls';
import { defaultConfigFrom, type LabConfig, type LabControl, type LabMeta, type LabPreset } from './labTypes';

/**
 * The reusable shell every /lab demo mounts inside: stage, live controls,
 * presets, reset/replay, compact metadata, a soften-on-interact instruction,
 * an expand-to-fullscreen stage, and code generated from the CURRENT config
 * rather than a static string.
 *
 * The stage always renders the same component instance tree as its normal
 * position — `expanded` toggles a portal that renders a SECOND copy into
 * `document.body` and hides the inline one, rather than moving the live node,
 * so there is nothing exotic about the DOM the demo itself sees.
 */
export function LabPlayground({
  index,
  name,
  description,
  meta,
  instruction,
  controls = [],
  presets = [],
  code,
  codeCaption = 'reflects the controls above',
  stageClassName,
  children,
}: {
  /** two-digit position, e.g. "01" */
  index: string;
  name: string;
  /** what the mechanism is and why — the long-form explanation */
  description: string;
  meta: LabMeta;
  /** what to physically do — short, imperative, softens once the visitor has tried it */
  instruction: string;
  controls?: LabControl[];
  presets?: LabPreset[];
  /** generate the usage snippet from the current config — never a static string */
  code: (config: LabConfig) => string;
  codeCaption?: string;
  stageClassName?: string;
  children: (config: LabConfig, instanceKey: number) => ReactNode;
}) {
  const defaults = defaultConfigFrom(controls);
  const [config, setConfig] = useState<LabConfig>(defaults);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [instanceKey, setInstanceKey] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { stiff, reduced } = useSiteSpring();

  const setValue = (id: string, value: LabConfig[string]) => {
    setConfig((c) => ({ ...c, [id]: value }));
    setActivePreset(null);
  };

  const applyPreset = (preset: LabPreset) => {
    setConfig((c) => ({ ...c, ...preset.values }));
    setActivePreset(preset.id);
  };

  const reset = () => {
    setConfig(defaults);
    setActivePreset(null);
    setInstanceKey((k) => k + 1);
  };

  const replay = () => setInstanceKey((k) => k + 1);

  const markInteracted = () => {
    if (!interacted) setInteracted(true);
  };

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [expanded]);

  // hidden rather than unmounted while expanded would still be reachable by
  // Tab and would keep running its own rAF/pointer work off-screen for no
  // reason — not rendered at all is correct, not just visually covered
  const stage = expanded ? null : (
    <div
      className={`pg-stage lab-stage${stageClassName ? ` ${stageClassName}` : ''}`}
      onPointerDown={markInteracted}
    >
      {children(config, instanceKey)}
    </div>
  );

  return (
    <div className="lab-pg">
      <div className="lab-hero-head">
        <span className="mono lab-hero-index">{index}</span>
        <h2 className="lab-hero-name">{name}</h2>
        <span className="mono lab-status-pill">{meta.status ?? 'Experimental'}</span>
      </div>

      <p className="playground-caption">{description}</p>

      <div className="lab-pg-top">
        <span className={`lab-instruction mono${interacted ? ' lab-instruction-soft' : ''}`}>{instruction}</span>
        <button type="button" className="lab-fullscreen-btn mono" onClick={() => setExpanded(true)}>
          expand ⤢
        </button>
      </div>

      {stage}

      <div className="lab-meta-row mono">
        <div className="lab-meta-cell">
          <span className="mono-label">interaction</span>
          <span>{meta.interaction}</span>
        </div>
        <div className="lab-meta-cell">
          <span className="mono-label">motion</span>
          <span>{meta.motion}</span>
        </div>
        <div className="lab-meta-cell">
          <span className="mono-label">status</span>
          <span>{meta.status ?? 'Experimental'}</span>
        </div>
        <div className="lab-meta-cell">
          <span className="mono-label">dependencies</span>
          <span>{meta.dependencies ?? 'None'}</span>
        </div>
      </div>

      {presets.length ? (
        <div className="lab-presets">
          <span className="mono-label">preset</span>
          <div className="lab-presets-row">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`lab-preset-btn mono${activePreset === p.id ? ' lab-preset-btn-active' : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {controls.length ? (
        <div className="lab-controls">
          {controls.map((c) => (
            <LabControlRow key={c.id} control={c} value={config[c.id]} onChange={setValue} />
          ))}
        </div>
      ) : null}

      <div className="lab-pg-footer">
        <button type="button" className="btn-mono" onClick={reset}>
          reset
        </button>
        <button type="button" className="btn-mono" onClick={replay}>
          replay
        </button>
      </div>

      <CodeBlock code={code(config)} caption={codeCaption} />

      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {expanded ? (
                <motion.div
                  className="lab-fullscreen-overlay"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={stiff}
                >
                  <motion.div
                    className="lab-fullscreen-panel"
                    initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
                    transition={stiff}
                  >
                    <div className="lab-fullscreen-head mono">
                      <span className="mono-label">expanded playground</span>
                      <button type="button" className="lab-fullscreen-close mono" onClick={() => setExpanded(false)}>
                        close ✕
                      </button>
                    </div>
                    <div className={`pg-stage lab-stage lab-stage-fullscreen${stageClassName ? ` ${stageClassName}` : ''}`}>
                      {children(config, instanceKey)}
                    </div>
                    {controls.length ? (
                      <div className="lab-controls lab-controls-fullscreen">
                        {controls.map((c) => (
                          <LabControlRow key={c.id} control={c} value={config[c.id]} onChange={setValue} />
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
