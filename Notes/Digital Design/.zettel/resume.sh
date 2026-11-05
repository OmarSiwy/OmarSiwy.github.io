#!/usr/bin/env bash
# Rebuild the Phase D work list from VAULT STATE, never from workflow returns.
# A note is unfinished iff it still contains ZETTEL-TODO. Safe to re-run.
V="/home/omare/Documents/Projects/OmarSiwy.github.io/Notes/Circuit Design/Digital Design"
grep -rl 'ZETTEL-TODO' --include='*.md' "$V" 2>/dev/null | grep -v '/\.' | sort
