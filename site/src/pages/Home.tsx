import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { DemoCard } from '../components/DemoCard';
import { REGISTRY, installCommand, REPO_URL } from '../data/registry';
import { Dial } from '@z-ui/registry/dial/dial';
import { Chase } from '@z-ui/registry/chase/chase';
import { Heft } from '@z-ui/registry/heft/heft';
import { Disclosure } from '@z-ui/registry/disclosure/disclosure';
import { HoldDrainDemo, type HoldDrainDemoHandle } from '../components/HoldDrainDemo';
import { LateCritiqueDemo, type LateCritiqueDemoHandle } from '../components/LateCritiqueDemo';
import { ScrambleReveal } from '@z-ui/registry/scramble-reveal/scramble-reveal';
import { Reel } from '../zui/Reel';
import { Origin, type OriginHandle } from '../zui/Origin';
import { Grip, type GripHandle } from '../zui/Grip';
import { Intent } from '../zui/Intent';

const BLURB = new Map(REGISTRY.map((c) => [c.name, c]));

/** one-line card subtitles — the mechanism, in the product's voice */
const SUB: Record<string, string> = {
  dial: 'A knob with a flywheel in it — flick it and friction hands it to the nearest detent',
  chase: 'Two springs disagree — the stretch is the speed',
  heft: 'Gravity, contacts and friction, no choreography',
  disclosure: 'Height is a spring that reverses mid-flight',
  'hold-drain': 'Abort drains at the rate the hold climbed',
  'late-critique': 'No verdict mid-word, forgiveness same frame',
  'scramble-reveal': 'Glyphs lock left to right, once per trigger',
  reel: 'Impulse sized so friction lands it on the digit',
  origin: 'Clip anchored to the press, closing toward you',
  grip: 'Static friction holds until the pull breaks it',
  intent: 'Heading and speed decide — no open timer',
};

export function Home() {
  const holdDrain = useRef<HoldDrainDemoHandle>(null);
  const critique = useRef<LateCritiqueDemoHandle>(null);
  const origin = useRef<OriginHandle>(null);
  const grip = useRef<GripHandle>(null);
  const intentStage = useRef<HTMLDivElement>(null);

  const [chaseValue, setChaseValue] = useState('two');
  const [spawn, setSpawn] = useState(0);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  /** intent's decision is real; only the pointer is simulated, and the card says so */
  const simulateApproach = () => {
    const el = intentStage.current?.querySelector('.intent-trigger');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    let i = 0;
    const steps = 14;
    const timer = window.setInterval(() => {
      if (i > steps) {
        window.clearInterval(timer);
        return;
      }
      const k = i / steps;
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: tx - 240 * (1 - k),
          clientY: ty - 90 * (1 - k),
          pointerId: 1,
        }),
      );
      i++;
    }, 24);
  };

  return (
    <Page>
      <header className="lander">
        <span className="lander-mark" aria-hidden="true">
          <svg viewBox="-12 -12 24 24" width="26" height="26">
            <circle r="9" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <line x1="0" y1="-9" x2="0" y2="-3" stroke="var(--signal)" strokeWidth="2.5" />
            <circle r="1.6" fill="var(--ink)" />
          </svg>
        </span>
        <h1 className="lander-title">Micro-animations you own.</h1>
        <p className="lander-sub">
          A copy-paste registry of React micro-interactions, installed as source into your project —
          not pulled in as a runtime dependency. Every demo below is the real component. Press the
          trigger, then take it over with your own hands.
        </p>
        <div className="lander-cta">
          <Link to="/components" className="pill pill-primary">
            Browse
          </Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="pill">
            GitHub ↗
          </a>
        </div>
        <code className="mono lander-install">{installCommand('dial')}</code>
      </header>

      <div className="demo-grid">
        <DemoCard
          name="dial"
          title="Dial"
          subtitle={SUB.dial}
          copyText={installCommand('dial')}
          href="/components/dial"
        >
          <Dial label="level" min={0} max={10} size={140} />
        </DemoCard>

        <DemoCard
          name="chase"
          title="Chase"
          subtitle={SUB.chase}
          action="swap"
          onAction={() => setChaseValue((v) => (v === 'one' ? 'two' : v === 'two' ? 'three' : 'one'))}
          copyText={installCommand('chase')}
          href="/components/chase"
        >
          <Chase
            label="Filter"
            options={[
              { value: 'one', label: 'one' },
              { value: 'two', label: 'two' },
              { value: 'three', label: 'three' },
            ]}
            value={chaseValue}
            onValueChange={setChaseValue}
          />
        </DemoCard>

        <DemoCard
          name="heft"
          title="Heft"
          subtitle={SUB.heft}
          action="drop"
          onAction={() => setSpawn((s) => s + 1)}
          copyText={installCommand('heft')}
          href="/components/heft"
        >
          <Heft
            height={190}
            spawnCount={spawn}
            initialBodies={[
              { w: 52, h: 38 },
              { w: 66, h: 32 },
              { w: 40, h: 48 },
            ]}
          />
        </DemoCard>

        <DemoCard
          name="disclosure"
          title="Disclosure"
          subtitle={SUB.disclosure}
          action="toggle"
          onAction={() => setOpen((o) => !o)}
          copyText={installCommand('disclosure')}
          href="/components/disclosure"
        >
          <div style={{ width: '100%' }}>
            <Disclosure label="specs" open={open} onOpenChange={setOpen}>
              <p className="demo-body">
                Press again mid-open and it reverses from where it is, carrying the velocity it
                already had.
              </p>
            </Disclosure>
          </div>
        </DemoCard>

        <DemoCard
          name="hold-drain"
          title="Hold-drain"
          subtitle={SUB['hold-drain']}
          action="hold 700ms"
          onAction={() => holdDrain.current?.hold(700)}
          copyText={installCommand('hold-drain')}
          href="/components/hold-drain"
        >
          <HoldDrainDemo ref={holdDrain} compact readouts />
        </DemoCard>

        <DemoCard
          name="late-critique"
          title="Late-critique"
          subtitle={SUB['late-critique']}
          action="type a bad address"
          onAction={() => critique.current?.type('nope@nope')}
          copyText={installCommand('late-critique')}
          href="/components/late-critique"
        >
          <LateCritiqueDemo ref={critique} compact showLog={false} />
        </DemoCard>

        <DemoCard
          name="scramble-reveal"
          title="Scramble-reveal"
          subtitle={SUB['scramble-reveal']}
          copyText={installCommand('scramble-reveal')}
          href="/components/scramble-reveal"
        >
          <span className="mono demo-scramble">
            <ScrambleReveal trigger="hover" text="text that decodes out of random glyphs." />
          </span>
        </DemoCard>

        <DemoCard
          name="reel"
          title="Reel"
          subtitle={SUB.reel}
          badge="candidate"
          action="+248"
          onAction={() => setCount((c) => c + 248)}
          href="/candidates"
        >
          <Reel value={count} digits={4} readouts={false} />
        </DemoCard>

        <DemoCard
          name="origin"
          title="Origin"
          subtitle={SUB.origin}
          badge="candidate"
          action="open"
          onAction={() => origin.current?.openAt(0.18, 0.3)}
          href="/candidates"
        >
          <Origin ref={origin} label="open panel" readouts={false} compact>
            <p className="demo-body">Anchored to the press. It closes toward wherever you are.</p>
          </Origin>
        </DemoCard>

        <DemoCard
          name="grip"
          title="Grip"
          subtitle={SUB.grip}
          badge="candidate"
          action="push 40px"
          onAction={() => grip.current?.push(40)}
          href="/candidates"
        >
          <Grip ref={grip} width={300} height={104} compact />
        </DemoCard>

        <DemoCard
          name="intent"
          title="Intent"
          subtitle={SUB.intent}
          badge="candidate"
          action="simulate approach"
          onAction={simulateApproach}
          href="/candidates"
        >
          <div ref={intentStage} className="demo-intent">
            <Intent label="hover me" compact>
              <span className="mono">no timer decided this</span>
            </Intent>
          </div>
        </DemoCard>
      </div>

      <Section index="01" label="REFUSALS">
        <ul className="refusal-list">
          <li>
            <span>Not</span> a design system.
          </li>
          <li>
            <span>Not</span> a layout kit.
          </li>
          <li>
            <span>Not</span> a shadcn/ui replacement.
          </li>
          <li>
            <span>Not</span> anything that isn't a micro-animation.
          </li>
        </ul>
        <p className="playground-caption">
          If it isn't a micro-animation, it doesn't belong here. That constraint is the product.
        </p>
      </Section>

      <Section index="02" label="OWNERSHIP">
        <ul className="fact-list mono">
          <li>
            <code>add</code> writes the source into your tree. Your file now — edit the constants,
            delete what you don't want.
          </li>
          <li>No runtime dependency on Z-UI. Nothing to update, nothing to break you.</li>
          <li>
            Eight components in the registry. The four marked <em>candidate</em> are on the{' '}
            <Link to="/candidates">bench</Link> — no install command, and maybe never one.
          </li>
          <li>
            CSS keyframes cannot reverse mid-flight — mid-flight reversal is the product.{' '}
            <Link to="/architecture">why →</Link>
          </li>
          <li>
            v0.1, early. Names and props may change before v1. <Link to="/cli">the CLI →</Link>
          </li>
        </ul>
        <p className="playground-caption">
          {BLURB.get('dial')?.blurb} Grab it mid-spin and the spin is yours again.
        </p>
      </Section>
    </Page>
  );
}


