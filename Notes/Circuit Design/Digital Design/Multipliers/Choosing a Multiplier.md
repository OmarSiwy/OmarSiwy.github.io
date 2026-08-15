---
title: Choosing a Multiplier
description: "One efficiency metric ranks all seventeen multiplier circuits — but it prices area only, so every latency decision has to be made outside the table."
kind: comparison
source: "ASA Ch. 8, pp. 203-257 (Tables 8.3-8.6, pp. 229, 239, 254)"
status: seed
spade: n/a
tags: [digital, multipliers, comparison, tiling, fpga, karatsuba, truncation]
aliases:
  - Choosing a Multiplier
  - Multiplier Comparison
  - Multiplier Trade-offs
  - Which Multiplier
---

# Choosing a Multiplier

Every multiplier in this topic is a different answer to one question — how much of the $w_X\times w_Y$ partial-product rectangle to build, and out of what — and the book prices all of them with the single metric $E_s=\mathrm{area}_s/\mathrm{cost}_s$, area being bits of rectangle covered.

**Read the table as three separate currencies.** $E^\mathrm{LUT}$ and $E^\mathrm{DSP}$ are not comparable to each other; each says "how much rectangle per unit of *this* resource". The recoding circuits (rows 1–4) change the *shape* of the heap and are priced in rows and gates, not in $E$ at all. Everything is AMD-specific: $\#\mathrm{LUT}^\mathrm{comp}=0.55$ LUT/bit is a fit for AMD fabrics (p. 229) and no Intel/Lattice equivalent is given, so no ranking below transfers without re-measurement.

| Circuit | Structure it produces | LUT cost (AMD) | DSP | Delay | Accuracy |
| --- | --- | --- | --- | --- | --- |
| [[Unsigned Array Multiplier]] | $w_Xw_Y$ AND gates, $w_X$ rows, $w_P=w_X+w_Y$ (p. 205) | as $1\times1$ tiles $1.55$ LUT/bit, $E^\mathrm{LUT}=0.65$ — worst in the library (p. 229) | 0 | $\mathcal{O}(\log w)$ with a compressor tree, $\mathcal{O}(w)$ array-fused (p. 214) | exact |
| [[Baugh-Wooley Multiplier]] | same $w^2$ gates, $2(w-1)$ of them NAND; all sign extension collapses to the constant $2^{2w-1}+2^{w}$ (p. 216) | unchanged from unsigned | 0 | unchanged — column height still $w$ (p. 216) | exact |
| [[Booth's Algorithm]] | $m=\lfloor w/2\rfloor+1$ rows; $m=w/2$ for signed $X$, $w$ even (pp. 218, 221) | 2 AND/bit become 1 OR + 1 XOR/bit, plus $m$ cpl/one/two recoders (p. 219) | 0 | recoding is constant-time; heap halved (p. 218) | exact |
| [[Bewick Radix-8 Multiplier]] | rows $\times\tfrac23$; heap row is $w_Y(1+1/k)$ bits, not $2w_Y$; $N_8/N_4=\tfrac23(1+\tfrac1k)<1\iff k\ge3$ (p. 222; §5.2.6 pp. 111–112) | $+\lceil w_Y/k\rceil$ heap bits at $0.55$ LUT/bit (p. 229) | 0 | one $k$-bit RCA, $k\,t_\mathrm{FA}$, ahead of the tree (p. 222) | exact |
| [[Unsigned DSP Multiplier Packing]] | two $8\times8$ products from one $18\times27$ DSP: $k=w_P=16$, $X$ is 24 b into the 27-b port, $R$ is 45 b (p. 224) | 0 — the concatenation is wiring (p. 224) | 1 DSP for 2 multiplications | DSP routing + pipeline; no added logic level (p. 223) | exact |
| [[Signed DSP Multiplier Packing]] | pre-adder builds $\mathrm{sext}(A)+2^kB$; correction is the one bit $p_{w_P-1}=b_{w_A-1}\oplus b_{w_B-1}$ (pp. 225–226) | — | 1 DSP for 2 multiplications | + the DSP's pre-adder stage (p. 224) | exact |
| [[Multiplier Tiling]] | covers the rectangle exactly once; $24\times24$ in 1 DSP, $53\times53$ in 8 (Figs. 8.19–8.20, pp. 236–237) | $\mathrm{cost}^\mathrm{LUT}_s=\#\mathrm{LUT}^\mathrm{mult}_s+0.55\,w_s$ (p. 229) | capped directly by an ILP constraint (p. 235) | — (the ILP objective has no delay term); binary ILP scales to $64\times64$ (pp. 234–235) | exact, or any mask $M_{x,y}$ |
| [[LUT-Based Multiplier Tiles]] | $1\times1$ / $1\times2$ / $3\times3$ / $2\times3$, area 1 / 2 / 9 / 6 (p. 229) | $1.55$ / $2.10$ / $9.30$ / $5.75$ → $E^\mathrm{LUT}$ $0.65$ / $0.95$ / $0.97$ / **$1.04$** (p. 229) | 0 | one LUT level | exact |
| [[Carry-Chain Multiplier Tile]] | $2\times k$ Baugh–Wooley row on a slice, area $2k$ (p. 231) | $1.55k+2.1$, so $E=\tfrac{2k}{1.55k+2.1}$: $1.05$ at $k=6$, $1.22$ at $k=24$, $\to1.29$ (p. 231) | 0 | $k+1$ hardened carry-chain stages (p. 231) | exact |
| [[DSP Super-Tile]] | two chained DSPs, area 816, legal only at relative shift $0$ or $17$ (p. 232) | $23.1$ (shift 0) / $31.9$ (shift 17) → $E^\mathrm{LUT}$ $35.32$ / $25.58$, against $22.55$ and $18.13$ for one $24\times17$ tile (p. 229) | 2 | +1 pipeline stage per chain link (p. 232) | exact |
| [[Correctly Rounded Multiplier]] | the exact array plus one constant $1$ at $\ell_P-1$; it lands in the tallest column, height $w\to w+1$ (p. 237) | — | — | — | round-to-nearest-ties-up, $\le\tfrac12\,$ulp |
| [[Truncated Multipliers]] | $g$ guard columns from Table 8.4 (p. 239): $g=3$ for $w=6$–10, $g=5$ for $w=20$–36; Booth $g=4$ for $w=16$–32. At $8\times8$, 15 of 64 AND gates dropped (23%) | $+0.55$ per nonzero bit of $C$ — 4 bits, $C=2\,013\,265\,920$, for $32\times32\to32$ (p. 243) | fewer tiles for the same $w$ | shorter: smaller heap, shorter chains | **faithful**, error $<1\,$ulp $=2^{\ell_P}$ |
| [[Karatsuba]] | 3 multipliers instead of 4, + 2 pre-additions, + 2 post-additions (p. 244) | $E^\mathrm{LUT}$ falls $18.13\to10.46$ on $17\times17$ tiles (p. 254) | $E^\mathrm{DSP}=385.3$ — *below* the plain tile's $408$ (p. 254) | one carry-propagate pre-adder ahead of the array (p. 245) | exact |
| [[Subtractive Karatsuba]] | same 3/2/2; middle product is natively signed, so $w\le17$ instead of $w\le16$ on an $18\times25$ signed DSP (p. 245) | same as additive (p. 245) | same | same | exact |
| [[K-Part Karatsuba Splitting]] | saves the triangle $K(K-1)/2$ of $K^2$: $K=3$ gives 9→6, $K=4$ gives 16→10 (pp. 246–248) | $E^\mathrm{LUT}$ $10.46$ / $10.13$ / $9.71$ for $K=2/3/4$ square (p. 254) | $E^\mathrm{DSP}$ $385.3$ / $433.5$ / $462.4$ vs $408$ (p. 254) | one pre-addition level, whatever $K$ | exact |
| [[Recursive Karatsuba]] | 9 leaves for $4w\times4w$ against 10 for flat 4-part; 27 vs 36 at $K=8$, 81 vs 136 at $K=16$ (p. 248) | — | — | $k$ pre-additions **in sequence** at depth $k$ (p. 248) | exact |
| [[Rectangular Karatsuba]] | $16\times24$ tiles: $\gcd=8$, smallest pattern $64\times72$; native $17\times24$ needs $450\times450$ (p. 250) | $E^\mathrm{LUT}$ $12.19$ / $11.08$ / $11.21$ for 2/3/4-part (p. 254) | $E^\mathrm{DSP}$ $512$ / $576$ / $614.4$ (p. 254) | pre-adders shareable: only 5 of 12 distinct at $96\times96$, 7 of 16 at $112\times120$ (p. 255) | exact |

Every `—` is a genuine gap in the source, not an omission here. §8.5 costs the [[Correctly Rounded Multiplier]] only in words — "almost the same area and delay as an exact one, the difference being one constant bit in the bit array" (p. 237) — with no LUT, DSP or delay figure and no measurement of how often that bit forces an extra compression level. [[Signed DSP Multiplier Packing]] is given as a construction (Fig. 8.12, pp. 225–226) with no LUT count for the sign-correction path. [[Recursive Karatsuba]] is costed purely in multiplier counts; it has no row in Table 8.5. And the tiling ILP of [[Multiplier Tiling]] minimises resources subject to *coverage only* — there is no delay term anywhere in (8.36)–(8.38), which is why the Delay column for it is a dash rather than a number.

**Delay decides first, and the table is silent on it.** The cost model prices area, so it will happily recommend a structure that misses timing. Three of the rows above buy their area saving with carry propagation placed *in front of* the multiplier, where it cannot be hidden: [[Bewick Radix-8 Multiplier]]'s $k$-bit RCA, and the pre-additions of every [[Karatsuba]] variant (p. 245). Post-additions are free by comparison — they are extra terms in a heap that [[Compressor Trees|the compressor tree]] was going to build anyway, and in carry-save form adding a term is constant time. So if the design is latency-bound, take a plain [[Multiplier Tiling]] of [[Unsigned Array Multiplier]] rows or DSP tiles and stop; if it is throughput-bound and you can afford pipeline stages, the [[DSP Super-Tile]] costs one stage per chain link (p. 232) and [[Recursive Karatsuba]] costs $k$ carry-propagate adders in sequence, which is the reason recursion is unconditionally right in software (GMP) and a real trade in hardware.

**Area on an FPGA is a question about which resource runs out.** If LUTs are scarce, DSPs win by an order of magnitude — $E^\mathrm{LUT}=18.13$ for a $24\times17$ tile against $1.04$ for the best LUT-only shape (p. 229) — and the cheapest thing you can do is [[DSP Super-Tile|chain two of them]] to reach $35.32$. If DSPs are what runs out, the ranking inverts and Karatsuba becomes worth its adders, but only in the right shape: on square $17\times17$ tiles 2-part [[Karatsuba]] scores $E^\mathrm{DSP}=385.3$, *worse than not doing Karatsuba at all*, and [[K-Part Karatsuba Splitting]] only overtakes $408$ at $K=3$, i.e. from $51\times51$ up. The culprit is not the identity but the shaping: forcing a $17\times24$ block into a square discards $7/24=29\%$ of it, while the pairing only removes $25\%$ of the multipliers. Keep the block rectangular and [[Rectangular Karatsuba]] pays at 2-part already ($512>408$), from $64\times72$ upward. Trying to pair the native $17\times24$ shape instead gives $\gcd=1$ and a smallest useful instance of $450\times450$ saving one DSP in 408 — arithmetically correct and worthless. Below all of that, when neither resource is the issue and the multiplier is small, [[LUT-Based Multiplier Tiles]] and the [[Carry-Chain Multiplier Tile]] are the whole answer: $2\times k$ passes every LUT-only tile at $k=6$ and climbs toward $1.29$, so the ILP will use the widest strip that fits, and the $1\times1$ exists only so a legal tiling always closes.

**Accuracy is a separate axis, and it is the cheapest one to spend.** Relaxing the specification from exact to faithful is the single largest area lever available, because it deletes partial products rather than re-encoding them: at $32\times32$ the dropped triangle is most of the low half of the rectangle, and the compensation is four constant bits (p. 243). Take [[Truncated Multipliers]] whenever the consumer does not read the low output bits — and note that the saving compounds, since every operator downstream now carries fewer bits too. Take [[Correctly Rounded Multiplier]] instead only when you specifically need half an ulp rather than one: it builds the *entire* exact array and adds one constant, so it saves nothing and merely stops the error from being one-sided. [[Booth's Algorithm]] interacts with this decision rather than competing with it — halving the row count halves $\Delta^\mathrm{minor}$, which is worth exactly one extra truncated column (p. 238), so $g=3$ covers $w\le10$ plain but $w\le15$ Booth-recoded.

**Signedness and operand sharing are decided before any of this.** [[Baugh-Wooley Multiplier]] is not a trade-off at all: it makes a radix-2 array signed for two constant bits and turns $2(w-1)$ ANDs into NANDs, which in static CMOS is cheaper, so on an ASIC there is no reason to build a signed array any other way. On an FPGA the question usually evaporates, because a DSP tile is natively signed and only the tiles touching an MSB are signed at all. [[Booth's Algorithm]] belongs to ASIC flows where halving the compressor tree dominates and there is no hard block to tile onto; on an FPGA the LUT tiling almost always wins instead. And if the workload is many small multiplications against one shared operand — 8-bit inference is the canonical case — neither array nor tiling is the right frame: [[Unsigned DSP Multiplier Packing]] gets two $8\times8$ products from one DSP for the cost of a concatenation, and [[Signed DSP Multiplier Packing]] gets the same for signed operands at the cost of the DSP's own pre-adder plus one correction bit. That doubles DSP throughput on parts where the DSP column, not the LUT array, is what runs out.

$$\boxed{\ E_s=\frac{\mathrm{area}_s}{\mathrm{cost}_s};\qquad E^\mathrm{LUT}:\ 0.65\to1.29\ \text{(logic)},\ \ 18.13\to35.32\ \text{(DSP)};\qquad E^\mathrm{DSP}:\ 408\to614.4\ \text{(Karatsuba)}\ }$$

**When this comparison breaks.**

- **The metric prices area, never time.** Nothing in $E_s$ penalises a pre-adder, a $k$-stage carry chain, or a DSP pipeline register. Two structures with the same $E$ can differ by a factor in latency, and the ILP will pick either.
- **Every number is AMD.** $0.55$ LUT/bit, the $2\times3 > 3\times3$ ordering (a 7% margin, well inside a linear model's error), the $k=6$ crossover, the $\{0,17\}$ super-tile shifts and the $17\times24$ / $18\times27$ block shapes are all device facts. On Intel ALMs or a fabric with no fast carry chain the ranking must be re-fitted.
- **Below $w\approx17$ the DSP rows are irrelevant** and above $w\approx64$ the exact ILP stops being tractable (p. 235), so the table's middle band is where it is actually predictive. Karatsuba's asymptotic $\Theta(w^{1.585})$ never enters at these widths; what enters is a constant factor of at most $578/408=1.42$ (p. 254).
- **$E^\mathrm{DSP}=408$ is the bar, not zero.** The most common mistake the numbers expose is applying a technique whose $E$ is genuinely above 1 but below the thing it replaces — 2-part square Karatsuba is the worked example.

No RTL: this note compares circuits and instantiates none.

**Related Notes.**

- [[Unsigned Array Multiplier]] – compares: the baseline every $E$ above is measured against, and the worst tile in the library at $E=0.65$.
- [[Baugh-Wooley Multiplier]] – compares: signedness for two constant bits, with no change to depth or column height.
- [[Booth's Algorithm]] – compares: halves the rows for an OR and an XOR per bit; an ASIC answer that FPGA tiling usually beats.
- [[Bewick Radix-8 Multiplier]] – counter-example: the one row whose premise (expensive carry propagation) is false on an FPGA.
- [[Unsigned DSP Multiplier Packing]] – extends: changes the question from "how do I build one multiplier" to "how many fit in one block".
- [[Signed DSP Multiplier Packing]] – extends: the same packing for signed operands, at the cost of the pre-adder and one correction bit.
- [[Multiplier Tiling]] – depends-on: the framework in which every FPGA row of the table is a tile with a cost.
- [[LUT-Based Multiplier Tiles]] – compares: the $\le6$-input family and the $E=1.04$ bar everything else has to clear.
- [[Carry-Chain Multiplier Tile]] – compares: the densest logic-only option, passing the LUT tiles at $k=6$.
- [[DSP Super-Tile]] – extends: doubles $E^\mathrm{LUT}$ for one pipeline stage, at two legal shifts only.
- [[Correctly Rounded Multiplier]] – compares: half an ulp for one constant bit, paid on top of the full exact array.
- [[Truncated Multipliers]] – compares: the largest area lever here, bought by relaxing exact to faithful.
- [[Karatsuba]] – compares: three multipliers for four, and the reason that is a loss on square DSP tiles.
- [[Subtractive Karatsuba]] – extends: reclaims the forced-zero sign bit, moving the chunk bound from $w\le16$ to $w\le17$.
- [[K-Part Karatsuba Splitting]] – extends: the $K$-way generalisation and the $K\ge3$ threshold for square tiles.
- [[Recursive Karatsuba]] – compares: fewer multipliers than flat splitting, paid for in pre-adders stacked in sequence.
- [[Rectangular Karatsuba]] – compares: the only Karatsuba variant that pays at 2-part, because it stops squaring the DSP.
- [[Multipliers]] – depends-on: the three-stage construction and the error analysis that all of these share.
- [[Error Accuracy]] – depends-on: what "faithful" and "correctly rounded" mean in the Accuracy column.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 8, "Fixed-Point Multiplication":

- §8.1–8.2, pp. 203–214 — exact product format p. 207, last-bit-accurate default p. 209, DSP shapes p. 204, $\mathcal{O}(\log w)$ vs $\mathcal{O}(w)$ p. 214.
- §8.3, pp. 214–222 — unsigned double sum p. 214, signed radix-2 and constant collapse p. 216, Booth digit set and $m$ pp. 218, 221, realization p. 219, higher-radix wall and Bewick p. 222.
- §8.4, pp. 222–237 — five reasons for an application-specific multiplier pp. 222–223, DSP packing pp. 223–226 (Figs. 8.11–8.12), tiling pp. 226–228, **Table 8.3 p. 229** (all $E^\mathrm{LUT}$/$E^\mathrm{DSP}$ tile figures), carry-chain tile p. 231, super-tiles p. 232, ILP pp. 233–235, tiled examples Figs. 8.19–8.20 pp. 236–237.
- §8.5, pp. 237–243 — correctly rounded architecture p. 237, $\Delta^\mathrm{minor}$ halving p. 238, **Table 8.4 p. 239** (guard bits), truncated-tiling ILP pp. 240–242, $32\times32$ instance p. 243.
- §8.6, pp. 244–255 — two-part identity p. 244, subtractive form and pre-adder critical path p. 245, $K$-part pp. 246–248, recursive p. 248, rectangular pp. 249–253, **Tables 8.5–8.6 p. 254**, pre-adder sharing p. 255.
- §5.2.6, pp. 111–112 — the high-radix carry-save adder underlying the Bewick row.
