import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { c } from './log.ts'

/**
 * Prompts refuse to run without a TTY rather than blocking forever on a pipe
 * that will never answer. In CI the correct move is to pass --yes, and saying
 * so is more useful than hanging.
 */
function assertInteractive(what: string) {
  if (!stdin.isTTY) {
    throw new Error(`Cannot prompt for ${what}: no interactive terminal. Pass --yes.`)
  }
}

export async function confirm(question: string, initial = true): Promise<boolean> {
  assertInteractive(question)
  const rl = readline.createInterface({ input: stdin, output: stdout })
  try {
    const suffix = initial ? c.grey('(Y/n)') : c.grey('(y/N)')
    const answer = (await rl.question(`${c.cyan('?')} ${question} ${suffix} `)).trim().toLowerCase()
    if (!answer) return initial
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

export async function ask(question: string, initial: string): Promise<string> {
  assertInteractive(question)
  const rl = readline.createInterface({ input: stdin, output: stdout })
  try {
    const answer = (await rl.question(`${c.cyan('?')} ${question} ${c.grey(initial)} `)).trim()
    return answer || initial
  } finally {
    rl.close()
  }
}
