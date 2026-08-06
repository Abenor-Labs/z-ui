import { Registry } from '../registry/fetch.ts'
import { log, c } from '../ui/log.ts'

/**
 * The command that makes the CLI usable without the website. One request to the
 * index, which the generator enriches with title, spring and states so this does
 * not have to fetch every item to print a useful table.
 */
export async function list(opts: { registry: string; json: boolean }) {
  const registry = new Registry(opts.registry)
  const index = await registry.index()

  const components = index.items.filter((i) => i.type === 'registry:component')
  const primitives = index.items.filter((i) => i.type !== 'registry:component')

  if (opts.json) {
    log.raw(JSON.stringify(index.items, null, 2))
    return
  }

  log.line()
  log.line(`${c.bold(index.name)} ${c.grey(index.version)}  ${c.grey(registry.describe())}`)
  log.line()

  const width = Math.max(...components.map((i) => i.name.length), 10)
  for (const i of components) {
    const spring = i.spring ? c.magenta(i.spring.padEnd(7)) : ' '.repeat(7)
    const states = i.states ? c.grey(`${String(i.states.length).padStart(2)} states`) : ''
    log.line(`  ${c.cyan(i.name.padEnd(width))}  ${spring} ${states}  ${c.grey(i.description ?? '')}`)
  }

  if (primitives.length) {
    log.line()
    log.line(c.grey(`  primitives: ${primitives.map((p) => p.name).join(', ')}`))
    log.line(c.grey('  these install automatically as dependencies'))
  }

  log.line()
  log.line(c.grey(`  ${components.length} components · z-ui add <name>`))
  log.line()
}
