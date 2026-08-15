---
title: Squarer Staircase Tile
description: "A squarer-only staircase tile spanning diagonal and off-diagonal products, covering 15 partial products in 10 LUT5 (5 LUT6) at 1.43 PP/LUT — better than any LUT-based multiplier tile."
kind: circuit
source: "ASA §14.2.5, pp. 447-449"
status: seed
spade: simulated
tags: [digital, squarer, tiling, fpga, lut, squarers-and-integer-powers]
aliases:
  - Staircase Tile
  - Squarer-Specific Tile
  - T1 tile
---

# Squarer Staircase Tile

A tile that exists only in a squarer: a staircase straddling the diagonal of the partial-product array whose covered region is the *folded* form of a complete $5\times5$ sub-array, so it tabulates $X_{\mathrm{lo}}^{2}$ in five fractured LUT6 and beats every rectangular multiplier tile on partial products per LUT.

```tikz title="The T1 staircase tile: 15 partial products on the low five bits, tabulated in five fractured LUT6"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=1.0]
\def\u{0.62}
% ================= PANEL A: the staircase on the partial-product array =================
\node[font=\small\bfseries,anchor=west] at (-0.95,0.95) {T1 on the $x_4\dots x_0$ corner};
% column labels (x4 leftmost ... x0 rightmost)
\foreach \j/\lb in {4/$x_4$, 3/$x_3$, 2/$x_2$, 1/$x_1$, 0/$x_0$}
  {\node[font=\scriptsize] at ({(4-\j)*\u+0.5*\u},0.36) {\lb};}
% row labels
\foreach \i/\lb in {0/$x_0$, 1/$x_1$, 2/$x_2$, 3/$x_3$, 4/$x_4$}
  {\node[font=\scriptsize,anchor=east] at (-0.12,{-\i*\u-0.5*\u}) {\lb};}
% off-diagonal products, kept (j > i)
\foreach \i/\j in {0/1,0/2,0/3,0/4,1/2,1/3,1/4,2/3,2/4,3/4}
  {\fill[blue!32] ({(4-\j)*\u},{-\i*\u}) rectangle ({(4-\j)*\u+\u},{-\i*\u-\u});}
% diagonal bits, free wires (j = i)
\foreach \i in {0,...,4}
  {\fill[red!40] ({(4-\i)*\u},{-\i*\u}) rectangle ({(4-\i)*\u+\u},{-\i*\u-\u});}
% mirror image, folded away (j < i)
\foreach \i/\j in {1/0,2/0,2/1,3/0,3/1,3/2,4/0,4/1,4/2,4/3}
  {\fill[black!7] ({(4-\j)*\u},{-\i*\u}) rectangle ({(4-\j)*\u+\u},{-\i*\u-\u});}
% grid
\foreach \k in {0,...,5}{
  \draw[gray!45] ({\k*\u},0) -- ({\k*\u},{-5*\u});
  \draw[gray!45] (0,{-\k*\u}) -- ({5*\u},{-\k*\u});}
% staircase boundary
\draw[very thick]
  (0,0) -- ({5*\u},0) -- ({5*\u},{-\u}) -- ({4*\u},{-\u}) -- ({4*\u},{-2*\u})
  -- ({3*\u},{-2*\u}) -- ({3*\u},{-3*\u}) -- ({2*\u},{-3*\u}) -- ({2*\u},{-4*\u})
  -- ({\u},{-4*\u}) -- ({\u},{-5*\u}) -- (0,{-5*\u}) -- cycle;
\node[font=\scriptsize,anchor=west] at (-0.95,{-5*\u-0.45})
  {\textcolor{blue!55!black}{$\blacksquare$} $10$ products $x_ix_j$, $j>i$ \quad
   \textcolor{red!60!black}{$\blacksquare$} $5$ diagonal $x_i$};
\node[font=\scriptsize,anchor=west] at (-0.95,{-5*\u-0.90})
  {\textcolor{black!45}{$\blacksquare$} mirror half, folded away by $x_ix_j=x_jx_i$};
\node[font=\scriptsize,anchor=west] at (-0.95,{-5*\u-1.35})
  {tile value $=X_{\mathrm{lo}}^{2}$, \ $X_{\mathrm{lo}}=x_4x_3x_2x_1x_0$ \ ($5$ bits in, $10$ bits out)};

% ================= PANEL B: the LUT6 mapping =================
\begin{scope}[shift={(7.7,0)}]
\node[font=\small\bfseries,anchor=west] at (-0.85,0.95) {T1 is a table, not an array};
% shared 5-bit input bus
\draw[very thick] (-0.60,0.22) -- (-0.60,{-4*0.66-0.5});
\node[font=\scriptsize,anchor=south west] at (-0.62,0.26) {$x_4\dots x_0$ \ ($5$)};
\foreach \k in {0,...,4}{
  \draw[thick,->] (-0.60,{-\k*0.66-0.25}) -- (-0.02,{-\k*0.66-0.25});
  \draw[thick,fill=black!5] (0,{-\k*0.66}) rectangle (1.10,{-\k*0.66-0.5});
  \node[font=\scriptsize] at (0.55,{-\k*0.66-0.25}) {LUT6};}
\foreach \k/\a/\b in {0/$s_1$/$s_0$, 1/$s_3$/$s_2$, 2/$s_5$/$s_4$, 3/$s_7$/$s_6$, 4/$s_9$/$s_8$}{
  \draw[thick,->] (1.10,{-\k*0.66-0.13}) -- (1.52,{-\k*0.66-0.13});
  \draw[thick,->] (1.10,{-\k*0.66-0.37}) -- (1.52,{-\k*0.66-0.37});
  \node[font=\scriptsize,anchor=west] at (1.55,{-\k*0.66-0.13}) {\a};
  \node[font=\scriptsize,anchor=west] at (1.55,{-\k*0.66-0.37}) {\b};}
\node[font=\scriptsize,anchor=west] at (-0.85,{-4*0.66-0.98})
  {each LUT6 fractures into two LUT5 that};
\node[font=\scriptsize,anchor=west] at (-0.85,{-4*0.66-1.42})
  {must share inputs --- here they all do};
\node[font=\scriptsize,anchor=west] at (-0.85,{-4*0.66-1.95})
  {$E=15/(5+10\times 0.55)\approx 1.43$ PP per LUT};
\end{scope}
\end{circuitikz}
\end{document}
```

*Left panel after Fig. 14.4, p. 448 (tile T1, redrawn in isolation); right panel own construction.*

**Read the staircase as a subword square, not as a shape.** In the folded array of [[Folded Array Squarer]] only the region $j\ge i$ survives, so the natural tile boundary near the diagonal is not a rectangle but a step. Take the $k=5$ low bits $X_{\mathrm{lo}}=\sum_{i=0}^{4}2^{i}x_i$. The cells T1 covers are exactly $\{(i,j): 0\le i\le j\le 4\}$ — row $i$ runs from column $4$ down to column $i$ — which is the folded form of the *complete* $5\times5$ sub-array $\{(i,j):0\le i,j\le 4\}$. By the same commutativity-of-AND fold, the value of that sub-array is
$$\sum_{i=0}^{4}\sum_{j=0}^{4}2^{i+j}x_ix_j=\Big(\sum_{i=0}^{4}2^{i}x_i\Big)^{2}=X_{\mathrm{lo}}^{2}.$$
So the staircase is a squarer of the low subword. This is why the book remarks it "could also be drawn as a square covering the upper-right corner" (p. 448) — the staircase and the $5\times5$ square are the same operator, before and after the fold.

**Count the coverage.** The staircase holds $\binom{5}{2}=10$ off-diagonal products $x_ix_j$ ($j>i$) plus $5$ diagonal bits $x_i$, i.e. $\tfrac{5\cdot 6}{2}=15$ partial products — the *area* credited to the tile in the tiling ILP. Its output is $X_{\mathrm{lo}}^{2}\le 31^{2}=961<2^{10}$, so **5 bits in, 10 bits out**, and those 10 bits land in heap columns $0$ through $9$ measured from the tile's own origin.

**The whole tile is one table, and that is the entire trick.** Every one of the 10 output bits is a Boolean function of the *same* 5 inputs $x_4\dots x_0$, so each is one LUT5 ([[Lookup-Tables]]). An AMD LUT6 can be used as two LUT5 **only if the two halves share their inputs** — that is the physical fracturing rule, and a tabulated squarer satisfies it exactly, because there is only one operand. Hence $10$ LUT5 $=5$ LUT6, half what an unfractured mapping would cost. A general $k\times k$ multiplier tile fails this test the moment $2k>6$: its two operands are independent, so a $5\times5$ multiplier table needs 10 inputs and no LUT6 can hold it at all.

**Score it against the multiplier tiles.** The tiling cost model of §8.4.2.1 (p. 228) is a benefit–cost ratio $E_s=\mathrm{area}_s/\mathrm{cost}_s$ with
$$\mathrm{cost}^{\mathrm{LUT}}_s=\#\mathrm{LUT}^{\mathrm{mult}}_s+\#\mathrm{LUT}^{\mathrm{comp}}\cdot w_s,\qquad \#\mathrm{LUT}^{\mathrm{comp}}=0.55,$$
where $w_s$ is the number of bits the tile pushes into the bit heap and $0.55$ LUT/bit is the measured cost of compressing one heap bit on AMD parts. The tile does not get to ignore what it dumps downstream. For T1, $\mathrm{area}=15$, $\#\mathrm{LUT}^{\mathrm{mult}}=5$, $w=10$:
$$E_{\mathrm{T1}}=\frac{15}{5+10\times 0.55}=\frac{15}{10.5}\approx 1.43.$$
The best rectangular tiles in Table 8.3, p. 229 are $E_{3\times3}=9/(6+6\times0.55)\approx0.97$, $E_{2\times3}=6/(3+5\times0.55)\approx1.04$, and the carry-chain Baugh–Wooley $2\times k$ tile at $E\approx1.05$ for $k=6$, rising only to $1.29$ as $k\to\infty$. T1 wins outright, and it wins for a structural reason: it is the only tile whose two operands are the same wires.

**Why the staircase stops at five bits.** Generalise to a $k$-bit staircase: area $\tfrac{k(k+1)}{2}$, output $w=2k$ bits, and — *while the halves still fracture* — $k$ LUT6. Then
$$E(k)=\frac{k(k+1)/2}{k+2k\times0.55}=\frac{k+1}{4.2},$$
monotonically increasing, so you want $k$ as large as the fracturing rule allows. Fracturing needs $\le 5$ shared inputs, so $k=5$ is the ceiling and $E(5)=6/4.2\approx1.43$. At $k=6$ each of the 12 output bits is a 6-input function and consumes a whole LUT6, giving $21/(12+12\times0.55)\approx1.13$ — a step *down*. The tile is not five bits wide by taste; it is five bits wide because that is where the LUT6 fracture line sits.

**Placement is constrained to the diagonal.** A staircase is only expressible where the fold applies, so the ILP of [[Multiplier Tiling]] extends to squarers by adding one constraint: squarer-specific tiles must lie on the diagonal, and only the on-and-above-diagonal region must be covered ([[Squarer Tiling]]). Off the diagonal, a tile's mirror image exists and one physical multiplier realises both copies with its output shifted left by 1 bit — the tile-granularity version of the $2^{i+j+1}$ weight bump. **A diagonal tile has no mirror, so its output is emitted once, unshifted.** Getting that shift wrong on a diagonal tile double-counts the whole square.

> [!note] Two of the ten heap bits are free, and the book's count does not take them
> Squares are $0$ or $1$ modulo $4$, so bit $1$ of $X_{\mathrm{lo}}^{2}$ is identically zero and bit $0$ is just $x_0$ — a wire. A hand-optimised tile therefore emits $8$ heap bits from $8$ LUT5 $=4$ LUT6, giving $15/(4+8\times0.55)\approx1.79$. The $1.43$ figure is the uniform table-cost accounting the tile library uses; the exhaustive simulation below checks both facts over all 32 inputs.

**On ASIC none of this applies.** The staircase is a LUT-mapping artefact. Without a fracturable 6-input table there is no reason to group these 15 products at all — the ASIC route is the flat algebraic construction of [[Folded Array Squarer]] straight into a bit heap. The DSP route sits between the two: because T1 is a square, a [[DSP Blocks|DSP block]] can compute it, but only in a square configuration $w_X=w_Y$, which wastes the block's rectangular $18\times27$ shape.

$$\boxed{\ E(k)=\frac{k+1}{4.2}\ \ (k\le 5),\qquad E_{\mathrm{T1}}=\frac{15}{5+10\times 0.55}\approx 1.43\ \text{PP/LUT}\ }$$

**When it breaks.**

- $k>5$ loses LUT6 fracturing and efficiency collapses from $1.43$ to $\approx1.13$; there is no larger staircase worth building out of LUTs.
- Only on the diagonal. Displace the staircase and it is an ordinary rectangular tile with an awkward shape, and its mirror must be accounted for.
- $0.55$ LUT/bit is an average measured across AMD compressor trees (Sect. 7.4), not an exact cost. When the tile's bits land in already-short heap columns the true marginal cost is lower and T1 looks even better; in a heap dominated by DSP outputs it is closer to noise.
- In a truncated squarer ([[Truncated Squarer]]) the low columns may be discarded outright, in which case part of T1 — which sits at the *low* end of the array — is never built, and the tile must be re-scored against the surviving area.
- At $n\le 5$ the tile *is* the whole squarer; the tiling problem is empty and you should simply tabulate ([[Choosing a Squarer]]).

> [!warning] Not covered in the source — needs outside research
> The $k=5$ ceiling is an AMD LUT6 property. Intel/Altera ALMs fracture differently (a shared-input adaptive LUT with two outputs and up to 8 distinct inputs), so the optimal staircase width and its efficiency on Intel parts are not derivable from anything in this chapter. The book gives no Intel figure for T1, and no measured LUT count or delay for a complete tiled squarer.

**RTL (Spade).**

```spade
/// One squarer staircase tile: the exact square of a K-bit subword of X.
/// All 2K output bits are functions of the same K inputs, so the tile is a
/// table of 2K LUT-K. On AMD, K <= 5 lets those pair into K fractured LUT6.
fn staircase_tile<#uint K>(x: uint<K>) -> uint<{2 * K}> {
    x * x
}

/// Fig. 14.4's T1: covers the 15 partial products x_i x_j, 0 <= i <= j <= 4,
/// and emits 10 bits into the heap.
entity t1(x: uint<5>) -> uint<10> {
    staircase_tile::<5>(x)
}
```

`x` is the shared 5-bit bus of the right panel; the `uint<10>` result is $s_9\dots s_0$, the ten heap bits, purely combinational. Writing `x * x` rather than `x * y` is the whole content of the note — one operand, so `*`'s $K\to 2K$ width growth is the tile's 5-in/10-out shape, and synthesis maps the ten single-output functions of five shared inputs onto five fractured LUT6 without being told to. What synthesis will *not* do from the drawing is the fold: the staircase in the left panel is a picture of what a general multiplier would have had to build, not of any gate that exists after mapping.

**Related Notes.**

- [[Folded Array Squarer]] – depends-on: supplies the $x_ix_j=x_jx_i$ fold that makes the covered region a staircase in the first place.
- [[Squarer Tiling]] – extends: places this tile, with the ILP constraint that squarer-specific tiles lie on the diagonal.
- [[Multiplier Tiling]] – compares: the general tiling problem and the $E_s=\mathrm{area}/\mathrm{cost}$ metric this tile is scored with.
- [[Lookup-Tables]] – depends-on: the LUT6-fractures-into-two-LUT5-with-shared-inputs rule is the entire reason $k=5$.
- [[DSP Blocks]] – counter-example: the same tile drawn as a square runs on a DSP, but only in the wasteful $w_X=w_Y$ configuration.
- [[Diagonal-Straddling Squarer Tile]] – compares: the other way to cross the diagonal, paying a double-covered square instead of an irregular shape.
- [[High-Radix Squarer]] – compares: the all-tiles-square special case, where every tile is a subword squarer and none is a staircase.
- [[Truncated Squarer]] – compares: decides whether this tile's low columns are built at all.
- [[Choosing a Squarer]] – compares: where a tiled FPGA squarer sits against the algebraic and DSP routes.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.2.5 Squarer-Specific Tiling for FPGAs — tiles M0/M1/S1/T1, Fig. 14.4, the $15/(5+10\times0.55)\approx1.43$ figure and the DSP-square remark, pp. 447–449
- §8.4.2.1 Efficiency Metric — eq. (8.40), $\#\mathrm{LUT}^{\mathrm{comp}}=0.55$ LUT/bit, p. 228
- §8.4.2.2 LUT-Based Sub-multipliers — $E_{3\times3}\approx0.97$, $E_{2\times3}\approx1.04$, $2\times k$ carry-chain tile $E\approx1.05\!\to\!1.29$, Table 8.3, pp. 228–231
- §14.2.1 Basics — eq. (14.1), the fold this tile inherits, pp. 444–445
- [BKD22] Böttcher, Kumm & de Dinechin, *Resource Optimal Squarers for FPGAs*, FPL 2022
