---
title: "STAM, Symmetric Table Addition Method"
description: "Wong and Goto's production form: B split in two, two centred differences, plus a second/third-order correction table — 6 tables of 12-13 input bits and 9 additions at 24 bits."
kind: circuit
source: "ASA §17.2.3-17.2.4, §17.3.1, pp. 507-511, 523-526"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, tables, symmetry, ata]
aliases:
  - STAM
  - Symmetric Table Addition Method
  - Symmetric table addition
  - Schulte-Stine method
  - Wong-Goto method
---

# STAM, Symmetric Table Addition Method

STAM splits the low sub-word $B$ into two equal halves and rebuilds $B f'(A)$ from two symmetry-halved *centred differences of $f$'s own table* rather than from stored slopes, so a 24-bit function collapses to six tables of 12–13 address bits and nine additions.

```tikz title="STAM datapath: X split into A, B_2, B_1; four alpha-bit address adders feeding five reads of one function table, two centred differences weighted 1 and 2^{beta/2}, plus a second/third-order correction table indexed by the MSB halves"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------------- input word ----------------
\draw[thick] (0,6.3) rectangle (9,6.9);
\draw[very thick] (4.5,6.3) -- (4.5,6.9);
\draw[very thick] (6.75,6.3) -- (6.75,6.9);
\node[font=\small,anchor=east] at (-0.15,6.6) {$X=$};
\node[font=\tiny] at (2.2,7.15) {$A$ ($\alpha$ bits)};
\node[font=\tiny] at (5.6,7.15) {$B_2$ ($\beta/2$)};
\node[font=\tiny] at (7.9,7.15) {$B_1$ ($\beta/2$)};
\node[font=\tiny,anchor=west] at (-0.6,7.7) {$X=A+2^{-\beta}B,\qquad B=B_1+2^{\beta/2}B_2,\qquad \alpha>\beta$};
% ---------------- fan-out buses ----------------
\draw[thick] (2.2,6.3) -- (2.2,5.95);
\draw[thick] (0.3,5.95) -- (7.8,5.95);
\node[font=\tiny,anchor=south] at (0.75,5.98) {$\alpha$};
\draw[thick] (7.9,6.3) -- (7.9,5.62) -- (2.6,5.62);
\draw[thick] (5.6,6.3) -- (5.6,5.29) -- (8.6,5.29);
\node[font=\tiny,anchor=west] at (7.95,5.85) {$\beta/2$};
\node[font=\tiny,anchor=east] at (5.5,5.45) {$\beta/2$};
\draw[thick,->] (0.3,5.95) -- (0.3,4.05);
\foreach \x in {1.8,3.8,5.8,7.8} \draw[thick,->] (\x,5.95) -- (\x,5.05);
\foreach \x in {2.6,4.6} \draw[thick,->] (\x,5.62) -- (\x,5.05);
\foreach \x in {6.6,8.6} \draw[thick,->] (\x,5.29) -- (\x,5.05);
% ---------------- address adders ----------------
\foreach \x/\lab in {2.2/{A{+}B_1},4.2/{A{-}B_1},6.2/{A{+}B_2},8.2/{A{-}B_2}}{
  \node[draw,thick,minimum width=1.6cm,minimum height=0.5cm] at (\x,4.75) {$\lab$};
  \draw[thick,->] (\x,4.5) -- (\x,4.05);
}
% ---------------- the five reads of one table ----------------
\foreach \x/\lab in {0.3/{f(A)},2.2/{f(A{+}B_1)},4.2/{f(A{-}B_1)},6.2/{f(A{+}B_2)},8.2/{f(A{-}B_2)}}
  \node[draw,thick,minimum width=1.7cm,minimum height=1.0cm,align=center] at (\x,3.5)
    {$T$\\[-2pt]{\tiny $\lab$}\\[-4pt]{\tiny $2^{\alpha}\times(w_R{+}g)$}};
% ---------------- correction table ----------------
\draw[densely dotted,thick,->] (9,6.6) -- (10.7,6.6) -- (10.7,4.05);
\node[font=\tiny,anchor=west,align=left] at (10.85,5.85) {$A_h\Vert B_h$\\ (MSB halves)};
\node[draw,thick,minimum width=1.9cm,minimum height=1.0cm,align=center] at (10.7,3.5)
  {$\mathrm{TC}$\\[-2pt]{\tiny 2nd/3rd order}\\[-4pt]{\tiny correction}};
% ---------------- centred differences ----------------
\draw[thick] (2.2,3.0) -- (2.2,2.2); \draw[thick,->] (2.2,2.2) -- (2.5,2.2);
\draw[thick] (4.2,3.0) -- (4.2,2.2); \draw[thick,->] (4.2,2.2) -- (3.9,2.2);
\node[font=\tiny,anchor=south] at (2.35,2.24) {$+$};
\node[font=\tiny,anchor=south] at (4.05,2.24) {$-$};
\node[draw,thick,minimum width=1.4cm,minimum height=0.5cm] at (3.2,2.2) {$D_1$};
\draw[thick] (6.2,3.0) -- (6.2,2.2); \draw[thick,->] (6.2,2.2) -- (6.5,2.2);
\draw[thick] (8.2,3.0) -- (8.2,2.2); \draw[thick,->] (8.2,2.2) -- (7.9,2.2);
\node[font=\tiny,anchor=south] at (6.35,2.24) {$+$};
\node[font=\tiny,anchor=south] at (8.05,2.24) {$-$};
\node[draw,thick,minimum width=1.4cm,minimum height=0.5cm] at (7.2,2.2) {$D_2$};
% ---------------- final accumulation ----------------
\node[draw,thick,minimum width=12cm,minimum height=0.5cm] at (5.6,1.05) {$+$};
\draw[thick,->] (0.3,3.0) -- node[left,font=\tiny,pos=0.55]{$w_R{+}g$} (0.3,1.3);
\draw[thick,->] (3.2,1.95) -- node[right,font=\tiny,pos=0.3]{$\times 2^{-\beta-1}$} (3.2,1.3);
\draw[thick,->] (7.2,1.95) -- node[right,font=\tiny,pos=0.3]{$\times 2^{-\beta-1+\beta/2}$} (7.2,1.3);
\draw[thick,->] (10.7,3.0) -- (10.7,1.3);
\draw[thick,->] (5.6,0.8) -- node[right,font=\tiny]{$R$, $w_R$ bits, faithful} (5.6,0.1);
\node[font=\tiny,anchor=north,align=center] at (5.6,-0.25)
  {one table $T$, five reads (dual-port, replicated, or sequenced); both scalings are hard-wired shifts\\[-2pt]
   9 additions total: 4 address adds, 2 difference subtracts, 3 accumulation adds};
\end{circuitikz}
\end{document}
```

*own construction, from the description of Wong and Goto's architecture on p. 526 and the input-word decomposition of Fig. 17.4, p. 505*

**Fix the input split, because every cost in this note is a function of it.** Write the $w_X$-bit input as $X = A + 2^{-\beta}B$ with $A$ the top $\alpha$ bits on a grid of ulp $2^{-\alpha}$, $B$ the bottom $\beta$ bits, and the ATA side condition $\alpha > \beta$. That condition is what makes $A \pm B$ land on $A$'s own grid, so the *same* table $T$ of $2^{\alpha}$ entries answers every read — the defining trick of the [[ATA, Addition-Table-Addition]] family, and the reason additions appear *before* the lookups as well as after. Since $w_X = \alpha + \beta$, every table in the architecture is $2^{\alpha}$ deep and $\alpha$ is the only exponential in the design; the whole method is a fight to push $\alpha$ down toward $w_X/2$ without losing faithful rounding. See [[Number Formats]] for the fixed-point conventions and [[Error Accuracy]] for ulp and faithfulness.

**Turn the derivative into a difference of the table you already own.** First-order Taylor gives $f(A + 2^{-\beta}B) \approx f(A) + 2^{-\beta} B f'(A)$, and the ATA move is to refuse to store $f'$ at all: approximate it by a centred difference of $f$ itself. Expanding both endpoints and subtracting, the even-order terms cancel by the symmetry of the two expansions,

$$\frac{f(A{+}B) - f(A{-}B)}{2} = B f'(A) + \frac{B^{3}}{6} f'''(A) + O(B^{5})$$

so the derivative estimate is wrong only at third order. That is [[Central-Difference ATA]]: three reads of $T$, seven additions, and no derivative table.

**Split $B$ in two and the third-order term collapses by a factor $2^{\beta}$.** Because $B \mapsto B f'(A)$ is *linear in $B$*, the split $B = B_1 + 2^{\beta/2} B_2$ with $0 \le B_1, B_2 < 2^{\beta/2}$ distributes:

$$B f'(A) = B_1 f'(A) + 2^{\beta/2} B_2 f'(A)$$

Give each term its own centred difference *at its own small offset* — $B_1$ and $B_2$ are $\beta/2$-bit numbers, so the offsets are $2^{\beta/2}$ times smaller than $B$ — and rescale the second by $2^{\beta/2}$ afterwards. With $B$ a multiple of $2^{-\alpha}$ bounded by $2^{\beta - \alpha}$, the leftover third-order error goes from

$$\frac{B^{3}}{6}|f'''| \;<\; \frac{2^{3(\beta - \alpha)}}{6}|f'''| \qquad\text{down to}\qquad \frac{B_1^{3} + 2^{\beta/2}B_2^{3}}{6}|f'''| \;\approx\; \frac{2^{2\beta - 3\alpha}}{6}|f'''|$$

a ratio of exactly $2^{-\beta}$. Those $\beta$ recovered bits are not spent on accuracy — they are spent on moving bits *out* of $A$ and *into* $B$, which is what "reduces table sizes" means here: $\alpha$ shrinks, and $2^{\alpha}$ shrinks with it. The price is two more reads and two more address adders, both linear.

**Halve every table by the symmetry that gives the method its name.** Each of the difference tables is symmetric about the centre of its segment, so only the half-segment need be stored and the other half generated by negation. In two's complement $-x = \bar{x} + 1$, and the $+1$ is a constant that folds into another table's fill value, so the negation costs **one row of XOR gates** driven by the MSB of the corresponding sub-word — which then stops being an address bit. One input bit and one output bit are saved per table, a 4× reduction in stored bits for a handful of gates ([[Symmetric Table of Offsets]], Fig. 17.8, p. 507). This is Schulte and Stine's contribution [SS99a], and it is what "symmetric" in *symmetric table addition method* refers to.

**Buy back the second and third order with one small table instead of two more reads.** The three lookups $f(A)$, $f(A{\pm}B)$ already contain a second derivative — a divided second difference,

$$f''(A) \approx \frac{f(A{+}B) - 2f(A) + f(A{-}B)}{B^{2}}$$

which turns second-order Taylor into $f(A) + 2^{-\beta-1}(f(A{+}B) - f(A{-}B)) + 2^{-2\beta-1}(f(A{+}B) - 2f(A) + f(A{-}B))$ at no extra reads (p. 526). Wong and Goto do not use that form directly: **the extra additions each contribute a rounding error, which consumes exactly the accuracy the better formula just bought.** Instead they tabulate the correction. Because the second- and third-order terms vary slowly in $A$ and in $B$, the table $\mathrm{TC}$ is indexed by only the *most significant half-word of $A$ and the most significant half-word of $B$* — roughly $\lceil\alpha/2\rceil + \lceil\beta/2\rceil$ address bits, in the same 12–13 bit class as $T$ itself — and it enters the final sum as one more addend rather than as two more rounding sites.

**Count what the 24-bit instance actually costs.** The book states the totals: **6 tables with 12 or 13 bits of inputs, 9 additions** (p. 526). Reading them against the datapath above, the six are the five reads of $T$ — $f(A)$, $f(A{\pm}B_1)$, $f(A{\pm}B_2)$, realised as dual-port reads, replicated copies, or sequenced accesses over several cycles — plus $\mathrm{TC}$; and the nine additions are 4 address adds ($A \pm B_1$, $A \pm B_2$, $\alpha$ bits each), 2 difference subtracts, and 3 accumulation adds to combine $f(A)$, $D_1$, $2^{\beta/2}D_2$ and $\mathrm{TC}$. Both scalings, $2^{-\beta-1}$ and $2^{\beta/2}$, are hard-wired shifts and cost nothing. At $w_X = 24$ that is at most $6 \cdot 2^{13} \approx 49\,000$ entries against $2^{24} \approx 16.8$ million for a plain ROM — a factor above 340 in entries, before any comparison of entry widths.

> [!warning] The book gives totals, not a parameter set
> §17.3.1 states 6 tables, 12–13 input bits and 9 additions for 24-bit precision, and nothing else about STAM: no per-table output widths, no guard-bit count $g$, no error analysis, no worked instance. The decomposition of those two totals above is a reconstruction consistent with the described architecture, not a quotation. The exact $\alpha$, $\beta$, table widths and error budget are in [WG95] and are outside this chapter.

**Where FPGA mapping bends the accounting.** Five reads of one $2^{\alpha}$-entry table is a memory-port problem, not a logic problem, and the two technologies answer it differently. On an ASIC a five-port ROM is normally five copies, and the $2^{0.65\min(k,n)}$ area model of Eq. (16.1), p. 491 then applies five times. On an FPGA a $2^{12}\times n$ table is squarely in [[Block Memory|block RAM]] territory, block RAMs are dual-port, so five reads cost three BRAM instances — and a BRAM you were not otherwise using costs *no logic at all*. That inverts the usual conclusion: STAM's compression is worth most when the tables sit in LUTs, and worth least exactly where its target precision (24 bits) puts them, in BRAM. Meanwhile the nine additions are not nine adders — dump all four addends into a [[Bit Heaps|bit heap]] and let a [[Compressor Trees|compressor tree]] plus one final CPA absorb them, and the accumulation collapses to roughly the latency of a single carry-propagate add.

$$\boxed{\ f(A+2^{-\beta}B)\;\approx\;f(A)\;+\;2^{-\beta-1}\Big[\big(f(A{+}B_1)-f(A{-}B_1)\big)+2^{\beta/2}\big(f(A{+}B_2)-f(A{-}B_2)\big)\Big]\;+\;\mathrm{TC}(A_h,B_h)\ }$$

**When it breaks.**

- **$f'''$ must be bounded.** The whole construction rests on the third-order remainder of a centred difference. $\sqrt{x}$ on $[0,1)$ fails at the origin exactly as it fails for [[Multipartite Methods]]; range reduction first, then STAM.
- **$\alpha > \beta$ is a hard constraint**, not a tuning knob — violate it and $A \pm B$ leaves $A$'s grid and the shared table disappears. It also caps how far the $2^{-\beta}$ accuracy gain can be traded for a smaller $\alpha$.
- **The address range overshoots.** $A + B$ can exceed the top of $A$'s range, so $T$ must tabulate $f$ slightly beyond the reduced interval (or the top segments handled separately) — a detail invisible in the $2^{\alpha}$ entry count.
- **Nine additions are nine rounding sites.** Each is a place where guard bits must already have been paid for; this is the same effect that kills the 2nd-order Taylor variant, and it is why more lookups does not monotonically mean more accuracy.
- **It loses to generalised multipartite.** [DT05] found ATA/STAM better than the original bipartite scheme and worse than the generalised multipartite search (p. 526). STAM is the fixed decomposition — all $C_i$ equal, $B$ split evenly in two — that the multipartite enumeration contains as one candidate among many, so it can only tie at best. Reach for [[Multipartite Methods]] unless you specifically want the single-table-five-reads structure.
- **Below ~10 bits none of this matters**: a plain ROM is correctly rounded, monotonic for free, and one cycle. See [[Choosing a Table Method]].

**RTL (Spade).** The address adders are ordinary $\alpha$-bit adders and the tables are ROMs; the part worth writing down is the accumulation network, where the sign of each difference and the weight of $D_2$ are the two things that silently produce a wrong function. A 24-bit instance, $\beta/2 = 6$, all six table words arriving at $w_R + g = 16$ bits:

```spade
entity stam_sum(
    fa:   int<16>,   // TIV word f(A)
    fp1:  int<16>,   // f(A + B1)
    fm1:  int<16>,   // f(A - B1)
    fp2:  int<16>,   // f(A + B2)
    fm2:  int<16>,   // f(A - B2)
    corr: int<16>,   // second/third-order correction TC(A_h, B_h)
) -> int<24> {
    let d1: int<24> = sext(fp1 - fm1);          // int<17> widened
    let d2: int<24> = sext(fp2 - fm2);
    let d2w: int<24> = d2 << 6;                 // weight 2^(beta/2), pure rewiring
    // |d2w| <= 2^22, |d1| <= 2^16, |fa|,|corr| <= 2^15  =>  sum < 2^23, trunc is exact
    let t1: int<24> = trunc(sext::<16, 24>(fa) + d1);
    let t2: int<24> = trunc(t1 + d2w);
    trunc(t2 + sext::<16, 24>(corr))
}
```

`d1` and `d2` are the $D_1$ and $D_2$ boxes of the diagram, `d2w` the $\times 2^{\beta/2}$ arrow into the final adder — a shift, so zero gates. The common factor $2^{-\beta-1}$ never appears: it is a relabelling of the output's binary point, free by construction. Each `+` widens by one bit in Spade, so the three accumulation steps are truncated back to 24; the truncation is exact because the magnitude bound in the comment holds, and that bound is the reason the block is combinational with no saturation logic. Synthesis will not build the three separate adders shown: it will merge them into one compressor tree over four addends and a single final CPA, which is why the drawn `+` is one wide box.

*Compiled and simulated: 7 named vectors (including `fp1 = 1, fm1 = 128` and `fp2 = 1, fm2 = 128`, asymmetric so a swapped minuend and subtrahend cannot pass) plus 5000 random vectors against a behavioural reference, 0 failures. Changing the weight from `<< 6` to `<< 5` produces 5004 failures, so the check is live.*

**Related Notes.**

- [[Central-Difference ATA]] – extends: STAM is this, with $B$ split in two and a correction table bolted on.
- [[ATA, Addition-Table-Addition]] – depends-on: supplies $X = A + 2^{-\beta}B$, $\alpha > \beta$, and the addition-before-lookup structure every read here relies on.
- [[Symmetric Table of Offsets]] – supports: the XOR-row symmetry that halves each of the six tables and gives the method its name.
- [[Multipartite Methods]] – compares: the generalised enumeration that contains STAM as one fixed decomposition and beats it in practice.
- [[Bipartite Table Method]] – compares: the $m = 1$ ancestor that STAM was measured against and beat.
- [[Compressor Trees]] – supports: turns the nine additions into one tree and one CPA.
- [[Bit Heaps]] – supports: the natural representation for four addends at different weights and different widths.
- [[Choosing a Table Method]] – compares: where STAM sits against plain ROM, LDTC and multipartite.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17 "Function Evaluation Using Tables and Additions".

- Sect. 17.2.3 Exploiting symmetry, Fig. 17.8, p. 507 — Schulte and Stine [SS99a], the XOR-row symmetry and the 4× table reduction
- Sect. 17.2.4 From bipartite to multipartite, Fig. 17.9, pp. 508–511 — the $B = \sum 2^{p_i}B_i$ split by linearity, and p. 510: Schulte and Stine's method [SS99b] is the multipartite decomposition with all $C_i$ equal
- Sect. 17.3.1 Addition-table-addition, Figs. 17.16–17.17, pp. 523–526 — first-order ATA and its cost list (p. 524); the central-difference form and 7 additions (p. 525); Wong and Goto's STAM-style split of $B$, the correction table indexed by the MSB half-words, and the 24-bit totals of 6 tables and 9 additions (p. 526); the 2nd-order Taylor variant and why its extra rounding consumes its extra accuracy (p. 526)
- Sect. 16.4.2 Actual cost of a ROM, Eq. (16.1), pp. 491–492 — the table cost model used above

Cited works, in the book's labels: [WG95] Wong and Goto (ATA and its production architecture), [SS99a] and [SS99b] Schulte and Stine (symmetry, multiple sub-tables), [DT05] de Dinechin and Tisserand (the comparison that ranks these methods).
