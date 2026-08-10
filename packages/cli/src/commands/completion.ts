import { log, UserError } from '../ui/log.ts'

/**
 * Static completion, deliberately.
 *
 * Completing component names would mean a registry request inside the user's
 * shell, on every Tab. That is a network round-trip in the one place latency is
 * unforgivable, and it breaks offline. Commands and flags are the part that
 * never changes between releases anyway.
 */
export const SHELLS = ['bash', 'zsh', 'fish'] as const
export type Shell = (typeof SHELLS)[number]

const COMMANDS = ['init', 'add', 'list', 'doctor', 'spring', 'preview', 'completion'] as const

const FLAGS = [
  '--yes',
  '--overwrite',
  '--registry',
  '--cwd',
  '--silent',
  '--spring',
  '--stiffness',
  '--damping',
  '--mass',
  '--dry-run',
  '--json',
  '--force',
  '--version',
  '--help',
] as const

const bash = () => `# z-ui bash completion. Add to ~/.bashrc:
#   eval "$(z-ui completion bash)"
_z_ui() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local commands="${COMMANDS.join(' ')}"
  local flags="${FLAGS.join(' ')}"
  if [[ "\$cur" == -* ]]; then
    COMPREPLY=( \$(compgen -W "\$flags" -- "\$cur") )
  elif [[ \$COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( \$(compgen -W "\$commands" -- "\$cur") )
  fi
}
complete -F _z_ui z-ui
`

const zsh = () => `# z-ui zsh completion. Add to ~/.zshrc:
#   eval "$(z-ui completion zsh)"
_z_ui() {
  local -a commands flags
  commands=(${COMMANDS.map((n) => `'${n}'`).join(' ')})
  flags=(${FLAGS.map((f) => `'${f}'`).join(' ')})
  if [[ \$words[CURRENT] == -* ]]; then
    compadd -- \$flags
  elif (( CURRENT == 2 )); then
    compadd -- \$commands
  fi
}
compdef _z_ui z-ui
`

const fish = () =>
  [
    '# z-ui fish completion. Write to ~/.config/fish/completions/z-ui.fish:',
    '#   z-ui completion fish > ~/.config/fish/completions/z-ui.fish',
    ...COMMANDS.map((n) => `complete -c z-ui -n __fish_use_subcommand -a ${n}`),
    ...FLAGS.map((f) => `complete -c z-ui -l ${f.replace(/^--/, '')}`),
    '',
  ].join('\n')

export function completionScript(shell: Shell): string {
  if (shell === 'bash') return bash()
  if (shell === 'zsh') return zsh()
  if (shell === 'fish') return fish()
  throw new UserError(`No completion script for “${shell}”.`, `One of: ${SHELLS.join(', ')}.`)
}

export function completion(shell: string | undefined) {
  if (!shell) {
    throw new UserError('Which shell?', `z-ui completion ${SHELLS.join('|')}`)
  }
  log.raw(completionScript(shell as Shell))
}
