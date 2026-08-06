'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CopyButton, CopyIcon } from '@/components/copy-button'

const CLI = 'npx @abenor/z-ui add like-button'

const LINKS = [
  { href: '/components', label: 'Components' },
  { href: '/docs', label: 'Docs' },
  { href: '/#install', label: 'Install' },
  { href: 'https://github.com/Abenor-Labs/z-ui', label: 'GitHub', external: true },
]

export function SiteNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  // A route change with the sheet still open would leave it covering the new
  // page, so close on navigation rather than on each link's own click.
  React.useEffect(() => setOpen(false), [pathname])

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-chassis/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[80rem] items-center justify-between px-4 md:px-16">
        <Link href="/" className="font-mono text-base font-bold tracking-tighter text-ink">
          Z-UI
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="lbl transition-colors hover:!text-accent"
              {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <CopyButton
          value={CLI}
          className="hidden items-center gap-2 rounded-lg bg-white px-4 py-2 font-mono text-xs font-semibold tracking-[0.05em] text-black transition-colors hover:bg-zinc-200 md:inline-flex"
        >
          <CopyIcon />
          <span>Copy CLI</span>
        </CopyButton>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label="Menu"
          className="-mr-2 grid size-10 place-items-center md:hidden"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div id="site-menu" className="flex flex-col border-t border-hair px-4 pb-5 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="lbl py-3"
              {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {l.label}
            </Link>
          ))}
          <CopyButton value={CLI} className="lbl py-3 text-left">
            Copy CLI
          </CopyButton>
        </div>
      )}
    </nav>
  )
}
