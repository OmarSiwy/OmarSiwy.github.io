---
title: Division by Constants
description: "Map of the 8 Division by Constants notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, division-by-constants, hub]
aliases:
  - Division by Constants
  - "3.2) Division by Constants"
---

# Division by Constants

**The specification.** Input: an unsigned integer $X$ on $w$ bits — a
$\mathrm{ufix}(w-1,0)$ in the language of [[Number Formats]] — and a divisor $D$
that is a compile-time integer constant and **not** a power of two, since a power
of two is a wire shift. Output: the exact Euclidean pair
$$X = D\cdot Q + R,\qquad 0\le R < D$$
with $Q$ on $w-\lfloor\log_2 D\rfloor$ bits and $R$ on $r=\lceil\log_2 D\rceil$
bits. **Accuracy is 0 ulp. There is no error budget to spend**, so [[Error Accuracy]]
never enters a decision in this topic and no note below re-argues it — what every
circuit here trades is area (LUT count, table bits) against latency and
throughput, over $w$ from 8 to 128 and $D$ typically small (3, 5, 9, 15, 45).

That exactness is not free of subtlety: it is *stronger* than faithful rounding.
The pre-rounding value carries a fractional part $R/D$ that climbs to $(D-1)/D$,
so any approximate route may spend at most $1/D$ ulp, not 1 ulp, before the floor
tips to $Q+1$. Which architecture you pick decides whether that argument is an
error budget or an invariant.

Notation is shared across the whole topic: $k$ is the radix chunk size (dividend
and quotient read in radix $2^k$), $m=\lceil w/k\rceil$ the digit count, $r$ the
width of $D$, and $\alpha$ the input count of the target FPGA LUT ([[FPGAs]]).

### Start here

- [[Choosing a Constant Divider]] – **compares** all eight against the source's
  measured Kintex-7 areas and delays; read it first if you have a divisor and a
  deadline, and read the rest only for the one architecture it points you at.

### The reciprocal route

- [[Recip Constant Divider]] – the general answer: one constant multiplication
  and a shift, the only member whose cost ignores the magnitude of $D$. Read it
  to understand why compilers emit `0xAAAAAAAB` and a shift by 33 rather than 32.

### The table recurrence, and the three shapes it takes

Long division taken literally: the loop body is itself a division, of a two-digit
number whose leading digit is a remainder. Three notes, in dependency order.

- [[Constant Division Digit Table]] – the loop body itself, and the lemma that
  bounds its address space. Read it first; the next two are both just wiring
  around this one component.
- [[Sequential Constant Divider]] – the recurrence folded onto one table and a
  register. Read it when area is the binding constraint and $m$ cycles of latency
  are acceptable.
- [[LinArch Divider]] – the same recurrence unrolled into $m$ chained tables.
  Read it for the topic's default combinational answer, and for why a datapath
  built on a `+` recurrence contains no adder at all.

### Restructuring the dependency

- [[Binary Tree Constant Divider]] – BTCD is to LinArch what a parallel-prefix
  tree is to a ripple-carry chain. Read it when latency, not area, is what fails
  to close.

### When you need only half the pair

Address translation for $D$-way banking wants both; decimal conversion wants only
digits; a hash wants only the residue. Two notes on what falls away.

- [[Remainder-Only LinArch]] – read it for the cleanest instance of a
  quantitative pruning argument: area falls by exactly $r/(r+k)$, delay does not
  move at all, and knowing *why* delay does not move tells you where the critical
  path really lives.
- [[Remainder-Only BTCD]] – read it because this is where the tree stops being a
  luxury: dropping the quotient collapses it to a clean binary tree, improving
  area *and* delay simultaneously, which nothing else in the topic does.

### When the divisor factors

- [[Composite Constant Divider]] – read it before building any atomic divider,
  because the first question to ask of $D$ is whether it factors: splitting the
  divisor turns a product of table sizes into a sum, and the factorisation
  *order* is itself a design variable.

### Where this sits

Upstream, [[Multiplication by Constants]] supplies both the multiplier inside
the reciprocal route and the small $\times D_a$ that reassembles a composite
remainder. Downstream and sideways, [[Dividers]] holds the general
variable-divisor operators these replace — every one of them exact too, but at
$O(w^2)$; knowing $D$ at synthesis time is what buys the $O(w)$ architecture, and
knowing $D$ is *small* is what makes each stage fit in one LUT. [[FPGAs]] supplies
the LUT$\alpha$ cost model that decides $k$, and hence decides this entire topic
on hardware the book actually measures.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024,
Chapter 13 "Division by Constants", printed pp. 427–441. Notation table 13.1,
p. 428. Primary sources cited there: [DCC12] Drane, Cheung & Constantinides
(Recip); [Rob05] Robison; [DD12] de Dinechin & Didier (LinArch); [Uğu+16],
[Uğu+17] Uğurdağ et al. (BTCD).
