---
title: Unsigned DSP Multiplier Packing
description: "Two small unsigned multiplications sharing an operand out of one 18x27 DSP: concatenate A and B with w_P zeros between them, slice the two products back out of R. No extra adder."
kind: circuit
source: "ASA §8.4.1.1, pp. 223-226"
status: seed
spade: simulated
tags: [digital, multipliers, dsp, fpga, packing]
aliases:
  - Unsigned DSP Packing
  - Unsigned Multiplier Packing
---

# Unsigned DSP Multiplier Packing

Two unsigned multiplications that share one operand are computed by a single
larger multiplier, by placing them in disjoint bit fields of the same product —
the only multiplier trick on this page that costs zero additional arithmetic.

```tikz title="Two unsigned 8-bit multiplications packed into one 18x27 DSP"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.24cm,y=0.24cm]
  % ---- X : 27-bit DSP port, B concatenated above A ----
  \draw (18,16) rectangle (45,18);
  \fill[black!12] (21,16) rectangle (29,18);
  \fill[black!12] (37,16) rectangle (45,18);
  \draw (21,16) rectangle (29,18);
  \draw (37,16) rectangle (45,18);
  \node at (25,17) {$B$};
  \node at (41,17) {$A$};
  \node at (33,17) {\scriptsize $0\ldots 0$};
  \node at (19.5,17) {\scriptsize $0$};
  \node[left] at (-0.8,17) {$X$ (27)};
  % ---- Y : 18-bit DSP port, the shared operand ----
  \draw (27,12) rectangle (45,14);
  \fill[black!12] (37,12) rectangle (45,14);
  \draw (37,12) rectangle (45,14);
  \node at (41,13) {$C$};
  \node at (32,13) {\scriptsize $0\ldots 0$};
  \node[left] at (-0.8,13) {$Y$ (18)};
  % ---- R : 45-bit DSP result, the two products side by side ----
  \draw (0,8) rectangle (45,10);
  \fill[black!12] (13,8) rectangle (29,10);
  \fill[black!12] (29,8) rectangle (45,10);
  \draw (13,8) rectangle (29,10);
  \draw (29,8) rectangle (45,10);
  \node at (21,9) {\small $Q=B\times C$};
  \node at (37,9) {\small $P=A\times C$};
  \node at (6.5,9) {\scriptsize $0\ldots 0$};
  \node[left] at (-0.8,9) {$R$ (45)};
  % ---- the k = w_P boundary, the only thing that has to be right ----
  \draw[dashed,black!60] (29,19.6) -- (29,7.6);
  \draw[|-|] (29,19.2) -- (45,19.2) node[midway,above] {\small $k=16$};
  \draw[|-|] (29,6.8) -- (45,6.8) node[midway,below] {\small $w_P=16$};
  \draw[|-|] (13,6.8) -- (29,6.8) node[midway,below] {\small $w_Q=16$};
  \node at (13.5,10.8) {\scriptsize bit 31};
  \node[left] at (28.6,10.8) {\scriptsize bit 16};
  \node[right] at (45.6,9) {\scriptsize bit 0};
\end{circuitikz}
\end{document}
```

*After Fig. 8.11, p. 224.*

**Start from the resource, not from the algorithm.** A recent AMD DSP block
multiplies $18\times 27$ and accumulates into 45 bits ([[DSP Blocks]]). An 8-bit
inference kernel asks it for $8\times 8$, which lights up $64$ of its $486$
partial-product positions — about $13\%$. On an ASIC that waste does not exist:
you instantiate an $8\times 8$ array and pay for $8\times 8$. On an FPGA the DSP
column is fixed silicon that is present whether or not you fill it, so the
unused part of the array is not cost, it is *unclaimed capacity*, and the
question stops being "how do I build a small multiplier" and becomes "what else
fits in the same block" (pp. 222–223).

**One multiplication computes two whenever the two share a factor.** Take the
pair $P = A\times C$ and $Q = B\times C$ — one operand shared, exactly the shape
of a weight reused across two activations in [[Arithmetic for Deep Learning]].
Set

$$X = A + 2^{k}B,\qquad Y = C$$

and by distributivity of multiplication over addition,

$$R = X\times Y = A\times C + 2^{k}\,B\times C = P + 2^{k}Q$$

No assumption has been used yet beyond distributivity: $R$ carries both products,
one at weight $2^0$ and one at weight $2^{k}$.

**Separating them again is a bound on $P$, not an alignment of $Q$.** With $A$ on
$w_A$ bits and $C$ on $w_C$ bits, both unsigned,
$0\le P\le(2^{w_A}-1)(2^{w_C}-1)<2^{w_P}$ with $w_P=w_A+w_C$ — the standard
unsigned product width of [[Number Formats]]. So $P$ cannot reach bit $w_P$, and
choosing

$$k\ \ge\ w_P$$

guarantees that no carry out of $P$ ever lands in $Q$'s field. The two products
then read straight off $R$ as slices, with no subtraction and no correction term:

$$P = R[w_P-1\ldots 0],\qquad Q = R[k+w_Q-1\ldots k],\qquad w_Q=w_B+w_C$$

Nothing above bit $k+w_Q-1$ is ever set either, since $Q<2^{w_Q}$ and $P<2^{k}$
give $R<2^{k+w_Q}$ — worth knowing because it is what makes the slice a plain
wire fan-out rather than a masked read.

> [!note]
> The whole technique is this inequality. $k\ge w_P$ is the only correctness
> condition; everything else on this page is packaging.

**In the unsigned case the "addition" $A+2^{k}B$ is not an addition.** $A$
occupies bits $w_A-1\ldots 0$ and $2^{k}B$ occupies bits $k+w_B-1\ldots k$. Since
$w_A<w_P\le k$ — strictly, because $w_C\ge 1$ — the two supports are disjoint,
and on disjoint supports addition, bitwise OR and concatenation are the same
function. Building $X$ therefore costs **zero LUTs and zero delay**: it is
routing, and the zeros between the fields are constants the packer never has to
drive. That is the entire reason the unsigned case gets its own note, and the
entire reason the signed case does not get to be this cheap.

**The concrete instance the book draws.** With $w_A=w_B=w_C=8$ and $k=w_P=16$:
$X$ is $k+w_B=24$ bits into the 27-bit port, $Y$ is 8 bits into the 18-bit port,
and $R$ is $24+8=32$ bits of the 45-bit result — $P$ in $R[15\ldots 0]$, $Q$ in
$R[31\ldots 16]$ (Fig. 8.11, p. 224). Two 8-bit multiplications, one DSP, no
fabric. Doubling DSP throughput for 8-bit inference is not a marginal win on
parts where the DSP column, not the LUT array, is what runs out first.

> [!warning] The book's (8.28) writes $Q = R[w_P+w_Q\ldots w_P]$, whose inclusive
> top index is one bit above what $Q$ needs; the signed version (8.34) writes
> $\ldots w_P+w_Q-1\ldots$. The extra bit is provably $0$ by the $R<2^{k+w_Q}$
> bound above, so the formula still returns the right value — it is a slip, not a
> wrong answer, but copy (8.34)'s indexing.

**Slack in $k$ is worth spending deliberately.** $k\ge w_P$ is a lower bound, and
when several packed results are to be summed in the DSP's post-adder, $k$ should
be taken **as large as the port allows**: each accumulation can carry out of
$P$'s field, and the gap $k-w_P$ is exactly the number of accumulations' worth of
headroom before $P$'s carries reach $Q$ (p. 226). The same identity taken further
gives four $4\times 4$ products $X_1Y_1, X_1Y_2, X_2Y_1, X_2Y_2$ from one block
when both operands are packed — there the cross terms are wanted, which is the
only case where packing *both* ports makes sense. Packing more than two words is
possible and rarely useful: below 8 bits a multiplier is cheaper as a LUT table
than as a share of a DSP.

**When the DSP is too small, the technique inverts.** Using an $18\times 18$
block for two $8\times 8$ products forces $k<w_P$, and the fields overlap. The
repair (p. 226) is to compute the overlapping low bits of $Q$ in a small
LUT-based multiplier and **subtract** them from $R$ — which both removes the
overlap and cancels any carry that had already propagated up into $Q$'s bits —
then concatenate the corrected upper bits onto the LUT-computed lower ones. That
costs a small multiplier plus a subtractor, so the arbitrage is real but thin;
[[Multiplier Tiling]] is the systematic way to decide whether it is worth it.

$$\boxed{\ (A+2^{k}B)\times C \;=\; \underbrace{A\times C}_{P<2^{w_P}} \;+\; 2^{k}\underbrace{B\times C}_{Q<2^{w_Q}},\qquad k\ge w_P=w_A+w_C\ }$$

**When it breaks.**

- **Signed operands.** $A$ must be sign-extended before the shift-and-add, so
  $A+2^{k}B$ becomes a genuine addition (the DSP pre-adder), and $Q$ then
  overlaps $P$'s sign extension and needs a $\pm 1$ correction —
  [[Signed DSP Multiplier Packing]]. A stray sign bit in a nominally unsigned $A$
  corrupts $Q$ silently: there is no error signal, only a wrong product.
- **No shared operand.** Packing both ports gives
  $R = AC + 2^{m}AD + 2^{k}BC + 2^{k+m}BD$: the cross terms $AD$ and $BC$ are
  computed whether wanted or not, and cannot be separated from the two wanted
  products at any choice of $k,m$ unless all four are wanted.
- **$k<w_P$.** Overlap; correctness needs the LUT-subtract fixup above.
- **Small operands.** Below roughly 8 bits per operand the LUT tabulation of the
  whole product wins outright, and the DSP's fixed routing and pipeline latency
  starts to dominate the arithmetic it performs (p. 222).
- **Widths that do not fit.** $k+w_B$ must fit the 27-bit port and $w_C$ the
  18-bit port; $k$ is a synthesis-time constant, so nothing here adapts at run
  time.
- **Accuracy is not a corner case here.** $P$ and $Q$ come out exact; packing
  introduces no error at all, and every accuracy question belongs to whatever
  produced the 8-bit operands ([[Quantization]]).

```spade
/// Two unsigned 8-bit products sharing operand C, out of one 24 x 8 multiply.
fn dsp_pack_u8(a: uint<8>, b: uint<8>, c: uint<8>) -> (uint<16>, uint<16>) {
    let x: uint<24> = b.concat(zext::<8, 16>(a));   // X = A + 2^16 B, wiring only
    let r: uint<48> = x * zext::<8, 24>(c);         // R = X * C
    let rb = r.as_bits();
    (rb[0..16].as_uint(), rb[16..32].as_uint())     // P = R[15..0], Q = R[31..16]
}
```

`concat` on integers puts its receiver in the **high** half, so `b.concat(a)` is
the $X$ row of the diagram: $B$ at bit 16, $A$ at bit 0, the eight zeros between
them supplied by the `zext`. Everything is combinational — the block is pure
wiring around one multiply. Spade's `*` demands equal operand widths, so $C$ is
zero-extended to 24 bits and `r` is declared 48 bits wide; synthesis propagates
the constant zeros back out and infers the $24\times 8$ shape that actually maps
onto one DSP, and bits 47..32 of `r` are trimmed as unread. The `as_bits` slices
are the DSP's output wires re-labelled, not logic.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §8.4, pp. 222–223
  (when a DSP is the wrong shape).
- §8.4.1.1 *Unsigned Multiplication*, pp. 223–224, eqs. (8.27)–(8.28) and
  Fig. 8.11, p. 224.
- §8.4.1.3 *Extensions*, p. 226 (accumulating packed results, four $4\times 4$
  products, the too-small-DSP fixup).

- [[DSP Blocks]] – depends-on: the $18\times 27$ shape and the 45-bit post-adder
  are what makes the leftover room worth claiming.
- [[Signed DSP Multiplier Packing]] – extends: same identity once $A$ is
  sign-extended, at the price of a real pre-addition and a correction bit.
- [[Arithmetic for Deep Learning]] – supports: the shared-operand pattern is a
  weight reused across activations, and 8-bit inference is where it pays.
- [[Quantization]] – depends-on: what makes the operands small enough to pack in
  the first place.
- [[Multiplier Tiling]] – compares: the general framework for fitting multiplier
  shapes to heterogeneous resources, of which packing is the degenerate
  one-tile case.
