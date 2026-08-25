import { useEffect, useRef, useState, useImperativeHandle, type Ref } from 'react';
import { LateCritique, type LateCritiqueState } from '@z-ui/registry/late-critique/late-critique';
import { timestamp } from '../lib/format';

/**
 * Demo chrome around the promoted `late-critique` field.
 *
 * The field itself is the exact file the CLI installs; everything here is
 * presentation the registry does not ship — the decision log that narrates the
 * validation states as they happen, the compact density, and the `type()`
 * replay that drives the demo cards. Kept out of the component on purpose:
 * none of it survives the install, and the install is the product.
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

export interface LateCritiqueDemoHandle {
  /** replay real keystrokes through the field's own input path, one per frame-ish */
  type: (text: string, msPerKey?: number) => void;
  /**
   * Same path, but without clearing first — the keystrokes land on whatever is
   * already in the field. This is the only way to demonstrate the half of the
   * component that matters: the error has to already be on screen when the
   * fixing character arrives, or "forgiveness on the same frame" is invisible.
   */
  append: (text: string, msPerKey?: number) => void;
}

export function LateCritiqueDemo({
  ref,
  showLog = true,
  compact = false,
}: {
  ref?: Ref<LateCritiqueDemoHandle>;
  showLog?: boolean;
  compact?: boolean;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const typing = useRef(0);
  // what the field currently holds — lets the chrome narrate reasons the way
  // the old pre-promotion twin did, without the component exposing internals
  const valueRef = useRef('');
  const errorRef = useRef(false);

  const log = (msg: string, kind: Kind) => {
    setEntries((prev) => [...prev.slice(-29), { t: timestamp(), msg, kind }]);
  };

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [entries]);

  useEffect(() => () => window.clearInterval(typing.current), []);

  const onValueChange = (v: string) => {
    valueRef.current = v;

    if (v === '') {
      log(errorRef.current ? 'field emptied — error cleared same frame' : 'field emptied — nothing to judge', errorRef.current ? 'clear' : 'withheld');
      errorRef.current = false;
      return;
    }

    if (errorRef.current) {
      const reason = validate(v);
      if (!reason) {
        errorRef.current = false;
        log('keystroke — fixed → error cleared same frame', 'clear');
      } else {
        log(`keystroke — still invalid (${reason})`, 'verdict');
      }
      return;
    }

    log('keystroke — verdict withheld (mid-word)', 'withheld');
  };

  const onVerdict = (state: LateCritiqueState) => {
    if (state === 'invalid') {
      const reason = validate(valueRef.current) ?? 'invalid';
      errorRef.current = true;
      log(`idle ${IDLE_MS}ms — verdict: ${reason}`, 'verdict');
    } else if (state === 'valid') {
      errorRef.current = false;
      log(`idle ${IDLE_MS}ms — valid, nothing to say`, 'ok');
    }
  };

  // the demo card types into the real field: native setter + real input events, so the
  // component's own decision path runs exactly as it does under a keyboard
  useImperativeHandle(
    ref,
    () => {
      const play = (text: string, msPerKey: number, clearFirst: boolean) => {
        const el = rootRef.current?.querySelector('input');
        if (!el) return;
        window.clearInterval(typing.current);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (clearFirst) {
          setter?.call(el, '');
          el.dispatchEvent(new InputEvent('input', { bubbles: true }));
          valueRef.current = '';
        }
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
      };

      return {
        type: (text: string, msPerKey = 90) => play(text, msPerKey, true),
        append: (text: string, msPerKey = 90) => play(text, msPerKey, false),
      };
    },
    [],
  );

  return (
    <div className={`latecritique${compact ? ' latecritique-compact' : ''}`} ref={rootRef}>
      <LateCritique label="email" validate={validate} onValueChange={onValueChange} onVerdict={onVerdict} />
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
