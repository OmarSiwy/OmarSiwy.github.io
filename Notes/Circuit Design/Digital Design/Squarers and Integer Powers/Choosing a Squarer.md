---
title: Choosing a Squarer
description: "Trade-off table across the 11 Squarers and Integer Powers circuits, with the source's own numbers — which scarce resource, and which exponent, actually decides."
kind: comparison
source: "ASA Ch. 14, pp. 443-451"
status: seed
spade: n/a
tags: [digital, squarers-and-integer-powers, comparison, area, accuracy]
aliases:
  - Choosing a Squarer
  - Squarer Trade-offs
  - Squarer Selection
  - Which Squarer
  - Choosing an Integer Power Operator
---

# Choosing a Squarer

Every circuit in this topic is a different answer to one question — how much of the symmetric partial-product array do you refuse to build, and what resource do you refuse to spend building it in.

| Variant | Bit heap / partial products | DSP | LUT | Depth · delay · cycles | Accuracy | pp. |
| --- | --- | --- | --- | --- | --- | --- |
| *baseline:* general multiplier, both ports tied to $X$ | $n^2$ ANDs, $n^2$ heap bits (144 at $n=12$)† | $4$ for a 2-way split | — | — | exact | 444–445 |
| [[Folded Array Squarer]] | $\tfrac{n(n-1)}{2}$ ANDs, $\tfrac{n(n+1)}{2}$ heap bits (66 / 78 at $n=12$)†; book states only "roughly half" | — | — | — (one compressor level less, structural) | exact | 444–445 |
| [[High-Radix Squarer]] | subwords of $k$ bits; $X_1X_0$ built once | $4\to\mathbf{3}$ (2-way), $9\to\mathbf{6}$ (3-way) | — | "no arithmetic overhead", unlike Karatsuba | exact | 445 |
| [[DSP-Cascade Squarer]] | as (14.2), with $2X_1$ pre-shifted | $3$, cascade usable; shift $=17$ (AMD), $18$ / $27$ (Stratix V); needs $|X|\le 33$ bits, $|X_1|\le 16$ | — | — (chain replaces fabric adds) | exact | 445–446 |
| [[Booth-Recoded Squarer]] | heap $\times\approx 3/4$; $Z_i^2$ = **2** bits replacing **3**, $Z_iZ_j$ = **3** sign-extended bits replacing **4** | — | recoder + a $Z_iZ_j$ function, against **4** AND gates | — | exact | 446 |
| [[Truncated Squarer]] | one column further than the same-size multiplier | — | — | — (shorter final CPA only) | **faithful**, $<1$ ulp | 446–447 |
| [[Squarer Tiling]] | only the on-and-above-diagonal region covered; each mirrored pair = **1** multiplier shifted left by **1** | **4** for a 53-bit square (Fig. 14.5) | — | — | exact *or* truncated | 447–449 |
| [[Squarer Staircase Tile]] | covers **15** partial products, emits **10** bits | $1$, only in square config $w_X=w_Y$ | **10 LUT5 = 5 LUT6**; $15/(5+10\times.55)\approx\mathbf{1.43}$ PP/LUT, beating Table 8.3, p. 229 | — | exact | 448 |
| [[Diagonal-Straddling Squarer Tile]] | double-covers square $S1$, which is recomputed and **subtracted** | $1$ (the reason to do it) | shares $x_7,x_8$ → 6 inputs → **1 LUT6** alternative | — | exact | 448 |
| [[Cube Bit Heap]] | heap grows as the **cube** of the input width; $3x=2x+x$ replicates each bit | — | — | — (tall heap) | exact | 449–450 |
| [[Square-and-Multiply Power Chain]] | — | — | — | $\lfloor\log_2 p\rfloor$ squarers $+\,(\nu(p)-1)$ multipliers; $p=34$ → **5 + 1**; each squarer outputs **2×** its input width | exact | 450 |
| [[Faithful Fixed-Point Power]] | every intermediate clamped to $w+g$ | — | — | same operator count; **1 guard bit** per squaring or multiplication | **faithful** | 451 |

† Derived from eq. (14.1), not tabulated in the source: the book states the halving only as "the bit complexity of squaring is roughly half of that of standard multiplication" (p. 444) and draws the $n=12$ heap (Fig. 14.2, p. 445) without counting it.

> [!warning] Not covered in the source — needs outside research
> Chapter 14 reports **no delay, no $f_{\max}$, no logic-depth figure and no cycle count** for any squarer, and no LUT or slice count except the ten LUT5 of tile T1 (p. 448). Every "—" above is a genuine gap. The only hard numbers in the whole chapter are the DSP counts (4→3, 9→6, and 4 for $n=53$), the T1 efficiency of $1.43$, the Booth factor of $3/4$, and the truncation parameters $\ell_{\mathrm{ext}}=\ell-3$, $t=3$ of the 12-bit example. Every latency or depth claim here is structural, inferred from heap height, and must not be quoted as measured. Nor does the chapter give a DSP count for an ILP-optimal $53\times53$ *multiplier*, so the headline saving of squarer tiling at that width cannot be stated as a ratio from this source alone.

**The exponent branches first, and for $p=2$ the folded array is the default you should have to argue your way out of.** Equation (14.1) costs nothing to adopt — the fold is commutativity of AND merging two triangles and idempotence turning the diagonal into wires, so the halving is paid for by re-weighting bits rather than by any circuit ([[Folded Array Squarer]]). Nothing else in the table is free in that sense, which is why every other row should be read as a modification of this one rather than as a competitor to it. The one row that is a genuine competitor and still loses is [[Booth-Recoded Squarer]]: it shrinks the heap by only $\approx 3/4$ where Booth halves a *multiplier's*, and it pays a recoder plus a Boolean $Z_iZ_j$ function against the four AND gates it displaces (p. 446). The reason is structural rather than numerical — Booth's leverage on a multiplier comes from killing whole rows of partial products, and the fold has already killed half the array by a cheaper mechanism, so the two optimisations are competing for the same redundancy and the cheaper one got there first. Below about 8 bits, skip the whole table and tabulate $X^p$ outright (p. 443): a lookup is one LUT6 per output bit and delivers correct rounding, which nothing here does.

**Past that, the deciding constraint is which resource is scarce, and on an FPGA it is almost never LUTs.** The fold's saving is denominated in AND gates and heap bits, both of which are real cell counts on an ASIC and neither of which is a billable unit on an FPGA — a LUT absorbs an AND gate into the compression it was already performing, and a DSP block is indivisible, so applying (14.1) *inside* a hard multiplier saves nothing at all. When DSPs are the binding resource the symmetry has to be re-applied one level up, between subwords instead of bits, which is exactly [[High-Radix Squarer]]: $4\to 3$ blocks for a two-way split and $9\to 6$ for a three-way, at no arithmetic overhead (p. 445). Take [[DSP-Cascade Squarer]] over it only under a specific conjunction — the design already depends on the DSP cascade, and $X$ fits in 33 bits so that $X_1$ has the spare bit for its pre-shift (p. 446). That covers the important 32-bit integer case and nothing wider, and outside it the plain high-radix split is strictly the simpler thing. Above roughly the width where hand-tiling stops being tractable, stop choosing at all and let [[Squarer Tiling]] choose: its ILP is what places [[Squarer Staircase Tile]] along the diagonal and decides whether a [[Diagonal-Straddling Squarer Tile]] is worth the recompute-and-subtract of its double-covered square. Neither of those two tiles is ever selected by hand; they are vocabulary for the solver. The canonical result — a 53-bit significand square in **4 DSP blocks** (p. 449) — is irregular enough that no inspection reaches it.

**Accuracy is orthogonal to all of the above, and it is the largest single lever in the table.** [[Truncated Squarer]] is not an alternative architecture but a cut applied to whichever heap the paragraphs above produced, and the chapter is explicit that nothing about it is squarer-specific: the machinery of Sect. 7.2.4 applies verbatim, and the same cut works on a heap built from heterogeneous tiles (p. 447). What *is* squarer-specific is the rate of exchange. Each squarer column is half the height of the multiplier column at the same position, so each dropped column costs half the error, and since column weights grow geometrically that buys exactly **one more column** of truncation for the same faithfulness budget (p. 447). Truncate the moment the application tolerates $<1$ ulp — the discarded columns are the low, short ones, so the saving is in heap bits and the final carry-propagate adder rather than in tree depth, and the peak column height is untouched. Correct rounding is the thing that forecloses it, because deciding the last bit requires the exact tail; if the specification says correctly rounded, every row of this table reverts to its exact form.

**For $p>2$ the recursion wins and the direct expansion does not.** [[Cube Bit Heap]] fails for a reason worth internalising: the fold absorbed a factor of 2 into a bit's weight for free, but the multinomial coefficient 3 in eq. (14.8) does not fold — $3x = 2x+x$ merely replicates the bit at two adjacent weights — so the heap grows as the cube of the input width and the book's own verdict is that the formulation "is not very interesting" (p. 450). Reach for it only when the result is heavily truncated, and even then the saving is entirely application-dependent on how many cube bits are consumed downstream. Otherwise use [[Square-and-Multiply Power Chain]], whose operator count is logarithmic in $p$ — $\lfloor\log_2 p\rfloor$ squarings plus $\nu(p)-1$ multiplications, five and one for $p=34$ (p. 450). Its trap is that the *count* is logarithmic while the *widths* are exponential in the depth, since an exact squarer doubles its width at every stage. [[Faithful Fixed-Point Power]] removes that trap wholesale for $|X|<1$ by clamping every intermediate to the output width plus one guard bit per operation (p. 451), which is not merely cheaper but qualitatively different: constant width makes every stage the *same* circuit, so one physical truncated squarer can be time-multiplexed over the chain and the area stops depending on $p$ at all. Choose the exact chain only when the exact value is genuinely required, which for a fixed-point $X^p$ that is truncated downstream anyway is almost never.

**RTL (Spade).** None. This note instantiates nothing; the synthesizable content lives in the sibling notes.

**Related notes.**

- [[Folded Array Squarer]] – depends-on: the fold every other row modifies, halving AND-gate count and heap by merging the symmetric triangle onto one and turning the diagonal into free wires.
- [[High-Radix Squarer]] – extends: the same symmetry re-applied between $k$-bit subwords, which is what converts the saving from heap bits into DSP blocks.
- [[DSP-Cascade Squarer]] – extends: the two-way split rewritten so every shift is a multiple of 17, at the price of one pre-shift and a 33-bit cap on $X$.
- [[Booth-Recoded Squarer]] – counter-example: the one variant in the table that is well-motivated and still loses, because the fold already spent the redundancy Booth wanted.
- [[Truncated Squarer]] – compares: orthogonal to every architecture row, and the largest lever here — one free extra column over a multiplier at the same ulp budget.
- [[Squarer Tiling]] – extends: the ILP that supersedes hand-selection above the widths where a human can still see the cover.
- [[Squarer Staircase Tile]] – supports: the diagonal-hugging tile the solver reaches for, at $1.43$ PP/LUT the best LUT tile in the book.
- [[Diagonal-Straddling Squarer Tile]] – supports: the tile that deliberately double-covers, worth its recompute-and-subtract only when a DSP is doing the covering.
- [[Cube Bit Heap]] – counter-example: what happens when the coefficient will not fold, and why $p>2$ leaves the direct expansion behind.
- [[Square-and-Multiply Power Chain]] – extends: logarithmic operator count for general $p$, with exponentially growing widths as the catch.
- [[Faithful Fixed-Point Power]] – extends: the same chain with widths clamped, which is what makes a general power operator affordable.
- [[Squarers and Integer Powers]] – depends-on: the topic hub these eleven circuits partition.
- [[Multipliers]] – compares: the baseline row, and the operator every saving in this table is measured against.
- [[Error Accuracy]] – depends-on: the faithfulness criterion the accuracy column is denominated in.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chap. 14, *Fixed-Point Squares, Cubes, and Other Integer Powers*:

- §14.1 *Generalities* — output formats and the parity of $p$; tabulation for 8 bits and below, pp. 443–444.
- §14.2.1 *Basics* — "roughly half" the bit complexity, eq. (14.1), Fig. 14.1 (tile view of a 12-bit square, p. 444) and Fig. 14.2 (exact 12-bit heap, p. 445).
- §14.2.2 *High-Radix Square* — eqs. (14.2)–(14.4); DSP counts $4\to3$ and $9\to6$; AMD's 17-bit cascade shift and the powers $0,18,34$; the 33-bit limit; Stratix V's 18- and 27-bit shifts, pp. 445–446.
- §14.2.3 *Booth Recoding* — eqs. (14.5)–(14.6), the $3/4$ factor, the verdict "probably less efficient", p. 446.
- §14.2.4 *Truncated Squarers* — Fig. 14.3, $\ell_{\mathrm{ext}}=\ell-3$ and $t=3$ with 3 constant ones, the one-extra-column rule of thumb, pp. 446–447.
- §14.2.5 *Squarer-Specific Tiling for FPGAs* — tiles M0, M1, S1 and T1 (Fig. 14.4, p. 448); T1's 15 partial products in 10 LUT5 = 5 LUT6 at efficiency $\approx1.43$ against Table 8.3, p. 229; the 53-bit squarer in 4 DSPs (Fig. 14.5, p. 449); the ILP extension and FloPoCo's `method=optimal`, p. 449.
- §14.3.1 *Direct Algebraic Expression* — eqs. (14.7)–(14.8), the non-folding factor 3, cubic heap growth, pp. 449–450.
- §14.3.2 *Computing Powers by Squaring and Multiplying* — eqs. (14.9)–(14.10), the $\lfloor\log_2 p\rfloor + (\nu(p)-1)$ operator count, doubling widths, p. 450.
- §14.3.3 *Approximate Fixed-Point Powers* — one guard bit per operation, and the explicit absence of an error analysis, p. 451.
- Cited works: [BKD22] Böttcher, Kumm & de Dinechin, *Resource Optimal Squarers for FPGAs*, FPL 2022; [Gar+10] Garofalo et al., *A novel truncated squarer with linear compensation function*, ISCAS 2010; [PBM01] Piñeiro, Bruguera & Muller, *Faithful Powering Computation Using Table Look-Up and a Fused Accumulation Tree*, ARITH 2001.
