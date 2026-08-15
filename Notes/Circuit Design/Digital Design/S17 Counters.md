---
title: Counters
description: "Map of the 17 Counters notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, counters, hub]
aliases:
  - Counters
  - "2.8) Counters"
---

# Counters

**Specification.** *Inputs:* a clock, control bits `EN`, `LD`, `UP`, and an $n$-bit load
value $D$. *Output:* an $n$-bit state $Q$ advancing one step per enabled edge, plus a
terminal-count bit TC. *Accuracy:* **exact, $0$ ulp** — integer arithmetic modulo the
cycle length, so none of the rounding machinery of [[Error Accuracy]] applies and the wrap
is specified behaviour, not error; what varies between the notes below is the *alphabet*
the count is expressed in ([[Number Formats]]), never its correctness. *Optimised for:*
maximum $f_{\max}$ at minimum flop count, subject to two side constraints that end up
deciding everything — **is the count decoded combinationally, and does it cross a clock
domain?**

> [!important] The arithmetic is settled in one note, and it is not the interesting part
> Setting one adder operand to $1$ collapses the full adder to a half adder, so an
> increment is a chain of AND2/XOR2 pairs and there is nothing left to optimise
> arithmetically. Every remaining choice below — ripple against synchronous, binary
> against Gray against LFSR against one-hot — is answered by the decode question and the
> clock-domain question. A note below that looks like it is about gate count is usually
> about one of those two.

### Start here

- [[Choosing a Counter]] – the trade-off table: flops, gate counts, combinational depth,
  $f_{\max}$ bounds, decode and CDC behaviour for all seventeen structures at once, with
  the four decision rules that follow. Read it before anything below; the hub deliberately
  does not repeat a single number from it.

### The increment itself

- [[Incrementer]] – read first: the half-adder derivation that every binary counter here
  is wrapped around, and where TC comes from for free.
- [[Prefix Incrementer]] – read when the carry chain shows up as the critical path, and to
  see the lookahead operator degenerate to a pure AND-prefix.

### Binary counters, and how the enable reaches them

- [[Synchronous Counters]] – the default, and the baseline every other row of the table is
  measured against.
- [[Up-Down Counter]] – read for the complement identity that turns one datapath into
  both directions, and why the extra XOR is free on a LUT fabric.
- [[Asynchronous Counters]] – read for the fastest and lowest-clock-power structure here,
  and for the exact reason you are not allowed to decode it.
- [[Cascaded Counter Chain]] – read when the counter is built from slices and you must
  choose between rippling the enable and broadcasting it; this is the `ENP`/`ENT` split.
- [[Two-Stage Prescaled Counter]] – read when $n$ is large, $f$ is high, and you are
  willing to buy timing with a multicycle exception rather than a different structure.

### Counting to $N$ when $N$ is not a power of two

- [[Modulo-N Counter]] – read for the compare-and-clear construction, and when $Q$ has to
  run $0\ldots N-1$ upward because something addresses with it.
- [[Preload-and-Overflow Counter]] – read to see the comparator deleted entirely by biasing
  the state so the incrementer's own carry-out is the terminal condition.
- [[Zero-Detect Down Counter]] – read for the timer default: hardware that does not change
  when $N$ does, because an $n$-input NOR does not know what $N$ is.

### One bit at a time — encodings that survive a clock crossing

- [[Gray Counter]] – read the moment a count leaves its clock domain; the bound on what a
  receiver can latch is the whole argument, and it is not optional.
- [[Gray Code Converter]] – read for the asymmetry that shapes the counter above: forward
  is one XOR level, backward is a prefix tree.

### Counters that visit states in a scrambled order

- [[Fibonacci LFSR]] – read when the count is a deadline rather than a quantity; taps
  gathered into one XOR, and an unbroken shift path an `SRL` can hide.
- [[Galois LFSR]] – read for the fastest structure that still visits $2^n-1$ states, and
  for why the same polynomial gives a shallower circuit rearranged.
- [[De Bruijn Counter]] – read for the all-zeros fixed point, and the one gate that
  splices the missing state back into the cycle.

### Shift registers used as sequencers

- [[Ring Counter]] – read when the decoded output is the product: zero decode logic, zero
  decode delay, structurally glitch-free, at $N$ flops for $N$ states.
- [[Johnson Counter]] – read for twice a ring's density and a two-gate glitch-free decode;
  it is also a Gray code, so it crosses clock domains safely over its $2n$ states.

### Where this sits

The increment comes straight out of [[Adders]] with one operand tied to $1$ — the same
prefix reassociation, the same hard-carry-chain conclusion on [[FPGAs]] — and the
terminal-count test is a constant-comparator from [[Comparators]]. Everything about
*timing* is inherited: the setup/hold constraint and the metastability argument from
[[Flip-Flops and Latches]], the unused-state and self-starting analysis from
[[Synchronous Sequential Logic]], and the hazard framing for a ripple chain's generated
clocks from [[Asynchronous Sequential Logic]]. Downstream, a counter is the address
generator behind almost every operator in this vault, and the Gray-coded pointer is the
piece an asynchronous FIFO in [[Network-On-Chip]] is built from.

## References

No book source; this topic is written from established digital-design canon with
chapter-level citations only, so no printed page number is given anywhere in the folder.

- Mano & Ciletti, *Digital Design* — registers and counters: ripple versus synchronous,
  ring and Johnson counters, unused-state analysis.
- Wakerly, *Digital Design: Principles and Practices* — sequential building blocks: LFSRs
  and primitive polynomials, the 74x161/163 `ENP`/`ENT` enable structure.
- Weste & Harris, *CMOS VLSI Design* — datapath subsystems: incrementers as degenerate
  adders, prefix structures, clock-power arguments for dividers.
- Cummings, "Simulation and Synthesis Techniques for Asynchronous FIFO Design" (SNUG) —
  Gray-coded pointers and the conservative-flag argument.
