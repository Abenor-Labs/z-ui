import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { LabPlayground } from '../../lab/shared/LabPlayground';
import { LAB_SPRING_OPTIONS } from '../../lab/shared/labSprings';
import { OdometerDemo } from '../../lab/text/Odometer';

export function Text() {
  return (
    <Page title="Text lab">
      <div className="detail-head">
        <Link to="/lab" className="mono detail-back">
          ← lab
        </Link>
        <h1>text</h1>
        <div className="detail-meta mono">
          <span>site-only</span>
          <span>not in the registry</span>
          <span>no CLI command</span>
        </div>
        <p className="detail-principle">
          First of a planned fifteen text interactions. This one is a counter because
          the number itself is the measurement artifact: the wheels and the mono
          readout show the same live value, one of them in Signal.
        </p>
      </div>

      <LabPlayground
        index="01"
        name="Odometer Counter"
        description="Fire a target, then fire another while the wheels are still turning. Each drum sits exactly on its digit at rest and advances its left neighbour only through the last tenth of a revolution, so 999 to 1000 rolls all three drums together through the shared carry. The value lives on one motion value that is re-aimed, never recreated, so an interrupt mid-roll carries its velocity into the reversal."
        instruction="Click a target, then click another mid-roll"
        meta={{ interaction: 'Target change', motion: 'Spring + velocity carry-over', dependencies: 'motion' }}
        controls={[
          {
            id: 'digits',
            label: 'Wheels',
            type: 'segmented',
            options: [{ value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }],
            default: '4',
          },
          { id: 'spring', label: 'Spring feel', type: 'segmented', options: LAB_SPRING_OPTIONS, default: 'snappy' },
        ]}
        presets={[
          { id: 'calm', label: 'Calm', values: { digits: '3', spring: 'smooth' } },
          { id: 'standard', label: 'Standard', values: { digits: '4', spring: 'snappy' } },
          { id: 'rowdy', label: 'Rowdy', values: { digits: '5', spring: 'wild' } },
        ]}
        code={(c) => `<Odometer\n  value={target}\n  digits={${c.digits}}\n  spring="${c.spring}"\n/>`}
      >
        {(c, k) => <OdometerDemo key={k} digits={Number(c.digits)} spring={c.spring as 'snappy'} />}
      </LabPlayground>
    </Page>
  );
}
