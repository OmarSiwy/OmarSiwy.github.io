// Phase C — write every stub so the link graph resolves before any prose exists.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const INV = JSON.parse(readFileSync('/tmp/dd_src/inventory.json', 'utf8'))
const VAULT = INV.vault
const DRY = process.argv.includes('--dry')

// Obsidian/Windows-safe filename; the real name survives as title + alias.
const fileSafe = (n) => n.replace(/[/\\]/g, '-').replace(/:/g, '-').replace(/\s+/g, ' ').trim()

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const yamlStr = (s) => (/[:#\-?*&!|>'"%@`{}[\],]/.test(s) || s !== s.trim() ? JSON.stringify(s) : s)

function frontmatter(o) {
  const l = ['---']
  l.push(`title: ${yamlStr(o.title)}`)
  l.push(`description: ${yamlStr(o.description || 'TODO')}`)
  l.push(`kind: ${o.kind}`)
  if (o.source) l.push(`source: ${yamlStr(o.source)}`)
  l.push(`status: stub`)
  l.push(`spade: ${o.spade}`)
  l.push(`tags: [${o.tags.join(', ')}]`)
  if (o.aliases?.length) {
    l.push('aliases:')
    for (const a of o.aliases) l.push(`  - ${yamlStr(a)}`)
  }
  l.push('---', '')
  return l.join('\n')
}

const written = []
function write(path, body) {
  written.push(path)
  if (DRY) return
  mkdirSync(join(path, '..'), { recursive: true })
  if (existsSync(path)) {
    // never clobber a note that already has content
    const cur = readFileSync(path, 'utf8')
    if (!cur.includes('ZETTEL-TODO')) return
  }
  writeFileSync(path, body)
}

// ── circuit + concept notes ─────────────────────────────────────────────────
const topicOf = {}
for (const n of INV.notes) (topicOf[n.topic] ||= []).push(n)

for (const n of INV.notes) {
  const fn = fileSafe(n.name)
  const aliases = [...new Set([...(n.aliases || []), ...(fn !== n.name ? [n.name] : [])])]
  const body =
    frontmatter({
      title: n.name,
      description: n.description,
      kind: n.kind,
      source: n.source,
      spade: n.spade === 'n-a' ? 'n/a' : n.spade,
      tags: ['digital', slug(n.topic)],
      aliases,
    }) + `\n# ${n.name}\n\nZETTEL-TODO\n`
  write(join(VAULT, n.topic, `${fn}.md`), body)
}

// ── comparison notes ────────────────────────────────────────────────────────
for (const c of INV.comparisons) {
  const siblings = (topicOf[c.topic] || []).filter((n) => n.kind === 'circuit')
  const body =
    frontmatter({
      title: c.name,
      description: `Trade-off table across the ${siblings.length} ${c.topic} circuits, with the source's own numbers.`,
      kind: 'comparison',
      spade: 'n/a',
      tags: ['digital', slug(c.topic), 'comparison'],
      aliases: [],
    }) + `\n# ${c.name}\n\nZETTEL-TODO\n`
  write(join(VAULT, c.topic, `${fileSafe(c.name)}.md`), body)
}

// ── hubs ────────────────────────────────────────────────────────────────────
const topics = [...new Set(INV.notes.map((n) => n.topic))]
const hubNum = {}
for (const n of INV.notes) hubNum[n.topic] = n.hub

for (const t of topics) {
  const aliases = (INV.hub_aliases[t] || []).filter((a) => a !== `S${hubNum[t]} ${t}`)
  const body =
    frontmatter({
      title: t,
      description: `Map of the ${(topicOf[t] || []).length} ${t} notes, and the specification they all answer to.`,
      kind: 'hub',
      spade: 'n/a',
      tags: ['digital', slug(t), 'hub'],
      aliases,
    }) + `\n# ${t}\n\nZETTEL-TODO\n`
  write(join(VAULT, `S${hubNum[t]} ${t}.md`), body)
}

const s0 =
  frontmatter({
    title: 'Digital Design',
    description: 'Digital logic from first principles through arithmetic units and ML-oriented architectures.',
    kind: 'hub',
    spade: 'n/a',
    tags: ['digital', 'hub'],
    aliases: ['ECE 124', 'Introduction to Digital Design', 'Digital Design'],
  }) + `\n# Digital Design\n\nZETTEL-TODO\n`
write(join(VAULT, 'S0 Digital Design.md'), s0)

console.log(`${DRY ? 'WOULD WRITE' : 'wrote'} ${written.length} files`)
const renamed = INV.notes.filter((n) => fileSafe(n.name) !== n.name)
if (renamed.length) {
  console.log(`\nsanitized filenames (real name kept as title + alias):`)
  for (const n of renamed) console.log(`  ${n.name}  ->  ${fileSafe(n.name)}.md`)
}
