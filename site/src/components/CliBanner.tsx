import { bannerRows } from '../data/cliBanner';
import { VERSION } from '../data/cliRecordings';
import { REPO_URL } from '../data/registry';

/**
 * A real terminal moment: the CLI's own intro frame (packages/cli/src/ui/
 * art.ts), printed on every interactive command. `subtitle` is the one
 * thing that varies per command — it's that command's own literal string
 * in the CLI source (e.g. add.ts passes 'micro-interactions as source you
 * own'), not written for this page.
 *
 * Deliberately not site-orange. The CLI's own ui/log.ts: "the terminal is
 * the one surface where a brand hex does not get a vote" — a pinned color
 * fights whatever scheme the user's own terminal already has. Kept as the
 * real ANSI-ish cyan/grey it actually prints, scoped locally rather than
 * added to tokens.css, since it isn't a site color.
 */
export function CliBanner({ subtitle }: { subtitle: string }) {
  const github = REPO_URL.replace(/^https?:\/\//, '');

  return (
    <div className="cli-banner mono" aria-hidden="true">
      {bannerRows().map((row, i) => (
        <div key={i} className="cli-banner-row" style={{ color: `rgb(${row.rgb})` }}>
          {row.text}
        </div>
      ))}
      <div className="cli-banner-gap" />
      <div className="cli-banner-line">
        <span className="cli-banner-grey">┌</span>
        {'  '}
        <span className="cli-banner-pill">z-ui</span>
        {'  '}
        <span className="cli-banner-grey">by Abenor Labs</span>
      </div>
      <div className="cli-banner-line cli-banner-grey">│</div>
      <div className="cli-banner-line">
        <span className="cli-banner-cyan">◇</span>
        {'  '}
        <span className="cli-banner-grey">{subtitle}</span>
        {'  '}
        <span className="cli-banner-grey">•</span>
        {'  '}
        <span className="cli-banner-grey">{VERSION}</span>
      </div>
      <div className="cli-banner-line cli-banner-grey">│</div>
      <div className="cli-banner-line">
        <span className="cli-banner-cyan">◇</span>
        {'  '}
        <span className="cli-banner-grey">{github}</span>
      </div>
      <div className="cli-banner-line cli-banner-grey">│</div>
    </div>
  );
}
