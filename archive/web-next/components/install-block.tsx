'use client'

import * as React from 'react'
import { CopyButton } from '@/components/copy-button'
import { manifestUrl } from '@/lib/registry'

/**
 * Two install paths, both live since 2026-08-10.
 *
 * The manifests are a strict superset of shadcn's registry-item schema, so
 * `npx shadcn add <url>` installs them unmodified — ADR 0002's hedge, verified
 * end to end rather than assumed. The first-party CLI needed the merge and an
 * npm publish; it has both.
 *
 * This block is not currently mounted anywhere — the component pages carry
 * their own install sections. It is kept honest anyway, because the two times
 * this site shipped a false install claim (`5f33a80`, `e315c4d`) it was copy
 * that had outlived the condition it described, and unmounted copy rots the
 * same way mounted copy does.
 */
export function InstallBlock({ name }: { name: string }) {
  const commands = [
    { label: 'z-ui', cmd: `npx @abenor/z-ui add ${name}`, status: 'first-party CLI · @abenor/z-ui on npm' },
    { label: 'shadcn', cmd: `npx shadcn@latest add ${manifestUrl(name)}`, status: 'works with any shadcn project' },
  ]
  // The first-party path opens first now. It defaulted to shadcn because that
  // was the only one that worked.
  const [active, setActive] = React.useState(0)
  const current = commands[active]!

  return (
    <div className="overflow-hidden rounded-xl border border-control bg-panel">
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
