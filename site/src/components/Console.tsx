import { useEffect, useRef, useState } from 'react';
import { RECORDINGS, resolve, kindOf, VERSION } from '../data/cliRecordings';

/**
 * A shell you can type in. It does not simulate the CLI — it replays what the
 * real CLI printed for that exact command (see src/data/cliRecordings.ts). Type
 * something that was never recorded and it says so rather than inventing output.
 */

interface Row {
  text: string;
  kind: 'cmd' | ReturnType<typeof kindOf>;
}

const BANNER: Row[] = [
  { text: `z-ui ${VERSION} — recorded transcripts, replayed.`, kind: 'dim' },
  { text: "type a command, or press Tab to complete. ↑ / ↓ walks history.", kind: 'dim' },
];

const RECORDED = RECORDINGS.map((r) => r.cmd);

function complete(input: string): string | null {
  const typed = input.trim();
  if (!typed) return null;
  const withPrefix = typed.startsWith('z-ui') ? typed : `z-ui ${typed}`;
  const hits = RECORDED.filter((c) => c.startsWith(withPrefix));
  return hits.length === 1 ? hits[0] : null;
}

export function Console() {
  const [rows, setRows] = useState<Row[]>(BANNER);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);

  const body = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows]);

  const submit = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setCursor(-1);
    setInput('');

    if (cmd === 'clear') {
      setRows([]);
      return;
    }

    const rec = resolve(cmd);
    const echoed: Row = { text: cmd, kind: 'cmd' };

    if (!rec) {
      setRows((prev) => [
        ...prev,
        echoed,
        { text: 'not in the recorded set — this shell replays captured runs, it does not fake them.', kind: 'err' },
        { text: 'recorded commands:', kind: 'out' },
        ...RECORDED.map((c) => ({ text: `  ${c}`, kind: 'dim' as const })),
        { text: 'run anything else for real: npx @abenor/z-ui@latest <command>', kind: 'out' },
        { text: '', kind: 'out' },
      ]);
      return;
    }

    setRows((prev) => [
      ...prev,
      echoed,
      ...rec.lines.map((l) => ({ text: l, kind: kindOf(l) })),
      { text: '', kind: 'out' as const },
    ]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(input);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const hit = complete(input);
      if (hit) setInput(hit);
      return;
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setRows([]);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setInput(history[next]);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cursor < 0) return;
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(-1);
        setInput('');
      } else {
        setCursor(next);
        setInput(history[next]);
      }
    }
  };

  return (
    <div className="console-wrap">
      <div
        className="console"
        onPointerDown={(e) => {
          if (window.getSelection()?.toString()) return;
          if ((e.target as HTMLElement).closest('.console-chip')) return;
          field.current?.focus();
        }}
      >
        <div className="console-bar mono">
          <span className="console-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="console-title">z-ui — bash</span>
          <button className="console-clear mono" onClick={() => setRows([])} aria-label="Clear">
            clear
          </button>
        </div>

        <div className="console-body mono" ref={body}>
          {rows.map((r, i) => (
            <div key={i} className={`console-line con-${r.kind}`}>
              {r.kind === 'cmd' ? <span className="console-prompt">$ </span> : null}
              {r.text || ' '}
            </div>
          ))}

          <div className="console-input-row">
            <span className="console-prompt">$ </span>
            <input
              ref={field}
              className="console-input mono"
              value={input}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Type a z-ui command"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
      </div>

      <div className="console-chips">
        <span className="mono-label console-chips-label">recorded</span>
        {RECORDED.map((c) => (
          <button
            key={c}
            className="console-chip mono"
            onClick={() => {
              field.current?.focus();
              submit(c);
            }}
          >
            {c.replace('z-ui ', '')}
          </button>
        ))}
      </div>
    </div>
  );
}
