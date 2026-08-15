---
title: FloPoCo
description: "Map of the 6 FloPoCo notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, flopoco, hub]
aliases:
  - FloPoCo
  - "7.1) FloPoCo"
---

# FloPoCo

**Input:** an operator name plus `name=value` parameters, split in two — a
**functional** specification (input format, output format, what mathematical
function at what accuracy) and a **performance** specification (`target=`,
`frequency=`, and per-operator controls).
**Output:** synthesizable VHDL in `flopoco.vhdl`, optionally a test bench and a
`test.input` vector file.
**Accuracy:** whatever the *functional* half asked for — usually last-bit
accurate (faithful, error $<1$ ulp), sometimes correctly rounded at $0.5$ ulp.
**Optimised for:** whatever the *performance* half asked for — area by default,
or a stated target frequency, met by inserting pipeline registers (pp. 761–764).

That split is the whole topic. Every generator in the field bakes one of the two
halves into its source; keeping both on the command line is what makes
"computing just right" ([[Error Accuracy]]) mechanically expressible, and it is
what lets the notes below treat *when* a bit arrives as a problem entirely
separate from *what* the bit is worth ([[Number Formats]]).

> [!important] Pipelining contributes exactly zero ulp
> The functional and performance halves are orthogonal in the strong sense: the
> operator is written once as a combinatorial DAG, and register insertion is a
> later rewriting pass over the same graph — same function, same rounding, same
> test-bench verdict. This is why the timing model underneath every note below
> is allowed to be *approximate*: the worst a bad delay estimate can do is a
> pipeline with too many stages or a missed frequency, never a wrong answer
> (p. 772). No note in this topic re-derives an error bound, because none of
> them has one.

### Start here — the inversion

- [[Frequency-Directed Pipelining]] – **depends-on:** the premise the rest of the
  topic stands on. You state $f$; the tool solves for the stage count $N$. Read
  it before anything else here, because every other note is either what this
  scheduler consumes or what it emits.
- [[Register Sandwich]] – **supports:** how you find out whether the request was
  honoured. A combinatorial operator has no frequency at all until it has two
  clocked endpoints; this is the smallest structure that gives it some.

### What the scheduler emits

- [[Pipeline Synchronization Delay Line]] – **extends:** the registers you did
  not ask for. A DAG reconverges, so a signal born in one stage and read three
  later needs three registers to carry it unchanged — these, not the stage
  registers on the critical path, are where the register cost actually goes.
- [[Pipelined Floating-Point Adder]] – **compares:** the worked case,
  `frequency=400 FPAdd wE=8 wF=23`, where the shifter, the leading-zero counter
  and the rounding adder each land in a different stage. Read it once the
  mechanism is clear, to watch a real datapath get cut (p. 773).

### The other framework — bits, not time

- [[Shared Bit Heap]] – **extends:** the one construct in the tool that is
  *orthogonal* to the operator hierarchy. Several multipliers throw partial
  products onto one common heap and compress nothing locally, so a sum of
  products costs a single compressor tree; the price is that the contributing
  multipliers stop being VHDL entities at all (pp. 775–777).

### Checking the result

- [[Self-Checking Test Bench]] – **supports:** why you should trust the checker
  more than the circuit. A generator that can emit an unbounded family of
  operators cannot have had them tested; the answer is vectors derived from the
  operator's *specification* in GMP/MPFR rather than from its architecture, so a
  datapath bug has to be mirrored by an independent reference bug to survive
  (pp. 764–766).

### Where this sits

Upstream: [[Sums of Weighted Bits]] is the theory the `BitHeap` class is a
direct software transcription of — a weighted bit is a signal name, a position
and an arrival time — and [[FPGAs]] is what the `Target` abstraction exposes,
LUT input count on the architectural side, adder and logic delay on the timing
side (p. 771). [[Floating-Point Operators]] supplies the datapath the pipelining
notes use as their running example.

Downstream: [[ILP for Arithmetic Design]] is where the heuristics named here
(as-soon-as-possible scheduling, beam-search tiling) get replaced by optimal
formulations — the appendix notes that Leiserson–Saxe optimal retiming would
typically cut register cost by 20–30 % and is not implemented (p. 774).
Every chapter hub in this vault has a "hands on" command that lands in this
tool, so [[Adders]], [[Multipliers]], [[Dividers]] and the rest are all
consumers.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024,
Appendix A, "Custom Arithmetic Datapath Design with FloPoCo", pp. 761–779.
