---
title: Horner Evaluation
description: "A chain of d truncated multiply-adds whose operands narrow by ~alpha bits per stage — minimal multiplier count and ~26% less multiplier area than uniform widths, at O(d) latency."
kind: circuit
source: "ASA §18.3.1, pp. 554-558"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, horner, multiply-add, truncation, fpga]
aliases:
  - Horner's Scheme
  - Horner Scheme
  - Horner's Rule
  - Horner Evaluator
  - FixHornerEvaluator
---

# Horner Evaluation

Horner evaluation factors a degree-$d$ polynomial into $d$ chained multiply-adds — the provably minimal multiplication count — and pays for it with a serial $\Theta(d)$ critical path that every parallel sibling trades away.

```tikz title="Degree-3 Horner evaluator: per-stage quantization to l^S and per-stage truncation of Y"
\usepackage{circuitikz}
\usetikzlibrary{shapes.geometric}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- stages: multiplier (trapezium) then quantizing adder ----
\node[draw,thick,trapezium,trapezium angle=68,minimum width=0.9cm] (m2) at (2.0,1.5) {$\times$};
\node[draw,thick,minimum width=0.9cm,minimum height=0.6cm] (a2) at (3.6,1.5) {$[+]_{\ell^S}$};
\node[draw,thick,trapezium,trapezium angle=68,minimum width=0.9cm] (m1) at (5.5,1.5) {$\times$};
\node[draw,thick,minimum width=0.9cm,minimum height=0.6cm] (a1) at (7.1,1.5) {$[+]_{\ell^S}$};
\node[draw,thick,trapezium,trapezium angle=68,minimum width=0.9cm] (m0) at (9.0,1.5) {$\times$};
\node[draw,thick,minimum width=0.9cm,minimum height=0.6cm] (a0) at (10.6,1.5) {$[+]_{\ell^S}$};
\node[draw,thick,minimum width=1.0cm,minimum height=0.7cm,align=center] (fr) at (13.3,1.5) {{\tiny final}\\[-3pt]{\tiny round}};
% ---- coefficients from the table, above ----
\draw[->] (1.1,2.95) -- (1.1,1.5) -- (m2.west);
\node[font=\tiny,anchor=south] at (1.1,3.02) {$C_3=\widetilde S_3$: $11$\,b};
\draw[->] (3.6,2.95) -- (a2.north);
\node[font=\tiny,anchor=south] at (3.6,3.02) {$C_2$: $17$\,b};
\draw[->] (7.1,2.95) -- (a1.north);
\node[font=\tiny,anchor=south] at (7.1,3.02) {$C_1$: $23$\,b};
\draw[->] (10.6,2.95) -- (a0.north);
\node[font=\tiny,anchor=south,align=center] at (10.6,3.02) {$C_0$: $27$\,b, $+\tfrac12$\,ulp};
\draw[dashed,gray] (0.6,2.75) -- (11.6,2.75);
\node[font=\tiny,gray,anchor=west] at (0.6,3.60) {coefficient table, all $C_i$ at $\ell_p=-27$, zero-padded to $\ell^S=-29$ on entry};
% ---- Y bus, below ----
\draw[thick] (0.9,-0.8) -- (9.0,-0.8);
\node[font=\tiny,anchor=east] at (0.85,-0.8) {$Y$: $19$\,b, $\ell_Y=-19$};
\draw[->] (2.0,-0.8) -- (2.0,1.2);
\node[font=\tiny,anchor=west] at (2.08,-0.15) {$\widetilde Y_2$: $12$\,b, $\ell^Y_2=-12$};
\draw[->] (5.5,-0.8) -- (5.5,1.2);
\node[font=\tiny,anchor=west] at (5.58,-0.15) {$\widetilde Y_1$: $18$\,b, $-18$};
\draw[->] (9.0,-0.8) -- (9.0,1.2);
\node[font=\tiny,anchor=west] at (9.08,-0.15) {$\widetilde Y_0=Y$: $19$\,b};
% ---- datapath ----
\draw[->] (m2.east) -- (a2.west);
\draw[->] (a2.east) -- node[above,font=\tiny]{$\widetilde S_2$: $19$} (m1.west);
\draw[->] (m1.east) -- (a1.west);
\draw[->] (a1.east) -- node[above,font=\tiny]{$\widetilde S_1$: $25$} (m0.west);
\draw[->] (m0.east) -- (a0.west);
\draw[->] (a0.east) -- node[above,font=\tiny]{$\widetilde S_0=R_{\text{ext}}$: $29$} (fr.west);
\draw[->] (fr.east) -- ++(1.0,0) node[right,font=\tiny]{$R$: $24$};
% ---- caption line ----
\node[font=\tiny,align=center] at (6.0,-1.7)
  {$f=\log_2(1+X)$, $w_X=w_R=24$, $\alpha=5$, $d=3$, $\ell^S=-29$: every $[+]_{\ell^S}$ truncates to LSB $-29$,\\[-1pt]
   and both multiplier operands grow by $\approx\alpha=5$ bits per stage from left to right};
\end{circuitikz}
\end{document}
```

*after Fig. 18.19, p. 555*

**Factor the developed form by running distributivity backwards.** Applying distributivity of $\times$ over $+$ in reverse — pulling the common factor $Y$ out of every term above the constant — collapses the developed polynomial into nested parentheses:

$$\begin{aligned}p(Y)&=C_0+C_1Y+C_2Y^2+\dots+C_dY^d\\ &=C_0+Y\left(C_1+C_2Y+\dots+C_dY^{d-1}\right)\\ &=C_0+Y\left(C_1+Y\left(C_2+\dots+Y\,C_d\right)\right).\end{aligned}\tag{18.19}$$

That is $d$ multiplications and $d$ additions, against $d(d+1)/2$ multiplications for the developed form, and it is provably minimal for a generic degree-$d$ polynomial. The price is structural: the factorisation is a **chain**, so stage $i$ cannot start before stage $i+1$ finishes and latency is $\Theta(d)$ multiply-add delays.

**Recast the chain as a recurrence, because the error analysis needs an induction variable.** Reading (18.19) from the innermost parenthesis outwards,

$$S_i=C_i+Y\,S_{i+1}\ \ (i<d),\qquad S_d=C_d,\qquad p(Y)=S_0.\tag{18.20}$$

Computing $S_i$ exactly needs a format that grows without bound as the products accumulate, which is exactly what computing just right forbids. Two per-stage parameters buy it back: $\ell_i^{S}$, the LSB to which the accumulator $\widetilde S_i$ is quantized, and $\ell_i^{Y}$, the LSB to which the multiplier's $Y$ input is truncated. Formats and the $[\,\cdot\,]_\ell$ notation are as in [[Number Formats]]:

$$\widetilde S_i=\left[\,C_i+\widetilde Y_i\times\widetilde S_{i+1}\,\right]_{\ell_i^{S}}.\tag{18.21}$$

**Decompose the cumulated error by inserting and cancelling intermediates.** The cumulated evaluation error is $\delta_{\text{eval},i}=\widetilde S_i-S_i$; inserting the two intermediate expressions $C_i+\widetilde Y_i\widetilde S_{i+1}$ and $C_i+Y\widetilde S_{i+1}$ and cancelling in pairs — the standard manoeuvre of [[Error Accuracy]] — splits it into one term per error source:

$$\delta_{\text{eval},i}=\underbrace{\left[C_i+\widetilde Y_i\widetilde S_{i+1}\right]_{\ell_i^{S}}-\left(C_i+\widetilde Y_i\widetilde S_{i+1}\right)}_{\delta_{\text{multadd},i}}\;+\;\underbrace{(\widetilde Y_i-Y)}_{\delta_{Y,i}}\times\widetilde S_{i+1}\;+\;Y\cdot\delta_{\text{eval},i+1}.\tag{18.24}$$

**The addition is free of error.** $C_i$ is already quantized to LSB $\ell_i\ge\ell_i^{S}$ — if it were not, the table would be storing bits the datapath discards, which is a sizing bug — so the sum $C_i+\widetilde Y_i\widetilde S_{i+1}$ is exactly representable at LSB $\ell_i^{S}$ and $\delta_{\text{multadd},i}$ is purely the multiplier's own rounding: $\bar\delta_{\text{multadd},i}=2^{\ell_i^{S}}$ for a truncated multiplier, $2^{\ell_i^{S}-1}$ for a rounded one (18.26). Every $[+]_{\ell^S}$ box in the drawing is therefore a plain adder with its low bits cut off, not a rounder — see [[Truncated Multipliers]] and [[Rounding]].

**The recurrence does not amplify, so the $2d$ error terms simply add.** Normalization puts $|Y|\le1$, so the third term of (18.24) is bounded by $\bar\delta_{\text{eval},i+1}$ with a gain of exactly one. Since $\widetilde S_d=C_d$ is exact, $\bar\delta_{\text{eval},d}=0$, and the triangle inequality unrolls the recurrence into a flat sum (18.28–18.29):

$$\bar\delta_{\text{eval}}=\sum_{i=0}^{d-1}\left(\bar\delta_{\text{multadd},i}+\bar S_{i+1}\,\bar\delta_{Y,i}\right).$$

That closed form is what makes Horner the evaluator whose sizing is a one-line search rather than an architecture-dependent argument.

**The $Y$ truncation is amplified by $\bar S_{i+1}$, not by $1$ — and that is the whole reason each stage gets its own widths.** $\bar S_{i+1}$ bounds the partial Horner sum, and since $|Y|\le1$ it obeys $\bar S_i\le|C_i|+\bar S_{i+1}$, i.e. it is dominated by $|C_i|$. After a range reduction of parameter $\alpha$ ([[Uniform Piecewise Segmentation]]), $C_i\approx\frac{f^{(i)}}{i!}2^{-i\alpha}$: **the coefficients decay by about $\alpha$ bits per degree.** Balancing the two terms of each summand, $\bar S_{i+1}\bar\delta_{Y,i}\approx\bar\delta_{\text{multadd},i}$, gives Algorithm 18.2's line

$$\ell_i^{Y}=\max\!\left(\ell^{S}-m_{\bar S_{i+1}},\ \ell_Y\right)\approx\ell^{S}+(i+1)\alpha,$$

clamped at $\ell_Y$, the LSB of $Y$ itself. So the deeper stages are fed *fewer bits of $Y$*, and their accumulators are narrower on the MSB side as well ($m_i\approx m_0-i\alpha$): **both multiplier operands shrink by roughly $\alpha$ bits per level.** Since $\alpha(d+1)\approx w_R$, the innermost stage handles operands of about $2\alpha$ bits while the last stage runs at full width, with $\widetilde Y_0=Y$ untruncated — anything else there means the operator is being fed input bits it never uses.

**The saving is in area, not in operation count.** For $f=\log_2(1+X)$ with $w_X=w_R=24$, $d=3$, $\alpha=5$ — the widths drawn above, with $Y$ of $w_Y=w_X-\alpha=19$ bits, coefficients at $\ell_p=-27$ and one shared $\ell^{S}=-29$:

| stage $i$ | 2 | 1 | 0 |
| --- | --- | --- | --- |
| $\widetilde S_i$ width | 19 | 25 | 29 |
| bits of $Y$ used | 12 | 18 | 19 (all) |
| $\approx$ multiplier area (bit²) | 228 | 450 | 551 |

$1229\ \text{bit}^2$ against $3\times551=1653$ for the same evaluator built from three uniform full-width multipliers — **26% of the multiplier area removed by truncation alone**, and the margin widens with $d$. This, not the multiplication count, is why Horner is cheap in hardware.

**Sizing is a one-parameter search.** Algorithm 18.2 (p. 558) fixes a single $\ell_S$ shared by all stages, starts it at $\ell_p$, evaluates the $2d$-term sum above, and decrements until $\bar\delta_{\text{eval}}<\bar\delta^{\text{target}}_{\text{eval}}$; the $\ell_i^{Y}$ fall out of the balance condition at each trial. The shared $\ell_S$ is a heuristic — usually one bit per stage is recoverable by letting the $\ell_i^{S}$ differ. For a piecewise approximation the whole loop runs once per subinterval and the wires take the worst case: max of the MSB positions, min of the LSB positions.

**On FPGAs the asymmetry is the point.** The $d$ multipliers have *decreasing* width, so the mapping is not uniform: the last, widest stage is the one worth a hard multiplier, while stages $2\dots d-1$ are narrow enough to be cheaper in LUT logic than in a [[DSP Blocks|DSP block]] whose fixed $18\times25$ shape they would leave half empty ([[Multipliers]]). Going the other way on ASIC, where every multiplier is synthesised to its exact rectangle, the per-stage narrowing shows up directly as gates. On both targets the $d$ additions, the coefficient-table decompression adder and the final rounding merge into a single compressor tree ([[Bit Heaps]]) rather than $d$ separate carry-propagate adders.

$$\boxed{\ \widetilde S_i=\left[\,C_i+\widetilde Y_i\widetilde S_{i+1}\,\right]_{\ell^S_i},\qquad \bar\delta_{\text{eval}}=\sum_{i=0}^{d-1}\left(\bar\delta_{\text{multadd},i}+\bar S_{i+1}\,\bar\delta_{Y,i}\right)\ }$$

**When it breaks.**

- **$|Y|>1$.** The whole analysis rests on the third term of (18.24) having gain $\le1$. A range reduction that leaves $|Y|>1$ turns the recurrence into a geometric amplifier and the flat $2d$-term sum is no longer valid.
- **No range reduction ($\alpha=0$).** Then the coefficients do not decay, $\bar S_{i+1}$ stays $O(1)$ at every level, every $\ell_i^{Y}$ clamps at $\ell_Y$, and the 26% saving evaporates — all $d$ multipliers are full width.
- **Latency, above $d\approx3$.** $\Theta(d)$ multiply-add delays is only tolerable because the memory/arithmetic trade-off already pins $d$ at 2 or 3 for single precision. Push $d$ higher and the [[Parallel Polynomial Evaluator]]'s $O(\log d)$ depth takes over.
- **Algorithm 18.2 is conservative by one stage.** It uses $\bar S_i$ where (18.29) has $\bar S_{i+1}$; the widths it returns are safe but a bit larger than the bound requires.
- **Truncating $Y$ at the last stage.** $\ell_0^{Y}>\ell_Y$ is never an optimization — it means the operator was handed input bits it discards, and the fix is a narrower $w_X$, not a narrower $\widetilde Y_0$.

> [!warning] The area figures above are computed, not synthesised
> Chapter 18 reports no LUT, DSP or delay numbers for any of its architectures. The $\text{bit}^2$ column and the 26% are products of operand widths derived from the book's own Algorithms 18.1 and 18.2 — a proxy for multiplier area, not a post-place-and-route measurement.

**RTL (Spade).** One stage, generic in its four format parameters, plus the concrete degree-3 chain that monomorphises it.

```spade
/// One Horner stage computing just right:
///   S~_i = [ C_i + Y~_i * S~_{i+1} ]_{l^S}
/// WY  = bits of Y kept at this stage (LSB l^Y_i)
/// WS  = width of S~_{i+1}
/// WO  = width of S~_i and of C_i, both at LSB l^S
/// YSH = -l^Y_i, the number of product LSBs discarded
/// WE  = YSH + WO (Spade cannot evaluate that sum inside a slice range)
fn horner_stage<#uint WY, #uint WS, #uint WO, #uint YSH, #uint WE>(
    y: uint<WY>,
    s: int<WS>,
    c: int<WO>,
) -> int<WO> {
    let ye: int<{WS + 1}> = zext::<WY, {WS + 1}>(y).as_int();
    let se: int<{WS + 1}> = sext(s);
    let p: int<{2 * (WS + 1) + WO}> = sext(ye * se);
    c +. p.as_bits()[YSH..WE].as_int()
}

entity horner3(y: uint<19>, c3: int<13>, c2: int<19>, c1: int<25>, c0: int<29>) -> int<29> {
    let s2 = horner_stage::<12, 13, 19, 12, 31>(y.as_bits()[7..19].as_uint(), c3, c2);
    let s1 = horner_stage::<18, 19, 25, 18, 43>(y.as_bits()[1..19].as_uint(), s2, c1);
    horner_stage::<19, 25, 29, 19, 48>(y, s1, c0)
}
```

`y` is the $\widetilde Y_i$ tap, `s` is $\widetilde S_{i+1}$, `c` is $C_i$ already zero-padded from $\ell_p=-27$ to $\ell^S=-29$, and the return value is $\widetilde S_i$; the two `as_bits()[a..b]` slices in `horner3` are the wire taps drawn under the $Y$ bus, and index 0 is the LSB, so `[7..19]` keeps the top 12 bits. The slice `p.as_bits()[YSH..WE]` **is** the drawing's $[\,\cdot\,]_{\ell^S}$ — truncation is pure wire selection, no shifter — and because $C_i$'s LSB is at $\ell^S$ the addition is exact, so quantizing the product before the add (as here) equals quantizing the sum after it, which is fact (i) above made structural. Spade's `*` demands equal-width operands, so both go through `int<WS+1>`; synthesis prunes the constant-zero partial products back to the rectangular $12\times13$, $18\times19$, $19\times25$ multipliers of the drawing, and `+.` wraps rather than widening because the formats are sized so that no stage overflows. The block is entirely combinational: three multipliers in series is exactly the $\Theta(d)$ path this note is about, and a real operator registers between stages.

Simulated against a behavioural Horner reference (`floor` division by $2^{\ell^Y_i}$, wrapped to each stage's width) with 4009 vectors: 3 hand-computed (constant $C_0$ pass-through; $C_1=2^{-6}$ with $Y$ at full scale, expecting $2^{23}-16$; $C_3=-1000$ surviving all three stages with $Y\approx1$), 6 named asymmetric vectors including $Y=1,\ C_3=128$ against $Y=128,\ C_3=1$, and a 4000-vector random sweep. All passed.

**Related Notes**

- [[Choosing a Polynomial Evaluator]] – compares: where the $O(d)$ chain sits against every sibling evaluator.
- [[Parallel Polynomial Evaluator]] – compares: evaluates the developed form instead, buying $O(\log d)$ depth with extra multipliers.
- [[Estrin's Scheme]] – extends: the recursive odd/even split $p(x)=p_e(x^2)+x\,p_o(x^2)$ that reassociates this chain into a tree.
- [[SquareRich Evaluation]] – extends: completes the square across two stages, trading one multiplier for a squarer.
- [[Polynomial Coefficient Table]] – depends-on: supplies the $C_i$ and fixes $\ell_p$, the starting point of Algorithm 18.2's search.
- [[Uniform Piecewise Segmentation]] – supports: it is $\alpha$ that makes the coefficients decay, which is what lets each stage narrow.
- [[Truncated Multipliers]] – depends-on: every $\times$ in the chain is one, and $\bar\delta_{\text{multadd},i}=2^{\ell^S_i}$ assumes it.
- [[Bit Heaps]] – extends: the $d$ additions and the final rounding collapse into one compressor tree.
- [[DSP Blocks]] – counter-example: the per-stage narrowing stops paying once a stage is small enough to fit a fixed-shape hard multiplier anyway.
- [[ILP-Optimized Polynomial Evaluator]] – counter-example: dissolves the separate approximation and evaluation budgets that Algorithm 18.2 needs, recovering the bits worst-case sizing throws away.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18 "Polynomial-Based Architectures for Function Evaluation".

- §18.3 Hardware polynomial evaluation, pp. 554–555 — Eq. (18.19), recurrence (18.20), quantized recurrence (18.21), Fig. 18.19, p. 555
- §18.3.1 Error analysis, pp. 555–557 — insert-and-cancel decomposition (18.22)–(18.24), exact addition (18.25)–(18.26), $Y$ truncation (18.27), flat sum (18.28)–(18.29)
- Algorithm 18.2, sizing heuristic for a shared $\ell_S$, p. 558
- Coefficient decay under uniform reduction, Fig. 18.7, p. 539 and pp. 542–544; worst-case formats over subintervals, Eqs. (18.7)–(18.8), p. 543
- Parallel evaluation for contrast, §18.3.2, pp. 558–559
- Half-ulp pre-added into $C_0$ so that the final truncation is round-to-nearest, §18.4.1, p. 563
- Piecewise generator invoking `FixHornerEvaluator` per subinterval, Fig. 18.23, pp. 565–566
