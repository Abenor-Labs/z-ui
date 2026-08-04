'use client'

import * as React from 'react'

const REGISTRY_BASE =
  'https://raw.githubusercontent.com/Abenor-Labs/z-ui/main/registry'

/**
 * Two install paths, both real. The shadcn one works today because the
 * manifests are a strict superset of its registry-item schema; the first-party
 * CLI is not published yet and says so rather than pretending.
 */
export function InstallBlock({ name }: { name: string }) {
  const commands = [
    { label: 'z-ui', cmd: `npx @abenor/z-ui add ${name}`, ready: false },
    { label: 'shadcn', cmd: `npx shadcn@latest add ${REGISTRY_BASE}/r/${name}.json`, ready: true },
  ]
  const [active, setActive] = React.useState(1)
  const [copied, setCopied] = React.useState(false)
  const current = commands[active]!

  const copy = async () => {
    await navigator.clipboard.writeText(current.cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="border border-rule bg-panel">
      <div className="flex items-center gap-1 border-b border-rule px-2 py-2">
        {commands.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={
              'px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors ' +
              (i === active ? 'text-mint' : 'text-muted hover:text-silkscreen')
            }
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={copy}
          className="ml-auto border border-rule px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:border-mint hover:text-mint"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>

      <pre className="overflow-x-auto px-5 py-4 font-mono text-sm text-silkscreen">
        {current.cmd}
      </pre>

      {!current.ready && (
        <p className="border-t border-rule px-5 py-2.5 font-mono text-[0.6875rem] text-muted">
          Not published yet. Use the shadcn tab; it reads the same registry.
        </p>
      )}
    </div>
  )
}
