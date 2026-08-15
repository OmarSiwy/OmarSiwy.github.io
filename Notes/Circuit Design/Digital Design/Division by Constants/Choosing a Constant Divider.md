---
title: Choosing a Constant Divider
description: "Trade-off table across the 8 Division by Constants circuits, with the source's own numbers."
kind: comparison
source: "ASA Ch. 13, Tables 13.2–13.5, pp. 434-441"
status: seed
spade: n/a
tags: [digital, division-by-constants, comparison]
aliases:
  - Constant Divider Comparison
  - Constant Division Trade-offs
  - Which Constant Divider
---

# Choosing a Constant Divider

Every architecture in this topic computes the same exact Euclidean pair $X = DQ + R$, $0 \le R < D$, so **accuracy never enters the decision** — the axes are area, latency, throughput, the magnitude of $D$, and which half of the pair you actually need.

All measured figures below are Xilinx Kintex-7 syntheses reported by the book. Areas are LUT counts, delays are post-place-and-route nanoseconds, and every row is combinational (hence pipelinable to one result per cycle) except the sequential one.

| Architecture | $D{=}3$, $w{=}32$ | $D{=}3$, $w{=}128$ | larger $D$, $w{=}32$ | logic depth | growth in $w$ | remainder | p. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [[Recip Constant Divider]] | 138 LUT / 6.0 ns | 824 LUT / 13.3 ns | $D{=}9$: 184 LUT / 6.2 ns · $D{=}15$: 97 / 6.2 · $D{=}45$: 207 / 8.0 | one $w\times w$ constant multiplication | area $O(w^2)$, delay $O(\log w)$ | $r$-bit subtract; 139 LUT / 6.1 ns without it | 429, 436, 440 |
| [[Sequential Constant Divider]] | 6 LUT6 core loop, 8 cycles | 6 LUT6 core loop, 32 cycles | — | 1 lookup per cycle | tables $O(1)$; latency $m=\lceil w/k\rceil$ cycles | free — it *is* the state register | 432, 434 |
| [[LinArch Divider]] | 32 LUT / 6.0 ns (est. 48) | 128 LUT / 26.3 ns | $D{=}9$: 87 / 17.9 · $D{=}17$: 165 / 18.5 · $D{=}45$: 371 / 24.3 | $m=\lceil w/k\rceil$ lookups | area and delay both $\Theta(w)$ | free ($R_0$ is the last stage's output) | 435, 437, 440 |
| [[Remainder-Only LinArch]] | 11 LUT / 6.5 ns | 43 LUT / 27.2 ns | $D{=}5$: 30 LUT / 9.8 ns | $m$ lookups, unchanged | area $\times\,r/(r{+}k)$; delay unchanged | only output | 436-437 |
| [[Binary Tree Constant Divider]] | 95 LUT / 4.8 ns | 517 LUT / 8.4 ns | $D{=}9$: 218 / 6.1 · $D{=}15$: 199 / 5.8 | $\lceil\log_2 m\rceil{+}1$ lookups | area $\Theta(w\log w)$, delay $\Theta(\log w)$ | free | 434, 437, 440 |
| [[Remainder-Only BTCD]] | 12 LUT / 3.8 ns | 50 LUT / 5.3 ns | $D{=}5$: 29 LUT / 3.7 ns | tree depth, no quotient assembly | area $\Theta(w)$, delay $\Theta(\log w)$ | only output | 436-437 |
| [[Composite Constant Divider]] | — ($D$ prime) | — | $9{=}3{\times}3$: 65 / 7.0 · $15{=}3{\times}5$: 75 / 9.4 · $45{=}5{\times}3{\times}3$: 108 / 10.0 | $\max(m_a,m_b){+}1$ lookups | linear, smaller constant | one small multiply-add $D_aR_b{+}R_a$ | 439-440 |
| [[Constant Division Digit Table]] | 6 LUT6 (6-in, 6-out, $D\cdot2^k{=}48$ entries) | identical — independent of $w$ | — | 1 lookup | constant in $w$ | one of its two output fields | 433-434 |

**What the "—" entries mean.** The chapter measures only LinArch, BTCD, Recip and composites of them; the sequential form and the bare digit table get one paragraph, one figure and the asymptotic $2^{r+k}(r+k)$, with the 6-LUT6 core loop for $D=3,k=4,\alpha=6$ (p. 434) as their only published cost. Composite has no $D=3$ column because 3 does not factor, and no measurement at any $w$ other than 32. **No DSP-block count appears anywhere in Chapter 13** — every architecture here is LUT-and-wire, and even Recip's constant multiplication is mapped to fabric rather than to a hard multiplier in the reported results. Cycle counts are 1 for every row but the sequential one.

> [!warning] Do not quote individual Recip figures without deciding which column is which
> Table 13.3 (p. 436) captions `Recip/R` as the quotient-only architecture of [DCC12], yet `Recip/R` is 1–12 LUT *larger* than the plain `Recip` column in all ten of its rows ($D{=}23$, $w{=}32$: 169 LUT / 7.3 ns against 158 / 5.8). The 138 LUT / 6.0 ns in the table above is the `Recip` column; under either reading of the labels the remainder overhead is one LUT and 0.1 ns, which is the claim the text makes, but the column identity is unresolved in the source.

**The magnitude of $D$ decides before anything else, because it is the only parameter that changes the asymptotic class.** A table-based stage costs $2^{\max(r+k-\alpha,0)}(r+k)$ LUT$\alpha$ with $r$ the bit width of $D-1$, so as long as $r<\alpha$ — $D<64$ on a 6-LUT fabric — the exponential term is 1 and the whole divider is $\lceil w/(\alpha-r)\rceil\alpha$ LUTs. Cross that threshold and $k$ collapses to 1, one lookup per input *bit*, and the cost explodes: $D=17$ costs 165 LUT / 18.5 ns and $D=45$ costs 371 LUT / 24.3 ns where $D=3$ costs 32 LUT / 6.0 ns at the same width. So the first question is not which architecture but whether $D$ factors. If it does, **factor it** — the composite of $45=5\times3\times3$ is 108 LUT / 10.0 ns against the atomic LinArch's 371 / 24.3, three and a half times smaller and two and a half times faster, and every measured factorable constant behaves the same way. If $D$ is large *and* prime, or is a runtime-selected constant from a small set, Recip is the only option left, because it is the only architecture whose cost ignores $D$'s magnitude: doubling $D$ adds one bit to $p$ and nothing else. That is why Recip loses 138-to-32 at $D=3$ and wins 207-to-371 at $D=45$.

**Once $D$ is small enough, the choice is a straight area-against-latency exchange, and the exchange rate is roughly eight to one.** LinArch and BTCD compute the same digit recurrence; BTCD reassociates it into a tree exactly as a [[Kogge-Stone Tree]] reassociates a carry chain. At $D=3$, $w=32$ that buys 4.8 ns instead of 6.0 ns for 95 LUT instead of 32 — a poor trade. At $w=128$ the same pair is 8.4 ns against 26.3 ns for 517 LUT against 128, which is the trade the tree exists for: the delay gap grows without bound because one side is linear in $w$ and the other logarithmic, while the area gap stays a constant factor. Pick LinArch below roughly $w=32$ and whenever area is the binding constraint; pick BTCD above $w=64$ when the divider sits on the critical path. Recip is the third corner and is competitive on delay at every width — 6.0 ns at $w=32$, 13.3 ns at $w=128$ — but pays $O(w^2)$ area for it, so it wins the latency argument only where BTCD has already been ruled out by $2r>\alpha$. Note that composite and BTCD are not ordered: at $D=15$, $w=32$, composite $3\times5$ is 75 LUT / 9.4 ns and atomic BTCD is 199 LUT / 5.8 ns — 2.7$\times$ the area for 1.6$\times$ the speed, two different corners rather than one dominating the other.

**Which half of the Euclidean pair you need is an architectural decision, not a late optimisation, and it reverses the previous paragraph's answer.** Dropping the quotient from LinArch cuts $k$ of each table's $k+r$ output columns — 32 LUT to 11 at $D=3$, $w=32$, close to the predicted $r/(r+k)=1/3$ — but leaves the delay untouched at 6.5 ns, because the critical path is the remainder chain you kept in full. Dropping it from BTCD deletes the quotient-assembly network outright, and both area *and* delay improve: 95 LUT / 4.8 ns becomes 12 LUT / 3.8 ns, and the area class falls from $\Theta(w\log w)$ to $\Theta(w)$. The consequence is unambiguous: at $D=5$, $w=32$ the two remainder-only forms are 30 LUT / 9.8 ns and 29 LUT / 3.7 ns — identical area, logarithmic delay instead of linear — so **if you need only $X \bmod D$, use BTCD at every width above about 16**. Going the other way is expensive: recovering $Q$ from $R$ afterwards costs a full $w\times w$ constant multiplication, the very thing the table-based route was chosen to avoid. Throughput is the orthogonal axis. All the combinational rows pipeline by cutting between stages to one division per cycle; the sequential form deliberately does not, folding the recurrence onto one table and an $r$-bit register for a footprint that is constant in $w$ — 6 LUT6 divides a 128-bit integer by 3 in 32 cycles — at one operand in flight and a loop-carried dependency no retiming can shorten.

**FPGA and ASIC do not rank these the same way, and the whole table above is an FPGA ranking.** The step function $2^{\max(r+k-\alpha,0)}$ is a fabric artefact: a LUT$\alpha$ costs the same whether you drive two address lines or $\alpha$, so on FPGA there is a *free* region below $\alpha$ inputs and a cliff above it, which is what pins $k=\alpha-r$ and what makes $D<2^\alpha$ the hard boundary. In ASIC the cost is smooth — table area proportional to bits held, $2^{r+k}(r+k)$, delay proportional to address width $(r+k)$ — so $k$ is a continuous knob traded against a delay target and the cliff at $r=\alpha$ dissolves into a gradient. Two practical consequences. First, the ASIC crossover between LinArch and Recip sits at a different $D$ than the FPGA one, and none of the numbers above locate it. Second, the don't-care argument that removes $D$ from the model — rounding $D\cdot2^k$ entries up to $2^{r+k}$ and letting synthesis absorb the surplus — is what makes $D=5$ and $D=7$ synthesise to *identical* 45 LUT / 9.3 ns, and $D=9$ and $D=11$ to identical 87 / 17.9 (Table 13.2, p. 435); that argument holds on both targets, so **only $r$ matters, never $D$ itself.** Read the predicted-area columns of Tables 13.2 and 13.5 as a ranking tool and not a budget: synthesis beats the model by 10–30% by exploiting exactly those don't-cares, and it beats it more for two small tables than for one large one, which is why composite $3\times3$ measures 65 LUT against a predicted dead heat of 96.

## Related Notes

- [[Recip Constant Divider]] – compares: exact $\lfloor X/D\rfloor$ as $\lfloor (AX+B)/2^p\rfloor$, the only route whose cost ignores the magnitude of $D$, at $O(w^2)$ area and $O(\log w)$ delay.
- [[Constant Division Digit Table]] – depends-on: the $(k{+}r)$-in, $(k{+}r)$-out table with $D\cdot2^k$ useful entries that is the loop body of every table-based row above.
- [[Sequential Constant Divider]] – compares: that one table plus a remainder register clocked $m=\lceil w/k\rceil$ times, for a footprint constant in $w$ at one operand in flight.
- [[LinArch Divider]] – compares: the same recurrence unrolled into $m$ chained tables, no adder anywhere on the datapath, area and delay both linear in $w$.
- [[Remainder-Only LinArch]] – extends: $X \bmod D$ by dropping the quotient columns, area down by $r/(r+k)$ and delay untouched because the remainder chain is the critical path.
- [[Binary Tree Constant Divider]] – extends: the same exact division restructured chain-to-tree for $O(\log w)$ latency at $\Theta(w\log w)$ area.
- [[Remainder-Only BTCD]] – extends: the residue tree with the quotient network deleted, improving area and delay together and winning the remainder-only case outright.
- [[Composite Constant Divider]] – extends: $D=D_aD_b$ as two chained dividers plus a multiply-add for $R=D_aR_b+R_a$, turning one table exponential in $r_a+r_b$ into two exponential in $r_a$ and $r_b$ separately.
- [[Division by Constants]] – depends-on: the zero-ulp specification and the notation $w,k,r,m,\alpha$ every row is quoted in.
- [[Dividers]] – counter-example: the general $O(w^2)$ dividers all of these beat by knowing $D$ at synthesis time.
- [[FPGAs]] – supports: the LUT$\alpha$ cost step that makes this an FPGA ranking rather than a technology-independent one.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13:

- §13.1 Multiplying by the reciprocal; the $O(w^2)$ area / $O(\log w)$ delay estimate — pp. 428-429
- §13.2.3-13.2.4 Iterative versus unrolled; $A_{\text{seq}}\sim2^{r+k}(r+k)$, $A_{\text{LinArch}}\sim\lceil w/k\rceil2^{r+k}(r+k)$, $T\sim\lceil w/k\rceil(r+k)$ — pp. 432-433
- §13.2.5 FPGA-specific remarks; the $2^{\max(r+k-\alpha,0)}(r+k)$ LUT$\alpha$ model and the 6-LUT6 core loop for $D=3$, $k=4$ — p. 434
- Table 13.2, LinArch dividers of a 32-bit value by $D$, Kintex-7 — p. 435
- §13.3 Parallel division; BTCD latency $\log w$, area $w\log w$ — p. 434
- §13.4.1 and Table 13.3, the overhead of computing the remainder in Recip — pp. 435-436
- §13.4.2 and Table 13.4, remainder-only (R) against Euclidean (Q+R) for LinArch and BTCD, $D\in\{3,5\}$, $w\in\{8,\dots,128\}$ — pp. 436-437
- §13.5.3 and Table 13.5, composite 32-bit dividers, $D\in\{9,15,45\}$ — pp. 439-440

> [!warning] Page offset in this chapter is +16, not +22
> The vault rule "PDF page = printed page + 22" holds early in the book but not here: PDF 451 renders printed 435 and PDF 453 renders printed 437. Every page cited above was read at offset +16 and carries the printed number claimed.
