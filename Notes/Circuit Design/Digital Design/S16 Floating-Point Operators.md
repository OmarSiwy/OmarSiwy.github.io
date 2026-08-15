---
title: "Floating-Point Operators"
description: "Map of the 18 Floating-Point Operators notes, and the specification they all answer to."
kind: hub
source: "ASA Ch. 11, pp. 329-360"
status: seed
spade: n/a
tags: [digital, floating-point-operators, hub]
aliases:
  - "Floating-Point Operators"
  - "2.7) Floating-Point Operators"
---

# Floating-Point Operators

**Input.** Two numbers in a $(w_E,w_F)$ format — sign, biased exponent field $E\in[0,2^{w_E})$, fraction $F$ with an implicit leading bit — in either the IEEE 754 encoding or FloPoCo's `Nfloat`, which spends two extra bits on an explicit exception field instead of stealing exponent codes ([[Number Formats]]).
**Output.** One number in the same format, plus exception flags.
**Accuracy.** Round to nearest, $\le\tfrac12$ ulp — or **faithful**, $<1$ ulp, which is the interesting option here ([[Error Accuracy]]).
**Optimised for.** Latency first, since these blocks sit on the critical path of every floating-point datapath; then area. The chapter's own thesis: for a given *application-level* accuracy it is usually cheaper to use faithful operators than correctly rounded ones, and subnormal support usually costs more than widening the exponent by one bit (p. 330).

Every note below is a different answer to that one specification, so none of them restates it.

> [!important] The whole topic is one structural asymmetry
> By the exponent law $2^a2^b=2^{a+b}$, multiplication **separates exactly** into an exponent add and a significand multiply, and the product range $[1,4)$ is statically known, so normalization is a multiplexer. Addition cannot separate, because $2^a+2^b$ does not simplify: factoring out the larger scale leaves $M_X\pm M_Y2^{-d}$, a shift by a data-dependent amount, and cancellation then demands a leading-zero count and a *second* variable shift. Multiplication is costlier in area and structurally trivial — two $\log_2 w_F$-depth blocks. Addition is cheap in area and structurally awful — five such blocks in series (p. 340). Almost every trick in this topic exists to attack that chain of five.

### Start here

- [[Choosing a Floating-Point Operator]] – the trade-off table for all 18, in the source's own units (slow blocks on the critical path), plus what the last ulp costs per operator. Read it before picking anything; this hub deliberately does not duplicate it.

### The blocks every operator shares

- [[Floating-Point Exception Handling]] – read first, because every architecture below is drawn between an unpack and a pack block and neither is ever redrawn.
- [[Exponent Difference and Swap Unit]] – the front end of add, and where the saturation argument that sizes the alignment shifter is made.
- [[Sticky Bit Generator]] – read when you need IEEE compliance rather than ties-away; it is the bulk of the compliance cost in the adder and nearly free in the multiplier.
- [[Floating-Point Rounding Adder]] – why a carry out of the fraction updates the exponent for free, and hence why a biased exponent costs nothing.
- [[Subnormal Normalization Unit]] – read only if you actually need subnormals; the topic's recurring advice is to widen the exponent instead.

### Addition — the chain of five, and four attacks on it

- [[Floating-Point Adder]] – the baseline. Read it before any variant; the others are all defined as deletions from this datapath.
- [[Dual-Path Floating-Point Adder]] – the one structural insight of the topic: a large alignment shift and a large normalization shift are mutually exclusive, so build each shifter once and mux.
- [[Leading Zero Anticipator]] – read the moment dual path meets subnormals, which is when the near path grows a third slow block and becomes the critical path on its own.
- [[Speculative Floating-Point Adder]] – the extreme end, for calibrating how much silicon single-cycle double-precision addition actually costs.

### Multiplication — two blocks, and how to make it one

- [[Floating-Point Multiplier]] – the baseline, and the exclusivity argument that turns the exponent increment into a multiplexer rather than a carry propagation.
- [[Faithful Floating-Point Multiplier]] – read for the error-budget bookkeeping: a truncated significand multiplier leaves the architecture completely unchanged.
- [[Injection Rounding]] – read when the rounding adder is what is left on the critical path; it disappears into the multiplier's bit heap.

### Division — mostly exponent bookkeeping

- [[Floating-Point Divider]] – the significand algorithm lives in [[Dividers]]; this is what floating point adds around it, and it is almost entirely wires.
- [[Correct Rounding from Faithful Quotient]] – read as a cost argument, not a recipe: it is what buying the last bit in hardware looks like, and the source's conclusion is usually to buy the bit in the format instead.

### Square root — the easiest operator, with one trap

- [[Floating-Point Square Root]] – no rounding logic, no normalization logic, one addition on the exponent. Read for the parity trick that makes exponent halving free.
- [[Faithful Square Root Normalization Unit]] – read before shipping any faithful square root; it fixes a single input value that random testing will never find.
- [[Left-Truncated Squarer]] – the square-root transpose of the divider's deciding multiplier, and the general recipe for lifting a faithful algebraic function to a correctly rounded one.

### Comparison

- [[Floating-Point Comparator]] – read for the specification more than the circuit: the four mutually exclusive predicates, why $\le$ is not $\lnot(>)$, and why subnormal support is free.

### Where this topic sits

Formats, ulp and rounding modes are defined in [[Number Formats]] and [[Error Accuracy]] and are assumed throughout. The significand datapaths are borrowed wholesale: [[Adders]] and [[Shifters]] for addition, [[Multipliers]] for multiplication and for the truncated variants, [[Dividers]] and [[Digit Recurrence for Algebraic Functions]] for quotient and root, [[Comparators]] for the swap and the comparator, [[Sums of Weighted Bits]] for the bit heap injection rounding exploits, and [[Squarers and Integer Powers]] for the left-truncated squarer.

Downstream, [[Floating-Point Specialization]] strips these operators down when one operand or one exponent range is known; [[Exact Accumulators]] replace the adder outright when summation order must not matter; [[Floating-Point Exponential]] is the first operator built *on top of* this set rather than beside it. [[FPGAs]] changes two decisions here — the swap is taken on the whole exponent-fraction concatenation because wide comparison is cheap on the carry chain, and injection rounding fits the bit-heap flow natively. Every architecture in the topic is generated by [[FloPoCo]].

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 11 "Basic Floating-Point Operators", pp. 329–360.
  - Chapter introduction — the three difficulties, faithful versus correct rounding, compliance as a context-specific choice, pp. 329–330
  - Sect. 11.1 Addition/subtraction, pp. 331–342; Sect. 11.2 Multiplication, pp. 343–347; Sect. 11.3 Division, pp. 347–352; Sect. 11.4 Square root, pp. 353–357; Sect. 11.5 Comparison, pp. 357–360
