import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { Preview } from '../components/ComponentPreviews';
import { useSiteSpring } from '../lib/springs';
import { REGISTRY, CATEGORIES, type RegistryComponent } from '../data/registry';
import { Chase } from '@z-ui/registry/chase/chase';

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
  // demo chrome: the annotation that points at the first emergent stretch
  const [noteShown, setNoteShown] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const noteTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);
  const { stiff, reduced } = useSiteSpring();
  const filtered = REGISTRY.filter((c) => cat === 'all' || c.category === cat);

  const onCatChange = (v: string) => {
    setCat(v);
    if (noteShown || v === 'all') return;
    setNoteShown(true);
    setNoteVisible(true);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNoteVisible(false), 3200);
  };

  return (
    <Page title="Components">
      <Section index="01" label="FILTER">
        <p className="playground-caption">
          The filter below is a real <Link to="/components/chase">chase</Link> instance — the
          leading edge leaves on a stiff spring, the trailing edge follows on a soft one. The
          stretch is not scripted.
        </p>
        <div className="chase-wrap">
          <Chase
            label="Filter"
            options={[
              { value: 'all', label: 'all' },
              ...CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
            value={cat}
            onValueChange={onCatChange}
          />
          <AnimatePresence>
            {noteVisible ? (
              <motion.div
                className="chase-annotation"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={stiff}
              >
                <span className="chase-annotation-line" aria-hidden="true" />
                <span className="mono chase-annotation-text">
                  stretch = two springs disagreeing · leading 950/62 · trailing 380/34 · nothing
                  scripted
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
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
          Five more are on the <Link to="/candidates">candidate bench</Link> — flywheel, reel, origin,
          grip, intent. They are not in the registry, have no install command, and may never get one.
          Eight is still eight.
        </p>
      </Section>
    </Page>
  );
}
