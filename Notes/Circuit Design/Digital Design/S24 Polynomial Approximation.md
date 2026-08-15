---
title: Polynomial Approximation
description: "Map of the 15 Polynomial Approximation notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, polynomial-approximation, hub]
aliases:
  - Range Reduction
  - Polynomial Approximation
  - "4.3) Polynomial Approximation"
---

# Polynomial Approximation

**The specification.** Input: one fixed-point word $X$ of $w_X$ bits, normalised to $[0,1)$ or $[-1,1)$ by [[Fixed-Point Function Approximation]] ([[Number Formats]]). Output: $R(X)$ of LSB $\ell_R$, approximating a function $f$ that is continuously differentiable to order $d+1$ on the interval. Accuracy: **faithful — $\bar\delta_\text{total} < 2^{\ell_R}$, one ulp**, split four ways between approximation, coefficient quantisation, evaluation rounding and final rounding, with every width in the datapath derived from that split ([[Error Accuracy]], [[Rounding]]). Crucially the split has **no range-reduction term** — every interval split below is an exact identity $f_A(Y) = f(X)$ — and **no coefficient-quantisation term**, because the standard move is to redefine $\delta_\text{approx} = \tilde p(X) - f(X)$ over the *rounded* polynomial, which is tighter by the triangle inequality (p. 536).

What is optimised is the product of two currencies: **table bits** — the coefficient ROM, exponential in the segmentation parameter $\alpha$ — and **multipliers**, linear in the degree $d$. Latency is the tie-breaker. The two are set by two scaling laws that pull against each other. *Degree:* accuracy in bits is roughly linear in $d$, so error falls geometrically (Fig. 18.4, p. 535). *Interval:* shrinking the interval by $2^k$ buys $k(d+1)$ bits, so $\alpha(d+1) \gtrsim w_R$ and the table is $\Theta(2^{w_R/(d+1)})$. A larger $\alpha$ buys arithmetic with memory; the marginal saving from one more degree is $\tfrac{w_R}{(d+1)(d+2)}$ bits of exponent — quadratically diminishing — while each degree costs one more multiplier forever. That asymmetry is why **every published evaluator sits at degree 2 or 3 over a few dozen to a few hundred segments** (p. 542, p. 560), and why the notes below are variations on that shape rather than a search over all $(d, \alpha)$.

This family exists because [[Table-Based Function Evaluation]] runs out of room around $w_X \approx 24$: its table stays exponential in $w_X/2$. A degree-$d$ polynomial moves that exponent to $w_X/(d+1)$, and you buy it with $d$ multipliers. **Every note below is a different answer to the paragraph above; none of them re-derives it.**

- **[[Choosing a Polynomial Evaluator]]** – the trade-off table across all 15, with real table-bit, multiplier-width and latency numbers, including the head-to-head against multipartite that Chap. 17 deferred. Read it first if you are picking one, last if you are learning them. Deliberately the only place those numbers live.

### Fit the coefficients

Before any hardware exists, something has to decide what $C_0 \dots C_d$ are and how many bits each gets.

- [[Remez Minimax]] – read this first: equioscillation is why nobody puts Taylor in a table, and it is the only step here that is pure mathematics with no hardware cost at all.
- [[Polynomial Coefficient Table]] – the ROM the whole family is built around; read it for how per-subinterval formats are reconciled into shared wires, and for the compression the coefficients' smoothness in $A$ makes free.

### Shrink the interval

Law 2 says the interval is the strongest knob available, so split it. These four differ in how the segment index $A$ is found, which is the entire architectural difference between them.

- [[Uniform Piecewise Segmentation]] – the default, and the one to understand before the others: the change of variable is a wire split, so $A$ costs nothing and $w_Y = w_X - \alpha$ exactly.
- [[Logarithmic Segmentation]] – read it when $f$ misbehaves at $0$; indexing by leading-zero count is the only reduction that absorbs a discontinuity or an infinite derivative, and it pays by losing the $\alpha$ knob and the $w_Y$ reduction.
- [[Hierarchical Segmentation]] – how to stack the two above so that logarithmic segmentation gets a memory/arithmetic knob back; the practical answer to the previous note's main defect.
- [[Dichotomy-Based Segmentation]] – best possible approximation, worst possible architecture; read it for what a *universal* approximator that must swallow arbitrary user functions has to pay.

### Do not store the coefficients at all

Two escapes from the ROM, one general and one function-specific. They are opposites: the first is the honest general attempt and it loses, the second cheats using $f$'s own algebra and wins outright.

- [[Function-Value Interpolation]] – tabulate function values and derive coefficients from neighbours; read it for a clean worked argument on why the attractive idea scales backwards with degree.
- [[Addition-Theorem Coefficient Generation]] – all four coefficients of a degree-3 sine read off one table of $C_0$; read it as the standing proof that for a *known* function you should use its identities before any generic machinery, and as [[CORDIC]]'s rival.

### Evaluate it

Given $Y$ and the coefficients, the remaining question is depth versus multiplier count — and, more importantly, how few bits each multiplier can be fed.

- [[Horner Evaluation]] – the default and the one whose error analysis the rest of the topic reuses; read it for why the coefficients decaying by $\alpha$ bits per degree lets the deep stages see far fewer bits of $Y$, which saves more area than the minimal multiplication count does.
- [[Parallel Polynomial Evaluator]] – the developed form, $O(\log d)$ depth against Horner's $O(d)$; read it when latency binds, and for why more multiplications is the *cheaper* answer in hardware.
- [[Estrin's Scheme]] – the recursive odd/even split $p(x) = p_e(x^2) + x\,p_o(x^2)$ that gives the previous note its structure.
- [[HOTBM]] – the parallel evaluator taken to its conclusion, with the products themselves tabulated against a truncated $A$; read it for the one design that turns coefficient smoothness into an architecture.
- [[SquareRich Evaluation]] – the only refactoring that survives contact with hardware: complete the square, trade a multiplier for a cheaper squarer, and find out why the reduction you already did works against you.

### Solve the whole thing at once

- [[ILP-Optimized Polynomial Evaluator]] – make the coefficient *bits* the decision variables and the whole design becomes linear; read it for correct rather than faithful rounding, and for what separating approximation from evaluation was costing all along ([[ILP for Arithmetic Design]]).
- [[Floating-Point Polynomial Function Evaluator]] – read it for the two structural gifts a floating-point input hands you: a free logarithmic segmentation in the exponent, and a domain split that reduces the problem back to fixed point.

### Folded in here

**Rational fractions.** A polynomial is the $m=0$ case of $R(x) = \frac{P_0 + \dots + P_nx^n}{1 + Q_1x + \dots + Q_mx^m}$, and Remez extends to the rational case, but the book declines it (p. 540). With no singularity in $I$, the rule of thumb is that degree $(n,m)$ buys about the accuracy of a polynomial of degree $n+m$ — the same multiplier count *plus a divider* ([[Dividers]]). With a singularity in $I$ ($\tan$, $\sqrt{\cdot}$ at $0$), a rational fit can capture it as a denominator zero, but a range reduction usually avoids it more cheaply and keeps the algorithm visible — $\tan = \sin/\cos$ wants a *shared* reduction a blind rational fit would destroy. The parallelism argument is voided by the division's latency, and the parallel evaluator gives the same parallelism with no divider. The exception is when the division fuses into the multiplications, which is the E-method's territory.

**Taylor, where it is not wrong.** Taylor coefficients are often exactly $0$, $1$ or $1/2$ (p. 539), and those cost nothing in the datapath — which can outweigh a worse error, as in the degree-3 evaluators. It is also the right tool when *deriving* coefficients analytically rather than fitting them numerically.

### Where this sits

Upstream, [[Fixed-Point Function Approximation]] hands over the normalised argument and the faithfulness contract, and [[Table-Based Function Evaluation]] is the method this one takes over from once $w_X$ passes roughly 16. Downstream every design here terminates in [[Multipliers]] (of decreasing width, so deep stages fall to LUT logic while the last takes the DSP), [[Squarers and Integer Powers]], and one shared [[Sums of Weighted Bits|bit heap]] feeding a final [[Adders|adder]]; logarithmic reductions additionally need [[Shifters]]. [[FPGAs]] is where the resource classes map cleanly — the coefficient table is the only exponential resource and is chosen to fit the block RAM you have — and [[FloPoCo]] is where these generators actually live. Sideways, [[CORDIC]] is the competing answer for trigonometrics, [[Floating-Point Operators]] and [[Floating-Point Specialization]] wrap the fixed-point core, and [[Floating-Point Exponential]] is a fully worked instance of the entire pipeline.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18 "Polynomial-Based Architectures for Function Evaluation", pp. 529–572.

- 18.1 Primer on polynomial approximation, pp. 530–540 — Taylor and Remez, Tables 18.2–18.3, pp. 533–534; degree and interval laws, Figs. 18.4–18.5, pp. 535–536; machine-efficient approximation and Algorithm 18.1, pp. 536–539; rational fractions, Eq. (18.2), pp. 539–540
- 18.2 Range reduction, pp. 541–554 — uniform, logarithmic, hierarchical and dichotomy-based splitting, plus interpolation, Figs. 18.8–18.18
- 18.3 Hardware evaluation, pp. 554–562 — Horner, parallel evaluation, Estrin, SquareRich
- 18.4 Putting it together, pp. 562–568 — error budget, the two generators, and the ILP formulation
- 18.5 Floating-point architectures, pp. 568–569
