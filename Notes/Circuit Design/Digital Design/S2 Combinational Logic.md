---
title: Combinational Logic
description: "Map of the 12 Combinational Logic notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, combinational-logic, hub]
aliases:
  - Static Hazards
  - Static Hazard
  - Multiplexers
  - Decoders
  - CMOS Logic Gates
  - Combinational Logic
  - "0.2) Combinational Logic"
  - "Logic Hazards"
  - "Propagation and Contamination Delay"
  - "CMOS Inverter"
---

# Combinational Logic

**Input:** an $n$-bit vector $x\in\{0,1\}^n$, no history, no state.
**Output:** an $m$-bit vector $y = f(x)$, and the gate graph realising it is a DAG.
**Accuracy: exact, $0$ ulp, on every one of the $2^n$ rows.** A combinational block *is* a truth table; approximation error enters this vault only when you deliberately shrink the table ([[Error Accuracy]]), never here.
**Optimised:** worst-case propagation delay $t_{pd}$ under an area budget, with switching energy as a third axis the moment glitches enter — because the contract promises a *final value* after $t_{pd}$ and says nothing whatever about the waveform before it.

Every circuit below is exact, so none of them differ in what they compute. The only design freedom in the whole topic is **how the same truth table is factored**, and factoring trades depth against gate count against glitch energy. That is why no note below re-derives the specification: they are twelve answers to this one question.

The identity that generates most of the factorings is Shannon expansion — $f = \bar x_k f|_{x_k=0} + x_k f|_{x_k=1}$, which reads as hardware as a 2:1 mux. Recurse on every variable and you get a binary tree of $2^n-1$ muxes whose $2^n$ leaves are the truth-table bits: a ROM, and exactly (not by analogy) an $n$-input LUT. Stopping the recursion early is functional decomposition; running it in silicon with writable leaves is [[FPGAs]].

**Start here:** [[Choosing a Combinational Block]] — the trade-off table with the source's own gate counts, $\tau$ delays and LUT costs for all ten circuits, plus the one crossover (fan-in, not depth) that decides most of the rows. This hub deliberately does not duplicate a single number from it.

### One code in, one line out

- [[Binary Decoder]] – the flat $n\!\to\!2^n$ one-hot form. Read it first: it is the smallest block where the fan-in penalty bites, and it is the input stage of half the others.
- [[Predecoder]] – read straight after, as the repair: two half-width decoders ANDed pairwise, which is the factoring an SRAM row decoder actually ships.
- [[Demultiplexer]] – read when you need routing rather than selection; it is a decoder plus a mask, and the note is mostly about which of the two the synthesis tool will actually build.

### Many lines in, one code out

- [[Binary Encoder]] – read for the precondition, not the circuit: it is nearly free, and correct only if the input is genuinely one-hot.
- [[Priority Encoder]] – read when the inputs are independently asserted. Its real content is that the naive ripple is a prefix problem, so the same reassociation that trees a carry chain trees this one.

### Selection: three answers to the same mux

- [[Multiplexer Tree]] – the default. Nothing exceeds two inputs, depth grows as $\log$, and it is the only form that scales past $4{:}1$ without an unbuildable gate.
- [[One-Hot Multiplexer]] – read as the counterexample to level-counting: two levels on paper, and slower. Read it before you trust any depth argument anywhere in this vault.
- [[Transmission-Gate Multiplexer]] – read when transistor count dominates and you own the buffering discipline; it is the one form whose delay is quadratic in depth rather than linear.

### Reduction

- [[XOR Parity Tree]] – read for the ASIC/FPGA sign flip: gate-dominated on an ASIC where XOR2 is the worst cell in the library, input-count-dominated on an FPGA where six-input parity is one LUT. Opposite optimisations, same netlist.

### Cost models, and what is folded into this hub

Two topic-level ideas have no home in any single circuit note, because every circuit note assumes them. They are stated once here.

[[Logical Effort]]
: The unit-gate model prices a NAND4 the same as a NAND2, which is wrong in a specific and predictable way. Logical effort replaces it with $d = g h + p$, where $g$ is the gate's drive penalty relative to an inverter, $h = C_{\text{out}}/C_{\text{in}}$ the electrical effort, and $p$ the load-independent self-loading. Both $g$ and $p$ grow linearly in fan-in, so a wide gate is charged twice, and past about four inputs a deeper tree of narrow gates wins. Composed over a path, $F = GBH$ and equal stage effort minimises the total, giving $D_{\min} = N F^{1/N} + P$; differentiating in $N$ puts the optimum stage effort near $3.6$, rounded to $4$, which is where the technology-independent FO4 yardstick comes from. This is the machinery behind every "flat is shallower and slower" claim in the topic — read the note for the $g$/$p$ table and the worked 4:1 comparison.

[[Logic Hazards]]
: A transient output value the truth table does not contain, on a **single** input change. Three shapes: static-1 ($1\to0\to1$, lives in two-level SOP), static-0 ($0\to1\to0$, the POS dual), and dynamic ($0\to1\to0\to1$, needs three-plus levels with reconvergent fanout). All three are artefacts of the netlist, not of $f$, which is what makes them removable — unlike a *function* hazard, which appears when two inputs change and is a property of $f$ itself, so no factoring removes it. Inside a synchronous pipeline you ignore all of it: the register samples after $t_{pd}$ and glitches are invisible to function. They are not invisible to power, where an ASIC adder can spend 20-40% of its switching energy on transients and a deep LUT cascade glitches on every level. Hazard-freedom becomes mandatory only when the output feeds something level-sensitive — a clock, an asynchronous reset, a latch enable, or the next-state logic of [[Asynchronous Sequential Logic]].

- [[Hazard-Free Two-Level Cover]] – read after both of the above: the consensus term is redundant area bought purely for a timing property, and two-level form is the only shape where hazard-freedom has a clean K-map criterion. Dynamic hazards have neither criterion nor repair.

### Where this sits

[[Boolean Algebra]] supplies every rewriting law these factorings use — complement, distributivity, consensus, and the associativity that turns chains into trees. [[Flip-Flops and Latches]] and [[Synchronous Sequential Logic]] consume the two numbers this topic produces: $t_{pd}$ bounds the clock period through setup, $t_{cd}$ must be *large enough* to satisfy hold, and a block that is too fast is a hold violation the clock cannot fix. [[FPGAs]] rewrites the whole cost model below the LUT boundary, where area is measured in inputs rather than gates. Downstream, [[Adders]], [[Comparators]] and [[Shifters]] are all built out of the blocks catalogued here.

## References

No assigned book source — this topic is outside de Dinechin & Kumm, and the long-form note it replaces cited no printed pages either. Established canon, by chapter:

- Standard blocks, Shannon expansion, cofactors, consensus theorem, hazard-free two-level synthesis — Mano & Ciletti, *Digital Design*, chs. 3-4 and 9; Wakerly, *Digital Design: Principles and Practices*, ch. 4 (hazards) and ch. 6 (standard blocks).
- Logical effort ($g$, $p$, $\hat f = F^{1/N}$, FO4), the fan-in penalty, transmission-gate cells and row decoders — Weste & Harris, *CMOS VLSI Design*, chs. 4, 9 and 12; Sutherland, Sproull & Harris, *Logical Effort*, chs. 1-3.
