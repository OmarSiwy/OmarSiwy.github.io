---
title: Reduced Area Compressor Tree
description: "Bickerstaff's as-soon-as-possible schedule: maximum full adders per column every level, half adders only to respect the Dadda bound or to start carry propagation early — same stage count as Dadda, more cells, but a 10-bit final adder instead of 14 and far fewer flip-flops when pipelined."
kind: circuit
source: "ASA §7.3.1.2, pp. 177-180"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, compressor, multiplier, fpga]
aliases:
  - RA Tree
  - RA Algorithm
  - Reduced Area Algorithm
  - Reduced Area Tree
  - Bickerstaff Tree
---

# Reduced Area Compressor Tree

The Reduced Area (RA) algorithm of Bickerstaff et al. packs every level of a compressor tree with as many full adders as its columns can feed, so it reaches height 2 in the same number of levels as a [[Dadda Tree]] while spending more cells — and buys back a shorter final adder and a much smaller heap sitting in the pipeline registers.

```tikz title="Reduced Area compression of an 8x8 multiplier bit heap, level by level, against Dadda's output"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % RA compression of the 8x8 multiplier heap. Column 0 at the right.
  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/5,5/6,6/7,7/8,8/7,9/6,10/5,11/4,12/3,13/2,14/1}
    \foreach \r in {1,...,\h} \fill (-0.42*\c,0.28*\r) circle (2.1pt);
  \foreach \c/\h in {0/1,1/1,2/2,3/3,4/4,5/3,6/5,7/6,8/5,9/4,10/5,11/3,12/2,13/3,14/1}
    \foreach \r in {1,...,\h} \fill (-0.42*\c,-2.9+0.28*\r) circle (2.1pt);
  \foreach \c/\h in {0/1,1/1,2/1,3/2,4/3,5/2,6/4,7/3,8/4,9/4,10/4,11/2,12/3,13/1,14/2}
    \foreach \r in {1,...,\h} \fill (-0.42*\c,-5.0+0.28*\r) circle (2.1pt);
  \foreach \c/\h in {0/1,1/1,2/1,3/1,4/2,5/3,6/2,7/2,8/3,9/3,10/3,11/3,12/1,13/2,14/2}
    \foreach \r in {1,...,\h} \fill (-0.42*\c,-6.8+0.28*\r) circle (2.1pt);
  \foreach \c/\h in {0/1,1/1,2/1,3/1,4/1,5/2,6/2,7/2,8/2,9/2,10/2,11/2,12/2,13/2,14/2}
    \foreach \r in {1,...,\h} \fill (-0.42*\c,-8.4+0.28*\r) circle (2.1pt);
  \foreach \c/\h in {0/1,1/2,2/2,3/2,4/2,5/2,6/2,7/2,8/2,9/2,10/2,11/2,12/2,13/2,14/2}
    \foreach \r in {1,...,\h} \fill (-0.42*\c,-10.0+0.28*\r) circle (2.1pt);

  % half adders applied at each level (hollow marker under the column)
  \foreach \c/\y in {1/0, 2/-2.9, 8/-2.9, 3/-5.0, 4/-6.8, 6/-6.8, 7/-6.8}
    \draw[thick] (-0.42*\c,\y) circle (2.6pt);

  % separators
  \foreach \y in {-0.55,-3.35,-5.35,-7.15,-9.08}
    \draw[thin,gray] (-6.25,\y) -- (0.15,\y);

  % row labels
  \node[anchor=west,font=\footnotesize] at (0.45,1.2)
    {$l=4$ input: 64 bits, $h_{\max}=8$; apply 16 FA, 1 HA};
  \node[anchor=west,font=\footnotesize] at (0.45,-1.9)
    {$l=3$: 48 bits, $h_{\max}=6=m_3$; apply 11 FA, 2 HA};
  \node[anchor=west,font=\footnotesize] at (0.45,-4.3)
    {$l=2$: 37 bits, $h_{\max}=4=m_2$; apply 7 FA, 1 HA};
  \node[anchor=west,font=\footnotesize] at (0.45,-6.2)
    {$l=1$: 30 bits, $h_{\max}=3=m_1$; apply 5 FA, 3 HA};
  \node[anchor=west,font=\footnotesize] at (0.45,-7.95)
    {$l=0$: 25 bits (RA)};
  \node[anchor=west,font=\footnotesize] at (0.45,-9.55)
    {$l=0$: 29 bits (Dadda, same heap, for comparison)};

  % final adder spans
  \draw[thick] (-5.88,-8.65) -- (-2.10,-8.65);
  \draw[thick] (-5.88,-8.55) -- (-5.88,-8.75);
  \draw[thick] (-2.10,-8.55) -- (-2.10,-8.75);
  \node[anchor=north,font=\tiny] at (-4.0,-8.72) {10-bit final adder, columns 5--14};
  \draw[thick] (-5.88,-10.25) -- (-0.42,-10.25);
  \draw[thick] (-5.88,-10.15) -- (-5.88,-10.35);
  \draw[thick] (-0.42,-10.15) -- (-0.42,-10.35);
  \node[anchor=north,font=\tiny] at (-3.15,-10.32) {14-bit final adder, columns 1--14};

  % column numbering
  \foreach \c in {0,...,14} \node[anchor=north,font=\tiny] at (-0.42*\c,-10.75) {\c};
  \node[anchor=west,font=\tiny] at (0.45,-10.9) {column $c$ (weight $2^c$)};
  \node[anchor=west,font=\tiny] at (0.45,-11.3)
    {open marker $=$ half adder applied in that column at that level};
\end{circuitikz}
\end{document}
```

*after Fig. 7.20, p. 179; the bottom row is Dadda's level 0 from Fig. 7.19, p. 178, drawn on the same axis for comparison.*

**Depth is not the thing being traded.** Every [[Bit Heaps|bit heap]] schedule built from $(3;2)$ and $(2;2)$ cells obeys the same bound: one level of full adders turns three rows into two, so height shrinks by at most a factor $\tfrac32$ per level, and running that backwards from height 2 gives the Dadda sequence $m_l=\lfloor 1.5\,m_{l-1}\rfloor$, $m_0=2$. The number of levels is $L=\min\{l:m_l\ge h_{\max}\}$ and is fixed by $h_{\max}$ alone — 8-bit-square multiplier, $h_{\max}=8$, $m_4=9\ge8>6=m_3$, so $L=4$ for **both** Dadda and RA. What is free is *where inside those four levels* each bit gets compressed, and that choice decides cell count, wire count, register count and the width of the final adder.

**Fill each level to capacity rather than to the bound.** Dadda is as-late-as-possible: compress a column only down to $m_{l-1}$ and no further, which is the minimum work that keeps the schedule feasible. RA inverts the objective — compress as early as possible — with two rules applied per level $l=L\ldots0$:

1. In every column, use the **maximum number of full adders such that all inputs are connected**, i.e. $\mathrm{FA}_i=\lfloor h_i/3\rfloor$, leaving $h_i \bmod 3$ bits to pass through untouched.
2. Use a half adder **only** when (a) the Dadda bound $m_{l-1}$ would otherwise be exceeded, or (b) the column is the rightmost one holding exactly two bits.

**Track the heights and the two directions a bit can move.** A full adder in column $i$ consumes three bits of weight $2^i$ and returns one sum of weight $2^i$ plus one carry of weight $2^{i+1}$, so it lowers column $i$ by two and raises column $i+1$ by one; a half adder consumes two and returns one plus one carry, lowering column $i$ by one. Carries produced at level $l$ are *not* compressed again at level $l$ — if they were, the level would contain a carry propagation and its delay would no longer be one full adder. They enter column $i+1$ at level $l-1$:

$$\boxed{\ \mathrm{FA}_i^{(l)}=\Big\lfloor \tfrac{h_i^{(l)}}{3}\Big\rfloor,\qquad
h_i^{(l-1)}=\underbrace{h_i^{(l)}-2\,\mathrm{FA}_i^{(l)}-\mathrm{HA}_i^{(l)}}_{\text{stays in column }i}
\;+\;\underbrace{\mathrm{FA}_{i-1}^{(l)}+\mathrm{HA}_{i-1}^{(l)}}_{\text{carries in from }i-1}\ }$$

Summing over columns gives the invariant that checks any schedule: a full adder takes three bits and returns two, so it removes exactly one bit from the heap; a half adder takes two and returns two, so it removes none. Heap size after a level is therefore the previous size minus that level's full-adder count.

**Rule 2b is the only part of the algorithm that is about the final adder.** A column of height 1 needs no adder at all — its single bit is already a bit of the result and bypasses the adder entirely. So collapsing the rightmost height-2 column with one half adder starts the carry propagation one column early and deletes that column from the final adder. Applied once per level it walks the adder's low boundary left by one column each time: on the $8\times8$ heap it fires in columns 1, 2, 3, 4 at levels $l=4,3,2,1$ respectively, and the final adder shrinks from columns 1–14 (14 bits) to columns 5–14 (**10 bits**) for four half adders. Dadda leaves those columns alone precisely because ALAP has no reason to touch a column that is already within bound.

**Count the $8\times8$ example out and the trade becomes arithmetic.** Running the two schedules on the same 64-bit triangular heap (columns 0–14, heights $1,2,\dots,8,\dots,2,1$):

| | level 4 | 3 | 2 | 1 | total FA | total HA | final adder |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RA, FA / HA | 16 / 1 | 11 / 2 | 7 / 1 | 5 / 3 | **39** | **7** | **10 bits** |
| RA heap size | 64 → 48 | → 37 | → 30 | → 25 | | | |
| Dadda, FA / HA | 3 / 3 | 12 / 2 | 9 / 1 | 11 / 1 | **35** | **7** | **14 bits** |
| Dadda heap size | 64 → 61 | → 49 | → 40 | → 29 | | | |

Both end at height 2, both in four levels. RA spends four extra full adders. The three bound-driven half adders it needs (column 8 at $l=3$; columns 6 and 7 at $l=1$) are exactly the places where compressing early piles carries into a column faster than $m_{l-1}$ allows — ASAP over-fills, then pays a half adder to climb back inside the bound.

**The real prize is flip-flops, and it only shows up once the tree is pipelined.** Inserting a pipeline stage after every level registers *every* bit crossing that boundary, compressed or not, so the flip-flop count is $\sum_{l<L}|\text{heap}_l|$. RA: $48+37+30+25=140$. Dadda: $61+49+40+29=179$. ASAP shrinks the heap earlier, so 39 fewer bits are in flight — 22 % fewer registers for four extra full adders. This is the whole reason the book presents RA next to the pipelined cost model: in a pipelined tree a bit that crosses a stage boundary uncompressed is the $(1;1)$ pseudo GPC, and it stops being free, priced at 0.5 LUT6 on AMD FPGAs because a LUT6 carries two flip-flops (p. 193). At that price the 39 saved registers are worth $\approx19.5$ LUT6 against four extra full adders at roughly one LUT6 each.

**Unpipelined the same trade nearly cancels, and that cancellation is FPGA-specific.** On ASIC, four bits off the final adder is real area and, if the adder is ripple-carry, real delay. On FPGA the final adder rides the hard carry chain at about one LUT per bit and near-zero incremental delay, so shrinking it 14 → 10 returns roughly the four LUTs the extra full adders cost, and the latency difference is noise. Combinational RA and combinational Dadda are therefore close to equivalent on FPGA; RA separates from Dadda when registers enter the cost function.

> [!note] The schedule is a property of the heap shape, not of multiplication.
> Nothing above uses the fact that the heap came from an AND array. RA runs identically on a heap assembled from a [[Merged Multiply-Accumulate|merged multiply-accumulate]] or a summed polynomial; only the height vector $h_i$ enters.

> [!warning] The book's resource table for this comparison is misprinted
> Table 7.2 (p. 180) gives FA $=0$, HA $=0$, FF $=-80$ for **both** Dadda and RA; only the final-adder lengths, 14 and 10, are usable. The same defect hits the prose on p. 177, which concludes "0 full adders and 0 half adders are necessary for this example" two sentences after describing a half adder in column 6 and a full adder plus a half adder in column 7. The counts in the table above were derived by running both algorithms on the heap, and are cross-checked by the bit invariant: final heap size $=64-\#\mathrm{FA}$, giving $25=64-39$ for RA and $29=64-35$ for Dadda, with the final adder widths 10 and 14 falling out as stated in the book.

> [!warning] "Dadda needs fewer half adders" does not hold on this example
> p. 180 claims the Dadda tree requires fewer full adders **and** half adders. On the $8\times8$ heap the full-adder claim holds (35 vs 39) but the half-adder counts tie at 7: RA's four adder-shortening half adders are offset by Dadda paying three at level 4 to bring columns 6–8 inside $m_3$. Treat "fewer FAs, same order of HAs" as the safe reading.

## When it breaks

- **RA never wins on depth.** $L$ is set by $h_{\max}$ and the $1.5$ factor, so ASAP and ALAP tie at every heap. If latency is the objective and the tree is combinational, this algorithm has nothing to offer.
- **Short heaps.** Rule 1 is inert for $h_i\le2$ and the whole ASAP/ALAP distinction disappears below $h_{\max}=3$; on a two-row heap there is no tree, only the final adder.
- **Once the final adder is split by arrival time**, rule 2b buys less: the early-arriving LSB columns are already assigned to a cheap ripple-carry section (see [[Split Final Adder]]), so deleting four of them saves ripple-carry LUTs, not prefix-adder LUTs.
- **Once the compressor library grows past FA and HA**, the ASAP/ALAP dichotomy is superseded — with generalized parallel counters the schedule becomes a covering problem and is solved by the [[Efficiency-Driven Compression Heuristic|efficiency heuristic]] or by ILP, neither of which reduces to either pole.
- **The register saving assumes a stage after every level.** Book Table 7.2's FF model registers after every full adder, which it flags as "most probably too often"; with fewer, coarser pipeline cuts the $140$-vs-$179$ gap shrinks in proportion to how many boundaries survive.

## RTL (Spade)

The RA schedule on a $4\times4$ heap — heights $1,2,3,4,3,2,1$, $h_{\max}=4=m_2$ so $L=2$ — which reproduces the full algorithm in miniature: 5 FA, 3 HA and a 4-bit final adder, against Dadda's 3 FA, 3 HA and a 6-bit final adder.

```spade
fn ha(a: bool, b: bool) -> (bool, bool) {
    (a != b, a && b)
}

fn fa(a: bool, b: bool, c: bool) -> (bool, bool) {
    ((a != b) != c, (a && b) || (c && (a != b)))
}

entity ra_mult4(x: uint<4>, y: uint<4>) -> uint<8> {
    let a = x.as_bits();
    let b = y.as_bits();

    // level 2: max FAs per column; one HA on column 1, the rightmost 2-bit column
    let (s1, k1) = ha(a[0] && b[1], a[1] && b[0]);
    let (s2, k2) = fa(a[0] && b[2], a[1] && b[1], a[2] && b[0]);
    let (s3, k3) = fa(a[0] && b[3], a[1] && b[2], a[2] && b[1]);
    let (s4, k4) = fa(a[1] && b[3], a[2] && b[2], a[3] && b[1]);

    // level 1: HA on column 2 (rightmost 2-bit column), HA on column 4 (Dadda bound)
    let (s5, k5) = ha(s2, k1);
    let (s6, k6) = fa(s3, a[3] && b[0], k2);
    let (s7, k7) = ha(s4, k3);
    let (s8, k8) = fa(a[2] && b[3], a[3] && b[2], k4);

    // 4-bit final adder over columns 3..6; columns 0..2 are single bits
    let hi: uint<5> = [s6, s7, s8, a[3] && b[3]].as_uint() + [k5, k6, k7, k8].as_uint();
    let lo: uint<3> = [a[0] && b[0], s1, s5].as_uint();
    hi.concat(lo)
}
```

Each `s`$_n$ is a sum staying in its own column and each `k`$_n$ is the carry crossing to the next — one dot each in the diagram. `k1` is produced at level 2 and consumed at level 1, never at level 2, which is the no-carry-propagation-within-a-level rule made syntactic: a carry is simply not in scope as an input to the cell that produced it. Widths: every wire is 1 bit until the final adder, where `uint<4> + uint<4>` widens to `uint<5>` per Spade's growth rule, and `concat` puts it above the three untouched single-bit columns for a `uint<8>` product. The whole entity is combinational — the levels are levels of logic, not clock cycles; pipelining it (which is where RA pays) means registering the named `s`/`k` signals between the two blocks, 13 flip-flops at that one boundary. Synthesis will not preserve the drawn structure: the mapper flattens these `fa`/`ha` calls into LUT6 pairs and pulls the 4-bit final add onto the hard carry chain.

## Related Notes

- [[Dadda Tree]] – compares: the ALAP pole of the same design space; identical stage count, four fewer full adders, four more bits of final adder.
- [[Compressor Trees]] – depends-on: the height-2 target and the $\lfloor 1.5\,m_{l-1}\rfloor$ sequence RA schedules against.
- [[Full Adder]] – depends-on: the $(3;2)$ cell rule 1 places $\lfloor h_i/3\rfloor$ of per column.
- [[Half Adder]] – depends-on: the $(2;2)$ cell rule 2 rations to two situations only.
- [[Pipelined Compressor Tree]] – extends: adds the registers that turn RA's smaller intermediate heaps into the actual win.
- [[Ripple-Carry Adder]] – supports: the 10-bit adder rule 2b leaves behind, and the cost model that makes its width worth shaving.
- [[Split Final Adder]] – counter-example: schedule the adder by bit arrival time instead and rule 2b's four columns are worth much less.
- [[Choosing a Compressor Tree]] – compares: where ASAP sits once GPCs and ILP are on the table.
- [[Bit Heaps]] – depends-on: the column-height representation the whole schedule operates on.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 7.

- $\S$7.3.1 Basic compression algorithms, pp. 176–177 — (7.25) and Table 7.1 (the $m_l$ sequence), Dadda's algorithm and Fig. 7.19.
- $\S$7.3.1.2 Reduced area algorithm, pp. 177–180 — the two RA rules, Fig. 7.20, Table 7.2.
- $\S$7.3.3 Synthesis using arbitrary compressors, p. 193 — pipelined cost of the $(1;1)$ pseudo GPC, 0.5 LUT6.
- $\S$7.3.4 Remarks on the final adder, p. 194 — bit arrival profile of a triangular heap.
