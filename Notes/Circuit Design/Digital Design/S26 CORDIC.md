---
title: CORDIC
description: "Map of the 10 CORDIC notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, cordic, hub]
aliases:
  - CORDIC
  - "5.1) CORDIC"
---

# CORDIC

**The specification.** Input: one binary angle $X$ in $\mathrm{sfix}(0,\ell)$ — two's complement, $X\in[-1,1)$, $-\ell$ fractional bits — whose trigonometric argument is $\pi X$, so $X$ spans exactly one period. Output: the pair $(C,S)\approx(\cos\pi X,\sin\pi X)$, both in $\mathrm{sfix}(0,\ell)$, computed by one *fused* operator because every method here produces both anyway and the callers (rotations, DDS, mixers) want both. Accuracy: **last-bit accurate**, $|\delta_\text{total}|<1\,\mathrm{ulp}=2^{\ell}$, measured against the scaled functions $f_{\sin}(x)=(1-2^{\ell})\sin\pi x$ and $f_{\cos}(x)=(1-2^{\ell})\cos\pi x$ ([[Error Accuracy]]). Optimised for: **throughput per area at fixed accuracy** — everything below is fully pipelined unless it says otherwise, and the question is which architecture buys that throughput for the fewest LUTs, DSPs and stages.

Two decisions are made once, here, and never re-argued in the notes below. **Angles are binary, not radians**, because $2\pi$ is irrational and can never tile the fixed-point grid, whereas modulo-$2\pi$ periodicity becomes the free modulo-$2$ wrap of two's complement — which is also why an operator specified on $[-1,1)$ evaluates any wider argument at zero cost by dropping integer bits ([[Number Formats]]). **The output is scaled by $(1-2^{\ell})$** because $1$ is not representable in $\mathrm{sfix}(0,\ell)$ and rounding $\cos 0$ up would wrap it to $-1$; the factor is absorbed into a constant every architecture already has, so it is free (pp. 602–604).

This is a case study, not a technique: one specification, four kernels, and the comparison is the point.

- **[[Choosing a CORDIC Architecture]]** – the trade-off table across all ten, with the chapter's own cost formulas, its single measured comparison, and an explicit list of what it never measures. Read it first if you are picking one, last if you are learning them. Deliberately the only place those numbers live.

### The wrapper every kernel wears

Neither of these is a choice; they are the front and back end of all four kernels, and they are exact — every step is a symmetry of the circle applied to a binary angle, so a bit permutation or a negation.

- [[Octant Argument Reduction]] – read this before any kernel note, because every kernel's input is $Y'\in[0,\tfrac14)$ and none of them says why. Also where the "complement instead of negate" trick is paid for, in ulps on the guard-bit datapath.
- [[Sine-Cosine Octant Reconstruction]] – the output side: eight $sqo$ patterns, a swap and a sign. Read it to see why an octant is the natural stopping point rather than a quadrant.

### The shift-and-add kernel

- [[CORDIC Rotation Mode]] – the algorithm itself: why $\alpha_i=\pm\arctan 2^{-i}$ turns a rotation matrix into two shifts and two adds, where the scale factor $K$ comes from and why it is data-independent, and the convergence argument. Everything in this family specialises it.
- [[Unrolled CORDIC]] – the baseline realisation: shifts become wiring, $\arctan 2^{-i}$ becomes a literal, and the operator is pure logic with zero DSP and zero block RAM. Read it for the two sizing results — how many iterations the error budget buys you, and how many guard bits the error recurrence costs you.
- [[Reduced-Z CORDIC Datapath]] – the one optimisation that is free: the convergence proof already says $|Z_i|<2^{-i}$, so the angle adder shrinks by a bit per stage. Read it as an example of a proof being cashed in as area.
- [[Reduced-Iteration CORDIC]] – stop when the residual is small enough to rotate by directly, and finish with two multipliers. Half the pipeline depth, and structurally a hybrid with the table family below.
- [[Iterative CORDIC]] – the same recurrence folded onto one stage: cycles instead of stages. Read it to see what unrolling was actually buying — the shifters stop being wiring and become two real barrel shifters, and the reduced-$Z$ trick dies.

### Split the angle coarsely instead

The same addition formula $\cos(a+b)=\cos a\cos b-\sin a\sin b$ that CORDIC applies $-\ell$ times, applied exactly twice.

- [[Table-and-Multiplier Sine and Cosine]] – head from a table, tail from a polynomial, recombined. Read it for the structural contrast with CORDIC: a shallow tree of independent errors instead of a deep chain of compounding ones, which is why its guard-bit count stops depending on the precision. It also spends the block RAM and DSPs that CORDIC leaves idle.
- [[Small-Angle Taylor Sine and Cosine]] – the tail evaluator, and the argument for Taylor over minimax here: sine's series is odd and cosine's is even, so half the multiplications, and the low coefficients are powers of two or powers of two over three.

### Or don't specialise at all

- [[Generic Polynomial Sine Evaluator]] – wrap the general-purpose polynomial machinery in a quadrant reduction and a $\sin/\overline{\cos}$ select bit. Read it for the cost of genericity: it computes one function per instance rather than a fused pair, so an application wanting both instantiates it twice.

### Where this sits

[[Number Formats]] fixes the input and output formats and [[Error Accuracy]] owns the three-way split $\delta_\text{total}=\delta_\text{final round}+\delta_\text{round}+\delta_\text{approx}$ that sizes every architecture here. Upstream, [[Adders]] supplies the carry-propagate adder that is CORDIC's only real component, [[Shifters]] the barrel shifters the iterative variant is forced to buy, [[Multiplication by Constants]] the $\times\pi$ block, and [[Table-Based Function Evaluation]] plus [[Polynomial Approximation]] the two halves of the non-CORDIC kernels. Downstream, the fused $(\cos,\sin)$ pair is the phase-to-amplitude stage of a DDS and the rotation kernel of an FFT; [[FPGAs]] decides most of the comparison, since the three families use three disjoint parts of the chip. Generators for all of it are in [[FloPoCo]] (`FixSinCos`, `FixSinOrCos`).

> [!note] The interesting comparison is not "is CORDIC good"
> CORDIC's whole argument is that it needs **no multiplier at all**, and it has been in FPGA vendor core generators since [And98] on that basis. On a device with idle DSP blocks and idle block RAM that argument has largely stopped applying, and the chapter's own recommendation for a pipelined FPGA sin/cos is the table-and-multiplier architecture (p. 621). The ASIC picture is explicitly left open — the FPGA verdict leans on fast carry logic, which favours CORDIC, *and* on tables and small multipliers mapping well into LUTs, which does not, and neither argument transfers.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, **Chapter 20, "Fixed-Point Sine and Cosine", pp. 599–621**.

- §20.1 Mathematical background, identities (20.1)–(20.18) — pp. 599–602
- §20.2 The specification: binary angles, scaled output (20.19)–(20.20), algorithm overview — pp. 602–605
- §20.3 Argument reduction, Figs. 20.5–20.6 — pp. 605–606
- §20.4 CORDIC, from the rotation matrices to the multiplier shortcut — pp. 605–614
- §20.5 Tables and multipliers — pp. 614–620
- §20.6 Generic polynomial evaluator — p. 620
- §20.7 Comparison and discussion, iterative versus unrolled — pp. 620–621
