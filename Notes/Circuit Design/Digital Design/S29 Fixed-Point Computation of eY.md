---
title: "Fixed-Point Computation of eY"
description: "Map of the 9 Fixed-Point Computation of eY notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, fixed-point-computation-of-ey, hub]
aliases:
  - "Fixed-Point Computation of eY"
  - "5.3a) Fixed-Point Computation of eY"
---

# Fixed-Point Computation of eY

This is the inside of a floating-point exponential, after the hard part of the
exponent arithmetic has already been done. [[Floating-Point Exponential]] hands down a
reduced argument and asks for one fixed-point function on a narrow interval; every
circuit here is a different answer to that one request.

**Input.** $Y$ in `sfix`$(-1,\ell)$ with $\ell = -w_F - g$ and $g \ge 3$ guard bits —
the reduced argument, small enough that $e^Y \in [0.65, 1.65]$.
**Output.** $M \approx e^Y$ in `ufix`$(0,\ell)$: MSB at position $0$, same LSB as the
input, no exponent field. Write $u = 2^{\ell}$ for its ulp, per [[Number Formats]].
**Accuracy.** $\bar\delta_{\mathrm{arch}} = |M - e^Y| < 1 - 2u$, which is exactly what
closes the parent operator's 1-ulp faithfulness budget ([[Error Accuracy]]). Only the
first circuit below is correctly rounded; the rest buy their area with that half-ulp.
**Optimised for.** **Table bits and multiplier count** — not latency. Everything here
is feed-forward tables and multiplies, so it pipelines to whatever frequency you want;
what you cannot make go away is the memory.

One number governs the topic: the fraction count $w_F$ sets $\ell$, sets how many
address bits a table can afford, and alone picks three of the four architectures below.

- [[Choosing an eY Architecture]] – the trade-off table for all nine, with the source's
  own table dimensions, multiplier shapes and error bounds. Read it first if you are
  picking rather than learning. The hub does not repeat it, and note before you go
  looking: the book gives **no** LUT, slice or delay figures for this chapter.

### Start here: no arithmetic at all

- [[Direct eY Table]] – one ROM addressed by every bit of $Y$. Read it for the baseline
  the other eight must beat, and because it is the only correctly-rounded answer here.
  It dies above roughly 8 fraction bits, and everything after it exists because of that.

### The table-and-multiplier family

All three share one idea: split $Y = A + Z$ by bit position, so $e^Y = e^A \cdot e^Z$
turns a transcendental function into a table lookup times a *nearly-one* number. The
notes differ only in how much of $e^Z$ they are willing to compute.

- [[eA Table]] – the shared front end: $2^k$ entries addressed by the top $k$ bits of
  $Y$. Read it for the two tricks that make the rest cheap — the half-ulp of the final
  result baked into every stored entry, and the truncated output that squares up the
  multiplier.
- [[First-Order eY Architecture]] – takes $e^Z \approx 1 + Z$ and stops. Read it as the
  minimal instance of the family: table, one multiplier, one adder, and an approximation
  error you can write down in one line. Right answer at binary16, hopeless by single
  precision.
- [[Higher-Order eY Architecture]] – keeps the second-order term by evaluating
  $h(Z) = e^Z - Z - 1$ in a box of its own. Read it for the two algebraic rewritings
  that shrink the multiplier by $k$ bits and the function evaluator by $2k$ — this is
  the load-bearing derivation of the topic, and the workhorse from single precision up.

### Filling the $h$ box

$h$ is the only genuinely transcendental thing left once the leading $1$ and the linear
term have been peeled off. Two ways to build it — a second knob alongside $k$.

- [[hZ Table]] – tabulate it flat. Read it for why a function whose MSB sits at
  $-2k-1$ fits in a table where $e^Z$ never could, and why it needs only the top bits
  of $Z$.
- [[Polynomial hZ Evaluator]] – hand $h$ to the generic evaluator of
  [[Polynomial Approximation]] instead. Read it when $w_F$ has grown past what any flat
  table survives; degree $d$ then trades tables against multipliers independently of
  $k$, which is what carries the method to double precision.

### Landing it on real silicon

- [[eY DSP and BRAM Mapping]] – the single-precision case study where the DSP operand
  width and the BRAM word geometry independently choose the same $k$. Read it for the
  general lesson that coarse hard-block granularity is *free accuracy*, not waste: an
  exact product can be rounded to nearest, which deletes an error term for one extra
  bit of adder. See [[FPGAs]] for the blocks themselves.

### A different family: small tables and rectangular multipliers

Not a variant of the above — a recurrence over precomputed pairs $E_i^\dagger =
e^{L_i^\dagger}$, driving $L_i \to 0$ and then rebuilding the product. Its two halves
are separate notes because they run in opposite directions over the same tables.

- [[eY Iterative Reduction Step]] – the forward half, $L_{i+1} = L_i - L_i^\dagger$.
  Read it for the one datapath in this topic that gets *narrower* every step, and for
  the cancellation argument that guarantees it.
- [[eY Iterative Reconstruction Step]] – the backward half. Read it for the change of
  variable $X = E - 1$ that stops you storing a leading one you already know, and for
  why $n$ rectangular multipliers cumulate to barely more than one full one.

### Where this sits

[[Floating-Point Exponential]] produces the input format and consumes the error terms
computed here; nothing else calls into this topic. The generic machinery is borrowed
rather than rebuilt — [[Table-Based Function Evaluation]] for the ROMs,
[[Polynomial Approximation]] for the $h$ evaluator, [[Multipliers]] for the truncated
and rectangular products, and [[Fixed-Point Function Approximation]] for the framing
that makes "approximate one function on one interval" a problem with a standard shape.
[[FloPoCo]]'s `FPExp` implements this chapter and exposes $k$ and $d$ in expert mode.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §22.5
"Fixed-Point Computation of $e^Y$", pp. 654–664 (Figs. 22.5–22.8, eqs. 22.19–22.34).
