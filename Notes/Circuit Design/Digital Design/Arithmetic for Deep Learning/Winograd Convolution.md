---
title: Winograd Convolution
description: "Pre-addition, element-wise multiply, post-addition: computes m outputs of an r-tap convolution in the provably minimal m+r-1 multiplications, and stops paying once the multiplier is small enough that three adders cost more than one multiply."
kind: circuit
source: "ASA §24.5.2, pp. 737-741"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, convolution, cnn, multiplier, transform]
aliases:
  - Winograd
  - Winograd Algorithm
  - Winograd Fast Convolution
  - Winograd Short Convolution
  - Winograd Transform
---

# Winograd Convolution

A short convolution restructured into pre-addition, element-wise multiplication and post-addition, so that $m$ outputs of an $r$-tap filter cost $m+r-1$ multiplications instead of $mr$ — the provable minimum, and the only fast-convolution scheme in this chapter that is minimal rather than merely good.

```tikz title="Winograd F(2,2): the B and A pre-addition blocks, three multipliers, and the C post-addition block"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  op/.style={draw,circle,inner sep=1.2pt,minimum size=0.44cm}]

  % ---- dashed transform boxes ----
  \draw[dashed] (1.50,2.05) rectangle (2.50,4.35);
  \node[anchor=south] at (2.00,4.38) {$\mathbf B$};
  \draw[dashed] (1.50,0.15) rectangle (2.50,1.45);
  \node[anchor=south] at (2.00,1.48) {$\mathbf A$};
  \draw[dashed] (7.00,2.05) rectangle (7.85,4.35);
  \node[anchor=south] at (7.40,4.38) {$\mathbf C$};

  % ---- operators ----
  \node[op] (a1) at (2.00,4.00) {$+$};
  \node[op] (a2) at (2.00,2.40) {$+$};
  \node[op] (a3) at (2.00,0.80) {$+$};
  \node[op] (m1) at (4.60,4.00) {$\times$};
  \node[op] (m2) at (5.20,3.20) {$\times$};
  \node[op] (m3) at (5.80,2.40) {$\times$};
  \node[op] (c1) at (7.40,4.00) {$+$};
  \node[op] (c2) at (7.40,2.40) {$+$};
  \node[font=\small] at (2.16,3.48) {$-$};
  \node[font=\small] at (1.70,2.18) {$-$};
  \node[font=\small] at (7.14,2.18) {$-$};

  % ---- inputs ----
  \node[anchor=east] at (-0.05,4.00) {$X_0$ [8]};
  \node[anchor=east] at (-0.05,3.20) {$X_1$ [8]};
  \node[anchor=east] at (-0.05,2.40) {$X_2$ [8]};
  \node[anchor=east] at (-0.05,1.20) {$W_0$ [8]};
  \node[anchor=east] at (-0.05,0.40) {$W_1$ [8]};

  % ---- data path into B ----
  \draw[->] (0.00,4.00) -- (a1.west);
  \draw[->] (0.00,2.40) -- (a2.west);
  \draw[->] (0.00,3.20) -- (m2.west);
  \draw[->] (2.00,3.20) -- (a1.south);
  \draw[->] (2.00,3.20) -- (a2.north);
  \node[circ] at (2.00,3.20) {};

  % ---- weight path into A ----
  \draw (0.00,1.20) -- (4.60,1.20);
  \draw (0.00,0.40) -- (5.80,0.40);
  \draw[->] (2.00,1.20) -- (a3.north);
  \draw[->] (2.00,0.40) -- (a3.south);
  \node[circ] at (2.00,1.20) {};
  \node[circ] at (2.00,0.40) {};

  % ---- pre-additions to the multipliers ----
  \draw[->] (a1.east) -- (m1.west);
  \draw[->] (a2.east) -- (m3.west);
  \draw[->] (4.60,1.20) -- (m1.south);
  \draw[->] (a3.east) -- (5.20,0.80) -- (m2.south);
  \draw[->] (5.80,0.40) -- (m3.south);

  % ---- post-additions ----
  \draw[->] (m1.east) -- (c1.west);
  \draw[->] (m3.east) -- (c2.west);
  \draw (m2.east) -- (7.40,3.20);
  \draw[->] (7.40,3.20) -- (c1.south);
  \draw[->] (7.40,3.20) -- (c2.north);
  \node[circ] at (7.40,3.20) {};

  % ---- outputs ----
  \draw[->] (c1.east) -- (8.70,4.00);
  \draw[->] (c2.east) -- (8.70,2.40);
  \node[anchor=west] at (8.75,4.00) {$Y_0$ [17]};
  \node[anchor=west] at (8.75,2.40) {$Y_1$ [17]};

  % ---- wire annotations ----
  \node[anchor=south,font=\footnotesize] at (3.40,4.05) {$X_0{-}X_1$ [9]};
  \node[anchor=south,font=\footnotesize] at (3.60,3.25) {$X_1$ [8]};
  \node[anchor=south,font=\footnotesize] at (3.35,2.45) {$X_1{-}X_2$ [9]};
  \node[anchor=south,font=\footnotesize] at (3.55,0.85) {$W_0{+}W_1$ [9]};
  \node[anchor=south,font=\footnotesize] at (6.10,4.05) {$M_1$ [18]};
  \node[anchor=south,font=\footnotesize] at (6.30,3.25) {$M_2$ [18]};
  \node[anchor=south,font=\footnotesize] at (6.30,2.45) {$M_3$ [18]};

  \node[anchor=north,font=\footnotesize] at (4.20,-0.10)
    {$3$ multiplications and $5$ additions, against $4$ and $2$ for the direct form};
\end{circuitikz}
\end{document}
```

*after Fig. 24.15, p. 739; widths are the 8-bit instance of the RTL below.*

**Fix what "minimal" means before believing it.** Computing $m$ outputs of a 1-D convolution with $r$ weights consumes $n = m + r - 1$ inputs, because consecutive outputs slide the window by one and the windows overlap in $r-1$ samples. Winograd's result is that the number of multiplications required is exactly that input count $n$, and no algorithm can do it in fewer (p. 737, after Toom and Cook). The direct form spends $m \times r$. In $d$ dimensions the algorithm nests and the count is still the number of inputs:

$$n = (m+r-1)^d \quad\text{instead of}\quad (m\times r)^d \tag{24.21}$$

The convention $F(m^d, r^d)$ names the case. This matters because "minimal" here is a lower bound on *multiplications only* — nothing in the statement bounds the additions, and the additions are where the whole engineering argument ends up living.

**Derive $F(2,2)$ by hand; the identity is Karatsuba wearing convolution clothes.** With $n=3$ inputs $X_0,X_1,X_2$ (8-bit activations), $r=2$ weights $W_0,W_1$ (8-bit) and $m=2$ outputs, the direct form is

$$Y_0 = X_0W_0 + X_1W_1, \qquad Y_1 = X_1W_0 + X_2W_1 \tag{24.22–24.23}$$

— four multiplications and two additions. Rewrite it as

$$
Y_0 = M_1+M_2,\quad Y_1 = M_2-M_3,\qquad
\begin{aligned}
M_1 &= (X_0-X_1)W_0\\
M_2 &= X_1(W_0+W_1)\\
M_3 &= (X_1-X_2)W_1
\end{aligned}
\tag{24.24–24.28}
$$

Expand $M_1+M_2$ by distributivity of multiplication over addition: $X_0W_0 - X_1W_0 + X_1W_0 + X_1W_1$, and the two $X_1W_0$ terms cancel by additive inverse, leaving $X_0W_0+X_1W_1$. Likewise $M_2-M_3 = X_1W_0+X_1W_1-X_1W_1+X_2W_1 = X_1W_0+X_2W_1$. Three multiplications, five additions: **one multiply traded for three adds**. The mechanism — introduce a shared product of two sums, then subtract off the cross terms you did not want — is exactly [[Karatsuba]]'s, and the book says so outright (p. 739): Karatsuba is a generalisation describable in the same pre-/post-addition form.

**Matrix form turns the identity into a three-stage architecture.** Collecting the additions into matrices,

$$\mathbf Y = \mathbf C\big[(\mathbf{BX}) \odot (\mathbf{AW})\big] \tag{24.29}$$

with $\odot$ the element-wise product and

$$
\mathbf A = \begin{pmatrix}1&0\\1&1\\0&1\end{pmatrix},\quad
\mathbf B = \begin{pmatrix}1&-1&0\\0&1&0\\0&1&-1\end{pmatrix},\quad
\mathbf C = \begin{pmatrix}1&1&0\\0&1&-1\end{pmatrix}
\tag{24.32–24.34}
$$

$\mathbf A$ and $\mathbf B$ are the pre-additions, $\mathbf C$ the post-additions, and this is precisely the three dashed blocks of the diagram. The structural consequence is the one that matters for hardware: **multiplication happens in exactly one place**, the $\odot$, and it is $n$ scalar multiplications wide with no reduction tree behind it. Everything else is a fixed sparse linear map with tiny integer coefficients. The datapath is therefore an adder network, a multiplier row, and another adder network — three independent stages that pipeline cleanly, unlike the sum-of-products of the [[Quantized MAC Neuron]] where the multiplier row feeds a compressor tree that dominates the depth.

**The pre-additions grow the operands, so the multipliers get fewer and slightly wider.** $X_0-X_1$ has range $[-2^8, 2^8-1]$ for 8-bit signed inputs, one bit wider than $X_0$; $W_0+W_1$ likewise. So the $\odot$ multipliers in the $F(2,2)$ circuit are $9\times 9\to 18$ bits where the direct form's are $8\times 8\to 16$. The book states this explicitly (p. 741): the multipliers "are reduced in count, but their cost is slightly higher". The alternative — rounding the intermediates, which is what happens automatically in floating point — is worse than it looks: **the fast algorithm then becomes less accurate than the straightforward one**, because the cancellation that made the identity true is now cancellation between rounded quantities. Every claim above assumes the additions and the multiplications by $\mathbf A,\mathbf B,\mathbf C$ are exact (see [[Error Accuracy]] for why cancellation is the worst case for a rounded sum).

**Nesting gives the 2-D algorithm, which is where the counts become interesting.** The minimal 1-D algorithm composes with itself along the second axis:

$$\mathbf Y = \mathbf C\big[(\mathbf{BXB}^\mathsf T)\odot(\mathbf{AWA}^\mathsf T)\big]\mathbf C^\mathsf T \tag{24.35}$$

with $\mathbf X$ now $n\times n$ and $\mathbf W$ now $r\times r$ (p. 739). For $F(2^2,3^2)$ — two-by-two outputs from the $3\times3$ kernel that dominates CNNs — this is 16 multiplications against 36, a $2.25\times$ reduction, and every coefficient of $\mathbf A,\mathbf B,\mathbf C$ is a power of two, so the transforms are **pure shifts and adds with no multiplier at all** (p. 740). That combination is why $F(2^2,3^2)$ is the case everyone implements.

| $d$ | $m$ | $r$ | $n$ | direct mult | direct add | Winograd mult | Winograd add |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2 | 2 | 3 | 4 | 2 | 3 | 5 |
| 1 | 2 | 3 | 4 | 6 | 4 | 4 | 11 (12) |
| 2 | 2 | 2 | 9 | 16 | 12 | 9 | 16 (23) |
| 2 | 2 | 3 | 16 | 36 | 32 | 16 | 77 (92) |
| $d$ | $m$ | $r$ | $(m{+}r{-}1)^d$ | $m^dr^d$ | $m^d(r^d-1)$ | $(m{+}r{-}1)^d$ | — |

*Table 24.2, p. 740. Bracketed figures are the addition counts without common-subexpression elimination; the table does not count the cost of the constant multiplications.*

**Common-subexpression elimination is not an afterthought here, it is part of the cost model.** In $F(2,3)$ the transformed weight vector $\mathbf{AW}$ contains both $\tfrac{W_0}{2}+\tfrac{W_1}{2}+\tfrac{W_2}{2}$ and $\tfrac{W_0}{2}-\tfrac{W_1}{2}+\tfrac{W_2}{2}$, which share the term $\tfrac{W_0}{2}+\tfrac{W_2}{2}$ (24.39, p. 740) — 12 additions become 11. That is the small case; the bracketed column shows 92 dropping to 77 in $F(2^2,3^2)$. The general shape of the problem is now visible: **all $n$ rows of a transform read the same input vector and multiply it by fixed constants**, which is the definition of [[Multiple Constant Multiplication]]. Once $n$ and $r$ grow past the power-of-two-coefficient cases, $\mathbf A,\mathbf B,\mathbf C$ hold small rationals and each coefficient becomes a [[Shift-and-Add]] constant multiplier, so the right way to cost a Winograd block is to hand the whole transform matrix to an MCM/adder-graph optimiser rather than to count its entries.

**The weight transform is free at inference, and that asymmetry decides the architecture.** $\mathbf{AW}$ in (24.29) and $\mathbf{AWA}^\mathsf T$ in (24.35) depend only on the weights, so in a partly-parallelised CNN they are computed once and reused across the whole image (p. 741). Only $\mathbf{BX}$ and the final $\mathbf C(\cdot)\mathbf C^\mathsf T$ are per-tile work. In the fully unrolled architecture class the weights are constants in the netlist anyway and the whole $\mathbf A$ block evaporates into the constant multipliers; in the stream/dataflow class the transformed weights sit in a small local ROM beside the tile. The input window itself comes from the same line-buffer structure any convolution layer needs, widened by $r-1$ so that neighbouring outputs share their overlapping samples ([[Convolution Line Buffer]], and the "several results per cycle" case of p. 737).

**On FPGA the trade is a resource swap with a hard denominator; on ASIC it is a smooth area curve.** An FPGA has a fixed count of DSP blocks and a large pool of LUTs, and Winograd converts multiplications into additions — it moves work from the scarce resource to the plentiful one. A layer that is DSP-bound gets faster by a factor close to the multiplication ratio; a layer already implemented in LUTs because the operands are narrow gets nothing but extra adders, and the transform's own shifts are free only because FPGA routing makes constant shifts free. On ASIC there is no quantised resource to run out of, so the decision is the straight area/energy comparison below, with the multiplier and adder both costing what their widths say.

$$\boxed{\ \mathbf Y=\mathbf C\big[(\mathbf{BXB}^\mathsf T)\odot(\mathbf{AWA}^\mathsf T)\big]\mathbf C^\mathsf T \quad\text{in}\quad n=(m+r-1)^d\ \text{multiplications, the minimum}\ }$$

**When it breaks.**

- **Narrow operands.** For a $p$-bit fixed-point format one multiplier costs roughly $p$ adders (p. 741). $F(2,2)$ buys one multiplier for three adders and $F(2^2,3^2)$ buys 20 for 45 — about $2.25$ adders each — so the crude model only favours Winograd while $p$ is comfortably above that ratio, and the uncounted terms (wider adders, the constant multiplications, the registers holding the transformed tile) eat the remaining margin first. As $p$ falls toward int8 and below, **Winograd and aggressive quantization become competing optimizations rather than composable ones** — you spend the same silicon twice on the same multiplier.
- **Floating-point intermediates.** Rounding inside the transform makes the result *less* accurate than the direct convolution (p. 741). The algorithm is an exact-arithmetic identity; it degrades exactly where cancellation is largest.
- **Large tiles.** The multiplication count keeps falling as $m$ grows, the addition count and the coefficient magnitudes do not.

> [!warning] Not covered in the source — needs outside research
> The book gives the coefficient structure for larger $n$ and $r$ ("rational numbers with small numerators and denominators", p. 740) but no numerical-stability analysis and no rule for the largest usable tile size. The practical limit reported in the CNN literature comes from the conditioning of the transform matrices, which §24.5.2 does not treat; it refers the reader to Lavin & Gray and to Blahut, ch. 5.

> [!warning] Not covered in the source — needs outside research
> §24.5.2 treats only unit-stride convolution. Strided and dilated layers, and the $1\times1$ convolutions that make up most of the multiply-accumulates in modern networks, are outside the derivation — and a $1\times1$ kernel has $r=1$, for which $n = m$ and Winograd saves nothing at all.

**RTL (Spade).**

```spade
/// Winograd F(2,2): two outputs of a 2-tap convolution in three multiplications.
/// 8-bit signed activations and weights; the pre-additions widen both to 9 bits.
entity winograd22(x0: int<8>, x1: int<8>, x2: int<8>, w0: int<8>, w1: int<8>)
    -> (int<17>, int<17>)
{
    // B: pre-additions on the data path, 8 -> 9 bits
    let d0: int<9> = x0 - x1;
    let d1: int<9> = sext(x1);
    let d2: int<9> = x1 - x2;
    // A: pre-addition on the weight path, 8 -> 9 bits (precomputable)
    let g0: int<9> = sext(w0);
    let g1: int<9> = w0 + w1;
    let g2: int<9> = sext(w1);
    // the three multiplications: the whole operator's multiplier budget
    let m1: int<18> = d0 * g0;
    let m2: int<18> = d1 * g1;
    let m3: int<18> = d2 * g2;
    // C: post-additions
    let y0: int<17> = trunc(m1 + m2);
    let y1: int<17> = trunc(m2 - m3);
    (y0, y1)
}
```

`d0`, `d1`, `d2` are the three wires leaving the $\mathbf B$ box and `g0`, `g1`, `g2` those leaving $\mathbf A$; the identity rows of both matrices show up as `sext`, which is a no-op in silicon and the reason only three of the six wires cost an adder. Spade's own width rule does the arithmetic: `int<9> * int<9>` is `int<18>`, which is the operand growth the book warns about made mandatory by the type system, and `+` on two `int<18>` is `int<19>`. The `trunc` back to 17 bits is the one place a proof is doing work — the 19-bit intermediate is only formally that wide, since $M_1+M_2$ collapses to $X_0W_0+X_1W_1 \in [-2^{15}, 2^{15}]$, so no bit is lost; a synthesiser cannot see that and will keep the two dead bits unless the post-adder is written at the width the identity permits. All of it is combinational — one adder network, one multiplier row, one adder network — and the natural pipeline boundaries are exactly the two dashed-box edges in the diagram.

Verified by simulation against a behavioural reference of (24.22)–(24.23): 4264 vectors passed, including asymmetric single-tap probes that isolate each of the six $X_iW_j$ paths, both signed extremes $\pm 2^{14}$, a 4000-case random sweep, and an exhaustive sweep of $(W_0,W_1)$ against a fixed asymmetric window.

**Related Notes.**

- [[Karatsuba]] – compares: the same pre-/post-addition identity applied to the limbs of one product instead of the taps of a convolution; the book calls Winograd its generalisation.
- [[Multipliers]] – depends-on: what the $\odot$ stage is built from, and whose per-bit cost sets the break-even against the extra adders.
- [[Shift-and-Add]] – supports: how a coefficient of $\mathbf A,\mathbf B,\mathbf C$ is realised once it stops being a power of two.
- [[Multiple Constant Multiplication]] – supports: all rows of a transform share one input vector, so the honest cost of $\mathbf B$ is an adder graph over the whole matrix, not the sum of its entries.
- [[Convolution Line Buffer]] – depends-on: supplies the $n$-sample window, widened by $r-1$ so neighbouring outputs share their overlap.
- [[Quantized MAC Neuron]] – counter-example: the direct sum-of-products this replaces, and the datapath whose shrinking $p$ destroys the trade.
- [[Choosing a Deep Learning Datapath]] – compares: where the multiplication/addition swap sits against the format choices that compete with it.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §24.5.2 "Fast Convolution Algorithms", pp. 737–741 — minimality of $n=m+r-1$ and eq. (24.21); the $F(2,2)$ derivation, eqs. (24.22)–(24.28); matrix form (24.29)–(24.34); Fig. 24.15, p. 739; 2-D nesting (24.35) and the $F(2^d,3^d)$ matrices (24.36)–(24.38); Table 24.2 and the CSE example (24.39), p. 740; the three arithmetic caveats and the weight-reuse remark, p. 741.
- §24.5.1 "Architecture Classes", pp. 734–736 — the partly-unrolled case (c) that fast convolution is meant to improve, and the constant-weight case that absorbs $\mathbf A$.
- §8.6 "Karatsuba", p. 244 — the cross-reference the book makes for the same identity family.
- §12.4 — shift-and-add realisation of the transform coefficients, cited on p. 740.
