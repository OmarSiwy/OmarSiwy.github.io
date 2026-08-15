---
title: Squarer Tiling
description: "Covers only the on-and-above-diagonal region of the square with heterogeneous tiles, with each mirrored tile pair realised by one physical multiplier shifted left by 1; an ILP picks the cover (53-bit square in 4 DSPs)."
kind: circuit
source: "ASA §14.2.5, pp. 447-449"
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, fpga, dsp, tiling, ilp]
aliases:
  - Squarer Tiling
  - Squarer-Specific Tiling
  - Squarer-Specific Tiling for FPGAs
  - Tiled Squarer
  - Tiling a Squarer
---

# Squarer Tiling

A squarer tiling covers only the on-and-above-diagonal half of the partial-product square with heterogeneous DSP and LUT tiles, and — unlike a multiplier tiling — every off-diagonal tile is *shared* with its mirror image, so one physical multiplier serves two tiles at the cost of a one-bit shift.

```tikz title="Tiling a 12-bit squarer: only the region on and above the diagonal is covered, and mirrored tiles share one multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=0.46]
% ---- partial-product square, cell (c,r) = x_{11-c} * x_r ----
% strictly above the anti-diagonal: c+r < 11 -- the only region a tiling must cover
\foreach \r in {0,...,10}{%
  \pgfmathtruncatemacro{\cmax}{10-\r}%
  \foreach \c in {0,...,\cmax}{\fill[blue!20] (\c,-\r) rectangle ++(1,-1);}}
% the diagonal itself: c+r = 11, free wires x_i
\foreach \r in {0,...,11}{%
  \pgfmathtruncatemacro{\cd}{11-\r}%
  \fill[red!35] (\cd,-\r) rectangle ++(1,-1);}
% grid
\foreach \c in {0,...,12}{\draw[gray!45] (\c,0) -- (\c,-12);}
\foreach \r in {0,...,12}{\draw[gray!45] (0,-\r) -- (12,-\r);}
% axis labels
\foreach \c in {0,...,11}{%
  \pgfmathtruncatemacro{\lab}{11-\c}%
  \node[font=\tiny] at (\c+0.5,0.4) {$x_{\lab}$};}
\foreach \r in {0,...,11}{\node[font=\tiny] at (12.55,-\r-0.5) {$x_{\r}$};}
% ---- tiles ----
% M0 : cols x11..x9 (c=0..2) x rows x0,x1 (r=0..1) -- 6 disjoint inputs
\draw[very thick] (0,0) rectangle (3,-2);
\node[font=\scriptsize\bfseries] at (1.5,-1) {M0};
% M0 mirror : cols x1,x0 (c=10..11) x rows x9..x11 (r=9..11)
\draw[very thick,gray!65] (10,-9) rectangle (12,-12);
\node[font=\scriptsize\bfseries,gray!65] at (11,-10.5) {M0$'$};
% M1 : cols x10..x7 (c=1..4) x rows x5..x8 (r=5..8) -- shares x7,x8 between axes
\draw[very thick] (1,-5) rectangle (5,-9);
\node[font=\scriptsize\bfseries] at (2,-6) {M1};
% M1 mirror : cols x8..x5 (c=3..6) x rows x7..x10 (r=7..10)
\draw[very thick,gray!65] (3,-7) rectangle (7,-11);
\node[font=\scriptsize\bfseries,gray!65] at (6.2,-10.4) {M1$'$};
% S1 : the {x7,x8} x {x7,x8} block inside both M1 and M1'
\fill[orange!60] (3,-7) rectangle (5,-9);
\draw[very thick] (3,-7) rectangle (5,-9);
\node[font=\scriptsize\bfseries] at (4,-8) {S1};
% T1 : squarer-specific staircase, 15 partial products hugging the diagonal
\draw[very thick,dashed]
  (7,0) -- (12,0) -- (12,-1) -- (11,-1) -- (11,-2) -- (10,-2) -- (10,-3)
  -- (9,-3) -- (9,-4) -- (8,-4) -- (8,-5) -- (7,-5) -- cycle;
\node[font=\scriptsize\bfseries] at (8.0,-0.5) {T1};
% ---- fold annotation, kept clear of the array ----
\draw[<->,very thick,black!70]
  (2.6,-1.55) .. controls (8.0,-3.0) and (10.5,-5.0) .. (10.9,-8.85);
\node[font=\scriptsize,anchor=west,align=left] at (13.6,-4.6)
  {one \emph{physical} multiplier\\ realises M0 and M0$'$;\\
   its output enters the\\ heap shifted left by $1$};
\node[font=\scriptsize,anchor=west,align=left] at (13.6,-8.4)
  {S1 lies in M1 \emph{and} in M1$'$:\\ computed twice, so it is\\
   recomputed and subtracted};
% ---- legend ----
\node[font=\scriptsize,anchor=west] at (0,-13.2)
  {$X=\sum_{i=0}^{11}2^{i}x_i$; cell $(c,r)=x_{11-c}x_r$ enters the heap at weight $2^{(11-c)+r}$};
\fill[blue!20] (0,-14.3) rectangle ++(0.8,-0.8);
\draw[gray!45] (0,-14.3) rectangle ++(0.8,-0.8);
\node[font=\scriptsize,anchor=west] at (1.0,-14.7)
  {off-diagonal $x_ix_j$, $i>j$ -- must be covered, at doubled weight};
\fill[red!35] (0,-15.4) rectangle ++(0.8,-0.8);
\draw[gray!45] (0,-15.4) rectangle ++(0.8,-0.8);
\node[font=\scriptsize,anchor=west] at (1.0,-15.8) {diagonal $x_ix_i=x_i$ -- a wire, but still inside a tile};
\fill[orange!60] (0,-16.5) rectangle ++(0.8,-0.8);
\draw[gray!45] (0,-16.5) rectangle ++(0.8,-0.8);
\node[font=\scriptsize,anchor=west] at (1.0,-16.9) {double-covered, subtracted once};
\draw[gray!45] (0,-17.6) rectangle ++(0.8,-0.8);
\node[font=\scriptsize,anchor=west] at (1.0,-18.0) {$i<j$ -- folded away, never built};
\end{circuitikz}
\end{document}
```

*After Fig. 14.4, p. 448. Tile extents are placed so the geometry is self-checking: M1 spans columns $x_{10..7}$ and rows $x_{5..8}$, sharing exactly $x_7,x_8$ between its two axes, which is what makes S1 a $2\times 2$ block sitting astride the diagonal and M1 a function of only 6 input bits.*

**Fix what a tile is before folding anything.** A tiling ([[Multiplier Tiling]]) treats the $n\times n$ partial-product array of an $n$-bit input as a region of the integer plane and covers it with *tiles*, each tile being one sub-rectangle $I\times J$ that some hard resource computes in one shot: a DSP block for large $|I|\times|J|$, a LUT-based multiplier or a table for small ones ([[DSP Blocks]], [[Lookup-Tables]]). A tile $T=I\times J$ contributes the product of two extracted subwords,
$$\mathrm{val}(T)=\Big(\sum_{i\in I}2^{\,i-\min I}x_i\Big)\Big(\sum_{j\in J}2^{\,j-\min J}x_j\Big),$$
which is $|I|+|J|$ bits wide and enters the bit heap ([[Sums of Weighted Bits]]) at weight $2^{w_T}$ with $w_T=\min I+\min J$. Choosing the cover is the whole design problem; everything below is what changes when the two operands are the same $n$-bit signal $X$.

**Halve the region before you spend a single tile on it.** By commutativity of AND, $x_ix_j=x_jx_i$, and both sit at weight $2^{i+j}$, so the array is symmetric about its diagonal and only $\{(i,j):i\ge j\}$ — $n(n+1)/2$ of the $n^2$ cells — has to be covered at all ([[Folded Array Squarer]] derives the fold at bit level as eq. 14.1). This is a strictly stronger statement than "the squarer is half a multiplier": it changes the *shape* of the covering problem from a square to a triangle, and a triangle is not efficiently covered by the rectangles a multiplier tile library offers. That mismatch is why the squarer needs tile shapes of its own near the diagonal, and why the optimum is not just the multiplier tiling with half the tiles deleted.

**A tile that avoids the diagonal is bought once and used twice.** Take a tile $T=I\times J$ with $I\cap J=\varnothing$ and $\min I>\max J$, so $T$ lies strictly above the diagonal — M0 in the diagram, with $I=\{9,10,11\}$, $J=\{0,1\}$, a $3\times 2$ multiplier of 6 distinct input bits. Its mirror $T'=J\times I$ lies strictly below and, again by commutativity, satisfies $\mathrm{val}(T')=\mathrm{val}(T)$ at the same weight $w_{T'}=w_T$. The two are therefore not two multipliers but *one multiplier and one factor of two*, and multiplication by two is a choice of heap column, not hardware ([[Multiplication by Constants]]): the single physical product is dropped in at weight $2^{w_T+1}$. Nothing is added to the critical path — the shift is wiring.

**The same fold at subword granularity is the high-radix square.** Splitting $X=2^kX_1+X_0$ into $k$-bit subwords is exactly the tiling in which every tile is a $k\times k$ square, and the shared cross term is visible in the algebra: $X^2=2^{2k}X_1^2+2\cdot 2^kX_1X_0+X_0^2$ needs 3 DSPs where a general multiplier needs 4 ([[High-Radix Squarer]]). On AMD devices the $\times 2$ is better applied to the *operand* than to the product, $2^{17}(2X_1)X_0$, because the DSP has a spare input bit and its cascade path is shifted by a fixed 17 — see [[DSP-Cascade Squarer]] for why that rewriting is what makes the cascade usable at all, and why it caps $X$ at 33 bits.

**Let a tile cross the diagonal and you must subtract the overlap.** M1 is placed deliberately across the diagonal so that a large DSP covers a large area. Its mirror M1$'$ then overlaps it in the square block $S1=(I\cap J)\times(I\cap J)$ — here $\{7,8\}\times\{7,8\}$ — which is consequently accumulated **twice**. Correctness demands that $\mathrm{val}(S1)$ be recomputed separately and subtracted, a negative entry in the bit heap ([[Diagonal-Straddling Squarer Tile]] takes the accounting apart). The compensation is only worth it when the straddling tile is a DSP whose alternative is several LUT tiles; note also that sharing bits between the axes *reduces* the tile's input count — M1 reads $x_5\ldots x_{10}$, six bits, so it is a 6-input Boolean function and could equally be one LUT6.

**Near the diagonal, use a tile shape a multiplier never needs.** The staircase T1 hugs the diagonal, mixing diagonal wires with off-diagonal products, and covers 15 partial products in 5 LUT6 fractured into 10 LUT5 — $15/(5+10\times 0.55)\approx 1.43$ partial products per LUT, better than any LUT-based multiplier tile in Table 8.3, p. 229 ([[Squarer Staircase Tile]]). Redrawn as a square on the upper-right corner it is instead computable by one DSP in square configuration $w_X=w_Y$, which is how the 53-bit example spends its fourth DSP.

**The cover is chosen by integer linear programming, not by hand.** The multiplier tiling ILP of Chap. 8 ([[ILP for Arithmetic Design]]) carries over with two modifications: the coverage constraints are imposed only on the upper-left region, and squarer-specific tiles are constrained to lie along the diagonal. The result for the canonical case — the 53-bit significand squarer of a double-precision floating-point square — is a tiling with **4 DSP blocks** (Fig. 14.5, p. 449), and its irregularity is the argument for the ILP: the optimum contains a rectangular tile straddling the diagonal, a square DSP tile in the corner, and LUT tiles filling the ragged edge, which is not a pattern anyone reaches by inspection. `flopoco IntSquarer wIn=8 method=optimal` builds it, and needs FloPoCo linked against a real ILP solver ([[FloPoCo]]).

**Tiling is an FPGA statement and does not transfer to ASIC.** A tile exists because the fabric offers an indivisible resource of a fixed shape; on ASIC there is no DSP48, so the right decomposition is the algebraic one of eq. (14.1) straight into a compressor tree, and the discrete covering problem disappears. The same is true of the truncated case: on FPGA, truncation removes columns from the region to be covered *before* the ILP runs, which changes the optimal cover, not merely its cost ([[Truncated Squarer]]).

$$\boxed{\;X^{2}=\sum_{T\in\mathcal{T}_{\mathrm{off}}}2^{\,w_T+1}\,\mathrm{val}(T)\;+\sum_{T\in\mathcal{T}_{\mathrm{diag}}}2^{\,w_T}\,\mathrm{val}(T)\;-\sum_{S\in\mathcal{S}}2^{\,w_S}\,\mathrm{val}(S)\;}$$

with $\mathcal{T}_{\mathrm{off}}$ the tiles strictly above the diagonal (each realised once, weighted twice), $\mathcal{T}_{\mathrm{diag}}$ those meeting it, and $\mathcal{S}$ the blocks double-covered by a straddling tile and its mirror.

**When it breaks.**

- **Small $n$.** Below roughly one DSP's worth of area there is nothing to cover: the plain folded array of eq. (14.1) wins, and under 8 bits a single table beats both.
- **The overlap correction is not free.** $S1$ costs its own hardware plus a subtraction in the heap; a straddling tile only pays when the DSP it enables would otherwise be replaced by several LUT tiles.
- **The $\times 2$ is free only in the heap.** Applying it to the DSP *input* instead needs a spare input bit, which exists only while the subword is narrow enough — 16 bits for AMD's 17-bit cascade, i.e. $|X|\le 33$.
- **The diagonal is not a wire once it is inside a tile.** $x_ix_i=x_i$ saves a gate only where the diagonal is left uncovered; a tile that swallows diagonal cells pays for them like any other partial product.
- **ILP runtime.** The formulation is combinatorial and the book calls the problem "far from being trivial"; it is a design-time cost, but it is the reason hand-tiling survives at small widths.
- **Signed inputs.** The whole construction is written for an unsigned $X$; a signed square is unsigned by parity, but the tile-level sign handling is inherited from the multiplier tiling, not simplified by it ([[Number Formats]]).

> [!warning] Not covered in the source — needs outside research
> The book gives 4 DSPs for the 53-bit *squarer* but no DSP count for the ILP-optimal 53×53 *multiplier* tiling in the same technology, so the headline saving of squarer-specific tiling at that width cannot be quoted as a ratio from this chapter alone.

```spade
// One radix-2^k tiling step: two diagonal square tiles and ONE physical
// multiplier standing in for the mirrored off-diagonal pair.
fn sqr_tiled2(x: uint<8>) -> uint<16> {
    let b = x.as_bits();
    let l = b[0..4].as_uint();          // uint<4>, low subword  L
    let h = b[4..8].as_uint();          // uint<4>, high subword H

    let ll: uint<16> = zext(l * l);     // diagonal tile L^2, weight 2^0
    let hh: uint<16> = zext(h * h);     // diagonal tile H^2, weight 2^8
    let hl: uint<16> = zext(h * l);     // the shared multiplier: covers HL and LH

    ll +. ((hl << 4) << 1) +. (hh << 8) // <<4 = tile weight 2^k, <<1 = the fold
}
```

`h` and `l` are the two subword operands read off the horizontal and vertical axes; `hl` is the single physical multiplier that stands for both mirrored tiles, and the two shifts are deliberately written apart — `<< 4` is the tile's own weight $2^k$, `<< 1` is the mirror fold, and only the second one is squarer-specific. Widths: $4\times 4\to 8$ bits per product, zero-extended to the 16-bit accumulation width so the truncating adds `+.` do not grow, with $255^2=65025<2^{16}$ so nothing wraps. It is purely combinational. Synthesis will not build what the drawing shows: the shifts vanish into routing, and the three products plus two additions become three DSP48s and one compressor tree feeding a single carry-propagate adder, not two chained ripple adders.

**Related Notes**

- [[Multiplier Tiling]] – depends-on: supplies the tile library, the covering formulation and the efficiency metric this note restricts to a triangle.
- [[Folded Array Squarer]] – depends-on: proves at bit level the symmetry that lets a tiling ignore half the array.
- [[High-Radix Squarer]] – compares: the special case in which every tile is a $k\times k$ square, done algebraically instead of by search.
- [[DSP-Cascade Squarer]] – extends: moves the shared multiplier's $\times 2$ onto the DSP input so the 17-bit cascade path can be used.
- [[Diagonal-Straddling Squarer Tile]] – extends: the M1/S1 case, where crossing the diagonal buys DSP area and owes a subtraction.
- [[Squarer Staircase Tile]] – extends: the squarer-only tile shape that covers the diagonal region no rectangle covers well.
- [[DSP Blocks]] – depends-on: the fixed-shape resource whose granularity is the reason tiles exist.
- [[ILP for Arithmetic Design]] – supports: solves the cover, with the region and diagonal constraints modified for squarers.
- [[FloPoCo]] – supports: `IntSquarer method=optimal` generates the tiling-based operator.
- [[Truncated Squarer]] – compares: truncation reshapes the region before the cover is chosen.
- [[Choosing a Squarer]] – compares: where tiling sits against every sibling construction.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.2.5 *Squarer-Specific Tiling for FPGAs* — tiles M0, M1, S1, T1; Fig. 14.4, p. 448; Fig. 14.5, the 53-bit squarer in 4 DSPs, p. 449; ILP extension and FloPoCo usage, p. 449
- §14.2.1 *Basics* — eq. (14.1), the fold that defines the region to cover, pp. 444–445
- §14.2.2 *High-Radix Square* — eqs. (14.2)–(14.4), the 4→3 DSP saving and the 17-bit cascade shift, pp. 445–446
- §8, Table 8.3, p. 229 — LUT-based multiplier tile efficiencies, the baseline T1 is measured against
- [BKD22] Böttcher, Kumm & de Dinechin, *Resource Optimal Squarers for FPGAs*, FPL 2022
