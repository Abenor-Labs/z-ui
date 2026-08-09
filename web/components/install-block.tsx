'use client'

import * as React from 'react'
import { CopyButton } from '@/components/copy-button'
import { manifestUrl } from '@/lib/registry'

/**
 * Two install paths, neither live yet.
 *
 * The shadcn one is one merge away — the manifests are already a strict
 * superset of its registry-item schema, they are just not on `main`. The
 * first-party CLI needs that and an npm publish. This block used to badge the
 * shadcn tab `ready` over a URL that 404s, which is the opposite of the thing
 * the rest of the site is careful about.
 */
export function InstallBlock({ name }: { name: string }) {
  const commands = [
    { label: 'z-ui', cmd: `npx @abenor/z-ui add ${name}`, status: 'needs the merge, then npm' },
    { label: 'shadcn', cmd: `npx shadcn@latest add ${manifestUrl(name)}`, status: 'needs the merge' },
  ]
  const [active, setActive] = React.useState(1)
  const current = commands[active]!

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-panel">
      <div className="flex items-center gap-1 border-b border-hair px-2 py-2">
        {commands.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={
              'px-2.5 py-1 lbl-xs transition-colors ' +
              (i === active ? 'text-accent' : 'text-muted hover:text-ink')
            }
          >
            {c.label}
          </button>
        ))}
        <CopyButton
          value={current.cmd}
          copiedLabel="copied"
          className="ml-auto border border-control px-2.5 py-1 lbl-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          copy
        </CopyButton>
      </div>

      {/* Wraps rather than scrolls: the shadcn command is a 90-char URL, and a
          scroll track hides most of the one string on the card the reader is
          here to copy. */}
      <pre className="whitespace-pre-wrap break-all px-5 py-4 font-mono text-sm text-ink">
        {current.cmd}
      </pre>

      {/* Always rendered, so switching tabs cannot resize the card — the note
          row used to be absent on the tab that opened first and appear on the
          reader's first click. Both tabs have something true to say now. */}
      <p className="border-t border-hair px-5 py-2.5 txt-xs text-muted">{current.status}</p>
    </div>
  )
}
