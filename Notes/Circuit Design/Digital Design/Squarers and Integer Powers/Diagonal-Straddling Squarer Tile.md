---
title: "Diagonal-Straddling Squarer Tile"
description: "A rectangular DSP tile deliberately placed across the diagonal so it double-covers a square of bits, which is then recomputed and subtracted from the heap — worth it when the DSP covers a large area."
kind: circuit
source: "ASA §14.2.5, pp. 447-449"
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, tiling, dsp, fpga]
aliases:
  - Straddling Tile
  - Diagonal-Straddling Tile
  - M1 Tile
---

# Diagonal-Straddling Squarer Tile

A rectangular multiplier tile whose two operand slices are overlapping slices of the *same* input word, so it covers partial products on both sides of the squarer's diagonal — at the price of one square of bits that gets counted twice and has to be squared again and subtracted.

```tikz title="Tile M1 of a 12-bit squarer straddling the diagonal, and the square S1 it double-covers"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=0.62]
% cell (row i, col j) is centred at (11-j, -i): columns run x11..x0 left to right,
% rows run x0..x11 top to bottom, so the diagonal falls from top-right to bottom-left.
\foreach \i in {0,...,11}{\foreach \j in {0,...,11}{
  \ifnum\j>\i \fill[blue!14] ({11-\j-0.5},{-\i-0.5}) rectangle ({11-\j+0.5},{-\i+0.5});\fi
  \ifnum\j=\i \fill[red!40]  ({11-\j-0.5},{-\i-0.5}) rectangle ({11-\j+0.5},{-\i+0.5});\fi
}}
% the two cells of S1 that are not diagonal
\fill[black!35] (2.5,-6.5) rectangle (3.5,-7.5);
\fill[black!35] (3.5,-7.5) rectangle (4.5,-8.5);
\draw[gray!35,step=1] (-0.5,-11.5) grid (11.5,0.5);
\draw[thick] (-0.5,0.5) rectangle (11.5,-11.5);
% axis labels
\foreach \j in {0,...,11}{\node[font=\scriptsize] at ({11-\j},0.95) {$x_{\j}$};}
\foreach \i in {0,...,11}{\node[font=\scriptsize] at (12.2,{-\i}) {$x_{\i}$};}
% M1 and its mirror image
\draw[very thick,blue!55!black] (-0.5,-5.5) rectangle (4.5,-8.5);
\draw[very thick,black!55,dashed]  (2.5,-6.5) rectangle (5.5,-11.5);
\draw[very thick,black] (2.5,-6.5) rectangle (4.5,-8.5);
\node[font=\small\bfseries,blue!55!black] at (1.0,-7.0) {M1};
\node[font=\scriptsize\bfseries,black!55] at (4.0,-10.6) {M1 mirror};
% callout for S1
\draw[->,thick] (7.3,-5.5) -- (4.6,-7.2);
\node[font=\scriptsize,anchor=west,align=left] at (7.4,-5.2)
  {\textbf{S1}: covered by M1\\and by its mirror\\$=\bigl(X[8{:}7]\bigr)^{2}$};
% operand brackets
\node[font=\scriptsize,blue!55!black,anchor=south] at (2.0,-5.35) {$B=X[11{:}7]$, 5 bits};
\node[font=\scriptsize,blue!55!black,anchor=south,rotate=90] at (-0.85,-7.0) {$A=X[8{:}6]$, 3 bits};
% legend and identity
\node[font=\scriptsize,anchor=north west,align=left] at (-0.7,-12.2)
  {\textcolor{blue!40}{$\blacksquare$} half that must be covered ($j>i$)\quad
   \textcolor{red!40}{$\blacksquare$} diagonal bit $x_i$ (a wire, not a gate)\quad
   \textcolor{black!35}{$\blacksquare$} double-covered\\[3pt]
   axes share $x_7,x_8$, so M1 is a function of 6 input bits $x_6\ldots x_{11}$ only\\[1pt]
   one multiplier emits $A\!\cdot\!B$ (8 bits) at weight $2^{13}$; doubling it covers M1 \emph{and} its mirror\\[1pt]
   the doubling over-counts S1 exactly once, so $S^2$ (4 bits, $S=X[8{:}7]$) is subtracted at weight $2^{14}$};
\end{circuitikz}
\end{document}
```

*After Fig. 14.4, p. 448, redrawn with tile M1 and its mirror image made explicit; tiles M0 and T1 of the original figure are omitted.*

**Say what a tile is when there is only one operand.** In [[Multiplier Tiling]] a tile is a rectangle $R \times C$ of the partial-product array, $R$ a slice of one operand and $C$ a slice of the other, and $R$ and $C$ live in different words, so they are disjoint by construction. A squarer has one $n$-bit input $X = \sum_{i=0}^{n-1} 2^i x_i$, every $x_i$ one bit, and [[Folded Array Squarer]] has already reduced the job to covering only the region on and above the diagonal — cell $(i,j)$ with $j \ge i$, holding the single bit $x_i x_j$. A tile is still a rectangle $R \times C$, but now both index sets are slices of the *same* word, and nothing forbids $R \cap C \ne \emptyset$. The whole content of this note is what happens when it is not empty.

**Fold at tile granularity, not just at bit granularity.** A tile lying strictly above the diagonal has a mirror image $C \times R$ lying strictly below it, and the two compute the same set of products — by **commutativity of AND**, $x_i x_j = x_j x_i$, at the same weight $2^{i+j}$, which is symmetric in $i,j$. So one physical multiplier serves both, its output shifted left by one bit: exactly the factor 2 that merged the two triangles in eq. (14.1). This is why the two M0 tiles of Fig. 14.4 cost one multiplier, not two. As long as $R \cap C = \emptyset$ the tile and its mirror are disjoint and the doubling is exact.

**Work out the excess when the axes overlap.** Write $X_R = \sum_{i \in R} 2^i x_i$ and $X_C = \sum_{j \in C} 2^j x_j$. The physical multiplier emits, by **distributivity**,

$$P \;=\; X_R \, X_C \;=\; \sum_{i \in R}\sum_{j \in C} 2^{i+j}\, x_i x_j$$

and we drop $2P$ into the heap. What the folded formula (14.1) actually wants from this tile is each unordered pair $\{i,j\}$, $i \ne j$, once at weight $2^{i+j+1}$, and each diagonal bit $x_i$ once at weight $2^{2i}$. Compare term by term:

- a pair with $i \in R$, $j \in C$ and *not* also $j \in R$, $i \in C$ occurs once in $P$, so $2P$ delivers $2^{i+j+1}x_ix_j$ — correct;
- a pair with $i,j \in R \cap C$ occurs **twice** in $P$, once as $(i,j)$ and once as $(j,i)$, so $2P$ delivers $2^{i+j+2}x_ix_j$ — an excess of $2^{i+j+1}x_ix_j$;
- a diagonal index $i$ is in the tile only if $i \in R \cap C$, and **idempotence of AND** ($x_ix_i = x_i$) makes its term $2^{2i}x_i$; it occurs once in $P$, so $2P$ delivers $2^{2i+1}x_i$ — an excess of $2^{2i}x_i$.

Sum the two excesses and read the result backwards through (14.1): $\sum_{i \in R\cap C} 2^{2i}x_i + \sum_{i<j,\; i,j \in R\cap C} 2^{i+j+1}x_ix_j$ *is* the folded square of the shared subword. The over-count is therefore not some awkward residue — it is exactly $X_{R\cap C}^2$, another squarer, on $s = |R \cap C|$ bits.

**Read the figure's numbers off that.** Tile M1 has $R = \{6,7,8\}$ on the vertical axis and $C = \{7,\dots,11\}$ on the horizontal one, so $A = X[8{:}6]$ is 3 bits, $B = X[11{:}7]$ is 5 bits, and $S = X[8{:}7]$ is $s = 2$ bits. The product $A\cdot B \le 7 \times 31 = 217$ is 8 bits and carries weight $2^{6+7} = 2^{13}$; doubling moves it to $2^{14}$. The excess $X_{\{7,8\}}^2 = (2^7 S)^2 = 2^{14}S^2$ sits at the same weight $2^{14}$, with $S^2 \le 9$ in 4 bits. The tile's 15 cells therefore realise 14 distinct products — 12 off-diagonal pairs plus the two diagonal bits $x_7, x_8$ — and $x_7x_8$ is the one product the tile builds twice.

**Pay for the subtraction in the heap, never in an adder.** As a bit heap ([[Sums of Weighted Bits]]) the correction is only $s + \binom{s}{2} = \tfrac{s(s+1)}{2} = 3$ bits: $x_7$ at $2^{14}$, and $x_8$ and $x_7x_8$ both at $2^{16}$. A heap adds bits and cannot subtract them, so use the two's-complement identity $-x = \bar{x}+1$ from [[Number Formats]] on each: since $\overline{b} = 1-b$,

$$-\bigl(2^{14}x_7 + 2^{16}x_8 + 2^{16}x_7x_8\bigr) \;=\; 2^{14}\overline{x_7} + 2^{16}\overline{x_8} + 2^{16}\overline{x_7x_8} \;-\; \bigl(2^{14}+2^{17}\bigr)$$

Three inverters and one compile-time constant that merges with every other constant in the heap. Nothing lands on the critical path, and no carry-propagate adder is created — which is the only reason a "recompute and subtract" is affordable at all.

**Overlap the axes to shrink the input count, which is why a LUT could do it instead.** A tile on disjoint axes reads $|R| + |C|$ input bits; a straddling tile reads $|R| + |C| - s$. M1 reads $3 + 5 - 2 = 6$ bits, $x_6$ through $x_{11}$, so on FPGA every output bit of M1 is a 6-input Boolean function and the whole tile fits in [[Lookup-Tables]] as a stack of LUT6s. That observation cuts both ways: if you are going to spend LUT6s anyway, you may as well enlarge the tile until it also covers the bottom-left square that M1 leaves uncovered and the diagonal bit $x_6$, and handle the overlap inside the bigger tile — which is precisely how the book motivates the [[Squarer Staircase Tile]]. The straddling placement earns its correction only when the tile is a [[DSP Blocks]] instance, whose area is bought in indivisible units: you cannot buy two-thirds of a DSP, so you push its rectangle as far across the diagonal as it will go and accept a 3-bit penalty for a much larger covered area.

**On ASIC the question does not arise.** There the array is built gate by gate, tile boundaries are a fiction, and the plain folded construction of (14.1) already emits each product exactly once. Straddling is an artefact of coarse, fixed-size hard multipliers, so it belongs to the FPGA side of [[Squarer Tiling]] and to the ILP formulation that chooses the cover.

$$\boxed{\;\text{tile } R\times C \ \text{contributes}\quad 2\,X_R X_C \;-\; X_{R\cap C}^{\,2}\;,\qquad X_{R\cap C}=\!\!\sum_{i\in R\cap C}\!\!2^i x_i\;}$$

For M1 of Fig. 14.4 this is $2^{14}\bigl(A\cdot B - S^2\bigr)$ with $A = X[8{:}6]$, $B = X[11{:}7]$, $S = X[8{:}7]$.

## When it breaks

- **$s = 0$.** No double cover, no correction, and the tile is an ordinary multiplier tile — the construction has nothing to say.
- **$R = C$.** Then $X_{R\cap C}^2 = X_R^2$ and the contribution collapses to $2X_R^2 - X_R^2 = X_R^2$: the tile has degenerated into a square tile on the diagonal, i.e. one term of the [[High-Radix Squarer]] decomposition. Between the two extremes the correction grows as $\tfrac{s(s+1)}{2}$ heap bits while the coverage grows as $|R|\,|C|$, so straddling pays only while $s$ stays small against the tile's dimensions.
- **The correction is itself a squarer.** For $s$ beyond two or three bits you are no longer subtracting a handful of bits but instantiating a second, smaller squarer, and its own tiling problem reappears one level down.
- **Truncation cannot save it.** The lowest weight in $X_{R\cap C}^2$ is $2^{2\min(R\cap C)}$ and the lowest weight in the tile is $2^{\min R + \min C}$; since $\min(R\cap C) \ge \min R$ and $\min(R\cap C) \ge \min C$, the correction always sits at or above the tile's own LSB. A [[Truncated Squarer]] that keeps the tile therefore keeps the whole correction — there is no cut that discards S1 and retains M1.

> [!warning] Not covered in the source — needs outside research
> The book states that straddling "may be globally beneficial if M1 is computed by a DSP block that otherwise efficiently covers a large area" (p. 448) but gives **no cost figure** for the trade: no LUT or DSP count for a tiling with straddling tiles against one without, and no threshold on $s$ or on tile area at which it starts to win. The decision is delegated entirely to the ILP of [BKD22].

## RTL (Spade)

```spade
/// Diagonal-straddling tile M1 of Fig. 14.4 in a 12-bit squarer.
/// Vertical operand A = X[8:6] (3 bits), horizontal operand B = X[11:7] (5 bits).
/// The axes share {x7, x8}, so S = X[8:7] is double-covered and is subtracted.
/// Result is the tile's contribution divided by its heap weight 2^14.
fn straddling_tile(x: uint<6>) -> uint<8> {
    let b = x.as_bits();                       // index 0 = LSB = x6
    let a: uint<8> = zext(b[0..3].as_uint());  // A = X[8:6]  in [0,7]
    let h: uint<8> = zext(b[1..6].as_uint());  // B = X[11:7] in [0,31]
    let s: uint<8> = zext(b[1..3].as_uint());  // S = X[8:7]  in [0,3]
    // A*B <= 217 and A*B - S*S >= 0 always, so 8 bits never overflow.
    (a *. h) -. (s *. s)
}
```

The single `uint<6>` port is the honest interface: the tile's two "operands" are overlapping slices of one word, so `b[0..3]` and `b[1..6]` share `b[1]` and `b[2]` — the wires $x_7,x_8$ that feed both axes of the rectangle in the diagram. `*.` and `-.` are the truncating forms, safe here because $AB \le 217$ and $AB - S^2 \ge 0$ for every input; the widening `*` would give `uint<16>` and force a `trunc` that says less. The whole block is combinational and carries no weight information — the returned 8 bits are dropped into heap columns 14 through 21, which is where the shift-by-one that folds the mirror image has already been absorbed. Synthesis will not build this as written: `a *. h` becomes the DSP block that is the entire point of straddling, while `s *. s`, three heap bits wide, degenerates into the two AND-free wires $x_7, x_8$ plus a single AND gate.

## Related Notes

- [[Squarer Tiling]] – extends: the cover this tile is one legal move in, and the ILP that decides whether to take it.
- [[Multiplier Tiling]] – compares: the same tile library on a multiplier, where the axes are different words, so $R\cap C$ is empty by construction and no correction can ever arise.
- [[Folded Array Squarer]] – depends-on: supplies eq. (14.1) and hence the diagonal that this tile straddles.
- [[DSP Blocks]] – depends-on: the correction is only worth paying when the tile is an indivisible hard multiplier.
- [[Lookup-Tables]] – compares: six distinct input bits fit a LUT6, the alternative realisation of the same tile.
- [[Squarer Staircase Tile]] – extends: absorbs the uncovered corner and the diagonal bit into one larger squarer-specific tile instead of correcting afterwards.
- [[High-Radix Squarer]] – counter-example: the all-square-tiles decomposition, the $R = C$ degenerate case where the correction cancels the doubling exactly.
- [[Truncated Squarer]] – compares: the other place heap columns are deleted, and the one that cannot delete this correction.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.2.5 Squarer-Specific Tiling for FPGAs — tiles M0, M1, S1, T1, Fig. 14.4, pp. 447–449
- §14.2.1 Basics — eq. (14.1), the fold this tile is defined against, p. 444
- §14.2.2 High-Radix Square — the all-square-tile special case, pp. 445–446
- [BKD22] Böttcher, Kumm & de Dinechin, *Resource Optimal Squarers for FPGAs*, FPL 2022 — the ILP that places straddling tiles
