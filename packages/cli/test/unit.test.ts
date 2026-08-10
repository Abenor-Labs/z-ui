import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { rewriteImports, resolveTarget } from '../src/project/write.ts'
import { validate } from '../src/project/config.ts'
import { digest, verify } from '../src/registry/verify.ts'
import { installCommand } from '../src/project/deps.ts'
import type { Config } from '../src/project/config.ts'
import type { RegistryItem } from '../src/registry/fetch.ts'
import { isUrl } from '../src/registry/fetch.ts'
import { retargetSpring, assertPreset, springOutcome } from '../src/project/spring.ts'
import { matches, window } from '../src/ui/select.ts'
import { nearest, partitionTargets } from '../src/commands/add.ts'
import { springs, dampingRatio } from '../src/ui/spring-constants.ts'
import { simulateSpring, dampingRatioOf, regimeOf, renderCurve } from '../src/ui/spring-curve.ts'
import { existsSync, readFileSync } from 'node:fs'

const config: Config = {
  registry: './registry',
  tsx: true,
  aliases: {
    components: { import: '~/ui/z', path: 'src/ui/z' },
    hooks: { import: '~/hooks', path: 'src/hooks' },
    lib: { import: '~/lib', path: 'src/lib' },
  },
}

describe('rewriteImports', () => {
  test('rewrites each alias kind', () => {
    const src = [
      `import { useControllableState } from '@/hooks/use-controllable-state'`,
      `import { springs } from '@/lib/z-spring'`,
      `import { LikeButton } from '@/components/z-ui/like-button'`,
    ].join('\n')
    const out = rewriteImports(src, config)
    assert.match(out, /from '~\/hooks\/use-controllable-state'/)
    assert.match(out, /from '~\/lib\/z-spring'/)
    assert.match(out, /from '~\/ui\/z\/like-button'/)
  })

  test('prefers the longest matching prefix', () => {
    // "@/components/z-ui" must win over any shorter prefix sharing its head.
    const out = rewriteImports(`import x from '@/components/z-ui/scrub'`, config)
    assert.match(out, /'~\/ui\/z\/scrub'/)
  })

  test('leaves unquoted mentions alone', () => {
    const src = `// see @/lib/z-spring for the scale\nimport { zcn } from '@/lib/z-cn'`
    const out = rewriteImports(src, config)
    assert.match(out, /\/\/ see @\/lib\/z-spring for the scale/)
    assert.match(out, /from '~\/lib\/z-cn'/)
  })

  test('is a no-op when the alias already matches', () => {
    const same: Config = { ...config, aliases: { ...config.aliases, lib: { import: '@/lib', path: 'lib' } } }
    const src = `import { zcn } from '@/lib/z-cn'`
    assert.equal(rewriteImports(src, same), src)
  })

  test('handles double quotes', () => {
    assert.match(rewriteImports(`import x from "@/lib/z-cn"`, config), /"~\/lib\/z-cn"/)
  })
})

describe('resolveTarget', () => {
  test('maps each alias kind onto its configured directory', () => {
    assert.equal(resolveTarget('components/z-ui/like-button.tsx', config).replace(/\\/g, '/'), 'src/ui/z/like-button.tsx')
    assert.equal(resolveTarget('hooks/use-controllable-state.ts', config).replace(/\\/g, '/'), 'src/hooks/use-controllable-state.ts')
    assert.equal(resolveTarget('lib/z-spring.ts', config).replace(/\\/g, '/'), 'src/lib/z-spring.ts')
  })

  test('passes unknown targets through untouched', () => {
    assert.equal(resolveTarget('README.md', config), 'README.md')
  })
})

describe('config validation', () => {
  test('accepts a well-formed config', () => {
    assert.equal(validate(config).aliases.components.import, '~/ui/z')
  })

  test('defaults tsx to true when absent', () => {
    const { tsx, ...rest } = config
    assert.equal(validate(rest).tsx, true)
  })

  test('rejects a missing alias kind', () => {
    const bad = { registry: 'x', aliases: { components: config.aliases.components } }
    assert.throws(() => validate(bad), /aliases\.hooks/)
  })

  test('rejects an alias missing its disk path', () => {
    const bad = {
      registry: 'x',
      aliases: { ...config.aliases, lib: { import: '@/lib' } },
    }
    assert.throws(() => validate(bad), /aliases\.lib\.path/)
  })

  test('rejects an empty registry', () => {
    assert.throws(() => validate({ ...config, registry: '' }), /registry/)
  })
})

describe('digest verification', () => {
  const item = (content: string, sha: string): RegistryItem => ({
    name: 'like-button',
    type: 'registry:component',
    title: 'Like Button',
    description: '',
    dependencies: [],
    registryDependencies: [],
    files: [{ path: 'like-button.tsx', type: 'registry:component', content }],
    meta: { digests: { 'like-button.tsx': sha } },
  })

  test('matches the generator: sha256, first 12 hex characters', () => {
    assert.equal(digest('hello'), '2cf24dba5fb0')
  })

  test('passes when the bytes match', () => {
    assert.deepEqual(verify([item('const a = 1', digest('const a = 1'))]), [])
  })

  test('reports the file when the bytes differ', () => {
    const bad = verify([item('tampered', digest('original'))])
    assert.equal(bad.length, 1)
    assert.equal(bad[0]!.file, 'like-button.tsx')
  })

  test('skips items that publish no digest rather than failing them', () => {
    const noDigest = { ...item('x', ''), meta: {} }
    assert.deepEqual(verify([noDigest]), [])
  })
})

describe('package manager', () => {
  test('npm uses install, everything else uses add', () => {
    assert.deepEqual(installCommand('npm', ['motion']).args, ['install', 'motion'])
    assert.deepEqual(installCommand('pnpm', ['motion']).args, ['add', 'motion'])
    assert.deepEqual(installCommand('bun', ['motion']).args, ['add', 'motion'])
  })
})

describe('spring retargeting', () => {
  test('rewrites the component default', () => {
    const src = `export function LikeButton({\n  pressed,\n  spring = 'bounce',\n}: Props) {}`
    const { content, changed } = retargetSpring(src, 'settle')
    assert.match(content, /spring = 'settle'/)
    assert.equal(changed, 1)
  })

  test('leaves useZTransition’s own preset default alone', () => {
    // z-spring.ts declares `preset = 'snap'`. Rewriting that would restyle
    // every component in the project rather than the one being installed.
    const src = `export function useZTransition(preset: SpringName | Transition = 'snap') {}`
    const { content, changed } = retargetSpring(src, 'bounce')
    assert.equal(content, src)
    assert.equal(changed, 0)
  })

  test('reports no change when already on that preset', () => {
    const { changed } = retargetSpring(`spring = 'settle',`, 'settle')
    assert.equal(changed, 0)
  })

  test('also rewrites a JSX spring prop — a known limitation, not a feature', () => {
    // `spring="bounce"` in JSX matches the same pattern as a parameter default.
    // Harmless today: no shipped component passes `spring` to a child, and demo
    // files are not published. If one ever does, this needs to anchor on the
    // destructuring position instead.
    const { changed } = retargetSpring(`<LikeButton spring="bounce" />`, 'snap')
    assert.equal(changed, 1)
  })

  test('rejects an unknown preset by name', () => {
    assert.throws(() => assertPreset('springy'), /not a spring preset/)
    assert.equal(assertPreset('fling'), 'fling')
  })
})

describe('picker filtering', () => {
  const choice = {
    value: 'undo-toast',
    label: 'Undo Toast',
    hint: 'A grace period with a visible clock.',
    search: 'input-utility counting held dragging leaving',
  }

  test('empty query matches everything', () => {
    assert.equal(matches(choice, ''), true)
  })

  test('matches the component name', () => {
    assert.equal(matches(choice, 'undo'), true)
  })

  test('matches a state name that is never displayed', () => {
    // This is why `search` exists: typing "dragging" should surface every
    // draggable component, and none of them say so in their description.
    assert.equal(matches(choice, 'dragging'), true)
  })

  test('is case-insensitive', () => {
    assert.equal(matches(choice, 'GRACE'), true)
  })

  test('rejects a non-match', () => {
    assert.equal(matches(choice, 'calendar'), false)
  })
})

describe('picker window', () => {
  const items = Array.from({ length: 20 }, (_, i) => i)

  test('shows everything when it fits', () => {
    assert.deepEqual(window([1, 2, 3], 0, 9), { slice: [1, 2, 3], offset: 0 })
  })

  test('keeps the cursor centred once scrolling', () => {
    const { offset, slice } = window(items, 10, 9)
    assert.equal(offset, 6)
    assert.equal(slice.length, 9)
    assert.ok(slice.includes(10))
  })

  test('clamps at the top', () => {
    assert.equal(window(items, 0, 9).offset, 0)
  })

  test('clamps at the bottom without running past the end', () => {
    const { offset, slice } = window(items, 19, 9)
    assert.equal(offset, 11)
    assert.equal(slice[slice.length - 1], 19)
  })
})

describe('did-you-mean', () => {
  const names = ['like-button', 'scrub', 'hold-to-confirm', 'undo-toast', 'disclosure', 'sheet', 'reorder']

  test('catches a transposition', () => {
    assert.deepEqual(nearest('lik-buton', names), ['like-button'])
  })

  test('catches a name the user padded — scrubber for scrub', () => {
    assert.ok(nearest('scrubber', names).includes('scrub'))
  })

  test('catches a name the user shortened', () => {
    assert.ok(nearest('disclose', names).includes('disclosure'))
  })

  test('is case-insensitive', () => {
    assert.ok(nearest('SCRUB', names).includes('scrub'))
  })

  test('offers nothing for a genuinely unrelated word', () => {
    assert.deepEqual(nearest('calendar', names), [])
  })
})

/**
 * `registry/lib/z-spring/z-spring.ts` was deleted with the rest of the registry
 * on 2026-08-09. The CLI's own copy of the scale is still the thing it ships, so
 * the rest of this suite stays meaningful; only the cross-check against the
 * registry has nothing to compare against.
 *
 * Skipped by presence rather than deleted, so it re-arms by itself the moment a
 * spring scale exists again — and if the new scale differs from the CLI's copy,
 * this is the test that will say so instead of the drift reaching a consumer.
 */
const Z_SPRING = new URL('../../../registry/lib/z-spring/z-spring.ts', import.meta.url)
const hasRegistrySpring = existsSync(Z_SPRING)

describe('spring constants stay in step with the registry', () => {
  test('every preset matches registry/lib/z-spring/z-spring.ts', { skip: !hasRegistrySpring }, () => {
    // The CLI keeps its own copy because the registry file is a React module.
    // This is the tripwire that stops the copy drifting silently.
    const src = readFileSync(Z_SPRING, 'utf8')
    // A literal regex, not one built from a template string: `\s` inside a
    // template literal is not an escape sequence and silently collapses to `s`,
    // which makes the pattern match nothing and the tripwire useless.
    const RE = /(\w+):\s*\{[^}]*stiffness:\s*(\d+)[^}]*damping:\s*(\d+)[^}]*mass:\s*(\d+)/g
    const found = new Map<string, { stiffness: number; damping: number; mass: number }>()
    for (const m of src.matchAll(RE)) {
      found.set(m[1]!, { stiffness: +m[2]!, damping: +m[3]!, mass: +m[4]! })
    }

    assert.ok(found.size >= 4, `parsed ${found.size} presets from the registry, expected 4`)
    for (const [name, want] of Object.entries(springs)) {
      const got = found.get(name)
      assert.ok(got, `${name} not found in the registry source`)
      assert.deepEqual(got, want, `${name} drifted from the registry`)
    }
  })

  test('bounce is the only preset that overshoots', () => {
    assert.ok(dampingRatio('bounce') < 1)
    for (const n of ['snap', 'settle', 'fling'] as const) {
      assert.ok(dampingRatio(n) > 0.7, `${n} should be near-critically damped`)
    }
  })
})

describe('spring curve simulation', () => {
  test('bounce overshoots by roughly the documented amount', () => {
    const { overshootPct } = simulateSpring(springs.bounce.stiffness, springs.bounce.damping, springs.bounce.mass)
    // z-spring.ts documents 31%. Semi-implicit Euler at 1ms is not the same
    // integrator motion uses, so this is a tolerance band, not an exact match.
    assert.ok(overshootPct > 25 && overshootPct < 37, `expected roughly 31%, got ${overshootPct.toFixed(1)}%`)
  })

  test('snap, settle and fling overshoot far less than bounce', () => {
    const bounce = simulateSpring(springs.bounce.stiffness, springs.bounce.damping, springs.bounce.mass)
    for (const n of ['snap', 'settle', 'fling'] as const) {
      const { overshootPct } = simulateSpring(springs[n].stiffness, springs[n].damping, springs[n].mass)
      assert.ok(overshootPct < bounce.overshootPct / 4, `${n} overshot ${overshootPct.toFixed(1)}%, too close to bounce`)
    }
  })

  test('reaches 90% before it settles, for an underdamped spring', () => {
    const { t90, settleMs } = simulateSpring(springs.bounce.stiffness, springs.bounce.damping, springs.bounce.mass)
    assert.ok(t90 !== null && t90 < settleMs)
  })

  test('a heavily overdamped spring never overshoots', () => {
    const { overshootPct } = simulateSpring(200, 400, 1)
    assert.equal(overshootPct, 0)
  })

  test('a stiffer spring of the same damping ratio settles faster', () => {
    const slow = simulateSpring(200, 2 * Math.sqrt(200), 1) // zeta = 1
    const fast = simulateSpring(800, 2 * Math.sqrt(800), 1) // zeta = 1, 4x stiffness
    assert.ok(fast.settleMs < slow.settleMs)
  })

  test('regime label matches the damping ratio', () => {
    assert.match(regimeOf(dampingRatioOf(400, 14, 1)), /underdamped/)
    assert.match(regimeOf(dampingRatioOf(200, 2 * Math.sqrt(200), 1)), /critically/)
    assert.match(regimeOf(dampingRatioOf(200, 400, 1)), /overdamped/)
  })

  test('renderCurve produces a rectangular grid at the requested size', () => {
    const { samples } = simulateSpring(springs.snap.stiffness, springs.snap.damping, springs.snap.mass)
    const rows = renderCurve(samples, { width: 40, height: 8, windowMs: 300 })
    assert.equal(rows.length, 8)
    for (const row of rows) assert.equal(row.length, 40)
  })

  test('renderCurve draws something, not a blank grid', () => {
    const { samples } = simulateSpring(springs.bounce.stiffness, springs.bounce.damping, springs.bounce.mass)
    const rows = renderCurve(samples, { width: 40, height: 8, windowMs: 300 })
    assert.ok(rows.some((row) => row.includes('#')))
  })
})

describe('spring retarget against the live registry', () => {
  // The regression test for the audit in docs/specs/2026-08-10-cli-motion-truth.md.
  // `retargetSpring` was written for a prop-default convention no component
  // adopted, and nothing noticed because a zero-change rewrite is silent.
  test('disclosure has no prop-default spring, so a retarget changes nothing', () => {
    const src = readFileSync(
      new URL('../../../registry/components/disclosure/disclosure.tsx', import.meta.url),
      'utf8',
    )
    const { changed } = retargetSpring(src, 'bounce')
    assert.equal(changed, 0)
  })

  test('springOutcome reports a request that matched nothing', () => {
    const msg = springOutcome([{ retargeted: false }, { retargeted: false }], 'bounce')
    assert.match(msg ?? '', /bounce/)
    assert.match(msg ?? '', /no file/i)
  })

  test('springOutcome is silent when something was retargeted', () => {
    assert.equal(springOutcome([{ retargeted: false }, { retargeted: true }], 'bounce'), null)
  })

  test('springOutcome is silent when no spring was requested', () => {
    assert.equal(springOutcome([{ retargeted: false }], undefined), null)
  })
})

describe('URL positionals', () => {
  test('isUrl accepts http and https, rejects names and paths', () => {
    assert.equal(isUrl('https://example.com/r/x.json'), true)
    assert.equal(isUrl('http://example.com/r/x.json'), true)
    assert.equal(isUrl('disclosure'), false)
    assert.equal(isUrl('./registry'), false)
    assert.equal(isUrl('C:/registry'), false)
  })

  test('partitionTargets splits names from URLs, preserving order within each', () => {
    const { names, urls } = partitionTargets([
      'disclosure',
      'https://example.com/r/a.json',
      'scramble-reveal',
    ])
    assert.deepEqual(names, ['disclosure', 'scramble-reveal'])
    assert.deepEqual(urls, ['https://example.com/r/a.json'])
  })
})
