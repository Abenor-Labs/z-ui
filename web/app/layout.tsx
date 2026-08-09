import type { Metadata } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
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
    'Engineered kinetic components for React. Spring physics and micro-interactions you own as source.',
}

/**
 * The document, and nothing else.
 *
 * The nav and footer live in `app/(site)/layout.tsx` instead. A route group
 * adds no path segment, so every URL is unchanged; what it buys is that
 * `not-found.tsx` — which Next resolves here at the app root for unmatched
 * URLs, and so cannot inherit a group's layout — mounts the same two
 * components by hand rather than the whole app carrying chrome it may not
 * want.
 *
 * Fonts and `globals.css` stay here because every route needs the document,
 * including the one that renders `not-found`.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
