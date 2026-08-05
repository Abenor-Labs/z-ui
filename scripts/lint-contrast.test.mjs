/**
 * Mutation harness for the contrast lint.
 *
 * Two things are done differently from lint-registry.test.mjs, both on purpose.
 *
 * It asserts the message, not the exit code. lint-registry.test.mjs takes a
 * non-zero exit as proof the mutation was caught, which means a linter that
 * fails for an unrelated reason scores a clean sweep and a linter whose message
 * is wrong scores one too. Here that shortcut is not even available: the
 * contrast lint fails on the current tree by design, so exit codes carry no
 * signal at all. Every case names the sentence it expects, and requires that
 * sentence to be *new* relative to the baseline, so a pre-existing failure can
 * never be mistaken for a catch.
 *
 * It restores unconditionally. lint-registry.test.mjs restores at the top of
 * the next iteration, so a throw anywhere in the loop leaves mutated source on
 * disk. `finally` closes that, but `finally` alone is not "unconditional":
 * Node's default signal handling terminates without unwinding, so Ctrl-C would
 * still strand a rewritten globals.css. Restore therefore hangs off three
 * paths — `finally`, the signal handlers, and `uncaughtException`.
 *
 * Mutating checked-in files is only acceptable if putting them back does not
 * depend on the happy path being taken.
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolved from this file, not from the cwd. The linter already locates itself
// this way; a harness that only works when invoked from the repo root is worse
// than the linter it tests, because its failure mode is an ENOENT on
// globals.css that reads as a missing file rather than a wrong directory.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LINTER = join(ROOT, 'scripts', 'lint-contrast.mjs')

const CSS = 'web/app/globals.css'
const SRC = 'registry/components/like-button/like-button.tsx'
const CARD = 'web/components/catalog-card.tsx'
const FILES = [CSS, SRC, CARD]
// Repo-relative for the messages, absolute for every actual write.
const abs = (f) => join(ROOT, f)

const orig = Object.fromEntries(FILES.map((f) => [f, readFileSync(abs(f), 'utf8')]))
const restore = () => {
  for (const f of FILES) writeFileSync(abs(f), orig[f])
}

/**
 * `finally` covers a throw. It does not cover a signal: Node's default SIGINT
 * handling terminates the process without unwinding, so Ctrl-C during a
 * mutation leaves rewritten source on disk. Restoring is only unconditional if
 * the signal path and the uncaught-exception path restore too.
 */
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  try {
    process.on(sig, () => {
      restore()
      process.exit(130)
    })
  } catch {
    // Not every signal exists on every platform; the ones that do are enough.
  }
}
process.on('uncaughtException', (e) => {
  restore()
  console.error(e)
  process.exit(1)
})

/**
 * A mutation whose anchor has drifted rewrites nothing and then reports MISSED,
 * which reads as a hole in the linter when it is a hole in this file. Refusing
 * to run a no-op edit is the difference between the two.
 *
 * `from` may be a string or a RegExp; either way only the first occurrence is
 * rewritten, which is what makes renaming a token's declaration while leaving
 * every `var(--color-x)` reference behind expressible in one line.
 */
const edit = (file, from, to) => {
  // `() => to` rather than `to`: String.replace expands `$&`, `$1` and `` $` ``
  // inside a replacement string, and this harness exists to inject arbitrary
  // source. A mutation containing a dollar sign would otherwise be written to
  // disk silently mangled and reported as a hole in the linter.
  const next = orig[file].replace(from, () => to)
  // JSON.stringify on a RegExp is "{}", which would make the one message this
  // guard exists to print useless for exactly the anchors most likely to drift.
  const shown = from instanceof RegExp ? String(from) : JSON.stringify(from)
  if (next === orig[file]) throw new Error(`anchor not in ${file}: ${shown}`)
  writeFileSync(abs(file), next)
}

// Only the indented `  where: msg` lines; the header and the blanks are noise.
const run = () => {
  let out = ''
  try {
    out = execSync(`node ${JSON.stringify(LINTER)}`, { cwd: ROOT, stdio: 'pipe' }).toString()
  } catch (e) {
    out = (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '')
  }
  const lines = out
    .split('\n')
    .filter((l) => /^ {2}\S/.test(l))
    .map((l) => l.trim())
  // A linter that dies is not a linter that caught something. Node prints the
  // offending source line as a code frame indented by two spaces, so a stack
  // trace arrives through the filter above disguised as a failure message.
  // Surfacing it as its own line lets every mutation below assert against it,
  // and the loop treats it as disqualifying no matter what else matched.
  if (/^\s+at .+:\d+:\d+\)?$/m.test(out) || /^[A-Za-z]*Error: /m.test(out)) {
    const first = out.match(/^[A-Za-z]*Error: .*/m)?.[0] ?? 'stack trace in output'
    lines.unshift(`linter crashed: ${first}`)
  }
  return lines
}

const base = run()
const seen = new Set(base)

/**
 * The unmutated tree, asserted directly. These are the claims no mutation can
 * make, because they are about what the linter does *not* do.
 *
 * The scope-split one has teeth: silkscreen is #e8e4dc, so if web/ tokens were
 * ever measured against a light surface it would land at 1.27:1 and that
 * assertion would fire immediately.
 */
const baseline = [
  ['the linter fails on the real tree', () => base.length > 0],
  [
    'web tokens are measured against the dark panels',
    () => base.some((l) => /^web: muted on panel is \d/.test(l)),
  ],
  [
    'registry colour is measured against a white consumer app',
    () => base.some((l) => /^like-button\/.+ on #ffffff is .+ floor for non-text/.test(l)),
  ],
  [
    'web tokens are never measured against a light surface',
    () => base.every((l) => !(l.startsWith('web:') && l.includes('#ffffff'))),
  ],
  ['the linter does not crash on the real tree', () => !base.some((l) => l.startsWith('linter crashed'))],
]

/**
 * [name, mutate, expect, absent]
 *
 * `expect` must match a failure the mutation introduced, or be null when the
 * whole claim is that nothing appears. `absent` must match nothing at all,
 * which is how a threshold or a surface is proved to be doing work rather than
 * merely present: mint at 3.66:1 has to fail as text and pass as UI, and a
 * registry colour has to fail on one surface without the other coming along
 * for the ride.
 */
const mutations = [
  ['text floor is 4.5 and the UI floor is genuinely not', () =>
    edit(CSS, '--color-mint: #00e5a0;', '--color-mint: #6a6a6a;'),
    /^web: mint on chassis is 3\.66:1, below the 4\.5:1 floor for text/,
    /mint on chassis is .+ floor for non-text/],

  ['new token with no declared pair', () =>
    edit(CSS, '  --color-mint: #00e5a0;', '  --color-mint: #00e5a0;\n  --color-alarm: #ff2d2d;'),
    /--color-alarm \(#ff2d2d\) appears in no declared pair/],

  ['text- utility with no declared text pair', () =>
    edit(CARD, 'className="lbl mt-1"', 'className="lbl mt-1 text-rule"'),
    /^web\/components\/catalog-card\.tsx: "text-rule" is used here but "rule" is the foreground of no declared text pair/],

  ['token renamed out from under a pair', () =>
    edit(CSS, '--color-mint:', '--color-accent:'),
    /^PAIRS: pair "mint on chassis" names unknown token "mint"/],

  // chassis, not mint, because chassis is the one token the linter consumes by
  // name outside PAIRS — as the dark surface for the registry check — and so
  // the one rule C cannot vouch for. Renaming it used to throw a TypeError out
  // of ratio() rather than report anything. `absent` is the whole point of the
  // case: a stack trace is not a catch.
  ['the dark surface token renamed out from under the registry check', () =>
    edit(CSS, '--color-chassis:', '--color-ink:'),
    /^web\/app\/globals\.css: --color-chassis is not declared in @theme/,
    /^linter crashed/],

  // Anchored on the linter's own parse expression rather than the literal
  // `@theme inline {` currently on disk, so the mutation keeps breaking the
  // thing the linter actually depends on even after the modifier changes
  // again. `absent` is the real assertion here: the linter must give up with
  // one sentence, not cascade sixty ratios computed from zero tokens.
  ['@theme block stops parsing', () =>
    edit(CSS, /@theme[^{]*\{/, '@thme {'),
    /^web\/app\/globals\.css: no @theme block matched/,
    /is \d+\.\d\d:1, below the/],

  ['registry colour fails on the dark chassis only', () =>
    edit(SRC, "'#a3a3a3'", "'#1a1a1a'"),
    /^like-button\/like-button\.tsx: iconVariants #1a1a1a \(idle\) on #0a0a0b is 1\.14:1/,
    /#1a1a1a \(idle\) on #ffffff/],

  ['registry colour fails on the light surface only', () =>
    edit(SRC, "'#a3a3a3'", "'#fff'"),
    /^like-button\/like-button\.tsx: iconVariants #fff \(idle\) on #ffffff is 1\.00:1/,
    /#fff \(idle\) on #0a0a0b/],

  // #f43f5e on purpose: it is already used inside iconVariants, so a rule D
  // that collected hex strings rather than source positions would wave this
  // through. It is the only easy way to smuggle a colour past this lint.
  ['hex smuggled outside a variants object', () =>
    edit(SRC, 'const rootVariants = {', "const SHADOW = '#f43f5e'\nconst rootVariants = {"),
    /^like-button\/like-button\.tsx: hex "#f43f5e" sits outside a variants object/],

  // The control. Brightening a foreground must never manufacture a failure;
  // without this the whole suite is satisfiable by a linter that fails on
  // everything.
  ['a passing pair stays passing', () =>
    edit(CSS, '--color-silkscreen: #e8e4dc;', '--color-silkscreen: #ffffff;'),
    null,
    /silkscreen on (chassis|panel|panel-2)/],
]

let held = 0
for (const [name, assert] of baseline) {
  const ok = assert()
  if (ok) held++
  console.log(`${ok ? '  HOLDS  ' : '  BROKEN '} ${name}`)
}

let caught = 0
for (const [name, mutate, expect, absent] of mutations) {
  let ok = false
  let detail = ''
  try {
    mutate()
    const got = run()
    const hit = expect && got.filter((l) => !seen.has(l)).find((l) => expect.test(l))
    const leak = absent && got.find((l) => absent.test(l))
    // Disqualifying everywhere, not just where a case thought to ask. A
    // mutation that makes the linter throw has found a bug in the linter, and
    // scoring it CAUGHT because the code frame happened to match is the exact
    // false-green this harness exists to refuse.
    const crash = got.find((l) => l.startsWith('linter crashed'))
    ok = (expect ? Boolean(hit) : true) && !leak && !crash
    detail = crash
      ? crash
      : leak
        ? `leaked: ${leak}`
        : hit || (expect ? `nothing new matched ${expect}` : 'nothing leaked')
  } catch (e) {
    detail = `harness: ${e.message}`
  } finally {
    restore()
  }
  console.log(`${ok ? '  CAUGHT ' : '  MISSED '} ${name}`)
  console.log(`           ${detail.slice(0, 118)}`)
  if (ok) caught++
}

console.log(`\n${held}/${baseline.length} baseline claims, ${caught}/${mutations.length} mutations caught`)
process.exit(held === baseline.length && caught === mutations.length ? 0 : 1)
