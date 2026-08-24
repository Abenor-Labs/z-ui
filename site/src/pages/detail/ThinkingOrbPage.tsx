import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Section } from '../../components/Section';
import { ThinkingOrb, type OrbState } from '@z-ui/registry/thinking-orb/thinking-orb';

const STATES: OrbState[] = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
];

export function ThinkingOrbPage() {
  const [state, setState] = useState<OrbState>('working');
  const code = `<ThinkingOrb state="${state}" size={64} theme="dark" />`;

  return (
    <Detail
      name="thinking-orb"
      preview={
        <Playground
          stage="graph-bg"
          controls={[
            {
              label: 'State',
              value: state,
              onChange: (v) => setState(v as OrbState),
              options: STATES.map((s) => ({ value: s, label: s })),
            },
          ]}
          code={code}
          caption="Nine hand-tuned canvas animations, one component. The state is set by whatever the orb stands in for — an agent, a job, a socket — never by a press or a hover on the orb itself."
        >
          <ThinkingOrb state={state} size={64} theme="dark" />
        </Playground>
      }
    >
      <Section index="01" label="ALL NINE">
        <p className="playground-caption">Every state, running at once, at inline-text scale.</p>
        <div className="orb-grid">
          {STATES.map((s) => (
            <div className="orb-cell" key={s}>
              <ThinkingOrb state={s} size={20} theme="dark" />
              <span className="mono orb-cell-label">{s}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section index="02" label="ORIGIN">
        <div className="prose">
          <p>
            Vendored from{' '}
            <a href="https://github.com/Jakubantalik/thinking-orbs" target="_blank" rel="noreferrer">
              thinking-orbs
            </a>
            , MIT licensed, by Jakub Antalik. The geometry and tuning are unchanged — nine draw modes on a
            shared z-sorted painter, ported into one file because this registry ships
            zero-runtime-dependency components, not sixteen-module packages.
          </p>
          <p className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
            no gesture drives this one — meta.gesture is "none", the one exception in the set
          </p>
        </div>
      </Section>
    </Detail>
  );
}
