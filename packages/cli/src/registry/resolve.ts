import type { Registry, RegistryItem } from './fetch.ts'
import { UserError } from '../ui/log.ts'

/**
 * Walk `registryDependencies` and return every item that has to be written,
 * dependencies before dependents, each exactly once.
 *
 * Depth-first with a `visiting` set rather than a plain `seen` set: a cycle in
 * the registry is an authoring mistake that should be reported by name, not
 * something that hangs the CLI or silently drops a file.
 */
export async function resolve(registry: Registry, names: string[]): Promise<RegistryItem[]> {
  const resolved = new Map<string, RegistryItem>()
  const visiting = new Set<string>()
  const order: RegistryItem[] = []

  async function visit(name: string, trail: string[]) {
    if (resolved.has(name)) return
    if (visiting.has(name)) {
      throw new UserError(
        `Circular registry dependency: ${[...trail, name].join(' → ')}`,
        'This is a registry authoring bug, not something you can fix locally.',
      )
    }
    visiting.add(name)

    let item: RegistryItem
    try {
      item = await registry.item(name)
    } catch (e) {
      if (e instanceof UserError && trail.length) {
        throw new UserError(
          `“${name}” is required by “${trail[trail.length - 1]}” but could not be fetched.`,
          e.message,
        )
      }
      throw e
    }

    for (const dep of item.registryDependencies ?? []) {
      await visit(dep, [...trail, name])
    }

    visiting.delete(name)
    resolved.set(name, item)
    order.push(item)
  }

  for (const n of names) await visit(n, [])
  return order
}

/** Every npm package the resolved set needs, deduplicated. */
export function npmDependencies(items: RegistryItem[]): string[] {
  const set = new Set<string>()
  for (const i of items) for (const d of i.dependencies ?? []) set.add(d)
  return [...set].sort()
}
