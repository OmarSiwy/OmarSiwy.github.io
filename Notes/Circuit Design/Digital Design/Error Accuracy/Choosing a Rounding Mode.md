---
title: Choosing a Rounding Mode
description: "Trade-off table across the nine Error Accuracy circuits — what each one costs over free truncation, what error bound it buys, and which constraint decides."
kind: comparison
source: "ASA Ch. 3, pp. 65-85"
status: seed
spade: n/a
tags: [digital, error-accuracy, rounding, comparison, fixed-point]
aliases:
  - Rounding Modes Compared
  - Rounding Mode Comparison
  - Which Rounding Mode
  - Choosing a Rounding Mode
---

# Choosing a Rounding Mode

Nine ways to lose the bits you cannot keep, ordered by the one question that actually decides between them: whether the half-ulp correction can be absorbed into hardware that already exists.

The first six rows are *rounding modes* — what one quantization site does. The last three are *operator specifications* — what a whole block promises. They are not alternatives to each other; a faithful operator contains rounding sites, and the modes are how you build it.

| Variant | Extra logic over truncation | Depth added | Worst-case error | Attained? | Bias | FPGA LUT | DSP | Cycles | Printed page |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [[Truncation Unit]] | none — bits are not routed | $0$ | $\delta\in(-u,0]$, $<1\,\mathrm{ulp}$ | no | one-signed, $\mathbb{E}[\delta]=-\tfrac{u}{2}(1-2^{-d})$; drifts $-Nu/2$ over $N$ sites | $0$ | — | — | 69-70 |
| [[Round-to-Nearest Ties-Up]] | one constant $2^{\ell-1}$ + incrementer; enable is **one wire**, the round bit $d_{g-1}$ | one carry-chain row, or $0$ if the constant is absorbed upstream | $\delta\in(-\tfrac{u}{2},+\tfrac{u}{2}]$ | yes, at ties | small, ties only; breaks symmetry about $0$ ($-1.5\to-1$) | 1 LUT/carry per kept bit | — | — | 69-70 |
| [[Round-to-Nearest Ties-to-Even]] | $\mathrm{inc}=R\wedge(S\vee L)$ — **two gates** — plus a $(G{-}1)$-input sticky OR tree | $\lceil\log_k(G-1)\rceil$ for $k$-input gates | $\le\tfrac12\,\mathrm{ulp}$ | yes, at ties | unbiased; symmetric about $0$ | — | — | — | 69-70; FP overhead 339, 345 |
| [[Directed Rounding Unit]] | same incrementer, different enable: sticky $=\bigvee_{i<g} d_i$, $g-1$ OR gates, plus a $2{:}1$ sign select | $\lceil\log_2 g\rceil$ gates; $\lceil\log_6 g\rceil$ LUT levels | $<1\,\mathrm{ulp}$ | no | strongly one-signed (that is the point) | 1 LUT for any $g\le 6$ | — | — | 71 |
| [[Saturating Overflow Unit]] | OR tree $\oplus$ AND tree over the top $W-N+1$ bits, then one mux per output bit | $\lceil\log_2(W-N+1)\rceil$ + one mux | n/a — a range fix, not an accuracy one | n/a | none | $N$ LUT6 for the clamp | — | — | 71 |
| [[Half-Unit Biased Format]] | none — truncation *is* round-to-nearest here | $0$ | $\le\tfrac12\,\mathrm{ulp}$; HUB$\to$HUB exactly $2^{\ell_2-1}-2^{\ell_1-1}$ | yes from a general real; **no** HUB$\to$HUB | none — representable set symmetric | $0$; negation is $w$ inverters instead of a carry-chain row | — | — | 71-73 |
| [[Faithful Operator]] | $u/2$ of budget to spend on $g$ guard bits and $\theta$; $\lvert\delta_{\mathrm{dp}}\rvert\le n\,u\,2^{-g}+A(\theta)$ | — | $<1\,\mathrm{ulp}$ | no | inherits the internal truncations' bias | — | — | — | 76, 83 |
| [[Faithful Multiplier by Pi]] | $g=2$, $\ell_{\mathrm{ext}}=-10$; proven $0.875\,u$, measured worst $0.496\,u$ over all 256 inputs | — | $<1\,\mathrm{ulp}$ | no | — | — | — | — | 74-76, 83-84 |
| [[Correctly-Rounded Product Table]] | $2^{w_X}(w_X{+}2)$ ROM bits: $2560$ at $w_X{=}8$, $57\,344$ at $12$, $\approx1.13$ Mibit at $16$, $\approx416$ Mibit at $24$ | one ROM lookup | $\le\tfrac12\,\mathrm{ulp}$ | yes | as round-to-nearest | $\approx2^{w_X}(w_X{+}2)/64$ LUT6 — about $40$ at $w_X{=}8$ | — | — | 74-76 |

**Where the dashes come from.** Chapter 3 is deliberately technology-neutral: it contains **no** LUT count, no slice count, no DSP figure, no delay in nanoseconds and no cycle count anywhere in pp. 65-85. Every DSP and cycle cell is "—" because every circuit here is purely combinational and none of them touches a DSP block. Every gate count, depth and LUT figure in the table above is *derived structurally* in the sibling note that owns it, not quoted from the book — the two things the book does say in prose are that a directed mode must "detect the case where all the discarded bits are zero" (p. 71) and that saturation costs "at least one multiplexer per operation" (p. 71). The only numeric measurements in the chapter are the $\pi$-multiplier's guard-bit sweep and the HUB tables. Everything else is qualitative by design.

**Guard-bit sweep, the one measured trade-off in the chapter** (exhaustive over all 256 inputs, $X\in\mathrm{ufix}(-1,-8)$, pp. 83-84):

| $g$ | proven bound | measured worst $\lvert\delta\rvert$ | faithful? |
| --- | --- | --- | --- |
| $0$ | $1.5\,u$ | $1.177\,u$ | **no** — 28 of 256 inputs violate it |
| $1$ | $1.25\,u$ | $0.708\,u$ | holds by luck; not provable |
| $2$ | $0.875\,u$ | $0.496\,u$ | **yes** |

**Ask first whether the half-ulp is free, because if it is there is no decision to make.** Round-to-nearest-ties-up differs from truncation by adding one constant $2^{\ell-1}$ before dropping the low bits, and that constant is *data-independent*. If the site sits above a [[Bit Heaps|bit heap]], the constant is one more column entry in a compressor tree that already exists; if it sits above a final adder, it is that adder's unused carry-in. Either way the mode costs literally nothing over truncation and halves the error bound, so truncation loses without argument (p. 70). Truncation only wins when no such slot exists and the extra carry-chain row is real — or when you would otherwise widen the output by a bit, since the third option in the same trade-off, truncating to $\ell-1$ instead, hits the same $2^{\ell-1}$ bound for free but makes every downstream consumer carry one more bit. On FPGA that extra bit is the expensive one: it propagates into block-RAM aspect ratios, DSP port widths and register counts, which is exactly why the incrementer usually wins there even though it is not free.

**Accuracy alone almost never picks the mode; accumulated bias does.** All four cheap modes sit within one ulp, and at a single site the difference between $<u$ and $\le u/2$ is one bit of output precision you could have bought elsewhere. What separates them is the *sign* of the error. Truncation's error is one-signed with mean $-u/2$, so over $N$ sites the bound grows like $Nu$ but the expectation drifts like $-Nu/2$ — systematic offset, not noise, and it does not average out in a filter or an accumulator. Ties-up is symmetric except at ties, so its mean error is $O(u\cdot\Pr[\text{tie}])$; ties-to-even removes even that and preserves symmetry about zero, which is why IEEE 754 chose it for "large computations" (p. 69). The catch is that ties-to-even's correction $R\wedge(S\vee L)$ depends on the computed data, so it cannot be pre-injected upstream the way ties-up's constant can: the sticky OR tree must actually exist. In fixed point that tree is cheap and its inputs settle first, so it stays off the critical path; in floating point it is a shifter redesign and becomes the dominant cost of the whole rounding block (pp. 339, 345). Reach for ties-to-even when the pre-rounding value is *exact* — $+,-,\times,\div,\sqrt{\;}$ — and skip it the moment any approximation upstream has already spent the half-ulp budget.

**Directed rounding is the one mode you pick for a reason other than cost or accuracy, because it is worse at both.** It carries truncation's $1$-ulp bound and costs more than ties-up, since the enable is a sticky OR over $g-1$ bits instead of a single round-bit wire. What it buys is a *provably one-signed* result, which is the only way to compute an interval bound that is sound rather than plausible. If you are not producing an interval, do not use it (p. 71). Saturation sits in a different axis entirely — it fixes range, not precision — and the ASIC/FPGA answer differs from the software one: rather than clamping at every operation, run a wider overflow-free internal datapath and saturate once at the end, or use range analysis to make overflow impossible by construction, which is the book's own preference (p. 71).

**HUB is the internal-format answer, and the faithful/correctly-rounded split is the whole-operator answer.** Half-unit biased dissolves the first trade-off outright: rounding into HUB is plain truncation, so half-ulp accuracy costs what truncation costs, and negation becomes bitwise inversion — $w$ inverters that fold into downstream LUTs, replacing a carry-propagate increment that on FPGA pins the operand to a carry-chain column. Pay for that with no representable zero, which is why the book uses HUB internally (FIR, [[CORDIC]], multipartite tables) rather than at interfaces. At the level of a whole block, specify [[Faithful Operator|faithful]] by default: the final rounding's $u/2$ is incompressible, so faithfulness reduces to buying $\lvert\delta_{\mathrm{datapath}}\rvert<u/2$ with guard bits, and the guard-bit table above shows how sharp that purchase is — $g=0$ misses on 11% of inputs, $g=1$ passes by luck, $g=2$ is provable. Specify correctly rounded only where $\delta_{\mathrm{approx}}=0$, or where the function is small enough to tabulate: the [[Correctly-Rounded Product Table]] exists only because $\pi$ is transcendental, so no product ever lands on a tie, and its $2^{w_X}(w_X+2)$ bits are a wall — $2560$ bits at $w_X=8$ is nothing, $416$ Mibit at $w_X=24$ is not a circuit. Between those two poles, correct rounding does not yield to guard bits at all, because its budget is $0$ rather than $u/2$.

$$\boxed{\ \text{half-ulp absorbable upstream}\ \Rightarrow\ \text{ties-up}\,;\quad \text{exact input}\ \Rightarrow\ \text{ties-to-even}\,;\quad \text{interval bound}\ \Rightarrow\ \text{directed}\,;\quad \text{otherwise}\ \Rightarrow\ \text{truncate and pay for it in } g\ }$$

**When this comparison breaks.** The table compares one quantization site in isolation, and the modes stop being independent as soon as several sites feed one budget — $n$ truncations at $\ell_{\mathrm{ext}}$ cost $n\,u\,2^{-g}$ together, so upgrading one site to round-to-nearest may be worth less than one more guard bit shared across all of them. The bias column assumes $Y$ uniform on the discarded field, which fails for correlated data such as a signal already quantized at a coarser grid. The FPGA LUT column assumes 6-input LUTs and a hard carry chain; on an architecture with neither, the ordering of ties-up against truncation-to-$\ell{-}1$ inverts. And every "attained?" answer concerns the *rounding* error only: once an approximation error exists upstream, the total is no longer half-ulp no matter which mode you pick — two half-ulps do not fit in one half-ulp, which is the whole reason [[Faithful Operator|faithful]] exists as a specification.

No RTL: this note synthesises to nothing. Each sibling carries its own compiled and simulated Spade block.

## Related Notes

- [[Truncation Unit]] – compares: the zero-cost baseline every other row is priced against, and the only one whose error never changes sign.
- [[Round-to-Nearest Ties-Up]] – compares: the default choice, free whenever its constant $2^{\ell-1}$ can be absorbed into a bit heap or a spare carry-in.
- [[Round-to-Nearest Ties-to-Even]] – compares: the same bound as ties-up but unbiased, paid for with a sticky tree that cannot be pre-injected.
- [[Directed Rounding Unit]] – counter-example: less accurate *and* more expensive than round-to-nearest, and still the right pick for interval bounds.
- [[Saturating Overflow Unit]] – compares: the orthogonal axis — range rather than precision — decided by one comparator and one mux.
- [[Half-Unit Biased Format]] – extends: dissolves the first row of the table by making round-to-nearest identical to truncation.
- [[Faithful Operator]] – depends-on: the specification that turns "which mode" into "how many guard bits", via the incompressible final $u/2$.
- [[Faithful Multiplier by Pi]] – supports: the one worked instance whose guard-bit sweep supplies the only measured numbers in the chapter.
- [[Correctly-Rounded Product Table]] – counter-example: the finite correctly-rounded architecture the multiplier cannot reach, and the exponential that kills it.
- [[Error Analysis]] – depends-on: how the per-site errors in this table compose into one bound.
- [[Error Accuracy]] – compares: the hub these nine circuits were cut from.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 3, "Computing Just Right: Accuracy Specification and Error Analysis", pp. 65-85.

| § | Topic | Pages |
| --- | --- | --- |
| 3.1.3, 3.1.4 | rounding to the nearest, Eq. (3.1); versus truncation; bias | 68-70 |
| 3.1.5 | directed modes and overflow in fixed-point libraries | 70-71 |
| 3.1.6 | half-unit biased format, Tables 3.1-3.2 | 71-73 |
| 3.1.7 | rounding with an approximation involved; the tabulation argument | 73-76 |
| 3.1.8, 3.1.9 | faithful operators, Definition 3.5; versus round-to-nearest | 76-77 |
| 3.3.3 | error budget, guard bits, Eq. (3.12) | 83-84 |
| 11.1.3, 11.2 | sticky-bit overhead in floating-point rounding (cited by the ties-to-even row) | 339, 345 |
