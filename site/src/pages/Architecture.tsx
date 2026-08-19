import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { CodeBlock } from '../components/CodeBlock';

const REPO_TREE = `z-ui/
  registry/       source of truth — a real TypeScript workspace, typechecked in CI
  packages/cli/   @abenor/z-ui
  web/            showcase site + the generated registry it serves
  components/     dev harness
  scripts/        linters + tests that break them on purpose
  docs/           roadmap, ADRs, specs`;

export function Architecture() {
  return (
    <Page title="Architecture">
      <div className="detail-head">
        <h1>Why it's built this way</h1>
        <p className="detail-principle">
          Four decisions carry the whole thing. Each one trades something visible for something
          the product actually needs.
        </p>
      </div>

      <Section index="01" label="MOTION ENGINE">
        <div className="decision">
          <p className="decision-verdict">
            Motion (Framer Motion), declared per-component — only when needed.
          </p>
          <p>
            Real interruptible springs with velocity carry-over are required. CSS keyframes
            cannot reverse mid-flight, and mid-flight reversal IS the product. A component that
            doesn't need it doesn't declare the dependency — late-critique and scramble-reveal
            ship with react only.
          </p>
        </div>
      </Section>

      <Section index="02" label="DELIVERY">
        <div className="decision">
          <p className="decision-verdict">A first-party CLI: @abenor/z-ui on npm.</p>
          <p>
            Full control over the install UX — preview, spring curves, doctor, the refusal
            behavior. Registry items stay shadcn-schema-shaped, so{' '}
            <code>npx shadcn add &lt;url&gt;</code> works as a free fallback path for anyone who
            doesn't want another CLI.
          </p>
        </div>
      </Section>

      <Section index="03" label="REGISTRY TRANSPORT">
        <div className="decision">
          <p className="decision-verdict">Raw GitHub URLs behind a single constant base URL.</p>
          <p>
            No hosting to stand up on day one; swappable to a real domain later with no code
            change. The caveat is real: unauthenticated raw GitHub allows about 60 requests per
            hour per IP — which <code>--registry ./registry</code> avoids.
          </p>
        </div>
      </Section>

      <Section index="04" label="COMPONENT API">
        <div className="decision">
          <p className="decision-verdict">Uncontrolled by default, controlled optional.</p>
          <p>
            <code>&lt;Disclosure /&gt;</code> works immediately with zero setup. Apps that need
            real control get <code>open</code> / <code>onOpenChange</code>. Both are the same
            component; neither is a second-class citizen.
          </p>
        </div>
      </Section>

      <Section index="05" label="REPO">
        <CodeBlock code={REPO_TREE} caption="the z-ui repository" />
        <div className="prose">
          <p>
            <code>web/public/r/</code> is generated from <code>registry/</code> and committed —
            CI fails if they disagree. The linters are themselves tested by suites that
            deliberately break each one, to prove it still catches things.
          </p>
        </div>
      </Section>
    </Page>
  );
}
