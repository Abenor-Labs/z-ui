/**
 * REAL transcripts, captured 2026-08-18 by running the published CLI
 * (`npx @abenor/z-ui@latest …`, version 0.1.1) in a scratch project.
 *
 * These are not written in the product's voice — they ARE the product's output,
 * verbatim, with only two edits, both marked in place: npm's own install noise
 * is trimmed, and nothing else. DESIGN.md A6 (illustrative CLI output) no longer
 * applies to this page; what it shows is what the CLI printed.
 *
 * Note for anyone updating these: the CLI is v0.1 and its output will drift.
 * Re-capture rather than hand-editing.
 */

export interface Recording {
  /** what was typed, without the npx prefix */
  cmd: string;
  /** verbatim stdout/stderr lines */
  lines: string[];
  /** short note shown under the cast when this step is on screen */
  note?: string;
}

export const VERSION = '0.1.1';
export const CAPTURED = '2026-08-18';

export const RECORDINGS: Recording[] = [
  {
    cmd: 'z-ui --help',
    note: 'seven commands, and more flags than the docs page lists',
    lines: [
      '',
      '  z-ui 0.1.1  micro-interaction components as source you own',
      '',
      '  Usage',
      '    z-ui <command> [options]',
      '',
      '  Commands',
      '    init              write z-ui.json',
      '    add <name...>     add components and their dependencies',
      '    list              list what the registry offers',
      '    doctor            check what is installed, change nothing',
      '    spring [name]     draw the actual curve before you pick one',
      '    preview <name>    how a component moves, before you install it',
      '    completion <sh>   completion script for bash, zsh or fish',
      '',
      '  Options',
      '    -y, --yes         accept defaults, skip prompts',
      '    -o, --overwrite   replace files that already exist',
      '    -r, --registry    registry URL or local path',
      '    -c, --cwd         project directory',
      '    -s, --silent      suppress output',
      '        --spring <p>  install with a different default preset',
      '                      snap · bounce · settle · fling',
      '        --stiffness   custom physics for spring (with --damping, --mass)',
      '        --damping     z-ui spring --stiffness 300 --damping 20 --mass 1',
      '        --mass',
      '        --dry-run     show the plan, write nothing',
      '        --json        machine-readable output (list, doctor, preview)',
      '        --force       overwrite z-ui.json (init)',
      '    -v, --version',
      '    -h, --help',
    ],
  },
  {
    cmd: 'z-ui list',
    note: 'the registry publishes four items today, not the eight this site documents',
    lines: [
      'z-ui 0.1.1 · Abenor Labs',
      'z-ui 0.1.0  https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public',
      '',
      '  disclosure                4 states  A panel whose height is an interruptible spring. Press again mid-open and it reverses from wherever it got to, carrying the speed it was already moving at.',
      '  hold-drain                5 states  A hold-to-confirm whose abort costs what the hold earned. Let go at seventy per cent and the fill is paid back at the rate it climbed, taking exactly as long to undo as it took to earn.',
      '  late-critique             6 states  A field whose criticism is late and whose forgiveness is instant. No verdict lands mid-word — it waits for a pause — and once it is complaining, the first keystroke that fixes the value clears it on the same frame.',
      '  scramble-reveal           3 states  Text that decodes out of random glyphs on hover, on mount, or when it first enters view.',
      '',
      '  4 components · z-ui add <name>',
    ],
  },
  {
    cmd: 'z-ui preview disclosure',
    note: 'the curve is drawn from the component’s real constants — 520/46, overdamped',
    lines: [
      'z-ui 0.1.1 · Abenor Labs',
      '  Disclosure  press',
      '  A panel whose height is an interruptible spring. Press again mid-open and it reverses from wherever it got to, carrying the speed it was already moving at.',
      '',
      '  States  4, in declaration order',
      '    closed · opening · open · closing',
      '',
      '  Spring  SPRING  stiffness 520  damping 46  mass 1  ζ 1.01  bespoke — tuned for this component, not one of the four presets',
      '  overdamped — no overshoot, slower to arrive',
      '',
      '  · · · · · · · · · · · ##############################',
      '              ###########                             ',
      '           ####                                       ',
      '         ###                                          ',
      '        ##                                            ',
      '      ###                                             ',
      '     ##                                               ',
      '    ##                                                ',
      '  ###                                                 ',
      '',
      '  t90 173ms  overshoot 0%  settle 262ms',
      '  rest thresholds: delta 2, speed 20',
      '',
      '  ✓ takes a real path under prefers-reduced-motion',
      '',
      '  installs: motion',
      '  → components/z-ui/disclosure.tsx',
      '',
      '  z-ui add disclosure',
    ],
  },
  {
    cmd: 'z-ui spring settle',
    note: 'spring takes a PRESET, not a component — presets are snap, bounce, settle, fling',
    lines: [
      'z-ui 0.1.1 · Abenor Labs',
      '  settle  stiffness 260  damping 24  mass 1',
      '  ζ 0.74  underdamped — overshoots',
      '',
      '  · · · · · · · ·#####################################',
      '              ####                                    ',
      '             ##                                       ',
      '           ###                                        ',
      '          ##                                          ',
      '         ##                                           ',
      '        ##                                            ',
      '       ##                                             ',
      '      ##                                              ',
      '    ###                                               ',
      '  ###                                                 ',
      '',
      '  t90 172ms  overshoot 2.9%  settle 354ms',
      '',
      '  z-ui add <name> --spring settle',
    ],
  },
  {
    cmd: 'z-ui add disclosure --dry-run',
    note: 'the plan is printed in full before a single byte lands',
    lines: [
      'z-ui 0.1.1 · Abenor Labs',
      '◇  No z-ui.json — detected',
      '│  framework  React',
      '│  language   JavaScript',
      '│  components components/z-ui/',
      '│  packages   npm',
      '│',
      '✓ Wrote z-ui.json',
      '› Reading https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public',
      '› Resolving from https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public',
      '',
      '  Will write',
      '    + components/z-ui/disclosure.tsx',
      '',
      '  Will install',
      '    npm motion',
      '',
      '✓ Dry run. Nothing was written.',
    ],
  },
  {
    cmd: 'z-ui add disclosure --spring settle',
    note: 'the refusal: a preset would overwrite physics the component was tuned against',
    lines: [
      'z-ui 0.1.1 · Abenor Labs',
      '› Reading https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public',
      '› Resolving from https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public',
      '✗ disclosure tunes its own spring (stiffness 520, damping 46, mass 1) rather than using a preset. Installing settle over it would change physics the component was deliberately tuned against. Install it and edit SPRING if you want different numbers.',
      '  Drop --spring to install the component as tuned.',
    ],
  },
  {
    cmd: 'z-ui add disclosure -y',
    note: 'the real install — npm’s own output is trimmed below, nothing else is',
    lines: [
      'z-ui 0.1.1 · Abenor Labs',
      '› Reading https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public',
      '› Resolving from https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/web/public',
      '',
      '  Will write',
      '    + components/z-ui/disclosure.tsx',
      '',
      '  Will install',
      '    npm motion',
      '',
      '✓ components/z-ui/disclosure.tsx',
      '› npm install motion',
      '  … npm output trimmed …',
    ],
  },
  {
    cmd: 'z-ui doctor',
    note: 'doctor reports and changes nothing — here it catches a dependency that never landed',
    lines: [
      'z-ui 0.1.1 · Abenor Labs',
      '  ✓ disclosure         unmodified',
      '',
      '  ! Missing dependencies: motion',
      '    npm install motion',
      '',
      '✓ Nothing broken.',
    ],
  },
];

export const BY_CMD = new Map(RECORDINGS.map((r) => [r.cmd, r]));

/** normalise what a user types to a recorded command */
export function resolve(input: string): Recording | null {
  const cleaned = input
    .trim()
    .replace(/^npx\s+(--yes\s+)?/, '')
    .replace(/^@abenor\/z-ui(@latest)?\s*/, 'z-ui ')
    .replace(/\s+/g, ' ')
    .trim();
  const withPrefix = cleaned.startsWith('z-ui') ? cleaned : `z-ui ${cleaned}`;
  return BY_CMD.get(withPrefix) ?? null;
}

export type LineKind = 'out' | 'dim' | 'sig' | 'err' | 'plot';

/** classify a captured line for colouring — by the CLI's own glyphs, nothing invented */
export function kindOf(line: string): LineKind {
  const t = line.trimStart();
  if (t.startsWith('✗') || t.startsWith('!')) return 'err';
  if (t.startsWith('✓')) return 'sig';
  if (t.startsWith('›') || t.startsWith('│') || t.startsWith('◇')) return 'dim';
  if (/^[#·\s]+$/.test(line) && line.trim().length) return 'plot';
  return 'out';
}
