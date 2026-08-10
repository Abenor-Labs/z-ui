import { Registry, type RegistryItem, type MotionSpring } from '../registry/fetch.ts'
import { readConfig, DEFAULT_REGISTRY } from '../project/config.ts'
import { simulateSpring, dampingRatioOf, regimeOf, renderCurve } from '../ui/spring-curve.ts'
import { intro } from '../ui/art.ts'
import { log, c, UserError } from '../ui/log.ts'

/**
 * What a component's motion is, before you install it.
 *
 * Reads `meta.motion` and nothing else. The data was scanned out of the source
 * at build time, so this does no parsing on the user's machine — a component the
 * scanner could not read never reached the registry in the first place.
 *
 * The curve is the same integration `z-ui spring` draws, which is the same
 * spring-mass-damper `motion` runs. Not an illustration of one.
 */
const WINDOW_MS = 650
const WIDTH = 52
const HEIGHT = 9

export function describeSpring(s: MotionSpring): string {
  const zeta = dampingRatioOf(s.stiffness, s.damping, s.mass)
  const origin = s.preset
    ? `preset ${s.preset}`
    : 'bespoke — tuned for this component, not one of the four presets'
  return `${s.name}  stiffness ${s.stiffness}  damping ${s.damping}  mass ${s.mass}  ζ ${zeta.toFixed(2)}  ${origin}`
}

/**
 * `meta.motion` is written by the generator, so it exists in `web/public/r/` and
 * not in the authoring tree. A contributor pointing `--registry` at
 * `./registry` is reading `component.json` directly, which no longer carries a
 * spring at all — that is the whole point of deriving it. Say so rather than
 * reporting the component as broken.
 */
export function assertPreviewable(item: RegistryItem) {
  if (!item.meta?.motion) {
    throw new UserError(
      `${item.name} carries no motion data.`,
      'Motion data is generated, so a source-tree registry has none. Run `pnpm registry` and point --registry at web/public, or drop --registry to read the published one.',
    )
  }
  return item.meta.motion
}

export async function preview(opts: {
  version: string
  name?: string
  cwd: string
  registry?: string
  json: boolean
}) {
  if (!opts.name) throw new UserError('Which component?', 'z-ui preview <name> — `z-ui list` shows them.')

  const registry = new Registry(opts.registry ?? (await registryBase(opts.cwd)))
  const item = await registry.item(opts.name)
  const motion = assertPreviewable(item)

  if (opts.json) {
    log.raw(JSON.stringify({ name: item.name, states: item.meta.states ?? [], ...motion }, null, 2))
    return
  }

  intro(opts.version, `${item.name} — how it moves`)

  log.line(`  ${c.bold(item.title)}  ${c.grey(item.meta.gesture ?? '')}`)
  log.line(`  ${c.grey(item.description)}`)
  log.line()

  const states = item.meta.states ?? []
  if (states.length) {
    // A set, not a machine. The scanner reads the STATES tuple; it does not and
    // will not infer which state reaches which, because guessing edges is the
    // failure this whole mechanism exists to remove.
    log.line(`  ${c.bold('States')}  ${c.grey(`${states.length}, in declaration order`)}`)
    log.line(`    ${states.map((s) => c.cyan(s)).join(c.grey(' · '))}`)
    log.line()
  }

  for (const s of motion.springs) {
    const stats = simulateSpring(s.stiffness, s.damping, s.mass)
    const zeta = dampingRatioOf(s.stiffness, s.damping, s.mass)
    log.line(`  ${c.bold('Spring')}  ${describeSpring(s)}`)
    log.line(`  ${c.grey(regimeOf(zeta))}`)
    log.line()
    for (const row of renderCurve(stats.samples, { width: WIDTH, height: HEIGHT, windowMs: WINDOW_MS })) {
      log.line(`  ${row}`)
    }
    const overshoot = stats.overshootPct < 0.1 ? '0%' : `${stats.overshootPct.toFixed(1)}%`
    const t90 = stats.t90 === null ? c.yellow('never reaches 90%') : `${stats.t90}ms`
    log.line()
    log.line(`  ${c.grey('t90')} ${t90}  ${c.grey('overshoot')} ${overshoot}  ${c.grey('settle')} ${stats.settleMs}ms`)
    if (s.restDelta !== null || s.restSpeed !== null) {
      log.line(`  ${c.grey(`rest thresholds: delta ${s.restDelta ?? '—'}, speed ${s.restSpeed ?? '—'}`)}`)
    }
    log.line()
  }

  for (const d of motion.durations) {
    log.line(`  ${c.bold('Duration')}  ${c.cyan(d.name)} ${d.ms}ms`)
  }
  if (motion.durations.length) log.line()

  const reduced =
    motion.reducedMotion === 'branch'
      ? `${c.green('✓')} takes a real path under prefers-reduced-motion`
      : `${c.yellow('!')} no reduced-motion branch found`
  log.line(`  ${reduced}`)
  log.line()

  if (item.dependencies.length) {
    log.line(`  ${c.grey(`installs: ${item.dependencies.join(', ')}`)}`)
  }
  for (const f of item.files) log.line(`  ${c.grey(`→ ${f.target ?? f.path}`)}`)
  log.line()
  log.line(c.grey(`  z-ui add ${item.name}`))
  log.line()
}

/** `preview` must work before `init` has run, same as `list`. */
async function registryBase(cwd: string): Promise<string> {
  try {
    return (await readConfig(cwd)).registry
  } catch {
    return DEFAULT_REGISTRY
  }
}
