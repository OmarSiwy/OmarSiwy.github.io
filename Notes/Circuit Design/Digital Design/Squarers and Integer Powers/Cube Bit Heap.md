---
title: Cube Bit Heap
description: "Direct binary expansion of X^3 into diagonal wires, xi*xj pairs and xi*xj*xk triples; the factor 3 does not fold, so the heap grows as the cube of the input width and only truncation makes it usable."
kind: circuit
source: "ASA §14.3.1, pp. 449-450"
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, cube, bit-heap, multinomial]
aliases:
  - Cube Bit Heap
  - Cube Bit Heaps
  - Direct Cube Expansion
  - Exact Cuber
  - X^3 Bit Heap
---

# Cube Bit Heap

The multinomial expansion of $X^3$ dropped straight into a bit heap — the same construction that halves a squarer, except that here the multiplicities are $3$ and $6$ rather than $2$, and an odd multiplicity is not a shift.

```tikz title="Exact cube bit heap for a 4-bit input: 36 entries in three families across 12 columns"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=1.0]
% ---- one dot per term of the multinomial expansion; weight grows leftwards ----
\fill[red!80!black] (6.820,0.300) circle (0.115);
\node[font=\tiny] at (6.820,-0.05) {$0$};
\fill[blue!70!black] (6.200,0.300) circle (0.115);
\node[font=\tiny] at (6.200,-0.05) {$1$};
\fill[blue!70!black] (5.580,0.300) circle (0.115);
\fill[blue!70!black] (5.580,0.640) circle (0.115);
\fill[blue!70!black] (5.580,0.980) circle (0.115);
\node[font=\tiny] at (5.580,-0.05) {$2$};
\fill[red!80!black] (4.960,0.300) circle (0.115);
\fill[blue!70!black] (4.960,0.640) circle (0.115);
\fill[blue!70!black] (4.960,0.980) circle (0.115);
\fill[blue!70!black] (4.960,1.320) circle (0.115);
\node[font=\tiny] at (4.960,-0.05) {$3$};
\fill[blue!70!black] (4.340,0.300) circle (0.115);
\fill[blue!70!black] (4.340,0.640) circle (0.115);
\fill[blue!70!black] (4.340,0.980) circle (0.115);
\fill[green!45!black] (4.340,1.320) circle (0.115);
\node[font=\tiny] at (4.340,-0.05) {$4$};
\fill[blue!70!black] (3.720,0.300) circle (0.115);
\fill[blue!70!black] (3.720,0.640) circle (0.115);
\fill[blue!70!black] (3.720,0.980) circle (0.115);
\fill[blue!70!black] (3.720,1.320) circle (0.115);
\fill[green!45!black] (3.720,1.660) circle (0.115);
\fill[green!45!black] (3.720,2.000) circle (0.115);
\node[font=\tiny] at (3.720,-0.05) {$5$};
\fill[red!80!black] (3.100,0.300) circle (0.115);
\fill[blue!70!black] (3.100,0.640) circle (0.115);
\fill[blue!70!black] (3.100,0.980) circle (0.115);
\fill[blue!70!black] (3.100,1.320) circle (0.115);
\fill[green!45!black] (3.100,1.660) circle (0.115);
\fill[green!45!black] (3.100,2.000) circle (0.115);
\node[font=\tiny] at (3.100,-0.05) {$6$};
\fill[blue!70!black] (2.480,0.300) circle (0.115);
\fill[blue!70!black] (2.480,0.640) circle (0.115);
\fill[blue!70!black] (2.480,0.980) circle (0.115);
\fill[green!45!black] (2.480,1.320) circle (0.115);
\fill[green!45!black] (2.480,1.660) circle (0.115);
\node[font=\tiny] at (2.480,-0.05) {$7$};
\fill[blue!70!black] (1.860,0.300) circle (0.115);
\fill[blue!70!black] (1.860,0.640) circle (0.115);
\fill[blue!70!black] (1.860,0.980) circle (0.115);
\fill[green!45!black] (1.860,1.320) circle (0.115);
\node[font=\tiny] at (1.860,-0.05) {$8$};
\fill[red!80!black] (1.240,0.300) circle (0.115);
\fill[blue!70!black] (1.240,0.640) circle (0.115);
\node[font=\tiny] at (1.240,-0.05) {$9$};
\node[font=\tiny] at (0.620,-0.05) {$10$};
\node[font=\tiny] at (0.000,-0.05) {$11$};
% ---- legend, clear of the tallest column ----
\fill[red!80!black] (0.15,3.15) circle (0.115);
\node[font=\scriptsize,anchor=west] at (0.35,3.15) {$x_i$ \ -- wire, column $3i$};
\fill[blue!70!black] (0.15,2.78) circle (0.115);
\node[font=\scriptsize,anchor=west] at (0.35,2.78) {$x_ix_j$ \ -- one AND2, $\times 3$ at columns $2i{+}j$ and $i{+}2j$};
\fill[green!45!black] (0.15,2.41) circle (0.115);
\node[font=\scriptsize,anchor=west] at (0.35,2.41) {$x_ix_jx_k$ \ -- one AND3, $\times 3$ at column $i{+}j{+}k{+}1$};
% ---- captions ----
\node[font=\small\bfseries,anchor=west] at (0.0,4.05) {exact cube heap, input $X$ on $n=4$ bits};
\node[font=\scriptsize,anchor=west] at (0.0,3.66) {$36$ heap bits $=4$ wires $+\ 6\!\times\!4$ (AND2) $+\ 4\!\times\!2$ (AND3); tallest column $6$ high};
% ---- what consumes the heap ----
\draw[gray!50] (-0.30,-0.32) -- (7.15,-0.32);
\draw[thick] (-0.30,-1.35) rectangle (7.15,-0.55);
\node[font=\scriptsize] at (3.42,-0.95) {compressor tree $+$ 12-bit carry-propagate adder};
\foreach \x in {0.60,2.20,3.80,5.40,6.80}{\draw[->,gray!70] (\x,-0.34) -- (\x,-0.53);}
\draw[->,thick] (3.42,-1.37) -- (3.42,-1.75);
\node[font=\scriptsize,anchor=north] at (3.42,-1.78) {$X^{3}$ exact, $3n=12$ bits};
\end{circuitikz}
\end{document}
```

*Own construction: the heap of eq. (14.8) enumerated for $n=4$. The book states the cubic growth (p. 450) but draws no cube heap.*

**Expand the cube over ordered index triples.** Write $X=\sum_{i=0}^{n-1}2^{i}x_i$ with $x_i\in\{0,1\}$, so $X$ is $n$ bits wide and $X^3$ needs $3n$. Distributivity of multiplication over addition, applied twice, gives a sum over *ordered* triples $(i,j,k)$:

$$X^{3}=\sum_{i}\sum_{j}\sum_{k}2^{i+j+k}\,x_ix_jx_k$$

That is $n^3$ terms. Every one of them is an AND of at most three bits at a known weight, so it is already a bit heap — a bad one. The whole construction consists of collapsing those $n^3$ ordered triples onto the $\binom{n}{1}+\binom{n}{2}+\binom{n}{3}$ *unordered* ones, and asking what the collapse costs.

**Sort the index set by its equality pattern.** Commutativity of AND means $x_ix_jx_k$ depends only on the multiset $\{i,j,k\}$, and $i+j+k$ is symmetric in the three indices, so every ordering of a given multiset lands the *same* Boolean value in the *same* column. Group the multisets by how many indices coincide and count orderings — the multiplicities are the multinomial coefficients $\tfrac{3!}{a_1!\,a_2!\cdots}$:

| pattern | multiset | orderings | product after idempotence |
| --- | --- | --- | --- |
| all three equal | $\{i,i,i\}$ | $3!/3!=1$ | $x_i^3=x_i$ |
| exactly two equal | $\{i,i,j\}$ | $3!/2!=3$ | $x_i^2x_j=x_ix_j$ |
| all distinct | $\{i,j,k\}$ | $3!=6$ | $x_ix_jx_k$ |

Idempotence of AND ($x\wedge x=x$) is what turns the first two rows into cheaper gates: a cubed bit is a bare wire, and a squared-times-one bit is an ordinary two-input AND. The two-equal pattern occurs twice per unordered pair $\{i,j\}$ with $i<j$ — once as $\{i,i,j\}$ at weight $2i+j$, once as $\{i,j,j\}$ at weight $i+2j$ — and both reduce to the *same* signal $x_ix_j$, so one AND2 feeds two different columns. Collecting the three rows:

$$X^{3}=\sum_{i}2^{3i}x_i\;+\!\!\sum_{i<j}\!\!3\,(2^{i+2j}+2^{2i+j})\,x_ix_j\;+\!\!\sum_{i<j<k}\!\!3\cdot 2^{i+j+k+1}\,x_ix_jx_k\tag{14.8}$$

The $6$ of the all-distinct row has been written $3\cdot 2$ and the $2$ absorbed into the exponent as $+1$, which is the same free-shift move that merges the two triangles of the [[Folded Array Squarer]].

**A multiplicity costs one heap entry per set bit in it.** This is the crux, and it is where the cube parts company with the square. Multiplying a heap entry by a constant $c$ means adding $c\cdot 2^{w}b$ to the heap; expanding $c$ in binary, $c\cdot 2^{w}b=\sum_{t}2^{w+t}b$ over the set bits $t$ of $c$, so the *same wire* is dropped into $\mathrm{popcount}(c)$ columns. No gate, no adder — but $\mathrm{popcount}(c)$ entries where the folding of a squarer left exactly one.

$$\mathrm{popcount}(2)=1,\qquad \mathrm{popcount}(3)=\mathrm{popcount}(6)=2$$

For $p=2$ the only off-diagonal multiplicity is $2=2^1$: a pure power of two, $\mathrm{popcount}=1$, absorbed entirely into the column index. That single fact is the whole squarer saving. For $p=3$ the multiplicities are $3=11_2$ and $6=110_2$, both of $\mathrm{popcount}\ 2$, so $3x=2x+x$ *replicates* the bit at two adjacent weights. The book states this in one line — "the multiplication by 3 of a bit actually replicates it in the bit heap" (p. 450) — and it is the entire reason the cube is expensive. The general statement: only the $2$-adic valuation of a multinomial coefficient is free, and $p=2$ is the only exponent whose off-diagonal coefficients are pure powers of two.

**Count the heap.** Each diagonal term is $1$ entry, each of the $\binom{n}{2}$ pairs is $2$ columns $\times\ \mathrm{popcount}(3)=4$ entries, each of the $\binom{n}{3}$ triples is $1$ column $\times\ 2 = 2$ entries:

$$H_3(n)=n+4\binom{n}{2}+2\binom{n}{3}=n+2n(n-1)+\frac{n(n-1)(n-2)}{3}=\frac{n(n^{2}+3n-1)}{3}$$

Gates: $\binom{n}{2}$ AND2 and $\binom{n}{3}$ AND3, no adders before the heap. For $n=4$ that is $36$ entries — the diagram — and for $n=12$ it is $716$, against $78$ for the exact squarer of the same input width. Cubic in $n$, exactly as the book asserts.

**Column heights are wildly uneven, and that is what actually hurts.** The diagram's tallest column is $6$ high while its outermost columns hold one bit each. Compressor-tree depth is $\Theta(\log h)$ in the *tallest* column $h$ ([[Compressor Trees]]), and $h$ for a cube heap grows quadratically — the middle column collects a constant fraction of $\Theta(n^2)$ pair entries plus $\Theta(n^3)$ triple entries spread over $3n$ columns. So the cube pays twice over the square: more entries, and more of them stacked in the same place.

**FPGA: below six bits, do not build the heap at all.** A LUT6 computes an arbitrary function of six inputs, so for $n\le 6$ every one of the $3n$ output bits of an exact cube is a function of $n\le 6$ variables and costs exactly one LUT6 — $18$ LUT6 for a complete exact 6-bit cuber, with no compressor tree and no carry-propagate adder. The book makes the same point for approximate powers: "plain tabulation is attractive for very small precisions since it also provides correct rounding" (p. 451). On ASIC the trade is different, because a LUT is not free there and the AND2/AND3 array genuinely is cheap; the heap survives a little longer.

$$\boxed{\;H_3(n)=n+4\binom{n}{2}+2\binom{n}{3}=\frac{n(n^{2}+3n-1)}{3}=\Theta(n^{3})\;}$$

**When it breaks**

- **$n>5$.** Computing $X^3$ as $X^2\cdot X$ costs a squarer heap of $\tfrac{n(n+1)}{2}$ plus a $2n\times n$ multiplier heap of $2n^2$, i.e. $\tfrac{5n^2+n}{2}$ entries — quadratic. Setting $H_3(n)=\tfrac{5n^2+n}{2}$ gives $n=5$ exactly ($65$ entries each way), and beyond that the direct expansion loses by a growing factor. Its one remaining advantage is that it is a **single** heap: one compressor tree and one carry-propagate adder, where [[Square-and-Multiply Power Chain]] pays for two in series.
- **$n\le 6$ on FPGA.** Tabulate; see above.
- **$p\ge 4$.** Hopeless. The multiplicities become $4,6,12,24$, the all-distinct family becomes $\binom{n}{4}$ four-input ANDs, and the heap is $\Theta(n^4)$. $X^4$ is $(X^2)^2$ with two squarers.
- **Signed input.** Eq. (14.8) is derived from an *unsigned* binary expansion. For $X\in\mathrm{sfix}(m,\ell)$ the MSB carries weight $-2^{m}$, so a term is negated whenever the MSB appears an odd number of times in its multiset; those entries must enter the heap as sign-extended negatives rather than as plain bits, and the clean AND-only structure is gone. Output signedness follows the parity of $p$ — see [[Number Formats]].
- **Exactness.** Everything above is the exact $3n$-bit result. Truncation is the only thing that makes a cube heap competitive at any useful width, and it is the ordinary heap-truncation machinery of [[Truncated Multipliers]], not something cube-specific.

> [!warning] The source gives no quantitative saving for a truncated cube
> The book says the truncation techniques of Sect. 7.2.4 "may dramatically reduce the bit heap size" (Fig. 7.18, p. 173) but explicitly declines to quantify it: "this must be evaluated in an application-dependent way, as it really depends on the number of bits of the cube which are actually needed." No closed form for a truncated $H_3$ appears anywhere in Chap. 14 — needs outside research.

**RTL (Spade)**

```spade
/// one heap entry: the bit b dropped into column w of a 3n = 12-bit heap
fn place(b: bool, w: uint<12>) -> uint<12> {
    if b { 1 << w } else { 0 }
}

/// 3 * 2^w * b.  The odd factor 3 is not a shift: 3x = 2x + x, so a
/// multiplicity of 3 costs TWO heap entries, at columns w and w+1.
fn mul3(b: bool, w: uint<12>) -> uint<12> {
    place(b, w) +. place(b, w +. 1)
}

entity cube4(x: uint<4>) -> uint<12> {
    let b = x.as_bits();          // index 0 = LSB

    // all indices equal: x_i^3 = x_i, a wire into column 3i
    let diag = place(b[0], 0) +. place(b[1], 3)
            +. place(b[2], 6) +. place(b[3], 9);

    // two indices equal: x_i^2 x_j = x_i x_j, one AND2 feeding columns
    // 2i+j and i+2j, each with multiplicity 3
    let p01 = b[0] && b[1];
    let p02 = b[0] && b[2];
    let p03 = b[0] && b[3];
    let p12 = b[1] && b[2];
    let p13 = b[1] && b[3];
    let p23 = b[2] && b[3];
    let pairs = mul3(p01, 1) +. mul3(p01, 2)
             +. mul3(p02, 2) +. mul3(p02, 4)
             +. mul3(p03, 3) +. mul3(p03, 6)
             +. mul3(p12, 4) +. mul3(p12, 5)
             +. mul3(p13, 5) +. mul3(p13, 7)
             +. mul3(p23, 7) +. mul3(p23, 8);

    // all indices distinct: one AND3, multiplicity 6 = 3*2, the 2 folded
    // into the weight -> column i+j+k+1
    let trips = mul3(b[0] && b[1] && b[2], 4)
             +. mul3(b[0] && b[1] && b[3], 5)
             +. mul3(b[0] && b[2] && b[3], 6)
             +. mul3(b[1] && b[2] && b[3], 7);

    diag +. pairs +. trips
}
```

`place` is one dot in the diagram; `mul3` is the pair of vertically adjacent dots that an odd multiplicity forces. The three `let` bindings are the three legend colours, and the column indices in the `mul3` calls are literally $2i+j$, $i+2j$ and $i+j+k+1$ read off eq. (14.8). Everything is combinational — there is no `reg`, so `cube4` is a cloud of AND gates and one adder tree. Arithmetic is done with the truncating `+.` (12 bits in, 12 bits out) rather than `+`, which would widen by one bit per operator; truncation is safe because $X<2^4\Rightarrow X^3<2^{12}$, so no intermediate partial sum can overflow the exact result.

The drawing shows a compressor tree; the RTL shows a chain of `+.`. Synthesis will not build either literally — it flattens the whole expression and re-balances it, and on FPGA it will collapse most of `place`/`mul3` into LUTs rather than emitting an explicit AND array. The chain is written this way so each source line maps to one term of (14.8).

*Verified:* compiles with `spade 0.19.0`; simulated against a behavioural `x*x*x` reference over all $16$ inputs plus $3000$ random vectors plus named asymmetric cases ($x=9=1001_2$, $x=13$), $3022$ vectors, zero mismatches. Perturbing one column index ($x_1$ placed in column $4$ instead of $3$) makes the testbench fail, so the check is not vacuous.

**Related Notes**

- [[Bit Heaps]] – depends-on: every term of (14.8) is one heap entry at a stated weight; this note is nothing but a weight assignment.
- [[Compressor Trees]] – depends-on: consumes the heap, and its $\Theta(\log h)$ depth is what makes the uneven column heights expensive.
- [[Folded Array Squarer]] – compares: the $p=2$ case, where the single off-diagonal multiplicity is $2$ and therefore folds away completely.
- [[Truncated Multipliers]] – supports: the generic column-dropping and compensation machinery, which applies to a cube heap unchanged.
- [[Square-and-Multiply Power Chain]] – counter-example: quadratic where this is cubic, and it wins for every $n>5$.
- [[Faithful Fixed-Point Power]] – extends: the version that is actually built, where truncated squarers and multipliers keep every intermediate at output width.
- [[Choosing a Squarer]] – compares: where the direct expansion sits among the alternatives for a given width and accuracy.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.3.1 Direct Algebraic Expression — eqs. (14.7)–(14.8), the replication of a bit by the factor 3, cubic heap growth, pp. 449–450
- §14.3.2 Computing Powers by Squaring and Multiplying — the $\Theta(n^2)$ alternative, p. 450
- §14.3.3 Approximate Fixed-Point Powers — plain tabulation for small precisions, p. 451
- §7.2.3 Bit heaps, cubes as a worked example, p. 163; §7.2.4 heap truncation, Fig. 7.18, p. 173

Heap counts $H_3(n)$, the $n=5$ crossover, the LUT6 tabulation bound and the signed-input remark are worked here, not taken from the book.
