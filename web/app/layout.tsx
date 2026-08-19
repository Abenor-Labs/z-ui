import type { Metadata } from 'next'
import { IBM_Plex_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google'
import { SITE_URL } from '@/lib/site'
import './globals.css'

/**
 * Three voices, all named on the tin. Instrument Serif carries display type
 * only — it ships one weight, which keeps the display voice honest — and its
 * italic is the single piece of flourish the system allows itself. Instrument
 * Sans does every sentence; IBM Plex Mono is the silkscreen: commands, units,
 * spring constants, state names.
 */
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})
const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
})
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

/**
 * `metadataBase` is what makes the rest of this object absolute.
 *
 * The `opengraph-image` and `twitter-image` conventions emit a path, and every
 * consumer of those tags — link unfurlers, crawlers, chat clients — resolves it
 * against the origin rather than against the page. Without this, Next warns at
 * build and every share renders without the card.
 *
 * `openGraph.url` and `alternates.canonical` are `/` rather than the origin
 * string, resolved against the same base. One place holds the domain, so
 * moving off the Vercel subdomain is one edit in `lib/site.ts`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Z-UI — Physics-Driven UI Architecture',
    template: '%s · Z-UI',
  },
  description:
    'Engineered kinetic components for React. Spring physics and micro-interactions you own as source.',
  applicationName: 'Z-UI',
  keywords: [
    'react',
    'micro-interactions',
    'spring physics',
    'motion',
    'component registry',
    'shadcn',
    'animation',
  ],
  authors: [{ name: 'Abenor Labs', url: 'https://github.com/Abenor-Labs' }],
  creator: 'Abenor Labs',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Z-UI',
    url: '/',
    title: 'Z-UI — Micro-animations you own',
    description:
      'A registry of React micro-interactions installed as source, not pulled in as a dependency. Interruptible springs that carry velocity out of a gesture.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Z-UI — Micro-animations you own',
    description:
      'A registry of React micro-interactions installed as source, not pulled in as a dependency. Interruptible springs that carry velocity out of a gesture.',
  },
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
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
