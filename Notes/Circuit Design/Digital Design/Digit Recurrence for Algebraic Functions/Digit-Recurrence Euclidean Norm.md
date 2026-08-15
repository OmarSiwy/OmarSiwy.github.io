---
title: "Digit-Recurrence Euclidean Norm"
description: "Evaluates sqrt(X^2+Y^2+Z^2) in one recurrence: reorder so X is largest, initialise with it and never compute X squared, accumulating the other two squares one partial-product line per iteration."
kind: circuit
source: "ASA §19.3, pp. 589-591"
status: seed
spade: simulated
tags: [digital, digit-recurrence-for-algebraic-functions, norm, square-root, cordic]
aliases:
  - 3D Euclidean Norm
  - Takagi-Kuwahara Norm
  - Euclidean Norm Digit Recurrence
---

# Digit-Recurrence Euclidean Norm

A square-root digit recurrence whose radicand is *streamed in* rather than presented: $\sqrt{X^2+Y^2+Z^2}$ falls out of one residual loop that never forms the sum of squares, and never forms $X^2$ at all.

```tikz title="One iteration of the Takagi-Kuwahara 3D Euclidean norm digit recurrence: residual register, two gated partial-product rows, digit-by-word mux, 5:2 compressor and on-the-fly converter"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---------- state registers (top row) ----------
  \draw[thick] (-8.4,6.0) rectangle (-4.4,6.9);
  \node at (-6.4,6.45) {$W_j$ carry-save reg};
  \node[font=\scriptsize] at (-6.4,7.3) {$2\times(n{+}6)$ b, \texttt{sfix(2,-n-3)}};

  \draw[thick] (-3.2,6.0) rectangle (-0.2,6.9);
  \node at (-1.7,6.45) {$Y$, $Z$ regs};
  \node[font=\scriptsize] at (-1.7,7.3) {$2\times n$ b, \texttt{ufix(0,-n)}};

  \draw[thick] (1.0,6.0) rectangle (5.4,6.9);
  \node at (3.2,6.45) {OTF regs $S_j\;|\;S_j^{\ominus}$};
  \node[font=\scriptsize,anchor=east] at (5.4,7.3) {$2\times(n{+}2)$ b, \texttt{ufix(1,-n)}};

  % ---------- term-forming row ----------
  \draw (-8.4,4.1) rectangle (-6.9,4.9);
  \node at (-7.65,4.5) {$\ll 1$};
  \node[font=\scriptsize,anchor=west] at (-7.55,3.6) {$2W_j$, $2\times(n{+}6)$ b};

  \draw (-5.9,4.1) rectangle (-3.9,4.9);
  \node at (-4.9,4.5) {AND $\cdot\,y_{-j-4}$};
  \node[font=\scriptsize,anchor=west] at (-4.8,3.6) {$y_{-j-4}Y$, $n$ b};

  \draw (-2.9,4.1) rectangle (-0.9,4.9);
  \node at (-1.9,4.5) {AND $\cdot\,z_{-j-4}$};
  \node[font=\scriptsize,anchor=west] at (-1.8,3.6) {$z_{-j-4}Z$, $n$ b};

  \draw (0.1,4.1) rectangle (2.4,4.9);
  \node at (1.25,4.5) {mux $-2d\,S_j$};
  \node[font=\scriptsize,anchor=west] at (1.35,3.6) {$0,\pm S_j\!\ll\!1$, $n{+}3$ b};

  \draw (3.6,4.1) rectangle (5.4,4.9);
  \node at (4.5,4.5) {one-hot SR};
  \draw[->] (4.5,5.15) -- (4.5,4.9);
  \node[font=\scriptsize,anchor=west] at (4.6,3.6) {$2^{-j-1}d^2$};

  % ---------- compressor ----------
  \draw[thick] (-8.4,2.3) rectangle (5.4,3.2);
  \node at (-1.5,2.75) {5:2 compressor --- one 4:2 row $+$ one 3:2 row, $n{+}6$ b wide};

  \draw[thick] (-8.4,0.7) rectangle (-3.0,1.6);
  \node at (-5.7,1.15) {$W_{j+1}$ carry-save, $2\times(n{+}6)$ b};

  % ---------- selection ----------
  \draw[thick] (-0.4,0.7) rectangle (5.4,1.6);
  \node at (2.5,1.15) {SEL: 6 MSBs of $W_{j-1}$ $\to$ $d_{-j-1}$};

  % ---------- wiring: registers down to term row ----------
  \draw[->] (-6.4,6.0) -- (-6.4,5.4) -| (-7.65,4.9);
  \draw[->] (-2.6,6.0) -- (-2.6,5.4) -| (-4.9,4.9);
  \draw[->] (-1.0,6.0) -- (-1.0,5.4) -| (-1.9,4.9);
  \draw[->] (1.8,6.0) -- (1.8,5.4) -| (1.25,4.9);

  % term row down into compressor
  \draw[->] (-7.65,4.1) -- (-7.65,3.2);
  \draw[->] (-4.9,4.1) -- (-4.9,3.2);
  \draw[->] (-1.9,4.1) -- (-1.9,3.2);
  \draw[->] (1.25,4.1) -- (1.25,3.2);
  \draw[->] (4.5,4.1) -- (4.5,3.2);

  % compressor down to W_{j+1}
  \draw[->] (-5.7,2.3) -- (-5.7,1.6);

  % feedback W_{j+1} -> W_j reg
  \draw[->] (-8.4,1.15) -- (-9.2,1.15) -- (-9.2,6.45) -- (-8.4,6.45);
  \node[font=\scriptsize,rotate=90] at (-9.45,3.8) {one cycle};

  % W_{j-1} tap into SEL
  \draw[->] (-3.0,1.15) -- (-0.4,1.15);
  \node[font=\scriptsize,anchor=south] at (-1.7,1.2) {6 b};

  % digit fan-out to mux and to OTF regs
  \draw[->] (5.4,1.15) -- (6.3,1.15) -- (6.3,5.15) -- (1.25,5.15) -- (1.25,4.9);
  \draw[->] (6.3,5.15) -- (6.3,6.45) -- (5.4,6.45);
  \node[font=\scriptsize,anchor=west] at (6.35,3.2) {$d_{-j-1}\in\{-1,0,1\}$, 2 b};

  % output
  \draw[->] (1.6,6.9) -- (1.6,7.9);
  \node[font=\scriptsize,anchor=west] at (1.7,7.9) {$S_n\approx\sqrt{X^2{+}Y^2{+}Z^2}$};

  % init note
  \node[font=\scriptsize,anchor=west] at (-9.2,8.5)
    {init: reorder so $X\ge Y$, $X\ge Z$; then $S_0=X$, $W_0=Y\,Y_{[3]}+Z\,Z_{[3]}$ --- $X^2$ is never computed};
\end{circuitikz}
\end{document}
```

**Recognise the norm as an algebraic function of one variable, not a composition of two operators.** The naive route is two operators in series: a compressor tree that forms $X^2+Y^2+Z^2$, then a square root. But the result $S$ is defined implicitly by $S^2-(X^2+Y^2+Z^2)=0$, a *quadratic polynomial in $S$* with $X,Y,Z$ as parameters — exactly the class the residual machinery of [[SRT Square Root]] handles. Takagi and Kuwahara's algorithm exploits that: one recurrence, one residual, and the radicand fed in a partial-product line at a time instead of being assembled first. The specification is fixed-point, $\tfrac12\le X<1$ and $0\le Y,Z<1$, radix $\beta$ with a redundant digit set; the published design is radix 2 with $d_{-j}\in\{-1,0,1\}$, one result bit per iteration.

**Sort the three operands so the largest becomes the seed, and one entire square disappears.** Reorder so $X\ge Y$ and $X\ge Z$ — three [[Magnitude Comparator]] instances and a 3-way swap network, once, before the loop. Then initialise $S_0=X$ *exactly*. Because the residual is defined as (accumulated radicand) $-\;S_j^2$, the $X^2$ term of the radicand and the $S_0^2$ term of the residual are the same number and cancel identically at $j=0$: **$X^2$ is never computed, not even partially.** The sort is what makes that cancellation legal rather than merely convenient. With $X$ the largest, $\sqrt{X^2+Y^2+Z^2}\le X\sqrt3$, so the digits still to be produced must supply at most $X(\sqrt3-1)<0.733$, comfortably inside the $\sum_{k\ge1}2^{-k}=1$ that digits at weights $2^{-1},\dots,2^{-n}$ can reach. Seed with anything but the largest operand and that headroom is gone.

**Accumulate the two surviving squares by their own shift-and-add expansion, one line per iteration.** By distributivity, $Y^2=Y\cdot\sum_{k\ge1}y_{-k}2^{-k}=\sum_{k\ge1}y_{-k}2^{-k}Y$ — the ordinary partial-product decomposition of a product, with $Y$ playing both roles. Write $Y_{[k]}$ for $Y$ truncated to $k$ fractional bits. The residual at step $j$ carries only the prefix $Y\,Y_{[j+3]}+Z\,Z_{[j+3]}$; the initial value $W_0=Y\,Y_{[3]}+Z\,Z_{[3]}$ supplies the first three lines of each, and step $j$ folds in exactly one further line of each, indexed $-j-4$. The recurrence therefore *interleaves* two multipliers and a square root in a single loop, which is why its iteration adds five terms where the plain square root adds three.

**Define the residual so that the accumulation and the digit both land at fixed weights.** Let $\Sigma_j=X^2+Y\,Y_{[j+3]}+Z\,Z_{[j+3]}$ be the radicand accumulated so far and set

$$W_j = 2^{j}\left(\Sigma_j - S_j^2\right)$$

the same scaled remainder as the square root, with the $2^{j}$ chosen so the invariant is scale-free across iterations. Substituting $S_{j+1}=S_j+2^{-j-1}d_{-j-1}$ and expanding the square,

$$S_{j+1}^2-S_j^2 = 2\cdot 2^{-j-1}d_{-j-1}S_j + 2^{-2j-2}d_{-j-1}^2$$

while the newly accumulated radicand is $\Sigma_{j+1}-\Sigma_j = 2^{-j-4}\left(y_{-j-4}Y+z_{-j-4}Z\right)$. Distributing $2^{j+1}$ over the three pieces, the $2^{j+1}$ and $2^{-j-4}$ collapse to a **constant** $2^{-3}$ and the cross term's $2^{j+1}\cdot2^{-j-1}$ collapses to $2$:

$$\boxed{\;W_{j+1} = 2W_j \;+\; 2^{-3}\!\left(y_{-j-4}Y+z_{-j-4}Z\right) \;-\; 2\,d_{-j-1}S_j \;-\; 2^{-j-1}d^2_{-j-1}\;}$$

Only the last term still depends on $j$, and it is a single bit position. That is the whole reason the datapath is $j$-invariant and can be folded into one hardware iteration.

> [!warning] The book's Eq. (19.55) as printed does not reproduce its own Eq. (19.56)
> Page 589 prints $W_j\approx\beta^{-j}(S_j-X^2-Y^2-Z^2)$ — first degree in $S_j$, and with the scaling exponent negated relative to the square-root case $W_i=\beta^{i}(M-S_i^2)$ of §19.1. Neither the degree nor the sign is consistent: substituting it into the derivation yields neither the $2^{-3}$ offset nor the signs of (19.56), and it contradicts the stated initial value $W_0=Y\,Y_{[3]}+Z\,Z_{[3]}$, which is positive. The form used above, $W_j=\beta^{j}(\Sigma_j-S_j^2)$, is the unique convention reproducing both (19.56) and $W_0$ exactly. Read (19.55) as a typo for $S_j^2$ under the sign convention of §19.1.

**The remainder is deliberately inexact, and that is what forces redundancy.** For fixed-point $X,Y,Z$ the residual *could* be exact — the algorithm chooses otherwise, because for floating-point inputs with widely separated exponents the exact $X^2+Y^2+Z^2$ needs an enormous number of bits (the problem [[Exact Accumulators]] solves by brute width). Truncating instead means $W_j$ under-counts the radicand by $2^{j}\left(Y(Y-Y_{[j+3]})+Z(Z-Z_{[j+3]})\right)$, bounded by $(Y+Z)/8\le\tfrac14$ but never zero. An approximate remainder has an untrustworthy *sign*, and the sign is exactly what a non-redundant selection reads — so the digit set must be redundant, giving several legal digits at each step and enough slack to decide from **6 leading bits of $W_{j-1}$**. The $2^{-3}$ offset paired with the index $-j-4$ is the technicality that encodes "accurate enough": three guard bits below the operand radix point, matched to that $\tfrac14$ deficit.

**Widths.** With $n$ fractional bits of result: $X,Y,Z$ are `ufix(0,-n)`, $n$ bits each. $S_j$ is `ufix(1,-n)`, $n+2$ bits — one integer bit because $S_n<\sqrt3<2$ — and the [[On-the-Fly Converter]] holds a second copy $S_j^{\ominus}=S_j-2^{-j}$ so that negative digits are absorbed by a mux rather than a subtracter. The residual is bounded by $|W_j|\le 2\rho S_j+2^{-j}<5$, needing three integer bits plus sign, and sits three bits below the operand radix point: `sfix(2,-n-3)`, $n+6$ bits, held in carry-save as **two** such words ([[Compressor Trees]]). See [[Number Formats]] for the `ufix`/`sfix` notation and [[Error Accuracy]] for the ulp accounting.

**One iteration costs five addends, one selection function and two converter muxes.** The two AND rows are $n$ AND gates each; $-2d_{-j-1}S_j$ is an $(n{+}3)$-bit mux plus conditional inversion, with no multiplier anywhere, because a redundant digit multiplies by $0$ or $\pm1$; $2^{-j-1}d^2$ is a single hot bit gated by $d\neq0$. Five terms collapse to two in **one 4:2 row plus one 3:2 row**, so the per-iteration critical path is two compressor delays plus the selection function — constant in $n$, which is the entire point of the carry-save residual. On FPGAs the calculus shifts: the fast-carry chain makes a plain $(n{+}6)$-bit two's-complement add cheap enough that redundant residuals lose much of their edge, the same conclusion the E-method implementations reached — see the FPGA discussion in [[Choosing a Digit Recurrence]].

**Loop control is two shift registers and nothing else.** The only $j$-dependence left in the recurrence is the bit index $-j-4$ tapping $Y$ and $Z$, and the position of the one-hot $2^{-j-1}$. Both are served by one $n$-bit ring counter — a single flip-flop per iteration, one hot bit walking right — which gates the AND rows and *is* the $d^2$ line. No decoder, no barrel shifter, no comparator; the terminal condition is the ring counter's last stage. Folding this recurrence therefore costs $n$ flip-flops for the counter, $2\times(n{+}6)$ for the residual and $2\times(n{+}2)$ for the converter, against $n$ copies of the whole datapath if you unrolled it. The operator needs **$n$ iterations for $n$ result bits** at radix 2, plus one more if you want round-to-nearest ([[Rounding]]).

**Where it breaks.** The recurrence is narrow: it is calibrated to one operand range and one digit set, and both edges bite.

- **The sort is a precondition, not an optimisation.** The $S_0=X$ initialisation and the $2^{-3}$ guard are both calibrated for $\tfrac12\le X<1$, $0\le Y,Z\le X$. Feed the operands unsorted and the digits at weights $2^{-1}\dots2^{-n}$ cannot reach the result; feed $X<\tfrac12$ and the residual bound fails at $j=0$.
- **Selecting on the sign of the truncated $W$ diverges.** Simulated below: with a non-redundant $\{0,1\}$ digit set, digits come out too small by exactly the un-accumulated tail, and $W$ — which doubles every step and gains a fresh partial-product line every step — escapes its bound $W_j<2S_j+2^{-j}$ within four iterations and never returns. The redundant digit set is load-bearing, not a speed tweak.
- **Floating-point operands with far-apart exponents** are the reason the remainder is truncated at all. A fixed-point-only design can keep it exact and skip the redundancy entirely, at which point [[Non-Restoring Square Root]] on a pre-summed radicand is simpler and smaller.
- **The two surviving squares are computed as plain products**, so the symmetry saving of [[Squarers and Integer Powers]] is forfeited, and the two additions hidden inside the recurrence are less area-efficient than one global compressor tree over three squares.
- **In 2D, reach for CORDIC first.** Vectoring mode ([[CORDIC]]) unrolled in space costs roughly $2n$ additions of $n$ bits plus $2n$ multiplexers, and needs no selection function at all.

> [!warning] Not covered in the source — needs outside research
> The book states explicitly (p. 590) that it is aware of **no implementation-based comparison** of this digit recurrence against either the naive sum-of-squares-then-square-root route or against CORDIC, and concludes that "the net benefit on area of this integrated digit recurrence is unclear". No LUT, slice, delay or DSP figure for this operator appears in Chapter 19. Any area or latency ranking against its alternatives would be invented.

**RTL (Spade).** One iteration, combinational, generic in the word width.

```spade
/// One iteration of the Takagi-Kuwahara 3D-norm digit recurrence, radix 2,
/// digit set {-1,0,1} carried as (dnz, dneg).
///
/// All words share LSB weight 2^-(n+3); X,Y,Z,S carry LSB weight 2^-n, so the
/// three guard bits demanded by the 2^-3 offset are already inside the word.
///   ypp = Y at weight 2^-n   (the 2^-3 offset is absorbed by the alignment)
///   s   = S_j at weight 2^-n (needs <<4 to become 2 S_j at weight 2^-(n+3))
///   dsq = one-hot 2^(n+2-j), the 2^(-j-1) d^2 line, from the ring counter
entity norm_step<#uint N>(
    w: int<N>,
    ypp: int<N>,
    zpp: int<N>,
    s: int<N>,
    dsq: int<N>,
    ybit: bool,
    zbit: bool,
    dneg: bool,
    dnz: bool,
) -> int<N> {
    let yline = if ybit { ypp } else { 0 };
    let zline = if zbit { zpp } else { 0 };
    let s2 = s << 4;
    let sline = if dnz { if dneg { -s2 } else { s2 } } else { 0 };
    let dline = if dnz { dsq } else { 0 };
    (((w << 1) +. yline) +. zline -. sline) -. dline
}
```

`w << 1` is the $2W_j$ wire, `yline` and `zline` are the two AND rows, `sline` is the $-2d\,S_j$ mux and `dline` the one-hot $2^{-j-1}d^2$ bit — the five terms entering the compressor, in diagram order. The $\ll4$ on `s` is the alignment of the $S_j$ line against the three guard bits ($2$ from $2S_j$, $8$ from the $2^{-3}$ offset absorbed into the word), which is why one `int<N>` can carry both operand-weight and residual-weight quantities. The block is purely combinational: the residual register, the ring counter and the on-the-fly converter are the surrounding loop, not this entity. Synthesis differs from the drawing in exactly one place — `+.`/`-.` are ordinary wrapping adds, so the tool infers a carry-propagate chain, whereas the real design keeps $W$ in **carry-save** and collapses the five terms in a 4:2 plus a 3:2 row: identical arithmetic, entirely different critical path.

Verified with `.zettel/sim.sh`: 3008 directed and random step vectors against a behavioural reference — including asymmetric cases and both digit signs — then 305 full-recurrence cases driving this entity for 14 iterations from $S_0=X$, $W_0=Y\,Y_{[3]}+Z\,Z_{[3]}$, checking that $S_{14}$ is the round-down of $\sqrt{X^2+Y^2+Z^2}$ to within one ulp. The testbench models the selection function ideally, because TK00's real one is not reproduced in the book.

**Related notes.**

- [[Choosing a Digit Recurrence]] – compares: where this sits against the other algebraic-function recurrences and their alternatives.
- [[SRT Square Root]] – extends: the same residual and digit selection, with the radicand streamed in rather than presented.
- [[Square Root Digit Selection Function]] – depends-on: the 6-bit selection here is built by the same P-D method, for a residual that also moves with the accumulation.
- [[On-the-Fly Converter]] – supports: the $S_j\,|\,S_j^{\ominus}$ register pair that turns negative digits into a mux instead of a subtracter.
- [[Compressor Trees]] – supports: the five terms of the recurrence collapse in one 4:2 row plus one 3:2 row.
- [[Magnitude Comparator]] – depends-on: the pre-loop reorder that makes $X$ the seed.
- [[Squarers and Integer Powers]] – counter-example: incremental partial-product lines forfeit the symmetry saving a dedicated squarer gives.
- [[Exact Accumulators]] – compares: the opposite answer to the same floating-point problem — buy exactness with width instead of dodging it with truncation.
- [[CORDIC]] – compares: vectoring mode is the preferred route for the 2D norm.
- [[Digit-Recurrence Cube Root]] – compares: sibling recurrence one degree higher, and the only case in the chapter with a quantified area-time comparison.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §19.3 *2D and 3D Euclidean Norms*, Eqs. (19.54)–(19.56) — pp. 589–591. Radix-2 digit set $\{-1,0,1\}$, 6-bit selection, $W_0=Y\,Y_{[3]}+Z\,Z_{[3]}$, the reordering trick, the $2^{-3}$ offset, and the statement that no implementation-based comparison exists — p. 590.
- §19.1.5 redundant number systems and the residual bound reused here — pp. 580–586.
- §19.1.6 on-the-fly conversion, Eqs. (19.45)–(19.48) — pp. 587–588.

Primary source: Takagi & Kuwahara (2000), *A VLSI algorithm for computing the Euclidean norm of a 3D vector* — the selection function and the radix-4 variant are given there, not in the book.
