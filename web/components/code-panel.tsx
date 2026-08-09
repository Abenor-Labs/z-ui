'use client'

import * as React from 'react'
import { CopyButton } from '@/components/copy-button'

export type CodeFile = {
  key: string
  target: string
  html: string
  raw: string
  lines: number
  sha: string
}

/**
 * The tab header is the destination path, not the file name, so the reader
 * knows where this lands before they run anything. The sha is the same digest
 * the generator wrote into /r/<name>.json, which is how the page can claim
 * byte-identity rather than assert it.
 */
export function CodePanel({ files }: { files: CodeFile[] }) {
  const [active, setActive] = React.useState(0)
  const file = files[active]!

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-panel">
      <div className="flex flex-wrap items-center gap-1 border-b border-hair px-2 py-2">
        {files.map((f, i) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={
              'px-2.5 py-1 txt-xs transition-colors ' +
              (i === active ? 'text-accent' : 'text-muted hover:text-ink')
            }
          >
            {f.target}
          </button>
        ))}
        <CopyButton
          value={file.raw}
          copiedLabel="copied"
          className="ml-auto border border-control px-2.5 py-1 lbl-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          copy
        </CopyButton>
      </div>

      <div className="code" dangerouslySetInnerHTML={{ __html: file.html }} />

      <div className="flex flex-wrap items-center gap-x-6 border-t border-hair px-5 py-2.5">
        <span className="lbl">{file.lines} lines</span>
        <span className="lbl">sha {file.sha}</span>
        <span className="lbl">matches /r/</span>
      </div>
    </div>
  )
}
