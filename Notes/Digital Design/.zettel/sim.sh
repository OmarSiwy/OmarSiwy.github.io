#!/usr/bin/env bash
# Simulate a Spade block. Usage:
#   .zettel/sim.sh <file.spade> <top-entity-name> <testbench.v>
#
# Compiles the Spade to Verilog, then runs iverilog on it plus your testbench.
# Exit 0 only if the testbench prints PASS and nothing prints FAIL.
#
# Your .spade file MUST contain a concrete, non-generic entity named <top>, e.g.
#
#     entity rca8(x: uint<8>, y: uint<8>, cin: bool) -> uint<9> {
#         rca::<8>(x, y, cin)
#     }
#
# — that both monomorphises the generic body (otherwise it is never type-checked)
# and gives the testbench something to instantiate.
#
# In the emitted Verilog:
#   * the module is an ESCAPED identifier: `\rca8 ` — the trailing space is part
#     of the name, so instantiate it as `\rca8 dut (...);`
#   * input ports are the argument names with `_i` appended: x_i, y_i, cin_i, clk_i
#   * the return value is a single port called `output__`
# Run with no testbench arg to just print the module's port list.
set -euo pipefail

REPO="/home/omare/Documents/Projects/OmarSiwy.github.io"
SPADE="/tmp/spade-src/target/release/spade"
SRC="${1:?usage: sim.sh <file.spade> <top-entity> [testbench.v]}"
TOP="${2:?missing top entity name}"
TB="${3:-}"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

"$SPADE" "$SRC" -o "$WORK/dut.v" --no-color

if ! grep -qE "^module +\\\\${TOP}\b" "$WORK/dut.v"; then
  echo "no module \\${TOP} in emitted Verilog. Modules present:" >&2
  grep -oE "^module +\\\\[A-Za-z0-9_]+" "$WORK/dut.v" | sed 's/^/  /' >&2
  exit 1
fi

if [ -z "$TB" ]; then
  grep -A20 -E "^module +\\\\${TOP}\b" "$WORK/dut.v" | sed -n '1,/);/p'
  exit 0
fi

cp "$TB" "$WORK/tb.v"
cd "$REPO"
out=$(nix develop path:. --command bash -c \
  "cd '$WORK' && iverilog -g2012 -o tb.out dut.v tb.v && ./tb.out" 2>&1)
echo "$out"
echo "$out" | grep -q FAIL && { echo "SIMULATION FAILED" >&2; exit 1; }
echo "$out" | grep -q PASS || { echo "testbench never printed PASS" >&2; exit 1; }
exit 0
