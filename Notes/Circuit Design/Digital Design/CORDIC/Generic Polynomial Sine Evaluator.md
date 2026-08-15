---
title: Generic Polynomial Sine Evaluator
description: "The lazy option: wrap the generic table-and-DSP polynomial evaluator in a quadrant reduction and a sin/cos select bit - one function per instance, not a fused pair."
kind: circuit
source: "ASA §20.6, p. 620; §18.2.1, pp. 541-543"
status: seed
spade: simulated
tags: [digital, cordic, sine, polynomial, range-reduction, fpga]
aliases:
  - FixSinOrCos
  - Generic Polynomial Sine Evaluator
  - Polynomial Sine/Cosine Evaluator
---

# Generic Polynomial Sine Evaluator

A fixed-point sine *or* cosine operator built by wrapping the general-purpose piecewise-polynomial function evaluator in a two-bit quadrant reduction, so that the only trigonometry left in the hardware is a sign and a conditional bitwise complement.

```tikz title="FixSinOrCos: quadrant reduction, a generic segmented polynomial evaluator, and a one-gate reconstruction"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- input word and its three fields
\node[font=\small] at (-1.1,9.3) {$X$};
\draw[->] (-1.1,9.1) -- (-1.1,8.6);
\node[font=\tiny,anchor=west] at (-0.9,9.3) {sfix$(0,\ell)$, $1-\ell$ bits};
\draw (-2.9,8.0) rectangle (2.9,8.6);
\draw (-2.3,8.0) -- (-2.3,8.6);
\draw (-1.7,8.0) -- (-1.7,8.6);
\node[font=\tiny] at (-2.6,8.3) {$s$};
\node[font=\tiny] at (-2.0,8.3) {$q$};
\node[font=\small] at (0.6,8.3) {$Y\in[0,\tfrac12)$};
\node[font=\tiny,anchor=north west] at (1.4,7.95) {$-\ell-1$ bits};

% ---- control logic
\node[draw,minimum width=4.4cm,minimum height=1.0cm,align=center,font=\tiny]
  (ctl) at (7.2,7.0) {control (2 gates)\\[1pt]
  $\mathrm{compl}=\overline{q\oplus c}$\\[1pt] $\mathrm{neg}=s\oplus(q\wedge\bar c)$};
\draw[->] (-2.6,8.0) -- (-2.6,7.0) -- (5.0,7.0);
\draw[->] (-2.0,8.15) -- (-2.0,7.35) -- (5.0,7.35);
\draw[->] (7.2,8.5) -- (7.2,7.5);
\node[font=\tiny,anchor=west] at (7.35,8.3) {$c=\sin/\overline{\cos}$, 1 bit};

% ---- conditional complement (quadrant reduction)
\node[draw,minimum width=3.4cm,minimum height=0.7cm,font=\small] (xor) at (0.6,6.1) {$\oplus$ row};
\draw[->] (0.6,7.98) -- (xor.north);
\draw[->] (5.0,6.6) -- (3.6,6.6) -- (3.6,6.1) -- (xor.east);
\node[font=\tiny,anchor=south] at (4.3,6.65) {compl};

% ---- reduced argument split for uniform segmentation
\draw[->] (0.6,5.75) -- (0.6,5.3);
\node[font=\tiny,anchor=west] at (0.75,5.55) {$Y'\in[0,\tfrac12)$, $-\ell-1$ bits};
\draw (-2.9,4.7) rectangle (2.9,5.3);
\draw (-1.3,4.7) -- (-1.3,5.3);
\node[font=\small] at (-2.1,5.0) {$A$};
\node[font=\small] at (0.8,5.0) {$Y_p$};
\node[font=\tiny,anchor=north] at (-2.1,4.66) {$\alpha$ bits};
\node[font=\tiny,anchor=north west] at (1.1,4.66) {$-\ell-1-\alpha$ bits};

% ---- Chapter 18 evaluator
\node[draw,minimum width=3.0cm,minimum height=1.1cm,align=center,font=\tiny]
  (tab) at (-2.1,3.1) {coefficient table\\ $2^{\alpha}\times(d{+}1)$ words};
\draw[->] (-2.1,4.68) -- (tab.north);
\node[draw,minimum width=3.4cm,minimum height=1.1cm,align=center,font=\tiny]
  (pev) at (2.2,3.1) {polynomial evaluator\\ (Horner: $d$ mult., $d$ add.)};
\draw[->] (0.8,4.68) -- (0.8,4.05) -| (2.2,3.65);
\draw[->] (tab.east) -- (pev.west);
\node[font=\tiny,anchor=south] at (0.05,3.3) {$C_0\ldots C_d$};

\draw[->] (2.2,2.55) -- (2.2,1.95);
\node[font=\tiny,anchor=west] at (2.35,2.3) {$\sin(\pi Y')\ge 0$, $-\ell+g$ bits};

% ---- reconstruction
\node[draw,minimum width=3.4cm,minimum height=0.7cm,font=\small] (ng) at (2.2,1.6) {$\pm$ negate};
\draw[->] (5.0,6.5) -- (6.1,6.5) -- (6.1,1.6) -- (3.9,1.6);
\node[font=\tiny,anchor=south] at (5.0,1.65) {neg};
\draw[->] (2.2,1.25) -- (2.2,0.6) node[below,font=\small]{$S$ \emph{or} $C$};
\node[font=\tiny,anchor=west] at (2.35,0.9) {sfix$(0,\ell)$, round to $-\ell$ bits};

\node[font=\tiny,align=center] at (2.0,-0.5)
  {one instance computes sine \emph{or} cosine, never both:\\
   an application needing the pair instantiates this twice};
\end{circuitikz}
\end{document}
```

*after Fig. 20.1, p. 600 (the black-box interface) and Fig. 18.10, p. 542 (the uniform-segmentation evaluator it wraps).*

**Buy the operator instead of building it.** The other two architectures in this chapter are trigonometry-specific: [[Unrolled CORDIC]] exists only because $\arctan 2^{-i}$ makes the rotation matrix shift-and-add, and [[Table-and-Multiplier Sine and Cosine]] exists only because the sine series is odd and the cosine series is even. This one is neither. It takes the generic evaluator of [[Polynomial Approximation]] — the one already generated for $\exp$, $\log$, $x^{1/3}$ and anything else with a smooth Taylor expansion — and spends a handful of gates turning it into a sine. The design effort is a wrapper; the error analysis, the coefficient generation and the truncation budget are inherited from the generic operator. That is the whole argument for it, and it is the reason [[FloPoCo]] ships it as `FixSinOrCos` alongside the specialised `FixSinCos` (p. 620).

**Read the sign bit as periodicity, not as a sign.** The input is $X\in\mathrm{sfix}(0,\ell)$, $1-\ell$ bits, representing the angle $\pi X$ (see [[Number Formats]]). Name its two leading bits $s=X_0$ and $q=X_{-1}$, and let $Y$ be the remaining $-\ell-1$ bits, so $Y\in[0,\tfrac12)$ with MSB weight $2^{-2}$. The *unsigned* reading of the same bit vector is
$$U = s + \tfrac{q}{2} + Y,$$
and $U = X + 2s$, so by periodicity (20.2)–(20.3) $\sin \pi U=\sin \pi X$ and $\cos\pi U=\cos\pi X$: two's-complement wraparound *is* the modulo-$2\pi$ reduction, at zero cost. Everything below therefore works on the non-negative $U$, and $s$ is just another quadrant bit.

**Collapse the four quadrants onto one sine.** Applying central symmetry (20.8)–(20.9) $s$ times strips the leading bit, $\sin\pi U=(-1)^{s}\sin\pi(\tfrac q2+Y)$ and likewise for the cosine. Write $\theta=\pi Y\in[0,\pi/2)$. For $q=1$, symmetry about the $y$ axis (20.6)–(20.7) together with (20.10)–(20.11) gives $\sin(\tfrac\pi2+\theta)=\cos\theta$ and $\cos(\tfrac\pi2+\theta)=-\sin\theta$; for $q=0$ nothing happens. So the answer is always $\pm\sin\theta$ or $\pm\cos\theta$, and the last identity needed is symmetry about the main diagonal (20.10), $\cos\theta=\sin(\tfrac\pi2-\theta)=\sin\big(\pi(\tfrac12-Y)\big)$ — which turns a cosine into a sine of the *complemented* argument. One evaluator, one function, four quadrants.

**Two gates carry the whole reconstruction.** Let $c$ be the $\sin/\overline{\cos}$ select bit. A cosine of $\theta$ is needed when $c=1$ and $q=1$ (a sine output in the second quadrant) or when $c=0$ and $q=0$ (a cosine output in the first), i.e. exactly when $q=c$; the negation is $(-1)^s$ for the sine and $(-1)^{s\oplus q}$ for the cosine. Hence
$$\mathrm{compl}=\overline{q\oplus c},\qquad \mathrm{neg}=s\oplus(q\wedge\bar c),$$
two 2-input gates driving a row of $-\ell-1$ XORs and one negation. Compare [[Sine-Cosine Octant Reconstruction]], which must additionally *swap* two datapaths because it produces a pair; here there is only one output word, so there is no swap multiplexer at all.

**The complement is a bitwise complement, and that is a deliberate one-ulp error.** $\overline{Y}=(\tfrac12-2^{\ell})-Y$, not $\tfrac12-Y$: the two's-complement identity $-x=\bar x+1$ says the missing $+1$ would cost a full carry propagation on the critical path, for one ulp of angle. Since $|\tfrac{d}{dY}\sin \pi Y|\le\pi$, that ulp of angle becomes at most $\pi\cdot 2^{\ell-g}$ of output on the guard-bit datapath — below half a final ulp $2^{\ell-1}$ as soon as $g\ge 3$. This is the same accounting as in [[Octant Argument Reduction]]; the negation at the output can be done the same way for the same reason.

**Reducing to a quadrant instead of an octant costs exactly one address bit.** The evaluator uses uniform piecewise splitting (§18.2.1, p. 541): the $\alpha$ leading bits of $Y'$ form an index $A\in\{0\dots 2^\alpha-1\}$ into a table of $2^\alpha$ polynomials, and the remaining $-\ell-1-\alpha$ bits are the offset fed to the [[Horner Evaluation]] chain. By §18.1.4 (p. 535) a degree-$d$ [[Remez Minimax]] approximation on a subinterval of width $h$ has error $\Theta(h^{d+1})$; splitting an interval of length $L$ into $2^\alpha$ pieces gives $h=L2^{-\alpha}$. Doubling $L$ from an octant $[0,\tfrac14)$ to a quadrant $[0,\tfrac12)$ therefore multiplies the approximation error by $2^{d+1}$, and one extra bit of $\alpha$ divides it by exactly the same factor. The whole price of the shallower reduction is a coefficient ROM of twice the depth — and by §18.2.1.1 (p. 542) memory is the knob that scales almost exponentially in $\alpha$ while the arithmetic stays fixed, so this is a memory-side payment, not a multiplier-side one.

**On FPGA the evaluator lands where CORDIC does not.** The coefficient table is [[Block Memory]] and the Horner chain is [[DSP Blocks]], so the operator consumes almost no logic — the exact opposite of unrolled CORDIC, which is all logic and carry chain. Because block RAM comes in fixed granules, a larger $\alpha$ than the accuracy constraint demands is frequently free, which is the same effect that makes the octant table cheap in [[Table-and-Multiplier Sine and Cosine]]. On ASIC the coefficient store is a synthesised ROM whose area really is proportional to $2^\alpha(d+1)$ words, so the balance tips back toward higher degree and fewer segments.

> [!note]
> §18.2.1.4 (p. 544) plots the coefficients $C_0\ldots C_3$ of a 24-bit degree-3 approximation to $\sin(\tfrac\pi2 x)$ and observes they are smooth enough that *all* of them could be recomputed from the $C_0$ table alone, using $\sin(a+b)=\sin a\cos b+\cos a\sin b$ with $a=\tfrac\pi2 2^{-\alpha}A$ and $b=\tfrac\pi2 2^{-\alpha}Y$. Carry that observation to its conclusion and the generic evaluator turns back into [[Table-and-Multiplier Sine and Cosine]]. The two architectures in this chapter are the same idea approached from opposite ends.

$$\boxed{\ \mathrm{FixSinOrCos}(X,c)=(-1)^{\,s\,\oplus\,(q\wedge\bar c)}\ \sin\!\big(\pi Y'\big),\qquad Y'=\begin{cases}\overline{Y}, & q=c\\[2pt] Y, & q\neq c\end{cases}\ }$$

with $s=X_0$, $q=X_{-1}$, $Y$ the low $-\ell-1$ bits of $X$, and $c=1$ selecting the sine.

**When it breaks.**

- **You need both functions.** One instance produces one word. A rotation, a DDS quadrature pair or a complex multiply needs two instances — two coefficient ROMs, two Horner chains, twice the DSPs — where CORDIC and the table-and-multiplier architecture each hand you the pair from one datapath. This is the single reason to pick something else; see [[Choosing a CORDIC Architecture]].
- **The endpoint $X=-1$.** It maps to $s=1,q=0,Y=0$, so the cosine path complements to $Y'=\tfrac12-2^{\ell}$ and negates, giving $-(1-2^{\ell})$ rather than $-1$. That value only exists because of the $(1-2^{\ell})$ output scaling; without it the correctly rounded $\cos(-\pi)=-1$ would be the one point of the domain the format cannot hold. See [[Error Accuracy]].
- **Large $\ell$.** $\alpha$ grows with precision and the ROM with $2^\alpha$; past the point where the table stops fitting in block memory the operator degrades sharply, while CORDIC degrades quadratically and smoothly.
- **Small $\ell$.** Below a few bits the correct architecture is a plain table over the whole quadrant, and the wrapper's two gates are the entire remaining circuit.

> [!warning] Not covered in the source — needs outside research
> §20.7 (p. 620) lists this architecture in its comparison with no concrete cost at all: it defers to "Chap. 18 costs" for logic, DSP, BRAM, latency and guard bits alike. The book gives no worked $\alpha$, no degree $d$, and no measured LUT/DSP figure for sine on a quadrant, and the [DIS13] comparison it does report covers only CORDIC versus table-and-multiplier. Any number for this operator has to come from running `flopoco FixSinOrCos` and reading the report.

**RTL (Spade).** The wrapper is the note; the evaluator itself belongs to [[Polynomial Approximation]] and enters here as the port `sinq`.

```spade
/// FixSinOrCos wrapper: quadrant argument reduction + output reconstruction
/// around a generic polynomial evaluator that returns sin(pi*Y') on [0,1/2).
///   x     : sfix(0, l), W = 1 - l bits, MSB = sign
///   sincos: 1 = sine, 0 = cosine
///   sinq  : the Chap. 18 evaluator's result, sfix(0, l), non-negative
/// returns (Y' fed to the evaluator, reconstructed result)
entity fix_sin_or_cos<#uint W>(
    x: int<W>,
    sincos: bool,
    sinq: int<W>,
) -> (uint<{W - 2}>, int<W>) {
    let s = x.sign_bit();
    let low: uint<{W - 1}> = trunc(x.as_uint());
    let q = low.msb();
    let y: uint<{W - 2}> = trunc(low);

    let yprime = if q == sincos { ~y } else { y };
    let neg = s ^^ (q && !sincos);

    (yprime, if neg { -sinq } else { sinq })
}
```

`s` and `q` are the two leading wires of the input word in the diagram, `y` the remaining $W-2=-\ell-1$; `~y` is the XOR row and `-sinq` the negate block, and both control bits come from the two gates on the right. Nothing is registered — the whole wrapper is one XOR row plus one adder deep, which is why it disappears into the pipeline stages the evaluator already needs. Synthesis will not build a real negater: `-sinq` in front of a multiplexer becomes an XOR row with the carry-in of the evaluator's final adder folded in, exactly the trick the complement uses on the input side.

Simulated at $W=17$ ($\ell=-16$) against a behavioural evaluator driven from the DUT's own `yprime` output, and checked against `$sin`/`$cos` of $\pi X$: 17 named vectors (quadrant boundaries, $\pm1$, one-ulp arguments) plus 3000 random $(X,c)$ pairs, all within 6 ulp of the scaled reference. Flipping `q == sincos` to `q != sincos` fails 3012 of them, and dropping the `!` from `!sincos` fails 1481 — the vectors do discriminate.

**Related Notes.**

- [[Choosing a CORDIC Architecture]] – compares: the row where "computes sin *or* cos, so ×2 for both" decides against this one.
- [[Polynomial Approximation]] – depends-on: supplies the entire evaluator this note wraps, coefficients, error budget and all.
- [[Horner Evaluation]] – depends-on: the $d$-multiplier chain inside the evaluator block.
- [[Remez Minimax]] – supports: fixes the degree needed on a quadrant-wide interval.
- [[Range Reduction]] – extends: this is the trigonometric special case of the generic reduction, using symmetries instead of a division.
- [[Octant Argument Reduction]] – compares: one more bit of reduction, in exchange for a table half the depth.
- [[Sine-Cosine Octant Reconstruction]] – compares: reconstructs a *pair*, so it needs a swap as well as a negate.
- [[Table-and-Multiplier Sine and Cosine]] – counter-example: the same polynomial idea specialised to trigonometry, which the coefficient plots of §18.2.1.4 show is the limit of compressing this one's tables.
- [[FloPoCo]] – supports: `flopoco FixSinOrCos` generates it; `flopoco FixSinCos` generates the fused alternative.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §20.1, Fig. 20.1 and identities (20.2)–(20.11), pp. 599–601 — black-box interfaces and the symmetries used by the reconstruction.
  - §20.3, Fig. 20.5–20.6, pp. 605–606 — argument reduction and the bitwise-complement shortcut.
  - §20.6, p. 620 — the `FixSinOrCos` wrapper: quadrant-only reduction, the $\sin/\overline{\cos}$ input bit.
  - §20.7, pp. 620–621 — comparison, and the hands-on `flopoco` invocations.
  - §18.1.4, p. 535 — degree/interval-width versus accuracy.
  - §18.2.1 and §18.2.1.1, Figs. 18.8–18.10, pp. 541–542 — uniform segmentation, the coefficient table, the memory/arithmetic trade-off in $\alpha$.
  - §18.2.1.4, Figs. 18.11–18.12, pp. 544–545 — coefficient smoothness and the sine-specific compression.
