import { useCallback, useEffect, useRef, useState } from 'react';
import { RECORDINGS, kindOf, VERSION, CAPTURED } from '../data/cliRecordings';
import { useReducedMotion } from '../lib/useReducedMotion';

/**
 * A recorded CLI session, replayed. Not a video file and not a scripted
 * imitation: every line comes from `src/data/cliRecordings.ts`, captured by
 * running the published CLI. The replay types the command, then prints the
 * real output.
 *
 * It does not autoplay — the page is still until you press play, same rule as
 * every other surface on this site. Under prefers-reduced-motion the whole
 * transcript renders at once and the transport disappears.
 */

const TYPE_MS = 42; // per character
const LINE_MS = 34; // per output line
const STEP_GAP = 700; // pause between commands

interface Frame {
  step: number;
  typed: number;
  printed: number;
}

const TOTAL_STEPS = RECORDINGS.length;

export function CliCast() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState<Frame>({ step: 0, typed: 0, printed: 0 });
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  const body = useRef<HTMLDivElement>(null);

  const clear = () => window.clearTimeout(timer.current);

  // advance one unit of work: a keystroke, a printed line, or a step boundary
  const tick = useCallback(() => {
    setFrame((f) => {
      const rec = RECORDINGS[f.step];
      if (!rec) return f;
      if (f.typed < rec.cmd.length) return { ...f, typed: f.typed + 1 };
      if (f.printed < rec.lines.length) return { ...f, printed: f.printed + 1 };
      if (f.step + 1 < TOTAL_STEPS) return { step: f.step + 1, typed: 0, printed: 0 };
      return f;
    });
  }, []);

  useEffect(() => {
    if (!playing || reduced) return;
    const rec = RECORDINGS[frame.step];
    if (!rec) return;

    const atEnd =
      frame.step === TOTAL_STEPS - 1 &&
      frame.typed === rec.cmd.length &&
      frame.printed === rec.lines.length;
    if (atEnd) {
      setPlaying(false);
      setDone(true);
      return;
    }

    const delay =
      frame.typed < rec.cmd.length
        ? TYPE_MS
        : frame.printed < rec.lines.length
          ? LINE_MS
          : STEP_GAP;

    timer.current = window.setTimeout(tick, delay);
    return clear;
  }, [playing, frame, tick, reduced]);

  // follow the output as it prints
  useEffect(() => {
    const el = body.current;
    if (el && playing) el.scrollTop = el.scrollHeight;
  }, [frame, playing]);

  useEffect(() => clear, []);

  const restart = () => {
    clear();
    setFrame({ step: 0, typed: 0, printed: 0 });
    setDone(false);
    setPlaying(true);
  };

  const toggle = () => {
    if (done) {
      restart();
      return;
    }
    setPlaying((p) => !p);
  };

  const jump = (step: number) => {
    clear();
    setPlaying(false);
    setDone(false);
    setFrame({ step, typed: RECORDINGS[step].cmd.length, printed: RECORDINGS[step].lines.length });
  };

  const visible = reduced ? RECORDINGS : RECORDINGS.slice(0, frame.step + 1);
  const current = RECORDINGS[frame.step];

  return (
    <div className="cast">
      <div className="cast-bar mono">
        <span className="cast-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="cast-title">
          z-ui {VERSION} — recorded {CAPTURED}
        </span>
        {reduced ? null : (
          <div className="cast-transport">
            <button className="cast-btn mono" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? '❙❙ pause' : done ? '↺ replay' : '▶ play'}
            </button>
            <button className="cast-btn mono" onClick={restart} aria-label="Restart">
              ↺
            </button>
          </div>
        )}
      </div>

      <div className="cast-body mono" ref={body}>
        {visible.map((rec, i) => {
          const isCurrent = !reduced && i === frame.step;
          const cmdText = isCurrent ? rec.cmd.slice(0, frame.typed) : rec.cmd;
          const lines = reduced ? rec.lines : isCurrent ? rec.lines.slice(0, frame.printed) : rec.lines;
          return (
            <div className="cast-step" key={rec.cmd}>
              <div className="cast-line con-cmd">
                <span className="console-prompt">$ </span>
                {cmdText}
                {isCurrent && playing && frame.typed < rec.cmd.length ? (
                  <span className="cast-caret" aria-hidden="true" />
                ) : null}
              </div>
              {lines.map((l, k) => (
                <div className={`cast-line con-${kindOf(l)}`} key={k}>
                  {l || ' '}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="cast-foot">
        <div className="cast-steps mono">
          {RECORDINGS.map((rec, i) => (
            <button
              key={rec.cmd}
              className={`cast-step-btn${i === frame.step && !reduced ? ' cast-step-active' : ''}`}
              onClick={() => jump(i)}
              aria-label={`Jump to ${rec.cmd}`}
              title={rec.cmd}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {current?.note ? <p className="mono cast-note">{current.note}</p> : null}
      </div>
    </div>
  );
}
