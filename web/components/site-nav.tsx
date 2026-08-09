'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CopyButton, CopyIcon } from '@/components/copy-button'

const CLI = 'npx @abenor/z-ui add <component>'

// `/components` and `/c/<name>` are gone with the registry they listed. The
// home page keeps a `#components` section that says what is happening there,
// so the label survives without pointing at a 404.
const LINKS = [
  { href: '/#components', label: 'Components' },
  { href: '/docs', label: 'Docs' },
  { href: '/#install', label: 'Install' },
  { href: 'https://github.com/Abenor-Labs/z-ui', label: 'GitHub', external: true },
]

/**
 * "You are here", as an aria value rather than a boolean.
 *
 * A hash link never claims the marker: /#install and /#components address
 * sections of the home route, and a visitor sitting at the top of / is not at
 * either. The 'true' case used to cover /c/<name>, which belonged under
 * Components without being it; those routes went with the registry.
 */
function activeMark(link: (typeof LINKS)[number], pathname: string): 'page' | 'true' | undefined {
  if (link.external || link.href.includes('#')) return undefined
  if (pathname === link.href) return 'page'
  return undefined
}

/**
 * The marker is weight-and-ink, not accent. The Moving Part Rule reserves mint
 * for what is in motion, and a route marker is the most static state on the
 * page; lifting the label from silkscreen grey to lit sand and ruling under it
 * says the same thing in the neutral ramp. aria-current carries it a third way,
 * so nothing here is encoded in colour alone.
 */
const MARKED = 'text-ink underline decoration-control decoration-1 underline-offset-[6px]'

export function SiteNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  // A route change with the sheet still open would leave it covering the new
  // page, so close on navigation rather than on each link's own click.
  React.useEffect(() => setOpen(false), [pathname])

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-chassis/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[80rem] items-center justify-between px-4 md:px-16">
        <Link href="/" className="font-mono text-base font-bold tracking-tighter text-ink">
          Z-UI
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => {
            const mark = activeMark(l, pathname)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={mark}
                className={'lbl transition-colors hover:!text-accent' + (mark ? ` ${MARKED}` : '')}
                {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {l.label}
              </Link>
            )
          })}
        </div>

        {/* Opaque at rest; the two composited steps exist only while a pointer is
            on it or a finger is down, so the fill darkens the way a key travels
            rather than lighting up. Mint is deliberately not here: this button
            means "copy", it does not move. */}
        <CopyButton
          value={CLI}
          className="hidden items-center gap-2 rounded-lg bg-ink px-4 py-2 font-mono text-xs font-semibold tracking-[0.05em] text-chassis transition-[background-color,transform] duration-150 hover:bg-ink/85 active:scale-[0.97] active:bg-ink/75 md:inline-flex"
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
          className="-mr-2 grid size-11 place-items-center text-ink transition-colors active:text-muted md:hidden"
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
        // The sheet carries its own ground one tonal step up from the chassis.
        // Inheriting the bar's 80% would have put a full menu of 12px mono over
        // whatever happened to be scrolled underneath, which is the blur doing
        // legibility work it was never meant to do alone.
        <div
          id="site-menu"
          className="flex flex-col border-t border-hair bg-surface px-4 pb-5 md:hidden"
        >
          {LINKS.map((l) => {
            const mark = activeMark(l, pathname)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={mark}
                // min-h-11 rather than padding: the row has to clear 44px whatever
                // the label's line box does.
                className={'lbl flex min-h-11 items-center' + (mark ? ` ${MARKED}` : '')}
                {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {l.label}
              </Link>
            )
          })}
          <CopyButton
            value={CLI}
            className="lbl flex min-h-11 items-center transition-colors active:text-ink"
          >
            Copy CLI
          </CopyButton>
        </div>
      )}
    </nav>
  )
}
