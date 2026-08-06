/**
 * The whole output surface.
 *
 * No colour library. A CLI invoked through `npx` on a cold cache pays for every
 * dependency in start-up latency, and ANSI escapes are eight lines of code.
 * `NO_COLOR` is honoured because it is a convention people rely on in CI.
 */
const tty = process.stdout.isTTY === true
export const plain = !tty || process.env.NO_COLOR !== undefined || process.env.TERM === 'dumb'

const wrap = (open: number, close: number) => (s: string) =>
  plain ? s : `[${open}m${s}[${close}m`

/**
 * No brand colour anywhere in here, deliberately.
 *
 * A terminal already carries the user's own palette. Pinning a hex value into
 * it fights whatever theme they chose, and on a light background or a
 * solarized scheme it can land somewhere unreadable. Every colour below is an
 * ANSI slot the terminal itself resolves, so the tool inherits their scheme
 * instead of overriding it. `bold` and `dim` are weights, not hues.
 */
export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  grey: wrap(90, 39),
  black: wrap(30, 39),
  bgCyan: wrap(46, 49),
}

let silent = false
export const setSilent = (v: boolean) => (silent = v)

export const log = {
  /** Plain output. Suppressed by --silent. */
  line(msg = '') {
    if (!silent) process.stdout.write(msg + '\n')
  },
  step(msg: string) {
    if (!silent) process.stdout.write(`${c.cyan('›')} ${msg}\n`)
  },
  ok(msg: string) {
    if (!silent) process.stdout.write(`${c.green('✓')} ${msg}\n`)
  },
  warn(msg: string) {
    if (!silent) process.stderr.write(`${c.yellow('!')} ${msg}\n`)
  },
  /** Errors ignore --silent. Muting a failure is how people lose data. */
  error(msg: string) {
    process.stderr.write(`${c.red('✗')} ${msg}\n`)
  },
  /** Machine-readable output. Never suppressed, never decorated. */
  raw(msg: string) {
    process.stdout.write(msg + '\n')
  },
}

/**
 * A failure the user can act on: a missing config, an unknown component, a
 * refused write. Distinguished from a crash so `index.ts` can print one clean
 * line and exit 1 instead of a stack trace.
 */
export class UserError extends Error {
  readonly hint?: string
  constructor(message: string, hint?: string) {
    super(message)
    this.name = 'UserError'
    this.hint = hint
  }
}
