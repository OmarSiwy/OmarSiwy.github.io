---
title: Choosing a Table Method
description: "Trade-off table across the twelve table-based function evaluators, with the source's own bit counts, LUT counts and measured errors — and the four constraints that actually decide between them."
kind: comparison
source: "ASA Ch. 17, pp. 497-527; §16.4.2, pp. 491-492"
status: seed
spade: n/a
tags: [digital, table-based-function-evaluation, comparison]
aliases:
  - Choosing a Table Method
  - Table Method Comparison
  - Which Table Method
---

# Choosing a Table Method

Twelve circuits sit between one plain ROM and one polynomial evaluator; the choice between them is decided by four things in order — the input width $w_X$, the target technology, the accuracy *specification* (not the accuracy achieved), and whether the operator's output already feeds a bit heap.

All bit counts below are for $f=\sin(\pi x/4)$ on $[0,1)$ with $\ell_X=\ell_R=-w_X$, faithful rounding, symmetry exploited where the method admits it. LUT counts use the $2^{\max(k-\lambda,0)}\times n$ model of Sect. 16.4.2 (p. 492) at $\lambda=6$.

| method | 8-bit table bits | 16- / 24-bit | reads and additions | max $\lvert\delta_{\text{total}}\rvert$ | source |
| --- | --- | --- | --- | --- | --- |
| plain ROM | $8\cdot2^{8}=2048$ (32 LUTs by formula, **25 measured**) | $16\cdot2^{16}=1\,048\,576$ (16 384 LUTs) | 1 read, 0 adders | **0.5 ulp**, monotonic for free | pp. 491-492, 520 |
| [[LDTC, Lossless Differential Table Compression\|LDTC]] | $224+768=992$ (**×0.48**); ≈26 LUTs, ×0.81 | — | 2 reads, 1 add of $w_H=7$ bits — or $v=2$ columns into a heap | **0.5 ulp**, bit-for-bit lossless | p. 502 |
| [[Bipartite Table Method\|bipartite]] ($m=1$) | $288+128=416$ (**×4.9**); 13 LUTs + 9-bit carry chain | $24\,064$ (×43.6) | 2 reads, 1 add | 0.9101 / 0.915 ulp | computed |
| [[Symmetric Table of Offsets]] | 544 → **416** on that instance | — | $+\,(\beta-1)+w$ XOR gates, no adder | unchanged | p. 517 |
| [[Multipartite Methods\|multipartite]] | $m{=}2$: **352** (×5.8); $m{=}3$: 360 | $m{=}3$: $\mathbf{14\,784}$ (**×70**), 231 LUTs; $m{=}4$: 7808 auto / **6912** tuned | $m{+}1$ reads, heap + tree + 1 CPA | 0.779 ulp; 0.915 / 0.939 ulp at 16 bits | pp. 520-521, computed |
| [[Multipartite with Compressed TIV]] | — | TIV $7\cdot2^{6}+13\cdot2^{9}=7104$ of that 14 784; 111 of the 231 LUTs | +1 heap row, only $v=2$ new columns | **exactly unchanged** | pp. 518, 520 |
| [[HUB Table Filling]] | **0 bits** | — | deletes $m$ conditional carries and the whole $w_R{+}g$-bit rounding adder | final rounding $2^{\ell_R-1}(1-2^{-g})$ | pp. 516-518 |
| [[Monotonic Multipartite Tables\|monotonic]] | $304\to352$ (**+15.8%**), 11 → 13 LUTs (+18%) | K6-2 recip. sqrt: $5.5\to\mathbf{7.25}$ KB (**+31.8%**) | same structure, $g$ up by one | 0.953 → **0.797** ulp; 1 → 0 defects | p. 522, computed |
| [[ILP-Optimized Multipartite Tables\|ILP]] | $512+160=\mathbf{672}$ (×3.05 vs ROM, ×1.48 vs LDTC) | 16 bits: **÷5 LUTs vs LDTC**; caps below 16 bits | same structure | **0.5 ulp**, correctly rounded; latency *below* a plain ROM | pp. 522-523, computed |
| [[ATA, Addition-Table-Addition\|ATA]] | $67\times11=737$ at $\alpha{=}6,\beta{=}2,g{=}3$ | — | 2 reads of **one** table, 3 adds | 0.991 ulp (at $w_X=6$) | p. 524, computed |
| [[Central-Difference ATA]] | — | — | 3 reads of one table, **7 adds** | error is third-order in the stencil | p. 525 |
| [[STAM, Symmetric Table Addition Method\|STAM]] | — | 24 bits: **6 tables of 12-13 address bits, 9 additions** — $\le 6\cdot2^{13}\approx49\,000$ entries against $2^{24}\approx16.8$ M | 5 reads of one table + 1 correction table | — | p. 526 |
| [[Partial Product Array Function Evaluation\|partial product arrays]] | — | — | heap + tree + 1 CPA | — | p. 527 |

Where a cell reads "—" the source gives nothing and neither does this vault. Specifically: **§17.3.2 on partial product arrays is two paragraphs with no figure, no worked instance, no table size and no LUT count** — only the verdict "less compact … and interestingly similar" to multipartite (p. 527); **§17.3.1 gives no bit count for any ATA operator except the 24-bit STAM totals** (p. 526), and none of STAM's per-table output widths, its $g$, or its error; and no 16-bit LDTC instance is tabulated anywhere. Rows marked *computed* were re-derived in the sibling notes and checked exhaustively over all $2^{w_X}$ inputs; they are not quotations. The three modifier rows — symmetry, HUB, TIV compression — have no standalone 8-bit column because they are not architectures, they are transforms applied to the row above.

> [!warning] One error figure in the long-form note is wrong
> [[Table-Based Function Evaluation]] reports $0.9076$ ulp for the 8-bit bipartite instance. That is the error at $X=\mathtt{00100000}$, not the maximum: the exhaustive worst case is $0.9101$ ulp at $X=\mathtt{01001000}$. Both are faithful, so no conclusion changes. The table above uses the measured figure. Likewise, the long-form's "4× reduction" for [[Symmetric Table of Offsets]] does not follow from its own formulas — $2^{\gamma+\beta}(w{+}1)\to2^{\gamma+\beta-1}w$ is $2(w{+}1)/w$, i.e. $2.5\times$ at $w=4$ and tending to $2\times$.

**Precision picks the family, and the windows barely overlap.** Below about $w_X=10$ build the plain ROM and stop: it is correctly rounded, monotonic for free, one table read with no adder in the path, and no error analysis to get wrong. Bipartite already halves the LUT count at $w_X=8$ — 13 against 25 — but it buys that with a carry chain in the critical path and a faithful-only result, which is rarely the trade you want at a width where the ROM is 25 LUTs in the first place. From roughly 10 to 24 bits the exponential $2^{w_X}$ is unbearable and multipartite owns the range; the win compounds, from ×5.8 at 8 bits to ×70 at 16. Past 24 the TIV is exponential again and no order-one method survives: every scheme addressing a table of initial values with $\alpha$ bits inherits $\alpha\gtrsim w_X/2$ from the Lagrange remainder of the first-order Taylor expansion (p. 523), so the only escape is order two, which moves the bound to $\alpha\gtrsim w_X/3$ and is worth a squarer or a DSP block — [[Polynomial Approximation]]. The sharpest way to state multipartite's near-optimality inside its window: a *free, perfect multiplier* would delete every $\mathrm{TO}_i$ and still remove less than half the total size (p. 523).

**Technology decides second, and it can invert the ranking outright.** Bit count is not area. On an FPGA a table with at most $2^\lambda$ entries costs $n$ [[Lookup-Tables|LUTs]] whatever its depth, so shrinking a $\gamma_i$ below the LUT input count saves nothing the bit-count objective claims — free real estate the book's cost function cannot see. Above the LUT/[[Block Memory|block RAM]] crossover the whole argument reverses: a plain ROM that fits one BRAM costs *no logic at all*, and splitting it into several tables of awkward width plus a compressor tree in fabric is a strict regression however good the compression ratio looks. The rule of thumb is blunt — if the plain ROM fits comfortably in BRAMs you are not otherwise using, build the plain ROM. The same crossover decides the ATA family, from the other side: its second and third reads are free on true-dual-port BRAM, so at 24 bits STAM's table bits *are* its cost, but below the crossover there is no such thing as a dual-port LUT-ROM and every extra read is another copy of the logic cone. On an ASIC there is no architectural $\lambda$ and the standard-cell model $A\propto2^{0.65\min(k,n)}2^{0.19\lvert k-n\rvert}$ (Eq. 16.1, p. 491) is symmetric in address bits and output bits, so narrowing a table is worth about what shortening it is — and the ATA reads are just extra decoders over one shared cell array, which is the one place that family is not penalised. See [[FPGAs]].

**The accuracy specification, not the accuracy achieved, decides third.** Four distinct requirements live in this chapter and they are not ordered by strictness alone. If you need the *exact bits of an existing table* — coefficient tables, an already-verified ROM — the answer is [[LDTC, Lossless Differential Table Compression|LDTC]], and it is nearly unconditional: it is lossless, so it costs nothing in accuracy or in verification effort, it is free in delay whenever the output already feeds a [[Compressor Trees|compressor tree]] (the reconstruction merges into the [[Bit Heaps|bit heap]] as $v=2$ extra columns), and ratios of 0.5-0.8 are routine with 0.36 the best reported (p. 502). If you need **correct rounding** below 16 bits, formulate the whole thing as an ILP: two linear constraints per input code buy what the analytic method structurally cannot reach, because bounding $\delta_{\text{approx}}$ and $\delta_{\text{round}}$ separately double-counts, and faithfulness is the strongest claim that sum will support. It costs about $1.6\times$ the table — 672 bits against bipartite's 416 at 8 bits — but at 16 bits it is *5× fewer LUTs than LDTC* and lands at lower latency than the plain ROM it replaces, because a more compact solution routes shorter (pp. 522-523). If you need **monotonicity**, note first that shrinking the approximation error does not buy it: monotonicity is a property of the error's *sign*, and only forcing that sign constant across each segment removes a backward step. Taking the right-end slope instead of the averaged chord doubles $\overline{\delta_{\text{approx}}}$, costs a guard bit on every one of the $m+1$ tables, and ran +15.8% of table bits on the 8-bit instance against AMD's measured +31.8% on silicon. And if faithfulness genuinely suffices, take it — that is the entire premise the family is built on.

**Three modifiers are always on, and three architectures are museum pieces.** [[Symmetric Table of Offsets]], [[HUB Table Filling]] and [[Multipartite with Compressed TIV]] are not choices to weigh; they are transforms with no accuracy cost that the search should apply to every candidate. Symmetry is $2(w{+}1)/w$ off each offset table for $(\beta-1)+w$ XOR gates. HUB filling changes only what a generator script writes into the ROM, and deletes both the $m$ conditional $+1$ carries the symmetry negations would otherwise dump into the heap and the entire final rounding adder — the last of those becomes a wire cut. TIV compression is LDTC applied to the dominant term inside the multipartite search: on the 16-bit instance it cuts the TIV to 7104 bits and leaves the two halves of the architecture within 8% of each other, at exactly zero error. Against that, the [[ATA, Addition-Table-Addition|ATA]] family and [[Partial Product Array Function Evaluation|partial product arrays]] are historically important and both lose to generalised multipartite on the book's own measurements (p. 526). ATA's single table is full width where bipartite's second table is 4 bits, and the pre-adder sits on the *address* path where it cannot hide beside the lookup — 737 bits against 416 at 8 bits, one table being no guarantee of cheapness. Build one only when the $\pm B$ structure buys something else: a table already shared with another operator, or an $f$ whose ROM is sitting in BRAM anyway. Partial product arrays are worth reading for the diagnosis rather than the architecture — flattening $f$ into AND-gates throws away *continuity*, the one high-level property multipartite exploits directly, and every structural saving must then be rediscovered combinationally by a heuristic.

$$\boxed{\ w_X\lesssim10\ \text{or a spare BRAM}\Rightarrow\text{ROM};\quad 10\lesssim w_X\lesssim24\Rightarrow\text{multipartite}+\text{symmetry}+\text{HUB}+\text{compressed TIV};\quad w_X\gtrsim24\Rightarrow\text{order two}\ }$$

**When this ranking breaks.** It assumes $f$ is continuous, differentiable and has bounded derivatives on the reduced domain — $\sqrt{x}$ on $[0,1)$ has $\max\lvert f'\rvert=\max\lvert f''\rvert=\infty$ and *no* decomposition is faithful until range reduction moves it to $2(\sqrt{1+x}-1)$ (p. 503). It assumes the whole operator is one combinational cone: a pipeline stage that truncates between two partial sums injects a rounding term the three-way ulp budget never allocated. It assumes table bits are the objective, which stops being true the moment the LUT/BRAM crossover is in play or the output width, not the depth, is what the tool charges for. And every number above is one function at one width — the constants $\max\lvert f''\rvert$ and the output range enter the parameter search directly, which is why the method ships as an enumeration rather than a formula.

**RTL.** `spade: n/a` — this note compares circuits, it is not one. Every synthesizable block lives in the sibling notes linked below.

**Related Notes.**

- [[LDTC, Lossless Differential Table Compression]] – compares: the only lossless row, and the one to reach for whenever a table already exists.
- [[Bipartite Table Method]] – compares: the $m=1$ baseline every other multipartite figure is measured against.
- [[Symmetric Table of Offsets]] – supports: a transform, not an alternative — apply it to every offset table in every candidate.
- [[Multipartite Methods]] – compares: owns the 10-to-24-bit window, and the row all the ×70 figures come from.
- [[Multipartite with Compressed TIV]] – supports: LDTC on the dominant term, at exactly zero accuracy cost.
- [[HUB Table Filling]] – supports: a fill-time decision that deletes two pieces of runtime hardware and costs no bits.
- [[Monotonic Multipartite Tables]] – counter-example: what the faithful-rounding premise costs when the spec quietly wanted monotonicity.
- [[ILP-Optimized Multipartite Tables]] – extends: correct rounding below 16 bits, which the analytic error budget structurally cannot reach.
- [[ATA, Addition-Table-Addition]] – compares: adds before the lookup instead of tabulating a slope; loses on bits at 8 bits.
- [[Central-Difference ATA]] – compares: a third read for a third-order stencil, still an order-one method by the $\alpha$ bound.
- [[STAM, Symmetric Table Addition Method]] – compares: the production ATA, and the only 24-bit data point in the chapter.
- [[Partial Product Array Function Evaluation]] – counter-example: flattening to a bit heap destroys the continuity that makes multipartite work.
- [[Fixed-Point Function Approximation]] – depends-on: sets up faithful rounding and the plain-ROM baseline all of these are measured against.
- [[Polynomial Approximation]] – extends: where you go above 24 bits, once $\alpha\gtrsim w_X/2$ stops being affordable.
- [[Table-Based Function Evaluation]] – depends-on: the long-form derivation of the ulp budget, the $\alpha\approx2w_X/3$ rule, and the worked 8-bit instance.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17 "Function Evaluation Using Tables and Additions", pp. 497-527.

- §17.1.5, p. 502 — LDTC ratios 0.5-0.8, best 0.36, $v=2$, and the 8-bit $\sin(\pi x/4)$ figures $224+768=992$.
- §17.2.2, pp. 504-506 — the bipartite construction and $\alpha\approx2w_X/3$, $\beta\approx\gamma\approx w_X/3$.
- §17.2.3, p. 507 and §17.2.6, p. 517 — symmetry, $2^{\gamma+\beta}(w{+}1)\to2^{\gamma+\beta-1}w$.
- §17.2.5.3, p. 516 and §17.2.7, pp. 517-518 — Eq. (17.31), the $2^{\ell_R-1}(1-2^{-g})$ bound, the parity rule and the free final truncation.
- §17.2.8, p. 518 and §17.2.9, pp. 519-520 — TIV compression; the 16-bit run, $m=3$, TIV $7\cdot2^{6}+13\cdot2^{9}$, TOs $9\cdot2^{9}+7\cdot2^{8}+5\cdot2^{8}$, 14 784 bits, factor 70.
- §17.2.10, Table 17.2, pp. 521-522 — $m=4$ at 7808 auto / 6912 tuned, 0.915 / 0.939 ulp; the K6-2 result, 7.25 KB against 5.5 KB.
- §17.2.11, pp. 522-523 — the ILP formulation, the sub-16-bit cap, the factor-5 LUT figure against LDTC, and latency below a plain table.
- §17.2.12, p. 523 — $\alpha\gtrsim w_X/2$ for order one, $w_X/3$ for order two, and the free-multiplier argument.
- §17.3.1, pp. 523-526 — ATA's five-operation cost list (p. 524), three reads and 7 additions (p. 525), STAM's 6 tables of 12-13 input bits and 9 additions at 24 bits, and the ranking against [DT05] (p. 526).
- §17.3.2, pp. 526-527 — partial product arrays, and the continuity diagnosis.
- §16.4.2, Eq. (16.1) and Fig. 16.11, pp. 491-492 — the ASIC standard-cell, LUT and block-RAM cost models, and the 25-LUT measurement.

Long-form source: [[4.2) Table-Based Function Evaluation]]. Every figure marked *computed* is re-derived and exhaustively verified in the sibling note it is drawn from.
