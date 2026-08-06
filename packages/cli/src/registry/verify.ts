import { createHash } from 'node:crypto'
import type { RegistryItem } from './fetch.ts'
import { UserError } from '../ui/log.ts'

/**
 * Must stay identical to `sha` in web/scripts/build-registry.mjs. Both sides
 * hash the raw file bytes with sha256 and keep the first twelve hex characters.
 * A digest is a claim about bytes; two different definitions of the digest make
 * the claim meaningless.
 */
export const digest = (content: string) =>
  createHash('sha256').update(content).digest('hex').slice(0, 12)

export type Mismatch = { item: string; file: string; expected: string; actual: string }

/**
 * Check received bytes against the digests the generator published.
 *
 * This is the site's "byte-identical to the repository" claim enforced rather
 * than asserted, and it is one of the three behaviours ADR 0002 requires of a
 * first-party CLI. An item with no digests — a local registry read, or an older
 * manifest — is skipped rather than failed, because absence of a claim is not
 * evidence against one.
 */
export function verify(items: RegistryItem[]): Mismatch[] {
  const bad: Mismatch[] = []
  for (const item of items) {
    const digests = item.meta?.digests
    if (!digests) continue
    for (const file of item.files) {
      const expected = digests[file.path]
      if (!expected) continue
      const actual = digest(file.content)
      if (actual !== expected) bad.push({ item: item.name, file: file.path, expected, actual })
    }
  }
  return bad
}

export function assertVerified(items: RegistryItem[]) {
  const bad = verify(items)
  if (!bad.length) return
  const lines = bad.map((b) => `  ${b.item}/${b.file} — expected ${b.expected}, got ${b.actual}`)
  throw new UserError(
    `Registry content does not match its published digest:\n${lines.join('\n')}`,
    'Nothing was written. The registry may be mid-publish, or the response was altered in transit.',
  )
}
