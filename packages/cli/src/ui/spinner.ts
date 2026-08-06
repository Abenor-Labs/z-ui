import { stdout } from 'node:process'
import { ESC, isInteractive } from './tty.ts'
import { c } from './log.ts'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/**
 * A spinner that degrades rather than corrupting output.
 *
 * Without a TTY it prints the label once and animates nothing — a stream of
 * escape codes in a CI log is worse than no feedback at all.
 */
export function spinner(label: string) {
  let text = label
  let timer: NodeJS.Timeout | undefined
  let frame = 0
  const live = isInteractive()

  if (!live) {
    stdout.write(`${c.cyan('›')} ${text}\n`)
  } else {
    timer = setInterval(() => {
      frame = (frame + 1) % FRAMES.length
      stdout.write(`${ESC.toColumn0}${ESC.clearLine}${c.cyan(FRAMES[frame]!)} ${text}`)
    }, 70)
    timer.unref?.()
    stdout.write(`${c.cyan(FRAMES[0]!)} ${text}`)
  }

  const stop = (symbol: string, final: string) => {
    if (timer) clearInterval(timer)
    if (live) stdout.write(`${ESC.toColumn0}${ESC.clearLine}${symbol} ${final}\n`)
    else if (final !== text) stdout.write(`${symbol} ${final}\n`)
  }

  return {
    update(next: string) {
      text = next
    },
    succeed: (msg = text) => stop(c.green('✓'), msg),
    fail: (msg = text) => stop(c.red('✗'), msg),
    stop: () => {
      if (timer) clearInterval(timer)
      if (live) stdout.write(`${ESC.toColumn0}${ESC.clearLine}`)
    },
  }
}
