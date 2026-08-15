---
title: "Table-Based Function Evaluation"
description: "Map of the 12 Table-Based Function Evaluation notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, table-based-function-evaluation, hub]
aliases:
  - "Table-Based Function Evaluation"
  - "4.2) Table-Based Function Evaluation"
---

# Table-Based Function Evaluation

One ROM evaluates any function in one cycle and costs $2^{w_X}$ entries. Every
circuit below is a way of paying less than that exponential without ever
multiplying.

**Input.** One unsigned fixed-point word $X \in [0,1)$ of $w_X$ bits,
$\ell_X = -w_X$, domain and range already prepared by
[[Fixed-Point Function Approximation]]; formats are [[Number Formats]].
**Output.** $R(X)$ at LSB $\ell_R$, approximating a continuous, differentiable
$f$ with bounded first and second derivatives.
**Accuracy.** *Faithful*: $|R(X) - f(X)| < 2^{\ell_R}$, strictly under one ulp.
That single ulp is the entire budget and it is split three ways — approximation,
table filling, final rounding — once, in the multipartite error analysis, so no
other note re-derives it ([[Error Accuracy]]).
**Optimised for.** Total table bits. Table cost is exponential in $w_X$ and
everything else is linear, so the exponential term is the only one worth
fighting; adders are the currency spent to buy the reduction, and adder count
and latency are secondary. Multiplier-free is a **hard constraint**, not an
objective: the family exists precisely to avoid the multiplier that a linear
interpolation would need.

- [[Choosing a Table Method]] – the trade-off table: table bits at $w_X = 8$ and
  $16$, adder count, latency and measured error for every method here, with the
  source's own numbers. Read it first if you are picking rather than learning.

### The lossless one

- [[LDTC, Lossless Differential Table Compression]] – not an approximation at
  all: it replaces any table with two smaller ones and an addition that
  reproduces it bit for bit. Read it first because it composes with everything
  below and costs nothing in accuracy or verification.

### The bipartite core

The load-bearing derivation of the topic, in three steps. Read them in order;
everything after is a refinement of this datapath.

- [[Bipartite Table Method]] – splits the input into value bits and offset bits,
  and shows why tabulating *the product* $s(C) \times 2^{-\alpha}B$ rather than
  the slope is what deletes the multiplier. The $\alpha \approx 2w_X/3$ rule of
  thumb lives here (p. 506).
- [[Symmetric Table of Offsets]] – two rows of XOR gates buy a 4× reduction in
  the offset table, by exploiting the symmetry of a linear segment about its
  centre. The cheapest win in the chapter.
- [[Multipartite Methods]] – splits the offset word itself, so one offset table
  becomes $m$ smaller ones with a private slope resolution each. Read it for the
  full error analysis and the guard-bit formula that every note above inherits.

### Making a multipartite operator real

Four notes on what the search actually does once the decomposition is chosen.

- [[Multipartite with Compressed TIV]] – the value table dominates the total, and
  it is exactly the smooth table LDTC was built for. Zero accuracy cost, so it
  drops into the search without touching the error budget.
- [[HUB Table Filling]] – how the tables are actually rounded, and the
  half-ulp accounting that makes the final rounding a pure truncation with no
  hardware at all.
- [[Monotonic Multipartite Tables]] – faithful does not mean monotonic, and this
  method violates it unusually often. Read it before promising a customer a
  monotonic operator, and for what the guarantee costs.
- [[ILP-Optimized Multipartite Tables]] – hands the table entries to a solver
  instead of an analytic error bound. The only route to *correct* rounding here,
  and it caps out under 16 bits ([[ILP for Arithmetic Design]]).

### Adding before the lookup

A separate family that also allows additions on the *address* side. Both are
historically important and both lose to generalised multipartite (p. 526) — read
them for the idea, not for the architecture.

- [[ATA, Addition-Table-Addition]] – approximates the derivative by a forward
  difference taken from the same table, so $f$ near $A$ is a shrunken copy of its
  own graph. Two lookups in one table.
- [[Central-Difference ATA]] – the same trick centred, whose error is third
  order; also where the extra lookups start eating the accuracy the better
  formula just bought.
- [[STAM, Symmetric Table Addition Method]] – the practical member of that
  family: two centred differences plus a correction table, and the one with
  published 24-bit numbers.
- [[Partial Product Array Function Evaluation]] – flattens the whole polynomial
  into weighted products of input bits and prunes them. Read it as the cautionary
  case: flattening discards the continuity that multipartite exploits directly.

### Where this sits

Upstream, [[Fixed-Point Function Approximation]] fixes the domain, the range and
the plain-ROM baseline these all beat. Downstream, the exponential returns above
about 24 bits and you move to [[Polynomial Approximation]], where order two
relaxes the $\alpha \gtrsim w_X/2$ bound to $\alpha \gtrsim w_X/3$ (p. 523) and a
multiplier becomes worth its cost. The reconstruction adders are the bit heaps of
[[Sums of Weighted Bits]]; what a table *really* costs in LUTs or block RAM is
[[FPGAs]], and the search itself ships in [[FloPoCo]].

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17,
"Function Evaluation Using Tables and Additions", pp. 497–527. Table cost model
from Sect. 16.4.2, pp. 491–492.
