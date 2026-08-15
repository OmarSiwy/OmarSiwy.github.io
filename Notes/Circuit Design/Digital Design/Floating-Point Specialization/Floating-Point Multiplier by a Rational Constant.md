---
title: "Floating-Point Multiplier by a Rational Constant"
description: "An exclusion-zone theorem fixes the truncation width of A/B at w_F+1+ceil(log2 B), making correctly rounded multiplication by 1/3 or 3/10 cheap."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-specialization]
aliases:
  - Rational Constant Multiplier
  - Multiplication by a Rational Constant
  - Correct Rounding of Multiplication by a Rational Constant
  - Theorem 15.1
---

# Floating-Point Multiplier by a Rational Constant

A correctly rounded multiplier by $C=A/B$ with $A,B$ small integers, whose only unusual parameter — the number of bits of $A/B$ that must be kept — is given in closed form by a parity argument instead of being searched for numerically.

```tikz title="Exclusion zone around a midpoint, and the constant truncation width it fixes"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- upper panel: the exclusion zone on the real axis ----------
\fill[gray!25] (3.6,6.05) rectangle (5.4,6.55);
\draw[->] (-0.4,6.3) -- (11.2,6.3) node[right,font=\small] {$\mathbb{R}$};
\foreach \x in {0,3,6,9}      \draw[thick] (\x,6.05) -- (\x,6.55);
\foreach \x in {1.5,4.5,7.5}  \draw[dashed] (\x,6.0) -- (\x,6.6);
\draw[<->] (3.6,6.9) -- (5.4,6.9);
\node[font=\tiny,anchor=south,align=center] at (4.5,6.95)
  {exclusion zone,\\ radius $1/(2^{w_F+1}B)$};
% the exact product and its truncated-constant approximation
\draw[fill=black] (7.0,6.3) circle (1.3pt);
\draw[fill=black] (7.3,6.3) circle (1.3pt);
\draw (7.15,6.55) -- (7.8,7.45);
\node[font=\tiny,anchor=west,align=left] at (7.85,7.5)
  {$\bullet\ \tfrac{A}{B}X$ exact \qquad $\bullet\ \widetilde P=\lfloor A/B\rfloor_{-K}X$\\
   error $<2^{-K}\le 1/(2^{w_F+1}B)$\\
   $\Rightarrow$ both on the same side of $M$, same rounding};
% legend, stacked below the axis
\draw[thick] (0,5.55) -- (0,5.85);
\node[font=\tiny,anchor=west] at (0.2,5.7) {float of precision $w_F$, spacing $2^{-w_F}$};
\draw[dashed] (0,5.05) -- (0,5.35);
\node[font=\tiny,anchor=west] at (0.2,5.2) {midpoint $M=(2J+1)/2^{w_F+1}$};

% ---------- lower panel: the datapath the theorem sizes ----------
\node[font=\small,anchor=west] at (-0.4,4.15) {\textbf{the width the theorem fixes}};
\node[draw,minimum width=2.6cm,minimum height=0.9cm,align=center] (rom) at (1.2,2.5)
  {$\lfloor A/B\rfloor_{-K}$\\{\tiny synthesis-time constant}};
\node[font=\tiny,anchor=north,align=center] at (1.2,1.85)
  {$K=w_F+1+\lceil\log_2 B\rceil$ bits};
\node[draw,minimum width=3.0cm,minimum height=0.9cm,align=center] (cm) at (5.5,2.5)
  {constant multiplier\\{\tiny shift-and-add / KCM}};
\node[draw,minimum width=2.8cm,minimum height=0.9cm,align=center] (rn) at (9.7,2.5)
  {1-bit norm.\\$+$ round to nearest};
\draw[->] (rom.east) -- node[above,font=\tiny]{$K$} (cm.west);
\draw[->] (cm.east) -- node[above,font=\tiny]{$K+w_F$} node[below,font=\tiny]{exact} (rn.west);
\draw[<-] (cm.north) -- ++(0,0.8) node[right,font=\tiny]{$w_F$: significand of $X$};
\draw[->] (rn.south) -- node[right,font=\tiny]{$w_F+1$} ++(0,-0.8)
  node[below,font=\tiny,align=center]{correctly rounded,\\$0.5$ ulp};
\draw[->] (rn.north) -- ++(0,0.8) node[right,font=\tiny]{$\pm1$ to $E_R$};
\node[font=\tiny,anchor=west,align=left] at (-0.4,0.35)
  {No sticky bit and no tie logic: $2AI-(2J+1)B$ is even $-$ odd, hence never $0$.};
\end{circuitikz}
\end{document}
```

**Reduce an infinite constant to a finite one, and the whole design collapses to one number.** $A/B$ has an infinite binary expansion whenever $B$ is not a power of two, so no multiplier can hold it; the operator must use $\widetilde C_K=\lfloor A/B\rfloor_{-K}$, the expansion truncated after $K$ bits, and every other block — the constant multiplier of [[Multiplication by Constants]], the 1-bit normalizer, the rounding step — is then exactly the architecture of the [[Correctly Rounded Floating-Point Constant Multiplier]]. Only $K$ is new. For a generic irrational constant $K$ is not available in closed form at all: it comes from exhausting all $2^{w_F}$ input fractions to find the closest approach $\bar\delta$ of any product to a midpoint, and lands near $K\approx 2w_F+1$ (p. 460). Theorem 15.1 says that for a rational constant you may skip the enumeration and read $K$ off $B$.

**Put the product and a midpoint over a common denominator.** Normalize by powers of two — legitimate because scaling $X$, $A$ or $B$ by $2^{\pm1}$ only moves the exponent, which the [[Floating-Point Multiplier by a Power of Two]] path handles for free — so that $X\in[1/2,1)$ and $A,B$ are both odd. Write $X=I/2^{w_F}$ with $I$ an integer on $w_F$ bits, and let $M=(2J+1)/2^{w_F+1}$ be a midpoint of the result format, $J$ integral ([[Rounding]] fixes what "midpoint" means; [[Number Formats]] fixes the grid). Then

$$\left|\frac{A}{B}X-M\right|=\left|\frac{A}{B}\cdot\frac{I}{2^{w_F}}-\frac{2J+1}{2^{w_F+1}}\right|=\left|\frac{2AI-(2J+1)B}{2^{w_F+1}B}\right|$$

by cross-multiplying both fractions onto the denominator $2^{w_F+1}B$.

**Bound the numerator away from zero by parity, not by size.** $2AI$ is even. $(2J+1)B$ is a product of two odd integers, hence odd — this is where $B$ odd is load-bearing, and it is the only place it is used. An even integer minus an odd integer is odd, so the numerator is a nonzero integer and $|2AI-(2J+1)B|\ge 1$. Therefore

$$\left|\frac{A}{B}X-M\right|\ \ge\ \frac{1}{2^{w_F+1}B}$$

for *every* input $X$ and *every* midpoint $M$. An open ball of that radius around each midpoint contains no exact product: an **exclusion zone**. Note what is proved — not that products are far from midpoints on average, but that they are uniformly far, with no enumeration.

**Turn the exclusion radius into a truncation width.** Rounding to nearest is a function of which side of the nearest midpoint a value falls on, so any approximation $R$ with $|R-\tfrac{A}{B}X|<2^{-w_F-1}/B$ cannot cross a midpoint and rounds to the same float as the exact product. Truncation error of the constant is $|\widetilde C_K-A/B|<2^{-K}$, amplified by $X<1$ to at most $2^{-K}$ in the product, so it suffices that $2^{-K}\le 2^{-w_F-1}/B$, i.e. $K\ge w_F+1+\log_2 B$. Rounding that up to an integer gives the theorem. The multiplication $\widetilde C_K\times I$ must then be carried **exactly** on $K+w_F$ bits — no internal truncation is permitted, because the whole error budget has already been spent on the constant.

**What the theorem deletes is the sticky path and the search.** The exclusion zone rules out exact ties as a special case ($R=M$ would need $|R-\tfrac{A}{B}X|\ge 2^{-w_F-1}/B$), so round-to-nearest-ties-to-even and ties-to-away coincide and no sticky bit, no tie anticipation, no [[Pseudo-Sticky Tie Anticipation]] is needed — a single injected rounding bit in the constant multiplier's bit heap decides everything. And the cost is dramatically below the irrational case: for binary32 ($w_F=23$) and $B=3$, $K=23+1+2=26$ bits against $k\approx 2w_F+1=47$ for a real constant, and since constant multiplication is sublinear in constant size [DIZ07] the area gap is wider still.

**On an FPGA the saving compounds.** The $\times\widetilde C_K$ core is a shift-and-add graph or KCM built from LUTs and the fast carry chain rather than a DSP block ([[FPGAs]]), so halving $K$ removes adders from a graph whose depth is already logarithmic; on an ASIC the same halving mostly buys partial-product rows in a compressor tree. Either way the exponent path is untouched — it is still one add of $E_C$ plus the $\pm1$ from the normalizer.

**The floating-point case is a corollary, and a vacuous one.** A float constant is the rational $A/2^k$, for which $\lceil\log_2 B\rceil=k$ and the theorem returns $K=w_F+1+k$ — exactly the full width of the exact significand product. It says only "compute the product exactly", which was already obvious (p. 462). The theorem earns its keep only when $B$ is an odd integer that is *not* a power of two: $1/3$ for 1-D stencils, $3/10$, $1/5$.

$$\boxed{\ K \;=\; w_F+1+\lceil\log_2 B\rceil \quad\text{bits of } A/B \ \Longrightarrow\ \circ\big(\lfloor A/B\rfloor_{-K}X\big)=\circ\!\left(\tfrac{A}{B}X\right)\ }$$

**When it breaks.**

- $B$ even. The parity step fails outright; factor $B=2^{e}B_{\text{odd}}$ first and send $2^{-e}$ to the exponent adder.
- $B$ large. $K$ only grows like $\log_2 B$, but the shift-and-add graph for $\lfloor A/B\rfloor_{-K}$ grows with the *bit pattern* of the quotient, not with $K$; a "small rational" with a 40-bit numerator is not cheap merely because the theorem is satisfied.
- The theorem sizes the constant and nothing else. It says nothing about subnormals — that is [[Constant Multiplier with Subnormal Support]] — and nothing about the normalization decision, which still needs the [[Product Normalization Predictor]].
- It is a *sufficient* width, not a tight one. A given $A/B$ may round correctly at fewer bits; the theorem is the bound you use when you do not want to run the enumeration.
- If faithful ($1$ ulp) rounding is acceptable, none of this applies and $K=w_F+1$ suffices — see the [[Faithful Floating-Point Constant Multiplier]]. Correct rounding is the requirement that makes the theorem worth having.

**RTL (Spade).** One instance of the significand path: $w_F=8$, $C=2/3$, so $B=3$, $K=8+1+\lceil\log_2 3\rceil=11$, and $\widetilde C_K=\lfloor 2^{11}\cdot 2/3\rfloor=1365$.

```spade
// w_F = 8, C = A/B = 2/3 (B = 3 odd)
// K = w_F + 1 + ceil(log2 B) = 8 + 1 + 2 = 11
// CQ = floor(2^K * 2/3) = 1365
entity rat_mul_core(ix: uint<8>) -> (uint<9>, bool) {
    let cq: uint<11> = 1365;
    let x: uint<11> = zext(ix);
    let p: uint<22> = cq * x;

    let norm: bool = p >= 262144;

    let ir: uint<9> = if norm {
        trunc((p + 1024) >> 11)
    } else {
        trunc((p + 512) >> 10)
    };
    (ir, norm)
}
```

`cq` is the `⌊A/B⌋₋K` block of the diagram, `p` the exact $K+w_F=19$-bit product carried on `uint<22>` because Spade's `*` doubles the operand width. `norm` is the 1-bit normalizer's decision, taken on the truncated product; `ir` is the $w_F+1$-bit rounded significand, and the added `1024`/`512` is the injected rounding bit — half-up, which is safe precisely because the exclusion zone forbids ties. Everything is combinational, and synthesis will not build the `*`: with one operand a literal it degenerates to the three-addend shift-and-add graph for $0.10101010101_2$, which is the whole point of the note.

Simulated against an exact integer reference for $\circ\!\left(\tfrac{2}{3}X\right)$ over all 128 legal significands plus a 3000-vector random sweep — 3137 vectors, zero mismatches, including $I_X=192$ where $\tfrac{2}{3}X=\tfrac12$ exactly and the truncated product falls on the *low* side of the binade boundary: the normalizer then disagrees with the exact one, and the represented value is still bit-for-bit correct.

**Related Notes.**

- [[Correctly Rounded Floating-Point Constant Multiplier]] – extends: this is that architecture with $K$ supplied in closed form instead of by exhaustive search for $\bar\delta$.
- [[Faithful Floating-Point Constant Multiplier]] – compares: the $1$ ulp baseline, $K=w_F+1$, from which the extra $\lceil\log_2 B\rceil$ bits buy correct rounding.
- [[Multiplication by Constants]] – depends-on: supplies the shift-and-add or KCM core that consumes $\lfloor A/B\rfloor_{-K}$.
- [[Division by Constants]] – supports: the fixed-point rational machinery of Sect. 12.4 that the floating-point wrapper is built over.
- [[Rounding]] – depends-on: the midpoint/exclusion-zone language the proof is written in.
- [[Floating-Point Divider by a Small Odd Constant]] – compares: the same parity trick used to prove no tie can occur, but with the constant in the denominator.
- [[Pseudo-Sticky Tie Anticipation]] – counter-example: the tie-handling hardware a float constant needs and a genuine rational constant provably does not.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where this variant sits on the area-versus-accuracy table.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §15.1.5 "Correct Rounding of the Floating-Point Multiplication by a Rational Constant", Theorem 15.1 and proof, pp. 461–462.
- §15.1.4 "…by a Real Constant", Fig. 15.5 and the $k\approx 2w_F+1$ estimate, pp. 459–460 — the enumeration this theorem replaces.
- §15.1.2 baseline faithful multiplier, pp. 455–457; §15.1.3 correctly rounded by a float constant, pp. 457–459; §15.1.6 subnormals, pp. 462–464.
- Cross-referenced by the chapter: Sect. 12.4 (fixed-point multiplication by a rational), Sect. 12.3.2 (shift-and-add graphs), Sect. 11.2.2 (sticky computation).
- [DIZ07] Dimitrov, Imbert, Zakaluzny, "Multiplication by a Constant is Sublinear", *ARITH* 2007, pp. 261–268 — cited p. 460. [Mul+18] Muller et al., *Handbook of Floating-Point Arithmetic* — source of the exclusion lemma the theorem generalizes, cited p. 461.
