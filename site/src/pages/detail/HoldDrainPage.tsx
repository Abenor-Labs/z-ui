import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { HoldDrain } from '../../zui/HoldDrain';

const RATES = ['30', '60', '120'];

export function HoldDrainPage() {
  const [rate, setRate] = useState('60');

  return (
    <Detail
      name="hold-drain"
      preview={
        <Playground
          stage="graph-bg"
          controls={[
            {
              label: 'Rate',
              value: rate,
              onChange: setRate,
              options: RATES.map((v) => ({ value: v, label: `${v} %/s` })),
            },
          ]}
          code={`<HoldDrain rate={${rate}} onConfirm={confirm} />`}
          caption={`An abort costs what the hold earned: let go and the fill drains at exactly the rate it climbed. At ${rate} %/s a full commit takes ${(100 / Number(rate)).toFixed(2)}s — and so does giving up on one.`}
        >
          <HoldDrain key={rate} rate={Number(rate)} />
        </Playground>
      }
    />
  );
}
