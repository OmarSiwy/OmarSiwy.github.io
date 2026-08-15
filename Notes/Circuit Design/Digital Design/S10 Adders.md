---
title: Adders
description: "Map of the 25 Adders notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, adders, hub]
aliases:
  - Adders
  - "2.1) Adders"
---

# Adders

**The specification.** Inputs: two $w$-bit vectors $X,Y$ in the same format, plus a carry-in $c_\text{in}$ of weight $1$. Output: the $(w+1)$-bit vector $S = X+Y+c_\text{in}$. Accuracy: **exact, $0$ ulp** — a full-width adder never rounds, so the only error an adder can introduce is the one you introduce afterwards by truncating its output ([[Error Accuracy]], [[Rounding]]). Signed or unsigned, integer or fixed-point, the hardware is the same: scaling factors out of $2^\ell X_\text{int} + 2^\ell Y_\text{int}$, so there is no such thing as fixed-point addition hardware ([[Number Formats]], p. 106).

What is optimised is **latency**, because every one of the $w$ output bits can in principle depend on all $2w$ input bits through the carry, and that single dependency chain is the whole design problem. Area, energy and wire tracks are the currencies you spend to shorten it. Every note below is a different exchange rate; none of them changes the function computed, so **none of them needs to re-derive this paragraph**.

- **[[Choosing an Adder]]** – the trade-off table across all 25, with the source's own latency, area, fan-out and FPGA timing numbers. Read it first if you are picking one, last if you are learning them. It is deliberately the only place those numbers live.

### The cell and the chain

- [[Half Adder]] – the two-input degenerate case; where a chain with $c_0=0$ saves its LSB cell.
- [[Full Adder]] – the primitive everything else is built from, and why its three inputs are functionally interchangeable but never implementationally so.
- [[RCA, Ripple-Carry Adder]] – minimum area, maximum latency, and the delay model $\tau_\text{add}(w)$ that every architecture below is trying to beat.
- [[Two's Complement Adder/Subtractor]] – read this before assuming signedness costs anything: it costs $w$ XOR gates and a carry-in.
- [[Saturating Adder]] – what to do with $c_\text{out}$ when wraparound is catastrophic and clipping is merely lossy.

### Refuse to propagate at all

- [[CSA, Carry-Save Adder]] – keep the carries instead of passing them, for a delay independent of $w$ and a redundant output; the reason iterative loops are fast.
- [[High-Radix Carry-Save Adder]] – the same trick with a knob: propagate inside $\alpha$-bit groups, expose one carry per group, trade path length against register count.

### Speculate, then select

- [[Switched Ripple-Carry Adder]] – same topology, transistors instead of gates; worth knowing because it is exactly what an FPGA carry chain turns out to be.
- [[Carry-Select Adder]] – compute both answers for an unknown group carry-in and choose afterwards; still linear, but the per-group constant is a mux.
- [[Conditional-Sum Adder]] – carry-select applied to itself, the first $O(\log w)$ adder, and the first place fan-out becomes the binding constraint.

### Unroll the recurrence

- [[CLA, Carry-Lookahead Adder]] – constant depth on paper, until you notice a 32-input AND is a tree and not a gate.
- [[Hierarchical Carry-Lookahead Adder]] – capping the group width and composing group $(g,p)$ pairs; the book's own words are "simply a reparenthesizing", one paragraph before it names the prefix formulation.

### Prefix trees

- [[Parallel Prefix Adders]] – the framing that makes this family a design space rather than a list. Unrolling $c_{i+1}=g_i \vee a_i c_i$ with the operator $(g_L,a_L)\circ(g_R,a_R)=(g_L \vee a_L g_R,\ a_L a_R)$ shows every carry to be a **prefix of one associative reduction**. Associativity means the reduction has no canonical bracketing: every parenthesization computes the same carries, and each one is a different circuit. So **correctness is free** — no prefix graph has to be proved right, and the only things that differ are depth (latency), node count (area and static power), maximum fan-out (load capacitance, hence buffers) and wire tracks (routing congestion, and on FPGAs whether you are on the hard chain at all). The RCA is the degenerate fully-right-nested member of this same family.
- [[Kogge-Stone Tree]] – minimum depth with fan-out capped at $2$; you pay in metal.
- [[Brent-Kung Tree]] – fewest nodes, lightest and most regular wiring, one extra level.
- [[Sklansky Tree]] – Kogge-Stone's depth at half the nodes, bought with fan-out $w/2$; it is the conditional-sum adder with $\circ$-nodes in place of muxes.

### Prefix trees reused for more than a sum

Everything above the bottom row of a prefix adder is independent of $c_0$, which makes a second answer nearly free.

- [[Compound Adder]] – $X+Y$ and $X+Y+1$ at once by duplicating only the last row; the standard significand adder in [[Floating-Point Operators]].
- [[Absolute Difference Operator]] – one compound tree over $(X,\overline{Y})$ yields both differences plus an equality flag, cheaper than a separate [[Comparators|comparator]].
- [[Compound Triple Sum]] – $X+Y$, $+1$ and $+2$ together, via a half-adder row that collapses position $0$; floating-point rounding again.

### On FPGAs, where the asymptotics reverse

Two facts change every conclusion above: carry propagation runs on hardened, non-programmable carry logic with dedicated routing, and the adder barely uses the LUT it sits in ([[FPGAs]], [[Lookup-Tables]]).

- [[FPGA Hard Carry Chain Adder]] – start here. At $0.015$ ns per bit of chain against $\ge 0.14$ ns per LUT level of a tree, a fast adder architecture is *useless* on FPGA up to at least 32 bits (p. 134). This is the note that invalidates most of the VLSI section for this target.
- [[LUT-Merged Adder]] – the corollary: the unused LUT in front of each carry cell is free logic, and what you put there is the book's canonical target-specific optimisation.
- [[Ternary Adders on FPGAs]] – spend that free layer on a carry-save row, and $X+Y+Z$ costs what $X+Y$ costs; ask for this before you ask for two adders.
- [[Sign-Configurable Adder/Subtractor]] – independent negate selects on both operands, which forces the ternary structure because $-X-Y$ needs a constant $+2$ and there is only one carry-in; the SAD kernel.
- [[Pipelined Ripple-Carry Adder]] – the natural FPGA answer to width, because the BLE flip-flops are already wired to the adder output and an unused one is wasted, not saved.
- [[AAM Carry-Select Adder]] – the one combinatorial FPGA scheme that earns its keep, and only past ~256 bits, where cryptography lives.

### Where this sits

[[Number Formats]] fixes the operand format and [[Error Accuracy]] owns every ulp the adder does not itself create. Downstream, addition is a floor on everything: [[Multipliers]] end in one, [[Dividers]] iterate one, [[Sums of Weighted Bits]] and its compressor trees exist only to feed one, [[Floating-Point Operators]] need the compound variants for rounding, and [[Comparators]] are a subtraction you throw the difference away from. Generators for the pipelined and FPGA-specific variants are in [[FloPoCo]].

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, **Chapter 5, "Fixed-Point Addition", pp. 103–143**.

- §5.1 Fixed-point considerations — pp. 104–106
- §5.2 Addition basics — pp. 106–112
- §5.3 Fast adders for VLSI — pp. 112–125, of which §5.3.6 parallel prefix adders and the associativity proof, pp. 118–123
- §5.4 Adders on FPGAs — pp. 125–134
- §5.5 Fast adders on FPGAs — pp. 134–139
