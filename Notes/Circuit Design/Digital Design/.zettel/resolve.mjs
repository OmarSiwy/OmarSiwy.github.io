// Phase B — dedup, ownership, aliases, fold list. Deterministic, no agents.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const VAULT = '/home/omare/Documents/Projects/OmarSiwy.github.io/Notes/Circuit Design/Digital Design'
const raw = JSON.parse(readFileSync('/tmp/dd_inv.json', 'utf8')).result

// ── 1. collisions: exactly one owner each ───────────────────────────────────
const OWNER = {
  'Full Adder': 'Adders',
  'Equality Comparator': 'Comparators',
  'Shannon Expansion': 'Boolean Algebra',
  'Reconfigurable Constant Coefficient Multiplier': 'Multiplication by Constants',
}

// ── 2. comparison notes: singular, grammatical, only where siblings compare ──
const COMPARE = {
  'Boolean Algebra': 'Choosing a Logic Realization',
  'Combinational Logic': 'Choosing a Combinational Block',
  'Flip-Flops and Latches': 'Choosing a Storage Element',
  'Dual-Phase Latches': 'Choosing a Latch Timing Scheme',
  'Synchronous Sequential Logic': 'Choosing an FSM Encoding',
  'Asynchronous Sequential Logic': 'Choosing an Asynchronous Style',
  'Number Formats': 'Choosing a Number Format',
  'Error Accuracy': 'Choosing a Rounding Mode',
  'FPGAs': 'Choosing an FPGA Primitive',
  'Adders': 'Choosing an Adder',
  'Comparators': 'Choosing a Comparator',
  'Sums of Weighted Bits': 'Choosing a Compressor Tree',
  'Multipliers': 'Choosing a Multiplier',
  'Dividers': 'Choosing a Divider',
  'Shifters': 'Choosing a Shifter',
  'Floating-Point Operators': 'Choosing a Floating-Point Operator',
  'Counters': 'Choosing a Counter',
  'Multiplication by Constants': 'Choosing a Constant Multiplier',
  'Division by Constants': 'Choosing a Constant Divider',
  'Squarers and Integer Powers': 'Choosing a Squarer',
  'Floating-Point Specialization': 'Choosing a Specialized Floating-Point Operator',
  'Fixed-Point Function Approximation': 'Choosing a Function Approximation Method',
  'Table-Based Function Evaluation': 'Choosing a Table Method',
  'Polynomial Approximation': 'Choosing a Polynomial Evaluator',
  'Digit Recurrence for Algebraic Functions': 'Choosing a Digit Recurrence',
  'CORDIC': 'Choosing a CORDIC Architecture',
  'Exact Accumulators': 'Choosing an Accumulator',
  'Floating-Point Exponential': 'Choosing an Exponential Architecture',
  'Fixed-Point Computation of eY': 'Choosing an eY Architecture',
  'LTI Filters': 'Choosing a Filter Structure',
  'Arithmetic for Deep Learning': 'Choosing a Deep Learning Datapath',
  'Network-On-Chip': 'Choosing a Router Architecture',
  // FloPoCo and ILP: tooling, nothing to tabulate against each other.
}

// ── 3. aliases: every link target must land somewhere ───────────────────────
// "family" names resolve to the hub; specific names resolve to the note.
const ALIAS_TO_HUB = {
  'Rounding': 'Error Accuracy',
  'Fixed-Point Representations': 'Number Formats',
  'Floating-Point Formats': 'Number Formats',
  'Redundant Number Systems': 'Number Formats',
  'Logarithmic Number Systems': 'Number Formats',
  'Range Reduction': 'Polynomial Approximation',
  'Quantization': 'Arithmetic for Deep Learning',
  'Fast Convolution Algorithms': 'Arithmetic for Deep Learning',
  'Introduction to Flip-Flops & Latches': 'Flip-Flops and Latches',
  'Square Root': 'Digit Recurrence for Algebraic Functions',
  'Compressor Trees': 'Sums of Weighted Bits',
  'Truncated Multipliers': 'Multipliers',
  'Multiple Constant Multiplication': 'Multiplication by Constants',
  'Lookup-Tables': 'FPGAs',
  'DSP Blocks': 'FPGAs',
  'Block Memory': 'FPGAs',
  // Moore/Mealy deliberately NOT here — they resolve to their own notes below.
  'Static Hazards': 'Combinational Logic',
  'Static Hazard': 'Combinational Logic',
  'Multiplexers': 'Combinational Logic',
  'Decoders': 'Combinational Logic',
  'CMOS Logic Gates': 'Combinational Logic',
  'Handshake Ready-Valid': 'Asynchronous Sequential Logic',
  'Network-On-Chip Link': 'Network-On-Chip',
}
const ALIAS_TO_NOTE = {
  'Ripple-Carry Adder': 'RCA, Ripple-Carry Adder',
  'Carry-Save Adder': 'CSA, Carry-Save Adder',
  'Carry-Lookahead Adder': 'CLA, Carry-Lookahead Adder',
  'Shift-and-Add': 'Binary Shift-and-Add Constant Multiplier',
  'Gray Code Counter': 'Gray Counter',
  'Ternary Adder': 'Ternary Adders on FPGAs',
  'Setup and Hold Time': 'Setup and Hold Constraints',
  'Single-Cycle Timing Constraint': 'Setup and Hold Constraints',
  'Clock Skew': 'Clock Skew and Jitter',
  // Overview.md uses the plurals and the inventory agent correctly reused them,
  // so the alias runs singular -> plural, not the other way round.
  'Barrel Shifter': 'Barrel Shifters',
  'Leading Zero Counter': 'Leading Zero Counters',
  'Normalizer': 'Normalizers',
  'Sticky Bit Computation': 'Shifter with Sticky Bit Computation',
  'Gray Code': 'Gray Code Converter',
  'State Table': 'State Transition Graph',
  'State Encoding': 'Binary State Encoding',
  // storage elements — the agent named them more precisely than callers linked them
  'Two-Flop Synchronizer': 'Synchronizer Chain',
  'D Flip-Flop': 'Master-Slave D Flip-Flop',
  'Level-Sensitive D Latch': 'Transparent D Latch',
  'Enable Flip-Flop': 'Clock Enable Flip-Flop',
  'Integrated Clock Gating Cell': 'Integrated Clock-Gating Cell',
  'Moore': 'Moore Machine',
  'Mealy': 'Mealy Machine',
  // Boolean Algebra owns Shannon Expansion; its note carries the structure in the name
  'Shannon Expansion': 'Shannon Expansion Multiplexer',
  'Karnaugh Maps': 'Karnaugh Map',
  'Hazards and Glitches': 'Logic Hazards',
}

// ── build ───────────────────────────────────────────────────────────────────
const topics = raw.per_topic
const all = topics.flatMap((t) => t.circuits.map((c) => ({ ...c, hub: t.hub, topic: t.topic })))

// Canonicalize link targets THROUGH the alias map before counting inbound —
// otherwise a note whose callers all use an alias looks unreferenced and gets
// folded. ("Setup and Hold Constraints" reads as 2 inbound raw, 6 canonical.)
const canon = (n) => ALIAS_TO_NOTE[n] || n
const inbound = {}
for (const c of all) for (const l of c.links) {
  const k = canon(l)
  inbound[k] = (inbound[k] || 0) + 1
}

// drop the losing copy of each collision
const kept = all.filter((c) => !(OWNER[c.name] && OWNER[c.name] !== c.topic))
const dropped = all.filter((c) => OWNER[c.name] && OWNER[c.name] !== c.topic)

// concepts: keep if >=3 canonical inbound, else fold into hub prose
const KEEP_CONCEPT = 3
const notes = []
const folded = []
for (const c of kept) {
  if (c.kind === 'concept' && (inbound[c.name] || 0) < KEEP_CONCEPT) folded.push(c)
  else notes.push(c)
}

// attach aliases
const aliasFor = {}
for (const [a, note] of Object.entries(ALIAS_TO_NOTE)) (aliasFor[note] ||= []).push(a)
const hubAliasFor = {}
for (const [a, topic] of Object.entries(ALIAS_TO_HUB)) (hubAliasFor[topic] ||= []).push(a)
for (const t of topics) (hubAliasFor[t.topic] ||= []).push(t.topic)

for (const n of notes) n.aliases = aliasFor[n.name] || []

// comparison notes
const comparisons = topics
  .filter((t) => COMPARE[t.topic] && notes.filter((n) => n.topic === t.topic).length >= 4)
  .map((t) => ({ name: COMPARE[t.topic], topic: t.topic, hub: t.hub, kind: 'comparison' }))

// what still does not resolve
const names = new Set([...notes.map((n) => n.name), ...comparisons.map((c) => c.name)])
for (const n of notes) for (const a of n.aliases) names.add(a)
const topicNames = new Set(topics.map((t) => t.topic))
for (const list of Object.values(hubAliasFor)) for (const a of list) topicNames.add(a)
const unresolved = Object.entries(inbound)
  .filter(([n]) => !names.has(n) && !topicNames.has(n))
  .sort((a, b) => b[1] - a[1])

// An alias must never point at a note that got folded away.
const foldedSet = new Set(folded.map((f) => f.name))
const badAliases = Object.entries(ALIAS_TO_NOTE).filter(([, t]) => foldedSet.has(t))
if (badAliases.length) {
  console.error(`\nALIAS POINTS AT FOLDED NOTE: ${badAliases.map(([a, t]) => `${a} -> ${t}`).join(', ')}`)
  process.exitCode = 1
}

const foldedNames = new Set(folded.map((f) => f.name))
const unresolvedReal = unresolved.filter(([n]) => !foldedNames.has(n))

mkdirSync('/tmp/dd_src', { recursive: true })
writeFileSync('/tmp/dd_src/inventory.json', JSON.stringify({
  vault: VAULT,
  notes, comparisons, folded, dropped,
  hub_aliases: hubAliasFor,
  unresolved: unresolvedReal,
  counts: {
    circuits: notes.filter((n) => n.kind === 'circuit').length,
    concepts: notes.filter((n) => n.kind === 'concept').length,
    comparisons: comparisons.length,
    hubs: topics.length + 1,
    folded: folded.length,
    total_files: notes.length + comparisons.length + topics.length + 1,
  },
}, null, 2))

const C = JSON.parse(readFileSync('/tmp/dd_src/inventory.json', 'utf8')).counts
console.log(`circuits      ${C.circuits}`)
console.log(`concepts kept ${C.concepts}   (folded into hubs: ${C.folded})`)
console.log(`comparisons   ${C.comparisons}`)
console.log(`hubs          ${C.hubs}`)
console.log(`TOTAL FILES   ${C.total_files}`)
console.log(`\ncollision copies dropped: ${dropped.length} — ${dropped.map((d) => `${d.name} (from ${d.topic})`).join(', ')}`)
console.log(`\nstill unresolved link targets: ${unresolvedReal.length} (${unresolvedReal.reduce((s, [, n]) => s + n, 0)} edges)`)
for (const [n, c] of unresolvedReal.slice(0, 15)) console.log(`  ${c}\t${n}`)

// ── MAP.md ──────────────────────────────────────────────────────────────────
const byTopic = {}
for (const n of notes) (byTopic[n.topic] ||= []).push(n)
const cmpByTopic = Object.fromEntries(comparisons.map((c) => [c.topic, c.name]))
const foldByTopic = {}
for (const f of folded) (foldByTopic[f.topic] ||= []).push(f.name)

let md = `# MAP — Digital Design zettelkasten\n\n`
md += `${C.circuits} circuits · ${C.concepts} concepts · ${C.comparisons} comparisons · ${C.hubs} hubs = **${C.total_files} files**\n`
md += `${C.folded} low-traffic concepts folded into hub prose.\n\n`
for (const t of topics) {
  const ns = byTopic[t.topic] || []
  md += `## S${t.hub} ${t.topic}  (${ns.length})\n\n`
  if (cmpByTopic[t.topic]) md += `- **${cmpByTopic[t.topic]}** — comparison\n`
  for (const n of ns) {
    const tag = n.kind === 'concept' ? ' _(concept)_' : ''
    const sp = n.spade === 'verified' ? '' : ` \`${n.spade}\``
    const al = n.aliases?.length ? ` — aka ${n.aliases.join(', ')}` : ''
    md += `- ${n.name}${tag}${sp}${al}\n`
  }
  if (foldByTopic[t.topic]) md += `\n  folded into hub: ${foldByTopic[t.topic].join(' · ')}\n`
  md += `\n`
}
writeFileSync('/tmp/dd_src/MAP.md', md)
console.log(`\nwrote MAP.md (${md.split('\n').length} lines)`)
