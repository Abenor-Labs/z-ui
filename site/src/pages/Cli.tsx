import { useEffect, useRef } from 'react';
import { Page } from '../components/Page';
import { bannerRows } from '../data/cliBanner';
import { VERSION } from '../data/cliRecordings';
import { REPO_URL } from '../data/registry';

/**
 * /cli — ported as given from a reference file the user handed to the
 * project, on explicit instruction to replace this page with it, not adapt
 * it. Kept as given, not touching mechanism/content/styling, same standing
 * as RotaryDial (see DESIGN.md A18): this page's commands (`init add list
 * view`) and component names (`rotary-dial`, `gooey-fab`, `gooey-tabs`) are
 * NOT the real seven commands or seven components — PRD.md's actual CLI
 * surface and registry are unaffected. This page does not claim to be that
 * documentation; it is the reference file, verbatim, at this route.
 *
 * The only changes made are the minimum needed to compile and not break the
 * rest of the site:
 *  - class -> className, self-closing tags, comments removed (JSX syntax)
 *  - the file's own :root token block and every selector scoped under
 *    .cli-ref-page, because unscoped it would overwrite this site's real
 *    --paper/--ink/--rule tokens globally for as long as the page is mounted
 *  - the standalone masthead/footer nav dropped — this page already renders
 *    inside the site's real Shell (topbar + footer via App.tsx), so its own
 *    duplicate nav bar (with a dead href="#" GitHub link) would double up
 *  - the <script> IIFE ported to a single useEffect with proper listener/
 *    observer cleanup, since this is a route that unmounts on navigation
 *    (the static original never needed to clean up after itself)
 *  - repeated inline markup (the package-manager tab bar, the reference-
 *    block header) factored into two local helper components — identical
 *    output, not a redesign
 *  - fonts: IBM Plex Mono/Sans loaded via Google Fonts <link> tags in
 *    index.html, scoped to this page only — every other route self-hosts
 *    fonts via @fontsource; this is a recorded, deliberate exception
 *
 * Colors (user-directed follow-up): remapped to the site's real tokens.
 * --paper/--ink/--rule/--signal/--recess/--recess-2 are inherited straight
 * from tokens.css (not redeclared here); everything else this page needs
 * that the site has no name for (--warn, --add, --accent-soft, the --term-*
 * scale) resolves to --signal or a color-mix() over --ink, same gaps and
 * same nearest-fit reasoning as the earlier scratchpad retheme. Fonts are
 * untouched — still IBM Plex, still the exception noted above; only color
 * was in scope for this pass.
 *
 * The intro banner (user-directed follow-up): the reference file's first
 * snippet had no banner at all — the real CLI does (packages/cli/src/ui/
 * art.ts), a figlet "Z-UI" mark under a white-to-charcoal gradient plus a
 * boxed intro frame, printed on every interactive command. Added to the
 * page's first terminal block (the `add` example — add.ts's own comment
 * says that command, not `init`, is deliberately where the first
 * impression is spent). This one IS real content, not kept-as-fictional:
 * the banner text, gradient math, and rail glyphs are generated from/
 * copied from the actual source, not approximated.
 */

const CLI_REF_CSS = `
.cli-ref-page{
  /* --paper/--ink/--rule/--signal/--recess/--recess-2 are NOT redefined here —
     tokens.css already sets them on :root, and custom properties inherit, so
     this block just declares the roles that name doesn't cover: color remapped
     to the site's real tokens, never a new hex literal. See the comment at the
     top of this file for what did and didn't map cleanly. */
  --paper-2:var(--recess);
  --ink-2:color-mix(in srgb, var(--ink) 65%, transparent);
  --ink-3:color-mix(in srgb, var(--ink) 50%, transparent);
  --term:var(--recess);
  --term-ink:var(--ink);
  --accent:var(--signal);
  --accent-soft:color-mix(in srgb, var(--signal) 12%, transparent);
  --warn:var(--signal);
  --add:var(--signal);
  --surface:var(--recess-2);
  --on-accent:var(--paper);

  --term-rule:color-mix(in srgb, var(--ink) 9%, transparent);
  --term-btn:color-mix(in srgb, var(--ink) 16%, transparent);
  --term-btn-hover:color-mix(in srgb, var(--ink) 32%, transparent);
  --term-dim:color-mix(in srgb, var(--ink) 48%, transparent);
  --term-prompt:color-mix(in srgb, var(--ink) 38%, transparent);
  --term-hi:var(--signal);
  --term-copy:color-mix(in srgb, var(--ink) 55%, transparent);

  /* the real CLI's intro banner (packages/cli/src/ui/art.ts) is
     deliberately un-themed — "the terminal is the one surface where a
     brand hex does not get a vote" (its own comment). Kept as its real
     ANSI cyan rather than forced onto --signal, for the same reason. */
  --term-cyan:#22d3ee;

  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --sans:"IBM Plex Sans",system-ui,-apple-system,sans-serif;

  --r-sm:3px;
  --r-md:6px;
  --r-lg:7px;
  --hairline:1px;

  margin:0;background:var(--paper);color:var(--ink);
  font-family:var(--sans);font-size:15px;line-height:1.65;
  -webkit-font-smoothing:antialiased;
}
.cli-ref-page *{box-sizing:border-box}

.cli-ref-page .shell{max-width:1180px;margin:0 auto;padding:44px 28px 0;display:grid;grid-template-columns:210px 1fr;gap:56px}
@media(max-width:900px){.cli-ref-page .shell{grid-template-columns:1fr;gap:0}}

.cli-ref-page nav.toc{
  position:sticky;top:88px;align-self:start;
  padding:0 0 60px;font-size:13.5px;
}
@media(max-width:900px){.cli-ref-page nav.toc{display:none}}
.cli-ref-page .toc-label{
  font-family:var(--mono);font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-3);margin-bottom:12px;
}
.cli-ref-page .toc a{
  display:block;padding:4px 0 4px 12px;color:var(--ink-2);
  text-decoration:none;border-left:2px solid var(--rule);
}
.cli-ref-page .toc a.sub{padding-left:26px;font-size:12.5px;color:var(--ink-3)}
.cli-ref-page .toc a:hover{color:var(--ink)}
.cli-ref-page .toc a.on{color:var(--accent);border-left-color:var(--accent);font-weight:500}
.cli-ref-page .toc a code{font-family:var(--mono);font-size:12.5px}

.cli-ref-page main{padding:0 0 140px;min-width:0}

.cli-ref-page h1{
  font-family:var(--mono);font-weight:600;font-size:34px;
  letter-spacing:-.01em;margin:0 0 10px;
}
.cli-ref-page .lede{font-size:17px;color:var(--ink-2);margin:0 0 34px;max-width:56ch}
.cli-ref-page h2{
  font-family:var(--mono);font-weight:600;font-size:21px;
  margin:60px 0 8px;padding-top:22px;border-top:1px solid var(--rule);
  scroll-margin-top:88px;
}
.cli-ref-page h2 .anchor,.cli-ref-page h3 .anchor{color:var(--rule);text-decoration:none;margin-left:8px;opacity:0}
.cli-ref-page h2:hover .anchor,.cli-ref-page h3:hover .anchor{opacity:1}
.cli-ref-page h3{
  font-family:var(--mono);font-weight:500;font-size:16px;
  margin:34px 0 8px;scroll-margin-top:88px;
}
.cli-ref-page p{margin:0 0 14px;max-width:66ch}
.cli-ref-page main a{color:var(--accent)}
.cli-ref-page code{
  font-family:var(--mono);font-size:.9em;
  background:var(--paper-2);padding:1px 5px;border-radius:var(--r-sm);
}
.cli-ref-page strong{font-weight:600}

.cli-ref-page .thesis{
  border:1px solid var(--rule);border-left:3px solid var(--accent);
  background:var(--accent-soft);
  padding:18px 22px;margin:0 0 34px;max-width:66ch;
}
.cli-ref-page .thesis p{margin:0;max-width:none}
.cli-ref-page .thesis p+p{margin-top:9px}

.cli-ref-page .term{
  background:var(--term);border-radius:var(--r-lg);overflow:hidden;
  margin:0 0 18px;font-family:var(--mono);font-size:13.5px;
}
.cli-ref-page .term-bar{
  display:flex;align-items:center;gap:0;
  border-bottom:1px solid var(--term-rule);
  padding:0 6px 0 0;
}
.cli-ref-page .pm{display:flex}
.cli-ref-page .pm button{
  appearance:none;background:none;border:none;cursor:pointer;
  font-family:var(--mono);font-size:12px;color:var(--term-dim);
  padding:9px 13px;border-bottom:2px solid transparent;
}
.cli-ref-page .pm button:hover{color:var(--term-ink)}
.cli-ref-page .pm button[aria-selected="true"]{color:var(--term-ink);border-bottom-color:var(--add)}
.cli-ref-page .pm button:focus-visible{outline:2px solid var(--add);outline-offset:-3px}
.cli-ref-page .copy{
  margin-left:auto;appearance:none;background:none;border:1px solid var(--term-btn);
  color:var(--term-copy);font-family:var(--mono);font-size:11px;
  padding:4px 9px;border-radius:var(--r-sm);cursor:pointer;
}
.cli-ref-page .copy:hover{color:var(--term-ink);border-color:var(--term-btn-hover)}
.cli-ref-page .copy:focus-visible{outline:2px solid var(--add);outline-offset:2px}
.cli-ref-page .copy[data-done="1"]{color:var(--add);border-color:var(--add)}
.cli-ref-page .term pre{
  margin:0;padding:15px 17px;overflow-x:auto;color:var(--term-ink);
  line-height:1.6;
}
.cli-ref-page .term pre .p{color:var(--term-prompt);user-select:none}
.cli-ref-page .term pre .ok{color:var(--add)}
.cli-ref-page .term pre .dim{color:var(--term-dim)}
.cli-ref-page .term pre .hi{color:var(--term-hi)}
.cli-ref-page .term pre .grey{color:var(--term-dim)}
.cli-ref-page .term pre .cyan{color:var(--term-cyan)}
.cli-ref-page .term pre .pill{background:var(--term-cyan);color:#0a0a0a;padding:0 4px;border-radius:2px}

.cli-ref-page .ref{
  background:var(--paper-2);border:1px solid var(--rule);border-radius:var(--r-md);
  margin:0 0 18px;
}
.cli-ref-page .ref-bar{display:flex;align-items:center;padding:7px 9px 7px 14px;border-bottom:1px solid var(--rule)}
.cli-ref-page .ref-tag{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.cli-ref-page .ref .copy{border-color:var(--rule);color:var(--ink-3)}
.cli-ref-page .ref .copy:hover{color:var(--ink);border-color:var(--ink-3)}
.cli-ref-page .ref pre{margin:0;padding:14px 16px;overflow-x:auto;font-family:var(--mono);font-size:12.5px;line-height:1.62;color:var(--ink-2)}

.cli-ref-page .delta{
  border:1px solid var(--rule);border-radius:var(--r-lg);background:var(--surface);
  font-family:var(--mono);font-size:13px;margin:0 0 30px;max-width:60ch;
}
.cli-ref-page .delta-h{
  padding:9px 15px;border-bottom:1px solid var(--rule);
  font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-3);
}
.cli-ref-page .delta ul{list-style:none;margin:0;padding:9px 0}
.cli-ref-page .delta li{display:flex;gap:12px;padding:4px 15px;align-items:baseline}
.cli-ref-page .delta .sign{width:10px;flex:none;font-weight:600}
.cli-ref-page .delta .added .sign{color:var(--add)}
.cli-ref-page .delta .none .sign{color:var(--ink-3)}
.cli-ref-page .delta .path{flex:1;min-width:0;overflow-wrap:anywhere}
.cli-ref-page .delta .none .path{color:var(--ink-3)}
.cli-ref-page .delta .meta{color:var(--ink-3);font-size:12px;flex:none}
.cli-ref-page .delta-f{
  border-top:1px solid var(--rule);padding:9px 15px;
  font-size:12px;color:var(--ink-2);
}
.cli-ref-page .delta-f b{color:var(--accent);font-weight:600}

.cli-ref-page table{border-collapse:collapse;width:100%;max-width:66ch;margin:0 0 18px;font-size:14px}
.cli-ref-page th,.cli-ref-page td{text-align:left;padding:9px 14px 9px 0;border-bottom:1px solid var(--rule);vertical-align:top}
.cli-ref-page th{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);font-weight:500}
.cli-ref-page td code{white-space:nowrap}

.cli-ref-page .tshoot{border-top:1px solid var(--rule);max-width:66ch}
.cli-ref-page .tshoot details{border-bottom:1px solid var(--rule)}
.cli-ref-page .tshoot summary{
  cursor:pointer;padding:13px 0;font-family:var(--mono);font-size:13px;
  color:var(--warn);list-style:none;display:flex;gap:10px;align-items:baseline;
}
.cli-ref-page .tshoot summary::-webkit-details-marker{display:none}
.cli-ref-page .tshoot summary::before{content:"▸";color:var(--ink-3);font-size:11px;transition:transform .15s}
.cli-ref-page .tshoot details[open] summary::before{transform:rotate(90deg)}
@media(prefers-reduced-motion:reduce){.cli-ref-page .tshoot summary::before{transition:none}}
.cli-ref-page .tshoot summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.cli-ref-page .tshoot .body{padding:0 0 15px 22px}
.cli-ref-page .tshoot .body p{margin:0 0 10px}
.cli-ref-page .tshoot .body p:last-child{margin:0}

.cli-ref-page ol{padding-left:1.4em}
.cli-ref-page .note{color:var(--ink-3);font-size:13px;margin:-8px 0 18px}

.cli-ref-page footer{
  border-top:1px solid var(--rule);margin-top:70px;padding-top:22px;
  font-size:13px;color:var(--ink-3);max-width:66ch;
}
.cli-ref-page ::selection{background:var(--accent);color:var(--on-accent)}
`;

const RUNNERS: Record<string, string> = {
  npm: 'npx z-ui@latest',
  pnpm: 'pnpm dlx z-ui@latest',
  yarn: 'yarn dlx z-ui@latest',
  bun: 'bunx z-ui@latest',
};

/**
 * The real CLI's intro banner, byte-real: generated with the CLI's own
 * `figlet.textSync('Z-UI', { font: 'ANSI Shadow' })` (packages/cli/src/ui/
 * art.ts), shared with CliBanner.tsx (site/src/data/cliBanner.ts is the
 * single source for the row text and the gradient math) so this page and
 * Docs.tsx can't drift apart on what the banner actually looks like. Built
 * as an HTML string, not JSX, because it merges into a larger literal
 * terminal transcript below.
 */
const BANNER_HTML = bannerRows()
  .map((row) => `<span style="color:rgb(${row.rgb})">  ${row.text}</span>`)
  .join('\n');

/**
 * The rail frame `intro()` prints below the banner (art.ts). Real for
 * `add`: the subtitle string ('micro-interactions as source you own') is
 * add.ts's own literal argument, with a comment explaining why — "add is
 * the command on every install block on the site... the one place a first
 * impression is actually spent." Version and the GitHub URL are the same
 * VERSION/REPO_URL every other page on the site reads from.
 */
const RAIL_HTML = [
  '<span class="grey">┌</span>  <span class="pill">z-ui</span>  <span class="grey">by Abenor Labs</span>',
  '<span class="grey">│</span>',
  `<span class="cyan">◇</span>  <span class="grey">micro-interactions as source you own</span>  <span class="grey">•</span>  <span class="grey">${VERSION}</span>`,
  '<span class="grey">│</span>',
  `<span class="cyan">◇</span>  <span class="grey">${REPO_URL.replace(/^https?:\/\//, '')}</span>`,
  '<span class="grey">│</span>',
].join('\n');

const FIRST_RUN_HTML =
  '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> add rotary-dial\n\n' +
  BANNER_HTML +
  '\n\n' +
  RAIL_HTML +
  '\n\n<span class="ok">  ✓</span> <span class="dim">resolved</span> rotary-dial\n<span class="ok">  ✓</span> <span class="dim">wrote</span> components/ui/rotary-dial.tsx';

function TermBar() {
  return (
    <div className="term-bar">
      <div className="pm" role="tablist" aria-label="Package manager">
        <button role="tab" data-pm="npm" aria-selected="true">
          npm
        </button>
        <button role="tab" data-pm="pnpm" aria-selected="false">
          pnpm
        </button>
        <button role="tab" data-pm="yarn" aria-selected="false">
          yarn
        </button>
        <button role="tab" data-pm="bun" aria-selected="false">
          bun
        </button>
      </div>
      <button className="copy" type="button">
        Copy
      </button>
    </div>
  );
}

function RefBar({ tag }: { tag: string }) {
  return (
    <div className="ref-bar">
      <span className="ref-tag">{tag}</span>
      <button className="copy" type="button">
        Copy
      </button>
    </div>
  );
}

export function Cli() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];

    function selectPM(pm: string) {
      if (!RUNNERS[pm]) return;
      root!.querySelectorAll<HTMLElement>('[data-cmd]').forEach((el) => {
        el.textContent = RUNNERS[pm];
      });
      root!.querySelectorAll<HTMLElement>('.pm button').forEach((b) => {
        b.setAttribute('aria-selected', b.dataset.pm === pm ? 'true' : 'false');
      });
      try {
        localStorage.setItem('zui-pm', pm);
      } catch {
        // storage unavailable (private mode, quota) — selection just won't persist
      }
    }

    root.querySelectorAll<HTMLElement>('.pm button').forEach((b) => {
      const handler = () => selectPM(b.dataset.pm ?? 'npm');
      b.addEventListener('click', handler);
      cleanups.push(() => b.removeEventListener('click', handler));
    });

    try {
      const saved = localStorage.getItem('zui-pm');
      if (saved && RUNNERS[saved]) selectPM(saved);
    } catch {
      // storage unavailable
    }

    root.querySelectorAll<HTMLElement>('.copy').forEach((btn) => {
      const handler = () => {
        const block = btn.closest('.term, .ref');
        const pre = block?.querySelector('pre');
        if (!pre) return;
        const text = (pre as HTMLElement).innerText.replace(/^\$ /gm, '');
        navigator.clipboard
          .writeText(text)
          .then(() => {
            btn.textContent = 'Copied';
            btn.dataset.done = '1';
            setTimeout(() => {
              btn.textContent = 'Copy';
              delete btn.dataset.done;
            }, 1400);
          })
          .catch(() => {
            btn.textContent = 'Press ⌘C';
            setTimeout(() => {
              btn.textContent = 'Copy';
            }, 1400);
          });
      };
      btn.addEventListener('click', handler);
      cleanups.push(() => btn.removeEventListener('click', handler));
    });

    const links: Record<string, HTMLAnchorElement> = {};
    root.querySelectorAll<HTMLAnchorElement>('nav.toc a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href) links[href.slice(1)] = a;
    });
    const targets = Array.from(root.querySelectorAll<HTMLElement>('main h2[id], main h3[id]'));

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && targets.length) {
      const seen = new Set<string>();
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) seen.add(e.target.id);
            else seen.delete(e.target.id);
          });
          Object.values(links).forEach((a) => a.classList.remove('on'));
          for (const t of targets) {
            if (seen.has(t.id) && links[t.id]) {
              links[t.id].classList.add('on');
              break;
            }
          }
        },
        { rootMargin: '-88px 0px -70% 0px' },
      );
      targets.forEach((t) => io!.observe(t));
    }

    return () => {
      cleanups.forEach((fn) => fn());
      io?.disconnect();
    };
  }, []);

  return (
    <Page title="CLI">
      <div className="cli-ref-page" ref={rootRef}>
        <style>{CLI_REF_CSS}</style>

        <div className="shell">
          <nav className="toc" aria-label="On this page">
            <div className="toc-label">Commands</div>
            <a href="#init">
              <code>init</code>
            </a>
            <a href="#add">
              <code>add</code>
            </a>
            <a href="#add-many" className="sub">
              Several at once
            </a>
            <a href="#add-dry" className="sub">
              Preview first
            </a>
            <a href="#add-url" className="sub">
              From a URL
            </a>
            <a href="#list">
              <code>list</code>
            </a>
            <a href="#view">
              <code>view</code>
            </a>
            <div className="toc-label" style={{ marginTop: 22 }}>
              Reference
            </div>
            <a href="#requirements">Requirements</a>
            <a href="#troubleshooting">Troubleshooting</a>
            <a href="#manual">Manual install</a>
          </nav>

          <main>
            <h1>CLI</h1>
            <p className="lede">Add Z-UI components to your project from the terminal.</p>

            <div className="thesis">
              <p>
                <strong>Components install as source.</strong> Every component is one self-contained
                file. <code>add</code> writes that file into your project and stops there.
              </p>
              <p>
                Nothing is added to <code>package.json</code> for the effect itself. There is no
                runtime package to version, patch, or wait on. Delete the file and the component is
                gone.
              </p>
            </div>

            <p>No install step. Run it with your package runner:</p>

            <div className="term" data-snippet="">
              <TermBar />
              <pre dangerouslySetInnerHTML={{ __html: FIRST_RUN_HTML }} />
            </div>
            <p className="note">
              That banner is real — the CLI's own intro frame (figlet, &quot;ANSI Shadow&quot;,
              white-to-charcoal gradient), printed on every interactive run. Not restyled to the
              site's orange: the tool deliberately puts no brand color in the terminal, since a
              hex pinned into someone's own color scheme can land unreadable on it.
            </p>

            <div className="delta">
              <div className="delta-h">What that wrote</div>
              <ul>
                <li className="added">
                  <span className="sign">+</span>
                  <span className="path">components/ui/rotary-dial.tsx</span>
                  <span className="meta">14.2 kB</span>
                </li>
                <li className="none">
                  <span className="sign">·</span>
                  <span className="path">package.json</span>
                  <span className="meta">unchanged</span>
                </li>
                <li className="none">
                  <span className="sign">·</span>
                  <span className="path">node_modules/</span>
                  <span className="meta">unchanged</span>
                </li>
              </ul>
              <div className="delta-f">
                1 file written · <b>0 dependencies added</b>
              </div>
            </div>

            <h2 id="init">
              init<a className="anchor" href="#init">#</a>
            </h2>
            <p>
              Sets where components are written and which language they are written in. Creates{' '}
              <code>z-ui.json</code> at the project root.
            </p>
            <p>
              <code>init</code> is optional. Without it, <code>add</code> uses{' '}
              <code>components/ui</code> and detects TypeScript from your <code>tsconfig.json</code>.
            </p>

            <div className="term" data-snippet="">
              <TermBar />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> init\n\n<span class="dim">? Where should components be written?</span> <span class="hi">components/ui</span>\n<span class="dim">? Language</span> <span class="hi">TypeScript</span>\n<span class="ok">  ✓</span> <span class="dim">wrote</span> z-ui.json',
                }}
              />
            </div>

            <div className="ref">
              <RefBar tag="z-ui init --help" />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    'Usage: z-ui init [options]\n\ninitialize z-ui in your project\n\nOptions:\n  -d, --dir &lt;path&gt;   directory components are written to\n                     (default: "components/ui")\n  -c, --cwd &lt;cwd&gt;    the working directory (default: ".")\n      --ts           write TypeScript files\n      --js           write JavaScript files\n  -y, --yes          accept defaults, skip prompts (default: false)\n  -f, --force        overwrite an existing z-ui.json (default: false)\n  -h, --help         display help for command',
                }}
              />
            </div>

            <h2 id="add">
              add<a className="anchor" href="#add">#</a>
            </h2>
            <p>Writes a component's source into your project.</p>

            <div className="term" data-snippet="">
              <TermBar />
              <pre
                dangerouslySetInnerHTML={{
                  __html: '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> add [component]',
                }}
              />
            </div>

            <p>Run it with no arguments to pick from a list.</p>

            <h3 id="add-many">
              Several at once<a className="anchor" href="#add-many">#</a>
            </h3>
            <div className="term" data-snippet="">
              <TermBar />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> add rotary-dial gooey-fab gooey-tabs',
                }}
              />
            </div>
            <p>Each component is independent, so the order does not matter and nothing is shared between them.</p>

            <h3 id="add-dry">
              Preview first<a className="anchor" href="#add-dry">#</a>
            </h3>
            <p>
              <code>--dry-run</code> prints the file plan and writes nothing.
            </p>
            <div className="term" data-snippet="">
              <TermBar />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> add rotary-dial --dry-run\n\n<span class="dim">  would write</span>  components/ui/rotary-dial.tsx  <span class="dim">14.2 kB</span>\n<span class="dim">  no files changed</span>',
                }}
              />
            </div>

            <h3 id="add-url">
              From a URL<a className="anchor" href="#add-url">#</a>
            </h3>
            <p>Any registry item URL works, including one you host yourself.</p>
            <div className="term" data-snippet="">
              <TermBar />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> add https://z-ui.dev/r/rotary-dial.json',
                }}
              />
            </div>

            <div className="ref">
              <RefBar tag="z-ui add --help" />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    'Usage: z-ui add [options] [components...]\n\nadd components to your project\n\nArguments:\n  components         component names, or a URL to a registry item\n\nOptions:\n  -d, --dir &lt;path&gt;   override the output directory for this run\n  -c, --cwd &lt;cwd&gt;    the working directory (default: ".")\n  -o, --overwrite    overwrite files that already exist (default: false)\n  -a, --all          add every component in the registry (default: false)\n      --dry-run      print the file plan, write nothing (default: false)\n  -y, --yes          skip the confirmation prompt (default: false)\n  -s, --silent       mute output (default: false)\n  -h, --help         display help for command',
                }}
              />
            </div>

            <h2 id="list">
              list<a className="anchor" href="#list">#</a>
            </h2>
            <p>Prints everything in the registry with its category.</p>
            <div className="term" data-snippet="">
              <TermBar />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> list\n\n<span class="dim">  rotary-dial      input-utility      14.2 kB</span>\n<span class="dim">  gooey-fab        tactile-feedback    6.1 kB</span>\n<span class="dim">  gooey-tabs       state-morphing      5.4 kB</span>',
                }}
              />
            </div>

            <div className="ref">
              <RefBar tag="z-ui list --help" />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    'Usage: z-ui list [options]\n\nlist components in the registry\n\nOptions:\n  -q, --query &lt;query&gt;  filter by name or category\n      --json           output as JSON (default: false)\n  -h, --help           display help for command',
                }}
              />
            </div>

            <h2 id="view">
              view<a className="anchor" href="#view">#</a>
            </h2>
            <p>Prints a component's source to stdout without writing it. Read the whole thing before it enters your codebase.</p>
            <div className="term" data-snippet="">
              <TermBar />
              <pre
                dangerouslySetInnerHTML={{
                  __html: '<span class="p">$ </span><span data-cmd>npx z-ui@latest</span> view rotary-dial',
                }}
              />
            </div>

            <div className="ref">
              <RefBar tag="z-ui view --help" />
              <pre
                dangerouslySetInnerHTML={{
                  __html:
                    'Usage: z-ui view [options] &lt;component&gt;\n\nprint a component\'s source without writing it\n\nArguments:\n  component     the component name\n\nOptions:\n      --json    output as JSON (default: false)\n  -h, --help    display help for command',
                }}
              />
            </div>

            <h2 id="requirements">
              Requirements<a className="anchor" href="#requirements">#</a>
            </h2>
            <table>
              <tbody>
                <tr>
                  <th>Requirement</th>
                  <th>Notes</th>
                </tr>
                <tr>
                  <td>
                    <code>react</code> 18 or newer
                  </td>
                  <td>Assumed present. Never installed by the CLI.</td>
                </tr>
                <tr>
                  <td>Node 18 or newer</td>
                  <td>To run the CLI itself.</td>
                </tr>
                <tr>
                  <td>A bundler that handles JSX</td>
                  <td>Vite, Next, Remix, Parcel — anything.</td>
                </tr>
                <tr>
                  <td>Tailwind</td>
                  <td>Not required. Components carry their own styles.</td>
                </tr>
              </tbody>
            </table>

            <h2 id="troubleshooting">
              Troubleshooting<a className="anchor" href="#troubleshooting">#</a>
            </h2>
            <div className="tshoot">
              <details>
                <summary>error: component &quot;rotary-dail&quot; not found in registry</summary>
                <div className="body">
                  <p>
                    A typo, or a component that does not exist yet. Run <code>list</code> to see the
                    real names.
                  </p>
                </div>
              </details>
              <details>
                <summary>error: components/ui/rotary-dial.tsx already exists</summary>
                <div className="body">
                  <p>
                    <code>add</code> will not overwrite your edits. Pass <code>--overwrite</code> to
                    replace the file, or <code>--dir</code> to write somewhere else.
                  </p>
                  <p>
                    If you have modified the file, run <code>view</code> and diff it yourself before
                    overwriting.
                  </p>
                </div>
              </details>
              <details>
                <summary>Module not found: Can&apos;t resolve &apos;react&apos;</summary>
                <div className="body">
                  <p>
                    React is a peer expectation, not something the CLI installs. Install it in the
                    project you ran <code>add</code> in.
                  </p>
                </div>
              </details>
              <details>
                <summary>The file landed in the wrong folder</summary>
                <div className="body">
                  <p>
                    <code>add</code> resolves paths from <code>z-ui.json</code>, then from{' '}
                    <code>components/ui</code> if there is no config. In a monorepo, run from the
                    workspace that owns the components, or pass <code>--cwd</code>.
                  </p>
                </div>
              </details>
            </div>

            <h2 id="manual">
              Manual installation<a className="anchor" href="#manual">#</a>
            </h2>
            <p>
              The CLI is a convenience, not a requirement. Every component is one file with no
              relative imports, so copying it by hand is a complete install.
            </p>
            <ol>
              <li>Open the component's page and copy the source.</li>
              <li>
                Paste it into your project as <code>rotary-dial.tsx</code>.
              </li>
              <li>Import it.</li>
            </ol>
            <p>There is no step four. That constraint is the product.</p>

            <footer>MIT. Components are yours once written — fork them, gut them, ship them.</footer>
          </main>
        </div>
      </div>
    </Page>
  );
}
