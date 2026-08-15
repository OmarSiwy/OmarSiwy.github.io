---
title: "Floating-Point Adder"
description: "Alignment shifter, significand adder, LZC+normalizer and rounding adder in series: the smallest thing that adds two floats to round-to-nearest ties-away, at the price of five log-depth blocks on one critical path."
kind: circuit
source: "ASA §11.1.1-11.1.2, pp. 331-339"
status: seed
spade: simulated
tags: [digital, floating-point-operators, adder, rounding, fpga]
aliases:
  - FP Adder
  - FPAdd
  - Baseline Floating-Point Adder
  - Floating-Point Adder/Subtractor
  - Floating-Point Addition
---

# Floating-Point Adder

The baseline floating-point adder aligns, adds, normalizes and rounds in one
straight line — the only adder in this vault whose critical path contains
*five* $\log_2 w_F$-depth blocks, because a sum refuses to factor into
independent exponent and significand parts.

```tikz title="Baseline floating-point adder: alignment shifter, significand adder, LZC/normalizer and rounding adder all in series"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node[draw,minimum width=10cm,minimum height=0.8cm] (unp) at (0,0)
  {unpack \& exception handling, exponent difference \& swap};
\draw[<-] (-4.4,0.4) -- ++(0,0.8) node[above,font=\small]{add$/\overline{\mathrm{sub}}$};
\draw[<-] (-1.2,0.4) -- ++(0,0.8) node[above,font=\small]{$X_\mathrm{in}$};
\draw[<-] ( 1.2,0.4) -- ++(0,0.8) node[above,font=\small]{$Y_\mathrm{in}$};
\draw[->] ( 4.4,0.4) -- ++(0,0.8) node[above,font=\small]{exceptions};
% significand path
\node[draw,minimum width=1.4cm,minimum height=0.7cm] (sh)  at (1.2,-1.5) {$\gg$};
\node[draw,minimum width=3.0cm,minimum height=0.7cm] (add) at (0.1,-2.9) {$|M_X\pm M_{Y_\mathrm{a}}|$};
\node[draw,minimum width=2.6cm,minimum height=0.9cm] (lzc) at (0.1,-4.3) {LZC $+$ shifter};
\node[draw,minimum width=3.4cm,minimum height=0.7cm] (rnd) at (-1.0,-5.8) {rounding adder};
\node[draw,minimum width=10cm,minimum height=0.8cm]  (pk)  at (0,-7.2) {exception handling \& pack};
% exponent path
\node[draw,minimum width=1.2cm,minimum height=0.6cm] (inc) at (-4.0,-2.9) {$+1$};
\node[draw,minimum width=1.2cm,minimum height=0.6cm] (sub) at (-4.0,-4.3) {$-$};
% wires
\draw[->] (1.2,-0.4) -- node[right,font=\tiny]{$M_Y$\;:\;$w_F{+}1$} (1.2,-1.15);
\draw[->] (4.4,-0.4) -- node[right,font=\tiny,align=left]{$|E_X{-}E_Y|$\\$\lceil\log_2(w_F{+}2)\rceil$ bits} (4.4,-1.5) -- (1.9,-1.5);
\draw[->] (1.2,-1.85) -- node[right,font=\tiny]{$M_{Y_\mathrm{a}}$\;:\;$w_F{+}3$} (1.2,-2.55);
\draw[->] (-1.2,-0.4) -- node[left,font=\tiny]{$M_X$\;:\;$w_F{+}1$} (-1.2,-2.55);
\draw[->] (0.1,-3.25) -- node[right,font=\tiny]{$M_S$\;:\;$w_F{+}4$} (0.1,-3.85);
\draw[->] (0.1,-4.75) -- node[right,font=\tiny]{$F_N$\;:\;$w_F{+}1$} (0.1,-5.45);
\draw[->] (-1.2,-4.3) -- node[above,font=\tiny]{$\lambda$} (-3.4,-4.3);
\draw[->] (-4.0,-0.4) -- node[left,font=\tiny]{$E_X$\;:\;$w_E$} (-4.0,-2.6);
\draw[->] (-4.0,-3.2) -- node[left,font=\tiny]{$w_E{+}1$} (-4.0,-4.0);
\draw[->] (-4.0,-4.6) -- node[left,font=\tiny]{$w_E{+}2$} (-4.0,-5.8) -- (-2.7,-5.8);
\draw[->] (-1.0,-6.15) -- node[right,font=\tiny]{$w_E{+}2{+}w_F$} (-1.0,-6.8);
\draw[->] (0,-7.6) -- ++(0,-0.6) node[below,font=\small]{$R$};
\node[font=\tiny,align=center] at (0,-9.15)
  {sign datapath omitted; the $R{=}0$ flag from a saturated LZC and the result sign $s_R$ also feed the pack block};
\end{circuitikz}
\end{document}
```

*after Fig. 11.5, p. 337.*

**The exponent cannot be factored out of a sum, and that is the whole
architecture.** Write the operands with the bias stripped,
$X=(-1)^{s_X}2^{E_X-E_0}M_X$ with significand $M_X\in[1,2)$ carried on $w_F+1$
bits and biased exponent field $E_X$ on $w_E$ bits ([[Floating-Point Formats]]).
For a product, the exponent law $2^a2^b=2^{a+b}$ and commutativity let the four
factors regroup so that exponent and significand separate exactly. For a sum,
$2^a+2^b$ does not simplify; the best distributivity gives is

$$X+Y=2^{E_X-E_0}\Big(M_X\pm M_Y\cdot 2^{-d}\Big),\qquad d=E_X-E_Y\ge 0$$

and the leftover $2^{-d}$ is a right shift by a **data-dependent** amount, which
is a [[Barrel Shifters]] problem, not wiring. Worse, the bracket has left
$[1,2)$: under cancellation it can fall as low as $2^{-w_F-1}$, so the result
needs a leading-zero count ([[Leading Zero Counters]]) and a *second* variable
shift ([[Normalizers]]) before it can be packed. Multiplication normalizes with
a multiplexer; addition normalizes with a shifter it must first measure.

**Both shift bounds fall out of the same algebra, and they size the hardware.**
If $d>w_F+1$ then $|Y|<2^{E_Y-E_0+1}\le 2^{E_X-E_0-w_F-1}=\tfrac12\,\mathrm{ulp}(X)$,
so under round to nearest $X+Y$ *is* $X$ and the operator may discard $Y$
outright. The exponent difference is therefore **saturated** — the book says at
$w_F+2$; see the correction below — and the alignment shifter is
$\lceil\log_2(w_F+2)\rceil$ stages deep, not $w_E$ — a
$w_E$-deep shifter would be pure waste for every format ($w_E=11$, $w_F=52$ in
binary64 makes the difference 6 stages against 11). Symmetrically the LZC is
saturated at $w_F+4$: reaching it means total cancellation and the pack block
emits zero (p. 338).

**The significand adder is narrower than the format suggests.** In the far cases
the rightmost $w_F-1$ bits of the aligned $M_{Y_\mathrm{a}}$ can never influence
any bit at or above the rounding position, which sits at $-w_F-1$, $-w_F$ or
$-w_F-2$ depending on which normalization case fires (p. 335). Only positions
$0$ down to $-w_F-2$ are needed, so the addition consumes two $(w_F{+}3)$-bit
numbers and emits $w_F+4$ bits — one overflow bit on top. Everything below
$-w_F-2$ collapses into a single **sticky** bit ([[Sticky Bit Generator]]). This
is *computing just right* applied to a subtraction: sizing the adder from the
rounding position backwards rather than from the operand width forwards.

**Swap on the whole number and the absolute value disappears.** After the
exception table and a swap ensuring $E_X\ge E_Y$ ([[Exponent Difference and Swap Unit]]), the effective operation is an addition when the signs agree and a
subtraction when they differ — so subtraction is free, $X-Y=X+(-Y)$ holds for
every value but NaN, and the operator costs **one XOR** on $s_Y$ more than an
adder (p. 331). When $d=0$ the difference can go negative, which in general
forces a compound adder returning $|M_X-M_{Y_\mathrm{a}}|$ plus a sign-change
flag. FloPoCo dodges this by taking the swap decision on the *concatenation*
$E_X\!:\!F_X$ versus $E_Y\!:\!F_Y$ read as one integer, which guarantees
$M_X>M_Y$ even in the near cases; the sign of the result is then always the sign
of $X$ and the block collapses to a plain $M_X\pm M_{Y_\mathrm{a}}$. That is a
good trade **specifically on FPGAs**, where a wide comparison rides the hardened
carry logic and is fast and cheap ([[FPGAs]]); on ASIC the compound adder may
still win, and the book is explicit that the choice is technology-dependent
(p. 338).

**Normalize by counting, but pay for the count before you know it.** Let
$\lambda$ be the number of leading zeros of the $(w_F{+}4)$-bit sum $M_S$. The
exponent update must subtract $\lambda-1$, not $\lambda$: leading zeros are
counted from the *overflow* bit, and that $-1$ is exactly what pays for the
possible one-bit **right** shift when an effective addition carries out of
position $0$. Rather than put an extra subtraction on the critical path, $E_X$
is **incremented first**, in parallel with the entire significand path, and
$\lambda$ subtracted from $E_X+1$ (p. 338). The result is kept on $w_E+2$ bits —
one sign bit and one overflow bit above the $w_E$ exponent bits — so the pack
block can distinguish overflow from underflow by inspection of two wires.

**Rounding is one addition that updates the exponent for free.** Concatenate the
$(w_E{+}2)$-bit updated exponent with the $(w_F{+}1)$-bit normalized fraction
$F_N$ — the $w_F$ fraction bits plus one round bit at the LSB — add a single $1$
at the LSB of that concatenation, and discard the LSB. For a positive
significand, injecting half an ulp and truncating *is* round to nearest ties
away ([[Rounding]], [[Injection Rounding]]); and because the two fields are
physically adjacent, a carry out of the fraction propagates straight into the
exponent, incrementing it and resetting the fraction to zeros — which is exactly
the required behaviour for $1.111\ldots1 + \mathrm{ulp} \to 1.000\ldots0\times2$.
No comparator, no second increment, no multiplexer. It is also why a **biased**
exponent costs nothing here: the bias cancels in $E_X-E_Y$ and is untouched by
$E_X+1-\lambda$ ([[Number Formats]], [[Floating-Point Rounding Adder]]).

> [!warning] Ties-away still needs the sticky — as a borrow, not as a tie-breaker
> p. 336 says ties-away "simply adds a 1 at position $-w_F-1$ of the mantissa of
> $N$ without consideration to any of the bits to the right", and Fig. 11.5
> draws no sticky path. That is true of the *rounding* step and false of the
> *alignment* step. Truncating $M_{Y_\mathrm{a}}$ to $w_F+3$ bits makes it too
> small, so on an **effective subtraction** $M_X-M_{Y_\mathrm{a}}$ comes out too
> large — by less than one unit in the last place of the internal frame, which
> is enough to flip the round bit. The exact sum is
> $M_X-M_{Y_\mathrm{a}}-\varepsilon$ with $0\le\varepsilon<2^{-w_F-2}$, so its
> truncation to the frame is $M_X-M_{Y_\mathrm{a}}-\mathrm{sticky}$: the sticky
> bit *is* the borrow out of the discarded tail. Removing that one subtracted
> bit from the RTL below and re-running the exhaustive sweep on the $(4,3)$
> format gives **1652 wrong results out of 49169** — 3.4% of all pairs, each off
> by one ulp, each still faithful and none catchable by inspection of the
> figure. Budget the sticky for the baseline, not only for ties-to-even.

> [!warning] The saturation constant is one too small
> p. 337 says the exponent difference "must be saturated to $w_F+2$ … this way,
> the significand $M_Y$ is completely shifted out". It is not. $M_{Y_\mathrm{a}}$
> lives on positions $0$ down to $-(w_F+2)$ and $M_Y$'s LSB starts at $-w_F$, so
> a right shift by $w_F+2$ leaves $M_Y$'s **leading one sitting on the last
> frame position**; clearing the frame takes $w_F+3$. On an effective addition
> that stray bit is harmless — it lands below the round bit and the injected $1$
> ignores it. On an effective subtraction it is subtracted, together with the
> sticky borrow it induces, and that is $-2$ at the frame LSB, which does reach
> the round bit. Saturating at $w_F+2$ instead of $w_F+3$ in the RTL below gives
> **1008 wrong results out of the same 49169**. Saturate at $w_F+3$; the extra
> code point is free, since the comparator already exists.

$$\boxed{\ X+Y=2^{E_X-E_0}\big(M_X\pm M_Y2^{-d}\big),\qquad d=\min(E_X-E_Y,\;w_F+3)\ }$$

$$\boxed{\ R=\Big\lfloor\big(\underbrace{E_X+1-\lambda}_{w_E+2}\ :\ \underbrace{F_N}_{w_F+1}\big)+1\Big\rfloor_{\text{drop LSB}}\ }$$

**When it breaks.**

- **Total cancellation.** $\lambda=w_F+4$ means $M_S=0$; the exponent update
  produces a meaningless (possibly negative) number and the $R=0$ flag has to
  reach the pack block instead ([[Floating-Point Exception Handling]]).
- **Exponent overflow and underflow** are *not* handled in the significand
  datapath at all — they are read off the two extra bits of the $(w_E{+}2)$-bit
  exponent, which is the only reason those two bits exist.
- **Ties to even** needs a real sticky over the full shifted-out tail, plus an
  update of that sticky after the normalization shift, plus a handful of gates
  in the rounding adder. The gate count is trivial; the sticky is the whole cost
  (p. 339).
- **Subnormals** are almost free in unpack — feed the "is normal" bits $n_X,n_Y$
  in as the leading significand bits and use $E_X-n_X-(E_Y-n_Y)$ as the
  difference — but they force the LZC to be saturated so $E_X-\lambda$ never
  goes negative, and that comparison-and-multiplexer **forbids the fused
  LZC+shifter** the baseline relies on ([[Subnormal Normalization Unit]], p. 340).
- **The five-block chain is the real limit.** Once single-cycle latency is the
  requirement rather than throughput, the baseline loses to the
  [[Dual-Path Floating-Point Adder]], which exploits the fact that a large
  alignment shift and a large normalization shift are mutually exclusive. Add
  subnormals on top and the near path needs a [[Leading Zero Anticipator]]; push
  further and you arrive at the [[Speculative Floating-Point Adder]].
- **Faithful accuracy buys nothing here.** Unlike the multiplier or the divider,
  degrading a floating-point adder from round-to-nearest to faithful "would
  bring little benefit" (p. 339) — the adder is already narrow, and there is no
  quadratic block to shrink ([[Choosing a Floating-Point Operator]]).

**RTL.**

```spade
// Baseline floating-point adder, toy format wE = 4, wF = 3, bias 7,
// round to nearest ties away, normals only, no subnormals, no exceptions.
// Packing: bit 7 = sign, bits 6..3 = biased exponent E, bits 2..0 = fraction F.
fn fp_add8(x: uint<8>, y: uint<8>) -> uint<8> {
    let xb = x.as_bits();
    let yb = y.as_bits();

    // --- unpack, and swap on the whole magnitude field (exponent : fraction) ---
    let ix: uint<7> = xb[0..7].as_uint();      // E_X : F_X, ordered as an integer
    let iy: uint<7> = yb[0..7].as_uint();
    let swap = iy > ix;
    let hi = if swap { iy } else { ix };       // the larger magnitude
    let lo = if swap { ix } else { iy };
    let sr = if swap { yb[7] } else { xb[7] }; // result sign = sign of the larger
    let sub = xb[7] != yb[7];                  // effective subtraction

    let hb = hi.as_bits();
    let lb = lo.as_bits();
    let e_hi: uint<4> = hb[3..7].as_uint();
    let e_lo: uint<4> = lb[3..7].as_uint();
    let one: uint<1> = 1;
    let m_hi: uint<4> = one.concat(hb[0..3].as_uint());  // 1.F_X, w_F+1 = 4 bits
    let m_lo: uint<4> = one.concat(lb[0..3].as_uint());

    // --- exponent difference, saturated at w_F+3 = 6 (Y then shifts out entirely) ---
    let d5 = e_hi - e_lo;                                // uint<5>, always >= 0
    let d: uint<3> = if d5 > 6 { 6 } else { trunc(d5) };

    // --- alignment shift into the w_F+3 = 6-bit frame, positions 0 .. -5 ---
    let m_hi6: uint<6> = zext::<4, 6>(m_hi) << 2;
    let m_lo6: uint<6> = zext::<4, 6>(m_lo) << 2;
    let m_loa: uint<6> = m_lo6 >> zext::<3, 6>(d);       // M_Ya
    let sticky = (m_loa << zext::<3, 6>(d)) != m_lo6;    // OR of everything shifted out

    // --- exact addition, w_F+4 = 7 bits, positions +1 .. -5 ---
    // the sticky is the borrow out of the discarded tail; it only exists on a subtraction
    let s: uint<7> = if sub { (m_hi6 - m_loa) -. zext::<1, 7>(sticky.as_uint()) }
                     else   { m_hi6 + m_loa };

    // --- leading zero count over the 7-bit sum, saturated at 7 (total cancellation) ---
    let sb = s.as_bits();
    let lam: uint<3> =
        if sb[6] { 0 } else if sb[5] { 1 } else if sb[4] { 2 } else if sb[3] { 3 }
        else if sb[2] { 4 } else if sb[1] { 5 } else if sb[0] { 6 } else { 7 };

    // --- normalization: put the leading one at position 0 (bit 5) ---
    let n: uint<7> = if lam == 0 { s >> 1 } else { s << zext::<3, 7>(lam -. 1) };

    // --- exponent update: E_X incremented first, then lambda subtracted; w_E+2 bits ---
    let e_r: int<6> = sext(e_hi.to_int()) +. 1 -. sext(lam.to_int());

    // --- rounding adder: +1 at the LSB of (exponent : F_N), then drop that LSB ---
    let f_n: uint<4> = n.as_bits()[1..5].as_uint();      // positions -1 .. -4, LSB = round bit
    let rnd: uint<10> = e_r.as_uint().concat(f_n) +. 1;
    let rb = rnd.as_bits();
    sr.as_uint().concat(rb[4..8].as_uint()).concat(rb[1..4].as_uint())
}
```

`m_lo6 >> d` is the $\gg$ box; `m_hi6 ± m_loa` is $|M_X\pm M_{Y_\mathrm{a}}|$,
with the swap making the absolute value unnecessary; `lam` and `n` are the fused
LZC+shifter; `e_r` is the $+1$ and $-$ pair on the exponent path; and
`e_r.concat(f_n) +. 1` is the rounding adder, one $10$-bit increment carrying
across the field boundary. Widths follow the figure with $w_F=3$: $M_X,M_Y$ on
$4$ bits, $M_{Y_\mathrm{a}}$ on $6$, $M_S$ on $7$, $F_N$ on $4$, exponent on $6$.
Everything is a `fn` — purely combinational, no state; a pipelined version cuts
after the alignment shifter and again after the LZC. Synthesis will not build
what is written: the two shifters spelled out for `sticky` become **one** barrel
shifter with an OR tree hanging off each stage ([[Sticky Bit Generator]]), and
the `if lam == 0` right shift folds into the normalization shifter as a biased
shift amount rather than a separate mux.

Simulated in Icarus against an exact integer reference model with round-to-
nearest-ties-away: 10 named vectors (including $1+8$ and $8+1$, the near-case
sign change $1-1.125$, and the worked example $1.101\times2^{3}+1.011\times2^{-1}$
in both operand orders, which a bit-reversed datapath fails) followed by an
**exhaustive** sweep of all $256\times256$ input pairs. 49169 of them produce an
in-range normal result and are checked; 49169 pass, 0 fail. The remaining pairs
land on zero, overflow or underflow and belong to
[[Floating-Point Exception Handling]].

**Related notes.**

- [[Barrel Shifters]] – depends-on: the alignment shifter, sized
  $\lceil\log_2(w_F{+}2)\rceil$ stages by the saturation bound derived above.
- [[Leading Zero Counters]] – depends-on: measures $\lambda$ on $M_S$; saturating
  it at $w_F+4$ is what lets the pack block detect total cancellation.
- [[Normalizers]] – depends-on: the second variable shifter, fused with the LZC
  in the baseline and unfusable the moment subnormals arrive.
- [[RCA, Ripple-Carry Adder]] – depends-on: the $(w_F{+}3)$-bit significand
  addition and the $(w_E{+}2{+}w_F)$-bit rounding addition are both plain integer
  adds; only their widths are unusual.
- [[Floating-Point Formats]] – depends-on: supplies the $(w_E,w_F)$ split, the
  implicit leading bit and the encoding that makes the rounding-adder carry
  land in the right field.
- [[Exponent Difference and Swap Unit]] – supports: computes $d$ and orders the
  operands, and is where the FPGA whole-number comparison lives.
- [[Floating-Point Rounding Adder]] – supports: the final block, in isolation.
- [[Sticky Bit Generator]] – supports: needed for the alignment borrow here and
  for ties-to-even everywhere.
- [[Dual-Path Floating-Point Adder]] – extends: splits the mutually exclusive
  shift-heavy blocks into parallel paths, five slow blocks becoming two.
- [[Floating-Point Multiplier]] – counter-example: costlier in area, structurally
  trivial — one exponent adder, one significand multiplier, and a normalization
  that is a multiplexer because $M_XM_Y\in[1,4)$ statically.
- [[Choosing a Floating-Point Operator]] – compares: where the baseline is the
  right answer and where latency forces a dual path.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024,
  Ch. 11 "Basic Floating-Point Operators".
  - §11.1.1 "General Considerations and Terminology", pp. 331-336 — subtraction
    as an XOR, the four steps, Fig. 11.1 (far cases) and Fig. 11.3 (near cases),
    Fig. 11.2 (the $d>w_F+1$ bound), Fig. 11.4 (exponent difference and swap),
    the $(w_F{+}3)$-in / $(w_F{+}4)$-out adder sizing on p. 335, and the
    ties-away statement contested in the warning above (p. 336).
  - §11.1.2 "Baseline Addition Architecture", Fig. 11.5, pp. 336-339 — the
    figure redrawn here, the saturated exponent difference and LZC, the
    $\lambda-1$ exponent update with $E_X$ incremented first, the $(w_E{+}2)$-bit
    exponent, the rounding adder's free carry into the exponent, and the FloPoCo
    whole-number swap.
  - §11.1.3, pp. 339-340 — ties-to-even and subnormal support, and why subnormals
    unfuse the LZC and shifter.
  - §11.1.4, pp. 340-342 — the dual-path observation that bounds this note from
    above.
- Muller et al., *Handbook of Floating-Point Arithmetic*, 2nd ed., Birkhäuser
  2018 — Sterbenz's lemma for the exactness of near-case cancellation; cited
  p. 336.
