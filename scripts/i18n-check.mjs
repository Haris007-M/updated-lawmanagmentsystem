// Checks that English and Urdu dictionaries match.
//   * keys missing in either language          -> error
//   * {placeholders} that differ between them  -> error
//   * Urdu text identical to English           -> warning (probably not translated yet)
// Usage:  npm run i18n-check          (exit code 1 when there is an error)
// It reads lib/i18n/dict/{en,ur}/*.ts as plain text, so no build is needed.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'i18n', 'dict')

function unquote(raw) {
  const q = raw[0]
  let s = raw.slice(1, -1)
  s = s.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, c) => {
    if (c[0] === 'u' && c.length === 5) return String.fromCharCode(parseInt(c.slice(1), 16))
    if (c === 'n') return '\n'
    if (c === 't') return '\t'
    return c
  })
  return q === '`' ? s : s
}

// matches  'key': 'value',   "key": "value",  and template-literal values
const ENTRY = /^\s*(['"])((?:\\.|(?!\1).)+)\1\s*:\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)\s*,?\s*(?:\/\/.*)?$/gm

function load(lang) {
  const dir = join(root, lang)
  const map = new Map()
  const dupes = []
  if (!existsSync(dir)) return { map, dupes }
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && x !== 'index.ts')) {
    const text = readFileSync(join(dir, f), 'utf8')
    for (const m of text.matchAll(ENTRY)) {
      const key = m[2]
      if (map.has(key)) dupes.push(`${lang}/${f}: ${key}`)
      map.set(key, { value: unquote(m[3]), file: f })
    }
  }
  return { map, dupes }
}

const en = load('en')
const ur = load('ur')
const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')

let errors = 0
let warnings = 0
const say = (kind, msg) => { console.log(`${kind} ${msg}`); if (kind === 'ERROR') errors++; else warnings++ }

for (const [k, v] of en.map) {
  const u = ur.map.get(k)
  if (!u) { say('ERROR', `missing in Urdu:    ${k}  (en/${v.file})`); continue }
  if (ph(v.value) !== ph(u.value)) say('ERROR', `placeholder mismatch: ${k}  en{${ph(v.value)}} ur{${ph(u.value)}}`)
  else if (v.value === u.value && /[A-Za-z]{4,}/.test(v.value)) say('WARN ', `Urdu equals English: ${k}`)
}
for (const [k, v] of ur.map) if (!en.map.has(k)) say('ERROR', `missing in English:  ${k}  (ur/${v.file})`)
for (const d of [...en.dupes, ...ur.dupes]) say('WARN ', `duplicate key: ${d}`)

console.log(`\n${en.map.size} English keys, ${ur.map.size} Urdu keys. ${errors} error(s), ${warnings} warning(s).`)
process.exit(errors ? 1 : 0)
