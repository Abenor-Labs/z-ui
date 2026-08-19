import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Section } from '../../components/Section';
import { SpringGraph } from '../../components/SpringGraph';
import { Disclosure } from '../../zui/Disclosure';
import { useLiveSamples } from '../../lib/useLiveSamples';

const SHORT = ["This panel's height is one spring target — nothing more."];

const LONG = [
  "This panel's height is one spring target. Toggling doesn't restart an animation — it re-targets the same value, so whatever velocity the height had is carried into the reversal. There is no snap-back to a default curve, because there is no default curve.",
  'The registry component\u2019s API is uncontrolled by default — it works with zero setup — with open / onOpenChange for apps that need real control.',
];

const TITLE = 'Press me — then press me again mid-open';

export function DisclosurePage() {
  const [content, setContent] = useState('long');
  const { push, samples } = useLiveSamples(3.2);
  const paragraphs = content === 'short' ? SHORT : LONG;

  const code = [
    `<Disclosure title="${TITLE}">`,
    ...paragraphs.map((p) => `  <p>${p.length > 56 ? `${p.slice(0, 53)}…` : p}</p>`),
    '</Disclosure>',
  ].join('\n');

  return (
    <Detail
      name="disclosure"
      preview={
        <Playground
          stage="pg-stage-text"
          controls={[
            {
              label: 'Content',
              value: content,
              onChange: setContent,
              options: [
                { value: 'short', label: 'short' },
                { value: 'long', label: 'long' },
              ],
            },
          ]}
          code={code}
          caption="Interrupt it as fast as you can. The graph below records the height — look for the reversals: the curve bends, it never jumps. Switching the content changes the spring's target mid-life; it does not change the spring."
        >
          <div style={{ maxWidth: 560 }}>
            <Disclosure title={TITLE} onHeightSample={push}>
              {paragraphs.map((p) => (
                <p className="playground-caption" key={p.slice(0, 24)}>
                  {p}
                </p>
              ))}
            </Disclosure>
          </div>
        </Playground>
      }
    >
      <Section index="01" label="TELEMETRY">
        <SpringGraph samples={samples} windowSec={3} yLabel="height (px)" />
        <p className="playground-caption">
          Height over the last three seconds of your own toggling. A snap-back implementation would
          show a discontinuity at every interrupt — a corner where the value teleports onto a fresh
          curve. A carried velocity shows as a smooth bend.
        </p>
      </Section>
    </Detail>
  );
}
