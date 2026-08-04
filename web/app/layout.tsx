import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Z-UI',
    template: '%s · Z-UI',
  },
  description:
    'Micro-animations you own. A copy-paste registry of spring-driven React components.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-50 border-b border-rule bg-chassis/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3.5">
            <a href="/" className="lbl !text-mint">
              Z-UI
            </a>
            <span className="lbl">micro-interaction registry</span>
            <a
              href="https://github.com/Abenor-Labs/z-ui"
              className="lbl ml-auto transition-colors hover:!text-silkscreen"
            >
              GitHub
            </a>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-5xl px-6 py-16">
          <p className="lbl">MIT · Abenor Labs</p>
        </footer>
      </body>
    </html>
  )
}
