// Link audit — every [[target]] in the vault must resolve to a filename or alias.
// Reused by Phase F. Run any time; reads the vault, not the workflow.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

const VAULT_ROOT = '/home/omare/Documents/Projects/OmarSiwy.github.io/Notes'
const SCOPE = process.argv[2] || join(VAULT_ROOT, 'Circuit Design/Digital Design')

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (extname(p) === '.md') out.push(p)
  }
  return out
}

// every resolvable name in the WHOLE vault: basenames + aliases
const all = walk(VAULT_ROOT)
const resolvable = new Set()
for (const f of all) {
  resolvable.add(basename(f, '.md'))
  const src = readFileSync(f, 'utf8')
  const fm = src.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) continue
  const al = fm[1].match(/^aliases:\n((?:\s*-\s*.*\n?)+)/m)
  if (al) for (const line of al[1].split('\n')) {
    const m = line.match(/^\s*-\s*(.*)$/)
    if (m) resolvable.add(m[1].trim().replace(/^["']|["']$/g, ''))
  }
}

// every link inside the scope
const scoped = walk(SCOPE)
const dead = {}
let total = 0
for (const f of scoped) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
    const t = m[1].trim()
    total++
    if (!resolvable.has(t)) (dead[t] ||= []).push(basename(f, '.md'))
  }
}

const entries = Object.entries(dead).sort((a, b) => b[1].length - a[1].length)
console.log(`vault notes:      ${all.length}`)
console.log(`resolvable names: ${resolvable.size}`)
console.log(`links in scope:   ${total}`)
console.log(`DEAD:             ${entries.reduce((s, [, v]) => s + v.length, 0)} edges across ${entries.length} targets`)
for (const [t, from] of entries.slice(0, 25)) {
  console.log(`  ${String(from.length).padStart(3)}  ${t}   <- ${from.slice(0, 3).join(', ')}${from.length > 3 ? ` +${from.length - 3}` : ''}`)
}

// unfinished notes
const todo = scoped.filter((f) => readFileSync(f, 'utf8').includes('ZETTEL-TODO'))
console.log(`\nunfinished (ZETTEL-TODO): ${todo.length} / ${scoped.length}`)
