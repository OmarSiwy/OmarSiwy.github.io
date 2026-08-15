---
title: "Higher-Order e^Y Evaluator"
description: "A second, bit-field range reduction Y = A + Z: an e^A table, an h(Z) = e^Z - Z - 1 box that is 2k bits narrower than e^Z, and one near-square truncated multiplier — single precision lands on exactly one BRAM and one DSP."
kind: circuit
source: "ASA §22.5.1 and §22.5.4, pp. 655-661"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, exponential, table, truncated-multiplier, fpga]
aliases:
  - Higher-Order Range Reduction Architecture
  - Large Tables and Square Multipliers
  - Square Multiplier Exponential
---

# Higher-Order e^Y Evaluator

The inner $e^Y$ evaluator that splits the reduced argument a *second* time by bit position, $Y = A + Z$, so that the only function still needing approximation is $h(Z) = e^Z - Z - 1$ — a box $2k$ bits narrower than $e^Z$ itself.

```tikz title="Bit-position map of Y = A + Z and the successive narrowing of e^Z to f(Z) to h(Z)"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % Linear bit axis: the cell for bit position -n spans x in [0.35(n-1), 0.35n].
  % Drawn for k = 9, l = -26; all four bars share the same LSB column at x = 9.1.

  % ---- row 1: Y = A + Z, the bit-field range reduction (22.19) ----
  \fill[black!12] (0,3.3) rectangle (3.15,3.9);
  \fill[black!5]  (3.15,3.3) rectangle (9.1,3.9);
  \draw (0,3.3) rectangle (9.1,3.9);
  \draw (3.15,3.3) -- (3.15,3.9);
  \node at (1.575,3.6) {$A$};
  \node at (6.125,3.6) {$Z$};
  \node[anchor=west,font=\footnotesize] at (9.3,3.6) {$Y$, \texttt{sfix}$(-1,\ell)$};

  % ---- row 2: e^Z = 1 + f(Z) ----
  \fill[black!30] (-0.35,2.4) rectangle (0,3.0);
  \fill[black!5]  (2.8,2.4) rectangle (9.1,3.0);
  \draw (-0.35,2.4) rectangle (9.1,3.0);
  \draw (0,2.4) -- (0,3.0);
  \draw (2.8,2.4) -- (2.8,3.0);
  \node[font=\tiny] at (-0.175,2.7) {$1$};
  \node[font=\footnotesize] at (1.4,2.7) {$k-1$ zeros};
  \node[anchor=west,font=\footnotesize] at (9.3,2.7) {$e^{Z}=1+f(Z)$};

  % ---- row 3: f(Z) = Z + h(Z), MSB at -k  (22.25) ----
  \fill[black!5] (2.8,1.5) rectangle (9.1,2.1);
  \draw (2.8,1.5) rectangle (9.1,2.1);
  \node[font=\footnotesize] at (5.95,1.8) {$f(Z)=Z+h(Z)$};
  \node[anchor=west,font=\footnotesize] at (9.3,1.8) {MSB $-k$ \ (22.25)};

  % ---- row 4: h(Z), MSB at -2k-1  (22.26) ----
  \fill[black!22] (6.3,0.6) rectangle (9.1,1.2);
  \draw (6.3,0.6) rectangle (9.1,1.2);
  \node[font=\footnotesize] at (7.7,0.9) {$h(Z)$};
  \node[anchor=west,font=\footnotesize] at (9.3,0.9) {MSB $-2k-1$ \ (22.26)};

  % ---- the saving ----
  \draw[dashed,black!55] (-0.35,2.4) -- (-0.35,0.05);
  \draw[dashed,black!55] (6.3,0.6) -- (6.3,0.05);
  \draw[<->] (-0.35,0.2) -- (6.3,0.2);
  \node[anchor=north,font=\footnotesize] at (2.975,0.1)
    {$2k$ bits narrower than $e^{Z}$ --- the only transcendental box};

  % ---- bit-position axis ----
  \draw (-0.35,-1.0) -- (9.1,-1.0);
  \foreach \x/\lab in {-0.175/$0$, 0.175/$-1$, 2.975/$-k$, 6.475/$-2k{-}1$, 8.925/$\ell$}
    { \draw (\x,-0.93) -- (\x,-1.07);
      \node[anchor=north,font=\tiny] at (\x,-1.09) {\lab}; }
  \node[anchor=west,font=\tiny] at (9.3,-1.0) {bit position, $\ell=-w_F-g$};
\end{circuitikz}
\end{document}
```

*After Fig. 22.5, p. 655, extended with the bit ranges that (22.25) and (22.26) establish.*

**Split $Y$ a second time, and do it with wires.** The reduced argument arriving from [[Reduced Argument Subtractor]] is $Y \in [-\tfrac12,\tfrac12)$ in `sfix`$(-1,\ell)$ with $\ell = -w_F-g$, so $|\ell|$ bits wide. Cut it at bit position $-k$:

$$Y = A + Z \qquad (22.19)$$

$A$ = bit positions $-1$ down to $-k$, in `sfix`$(-1,-k)$, $k$ bits; $Z$ = positions $-k-1$ down to $\ell$, in `ufix`$(-k-1,\ell)$, $|\ell|-k$ bits. Unlike the range reduction upstream, this one costs **nothing** — it is a relabelling of one bus into two, not a subtraction, so there is no cancellation and no error term to carry. By the addition law of the exponential,

$$e^Y = e^{A+Z} = e^A\cdot e^Z \qquad (22.20)$$

and $e^A$ becomes a $2^k$-entry read-only table addressed by $A$ ([[Table-Based Function Evaluation]]). $Z$ is unsigned even though $Y$ is signed: the split is on the two's-complement bit pattern, so the sign bit lands in the $A$ field and $A$ carries the whole sign.

**Bound $Z$ so that Taylor beats minimax.** The cut forces

$$0\le Z < 2^{-k} \qquad (22.21)$$

which is what makes the second factor tractable. On that interval the Taylor development

$$e^Z\approx 1 + Z + \frac{Z^2}{2} + \cdots \qquad (22.22)$$

has its first three coefficients equal to $1$, $1$ and $\tfrac12$ — all **powers of two, hence free shifts**. That is the reason to prefer Taylor here over the minimax polynomials of [[Polynomial Approximation]]: minimax gives better coefficients and worse hardware, because a general coefficient is a multiplier and $\tfrac12$ is a wire.

**First rewriting — keep the leading one out of the multiplier.** Define

$$f(Z) = e^Z - 1 \qquad (22.23)$$

Then $0\le f(Z) < 2^{-k+1}$ by (22.21) and (22.22), putting the MSB of $f$ at position $-k$: the binary expansion of $e^Z = 1 + f(Z)$ has a leading one at position $0$ and then at least $k-1$ zeros. Feeding that into a multiplier means paying full width to multiply by a run of zeros, so distribute instead — by distributivity of $\times$ over $+$:

$$e^A\times e^Z = e^A\times\bigl(1+f(Z)\bigr) = e^A + e^A\times f(Z) \qquad (22.27)$$

Both addends align at LSB $\ell$, so the recombination is one plain adder, and **the multiplier has shrunk by $k$ bits on the $e^Z$ side**.

**Second rewriting — subtract the linear term out of the function too.** Define

$$h(Z) = e^Z - 1 - Z \qquad (22.24) \qquad\Longrightarrow\qquad f(Z) = Z + h(Z) \qquad (22.28)$$

Taylor bounds $h$ from its quadratic term: $0\le h(Z) < 2^{-2k}$ (22.26), so the MSB of $h$ sits at $-2k-1$. Every multiplication in the series has been pushed inside $h$, and $h$ is $2k$ bits narrower than $e^Z$. The linear term, where most of the value lives, is added back **for free** — $Z$ is already a wire on the datapath. That is the whole trick: not a better approximation of $e^Z$, but a smaller thing to approximate. The decomposition is algebraically exact, since $h$ is *defined* as $e^Z-Z-1$, so it contributes no approximation error of its own; the only error is whatever the $h$ evaluator makes.

**Balance the multiplier into a square.** The product in (22.27) is $T\times F$, where $T\approx e^A$ is `ufix`$(0,\ell-g')$ and $F\approx f(Z)$ is `ufix`$(-k,\ell-g')$ — $k$ bits shorter, with $g'$ the guard bits internal to this operator ($g'=0$ recovers the single-global-$g$ style). A truncated multiplier is only efficient when its two inputs are roughly the same size, because the discarded part has to be a triangle rather than a sliver ([[Truncated Multipliers]], §8.1.3), so truncate $T$ to LSB $\ell+t-g'$ first, giving $T_{\mathrm{trunc}}$ and a **near-square** product. Symmetrically, $H$ only occupies positions $-2k-1$ down to $\ell-g'$, so the $h$ box does not need all of $Z$: truncate $Z$ to LSB $p$, giving $Z_{\mathrm{trunc}}$ in `ufix`$(-k-1,p)$. Neither $t$ nor $p$ is fixed by the algebra — both are free parameters that the error analysis pins.

**What the decomposition costs.** Telescoping the seven terms of (22.29) from the output back to the input puts $\bar\delta_{\mathrm{arch}}$ **between $3u$ and $6u$**, with $u = 2^{\ell-g'}$. The two settled configurations are $p=\ell-g'+k-1$, $t=k$ with a correctly rounded $h$ table at $4.7u$, and $t=k-1$ with a faithful generic $h$ approximator at $4.9u$ (p. 659). Both land just under $5u$, which together with the $3u$ contributed by the floating-point range reduction forces $g=4$ rather than the minimal $g=3$. Holding $g=3$ instead requires $g'=3$ guard bits inside this operator — the same accuracy bought in a different place, and the trade in one sentence: more work in the range reduction, or more work in $e^Y$. The term-by-term derivation is in [[Error Analysis]].

**On FPGAs the coarse granularity of the hard blocks is free accuracy, not waste.** The $e^A$ and $h$ tables go in embedded memory ([[Block Memory]]); the multiplier and the adders around it go in DSP blocks ([[DSP Blocks]]). Three roundings that would cost area on an ASIC cost nothing here (p. 661):

- **$t$ can be reduced for free** — keep more bits of $T$ — as long as $T_{\mathrm{trunc}}$ still fits one DSP input, which directly shrinks $\delta_{\mathrm{trunc}T}$.
- **The $e^A$ table output can be widened for free** up to the memory's maximum output width, because a block RAM charges by depth, not by how many of its output bits are used.
- **If the multiplier fits a single DSP block the product is exact**, so it can be rounded to nearest instead of truncated, killing $\delta_{\mathrm{mult}}$ outright. The half-ulp addend this needs merely widens the final adder by one bit.

> [!note] The parameters are sized to the hard blocks, and the error budget follows
> Case study, IEEE single precision, $w_F=23$, with $g'=0$ and $g=4$, so $\ell=-27$. Choose $k=10$; then $p=\ell+k-1=-18$ and $t=k=10$, with $h(Z)$ tabulated to correct rounding. Both multiplier inputs come out at **18 bits** — $T_{\mathrm{trunc}}$ spans positions $0$ to $-17$, $F$ spans $-10$ to $-27$ — which is the size every common DSP block supports; on an asymmetric $25\times18$ Xilinx DSP the truncation of $T_{\mathrm{trunc}}$ can be relaxed and accuracy improves at zero cost. The $e^A$ table is $2^{10}\times28$ bits, the $h$ table $2^8\times6$ bits, and **both fit in one 36 Kbit block RAM** used in $2^{10}\times36$ dual-port mode. One BRAM and one DSP for a faithful single-precision $e^Y$.

$$\boxed{\ e^{Y}\;=\;e^{A}\;+\;e^{A}\bigl(Z + h(Z)\bigr),\qquad h(Z)=e^{Z}-Z-1,\quad 0\le h(Z)<2^{-2k}\ }$$

> [!warning] Not covered in the source — needs outside research
> Chapter 22 reports no LUT, slice, DSP-count or delay figures for any of its exponential architectures. The one-BRAM-one-DSP count above is a sizing argument from table dimensions and port widths, not a synthesis result, and there is no measured comparison against [[First-Order e^Y Evaluator]] or [[Polynomial h(Z) Evaluator]] on the same technology.

> [!warning] One-bit discrepancy inside the case study
> Fig. 22.6 gives $H$ the format `ufix`$(-2k-1,\ell-g')$, which at $k=10$, $\ell=-27$, $g'=0$ is positions $-21$ down to $-27$ — **7 bits**. The text on p. 661 sizes the same table at $2^8\times6$ bits. The conclusion survives either reading ($2^{10}\times28 + 2^8\times7 = 30464$ bits is still inside one 36 Kbit BRAM), but re-derive the MSB of $h$ from your own bound before committing a table width. The RTL below uses the 7-bit format from the figure.

**When it breaks.** Below roughly $w_F=10$ the $h$ box does not earn its hardware and [[First-Order e^Y Evaluator]] — which drops $h$ entirely, taking $f(Z)\approx Z$ — is smaller at the same accuracy; below about eight fraction bits neither wins and [[Tabulated e^Y]] takes over with a single memory read. Above double precision the $2^k$ table needed to keep $h<2^{-2k}$ small stops fitting, and $h$ must be delegated to a piecewise polynomial evaluator ([[Polynomial h(Z) Evaluator]]), which adds the degree $d$ as a second dimension of trade-off. The $t=k$ balancing assumes a genuinely *truncated* multiplier; when the multiplier is one exact DSP the triangle argument does not apply and $t$ should only be as small as the DSP port forces. And the $1.65$ amplification on $\delta_H$ and $\delta_T$ is the bound on $e^A$ across the whole range — in the $e^Y<1$ branch, exactly where the outer budget has no slack, monotonicity of $e^x$ with $A\le Y$ tightens it to $T<1$, and that tightening is what makes the numbers close at all.

```spade
/// Higher-order e^Y recombination datapath, IEEE single case study
/// (w_F = 23, g = 4, g' = 0, so l = -27; k = 10, t = 10, p = -18).
/// Ports are raw bit vectors; the fixed-point weights are in the comments.
entity ey_recombine(
    t: uint<28>,   // T ~ e^A       ufix(0, -27)
    z: uint<17>,   // Z             ufix(-11, -27)
    h: uint<7>,    // H ~ h(Z)      ufix(-21, -27)
) -> uint<28> {    // M ~ e^Y       ufix(0, -27)
    // F = Z + H ~ e^Z - 1, ufix(-10,-27): 18 bits, no carry out because
    // Z < 2^17 and H < 2^7 at the shared LSB.
    let f: uint<18> = zext::<17, 18>(z) +. zext::<7, 18>(h);
    // T_trunc: keep the 18 MSBs of T, LSB moves from 2^-27 to 2^-17.
    let t_trunc: uint<18> = t.as_bits()[10..28].as_uint();
    // Near-square 18x18 product, LSB 2^-44, truncated back to 2^-27.
    let prod: uint<36> = t_trunc * f;
    let pz: uint<19> = prod.as_bits()[17..36].as_uint();
    // M_full = T + T_trunc*F; e^Y < 1.65 < 2, so ufix(0,-27) cannot overflow.
    t +. zext::<19, 28>(pz)
}
```

`t` is the $e^A$ BRAM output, `h` the $h(Z)$ BRAM output, `z` the low field of $Y$ tapped straight off the bus — the two tables are ROM contents rather than logic, so they are not in the block. `f` is the $F = Z + H$ adder, `t_trunc` is the $t=10$ truncation, done as a bit slice with no logic at all, and `pz` is the truncation of the 36-bit product back to LSB $\ell$, which is exactly where $\delta_{\mathrm{mult}}\le 1u$ enters. Everything is combinational; a real instance registers the BRAM output and the DSP output. Synthesis will not build a full 36-bit product and throw half of it away — on an ASIC it infers a truncated multiplier from the discarded slice, and on an FPGA it maps `t_trunc * f` onto one DSP whose product *is* exact, leaving the final slice as the only lossy step.

## Related Notes

- [[First-Order e^Y Evaluator]] – compares: the same skeleton with the $h$ box deleted, cheaper below $w_F\approx10$ and untenable above it.
- [[Polynomial h(Z) Evaluator]] – extends: replaces the tabulated $h$ with a piecewise minimax evaluator once $2^k$ tables stop fitting.
- [[Tabulated e^Y]] – counter-example: for BFloat-class formats one $2^{10}\times11$-bit table beats every decomposition here.
- [[Choosing an Exponential Architecture]] – compares: where this variant sits against all five inner evaluators.
- [[Reduced Argument Subtractor]] – depends-on: produces the $Y\in[-\tfrac12,\tfrac12)$ that this note splits, and fixes $\ell$ and $g$.
- [[Truncated Multipliers]] – supports: the balanced-input argument that pins $t$.
- [[Table-Based Function Evaluation]] – supports: the $e^A$ and $h(Z)$ tables and their rounding.
- [[Error Analysis]] – supports: the term-by-term telescoping of (22.29) summarised above.
- [[Block Memory]] – supports: the $2^{10}\times36$ dual-port packing of both tables into one BRAM.
- [[DSP Blocks]] – supports: the $18\times18$ port width that fixes $k=10$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §22.5 Fixed-Point Computation of $e^Y$ — pp. 654–655.
- §22.5.1 Using Large Tables and Square Multipliers, Figs. 22.5–22.6, eqs. (22.19)–(22.29) — pp. 655–659.
- §22.5.4 FPGA-Specific Remarks, single-precision case study — p. 661.
- §8.1.3, cross-referenced from p. 657, for the balanced-input condition on truncated multipliers.
