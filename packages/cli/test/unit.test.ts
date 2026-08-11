import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { rewriteImports, resolveTarget } from '../src/project/write.ts'
import { validate, guessConfig, DEFAULT_REGISTRY } from '../src/project/config.ts'
import { digest, verify } from '../src/registry/verify.ts'
import { installCommand } from '../src/project/deps.ts'
import type { Config } from '../src/project/config.ts'
import type { RegistryItem } from '../src/registry/fetch.ts'
import { isUrl } from '../src/registry/fetch.ts'
import { UserError } from '../src/ui/log.ts'
import { retargetSpring, assertPreset, springOutcome, springRefusal } from '../src/project/spring.ts'
import { matches, window } from '../src/ui/select.ts'
import { nearest, partitionTargets, unknownHint, canInstallHere } from '../src/commands/add.ts'
import { doctorReport, hasReducedMotionBranch } from '../src/commands/doctor.ts'
import { completionScript } from '../src/commands/completion.ts'
import { describeSpring, assertPreviewable } from '../src/commands/preview.ts'
import { springs, dampingRatio } from '../src/ui/spring-constants.ts'
import { simulateSpring, dampingRatioOf, regimeOf, renderCurve } from '../src/ui/spring-curve.ts'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
 * The spring scale and the reduced-motion shape both exist twice: once here in
 * the CLI, which ships alone, and once in `scripts/motion-scan.mjs`, which the
 * generator and the linter share. A copy that can silently drift is worse than
 * no copy; a copy with a tripwire is fine.
 *
 * This replaces a cross-check against `registry/lib/z-spring/z-spring.ts`,
 * deleted in the 2026-08-09 registry clear-out. That test skipped rather than
 * failed, so the scale went unverified for weeks and the skip was invisible in
 * a passing run. The scanner is a live anchor and cannot be deleted without
 * breaking the build, so this asserts unconditionally.
 */
const SCANNER = new URL('../../../scripts/motion-scan.mjs', import.meta.url)

describe('CLI copies stay in step with scripts/motion-scan.mjs', () => {
  test('every preset matches the scanner’s scale', async () => {
    const { PRESETS } = (await import(SCANNER.href)) as {
      PRESETS: Record<string, { stiffness: number; damping: number; mass: number }>
    }
    assert.deepEqual(Object.keys(PRESETS).sort(), Object.keys(springs).sort())
    for (const [name, want] of Object.entries(PRESETS)) {
      assert.deepEqual({ ...springs[name as keyof typeof springs] }, want, `${name} drifted`)
    }
  })

  test('the reduced-motion matcher agrees with the scanner on real source', async () => {
    const { readReducedMotion, stripComments } = (await import(SCANNER.href)) as {
      readReducedMotion: (s: string) => string | null
      stripComments: (s: string) => string
    }
    const src = readFileSync(
      new URL('../../../registry/components/disclosure/disclosure.tsx', import.meta.url),
      'utf8',
    )
    assert.equal(hasReducedMotionBranch(src), readReducedMotion(stripComments(src)) === 'branch')
    assert.equal(hasReducedMotionBranch(src), true)
  })
})

describe('spring constants', () => {
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

describe('doctor --json', () => {
  test('report shape carries findings, missing deps and a count', () => {
    const report = doctorReport(
      [
        { level: 'warn', name: 'disclosure', message: 'no reduced-motion branch' },
        { level: 'ok', name: 'scramble-reveal', message: 'unmodified' },
      ],
      ['motion'],
      2,
    )
    assert.equal(report.installed, 2)
    assert.deepEqual(report.missingDependencies, ['motion'])
    assert.equal(report.findings.length, 2)
    assert.equal(report.warnings, 1)
  })

  test('serialises to parseable JSON with nothing decorative in it', () => {
    const json = JSON.stringify(doctorReport([], [], 0))
    const back = JSON.parse(json)
    assert.deepEqual(back, { installed: 0, warnings: 0, findings: [], missingDependencies: [] })
  })
})

describe('guessConfig', () => {
  test('a src/ layout prefixes every alias path but no import specifier', () => {
    const g = guessConfig({ srcDir: true, tsx: true }, undefined)
    assert.equal(g.aliases.components.path, 'src/components/z-ui')
    assert.equal(g.aliases.components.import, '@/components/z-ui')
    assert.equal(g.aliases.hooks.path, 'src/hooks')
    assert.equal(g.aliases.lib.path, 'src/lib')
  })

  test('a root layout leaves paths unprefixed', () => {
    const g = guessConfig({ srcDir: false, tsx: true }, undefined)
    assert.equal(g.aliases.components.path, 'components/z-ui')
  })

  test('an explicit registry overrides the default', () => {
    assert.equal(guessConfig({ srcDir: false, tsx: true }, './registry').registry, './registry')
    assert.equal(guessConfig({ srcDir: false, tsx: true }, undefined).registry, DEFAULT_REGISTRY)
  })

  test('a JavaScript project is recorded as such', () => {
    assert.equal(guessConfig({ srcDir: false, tsx: false }, undefined).tsx, false)
  })
})

describe('completion', () => {
  for (const shell of ['bash', 'zsh', 'fish'] as const) {
    test(`${shell} script names every command`, () => {
      const script = completionScript(shell)
      for (const cmd of ['init', 'add', 'list', 'doctor', 'spring', 'completion']) {
        assert.match(script, new RegExp(`\\b${cmd}\\b`))
      }
    })
  }

  test('an unknown shell is a UserError, not a crash', () => {
    assert.throws(() => completionScript('powershell' as never), /powershell/)
  })
})

describe('preview', () => {
  const spring = {
    name: 'SPRING', stiffness: 520, damping: 46, mass: 1,
    restDelta: 2, restSpeed: 20, preset: null,
  }

  test('describes a bespoke spring by its numbers, not by a preset name', () => {
    assert.match(describeSpring(spring), /520/)
    assert.match(describeSpring(spring), /bespoke/i)
  })

  test('names the preset when the numbers match one exactly', () => {
    assert.match(describeSpring({ ...spring, stiffness: 500, damping: 40, preset: 'snap' }), /snap/)
  })

  test('a component with no motion data is reported, not rendered blank', () => {
    // The hint is a field on UserError, not part of the message, so it has to
    // be read off the thrown value rather than matched by assert.throws.
    const hintFor = (sourceTree: boolean) => {
      try {
        assertPreviewable({ name: 'x', meta: {} } as never, sourceTree)
      } catch (e) {
        return (e as UserError).hint ?? ''
      }
      return assert.fail('expected assertPreviewable to throw')
    }
    assert.match(hintFor(true), /pnpm registry/)
    // A published registry cannot be fixed locally, so it must not be told to.
    assert.match(hintFor(false), /republishing/)
    assert.doesNotMatch(hintFor(false), /pnpm registry/)
  })
})

describe('springRefusal', () => {
  const bespoke = { name: 'SPRING', stiffness: 520, damping: 46, mass: 1, restDelta: 2, restSpeed: 20, preset: null }
  const preset = { name: 'SPRING', stiffness: 500, damping: 40, mass: 1, restDelta: null, restSpeed: null, preset: 'snap' as const }
  const item = (springs: unknown[]) =>
    ({ name: 'disclosure', meta: { motion: { springs, durations: [], reducedMotion: 'branch' } } }) as never

  test('refuses when every spring is bespoke, naming the numbers', () => {
    const msg = springRefusal(item([bespoke]), 'bounce')
    assert.match(msg ?? '', /520/)
    assert.match(msg ?? '', /46/)
  })

  test('allows a preset spring through', () => {
    assert.equal(springRefusal(item([preset]), 'bounce'), null)
  })

  test('refuses a component with no spring at all', () => {
    assert.match(springRefusal(item([]), 'bounce') ?? '', /no spring/i)
  })

  test('says nothing about a component with no motion data', () => {
    assert.equal(springRefusal({ name: 'x', meta: {} } as never, 'bounce'), null)
  })
})

describe('reduced-motion audit', () => {
  const src = `const reduced = useReducedMotion() ?? false
    if (reduced) { height.jump(target); return }`

  test('accepts source that binds a hook and branches on it', () => {
    assert.equal(hasReducedMotionBranch(src), true)
  })

  test('rejects source where the branch was edited out', () => {
    assert.equal(hasReducedMotionBranch(src.replace('if (reduced)', 'if (false)')), false)
  })

  test('rejects source where the hook was replaced by a literal', () => {
    assert.equal(hasReducedMotionBranch('const reduced = false\n if (reduced) {}'), false)
  })

  test('accepts a locally-defined hook, not just motion’s', () => {
    assert.equal(
      hasReducedMotionBranch('const reduced = usePrefersReducedMotion()\n if (reduced || x) {}'),
      true,
    )
  })
})

describe('first contact', () => {
  test('a short registry is named inline rather than deferred to another command', () => {
    const hint = unknownHint(['disclosure', 'hold-drain', 'late-critique', 'scramble-reveal'])
    assert.match(hint, /disclosure/)
    assert.match(hint, /scramble-reveal/)
    assert.doesNotMatch(hint, /z-ui list/)
  })

  test('a long registry defers, and says how long', () => {
    const many = Array.from({ length: 20 }, (_, i) => `c${i}`)
    const hint = unknownHint(many)
    assert.match(hint, /z-ui list/)
    assert.match(hint, /20/)
  })

  test('an empty registry does not print an empty list', () => {
    assert.match(unknownHint([]), /z-ui list/)
  })

  /**
   * The regression test for the worst thing a first-contact walkthrough turned
   * up. Run in a folder with no package.json, npm resolved upward and wrote
   * "motion" into the home directory of the machine under test — a dependency
   * added to an unrelated project the user never pointed the tool at.
   *
   * `fileURLToPath`, not `URL.pathname`: on Windows the latter yields
   * "/D:/..." and the leading slash has to be hand-stripped, which is the kind
   * of platform guesswork that makes a test pass for the wrong reason.
   */
  test('installing is refused where there is no package.json to anchor to', () => {
    const cliPackageDir = fileURLToPath(new URL('..', import.meta.url))
    assert.equal(canInstallHere(cliPackageDir), true)
    assert.equal(canInstallHere(fileURLToPath(new URL('../src/ui', import.meta.url))), false)
  })
})
