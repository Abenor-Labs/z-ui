import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { CodeBlock } from '../components/CodeBlock';
import { CliBanner } from '../components/CliBanner';
import { CliCast } from '../components/CliCast';
import { Console } from '../components/Console';
import { Disclosure } from '@z-ui/registry/disclosure/disclosure';
import { FALLBACK_URL, REPO_URL, REGISTRY } from '../data/registry';

/**
 * /docs — the one documentation page.
 *
 * It absorbed three routes: the getting-started page it grew out of, the old
 * /cli page, and /architecture. The CLI surface documented here is the real
 * one — seven commands, eight components — and every terminal frame on the
 * page replays output captured from the published CLI rather than mocking it
 * up (see src/data/cliRecordings.ts).
 *
 * The accordions are real disclosure instances, so the docs run on the
 * product they document.
 */

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'cli', label: 'The CLI' },
  { id: 'components', label: 'Components' },
  { id: 'setup', label: 'Setup' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'contributing', label: 'Contributing' },
];

const COMMANDS: Array<[string, string]> = [
  ['init', 'writes z-ui.json — add does this automatically on first run if missing'],
  ['add <name...>', 'adds one or more components and their npm dependencies'],
  ['list', 'lists what the registry offers'],
  ['doctor', "checks what's installed, changes nothing"],
  ['spring [name]', 'draws the actual spring curve for a component before you pick a preset'],
  ['preview <name>', 'shows how a component moves, before installing it'],
  ['completion <shell>', 'shell completion script for bash, zsh, or fish'],
];

export function Docs() {
  return (
    <Page title="Docs">
      <div className="detail-head">
        <h1>Docs</h1>
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
                This page is the whole reference: the CLI, the eight components, how to install
                one, and why it's built the way it is.
              </p>
            </div>
          </Section>

          <Section index="01" label="THE CLI" id="cli">
            <div style={{ maxWidth: 720 }}>
              <p className="playground-caption">
                Seven commands. The session below is a recording, not a re-enactment — every line
                came out of the published CLI and was captured verbatim.
              </p>
            </div>

            <CliCast />

            <div style={{ maxWidth: 720 }}>
              <table className="cmd-table">
                <tbody>
                  {COMMANDS.map(([cmd, what]) => (
                    <tr key={cmd}>
                      <td>
                        <code>{cmd}</code>
                      </td>
                      <td>{what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Disclosure label="Flags worth knowing">
                <ul className="fact-list mono">
                  <li>
                    <code>--dry-run</code> — show the install plan, write nothing.
                  </li>
                  <li>
                    <code>--registry ./registry</code> — install from a local clone instead of
                    GitHub.
                  </li>
                  <li>
                    <code>--json</code> — machine-readable output for list, doctor, and preview.
                  </li>
                  <li>
                    <code>-o</code>/<code>--overwrite</code> — replace a file that already exists.
                  </li>
                  <li>
                    <code>-y</code>/<code>--yes</code> — skip the confirmation prompts.
                  </li>
                </ul>
              </Disclosure>

              <Disclosure label="Why --spring refuses on hand-tuned components">
                <p className="playground-caption">
                  <code>--spring &lt;preset&gt;</code> retargets a component's default spring at
                  install time — snap, bounce, settle, or fling. Every springed component
                  currently ships bespoke, hand-tuned physics rather than a shared preset: dial
                  runs at 1300/46, chase runs two springs simultaneously. So the CLI refuses to
                  apply <code>--spring</code> to those, and prints which exact numbers to edit by
                  hand instead of silently installing motion the original author never tuned.
                </p>
                <p className="playground-caption">
                  That refusal is a product decision, not a missing feature.
                </p>
              </Disclosure>

              <p className="playground-caption">
                The shell below replays the same recordings on demand. Type a command that was
                never captured and it says so rather than inventing output.
              </p>
            </div>

            <Console />
          </Section>

          <Section index="02" label="COMPONENTS" id="components">
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

          <Section index="03" label="SETUP" id="setup">
            <div style={{ maxWidth: 720 }}>
              <Disclosure label="Install your first component" defaultOpen>
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

              <Disclosure label="What gets written">
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

              <Disclosure label="See what you have — and what you could">
                <CodeBlock code={'npx @abenor/z-ui@latest list\nnpx @abenor/z-ui@latest doctor'} />
                <p className="playground-caption">
                  list shows what the registry offers; doctor checks what's installed and changes
                  nothing. Both take <code>--json</code> for machine-readable output.
                </p>
              </Disclosure>

              <Disclosure label="Preview motion before installing it">
                <CodeBlock
                  code={'npx @abenor/z-ui@latest preview dial\nnpx @abenor/z-ui@latest spring dial'}
                />
                <p className="playground-caption">
                  preview shows how a component moves before it touches your tree; spring draws
                  the actual curve before you pick a preset. For hand-tuned components the CLI
                  refuses to apply a preset — <a href="#cli">the refusal is documented above</a>.
                </p>
              </Disclosure>

              <Disclosure label="Working from a local clone">
                <CodeBlock code={'npx @abenor/z-ui@latest add dial --registry ./registry'} />
                <p className="playground-caption">
                  The registry is served from raw GitHub for now, which allows about 60
                  unauthenticated requests per hour per IP. A local clone avoids the limit and
                  works offline.
                </p>
              </Disclosure>

              <Disclosure label="Without the CLI">
                <CodeBlock code={FALLBACK_URL('dial')} />
                <p className="playground-caption">
                  Registry items are shadcn-schema-shaped. You still get the file; you lose
                  install-time spring selection, preview, and doctor.
                </p>
              </Disclosure>
            </div>
          </Section>

          <Section index="04" label="ARCHITECTURE" id="architecture">
            <div style={{ maxWidth: 720 }}>
              <p className="playground-caption">
                Four decisions carry the whole thing. Each one trades something visible for
                something the product actually needs.
              </p>

              <div className="decision">
                <p className="decision-verdict">
                  Motion (Framer Motion), declared per-component — only when needed.
                </p>
                <p>
                  Real interruptible springs with velocity carry-over are required. CSS keyframes
                  cannot reverse mid-flight, and mid-flight reversal IS the product. A component
                  that doesn't need it doesn't declare the dependency — late-critique and
                  scramble-reveal ship with react only.
                </p>
              </div>

              <div className="decision">
                <p className="decision-verdict">A first-party CLI: @abenor/z-ui on npm.</p>
                <p>
                  Full control over the install UX — preview, spring curves, doctor, the refusal
                  behavior. Registry items stay shadcn-schema-shaped, so{' '}
                  <code>npx shadcn add &lt;url&gt;</code> works as a free fallback path for anyone
                  who doesn't want another CLI.
                </p>
              </div>

              <div className="decision">
                <p className="decision-verdict">
                  Raw GitHub URLs behind a single constant base URL.
                </p>
                <p>
                  No hosting to stand up on day one; swappable to a real domain later with no code
                  change. The caveat is real: unauthenticated raw GitHub allows about 60 requests
                  per hour per IP — which <code>--registry ./registry</code> avoids.
                </p>
              </div>

              <div className="decision">
                <p className="decision-verdict">Uncontrolled by default, controlled optional.</p>
                <p>
                  <code>&lt;Disclosure /&gt;</code> works immediately with zero setup;{' '}
                  <code>open</code> / <code>onOpenChange</code> exist for apps that need real
                  control.
                </p>
              </div>
            </div>
          </Section>

          <Section index="05" label="REQUIREMENTS" id="requirements">
            <div className="prose" style={{ maxWidth: 720 }}>
              <ul>
                <li>React, already in your project — the CLI never installs it.</li>
                <li>Node, to run the CLI itself.</li>
                <li>A bundler that handles JSX — Vite, Next, Remix, Parcel, anything.</li>
                <li>Tailwind — not required. Components carry their own styles.</li>
              </ul>
            </div>
          </Section>

          <Section index="06" label="TROUBLESHOOTING" id="troubleshooting">
            <div style={{ maxWidth: 720 }}>
              <Disclosure label="add can't find the component I want">
                <p className="playground-caption">
                  The registry publishes all eight components. If <code>add</code> can't find
                  one, it's a typo — run <code>list</code> to see the real names.
                </p>
              </Disclosure>
              <Disclosure label="Reads from the registry are slow or failing">
                <p className="playground-caption">
                  Unauthenticated raw GitHub allows roughly 60 requests per hour per IP. Pass{' '}
                  <code>--registry ./registry</code> to install from a local clone instead — it
                  avoids the limit entirely and works offline.
                </p>
              </Disclosure>
              <Disclosure label="add won't touch a file I already have">
                <p className="playground-caption">
                  That's deliberate — <code>add</code> does not overwrite files that already
                  exist. Pass <code>-o</code>/<code>--overwrite</code> to replace one on purpose.
                </p>
              </Disclosure>
              <Disclosure label="Running from a monorepo">
                <p className="playground-caption">
                  Pass <code>-c</code>/<code>--cwd</code> to point the CLI at the workspace that
                  should receive the files, rather than wherever the shell happens to be.
                </p>
              </Disclosure>
            </div>
          </Section>

          <Section index="07" label="CONTRIBUTING" id="contributing">
            <div style={{ maxWidth: 720 }}>
              <Disclosure label="Working on z-ui itself">
                <CodeBlock
                  code={'pnpm install\npnpm dev\npnpm --filter @z-ui/web dev\npnpm verify'}
                />
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
