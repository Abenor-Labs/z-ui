import { interactive, isInteractive, type Key } from './tty.ts'
import { c } from './log.ts'

export type Choice = {
  value: string
  label: string
  hint?: string
  tag?: string
  /** Extra text matched when filtering, never displayed. */
  search?: string
}

const VISIBLE = 9

function chrome(title: string, help: string, body: string, footer: string) {
  const bar = c.grey('│')
  return [
    '',
    `  ${c.grey('┌')} ${c.bold(title)}   ${c.grey(help)}`,
    `  ${bar}`,
    ...body.split('\n').map((l) => `  ${bar}  ${l}`),
    `  ${bar}`,
    `  ${c.grey('└')} ${footer}`,
    '',
  ].join('\n')
}

/** The window of items to draw, kept centred on the cursor. */
export function window<T>(items: T[], cursor: number, size = VISIBLE) {
  if (items.length <= size) return { slice: items, offset: 0 }
  const half = Math.floor(size / 2)
  const offset = Math.max(0, Math.min(items.length - size, cursor - half))
  return { slice: items.slice(offset, offset + size), offset }
}

export function matches(choice: Choice, query: string) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    choice.value.toLowerCase().includes(q) ||
    choice.label.toLowerCase().includes(q) ||
    (choice.hint ?? '').toLowerCase().includes(q) ||
    (choice.search ?? '').toLowerCase().includes(q)
  )
}

/**
 * Multi-select with type-to-filter.
 *
 * Filtering rebuilds the visible list, so the cursor is clamped rather than
 * preserved by index — the selection lives in a Set keyed by value, which is
 * what lets a filter narrow the list without losing what you already ticked.
 */
export async function multiselect(opts: {
  title: string
  choices: Choice[]
  initial?: string[]
  width?: number
}): Promise<string[]> {
  if (!isInteractive()) {
    throw new Error('Cannot show a picker without an interactive terminal. Name components, or pass --yes.')
  }

  const chosen = new Set(opts.initial ?? [])
  let query = ''
  let cursor = 0

  const width = opts.width ?? Math.max(...opts.choices.map((ch) => ch.value.length)) + 2
  const filtered = () => opts.choices.filter((ch) => matches(ch, query))

  const draw = () => {
    const list = filtered()
    if (cursor >= list.length) cursor = Math.max(0, list.length - 1)

    if (!list.length) {
      return chrome(
        opts.title,
        '↑↓ move · space toggle · enter confirm',
        c.grey(`no match for “${query}”`),
        c.grey('backspace to clear'),
      )
    }

    const { slice, offset } = window(list, cursor)
    const rows = slice.map((ch, i) => {
      const index = offset + i
      const active = index === cursor
      const on = chosen.has(ch.value)
      const pointer = active ? c.cyan('❯') : ' '
      const box = on ? c.cyan('◉') : c.grey('◯')
      const name = active ? c.cyan(ch.value.padEnd(width)) : ch.value.padEnd(width)
      const tag = ch.tag ? c.magenta(ch.tag.padEnd(8)) : ''
      const hint = ch.hint ? c.grey(ch.hint) : ''
      return `${pointer} ${box} ${name} ${tag} ${hint}`
    })

    if (offset > 0) rows.unshift(c.grey(`    ↑ ${offset} more`))
    if (offset + slice.length < list.length) {
      rows.push(c.grey(`    ↓ ${list.length - offset - slice.length} more`))
    }

    const footer = [
      chosen.size ? c.cyan(`${chosen.size} selected`) : c.grey('none selected'),
      query ? c.grey(`filter: ${query}`) : c.grey('type to filter'),
      c.grey('a all · enter confirm'),
    ].join(c.grey(' · '))

    return chrome(opts.title, '↑↓ move · space toggle · enter confirm', rows.join('\n'), footer)
  }

  return interactive<string[]>(draw, (key: Key, done) => {
    const list = filtered()
    const name = key.name

    if (name === 'return') return done([...chosen])
    if (name === 'escape') return done([])

    if (name === 'up' || (key.ctrl && name === 'p')) cursor = cursor > 0 ? cursor - 1 : Math.max(0, list.length - 1)
    else if (name === 'down' || (key.ctrl && name === 'n')) cursor = list.length ? (cursor + 1) % list.length : 0
    else if (name === 'space') {
      const item = list[cursor]
      if (item) chosen.has(item.value) ? chosen.delete(item.value) : chosen.add(item.value)
    } else if (name === 'backspace') query = query.slice(0, -1)
    else if (name === 'a' && !key.ctrl && !query) {
      // Only when not filtering, so "a" stays usable as a search character.
      const all = list.every((ch) => chosen.has(ch.value))
      for (const ch of list) (all ? chosen.delete(ch.value) : chosen.add(ch.value))
    } else if (key.sequence && key.sequence.length === 1 && key.sequence >= ' ' && !key.ctrl && !key.meta) {
      query += key.sequence
      cursor = 0
    }
  })
}

/** Single-select, same chrome, no checkboxes. */
export async function select(opts: {
  title: string
  choices: Choice[]
  initial?: string
}): Promise<string | null> {
  if (!isInteractive()) throw new Error('Cannot show a picker without an interactive terminal.')

  const width = Math.max(...opts.choices.map((ch) => ch.value.length)) + 2
  let cursor = Math.max(0, opts.choices.findIndex((ch) => ch.value === opts.initial))

  const draw = () => {
    const { slice, offset } = window(opts.choices, cursor)
    const rows = slice.map((ch, i) => {
      const active = offset + i === cursor
      const pointer = active ? c.cyan('❯') : ' '
      const name = active ? c.cyan(ch.value.padEnd(width)) : ch.value.padEnd(width)
      return `${pointer} ${name} ${ch.hint ? c.grey(ch.hint) : ''}`
    })
    return chrome(opts.title, '↑↓ move · enter select', rows.join('\n'), c.grey('esc to skip'))
  }

  return interactive<string | null>(draw, (key, done) => {
    if (key.name === 'return') return done(opts.choices[cursor]?.value ?? null)
    if (key.name === 'escape') return done(null)
    if (key.name === 'up') cursor = cursor > 0 ? cursor - 1 : opts.choices.length - 1
    if (key.name === 'down') cursor = (cursor + 1) % opts.choices.length
  })
}

/** Yes/no on a single keypress, matching the chrome of the pickers. */
export async function toggle(question: string, initial = true): Promise<boolean> {
  if (!isInteractive()) return initial
  let value = initial
  const draw = () => {
    const yes = value ? c.cyan('◉ yes') : c.grey('◯ yes')
    const no = value ? c.grey('◯ no') : c.cyan('◉ no')
    return chrome(question, '←→ change · enter confirm', `${yes}    ${no}`, c.grey('y / n'))
  }
  return interactive<boolean>(draw, (key, done) => {
    const n = key.name
    if (n === 'return') return done(value)
    if (n === 'left' || n === 'right' || n === 'tab' || n === 'space') value = !value
    if (n === 'y') return done(true)
    if (n === 'n') return done(false)
  })
}
