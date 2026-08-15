---
title: Multiplication by Constants
description: "Map of the 20 Multiplication by Constants notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, multiplication-by-constants, hub]
aliases:
  - Multiple Constant Multiplication
  - Multiplication by Constants
  - "3.1) Multiplication by Constants"
---

# Multiplication by Constants

**The specification.** Input: one variable $X$ in $\mathrm{ufix}(m_X,\ell_X)$ or $\mathrm{sfix}(m_X,\ell_X)$ ([[Number Formats]]), and one coefficient $C$ that is *not* a signal — it is a literal, known when the netlist is built. Output: $R \approx CX$ in a format whose LSB $\ell_R$ **the caller must state**, because a real $C$ has infinitely many bits and where to stop is an input to the problem, not a consequence of it. Accuracy: exact ($0$ ulp) when $C$ and $X$ are integers; faithful ($<1$ ulp) is the default target for real $C$; perfect rounding ($\le\frac12$ ulp) is reachable only by tabulation, or at roughly $w_X$ extra bits of constant width ([[Error Accuracy]], p. 389).

What is optimised is **area** — adder count on ASIC, LUT count on FPGA — with logic depth as the tie-break, because a constant multiplier is almost always replicated: a $64$-tap FIR instantiates $64$ of them.

> [!important] A constant is not an operand
> A generic multiplier must handle $2^{w_C}$ coefficients, so it builds a partial-product array and compresses it. A constant multiplier handles exactly one, and every partial product it would generate is known at synthesis time: the zero ones vanish, the nonzero ones are pure wiring. What is left is a *graph of additions*. The design problem stops being arithmetic and becomes **combinatorial optimisation** — "what is the cheapest addition graph whose output is $CX$" — and that problem is NP-complete (p. 369). Every note below either searches that space, or side-steps it by tabulation. None of them needs to restate this paragraph.

- **[[Choosing a Constant Multiplier]]** – the trade-off table across all 20, with the source's own adder counts, LUT formulae, depths and scaling laws, plus the ASIC/FPGA rules of thumb of p. 418. Read it first if you are picking one, last if you are learning them. It is deliberately the only place those numbers live.

### Adder graphs, integer constant

The whole family follows from distributing $X$ over the binary expansion of $C$; they differ only in which representation of $C$ you distribute over, and what you count as cost.

- [[Binary Shift-and-Add Constant Multiplier]] – the base case and the cost model: $\mathrm{nz}(C)-1$ adders, shifts free. Read it for the derivation every other note here assumes.
- [[CSD Constant Multiplier]] – the run-of-ones identity $2^{p+k}-2^p$ applied to the constant at compile time instead of the multiplicand at run time; buys a nonzero count of at most $\lceil\frac{n+1}{2}\rceil$, and buys nothing at all for constants with no runs.
- [[Minimum-Adder Constant Multiplier]] – why greedy recoding is not optimal ($93=3\times31$ in two adders, CSD needs three), and the two exact methods — precomputed graph enumeration, and an ILP whose objective you can swap.
- [[Ternary-Adder Constant Multiplier]] – the FPGA carry chain adds three operands for the price of two, so change the node type before you change the algorithm: every constant up to $22$ bits is three ternary adders or fewer.
- [[Minimum Full-Adder Constant Multiplier]] – read this the moment you are tempted to believe adder count is area. Shifted operands overlap only partially, so equal-adder graphs differ by a third in full-adder equivalents.

### Tables instead of graphs

FPGA-only; $\alpha$ is the architectural LUT input count, $4$ to $6$ on mainstream parts ([[FPGAs]]).

- [[Tabulated Constant Multiplier]] – the degenerate answer: if $w_X\le\alpha$, nothing is cheaper than one LUT per output bit, and no constant is special. One bit past that it collapses exponentially.
- [[KCM, Table-Based Constant Multiplication]] – tabulate $\alpha$-bit *chunks* of $X$ and sum the partial products. This is the FPGA default, and the reason is not speed: its cost is flat in the bit pattern of $C$, so there is no NP-complete search and no lucky-constant effect.

### When the constant is real

Two error sources now — the constant you can actually realise, and the final rounding — and the design is entirely about splitting one ulp between them.

- [[Tabulated Perfectly Rounded Constant Multiplier]] – the $\frac12$-ulp reference every other technique is measured against, usable only while $w_X$ is small.
- [[Faithful Shift-and-Add Real Constant Multiplier]] – the budget $|\delta_C| < 2^{\ell_R-1}/X_\text{max}$, and the point that makes the topic interesting: the *narrowest* admissible $\widetilde C$ is usually not the *cheapest*, so there is an interval of constants to search.
- [[Fix-by-Real KCM]] – the same split applied to tables: $D$ table roundings plus one final one give $g > \log_2 D$ guard bits, and the shift is absorbed into the table content so all tables share an output LSB.

### When the constant is rational

- [[Periodic Shift-and-Add Rational Constant Multiplier]] – a rational's binary expansion is eventually periodic with period the multiplicative order of $2$ modulo the denominator; doubling the period per stage doubles the correct bits per adder. Structure the generic SCM search cannot see — but only worth it for small denominators.
- [[Rational-Constant KCM Table]] – the same periodicity showing up as periodic *table columns*; a bounded win, because it shrinks the tables and not the adders.

### Several constants, several inputs

- [[Multiple Constant Multiplication]] – one input, many constants: the FIR/FFT/DCT case. Sharing is not visible in the individual optimal graphs ($43 = 19\cdot 2 + 5$), so MCM is its own problem with its own heuristics and its own ILP lower bound.
- [[Pipelined Adder Graph]] – read this as soon as throughput matters, because registers then dominate adders and the best combinational graph is the wrong starting point.
- [[Table-Based Multiple Constant Multiplication]] – sharing LUT *contents* rather than sub-constants; the tables are far from random, which is why $52$ distinct $1$-bit tables cover a great many constants.
- [[Sum of Constant Products]] – many inputs, one output. Literally the transpose: reverse every edge of an MCM graph and branches become adders. One graph, two operators.
- [[Constant Matrix Multiplier]] – many in, many out; complex multiplication is the canonical instance, and optimising the matrix as a unit beats optimising its rows.
- [[KCM-Based Sum of Products]] – fuse every table of every input into one bit heap and round once. The gain is exactly the intermediate roundings a naive composition would commit.

### Constant multiplication in hard blocks

- [[DSP-Block Constant Multiplier]] – uninteresting when DSPs are plentiful; the real subject is scarcity, and the free parameter $B$ in $c = c_\text{Low} \pm 2^B c_\text{High}$ that lets a search share sub-constants across taps.
- [[Reconfigurable Constant Coefficient Multiplier]] – when $C$ comes from a small set chosen at run time: fuse all the adder graphs and put MUXes on the inputs, or reconfigure the KCM tables themselves and accept ~32 cycles to do it.

### Where this sits

[[Number Formats]] fixes $\mathrm{ufix}/\mathrm{sfix}$ and $X_\text{max}$; [[Error Accuracy]] and [[Rounding]] own the ulp arithmetic every faithful variant here spends. Upstream, [[Multipliers]] is what you fall back to when the coefficient is a signal after all, and [[Sums of Weighted Bits]] owns the compressor tree that should be consuming these partial products instead of a rake of adders. Downstream, [[LTI Filters]] is the consumer that motivates MCM, SOPC and pipelining; [[Division by Constants]] is the sibling problem and often the better answer for small denominators; [[Floating-Point Exponential]] is the extreme case that settles the FPGA rule of thumb — tiny input, enormous constant $\log 2$. The exact methods live in [[ILP for Arithmetic Design]] and the generators in [[FloPoCo]].

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, **Chapter 12, "Multiplication by Constants", pp. 365–426**.

- §12.1 shift-and-add, signed digits, SCM, graph enumeration, ILP, ternary adders, bit-level cost — pp. 366–382
- §12.2 tabulation and KCM — pp. 383–385
- §12.3 fix-by-real, perfectly rounded tables, shift-and-add and KCM error budgets — pp. 386–394
- §12.4 rational constants, Lemmas 12.1–12.2 — pp. 395–401
- §12.5 MCM, SOPC, CMM, table-based sum of products — pp. 401–414
- §12.6 DSP blocks and RCCM — pp. 414–417
- §12.7 conclusion and the ASIC/FPGA rules of thumb — p. 418
