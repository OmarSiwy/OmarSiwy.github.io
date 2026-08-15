---
title: "Exact Sum-of-Products Operator"
description: "The whole composed datapath — exact multiplier, aligner, wide fixed-point accumulator, converter — accepting one (X,Y) pair per cycle with zero summation error."
kind: circuit
status: seed
spade: simulated
tags: [digital, exact-accumulators]
aliases:
  - Exact Sum-of-Product Operator
  - Exact Sum of Products
  - Exact Dot Product Operator
---

# Exact Sum-of-Products Operator

A four-block composition — exact multiplier, aligner, wide fixed-point accumulator, converter — that consumes one floating-point pair $(X_i,Y_i)$ per cycle and commits **exactly one rounding in the entire operator**, at the final conversion.

```tikz title="Exact sum-of-products operator: exact multiplier, aligning shifter, wide two's-complement accumulator, converter — with the bit budget that fixes the register width"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= main datapath (after Fig. 21.6) =================
  \draw[->] (2.0,9.6) -- (2.0,8.9);
  \draw[->] (4.0,9.6) -- (4.0,8.9);
  \node[anchor=south] at (2.0,9.62) {$X_i$};
  \node[anchor=south] at (4.0,9.62) {$Y_i$};
  \node[anchor=east,scale=0.75] at (1.95,9.25) {$\text{float}(w_E,w_F)$};
  \node[anchor=west,scale=0.75] at (4.05,9.25) {$\text{float}(w_E,w_F)$};

  \draw (0.6,8.1) rectangle (5.4,8.9);
  \node at (3.0,8.5) {exact multiplier (unnormalised)};

  \draw[->] (1.2,8.1) -- (1.2,7.1);
  \draw[->] (3.0,8.1) -- (3.0,7.1);
  \draw[->] (4.8,8.1) -- (4.8,7.1);
  \node[anchor=east,scale=0.75] at (1.15,7.7) {$s$: $1$};
  \node[anchor=west,scale=0.75] at (3.05,7.7) {$E$: $w_E{+}1$};
  \node[anchor=east,scale=0.75] at (4.75,7.25) {$M$: $2w_F{+}2$};

  \draw (0.6,6.3) rectangle (5.4,7.1);
  \node at (3.0,6.7) {xor $+$ sign-padding shifter};

  \draw[->] (3.0,6.3) -- (3.0,5.6);
  \node[anchor=west,scale=0.75] at (3.05,5.95) {$X_{\text{fix}}$: $w_A$};

  \draw (0.6,4.8) rectangle (5.4,5.6);
  \node at (3.0,5.2) {$w_A$-bit adder, $c_{\text{in}}=s$};

  \draw[->] (3.0,4.8) -- (3.0,4.1);
  \node[anchor=west,scale=0.75] at (3.05,4.45) {$w_A$};

  \draw (0.6,3.3) rectangle (5.4,4.1);
  \node at (3.0,3.7) {accumulator register};

  % feedback: the only loop-carried dependency
  \draw[->] (0.6,3.7) -- (-0.3,3.7) -- (-0.3,5.2) -- (0.6,5.2);
  \node[rotate=90,anchor=south,scale=0.72] at (-0.4,4.45)
    {loop-carried: one $w_A$-bit add};

  \draw[->] (3.0,3.3) -- (3.0,2.5);
  \node[anchor=west,scale=0.75] at (3.05,2.85) {$A$: $w_A$ (2's compl.)};

  \draw (1.0,1.7) rectangle (5.0,2.5);
  \node at (3.0,2.1) {normalise, round \& pack};

  \draw[->] (3.0,1.7) -- (3.0,1.0);
  \node[anchor=west,scale=0.75] at (3.05,1.35) {$R$: $\text{float}(w'_E,w'_F)$};

  % ================= width inset (after Fig. 21.4) =================
  \draw[dashed,black!45] (6.3,2.6) rectangle (13.5,9.6);
  \node[anchor=north west,scale=0.85,font=\bfseries] at (6.45,9.5)
    {why one product needs $2w_F{+}2$ bits};

  \node[anchor=west,scale=0.8] at (6.5,8.8) {a significand $M_X$: $w_F{+}1$ bits};
  \foreach \i in {0,...,7}
    \draw[fill=black!8] ({6.6+\i*0.34},8.15) rectangle ({6.94+\i*0.34},8.55);

  \node[anchor=west,scale=0.8] at (6.5,7.75)
    {exact product $M_XM_Y$: $2w_F{+}2$ bits};
  \foreach \i in {0,...,15}
    \draw[fill=black!25] ({6.6+\i*0.34},7.0) rectangle ({6.94+\i*0.34},7.4);
  \draw[->] (7.6,6.5) -- (6.77,6.95);
  \node[anchor=west,scale=0.72,align=left] at (7.65,6.45)
    {$M_XM_Y\in[1,4)$: one bit above\\ the leading position, hence $2e_{max}{+}1$};

  \node[anchor=west,scale=0.8] at (6.5,5.75) {accumulator, $w_A$ bits:};
  \draw (6.6,4.6) rectangle (13.2,5.05);
  \draw[fill=black!25] (6.75,4.65) rectangle (7.9,5.0);
  \draw[fill=black!25] (12.7,4.65) rectangle (13.15,5.0);
  \node[anchor=south,scale=0.7] at (7.32,5.06) {largest product};
  \node[anchor=south,scale=0.7] at (12.9,5.06) {smallest};
  \draw (6.6,4.6) -- (6.6,4.25);
  \node[anchor=north west,scale=0.75] at (6.5,4.23) {$m_A=2e_{max}{+}1$};
  \draw (13.2,4.6) -- (13.2,4.25);
  \node[anchor=north east,scale=0.75] at (13.3,4.23) {$\ell_A=2e_{min}{-}2w_F$};

  \draw[|-|] (6.6,3.7) -- (13.2,3.7);
  \node[anchor=north,scale=0.8] at (9.9,3.66)
    {$w_A=2(e_{max}-e_{min})+2w_F+2$};
  \node[anchor=north,scale=0.75] at (9.9,3.15)
    {binary32: $255-(-298)+1=554$ bits};
\end{circuitikz}
\end{document}
```

*After Fig. 21.6, p. 631, with the significand widths of Fig. 21.4, p. 627.*

**Read the composition as a partition of the datapath into "in the loop" and "out of the loop".** Everything above the accumulator register — the significand multiplier, the exponent adder, the xor row, the barrel shifter — is purely combinational and can be cut into as many pipeline stages as the target frequency demands, because each $(X_i,Y_i)$ passes through it once and never comes back. Everything below it — leading-sign count, normalisation, rounding, packing — runs once per *result*, not once per *input*. What is left inside the feedback path is a single $w_A$-bit integer addition. That partition is the entire design: it is why the operator sustains one summand per cycle, and it is why the summation carries no error at all.

**Get the product into the accumulator's grid without normalising it.** For $X=2^{e_X}M_X$ and $Y=2^{e_Y}M_Y$ with $M_X,M_Y\in[0,2)$, the exponents add and the significands multiply,

$$XY \;=\; 2^{\,e_X+e_Y}\cdot M_XM_Y \tag{21.1}$$

so the exact product is available as a triple $(s,E,M)$ with $s=s_X\oplus s_Y$ on 1 bit, $M=M_XM_Y$ on $w''_F=2w_F+2$ bits, and a doubly-biased exponent $E=E_X+(1-n_x)+E_Y+(1-n_y)$ on $w''_E=w_E+1$ bits, where $n_x$ is the `isNormal` bit. The multiplier deliberately does **not** normalise: $2^{e_X+e_Y}$ is already the correct exponent for the *unnormalised* $M_XM_Y$, so $E$ can drive the alignment shifter directly, and the leading-zero count that a rounding multiplier would need disappears from the datapath. That is what [[Exact Unnormalized Multiplier]] buys — a multiplier that is cheaper than an IEEE one precisely because it does less.

**Size the register from the two extremes of the product, not from $N$.** Because $M_X,M_Y\in[1,2)$ for normal inputs, $M_XM_Y\in[1,4)$ — the product may carry one bit past the leading position, so the highest weight any single product can occupy is $2^{2e_{max}+1}$, one bit above the naive $2^{2e_{max}}$. Each significand has LSB $2^{-w_F}$ relative to its exponent, so the lowest weight is $2^{2e_{min}-2w_F}$, reached when two subnormal LSBs multiply. Every product therefore embeds into $\text{sfix}(2e_{max}+1,\,2e_{min}-2w_F)$ with no rounding whatsoever, and the register width follows by counting positions:

$$w_A \;=\; (2e_{max}+1)-(2e_{min}-2w_F)+1 \;=\; 2(e_{max}-e_{min})+2w_F+2$$

| Format | $(w_E,w_F)$ | $(2e_{max}+1,\;2e_{min}-2w_F)$ | min. $w_A$ |
| --- | --- | --- | --- |
| binary16 | $(5,10)$ | $(31,\,-48)$ | 80 |
| binary32 | $(8,23)$ | $(255,\,-298)$ | 554 |
| binary64 | $(11,52)$ | $(2047,\,-2148)$ | 4196 |

*Table 21.2, p. 627.* Exactly twice the plain-sum width of Table 21.1, and note the asymmetry: since $e_{max}-e_{min}\approx 2^{w_E}$, the register grows **exponentially in the exponent width and only linearly in the significand width**. Almost every one of those 554 bits pays for dynamic range, not precision — which is why [[Application-Specific Exact Accumulator]] is the version anyone actually builds, and [[Kulisch Accumulator]] the version you reach for only when the input range is genuinely unknown.

**Replace rounding with shifting, and subtraction with a carry-in.** Alignment is a left shift of $M$ by $\sigma$ positions, where $\sigma$ is $E$ minus a constant that depends only on where the accumulator's LSB sits:

$$\sigma \;=\; E - \bigl(\ell_A - (2e_{min}-2w_F)\bigr)$$

The constant is a parameter of the accumulator, not of the multiplier, and is computed in parallel with the product, so it costs nothing on the critical path. Negation uses the two's-complement identity $-x=\bar{x}+1$, split across two blocks: the $\bar{x}$ is a row of $w''_F$ xor gates placed *before* the shifter (Fig. 21.9), where it is $2w_F+2$ bits wide instead of $w_A$, and the $+1$ enters as the adder's carry-in $c_{\text{in}}=s$. Placing the xor row before the shifter requires a shifter that pads with the sign bit $s$ on both sides rather than with zeros — see [[Sign-Padding Alignment Shifter]] — which is free, since the fan-out on $s$ is about $w_A$ either way.

> [!warning] The book calls $E$ "exactly the shift distance"; with IEEE's $e_{min}=1-E_0$ it is off by a constant 2
> Writing $\hat E_X=E_X+(1-n_x)=e_X+E_0$, the doubly-biased exponent is $E=e_X+e_Y+2E_0$, while the shift that lands the integer $M$ on an accumulator with $\ell_A=2e_{min}-2w_F$ is $e_X+e_Y-2e_{min}=E-2$. The discrepancy is a compile-time constant and is absorbed by exactly the mechanism p. 632 describes for $\ell_A>2e_{min}-2w_F$, so nothing in the architecture changes — but do not wire $E$ straight into the shifter and expect it to be right.

**Accumulate in two's complement, in $\mathbb{Z}$, and let the sum wrap.** With $a_i=X_iY_i\cdot 2^{-\ell_A}\in\mathbb{Z}$, the register holds $\sum_i a_i$ computed in $\mathbb{Z}/2^{w_A}\mathbb{Z}$; reduction mod $2^{w_A}$ is a ring homomorphism, so as long as the true sum stays inside the representable interval the content equals the exact sum whatever the arrival order and whatever the intermediate values were. Intermediate overflow that later cancels is therefore harmless — the carry-out is simply discarded. [[Two's-Complement Exact Accumulator]] is preferred over [[Sign-Magnitude Accumulator]] for exactly this reason: sign-magnitude would need a second carry propagation inside the loop to re-negate on a zero crossing.

**Every signal, with its width.** $X_i,Y_i$: $w_E+w_F+1$ each. $s$: 1. $E$: $w_E+1$. $M$: $2w_F+2$. $X_{\text{fix}}$: $w_A$. $A$: $w_A$, two's complement. $F_s$: $w'_F+1$. $R$: $w'_E+w'_F+1$. Ground the format conventions in [[Number Formats]] and the single-rounding claim in [[Error Accuracy]]; nothing here re-derives ulp or subnormal encoding.

**Count the iterations and price the loop control.** For a dot product of length $N$ the operator runs $N$ iterations of the recurrence, one per cycle, with **no data-dependent control at all** — unlike a digit recurrence, every iteration is the same unconditional add, so the "loop control" is a $\lceil\log_2 N\rceil$-bit counter plus the synchronous reset of the $w_A$-bit register, both entirely outside the critical path. Two extras appear at the ends: if the loop uses [[High-Radix Carry-Save Accumulator]] with chunk size $\alpha$, the deferred carries must be flushed by feeding $X_{\text{fix}}=0$ for $k=\lceil w_A/\alpha\rceil$ further cycles; and the conversion of [[Accumulator-to-Float Converter]] adds its own pipeline latency once. Total $N+k+\text{latency}$ cycles for $N$ products, amortising to one per cycle for any realistic $N$.

**On FPGA the loop is nearly free, and the shifter is the bill.** Each logic cell carries a flip-flop directly behind the adder bit it computes, so the accumulator register costs no extra resources, the addition rides the dedicated carry chain, and the feedback stays inside one column of local routing; a 64-bit accumulator clocks above 200 MHz (p. 635). The chunked variant preserves that locality — $\alpha=32$ already reaches very high frequency, at a few percent overhead over the plain wide ripple-carry version (p. 636). The cost that actually hurts is the barrel shifter and the converter: the fixed-point adder and its registers are much smaller than either (p. 638). An application-tailored 64-bit accumulator for 32-bit data is comparable in area to a 64-bit floating-point adder while accepting an input every cycle; the *universal* binary32 version is about ten times a binary32 floating-point adder.

$$\boxed{\ A_k \;=\; A_{k-1} + (-1)^{s_k}\bigl(M_k\,2^{\sigma_k}\bigr) \bmod 2^{w_A},\qquad w_A = 2(e_{max}-e_{min})+2w_F+2\ }$$

## When it breaks

- **$w_A$ is exponential in $w_E$.** binary64 needs 4196 bits before any guard bits. At that point the universal operator is a research curiosity and only the application-specific parametrisation is buildable.
- **Exact summation is not application accuracy.** If some $X_iY_i$ was itself computed from rounded data, the exact sum holds no meaningful bits below that summand's own discarded LSB (fallacy box, p. 628). The operator guarantees that the *summation process* contributes nothing — one term of an error budget, not the budget.
- **Once $m_A$ is finite, overflow is real** and must be compared against and reported; once $\ell_A>2e_{min}-2w_F$, summands with bits below $\ell_A$ are truncated at $2^{\ell_A}$ each. Both cases are impossible by construction in the full-width operator and mandatory hardware in the tailored one.
- **Infinities and NaNs are not fixed-point numbers** and never enter the register; they are tracked beside it by [[Accumulator Exception FSM]].
- **The value is not readable for free.** In the carry-save variant the register holds a redundant radix-$2^\alpha$ representation; $k$ flush cycles or a separate propagating adder are needed to read it.
- **Small, constant $N$ takes it back.** For a handful of products a pipelined floating-point adder tree is smaller and its $\lceil\log_2 N\rceil$ roundings per path are tolerable — see [[Choosing an Accumulator]].

## RTL (Spade)

One iteration of the recurrence. The operator is this entity clocked $N$ times, never an unrolled chain.

```spade
/// One iteration of the exact sum-of-products recurrence.
/// A_k = A_{k-1} + (-1)^s * (M_k * 2^sh)   evaluated in Z on WA bits.
entity sop_iter<#uint WM, #uint WA, #uint WS>(
    clk: clock,
    rst: bool,
    s: bool,        // sign of the product, s_X xor s_Y
    m: uint<WM>,    // unnormalised significand product, WM = 2*wF+2 bits
    sh: uint<WS>,   // alignment distance, doubly-biased E minus a constant
) -> int<WA> {
    // -x = ~x + 1: the WM-bit xor row sits before the shifter (Fig. 21.9)
    let z: uint<WA> = zext(m);
    let padded: uint<WA> = if s { ~z } else { z };
    // sign-padding left shift: the vacated low bits take the pad bit s
    let shw: uint<WA> = zext(sh);
    let zero: uint<WA> = 0;
    let ones: uint<WA> = ~zero;
    let low: uint<WA> = ~(ones << shw);
    let xfix: uint<WA> = (padded << shw) | if s { low } else { 0 };
    // the +1 of the negation enters as the carry-in of the accumulator adder
    reg(clk) a: uint<WA> reset(rst: 0) = a +. xfix +. if s { 1 } else { 0 };
    a.as_int()
}
```

`padded`/`low`/`xfix` are the xor row and the sign-padding shifter fused into one expression — `~z` sign-extends the negated magnitude upwards, `low` supplies the ones that a *negated* value needs in the bits the left shift vacates, which is why the shifter must pad with $s$ rather than with zeros. `a +. xfix +. c` is the $w_A$-bit adder with $c_{\text{in}}=s$: `+.` is the wrapping add, and the wrap is not a bug but the two's-complement cancellation argument above. Only `a` is registered; everything else is the combinational cone that synthesis will pipeline and that the drawing shows as two separate boxes. Synthesis will also refuse to build the barrel shifter as a single stage at $w_A=554$ — a real instance splits it, off the loop.

Verified by monomorphising at $w_F=3$ ($w''_F=8$, $w_A=34$, $\sigma\le 26$) and simulating against a behavioural reference that shifts first and negates the whole 34-bit word afterwards — the opposite order to the hardware — over directed vectors including $1$ against $128$ at equal and at widely separated alignments, an exact cancellation at the top of the register, the same summands re-ordered, and 3000 random $(s,M,\sigma)$: 3014 vectors, no mismatch.

## Related Notes

- [[Exact Unnormalized Multiplier]] – depends-on: supplies the $(s,E,M)$ triple that the shifter aligns, and is cheaper than an IEEE multiplier because it skips exactly the steps this operator does not need.
- [[Sign-Padding Alignment Shifter]] – depends-on: turns $E$ into a position on the accumulator's bit ruler and carries the $\bar x$ half of the negation.
- [[Two's-Complement Exact Accumulator]] – depends-on: the register and adder in the loop, and the wrap-around argument that makes cancellation exact.
- [[Accumulator-to-Float Converter]] – depends-on: the one and only rounding in the operator, at $0.5$ ulp.
- [[High-Radix Carry-Save Accumulator]] – extends: breaks the $w_A$-bit carry propagation into $\alpha$-bit chunks so the frequency stops depending on $w_A$.
- [[Application-Specific Exact Accumulator]] – extends: replaces $(2e_{max}+1,\,2e_{min}-2w_F)$ by profiled $(m_A,\ell_A,m_X)$ and collapses 554 bits to tens.
- [[Kulisch Accumulator]] – compares: the same operator sized for every possible input instead of the expected ones, plus guard bits against spurious overflow.
- [[Floating-Point Accumulator Loop]] – counter-example: the obvious circuit this one replaces, whose error grows with $N$ and whose throughput is one summand every $l$ cycles.
- [[Choosing an Accumulator]] – compares: where this sits against the naive loop, the adder tree, and the tailored variants.
- [[Multipliers]] – supports: the significand multiplier at the head of the datapath.
- [[Floating-Point Operators]] – compares: the standard rounding adder and multiplier whose costs this operator is measured against.
- [[Squarers and Integer Powers]] – extends: setting $Y_i=X_i$ turns this into an exact sum-of-squares operator and lets the squarer optimisations apply.
- [[LTI Filters]] – supports: a filter's tap sum is a sum of products, and exactness here removes the order dependence from the reduction.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21, "Floating-Point Accumulation and Sum of Products".

- §21.1.2 Exact floating-point sum of products, eq. (21.1), Fig. 21.4, Table 21.2: pp. 626–627
- Fallacy box "Application-Level Accuracy Using Exact Accumulators": p. 628
- §21.2 Accumulator architectures, Fig. 21.6 (the composed operator): pp. 630–631
- §21.2.1 Exact floating-point multiplier, Fig. 21.7, the doubly-biased exponent and the $\ell_A$ constant: pp. 630–632
- §21.2.2 Two's-complement accumulator, Figs. 21.8–21.9, exceptions, application-specific variant: pp. 632–635
- §21.2.3 High-radix carry-save architecture, Fig. 21.10, FPGA frequencies: pp. 635–636
- §21.2.4 Conversion back to floating point: pp. 636–638
- §21.3 Cost, speed, and accuracy: pp. 638–639
