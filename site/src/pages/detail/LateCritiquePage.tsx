import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { LateCritique } from '../../zui/LateCritique';

export function LateCritiquePage() {
  const [log, setLog] = useState('on');
  const [density, setDensity] = useState('full');

  const showLog = log === 'on';
  const compact = density === 'compact';

  const code = ['<LateCritique', `  showLog={${showLog}}`, `  compact={${compact}}`, '/>'].join(
    '\n',
  );

  return (
    <Detail
      name="late-critique"
      preview={
        <Playground
          stage="pg-stage-text"
          controls={[
            {
              label: 'Decision log',
              value: log,
              onChange: setLog,
              options: [
                { value: 'off', label: 'off' },
                { value: 'on', label: 'on' },
              ],
            },
            {
              label: 'Density',
              value: density,
              onChange: setDensity,
              options: [
                { value: 'full', label: 'full' },
                { value: 'compact', label: 'compact' },
              ],
            },
          ]}
          code={code}
          caption="Type a wrong email and keep typing — no verdict lands mid-word. Stop, and the criticism arrives. Then fix it: the first keystroke that makes the value valid clears the error on the same frame it's typed. The log prints every decision as it happens, timestamped."
        >
          <LateCritique key={`${log}-${density}`} showLog={showLog} compact={compact} />
        </Playground>
      }
    />
  );
}
