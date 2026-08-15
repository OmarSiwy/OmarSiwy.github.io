---
title: Choosing a CORDIC Architecture
description: "Trade-off table across the ten fixed-point sin/cos circuits, with the chapter's own cost formulas and its one measured comparison — and an explicit list of what it never measures."
kind: comparison
source: "ASA §20.3-20.7, pp. 605-621"
status: seed
spade: n/a
tags: [digital, cordic, comparison, sine, fpga, dsp]
aliases:
  - Choosing a Sine/Cosine Architecture
  - CORDIC Architecture Comparison
  - Fixed-Point Sine and Cosine Comparison
  - Sine and Cosine Trade-offs
---

# Choosing a CORDIC Architecture

Ten circuits, one specification — $(C,S)\approx(\cos\pi X,\sin\pi X)$ in $\mathrm{sfix}(0,\ell)$, last-bit accurate — and the choice between them is decided almost entirely by which part of the chip is already full.

**Two of the ten are not choices.** [[Octant Argument Reduction]] and [[Sine-Cosine Octant Reconstruction]] are the front and back ends of every architecture below, and no variant computes on the full circle. Only the quadrant-reduced [[Generic Polynomial Sine Evaluator]] deviates, and only in that it stops at $Y'\in[0,\tfrac12)$ and drops the octant bit $o$. Everything that follows is about the *kernel* sandwiched between them.

| Circuit | Logic | DSP / BRAM | Depth per result | Guard bits | Printed p. |
| --- | --- | --- | --- | --- | --- |
| [[Octant Argument Reduction]] | one XOR row across the $-\ell-2$-bit $Y$ field; the $+1$ of $-x=\bar x+1$ is dropped, which "saves one carry propagation" | none | one gate level; no carry chain | $+1$ ulp per negation, which "usually does not even change the value of $g$" | 605, 613 |
| [[Sine-Cosine Octant Reconstruction]] | mux pair $+$ XOR row, no adder | none | one mux-and-XOR level | $1$ ulp per complement, one line item in the 15-ulp count | 606, 617, 619 |
| [[CORDIC Rotation Mode]] | 3 adders, 2 shifts, 1 control bit per iteration | none | 1 carry-propagate add per iteration; $n=-\ell+2$ iterations | $g=2+\lfloor\log_2\bar\delta_\text{round}\rfloor$ (20.42) | 607-610, 613 |
| [[Unrolled CORDIC]] | $\approx2.5(-\ell+g)^2$ LUTs, one LUT per bit on the fast carry logic | 0 DSP, 0 BRAM | $n=-\ell+2$ *dependent* CPAs; $2\times$ slower than table-and-multiplier at 16 bits, $3\times$ at 32 bits in logic delay [DIS13] | as above, so $g$ grows with $-\ell$ | 610, 613, 621 |
| [[Reduced-Z CORDIC Datapath]] | stage $i$'s $Z$ adder is $-\ell+g-i+1$ bits: "almost divides by 2" the $Z$ datapath, "reducing the total area by about 1/6th" | none | shortens the $Z_i\to d_i\to Z_{i+1}$ path in early iterations, less in later ones | unchanged | 613 |
| [[Iterative CORDIC]] | 3 adders $+$ 2 barrel shifters $+$ an $\arctan$ ROM; the shifters and table "consume more logic than the three adders"; total "much lower resources"; reduced-$Z$ "no longer possible" | none | $n=-\ell+2$ **cycles**, unpipelined | as unrolled | 621 |
| [[Reduced-Iteration CORDIC]] | chain cut at $i=\lfloor-\ell/2\rfloor+1$; truncating $C_i,S_i$ to the width of $\pi Z_i$ "saves almost half the hardware" of the products for one ulp | 2 multipliers "of size slightly larger than $-\ell/2$ bits" $+$ one $\times\pi$ `FixRealCM` at 1 ulp; signed 18-bit FPGA multipliers cover $\ell$ up to $-24$ | $\lfloor-\ell/2\rfloor+1$ stages $+$ one multiplier | as unrolled, $+1$ ulp truncation, $+1$ ulp for $\times\pi$, $+$ Taylor $\tfrac{Z_i^2}{2}<2^{\ell-3}$ | 614 |
| [[Table-and-Multiplier Sine and Cosine]] | "very comparable resources" to unrolled CORDIC with everything forced into logic [DIS13]; 2 tables addressed by $\alpha>-\tfrac{\ell}{4}-1$ bits, 4 truncated multipliers | 2 tables in BRAM $+$ 4 multipliers in DSP, logic, or a mix | 3 levels — table, multiplier, bit heap; $2$–$3\times$ faster than CORDIC | up to 15 ulps lost $\Rightarrow$ $g=4$, **independent of $\ell$** | 616, 618, 619, 621 |
| [[Small-Angle Taylor Sine and Cosine]] | kernel of the row above: every coefficient a power of two or $2^k/3$; $\tfrac{Z^2}{2}$ has MSB $-2\alpha-1$, $\tfrac{Z^3}{6}$ has MSB $-3\alpha-2$ | tabulating $\tfrac{Z^2}{2},\tfrac{Z^3}{6}$ costs half an ulp each; a truncated squarer costs a full ulp | inside the 3 levels above | contributes to the same $g=4$; remainders $\tfrac{Z^4}{24}<2^{-4\alpha-4}$, $\tfrac{Z^5}{120}<2^{-5\alpha-6}$ | 616, 618, 619 |
| [[Generic Polynomial Sine Evaluator]] | — | — | — | — | 620 |

**Where the table says "—", the book says nothing.** Chapter 20 publishes no synthesis table at all: not one LUT, slice, flip-flop, DSP or nanosecond figure for any of these ten circuits. Every entry above is either a cost *formula* the text states or a phrase quoted from it. §20.7 lists the generic polynomial evaluator with no cost whatsoever, deferring logic, memory, latency and guard bits alike to Chap. 18, which is why its row is empty rather than estimated. Iterative CORDIC gets one qualitative sentence on p. 621 and nothing more. The single measurement in the chapter is [DIS13], it is *relative* (factor 2 at 16 bits rising to factor 3 at 32 bits, in logic delay), and it compares only two of the ten with all tables and multipliers forced into FPGA logic. The sibling notes carry two further figures — $(7+2\lceil\log_2 n\rceil)(-\ell+g+1)$ LUTs for the folded operator, and $\approx1.4(-\ell+g)^2$ for the half-length chain — but those are derivations from the book's own one-LUT-per-bit convention, not published numbers, and they are labelled as such where they appear.

**Throughput per area on an FPGA decides for the tables, and it is not close.** Same resources, two to three times the speed, and a guard-bit count that stops growing — [[Table-and-Multiplier Sine and Cosine]] wins the default case, and the book's own verdict is that "an unrolled CORDIC makes little sense in this context" (p. 621). The reason is structural rather than technological: CORDIC threads its rounding errors through $-\ell+2$ dependent stages so they compound (20.39) and $g$ grows like $\log_2$ of the precision, while the table architecture sums a fixed, bounded number of independent error terms once and lands on $g=4$ at every size. The deeper the operator, the worse CORDIC's position gets on *both* axes at once. Pick [[Unrolled CORDIC]] only when the DSP columns and block memories are genuinely absent or already saturated by the rest of the design — "no multiplier anywhere" is its entire argument, and on a modern FPGA that argument has to be earned rather than assumed.

**Area, not speed, is the only constraint that reverses the ranking.** [[Iterative CORDIC]] folds the $n$ stages onto one, so it is the only entry here whose area is linear rather than quadratic in the datapath width — and it pays twice for that, in the two barrel shifters and $\arctan$ ROM that a runtime $i$ forces into existence, and in losing [[Reduced-Z CORDIC Datapath]] entirely, since one folded adder must be sized for $i=1$. Take it when the throughput requirement is below one result per $n$ cycles, at which point every unrolled architecture is hardware idle $(n-1)/n$ of the time and no arithmetic cleverness recovers that. There is no middle rung short of partial unrolling, which reintroduces a barrel shifter per fold.

**If latency is the binding constraint and the DSPs are free, cut the chain instead of folding it.** [[Reduced-Iteration CORDIC]] halves the dependent-addition chain — the exact quantity that makes CORDIC lose on delay — and replaces the removed half with two mutually independent multiplications, which is a much better shape for a pipeline than the linear chain it displaces. On an FPGA the two multipliers are free in the sense that matters: the DSP blocks were sitting idle while the LUTs burned. The ceiling is sharp, though. The $18\times18$ primitive covers $\ell$ only down to $-24$; below that the two DSPs become four or six, and the trade has to be recomputed. On an ASIC there is no idle hard multiplier, so the same decision turns into an honest area comparison against the stages removed.

**Accuracy and size push the choice off the table entirely at both extremes.** Below a few bits of $\ell$ the octant reduction alone eats three bits and the right answer is to tabulate $\sin\pi X$ outright; FloPoCo's ladder of five degenerate cases (p. 620) is what "computing just right" means at small sizes. At the other end, [[Small-Angle Taylor Sine and Cosine]] is a *kernel*, not an alternative — you do not choose it against CORDIC, you get it as a consequence of choosing the table architecture, and its only local decision is squarer versus table for $\tfrac{Z^2}{2}$ (a full ulp against half). [[Generic Polynomial Sine Evaluator]] sits outside the comparison for a different reason: it computes sine *or* cosine, one per instance, so a rotation or a quadrature pair needs two of everything. Pick it when you want one code path across many functions rather than a hand-tuned operator, and pay the doubling if you need the fused pair.

$$\boxed{\ \text{DSP/BRAM free}\Rightarrow\text{table-and-multiplier}\quad|\quad\text{throughput}<\tfrac1n\Rightarrow\text{iterative}\quad|\quad\text{logic-only}\Rightarrow\text{unrolled CORDIC}\ }$$

**When this whole comparison stops applying.** It is an FPGA verdict, and the book says so: "it is unclear how these results will translate to ASIC" (p. 621). Two of its supporting arguments point in opposite directions and neither transfers cleanly — fast carry logic and dense packing of the CORDIC iteration favour CORDIC, while tables and small multipliers also map efficiently into FPGA logic and favour the table architecture. Faster CORDIC variants built on [[Redundant Number Systems]] could close the delay gap at higher resource cost; the chapter names them as the reason redundant arithmetic was not studied here, and gives no numbers. And the ranking above assumes a *fused* $(\sin,\cos)$ pair at last-bit accuracy on a fully pipelined operator; relax any of those three and the table has to be rebuilt, because each row was costed under all of them.

**Related Notes.**

- [[Octant Argument Reduction]] – depends-on: the front end every row of the table assumes, and the reason the kernels only ever see $[0,\tfrac14)$.
- [[Sine-Cosine Octant Reconstruction]] – depends-on: the matching back end, a mux pair and two XOR rows charged one ulp each against $g$.
- [[CORDIC Rotation Mode]] – depends-on: the recurrence four of the rows implement, and where $n=-\ell+2$ comes from.
- [[Unrolled CORDIC]] – compares: the reference point for area, $\approx2.5(-\ell+g)^2$ LUTs with nothing else instantiated.
- [[Reduced-Z CORDIC Datapath]] – extends: the $1/6$ area cut that is included in that figure and is unavailable once the stages are folded.
- [[Iterative CORDIC]] – compares: the only row that is small rather than fast, and the only one costed in cycles.
- [[Reduced-Iteration CORDIC]] – compares: half the chain for two DSPs, the pick when latency binds and multipliers are idle.
- [[Table-and-Multiplier Sine and Cosine]] – compares: the default winner on FPGA, and the only architecture whose $g$ does not grow with $\ell$.
- [[Small-Angle Taylor Sine and Cosine]] – supports: the kernel inside that architecture, not a competitor to it.
- [[Generic Polynomial Sine Evaluator]] – counter-example: one function per instance, so it loses the fused-pair assumption the whole table rests on.
- [[Redundant Number Systems]] – extends: the unstudied way to close CORDIC's delay gap, at higher resource cost (p. 621).

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 20 "Fixed-Point Sine and Cosine", pp. 599-621.

- §20.3, pp. 605-606 — the shared octant reduction and reconstruction, Figs. 20.5-20.6.
- §20.4.3-20.4.4, pp. 609-613 — $n=-\ell+2$, the compounding recurrence (20.39), $g$ from (20.42), and the XOR-instead-of-carry shortcut with its one-ulp price, p. 613.
- §20.4.5, p. 613 — reduced $Z_i$ datapath: "almost divides by 2" the $Z$ cost, "about 1/6th" of total area, $\approx2.5(-\ell+g)^2$ LUTs, and the critical-path remark.
- §20.4.6, pp. 613-614 — (20.43), the stop index $\lfloor-\ell/2\rfloor+1$, "two multipliers, each of size slightly larger than $-\ell/2$ bits", the 18-bit-multiplier limit at $\ell=-24$.
- §20.5.1.1, p. 616 — the constraint $\alpha>-\ell/4-1$ (20.52). §20.5.2, Tables 20.2-20.3, p. 618 — internal formats. §20.5.4, p. 619 — the fifteen-ulp count and $g=4$. §20.5.5, p. 620 — the five small-size special cases.
- §20.6, p. 620 — the generic polynomial wrapper, quadrant-only reduction, the $\sin/\overline{\cos}$ input bit, and the absence of any cost figure.
- §20.7, pp. 620-621 — the [DIS13] comparison (comparable resources, factor 2 at 16 bits to factor 3 at 32 bits in logic delay), iterative versus unrolled throughput per area, and the open ASIC question.
- [DIS13] de Dinechin, Iştoan, Sergent, "Fixed-Point Trigonometric Functions on FPGAs", *SIGARCH Computer Architecture News* 41.5 (2013), pp. 83-88.
