---
title: LTI Filters
description: "Map of the 13 LTI Filters notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, lti-filters, hub]
aliases:
  - LTI Filters
  - "6.1) LTI Filters"
---

# LTI Filters

**The specification.** Input: one sample per cycle, $\mathrm{sfix}(0,\ell)$ —
MSB at position $0$ because linearity lets us normalise the input peak to
$\overline{u}=1$ for free. Output: $\mathrm{sfix}(m',\ell')$, where $\ell'$ *is*
the accuracy request and $m'$ falls out of the filter's gain. Accuracy promised:
**faithful**, $|\widetilde{y}_{\text{out}}(k)-y(k)|<2^{\ell'}$ — under one ulp of
the output, for every input signal and every $k$, not on average. Optimised:
**adder count**, constant-multiplication plus structural, under a frequency mask.

Every note below holds that promise across a circuit containing a **feedback
loop** — the one structural feature no other operator in this vault has, since an
error injected at cycle $k$ still circulates at $k+1000$. Two numbers govern the
topic: the worst-case peak gain
$\langle\!\langle\mathcal{H}\rangle\!\rangle=\sum_k|h(k)|$ fixes $m'$, and the
gain of the *error* filter $\mathcal{H}_\delta(z)=1/(1+\sum_i a_iz^{-i})$ — the
original with its numerator deleted — fixes the guard bits below $\ell'$:
$1+\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$
(23.37, p. 694). One for FIR; twenty-two for a *second-order* bell resonator.

> [!important] A hardware filter has no frequency response
> Rounding is nonlinear and, inside a loop, compulsory — an exact constant
> multiplier grows the word without bound. A finite-precision recursive filter is
> therefore not linear, so transfer function, poles and frequency response are
> undefined for it and "does this circuit meet this mask" is ill-posed as asked
> (p. 687). The repair every note below assumes: ask whether there *exists* a
> stable LTI filter meeting the mask to which the circuit is faithful (Def. 23.6,
> p. 695). Stability is then inherited, and limit cycles bounded below one ulp.

**The generator, `FixIIR`.** All of the above is packaged as one command: give it
the orders $n,m$, the *real* coefficients $(a_i),(b_i)$ and the two LSBs
$\ell,\ell'$, and it emits VHDL faithful to those coefficients — $m'$ optional,
and the internal $\ell_{\text{ext}}$ deliberately absent from the interface
because the tool derives it (Fig. 23.18, p. 691). It derives it by computing
*guaranteed over-estimates* of both peak gains:
$\langle\!\langle\mathcal{H}\rangle\!\rangle$ sizes the output MSB, and
$\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle$ buys the guard bits, with
over-estimation costing at most one extra bit and making the guarantee immune to
rounding inside the WCPG computation itself (p. 694). The interface is
structure-independent even though every internal parameter is not, which is what
lets it front any of the forms below. What it does not do is *choose* the filter:
it solves the quantisation-and-implementation half only, and only for direct
form I with table-based constant multipliers (p. 697) — the coefficients still
arrive frozen by a design step it has no say in.

### Start here

- [[Choosing a Filter Structure]] – **compares** all thirteen against the
  chapter's own numbers, including the only hard cost comparison it gives. Read
  it first if you have coefficients and a deadline; read the rest for the one
  structure it points at. This hub deliberately carries no cost table.

### The two shared components — neither is itself a filter

- [[Tapped Delay Line]] – the memory. Read it for where a structure's register
  cost comes from, and why sharing one delay line between the two halves of a
  filter is the largest structural saving on offer.
- [[SOPC, Sum of Products by Constants]] – the filter *body*, and where the
  topic's arithmetic argument lives. Read it for why $n{+}1$ separately rounded
  products is the wrong construction: the body is one bit heap, compressed once
  and rounded once, which is what makes the guard bits cheap enough to buy.

### FIR: every $a_i=0$, so $\mathcal{H}_\delta(z)=1$ and nothing is amplified

- [[Direct-Form FIR Filter]] – the literal transcription of the convolution sum.
  Read it as the reference point the other three rewrite.
- [[Transposed Direct-Form FIR Filter]] – read it when the direct form's adder
  chain fails timing, and to see the transposition rule (reverse every wire, swap
  forks and adders) performed once on the easiest case.
- [[Linear-Phase FIR Filter]] – read it for the symmetry that halves the
  multiplications and, more consequentially, makes the zero-phase response
  real-valued — the property that lets a mask become linear constraints.
- [[Minimum-Adder FIR Filter]] – read it last, as the case that the standard
  design-quantise-implement flow is backwards.

### IIR: four rewritings of one difference equation

They differ only in which signal each multiplier sees and which registers can be
shared — and since a multiplier fed by a loop signal must be built at extended
precision, that difference *is* the cost.

- [[Direct Form I IIR Filter]] – the baseline: one SOPC over the input and the
  fed-back output history together. Read it for the cheapest multipliers of any
  IIR form and the two unshared delay lines that pay for them.
- [[Transposed Direct Form I IIR Filter]] – read it to watch transposition turn
  an SOPC into an MCM, at the same delay count and a shorter adder chain.
- [[Direct Form II IIR Filter]] – read it for the commutation argument that lets
  one delay line serve both halves, and for the trap: the $b_i$ now multiply a
  loop signal, so the registers saved are repaid in multiplier width.
- [[Transposed Direct Form II IIR Filter]] – read it for the combination that
  looks strictly best, shared registers *and* narrow $b_i$, and for the
  two-multiplier critical path that is the catch.

### Assembling large filters from small ones

Quantising a high-order denominator as one polynomial is the fastest way to push
poles outside the unit circle; factor it instead, which associativity and
distributivity of convolution make legal in series or in parallel.

- [[Biquad Section]] – the second-order unit, coefficients read straight off a
  resonance frequency and a 60 dB decay time. Read it first; the next two are
  wiring around it.
- [[Biquad Cascade]] – sections in series. Read it for why conditioning rather
  than area is the reason to factor, and for what section *ordering* decides.
- [[Additive Synthesis Filter Bank]] – sections in parallel. Read it for the
  worked physical case, and for a WCPG near $2\times10^5$ that the application
  should override rather than obey.

### Where this sits

Upstream, [[Multiplication by Constants]] supplies the machinery every tap is
built from — a filter's cost is mostly the cost of sharing subexpressions among
its coefficients — and [[Sums of Weighted Bits]] the single heap the body
collapses into; [[Number Formats]] and [[Error Accuracy]] define $\mathrm{sfix}$,
ulp and faithfulness, which no note here re-derives. Downstream,
[[ILP for Arithmetic Design]] is where design, quantisation and adder-graph
selection become one integer program, [[FloPoCo]] computes the guaranteed WCPG
over-estimates the guard-bit formula needs, and [[FPGAs]] decides whether a tap
lands in a DSP block or a LUT.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024,
Chapter 23 "Arithmetic in the Design of Linear Time-Invariant Filters", printed
pp. 669–702. Ill-posedness of the frequency question, p. 687; faithfulness to an
LTI filter, Def. 23.3, p. 688; WCPG, Defs. 23.4–23.5, pp. 689–690; guard bits
(23.37) and the 22-bit bell resonator, p. 694; faithfulness to a frequency
specification, Def. 23.6, p. 695.
