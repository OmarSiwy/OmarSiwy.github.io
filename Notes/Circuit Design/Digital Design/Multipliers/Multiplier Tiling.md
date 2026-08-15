---
title: Multiplier Tiling
description: "Builds a large multiplier by covering the w_X x w_Y partial-product rectangle with sub-multipliers exactly once; each tile's output is shifted by its least-significant corner and dropped into the compressor tree."
kind: circuit
source: "ASA §8.4.2, pp. 226-229"
status: seed
spade: simulated
tags: [digital, multipliers, fpga, dsp, tiling, partial-products]
aliases:
  - Tiling
  - Tiling Problem
  - Multiplier Construction as a Tiling Problem
  - Sub-Multiplier Tiling
  - Multiplier Tile
  - Tiles
---

# Multiplier Tiling

A geometric construction method: cover the rectangle of partial products with sub-multipliers of any available shape, each covering its region *exactly once*, and the only thing left to decide is what shift each sub-product gets.

```tikz title="A 5x5 multiplier tiled with four 2x3 sub-multipliers and one 1x1, and the alignment of their outputs"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.56cm,y=0.56cm,font=\small]
  % ================= (a) tiling view of the 5x5 rectangle =================
  \fill[black!10] (0,0) rectangle (2,-3);      % M3
  \fill[black!10] (2,-2) rectangle (3,-3);     % M4
  \fill[black!10] (0,-3) rectangle (3,-5);     % M2
  \draw[black!35,step=1] (0,-5) grid (5,0);
  \draw[very thick] (0,0) rectangle (2,-3);
  \draw[very thick] (2,0) rectangle (5,-2);
  \draw[very thick] (2,-2) rectangle (3,-3);
  \draw[very thick] (0,-3) rectangle (3,-5);
  \draw[very thick] (3,-2) rectangle (5,-5);
  \node[fill=white,inner sep=1pt] at (1,-1.5)  {$M_3$};
  \node[fill=white,inner sep=1pt] at (3.5,-1)  {$M_0$};
  \node[fill=white,inner sep=0.5pt,font=\tiny] at (2.5,-2.5) {$M_4$};
  \node[fill=white,inner sep=1pt] at (1.5,-4)  {$M_2$};
  \node[fill=white,inner sep=1pt] at (4,-3.5)  {$M_1$};
  % LSB corner of every tile: smallest x+y, upper right in this orientation
  \foreach \px/\py in {2/0, 5/0, 3/-2, 3/-3, 5/-2} \fill (\px,\py) circle (1.7pt);
  \foreach \c/\lab in {0/4,1/3,2/2,3/1,4/0}
    \node[font=\scriptsize] at (\c+0.5,0.5) {$x_\lab$};
  \foreach \r in {0,1,2,3,4}
    \node[font=\scriptsize] at (5.55,-\r-0.5) {$y_\r$};
  \node[font=\scriptsize] at (2.5,-6.1) {(a) tiling: four $2{\times}3$ tiles $+$ one $1{\times}1$};
  \node[font=\scriptsize] at (2.5,-6.9) {$w_X=5$ bits of $X$, $w_Y=5$ bits of $Y$};
  \fill (0.6,-7.7) circle (1.7pt);
  \node[font=\scriptsize,anchor=west] at (0.8,-7.7) {LSB corner $(x,y)$: weight $2^{x+y}$};

  % ================= (b) sub-product alignment =================
  \begin{scope}[xshift=7.9cm]
    % bit b sits at local x = 9-b .. 10-b ; p9 leftmost, p0 rightmost
    \foreach \k/\name/\lo/\hi in {0/M_0/0/4, 1/M_1/2/6, 2/M_2/5/9, 3/M_3/3/7, 4/M_4/4/4}{
      \draw[fill=black!10,thick] ({9-\hi},{-0.95*\k-0.15}) rectangle ({10-\lo},{-0.95*\k-0.85});
      \node[font=\scriptsize] at ({9.5-(\lo+\hi)/2},{-0.95*\k-0.5}) {$\name$};
      \node[font=\scriptsize,anchor=east] at (-0.25,{-0.95*\k-0.5}) {$\ll\ \lo$};
    }
    \draw (-0.1,-4.95) -- (10.1,-4.95);
    \foreach \b in {0,...,9}
      \node[font=\scriptsize] at ({9.5-\b},-5.45) {$p_\b$};
    \node[font=\scriptsize] at (5,-6.1) {(b) sub-products dropped into the bit heap};
    \node[font=\scriptsize] at (5,-6.9) {$w_P=w_X+w_Y=10$ bits after compression};
    \node[font=\scriptsize] at (5,-7.7) {$M_0$: $5$ output bits, $M_4$: $1$; total heap $21$ bits};
  \end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 8.14, p. 227.*

**Start from the rectangle, because that is the only object a heterogeneous FPGA can be asked to cover.** The [[Unsigned Array Multiplier|schoolbook expansion]] of $P=X\times Y$ on $w_X$ and $w_Y$ unsigned bits is the double sum $\sum_{i}\sum_{j}2^{i+j}x_iy_j$, which draws as a $w_X\times w_Y$ rectangle of binary partial products, one $1\times1$ multiplication per cell (Fig. 8.13, p. 226). A **tile** is any $m\times n$ sub-rectangle of that grid. What a tile *contains* is the weighted sum of the partial products inside it — and the point of the whole method is that this sum is itself a multiplication, computable by a smaller $m\times n$ multiplier of any implementation you like (p. 227). Then building a $w_X\times w_Y$ multiplier means choosing a set of tiles whose shapes exist as hardware and whose union covers the rectangle.

**One substitution turns the geometry into arithmetic and hands you both the operands and the shift.** Take the tile occupying columns $i\in[a,a+m)$ and rows $j\in[b,b+n)$. Substituting $i=a+i'$, $j=b+j'$ and pulling the constant $2^{a+b}$ out of the sum by **distributivity of $\times$ over $+$**:

$$\sum_{i=a}^{a+m-1}\ \sum_{j=b}^{b+n-1}2^{i+j}x_iy_j\;=\;2^{a+b}\sum_{i'=0}^{m-1}\sum_{j'=0}^{n-1}2^{i'+j'}x_{a+i'}y_{b+j'}\;=\;2^{a+b}\underbrace{\left(\sum_{i'=0}^{m-1}2^{i'}x_{a+i'}\right)}_{X_a:\ m\ \text{bits}}\underbrace{\left(\sum_{j'=0}^{n-1}2^{j'}y_{b+j'}\right)}_{Y_b:\ n\ \text{bits}}$$

the last step being distributivity read backwards, refactoring the double sum into a product. Two facts fall out at once, and neither needs to be looked up. First, **a tile's operands are the projections of its extent onto the two axes** — the contiguous bit slices $X_a=x_{a+m-1}\ldots x_a$ on $m$ bits and $Y_b=y_{b+n-1}\ldots y_b$ on $n$ bits, read straight off the drawing. In the diagram, $M_2$ spans columns $x_4x_3x_2$ and rows $y_4y_3$, so it is the $3\times2$ product $x_4x_3x_2\times y_4y_3$. Second, **a tile's weight is $2^{a+b}$**, where $(a,b)$ is its corner of smallest $x+y$ — the position of the single partial product that becomes the LSB of the sub-product. So a tile placed at $(x,y)$ contributes its $m+n$ output bits shifted left by $x+y$, and nothing else about its position matters (p. 227). $M_2$ sits at $(2,3)$ and is shifted by $5$; $M_0$ at $(0,0)$ is not shifted at all.

> [!warning] Source inconsistency, p. 227
> The book states that the LSB of $M_2$ is "the partial product $x_3y_2$" one paragraph before stating that $M_2$'s operands are $x_4x_3x_2$ and $y_4y_3$. Those two sentences disagree: with those operand ranges the minimal-index corner is $x_2y_3$. The stated weight $2^{3+2}=2^5$ is correct either way, so nothing downstream is affected — but the indices are transposed. Figure 8.14 uses the convention $p_{ij}=y_ix_j$, which is the likely origin of the swap.

**Beware the drawing orientation before you trust the phrase "upper right".** Figure 8.14 draws $x$ *decreasing* left to right and $y$ *increasing downward*, so that the whole picture reads like a paper-and-pencil multiplication with the LSB at the right. Under that convention the minimal-$x{+}y$ corner appears at the **upper right** of each tile, which is how the book words it. Plotted in the usual mathematical orientation the same corner is at the lower left. The invariant that survives both drawings is the arithmetic one: the tile's weight is $2^{\min(x)+\min(y)}$ over the positions it covers.

> [!important] "Exactly once" is an identity, not a drawing convention
> Coverage is mandatory and overlap is forbidden (p. 227), and both halves are consequences of the double sum containing each term $2^{i+j}x_iy_j$ precisely once. A gap silently drops a term; an overlap silently doubles one. Neither is a width error, neither shows up in a type check, and neither is visible in the output word — the multiplier just returns a wrong number for some inputs. This is why the tiling constraint in the ILP formulation of §8.4.3 is written as an equality $=1$ rather than $\ge1$.

**Tiles may hang outside the rectangle, and that is a feature.** A tile that overhangs an edge is a sub-multiplier whose input bits are **zero-padded** in that dimension (p. 228): a $24\times17$ DSP dropped on the corner of a $20\times20$ multiplier simply has four of its $X$ bits and three of its $Y$ bits tied to $0$. Nothing is computed incorrectly, because the missing $x_i$ are genuinely $0$ and contribute nothing to the sum. What it costs is efficiency, since the hardware is charged in full while only part of its area does work. The optimal tiling of a $53\times53$ multiplier with $8$ DSPs is an irregular windmill with tiles hanging off the edges (Fig. 8.19, p. 236) — no human would have guessed it, which is the argument for solving the tiling problem rather than hand-drawing it.

**Signedness is a property of a tile's position, not of the multiplier.** In a signed multiplication only the operand bit $x_{w_X-1}$ carries negative weight, so only the tiles **touching that argument's MSB column** are signed in the $x$ dimension; likewise for $y$ (p. 228). Everything in the interior of the rectangle is an ordinary unsigned $\times$ unsigned sub-multiplier. Reading the diagram as signed: $M_2$ touches both MSBs and must be signed $\times$ signed, $M_1$ and $M_3$ touch exactly one and are signed $\times$ unsigned or unsigned $\times$ signed, and $M_0$ and $M_4$ stay fully unsigned. At most $w_X+w_Y-1$ tiles out of the whole tiling are ever affected. This is what makes the signed case cheap here and expensive in a flat array, where every row needs [[Baugh-Wooley Multiplier|sign extension]].

**Charge every tile for the compression it causes, or the cost model lies.** Comparing candidate shapes needs a benefit-cost ratio; the benefit is the tile's **area**, its bit count $m\cdot n$, which measures how much multiplication work it retires (eq. 8.39, p. 228):

$$E_s=\frac{\mathrm{area}_s}{\mathrm{cost}_s},\qquad \mathrm{cost}^\mathrm{LUT}_s=\#\mathrm{LUT}^\mathrm{mult}_s+\#\mathrm{LUT}^\mathrm{comp}\cdot w_s,\qquad \#\mathrm{LUT}^\mathrm{comp}=0.55\ \text{LUT/bit (AMD)}$$

The second term is the one people forget. A tile does not only cost the logic that builds it; its $w_s$ output bits land in the [[Compressor Trees|compressor tree]] and cost LUTs there too. That number cannot be exact — compression cost depends on everything else on the heap — but §7.4 shows LUT count growing near-linearly in heap bits, so $0.55$ LUT/bit is a usable linear charge (p. 229). The metric is what ranks the tile library: a bare AND gate as a $1\times1$ tile scores $1/(1+0.55)=0.65$, the worst shape available, while a $2\times3$ scores $6/(3+5\cdot0.55)=1.04$ and a $24\times17$ DSP scores $408/22.55=18.13$ against LUTs (Table 8.3, p. 229). The full library and the reasoning behind each shape live in [[LUT-Based Multiplier Tiles]], [[Carry-Chain Multiplier Tile]] and [[DSP Super-Tile]]; the $1\times1$ exists solely so that a legal tiling always exists.

**The tiling replaces one stage of the multiplier flow and leaves the rest untouched.** Partial-product generation, compression, final addition: tiling is a way of doing the *first* stage with heterogeneous resources, and its output is still just a [[Bit Heaps|bit heap]] — one $m+n$-bit word per tile, at weight $2^{x+y}$, instead of $w_Xw_Y$ single bits at weight $2^{i+j}$ (p. 228). The heap gets *shorter*: the diagram's $5\times5$ array of $25$ loose bits becomes $21$ bits in five words, which is precisely the saving the $\#\mathrm{LUT}^\mathrm{comp}\cdot w_s$ term is accounting for. Choosing the cheapest tiling for a given shape and DSP budget is a covering problem that generalises an NP-complete one and is solved by ILP or beam search (§8.4.3, p. 234); this note is only the representation those solvers optimise over.

$$\boxed{\ P=\sum_{s\in\mathcal{T}}2^{x_s+y_s}\,M_s,\qquad M_s=X_{[x_s,\,x_s+m_s)}\times Y_{[y_s,\,y_s+n_s)},\qquad \mathcal{T}\ \text{covers each}\ (i,j)\ \textbf{exactly once}\ }$$

**When it breaks.**

- **A gap or an overlap is a silent numeric error.** Nothing in the widths, the types or the output range changes; the multiplier is simply wrong on some inputs. Exhaustive simulation catches it at small $w$, random vectors at large $w$ — a compile does not.
- **Rectangular tiles cannot cover a non-rectangular shape.** [[Truncated Multipliers]] specify a mask $M_{x,y}\in\{0,1\}$ that is a staircase, not a rectangle, and the covering problem must be restated over that mask.
- **Karatsuba leaves the model.** [[Karatsuba]] and [[Rectangular Karatsuba]] *share* sub-products between regions, so "each position covered exactly once by an independent sub-multiplier" no longer holds; a Karatsuba tile covers several disjoint regions at once and needs pre-additions the geometry does not show.
- **Overhang is charged in full.** A tile hanging half outside the rectangle still costs its whole DSP or its whole LUT budget while its effective area is only what it covers, so the efficiency figures in Table 8.3 are upper bounds for edge tiles.
- **The shift is not free at the DSP level.** Ordinary tiles are shifted for free — a shift is only routing into the heap — but chained DSP super-tiles may only use relative shifts of $0$ or $17$ bits, the sole values the dedicated post-adder routing allows.
- **Below $w\approx6$ there is nothing to tile.** A single tile covers the whole rectangle and the question collapses into "which sub-multiplier", answered directly by Table 8.3.
- **Above $64\times64$ the exact solver gives up.** ILP scales to about $64\times64$ (p. 235); larger operators fall back to heuristics, so an "optimal tiling" claim needs its size checked.

> [!warning] Not covered in the source — needs outside research
> $\#\mathrm{LUT}^\mathrm{comp}=0.55$ LUT/bit and every entry of Table 8.3 are AMD-specific. The book states that similar results hold for other FPGA families but gives no Intel/Altera figures, so no tile ranking here transfers to an ALM-based architecture without re-measurement.

**RTL (Spade).**

```spade
/// A 3x2 LUT tile: three columns of X by two rows of Y.
/// On an FPGA this is one tabulated sub-multiplier, not a shift-and-add.
fn tile3x2(a: uint<3>, b: uint<2>) -> uint<5> {
    let bb: uint<3> = zext(b);
    trunc(a * bb)
}

/// The same tile flipped; every shape in the library may be used either way round.
fn tile2x3(a: uint<2>, b: uint<3>) -> uint<5> {
    tile3x2(b, a)
}

/// 5x5 unsigned multiplier tiled exactly as the diagram: four 2x3 tiles
/// and one 1x1, each shifted by the x+y of its least-significant corner.
fn tiled5x5(x: uint<5>, y: uint<5>) -> uint<10> {
    let xb = x.as_bits();
    let yb = y.as_bits();

    let m0: uint<10> = zext(tile3x2(xb[0..3].as_uint(), yb[0..2].as_uint())); // at (0,0)
    let m1: uint<10> = zext(tile2x3(xb[0..2].as_uint(), yb[2..5].as_uint())); // at (0,2)
    let m2: uint<10> = zext(tile3x2(xb[2..5].as_uint(), yb[3..5].as_uint())); // at (2,3)
    let m3: uint<10> = zext(tile2x3(xb[3..5].as_uint(), yb[0..3].as_uint())); // at (3,0)
    let m4: uint<10> = zext((xb[2] && yb[2]).as_uint());                      // at (2,2)

    let s0 = m0 +. (m1 << 2);
    let s1 = s0 +. (m2 << 5);
    let s2 = s1 +. (m3 << 3);
    s2 +. (m4 << 4)
}
```

Each `xb[a..a+m].as_uint()` **is** the projection of a tile onto the $x$ axis — the code contains no coordinates, only slices, because the slice bounds *are* the geometry. Widths: operands $5$ bits, every $2\times3$ tile $5$ bits out (`trunc` of the $6$-bit product is safe since $7\times3=21<32$), the $1\times1$ tile $1$ bit, and the accumulator $w_P=w_X+w_Y=10$ bits throughout, where `+.` is the wrapping same-width add — legal only because $31\times31=961<2^{10}$, so no carry ever leaves the word. The whole thing is combinational (`fn` forbids `reg` and `inst`), and the `<<` constants are the shifts of panel (b), which cost nothing in hardware: they are wiring into the heap. The one thing synthesis will not do is build the drawn chain of four adders — the four shifted words go into a [[Compressor Trees|compressor tree]], and each `tile3x2` becomes three LUT6s rather than the multiplier the `*` suggests.

Simulated exhaustively over all $1024$ input pairs plus $3000$ random vectors against a behavioural `x*y`, including the asymmetric cases $1\times16$, $16\times1$, $7\times24$ and $24\times7$ — a transposed shift or a swapped slice survives compilation and dies on those.

**Related Notes.**

- [[Unsigned Array Multiplier]] – depends-on: the $w_X\times w_Y$ rectangle of partial products that this note covers, and the double sum whose refactoring gives the tile identity.
- [[Bit Heaps]] – depends-on: what a tiling actually emits — one weighted word per tile instead of $w_Xw_Y$ loose bits.
- [[Compressor Trees]] – depends-on: the consumer that turns the shifted sub-products into two rows, and the reason each output bit is charged $0.55$ LUT.
- [[LUT-Based Multiplier Tiles]] – extends: the $1\times1$, $1\times2$, $3\times3$ and $2\times3$ shapes and why the smallest one exists only to guarantee a solution.
- [[Carry-Chain Multiplier Tile]] – extends: the $2\times k$ tile, the most efficient LUT-based shape in the library.
- [[DSP Super-Tile]] – extends: two chained DSPs used as a single tile, with shifts restricted to $0$ or $17$.
- [[DSP Blocks]] – depends-on: the fixed $24\times17$ shape that dominates every tiling large enough to admit it.
- [[Lookup-Tables]] – depends-on: why a $2\times3$ tile beats a $3\times3$ one, which is an architectural fact about LUT6 splitting rather than an arithmetic one.
- [[Truncated Multipliers]] – extends: the same covering problem over a staircase mask instead of a rectangle.
- [[Karatsuba]] – counter-example: shares sub-products between regions, so "covered exactly once by an independent sub-multiplier" stops being the right constraint.
- [[Unsigned DSP Multiplier Packing]] – compares: the dual problem — several small multiplications packed into one DSP, rather than one big multiplication spread over many.
- [[Choosing a Multiplier]] – compares: when tiling in logic is worth doing at all against a plain DSP instantiation.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Chapter 8, "Fixed-Point Multiplication":

- §8.4.2 "Multiplier Construction as a Tiling Problem", pp. 226–228 — the tile definition and the *exactly once* rule p. 227, Fig. 8.13 p. 226 (tiling representation of a binary $5\times5$ multiplication), Fig. 8.14 p. 227 (the $5\times5$ tiling and its sub-product alignment, redrawn above), the LSB-corner shift rule and the projection rule for tile operands p. 227, zero-padded overhanging tiles and per-tile signedness p. 228, compatibility with the compressor-tree flow of Fig. 8.5 p. 228.
- §8.4.2.1 "Efficiency Metric", pp. 228–229 — eq. (8.39) p. 228, eqs. (8.40)–(8.41) and $\#\mathrm{LUT}^\mathrm{comp}=0.55$ LUT/bit p. 229, Table 8.3 p. 229 ($1\times1$, $2\times3$ and $24\times17$ efficiencies quoted above).
- §8.4.3 "Solving the Tiling Problem", pp. 234–235 — NP-completeness of the general covering problem p. 234, the $=1$ ILP constraint and its $64\times64$ scaling limit p. 235; Fig. 8.19 p. 236 (optimal $53\times53$ tiling with overhanging tiles).
