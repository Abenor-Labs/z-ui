import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'

export type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm'

/**
 * Detect from the lockfile, walking up. Running `npm install` in a pnpm
 * workspace is a genuinely destructive mistake — it writes a second lockfile
 * and a flat `node_modules` beside the store — so this is worth getting right
 * rather than defaulting to npm.
 */
export function detectPackageManager(cwd: string): PackageManager {
  // Walking up is necessary — in a monorepo the lockfile sits at the root while
  // the command runs inside a package. But it stops at the home directory: a
  // stray lockfile in ~ would otherwise decide the package manager for every
  // project on the machine that does not have one of its own.
  const home = path.resolve(homedir())
  let dir = path.resolve(cwd)
  for (;;) {
    // Checked before the scan, not after: the home directory itself must never
    // be searched. A `bun.lock` sitting in ~ is common and has nothing to do
    // with the project being installed into.
    if (dir === home) return 'npm'

    if (existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
    if (existsSync(path.join(dir, 'bun.lockb')) || existsSync(path.join(dir, 'bun.lock'))) return 'bun'
    if (existsSync(path.join(dir, 'yarn.lock'))) return 'yarn'
    if (existsSync(path.join(dir, 'package-lock.json'))) return 'npm'

    const up = path.dirname(dir)
    if (up === dir) return 'npm'
    dir = up
  }
}

export function installCommand(pm: PackageManager, pkgs: string[]) {
  const add = pm === 'npm' ? 'install' : 'add'
  return { command: pm, args: [add, ...pkgs] }
}

/** Which of these are not already dependencies of the project. */
export async function missingDependencies(cwd: string, pkgs: string[]): Promise<string[]> {
  const file = path.join(cwd, 'package.json')
  if (!existsSync(file)) return pkgs
  try {
    const json = JSON.parse(await readFile(file, 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    const have = new Set([
      ...Object.keys(json.dependencies ?? {}),
      ...Object.keys(json.devDependencies ?? {}),
      ...Object.keys(json.peerDependencies ?? {}),
    ])
    return pkgs.filter((p) => !have.has(p.replace(/@[^@/]+$/, '')))
  } catch {
    return pkgs
  }
}

/**
 * How to launch a package manager without asking Node for a shell.
 *
 * Package managers on Windows are `.cmd` shims, which `execvp` cannot run, so
 * this used to pass `shell: true`. Node 22 deprecated that combination —
 * `shell: true` with an args array concatenates the arguments without escaping
 * them — and prints DEP0190 on every single install:
 *
 *   DeprecationWarning: Passing args to a child process with shell option true
 *   can lead to security vulnerabilities
 *
 * Which put the words "security vulnerabilities" in this tool's own output, on
 * Windows only, at the exact moment it is asking to write files into someone's
 * project. Nobody on macOS ever saw it.
 *
 * Invoking the interpreter explicitly gets the shim behaviour without the
 * warning. `/d` skips AutoRun scripts that would otherwise run first, `/s`
 * fixes cmd's quote handling, and the whole command is passed as one
 * pre-quoted string with `windowsVerbatimArguments` so Node does not re-quote
 * what cmd is about to parse.
 */
export function launcher(command: string, args: string[], platform = process.platform) {
  if (platform !== 'win32') return { file: command, argv: args, verbatim: false }
  const quoted = [command, ...args].map((a) => (/[\s"^&|<>]/.test(a) ? `"${a}"` : a)).join(' ')
  return {
    file: process.env.ComSpec || 'cmd.exe',
    argv: ['/d', '/s', '/c', `"${quoted}"`],
    verbatim: true,
  }
}

/**
 * Run the install, and say nothing unless it fails.
 *
 * `stdio: 'inherit'` handed the most trust-sensitive moment in the tool to
 * another program's formatting: funding notices, audit counts and allow-scripts
 * warnings landed in the middle of a carefully composed install, and the last
 * thing a user read before "Added disclosure" could be "3 high severity
 * vulnerabilities" — about their own project, but printed inside ours.
 *
 * The output is captured instead and replayed only when the command fails,
 * which is the only time any of it is actionable. A failure that hides the
 * package manager's reason would be worse than the noise it replaces.
 */
export function install(pm: PackageManager, pkgs: string[], cwd: string): Promise<void> {
  const { command, args } = installCommand(pm, pkgs)
  const { file, argv, verbatim } = launcher(command, args)

  return new Promise((resolve, reject) => {
    const child = spawn(file, argv, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsVerbatimArguments: verbatim,
    })

    let log = ''
    const keep = (chunk: Buffer) => {
      log += chunk.toString()
      // A runaway installer must not be buffered into memory unbounded; the
      // tail is the part with the error in it anyway.
      if (log.length > 64_000) log = log.slice(-64_000)
    }
    child.stdout?.on('data', keep)
    child.stderr?.on('data', keep)

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) return resolve()
      const err = new Error(`${command} exited with code ${code}`) as Error & { log?: string }
      err.log = log.trim()
      reject(err)
    })
  })
}
