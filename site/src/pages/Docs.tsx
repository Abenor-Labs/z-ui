import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { CodeBlock } from '../components/CodeBlock';
import { Disclosure } from '../zui/Disclosure';
import { FALLBACK_URL, REPO_URL } from '../data/registry';

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

      <Section index="01" label="SETUP">
        <div style={{ maxWidth: 720 }}>
          <Disclosure title="Install your first component" defaultOpen>
            <CodeBlock code={'npx @abenor/z-ui@latest add dial'} />
            <p className="playground-caption">
              On first run, add writes z-ui.json for you (or run <code>z-ui init</code> yourself
              first). It then installs the component's source and its npm dependencies.
            </p>
          </Disclosure>

          <Disclosure title="What gets written">
            <p className="playground-caption">
              One self-contained .tsx file per component. If a component needs a primitive, the
              primitive ships inside the component file — there is no shared lib/ to install
              first. Components that need motion declare it, and add installs it; late-critique
              and scramble-reveal need react only.
            </p>
            <p className="playground-caption">
              Nothing is written to disk until everything is confirmed writable — fetch, resolve,
              verify, and plan all complete fully before the first byte lands.
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
            <CodeBlock code={'npx @abenor/z-ui@latest preview dial\nnpx @abenor/z-ui@latest spring dial'} />
            <p className="playground-caption">
              preview shows how a component moves before it touches your tree; spring draws the
              actual curve before you pick a preset (snap, bounce, settle, or fling). For
              hand-tuned components the CLI refuses to apply a preset —{' '}
              <Link to="/cli">the refusal is documented</Link>.
            </p>
          </Disclosure>

          <Disclosure title="Working from a local clone">
            <CodeBlock code={'npx @abenor/z-ui@latest add dial --registry ./registry'} />
            <p className="playground-caption">
              The registry is served from raw GitHub for now, which allows about 60
              unauthenticated requests per hour per IP. A local clone avoids the limit and works
              offline.
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

      <Section index="02" label="CONTRIBUTING">
        <div style={{ maxWidth: 720 }}>
          <Disclosure title="Working on z-ui itself">
            <CodeBlock
              code={'pnpm install\npnpm dev\npnpm --filter @z-ui/web dev\npnpm verify'}
            />
            <p className="playground-caption">
              verify runs typecheck → registry linter → contrast linter → generated-registry
              check → tests — plus suites that deliberately break each linter to prove it still
              catches things. registry/ is the source of truth; web/public/r/ is generated from
              it and committed, and CI fails if they disagree.
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
    </Page>
  );
}
