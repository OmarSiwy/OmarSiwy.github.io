---
title: "Higher-Order eY Architecture"
description: "eA table, h(Z) evaluator, F = Z + H adder, a near-square truncated multiplier T_trunc x F, and a final add-and-truncate — the workhorse eY datapath from single precision upward, landing under 5u of architectural error."
kind: circuit
status: seed
spade: simulated
tags: [digital, fixed-point-computation-of-ey, exponential, table, truncated-multiplier]
aliases:
  - Higher-Order e^Y Architecture
  - Higher-Order Range Reduction Architecture
---

# Higher-Order eY Architecture

A fixed-point evaluator for $e^Y$ that splits $Y$ by bit position into $Y = A + Z$, reads $e^A$ from a table, and spends its single multiplier on $e^A \times (e^Z - 1)$ — the one variant in this family that keeps a *second-order* term, so its $e^A$ table stays small enough for single precision and beyond.

```tikz title="Higher-order e^Y architecture: e^A table, h(Z) box, near-square truncated multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- Y and the bit-field split Y = A + Z ----
  \draw[->] (0,10.0) -- (0,9.3);
  \node[anchor=east] at (-0.1,9.65) {$Y$};
  \node[anchor=west] at (0.1,9.65) {\texttt{sfix}$(-1,\ell)$};
  \draw (-4.2,9.3) -- (4.2,9.3);
  \node[anchor=south] at (-4.2,9.35) {$A$: top $k$ bits};
  \node[anchor=south] at (4.2,9.35) {$Z$: the rest};

  % ---- A -> e^A table ----
  \draw[->] (-4.2,9.3) -- (-4.2,8.5);
  \node[anchor=east] at (-4.3,8.9) {\texttt{sfix}$(-1,-k)$};
  \draw (-5.4,7.6) rectangle (-3.0,8.5);
  \node at (-4.2,8.05) {$e^A$ table};

  % ---- Z trunk, with the Z_trunc tap into the h box ----
  \draw[->] (4.2,9.3) -- (4.2,6.3);
  \node[anchor=west] at (4.3,8.9) {\texttt{ufix}$(-k-1,\ell)$};
  \node[anchor=west] at (4.3,6.8) {$Z$};
  \draw (4.2,8.6) -- (0.6,8.6);
  \draw[->] (0.6,8.6) -- (0.6,7.9);
  \node[anchor=east] at (0.5,8.25) {$Z_{\mathrm{trunc}}$};
  \node[anchor=west] at (0.7,8.25) {\texttt{ufix}$(-k-1,p)$};

  % ---- h(Z) box ----
  \draw (-0.8,7.0) rectangle (2.0,7.9);
  \node at (0.6,7.45) {$e^Z-Z-1$};
  \draw[->] (0.6,7.0) -- (0.6,6.3);
  \node[anchor=east] at (0.5,6.65) {$H$};
  \node[anchor=west] at (0.7,6.65) {\texttt{ufix}$(-2k-1,\ell-g')$};

  % ---- F = Z + H ----
  \draw (-0.6,5.6) rectangle (4.6,6.3);
  \node at (2.0,5.95) {$+$};
  \draw[->] (2.0,5.6) -- (2.0,4.7);
  \node[anchor=west] at (2.1,5.30) {$F\approx e^Z-1$};
  \node[anchor=west] at (2.1,4.95) {\texttt{ufix}$(-k,\ell-g')$};

  % ---- T and the T_trunc tap ----
  \draw[->] (-4.2,7.6) -- (-4.2,3.2);
  \node[anchor=east] at (-4.3,4.60) {$T\approx e^A$};
  \node[anchor=east] at (-4.3,4.25) {\texttt{ufix}$(0,\ell-g')$};
  \draw (-4.2,6.6) -- (-1.6,6.6);
  \draw[->] (-1.6,6.6) -- (-1.6,4.7);
  \node[anchor=west] at (-1.5,5.60) {$T_{\mathrm{trunc}}$};
  \node[anchor=west] at (-1.5,5.25) {\texttt{ufix}$(0,\ell+t-g')$};

  % ---- near-square truncated multiplier ----
  \draw (-2.4,4.0) rectangle (2.8,4.7);
  \node at (0.2,4.35) {$\times$ \ \footnotesize near-square, truncated};
  \draw[->] (0.2,4.0) -- (0.2,3.2);
  \node[anchor=west] at (0.3,3.60) {\texttt{ufix}$(-k+1,\ell-g')$};

  % ---- final adder ----
  \draw (-5.0,2.5) rectangle (1.4,3.2);
  \node at (-1.8,2.85) {$+$};
  \draw[->] (-1.8,2.5) -- (-1.8,1.8);
  \node[anchor=west] at (-1.7,2.15) {$M_{\mathrm{full}}$\quad\texttt{ufix}$(0,\ell-g')$};

  % ---- round by truncation ----
  \draw (-3.6,1.1) rectangle (0.0,1.8);
  \node at (-1.8,1.45) {round by truncation};
  \draw[->] (-1.8,1.1) -- (-1.8,0.4);
  \node[anchor=west] at (-1.7,0.75) {$M$\quad\texttt{ufix}$(0,\ell)$};
\end{circuitikz}
\end{document}
```

*After Fig. 22.6, p. 657. $\ell = -w_F - g$; $g'$ = guard bits internal to the $e^Y$ operator ($g' = 0$ recovers the single-global-$g$ style); $t$ = number of LSBs dropped from the $e^A$ table output before the multiplier; $p$ = LSB position of $Z_{\mathrm{trunc}}$.*

**Split the argument by bit position, so the reduction costs no arithmetic at all.** The input is $Y$ in `sfix`$(-1,\ell)$ with $\ell = -w_F-g$, and the specification is a faithful $M \approx e^Y$ in `ufix`$(0,\ell)$ — see [[Fixed-Point Computation of eY]] for where those come from. Cut the word in two:

$$Y = A + Z \qquad (22.19)$$

$A$ is the $k$ MSBs, `sfix`$(-1,-k)$, $k$ bits; $Z$ is everything below, `ufix`$(-k-1,\ell)$, $|\ell|-k$ bits. This is a *wire split*, not a subtraction — the second range reduction in the operator is free, where the first one (in [[Floating-Point Exponential]]) cost a multiplier. The law that makes it useful is the exponential's own functional equation $e^{a+b} = e^a e^b$:

$$e^Y = e^{A+Z} = e^A \cdot e^Z \qquad (22.20)$$

so $e^A$ becomes a $2^k$-entry ROM ([[eA Table]]) and $Z$ is confined to

$$0 \le Z < 2^{-k} \qquad (22.21)$$

which is exactly the regime where a Taylor series converges fast enough to be hardware.

**Take the leading one out of the multiplier.** Writing $f(Z) = e^Z - 1$ (22.23), the bound (22.21) run through Taylor gives

$$0 \le f(Z) < 2^{-k+1} \qquad (22.25)$$

so the MSB of $f$ sits at position $-k$: the binary representation of $e^Z = 1 + f(Z)$ carries at least $k-1$ zeros between its leading one and the next nonzero bit. Multiplying $e^A$ by that run of zeros is wasted silicon, so distribute $\times$ over $+$:

$$e^A \times e^Z = e^A \times (1 + f(Z)) = e^A + e^A \times f(Z) \qquad (22.27)$$

Both addends align at LSB $\ell$, so the reconstructing `+` is width-aligned and needs no shifter — and the multiplier's right operand has shrunk by $k$ bits.

**Push the whole transcendental difficulty into a box $2k$ bits narrower than $e^Z$.** Define

$$h(Z) = e^Z - 1 - Z \qquad (22.24)$$

Taylor on (22.21) bounds it one order tighter than $f$:

$$0 \le h(Z) < 2^{-2k} \qquad (22.26)$$

so $H \approx h(Z)$ has its MSB at position $-2k-1$ and occupies only $|\ell| - 2k + g'$ bits. Every one of the Taylor multiplications lives inside that box ([[hZ Table]] tabulates it outright; [[Polynomial hZ Evaluator]] takes over at double precision); everything outside it is shifts and adds, because the first three Taylor coefficients $1, 1, \tfrac12$ are powers of two. Rearranging (22.24),

$$f(Z) = Z + h(Z) \qquad (22.28)$$

recovers $F \approx e^Z - 1$ with one adder ([[RCA, Ripple-Carry Adder]] suffices): it is $|\ell|-k$ bits wide with $H$ zero-extended into its top, and the carry-out grows $F$ to `ufix`$(-k,\ell-g')$. $Z$ itself is added back for free — it was already a wire.

> [!important]
> The line $T(1 + Z + h(Z)) - T e^Z$ in the error telescope below is **exactly zero**, not "small". $h$ is *defined* as $e^Z - Z - 1$, so $e^Z = 1 + Z + h(Z)$ is an algebraic identity; the only approximation is in *evaluating* $h$, and that is already counted as $\delta_H$. Splitting a function this way never costs accuracy — it only moves where you pay for it.

**Size the two truncations against each other, not against zero.** A truncated multiplier wants its two operands roughly the same size ([[Truncated Multipliers]]), and $F$ is $k$ bits shorter than $T$ — so shorten $T$ to match by dropping its $t$ lowest bits, giving $T_{\mathrm{trunc}}$ in `ufix`$(0,\ell+t-g')$ and a **near-square** multiplier ([[Multipliers]]). Symmetrically, $H$ only spans positions $-2k-1$ down to $\ell-g'$, so the box computing it cannot use bits of $Z$ far below that: truncate $Z$ to LSB $p$ on the way in. Neither $t$ nor $p$ is guessed; both fall out of the error analysis, which is why the analysis comes before the widths.

**Telescope the error from the output back to the input.** With $u = 2^{\ell-g'}$ the ulp of the internal datapath, insert and cancel one intermediate quantity per stage (p. 658):

$$\delta_{\mathrm{arch}} = \delta_{\text{final round}} + \delta_{\mathrm{mult}} + \delta_{\mathrm{trunc}T} + \delta_H + \delta_{\mathrm{trunc}Z} + 0 + \delta_T \qquad (22.29)$$

| Term | Source | Bound |
| --- | --- | --- |
| $\delta_{\text{final round}}$ | dropping the $g'$ guard bits | $0$ if $g'=0$; else $2^{\ell-1}$ — **free** if the rounding bit $2^{\ell-1}$ is pre-added to every $e^A$ entry |
| $\delta_{\mathrm{mult}}$ | the truncated multiplier | $1u$ (faithful) |
| $\delta_{\mathrm{trunc}T}$ | $(T_{\mathrm{trunc}} - T)(Z+H)$ | $2^{\ell+t-g'} \times 1.25 \cdot 2^{-k}$; balancing against $u$ gives $t = k \Rightarrow 1.25u$, or $t = k-1 \Rightarrow 0.625u$ |
| $\delta_H$ | the $h(Z)$ evaluator, amplified by $T$ | $1.65u/2$ if $h$ is tabulated correctly rounded; $1.65u$ from a faithful generic approximator |
| $\delta_{\mathrm{trunc}Z}$ | $T\,(h(Z_{\mathrm{trunc}}) - h(Z))$ | Taylor on $h$: $\approx e\,h'(Z) = eZ + \cdots$ with $0 \le e < 2^p$ and $|Z| < 2^{-k}$, so $2 \cdot 2^{p-k}$; $p = \ell - g' + k - 1 \Rightarrow 1u$ |
| $0$ | $T(1+Z+h(Z)) - Te^Z$ | exactly zero — see the callout |
| $\delta_T$ | tabulation of $e^A$, amplified by $e^Z$ | $\tfrac{u}{2} \times 1.25 = 0.625u$ with round-to-nearest |

The recurring $1.25$ and $1.65$ are amplification factors, not fudge: $1.25$ bounds $2^{k}(Z+H) = 2^k f(Z)$, and $1.65$ bounds $T \approx e^A$. Where the parent operator has the least slack — the branch $e^Y < 1$ — monotonicity of $e^x$ together with $A \le Y$ gives $e^A \le e^Y < 1$, so $T < 1$ and the $1.65$ tightens to $1$ exactly where it is needed. Formats, ulp and the meaning of *faithful* are in [[Number Formats]] and [[Error Accuracy]]; the truncation-versus-nearest choices are [[Rounding]].

**The budget lands between $3u$ and $6u$, and that is what fixes $g$.** Two settlements the book works out (p. 659):

- $g'=0$, small precision, $h$ tabulated correctly rounded, $p = \ell+k-1$, $t = k$: $0 + 1 + 1.25 + 0.825 + 1 + 0.625 = 4.7u$.
- $g'=0$, larger precision, $h$ merely faithful: $t$ must tighten to $k-1$ to pay for the doubled $\delta_H$, giving $0 + 1 + 0.625 + 1.65 + 1 + 0.625 = 4.9u$.

Both sit just under $5u$, so with the $3u$ contributed by the floating-point range reduction, **$g = 4$**. Holding $g$ at its minimal $3$ instead requires $\delta_{\mathrm{mult}} + \delta_{\mathrm{trunc}T} + \delta_H + \delta_{\mathrm{trunc}Z} + \delta_T < 4u$, which $g' = 3$ buys. That is the trade in one sentence: **more work in the floating-point range reduction, or more work inside $e^Y$.** On FPGA the coarse granularity of the hard blocks hands several of these terms back for free — see [[eY DSP and BRAM Mapping]].

$$\boxed{\ M \;=\; \left\lfloor\, T + T_{\mathrm{trunc}} \times \big(Z + H\big) \,\right\rfloor_{\ell}\,,\qquad H \approx e^{Z}-Z-1,\qquad \bar\delta_{\mathrm{arch}} < 5u\ }$$

**When it breaks.** The second-order term only earns its box once $2^{-2k-1}$ is *below* the target ulp; above that width [[First-Order eY Architecture]] deletes $h$ entirely and is strictly cheaper, and below about eight fraction bits [[Direct eY Table]] beats everything here and is correctly rounded besides. In the other direction the $e^A$ table grows as $2^k$ while the useful $k$ grows with $w_F$, so past double precision a tabulated $h$ stops fitting and [[Polynomial hZ Evaluator]] takes the box. The final adder is sized on $e^Y < 2$, which holds only because the parent's first range reduction already confined $Y$; feed it an unreduced $Y$ and the sum wraps silently rather than saturating. And the $1.65$ is a bound on $T$, not on $M$ — changing the reduced range means recomputing every amplified term, not scaling the total.

```spade
// Higher-order e^Y datapath, IEEE-single case study:
// w_F = 23, g = 4, g' = 0  =>  l = -27 ; k = 10, t = 10, p = l+k-1 = -18.
entity ey_higher_order(
    tab: uint<28>,   // T ~ e^A         ufix(0,   -27)
    z:   uint<17>,   // Z               ufix(-11, -27)
    h:   uint<7>,    // H ~ h(Z_trunc)  ufix(-21, -27)
) -> uint<28> {      // M               ufix(0,   -27)
    // F = Z + H : ufix(-10,-27), 18 bits. H sits 20 positions below Z's MSB, so
    // the adder is 17 bits wide with H zero-extended, and `+` grows it to 18.
    let f: uint<18> = zext::<7, 17>(h) + z;

    // T_trunc: keep the top 18 bits of T, dropping t = 10 LSBs -> ufix(0,-17).
    let tt: uint<18> = tab.as_bits()[10..28].as_uint();

    // Near-square truncated multiplier 18x18 -> 36, realigned to LSB -27 by
    // dropping 17 bits. 10 + 17 = 27 = |l| is the alignment invariant.
    let prod: uint<19> = (tt * f).as_bits()[17..36].as_uint();

    // M_full = T + T_trunc*F : ufix(0,-27). e^Y < 2 keeps this in 28 bits.
    trunc(tab + zext::<19, 28>(prod))
}
```

`tab` is the wire leaving the $e^A$ table, `z` the right-hand branch of the split, `h` the output of the $e^Z\!-\!Z\!-\!1$ box; both ROMs are omitted because what they are is their *contents*, not their logic. The entity is purely combinational — in a real operator each of the four stages is registered, and synthesis maps the single `*` onto one DSP block instead of a LUT array, which is the whole reason both operands were shaved to 18 bits. The invariant to carry away is `10 + 17 == 27`: the bits dropped before the multiplier ($t$) plus those dropped after it must equal $|\ell| - g'$, or the product lands one binade off and the error table above is describing a different circuit.

> [!warning] Not covered in the source — needs outside research
> Chapter 22 gives table dimensions, multiplier shapes and error bounds for this architecture, but **no LUT, slice, DSP-count or delay figures**, and no synthesis comparison against the polynomial or iterative families — the book says as much on p. 663. Any area or frequency number for this datapath has to come from your own build.

**Related Notes**

- [[eA Table]] – depends-on: supplies $T$, with the half-ulp rounding bit folded into every entry so $\delta_{\text{final round}}$ vanishes.
- [[hZ Table]] – depends-on: the $2k$-bits-narrower box that (22.24) creates, tabulated with correct rounding.
- [[Polynomial hZ Evaluator]] – extends: replaces that box with a piecewise polynomial once tabulation stops fitting.
- [[First-Order eY Architecture]] – compares: the same skeleton with $h$ deleted, cheaper until the $e^A$ table explodes.
- [[Direct eY Table]] – counter-example: below eight fraction bits one ROM beats this entire datapath, and is correctly rounded.
- [[Truncated Multipliers]] – supports: why $T$ is shortened to $T_{\mathrm{trunc}}$ rather than used whole.
- [[Multipliers]] – supports: near-square is the shape a single hard multiplier wants.
- [[RCA, Ripple-Carry Adder]] – supports: both `+` boxes here are plain width-aligned adders, no shifter.
- [[Rounding]] – supports: round-to-nearest on the tables, truncation everywhere else, and what each costs.
- [[eY DSP and BRAM Mapping]] – extends: how the FPGA's block granularity gives back $\delta_{\mathrm{mult}}$ and $\delta_{\mathrm{trunc}T}$ for free.
- [[Floating-Point Exponential]] – depends-on: supplies $Y$ and consumes $\bar\delta_{\mathrm{arch}}$ into its own choice of $g$.
- [[Choosing an eY Architecture]] – compares: where this sits against every sibling in the family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §22.5.1 Using large tables and square multipliers — pp. 655–657 (eqs. 22.19–22.28; Fig. 22.6, p. 657)
- Error analysis of the higher-order architecture — pp. 658–659 (eq. 22.29, the $4.7u$ and $4.9u$ settlements, the $g'=3$ variant)
- §8.1.3 Truncated multipliers — cited from p. 657 as the justification for $T_{\mathrm{trunc}}$
