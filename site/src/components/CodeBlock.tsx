import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useSiteSpring } from '../lib/springs';

/**
 * Recess-colored code block with a one-click copy affordance.
 * The confirmation is a state change on the site spring — not a toast.
 */
export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  const { stiff } = useSiteSpring();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard unavailable (permissions); the selection still works
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <figure className="codeblock">
      <div className="codeblock-inner">
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
        <button className="copy-btn mono" onClick={copy} aria-label="Copy to clipboard">
          <span className="copy-btn-window" aria-hidden="true">
            <motion.span
              className="copy-btn-stack"
              animate={{ y: copied ? -16 : 0 }}
              transition={stiff}
            >
              <span className="copy-btn-row">copy</span>
              <span className="copy-btn-row copy-btn-done">copied</span>
            </motion.span>
          </span>
        </button>
      </div>
      {caption ? <figcaption className="mono-label codeblock-caption">{caption}</figcaption> : null}
    </figure>
  );
}
