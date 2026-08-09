import { springs, type SpringName } from '../ui/spring-constants.ts'
import { simulateSpring, dampingRatioOf, regimeOf, renderCurve, type CurveStats } from '../ui/spring-curve.ts'
import { intro } from '../ui/art.ts'
import { log, c, UserError } from '../ui/log.ts'

/**
 * `z-ui spring` — see the curve before you commit to it.
 *
 * `--spring <preset>` on `add` is a name you have to already trust; this is
 * the thing no general-purpose registry client can offer, because it has no
 * concept of a spring in the first place. The curve drawn here is the same
 * spring-mass-damper `motion` actually integrates (`z-spring.ts`), not an
 * easing-curve stand-in, so what you see is what installs.
 */
const WINDOW_MS = 650
const WIDTH = 52
const DETAIL_HEIGHT = 12
const COMPACT_HEIGHT = 5

type Physics = { stiffness: number; damping: number; mass: number }

export function spring(opts: {
  version: string
  name?: string
  stiffness?: number
  damping?: number
  mass?: number
}) {
  intro(opts.version, 'see the curve before you choose')

  const custom = opts.stiffness !== undefined || opts.damping !== undefined || opts.mass !== undefined

  if (custom) {
    if (opts.name) {
      throw new UserError(
        `Pass either a preset name or --stiffness/--damping/--mass, not both.`,
      )
    }
    const physics: Physics = {
      stiffness: opts.stiffness ?? 300,
      damping: opts.damping ?? 30,
      mass: opts.mass ?? 1,
    }
    if (physics.stiffness <= 0 || physics.mass <= 0 || physics.damping < 0) {
      throw new UserError('stiffness and mass must be greater than 0, damping cannot be negative.')
    }
    return detailed('custom', physics)
  }

  if (opts.name) {
    if (!(opts.name in springs)) {
      throw new UserError(
        `Unknown preset: ${opts.name}`,
        `Choose one of ${Object.keys(springs).join(', ')}, or pass --stiffness/--damping/--mass for a one-off.`,
      )
    }
    return detailed(opts.name as SpringName, springs[opts.name as SpringName])
  }

  gallery()
}

function detailed(name: string, physics: Physics) {
  const zeta = dampingRatioOf(physics.stiffness, physics.damping, physics.mass)
  const stats = simulateSpring(physics.stiffness, physics.damping, physics.mass)

  log.line(
    `  ${c.bold(name)}  ${c.grey(`stiffness ${physics.stiffness}  damping ${physics.damping}  mass ${physics.mass}`)}`,
  )
  log.line(`  ${c.grey(`ζ ${zeta.toFixed(2)}  ${regimeOf(zeta)}`)}`)
  log.line()
  for (const row of renderCurve(stats.samples, { width: WIDTH, height: DETAIL_HEIGHT, windowMs: WINDOW_MS })) {
    log.line(`  ${row}`)
  }
  log.line()
  log.line(`  ${statLine(stats)}`)
  log.line()
  if (name !== 'custom') {
    log.line(c.grey(`  z-ui add <name> --spring ${name}`))
    log.line()
  }
}

function gallery() {
  log.line(`${c.bold('  z-ui spring')}  ${c.grey(`every preset, same ${WINDOW_MS}ms window`)}`)

  for (const name of Object.keys(springs) as SpringName[]) {
    const physics = springs[name]
    const zeta = dampingRatioOf(physics.stiffness, physics.damping, physics.mass)
    const stats = simulateSpring(physics.stiffness, physics.damping, physics.mass)

    log.line()
    log.line(`  ${c.bold(name.padEnd(7))} ${c.grey(`ζ ${zeta.toFixed(2)}`)}   ${statLine(stats)}`)
    for (const row of renderCurve(stats.samples, { width: WIDTH, height: COMPACT_HEIGHT, windowMs: WINDOW_MS })) {
      log.line(`  ${row}`)
    }
  }

  log.line()
  log.line(c.grey(`  z-ui spring <name>              one preset, full detail`))
  log.line(c.grey(`  z-ui spring --stiffness 300 --damping 20 --mass 1   a one-off, before it ships in a component`))
  log.line()
}

// Labels are wrapped individually and joined with plain spaces, never nested
// inside one another's call: `wrap()` closes to the terminal default (39),
// not to whatever colour was open before it, so a coloured value nested
// inside a grey label would reset to default at the value's close and leave
// the rest of the line uncoloured.
function statLine(stats: CurveStats): string {
  const t90 = stats.t90 === null ? c.yellow('never reaches 90%') : `${stats.t90}ms`
  const overshoot = stats.overshootPct < 0.1 ? '0%' : `${stats.overshootPct.toFixed(1)}%`
  const settle = stats.unsettled ? c.yellow(`>${stats.settleMs}ms`) : `${stats.settleMs}ms`
  return `${c.grey('t90')} ${t90}  ${c.grey('overshoot')} ${overshoot}  ${c.grey('settle')} ${settle}`
}
