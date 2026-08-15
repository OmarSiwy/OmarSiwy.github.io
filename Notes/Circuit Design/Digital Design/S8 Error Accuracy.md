---
title: Error Accuracy
description: "Map of the 10 Error Accuracy notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, error-accuracy, hub]
aliases:
  - Rounding
  - Error Accuracy
  - "1.2) Error Accuracy"
---

# Error Accuracy

An application-specific operator has no standard to hide behind: you write its accuracy specification yourself, and every circuit below is a different way of meeting it as cheaply as possible.

- **Input** $X$ in $\mathrm{ufix}(m_X,\ell_X)$ or $\mathrm{sfix}(m_X,\ell_X)$ — see [[Number Formats]].
- **Output** $R$ in $\mathrm{ufix}(m_R,\ell_R)$, whose quantum is the ulp $u=2^{\ell_R}$.
- **Accuracy** $\delta=\max_X|R(X)-f(X)|<u$ — *faithful*, one ulp — unless a note says otherwise.
- **Optimised**: area, latency or energy *at fixed accuracy*. Accuracy is a constraint, never an objective.

Fixing the output format fixes $u$, and fixing $u$ fixes the accuracy target: **the format is the specification**. That is why none of the notes below re-derives ulp or restates the target — they differ only in what they spend to hit it. The one term nobody escapes is the final rounding into the output format, which costs $u/2$ and is incompressible; a faithful operator therefore has exactly $u/2$ left to divide between its approximation error and every internal truncation. "Computing just right" is the claim that this budget should be *spent* — a sub-component more accurate than its share is wasted area.

### Start here

- [[Choosing a Rounding Mode]] – the trade-off table: cost, worst-case error, whether the bound is attained, and the bias of every mode and specification below, with the source's own numbers. This hub deliberately does not duplicate it.

### One quantization site — the rounding modes

These are what a single "drop the low bits" decision can be. They compose; an operator is built out of them.

- [[Truncation Unit]] – the baseline everything else is priced against, because it is free: the discarded bits are simply not routed.
- [[Round-to-Nearest Ties-Up]] – read immediately after truncation, since it is the one mode that can cost *nothing over* it when the half-ulp constant lands in a bit heap or a spare carry-in.
- [[Round-to-Nearest Ties-to-Even]] – read when accumulation length makes bias, not the bound, the thing that hurts; this is what IEEE 754 pays for and why.
- [[Directed Rounding Unit]] – read to understand a mode you should usually refuse: less accurate *and* dearer than ties-up, justified only by interval arithmetic.

### Changing the format instead of the arithmetic

- [[Half-Unit Biased Format]] – read when the rounding adder is on the critical path: shifting the representable grid by half an ulp makes round-to-nearest literally be truncation.
- [[Saturating Overflow Unit]] – the other end of the range problem; read it for what to do when error analysis *cannot* prove overflow impossible.

### What a whole block promises

- [[Faithful Operator]] – the generic architecture the specification above describes: approximate datapath on $g$ guard bits, then one final rounding. Read it before any operator note in the rest of the vault.
- [[Faithful Multiplier by Pi]] – read to watch the budget close on a concrete case, including the exhaustive check showing why $g=1$ passing was luck and $g=2$ is the provable answer.
- [[Correctly-Rounded Product Table]] – read for the counter-example: the finite correctly-rounded architecture that exists only because $\pi$ is transcendental, so no product ever lands exactly on a tie.

### Folded into this hub

- [[Error Analysis]] – the method, not a circuit: telescope the computation through **virtual** intermediate values — quantities like a truncated Taylor polynomial $p(X)$ that appear nowhere in the hardware — inserting and cancelling each one until every remaining difference is boundable, then apply the triangle inequality exactly once at the end. An error is always a difference between a less accurate and a more accurate value, so $A-C=(A-B)+(B-C)$ makes absolute errors add; relative errors pick up a cross term, $\varepsilon_{AC}=\varepsilon_{AB}+\varepsilon_{BC}+\varepsilon_{AB}\varepsilon_{BC}$. Bound as late as possible and leave the internal LSBs as parameters, because the chain is what turns an architecture into the inequality $n\,u\,2^{-g}+A(\theta)<u/2$ that design-space exploration then solves for $(g,\theta)$.

Four smaller ideas from the source have no note of their own either, and live here:

**Absolute versus relative error.** $\delta(X)=\widehat f(X)-f(X)$ and $\varepsilon(X)=\delta(X)/f(X)$ are *functions* of $X$; what gets quoted is the worst case over the input domain. Worst-case bounds are chosen over average error or SNR because they give the strongest guarantee and, crucially, because they compose. Absolute error is the natural currency for fixed point, relative for floating point. The word "absolute" carries two meanings in one breath — as opposed to *relative*, and the *absolute value* in $\max|\cdot|$ — so read the qualifier, not the word (p. 67, footnote 1).

**Why one ulp.** Nothing is special about $1$ ulp: $0.75$ ulp is slightly more accurate at slightly more cost with no change of technique, and a $1.5$-ulp operator is sometimes right provided that $1.5$ is carried into the global analysis. The bound that is *fundamentally* harder is $0.5$ ulp. The reason to standardise on $1$ ulp is interface economy — once the user gives the output format, the accuracy is determined and a generator needs no accuracy argument at all (pp. 77–78).

**Faithful versus one bit narrower.** An application target $\delta_{\text{target}}=2^k$ is met either by a faithful operator at $u=2^k$ or by a correctly-rounded one at $u=2^{k+1}$. The first is usually cheaper to build; the second is one bit narrower, and that bit propagates into every downstream consumer. Genuinely contextual (p. 77).

**Parametric designs.** When you face an architectural design choice, do not make it — capture it as a new internal parameter deduced from the external ones. The cost is more complex generator code; the return is that design-space exploration becomes possible at all, and the parameter space provably contains the published architecture you would otherwise have copied (pp. 78–80).

### Where this sits

[[Number Formats]] supplies the ulp that every specification here is written in, and is the only prerequisite. Downstream, [[Multipliers]] spends the faithful slack on truncated partial-product arrays, [[Fixed-Point Function Approximation]] and [[Multiplication by Constants]] are the two places the guard-bit budget is actually solved, and on [[FPGAs]] the cost of $g$ is a step function set by carry-chain, DSP-port and block-RAM widths rather than a linear one. [[FloPoCo]] is the generator that makes "the format is the specification" an API.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 3, "Computing Just Right: Accuracy Specification and Error Analysis", pp. 65–85.
