---
title: "Floating-Point Multiplier"
description: "Exponent add and significand multiply are independent, so normalization is a single mux over a statically known two-binade product range, and the exponent increment is a mux instead of a carry propagation."
kind: circuit
source: "ASA §11.2.1-11.2.2, pp. 343-346"
status: seed
spade: simulated
tags: [digital, floating-point-operators, multiplier, rounding, normalization]
aliases:
  - FPMult
  - FP Multiplier
  - Floating-Point Multiplication
  - Baseline Floating-Point Multiplier
---

# Floating-Point Multiplier

The one floating-point operator whose two datapaths never talk to each other:
the exponent sum and the significand product are computed independently, and
the only coupling is a 1-bit normalization decision over a product range that
is known before the circuit is built.

```tikz title="Baseline floating-point multiplier: an exponent adder with two tentative debiased exponents, a significand multiplier, a 1-bit normalization mux and a rounding adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% --- unpack -----------------------------------------------------------------
\node[draw,minimum width=10cm,minimum height=0.8cm] (unp) at (0,0)
  {unpack \& exception handling};
\draw[<-] (-1.3,0.4) -- ++(0,0.8) node[above,font=\small]{$X$};
\draw[<-] ( 1.3,0.4) -- ++(0,0.8) node[above,font=\small]{$Y$};
% --- sign path --------------------------------------------------------------
\node[xor port] (sx) at (-6.6,-2.2) {};
\draw (-5,0.25) -- (-7.9,0.25) |- (sx.in 1);
\draw (-5,-0.05) -- (-7.6,-0.05) |- (sx.in 2);
\node[font=\tiny,anchor=south east] at (-5.05,0.3) {$s_X$};
\node[font=\tiny,anchor=north east] at (-5.05,-0.4) {$s_Y$};
\draw[->] (sx.out) -- (-5.7,-2.2) -- (-5.7,-6.6) -- (-5.0,-6.6);
\node[font=\tiny,anchor=west] at (-5.65,-4.4) {$s_R$};
% --- exponent path ----------------------------------------------------------
\node[draw,minimum width=1.6cm,minimum height=0.5cm] (add) at (-2.6,-1.5) {$+$};
\draw[->] (-3.2,-0.4) -- node[left,font=\tiny]{$E_X$} (-3.2,-1.25);
\draw[->] (-2.0,-0.4) -- node[right,font=\tiny]{$E_Y$} (-2.0,-1.25);
\node[draw,minimum width=1.5cm,minimum height=0.5cm] (m0) at (-3.7,-2.8) {$-E_0$};
\node[draw,minimum width=1.7cm,minimum height=0.5cm] (m1) at (-1.5,-2.8) {$-E_0+1$};
\draw (-2.6,-1.75) -- node[right,font=\tiny]{$w_E{+}1$} (-2.6,-2.3);
\draw (-3.7,-2.3) -- (-1.5,-2.3);
\draw[->] (-3.7,-2.3) -- (-3.7,-2.55);
\draw[->] (-1.5,-2.3) -- (-1.5,-2.55);
\node[draw,minimum width=2.8cm,minimum height=0.5cm] (mux) at (-2.6,-4.3) {};
\node[font=\tiny] at (-3.7,-4.3) {0};
\node[font=\tiny] at (-1.5,-4.3) {1};
\draw[->] (-3.7,-3.05) -- node[left,font=\tiny]{$w_E{+}2$} (-3.7,-4.05);
\draw[->] (-1.5,-3.05) -- node[left,font=\tiny]{$w_E{+}2$} (-1.5,-4.05);
\draw[->] (-2.6,-4.55) -- node[right,font=\tiny]{$w_E{+}2$} (-2.6,-6.2);
% --- significand path -------------------------------------------------------
\node[draw,minimum width=3.0cm,minimum height=2.2cm] (mul) at (2.8,-1.9) {$\times$};
\draw[->] (2.0,-0.4) -- node[left,font=\tiny]{$M_X$} (2.0,-0.8);
\draw[->] (3.6,-0.4) -- node[right,font=\tiny]{$M_Y$} (3.6,-0.8);
\node[draw,minimum width=2.6cm,minimum height=0.55cm] (nrm) at (2.8,-4.2) {1-bit norm.};
\draw[->] (2.8,-3.0) -- node[right,font=\tiny]{$P$: ufix$(1,-2w_F)$} (2.8,-3.925);
\node[draw,minimum width=3.0cm,minimum height=0.6cm] (rnd) at (2.8,-5.4) {rounding adder};
\draw[->] (2.8,-4.475) -- node[right,font=\tiny]{ufix$(-1,-w_F{-}1)$} (2.8,-5.1);
\draw[->] (2.8,-5.7) -- node[right,font=\tiny]{ufix$(-1,-w_F)$} (2.8,-6.2);
% --- overflow OR feeding the exponent mux select ----------------------------
\node[or port,xscale=-1] (org) at (-0.3,-4.65) {};
\draw (2.8,-3.4) -- (1.1,-3.4) |- (org.in 1);
\draw (1.3,-5.4) -- (0.7,-5.4) |- (org.in 2);
\node[font=\tiny,anchor=south] at (1.55,-3.38) {$P$ overflow};
\node[font=\tiny,anchor=north] at (1.0,-5.46) {$c_\mathrm{out}$};
\draw[->] (org.out) |- (-1.2,-4.3);
% --- pack -------------------------------------------------------------------
\node[draw,minimum width=10cm,minimum height=0.8cm] (pk) at (0,-6.6)
  {exception handling \& pack};
\draw[->] (0,-7.0) -- ++(0,-0.6) node[below,font=\small]{$R$};
\draw (5,0.15) -- (6.0,0.15) -- (6.0,-6.6);
\draw[->] (6.0,-6.6) -- (5.0,-6.6);
\node[font=\tiny,anchor=west] at (6.05,0.15) {exceptions};
\node[font=\tiny,align=center] at (0,-8.1)
  {$M_X,M_Y$ carry the implicit leading one ($w_F{+}1$ bits each); $P$ is $2w_F{+}2$ bits};
\end{circuitikz}
\end{document}
```

*after Fig. 11.7, p. 344*

**Separate the exponent from the significand, exactly.** Write both normalized
operands as $X=(-1)^{s_X}2^{E_X-E_0}M_X$ with $M_X\in[1,2)$ and the biased
field $E_X$ on $w_E$ bits (see [[Number Formats]]). Commutativity of
multiplication regroups the four factors, and the exponent law $2^a2^b=2^{a+b}$
collapses the two powers into one:

$$X\times Y=(-1)^{s_X\oplus s_Y}\cdot 2^{(E_X-E_0)+(E_Y-E_0)}\cdot M_XM_Y \tag{11.1}$$

Nothing on the right couples the two products. The sign is **one XOR gate**. The
exponent is one $(w_E{+}1)$-bit addition $E_X+E_Y$ — the extra bit is carry
growth, not slack — followed by a *single* subtraction of $E_0$, because both
input fields carry the bias and the output field needs it once:
$(E_X-E_0)+(E_Y-E_0)+E_0=E_X+E_Y-E_0$. The result is kept on $w_E+2$ bits
through the whole datapath: one bit for the sign, so that underflow below the
normal range is distinguishable, and one for overflow above it. Only the pack
stage decides which of those is an exception ([[Floating-Point Exception Handling]]).
The significand is one $(w_F{+}1)\times(w_F{+}1)$ multiplier — the entire content
of [[Multipliers]], with nothing floating-point about it.

**Bound the product to exactly two binades, and normalization becomes a
multiplexer.** Both significands are normalized, $M_X,M_Y\in[1,2)$, so by
monotonicity of multiplication on the positive reals

$$P=M_XM_Y\in[1\cdot 1,\;2\cdot 2)=[1,4)$$

This is a *static* bound: it holds for every pair of normalized inputs, so the
hardware never has to measure anything. $P$ is a $(2w_F{+}2)$-bit
`ufix(1,`$-2w_F$`)` number, and the single bit that distinguishes the two
binades is its leading bit. If $P\in[2,4)$ — "product overflow" — a $1$-bit
right shift returns it to $[1,2)$ and the exponent takes $+1$; otherwise
nothing moves. A shift by a statically known amount, selected by one bit, is a
**multiplexer**. Compare the [[Floating-Point Adder]], whose result can be as
small as $2^{-w_F-1}$ of its operands under cancellation and therefore needs a
leading-zero count feeding a full barrel shifter: two of its five slow blocks
exist only because *its* output range is not statically bounded.

**Keep one bit below the fraction, then round.** After the 1-bit normalization
the leading one is at position $0$ and is discarded (it is implicit again), so
what leaves the block is a `ufix(-1,`$-w_F-1$`)` value: $w_F$ fraction bits plus
**one** round bit at position $-w_F-1$. Everything below the round bit is thrown
away. Adding that round bit into the fraction is round to nearest, ties away —
for a positive significand "away from zero" and "up" are the same direction — and
the [[Floating-Point Rounding Adder]] that does it is $w_F$ bits wide, producing
`ufix(-1,`$-w_F$`)`. The bits discarded below position $-w_F-1$ are exactly the
information a [[Sticky Bit Generator]] would have to preserve for the other
rounding modes; the baseline simply does not build one.

**Make the exponent increment a multiplexer instead of a carry propagation.**
The exponent must be bumped in two cases: product overflow, and a rounding
addition that carries out of the fraction (all-ones $\to$ all-zeros, the
$1.1111\to10.000$ case). Rather than add $1$ late, compute **both** tentative
exponents up front, $E_X+E_Y-E_0$ and $E_X+E_Y-E_0+1$, in parallel with the
multiplier, and select. That is only legal if the two triggers are mutually
exclusive, and they are. The largest normalized significand is $2-2^{-w_F}$, so
the largest possible product is $(2-2^{-w_F})^2=4-4\cdot2^{-w_F}+2^{-2w_F}$;
after the product-overflow shift divides it by two,

$$\tfrac12\big(2-2^{-w_F}\big)^2=2-2^{-w_F+1}+2^{-2w_F-1}\;<\;2-2^{-w_F}$$

because $2^{-w_F+1}-2^{-2w_F-1}>2^{-w_F}$ for every $w_F\ge1$. The normalized
product is therefore *strictly below* the largest representable significand,
with room to spare, so it cannot round up into the next binade. A product
overflow rules out a rounding overflow. The OR of the two flags drives a
multiplexer over two precomputed $(w_E{+}2)$-bit values — no carry crosses the
exponent field on the critical path, which is strictly cheaper than the
floating-point adder's normalization addition over all $w_E+w_F$ bits (p. 345).

**Ties to even is nearly free here, and expensive in the adder.** Full IEEE 754
round to nearest even needs to know whether the discarded tail was exactly half
an ulp, which is an OR tree over the low $\sim w_F$ bits of $P$. Those bits are
the **lightest columns** of the multiplier's compression tree ([[Bit Heaps]],
[[Wallace Tree]]): they involve the fewest partial products and therefore settle
*first*, long before the heavy columns that determine the kept bits. The sticky
OR runs in the multiplier's shadow and never joins the critical path (p. 345).
In the adder the same bit has to be computed from the tail shifted out by a
data-dependent alignment, which is why the sticky *is* the bulk of that
operator's compliance cost.

**Subnormals cost one shift if you refuse to build three blocks.** The product
of two subnormals always rounds to zero, so only one subnormal input needs
handling. The obvious route — normalize the subnormal operand with a
leading-zero count and a shifter, widen the exponent by one bit, multiply, then
denormalize the result if it is tiny — puts a shifter before *and* after the
multiplier and **more than doubles the latency** of the figure (p. 345). The
better route performs exactly one shift, on $P$. The true result exponent is
deducible from $E_X$, $E_Y$ and the leading-zero count $\lambda$ of the
subnormal input; a significand multiplier is perfectly happy with an operand
whose leading bit is the "is normal" bit rather than a guaranteed one (§2.5.1,
p. 48). So the LZC, the exponent update and the shift-distance computation all
run **in parallel with the multiplier**, and a single shift of $P$ slots in
before rounding — see [[Subnormal Normalization Unit]].

> [!warning] No synthesis numbers in this chapter
> Chapter 11 gives no LUT, DSP, slice or delay figures for any floating-point
> multiplier variant. The only hard quantities are the bit widths in Fig. 11.7
> and the "more than doubles the latency" remark for naive subnormal support
> (p. 345). Comparing this against a fixed-point multiplier of the same
> significand width needs your own synthesis run.

$$\boxed{\ \tfrac12\big(2-2^{-w_F}\big)^2\;<\;2-2^{-w_F}\ \Longrightarrow\ \text{product overflow and rounding overflow are exclusive}\ }$$

**When it breaks.**

- **Subnormal inputs break the premise, not the detail.** $P\in[1,4)$ was derived
  from $M_X,M_Y\in[1,2)$. A subnormal operand has $M<1$, the product can land
  anywhere in $(0,2)$, and the 1-bit multiplexer is no longer a normalizer. This
  is a structural failure, not a rounding inaccuracy.
- **The exclusivity proof assumes an exact product.** Replace the significand
  multiplier with a truncated one and the bound must be re-checked, because the
  faithful $P$ may exceed the exact one — it survives, and
  [[Faithful Floating-Point Multiplier]] shows why the error budget still closes
  at $1$ ulp in both binades.
- **The baseline is ties-away, not ties-even.** It is *not* IEEE 754 compliant as
  drawn; see [[Rounding]] for what the default mode demands.
- **Two slow blocks remain in series.** The multiplier and the rounding adder are
  both $\log_2 w_F$ deep. That is the latency floor of this architecture, and
  the only way past it is to fuse them — [[Injection Rounding]] adds the constant
  $2^{-w_F-1}$ as one more column of the bit heap and finishes with a compound
  adder instead of a second addition.
- **Area, not latency, is the real cost.** The structural simplicity here is a
  statement about the critical path. The quadratic significand multiplier still
  dominates the area of the operator, and grows as $w_F^2$ while every other
  block grows linearly or logarithmically — see
  [[Choosing a Floating-Point Operator]].
- **Nothing in the datapath knows about $0$, $\infty$ or NaN.** $0\times\infty$
  is a NaN, and the entire special-case table is handled by the unpack and pack
  blocks; the significand path computes a meaningless product in those cases and
  is overridden.

**RTL (Spade).**

```spade
/// Baseline floating-point multiplier datapath, normalized operands only.
/// mx, my : W-bit significands, MSB = the implicit 1  (W = w_F + 1)
/// ex, ey : E-bit biased exponent fields; bias = 2^(E-1) - 1, on E+2 bits
/// result : { biased result exponent : E+2 bits | fraction : W-1 bits }
fn fp_mul<#uint W, #uint E>(
    mx: uint<W>, my: uint<W>, ex: uint<E>, ey: uint<E>, bias: uint<{E + 2}>
) -> uint<{E + W + 1}> {
    // exponent path: one (E+1)-bit add, two tentative debiased exponents
    let es: uint<{E + 2}> = zext(ex + ey);
    let e0 = es -. bias;
    let e1 = e0 +. 1;

    // significand path: one W x W multiplier, P in [1,4)
    let p = mx * my;
    let povf = p.msb();
    let pn = if povf { p } else { p << 1 };     // the 1-bit normalization mux

    // keep w_F fraction bits and one round bit, discard the leading one
    let sh: uint<{2 * W}> = W - 1;
    let top: uint<W> = trunc(pn >> sh);
    let frac: uint<{W - 1}> = trunc(top >> 1);
    let rb: uint<{W - 1}> = zext(top.lsb().as_uint());
    let rsum = frac + rb;                       // rounding adder, ties away
    let fr: uint<{W - 1}> = trunc(rsum);
    let rovf = rsum.msb();

    let er = if povf || rovf { e1 } else { e0 };
    er.concat(fr)
}
```

`p` is the wire labelled $P$, and `pn` is the output of the 1-bit norm block —
written as a shift *left* when there is no product overflow rather than a shift
right when there is, which is the same mux with the binade point moved one place
so that the leading one always sits at the MSB. `povf` is the tap into the OR
gate, `rovf` is $c_\mathrm{out}$, and `if povf || rovf` is the exponent
multiplexer: both `e0` and `e1` are materialised, exactly as the drawing shows
two subtractor boxes rather than one subtractor and one incrementer. Widths grow
as the figure does — $W\times W\to 2W$ for the product, $W{-}1$ plus a round bit
$\to W$ for the rounding adder, whose carry-out *is* `rovf`. Everything is
combinational; synthesis will not build `mx * my` as the flat `*` this code
writes, but as a compressor tree plus a final adder, and it is the low columns of
that tree that make the ties-even sticky free.

Compiled with `spade 0.19.0` at $(w_E,w_F)=(5,10)$ — IEEE binary16 — and
simulated against a **behavioural reference** that rounds the exact 22-bit
product by injection, $q=\lfloor(P+\tfrac12\mathrm{ulp})/\mathrm{ulp}\rfloor$,
sharing no shift or mux structure with the DUT: **4010 vectors pass**, 10 named
plus a 4000-vector random sweep over normalized significands and both exponent
fields. The named vectors include $1.0\times(2-2^{-10})$ and the same pair with
the operands swapped (the asymmetric case that catches a reversed bit order),
the maximal product $(2-2^{-10})^2$, a product in $[1,2)$ whose rounding
overflows the fraction, and exponent sums that wrap below the bias and above the
field. The testbench also asserts the boxed exclusivity claim on every vector —
product overflow and rounding overflow never co-occurred once in 4010 trials.

**Related Notes.**

- [[Multipliers]] – depends-on: the significand path is an ordinary unsigned
  $(w_F{+}1)$-bit multiplier and inherits every trade-off from that topic.
- [[Wallace Tree]] – depends-on: the compression structure whose column arrival
  order is what makes the ties-even sticky bit free.
- [[Bit Heaps]] – depends-on: the same product seen as a heap of weighted bits,
  which is where the injected rounding constant becomes one extra column.
- [[Floating-Point Rounding Adder]] – supports: the $w_F$-bit final addition
  whose carry-out is the second trigger for the exponent increment.
- [[Injection Rounding]] – extends: fuses the multiplier and the rounding adder,
  removing one of the two slow blocks in series.
- [[Faithful Floating-Point Multiplier]] – extends: the same architecture with a
  truncated significand multiplier, at $<1$ ulp instead of $\le\tfrac12$ ulp.
- [[Floating-Point Adder]] – compares: the operator whose output range is *not*
  statically bounded, and which therefore pays for an LZC and two shifters.
- [[Floating-Point Divider]] – compares: same skeleton, but the quotient lands in
  $(\tfrac12,2)$ so the 1-bit normalization shifts the other way.
- [[Subnormal Normalization Unit]] – extends: how the one-shift subnormal route
  hides its leading-zero count behind the multiplier.
- [[Floating-Point Exception Handling]] – supports: the unpack and pack blocks
  that own $0$, $\infty$, NaN and the overflow/underflow decision on $w_E+2$ bits.
- [[Choosing a Floating-Point Operator]] – compares: when the quadratic area of
  the significand multiplier is worth its trivial control.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §11.2.1 *Baseline Multiplication Architecture*, pp. 343-345 — Table 11.2
    (special cases), eq. (11.1), Fig. 11.7 and its bit widths, the $P\in[1,4)$
    argument, the 1-bit normalization multiplexer, the two tentative exponents,
    the $(2-2^{-w_F})^2$ exclusivity computation, and the $w_E+2$ exponent width
    kept until pack.
  - §11.2.2 *From Baseline Multiplier to IEEE 754 Compliance*, pp. 345-346 — the
    ties-to-even OR tree that arrives early, the product of two subnormals
    rounding to zero, the naive subnormal route that "more than doubles the
    latency", and the one-shift alternative; cites §2.5.1, p. 48 for the
    "is normal" implicit bit.
  - §11.2.3 *Faithful Floating-Point Multiplier*, p. 346 — the architecture is
    unchanged with a narrower $P$.
  - §11.2.4 *Injection Rounding*, pp. 346-347 — the constant $2^{-w_F-1}$ in the
    partial-product array and the compound adder that absorbs the correction bit.
  - §11.1.2 *Baseline Addition Architecture*, pp. 336-339 — the five-slow-block
    adder this note is contrasted against.
- [Mul+18] Muller et al., *Handbook of Floating-Point Arithmetic*, 2nd ed.,
  Birkhäuser 2018 — injection rounding for the other rounding modes and for
  subnormals; cited pp. 346, 347.
