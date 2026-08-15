---
title: "Flip-Flops and Latches"
description: "Map of the 12 Flip-Flops and Latches notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, flip-flops-and-latches, hub]
aliases:
  - "Introduction to Flip-Flops & Latches"
  - "Flip-Flops and Latches"
  - "0.3) Introduction to Flip-Flops & Latches"
  - "Metastability and MTBF"
---

# Flip-Flops and Latches

**Input:** one data bit $D$ [1] plus a clock [1]. **Output:** one bit $Q$ [1] holding that value across a clock boundary. **Accuracy: exactly $0$ ulp** — storage does not approximate, there is nothing to round, and none of the error reasoning in [[Error Accuracy]] applies to any note below. **Optimised for:** maximum clock frequency at a given area and clock power, subject to a hold-safety constraint that is not negotiable.

The $0$ ulp is conditional, and the condition is the whole topic. It holds only while the two timing inequalities below are satisfied at every PVT corner; violate them and the failure is not a small perturbation but an arbitrary bit, or no bit at all for an unbounded time. So the failure mode here is categorical rather than numerical, which is why every note below states constraints as inequalities and none of them states an error bound. Every circuit in this folder is a different bargain between how cheaply it stores and how checkable that condition is.

### Start here

- [[Choosing a Storage Element]] – the trade-off table across all ten circuits, with the source's own transistor, clocked-load and MTBF numbers. Read it first to know what you are choosing between, then come back for the derivations. This hub deliberately does not duplicate it.

### The bistable core, and making it writeable

- [[Cross-Coupled Inverter Bistable]] – read for the loop-gain argument: why two inverters have exactly two stable states and one unstable one, and why that third point is unavoidable rather than a design defect.
- [[SR Latch]] – read for the cheapest way to overpower the loop from outside, and for the one input code that has no consistent answer.
- [[Switch Debouncer]] – read for the one application where that forbidden code is unreachable by construction, so the cheapest circuit wins outright.
- [[Transparent D Latch]] – read for how tying $R=\bar S$ removes the invalid code entirely, and for what transparency then costs you for a whole clock phase.

### Getting a hard edge

- [[Master-Slave D Flip-Flop]] – read for the invariant that buys everything downstream: two latches never transparent at the same instant, hence no combinational path from $D$ to $Q$ at any instant.
- [[JK Flip-Flop]] – read to understand old excitation tables and why the cell disappeared from libraries, not to instantiate one.
- [[T Flip-Flop]] – read for the toggle structure, which is still the right counter bit even though no library carries it as a cell.

### Making the edge trustworthy

- [[Setup and Hold Constraints]] – read for the two inequalities the whole flow checks, and for which of them you can buy with frequency.
- [[Clock Skew and Jitter]] – read for where the uncertainty in those inequalities comes from, and which half of it you are allowed to exploit.
- [[Synchronizer Chain]] – read when a signal arrives from another clock domain, where the aperture window will eventually be violated no matter what you do.

### Holding a value without a new edge

- [[Clock Enable Flip-Flop]] – read for the timing-safe way to hold, free on an FPGA's dedicated `CE` pin and a per-cycle tax on an ASIC.
- [[Integrated Clock-Gating Cell]] – read for the same hold performed by removing the clock instead of the data, and for why the latch inside the cell is not optional.

### Two ideas that live here rather than in their own note

**Setup and hold are one aperture, and the asymmetry between them is the most consequential fact in sequential design.** Around each capture edge sits a keep-out window $[-t_{setup},\,+t_{hold}]$ during which $D$ must not move: $t_{setup}$ is the time the master's internal loop needs to regenerate a full-swing value before it is cut off, $t_{hold}$ is the time until the master's transparency window is genuinely closed. That single window produces two inequalities, and the clock period appears in only one of them. Setup is a max-delay check against the *next* edge, so a slower clock always fixes it — a setup failure is a performance bug and you ship the part derated. Hold compares two paths launched by the *same* edge, so $T_{clk}$ cancels out algebraically; a hold failure is broken at DC, at every frequency, forever, and no board-level change rescues it. Everything else follows: hold is signed off at the fast corner and setup at the slow one, hold is fixed by *adding* buffer delay (which costs area and leakage but never frequency), and tools insert that delay generously because the alternative is a dead die. The note linked above carries the derivation of both inequalities.

**Skew and jitter are both displacements of the same edge, but only one of them is yours to spend.** Skew is spatial and static — unequal tree depth, unequal load, on-die $V_{DD}$ and temperature gradients — so it is repeatable, measurable, budgetable, and can even be scheduled deliberately: positive skew buys setup margin and spends hold margin, one-for-one. Jitter is temporal and random — PLL noise, supply ripple, thermal noise in the tree buffers — so it can only be budgeted, never exploited. The asymmetry that matters is which check each one reaches. Both appear in the setup inequality; skew also appears in the hold inequality and is the term that turns a hold check from comfortable to violated, while jitter is common-mode across a single-edge comparison and largely cancels there. That is why a clock tree is worth 20–40 % of a chip's dynamic power: the whole expense buys a small, bounded skew number. The note linked above carries the axis-by-axis comparison table.

### Where this topic sits

[[Boolean Algebra]] and [[Combinational Logic]] supply the gates and the mux these circuits are assembled from — an inferred latch is usually an incomplete `if` or `case` from there, not an intentional storage element. Everything downstream assumes the hard edge this folder builds: [[Synchronous Sequential Logic]] treats the flop as a pure $z^{-1}$, [[Counters]] is the toggle structure replicated, and [[FPGAs]] is where the whole cost model inverts because flops are free and latches cost a LUT and a special-cased timing path. [[Dual-Phase Latches]] is the deliberate retreat from the hard edge, giving up $0$-slack boundaries to let a fast stage lend time to a slow one — read it only with the hold-margin asymmetry above already in hand. [[Asynchronous Sequential Logic]] is what you are left with when there is no shared edge at all.

## References

> [!warning] No book source, hence no page-level citations
> This topic falls outside de Dinechin & Kumm; the long-form note it replaces carried no page references, and none have been invented here. Chapter-level canon only:

- Weste & Harris, *CMOS VLSI Design*, ch. on sequential circuit design — latch and flop circuit structures, the setup/hold/skew derivation, useful skew, and the metastability time constant $\tau$.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, ch. on designing sequential logic circuits — bistability and the loop-gain argument, master–slave race-through, pulsed latches.
- Mano & Ciletti, *Digital Design*, ch. on synchronous sequential logic — SR/D/JK/T characteristic and excitation tables.
- Wakerly, *Digital Design: Principles and Practices*, sequential-logic chapter — latch/flop behaviour and switch debouncing.
- Ginosar, "Metastability and Synchronizers: A Tutorial", *IEEE Design & Test*, 2011 — the MTBF model and the synchronizer design rules.
