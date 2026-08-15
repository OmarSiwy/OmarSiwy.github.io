#!/usr/bin/env python3
"""Verify every "Fig. N.M, p. X" in the notes against the PDF's real caption pages.
Usage: python3 .zettel/citecheck.py        (run from the Digital Design folder)"""
import re, subprocess, glob, os, sys

txt = subprocess.run(['pdftotext','-layout','Dienchin.pdf','-'],capture_output=True,text=True).stdout
def printed_of(pg):
    lines = [l.rstrip() for l in pg.split('\n') if l.strip()]
    for l in (lines[:1] + lines[-1:]):
        s = l.strip()
        m = re.match(r'^(\d{2,3})\s+\S', s) or re.search(r'\S\s+(\d{2,3})$', s)
        if m: return int(m.group(1))
    return None

fig2page = {}
for pg in txt.split('\f'):
    p = printed_of(pg)
    if p is None: continue
    for m in re.finditer(r'Fig\.\s*(\d+\.\d+)\s+[A-Z(]', pg):   # caption, not a cross-reference
        fig2page.setdefault(m.group(1), p)

pat = re.compile(r'Fig\.\s*(\d+\.\d+)[a-z]?(?:\s*\([^)]{0,20}\))?,?\s*pp?\.\s*(\d+)')
bad = ok = 0
for f in glob.glob('**/*.md', recursive=True):
    if f.startswith('.') or '/' not in f: continue
    for m in pat.finditer(open(f).read()):
        true = fig2page.get(m.group(1))
        if true is None: continue
        if abs(true - int(m.group(2))) <= 1: ok += 1
        else:
            bad += 1
            print(f"  {os.path.basename(f)[:40]:42} {m.group(0)[:32]:34} actual p.{true}")
print(f"\n{ok} correct, {bad} wrong ({len(fig2page)} figures located)")
sys.exit(1 if bad else 0)
