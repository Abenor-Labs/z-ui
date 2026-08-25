import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Page } from '../components/Page';
import { useSiteSpring } from '../lib/springs';
import { Dial } from '@z-ui/registry/dial/dial';

/**
 * The landing page is the header and one hero. Nothing else.
 *
 * Everything the site can show — the components, the refusals, the ownership
 * argument — lives on the page that owns it. A landing page that repeats them
 * is a second, worse version of each. The two things it owes a first-time
 * visitor are what this is and how to get it, so those are the two things on
 * it.
 *
 * The mark is the real dial, not a drawing of one. It used to be a 26px SVG
 * imitating the component directly below it, which is a strange thing for a
 * registry whose whole claim is that the demo IS the component. Dialling it
 * is the argument: the ring stays upright, the wheel returns under a governor
 * at a constant 300°/sec, and 0 takes ten times as long as 1 because it is
 * ten pulses rather than one. Nobody has to read that paragraph to notice it.
 */

/** PRD.md's canonical install line, verbatim. The hero is the one place on
 *  the site that gets exactly one command, so it is the one that ships. */
const INSTALL = 'npx @abenor/z-ui@latest add dial';

export function Home() {
  const [copied, setCopied] = useState(false);
  const [digits, setDigits] = useState<string>('');
  const timer = useRef<number>(0);
  const { stiff, reduced } = useSiteSpring();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL);
    } catch {
      // clipboard unavailable (permissions); the text still selects
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  /**
   * A staged entrance, which is allowed here and almost nowhere else: this is
   * the rare/first-time tier, and the sequence is the hierarchy — the object,
   * then what it is, then what it costs. 70ms apart. Under reduced motion the
   * offset goes and the stagger goes with it; the content still fades so the
   * arrival is not a hard cut.
   */
  const list = {
    hidden: {},
    shown: { transition: { staggerChildren: reduced ? 0 : 0.07, delayChildren: 0.04 } },
  };
  const item = reduced
    ? { hidden: { opacity: 0 }, shown: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0 } };

  return (
    <Page>
      <motion.header
        className="lander lander-solo"
        variants={list}
        initial="hidden"
        animate="shown"
      >
        <motion.div variants={item} transition={stiff} className="lander-stage">
          <Dial size={148} onDigit={(d) => setDigits((s) => (s + d).slice(-7))} />
          <span className="mono lander-hint" aria-live="polite">
            {digits ? `dialled ${digits}` : 'pull a digit round to the stop'}
          </span>
        </motion.div>

        <motion.h1 variants={item} transition={stiff} className="lander-title">
          Micro-animations you own.
        </motion.h1>

        <motion.p variants={item} transition={stiff} className="lander-sub">
          A copy-paste registry of React micro-interactions, installed as source into your project —
          not pulled in as a runtime dependency. Not a design system, not a layout kit, not a
          shadcn/ui replacement. If it isn't a micro-animation, it doesn't belong here. That
          constraint is the product.
        </motion.p>

        <motion.div variants={item} transition={stiff} className="lander-cta">
          <Link to="/components" className="pill pill-primary">
            Browse
          </Link>
          <button
            className="pill pill-install mono"
            onClick={copy}
            aria-label="Copy install command"
          >
            <span className="copy-btn-window" aria-hidden="true">
              <motion.span
                className="copy-btn-stack"
                animate={{ y: copied ? -17 : 0 }}
                transition={stiff}
              >
                <span className="copy-btn-row">{INSTALL}</span>
                <span className="copy-btn-row copy-btn-done">copied</span>
              </motion.span>
            </span>
          </button>
        </motion.div>

        <motion.p variants={item} transition={stiff} className="mono lander-status">
          v0.1 — early. Eight components. Names and props may change before v1.
        </motion.p>
      </motion.header>
    </Page>
  );
}
