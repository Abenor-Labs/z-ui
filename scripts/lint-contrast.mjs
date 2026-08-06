/**
 * Contrast lint.
 *
 * Colour in this repo is shipped, not rendered. A contrast mistake in a
 * registry component is not a mistake on our site, it is a mistake in every
 * project that ran `add`, and it arrives there as a file we can no longer
 * touch. So this is CI rather than a review note. Every rule below is a scar:
 *
 *   - `iconVariants` was picked against the ink chassis, where #a3a3a3 sits at
 *     7.8:1 and looks deliberate. The CLI drops that same file into a white
 *     app, where it is 2.5:1 and the unliked heart is nearly gone. Registry
 *     colour is therefore checked against a light surface too. Our ground is
 *     not the contract.
 *   - `--color-muted` is the colour of every label and every description on the
 *     site, and it misses 4.5:1 on all three panels. Nothing caught it because
 *     nothing looked.
 *   - A contrast linter that parses nothing passes everything, which is the
 *     worst failure mode available to it: green, and lying. Hence the guards
 *     that fail when the @theme block does not match, when a token has no
 *     declared pair, when the dark surface token goes missing, and when a hex
 *     sits somewhere no state can be attributed to it.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = join(ROOT, 'registry')
const GLOBALS = join(ROOT, 'web', 'app', 'globals.css')
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const json = (p) => JSON.parse(read(p))
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/')

const failures = []
const fail = (where, msg) => failures.push({ where, msg })
let checks = 0
let registryColours = 0
const check = (ok, where, msg) => {
  checks++
  if (!ok) fail(where, msg)
  return ok
}

// ---- report --------------------------------------------------------------
// A function rather than a tail block, because the parser guards below have to
// be able to give up: with no tokens there is nothing left to say, and forty
// cascading messages would bury the one that matters.
const report = () => {
  if (failures.length) {
    console.error(`\ncontrast lint: ${failures.length} failure(s) across ${checks} checks\n`)
    for (const f of failures) console.error(`  ${f.where}: ${f.msg}`)
    console.error('')
    process.exit(1)
  }
  console.log(
    `contrast lint clean: ${checks} checks across ${PAIRS.length} declared pairs and ${registryColours} registry colours`,
  )
  process.exit(0)
}

// ---- colour maths --------------------------------------------------------
/**
 * WCAG 2.x, transcribed rather than approximated.
 *
 * The two numbers people get wrong are both here. The linearisation threshold
 * is 0.03928, not 0.04045: 0.04045 is the mathematically consistent value and
 * the sRGB standard's, but WCAG 2.x prints 0.03928 and every conforming
 * checker uses it, so a ratio computed the "correct" way disagrees with the
 * tool an auditor will run. The exponent is 2.4 applied after the
 * (c + 0.055) / 1.055 offset, not a bare 2.2 gamma; using 2.2 shifts mid greys
 * by enough to move a 4.4 across the line.
 */
const LIN = (v) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]) => 0.2126 * LIN(r) + 0.7152 * LIN(g) + 0.0722 * LIN(b)

const HEX = /^#([0-9a-fA-F]{3,8})$/
const parse = (hex) => {
  const m = HEX.exec(hex)
  if (!m) return null
  const h = m[1].length <= 4 ? [...m[1]].map((c) => c + c).join('') : m[1]
  if (h.length !== 6 && h.length !== 8) return null
  const at = (i) => parseInt(h.slice(i, i + 2), 16)
  return { rgb: [at(0), at(2), at(4)], a: h.length === 8 ? at(6) / 255 : 1 }
}

/**
 * Contrast is defined between two opaque colours, so a translucent foreground
 * is composited over its surface first. Without this an #rrggbbaa would report
 * the ratio of its fully-opaque form, which is the flattering answer.
 */
const ratio = (fgHex, bgHex) => {
  const fg = parse(fgHex)
  const bg = parse(bgHex)
  const composited = fg.rgb.map((v, i) => v * fg.a + bg.rgb[i] * (1 - fg.a))
  const [hi, lo] = [luminance(composited), luminance(bg.rgb)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}
const fmt = (r) => `${r.toFixed(2)}:1`

// 1.4.3 for text, 1.4.11 for anything else that carries meaning: an icon, a
// focus ring, the border that tells you a chip is a control.
const FLOOR = { text: 4.5, ui: 3 }
const NOUN = { text: 'text', ui: 'non-text' }

/**
 * Scope split.
 *
 * web/ is checked against dark surfaces only. globals.css sets
 * `color-scheme: dark` and paints chassis onto html; there is no light theme
 * for these tokens to be wrong in, and inventing one would generate failures
 * for a rendering that does not exist and cannot be fixed.
 *
 * registry/ gets both, because the registry's entire premise is that the file
 * leaves here. The dark surface is the chassis token read from globals.css,
 * since that is where these components are actually demonstrated. The light
 * surface is a literal #ffffff, deliberately not read from any file in this
 * repo: a consumer's background is not ours to know, and white is the floor
 * case that a default Tailwind app lands on.
 */
const LIGHT_CONSUMER = '#ffffff'

/**
 * Which pairs are real.
 *
 * Seven tokens make 42 ordered pairs, of which about a dozen ever render
 * together. Checking the product would fail on combinations nobody writes, and
 * the standard response to a linter that cries wolf is to lower its
 * thresholds, which is worse than not having one.
 *
 * So this list is declared by hand, and it is worth being plain about why
 * inference was not an option rather than implying the tool is cleverer than
 * it is. A foreground and its background meet in the rendered DOM, not in one
 * file. `text-muted` in catalog-card.tsx lands on a `bg-panel` set by the
 * card's own root; `.lbl` sets a colour from CSS with no utility anywhere;
 * code-panel.tsx chooses between `text-mint` and `text-muted` inside a
 * ternary. Resolving those statically means evaluating the component tree,
 * which is a renderer, not a linter.
 *
 * What *is* inferable is whether the list is complete, and that is what the
 * four completeness rules at the bottom of this file do. A declared list is
 * only trustworthy when forgetting to declare is itself a failure.
 *
 * `kind: 'decorative'` is an exemption, not a pass, and it costs a `why`.
 */
const PAIRS = [
  // --- the page ground ---------------------------------------------------
  { fg: 'ink', bg: 'chassis', kind: 'text', role: 'body copy and headings' },
  { fg: 'muted', bg: 'chassis', kind: 'text', role: 'lbl labels, lead paragraphs, footer' },
  { fg: 'accent', bg: 'chassis', kind: 'text', role: 'section index, install path label' },
  { fg: 'accent', bg: 'chassis', kind: 'ui', role: 'focus ring, hovered CTA border' },
  {
    fg: 'rule',
    bg: 'chassis',
    kind: 'decorative',
    role: 'section rules and the fading header hairline',
    why: '1.4.11 exempts boundaries that carry no information; these separate sections that whitespace already separates, and removing them loses nothing but taste',
  },
  {
    fg: 'hair',
    bg: 'chassis',
    kind: 'decorative',
    role: 'the quieter of the two rules, used between rows inside a section',
    why: 'same exemption as rule, one step fainter; it never carries state or boundary information a reader must perceive',
  },

  // --- surface: the stack bar, footer, and every card footer -------------
  { fg: 'ink', bg: 'surface', kind: 'text', role: 'component titles in card footers, footer wordmark' },
  { fg: 'muted', bg: 'surface', kind: 'text', role: 'footer links, category and state chips' },
  { fg: 'accent', bg: 'surface', kind: 'text', role: 'hovered footer title, active filter label' },
  { fg: 'accent', bg: 'surface', kind: 'ui', role: 'active category chip border' },
  {
    fg: 'hair',
    bg: 'surface',
    kind: 'decorative',
    role: 'the divider between a card body and its footer',
    why: 'the footer is already separated by its own background; this hairline is taste, not information',
  },

  // --- panels: catalog cards, bench, code, install ------------------------
  { fg: 'ink', bg: 'panel', kind: 'text', role: 'component names, inline code, readouts' },
  { fg: 'muted', bg: 'panel', kind: 'text', role: 'descriptions, lbl, inactive tab labels' },
  { fg: 'accent', bg: 'panel', kind: 'text', role: 'data-state readout, active tab, selector column' },
  { fg: 'accent', bg: 'panel', kind: 'ui', role: 'active chip border, lit indicator dot, card hover ring' },
  { fg: 'muted', bg: 'panel', kind: 'ui', role: 'chip hover border' },
  { fg: 'control', bg: 'chassis', kind: 'ui', role: 'resting control border on the page ground' },
  { fg: 'control', bg: 'surface', kind: 'ui', role: 'resting control border in footers and bars' },
  { fg: 'control', bg: 'panel-2', kind: 'ui', role: 'resting control border inside a demo' },
  {
    fg: 'rule',
    bg: 'panel',
    kind: 'decorative',
    role: 'table and bench row rules',
    why: 'the states table has a header and aligned columns; these rules only reduce tracking effort and carry no state',
  },
  {
    fg: 'control',
    bg: 'panel',
    kind: 'ui',
    // Not decorative, and this is the distinction the whole kind field exists
    // for: the same colour draws the table rules (which are) and the resting
    // chip border and the unlit indicator dot (which are not). A chip border
    // is the only thing saying that chip is a control.
    role: 'resting chip border, unlit indicator dot',
  },
  {
    fg: 'hair',
    bg: 'panel',
    kind: 'decorative',
    role: 'row dividers inside the states table and the bench',
    why: 'the table has a header and aligned columns; the rules only reduce tracking effort',
  },

  // --- panel-2: the inner chrome of a demo -------------------------------
  { fg: 'ink', bg: 'panel-2', kind: 'text', role: 'command palette input, toast body' },
  { fg: 'muted', bg: 'panel-2', kind: 'text', role: 'placeholder text, keyboard badges' },

  // --- accent as a fill ---------------------------------------------------
  // The morph button and ::selection both paint accent as a surface. The
  // dark-only rule elsewhere is about the absence of a light theme, not about
  // refusing bright surfaces that genuinely exist.
  { fg: 'chassis', bg: 'accent', kind: 'text', role: 'CTA label on hover fill in spring-race' },
]

// ---- tokens --------------------------------------------------------------
const css = read(GLOBALS)
// Tailwind v4 allows several @theme blocks and several modifiers (`inline`,
// `static`, `reference`). Matching only the first silently halves the token
// set, and a linter that checks half of what it claims to is worse than one
// that fails loudly.
const themeBlocks = [...css.matchAll(/@theme[^{]*\{([\s\S]*?)\n\}/g)]
if (
  !check(
    themeBlocks.length > 0,
    rel(GLOBALS),
    'no @theme block matched; the token parser would silently check nothing',
  )
) {
  report()
}

const tokens = new Map()
for (const block of themeBlocks) {
  for (const m of block[1].matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens.set(m[1], m[2])
  }
}
if (!check(tokens.size > 0, rel(GLOBALS), 'no --color-* tokens found inside @theme')) report()

/**
 * Ramp steps are palette, not colour-in-use. A step becomes a real colour only
 * when a semantic token points at it, and it is the semantic token that carries
 * a contrast story. Demanding a declared pair per step would mean 23 entries
 * describing combinations nobody writes.
 *
 * The exemption is not free. A ramp step referenced by nothing is dead weight
 * that will eventually get reached for precisely because it is there, so every
 * step must be cited by a semantic token or deleted.
 */
const RAMP = /^(grey|sand)-\d+$/
const semanticValues = new Set()
for (const [name, hex] of tokens) if (!RAMP.test(name)) semanticValues.add(hex.toLowerCase())
for (const m of css.matchAll(/--z-[\w-]+:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  semanticValues.add(m[1].toLowerCase())
}
for (const [name, hex] of tokens) {
  if (!RAMP.test(name)) continue
  check(
    semanticValues.has(hex.toLowerCase()),
    rel(GLOBALS),
    `--color-${name} (${hex}) is a ramp step no semantic token points at; cite it or delete it`,
  )
}

// ---- rule C: no pair may name a token that is not there -------------------
// Runs first because a renamed token otherwise surfaces as a crash in the
// maths instead of a sentence about the rename.
const live = PAIRS.filter((p) => {
  const missing = [p.fg, p.bg].filter((t) => !tokens.has(t))
  const ok = check(
    missing.length === 0,
    'PAIRS',
    `pair "${p.fg} on ${p.bg}" names unknown token "${missing[0]}"; the pair is stale or the token was renamed`,
  )
  if (p.kind === 'decorative') {
    check(
      typeof p.why === 'string' && p.why.length > 0,
      'PAIRS',
      `pair "${p.fg} on ${p.bg}" is decorative but says nothing about why 1.4.11 does not apply`,
    )
  }
  return ok
})

// ---- web: declared pairs, dark surfaces only ------------------------------
for (const p of live) {
  if (p.kind === 'decorative') continue
  const fg = tokens.get(p.fg)
  const bg = tokens.get(p.bg)
  const r = ratio(fg, bg)
  check(
    r >= FLOOR[p.kind],
    'web',
    `${p.fg} on ${p.bg} is ${fmt(r)}, below the ${FLOOR[p.kind]}:1 floor for ${NOUN[p.kind]} (${fg} on ${bg}) — ${p.role}`,
  )
}

// ---- theme pairs: the tokens registry components actually consume ---------
/**
 * `--z-*` are declared in :root and .light, not in @theme, because @theme
 * cannot be nested in a class and the switch has to live somewhere. That puts
 * them outside every parser above, which meant the one decision the spec is
 * loudest about — components ship light AND dark — was enforced by nothing.
 *
 * Each theme is measured independently. A pair that passes in dark and fails
 * in light is a failure: the file leaves here and lands in an app whose
 * background is not ours to choose.
 */
const THEME_PAIRS = [
  { fg: 'fg', bg: 'bg', kind: 'text', role: 'component body text' },
  { fg: 'fg', bg: 'panel', kind: 'text', role: 'component text on a panel' },
  { fg: 'fg', bg: 'fill', kind: 'text', role: 'label inside a control' },
  { fg: 'fg', bg: 'fill-hover', kind: 'text', role: 'label inside a hovered control' },
  { fg: 'fg-muted', bg: 'bg', kind: 'text', role: 'secondary text' },
  { fg: 'fg-muted', bg: 'panel', kind: 'text', role: 'secondary text on a panel' },
  { fg: 'fg-muted', bg: 'fill', kind: 'text', role: 'secondary text in a control' },
  { fg: 'fg-muted', bg: 'fill-hover', kind: 'text', role: 'secondary text, hovered' },
  { fg: 'border', bg: 'bg', kind: 'ui', role: 'control boundary on the ground' },
  { fg: 'border', bg: 'panel', kind: 'ui', role: 'control boundary on a panel' },
  { fg: 'border', bg: 'fill', kind: 'ui', role: 'control boundary on a control' },
  { fg: 'border', bg: 'fill-hover', kind: 'ui', role: 'control boundary, hovered' },
  { fg: 'signal', bg: 'bg', kind: 'ui', role: 'the moving part' },
  { fg: 'on-signal', bg: 'signal', kind: 'text', role: 'glyph inside a filled indicator' },
  { fg: 'focus', bg: 'bg', kind: 'ui', role: 'focus ring' },
]

const themeRule = (selector) => {
  const m = css.match(new RegExp(`${selector}[^{]*\\{([\\s\\S]*?)\\n\\}`))
  if (!m) return null
  const out = new Map()
  for (const t of m[1].matchAll(/--z-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out.set(t[1], t[2])
  return out
}

for (const [selector, label] of [
  [':root', 'dark'],
  ['\\.light', 'light'],
]) {
  const theme = themeRule(selector)
  if (
    !check(
      theme && theme.size > 0,
      rel(GLOBALS),
      `no --z-* tokens found in ${label}; component theme pairs are unchecked`,
    )
  ) {
    continue
  }
  for (const p of THEME_PAIRS) {
    const fg = theme.get(p.fg)
    const bg = theme.get(p.bg)
    if (
      !check(
        fg && bg,
        rel(GLOBALS),
        `${label}: pair "${p.fg} on ${p.bg}" names a --z-* token that is not declared`,
      )
    ) {
      continue
    }
    const r = ratio(fg, bg)
    check(
      r >= FLOOR[p.kind],
      `theme:${label}`,
      `${p.fg} on ${p.bg} is ${fmt(r)}, below the ${FLOOR[p.kind]}:1 floor for ${NOUN[p.kind]} (${fg} on ${bg}) — ${p.role}`,
    )
  }
}

// ---- registry: literal hexes, both surfaces -------------------------------
/**
 * Registry colour lives in the variant objects, which is exactly where it
 * should live and also the only place the parser can attribute it to a state.
 * Same regex lint-registry uses, so the two agree on what a variants object
 * is; if that shape ever changes, both fail together rather than one drifting
 * quietly into checking nothing.
 *
 * Everything here is measured at the 3:1 non-text floor. These values animate
 * SVG fill and stroke, which 1.4.11 covers. If a component ever animates the
 * colour of actual text, it goes in REGISTRY_TEXT and gets 4.5:1 — a declared
 * exception, listed, rather than a guess made from a property name the parser
 * cannot see the element for.
 */
const REGISTRY_TEXT = new Set()

/**
 * The dark surface is the one token this file consumes by name rather than
 * through PAIRS, so rule C does not cover it. Renaming `--color-chassis`
 * therefore used to put `undefined` into `surfaces` and kill the run with a
 * TypeError out of `ratio`, which is precisely the "crash in the maths instead
 * of a sentence about the rename" that rule C exists to prevent.
 *
 * Non-fatal on purpose. Losing the dark surface costs one of two registry
 * measurements; it does not invalidate the web pairs or rules A, B and D, and
 * a linter that gives up early hides the other findings a rename produces.
 */
const CHASSIS = tokens.get('chassis')
check(
  CHASSIS,
  rel(GLOBALS),
  '--color-chassis is not declared in @theme, so registry colour has no dark surface to be measured against; the registry check is running against the light surface alone',
)

const surfaces = [
  [LIGHT_CONSUMER, 'a white consumer app'],
  ...(CHASSIS ? [[CHASSIS, 'the Z-UI chassis']] : []),
]

const index = json(join(REGISTRY, 'registry.json'))
for (const entry of index.items) {
  const dir = join(REGISTRY, entry.path)
  const manifestPath = join(dir, 'component.json')
  // A missing manifest is lint-registry's failure to report, not this one's.
  if (!existsSync(manifestPath)) continue
  const manifest = json(manifestPath)

  for (const f of manifest.files ?? []) {
    const path = join(dir, f.path)
    if (!existsSync(path)) continue
    const src = read(path)
    const at = `${entry.name}/${f.path}`

    // Spans, not a set of hex strings. A set would let `const SHADOW = '#f43f5e'`
    // pass simply because #f43f5e also appears inside iconVariants, which is
    // the one case where smuggling a colour past this lint would be easy.
    const attributed = []
    for (const block of src.matchAll(/const (\w*[Vv]ariants) = \{([\s\S]*?)\n\} satisfies/g)) {
      attributed.push([block.index, block.index + block[0].length])
      // hex -> the states that use it, so the message names the state a
      // designer would look for rather than a line number they would not.
      const uses = new Map()
      let state = '?'
      for (const line of block[2].split('\n')) {
        state = line.match(/^ {2}'([^']+)':/)?.[1] ?? state
        for (const h of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
          if (!uses.has(h[0])) uses.set(h[0], [])
          if (!uses.get(h[0]).includes(state)) uses.get(h[0]).push(state)
        }
      }

      for (const [hex, states] of uses) {
        const kind = REGISTRY_TEXT.has(hex) ? 'text' : 'ui'
        if (!check(parse(hex), at, `${block[1]} has unparseable colour "${hex}"`)) continue
        registryColours++
        for (const [surface, label] of surfaces) {
          const r = ratio(hex, surface)
          check(
            r >= FLOOR[kind],
            at,
            `${block[1]} ${hex} (${states.join(', ')}) on ${surface} is ${fmt(r)}, below the ${FLOOR[kind]}:1 floor for ${NOUN[kind]} — ${label}`,
          )
        }
      }
    }

    // ---- rule D: nothing may hide outside a variants object ---------------
    for (const h of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      check(
        attributed.some(([s, e]) => h.index >= s && h.index < e),
        at,
        `hex "${h[0]}" sits outside a variants object, where no state can be attributed to it and this lint cannot see it; move it into the variants object`,
      )
    }
  }
}

// ---- usage: what web/ actually paints -------------------------------------
/**
 * Only app/ and components/ are walked. web/__generated__ inlines registry
 * source as string literals, so scanning it would report like-button's hexes
 * as site usage and every message would name the wrong file.
 */
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p)
  }
  return out
}
const SOURCES = [join(ROOT, 'web', 'app'), join(ROOT, 'web', 'components')].flatMap((d) => walk(d))

// Longest name first so `bg-panel-2` cannot be read as `bg-panel`, and a
// trailing guard so it cannot be read the other way either. The prefix class
// covers `!text-mint` and `hover:border-mint`.
const NAMES = [...tokens.keys()].sort((a, b) => b.length - a.length).join('|')
const UTIL = new RegExp(`(?:^|[\\s"'\`!:{(+])(text|bg|border)-(${NAMES})(?![\\w-])`, 'g')
// `.lbl` sets a colour with no utility at all, and the focus ring is drawn in
// CSS. Both are real usage; neither is a Tailwind class.
const VAR = /(?:^|[;{\s])(color|background|outline|border)[\w-]*:\s*[^;]*var\(--color-([\w-]+)\)/gm

// role -> tokens seen in it, with the first file that used each, for messages.
const used = { text: new Map(), ui: new Map(), surface: new Map() }
const note = (role, token, file) => {
  if (!used[role].has(token)) used[role].set(token, file)
}

for (const path of SOURCES) {
  const src = read(path)
  const file = rel(path)
  for (const m of src.matchAll(UTIL)) {
    const role = m[1] === 'text' ? 'text' : m[1] === 'border' ? 'ui' : 'surface'
    note(role, m[2], file)
  }
  for (const m of src.matchAll(VAR)) {
    const role = m[1] === 'color' ? 'text' : m[1] === 'background' ? 'surface' : 'ui'
    note(role, m[2], file)
  }
}

// ---- rule B: every used utility resolves to a declared pair ---------------
// `text-` and `border-` say unambiguously that the token is a foreground, so
// they demand a pair in that role. `bg-` does not: it is a surface on a card
// and a graphic on a 6px indicator dot, and nothing in the source distinguishes
// those. So `bg-` asks only that the token appear somewhere in the list, and
// says so rather than pretending to a precision it has not got.
for (const [token, file] of used.text) {
  check(
    live.some((p) => p.fg === token && p.kind === 'text'),
    file,
    `"text-${token}" is used here but "${token}" is the foreground of no declared text pair`,
  )
}
for (const [token, file] of used.ui) {
  check(
    live.some((p) => p.fg === token),
    file,
    `"${token}" is drawn as a border or outline here but is the foreground of no declared pair`,
  )
}
for (const [token, file] of used.surface) {
  check(
    live.some((p) => p.bg === token || p.fg === token),
    file,
    `"bg-${token}" is used here but "${token}" appears in no declared pair, in either role`,
  )
}

// ---- rule A: no token escapes review --------------------------------------
for (const [token, hex] of tokens) {
  if (RAMP.test(token)) continue
  check(
    PAIRS.some((p) => p.fg === token || p.bg === token),
    rel(GLOBALS),
    `--color-${token} (${hex}) appears in no declared pair; every token needs a contrast story before it ships`,
  )
}

report()
