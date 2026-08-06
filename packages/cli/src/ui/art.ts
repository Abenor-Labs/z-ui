import figlet from 'figlet'
import { stdout } from 'node:process'
import { c, plain } from './log.ts'
import { isInteractive } from './tty.ts'

/**
 * The banner and the structured log frame.
 *
 * `Doom` over `Slant` or `Standard`: its strokes are built from pipes and
 * underscores rather than bare slashes, which gives the letterforms enough
 * weight to survive being tinted. Slant reads as skeletal once the lower rows
 * dim toward charcoal.
 */
const FONT = 'Doom' as const

/**
 * White at the crown fading to charcoal at the baseline.
 *
 * Neutral by design — the terminal is the one surface where a brand hex does
 * not get a vote, because it renders identically regardless of the theme the
 * user chose and can land unreadable on a light background. White-to-charcoal
 * reads as depth on any scheme.
 */
const BANNER_GRADIENT = ['#ffffff', '#666666']

const hexToRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

/** Colour at position `t` (0 at the top, 1 at the baseline) along the stops. */
function stopAt(t: number): [number, number, number] {
  const stops = BANNER_GRADIENT.map(hexToRgb)
  const span = 1 / (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(t / span))
  const f = (t - i * span) / span
  const a = stops[i]!
  const b = stops[i + 1]!
  return [0, 1, 2].map((k) => Math.round(a[k]! + (b[k]! - a[k]!) * f)) as [number, number, number]
}

const pill = (text: string) => c.bgCyan(c.black(` ${text} `))

const BAR = c.grey('│')
const DIAMOND = c.cyan('◇')
const CORNER_TOP = c.grey('┌')
const CORNER_END = c.grey('└')

let bannerLines = 0

/**
 * The figlet banner under a vertical fade, indented two columns.
 *
 * The gradient is computed here rather than delegated. `gradient-string` asks
 * chalk whether colour is supported, chalk runs its own detection, and where
 * that detection disagrees with ours the banner silently prints bare while
 * every label beneath it stays coloured. Gating on one answer removes the
 * whole class of problem.
 *
 * It also makes the fade genuinely vertical. `.multiline()` interpolates along
 * each line as well as down the block, so the mark is lit on a diagonal; one
 * colour per row is what reads as top-to-bottom.
 */
function banner(): string[] {
  const art = figlet.textSync('Z-UI', { font: FONT })
  const rows = art.replace(/\s+$/, '').split('\n').filter((r) => r.trim())

  if (plain) return rows.map((row) => `  ${row}`)

  const last = Math.max(1, rows.length - 1)
  return rows.map((row, i) => {
    const [r, g, b] = stopAt(i / last)
    return `  \x1b[38;2;${r};${g};${b}m${row}\x1b[39m`
  })
}

/**
 * Opening frame: banner, the cyan pill, then the tagline hanging off a
 * connector so everything below reads as one continuous run.
 */
export function intro(version: string, subtitle: string) {
  if (!isInteractive()) {
    stdout.write(`z-ui ${version}\n`)
    bannerLines = 1
    return
  }

  const lines = [
    '',
    ...banner(),
    '',
    `${CORNER_TOP}  ${pill('z-ui')}`,
    BAR,
    `${DIAMOND}  ${c.grey(subtitle)}  ${c.grey('•')}  ${c.grey(version)}`,
    BAR,
  ]
  stdout.write(lines.join('\n') + '\n')
  bannerLines = lines.length
}

/** A step in the run. Hangs off the same rail as everything above it. */
export function step(text: string) {
  stdout.write(`${DIAMOND}  ${text}\n${BAR}\n`)
}

/** A block of key/value detail, indented under the rail. */
export function detail(title: string, rows: string[]) {
  stdout.write(`${DIAMOND}  ${c.bold(title)}\n`)
  for (const r of rows) stdout.write(`${BAR}  ${r}\n`)
  stdout.write(`${BAR}\n`)
}

/** Closes the run. Nothing hangs below the corner. */
export function outro(text: string) {
  stdout.write(`${CORNER_END}  ${text}\n\n`)
}

/**
 * How many lines the frame has written since `intro`.
 *
 * A redraw that clears more than this eats the banner; one that clears less
 * leaves a torn frame behind. Anything drawing in place below the intro asks
 * for this rather than counting rows itself.
 */
export const framedLines = () => bannerLines

/** Kept for callers that want the old boxed summary rather than the rail. */
export function panel(title: string, rows: string[]) {
  return [
    '',
    `  ${c.grey('┌')} ${c.bold(title)}`,
    ...rows.map((r) => `  ${c.grey('│')}  ${r}`),
    `  ${c.grey('└')}`,
    '',
  ].join('\n')
}
