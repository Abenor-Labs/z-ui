import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'registry/components/like-button/like-button.tsx'
const MAN = 'registry/components/like-button/component.json'
const orig = { src: readFileSync(SRC, 'utf8'), man: readFileSync(MAN, 'utf8') }

const mutations = [
  ['STATES vs meta.states drift', () => {
    const m = JSON.parse(orig.man); m.meta.states = ['idle', 'liked']
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
  ['icon library import', () =>
    writeFileSync(SRC, orig.src.replace("import { zcn } from '@/lib/z-cn'", "import { Heart } from 'lucide-react'\nimport { zcn } from '@/lib/z-cn'"))],
  ['missing initial={false}', () =>
    writeFileSync(SRC, orig.src.replace('      initial={false}\n', ''))],
  ['whileHover reintroduced', () =>
    writeFileSync(SRC, orig.src.replace('      animate={state}', '      animate={state}\n      whileHover="hover"'))],
  ['data-state removed', () =>
    writeFileSync(SRC, orig.src.replace(/      data-state=\{state\}\n/, ''))],
  ['variants key drift', () =>
    writeFileSync(SRC, orig.src.replace("  'liked-hover': { scale: 1.08 },", "  'liked-hovered': { scale: 1.08 },"))],
  ['file dropped from files[]', () => {
    const m = JSON.parse(orig.man); m.files = []
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
  ['fake spring cubic-bezier', () =>
    writeFileSync(SRC, orig.src.replace("const rootVariants = {", "const fake = 'cubic-bezier(0.34, 1.56, 0.64, 1)'\nconst rootVariants = {"))],
  ['unknown registryDependency', () => {
    const m = JSON.parse(orig.man); m.registryDependencies.push('does-not-exist')
    writeFileSync(MAN, JSON.stringify(m, null, 2))
  }],
]

let caught = 0
for (const [name, mutate] of mutations) {
  writeFileSync(SRC, orig.src); writeFileSync(MAN, orig.man)
  mutate()
  let failed = false, msg = ''
  try { execSync('node scripts/lint-registry.mjs', { stdio: 'pipe' }) }
  catch (e) { failed = true; msg = (e.stderr?.toString() || '').split('\n').filter(l => l.trim().length && !l.includes('failure(s)'))[0]?.trim() ?? '' }
  console.log(`${failed ? '  CAUGHT ' : '  MISSED '} ${name}`)
  if (failed) { caught++; console.log(`           ${msg.slice(0, 110)}`) }
}

writeFileSync(SRC, orig.src); writeFileSync(MAN, orig.man)
console.log(`\n${caught}/${mutations.length} mutations caught`)
process.exit(caught === mutations.length ? 0 : 1)
