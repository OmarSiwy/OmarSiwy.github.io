---
title: Sums of Weighted Bits
description: "Map of the 16 Sums of Weighted Bits notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, sums-of-weighted-bits, hub]
aliases:
  - Compressor Trees
  - Sums of Weighted Bits
  - "2.3) Sums of Weighted Bits"
---

# Sums of Weighted Bits

**Input.** Any finite multiset of *weighted bits* $(i,b)$ — a bit $b\in\{0,1\}$ tagged with a position $i\in\mathbb{Z}$, contributing $2^i b$. Partial products, table outputs, sign-extension bits and rounding constants are all the same type; there is no word structure left to respect.
**Output.** One fixed-point number in `ufix`/`sfix` with LSB $2^{\ell}$ ([[Number Formats]]).
**Accuracy.** Faithful to $2^{\ell}$: $\bar\delta_R<2^{\ell}$, strictly under one ulp ([[Error Accuracy]]). A bit that cannot move the result by that much is never built.
**Optimising.** Area first — LUTs on FPGA, cells on ASIC — then depth, with the final adder's *width* as a secondary objective because it sits on the critical path.

Every note below is a different bracketing of the same sum. Two facts license all of them and nothing else is needed: $V(\mathcal{B})=\sum 2^i b$ is defined by an addition, and addition in $\mathbb{Z}$ is commutative and associative. Commutativity says the vertical order inside a column is meaningless; associativity says any grouping — by rows, by columns, or by neither — computes the same value.

**Bit heap.** The canonical form the topic is built on: a multiset of weighted bits together with its value $V(\mathcal{B})$, which forgets where each bit came from and which word it belonged to. That forgetting is the optimisation — it is also the cost, because word-level structure is what made resource sharing visible. Heaps are closed under sum and product, so by induction *any* multivariate fixed-point polynomial is one heap. Merging every heap in an operator into one is therefore always possible and not always right: in the source's sine/cosine datapath, folding $\times\pi$ into both $Z^2/2$ and $Z^3/6$ recomputes $Z=\pi Y_\text{red}$ twice, which is operator fusion paid for out of resource sharing (p. 160).

### Start here

- [[Bit Heaps]] – the canonical form, the closure argument, and why one heap can absorb a whole operator.
- [[Choosing a Compressor Tree]] – the trade-off table with the source's real numbers, across all fifteen circuits. Read it once now to know what the rest of the list is arguing about; this hub deliberately does not duplicate it.
- [[Compressor Trees]] – the shape every scheduling note specialises: heap in, height-2 heap out, no carry propagation until the final adder.

### Getting a computation into a heap

Before any hardware is chosen, the heap itself is rewritten. These four are transformations on the multiset, not circuits in the usual sense.

- [[Merged Multiply-Accumulate]] – the cheapest possible demonstration that fusion pays: $XY+A$ costs one extra row, not a second operator.
- [[Constant-One Sign Extension]] – read before attempting anything signed, because naive sign extension replicates a bit across half the heap and this collapses all of it into one constant row.
- [[Single-Heap Polynomial Evaluation]] – where the closure argument stops being theory: $X-X^3/6$ as one compression instead of two chained multipliers, and the width at which that reverses.
- [[Truncated Bit Heap]] – how the "faithful to $2^{\ell}$" clause of the specification is spent, deleting the cheapest bits from the right until the error budget is exhausted.

### Scheduling full adders

Given only half and full adders, the whole design problem is *when* to apply them. The two poles are compress-as-late-as-possible and compress-as-soon-as-possible; they use the same number of stages and differ in everything else.

- [[Dadda Tree]] – the ALAP pole, and the source of the $m_l=\lfloor 1.5\,m_{l-1}\rfloor$ bound (Table 7.1, p. 176) that fixes stage count for every other note here.
- [[Reduced Area Compressor Tree]] – the ASAP pole the book actually presents; read it for why a *longer* schedule can be the cheaper circuit once the final adder is counted (14-bit versus 10-bit on the same $8\times8$ heap, p. 180).
- [[Wallace Tree]] – the historically famous ASAP schedule, which the source never names; read it to translate the wider literature into this book's vocabulary.

### The compressor library

FA and HA are a minimal set, not an efficient one. Each of these widens the library, and each changes what the scheduling notes above are even optimising.

- [[Parallel Counter]] – the $(p;q)$ generalisation of the full adder, and the reason column-shaped compressors go dead once the heap is shorter than $p$.
- [[4:2 Compressor]] – the first compressor that works *across* columns, and the first one usable down to the last stage because it propagates nothing.
- [[Carry-Chain 4:2 Compressor]] – the same cell rebuilt to exploit the FPGA carry chain rather than avoid it; the counter-example to "carry-save is a bad fit for FPGAs".
- [[Generalized Parallel Counter]] – inputs of mixed weight in one cell, which is what makes an FPGA library large and irregular, and what demotes the plain full adder to the worst compressor on the device.

### Synthesis, pipelining, and the tail

With an irregular library, scheduling stops being a heuristic on column heights and becomes a covering problem.

- [[Efficiency-Driven Compression Heuristic]] – the greedy $E=\delta/k$ ordering that scales to 16 384-bit heaps at a linear 0.55 LUT6 per compressed bit (Fig. 7.29, p. 197); the default, and the baseline the ILP formulation is measured against.
- [[Pipelined Compressor Tree]] – read this before believing any combinational area figure, because registering the stages reprices the free wire and flips the objective toward compressing early.
- [[Split Final Adder]] – the part of the datapath no compressor touches; bits leave a triangular heap at wildly different times, so one uniform fast adder is money wasted.

### Where this sits

[[Multipliers]] and [[Multiplication by Constants]] are the largest producers of heaps, with [[Table-Based Function Evaluation]], [[Polynomial Approximation]] and [[LTI Filters]] close behind — each emits a heap and asks nothing about the technology. Downstream, everything here terminates in [[Adders]], and the compressor library is chosen by [[FPGAs]] versus an ASIC cell library. [[ILP for Arithmetic Design]] supplies the exact solver the heuristic is benchmarked against, and [[FloPoCo]] is where these generators actually live.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 7 "Sums of Weighted Bits", pp. 151–201.
