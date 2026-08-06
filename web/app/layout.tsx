import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { SiteNav } from '@/components/site-nav'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Z-UI — Physics-Driven UI Architecture',
    template: '%s · Z-UI',
  },
  description:
    'Engineered kinetic components for React. Zero-dependency spring physics and micro-interactions you own as source.',
}

// Only what exists. Five labels pointing at one GitHub URL is the kind of
// borrowed credibility this project's voice refuses — a dead "Status" link says
// there is a status page, and there is not.
const FOOTER_LINKS = [
  { label: 'Docs', href: '/docs' },
  { label: 'Components', href: '/#components' },
  { label: 'Install', href: '/#install' },
  { label: 'GitHub', href: 'https://github.com/Abenor-Labs/z-ui', external: true },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">
        <SiteNav />
        <div className="pt-16">{children}</div>

        <footer className="relative z-10 border-t border-hair bg-surface">
          <div className="mx-auto grid max-w-[80rem] grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4 md:px-16">
            <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
              <span className="t-lg">Z-UI</span>
              <p className="text-base text-muted">MIT License © 2026 Abenor Labs</p>
            </div>
            <div className="col-span-2 flex flex-wrap items-start gap-x-8 gap-y-4 md:col-span-3 md:justify-end">
              {FOOTER_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="lbl underline-offset-4 transition-colors hover:!text-ink hover:underline"
                  {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
