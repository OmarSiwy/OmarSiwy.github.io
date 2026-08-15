---
title: Squarers and Integer Powers
description: "Map of the 11 Squarers and Integer Powers notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, squarers-and-integer-powers, hub]
aliases:
  - Squarers and Integer Powers
  - "3.3) Squarers and Integer Powers"
---

# Squarers and Integer Powers

**The specification.** One operand $X$ in $\mathrm{ufix}(m,\ell)$ or $\mathrm{sfix}(m,\ell)$ — there is no second input, and that is the whole point. One output $X^p$ for a fixed positive integer $p$, exactly representable in $\mathrm{ufix}\big(p(m{+}1),p\ell\big)$ unsigned; for signed $X$ the LSB is still $p\ell$ but the parity of $p$ decides the output's signedness, since an even power cannot be negative. Accuracy is **exact**, or **faithful** ($<1$ ulp, [[Error Accuracy]]) once the low columns are dropped — correct rounding is off the table above 8 bits, because deciding the last bit needs the tail you just discarded. What is being minimised is **area**: heap bits and AND gates on ASIC, LUTs and DSP blocks on [[FPGAs]]. Latency follows from heap height and is never the driver.

> [!important] One fact generates the whole topic
> The two operands are literally the same signal, so the partial-product array
> is symmetric about its diagonal. Commutativity merges the two triangles and
> idempotence turns the diagonal into wires, so the array folds in half at the
> cost of *re-weighting* bits — which is to say at the cost of nothing. Every
> note below is that fold applied at a different granularity, or the price of
> giving it up.

Formats are fixed once in [[Number Formats]]; the heap that everything here
feeds is [[Sums of Weighted Bits]]. Neither is re-derived in any note below.

### Start here

- [[Choosing a Squarer]] – the trade-off table with the source's real numbers: gate and heap counts, DSP counts, the $3/4$ Booth factor, the T1 efficiency figure. Read it first and come back to it after each note; this hub deliberately does not duplicate it.

### The exact squarer at bit level

- [[Folded Array Squarer]] – the derivation that justifies the entire topic, and the default you should have to argue your way out of. Everything else is a modification of this array, not a competitor to it.
- [[Booth-Recoded Squarer]] – the one genuine competitor, and it loses. Worth reading precisely because it explains *why* a second redundancy-killing trick cannot pay when the fold got there first.

### Coarser radices, where the DSP block is the scarce resource

- [[High-Radix Squarer]] – the same symmetry applied one level up, between $k$-bit subwords instead of single bits. Read it when the binding constraint stops being LUTs and starts being hard multipliers.
- [[DSP-Cascade Squarer]] – what to do when the algebra is right but the shift amounts do not line up with the DSP chain's fixed offset. A case study in a mapping constraint the mathematics cannot see.

### Trading accuracy for area

- [[Truncated Squarer]] – the moment the application tolerates a faithful result. Read it for the one rule that is squarer-specific rather than inherited from truncated multipliers: half-height columns buy exactly one more column of truncation.

### FPGA tiling

- [[Squarer Tiling]] – the framing note for the three that follow: only the region on and above the diagonal has to be covered, which turns a solved multiplier problem into a differently-shaped one.
- [[Diagonal-Straddling Squarer Tile]] – read it for the counter-intuitive move of *deliberately* computing a block of bits twice and subtracting the excess back out.
- [[Squarer Staircase Tile]] – the only tile in the library that has no multiplier counterpart, and the reason is physical: one operand means shared inputs, and shared inputs are exactly what lets a LUT6 fracture.

### Beyond $p = 2$

- [[Cube Bit Heap]] – read it to see the fold fail. The multinomial factor $3$ does not absorb into a weight the way the factor $2$ does, so the heap grows cubically and the direct expansion stops being interesting.
- [[Square-and-Multiply Power Chain]] – the generic answer for any $p$: binary exponentiation in silicon, logarithmically many operators whose *widths* are exponential in the depth.
- [[Faithful Fixed-Point Power]] – the same chain made affordable by refusing to be exact. Read it last; it is where truncation and the power recursion meet.

### Where this topic sits

Upstream, a squarer is a [[Multipliers]] array with half its entries deleted, and it hands its result to the same compressor tree and final [[Adders]] as any other bit heap, so [[Sums of Weighted Bits]] is a prerequisite rather than a neighbour. The re-weighting that makes the fold free is the same free-shift argument as [[Multiplication by Constants]]. Downstream, [[Table-Based Function Evaluation]] takes over below about 8 bits and returns correct rounding for free, [[Fixed-Point Function Approximation]] subsumes $X^p$ as just another smooth function when the exponent is large or fractional, the significand squarer of a floating-point square belongs to [[Floating-Point Specialization]], and the optimal tilings of the FPGA notes are produced by the machinery of [[ILP for Arithmetic Design]].

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chap. 14, *Fixed-Point Squares, Cubes, and Other Integer Powers*, pp. 443–451.

- §14.1 Generalities — output formats, parity of $p$, tabulation below 8 bits, pp. 443–444
- §14.2 Squarers — basics, high-radix, Booth recoding, truncation, FPGA tiling, pp. 444–449
- §14.3 Cubes and Other Powers — direct expansion, square-and-multiply, approximate powers, pp. 449–451
