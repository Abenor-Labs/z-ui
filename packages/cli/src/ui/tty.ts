import readline from 'node:readline'
import { stdin, stdout } from 'node:process'

/**
 * Terminal primitives, hand-rolled.
 *
 * A prompts library would be four dependencies and a cold-start cost paid by
 * every `npx` invocation, to draw a list. Node already parses keypresses; the
 * rest is a dozen escape codes.
 */

export const ESC = {
  hideCursor: '[?25l',
  showCursor: '[?25h',
  clearDown: '[J',
  clearLine: '[2K',
  up: (n: number) => (n > 0 ? `[${n}A` : ''),
  toColumn0: '[0G',
}

export const isInteractive = () => Boolean(stdin.isTTY && stdout.isTTY)

export type Key = {
  name?: string
  sequence?: string
  ctrl: boolean
  shift: boolean
  meta: boolean
}

/**
 * A live region: a block of lines that is redrawn in place.
 *
 * Redrawing means moving the cursor back up by exactly the number of lines last
 * written, then clearing forward. Tracking that count is why this is a class
 * rather than a function — get it wrong by one and the terminal smears.
 */
export class Live {
  private lines = 0

  render(text: string) {
    const out = text.endsWith('\n') ? text : text + '\n'
    stdout.write(ESC.up(this.lines) + ESC.toColumn0 + ESC.clearDown + out)
    this.lines = out.split('\n').length - 1
  }

  /** Leave the final frame on screen and stop tracking it. */
  done() {
    this.lines = 0
  }

  /** Erase the block entirely. */
  clear() {
    stdout.write(ESC.up(this.lines) + ESC.toColumn0 + ESC.clearDown)
    this.lines = 0
  }
}

/**
 * Run an interactive loop with the terminal in raw mode.
 *
 * The cleanup is the important part. Raw mode with a hidden cursor is a hostile
 * state to leave a terminal in, so it is restored on resolve, on throw, and on
 * SIGINT — and Ctrl-C exits with 130, which is what a shell expects from an
 * interrupted program.
 */
export function interactive<T>(
  draw: () => string,
  onKey: (key: Key, done: (value: T) => void) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const live = new Live()
    const wasRaw = stdin.isRaw

    readline.emitKeypressEvents(stdin)
    // Guarded on the method, not just the flag: a stream can report isTTY
    // without implementing setRawMode, and that combination is what a test
    // harness driving this from a pipe looks like.
    if (stdin.isTTY && typeof stdin.setRawMode === 'function') stdin.setRawMode(true)
    stdout.write(ESC.hideCursor)

    let settled = false

    const restore = () => {
      stdin.off('keypress', handler)
      process.off('SIGINT', onSigint)
      if (stdin.isTTY && typeof stdin.setRawMode === 'function') stdin.setRawMode(wasRaw ?? false)
      stdout.write(ESC.showCursor)
      stdin.pause()
    }

    const finish = (value: T) => {
      if (settled) return
      settled = true
      live.clear()
      restore()
      resolve(value)
    }

    const onSigint = () => {
      if (settled) return
      settled = true
      live.clear()
      restore()
      stdout.write('\n')
      process.exit(130)
    }

    const handler = (_str: string, key: Key) => {
      try {
        if (key?.ctrl && key.name === 'c') return onSigint()
        onKey(key ?? { ctrl: false, shift: false, meta: false }, finish)
        if (!settled) live.render(draw())
      } catch (e) {
        if (settled) return
        settled = true
        live.clear()
        restore()
        reject(e)
      }
    }

    process.on('SIGINT', onSigint)
    stdin.on('keypress', handler)
    stdin.resume()
    live.render(draw())
  })
}
