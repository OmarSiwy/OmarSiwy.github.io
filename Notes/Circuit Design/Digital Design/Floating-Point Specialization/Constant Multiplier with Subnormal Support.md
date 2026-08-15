---
title: Constant Multiplier with Subnormal Support
description: "Full subnormal handling for x*C: a pre-multiplier saturated normalizer when C>1, a post-multiplier right shift when C<1 which forfeits the merged-rounding trick."
kind: circuit
source: "ASA §15.1.6, pp. 462-464"
status: seed
spade: simulated
tags: [digital, floating-point, constant-multiplier, subnormal, normalizer, fpga]
aliases:
  - Subnormal Handling in Constant Multiplication
  - Constant Multiplier Subnormal Handling
---

# Constant Multiplier with Subnormal Support

A floating-point constant multiplier that accepts and produces subnormals, distinguished from a generic multiplier by having its shift ranges bounded by the constant's exponent $E_C$ rather than by the fraction width $w_F$.

```tikz title="Correctly rounded constant floating-point multiplier with subnormal management, case C > 1"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  bx/.style={draw, rounded corners=1pt, align=center, inner sep=3pt},
  >=latex
]

% ---- blocks ----
\node[bx, minimum width=7.6cm, minimum height=0.6cm] (unp) at (4.6,9.6) {unpack \& exception handling};
\node[bx, minimum width=2.2cm, minimum height=0.6cm] (sn)  at (7.6,8.0) {saturated normalizer};
\node[bx, minimum width=2.4cm, minimum height=0.6cm] (pn)  at (4.4,6.6) {product normal?};
\node[bx, minimum width=2.8cm, minimum height=1.0cm] (mul) at (7.6,6.6) {correctly rounded\\ multiplier by $1+F_C$};
\node[bx, minimum width=1.8cm, minimum height=0.6cm] (sub) at (1.2,6.6) {$-$};
\node[bx, minimum width=1.8cm, minimum height=0.6cm] (adc) at (1.2,5.3) {$+E_C$};
\node[bx, minimum width=2.2cm, minimum height=0.6cm] (ctl) at (4.4,5.3) {exp.\ \& shift ctrl};
\node[bx, minimum width=2.0cm, minimum height=0.6cm] (nrm) at (7.6,5.3) {1-bit norm.};
\node[bx, minimum width=7.6cm, minimum height=0.6cm] (pak) at (4.6,3.9) {exception handling \& pack};

% ---- input / output ----
\draw[->, very thick] (4.6,10.5) -- (4.6,9.9);
\node[anchor=south] at (4.6,10.5) {$X$};
\draw[->, very thick] (4.6,3.6) -- (4.6,3.0);
\node[anchor=north] at (4.6,3.0) {$R$};

% ---- sign and exception bypasses ----
\draw[->] (0.8,9.6) -- (0.1,9.6) -- (0.1,3.9) -- (0.8,3.9);
\node[anchor=south west] at (0.05,9.7) {$s_X$};
\draw[->] (8.4,9.6) -- (11.2,9.6) -- (11.2,3.9) -- (8.4,3.9);
\node[anchor=south east] at (11.25,9.85) {exn, 2};

% ---- exponent path ----
\draw[->, very thick] (1.2,9.3) -- (1.2,6.9);
\node[anchor=west] at (1.3,9.0) {$E_X+E_0$};
\node[anchor=west] at (1.3,8.65) {ufix$(w_E-1,0)$, $w_E$};
\draw[->, very thick] (1.2,6.3) -- (1.2,5.6);
\draw[->, very thick] (1.2,5.0) -- (1.2,4.2);
\node[anchor=west] at (1.3,4.7) {$E_R+E_0$};
\node[anchor=west] at (1.3,4.35) {sfix$(w_E,0)$, $w_E+1$};

% ---- significand path into the normalizer ----
\draw[->, very thick] (7.6,9.3) -- (7.6,8.3);
\node[anchor=west] at (7.75,9.0) {$n_X+F_X$, $w_F+1$};
\draw (5.9,9.3) -- (5.9,8.75) -- (7.6,8.75);
\fill (7.6,8.75) circle (1.6pt);
\draw (5.9,8.75) -- (5.9,5.3) -- (5.5,5.3);
\node[anchor=east] at (5.85,9.15) {$n_X$};

% ---- normalizer outputs ----
\draw[->] (6.5,8.0) -- (2.1,8.0) -- (2.1,6.9);
\node[anchor=south] at (3.6,8.1) {$\lambda'=\min(\lambda,E_C)$, $\lceil\log_2(E_C{+}1)\rceil$ bits};
\draw[->, very thick] (7.6,7.7) -- (7.6,7.1);
\draw (7.6,7.4) -- (4.4,7.4);
\fill (7.6,7.4) circle (1.6pt);
\draw[->] (4.4,7.4) -- (4.4,6.9);
\node[anchor=west] at (7.75,7.22) {$1.F'_X$, $w_F+1$};

% ---- control ----
\draw[->] (4.4,6.3) -- (4.4,5.6);
\draw[->] (3.3,5.3) -- (2.1,5.3);
\node[anchor=south] at (2.7,5.32) {$+1$};
\draw[->] (5.5,5.3) -- (6.6,5.3);

% ---- product path ----
\draw[->, very thick] (7.6,6.1) -- (7.6,5.6);
\node[anchor=west] at (7.75,5.85) {$P$, ufix$(1,-w_F)$};
\draw[->, very thick] (7.6,5.0) -- (7.6,4.2);
\node[anchor=west] at (7.75,4.6) {$F_R$, ufix$(-1,-w_F)$};

\end{circuitikz}
\end{document}
```

*after Fig. 15.6, p. 463. The book draws `exp. & shift ctrl` as three explicit gates — an OR feeding the $+1$ and two ANDs with inverted $n_X$ inputs; it is collapsed here to one block because the note does not need its gate-level form.*

**Split the problem by the sign of $E_C$, because the two halves share no hardware.** Write the constant as $C=(-1)^{s_C}2^{E_C}(1+F_C)$ with $1+F_C\in[1,2)$, so $C>1$ means $E_C\ge 0$ and $C<1$ means $E_C<0$. Multiplying by $C$ scales the exponent by $+E_C$, and range alone kills one exceptional branch in each case: with $C>1$ the product can never flush to zero, so no normal input yields a subnormal output; with $C<1$ it can never overflow, so no subnormal input is ever renormalized. Each case therefore needs exactly one shifter, in opposite places in the pipeline, and the whole point of specialization is that both shift distances are bounded by $|E_C|$ instead of by $w_F$.

**Give the subnormal input a name the datapath can compute with.** Let $n_X$ be the *is-normal* bit produced by `unpack` — $1$ for a normal input, $0$ for a subnormal — and let $\lambda$ be the leading-zero count of the $(w_F+1)$-bit vector $n_X+F_X$, i.e. the concatenation of the implicit bit with the stored fraction. Then $\lambda=0$ exactly for normals, and $\lambda>0$ measures how far a subnormal sits below the normal range. See [[Floating-Point Formats]] for the encoding and the exponent bias $E_0$; nothing about it is re-derived here.

**Case $C>1$, first branch: the shift that does not normalize.** When $\lambda>E_C$, multiplying $0+F_X$ by $2^{E_C}$ is a left shift by $E_C$ bits that still leaves a leading zero, so the significand handed to the multiplier is simply $0+2^{E_C}F_X$ on $w_F+1$ bits. Because that operand is strictly below $1$ and $1+F_C<2$, monotonicity of $t\mapsto(1+F_C)t$ bounds the product below $2$ — no post-normalization. The one wrinkle is the boundary: at $\lambda=E_C+1$ the product *can* cross $1$ and become normal, and then the exponent field must be incremented.

**Case $C>1$, second branch: the shift that does normalize.** When $0\le\lambda\le E_C$, the output is guaranteed normal. Rewrite the subnormal significand by factoring out its leading one, $0+F_X=2^{-\lambda}(1+F'_X)$, which is the definition of normalization and costs a leading-zero count plus a left shift by $\lambda$. The result is an ordinary normal float that the [[Faithful Floating-Point Constant Multiplier]] architecture already accepts, provided the exponent adder adds $E_C-\lambda$ rather than $E_C$.

**Merge the two branches into one saturated shift.** Both branches shift left by $\min(\lambda,E_C)$ — the first saturates at $E_C$, the second uses $\lambda$ in full — so a single [[Saturated Normalizer]] (leading-zero counter plus a barrel shifter, [[Shifters]]) covers them. It emits $\lambda'=\min(\lambda,E_C)$ on $\lceil\log_2(E_C+1)\rceil$ bits and is a no-op ($\lambda'=0$) for normal inputs, since $\lambda=0$ then. The exponent path becomes one subtract of $\lambda'$ followed by the existing $+E_C$, carried on sfix$(w_E,0)$, i.e. $w_E+1$ bits with a sign bit for the underflow test.

> [!warning] Source erratum
> The book prints $\lambda'=\max(\lambda,E_C)$ on p. 462, but the surrounding prose — the normalizer "shifts left the input by **at most** $E_C$ bits", and "for subnormal inputs such that the product remains subnormal, it saturates to $\lambda'=E_C$" — describes the saturating **minimum**. Read it as $\min$; the maximum would shift a normal input by $E_C$ bits and destroy it.

**The saving is the shift range, not the block count.** A generic floating-point multiplier's subnormal normalizer must be able to shift by up to $w_F$ bits, so it is a full $\lceil\log_2 w_F\rceil$-stage barrel shifter. Here the same block shifts by at most $E_C$, and for the constants that appear in real code $E_C\ll w_F$: the shifter loses stages, the leading-zero counter only has to look at the top $E_C+1$ bits, and the added critical path is a $\log$ factor shallower. That entire reduction is a consequence of knowing $C$ at compile time — there is no algorithmic cleverness in it.

**Case $C<1$ is the mirror image, and it costs the merged rounding.** Now normal inputs can produce subnormals, detected by the tentative biased exponent $E_R$ falling below $e_{\min}$, and repaired by right-shifting the product by $\lambda=e_{\min}-E_R$. This shift **cannot** be moved before the multiplier the way the $C>1$ shift was, because a pre-shift discards low bits that the product still needs and correct rounding is not allowed to lose them (see [[Error Accuracy]] for why a discarded bit is not recoverable from a sticky computed too early). So the architecture must revert to rounding *after* normalization, giving up the baseline trick where the rounding constant is absorbed into the constant multiplier's bit heap. The same right shifter then also serves subnormal inputs, always shifting by exactly $-E_C$.

> [!warning] Not covered in the source — needs outside research
> The book declines to give the $C<1$ architecture: "We do not detail the architecture here" (p. 464). Only the two remaining savings are stated — the constant significand multiplier, and the shift distance limited to $|E_C|$ when $|E_C|<w_F$. The diagram above is therefore the $C>1$ case only.

$$\boxed{\ \lambda'=\min(\lambda,\,E_C)\ ,\qquad E_R+E_0=(E_X+E_0)-\lambda'+E_C\ }$$

with the significand fed to the constant multiplier being $(n_X+F_X)\ll\lambda'$, normal exactly when $\lambda\le E_C$.

**When it breaks.**

- **$E_C\ge w_F$.** The saturated normalizer degenerates into the full $w_F$-bit normalizer of a generic multiplier and the specialization buys nothing on the shift path; only the constant significand multiplier still pays.
- **$C=2^{E_C}$ exactly.** $F_C=0$ collapses the whole significand path — use [[Floating-Point Multiplier by a Power of Two]], where subnormals are handled by exponent arithmetic alone.
- **$\lambda=E_C+1$.** The single boundary case where a shift that was *supposed* not to normalize produces a normal product anyway; the exponent field must be incremented and it is the easiest condition to omit.
- **$C<1$ with correct rounding.** Merged rounding is gone, so the delay advantage of [[Faithful Floating-Point Constant Multiplier]] over a generic multiplier largely evaporates; a post-normalization rounding adder reappears on the critical path.
- **Subnormals flushed to zero.** If the surrounding system runs FTZ — common in FPGA and DSP pipelines — none of this hardware is needed and the operator reduces to the normalized-input baseline. Ask before building it.

**RTL (Spade).**

```spade
/// Leading-zero count of an N-bit significand, 0..N.
fn lzc<#uint N>(x: uint<N>) -> uint<N> {
    x.as_bits().fold(0, fn |acc, b| if b { 0 } else { trunc(acc + 1) })
}

/// Saturated-normalizer front end of a constant multiplier, case C > 1.
/// nx = "is normal" bit, fx = stored fraction, ex = biased exponent E_X + E_0.
/// Returns the significand handed to the constant multiplier, the corrected
/// biased exponent E_R + E_0, and whether that significand is normalized.
entity cmul_subnormal_front<#uint WF, #uint WE, #uint EC>(
    nx: bool,
    fx: uint<WF>,
    ex: uint<WE>,
) -> (uint<{WF + 1}>, int<{WE + 2}>, bool) {
    let m: uint<{WF + 1}> = nx.as_uint().concat(fx);
    let lam: uint<{WF + 1}> = lzc(m);
    let ec: uint<{WF + 1}> = EC;

    // saturating minimum: shift left by lambda' = min(lambda, E_C)
    let lam_s = if lam > ec { ec } else { lam };
    let sig = m << lam_s;

    // E_R + E_0 = (E_X + E_0) - lambda' + E_C, on sfix(w_E, 0) + a guard bit
    let exw: uint<{WE + 2}> = zext(ex);
    // lossless: lambda' <= E_C < 2^{w_E}, so w_E bits always hold it
    let lamw: uint<{WE + 2}> = zext(trunc(lam_s) as uint<WE>);
    let ecw: int<{WE + 2}> = EC;
    let er: int<{WE + 2}> = exw.as_int() -. lamw.as_int() +. ecw;

    (sig, er, lam <= ec)
}
```

`m` is the $n_X+F_X$ bus entering `saturated normalizer` in the diagram, `sig` is the $1.F'_X$ bus leaving it, `lam_s` is $\lambda'$, and `er` is the wire labelled $E_R+E_0$ leaving `+E_C`. All of it is combinational — the block sits between two unregistered datapath stages, so a real pipeline puts the `reg` boundary after `sig`, not inside. The width arithmetic is the one place to be careful: `-.` and `+.` are the *truncating* subtract and add, which is what sfix$(w_E,0)$ plus a guard bit wants, and `trunc(lam_s)` down to $w_E$ bits is lossless only because $\lambda'\le E_C<2^{w_E}$. Synthesis will not build the `lzc` fold as the $N$-deep carry chain it is written as; it maps it to a priority encoder, and on an FPGA the `m << lam_s` barrel shifter collapses to $\lceil\log_2(E_C+1)\rceil$ LUT stages rather than the $\lceil\log_2(w_F+1)\rceil$ the generic type suggests, because the compiler sees $E_C$ as a constant. Verified by compiling a concrete `cmul_front_8_5_3` wrapper instantiating `<8, 5, 3>` and simulating 4008 vectors — eight named (a normal input, the asymmetric pair $F_X=$`8'h01` against `8'h80` which take different branches and so catch a reversed bit order, $\lambda=E_C$ exactly, $\lambda=E_C+1$, and all-zero) plus a 4000-vector random sweep, against a behavioural reference computing $\min(\lambda,E_C)$, the shift and the exponent independently.

**Related Notes**

- [[Saturated Normalizer]] – depends-on: the single block both $C>1$ branches collapse into; its saturation bound is what makes the shift range $E_C$ rather than $w_F$.
- [[Faithful Floating-Point Constant Multiplier]] – extends: this is that baseline plus subnormal support; the $C<1$ case is where it stops being an extension and starts undoing the merged rounding.
- [[Correctly Rounded Floating-Point Constant Multiplier]] – extends: Fig. 15.6 is drawn for the correctly rounded variant, so the multiplier block here is the exact one.
- [[Floating-Point Multiplier by a Power of Two]] – compares: the $F_C=0$ degenerate case, where subnormals cost exponent logic only and no shifter at all.
- [[Product Normalization Predictor]] – supports: supplies the `product normal?` decision that the exponent increment and the 1-bit normalizer both consume.
- [[Floating-Point Multiplier]] – counter-example: the generic operator whose subnormal normalizer must span the full $w_F$, which is the cost this note removes.
- [[Floating-Point Formats]] – depends-on: the $n_X$ / $\lambda$ encoding and the bias $E_0$ come from there.
- [[Choosing a Specialized Floating-Point Operator]] – compares: whether subnormal support is worth its area at all against FTZ.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §15.1.6 "Subnormal Handling", pp. 462–464.
  - §15.1.6.1 "Case $C>1$", p. 462, and Fig. 15.6, p. 463.
  - §15.1.6.2 "Case $C<1$", pp. 463–464.
  - §15.1 "Floating-Point Constant Multiplication", pp. 453–462, for the baseline this extends.
