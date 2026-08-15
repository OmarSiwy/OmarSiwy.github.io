---
title: Fused Sum of Squares
description: "Squares are positive by construction, so cancellation cannot occur and a faithfully rounded fusion saves both area and latency over separate multipliers and adders."
kind: circuit
source: "ASA §1.4.2 Fig. 1.5, p. 12; §15.4, p. 468; §15.6, pp. 469-470"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, fusion, squarer, adder, fpga]
aliases:
  - Sum of Squares
  - Floating-Point Sum of Squares
  - Fused Sum-of-Squares Operator
  - 3D Squared Norm
---

# Fused Sum of Squares

A single floating-point operator for $X^2+Y^2+Z^2$ that squares, aligns and accumulates all three terms before one rounding, and which is cheap to build precisely because every term is non-negative, so the internal adder never needs a close path.

```tikz title="Fused floating-point sum of three squares: three parallel squarers, one exponent compare-and-sort driving two alignment shifters, one three-input add and one normalize-and-pack"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
% ---------------- inputs and unpack ----------------
\node[draw,minimum width=13.6cm,minimum height=0.7cm] (up) at (0.6,8.3) {unpack};
\foreach \x/\n in {-1.4/X,1.4/Y,4.2/Z}{
  \draw[<-] (\x,8.65) -- ++(0,0.85) node[above,font=\small]{$\n$};
  \node[font=\tiny,anchor=west] at (\x+0.07,8.95) {$1{+}w_E{+}w_F$};}
\node[font=\small,anchor=south] at (-7.2,8.42) {exn};
% ---------------- exponent path ----------------
\node[draw,minimum width=3.6cm,minimum height=0.7cm] (cs) at (-4.6,6.9) {compare \& sort};
\foreach \x/\n in {-5.9/E_X,-4.6/E_Y,-3.3/E_Z}{
  \draw[->] (\x,7.95) -- (\x,7.25);
  \node[font=\tiny,anchor=east] at (\x-0.06,7.72) {$\n$};
  \node[font=\tiny,anchor=west] at (\x+0.06,7.42) {$w_E$};}
\node[draw,minimum width=1.1cm,minimum height=0.6cm] (s1) at (-5.1,5.6) {sub};
\node[draw,minimum width=1.1cm,minimum height=0.6cm] (s2) at (-3.6,5.6) {sub};
% E_A fans out to both subtracters and on to the packer
\draw (-5.9,6.55) -- (-5.9,6.15);
\draw[->] (-5.9,6.15) -- (-5.35,6.15) -- (-5.35,5.9);
\draw[->] (-5.9,6.15) -- (-3.85,6.15) -- (-3.85,5.9);
\draw[->] (-5.9,6.15) -- (-5.9,1.65);
\draw[->] (-4.85,6.55) -- (-4.85,5.9);
\draw[->] (-3.35,6.55) -- (-3.35,5.9);
\node[font=\tiny,anchor=east] at (-5.94,6.38) {$E_A$};
\node[font=\tiny,anchor=east] at (-4.89,6.3) {$E_B$};
\node[font=\tiny,anchor=west] at (-3.31,6.3) {$E_C$};
\node[font=\tiny,anchor=west] at (-5.84,3.1) {$E_A$, $w_E$};
% ---------------- significand path ----------------
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (q1) at (-0.3,6.9) {squarer};
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (q2) at (2.4,6.9) {squarer};
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (q3) at (5.1,6.9) {squarer};
\foreach \x/\n in {-0.3/M_X,2.4/M_Y,5.1/M_Z}{
  \draw[->] (\x,7.95) -- (\x,7.25);
  \node[font=\tiny,anchor=east] at (\x-0.06,7.6) {$\n$};
  \node[font=\tiny,anchor=west] at (\x+0.06,7.6) {$1{+}w_F$};
  \draw[->] (\x,6.55) -- (\x,5.95);
  \node[font=\tiny,anchor=west] at (\x+0.06,6.25) {$2{+}w_F{+}g$};}
\node[draw,minimum width=7.4cm,minimum height=0.7cm] (so) at (2.4,5.6) {sort};
\draw[->] (cs.east) -- (-2.35,6.9) -- (-2.35,5.6) -- (so.west);
\node[font=\tiny,anchor=south] at (-1.82,5.66) {rank};
% ---------------- alignment shifters ----------------
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (h2) at (2.4,4.3) {shifter};
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (h3) at (5.1,4.3) {shifter};
\draw[->] (2.4,5.25) -- (2.4,4.65);
\draw[->] (5.1,5.25) -- (5.1,4.65);
\draw[->] (-0.3,5.25) -- (-0.3,3.15);
\node[font=\tiny,anchor=west] at (-0.24,4.3) {$2{+}w_F{+}g$};
\draw[->] (s1.south) -- (-5.1,4.72) -- (1.0,4.72) -- (1.0,4.3) -- (h2.west);
\draw[->] (s2.south) -- (-3.6,3.68) -- (3.72,3.68) -- (3.72,4.3) -- (h3.west);
\node[font=\tiny,anchor=west] at (-2.9,4.86) {$E_A{-}E_B$, $w_E$};
\node[font=\tiny,anchor=west] at (-3.45,3.84) {$E_A{-}E_C$, $w_E$};
% ---------------- add, normalize, pack ----------------
\node[draw,minimum width=7.4cm,minimum height=0.7cm] (ad) at (2.4,2.8) {add};
\draw[->] (h2.south) -- (2.4,3.15);
\draw[->] (h3.south) -- (5.1,3.15);
\node[draw,minimum width=13.6cm,minimum height=0.7cm] (np) at (0.6,1.3) {normalize and pack};
\draw[->] (up.west) -- (-7.2,8.3) -- (-7.2,1.3) -- (np.west);
\draw[->] (ad.south) -- node[right,font=\tiny]{$4{+}w_F{+}g$} (2.4,1.65);
\draw[->] (np.south) -- node[right,font=\tiny]{$1{+}w_E{+}w_F$} ++(0,-0.85) node[below,font=\small]{$R$};
\end{circuitikz}
\end{document}
```

*after Fig. 1.5, p. 12*

**Count what the composition of standard operators actually costs.** Assembling $x^2+y^2+z^2$ from library parts is three multiplications and two additions, hence **five roundings**; the book's own accounting is that $\log_2(5)\approx 3$ bits of the result may then be wrong (p. 11). Worse, the assembly imposes a parenthesisation, $\big(x^2+y^2\big)+z^2$, and floating-point addition is not associative, so there exist inputs for which exchanging $x$ and $z$ changes the returned value. That asymmetry is not academic: it is enough to send an otherwise correct sorting algorithm into an infinite loop [Mul+18], p. 11. A fused operator is free to be *symmetric in all three inputs* because it never commits to an order.

**Establish that no cancellation is possible, then delete the hardware that exists only to handle it.** Each term is a square, so $M_i^2\ge 0$ and every one of the two additions is an effective addition. This is the specialization of [[Positive-Term Floating-Point Adder]] applied inside a fusion: with no effective subtraction there is no catastrophic cancellation, so the leading-zero counter, the $(w_F{+}1)$-bit left normalizer of [[Shifters]] and the close/far path multiplexer all disappear — about $1/3$ of a generic floating-point adder, per §15.4, p. 468, and at zero accuracy cost, because the deleted path is an *unreachable case*, not an approximation. Note the direction of the implication: positivity is a property of the *operator's own internal dataflow*, not an assumption on the user's inputs. $x$, $y$, $z$ may be any signed floats whatsoever; it is $M_X^2, M_Y^2, M_Z^2$ that are guaranteed non-negative.

**Turn a sequential alignment chain into one parallel alignment stage.** With library operators the alignments are serialized: round $x^2$, align it against $y^2$, add, round, align that against $z^2$, add, round. Fused, the three exponents $E_X,E_Y,E_Z$ (each $w_E$ bits) enter one compare-and-sort network that emits the ranked triple $E_A\ge E_B\ge E_C$ together with a rank code that permutes the three squares to match. Two $w_E$-bit subtracters then produce $E_A-E_B$ and $E_A-E_C$ *concurrently*, and two right shifters run *concurrently*. The critical path is one comparator tree, one shifter and one three-input add, against three multiply-round-align-add stages in series — which is why the book measures the FPGA latency as divided by three (p. 12, [DP11]).

**Double the exponent difference by wiring, not by arithmetic.** The alignment is between squares, whose exponents are $2E_i-\text{bias}$, so the true shift distance is $2(E_A-E_B)$ — twice what the $w_E$-bit subtracter in the figure emits. The factor of two is a hard-wired left shift by one on the shift-amount bus and costs nothing. The bias cancels in the difference, which is why the subtracters can work on raw biased exponents. The one width consequence is that the *internal* exponent $2E_A$ needs $w_E+1$ bits: the squared norm of a representable vector can have an exponent outside the input format's range, and the fused operator survives that only because it never packs an intermediate result.

**Size the datapath from the ranges, and derive the guard-bit count rather than assuming it.** Each significand $M_i\in[1,2)$ carries $1+w_F$ bits, so the exact square is $2(1+w_F)$ bits and lies in $[1,4)$ — two integer bits. The squarers truncate to $2+w_F+g$ bits and are **not individually normalized**; that is what lets the alignment be a pure function of the exponents. Three aligned terms each below $4$ sum to less than $12<2^4$, so $\lceil\log_2 3\rceil=2$ extra integer bits absorb the carries and the accumulator is $4+w_F+g$ bits wide, exactly as labelled in Fig. 1.5. Five truncations occur before the final rounding — three squarers and two shifters — each losing less than $2^{-(w_F+g)}$ relative to the *largest* square. Budgeting half an ulp of the result to all of them,
$$5\cdot 2^{-(w_F+g)}\;\le\;2^{-(w_F+1)}\quad\Longleftrightarrow\quad 2^{\,g-1}\ge 5\quad\Longleftrightarrow\quad g\ge 4,$$
which reproduces the book's statement that $g=4$ suffices (p. 11).

> [!warning] The guard-bit count above is a reconstruction, not the book's proof
> §1.4.2 says only "it can be shown that $g=4$ ensures that this architecture is much more accurate than the composition of classic floating-point operators" (p. 11) and gives no derivation; the reference for it is [DKP09], not the text. The count of five truncation sites and the half-ulp budget are mine. They land on the book's value, but a design targeting *correct* rounding needs the sticky logic of the next section and a tighter bound than this.

> [!important] Positivity is what makes an absolute error bound into a relative one
> The step above silently divides by the result. It is legal only because no cancellation can occur: $R\ge\max_i M_i^2\,2^{2E_i}$, so an error measured against the largest term is automatically an error measured against $R$, and $\mathrm{ulp}(R)\ge\mathrm{ulp}(\text{largest term})$. Remove the positivity hypothesis and $R$ can be arbitrarily smaller than the largest term, the denominator collapses, and no finite $g$ buys faithful rounding — which is precisely the book's design rule on p. 470: **faithful rounding yields significantly cheaper fused operators only for sums of same-sign terms.** Otherwise cancellation forces you to compute most of the bits of the exact result anyway, and there is nothing left to save by relaxing correct rounding to faithful. Cf. [[Error Accuracy]].

**Normalization shrinks to a two-bit decision.** Because the accumulator holds a value in $[1,12)$ rather than in $[2^{-w_F},4)$, the output normalizer is a right shift of $0$, $1$, $2$ or $3$ positions with a matching increment of $E_A$ — a $4{:}1$ multiplexer, not the barrel shifter plus leading-zero counter a generic adder needs. This is the second, downstream dividend of the same positivity argument, and it is the one the block diagram makes most visible: `normalize and pack` is a single flat block.

**On FPGA the squarers, not the adders, decide the win.** A $(1+w_F)$-bit squarer is materially cheaper than a general multiplier of the same width — roughly half the partial-product bits survive the $x_ix_j=x_jx_i$ folding; see [[Squarers and Integer Powers]]. On an FPGA with DSP blocks the three squarers may nonetheless quantize to whole DSP tiles, so the saving shows up in [[FPGAs]] fabric logic rather than in DSP count. The book's measured figures for the fused operator against a same-frequency composition are latency divided by 3 and logic resources divided by 2 to 3 [DP11], p. 12, for an operator that is simultaneously *more* accurate and symmetric. On ASIC the same structural argument holds but the constants are not reported.

$$\boxed{\;R=\circ\!\left(\sum_{i\in\{A,B,C\}} 2^{-2(E_A-E_i)}\,\widetilde{M_i^{\,2}}\right),\qquad E_A=\max_i E_i,\qquad 5\cdot 2^{-(w_F+g)}\le 2^{-(w_F+1)}\Rightarrow g=4\;}$$

**When it breaks**

- **A term shifted past the datapath.** When $2(E_A-E_i)\ge 2+w_F+g$ the aligned term vanishes entirely. That is harmless for *faithful* rounding but destroys *correct* rounding: recovering the last bit needs a sticky OR of everything shifted out, exactly as in [[Rounding]]. The shifters must therefore saturate their shift amount rather than let it wrap.
- **Zero and subnormal inputs.** $\max_i E_i$ is meaningless when all three inputs are zero, and a subnormal input squares to zero in any format with $w_F<2e_{\min}$. Both are handled in the `exn` path, which bypasses the datapath entirely; the significand core says nothing about them.
- **Intermediate overflow.** $x^2$ can overflow the *output* format while $\sqrt{x^2+y^2+z^2}$ is representable. The fused operator escapes this only because the internal exponent carries $w_E+1$ bits and is never packed — a composition of standard operators cannot, and returns $+\infty$.
- **More than three terms.** The compare-and-sort network is $O(n\log n)$ comparators and the alignment stage needs $n-1$ shifters; past a handful of terms the shifter array dominates and a fixed-point [[Exact Accumulators|exact accumulator]] becomes the cheaper structure, with the added benefit of exact, order-independent summation.
- **Mixed signs.** The moment one term can be negative the callout above applies and the whole cost argument inverts; [[Fused Multiply-Add]] pays for the $\approx 3w_F$-bit accumulator that cancellation demands.

**RTL (Spade)**

```spade
// binary32-shaped instance: wE = 8, wF = 23, g = 4 guard bits.
entity sumsq3(
    ex: uint<8>, mx: uint<24>,
    ey: uint<8>, my: uint<24>,
    ez: uint<8>, mz: uint<24>,
) -> uint<31> {
    // three squarers in parallel; each exact product is 48 bits, kept to 2+wF+g = 29
    let qx: uint<29> = trunc((mx * mx) >> 19);
    let qy: uint<29> = trunc((my * my) >> 19);
    let qz: uint<29> = trunc((mz * mz) >> 19);

    // the square of X has exponent 2E_X - bias; the bias cancels in every difference
    let kx: uint<9> = ex + ex;
    let ky: uint<9> = ey + ey;
    let kz: uint<9> = ez + ez;
    let ka: uint<9> = kx.max(ky).max(kz);

    // all three alignment distances in parallel, saturated at the datapath width
    let dx: uint<10> = ka - kx;
    let dy: uint<10> = ka - ky;
    let dz: uint<10> = ka - kz;
    let sx: uint<29> = if dx > 28 { 29 } else { zext(dx) };
    let sy: uint<29> = if dy > 28 { 29 } else { zext(dy) };
    let sz: uint<29> = if dz > 28 { 29 } else { zext(dz) };

    // one 3-input add, one rounding downstream
    let ax: uint<29> = qx >> sx;
    let ay: uint<29> = qy >> sy;
    let az: uint<29> = qz >> sz;
    let s2: uint<31> = zext::<29, 30>(ax) + zext::<29, 30>(ay);
    trunc(s2 + zext::<29, 31>(az))
}
```

`qx/qy/qz` are the three `squarer` outputs, `sx/sy/sz` the two `sub` outputs plus the constant-zero shift of the ranked-first term, and the tail expression is the `add` block; `ka` is $2E_A$ and leaves for `normalize and pack` in the full operator. The width arithmetic is the paragraph above made literal: `mx * mx` is $2\times 24=48$ bits and `>> 19` then `trunc` keeps the top $29=2+w_F+g$; the three-term sum needs $31=4+w_F+g$, and the `zext`-to-30-then-truncate dance is only there because Spade's `+` widens by one bit per operator. The whole block is combinational — no `reg`, no clock port. Two things synthesis does differently from the drawing: the explicit `sort` block is absent, because the ranking is folded into the per-term shift distances (`ka - k_i`) and never materializes as a permutation network; and `qx >> sx` with a data-dependent `sx` becomes a full $29$-bit barrel shifter per term, whereas the figure's leftmost term is shifted by zero and so costs nothing.

Simulated with `.zettel/sim.sh` against a behavioural reference that squares, truncates to 29 bits, saturates the shift and adds: 8 named vectors — including the deliberately asymmetric $E=(10,10,24)$, $M=(\texttt{0x000080},\texttt{0x000001},\texttt{0x800000})$, where the smallest significand carries the largest exponent — plus 5000 fully random $(E_i,M_i)$ and 5000 with exponents clustered within $8$ and significands forced normal, which is the regime where all three shifters actually vary. 10008/10008 exact.

**Related Notes**

- [[Positive-Term Floating-Point Adder]] – depends-on: the "no close path" argument this operator applies twice is derived there in full.
- [[Squarers and Integer Powers]] – depends-on: supplies the three squarers, and the reason a squarer beats a multiplier of the same width.
- [[Fused Multiply-Add]] – compares: the general-purpose fusion, which must pay for a $\approx 3w_F$-bit accumulator precisely because it cannot assume same-sign terms.
- [[Exact Accumulators]] – extends: takes the same order-independence goal to arbitrarily many terms of arbitrary sign, at the cost of a very wide fixed-point register.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where this sits among the chapter's other specializations.
- [[Error Accuracy]] – supports: ulp, faithful versus correct rounding, and the unit roundoff used in the guard-bit count.
- [[Number Formats]] – supports: the $1+w_E+w_F$ packing that `unpack` and `pack` convert between.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §1.4.2 "Operator Fusion" and Fig. 1.5, pp. 12-12 — the architecture, the five-rounding and $\log_2 5$ accuracy count, the $g=4$ claim, and the FPGA measurements [DP11].
- §15.4 "Floating-Point Addition of Positive Terms", p. 468 — the $\approx 1/3$ saving from deleting the close path, and the pointer to fused sum-of-squares architectures [DKP09; MS13].
- §15.6 "Fused Multiply and Add, Other Sums of Products", pp. 469-470 — the design rule limiting cheap faithful fusion to same-sign terms, and the survey of fused sums of products [SS08; Tao+12; Tao+13].
