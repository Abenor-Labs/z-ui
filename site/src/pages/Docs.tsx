import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { CodeBlock } from '../components/CodeBlock';
import { CliBanner } from '../components/CliBanner';
import { Disclosure } from '../zui/Disclosure';
import { FALLBACK_URL, REPO_URL, REGISTRY } from '../data/registry';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'components', label: 'Components' },
  { id: 'setup', label: 'Setup' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'contributing', label: 'Contributing' },
];

export function Docs() {
  return (
    <Page title="Getting started">
      <div className="detail-head">
        <h1>Getting started</h1>
        <p className="detail-principle">
          These accordions are real disclosure instances — interrupt them mid-open and they
          reverse with the velocity they had. The docs run on the product.
        </p>
      </div>

      <div className="detail-shell">
        <aside className="detail-aside">
          <nav className="cnav" aria-label="On this page">
            <div className="cnav-group">
              <span className="mono-label cnav-heading">on this page</span>
              <ul className="cnav-list">
                {TOC.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="cnav-link">
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        <div className="detail-main">
          <Section index="00" label="OVERVIEW" id="overview">
            <div style={{ maxWidth: 720 }}>
              <p className="playground-caption">
                A copy-paste registry of React micro-interactions, installed as source into your
                project — not pulled in as a runtime dependency. Not a design system, not a
                layout kit, not a shadcn/ui replacement. It sits on top of whatever you already
                use, and what it refuses to be is the point as much as what it does.
              </p>
              <p className="playground-caption">
                This page covers getting one component installed and running the project itself.
                For the full command and flag reference, see <Link to="/cli">the CLI page</Link>.
                For why it's built the way it is, see{' '}
                <Link to="/architecture">the architecture page</Link>.
              </p>
            </div>
          </Section>

          <Section index="01" label="COMPONENTS" id="components">
            <div style={{ maxWidth: 720 }}>
              <p className="playground-caption">
                Eight, no more, no fewer. Each one is a single self-contained .tsx file.
              </p>
              <table className="cmd-table">
                <tbody>
                  {REGISTRY.map((c) => (
                    <tr key={c.name}>
                      <td>
                        <Link to={`/components/${c.name}`}>{c.name}</Link>
                      </td>
                      <td>{c.category}</td>
                      <td>{c.needs}</td>
                      <td>{c.blurb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section index="02" label="SETUP" id="setup">
            <div style={{ maxWidth: 720 }}>
              <Disclosure title="Install your first component" defaultOpen>
                <CodeBlock code={'npx @abenor/z-ui@latest add dial'} />
                <CliBanner subtitle="micro-interactions as source you own" />
                <p className="playground-caption">
                  That banner is real — the CLI's own intro frame, printed on this exact command
                  (add.ts's own literal subtitle string). Not site-orange: the CLI puts no brand
                  color in the terminal on purpose, so it never fights whatever scheme is already
                  running there.
                </p>
                <p className="playground-caption">
                  On first run, add writes z-ui.json for you (or run <code>z-ui init</code>{' '}
                  yourself first). It then installs the component's source and its npm
                  dependencies.
                </p>
              </Disclosure>

              <Disclosure title="What gets written">
                <p className="playground-caption">
                  One self-contained .tsx file per component. If a component needs a primitive,
                  the primitive ships inside the component file — there is no shared lib/ to
                  install first. Components that need motion declare it, and add installs it;
                  late-critique and scramble-reveal need react only.
                </p>
                <p className="playground-caption">
                  Nothing is written to disk until everything is confirmed writable — fetch,
                  resolve, verify, and plan all complete fully before the first byte lands.
                </p>
              </Disclosure>

              <Disclosure title="See what you have — and what you could">
                <CodeBlock code={'npx @abenor/z-ui@latest list\nnpx @abenor/z-ui@latest doctor'} />
                <p className="playground-caption">
                  list shows what the registry offers; doctor checks what's installed and changes
                  nothing. Both take <code>--json</code> for machine-readable output.
                </p>
              </Disclosure>

              <Disclosure title="Preview motion before installing it">
                <CodeBlock
                  code={'npx @abenor/z-ui@latest preview dial\nnpx @abenor/z-ui@latest spring dial'}
                />
                <p className="playground-caption">
                  preview shows how a component moves before it touches your tree; spring draws
                  the actual curve before you pick a preset (snap, bounce, settle, or fling). For
                  hand-tuned components the CLI refuses to apply a preset —{' '}
                  <Link to="/cli">the refusal is documented</Link>.
                </p>
              </Disclosure>

              <Disclosure title="Working from a local clone">
                <CodeBlock code={'npx @abenor/z-ui@latest add dial --registry ./registry'} />
                <p className="playground-caption">
                  The registry is served from raw GitHub for now, which allows about 60
                  unauthenticated requests per hour per IP. A local clone avoids the limit and
                  works offline.
                </p>
              </Disclosure>

              <Disclosure title="Without the CLI">
                <CodeBlock code={FALLBACK_URL('dial')} />
                <p className="playground-caption">
                  Registry items are shadcn-schema-shaped. You still get the file; you lose
                  install-time spring selection, preview, and doctor.
                </p>
              </Disclosure>
            </div>
          </Section>

          <Section index="03" label="REQUIREMENTS" id="requirements">
            <div className="prose" style={{ maxWidth: 720 }}>
              <ul>
                <li>React, already in your project — the CLI never installs it.</li>
                <li>Node, to run the CLI itself.</li>
                <li>A bundler that handles JSX — Vite, Next, Remix, Parcel, anything.</li>
                <li>Tailwind — not required. Components carry their own styles.</li>
              </ul>
            </div>
          </Section>

          <Section index="04" label="TROUBLESHOOTING" id="troubleshooting">
            <div style={{ maxWidth: 720 }}>
              <Disclosure title="add can't find the component I want">
                <p className="playground-caption">
                  The registry publishes all eight components. If <code>add</code> can't find
                  one, it's a typo — run <code>list</code> to see the real names.
                </p>
              </Disclosure>
              <Disclosure title="Reads from the registry are slow or failing">
                <p className="playground-caption">
                  Unauthenticated raw GitHub allows roughly 60 requests per hour per IP. Pass{' '}
                  <code>--registry ./registry</code> to install from a local clone instead — it
                  avoids the limit entirely and works offline.
                </p>
              </Disclosure>
              <Disclosure title="add won't touch a file I already have">
                <p className="playground-caption">
                  That's deliberate — <code>add</code> does not overwrite files that already
                  exist. Pass <code>-o</code>/<code>--overwrite</code> to replace one on purpose.
                </p>
              </Disclosure>
              <Disclosure title="Running from a monorepo">
                <p className="playground-caption">
                  Pass <code>-c</code>/<code>--cwd</code> to point the CLI at the workspace that
                  should receive the files, rather than wherever the shell happens to be.
                </p>
              </Disclosure>
            </div>
          </Section>

          <Section index="05" label="CONTRIBUTING" id="contributing">
            <div style={{ maxWidth: 720 }}>
              <Disclosure title="Working on z-ui itself">
                <CodeBlock code={'pnpm install\npnpm dev\npnpm --filter @z-ui/web dev\npnpm verify'} />
                <p className="playground-caption">
                  verify runs typecheck → registry linter → contrast linter → generated-registry
                  check → tests — plus suites that deliberately break each linter to prove it
                  still catches things. registry/ is the source of truth; web/public/r/ is
                  generated from it and committed, and CI fails if they disagree.
                </p>
                <p className="playground-caption mono" style={{ fontSize: 11 }}>
                  <a href={REPO_URL} target="_blank" rel="noreferrer">
                    github.com/Abenor-Labs/z-ui
                  </a>{' '}
                  ·{' '}
                  <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
                    issues
                  </a>{' '}
                  · MIT © Abenor Labs
                </p>
              </Disclosure>
            </div>
          </Section>
        </div>
      </div>
    </Page>
  );
}
