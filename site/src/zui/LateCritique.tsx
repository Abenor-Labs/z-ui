import { useEffect, useRef, useState, useImperativeHandle, type Ref } from 'react';
import { timestamp } from '../lib/format';

/**
 * Faithful site reimplementation of the registry's `late-critique`:
 * a form field whose criticism is late and forgiveness is instant.
 * No error verdict lands mid-word while the user is still typing a first
 * attempt; the very first keystroke that fixes the value clears the error
 * on the same frame it's typed.
 *
 * Needs: react only — true here as well. The decision log beside the field
 * prints every validation decision with a timestamp, as it happens.
 */

const IDLE_MS = 700;

type Kind = 'withheld' | 'verdict' | 'clear' | 'ok';

interface Entry {
  t: string;
  msg: string;
  kind: Kind;
}

function validate(v: string): string | null {
  if (!v.includes('@')) return 'missing @';
  const [local, domain] = v.split(/@(.*)/s);
  if (!local) return 'nothing before @';
  if (!domain) return 'nothing after @';
  if (!domain.includes('.')) return 'domain has no dot';
  if (/\.$/.test(domain)) return 'domain ends in a dot';
  if (/\s/.test(v)) return 'contains whitespace';
  return null;
}

export interface LateCritiqueHandle {
  /** replay real keystrokes through the field's own input path, one per frame-ish */
  type: (text: string, msPerKey?: number) => void;
}

export function LateCritique({
  ref,
  showLog = true,
  compact = false,
}: {
  ref?: Ref<LateCritiqueHandle>;
  showLog?: boolean;
  compact?: boolean;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const idle = useRef(0);
  const logRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typing = useRef(0);

  const log = (msg: string, kind: Kind) => {
    setEntries((prev) => [...prev.slice(-29), { t: timestamp(), msg, kind }]);
  };

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [entries]);

  useEffect(() => () => window.clearTimeout(idle.current), []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const typed = (e.nativeEvent as InputEvent).data;
    const key = typed ? `"${typed}"` : 'delete';
    setValue(v);
    window.clearTimeout(idle.current);

    if (v === '') {
      if (error) {
        setError(null);
        log('field emptied — error cleared same frame', 'clear');
      } else {
        log('field emptied — nothing to judge', 'withheld');
      }
      return;
    }

    if (error) {
      // an error is standing: forgiveness is instant, re-judged on every keystroke
      const reason = validate(v);
      if (!reason) {
        setError(null);
        log(`keystroke ${key} — fixed → error cleared same frame`, 'clear');
      } else {
        setError(reason);
        log(`keystroke ${key} — still invalid (${reason})`, 'verdict');
      }
      return;
    }

    // first attempt: no verdict lands mid-word
    log(`keystroke ${key} — verdict withheld (mid-word)`, 'withheld');
    idle.current = window.setTimeout(() => {
      const reason = validate(v);
      if (reason) {
        setError(reason);
        log(`idle ${IDLE_MS}ms — verdict: ${reason}`, 'verdict');
      } else {
        log(`idle ${IDLE_MS}ms — valid, nothing to say`, 'ok');
      }
    }, IDLE_MS);
  };

  // the demo card types into the real field: native setter + real input events, so the
  // component's own decision path runs exactly as it does under a keyboard
  useImperativeHandle(
    ref,
    () => ({
      type: (text: string, msPerKey = 90) => {
        const el = inputRef.current;
        if (!el) return;
        window.clearInterval(typing.current);
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        setter?.call(el, '');
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: null }));
        let i = 0;
        typing.current = window.setInterval(() => {
          if (i >= text.length) {
            window.clearInterval(typing.current);
            return;
          }
          const ch = text[i++];
          setter?.call(el, el.value + ch);
          el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ch }));
        }, msPerKey);
      },
    }),
    [],
  );

  useEffect(() => () => window.clearInterval(typing.current), []);

  const onBlur = () => {
    window.clearTimeout(idle.current);
    if (!value) return;
    const reason = validate(value);
    if (reason && !error) {
      setError(reason);
      log(`blur — verdict: ${reason}`, 'verdict');
    } else if (!reason && !error) {
      log('blur — valid', 'ok');
    }
  };

  return (
    <div className={`latecritique${compact ? ' latecritique-compact' : ''}`}>
      <div className="latecritique-field">
        <label className="mono-label" htmlFor="lc-email">
          email
        </label>
        <input
          ref={inputRef}
          id="lc-email"
          type="text"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          className={`mono latecritique-input${error ? ' latecritique-invalid' : ''}`}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="you@example.com"
          aria-invalid={!!error}
          aria-describedby={error ? 'lc-error' : undefined}
        />
        <p id="lc-error" className="mono latecritique-error" aria-live="polite">
          {error ?? ' '}
        </p>
      </div>
      {showLog ? (
        <ol className="mono latecritique-log" ref={logRef} aria-label="Validation decision log">
          {entries.length === 0 ? (
            <li className="lc-withheld">— type to see decisions land —</li>
          ) : (
            entries.map((en, i) => (
              <li key={i} className={`lc-${en.kind}`}>
                <span className="lc-time">{en.t}</span> {en.msg}
              </li>
            ))
          )}
        </ol>
      ) : null}
    </div>
  );
}
