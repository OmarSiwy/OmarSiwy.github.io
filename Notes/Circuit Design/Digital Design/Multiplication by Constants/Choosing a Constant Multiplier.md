---
title: Choosing a Constant Multiplier
description: "Twenty circuits, two decisions — ASIC or FPGA picks the family, and the shape of the coefficient set picks the member; everything else is guard bits."
kind: comparison
source: "ASA Ch. 12, pp. 365-418 (§12.7 conclusion, p. 418)"
status: seed
spade: n/a
tags: [digital, multiplication-by-constants, comparison, scm, mcm, kcm, fpga, dsp]
aliases:
  - Choosing a Constant Multiplier
  - Constant Multiplier Comparison
  - Constant Multiplication Trade-offs
  - Which Constant Multiplier
  - SCM vs KCM
---

# Choosing a Constant Multiplier

Every circuit in this topic answers the same question — *what is the cheapest structure whose output is $CX$* — and they split on exactly two axes: whether you are buying adders or LUTs, and whether the coefficient is one integer, one real, one rational, or a whole set.

**The table prices area in the source's own units, which are not comparable across rows.** Adder count is a high-level ASIC metric, LUT count is an AMD-fabric FPGA metric, and the two never appear in the same row for the same reason. Logic depth is counted in adders or in LUT levels, never in nanoseconds — the book gives no absolute delay for any circuit in this chapter.

| Circuit | Cost, in the source's units | Logic depth | Accuracy | Page |
| --- | --- | --- | --- | --- |
| [[Binary Shift-and-Add Constant Multiplier]] | $\mathrm{nz}(C)-1$ adders; for $93X$, $w_X=8$: 4 adders, $36$ FA-eq. as a chain, $39$ as a tree | $\mathrm{nz}(C)-1$ chained, $\lceil\log_2\mathrm{nz}(C)\rceil$ treed | exact | p. 367 |
| [[CSD Constant Multiplier]] | $\le\lceil\frac{n+1}{2}\rceil-1$ adders; $93$: 5 nonzeros $\to$ 4, so 4 adders $\to$ 3 | unchanged from binary | exact | pp. 368–369 |
| [[Minimum-Adder Constant Multiplier]] | optimal, $\ge\lceil\log_2\mathrm{nz}(C)\rceil$ (eq. 12.8); tables cover $\le4$ adders to 12 bits, $5$ to 19 bits, $6$ to 32 bits; $173$ in 3 adders | small but **unconstrained** — the objective has no depth term unless you add one | exact | pp. 370–371, 373 |
| [[Ternary-Adder Constant Multiplier]] | $\le3$ adders for **every** $C$ up to 22 bits; $7\,154\,955$ is the first needing 4; $\approx1/3$ fewer adder resources averaged over $w_C>5$ | $\le3$ | exact | pp. 378–380 |
| [[Minimum Full-Adder Constant Multiplier]] | same adder count, different bit-level area: $49X$ at $w_X=8$ is $25$ FA-eq. via $7X$ and $16$ via $-15X$ | — | exact | pp. 380–382 |
| [[Tabulated Constant Multiplier]] | $w_X+w_C$ LUTs while $w_X\le\alpha$; $\times2^k$ per output bit at $w_X=\alpha+k$, plus address decoding | $1$ LUT | exact | p. 383 |
| [[KCM, Table-Based Constant Multiplication]] | $\lceil\frac{w_X}{\alpha}\rceil(w_C+\alpha)+(\lceil\frac{w_X}{\alpha}\rceil-1)w_C$ LUTs; $C=683$, $w_X=8$, $\alpha=4$: $38$ LUTs | $1$ LUT $+$ the adder rake (or one compressor tree) | exact | pp. 384–385 |
| [[Tabulated Perfectly Rounded Constant Multiplier]] | as full tabulation — $w_X+w_C$ LUTs while $w_X\le\alpha$ | $1$ LUT | $\le\frac12$ ulp, $|\delta|\le2^{\ell_R-1}$ — the best any operator can do | p. 386 |
| [[Faithful Shift-and-Add Real Constant Multiplier]] | adder count of $\widetilde C$, whose width follows from $|\delta_C|<2^{\ell_R-1}/X_{\max}$; $\pi/4$ at $\ell_R=-4$, $X_{\max}=255$ gives $\ell_{\max}=-12$, $\widetilde C=3217\cdot2^{-12}$, 5 nonzeros, 4 adders | as the underlying graph | faithful, $<1$ ulp; correct rounding costs $\approx w_X$ extra constant bits | pp. 387–389 |
| [[Fix-by-Real KCM]] | KCM count with $w_C\to m_R-\ell_R+g$ and $g>\log_2 D$; $\pi/4$, $\alpha=4$, $w_X=8$: $D=2$, $g=2$, $\approx38$ LUTs | $1$ LUT $+$ one carry chain | faithful; bound $0.75$ ulp, measured $0.018$ ulp at $X=173$ | pp. 390–393 |
| [[Periodic Shift-and-Add Rational Constant Multiplier]] | $i$ adders for $2^i$ repeats of the period; $7/5$ on a 24-bit mantissa at $w_0=28$: 5 adders, widths $24\to26\to30\to38\to54\to56$ | $\log_2$ in the bit count — each adder doubles the correct bits | exact to $w_0$ bits | pp. 396–399 |
| [[Rational-Constant KCM Table]] | $\approx\alpha+s$ LUTs per table; a 22-bit-wide table for $/3$ collapses to $5$ LUTs | unchanged from KCM | as KCM | p. 401 |
| [[Multiple Constant Multiplication]] | $\{19,43\}$: $2+3=5$ adders as separate SCM, 4 by sharing the visible $3X$, **3** optimal; lower bound $N_{\mathrm{uq}}+\min_t\lceil\log_2\mathrm{nz}(t)\rceil-1$ | — | exact | pp. 403–405 |
| [[Pipelined Adder Graph]] | $\{23,43\}$: ASAP-pipelined $\mathrm H_{\mathrm{cub}}$ needs 9 registers, 5 purely for balancing; RPAG matches the adder count with 4 | one register stage per adder level | exact | p. 406 |
| [[Table-Based Multiple Constant Multiplication]] | **52** distinct 1-bit tables (of $65536$ possible at $\alpha=4$) cover all signed products by all $C\in[1,2^{12}]$; error-interval 0-1 ILP cuts architectural LUTs by up to $20\%$ | better than shift-and-add at low $w_X$ | exact (or bounded, in the ILP variant) | pp. 407–408 |
| [[Sum of Constant Products]] | identical to the MCM graph for the same coefficient set — same adders, edges reversed | same as the MCM graph | exact | pp. 408–409 |
| [[Constant Matrix Multiplier]] | $19+43j$: two MCM blocks $+$ 2 final adders $=$ **8** additions, joint optimisation $=$ **6**; transposing an $M\times N$ graph gives $N_A-N+M$ | — | exact | pp. 410–411 |
| [[KCM-Based Sum of Products]] | one bit heap, $g>\log_2(ND)$; a 4-tap half-sine FIR at $\ell_X=\ell_R=-12$, $\alpha=5$ lands at $g=4$; fusing two KCMs moves their tables from $\ell_R-4$ to $\ell_R-3$ | $1$ LUT $+$ one compressor tree, whatever $N$ | faithful, one rounding for the whole sum | pp. 395, 413–414 |
| [[DSP-Block Constant Multiplier]] | $c=c_{\mathrm{Low}}\pm2^Bc_{\mathrm{High}}$ across a cascaded DSP48E pair ($17\times24$); $11\,508\,221$ admits 5 valid splits; a 5-coefficient single-precision filter drops from **10 DSPs to 7** | 1–2 DSP stages | exact | pp. 415–416 |
| [[Reconfigurable Constant Coefficient Multiplier]] | $C\in\{45,19\}$ in **2 adders and 2 MUXes**; the LUT-reconfiguration alternative costs $\approx32$ clock cycles per switch on recent Xilinx parts | as the fused graph, $+$ one MUX level | exact | p. 417 |

Every `—` is a real gap in Chapter 12, not an omission here. [[Minimum Full-Adder Constant Multiplier]] is costed only in full-adder equivalents, with no statement of what re-balancing the shifts does to depth. [[Multiple Constant Multiplication]] and [[Constant Matrix Multiplier]] are costed purely in additions — no LUT figure, no depth, and no accounting of the fan-out that sharing an intermediate across many taps creates. And there is no absolute delay anywhere in the chapter: even the DSP rows are given as "1–2 stages", so nothing here can be compared against a timing constraint without synthesis.

> [!important] The chapter's own conclusion is that the table does not decide
> "In most cases, however, the final choice should probably be done on a trial and error basis. This choice should actually be performed by the generator, based on an evaluation of the performance and resource consumption of the operator being generated. At the time of writing this book, FloPoCo does not yet offer this functionality." (p. 418.) The rules below are rules of thumb the book states as such — see [[FloPoCo]].

**The fabric decides the family before the coefficient is even read.** On an ASIC, shift-and-add always (p. 418): there is no LUT array to tabulate into, the exact algorithms of [[Minimum-Adder Constant Multiplier]] reach most practical constant widths, and good heuristics cover the rest. On an FPGA the rule inverts, because the LUT is area you have already paid for and KCM's cost is *flat in the constant's bit pattern* — a 2-adder constant and a 12-adder constant cost the same $38$ LUTs at $w_X=8$, $w_C=10$. So take [[KCM, Table-Based Constant Multiplication]] by default and drop to [[Binary Shift-and-Add Constant Multiplier]] only for really simple constants. Below $\alpha$ input bits the question disappears entirely: [[Tabulated Constant Multiplier]] is $w_X+w_C$ LUTs and one LUT of delay, and nothing can beat one LUT per output bit. One bit past $\alpha$ it costs $2^k$ LUTs per output bit and you must leave. Between those, the deciding comparison is $w_C$ against $w_X$: KCM's cost is driven by the chunk count $\lceil w_X/\alpha\rceil$ and shift-and-add's by $\mathrm{nz}(C)$, so a wide constant times a narrow input is KCM's best case and the reverse is shift-and-add's. The floating-point exponential's $\times\log 2$ is the limiting instance — a small integer exponent, an enormous constant, many result bits — and the book calls it for KCM without hesitation (p. 418).

**Inside shift-and-add, the ordering is by how much offline search you are willing to pay for.** [[CSD Constant Multiplier]] is free and greedy, and it pays exactly in proportion to how many runs of ones the constant has: three adders instead of four for $93$, and *nothing at all* for $683$, whose binary form is already alternating. [[Minimum-Adder Constant Multiplier]] is a table lookup at design time and strictly better — $93$ in two adders, not three — but SCM is NP-complete, so the tables stop where the enumeration stopped (5 adders to 19 bits, 6 to 32) and the ILP fallback runs under a second at 12 bits, minutes at 16, and up to an hour at 20. Two corrections sit on top of the adder count. On an FPGA, use [[Ternary-Adder Constant Multiplier]] instead of the binary one and the search problem largely evaporates: three adders suffice for every constant below 22 bits, at about a third less resource, because the carry chain's third input is free. And on either fabric, adder count is *not* area — [[Minimum Full-Adder Constant Multiplier]] gets $49X$ down from $25$ to $16$ full-adder cells at identical adder count, purely by choosing the graph whose negative intermediates leave the most LSBs as bare wires. Optimise adders when you are counting instances, full adders when you are counting silicon.

**Coefficient structure, when it exists, beats any generic search.** If $C$ is rational with a small denominator, [[Periodic Shift-and-Add Rational Constant Multiplier]] exploits a periodicity the generic algorithms cannot see: each addition doubles the number of correct bits, so $2^i$ repeats of the period cost $i$ adders, which is optimal. The honest caveat is the book's own — once the rational is rounded to a fixed width, the optimal SCM algorithms find an equally good graph, just slower; and for small denominators like 3 or 5 the specialisations in [[Division by Constants]] are usually better still. The table-side analogue, [[Rational-Constant KCM Table]], collapses a 22-bit table to 5 LUTs but shrinks only the tables, never the KCM adders, and synthesis finds it unprompted. If $C$ is real, the decision is an accuracy decision: [[Tabulated Perfectly Rounded Constant Multiplier]] is the half-ulp reference and dies with $w_X$ like any full tabulation; [[Faithful Shift-and-Add Real Constant Multiplier]] and [[Fix-by-Real KCM]] both spend one ulp, splitting it between the final rounding and the constant's own truncation. Choose between them exactly as in the integer case, and note that faithful is much cheaper than correct: correct rounding costs roughly $w_X$ extra bits of constant for one extra bit of result accuracy.

**Once there is more than one coefficient, the per-coefficient optimum is the wrong objective.** [[Multiple Constant Multiplication]] finds sharings that inspecting the individual graphs never reveals — $\{19,43\}$ in three adders where two separate optima need five — and [[Sum of Constant Products]] is the same graph with every edge reversed, so a filter in transposed form costs what the direct form costs. [[Constant Matrix Multiplier]] goes further and optimises inputs and outputs jointly: a complex multiply by $19+43j$ in six additions against eight for two MCM blocks. On the table side the sharing is of LUT *contents* rather than intermediates, and [[Table-Based Multiple Constant Multiplication]] gives lower area *and* better delay than shift-and-add for low input word sizes on FPGAs (p. 407), while [[KCM-Based Sum of Products]] fuses every table of every tap into one bit heap so that $g>\log_2(ND)$ guard bits replace one rounding per multiplier. Three constraints then override all of this. If throughput is the binding constraint, pipeline with [[Pipelined Adder Graph]] rather than after the fact — balancing registers dominate an ASAP-pipelined graph (9 registers, 5 of them pure balancing, for $\{23,43\}$) and a pipelining-aware search finds 4 at the same adder count. If DSP blocks are the scarce resource, [[DSP-Block Constant Multiplier]]'s free split parameter $B$ is what lets a search share sub-constants across taps and turn 10 DSPs into 7. And if the coefficient changes at run time, none of the above applies: [[Reconfigurable Constant Coefficient Multiplier]] fuses the whole set into one MUXed graph and switches in one cycle, whereas rewriting the KCM tables through the reconfiguration port costs about 32 cycles — fine per layer or per frame, useless per sample.

$$\boxed{\ \textbf{ASIC: shift-and-add, always.}\quad\textbf{FPGA: KCM, except for really simple constants.}\quad\text{(p. 418)}\ }$$

**When this comparison breaks.**

- **No row carries a delay.** Logic depth is counted in adders and LUT levels; two rows with the same depth can differ by a carry chain of very different length. The $22$-bit ternary result in particular says nothing about whether three chained ternary adders meet timing.
- **The FPGA numbers are $\alpha$-dependent and vendor-dependent.** $\alpha$ is 4 to 6 on mainstream parts, and every LUT count above moves with it. The 52-table result is specifically $\alpha=4$; Wirthlin's $\alpha-1$ chunking is a Xilinx trick that Intel LUTs, which already ship with a full adder, do not need. The $17\times24$ DSP asymmetry that gives the split parameter its freedom is gone on recent Intel DSPs.
- **Exact search has a hard ceiling.** SCM is NP-complete. Past 20-bit constants, or past a few dozen coefficients in MCM, everything in the shift-and-add column becomes a heuristic and the "optimal" claims lapse.
- **Recursive filters are out of scope.** An IIR sum of constant products re-injects its output into its own summation, and the error analysis for that infinite recursion is not in this chapter (p. 414). Neither is the freedom a frequency-response specification leaves in choosing the coefficients in the first place — see [[LTI Filters]].

No RTL: this note compares circuits and instantiates none.

**Related Notes.**

- [[Binary Shift-and-Add Constant Multiplier]] – compares: the baseline, and the only thing you need when $\mathrm{nz}(C)$ is 2 or 3.
- [[CSD Constant Multiplier]] – compares: free adder savings, proportional to the runs of ones and sometimes zero.
- [[Minimum-Adder Constant Multiplier]] – compares: strictly fewest adders, bought with offline enumeration that has a width ceiling.
- [[Ternary-Adder Constant Multiplier]] – compares: the FPGA answer that makes the SCM search almost irrelevant below 22 bits.
- [[Minimum Full-Adder Constant Multiplier]] – counter-example: the row that proves the adder column above is not an area column.
- [[Tabulated Constant Multiplier]] – compares: unbeatable at $w_X\le\alpha$ and unusable one bit later.
- [[KCM, Table-Based Constant Multiplication]] – compares: the FPGA default, and the only cost here that ignores the constant's bit pattern.
- [[Tabulated Perfectly Rounded Constant Multiplier]] – compares: the half-ulp reference the real-constant rows are measured against.
- [[Faithful Shift-and-Add Real Constant Multiplier]] – compares: the real-constant branch of the shift-and-add family, priced in ulps rather than adders.
- [[Fix-by-Real KCM]] – compares: the real-constant branch of the table family; $g>\log_2 D$ is its whole cost delta.
- [[Periodic Shift-and-Add Rational Constant Multiplier]] – extends: structure the generic SCM search cannot see, valid only for short periods.
- [[Rational-Constant KCM Table]] – extends: the same periodicity inside the tables, shrinking tables but not adders.
- [[Multiple Constant Multiplication]] – extends: changes the objective from one coefficient to a set, and the per-coefficient optimum stops being optimal.
- [[Pipelined Adder Graph]] – depends-on: what MCM becomes once throughput, not area, is the binding constraint.
- [[Table-Based Multiple Constant Multiplication]] – compares: MCM sharing done in LUT contents instead of intermediates.
- [[Sum of Constant Products]] – compares: the transposed MCM graph, same cost, different operator.
- [[Constant Matrix Multiplier]] – extends: several inputs and outputs optimised jointly, beating two independent MCM blocks.
- [[KCM-Based Sum of Products]] – extends: one bit heap and one rounding for a whole filter, replacing per-tap roundings.
- [[DSP-Block Constant Multiplier]] – compares: the option that exists only when DSP blocks are scarce enough to be worth splitting.
- [[Reconfigurable Constant Coefficient Multiplier]] – counter-example: the one row where $C$ is not fixed at synthesis time, which invalidates every other row's premise.
- [[Multiplication by Constants]] – depends-on: the adder-graph formulation and the worked $683$ and $\pi/4$ examples the numbers above come from.
- [[Error Accuracy]] – depends-on: what faithful, correctly rounded and ulp mean in the Accuracy column.
- [[FPGAs]] – depends-on: the LUT, carry-chain and DSP primitives that make half this table fabric-specific.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 12, "Multiplication by Constants", pp. 365–418:

- §12.1, pp. 366–369 — adder graph and eq. 12.1 p. 367, subtraction costs the same p. 368, Algorithm 12.1 and the CSD bound pp. 368–369, NP-completeness p. 369.
- §12.1.3–12.1.4, pp. 370–378 — MAG coverage and the $173$ recursion pp. 370–371, ILP retargetability p. 373, lower bound eq. 12.8 p. 373, solver runtimes p. 378.
- §12.1.5–12.1.6, pp. 378–382 — ternary reachability to 22 bits and $7\,154\,955$ p. 378, $683X$ in two ternary adders Fig. 12.6 p. 379, the $\approx1/3$ saving Fig. 12.7b p. 380, $49X$ at $25$ vs $16$ FA-eq. Fig. 12.8 p. 382.
- §12.2, pp. 383–385 — full tabulation and its $2^k$ collapse p. 383, KCM Fig. 12.10 p. 384, **the LUT count p. 385**, Wirthlin's $\alpha-1$ chunking p. 385.
- §12.3, pp. 386–394 — perfectly rounded tables p. 386, the error split eqs. 12.16–12.22 p. 388, the admissible interval and correct-rounding cost p. 389, fix-by-real KCM eqs. 12.25–12.27 p. 390, **$g>\log_2 D$ eq. 12.36 p. 392**, per-constant gulp bounds p. 393, virtual operators p. 394, fused-KCM table widths p. 395.
- §12.4, pp. 395–401 — Lemmas 12.1–12.2 p. 396, the doubling recurrence pp. 398–399, the $7/5$ instance Fig. 12.17 p. 399, caveats pp. 400–401, periodic tables Fig. 12.18 p. 401.
- §12.5, pp. 401–414 — $\{19,43\}$ Fig. 12.19 p. 403, $\mathrm H_{\mathrm{cub}}$ and DiffAG p. 404, MCM lower bound eq. 12.43 p. 405, $\{23,43\}$ pipelining Fig. 12.20 p. 406, the 52 tables and the $20\%$ ILP saving p. 407, SOPC transposition Figs. 12.22 pp. 408–409, CMM eq. 12.46 p. 410 and the $N_A-N+M$ transpose rule p. 411, **$g>\log_2(ND)$ eq. 12.51 p. 413**, IIR exclusion p. 414.
- §12.6, pp. 414–417 — the DSP split eq. 12.53 p. 415, the 10-to-7 DSP filter Fig. 12.27 p. 416, RCCM Fig. 12.28 and the 32-cycle reconfiguration p. 417.
- §12.7, p. 418 — the ASIC/FPGA rule of thumb, the $\times\log2$ case, and the trial-and-error admission.
