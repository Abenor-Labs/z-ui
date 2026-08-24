import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { LabPlayground } from '../../lab/shared/LabPlayground';
import { LabCategoryPage, LabMiniPreview, type LabDemoEntry } from '../../lab/shared/LabCategoryPage';
import { LAB_SPRING_OPTIONS } from '../../lab/shared/labSprings';
import { MagneticButton } from '../../lab/buttons/MagneticButton';
import { LiquidFillButton } from '../../lab/buttons/LiquidFillButton';
import { CursorFollowButton } from '../../lab/buttons/CursorFollowButton';
import { ArrowSlideButton } from '../../lab/buttons/ArrowSlideButton';
import { SplitTextButton } from '../../lab/buttons/SplitTextButton';
import { ExpandingCircleButton } from '../../lab/buttons/ExpandingCircleButton';
import { BorderDrawButton } from '../../lab/buttons/BorderDrawButton';
import { PixelRevealButton } from '../../lab/buttons/PixelRevealButton';
import { ElasticPressButton } from '../../lab/buttons/ElasticPressButton';
import { RippleButton } from '../../lab/buttons/RippleButton';
import { GlowFollowButton } from '../../lab/buttons/GlowFollowButton';
import { ShutterButton } from '../../lab/buttons/ShutterButton';
import { TiltButton } from '../../lab/buttons/TiltButton';
import { SpotlightButton } from '../../lab/buttons/SpotlightButton';
import { GooeyButton } from '../../lab/buttons/GooeyButton';

type Spring = 'gentle' | 'smooth' | 'snappy' | 'bouncy' | 'heavy' | 'wild';

const ENTRIES: LabDemoEntry[] = [
  {
    id: 'magnetic',
    index: '01',
    name: 'Magnetic Button',
    trigger: 'Cursor proximity',
    preview: (
      <LabMiniPreview>
        <MagneticButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="01"
        name="Magnetic Button"
        description="Move near it. The button leans toward the pointer inside a field; the label leans further than the edge, so the pull reads as depth."
        instruction="Move your cursor near the button"
        meta={{ interaction: 'Cursor proximity', motion: 'Spring displacement', dependencies: 'motion' }}
        controls={[
          { id: 'radius', label: 'Detection radius', type: 'range', min: 60, max: 200, step: 10, default: 110, unit: 'px' },
          { id: 'strength', label: 'Pull strength', type: 'range', min: 0.1, max: 1, step: 0.05, default: 0.5 },
          { id: 'depth', label: 'Inner depth', type: 'range', min: 0, max: 1, step: 0.05, default: 0.6, description: 'How much further the label leans than the button edge.' },
          { id: 'spring', label: 'Spring feel', type: 'segmented', options: LAB_SPRING_OPTIONS, default: 'smooth' },
        ]}
        presets={[
          { id: 'subtle', label: 'Subtle', values: { radius: 80, strength: 0.3, depth: 0.3, spring: 'gentle' } },
          { id: 'standard', label: 'Standard', values: { radius: 110, strength: 0.5, depth: 0.6, spring: 'smooth' } },
          { id: 'aggressive', label: 'Aggressive', values: { radius: 160, strength: 0.9, depth: 1, spring: 'wild' } },
        ]}
        code={(c) => `<MagneticButton\n  radius={${c.radius}}\n  strength={${c.strength}}\n  depth={${c.depth}}\n  spring="${c.spring}"\n>\n  Explore\n</MagneticButton>`}
      >
        {(c, k) => (
          <MagneticButton
            key={k}
            radius={c.radius as number}
            strength={c.strength as number}
            depth={c.depth as number}
            spring={c.spring as Spring}
          />
        )}
      </LabPlayground>
    ),
  },
  {
    id: 'liquid',
    index: '02',
    name: 'Liquid Fill Button',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <LiquidFillButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="02"
        name="Liquid Fill Button"
        description="Hover in. The fill rises from the bottom on a soft spring and the label inverts exactly where the fill has reached — one spring target driving both."
        instruction="Hover in"
        meta={{ interaction: 'Hover', motion: 'Spring fill', dependencies: 'motion' }}
        code={() => '<LiquidFillButton />'}
      >
        {(_, k) => <LiquidFillButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'follow',
    index: '03',
    name: 'Cursor-Follow Button',
    trigger: 'Hover + move',
    preview: (
      <LabMiniPreview>
        <CursorFollowButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="03"
        name="Cursor-Follow Button"
        description="Move inside the button. A marker tracks the pointer on a stiff spring — near-instant, still interruptible."
        instruction="Move inside the button"
        meta={{ interaction: 'Hover + move', motion: 'Stiff tracking', dependencies: 'motion' }}
        code={() => '<CursorFollowButton />'}
      >
        {(_, k) => <CursorFollowButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'arrow',
    index: '04',
    name: 'Arrow-Slide Button',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <ArrowSlideButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="04"
        name="Arrow-Slide Button"
        description="Hover. The arrow exits toward the edge as a second one enters from behind the label — a relay, not a single glyph animating."
        instruction="Hover over the button"
        meta={{ interaction: 'Hover', motion: 'Spring relay', dependencies: 'motion' }}
        code={() => '<ArrowSlideButton />'}
      >
        {(_, k) => <ArrowSlideButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'split',
    index: '05',
    name: 'Split Text Button',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <SplitTextButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="05"
        name="Split Text Button"
        description="Hover. Each letter lifts out on its own delay while its twin rises in underneath — two full-word rows, never a single letter mid-flight alone."
        instruction="Hover over the button"
        meta={{ interaction: 'Hover', motion: 'Staggered spring', dependencies: 'motion' }}
        code={() => '<SplitTextButton />'}
      >
        {(_, k) => <SplitTextButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'expand-circle',
    index: '06',
    name: 'Expanding Circle Button',
    trigger: 'Hover (entry point)',
    preview: (
      <LabMiniPreview>
        <ExpandingCircleButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="06"
        name="Expanding Circle Button"
        description="Enter from any edge. The fill originates at exactly the point you crossed, not the button's center."
        instruction="Enter from any edge"
        meta={{ interaction: 'Hover (entry point)', motion: 'Spring expansion', dependencies: 'motion' }}
        code={() => '<ExpandingCircleButton />'}
      >
        {(_, k) => <ExpandingCircleButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'border-draw',
    index: '07',
    name: 'Border-Draw Button',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <BorderDrawButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="07"
        name="Border-Draw Button"
        description="Hover. The outline draws itself around the perimeter as one continuous stroke, using pathLength rather than a cross-fade."
        instruction="Hover over the button"
        meta={{ interaction: 'Hover', motion: 'Spring pathLength', dependencies: 'motion' }}
        code={() => '<BorderDrawButton />'}
      >
        {(_, k) => <BorderDrawButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'pixel',
    index: '08',
    name: 'Pixel Reveal Button',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <PixelRevealButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="08"
        name="Pixel Reveal Button"
        description="Hover. A grid of tiles unfolds from the left in a diagonal wave — the label inverts through them via blend mode, not a second color."
        instruction="Hover over the button"
        meta={{ interaction: 'Hover', motion: 'Staggered spring', dependencies: 'motion' }}
        code={() => '<PixelRevealButton />'}
      >
        {(_, k) => <PixelRevealButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'elastic',
    index: '09',
    name: 'Elastic Press Button',
    trigger: 'Press and hold',
    preview: (
      <LabMiniPreview>
        <ElasticPressButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="09"
        name="Elastic Press Button"
        description="Press and hold. It squashes wide and short on the same soft spring the rest of the site uses, and picks up the contact shadow the moment it is pressed."
        instruction="Press and hold"
        meta={{ interaction: 'Press and hold', motion: 'Squash + stretch', dependencies: 'motion' }}
        controls={[
          { id: 'depth', label: 'Press depth', type: 'range', min: 0, max: 1, step: 0.05, default: 0.5 },
          { id: 'spring', label: 'Release spring', type: 'segmented', options: LAB_SPRING_OPTIONS, default: 'smooth' },
          { id: 'contactShadow', label: 'Contact shadow', type: 'boolean', default: true },
        ]}
        presets={[
          { id: 'soft', label: 'Soft', values: { depth: 0.25, spring: 'gentle' } },
          { id: 'standard', label: 'Standard', values: { depth: 0.5, spring: 'smooth' } },
          { id: 'hard', label: 'Hard', values: { depth: 0.9, spring: 'bouncy' } },
        ]}
        code={(c) => `<ElasticPressButton\n  depth={${c.depth}}\n  spring="${c.spring}"\n  contactShadow={${c.contactShadow}}\n>\n  Press and hold\n</ElasticPressButton>`}
      >
        {(c, k) => (
          <ElasticPressButton key={k} depth={c.depth as number} spring={c.spring as Spring} contactShadow={c.contactShadow as boolean} />
        )}
      </LabPlayground>
    ),
  },
  {
    id: 'ripple',
    index: '10',
    name: 'Ripple Button',
    trigger: 'Click',
    preview: (
      <LabMiniPreview>
        <RippleButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="10"
        name="Ripple Button"
        description="Click anywhere on it, repeatedly. Every press spawns its own ring at the exact point pressed; rings do not wait for each other."
        instruction="Click anywhere inside the stage"
        meta={{ interaction: 'Click', motion: 'Tween expansion', dependencies: 'motion' }}
        controls={[
          { id: 'speedMs', label: 'Ripple speed', type: 'range', min: 150, max: 1200, step: 50, default: 500, unit: 'ms' },
          { id: 'maxScale', label: 'Maximum radius', type: 'range', min: 6, max: 24, step: 1, default: 14, description: "Relative to the ring's ~10px starting size." },
          { id: 'fadeMs', label: 'Fade duration', type: 'range', min: 150, max: 1200, step: 50, default: 500, unit: 'ms' },
        ]}
        presets={[
          { id: 'quick', label: 'Quick', values: { speedMs: 250, maxScale: 10, fadeMs: 250 } },
          { id: 'standard', label: 'Standard', values: { speedMs: 500, maxScale: 14, fadeMs: 500 } },
          { id: 'slow', label: 'Slow', values: { speedMs: 900, maxScale: 20, fadeMs: 900 } },
        ]}
        code={(c) => `<RippleButton\n  speedMs={${c.speedMs}}\n  maxScale={${c.maxScale}}\n  fadeMs={${c.fadeMs}}\n>\n  Click anywhere\n</RippleButton>`}
      >
        {(c, k) => (
          <RippleButton key={k} speedMs={c.speedMs as number} maxScale={c.maxScale as number} fadeMs={c.fadeMs as number} />
        )}
      </LabPlayground>
    ),
  },
  {
    id: 'glow-follow',
    index: '11',
    name: 'Glow-Follow Button',
    trigger: 'Hover + move',
    preview: (
      <LabMiniPreview>
        <GlowFollowButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="11"
        name="Glow-Follow Button"
        description="Move across it. A bracket mark tracks the pointer — a reticle, not a soft light; this site does not ship gradients."
        instruction="Move across the button"
        meta={{ interaction: 'Hover + move', motion: 'Stiff tracking', dependencies: 'motion' }}
        code={() => '<GlowFollowButton />'}
      >
        {(_, k) => <GlowFollowButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'shutter',
    index: '12',
    name: 'Shutter Button',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <ShutterButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="12"
        name="Shutter Button"
        description="Hover. Six slats drop from the top in sequence, like a shutter opening — the label inverts underneath as the last slat lands."
        instruction="Hover over the button"
        meta={{ interaction: 'Hover', motion: 'Staggered spring', dependencies: 'motion' }}
        code={() => '<ShutterButton />'}
      >
        {(_, k) => <ShutterButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'tilt',
    index: '13',
    name: '3D Tilt Button',
    trigger: 'Hover + move',
    preview: (
      <LabMiniPreview>
        <TiltButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="13"
        name="3D Tilt Button"
        description="Move across it. It tilts around the axis facing away from the pointer and lifts slightly — a real perspective transform, not a shadow trick."
        instruction="Move across the button"
        meta={{ interaction: 'Hover + move', motion: 'Perspective spring', dependencies: 'motion' }}
        code={() => '<TiltButton />'}
      >
        {(_, k) => <TiltButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'spotlight',
    index: '14',
    name: 'Spotlight Button',
    trigger: 'Hover + move',
    preview: (
      <LabMiniPreview>
        <SpotlightButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="14"
        name="Spotlight Button"
        description="Move across it. A hard-edged circle follows the pointer and reveals an inverted copy of the label underneath — a mask, not a glow."
        instruction="Move across the button"
        meta={{ interaction: 'Hover + move', motion: 'Stiff mask reveal', dependencies: 'motion' }}
        code={() => '<SpotlightButton />'}
      >
        {(_, k) => <SpotlightButton key={k} />}
      </LabPlayground>
    ),
  },
  {
    id: 'gooey',
    index: '15',
    name: 'Gooey Button',
    trigger: 'Hover',
    preview: (
      <LabMiniPreview>
        <GooeyButton />
      </LabMiniPreview>
    ),
    playground: (
      <LabPlayground
        index="15"
        name="Gooey Button"
        description="Hover. A satellite blob slides out and fuses into the button through an SVG blur + contrast filter — the label sits outside the filtered layer, so it never softens."
        instruction="Hover over the button"
        meta={{ interaction: 'Hover', motion: 'SVG filter blend', dependencies: 'motion' }}
        code={() => '<GooeyButton />'}
      >
        {(_, k) => <GooeyButton key={k} />}
      </LabPlayground>
    ),
  },
];

export function Buttons() {
  return (
    <Page title="Buttons lab">
      <div className="detail-head">
        <Link to="/lab" className="mono detail-back">
          ← lab
        </Link>
        <h1>buttons</h1>
        <div className="detail-meta mono">
          <span>site-only</span>
          <span>not in the registry</span>
          <span>no CLI command</span>
        </div>
        <p className="detail-principle">
          Fifteen button interactions. No gradients — the site does not ship them — so glow and
          spotlight effects here read as hard-edged masks and reticles instead, which fits how
          little this site softens anything else.
        </p>
      </div>

      <LabCategoryPage entries={ENTRIES} gridLabel="MORE BUTTON DEMOS" />
    </Page>
  );
}
