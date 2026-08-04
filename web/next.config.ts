import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const config: NextConfig = {
  // Component sources live in the sibling `registry` workspace and are
  // imported directly, so they are TypeScript that Next has to compile itself.
  transpilePackages: ['@z-ui/registry'],
  // fileURLToPath, not URL.pathname: the latter yields "/D:/..." on Windows,
  // which Next cannot canonicalize.
  outputFileTracingRoot: fileURLToPath(new URL('..', import.meta.url)),
  async headers() {
    return [
      {
        // The registry is fetched by a CLI on someone else's machine.
        source: '/r/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
}

export default config
