import * as React from 'react'

/**
 * A display-only syntax highlighter.
 *
 * Shiki already runs in this repo — `scripts/build-registry.mjs` highlights
 * every registry source file at build time into `__generated__/code.js`. That
 * is the right tool and it cannot be used here: the scramble page writes its
 * snippets at runtime from whatever the customize panel is currently set to, so
 * there is no build step at which the string exists. Shipping Shiki's grammar
 * and theme to the browser to colour forty lines is several hundred kilobytes
 * for a docs panel, which is not a trade worth making.
 *
 * So this is a scanner, not a parser. It knows nothing about scope, types or
 * precedence, and it will occasionally paint a `>` in `a > b` as though it
 * closed a JSX tag. What it will not do is change the text: the token stream is
 * checked against the source before it renders, and a mismatch falls back to
 * the plain string. Colour is decoration; the characters are the product, and a
 * highlighter that silently eats one is worse than no highlighter.
 */

export type Lang = 'tsx' | 'css'

type Kind = 'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'attr' | 'fn' | 'punct' | 'plain'

type Token = { text: string; kind: Kind }

const KEYWORDS =
  /\b(?:import|export|from|default|function|return|const|let|var|if|else|for|while|new|typeof|await|async|class|extends|implements|type|interface|as|of|in|null|undefined|true|false|void|this)\b/y

/**
 * Order is the whole algorithm. Comments and strings come first so nothing
 * inside them is re-read as code, and the two-character `=>` beats the
 * single-character punctuation and JSX-tag rules that would otherwise split it.
 * Every pattern is sticky, so a rule can only match at the cursor.
 */
const RULES: Record<Lang, ReadonlyArray<readonly [Kind, RegExp]>> = {
  tsx: [
    ['comment', /\/\*[\s\S]*?\*\/|\/\/[^\n]*/y],
    ['string', /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y],
    ['punct', /=>/y],
    /**
     * A JSX tag opener, told apart from a generic by what precedes it. In
     * `useState<string | null>` the `<` follows an identifier; in JSX it never
     * does — it follows whitespace, `(`, `{`, `,` or the start of the file. The
     * lookbehind is the entire difference between this and painting half of
     * `React.useState<string | null>(null)` as markup.
     *
     * `>` is deliberately absent. Closing a tag and comparing two numbers use
     * the same character with no local way to tell them apart, so it falls
     * through to punctuation, where being dim is right in both readings.
     */
    ['tag', /(?<![\w$)\]])<\/?[A-Za-z][\w.-]*/y],
    ['keyword', KEYWORDS],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    // A name immediately before a single `=` — a JSX attribute, or the thing
    // being bound by a declaration. Both read as "the left-hand side".
    ['attr', /[A-Za-z_$][\w$]*(?=\s*=[^=])/y],
    ['fn', /[A-Za-z_$][\w$]*(?=\s*\()/y],
    ['punct', /[{}()[\].,;:<>+\-*/!?&|=]/y],
  ],
  css: [
    ['comment', /\/\*[\s\S]*?\*\//y],
    ['string', /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y],
    ['keyword', /@[\w-]+/y],
    ['attr', /--[\w-]+/y],
    // Whole attribute selector in one token. The quoted value inside is part of
    // the selector, not a string in its own right, and colouring it separately
    // makes `[data-state="opening"]` read as two unrelated things.
    ['tag', /\[[^\]\n]*\]|\.[A-Za-z][\w-]*/y],
    ['number', /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?[a-z%]*\b/y],
    ['fn', /[a-z-]+(?=\s*\()/y],
    ['attr', /\b[a-z-]+(?=\s*:)/y],
    ['punct', /[{}();:,]/y],
  ],
}

export function tokenize(code: string, lang: Lang): Token[] {
  const rules = RULES[lang]
  const out: Token[] = []
  let pending = ''
  let i = 0

  const flush = () => {
    if (pending) {
      out.push({ text: pending, kind: 'plain' })
      pending = ''
    }
  }

  while (i < code.length) {
    let hit: Token | null = null
    for (const [kind, re] of rules) {
      re.lastIndex = i
      const m = re.exec(code)
      if (m && m[0].length > 0) {
        hit = { text: m[0], kind }
        break
      }
    }
    if (hit) {
      flush()
      out.push(hit)
      i += hit.text.length
    } else {
      // No rule claimed this character. Accumulate rather than emit, so runs of
      // whitespace and unclassified text collapse into one span instead of one
      // per character.
      pending += code[i]
      i += 1
    }
  }

  flush()
  return out
}

/**
 * `pre`-safe output: no wrapper element, just spans and raw text, so the
 * caller's `white-space` and line height are the only things deciding layout.
 */
export function Code({ code, lang }: { code: string; lang: Lang }) {
  const tokens = React.useMemo(() => tokenize(code, lang), [code, lang])

  // The guard the doc comment promises. Cheap, and it turns "the scanner is
  // lossless" from a claim into something the render actually checks.
  if (tokens.reduce((n, t) => n + t.text.length, 0) !== code.length) return <>{code}</>

  return (
    <>
      {tokens.map((t, i) =>
        t.kind === 'plain' ? (
          <React.Fragment key={i}>{t.text}</React.Fragment>
        ) : (
          <span key={i} className={`tk-${t.kind}`}>
            {t.text}
          </span>
        ),
      )}
    </>
  )
}
