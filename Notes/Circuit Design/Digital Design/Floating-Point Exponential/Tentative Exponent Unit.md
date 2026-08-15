---
title: Tentative Exponent Unit
description: "Computes E = round(X_fix/ln 2) on w_E+1 signed bits from a deliberately sloppy constant multiplier — the whole error budget is 0.22, half of which is spent truncating X_fix to LSB -4 to shrink the multiplier."
kind: circuit
source: "ASA §22.3.2 and §22.3.4, pp. 647-650"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, range-reduction, constant-multiplier]
aliases:
  - Tentative Exponent
  - Tentative Exponent Computation
  - Computation of the Tentative Exponent
---

# Tentative Exponent Unit

The constant multiplier that produces the range-reduction index $E=\lfloor X_{\mathrm{fix}}/\ln 2\rceil$, and the only arithmetic block in a floating-point exponential that is *specified to be inaccurate* — its whole error allowance is $0.22$, spent on purpose.

```tikz title="Tentative exponent unit: truncate to LSB -4, multiply by 1/ln 2, round to an integer, attach the sign — with the 0.22 error budget split alongside"
\usepackage{circuitikz}
\usetikzlibrary{arrows,decorations.pathreplacing}
\begin{document}
\begin{circuitikz}[font=\small]
  % ============ datapath column ============
  \draw[-latex] (0,8.5) -- (0,7.9);
  \node[anchor=west,font=\footnotesize] at (0.12,8.28) {$|X_{\mathrm{fix}}|$\ \ \texttt{ufix}$(w_E-2,\,-w_F-g)$};
  \node[anchor=east,font=\tiny,black!60] at (-0.12,8.28) {from \textsf{shift to fixed point}};

  % ---- truncate
  \draw (-1.9,7.1) rectangle (1.9,7.9);
  \node[font=\footnotesize] at (0,7.5) {truncate to $\ell_X=-4$};
  \draw[-latex] (0,7.1) -- (0,6.4);
  \node[anchor=west,font=\footnotesize] at (0.12,6.75) {\texttt{ufix}$(w_E-2,-4)$ --- $w_E+3$ bits};

  % ---- KCM
  \draw (-1.9,5.6) rectangle (1.9,6.4);
  \node[font=\footnotesize] at (0,6.0) {$\times\ 1/\ln 2$\ \ (\textsf{FixRealKCM})};
  \draw[-latex] (0,5.6) -- (0,4.9);
  \node[anchor=west,font=\tiny] at (0.12,5.25) {faithful to $0.13$};

  % ---- round to integer
  \draw (-1.9,4.1) rectangle (1.9,4.9);
  \node[font=\footnotesize] at (0,4.5) {round to nearest integer};
  \draw[-latex] (0,4.1) -- (0,3.2);
  \node[anchor=west,font=\footnotesize] at (0.12,3.65) {$|E|$\ \ \texttt{ufix}$(w_E,0)$};

  % ---- sign attach
  \draw (-1.9,2.4) rectangle (1.9,3.2);
  \node[font=\footnotesize] at (0,2.8) {attach sign $s_X$};
  \draw[-latex] (4.6,2.8) -- (1.9,2.8);
  \node[anchor=west,font=\footnotesize] at (4.7,2.8) {$s_X$\ \ 1 bit, from \textsf{unpack}};
  \draw[-latex] (0,2.4) -- (0,1.6);
  \node[anchor=west,font=\footnotesize] at (0.12,2.0) {$E$\ \ signed, $w_E+1$ bits};

  % ---- consumers
  \draw (-3.6,0.8) rectangle (-0.5,1.6);
  \node[font=\footnotesize] at (-2.05,1.2) {$\times(-\ln 2)$};
  \draw (0.6,0.8) rectangle (3.7,1.6);
  \node[font=\footnotesize] at (2.15,1.2) {\textsf{normalize-round-pack}};
  \draw (0,1.6) -- (-2.05,1.6);
  \draw (0,1.6) -- (2.15,1.6);
  \node[anchor=north,font=\tiny] at (-2.05,0.75) {to the $Y$ subtractor};
  \node[anchor=north,font=\tiny] at (2.15,0.75) {exponent field of $R$};

  % ============ error budget bar ============
  \node[anchor=west,font=\footnotesize] at (-9.4,7.5) {error budget on $X_{\mathrm{fix}}/\ln 2$};
  \node[anchor=west,font=\tiny,black!60] at (-9.4,7.1) {(before the rounding to an integer)};

  \fill[black!30] (-9.4,5.9) rectangle (-7.27,6.9);
  \fill[black!12] (-7.27,5.9) rectangle (-4.2,6.9);
  \draw[very thick] (-9.4,5.9) rectangle (-4.2,6.9);
  \node[align=center,font=\tiny] at (-8.33,6.4) {$\bar\delta_{\mathrm{trunc}}$\\[1pt]$0.09$};
  \node[align=center,font=\tiny] at (-5.73,6.4) {constant multiplier\\[1pt]$0.13$};
  \draw[decorate,decoration={brace,mirror,amplitude=4pt}] (-9.4,5.75) -- (-4.2,5.75);
  \node[anchor=north,font=\tiny] at (-6.8,5.4) {total $\le \dfrac{1-\ln 2}{2\ln 2}=0.22$};

  \draw[-latex,black!55] (-4.2,6.4) -- (-2.0,6.4);
  \node[anchor=south,font=\tiny,black!55] at (-3.1,6.45) {$2^{-4}\cdot\frac{1}{\ln 2}$};

  \node[anchor=north west,font=\tiny,align=left] at (-9.4,4.5)
    {the round-to-integer step costs a further $0.5$;\\
     FloPoCo passes $0.5+0.13$ as the KCM's bound};

  \node[anchor=north west,font=\tiny,align=left] at (-9.4,3.5)
    {budget spent $\Rightarrow$ $Y\in[-\tfrac12,\tfrac12)$ still holds,\\
     so $|E|$ may be off by $1$ and nothing downstream cares};
\end{circuitikz}
\end{document}
```

*After Fig. 22.4, p. 648 — the $\times 1/\ln 2$ branch of that figure, opened up, with the budget of §22.3.4 drawn alongside.*

> [!important] $E$ is not the exponent of the result, which is why it is allowed to be wrong
> A block computing an exponent field looks like it must be exact. It is not. By the reconstruction $R = 2^E e^Y$ if $e^Y\ge 1$ and $R = 2^{E-1}(2e^Y)$ otherwise, the `normalize-round-pack` stage already contains a $\pm1$ correction on the exponent. So an inaccurate $E$ has exactly two consequences (p. 647): the value of $E$ differs from the ideal by at most one, which the correction absorbs, and the interval of the reduced argument $Y$ widens beyond $[-\tfrac{\ln 2}{2},\tfrac{\ln 2}{2}]$, which is the constraint that actually binds. $E$ does not *set* the result's exponent; it *selects which $Y$ you land on*. Everything below is bookkeeping on the second consequence.

**Turn "$Y$ must stay in range" into a number.** The downstream specification is $Y\in[-\tfrac12,\tfrac12)$. Worst case is $Y=-\tfrac12$: there, the computed $E\ln 2$ is off from the ideal by $\tfrac12-\ln 2$, so the pre-rounding value $X_{\mathrm{fix}}/\ln 2$ was off by that amount divided by $\ln 2$ (the derivative of $E\mapsto E\ln 2$ is the constant $\ln 2$, so the error maps back linearly),

$$\frac{\tfrac12-\ln 2}{\ln 2}=\frac{1-\ln 2}{2\ln 2}\le 0.22$$

and $0.22$ is the *entire* allowance for everything the block does before it rounds to an integer (p. 650). The rounding itself costs a further $0.5$, but that is the rounding, not an error — it is the definition of $\lfloor\cdot\rceil$, and the $\pm1$ correction downstream is what pays for it.

**The relaxation to $[-\tfrac12,\tfrac12)$ and the cheap multiplier are the same decision.** With an exact $E=\lfloor X/\ln2\rceil$ the reduced argument obeys the tighter $|Y|\le\tfrac{\ln 2}{2}\approx 0.347$, and substituting $0.347$ for $\tfrac12$ above gives a budget of zero — an exact $E$ leaves nothing to spend. Widening the bound to the next power of two buys the $0.22$ and costs nothing, because the bit vector holding $Y$ is `sfix`$(-1,-w_F-g)$ either way: $0.347$ and $0.5$ have the same MSB position. It also *helps* downstream, since the high bits of $Y$ address a table and a bound of $0.347$ would leave roughly 30% of the address space unreachable (p. 647). See [[Number Formats]] for why the format, not the value range, fixes the bit count.

**Why not use floor and skip the correction entirely.** $E=\lfloor X/\ln 2\rfloor$ gives $Y\in[0,\ln 2)$ and hence $e^Y\in[1,2)$ — a normalised significand by construction, with no correction step. It fails for a reason that is worth internalising (p. 647): that argument is only valid if the *whole* datapath, this constant multiplier included, is correctly rounded. The moment the target is merely faithful, a one-bit error reappears in $E$ and the correction comes back anyway. Correct rounding here needs very high internal precision [Mul+18]. So you pay for the correction regardless; having paid, you may as well cash the relaxation in everywhere else.

**Size $E$ at $w_E+1$ signed bits, one more than the format's exponent field.** The extra bit accommodates the $E_R+1$ case of the reconstruction when $E_R=e_{\max}$, and it lets `normalize-round-pack` catch the overflowing inputs that the coarse under/overflow test upstream let through — in IEEEfloat(8,23) the coarse test only rejects $|X|\ge 2^{w_E-1}=128$, while the true overflow threshold is $X_{\max}=88.73$, so every input in $(88.73,128)$ arrives here as an ordinary value and must be representable before it can be diagnosed (p. 649). The block itself emits the magnitude $|E|$ in `ufix`$(w_E,0)$ — $w_E+1$ bits — because $X_{\mathrm{fix}}$ arrives in sign/magnitude from the [[Exponential Fixed-Point Converter]]; the sign $s_X$ is attached as a separate wire and the two-argument form of the sum downstream consumes it directly.

**Spend the first half of the budget on shrinking the multiplicand.** $X_{\mathrm{fix}}$ arrives as `ufix`$(w_E-2,-w_F-g)$ — for IEEEfloat(8,23) at $g=3$ that is $7+26=33$ bits, and multiplying 33 bits by a constant to produce a 9-bit answer is absurd. Truncate it to $\ell_X=-4$ first. Truncation is a one-sided error bounded by $2^{-4}=0.0625$, and the constant multiplication that follows scales it by $1/\ln 2 = 1.4427$, so

$$\bar\delta_{\mathrm{trunc}} \le 2^{-4}\cdot\frac{1}{\ln 2}\approx 0.09$$

— about half the budget, and in exchange the multiplicand drops to `ufix`$(w_E-2,-4)$, just $w_E+3$ bits. That is $11$ bits for IEEEfloat(8,23), independent of $w_F$.

**The remaining $0.13$ is the multiplier's specification.** FloPoCo's `FixRealKCM` takes an optional accuracy bound as a parameter, and here it is passed $0.5+0.13$: the $0.5$ is the final rounding to an integer, the $0.13=0.22-0.09$ is what is left of the budget for the multiplication of the truncated $X_{\mathrm{fix}}$ by the real $\ln 2$ (p. 650). This shape — a handful of input bits, a handful of output bits, one irrational constant — is the natural home of a table-based [[KCM, Table-Based Constant Multiplication]] rather than a [[Shift-and-Add]] recoding, since the $w_E+3$-bit multiplicand splits into two sub-tables on a 6-input-LUT fabric and the whole multiplier is a table lookup plus one small addition ([[Multiplication by Constants]]). On a DSP-rich device the truncated multiplicand and the constant both fit one hard multiplier input, and the block collapses to a single DSP; on an ASIC the KCM's advantage is smaller and a recoded shift-and-add is competitive.

**A generic alternative that avoids the faithful-multiplier machinery.** Instead of specifying an error bound on the product, round the *constant* $1/\ln 2$ to $\ell_C=-3-w_E$, use an exact multiplier, and round the result to nearest (p. 650). This is legitimate precisely because $X_{\mathrm{fix}}<2^{w_E-1}$: the constant's own error $2^{\ell_C-1}$ is amplified by at most $2^{w_E-1}$, giving $2^{-4}/2 = 2^{-5}\approx 0.031$, comfortably inside the $0.13$. It is the variant implemented below, because "exact product then round" is a thing a simulator can check against a real-arithmetic reference, whereas "faithful to $0.13$" is a contract on a table generator.

$$\boxed{\ \left|\widehat{\frac{X_{\mathrm{fix}}}{\ln 2}} - \frac{X_{\mathrm{fix}}}{\ln 2}\right| \;\le\; \frac{1-\ln 2}{2\ln 2}\;\le\;0.22 \;=\; \underbrace{2^{-4}/\ln 2}_{0.09\ \text{truncation}} \;+\; \underbrace{0.13}_{\text{constant multiplier}}\ }$$

**Where it breaks.**

- **Exceed $0.22$ and the whole operator, not just this block, is wrong.** $Y$ leaves $[-\tfrac12,\tfrac12)$, $e^Y$ leaves $[0.6,1.7]$, and the one-bit normalisation of the reconstruction can no longer restore a significand in $[1,2)$. The failure is silent on small inputs and appears only for arguments near the bound.
- **$\ell_X=-4$ is a constant, not a formula.** It saves nothing when $w_F+g\le 4$, and for a very wide format it is still $-4$ — the truncation error does not shrink as $w_F$ grows, so the $0.09$ term is a fixed fraction of a fixed budget at every precision. That is the design being scale-free, not an oversight.
- **The cost scales with $w_E$, never with $w_F$.** Multiplicand $w_E+3$ bits, constant at $\ell_C=-3-w_E$, output $w_E+1$ bits. This is the one block in the operator whose area is set by the exponent width alone, which is why it is negligible in double precision and non-negligible in a wide-exponent, narrow-fraction format.
- **The tight-bound design has no budget at all.** If some downstream variant insists on $|Y|\le\tfrac{\ln 2}{2}$, this block must be correctly rounded and the analysis above collapses; at that point the floor-based variant is the better trade.
- **Sign/magnitude is an interface assumption.** The [[Fixed-Point-In Exponential]] enters the datapath with an already-signed $X_{\mathrm{fix}}$, so its version of this block is a *signed* constant multiplier — slightly more expensive — and the `attach sign` stage disappears.

**RTL.**

```spade
// Tentative exponent for float(w_E = 8, w_F): E = round(|X_fix| / ln 2), sign/magnitude in.
// xt : |X_fix| already truncated to LSB l_X = -4, i.e. ufix(6,-4) = |X| * 2^4, |X| < 2^7.
// c  : 1/ln 2 rounded to LSB l_C = -3-w_E = -11  ->  round(2^11/ln 2) = 2955.
entity tent_exp8(xt: uint<11>, sx: bool) -> int<9> {
    let c: uint<12> = 2955;
    let x: uint<12> = zext(xt);
    let p: uint<24> = x * c;          // (|X|/ln 2) * 2^15, exact product
    let s: uint<25> = p + 16384;      // + half an integer at weight 2^-15
    let m: uint<8>  = trunc(s >> 15); // |E| = round(|X|/ln 2) <= 185
    let e: int<9>   = m.to_int();
    if sx { -e } else { e }
}
```

`xt` is the wire leaving the *truncate* box in the diagram and `c` is the $\times 1/\ln 2$ box, here as the generic exact-product variant: $2955/2048 = 1.442871$ against $1/\ln 2 = 1.442695$, an error of $1.76\times10^{-4}$ that $|X_{\mathrm{fix}}|<128$ amplifies to at most $0.023$ — inside the $0.13$ with room to spare. The `+ 16384` then `>> 15` pair *is* the round-to-nearest box: adding half a unit at the product's binary point and truncating is the standard identity ([[Rounding]]), and it is free in hardware because the shift is wiring and the constant addend has a single set bit. Everything is combinational and unclocked; the only registers in a real `FPExp` are pipeline stages cut through this logic, and synthesis will fold the $12\times12$ product plus the constant addend into one DSP block's multiply-add rather than the two boxes drawn.

**Related notes.**

- [[Exponential Fixed-Point Converter]] – depends-on: produces the `ufix`$(w_E-2,-w_F-g)$ magnitude and the sign bit this block truncates and consumes.
- [[Reduced Argument Subtractor]] – supports: the $\times(-\ln 2)$ multiplier and the sum that turn $E$ back into $Y$, and the reason $E$'s inaccuracy is survivable.
- [[Exponential Normalize-Round-Pack]] – compares: holds the $\pm1$ exponent correction that licenses every approximation made here.
- [[KCM, Table-Based Constant Multiplication]] – extends: the table-based realisation FloPoCo instantiates for the $\times 1/\ln 2$ box, with its accuracy-bound parameter.
- [[Shift-and-Add]] – counter-example: the recoding-based constant multiplier that loses to KCM at this input width on LUT fabrics, and wins back on ASIC.
- [[Multiplication by Constants]] – depends-on: the general theory of which the $0.5+0.13$ accuracy contract is one instance.
- [[Rounding]] – supports: the add-half-and-truncate identity implementing $\lfloor\cdot\rceil$ here.
- [[Error Accuracy]] – supports: the error-propagation calculus the $0.22$ budget is written in.
- [[Fixed-Point-In Exponential]] – compares: the same block with a signed multiplicand and no sign-attach stage.
- [[FPExp Operator]] – compares: where this sits in the full datapath.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 22:

- §22.3.2 Accuracy Considerations — p. 647 (the licence to be inaccurate; the $[-\tfrac12,\tfrac12)$ relaxation; why floor fails)
- §22.3.4 Computation of the Tentative Exponent — pp. 649–650 (the $w_E+1$ signed bits; the $0.22$ budget; $\ell_X=-4$; the $\ell_C=-3-w_E$ alternative)
- Fig. 22.4, p. 648 — architecture of `FPExp` for Nfloat$(w_E,w_F)$, source of the diagram
- Eq. (22.5), p. 646 and Eq. (22.8), p. 647 — the definition of $E$ and the correction that absorbs its error
- §22.3.3, p. 649 — the coarse under/overflow test whose leftovers force the extra exponent bit

Cited within: [Mul+18] on the cost of correctly rounded evaluation.
