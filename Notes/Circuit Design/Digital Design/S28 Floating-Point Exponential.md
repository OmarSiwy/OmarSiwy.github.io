---
title: "Floating-Point Exponential"
description: "Map of the 14 Floating-Point Exponential notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, floating-point-exponential, hub]
aliases:
  - "Floating-Point Exponential"
  - "5.3) Floating-Point Exponential"
---

# Floating-Point Exponential

**The specification.** In: $X$ in `float`$(w_E,w_F)$ — IEEEfloat or Nfloat ([[Number Formats]]). Out: $R$ in the *same* format, plus $+0$ on underflow and $+\infty$ on overflow. Accuracy: **faithful**, $|\delta_R| < 2^{-w_F}$ on the significand, i.e. one ulp of the result — not correctly rounded, because the last-bit guarantee needs an unbounded amount of intermediate precision (pp. 651–653). Optimised for **area**: table bits, DSP blocks and multiplier width, at a latency that still pipelines at fabric $f_{max}$. Every circuit below is a different answer to that one sentence, and none of them restates it.

Almost all of them are also the same architecture. Range-reduce additively, $X = E\ln 2 + Y$ with $E=\lfloor X/\ln 2\rceil$, and $e^{x+y}=e^xe^y$ together with $2^x=e^{x\ln 2}$ give

$$e^X = 2^{E}\cdot e^{Y},\qquad Y\in\left[-\tfrac12,\tfrac12\right),\qquad e^Y\in[0.65,1.65]$$

An unbounded input became a bounded one in one subtraction (pp. 646–647), and $2^E$ costs nothing — it *is* the exponent field of the result, so reconstruction is a concatenation rather than a multiply. That is why the exponential gets a chapter of its own while other elementary functions pay for their reconstruction. What it costs instead is the subtraction: forming $Y$ annihilates up to $w_E$ leading bits by design, so the range reduction must be accurate in **absolute** terms to $2^{-w_F-g}$ no matter how large $X$ was, while the $e^Y$ evaluator only ever has to be good to a few ulps of a number near 1. The hard part of a floating-point exponential is not the exponential.

### Start here

- [[Choosing an Exponential Architecture]] – the trade-off table with the source's own numbers, and the one axis ($w_F$) that decides almost every choice. Read it before any of the variants; this hub deliberately does not duplicate it.
- [[FPExp Operator]] – the whole datapath in one note, with the figure the block notes below all specialise and the error budget that hands each block its allowance.

### Before any arithmetic

- [[Exponential Special-Case Unit]] – read it first if you are wondering why the main datapath is allowed to be so narrow: it is what disposes of everything outside a small window of exponents.

### Tabulate everything (small formats only)

- [[Direct Tabulation Exponential]] – the answer when the mathematics is not worth doing; read it to see the baseline the rest has to beat, and to find where the baseline dies.
- [[Split-Table Exponential]] – the obvious way to scale tabulation past that point, and the note that shows why the book abandons the line in favour of range reduction.

### The range-reduced datapath, block by block

Read in signal order; each note takes its input format and its error allowance from the operator note above.

- [[Exponential Fixed-Point Converter]] – how a floating-point input becomes the fixed-point one the next three blocks need, and why input subnormals need no path of their own.
- [[Tentative Exponent Unit]] – read it for the licence to build a *deliberately inaccurate* multiplier, and for how a 0.22 error budget is spent.
- [[Reduced Argument Subtractor]] – the note to read if you only read one: it is where the accuracy of the whole operator is won or lost, and where a constant multiplier gets to skip its own MSBs.
- [[Exponential Normalize-Round-Pack]] – read it for the trick that makes biased exponent encoding pay off, and for the one place IEEEfloat costs materially more than Nfloat.
- [[Fixed-Point-In Exponential]] – read it before you assemble a datapath around an exponential: if the argument is a computed sum, entering here is both smaller and more accurate than converting to float first.

### The inner evaluator, $e^Y$ on $[-\tfrac12,\tfrac12)$

Five answers to one sub-specification: absolute accuracy of a few ulps on a value bounded near 1, no cancellation, static format. Ordered by the precision at which each takes over.

- [[Tabulated e^Y]] – the floor of the family; read it to see how much the range reduction alone buys before any approximation theory is applied.
- [[First-Order e^Y Evaluator]] – the cheapest thing that is not a table; read it for the argument that a linear term suffices, and for the table growth that ends it at binary16.
- [[Higher-Order e^Y Evaluator]] – the workhorse from single precision up; read it for the second, bit-field range reduction and the reason $h(Z)$ is narrower than the function it came from.
- [[Polynomial h(Z) Evaluator]] – read it when the tables of the previous note stop fitting: it swaps one knob for two and carries the architecture to double.
- [[Iterative Table-Based Exponential]] – the odd one out, a digit recurrence rather than an approximation; read it for fabrics with no DSPs and no BRAMs, and for a datapath that gets *narrower* every cycle.

### Where this topic sits

Upstream, this is a specialised member of [[Floating-Point Operators]] and it leans hard on [[Multiplication by Constants]] — two KCMs, one sloppy and one held to the precision of its own product — plus one shifter from [[Shifters]] and the ulp and faithfulness vocabulary of [[Error Accuracy]].

Downstream, the inner evaluator is the entry point to [[Table-Based Function Evaluation]] and [[Polynomial Approximation]]; [[Fixed-Point Computation of eY]] cuts that same inner problem finer, at the level of individual tables and DSP/BRAM mapping. [[Exact Accumulators]] is the natural partner of the fixed-point-in variant: sum in fixed point, exponentiate from fixed point, and pay no rounding at all on the way in. The BRAM and DSP shapes the architectures are fitted to come from [[FPGAs]].

> [!warning] Not covered in the source — needs outside research
> Chapter 22 gives **no LUT, slice, DSP-count or delay figures** for any of these architectures, and states outright (p. 663) that a detailed same-technology comparison of the iterative and polynomial-based families is missing. The chooser above reports the sizing data the book does give — table dimensions, multiplier shapes, error bounds in ulps — and leaves synthesis results blank. Do not fill them in from memory.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 22 "Floating-Point Exponential", pp. 641–666 (chapter references, pp. 665–666). Section-level citations sit in the individual notes.
