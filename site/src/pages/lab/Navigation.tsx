import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { LabPlayground } from '../../lab/shared/LabPlayground';
import { LabCategoryPage, LabMiniPreview, type LabDemoEntry } from '../../lab/shared/LabCategoryPage';
import { LAB_SPRING_OPTIONS } from '../../lab/shared/labSprings';
import { MagneticLinks } from '../../lab/navigation/MagneticLinks';
import { CursorUnderline } from '../../lab/navigation/CursorUnderline';
import { ActivePill } from '../../lab/navigation/ActivePill';
import { MorphNav } from '../../lab/navigation/MorphNav';
import { DockNav } from '../../lab/navigation/DockNav';
import { ExpandingMenu } from '../../lab/navigation/ExpandingMenu';
import { CircularMenu } from '../../lab/navigation/CircularMenu';
import { RadialNav } from '../../lab/navigation/RadialNav';

const ENTRIES: LabDemoEntry[] = [
  {
    id: 'magnetic',
    index: '01',
    name: 'Magnetic Nav Links',
    trigger: 'Cursor proximity',
    preview: (
      <LabMiniPreview>
        <MagneticLinks />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="01"
        name="Magnetic Nav Links"
        description="Move your cursor near a link. Each one leans toward the pointer inside a small field, then springs back the instant you leave it."
        instruction="Move your cursor near a link"
        meta={{ interaction: 'Cursor proximity', motion: 'Spring displacement', dependencies: 'motion' }}
        controls={[
          { id: 'radius', label: 'Attraction radius', type: 'range', min: 60, max: 200, step: 10, default: 120, unit: 'px' },
          { id: 'strength', label: 'Max displacement', type: 'range', min: 0.1, max: 1, step: 0.05, default: 0.6 },
          { id: 'spring', label: 'Spring feel', type: 'segmented', options: LAB_SPRING_OPTIONS, default: 'smooth' },
        ]}
        presets={[
          { id: 'subtle', label: 'Subtle', values: { radius: 80, strength: 0.3, spring: 'gentle' } },
          { id: 'standard', label: 'Standard', values: { radius: 120, strength: 0.6, spring: 'smooth' } },
          { id: 'aggressive', label: 'Aggressive', values: { radius: 160, strength: 0.9, spring: 'wild' } },
        ]}
        code={(c) => `<MagneticNavLinks\n  radius={${c.radius}}\n  strength={${c.strength}}\n  spring="${c.spring}"\n/>`}
      >
        {(c, k) => (
          <MagneticLinks
            key={k}
            radius={c.radius as number}
            strength={c.strength as number}
            spring={c.spring as 'gentle' | 'smooth' | 'snappy' | 'bouncy' | 'heavy' | 'wild'}
          />
        )}
      </LabPlayground>
    ),
  },
  {
    id: 'underline',
    index: '02',
    name: 'Cursor-Follow Underline',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <CursorUnderline />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="02"
        name="Cursor-Follow Underline"
        description="Hover across the links fast. The underline's leading edge outruns the trailing edge — the stretch is two springs disagreeing, the same mechanic as the chase control elsewhere on this site."
        instruction="Hover across the links, fast"
        meta={{ interaction: 'Hover', motion: 'Two-spring chase', dependencies: 'motion' }}
        code={() => '<CursorUnderline />'}
      >
        {(_, k) => <CursorUnderline key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'pill',
    index: '03',
    name: 'Active Pill Indicator',
    trigger: 'Click',
    preview: (
      <LabMiniPreview>
        <ActivePill />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="03"
        name="Active Pill Indicator"
        description="Click between items. The pill resizes on the way, stretching toward whichever edge is leading, and settles soft."
        instruction="Click between the items"
        meta={{ interaction: 'Click', motion: 'Two-spring chase', dependencies: 'motion' }}
        code={() => '<ActivePill />'}
      >
        {(_, k) => <ActivePill key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'morph',
    index: '04',
    name: 'Morphing Navigation',
    trigger: 'Click',
    preview: (
      <LabMiniPreview scale={0.45}>
        <MorphNav />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="04"
        name="Morphing Navigation"
        description="Press the bar itself. Layout, radius, background, and label width animate together — nothing here is cross-faded, the shape itself is a spring target."
        instruction="Press the bar itself"
        meta={{ interaction: 'Click', motion: 'Layout + spring', dependencies: 'motion' }}
        code={() => '<MorphNav />'}
      >
        {(_, k) => <MorphNav key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'dock',
    index: '05',
    name: 'Dock Navigation',
    trigger: 'Cursor sweep',
    preview: (
      <LabMiniPreview scale={0.4}>
        <DockNav />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="05"
        name="Dock Navigation"
        description="Sweep across the row. Magnification falls off from the cursor with an eased curve, so neighbours lift a little too — a real dock, not four discrete states."
        instruction="Sweep across the dock"
        meta={{ interaction: 'Cursor sweep', motion: 'Eased falloff', dependencies: 'motion' }}
        stageClassName="pg-stage-nav"
        controls={[
          { id: 'maxScale', label: 'Maximum magnification', type: 'range', min: 1.2, max: 2.5, step: 0.1, default: 1.7, unit: '×' },
          { id: 'radius', label: 'Influence radius', type: 'range', min: 30, max: 150, step: 10, default: 70, unit: 'px' },
          {
            id: 'spread',
            label: 'Neighbour response',
            type: 'range',
            min: 0.4,
            max: 2.5,
            step: 0.1,
            default: 1,
            description: 'Below 1 spreads the bump to neighbours; above 1 isolates the peak.',
          },
        ]}
        presets={[
          { id: 'tight', label: 'Tight', values: { maxScale: 1.5, radius: 40, spread: 1.8 } },
          { id: 'balanced', label: 'Balanced', values: { maxScale: 1.7, radius: 70, spread: 1 } },
          { id: 'wide', label: 'Wide', values: { maxScale: 2, radius: 110, spread: 0.6 } },
        ]}
        code={(c) => `<DockNavigation\n  maxScale={${c.maxScale}}\n  radius={${c.radius}}\n  spread={${c.spread}}\n/>`}
      >
        {(c, k) => (
          <DockNav key={k} maxScale={c.maxScale as number} radius={c.radius as number} spread={c.spread as number} />
        )}
      </LabPlayground>
    ),
  },
  {
    id: 'expand',
    index: '06',
    name: 'Expanding Menu',
    trigger: 'Click',
    preview: (
      <LabMiniPreview scale={0.5}>
        <ExpandingMenu />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="06"
        name="Expanding Menu"
        description="Press the mark. It reshapes into the panel it triggers — same element, one layout animation, no swapped-in icon."
        instruction="Press the mark"
        meta={{ interaction: 'Click', motion: 'Layout + stagger', dependencies: 'motion' }}
        stageClassName="pg-stage-nav"
        code={() => '<ExpandingMenu />'}
      >
        {(_, k) => <ExpandingMenu key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'circular',
    index: '07',
    name: 'Circular Menu',
    trigger: 'Click',
    preview: (
      <LabMiniPreview scale={0.45}>
        <CircularMenu />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="07"
        name="Circular Menu"
        description="Press the hub. Items fan out along an arc with a short stagger and fold back the same way on close."
        instruction="Press the hub"
        meta={{ interaction: 'Click', motion: 'Polar spring fan', dependencies: 'motion' }}
        stageClassName="pg-stage-nav"
        code={() => '<CircularMenu />'}
      >
        {(_, k) => <CircularMenu key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'radial',
    index: '08',
    name: 'Radial Navigation',
    trigger: 'Click',
    preview: (
      <LabMiniPreview scale={0.45}>
        <RadialNav />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="08"
        name="Radial Navigation"
        description="Press the hub. The ring rotates open like a dial face — press an item to select it and the ring folds back in."
        instruction="Press the hub"
        meta={{ interaction: 'Click', motion: 'Rotational spring', dependencies: 'motion' }}
        stageClassName="pg-stage-nav"
        code={() => '<RadialNav />'}
      >
        {(_, k) => <RadialNav key={k} />}
      </LabPlayground>
    ),
  },
];

export function Navigation() {
  return (
    <Page title="Navigation lab">
      <div className="detail-head">
        <Link to="/lab" className="mono detail-back">
          ← lab
        </Link>
        <h1>navigation</h1>
        <div className="detail-meta mono">
          <span>site-only</span>
          <span>not in the registry</span>
          <span>no CLI command</span>
        </div>
        <p className="detail-principle">
          Eight navigation interactions, built to move the way the rest of Z-UI does: springs
          that re-target instead of restarting, edges that disagree with each other, nothing
          that snaps to a default curve. None of these install — this is a lab bench for the
          pattern, not a product.
        </p>
      </div>

      <LabCategoryPage entries={ENTRIES} gridLabel="MORE NAVIGATION DEMOS" />
    </Page>
  );
}
