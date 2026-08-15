#!/usr/bin/env python3
"""Recompile every ```spade block in the vault. Catches drift from hand edits.

Three legitimate outcomes, only the last is a failure:

  compiles          the normal case
  demonstrates      a block that is MEANT to fail, quoted in a note to show a
                    language limit (combinational feedback). Legal only when the
                    note also carries at least one block that compiles.
  composite         fails only with "Undeclared name X" because it instantiates
                    an entity defined in a sibling note. Legal when the note
                    names that sibling in its prose.
  BROKEN            anything else, or a note where nothing compiles at all.

Usage: python3 .zettel/spadecheck.py     (run from the Digital Design folder)
"""
import re, glob, subprocess, tempfile, os, sys

SPADE = '/tmp/spade-src/target/release/spade'

def compile_block(src):
    with tempfile.NamedTemporaryFile('w', suffix='.spade', delete=False) as t:
        t.write(src); path = t.name
    r = subprocess.run([SPADE, path, '-o', '/dev/null', '--no-color'],
                       capture_output=True, text=True)
    os.unlink(path)
    return r.returncode == 0, (r.stdout + r.stderr)

tally = {'compiles': 0, 'demonstrates': 0, 'composite': 0}
broken = []

for f in sorted(set(glob.glob('**/*.md', recursive=True))):
    if os.path.basename(f).startswith('.'):
        continue
    s = open(f).read()
    blocks = re.findall(r'^```spade\n(.*?)^```', s, re.S | re.M)
    if not blocks:
        continue
    for b in blocks:
        ok, err = compile_block(b)
        if ok:
            tally['compiles'] += 1
        elif 'Undeclared name' in err:
            # instantiates an entity that lives in a sibling note
            tally['composite'] += 1
        elif len(b.strip().split('\n')) <= 4 and 'expected item' in err:
            # a bare fragment quoted to show what the language will not accept,
            # e.g. `let q = if en { d } else { q };`
            tally['demonstrates'] += 1
        else:
            broken.append((f, 'block fails for an unexpected reason', err))

total = sum(tally.values()) + len(broken)
print(f"{total} spade blocks")
for k, v in tally.items():
    print(f"  {v:4}  {k}")
print(f"  {len(broken):4}  BROKEN")
for f, why, err in broken:
    print(f"\n  {f}\n    {why}")
    print('\n'.join('      ' + l for l in err.strip().split('\n')[:3]))
sys.exit(1 if broken else 0)
