---
title: Exact Accumulators
description: "Map of the 12 Exact Accumulators notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, exact-accumulators, hub]
aliases:
  - Exact Accumulators
  - "5.2) Exact Accumulators"
---

# Exact Accumulators

**Input:** one $\text{float}(w_E,w_F)$ summand $X_i$ per cycle, or one pair $(X_i,Y_i)$ per cycle for $\sum X_iY_i$.
**Output:** $\text{float}(w'_E,w'_F)$, produced once at the end of the accumulation or once every $N$ inputs.
**Accuracy:** the summation itself is **exact — 0 ulp, independent of $N$**. The only rounding anywhere in the datapath is the single final conversion back to floating point, at $0.5$ ulp.
**Optimised for:** throughput first — accept a summand every cycle at an arbitrary clock frequency — then area.

Every circuit below is a different answer to that one question, and the answer is
always the same trick: keep the running sum in a **wide fixed-point register**
whose MSB no summand can exceed and whose LSB no summand can fall below. Then
nothing in the loop rounds (so the error stops depending on $N$) and the only
thing left in the loop-carried dependency is an integer add (so the alignment
shift and the normalisation move out of the loop, where they pipeline freely).
Accuracy and speed are usually a trade; here they are the same knob, because
both failures had the same cause. Format and ulp reasoning live in
[[Number Formats]] and [[Error Accuracy]] — no note below re-derives them.

> [!warning] Exact accumulation is not application accuracy
> An exact sum is no more accurate than the data thrown into it (the source's
> own fallacy box, p. 628). If some $X_i$ was itself a rounded result, the
> "exact" sum holds no meaningful bits below *that* summand's discarded LSB.
> What these circuits guarantee is that the **summation process** contributes
> nothing to the error budget, in a way that scales to any $N$.

### Start here

- [[Choosing an Accumulator]] – **compares:** the trade-off table for all twelve,
  with the source's own latency, width and area numbers. Read it before you
  commit to a variant; this hub deliberately does not duplicate it.
- [[Floating-Point Accumulator Loop]] – **counter-example:** the obvious circuit,
  and the two independent ways it fails. The rest of the topic exists because of
  this note.
- [[Exact Sum-of-Products Operator]] – **extends:** the whole composed datapath
  end to end, so you can see where each block below plugs in before studying it
  in isolation.

### The front end — getting a summand into the register

- [[Exact Unnormalized Multiplier]] – **supports:** why the multiplier feeding an
  accumulator should deliberately refuse to round or normalise, and why its
  doubly-biased exponent sum is already the shift distance.
- [[Sign-Padding Alignment Shifter]] – **supports:** where to put the negation
  XORs so they cost $w''_F$ bits instead of $w_A$. The expensive block in the
  whole operator, and the one $m_X$ is worth tuning for.

### The loop itself

- [[Two's-Complement Exact Accumulator]] – **depends-on:** the core register and
  adder. Read this before any of the three variants that follow.
- [[Sign-Magnitude Accumulator]] – **counter-example:** the alternative
  representation, and the second carry propagation it drags into the loop.
- [[High-Radix Carry-Save Accumulator]] – **extends:** what to do when a
  554-bit carry chain sets your clock period. Chunk it and defer the carries.
- [[Accumulator Exception FSM]] – **supports:** the four states a datapath with
  no notion of $\pm\infty$ or `NaN` still has to reproduce.

### Sizing the register

- [[Kulisch Accumulator]] – **compares:** the universal sizing, correct on data
  it has never seen, at ten times the area of an FP adder.
- [[Application-Specific Exact Accumulator]] – **compares:** the same circuit with
  $(m_A,\ell_A,m_X)$ pulled from physics and profiling, and the overflow and
  underflow handling that finiteness now forces on you. This is the one you
  actually build.

### The back end — getting a number out again

- [[Accumulator-to-Float Converter]] – **supports:** normaliser, exponent
  arithmetic, and the single adder that rounds and packs at once. Ask first
  whether you need this block at all — it is separable, and shareable across
  $N$ operators.
- [[Three-Zone Accumulator Converter]] – **extends:** the converter when the
  accumulator is wider than the output exponent range, which is every
  sum-of-products case.

### Where this sits

Upstream: [[Floating-Point Operators]] supplies the adder this topic replaces and
the multiplier it strips down; [[Shifters]] and [[Adders]] supply the aligner and
the wide carry chain that dominate the area. [[Rounding]] fixes what the single
final conversion is allowed to cost.

Downstream: [[FPGAs]] is where these circuits are most at home — the accumulator
register is free behind the carry chain, and a 64-bit accumulator clocks above
200 MHz (p. 635). [[Arithmetic for Deep Learning]] consumes the reproducibility
result: long, badly conditioned gradient reductions give the same answer
regardless of scheduling only if the summation is order-independent.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024,
Chapter 21, "Floating-Point Accumulation and Sum of Products", pp. 623–640.
