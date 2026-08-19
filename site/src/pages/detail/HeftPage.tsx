import { useState } from 'react';
import { Detail } from '../../components/DetailLayout';
import { Playground } from '../../components/Playground';
import { Readout } from '../../components/Readout';
import { Heft, type HeftBodySpec } from '@z-ui/registry/heft/heft';
import { fixed } from '../../lib/format';

const label = (i: number) => `OBJ-${String(i + 1).padStart(2, '0')}`;

/** each scene is a seed, not a script — the solver decides where everything ends up */
const SCENES: Record<string, (h: number) => HeftBodySpec[]> = {
  stack: (h) => [
    { w: 90, h: 56, label: 'OBJ-A' },
    { w: 64, h: 64, label: 'OBJ-B' },
    { w: 120, h: 40, label: 'OBJ-C' },
    { w: 56, h: 44, label: 'OBJ-D', x: 40, y: h - 102 },
    { w: 72, h: 48, label: 'OBJ-E', x: 44, y: h - 152 },
    { w: 48, h: 40, label: 'OBJ-F', x: 52, y: h - 198 },
  ],
  scatter: () =>
    [
      [70, 40],
      [44, 52],
      [96, 34],
      [58, 46],
      [38, 60],
      [82, 38],
    ].map(([w, h], i) => ({ w, h, label: label(i) })),
  tower: (h) =>
    Array.from({ length: 7 }, (_, i) => ({
      w: 54,
      h: 34,
      x: i % 2 ? 128 : 120,
      y: h - 34 * (i + 1) - i * 2,
      label: label(i),
    })),
  crowd: () =>
    Array.from({ length: 12 }, (_, i) => ({
      w: 34 + ((i * 13) % 26),
      h: 26 + ((i * 17) % 22),
      label: label(i),
      fontSize: 9,
    })),
};

const HEIGHTS = ['260', '420'];

function toCode(height: string, specs: HeftBodySpec[]) {
  const body = specs
    .map(
      (b) =>
        `    { w: ${b.w}, h: ${b.h}${b.label ? `, label: '${b.label}'` : ''}` +
        `${b.x !== undefined ? `, x: ${b.x}` : ''}${b.y !== undefined ? `, y: ${b.y}` : ''}${
          b.fontSize !== undefined ? `, fontSize: ${b.fontSize}` : ''
        } },`,
    )
    .join('\n');
  return `<Heft\n  height={${height}}\n  initialBodies={[\n${body}\n  ]}\n/>`;
}

export function HeftPage() {
  const [scene, setScene] = useState('stack');
  const [height, setHeight] = useState('420');
  const [contacts, setContacts] = useState(0);
  const [spawn, setSpawn] = useState(0);

  const h = Number(height);
  const specs = SCENES[scene](h);

  // the instance is reseeded, so the spawn counter starts over with it
  const reseed = (set: (v: string) => void) => (v: string) => {
    setSpawn(0);
    set(v);
  };

  return (
    <Detail
      name="heft"
      preview={
        <Playground
          controls={[
            {
              label: 'Scene',
              value: scene,
              onChange: reseed(setScene),
              options: Object.keys(SCENES).map((v) => ({ value: v, label: v })),
            },
            {
              label: 'Height',
              value: height,
              onChange: reseed(setHeight),
              options: HEIGHTS.map((v) => ({ value: v, label: `${v}px` })),
            },
          ]}
          code={toCode(height, specs)}
          readouts={<Readout label="contacts" value={fixed(contacts, 0, 3)} />}
          footer={
            <button className="spawn-btn" onClick={() => setSpawn((n) => n + 1)}>
              spawn object
            </button>
          }
          caption="Drag a box through the pile — everything it touches gets shoved aside. Pull the bottom box out of the stack: the ones above lose their floor and drop. Throw one; the release velocity is the box's velocity. Gravity, contacts, and friction — no choreography, just consequences."
        >
          <Heft
            key={`${scene}-${height}`}
            height={h}
            onContacts={setContacts}
            spawnCount={spawn}
            initialBodies={specs}
          />
        </Playground>
      }
    />
  );
}
