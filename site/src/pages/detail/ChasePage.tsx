import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Section } from '../../components/Section';
import { Chase } from '@z-ui/registry/chase/chase';
import { useSiteSpring } from '../../lib/springs';

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
  // demo chrome: the annotation that points at the first emergent stretch.
  // Lives here, not in the component — it teaches, it doesn't segment.
  const [noteShown, setNoteShown] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const noteTimer = useRef(0);
  const { stiff } = useSiteSpring();
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const labels = SETS[count];
  // a shrinking set can strand the selection; the first stage is the honest fallback
  const active = labels.includes(value) ? value : labels[0];
  const options = labels.map((v) => ({ value: v, label: v }));

  const onChange = (v: string) => {
    setValue(v);
    if (annotate !== 'on' || noteShown) return;
    setNoteShown(true);
    setNoteVisible(true);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNoteVisible(false), 3200);
  };

  const code = [
    '<Chase',
    '  label="Pipeline stage"',
    `  options={[${labels.map((v) => `{ value: '${v}', label: '${v}' }`).join(', ')}]}`,
    `  value={'${active}'}`,
    '  onValueChange={setValue}',
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
          <div className="chase-wrap">
            <Chase
              key={`${count}-${annotate}`}
              label="Pipeline stage"
              options={options}
              value={active}
              onValueChange={onChange}
            />
            <AnimatePresence>
              {noteVisible ? (
                <motion.div
                  className="chase-annotation"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={stiff}
                >
                  <span className="chase-annotation-line" aria-hidden="true" />
                  <span className="mono chase-annotation-text">
                    stretch = two springs disagreeing · leading 950/62 · trailing 380/34 · nothing
                    scripted
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
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
            leading 950/62, trailing 380/34 — these are the shipped constants; this demo runs the
            exact file the CLI installs.
          </p>
        </div>
      </Section>
    </Detail>
  );
}
