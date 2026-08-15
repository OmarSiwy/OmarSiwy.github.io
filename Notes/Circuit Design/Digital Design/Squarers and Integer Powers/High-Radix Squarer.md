---
title: "High-Radix Squarer"
description: "Splits X into k-bit subwords so the shared cross product X1*X0 is built once, cutting a 2-way split from 4 DSPs to 3 and a 3-way split from 9 to 6 with no extra additions."
kind: circuit
source: "ASA §14.2.2, pp. 445-446"
status: seed
spade: simulated
tags: [digital, squarer, multiplier, dsp, fpga, squarers-and-integer-powers]
aliases:
  - High-Radix Square
  - Radix-2^k Squarer
  - Subword-Split Squarer
---

# High-Radix Squarer

A squarer built from whole subword multipliers rather than from single AND gates, exploiting the same operand symmetry one level up so that a $j$-way split costs $j(j+1)/2$ multipliers instead of the $j^2$ a general multiplier would need.

```tikz title="Two-way high-radix squarer: three subword multipliers feeding one weighted heap"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- input word, read in radix 2^k ----
  \draw[thick] (0.2,4.6) rectangle (9.6,5.2);
  \draw[thick] (4.9,4.6) -- (4.9,5.2);
  \node at (2.5,4.9) {$X_1$ ($n-k$ b)};
  \node at (7.3,4.9) {$X_0$ ($k$ b)};
  \node[anchor=west] at (0.2,5.6) {$X$ : $n$ b, read in radix $2^{k}$};

  % ---- high subword bus ----
  \draw (2.6,4.6) -- (2.6,4.25);
  \draw (1.5,4.25) -- (4.5,4.25);
  \node[circ] at (2.6,4.25) {};
  \draw[->] (1.5,4.25) -- (1.5,3.8);
  \draw[->] (4.5,4.25) -- (4.5,3.8);

  % ---- low subword bus ----
  \draw (7.4,4.6) -- (7.4,4.0);
  \draw (5.3,4.0) -- (8.3,4.0);
  \node[circ] at (7.4,4.0) {};
  \draw[->] (5.3,4.0) -- (5.3,3.8);
  \draw[->] (8.3,4.0) -- (8.3,3.8);

  % ---- three multipliers ----
  \draw[thick] (0.2,2.6) rectangle (2.8,3.8);
  \node at (1.5,3.35) {$X_1 \cdot X_1$};
  \node[font=\footnotesize] at (1.5,2.95) {$(n{-}k)\times(n{-}k)$};

  \draw[thick] (3.6,2.6) rectangle (6.2,3.8);
  \node at (4.9,3.35) {$X_1 \cdot X_0$};
  \node[font=\footnotesize] at (4.9,2.95) {shared, built once};

  \draw[thick] (7.0,2.6) rectangle (9.6,3.8);
  \node at (8.3,3.35) {$X_0 \cdot X_0$};
  \node[font=\footnotesize] at (8.3,2.95) {$k\times k$};

  % ---- weighted drops into the heap ----
  \draw[->,thick] (1.5,2.6) -- (1.5,1.9);
  \node[anchor=west,font=\footnotesize] at (1.6,2.25) {$\times 2^{2k}$, $2(n{-}k)$ b};
  \draw[->,thick] (4.9,2.6) -- (4.9,1.9);
  \node[anchor=west,font=\footnotesize] at (5.0,2.25) {$\times 2^{k+1}$, $n$ b};
  \draw[->,thick] (8.3,2.6) -- (8.3,1.9);
  \node[anchor=west,font=\footnotesize] at (8.4,2.25) {$\times 2^{0}$, $2k$ b};

  \draw[thick] (0.2,1.0) rectangle (9.6,1.9);
  \node at (4.9,1.45) {align by weight $\rightarrow$ compress $\rightarrow$ carry-propagate add};

  \draw[->,thick] (4.9,1.0) -- (4.9,0.4);
  \node[anchor=north] at (4.9,0.35) {$X^2$, $2n$ b};
\end{circuitikz}
\end{document}
```

**Re-read the operand in radix $2^k$ and the symmetry reappears at subword granularity.** The [[Folded Array Squarer]] argument — split the double sum $\sum_{i,j} 2^{i+j} x_i x_j$ into a diagonal and one triangle, because $x_i x_j = x_j x_i$ by commutativity — never used the fact that the $x_i$ were single bits. It used only that both index sets are the same set. So cut $X$, an $n$-bit unsigned integer, into a low subword $X_0$ of $k$ bits and a high subword $X_1$ of $n-k$ bits, with $X = 2^k X_1 + X_0$, and expand by the binomial theorem:

$$X^{2}=(2^{k}X_1+X_0)^{2}=2^{2k}X_1^{2}+2\cdot 2^{k}X_1X_0+X_0^{2} \tag{14.2}$$

The middle term carries the factor $2$ for exactly the reason the bit-level triangle did: $X_1X_0$ and $X_0X_1$ are the two off-diagonal cells of a $2\times 2$ array, they are equal, and multiplication by $2$ is a hardwired left shift, so **one** multiplier serves both. That is the whole circuit.

**Count operators, and the saving is immediate.** A general $n\times n$ multiplier split two ways needs four subword products ($X_1Y_1$, $X_1Y_0$, $X_0Y_1$, $X_0Y_0$); (14.2) needs **three**. Three ways is stronger — the general multiplier needs $9$, while

$$(2^{2k}X_2+2^{k}X_1+X_0)^{2}=2^{4k}X_2^{2}+2^{2k}X_1^{2}+X_0^{2}+2\cdot2^{3k}X_2X_1+2\cdot2^{2k}X_2X_0+2\cdot2^{k}X_1X_0 \tag{14.3}$$

needs **six**: three squares on the diagonal and three cross products, one per unordered pair. In general a $j$-way split needs $j + \binom{j}{2} = j(j+1)/2$ multipliers against $j^2$, a ratio of $(j+1)/2j$.

**The saving is free, which is what separates this from Karatsuba.** [[Karatsuba]] also drops a $2\times 2$ split from four multipliers to three, but it does so by an algebraic identity that manufactures a product it did not have, $(X_1+X_0)(Y_1+Y_0)$, and then subtracts the two it already computed — extra additions on $n$-bit operands, plus operand growth feeding the middle multiplier. Here nothing is manufactured. $X_1X_0$ was already in the expansion twice; the circuit simply routes one multiplier's output into one heap position shifted by $k+1$. There is no compensating subtraction and no operand growth, so the multiplier saving is not paid for anywhere.

**Widths, since the alignment is the only thing that can go wrong.** With $X$ of $n$ bits, $X_0$ is $k$ bits and $X_1$ is $n-k$ bits (for $n = 2k$ both are $k$). The three products are $2(n-k)$, $n$, and $2k$ bits wide, entering the heap at weights $2^{2k}$, $2^{k+1}$ and $2^0$ respectively. The top of the middle term sits at bit $n+k$, above the bottom of the top term at bit $2k$ whenever $n > k$, so all three overlap and a compressor tree is genuinely needed — these are not three disjoint slices of the answer that could be concatenated. The exact result occupies $2n$ bits; fixed-point scaling is a relabelling of the weights only, see [[Number Formats]].

**On FPGA this is the entire reason the note exists; on ASIC it is not.** The operator count matters because each product must land in one hard multiplier — a [[DSP Blocks|DSP block]] — and DSP blocks are a fixed, small, discrete resource that you either fit into or do not. $k$ is therefore chosen from the device's multiplier geometry, not from $n$: one bit too wide and a product needs two DSPs, undoing the saving it was supposed to deliver. On an ASIC, where a multiplier is just an array you are free to reshape, splitting into subwords is strictly worse than folding at bit level, because a $j$-way split only reaches the ratio $(j+1)/2j$ while the bit-level fold ($j=n$) already reaches $1/2$. Coarse radix buys mappability and gives up folding efficiency.

**The weights do not line up with a DSP cascade, which is the practical catch.** The powers appearing in (14.2) are $0$, $k+1$ and $2k$; AMD DSP chain inputs shift by exactly 17 bits, so even the natural $k=17$ produces $0, 18, 34$ — only one of which is a multiple of 17. The partial sums therefore cannot be accumulated inside the DSP column and must go to soft logic instead. [[DSP-Cascade Squarer]] rewrites (14.2) to repair this for inputs of at most 33 bits.

$$\boxed{\ (2^{k}X_1+X_0)^{2}=2^{2k}X_1^{2}+2^{k+1}X_1X_0+X_0^{2}\ ,\qquad \text{$j$-way: } \tfrac{j(j+1)}{2}\ \text{multipliers vs } j^{2}\ }$$

**When it breaks**

- **$k$ is set by the device, not by the algebra.** A split whose subwords exceed the hard multiplier's operand width costs two DSPs per product and the 3-versus-4 argument inverts.
- **Diminishing returns in $j$.** The ratio $(j+1)/2j$ is $3/4$ at $j=2$ and $2/3$ at $j=3$, and only approaches $1/2$ as the split becomes bit-level — at which point you are simply building a [[Folded Array Squarer]] and the subword framing has bought nothing.
- **The heap does not disappear.** Fewer multipliers still leaves three overlapping products to align, compress and carry-propagate; on a device where DSPs are plentiful and soft logic is the constraint, the saving lands on the wrong side of the budget.
- **Square tiles are a restriction, not a law.** Requiring every tile to be a square is what makes the algebra tidy; [[Squarer Tiling]] shows rectangular and staircase tiles cover the same region better, and [[Multiplier Tiling]] is the general formulation this is a special case of.

> [!warning] Not covered in the source — needs outside research
> §14.2.2 states (14.2)-(14.3) for unsigned $X$ only. The signed case is not symmetric under the split — $X_0$ stays unsigned while $X_1$ carries the sign — so $X_1^2$ and $X_1X_0$ have different signedness and the resulting sign-extension pattern in the heap is not derived in the book.

**RTL (Spade)**

```spade
/// Two-way-split (radix-2^K) squarer: three K x K multipliers, no extra adds.
fn high_radix_square<#uint K>(x: uint<{2 * K}>) -> uint<{4 * K}> {
    let (lo_bits, hi_bits) = x.as_bits().split_at::<K>();
    let x0: uint<K> = lo_bits.as_uint();
    let x1: uint<K> = hi_bits.as_uint();

    let sq_hi: uint<{2 * K}> = x1 * x1;
    let cross: uint<{2 * K}> = x1 * x0;
    let sq_lo: uint<{2 * K}> = x0 * x0;

    let zk: uint<K> = 0;
    let z2k: uint<{2 * K}> = 0;

    let hi_term: uint<{4 * K}> = sq_hi.concat(z2k);
    let cr_shift: uint<{4 * K}> = zext(cross.concat(zk));
    let cr_term: uint<{4 * K}> = cr_shift << 1;
    let lo_term: uint<{4 * K}> = zext(sq_lo);

    hi_term +. cr_term +. lo_term
}
```

`sq_hi`, `cross` and `sq_lo` are the three boxes of the diagram, left to right; `split_at::<K>` is the subword split, and because element 0 of a `[bool; N]` is the LSB, `lo_bits` is $X_0$ and `hi_bits` is $X_1$. The weights are built structurally rather than by shifting: concatenating a zero word is an exact left shift by that word's width, so `sq_hi.concat(z2k)` is $2^{2k}X_1^2$ and `cross.concat(zk) << 1` is $2^{k+1}X_1X_0$. Every `*` doubles width to $2K$ and the three aligned terms are $4K$ bits, which is why the final sum uses the wrapping `+.` — the exact result provably fits in $4K$ bits, so nothing wraps. All of it is combinational; synthesis will infer three multipliers and a single merged adder tree, whereas the diagram draws the alignment, compression and final carry-propagate add as one block that a real backend would fuse with the DSP output registers.

**Related Notes**

- [[Folded Array Squarer]] – compares: the same symmetry argument at bit granularity, reaching a better ratio but without mapping onto hard multipliers.
- [[DSP-Cascade Squarer]] – extends: rewrites (14.2) so the weights become multiples of 17 and the DSP chain can carry the partial sum.
- [[Karatsuba]] – counter-example: also cuts 4 multipliers to 3, but buys it with extra additions; this split pays nothing.
- [[DSP Blocks]] – depends-on: the operator count only matters because each product must fit exactly one hard multiplier.
- [[Multiplier Tiling]] – extends: the general covering problem of which this all-square-tiles split is the trivial case.
- [[Squarer Tiling]] – extends: drops the square-tile restriction and covers only the region on and above the diagonal.
- [[Choosing a Squarer]] – compares: where the subword split sits against the bit-level and truncated constructions.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.2.2 High-Radix Square — eqs. (14.2)-(14.3), DSP counts 4→3 and 9→6, the "no arithmetic overhead" contrast with Karatsuba, the 17-bit AMD chain shift, pp. 445-446
- §14.2.1 Basics — eq. (14.1), the bit-level fold this generalises, p. 445
- §8.4.2.4 DSP cascading, p. 231
