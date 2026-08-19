/**
 * The settings vocabulary shared by the demo, the customize panel and the code
 * panel, plus the snippet writers that turn a settings object into source.
 *
 * This exists as its own module so the emitted code and the running demo read
 * the same values — the customize panel's "writes to code" claim is only true
 * if there is exactly one place that knows what `ease: "snap"` means.
 *
 * The three vocabularies are aliased off the component's own types rather than
 * retyped. A snippet that offers an option the hook would reject is worse than
 * no snippet, and the only way to make that unrepresentable is to have the
 * compiler check the page's controls against the shipped signature.
 */

import {
  SCRAMBLE_SETS,
  type ScrambleEase,
  type ScrambleSetName,
  type ScrambleTrigger,
} from '@/components/z-ui/scramble-reveal'

export type EaseKey = ScrambleEase
export type CharsetKey = ScrambleSetName
export type TriggerKey = ScrambleTrigger

export type ScrambleSettings = {
  duration: number
  ease: EaseKey
  /** The slider's own unit, 0..100. Divided by 100 everywhere it is consumed. */
  chance: number
  charset: CharsetKey
  trigger: TriggerKey
}

export const DEFAULTS: ScrambleSettings = {
  duration: 620,
  ease: 'out',
  chance: 86,
  charset: 'symbols',
  trigger: 'hover',
}

export const DEMO_TEXT = 'scramble reveal'

/* Re-exported, not redeclared. The pool the snippet prints between quotes has
   to be byte-for-byte the pool the demo is drawing from, or the panel is
   writing code that does something else. */
export const CHARSETS = SCRAMBLE_SETS

export const EASE_KEYS: readonly EaseKey[] = ['out', 'in-out', 'snap']
export const CHARSET_KEYS: readonly CharsetKey[] = ['symbols', 'hex', 'binary']

/** What the demo toolbar calls each trigger, versus what the API calls it. */
export const TRIGGERS: readonly { key: TriggerKey; label: string; live: string }[] = [
  { key: 'hover', label: 'hover', live: 'on hover' },
  { key: 'load', label: 'on load', live: 'on load' },
  { key: 'view', label: 'in view', live: 'in view' },
]

import type { Lang } from './highlight'

export type Snippet = {
  key: string
  label: string
  code: string
  /** Which rule set colours it. Carried per snippet because one panel can hold
   *  more than one language — disclosure's third tab is CSS. */
  lang: Lang
}

/**
 * Where `add` puts the file — `components/z-ui/scramble-reveal.tsx` — reached
 * through the alias `init` writes into components.json. It is a path and not a
 * package specifier on purpose: nothing is published to import from, and the
 * file landing in the reader's repository is the entire delivery mechanism.
 */
const IMPORT = '@/components/z-ui/scramble-reveal'

/**
 * Two tabs, both real.
 *
 * The imported design carried four — React, Vue, CSS, Framer Motion — and three
 * of them described a library that does not exist. There is no Vue build, and a
 * port is on the roadmap's explicit "not planned" list, so that tab could not
 * even promise "soon". The effect is an interval rewriting a string one glyph at
 * a time, so there is no property for a stylesheet to interpolate and a pure-CSS
 * version is not a simplification but a fiction. And the component declares no
 * dependencies at all, so a `motion/react` snippet would import a package that
 * `add` never installs.
 *
 * Framework is the wrong axis for a registry that ships one React file. The
 * right one is the two entry points that file actually exports: the component,
 * which owns its own markup, and the hook, for when the markup has to be yours.
 * Both compile against the shipped signature, and both are printed from the
 * settings object the demo above is running.
 */
export function snippetsFor(s: ScrambleSettings): Snippet[] {
  const chars = CHARSETS[s.charset]
  const chance = (s.chance / 100).toFixed(2)

  /* One vocabulary, two spellings. The component takes these as JSX attributes
     and the hook takes them as one object literal; keeping a second list for
     the second tab is how the two start disagreeing about what the panel just
     changed. `chars` is braced rather than quoted because a JSX attribute
     string decodes HTML entities: a pool containing `&` would reach the hook as
     something other than what the panel printed. All three shipped pools are
     safe today, which is exactly why the brace is cheaper than remembering. */
  const fields = [
    { name: 'text', literal: `"${DEMO_TEXT}"`, jsx: `"${DEMO_TEXT}"` },
    { name: 'duration', literal: String(s.duration), jsx: `{${s.duration}}` },
    { name: 'ease', literal: `"${s.ease}"`, jsx: `"${s.ease}"` },
    { name: 'chance', literal: chance, jsx: `{${chance}}` },
    { name: 'chars', literal: `"${chars}"`, jsx: `{"${chars}"}` },
    { name: 'trigger', literal: `"${s.trigger}"`, jsx: `"${s.trigger}"` },
  ]

  const attrs = fields.map((f) => `      ${f.name}=${f.jsx}`).join('\n')
  const options = fields.map((f) => `    ${f.name}: ${f.literal},`).join('\n')

  const component = `import { ScrambleReveal } from "${IMPORT}"

export function Headline() {
  return (
    <ScrambleReveal
      as="h1"
${attrs}
    />
  )
}`

  // The type argument is load-bearing, not decoration: the ref is
  // `RefObject<T | null>`, so leaving `T` at its `HTMLElement` default fails to
  // assign to an `h1` and the snippet would not compile where it was pasted.
  const hook = `import { useScramble } from "${IMPORT}"

export function Headline() {
  // The hook hands back a string, not an element. Reserving the width and
  // naming the result are yours here; <ScrambleReveal> does both for you.
  const { text, ref } = useScramble<HTMLHeadingElement>({
${options}
  })

  return <h1 ref={ref}>{text}</h1>
}`

  return [
    { key: 'component', label: 'component', code: component, lang: 'tsx' },
    { key: 'hook', label: 'hook', code: hook, lang: 'tsx' },
  ]
}
