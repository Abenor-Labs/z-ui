import { Page } from '../components/Page';
import { Section } from '../components/Section';
import { CodeBlock } from '../components/CodeBlock';
import { CliCast } from '../components/CliCast';
import { Console } from '../components/Console';
import { FALLBACK_URL } from '../data/registry';
import { VERSION, CAPTURED } from '../data/cliRecordings';

const COMMANDS: [string, string][] = [
  ['z-ui init', 'write z-ui.json (add does this automatically on first run if missing)'],
  ['z-ui add <name...>', 'add components and their dependencies'],
  ['z-ui list', 'list what the registry offers'],
  ['z-ui doctor', 'check what is installed, change nothing'],
  ['z-ui spring [name]', 'draw the actual curve before you pick one'],
  ['z-ui preview <name>', 'how a component moves, before you install it'],
  ['z-ui completion <sh>', 'completion script for bash, zsh or fish'],
];

const FLAGS: [string, string][] = [
  ['-y, --yes', 'accept defaults, skip prompts'],
  ['-o, --overwrite', 'replace files that already exist'],
  ['-r, --registry', 'registry URL or local path'],
  ['-c, --cwd', 'project directory'],
  ['-s, --silent', 'suppress output'],
  ['--spring <preset>', 'install with a different default preset: snap · bounce · settle · fling'],
  ['--stiffness / --damping / --mass', 'custom physics for spring, e.g. z-ui spring --stiffness 300 --damping 20 --mass 1'],
  ['--dry-run', 'show the plan, write nothing'],
  ['--json', 'machine-readable output (list, doctor, preview)'],
  ['--force', 'overwrite z-ui.json (init)'],
];

export function Cli() {
  return (
    <Page title="CLI">
      <div className="detail-head">
        <h1>The CLI</h1>
        <div className="detail-meta mono">
          <span>@abenor/z-ui on npm</span>
          <span>v{VERSION}</span>
          <span>seven commands</span>
          <span className="detail-pub">transcripts captured {CAPTURED}</span>
        </div>
        <p className="detail-principle">
          First-party, published, working. It exists for one reason: full control over the install
          experience — draw a component's curve before it lands, print the whole plan before writing
          a byte, and refuse to do things that would break what you're installing.
        </p>
      </div>

      <Section index="01" label="RECORDED SESSION">
        <CliCast />
        <p className="playground-caption">
          Every line above is real. These transcripts were captured on {CAPTURED} by running{' '}
          <code>npx @abenor/z-ui@latest</code> (v{VERSION}) in an empty project — the replay types the
          command and prints what the CLI actually printed. Only npm's own install noise is trimmed,
          and the cast says where. Nothing autoplays; press play.
        </p>
      </Section>

      <Section index="02" label="SHELL">
        <Console />
        <p className="playground-caption">
          The same transcripts, addressable by typing. Ask for something that was never recorded and
          it tells you instead of inventing output — the point of this page is that you can trust what
          it prints.
        </p>
      </Section>

      <Section index="03" label="COMMANDS">
        <table className="cmd-table">
          <tbody>
            {COMMANDS.map(([cmd, desc]) => (
              <tr key={cmd}>
                <td>{cmd}</td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <CodeBlock code={'npx @abenor/z-ui@latest add disclosure'} caption="the core install command" />
      </Section>

      <Section index="04" label="FLAGS">
        <table className="cmd-table">
          <tbody>
            {FLAGS.map(([flag, desc]) => (
              <tr key={flag}>
                <td>{flag}</td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="playground-caption">
          Taken from <code>z-ui --help</code> as captured, which carries more flags than the spec this
          site was written from: <code>--stiffness</code>, <code>--damping</code>,{' '}
          <code>--mass</code>, <code>--cwd</code>, <code>--silent</code> and <code>--force</code> are
          real and were previously undocumented here.
        </p>
      </Section>

      <Section index="05" label="THE --SPRING REFUSAL">
        <div className="prose">
          <p>
            <code>--spring</code> installs a component with a different default preset. But a
            component that tuned its own physics does not have a preset to swap, so the CLI{' '}
            <strong>refuses</strong> and names the exact numbers instead — for disclosure, stiffness
            520, damping 46, mass 1. Step 6 of the cast is that refusal, verbatim.
          </p>
          <p className="playground-caption">
            A deliberate product decision, not a bug: a tool that quietly swaps hand-tuned motion for
            a preset would be lying about what it installed.
          </p>
        </div>
      </Section>

      <Section index="06" label="INSTALL GUARANTEE">
        <div className="prose">
          <p>
            Nothing is written to disk until everything is confirmed writable — read, resolve, plan,
            then write. Step 5 of the cast shows the plan printed in full and the run ending in{' '}
            <code>Dry run. Nothing was written.</code>
          </p>
        </div>
        <CodeBlock
          code={'npx @abenor/z-ui@latest add disclosure --dry-run'}
          caption="see the full install plan without writing component files"
        />
      </Section>

      <Section index="07" label="WITHOUT THE CLI">
        <div className="prose">
          <p>
            Registry items are shadcn-schema-shaped, so shadcn's own CLI can install them straight
            from the registry URL:
          </p>
        </div>
        <CodeBlock
          code={FALLBACK_URL('disclosure')}
          caption="you still get the file — but lose the curve preview, the plan, and doctor"
        />
        <div className="prose">
          <p>
            One caveat either way: the registry is served from raw GitHub for now, and
            unauthenticated raw GitHub allows roughly 60 requests per hour per IP.{' '}
            <code>--registry ./registry</code> avoids that entirely. And as{' '}
            <code>z-ui list</code> shows in the cast, the registry publishes four items today —
            disclosure, hold-drain, late-critique and scramble-reveal.
          </p>
        </div>
      </Section>
    </Page>
  );
}
