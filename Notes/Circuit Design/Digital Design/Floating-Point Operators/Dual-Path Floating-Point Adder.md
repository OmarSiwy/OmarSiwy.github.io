---
title: "Dual-Path Floating-Point Adder"
description: "Splits the adder on the observation that a large alignment shift and a large normalization shift are mutually exclusive, cutting five slow blocks to two per path for one extra significand adder and one output mux."
kind: circuit
source: "ASA §11.1.4, pp. 340-342"
status: seed
spade: simulated
tags: [digital, floating-point-operators, adder, normalization, latency]
aliases:
  - Dual-Path Adder
  - Dual Path Floating-Point Adder
  - Dual-Path Architecture
  - Near Path
  - Far Path
---

# Dual-Path Floating-Point Adder

A floating-point adder built as two parallel significand datapaths selected by
the exponent difference, so that no single path ever contains both a wide
alignment shifter and a wide normalization shifter.

```tikz title="Dual-path floating-point adder: the far path owns the alignment shifter, the near path owns the LZC and normalizer"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node[draw,minimum width=11cm,minimum height=0.8cm] (unp) at (0,0)
  {unpack \& exception handling, exponent difference \& swap};
\draw[<-] (-1.4,0.4) -- ++(0,0.8) node[above,font=\small]{$X_\mathrm{in}$};
\draw[<-] ( 1.4,0.4) -- ++(0,0.8) node[above,font=\small]{$Y_\mathrm{in}$};
% near path
\draw[dashed] (-4.5,-4.6) rectangle (-0.7,-1.1);
\node[font=\tiny,rotate=90] at (-4.75,-2.85) {near path};
\node[draw,minimum width=2.8cm,minimum height=0.6cm] (nsh)  at (-2.6,-1.5) {$\gg$ by $0$ or $1$};
\node[draw,minimum width=3.0cm,minimum height=0.7cm] (nadd) at (-2.6,-2.7) {$|M_X-M_{Y'_\mathrm{a}}|$};
\node[draw,minimum width=3.4cm,minimum height=0.8cm] (nlzc) at (-2.6,-4.0) {LZC $+$ shifter, $0..w_F{+}1$};
% far path
\draw[dashed] (0.7,-4.6) rectangle (4.7,-1.1);
\node[font=\tiny,rotate=-90] at (4.95,-2.85) {far path};
\node[draw,minimum width=3.2cm,minimum height=0.6cm] (fsh)  at (2.8,-1.5) {$\gg$ by $0..w_F{+}1$};
\node[draw,minimum width=3.0cm,minimum height=0.7cm] (fadd) at (2.8,-2.7) {$M_X\pm M_{Y_\mathrm{a}}$};
\node[draw,minimum width=3.4cm,minimum height=0.6cm] (fsh2) at (2.8,-4.0) {2-bit norm.: $\ll\!1$ / $0$ / $\gg\!1$};
% merge
\node[draw,minimum width=6.0cm,minimum height=0.5cm] (mux) at (0,-5.3) {mux};
\node[draw,minimum width=3.4cm,minimum height=0.7cm] (rnd) at (0,-6.3) {rounding adder};
\node[draw,minimum width=11cm,minimum height=0.8cm]  (pk)  at (0,-7.4) {exception handling \& pack};
% wires
\draw[->] (-2.6,-0.4) -- node[left,font=\tiny]{$M_X,M_Y$: $w_F{+}1$} (-2.6,-1.2);
\draw[->] ( 2.8,-0.4) -- node[right,font=\tiny]{$M_X,M_Y$: $w_F{+}1$} (2.8,-1.2);
\draw[->] (5.5,-0.4) -- node[right,font=\tiny]{$|E_X{-}E_Y|$} (5.5,-1.5) -- (4.4,-1.5);
\draw[->] (-2.6,-1.8) -- (-2.6,-2.35);
\draw[->] (-2.6,-3.05) -- node[right,font=\tiny]{$w_F{+}2$} (-2.6,-3.6);
\draw[->] ( 2.8,-1.8) -- node[right,font=\tiny]{$w_F{+}3$} (2.8,-2.35);
\draw[->] ( 2.8,-3.05) -- node[right,font=\tiny]{$w_F{+}4$} (2.8,-3.7);
\draw[->] (-2.6,-4.4) -- (-2.6,-5.05);
\draw[->] ( 2.8,-4.3) -- (2.8,-5.05);
\draw[->] (-5.2,-0.4) -- node[left,font=\tiny]{near$/\overline{\mathrm{far}}$} (-5.2,-5.3) -- (-3.0,-5.3);
\draw[->] (0,-5.55) -- node[right,font=\tiny]{$w_F{+}1$} (0,-5.95);
\draw[->] (0,-6.65) -- node[right,font=\tiny]{$w_E{+}2{+}w_F$} (0,-7.0);
\draw[->] (0,-7.8) -- ++(0,-0.5) node[below,font=\small]{$R$};
\node[font=\tiny,align=center] at (0,-8.7)
  {no sticky computation is needed on the near path; the exponent update and sign logic are omitted};
\end{circuitikz}
\end{document}
```

*after Fig. 11.6, p. 341*

**Prove that the two wide shifts are mutually exclusive.** The critical path of
[[Floating-Point Adder]] contains five blocks of $\log_2 w_F$ depth: alignment
shifter, significand adder, LZC, normalization shifter, rounding adder. The
first and the third-plus-fourth can never both be large. Take an effective
subtraction with exponent difference $d=E_X-E_Y\ge 2$ after the swap that
guarantees $E_X\ge E_Y$. Normalized significands live in $[1,2)$, so
$M_X\ge 1$, while the aligned operand satisfies
$M_{Y_\mathrm{a}}=M_Y2^{-d}\in[2^{-d},2^{1-d}]\subseteq(0,\tfrac12]$. By
monotonicity of subtraction in its second argument,

$$M_X-M_{Y_\mathrm{a}}\;\ge\;1-\tfrac12\;=\;\tfrac12$$

A result bounded below by $\tfrac12$ has its leading one at position $0$ or
$-1$, so **at most one bit** of left normalization is ever required. Cancellation
of more than one bit therefore forces $d\in\{0,1\}$ — and in that regime the
alignment shift is a $0$-or-$1$ multiplexer, not a shifter. Both wide blocks
exist, but never in the same half of the input space.

**Split on the predicate, not on the data.** The selector is
$\text{near}=(d\le 1)\wedge\text{effective subtraction}$, computable from the
exponent difference alone and therefore ready long before either significand
datapath finishes. The two paths are built asymmetrically, each carrying only
the wide block its half of the input space can reach:

- **far path** — a full $0..w_F{+}1$ alignment [[Barrel Shifters|barrel shifter]]
  on the $(w_F{+}1)$-bit $M_Y$, an adder/subtractor emitting $w_F{+}4$ bits, and
  a 2-bit normalizer.
- **near path** — a 1-bit alignment mux, a compound adder returning
  $|M_X-M_{Y'_\mathrm{a}}|$ on $w_F{+}2$ bits, a full-width
  [[Leading Zero Counters|LZC]], and a $0..w_F{+}1$ normalization shifter.

**The near path buys exactness and spends it on an absolute value.** Because
nothing is shifted out of the datapath when $d\le 1$, the sticky bit is
identically zero — the near path needs no [[Sticky Bit Generator]] at all, and
by Sterbenz's lemma a cancelling subtraction of two nearby operands is *exact*,
so its result needs no rounding decision either. The price is that at $d=0$ the
swap by exponent says nothing about which significand is larger, so
$M_X-M_{Y_\mathrm{a}}$ can go negative. The near path therefore uses a compound
adder producing the magnitude together with a sign-change flag, which the pack
block XORs into $s_X$. On FPGAs the cheaper alternative is to take the swap
decision on the *concatenation* of exponent and fraction in the
[[Exponent Difference and Swap Unit]], which guarantees $M_X>M_Y$ outright and
collapses the compound adder back to a plain subtractor — a wide comparison is
almost free on the hard carry chain (§6.3, p. 148).

**The far path's normalizer is two bits wide, and it shifts both ways.** Three
cases exhaust it. An effective addition can carry out of position $0$, needing a
$1$-bit *right* shift and $E_R=E_X+1$. An effective addition or a subtraction
with $d\ge 2$ that stays normalized needs nothing. A subtraction with $d\ge 2$
lands in $[\tfrac12,1)$ by the bound above, needing a $1$-bit *left* shift and
$E_R=E_X-1$. A 2-bit window over the top of the sum picks between the three, so
the far path's third block is a multiplexer, not a $\log_2 w_F$ shifter — and
the exponent update is $E_X+\{+1,0,-1\}$ rather than a subtraction of a counted
$\lambda$.

**Count the slow blocks.** Baseline: five in series. Dual path: the far path has
the alignment shifter and the adder, the near path has the adder and the
LZC-plus-shifter — **two each**, with the rounding adder shared downstream. The
overhead is exactly **one output multiplexer and one duplicated significand
adder**; the shifters are *not* duplicated, because each path only ever builds
the one it can reach. Without subnormal support the book calls the two paths
"quite well balanced".

**Subnormals unbalance it, and the fix is a different counter.** Supporting
subnormals forces the LZC to saturate so that $E_X-\lambda$ cannot go negative,
which needs a comparison and a multiplexer between counter and shifter — and
therefore forbids the fused LZC-plus-shifter (see
[[Subnormal Normalization Unit]]). The near path then carries **three**
$\log_2 w_F$ operations against the far path's two and becomes the critical path
on its own, eating the gain the split was bought for. The standard repair is a
[[Leading Zero Anticipator]]: predict $\lambda$ from $M_X$ and $M_{Y_\mathrm{a}}$
*in parallel with* the subtraction rather than measuring it on the difference.
The prediction can be off by one, corrected by a final multiplexer. Taken to its
limit this becomes the [[Speculative Floating-Point Adder]], which computes every
possible near-path difference and every possible rounded far-path sum before the
exponent subtraction has even resolved.

$$\boxed{\ d\ge 2\ \wedge\ \text{eff. sub}\ \Longrightarrow\ M_X-M_{Y_\mathrm{a}}\ge\tfrac12\ }$$

**When it breaks.**

- The gain is latency only. If the operator is pipelined and hidden inside an
  application-specific datapath, the baseline's five slow blocks cost stages, not
  throughput, and the duplicated adder buys nothing — see
  [[Choosing a Floating-Point Operator]].
- With subnormal support and a plain LZC the near path has three slow blocks
  against the baseline's five and the far path's two; the split still wins, but
  by much less than the block count suggests until an anticipator is added.
- At small $w_F$ the whole argument dissolves: a $0..w_F{+}1$ shifter for
  $w_F=7$ is two multiplexer levels, no deeper than the "small" blocks it was
  split away from, and the duplicated adder is pure area.
- The $\ge\tfrac12$ bound assumes both operands normalized. A subnormal $M_Y$ has
  $M_Y<1$, but the bound only used $M_Y<2$, so it survives; a subnormal $M_X$
  breaks $M_X\ge 1$ and is handled instead by the exponent encoding of
  [[Number Formats]], which keeps $d$ correct via $E_X-n_X-(E_Y-n_Y)$.
- Nothing here changes accuracy. Both paths compute the same exact pre-rounding
  value the baseline does, so the $\le\tfrac12$ ulp claim of [[Error Accuracy]]
  is inherited unchanged, not re-earned.

**RTL (Spade).**

```spade
/// Leading-zero count of x, in [0, N]. One comparison level per bit.
fn clz<#uint N>(x: uint<N>) -> uint<N> {
    gen if N == 1 {
        if x.msb() { 0 } else { 1 }
    } else {
        if x.msb() {
            0
        } else {
            let lo: uint<{N - 1}> = trunc(x);
            let inner: uint<N> = zext(clz::<{N - 1}>(lo));
            trunc(inner + 1)
        }
    }
}

/// Dual-path significand datapath. mx, my are W-bit normalized significands
/// (W = w_F + 1, MSB set), already swapped so that E_X >= E_Y;
/// d = E_X - E_Y, esub = effective subtraction.
/// Returns { normalized significand : W bits | exponent adjustment : int<8> }.
/// Needs W >= 6 so that the shift count fits an int<8>.
fn dual_path<#uint W>(mx: uint<W>, my: uint<W>, d: uint<{W + 1}>, esub: bool)
    -> uint<{W + 8}>
{
    let xa:  uint<{W + 1}> = zext(mx);
    let myg: uint<{W + 1}> = zext(my);

    // far path: full alignment shifter, adder/subtractor, 2-bit normalizer
    let yfar = myg >> d;
    let sf = if esub { xa -. yfar } else { xa +. yfar };
    let sw: uint<W> = trunc(sf);
    let (mfar, efar): (uint<W>, int<8>) = if sf.msb() {
        (trunc(sf >> 1), 1)          // carry out of position 0
    } else if sw.msb() {
        (sw, 0)                      // already normalized
    } else {
        (trunc(sf << 1), -1)         // the single bit of cancellation d >= 2 allows
    };

    // near path: 1-bit alignment mux, compound adder, full LZC + shifter
    let ynear = if d == 1 { myg >> 1 } else { myg };
    let dxy = xa -. ynear;
    let dyx = ynear -. xa;
    let diff = if xa >= ynear { dxy } else { dyx };   // |Mx - Mya|; flag = xa < ynear
    let shift = clz(diff) -. 1;                       // diff < 2^W, so clz >= 1
    let mnear: uint<W> = trunc(diff << shift);
    let sh8: int<8> = trunc(shift.to_int());
    let enear = -sh8;

    let near = esub && (d < 2);
    let m = if near { mnear } else { mfar };
    let e = if near { enear } else { efar };
    m.concat(e.as_uint())
}
```

`yfar` is the far-path barrel shifter and `ynear` the near-path 1-bit mux — the
same $M_Y$ enters both, which is why the drawing shows the operand bus fanning
out to two boxes rather than a shifter feeding a selector. `dxy`/`dyx` are the
two halves of the compound adder; taking their difference selectively is
$|M_X-M_{Y'_\mathrm{a}}|$, and the discarded predicate `xa < ynear` is the
sign-change flag the diagram omits. Widths: the internal datapath is $W{+}1$
bits so the effective-addition carry has somewhere to land, and both paths
truncate back to $W$ after normalizing. Everything is combinational; the final
`if near` is the output multiplexer, and it is the *only* place the two paths
meet. Synthesis will not build `clz` as the $W$-deep ripple this recursion
literally describes — it will flatten it into a $\log_2 W$ tree, which is the
whole reason the near path counts as one slow block and not $w_F$.

Compiled with `spade 0.19.0` at $W=24$ (the IEEE binary32 significand) and
simulated against a **behavioural single-path baseline** — align, add, then
normalize with a shift loop — written independently in the testbench: 4010
vectors, 10 named (both operand orders at $d=0$, total cancellation, $d=1$ with
an odd $M_Y$, addition overflow, the worst $d=2$ cancellation, full alignment
saturation) plus a 4000-vector random sweep over normalized significands with
$d\in[0,31]$. All agree on both the significand and the exponent adjustment.

**Related Notes.**

- [[Floating-Point Adder]] – compares: the single-path baseline whose five slow
  blocks this note reorganizes into two-plus-two.
- [[Barrel Shifters]] – depends-on: the $0..w_F{+}1$ alignment shifter the far
  path keeps and the near path refuses to build.
- [[Leading Zero Counters]] – depends-on: the full-width counter that only the
  near path needs, and whose saturation for subnormals breaks the balance.
- [[Leading Zero Anticipator]] – extends: predicts $\lambda$ in parallel with the
  subtraction, moving the near path's third slow block off the critical path.
- [[Speculative Floating-Point Adder]] – extends: the same exclusivity argument
  pushed until every case is computed and only selection remains.
- [[Exponent Difference and Swap Unit]] – depends-on: produces $d$ and the
  near/far selector, and on FPGAs can remove the compound adder entirely.
- [[Subnormal Normalization Unit]] – counter-example: the saturated LZC that
  forbids the fused LZC-plus-shifter and unbalances the two paths.
- [[Floating-Point Rounding Adder]] – supports: the shared final block both paths
  feed, unchanged by the split.
- [[Choosing a Floating-Point Operator]] – compares: when the latency this buys
  is worth one extra significand adder.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §11.1.4 *Dual-Path Architectures and Other Speculative Techniques*,
    pp. 340-342 — the exclusivity observation, Fig. 11.6, the far/near block
    lists, the "one multiplexer and one duplicated significand adder" overhead,
    the "no sticky on the near path" remark, the three-slow-block near path under
    subnormal support, leading-zero anticipation, and Lutz's fully speculative
    adder.
  - §11.1.1 *General Considerations*, pp. 331-336 — far/near terminology,
    Figs. 11.1 and 11.3, the compound adder returning $|M_X-M_{Y_\mathrm{a}}|$
    with a sign-change flag.
  - §11.1.2 *Baseline Addition Architecture*, Fig. 11.5, pp. 336-339 — the five
    slow blocks and the bit widths reused in the drawing above; the FPGA
    concatenated-comparison swap, p. 338, citing §6.3, p. 148.
  - §11.1.3 *From Baseline Adder to IEEE 754 Compliance*, pp. 339-340 — LZC
    saturation for subnormals and why it forbids the fused LZC-plus-shifter.
- [SN01] Schmookler & Nowka, "Leading Zero Anticipation and Detection", *ARITH*
  2001; [Lut17] Lutz, "Optimized Leading Zero Anticipators", *Asilomar* 2017 —
  cited p. 342.
- [Lut19] D. Lutz, "ARM Floating-Point 2019: Latency, Area, Power", *ARITH* 2019,
  pp. 69-76 — the 1-cycle double-precision speculative adder; cited p. 342.
- [Soh+22] Sohn et al., "Enhanced Floating-Point Adder with Full De-normal
  Support", *ARITH* 2022 — cited p. 342.
