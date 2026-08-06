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

export function install(pm: PackageManager, pkgs: string[], cwd: string): Promise<void> {
  const { command, args } = installCommand(pm, pkgs)
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      // Package managers on Windows are .cmd shims, which execvp cannot run.
      shell: process.platform === 'win32',
    })
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)),
    )
  })
}
