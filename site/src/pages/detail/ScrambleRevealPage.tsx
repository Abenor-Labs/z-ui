import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { ScrambleReveal } from '../../zui/ScrambleReveal';

const TRIGGERS = ['hover', 'mount', 'in-view'] as const;
const DURATIONS = ['240', '380', '600'];

const TEXT: Record<string, string> = {
  hover: 'held encoded until your pointer arrives',
  mount: 'decoded once, on mount',
  'in-view': 'decoded when the section scrolls into view',
};

export function ScrambleRevealPage() {
  const [trigger, setTrigger] = useState<string>('hover');
  const [duration, setDuration] = useState('380');
  const [run, setRun] = useState(0);

  const text = TEXT[trigger];

  return (
    <Detail
      name="scramble-reveal"
      preview={
        <Playground
          stage="pg-stage-text"
          controls={[
            {
              label: 'Trigger',
              value: trigger,
              onChange: setTrigger,
              options: TRIGGERS.map((v) => ({ value: v, label: v })),
            },
            {
              label: 'Base duration',
              value: duration,
              onChange: setDuration,
              options: DURATIONS.map((v) => ({ value: v, label: `${v}ms` })),
            },
          ]}
          code={`<ScrambleReveal\n  text="${text}"\n  trigger="${trigger}"\n  baseDuration={${duration}}\n/>`}
          footer={
            <button className="btn-mono" onClick={() => setRun((n) => n + 1)}>
              remount
            </button>
          }
          caption="Glyphs lock in left to right with jitter until the real string stands. One run per trigger; it never loops — remount to see it again. Under prefers-reduced-motion the final text renders immediately."
        >
          <span className="mono" style={{ fontSize: 15 }}>
            <ScrambleReveal
              key={`${trigger}-${duration}-${run}`}
              trigger={trigger as (typeof TRIGGERS)[number]}
              baseDuration={Number(duration)}
              text={text}
            />
          </span>
        </Playground>
      }
    />
  );
}
