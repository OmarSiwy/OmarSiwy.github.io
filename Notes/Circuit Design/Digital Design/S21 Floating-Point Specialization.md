---
title: "Floating-Point Specialization"
description: "Map of the 16 Floating-Point Specialization notes, and the specification they all answer to."
kind: hub
source: "ASA Ch. 15, pp. 453-472"
status: seed
spade: n/a
tags: [digital, floating-point-specialization, hub]
aliases:
  - "Floating-Point Specialization"
  - "3.4) Floating-Point Specialization"
---

# Floating-Point Specialization

**Input.** One runtime float $X=(-1)^{s_X}2^{E_X}(1+F_X)$ in $\mathrm{float}\langle w_E,w_F\rangle$ ([[Number Formats]]); the second operand is either a compile-time constant $C\in\mathbb{R}$, absent entirely, or constrained in sign or range by the application.
**Output.** $R$ in the **same** $\mathrm{float}\langle w_E,w_F\rangle$. Most of what follows breaks if $w_E$ or $w_F$ differ between input and output (p. 453).
**Accuracy.** The design knob, not a given: $1$ ulp (faithful) for the cheap variants, $0.5$ ulp (correctly rounded, bit-for-bit substitutable for a software run) when a compiler must be allowed to swap the operator in silently ([[Error Accuracy]]).
**Optimised for.** Area first, then latency — and both are bought by *deleting* hardware that existed only to handle a case which cannot occur: bias subtractors, generic significand multipliers, normalizers, rounding adders, whole datapath paths.

Every note below is a different answer to that one specification, so none of them restates it.

> [!important] Two opposite levers share this topic
> **Specialization** exploits a fact known at synthesis time — the value of an operand, the sign of the terms, the range of an exponent. The hardware that served the unknown case evaporates, and the mathematical result is unchanged. **Fusion** merges two operators so the intermediate between them is *never rounded* and one normalize-and-round step serves both; it costs a wider internal datapath and buys accuracy. Specialization trades accuracy or nothing for area; fusion trades area for accuracy. Read the two families with that sign flip in mind, because the same word "cheaper" means opposite things in each.

### Start here

- [[Choosing a Specialized Floating-Point Operator]] – the trade-off table for all 16, in the source's own units (bit widths, block counts, and the chapter's two published ratios). Read it before picking anything; this hub deliberately does not duplicate it.

### Multiplication by a constant — deleting the second operand

- [[Floating-Point Multiplier by a Power of Two]] – read first, because it is the degenerate case that shows what specialization *is*: the significand path disappears entirely and one spare exponent bit does all the exception work.
- [[Faithful Floating-Point Constant Multiplier]] – the baseline every other constant multiplier is a modification of; read it for the range argument that caps normalization at one bit.
- [[Product Normalization Predictor]] – read immediately after, because it is the trick that moves the exponent path off the critical path and lets rounding fall into the multiplier's bit heap ([[Sums of Weighted Bits]]).
- [[Correctly Rounded Floating-Point Constant Multiplier]] – read when the operator must be substitutable for software; it is where the last ulp is priced, at roughly twice the constant width (p. 460).
- [[Pseudo-Sticky Tie Anticipation]] – read as the compile-time parity argument that often proves the expensive part of correct rounding — the sticky path — is provably unreachable.
- [[Floating-Point Multiplier by a Rational Constant]] – read for the exclusion-zone theorem; it is the same style of argument that underwrites correctly rounded division, in its cleanest form.
- [[Saturated Normalizer]] – read before the subnormal architecture, since it is the one block that architecture adds.
- [[Constant Multiplier with Subnormal Support]] – read last of the family, and only if you actually need subnormals; it is where the cheap architecture gives its rounding trick back.

### Division by a constant — the same idea, one operator down

- [[Floating-Point Divider by a Small Odd Constant]] – read for the normalization decision that costs $E_D$ bits of comparison, and because this is the operator an FPGA compiler is meant to drop in for a generic divider ([[Division by Constants]]).
- [[Dividend Bias Rounding]] – read on its own even if you never divide by a constant: it is the general move of pushing a rounding correction from the result back into the dividend, where the shift has already zeroed the bits it needs.

### Powers of one operand

- [[Floating-Point Power Operator]] – read for what happens when the "known operand" is the *exponent* $p$ rather than a value: normalization grows to $p$ bits and is predicted by $p-1$ parallel comparisons ([[Squarers and Integer Powers]]).

### Specialization by range, not by value

- [[Positive-Term Floating-Point Adder]] – the one free lunch in the topic, and the one specialization that deletes a whole *path* rather than a block, at no accuracy cost (p. 468).
- [[Fused Add-Subtract Unit]] – read next, because it is the same dual-path structure of [[Floating-Point Operators]] rearranged rather than pruned: three paths and one shifter instead of four and two.

### Fusion — paying area for accuracy

- [[Fused Multiply-Add]] – read for the error algebra, not the datapath: it is the one operator here that is deliberately *universal* rather than application-specific, and the argument for it is about cancellation, not about half an ulp.
- [[Fused Sum of Squares]] – read as the closing of the loop: fusion is cheap under faithful rounding exactly when the terms are same-sign, which is the same condition that makes the positive-term adder cheap.

### When the specialization is a compiler's to find

- [[Divide-by-Self Specialization]] – read for the economics rather than the circuit: a rewrite that software must refuse becomes near-free in hardware, because the guard is a test on exponent bits ([[FPGAs]]).

### Where this topic sits

Everything here is a deletion from the baselines in [[Floating-Point Operators]], and reads as nonsense without them; formats, ulp and rounding modes come from [[Number Formats]] and [[Error Accuracy]]. The significand cores are borrowed: [[Multiplication by Constants]] and [[Division by Constants]] supply the shift-and-add and Euclidean machinery, [[Shifters]] the normalizers, [[Comparators]] the constant comparisons, [[Sums of Weighted Bits]] the bit heap that swallows the rounding bit, and [[Squarers and Integer Powers]] the fixed-point substrate under $X^p$.

Downstream, [[Polynomial Approximation]] takes over whenever faithful rounding is enough and the exact power is not needed, and [[Exact Accumulators]] answers the same summation problem the positive-term adder answers, by refusing to round at all rather than by exploiting sign. Every architecture in the topic is generated by [[FloPoCo]], and [[FPGAs]] is what makes the constant significand multipliers worth building — they leave the DSP blocks free.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 15 "Specialization and Fusion of Floating-Point Operators", pp. 453–472.
  - Sect. 15.1 Multiplication by a constant, pp. 453–464; Sect. 15.2 Division by a small integer constant, pp. 464–467; Sect. 15.3 Squares, cubes and $X^p$, pp. 467–469
  - Sect. 15.4 Addition of positive terms, p. 468; Sect. 15.5 Combined sum and difference, p. 469; Sect. 15.6 Fused multiply-add and sums of products, pp. 469–470; Sect. 15.7 Floating-point optimizations in an HLS context, pp. 470–472
