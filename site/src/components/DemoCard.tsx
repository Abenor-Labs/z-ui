import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useSiteSpring } from '../lib/springs';

/**
 * The landing's card unit: a uniform stage holding a LIVE instance, one trigger
 * that fires the component's real input path, and a meta row that copies the
 * install command.
 *
 * The trigger is never a canned playback. `flick` hands the dial an impulse and
 * lets its own friction take over; `type` replays keystrokes through the field's
 * own input path. What follows a press is the same physics a hand would get.
 */
export function DemoCard({
  name,
  title,
  subtitle,
  action,
  onAction,
  copyText,
  href,
  badge,
  wide,
  children,
}: {
  name: string;
  title: string;
  subtitle: string;
  /** trigger label — the input it fires, never "animate" */
  action?: string;
  onAction?: () => void;
  copyText?: string;
  href?: string;
  badge?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  const { stiff } = useSiteSpring();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText ?? '');
    } catch {
      // clipboard unavailable (permissions); the command is still visible on the detail page
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className={`demo-card${wide ? ' demo-card-wide' : ''}`} data-demo={name}>
      <div className="demo-stage">
        {badge ? <span className="mono demo-badge">{badge}</span> : null}
        <div className="demo-stage-inner">{children}</div>
        {action ? (
          <button className="mono demo-action" onClick={onAction}>
            {action}
          </button>
        ) : null}
      </div>
      <div className="demo-meta">
        <div className="demo-meta-text">
          {href ? (
            <Link to={href} className="demo-title">
              {title}
            </Link>
          ) : (
            <span className="demo-title">{title}</span>
          )}
          <span className="demo-subtitle">{subtitle}</span>
        </div>
        {copyText ? (
          <button
            className="demo-copy mono"
            onClick={copy}
            aria-label={`Copy install command for ${title}`}
          >
            <span className="demo-copy-window" aria-hidden="true">
              <motion.span
                className="demo-copy-stack"
                animate={{ y: copied ? -14 : 0 }}
                transition={stiff}
              >
                <span className="demo-copy-row">⧉</span>
                <span className="demo-copy-row demo-copy-done">✓</span>
              </motion.span>
            </span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
