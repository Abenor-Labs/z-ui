'use client'

import * as React from 'react'

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
  const [copied, setCopied] = React.useState(false)
  const file = files[active]!

  const copy = async () => {
    await navigator.clipboard.writeText(file.raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="border border-rule bg-panel">
      <div className="flex flex-wrap items-center gap-1 border-b border-rule px-2 py-2">
        {files.map((f, i) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={
              'px-2.5 py-1 font-mono text-[0.6875rem] transition-colors ' +
              (i === active ? 'text-mint' : 'text-muted hover:text-silkscreen')
            }
          >
            {f.target}
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

      <div className="code" dangerouslySetInnerHTML={{ __html: file.html }} />

      <div className="flex flex-wrap items-center gap-x-6 border-t border-rule px-5 py-2.5">
        <span className="lbl">{file.lines} lines</span>
        <span className="lbl">sha {file.sha}</span>
        <span className="lbl !text-mint">matches /r/</span>
      </div>
    </div>
  )
}
