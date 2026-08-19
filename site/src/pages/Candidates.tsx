import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { CANDIDATES, type CandidateComponent } from '../data/candidates';
import { Reel } from '../zui/Reel';
import { Origin } from '../zui/Origin';
import { Grip } from '../zui/Grip';
import { Intent } from '../zui/Intent';

const BY_NAME = new Map(CANDIDATES.map((c) => [c.name, c]));

function byName(name: string): CandidateComponent {
  const c = BY_NAME.get(name);
  if (!c) throw new Error(`unknown candidate: ${name}`);
  return c;
}

function Notes({ name }: { name: string }) {
  const c = byName(name);
  return (
    <div className="candidate-notes">
      <div className="candidate-meta mono">
        <span>category: {c.category}</span>
        <span>needs: {c.needs}</span>
        <span>status: candidate</span>
      </div>
      <p className="candidate-principle">{c.principle}</p>
      <dl className="candidate-dl">
        <dt className="mono-label">mechanic</dt>
        <dd>{c.mechanic}</dd>
        <dt className="mono-label">learned from</dt>
        <dd>{c.learnedFrom}</dd>
        <dt className="mono-label">refuses</dt>
        <dd>{c.refuses}</dd>
      </dl>
    </div>
  );
}

function ReelBench() {
  const [value, setValue] = useState(0);
  return (
    <div className="playground graph-bg">
      <Reel value={value} digits={4} />
      <div className="candidate-controls">
        <button className="btn-mono" onClick={() => setValue((v) => v + 1)}>
          +1
        </button>
        <button className="btn-mono" onClick={() => setValue((v) => v + 7)}>
          +7
        </button>
        <button className="btn-mono" onClick={() => setValue((v) => v + 248)}>
          +248
        </button>
        <button className="btn-mono" onClick={() => setValue((v) => v + 1379)}>
          +1379
        </button>
        <button className="btn-mono" onClick={() => setValue(0)}>
          reset
        </button>
      </div>
      <p className="playground-caption">
        Press +1379, then press it again while the columns are still turning. Nothing restarts: the
        second impulse lands on the velocity the wheels already had, and the spin gets longer because
        there is further to fall.
      </p>
    </div>
  );
}

export function Candidates() {
  return (
    <Page title="Candidates">
      <div className="detail-head">
        <Link to="/components" className="mono detail-back">
          ← components
        </Link>
        <h1>candidates</h1>
        <div className="detail-meta mono">
          <span>not in the registry</span>
          <span>not installable</span>
          <span>no CLI command</span>
        </div>
        <p className="detail-principle">
          The registry ships seven components and still ships seven. These four are on the bench:
          each one takes a mechanic that exists elsewhere as decoration, strips it back to the rule
          underneath, and has to prove that rule is worth a file. Nothing here has an install command,
          because nothing here has earned one yet.
        </p>
      </div>

      <Section index="01" label="REEL" id="reel">
        <ReelBench />
        <Notes name="reel" />
      </Section>

      <Section index="02" label="ORIGIN" id="origin">
        <div className="playground graph-bg">
          <Origin label="open panel">
            <p className="playground-caption">
              This surface was clipped open from the exact point you pressed. Press close while it is
              still opening — the radius reverses from where it actually is, and the centre slides to
              wherever your pointer has got to by then.
            </p>
          </Origin>
        </div>
        <Notes name="origin" />
      </Section>

      <Section index="03" label="GRIP" id="grip">
        <div className="playground">
          <Grip />
          <p className="playground-caption">
            Push it slowly and watch the pull climb while nothing moves. At 22px it breaks loose and
            lurches; after that it trails your pointer by 8px. Reverse and it stalls, because the lag
            has to rebuild before it slides the other way.
          </p>
        </div>
        <Notes name="grip" />
      </Section>

      <Section index="04" label="INTENT" id="intent">
        <div className="playground graph-bg">
          <Intent label="hover me">
            <span className="mono">no timer decided this</span>
          </Intent>
          <p className="playground-caption">
            Aim at the trigger from across the panel and it opens before you arrive. Sweep past it at
            the same distance and it stays shut. The heading error readout is the whole decision.
          </p>
        </div>
        <Notes name="intent" />
      </Section>

      <Section index="05" label="STATUS">
        <p className="playground-caption">
          Ten more candidates are written up in CANDIDATES.md at the repo root, with the mechanic each
          one came from and what it refuses to inherit. A candidate becomes a component when the CLI
          can install it and PRODUCT FACTS says so — not before.
        </p>
      </Section>
    </Page>
  );
}
