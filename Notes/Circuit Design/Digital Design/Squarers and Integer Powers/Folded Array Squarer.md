---
title: Folded Array Squarer
description: "Halves a multiplier's AND-gate count and bit heap by folding the symmetric partial-product array onto one triangle plus a free diagonal of wires."
kind: circuit
source: "ASA §14.2.1, pp. 443-445"
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, multiplier, bit-heap, partial-products]
aliases:
  - Folded Array Squarers
  - Plain Squarer
  - Exact Squarer
  - Symmetric Partial-Product Fold
---

# Folded Array Squarer

A multiplier array in which both operands are the same signal, so the array is symmetric about its diagonal and can be folded onto one open triangle of AND gates plus a diagonal that costs nothing but wire.

```tikz title="6x6 multiplier array versus the folded squarer array, and the skewed bit heap the fold leaves behind"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=0.66]
% ---------------- LEFT: general multiplier array ----------------
\begin{scope}
  \node[font=\small\bfseries] at (2.5,2.35) {general multiplier $X\!\cdot\!X$};
  \node[font=\scriptsize] at (2.5,1.75) {$36$ AND gates, $36$ heap bits};
  \foreach \j in {0,...,5}{\node[font=\scriptsize] at (\j,0.75) {$x_{\j}$};}
  \foreach \i in {0,...,5}{\node[font=\scriptsize] at (-0.95,-\i) {$x_{\i}$};}
  \foreach \i in {0,...,5}{\foreach \j in {0,...,5}{\fill (\j,-\i) circle (0.14);}}
  \draw[red,thick,dashed] (-0.5,0.5) -- (5.5,-5.5);
  \node[font=\scriptsize] at (2.5,-6.3) {$x_ix_j$ and $x_jx_i$ both built};
\end{scope}
% ---------------- RIGHT: folded squarer array ----------------
\begin{scope}[shift={(9.6,0)}]
  \node[font=\small\bfseries] at (2.5,2.35) {folded squarer $X^{2}$};
  \node[font=\scriptsize] at (2.5,1.75) {$15$ AND gates, $21$ heap bits};
  \foreach \j in {0,...,5}{\node[font=\scriptsize] at (\j,0.75) {$x_{\j}$};}
  \foreach \i in {0,...,5}{\node[font=\scriptsize] at (-0.95,-\i) {$x_{\i}$};}
  \foreach \j in {1,...,5}{%
    \pgfmathtruncatemacro{\jm}{\j-1}%
    \foreach \i in {0,...,\jm}{\draw[gray!55] (\j,-\i) circle (0.14);}}
  \foreach \i in {1,...,5}{%
    \pgfmathtruncatemacro{\im}{\i-1}%
    \foreach \j in {0,...,\im}{\fill (\j,-\i) circle (0.14);}}
  \foreach \i in {0,...,5}{\fill[red!80!black] (\i,-\i) circle (0.16);}
  \draw[->,thick,gray!70] (4.0,-1.0) -- (1.2,-3.8);
  \draw[->,thick,gray!70] (5.0,-2.0) -- (2.2,-4.8);
  \draw[red,thick,dashed] (-0.5,0.5) -- (5.5,-5.5);
  \node[font=\scriptsize] at (2.5,-6.3) {merged at weight $2^{i+j+1}$};
  \node[font=\scriptsize,red!80!black] at (2.5,-7.0) {diagonal free: $x_ix_i=x_i$};
\end{scope}
% ---------------- BOTTOM: the resulting bit heap, n = 6 ----------------
\begin{scope}[shift={(3.4,-11.4)}]
  \node[font=\small\bfseries,anchor=west] at (-3.9,2.05) {resulting bit heap ($21$ bits, peak height $4$)};
  \foreach \w in {0,...,10}{\node[font=\scriptsize\bfseries] at ({(10-\w)*0.82},-0.55) {\w};}
  \node[font=\scriptsize,anchor=east] at (-0.62,-0.55) {weight $w$};
  \draw[gray!55] (-0.55,-0.16) -- (8.75,-0.16);
  \foreach \w/\c in {10/1, 9/1, 8/2, 7/2, 6/3, 5/2, 4/2, 3/1, 2/1}{
    \foreach \k in {1,...,\c}{\fill ({(10-\w)*0.82},{-0.16+\k*0.42}) circle (0.14);}}
  \foreach \w/\h in {10/2, 8/3, 6/4, 4/3, 2/2, 0/1}{
    \fill[red!80!black] ({(10-\w)*0.82},{-0.16+\h*0.42}) circle (0.15);}
  \node[font=\scriptsize,anchor=west] at (-3.9,-1.15)
    {heights $2,1,3,2,4,2,3,1,2,0,1$ against the multiplier's $1,2,3,4,5,6,5,4,3,2,1$};
  \node[font=\scriptsize,anchor=west] at (-3.9,-1.75)
    {odd columns carry no diagonal bit, so the heap is skewed, not triangular};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 14.1, p. 444 (tile view of a 12-bit square) and Fig. 14.2, p. 445 (bit heap of an exact 12-bit squarer), both reduced to $n=6$.*

**Expand the square into the multiplier's own array.** Take $X$ an $n$-bit unsigned integer; a fixed-point $\mathrm{ufix}(m,\ell)$ operand is the same object times a constant power of two, so no generality is lost ([[Number Formats]]).

$$X=\sum_{i=0}^{n-1}2^{i}x_i,\qquad x_i\in\{0,1\}$$

Squaring and expanding the product of two sums **by distributivity of multiplication over addition** gives

$$X^{2}=\left(\sum_{i=0}^{n-1}2^{i}x_i\right)\left(\sum_{j=0}^{n-1}2^{j}x_j\right)=\sum_{i=0}^{n-1}\sum_{j=0}^{n-1}2^{i+j}\,x_ix_j$$

which is *verbatim* the $n^2$-entry partial-product array of a general $n\times n$ multiplier ([[Multipliers]]), with $Y$ replaced by $X$. Every $x_ix_j$ is one AND gate emitting one bit into column $i+j$ of a heap spanning columns $0$ to $2n-2$; the compressed result is $2n$ bits, since $(2^n-1)^2 = 2^{2n}-2^{n+1}+1$ just reaches column $2n-1$.

**Split the index set at the diagonal.** Partition $\{0,\dots,n-1\}^2$ into the three disjoint pieces $i=j$, $i>j$, $i<j$:

$$X^{2}=\underbrace{\sum_{i=0}^{n-1}2^{2i}x_ix_i}_{\text{diagonal}}\;+\;\underbrace{\sum_{0\le j<i<n}2^{i+j}x_ix_j}_{\text{below}}\;+\;\underbrace{\sum_{0\le i<j<n}2^{i+j}x_ix_j}_{\text{above}}$$

Two Boolean facts then collapse two of the three pieces, and they are the whole content of the circuit.

**Merge the two triangles by commutativity of AND.** The entry above the diagonal at $(i,j)$ and the entry below at $(j,i)$ are the same bit, $x_ix_j = x_jx_i$; and because $i+j$ is symmetric in its arguments they sit at the *same* weight $2^{i+j}$. The two sums are therefore termwise equal and merge with a factor of two:

$$\sum_{0\le j<i<n}2^{i+j}x_ix_j+\sum_{0\le i<j<n}2^{i+j}x_ix_j=2\!\!\sum_{0\le j<i<n}\!\!2^{i+j}x_ix_j=\!\!\sum_{0\le j<i<n}\!\!2^{i+j+1}x_ix_j$$

The factor $2$ costs nothing, and that is the crux: it is absorbed into the *weight* of the bit, which in a bit heap is nothing but the choice of which column the wire is dropped into. There is no shifter, no adder, no gate — the same reason multiplication by a power of two is free in [[Multiplication by Constants]].

**Delete the diagonal gates by idempotence of AND.** $x_ix_i = x_i$, so a diagonal partial product is not a gate at all: it is the input bit $x_i$ routed into column $2i$. The array's $n$ diagonal cells become $n$ pieces of wire.

**Read the fold row-wise to get an architecture.** Grouping the surviving triangle by its outer index $i$ and factoring $x_i$ out gives the form a datapath actually implements:

$$X^{2}=\sum_{i=0}^{n-1}x_i\Big(2^{2i}+2^{\,i+1}\!\!\left(X \bmod 2^{i}\right)\Big)$$

using $\sum_{j<i}2^{j}x_j = X \bmod 2^{i}$. Row $i$ is $n$ bits wide before shifting and is gated by the single bit $x_i$: it contributes its diagonal constant $2^{2i}$ plus the low $i$ bits of $X$ shifted left by $i+1$. The masks that select those low bits hold $0+1+\dots+(n-1)$ ones in total — exactly the surviving AND gates, which is the width-level statement of the fold.

**Count what survives.** The AND gates are the pairs $j<i$, and the heap additionally carries the diagonal wires:

$$\binom{n}{2}=\frac{n(n-1)}{2}\ \text{AND gates},\qquad n+\binom{n}{2}=\frac{n(n+1)}{2}\ \text{heap bits}$$

Against $n^2$ of each, the gate ratio is $(n-1)/2n$ and the heap ratio $(n+1)/2n$, both $\to\tfrac12$. At $n=12$ that is $66$ gates and $78$ heap bits against $144$ and $144$ — the case drawn in Fig. 14.2, p. 445. Halving the heap halves the work of the [[Compressor Trees|compressor tree]] and removes roughly one level from its depth, since tree depth is $\Theta(\log h)$ in the peak column height $h$; the final carry-propagate adder ([[RCA, Ripple-Carry Adder]]) is unchanged at $2n$ bits, because folding changes the heap, not the result's width. Tying $X$ into both ports of a general multiplier throws every one of these savings away, which is the entire reason a dedicated squarer exists.

**The heap is skewed, not triangular.** Column heights are not the multiplier's symmetric $1,2,\dots,n,\dots,2,1$. Column $w$ holds $\lfloor$ number of pairs $j<i$ with $i+j+1=w\rfloor$ plus one diagonal bit iff $w$ is even, so even columns are one taller than their odd neighbours and column $1$ is empty outright. For $n=6$ the profile is $1,0,2,1,3,2,4,2,3,1,2$ reading from $w=0$: $21$ bits, peak height $4$ against the multiplier's $6$. A bit-heap compressor does not care about shape ([[Bit Heaps]]), which is precisely why the fold is stated on the heap; but the "rows of partial products" picture that drives a [[Wallace Tree]] no longer applies, because the rows have unequal lengths and one of them is pure wire.

**On FPGA the saving is heap bits, not gates.** In LUT fabric an AND gate is never a standalone cost — it is absorbed into the LUT that also performs the first level of compression, so what the fold actually buys is fewer LUT inputs to feed and fewer rows in the compressor tree. On ASIC both halvings are real cell counts. The fold is also useless the moment the multiply is a hard DSP block, which is an indivisible resource: there the same symmetry has to be re-applied one level up, between subwords rather than bits ([[High-Radix Squarer]]).

> [!warning] Not covered in the source — needs outside research
> Ch. 14 reports **no measured LUT counts, delays, or synthesis results** for the plain squarer, unlike the constant-multiplier and divider chapters. The gate and heap counts above are exact combinatorics; the depth and FPGA claims are structural, not measured.

**Worked example, $n=6$, $X=45=101101_2$.** Set bits are $\{0,2,3,5\}$; a cross term $x_ix_j$ is $1$ exactly when both indices are set. Reading (14.1) column by column:

| $w$ | diagonal | merged cross terms | height | value |
| --- | --- | --- | --- | --- |
| $0$ | $x_0$ | — | 1 | 1 |
| $1$ | — | — | 0 | 0 |
| $2$ | $x_1$ | $x_1x_0$ | 2 | 0 |
| $3$ | — | $x_2x_0$ | 1 | 1 |
| $4$ | $x_2$ | $x_3x_0,\;x_2x_1$ | 3 | 2 |
| $5$ | — | $x_4x_0,\;x_3x_1$ | 2 | 0 |
| $6$ | $x_3$ | $x_5x_0,\;x_4x_1,\;x_3x_2$ | 4 | 3 |
| $7$ | — | $x_5x_1,\;x_4x_2$ | 2 | 0 |
| $8$ | $x_4$ | $x_5x_2,\;x_4x_3$ | 3 | 1 |
| $9$ | — | $x_5x_3$ | 1 | 1 |
| $10$ | $x_5$ | $x_5x_4$ | 2 | 1 |
| | $6$ | $15$ | **21** | |

$$X^{2}=1\!\cdot\!2^{0}+1\!\cdot\!2^{3}+2\!\cdot\!2^{4}+3\!\cdot\!2^{6}+1\!\cdot\!2^{8}+1\!\cdot\!2^{9}+1\!\cdot\!2^{10}=1+8+32+192+256+512+1024=2025=45^2$$

Compressing the two columns still above height one — a half adder on column $4$ ($1+1$: sum $0$, carry $1$ into column $5$) and a full adder on column $6$ ($1+1+1$: sum $1$, carry $1$ into column $7$) — turns the height vector $1,1,1,0,3,0,2,1,0,0,1$ into the bit string $11111101001_2$, and $1024+512+256+128+64+32+8+1 = 2025$. Bit $11$ of the $12$-bit output is zero here because $45^2 < 2^{11}$.

$$\boxed{\;X^{2}=\sum_{i=0}^{n-1}2^{2i}x_i\;+\!\!\sum_{0\le j<i<n}\!\!2^{i+j+1}\,x_ix_j\;}\tag{14.1}$$

$$\boxed{\ \text{AND gates } \tfrac{n(n-1)}{2},\qquad \text{heap bits } \tfrac{n(n+1)}{2},\qquad \text{output } 2n \text{ bits}\ }$$

**When it breaks.**

- **The halving is asymptotic.** The heap ratio is $(n+1)/2n$: $0.75$ at $n=2$, $0.58$ at $n=6$, $0.54$ at $n=12$. Below about $n=8$ the diagonal is a large fraction of what is left, and plain tabulation of $X^2$ beats the array outright while also delivering correct rounding (p. 443) — see [[Table-Based Function Evaluation]].
- **Latency barely moves.** Peak column height falls from $n$ to about $n/2$, and compressor depth is logarithmic in that, so the fold buys roughly *one* tree level, not half the delay. It is an area optimisation that happens to shorten the critical path a little.
- **A hard multiplier cannot be folded.** You cannot use half a DSP block. When DSPs are the binding resource the bit-level fold is worthless and the subword decomposition takes over ([[High-Radix Squarer]], [[DSP-Cascade Squarer]]).
- **Booth recoding does not stack on top of it.** Applying radix-4 recoding to (14.1) gives the same diagonal-plus-triangle shape but only a $\approx 3/4$ heap factor, paid for with a recoder and a $Z_iZ_j$ function replacing four AND gates ([[Booth-Recoded Squarer]]). The fold has already killed half the array by a cheaper mechanism, so there is little left for Booth to take.
- **Exactness is usually overkill.** Most applications truncate well above the exact LSB, and a squarer tolerates one column more truncation than a multiplier of the same size because every column is half as tall ([[Truncated Squarer]], [[Error Accuracy]]).
- **Higher powers do not fold this cleanly.** The cube's multinomial expansion produces a factor $3$ that, unlike the factor $2$ here, is not a power of two and therefore *replicates* a bit at two weights instead of moving it ([[Cube Bit Heap]]).

> [!warning] Signed operands are asserted, not derived
> The book states the integer construction "can trivially be transposed to any fixed-point format for $X$" (p. 444), which covers scaling but not signedness. For two's-complement $X$ the sign bit's diagonal term stays positive (squares are positive) while its cross terms carry negative weight, and no derivation of that heap is given. Treat a signed folded squarer as needing its own sign-extension analysis.

**RTL (Spade).** The row-wise form above, at $n=8$:

```spade
// One row of the folded array (14.1): bit x_i contributes the free diagonal
// term 2^{2i} plus the merged cross terms 2^{i+j+1} x_i x_j for all j < i.
fn row(xi: bool, lo: uint<16>, sh: uint<16>, diag: uint<16>) -> uint<16> {
    if xi { trunc((lo << sh) + diag) } else { 0 }
}

entity sqr8(x: uint<8>) -> uint<16> {
    let b = x.as_bits();
    let s = row(b[0], 0,                           1,  1)
        +. row(b[1], zext::<8,16>(x & 0b00000001), 2,  4)
        +. row(b[2], zext::<8,16>(x & 0b00000011), 3, 16)
        +. row(b[3], zext::<8,16>(x & 0b00000111), 4, 64)
        +. row(b[4], zext::<8,16>(x & 0b00001111), 5, 256)
        +. row(b[5], zext::<8,16>(x & 0b00011111), 6, 1024)
        +. row(b[6], zext::<8,16>(x & 0b00111111), 7, 4096)
        +. row(b[7], zext::<8,16>(x & 0b01111111), 8, 16384);
    s
}
```

`x & 0b000...1` is the mask $X \bmod 2^i$ — one row of black dots in the folded panel, and the eight masks hold $0+1+\dots+7=28=\binom{8}{2}$ ones, exactly the AND gates the diagram keeps. `diag` is the red wire at column $2i$, a literal because it is a constant one, not a gate. `sh` $=i+1$ is the merge's weight bump, free because it is a wire permutation. `+.` is the wrapping add, safe because $255^2 = 65025 < 2^{16}$; the whole entity is combinational. Synthesis will not build the eight-term ripple this code spells out — it flattens to the heap in the bottom panel and a compressor tree ([[Compressor Trees]]), which is why the shape of the heap, not the shape of this expression, is what the note is about.

Verified exhaustively over all $256$ inputs plus $11$ named vectors (including the asymmetric $1$, $128$, $129$, $192$, $170$, $85$) and a $3000$-vector random sweep against the behavioural reference `x*x`: $3267$ vectors, zero failures.

**Related notes.**

- [[Multipliers]] – depends-on: the $n^2$ partial-product array this note folds, and the source of every cost it is measured against.
- [[Bit Heaps]] – depends-on: the fold is expressed as a change of heap, which is why the weight bump $2^{i+j}\to 2^{i+j+1}$ costs nothing.
- [[Compressor Trees]] – supports: consumes the halved heap; the one saved tree level comes from the halved peak column height.
- [[RCA, Ripple-Carry Adder]] – supports: the final carry-propagate stage, unchanged at $2n$ bits because the fold does not narrow the result.
- [[Wallace Tree]] – counter-example: its row-oriented reduction schedule assumes equal-length rows, which the skewed folded heap does not have.
- [[High-Radix Squarer]] – extends: applies the identical symmetry argument between $k$-bit subwords, which is what you use when DSP blocks rather than gates are the binding resource.
- [[Truncated Squarer]] – extends: deletes the cheap right-hand columns of exactly this heap, and gets one column more than a multiplier for the same ulp budget.
- [[Booth-Recoded Squarer]] – compares: same diagonal-plus-triangle shape over recoded digits, but only a $3/4$ factor and probably not worth the recoder.
- [[Squarer Tiling]] – extends: covers only the region on and above the diagonal with FPGA tiles, the fold restated as a covering constraint.
- [[Choosing a Squarer]] – compares: where this sits against every sibling in the topic.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chap. 14, *Fixed-Point Squares, Cubes, and Other Integer Powers*:

- §14.1 Generalities — exact output format $\mathrm{ufix}(p(m+1),p\ell)$, parity of $p$, pp. 443–444
- §14.2 Squarers, opening — the integer-to-fixed-point transposition claim, p. 444
- §14.2.1 Basics — the symmetry argument, Fig. 14.1 (tile view of a 12-bit square, diagonal in red, $i>j$ bits in blue), eq. (14.1), Fig. 14.2 (bit heap of an exact 12-bit squarer), pp. 444–445
- §14.2.2 High-Radix Square — the DSP-block case where the bit-level fold does not apply, p. 445
- §14.2.3 Booth Recoding — the $\approx 3/4$ factor and the verdict against it, p. 446
- §14.2.4 Truncated Squarers — pp. 446–447
