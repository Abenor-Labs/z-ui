import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { Preview } from '../components/ComponentPreviews';
import { useSiteSpring } from '../lib/springs';
import { REGISTRY, CATEGORIES, type RegistryComponent } from '../data/registry';
import { Chase } from '../zui/Chase';

function Card({ c }: { c: RegistryComponent }) {
  return (
    <div className="card">
      <div className="card-head">
        <Link to={`/components/${c.name}`} className="card-name">
          {c.name}
        </Link>
        <span className="mono card-cat">{c.category}</span>
      </div>
      <div className="card-preview">
        <Preview name={c.name} />
      </div>
      <p className="card-blurb">{c.blurb}</p>
      <span className="mono card-needs">needs: {c.needs}</span>
    </div>
  );
}

export function Library() {
  const [cat, setCat] = useState('all');
  const { stiff, reduced } = useSiteSpring();
  const filtered = REGISTRY.filter((c) => cat === 'all' || c.category === cat);

  return (
    <Page title="Components">
      <Section index="01" label="FILTER">
        <p className="playground-caption">
          The filter below is a real <Link to="/components/chase">chase</Link> instance — the
          leading edge leaves on a stiff spring, the trailing edge follows on a soft one. The
          stretch is not scripted.
        </p>
        <Chase
          annotateFirstMove
          options={[
            { value: 'all', label: 'all' },
            ...CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          value={cat}
          onChange={setCat}
        />
      </Section>

      <Section index="02" label="COMPONENTS">
        <p className="playground-caption">
          Every preview below is the component itself, live — not a screenshot, not a loop.
        </p>
        <div className="library-grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((c) => (
              <motion.div
                key={c.name}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -10 }}
                transition={stiff}
              >
                <Card c={c} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Section>

      <Section index="03" label="BENCH">
        <p className="playground-caption">
          Four more are being built and measured on the{' '}
          <Link to="/candidates">candidate bench</Link> — reel, origin, grip, intent. They are not in
          the registry, have no install command, and may never get one. Seven is still seven.
        </p>
      </Section>
    </Page>
  );
}
