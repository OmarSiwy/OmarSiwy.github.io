---
title: FPGAs
description: "Map of the 11 FPGAs notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, fpgas, hub]
aliases:
  - "Lookup-Tables"
  - DSP Blocks
  - Block Memory
  - FPGAs
  - "1.3) FPGAs"
---

# FPGAs

An FPGA is an array of basic logic elements in a programmable interconnect; what
each element computes and how they are wired is decided after manufacture, held
in SRAM, loaded in milliseconds. Current devices hold millions of elements and
run near 1 GHz (p. 87). Everything else in this vault is priced in the units
these notes define — when a later note quotes "3 LUTs per bit" or "one DSP per
tile", this is where you find out what that bought you.

**The specification every note below answers to.** The fabric is a substrate,
not an operator, so its contract is a resource contract, not a numeric one.

- **Input format** — any Boolean function of $k$ inputs, $k \le 4\ldots6$ by
  family; word operands up to the DSP block's hard multiplier width; addresses
  up to the memory tile's depth.
- **Output format** — bit-exact. LUTs, carry chain, DSP blocks and block RAMs
  all compute exactly what they were configured to compute.
- **Accuracy** — $0$ ulp introduced by the substrate. Every ulp of error in this
  vault comes from a *choice* of format or algorithm ([[Error Accuracy]]), never
  from the silicon.
- **Optimised for** — area in LUT6/ALM, FF, DSP unit and memory tile; latency in
  ns; throughput by pipelining, which is close to free here because the FF:LUT
  ratio is near $1$ and an unused FF is wasted silicon, not saved area (p. 135).

What makes that contract worth paying is that the granularity is **one bit**. A
processor offers 32 and 64; an FPGA builds a 13-bit datapath when 13 bits is
what the error budget says — "computing just right" (p. 7). That, plus no
program management and exactly-sized parallelism, is what buys back the order of
magnitude an FPGA gives away to an ASIC on raw speed (pp. 5–6); the cause of the
gap is the reconfigurable routing, not the logic (p. 88).

- [[Choosing an FPGA Primitive]] — **read this first or last, never in the
  middle.** It carries the trade-off table with the source's real LUT counts,
  DSP widths, tile sizes and delays, and the "pick X when…" rules. Deliberately
  not duplicated anywhere below.

### The logic cell, from truth table to vendor part

- [[Lookup-Tables]] — start here. Why a $2^\alpha$-bit SRAM behind a
  $2^\alpha$:1 mux realises *any* function of $\alpha$ variables, and why that
  makes the LUT, not the gate, the unit of FPGA area.
- [[Fracturable LUT]] — read next, because Boole's expansion theorem is what
  builds a LUT out of smaller LUTs and also what splits a LUT6 into two LUT5s.
  The catch, shared input wires, is the whole reason mapping is hard.
- [[Basic Logic Element]] — the minimal cell: a LUT plus an optional flip-flop.
  Read it for the argument that pipelining is nearly free on FPGA and a real
  trade in ASIC.
- [[AMD BLE]] — the Xilinx line, Virtex-4 through Versal, as a case study in
  what changed and what did not.
- [[Intel ALM]] — the counterpart, and the one architectural difference that
  actually shows up in your arithmetic: the full adder is hardened, so both LUT
  layers stay free to feed it.

Read those five in order once and you have the pattern all of them instantiate —
a fracturable LUT layer, a fast carry chain, optional flip-flops (p. 94). Design
against the pattern; the part numbers age, the three layers have not.

### Hardened arithmetic

- [[Fast Carry Chain]] — the dedicated neighbour-to-neighbour wire that bypasses
  the switch matrix. Read it before any adder note: it is why the asymptotics of
  [[Adders]] reverse on FPGA below 32 bits.
- [[DSP Blocks]] — the hard multiplier with its pre- and post-adder. Read it for
  the cliff: a free multiplier until you run out, then the most expensive
  resource on the chip.
- [[Three-Multiplication Complex Product]] — read it as the worked demonstration
  of *why* the pre-adder is there at all, and as the pattern for trading cheap
  additions against scarce multiplications.

### Memory

- [[Distributed Memory]] — a LUT turned inside out into writable storage. Read
  it to see that a LUT and a small ROM are the same object, which is why table
  cost and arbitrary-function cost coincide at six inputs.
- [[Shift Register LUT]] — the same cell in its other mode. Read it when you
  need to align pipeline stages, or to rewrite a table's contents at runtime
  through a single wire.
- [[Block Memory]] — the dedicated tiles. Read it for the timing distinction
  that catches people: full clock rate, but several cycles per access, so a
  throughput resource and never a latency one.

### Where this sits

Upstream, [[Number Formats]] and [[Error Accuracy]] decide how many bits a
datapath needs; this hub says what those bits cost. Downstream, [[Adders]]
inherits the carry chain, [[Multipliers]] and [[Multiplication by Constants]]
compete for DSP blocks, and [[Table-Based Function Evaluation]] spends all its
effort shrinking an address until it fits the memory tiles described here.
[[Digital Design]] is the entry point above all of them.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- Sects. 1.2–1.3, pp. 5–7 — the FPGA/ASIC performance gap, its routing cause,
  and bit-level granularity as the premise of the book.
- Ch. 4, *Field Programmable Gate Arrays*, pp. 87–100 — the whole of this hub's
  material: LUTs and BLEs (§4.1, pp. 88–94), DSP blocks (§4.2, pp. 94–95),
  memory elements (§4.3, pp. 95–99).
- Sects. 5.4.1–5.4.2, pp. 126–128 — the fast carry chain, developed in the adder
  chapter but architectural.
- Sect. 5.5.1, p. 135 — LUT:FF ratio near 1, and why pipelining is free.
