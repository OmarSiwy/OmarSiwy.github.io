---
title: Exponent Difference and Swap Unit
description: "Produces |Ex-Ey| and orders the operands so Ex>=Ey, in two subtractors and a mux layer instead of a subtract-compare-subtract chain; on FPGAs the comparison is done on the whole exponent-fraction concatenation so the significand block never needs an absolute value."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-operators]
aliases:
  - Exponent Difference
  - Exponent Difference and Swap
  - Swap Unit
  - Exponent Difference Unit
---

# Exponent Difference and Swap Unit

The front block of every floating-point adder: it emits the alignment distance $d=|E_X-E_Y|$ and reorders the two operands so the one with the larger exponent leaves on the $X$ port — and it gets the ordering decision for free, as the sign bit of a subtraction it was performing anyway, rather than from a comparator in series.

```tikz title="Exponent difference and swap: two parallel subtractors, the sign bit of one of them as the comparison, and a mux layer that reorders the operands"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- swap multiplexers ----------
\draw (-7.0,0.55) -- (-5.0,0.55) -- (-5.4,-0.05) -- (-6.6,-0.05) -- cycle;
\node[font=\tiny] at (-6.6,0.35) {1}; \node[font=\tiny] at (-5.4,0.35) {0};
\draw (-4.4,0.55) -- (-2.4,0.55) -- (-2.8,-0.05) -- (-4.0,-0.05) -- cycle;
\node[font=\tiny] at (-4.0,0.35) {0}; \node[font=\tiny] at (-2.8,0.35) {1};
% ---------- operand trunks ----------
\draw[->,thick] (-6.6,3.6) node[above,font=\small]{$X_\mathrm{in}$} -- (-6.6,0.5);
\draw[thick] (-4.6,3.6) node[above,font=\small]{$Y_\mathrm{in}$} -- (-4.6,1.65);
\fill (-6.6,2.0) circle (1.6pt); \fill (-6.6,3.1) circle (1.6pt);
\draw[->,thick] (-6.6,2.0) -- (-4.0,2.0) -- (-4.0,0.5);
\draw[->,thick] (-4.6,1.65) -- (-5.4,1.65) -- (-5.4,0.5);
\draw[->,thick] (-4.6,1.65) -- (-2.8,1.65) -- (-2.8,0.5);
\fill (-4.6,1.65) circle (1.6pt); \fill (-4.6,2.8) circle (1.6pt);
\node[font=\tiny,anchor=west] at (-6.5,2.6) {$1{+}w_E{+}w_F$};
% ---------- exponent buses ----------
\draw[->] (-6.6,3.1) -- (5.0,3.1); \node[font=\tiny,anchor=south] at (4.4,3.12) {$E_X$\;:\;$w_E$};
\draw[->] (-4.6,2.8) -- (4.2,2.8);  \node[font=\tiny,anchor=south] at (3.6,2.82) {$E_Y$\;:\;$w_E$};
% ---------- the two subtractors ----------
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (s1) at (1.6,2.0) {$E_X-E_Y$};
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (s2) at (4.6,2.0) {$E_Y-E_X$};
\draw[->] (1.2,3.1) -- (1.2,2.35);   \fill (1.2,3.1) circle (1.2pt);
\draw[->] (2.0,2.8) -- (2.0,2.35);   \fill (2.0,2.8) circle (1.2pt);
\draw[->] (4.2,2.8) -- (4.2,2.35);
\draw[->] (5.0,3.1) -- (5.0,2.35);
% ---------- sign bit ----------
\node[draw,minimum width=1.3cm,minimum height=0.6cm] (sg) at (0.0,0.85) {sign bit};
\draw (1.6,1.65) -- (1.6,1.5) -- (0.0,1.5) -- (0.0,1.15);
\fill (1.6,1.5) circle (1.2pt);
% ---------- magnitude mux ----------
\draw (2.1,1.15) -- (4.1,1.15) -- (3.7,0.55) -- (2.5,0.55) -- cycle;
\node[font=\tiny] at (2.5,0.95) {0}; \node[font=\tiny] at (3.7,0.95) {1};
\draw[->] (1.6,1.5) -- (2.5,1.5) -- (2.5,1.2);
\draw[->] (4.6,1.65) -- (4.6,1.5) -- (3.7,1.5) -- (3.7,1.2);
\node[font=\tiny,anchor=east] at (1.52,1.42) {$w_E{+}1$};
\node[font=\tiny,anchor=west] at (4.70,1.42) {$w_E{+}1$};
% ---------- saturation ----------
\node[draw,minimum width=2.8cm,minimum height=0.7cm] (sat) at (3.1,-0.5) {$\min(\,\cdot\,,\;w_F{+}2)$};
\draw[->] (3.1,0.55) -- node[right,font=\tiny]{$|E_X{-}E_Y|$\;:\;$w_E$} (3.1,-0.15);
\draw[->] (3.1,-0.85) -- (3.1,-1.5) node[below,font=\small]{$d$};
\node[font=\tiny,anchor=west] at (3.2,-1.15) {$\lceil\log_2(w_F{+}2)\rceil$};
% ---------- swap signal routing ----------
\draw[->] (0.0,0.55) -- (0.0,0.25) -- (-2.6,0.25);
\fill (-2.0,0.25) circle (1.2pt);
\draw[->] (-2.0,0.25) -- (-2.0,-1.75) -- (-5.23,-1.75) -- (-5.23,0.2);
\node[font=\tiny,anchor=south east] at (-0.1,0.28) {swap};
% ---------- outputs ----------
\draw[->,thick] (-6.0,-0.05) -- (-6.0,-1.15) node[below,font=\small]{$X$};
\draw[->,thick] (-3.4,-0.05) -- (-3.4,-1.15) node[below,font=\small]{$Y$};
\node[font=\tiny,align=center] at (-3.6,-2.5) {after the swap $E_X\ge E_Y$, so $d$ is the alignment\\shift distance and the result sign is $s_X$};
\end{circuitikz}
\end{document}
```

*after Fig. 11.4, p. 336*

**Fix what the block owes its consumers.** Two unpacked operands arrive, each $1+w_E+w_F$ bits — sign, biased exponent field $E\in[0,2^{w_E})$, fraction $F$ — in the encoding of [[Number Formats]]. Downstream, the [[Floating-Point Adder]] wants to evaluate

$$X+Y \;=\; 2^{E_X-E_0}\Big(M_X \pm M_Y\,2^{-d}\Big),\qquad d=E_X-E_Y$$

which is the factorisation of the larger scale out of the sum, by distributivity. That rewriting is only legal — and $2^{-d}$ is only a *right* shift, the only direction a [[Shifters|barrel shifter]] in an alignment path is built for — when $d\ge0$. So the block owes exactly two things: a non-negative $d$ on $\lceil\log_2(w_F+2)\rceil$ bits, and a reordered $(X,Y)$ pair guaranteeing $E_X\ge E_Y$. Everything else in the adder assumes both.

**The naive schedule puts two carry propagations in series.** Compare $E_X$ against $E_Y$ with a [[Magnitude Comparator]], use the verdict to steer the operands through the swap muxes, then subtract the now-smaller exponent from the now-larger one. Both the comparison and the subtraction are $\log_2 w_E$-depth carry propagations, and the mux layer sits between them, so this is *subtract-compare-subtract* in the worst reading and comparator-then-subtractor in the best. On a block that sits at the very top of the adder's critical path — nothing can be hoisted above it and nothing can hide behind it — that ordering is the whole cost.

**The comparison is already inside the subtraction.** Compute $E_X-E_Y$ on $w_E+1$ bits of two's complement (one bit of headroom, because $E_X-E_Y\in(-2^{w_E},2^{w_E})$ and $w_E$ bits cannot hold the sign). Its most significant bit *is* the predicate $E_X<E_Y$, by the definition of the two's-complement sign. So the comparator disappears entirely: subtract first, read the sign, and use it both to steer the swap muxes and to select which of the two differences is the magnitude. Getting the magnitude then needs the other difference, $E_Y-E_X$, and computing it *from* $E_X-E_Y$ by the identity $-x=\bar{x}+1$ costs another carry propagation — the increment. So Fig. 11.4 simply builds both subtractors and runs them in parallel: area for depth.

**One compound adder does the work of both subtractors.** The two are not independent, and the redundancy is visible once the subtraction is written additively. Zero-extend both fields to $n=w_E+1$ bits and set

$$T \;=\; E_X + \overline{E_Y} \pmod{2^n}$$

Since $\overline{E_Y}=2^n-1-E_Y$ by the definition of bitwise complement on $n$ bits, $T\equiv E_X-E_Y-1$. Hence $T+1\equiv E_X-E_Y$, and

$$\overline{T} \;=\; 2^n-1-T \;\equiv\; 2^n-1-(E_X-E_Y-1) \;=\; 2^n-(E_X-E_Y) \;\equiv\; E_Y-E_X$$

Both differences fall out of the *same* sum, one as $T+1$ and the other as one inverter level on $T$. A [[Carry-Select Adder|compound adder]] — the structure that emits $a+b$ and $a+b+1$ from a single prefix network, at the cost of one extra mux level rather than a second tree — therefore supplies the whole exponent path: one carry propagation, one row of NOT gates, one mux. The second subtractor of Fig. 11.4 is an implementation choice, not a requirement.

**Saturate before leaving the block, not after.** If $d>w_F+1$ then $|Y|<2^{E_Y-E_0+1}\le\frac12\,\mathrm{ulp}(X)$ and $M_Y$ shifts entirely off the bottom of the datapath, so the alignment shifter and the significand adder cannot tell $d=w_F+2$ from $d=2^{w_E}-1$ (see [[Error Accuracy]] for why half an ulp is the threshold). Clamping the $w_E$-bit magnitude to $w_F+2$ here narrows the wire to $\lceil\log_2(w_F+2)\rceil$ bits, which is what sizes the barrel shifter's stage count — for binary32, $5$ stages rather than $8$ — and it lets $|M_X\pm M_{Y_\mathrm{a}}|$ simply add zero in the out-of-range cases (p. 337). The clamp itself is an OR tree over the bits above the output width plus a magnitude comparison on the rest, both off the carry chain.

**The swap layer is wide but one gate deep.** Two 2:1 multiplexers per bit — $2(1+w_E+w_F)$ of them, $2\times32=64$ for binary32 — all sharing the single `swap` select. Every one is a two-input select that maps into a single fracturable LUT, so the layer is one logic level regardless of format width, and its cost is area, not delay. That asymmetry is the reason the block is drawn as *compute the narrow thing deeply, steer the wide thing shallowly*: the $w_E$-bit exponent path is the only place a carry propagates.

> [!note] On FPGAs, take the swap decision on the whole number
> FloPoCo compares the *concatenation* $I_X=E_X\Vert F_X$ against $I_Y=E_Y\Vert F_Y$ — $w_E+w_F$ bits — rather than the exponents alone. The biased encoding was chosen precisely so that this integer order is the numeric order of positive floats ([[Floating-Point Comparator]], Table 2.1, p. 51), so the wider comparison decides ties: it guarantees $M_X>M_Y$ **even in the near cases** where $E_X=E_Y$. Two consequences follow immediately. The result sign is unconditionally $s_X$, and the significand block collapses from $|M_X\pm M_{Y_\mathrm{a}}|$ to a plain $M_X\pm M_{Y_\mathrm{a}}$ — no absolute value, no sign-change flag, no compound adder in the significand path. This is a good trade *specifically on FPGAs*, where a wide comparison is a single pass down the fast carry logic (Sect. 6.3, p. 148) and is therefore nearly free; on ASIC the $\log_2(w_E+w_F)$-depth prefix comparator is not free, and the book is explicit that the best $|M_X\pm M_{Y_\mathrm{a}}|$ is technology-dependent (p. 338).

**Subnormals shift the difference by at most one in each direction.** The exponent *field* of a subnormal lies: it reads $0$ while the value's true exponent is that of the smallest normal. Extract the "is normal" bits $n_X=(E_X\ne0)$, $n_Y=(E_Y\ne0)$ in the unpack block and use them twice — as the leading significand bit, $M_X=n_X.F_X$ instead of a hardwired $1$, and in the difference, which becomes $(E_X-n_X)-(E_Y-n_Y)$ (Sect. 2.5.1, p. 48; p. 340). Written against the compound adder that is $T+1-n_X+n_Y$, and since $n_X,n_Y\in\{0,1\}$ that is one of $T$, $T+1$, $T+2$ — three consecutive sums off one prefix network and a 3:1 mux on $(n_X,n_Y)$, still a single carry propagation. No decrementers, no extra depth; the overhead is a wider select layer.

$$\boxed{\;T=E_X+\overline{E_Y}\ \ \Longrightarrow\ \ E_X-E_Y=T+1,\quad E_Y-E_X=\overline{T},\quad \mathrm{swap}=\mathrm{MSB}(T+1)\;}$$

**When it breaks.**

- **The output is not $|E_X-E_Y|$.** It is $\min(|E_X-E_Y|,\,w_F+2)$. Any consumer that needs the true difference — tiny-result prediction, an exception path, a debug port — must tap the $w_E$-bit magnitude *before* the clamp.
- **The width label $\lceil\log_2(w_F+2)\rceil$ is one bit short when $w_F+2$ is a power of two.** The saturated value $w_F+2$ must itself be encodable, so the honest width is $\lfloor\log_2(w_F+2)\rfloor+1$. The two agree for every $w_F$ where $w_F+2$ is not a power of two — including $w_F=23$ and $w_F=52$, which is why the discrepancy never shows up in the standard formats — and differ by one at $w_F=6,14,30,\dots$ The RTL below uses `bits_for`, which is the correct form.
- **An exponent-only swap does not order the significands.** When $E_X=E_Y$ the swap is a coin flip, so $M_X-M_{Y_\mathrm{a}}$ can go negative and the significand block still needs a compound adder returning $|M_X-M_{Y_\mathrm{a}}|$ plus a sign-change bit. Only the whole-number comparison removes that.
- **Raw exponent fields are wrong for subnormals** by exactly one, in whichever operand is subnormal. Without $n_X,n_Y$ the alignment is off by one binade and the result is silently wrong for the whole subnormal range.
- **The saturation logic is dead when $2^{w_E}-1\le w_F+1$.** In a narrow-exponent application format the difference can never exceed the shifter's reach, and the clamp should be optimised away rather than synthesised.
- **Nothing hides this block.** It is purely combinational and strictly first; every latency trick downstream — dual paths, leading-zero anticipation, speculation — starts *after* it, which is why the compound-adder form is worth the mux level it costs.

**RTL (Spade).**

```spade
/// Exponent difference and swap decision.
/// One compound add on wE+1 bits yields both differences:
/// T+1 = Ex-Ey, ~T = Ey-Ex, and the MSB of T+1 is the comparison.
fn exp_diff<#uint WE, #uint WF>(ex: uint<WE>, ey: uint<WE>)
    -> (bool, uint<{uint::bits_for(WF + 2)}>)
{
    let xw: uint<{WE + 1}> = zext(ex);
    let yw: uint<{WE + 1}> = zext(ey);
    let t:   uint<{WE + 1}> = xw +. (~yw);   // Ex - Ey - 1  (mod 2^(WE+1))
    let tp1: uint<{WE + 1}> = t +. 1;        // Ex - Ey, two's complement
    let swap: bool = tp1.msb();              // set iff Ex < Ey
    let mag: uint<{WE + 1}> = if swap { ~t } else { tp1 };
    let lim: uint<{WE + 1}> = WF + 2;
    (swap, trunc(if mag > lim { lim } else { mag }))
}
```

`t` is the single carry propagation — the compound adder's $T$ — and `tp1`, `~t` are its two outputs in the drawing's two subtractor boxes; `swap` is the wire leaving the *sign bit* box, and the `if swap` is the magnitude mux. Everything is combinational: the whole block is one carry chain of $w_E+1$ bits plus two mux levels, and the $1+w_E+w_F$-bit operand swap that the diagram shows on the left is deliberately *not* in the entity, because it is a pure select layer with no arithmetic content. What synthesis does differently from the drawing: `+. 1` and the `if` are not two separate carry propagations after mapping — a compound adder emits $T$ and $T+1$ from one prefix network — but the source cannot express that sharing, so the structural claim rests on the identity above, not on the Spade.

Simulated against a behavioural reference (`swap = ex < ey`, `d = min(|ex-ey|, 25)`) at $w_E=8$, $w_F=23$: 10 named vectors including the asymmetric $1$ vs $128$ and $128$ vs $1$, the exact clamp boundary $0$ vs $25$ and $0$ vs $26$, and the tie $200$ vs $200$, plus a 4000-vector random sweep — 4010 passed, none failed. The generic also monomorphises cleanly at $(w_E,w_F)=(4,3)$.

**Related Notes.**

- [[Floating-Point Adder]] – supports: this is the "unpack & exception handling, exponent difference & swap" box at the top of the baseline architecture, and it is what makes the rest of the datapath able to assume $d\ge0$.
- [[Magnitude Comparator]] – compares: the block this unit deliberately *does not* instantiate on the exponent path, because the subtraction's sign bit already carries the verdict.
- [[Comparators]] – depends-on: the FPGA variant does instantiate one, on the full $w_E{+}w_F$-bit concatenation rather than on the exponents.
- [[Carry-Select Adder]] – extends: the compound adder that emits $T$ and $T+1$ from one prefix network, collapsing Fig. 11.4's two subtractors into one.
- [[Floating-Point Comparator]] – supports: establishes why the exponent-fraction concatenation can be compared as a plain integer, which is what makes the FPGA whole-number swap legal.
- [[Dual-Path Floating-Point Adder]] – extends: reuses this block unchanged and adds a `near`/`far` output derived from the same $d$.
- [[Subnormal Normalization Unit]] – depends-on: consumes the "is normal" bits this block needs for the $(E_X-n_X)-(E_Y-n_Y)$ correction.
- [[Floating-Point Exception Handling]] – depends-on: shares the unpack stage, and wants the unsaturated difference rather than $d$.

> [!warning] No area or delay figures exist for this block
> Chapter 11 reports no synthesis results anywhere — no LUT counts, no slice counts, no ns delays for the exponent difference and swap unit or for any adder variant. The mux and bit-width counts above are structural and exact; the claim that the FPGA-wide comparison is "fast and cheap" is the book's qualitative judgement (p. 338), not a measurement. Comparing the exponent-only and whole-number swaps on a specific fabric needs your own synthesis run.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 11 "Basic Floating-Point Operators".
  - Sect. 11.1.1, general considerations and terminology — effective operation, the four steps, near/far cases, the compound adder returning $|X-Y_\mathrm{a}|$ with a sign-change bit, **Fig. 11.4 "Exponent difference and swap"**, pp. 333–336.
  - Sect. 11.1.2, baseline addition architecture — Fig. 11.5 and the bullet list: saturation of the exponent difference at $w_F+2$, the FloPoCo whole-number swap decision and its consequence for $|M_X\pm M_{Y_\mathrm{a}}|$, technology dependence of that block, pp. 336–338.
  - Sect. 11.1.3, IEEE 754 compliance — the "is normal" bits $n_X,n_Y$ and the $E_X-n_X-(E_Y-n_Y)$ exponent difference, p. 340.
  - Sect. 6.3, fast carry logic for wide comparisons on FPGAs, p. 148 (cited p. 338); Sect. 2.5.1 and Table 2.1, format encoding and the "is normal" bits, pp. 48, 51.
- Long-form source: [[2.7) Floating-Point Operators]], sections "Floating-point addition and subtraction / General considerations and terminology" and "On FPGAs".
