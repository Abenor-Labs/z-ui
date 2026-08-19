import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Section } from '../../components/Section';
import { Chase } from '../../zui/Chase';

const STAGES = ['fetch', 'resolve', 'verify', 'plan', 'write'];

const SETS: Record<string, string[]> = {
  '2': STAGES.slice(0, 2),
  '3': STAGES.slice(0, 3),
  '5': STAGES,
};

export function ChasePage() {
  const [count, setCount] = useState('5');
  const [annotate, setAnnotate] = useState('on');
  const [value, setValue] = useState('resolve');

  const labels = SETS[count];
  // a shrinking set can strand the selection; the first stage is the honest fallback
  const active = labels.includes(value) ? value : labels[0];
  const options = labels.map((v) => ({ value: v, label: v }));

  const code = [
    '<Chase',
    `  options={[${labels.map((v) => `{ value: '${v}', label: '${v}' }`).join(', ')}]}`,
    `  value={'${active}'}`,
    '  onChange={setValue}',
    annotate === 'on' ? '  annotateFirstMove' : null,
    '/>',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <Detail
      name="chase"
      preview={
        <Playground
          stage="graph-bg"
          controls={[
            {
              label: 'Options',
              value: count,
              onChange: setCount,
              options: Object.keys(SETS).map((v) => ({ value: v, label: v })),
            },
            {
              label: 'Annotate first move',
              value: annotate,
              onChange: setAnnotate,
              options: [
                { value: 'off', label: 'off' },
                { value: 'on', label: 'on' },
              ],
            },
          ]}
          code={code}
          caption="Jump from one end to the other. The edge facing the target leaves first on the stiff spring; the edge behind follows on the soft one, and the indicator stretches by exactly the distance between where each spring happens to be. Click again mid-flight — both springs re-target from their current positions and velocities."
        >
          <Chase
            key={`${count}-${annotate}`}
            annotateFirstMove={annotate === 'on'}
            label="Pipeline stage"
            options={options}
            value={active}
            onChange={setValue}
          />
        </Playground>
      }
    >
      <Section index="01" label="MECHANISM">
        <div className="prose">
          <p>
            Two independent springs, one per edge. No scale keyframes, no scripted squash — the
            stretch you see is the disagreement between a stiff spring and a soft one traveling the
            same distance. When they agree again, the indicator is at rest. That's the whole
            mechanism.
          </p>
          <p className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
            this instance runs the site's constants (leading 1300/46, trailing 300/30); the registry
            component ships its own hand-tuned pair
          </p>
        </div>
      </Section>
    </Detail>
  );
}
