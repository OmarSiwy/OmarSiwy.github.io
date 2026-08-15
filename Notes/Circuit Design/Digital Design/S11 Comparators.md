---
title: Comparators
description: "Map of the 7 Comparators notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, comparators, hub]
aliases:
  - Comparators
  - "2.2) Comparators"
---

# Comparators

**Inputs.** Two $w$-bit unsigned integers $X$ and $Y$. Fixed-point and signed operands
reduce to this case exactly and for free (see *Format handling* below), so the whole
topic is stated over integers.
**Outputs.** One to three mutually exclusive Booleans $X<Y$, $X=Y$, $X>Y$, *and only
the ones the context asks for*. Building all three when one is wanted is the standard
waste in this block.
**Accuracy.** Exact, $0$ ulp, always. A comparator computes an order, not a value:
there is nothing to round and no error budget to spend ([[Error Accuracy]]). The only
failure mode is a wrong format alignment *before* the compare.
**Optimised for.** LUT/gate count first, logic depth second. Comparison is rarely the
critical path on its own — it is a leaf inside floating-point compare, or an exponent
difference inside FP addition — so it is its area that multiplies up.

Every note below is a different answer to that one question, and they differ almost
entirely in *which predicate* they promise and *what routing resource* they ride on.

### Start here

- [[Choosing a Comparator]] – compares: the trade-off table with the source's own LUT
  formulas and the two crossover widths (64 bits, "several thousand"). Read it before
  you commit to any construction below; the hub deliberately does not duplicate it.

### The two predicates, from first principles

These two are the whole topic in miniature. Everything after them is a re-mapping of
one of the two onto better silicon.

- [[Equality Comparator]] – the cheap half. $X=Y$ is a plain associative AND-reduction
  over per-bit XNORs, so it collapses to one bit per tree edge. Read it to see the one
  direction in which asking for less genuinely buys less.
- [[Magnitude Comparator]] – the expensive half, and the one that motivates the rest.
  $X<Y$ is the negated carry-out of $X+\overline{Y}+1$, so an ordering comparator is
  an adder with every sum bit thrown away. Read it for the identity that makes the
  carry chain the natural substrate.

### Format handling

- [[Two's-Complement Comparator]] – depends-on: signed operands, and operands in
  different fixed-point formats, both reduce to the unsigned problem by wiring alone
  (exchange the MSBs; zero-pad to a common format). Read it once, then stop thinking
  about formats for the rest of the topic — and note that the zero padding it inserts
  is exactly the constant material the last note below feeds on.

### Structure: the prefix reduction

- [[Binary Tree Comparator]] – the architectural core. Carry a $(G,E)$ pair per edge
  and the divide-and-conquer recurrence is *literally* the adder's $(g,p)$ prefix
  operator with the names changed. Read it for why every prefix topology from
  [[Adders]] transfers to comparison unchanged, and treat it as the mental model even
  where it is not the implementation.

### FPGA realisations

On an FPGA the tree of the previous note loses to a chain, because the dedicated carry
path is far faster than the general routing a tree's edges must cross. These three are
the constructions you actually instantiate.

- [[Fast Carry Chain Comparator]] – the default, and what synthesis already emits.
  Two aligned 2-bit chunks per basic logic element ([[FPGAs]]) feed a synthetic
  subtraction on the hard carry chain. Read it to see the prefix reduction of the
  previous note appear as *generate / propagate / kill* on real hardware.
- [[Two-Level Fast Carry Comparator]] – extends: when one chain of $w/2$ is finally
  too long, chunk in parallel, re-encode each verdict as a $(G,E)$ pair and compare
  the synthetic operands on a second chain. Read it for the $\sqrt{w}$ balance point —
  and for why its area is strictly worse, so it earns its keep only at extreme widths.
- [[Constant Comparator]] – the one free lunch. Freezing $Y$ collapses every leaf to a
  wire or an inverter, so a LUT can spend all its inputs on $X$ and the chunk width
  grows accordingly. Read it whenever one operand is a threshold, a bound, or a
  zero-padded field; read the warning in it before assuming the tools will do this
  for you.

### Where this topic sits

Comparison inherits its structure from [[Adders]]: the same associative prefix
operator, the same topologies, the same reason the FPGA carry chain wins. It inherits
its operand semantics from [[Number Formats]] and promises the exact result that
[[Error Accuracy]] never has to account for. Downstream it is a leaf inside
[[Floating-Point Operators]] — sign/exponent compare, exponent difference, and the
zero and special-value tests — and its constant case is the same
"a frozen operand collapses the operator" pattern as
[[Multiplication by Constants]]; [[FloPoCo]] is where the non-default variants are
actually generated.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6
  "Fixed-Point Comparison", pp. 145–150.
