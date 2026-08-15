---
title: Choosing a Comparator
description: "Trade-off table across the 7 Comparators circuits, with the source's own numbers — and the two crossover widths that decide every choice."
kind: comparison
source: "ASA Ch. 6, pp. 145-150"
status: seed
spade: n/a
tags: [digital, comparators, comparison, fpga, tradeoff]
aliases:
  - Comparator Trade-offs
  - Comparator Selection
  - Which Comparator
---

# Choosing a Comparator

Every comparator in this folder computes an exact predicate at $0$ ulp, so the choice is never about accuracy — it is decided by which predicate you asked for, by $w$, and by whether the fabric hands you a dedicated carry chain.

| Variant | FPGA area | Gate-level area (ASIC) | Depth / latency | Printed page |
| --- | --- | --- | --- | --- |
| [[Equality Comparator]] | $\lceil w/3\rceil$ LUT6, chained (3 bits of $X$ vs 3 of $Y$ each) | $w$ XNOR2 $+\ (w{-}1)$ AND2 † | $1+\lceil\log_2 w\rceil$ gates †; as a chain, best latency to 64 bits | 148; gates † |
| [[Magnitude Comparator]] | $w$ LUTs — the naive "subtract and keep the carry-out" | $w-1$ $\circ$-nodes on the pruned leftmost path † | $\lceil\log_2 w\rceil$ as a prefix tree, $w$ as a ripple † | 148; depth † |
| [[Two's-Complement Comparator]] | $+0$ | $+0$ — two wires cross | $+0$ | 146 |
| [[Binary Tree Comparator]] | — (see below) | $3(w{-}1)$ 2-input gates $+\ 2w$ leaf gates, or $0$ leaves with the redundant code † | $\lceil\log_2 w\rceil$ nodes $=2\lceil\log_2 w\rceil$ gate delays † | 147; counts † |
| [[Fast Carry Chain Comparator]] | $\lceil w/2\rceil$ LUT4 for $X<Y$; $\lceil w/3\rceil$ LUT6 for $X=Y$ | — | one chain of $\lceil w/2\rceil$; **best possible latency for sizes up to 64 bits** | 148 |
| [[Two-Level Fast Carry Comparator]] | $\approx w/2$ (level 1 compare) $+\ \approx w/3$ (chunk equality) $+\ \approx\sqrt{w}/2$ (level 2) $\approx 0.83w$ † | — | two chains, $D\approx\sqrt{w}$ at $k\approx k'\approx\sqrt{w}$; **very low latency at several thousand bits** | 149; the sum † |
| [[Constant Comparator]] | $\lceil w/\alpha\rceil$ LUT-$\alpha$; FloPoCo splits $w=64$ into **13 chunks of 5 bits** | leaves collapse to wires and inverters | $\lceil w/\alpha\rceil$ chain stages | 149 |

† derived by counting from the recurrence, not quoted — the chapter states no gate counts.

**Everything the table does not have.** Chapter 6 contains **no synthesis results at all**: no slice or FF counts, no nanosecond delays, no device-by-device figures, no LUT/FF ratios. DSP blocks are never mentioned, because comparison has no multiplication in it. Cycle counts are $0$ for all seven by construction — every circuit here is purely combinational and the chapter never pipelines one, so a cycle count would be a property of your pipelining, not of the operator. The two genuinely quantitative claims in the chapter are the crossover statements set in bold above, and both are stated as prose, without a supporting measurement.

> [!warning] The two crossovers carry the whole comparison and neither is measured
> "Best possible latency for sizes up to 64 bits" (p. 148) and "very low latency for sizes of several thousand bits" (p. 149) are the only width thresholds in the chapter, and both are asserted rather than plotted. Every recommendation below inherits that uncertainty; on a device or a synthesis flow other than the one the authors had in mind, re-measure before believing 64.

**Start from the predicate, not the structure.** Equality is a different problem, not a cheaper version of ordering. Its combining operator is $\wedge$ on single bits — commutative as well as associative — so it is a *reduction* with one bit per edge and no carry to propagate, and it is the only predicate in this folder that gets cheaper when you ask for less: $\lceil w/3\rceil$ LUT6 against $\lceil w/2\rceil$ for $X<Y$ (p. 148). Ordering has no such collapse. Every node of an ordering tree except the root must still separate $<$, $=$ and $>$, which is three cases and therefore two bits (p. 147), so $X<Y$ costs the same whether or not you also want $X=Y$ and $X>Y$ — negate the output for $X\ge Y$, swap the operands for $X>Y$, at no cost. Ask for all three; you have already paid for them.

**On FPGA, area is decided before latency, and one answer wins outright.** Pick the fast carry chain comparator and stop. It is the area optimum at every practical width, it is what synthesis already emits from `x < y`, and to 64 bits it is simultaneously the latency optimum — a $\lceil w/2\rceil$-stage ripple on the dedicated path beats a $\lceil\log_2 w\rceil$-deep tree because every edge of that tree crosses general routing, and one routing hop costs many carry stages. This is why the binary tree comparator's FPGA column is "—": there is no width at which you would build it. The two-level tree is the only structure that ever displaces the plain chain, and it does so purely on latency at several thousand bits, paying $\approx 0.83w$ LUTs against $w/2$ for the privilege — it pays that one routing hop *once* instead of $\log_2 w$ times, which is exactly why two levels are affordable and a full tree is not. If $w$ is in the hundreds and you are not latency-bound, the two-level version buys nothing and costs a third more area.

**On ASIC the ranking inverts, because the dedicated chain was the entire argument.** With no hardened carry path, a 2-bit edge is just two wires and the binary tree comparator is simply correct: $\lceil\log_2 w\rceil$ node levels, $O(w)$ area, no crossover to worry about. The magnitude comparator is the same structure reached from the other direction — it is the leftmost path of a prefix adder on $X+\overline{Y}+1$ with every sum bit and every intermediate carry pruned away, which is a constant-factor saving over instantiating an adder, not an asymptotic one. Both land on the same $\lceil\log_2 w\rceil$-deep reduction of $w-1$ $\circ$-nodes; the tree note is the mental model and the magnitude note is the derivation, and neither is an FPGA answer.

**Two properties of the operands override all of the above.** If one operand is a compile-time constant — a threshold, an exponent bound, a comparison against zero — use the constant comparator unconditionally: freezing $Y$ deletes every leaf, so a LUT-$\alpha$ that had to spend half its inputs on $Y$ now sees $\alpha$ bits of $X$, and chunk width, LUT count and chain depth all improve by the same factor of two. That includes an operand that only *looks* variable: aligning two fixed-point formats is zero-padding, and the padded bits are constant, so the optimisation feeds on format conversion. The catch is availability — AMD tools do not implement it (p. 149), so you generate it yourself or you do not get it. If the operands are signed, apply the two's-complement fix-up first and then choose from this table as if they were unsigned; the fix-up is a crossing of the two MSB wires and costs nothing, but omitting it silently inverts the verdict for operands of opposite sign.

**Related Notes**

- [[Equality Comparator]] – compares: the only predicate here that gets cheaper when you ask for less, $\lceil w/3\rceil$ LUT6 against $\lceil w/2\rceil$ for ordering.
- [[Magnitude Comparator]] – compares: $X<Y$ as the negated carry-out of $X+\overline{Y}+1$, the baseline every FPGA variant below optimises.
- [[Two's-Complement Comparator]] – depends-on: the free MSB exchange you apply *before* picking any row of the table.
- [[Binary Tree Comparator]] – compares: the log-depth ASIC answer and the $(G,E)$ recurrence the two FPGA constructions are re-groupings of.
- [[Fast Carry Chain Comparator]] – compares: the default pick — area optimum at every practical $w$, latency optimum to 64 bits.
- [[Two-Level Fast Carry Comparator]] – counter-example: the one structure that beats the plain chain on latency, and only past several thousand bits, at strictly worse area.
- [[Constant Comparator]] – extends: a frozen $Y$ halves both area and depth of whichever variant you chose, if your tools will build it.
- [[Comparators]] – supports: the topic note these seven are cut from, with the full derivations.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6 "Fixed-Point Comparison", pp. 145–150.
  - Sect. 6.1.1 Fixed-Point Considerations (format alignment, MSB exchange), p. 146
  - Sect. 6.2 Basic Binary Tree Comparison and Table 6.1 (the $<$/$=$/$>$ asymmetry), p. 147
  - Sect. 6.3.1 Exploiting Fast Carry Logic and Table 6.2 ($w/2$ and $w/3$ LUTs, the 64-bit latency claim), p. 148
  - Sect. 6.3.2 Two-Level Tree of Fast Carry Logic ($k\approx k'\approx\sqrt{w}$; $w/2 + w/3 + \sqrt{w}/2$; "several thousand bits"), pp. 148–149
  - Sect. 6.3.3 Comparing to a Constant (LUT-$\alpha$ packing; 13 chunks of 5 bits at $w=64$; the AMD tooling gap), p. 149
- [PZC10] Perri, Zicari, Corsonello, "Efficient Absolute Difference Circuits in Virtex-5 FPGAs", *Melecon* 2010, pp. 309–313 — source of the $w/2$-LUT construction, cited p. 148.
