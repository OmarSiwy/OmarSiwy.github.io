---
title: "Table-and-Multiplier Sine and Cosine"
description: "Split the octant angle into a table-addressed head and a tiny tail recombined by the addition formula: three logic levels instead of a chain of -l+2 adders, and g=4 whatever the precision."
kind: circuit
source: "ASA §20.5, pp. 614-620"
status: seed
spade: simulated
tags: [digital, cordic, sine, table, multiplier, fixed-point, fpga]
aliases:
  - Table-Based Sine and Cosine
  - DSP- and Table-Based Sine and Cosine
  - Second Argument Reduction
  - FixSinCos
---

# Table-and-Multiplier Sine and Cosine

A fixed-point $\sin/\cos$ operator that splits the octant angle a second time, looks the large part up in a table and folds the small part back in with the angle-addition formula — so its critical path is three logic levels deep instead of the $-\ell+2$ dependent additions a rotation-based engine needs, and its guard-bit count is a constant $4$ at every precision.

```tikz title="Table-and-multiplier sine/cosine: second argument reduction, two tables, four truncated multipliers, two bit heaps"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- Fig. 20.10 : the second argument reduction, as a bit field ----------
\node[anchor=east,font=\small] at (0.45,7.9) {$X=\boldsymbol{.}$};
\draw (0.5,7.62) rectangle (1.1,8.18) node[midway,font=\tiny] {$s$};
\draw (1.1,7.62) rectangle (1.7,8.18) node[midway,font=\tiny] {$q$};
\draw (1.7,7.62) rectangle (2.3,8.18) node[midway,font=\tiny] {$o$};
\draw[fill=black!8] (2.3,7.62) rectangle (5.3,8.18) node[midway,font=\tiny] {$A$};
\draw[fill=black!4] (5.3,7.62) rectangle (12.6,8.18) node[midway,font=\tiny] {$Y_\mathrm{red}\in[0,2^{-2-\alpha})$};
\draw[<->] (2.3,8.5) -- (5.3,8.5);
\node[anchor=south,font=\tiny] at (3.8,8.52) {$\alpha>-\tfrac{\ell}{4}-1$ bits};
\draw[<->] (5.3,8.5) -- (12.6,8.5);
\node[anchor=south,font=\tiny] at (8.95,8.52) {$-\ell-2-\alpha$ bits};
\node[anchor=west,font=\tiny] at (12.75,7.9) {$Y'=.\,00\,A\,Y_\mathrm{red}$};

% ---------- tables ----------
\node[draw,minimum width=3.0cm,minimum height=0.9cm,align=center,font=\tiny] (tab) at (3.8,6.55)
  {ROM: $\sin\pi A$, $\cos\pi A$\\ $2^{\alpha}$ entries, $2(-\ell+g)$ bits wide};
\draw[->] (3.8,7.62) -- (tab.north);
\node[draw,minimum width=1.8cm,minimum height=0.6cm,font=\tiny] (pi) at (8.95,6.70) {$\times\,\pi$};
\draw[->] (8.95,7.62) -- (pi.north) node[midway,right,font=\tiny] {$[-\alpha-2,\ \ell]$};
\node[draw,minimum width=1.5cm,minimum height=0.55cm,font=\tiny] (sq) at (7.6,5.45) {$Z^2/2$};
\node[draw,minimum width=1.5cm,minimum height=0.55cm,font=\tiny] (cu) at (10.6,5.45) {$Z^3/6$};
\draw (pi.south) -- (8.95,6.05);
\draw (7.6,6.05) -- (12.2,6.05);
\draw[->] (7.6,6.05) -- (sq.north);
\draw[->] (10.6,6.05) -- (cu.north);
\node[anchor=south,font=\tiny] at (7.75,6.10) {$Z$, $[-\alpha,\ \ell-g]$};
\node[draw,circle,inner sep=1.2pt,font=\tiny] (mi) at (12.2,4.95) {$-$};
\draw[->] (12.2,6.05) -- (mi.north);
\draw[->] (11.35,5.45) -- (11.75,5.45) -- (11.75,4.95) -- (mi.west);

% ---------- four horizontal buses ----------
\draw (1.0,4.72) -- (10.5,4.72);
\draw (3.2,6.10) -- (3.2,4.72);
\draw (4.0,4.32) -- (9.5,4.32);
\draw (4.4,6.10) -- (4.4,4.32);
\draw (2.0,3.92) -- (8.5,3.92);
\draw (7.6,5.17) -- (7.6,3.92);
\draw (5.0,3.52) -- (12.2,3.52);
\draw (12.2,4.75) -- (12.2,3.52);
\fill (3.2,4.72) circle (1.3pt);
\fill (4.4,4.32) circle (1.3pt);
\fill (7.6,3.92) circle (1.3pt);
\fill (12.2,3.52) circle (1.3pt);
\node[anchor=south,font=\tiny] at (6.15,4.74) {$\sin\pi A$};
\node[anchor=south,font=\tiny] at (8.60,4.34) {$\cos\pi A$};
\node[anchor=south,font=\tiny] at (2.95,3.94) {$Z^2/2$};
\node[anchor=south,font=\tiny] at (6.15,3.54) {$Z-Z^3/6$};

% ---------- truncation boxes, one row above the multipliers ----------
\foreach \x/\y in {1.0/4.72, 2.0/3.92, 4.0/4.32, 5.0/3.52, 7.5/4.32, 8.5/3.92, 10.5/4.72, 11.5/3.52}{
  \draw (\x,\y) -- (\x,3.34);
  \draw[fill=white] (\x-0.11,3.12) rectangle (\x+0.11,3.34) node[midway,font=\tiny] {T};
  \draw[->] (\x,3.12) -- (\x,3.00);
}

% ---------- four truncated multipliers ----------
\node[draw,minimum width=1.7cm,minimum height=0.6cm,font=\tiny] (m1) at (1.5,2.70) {$\times$};
\node[draw,minimum width=1.7cm,minimum height=0.6cm,font=\tiny] (m2) at (4.5,2.70) {$\times$};
\node[draw,minimum width=1.7cm,minimum height=0.6cm,font=\tiny] (m3) at (8.0,2.70) {$\times$};
\node[draw,minimum width=1.7cm,minimum height=0.6cm,font=\tiny] (m4) at (11.0,2.70) {$\times$};
\node[anchor=north,font=\tiny] at (1.5,2.34) {$\sin\!\pi A\cdot Z^2/2$};
\node[anchor=north,font=\tiny] at (4.5,2.34) {$\cos\!\pi A\cdot(Z{-}Z^3/6)$};
\node[anchor=north,font=\tiny] at (8.0,2.34) {$\cos\!\pi A\cdot Z^2/2$};
\node[anchor=north,font=\tiny] at (11.0,2.34) {$\sin\!\pi A\cdot(Z{-}Z^3/6)$};

% ---------- bit heaps ----------
\node[draw,fill=black!5,minimum width=4.6cm,minimum height=0.55cm,font=\tiny] (h1) at (3.0,1.30)
  {sine bit heap $+$ CPA: $\sin\pi A-\square+\square$};
\node[draw,fill=black!5,minimum width=4.6cm,minimum height=0.55cm,font=\tiny] (h2) at (9.5,1.30)
  {cosine bit heap $+$ CPA: $\cos\pi A-\square-\square$};
\draw[->] (1.5,1.90) -- (1.5,1.58);
\draw[->] (4.5,1.90) -- (4.5,1.58);
\draw[->] (8.0,1.90) -- (8.0,1.58);
\draw[->] (11.0,1.90) -- (11.0,1.58);
\draw[->] (3.2,4.72) -- (2.7,4.72) -- (2.7,1.58);
\draw[->] (9.5,4.32) -- (9.5,1.58);

% ---------- reconstruction ----------
\node[draw,minimum width=6.0cm,minimum height=0.55cm,font=\tiny] (sw) at (6.25,0.28) {Swap / negate, then round to $-\ell+1$ bits};
\draw[->] (3.0,1.02) -- (3.0,0.56) node[midway,left,font=\tiny] {$-\ell+g$};
\draw[->] (9.5,1.02) -- (9.5,0.56) node[midway,right,font=\tiny] {$-\ell+g$};
\draw[->] (1.7,7.62) -- (0.2,7.62) -- (0.2,0.28) -- (3.25,0.28) node[midway,above,font=\tiny] {$s,q,o$};
\draw[->] (4.75,0.00) -- (4.75,-0.48) node[below,font=\tiny] {$\sin\pi X$};
\draw[->] (7.75,0.00) -- (7.75,-0.48) node[below,font=\tiny] {$\cos\pi X$};
\node[anchor=north west,font=\tiny,align=left] at (0.2,-0.98)
  {Three logic levels --- table, multiplier, heap --- and $g=4$ whatever $\ell$ is.\\
   Formats as $[\,$MSB weight, LSB weight$\,]$, Table 20.2: $\ Y_\mathrm{red}\ [-\alpha-2,\ \ell]$; $\ Z$ and $Z-Z^3/6\ [-\alpha,\ \ell-g]$;\\
   $Z^2/2\ [-2\alpha-1,\ \ell-g]$; $\ Z^3/6\ [-3\alpha-2,\ \ell-g]$; $\ \sin\pi A$ and $\cos\pi A\ [0,\ \ell-g]$.\\
   T is a truncation to the width Table 20.3 gives: $\sin\pi A$ to $\ell-g+2\alpha+1$ ahead of $Z^2/2$, to $\ell-g+\alpha$ ahead of $Z-Z^3/6$.};
\end{circuitikz}
\end{document}
```

*after Fig. 20.10, p. 615 and Fig. 20.11, p. 617*

**Cut the angle a second time, because a table indexed by the whole octant is exponentially too big.** Upstream, [[Octant Argument Reduction]] has already delivered $Y'\in[0,\tfrac14)$ in $-\ell-2$ bits with LSB weight $2^{\ell}$, together with the three bits $s,q,o$ that will reconstruct the full circle. Tabulating $\sin(\pi Y')$ directly would need $2^{-\ell-2}$ entries — hopeless past a dozen bits, which is the whole motivation for [[Table-Based Function Evaluation]] and its multipartite descendants. So split $Y'$ once more into its $\alpha$ leading bits $A$ and the remainder $Y_\text{red}$:

$$Y'=.\,00\;\underbrace{A}_{\alpha\ \text{bits}}\;\underbrace{Y_\text{red}}_{-\ell-2-\alpha\ \text{bits}},\qquad Y_\text{red}\in[0,2^{-2-\alpha}) .$$

$A$ is an $\alpha$-bit unsigned index with weight $2^{-2-\alpha}$ per step, so $\pi A$ ranges over $2^{\alpha}$ angles evenly spaced in $[0,\tfrac\pi4)$; $Y_\text{red}$ carries the same LSB weight $2^{\ell}$ as $Y'$ did. The table now holds $2^{\alpha}$ entries of $2(-\ell+g)$ bits — one $\sin\pi A$ and one $\cos\pi A$ per address, each at the intermediate precision $2^{\ell-g}$ discussed below.

**Recombine with the rotation formula, which is the one identity that turns a split argument back into a product of tabulated values.** By the sine and cosine addition formulas applied to $\pi Y'=\pi A+Z$ with $Z=\pi Y_\text{red}$,

$$\sin(\pi Y')=\sin(\pi A)\cos Z+\cos(\pi A)\sin Z,\qquad \cos(\pi Y')=\cos(\pi A)\cos Z-\sin(\pi A)\sin Z .\tag{20.44--20.45}$$

Nothing has been approximated yet; the split is exact, and the only new operator so far is the constant multiplier $\times\pi$ that turns the binary angle $Y_\text{red}$ into the radian angle $Z$ — see [[Multiplication by Constants]] for why a constant is cheaper than a general multiplier. What has changed is that $Z$ is *small*: $Z<3.15\cdot 2^{-2-\alpha}<2^{-\alpha}$, so its sine and cosine are the cheapest functions in the chapter to approximate.

**Use Taylor, not minimax, because the parity of the series buys back half the multiplications.** [[Polynomial Approximation]] would normally beat a truncated Taylor series at equal degree, but here two structural facts reverse the verdict. The sine series is odd and the cosine series is even, so a degree-$d$ approximation of either contains only $\lceil d/2\rceil$ terms and therefore half the multiplications a general degree-$d$ polynomial would need. And up to degree $4$ the coefficients are $1$, $\tfrac12$ and $\tfrac16$: powers of two are free wiring, and the single division by $3$ hidden in $\tfrac16$ is a [[Division by Constants]] shift-and-add. Truncating both series after two terms,

$$\sin Z\approx Z-\frac{Z^3}{6},\qquad \cos Z\approx1-\frac{Z^2}{2}.\tag{20.46--20.47}$$

**Factor the $1$ out of $\cos Z$, and a full-width multiplier collapses into a small one plus an addition.** Substituting (20.47) naively would produce $\sin(\pi A)\times\cos Z$: a product of two operands that both span the full $-\ell+g$ bits. But $\cos Z$ is within $2^{-2\alpha-1}$ of $1$, so by distributivity

$$\sin(\pi A)\times\left(1-\frac{Z^2}{2}\right)=\sin(\pi A)-\sin(\pi A)\times\frac{Z^2}{2},$$

and the surviving multiplier sees an operand whose MSB sits at weight $2^{-2\alpha-1}$ rather than $2^{0}$ — it is $2\alpha+1$ bits narrower, and the subtraction it costs is a free column in a bit heap that already exists. It is the same move [[Truncated Multipliers]] generalise: never build the bits of a product that cannot influence the result. Applying it to both formulas gives the architecture drawn above,

$$\sin(\pi Y')\approx\sin(\pi A)-\sin(\pi A)\frac{Z^2}{2}+\cos(\pi A)\left(Z-\frac{Z^3}{6}\right)\tag{20.48}$$
$$\cos(\pi Y')\approx\cos(\pi A)-\cos(\pi A)\frac{Z^2}{2}-\sin(\pi A)\left(Z-\frac{Z^3}{6}\right)\tag{20.49}$$

— four multipliers, two tables, and everything else summed once in a pair of [[Bit Heaps]].

**Size $\alpha$ from the Taylor remainder, and the table turns out to need only a quarter of the input bits.** The neglected terms are the first ones dropped from each series,

$$\delta_{\text{Taylor}(\cos)}=\cos Z-\left(1-\tfrac{Z^2}{2}\right)\approx\tfrac{Z^4}{24},\qquad \delta_{\text{Taylor}(\sin)}=\sin Z-\left(Z-\tfrac{Z^3}{6}\right)\approx\tfrac{Z^5}{120}.$$

With $Z<2^{-\alpha}$ these are bounded by $2^{-4\alpha}/24<2^{-4\alpha-4}$ and $2^{-5\alpha}/120<2^{-5\alpha-6}$, the cosine term dominating. In (20.44)–(20.45) each is multiplied by a sine or a cosine, both bounded by $1$ in absolute value, so **the approximation error is not amplified by the recombination** — that is the property that makes this split safe, and it is not automatic: a reduction that multiplied the tail by a large factor would have to size $\alpha$ against that factor too. Demanding the dominant remainder stay below half an ulp of the result, $2^{-4\alpha-4}<2^{\ell}$, gives

$$\alpha>-\frac{\ell}{4}-1.\tag{20.52}$$

The table is addressed by a quarter of the input bits plus a constant. Doubling the precision squares nothing: it merely adds $\tfrac14$ bit of address per bit of result, which is why this architecture scales where plain tabulation and even [[Multipartite Methods]] eventually do not.

**Balance every truncation against the same target, so that no wire is dramatically more accurate than its neighbours.** Fix an intermediate precision $2^{\ell-g}$ with $g$ guard bits, as [[Error Accuracy]] prescribes, and require each of the roughly fifteen error terms in the architecture to contribute of order $2^{\ell-g}$ — no more, and no less, because an over-accurate wire is paid for in area and buys nothing. Take the multiplier $\sin(\pi A)\times\tfrac{Z^2}{2}$. Both inputs are already approximate, so by the truncated-multiplier analysis of §8.1.3 they should be truncated to the same *absolute* precision, not the same width. With $X=\sin(\pi A)$ (MSB $m_X=0$) and $Y=\tfrac{Z^2}{2}$ (MSB $m_Y=-2\alpha-1$), constraint (8.10) reads

$$\ell-g\ \approx\ -2\alpha-1+\ell_X\ \approx\ 0+\ell_Y,\tag{20.53}$$

so $\sin(\pi A)$ is kept to $\ell_X=\ell-g+2\alpha+1$ and $\tfrac{Z^2}{2}$ to $\ell_Y=\ell-g$, and the product's MSB lands at $-2\alpha-1$. The *same* $\sin(\pi A)$ feeding $Z-\tfrac{Z^3}{6}$ is truncated differently — $\ell_X=\ell-g+\alpha$, because that operand's MSB is $-\alpha$ rather than $-2\alpha-1$ — and when it enters the sine bit heap unmultiplied it must be full $\ell-g$. Hence the rule the small `T` boxes in the diagram encode: **each quantity is computed once at its highest required precision and truncated separately at every use.**

**Prefer a table to a squarer for $\tfrac{Z^2}{2}$, and tabulate the cube outright.** A truncated squarer ([[Squarers and Integer Powers]]) and a plain tabulation both produce $\tfrac{Z^2}{2}$, but the table is *correctly rounded* and so carries a half-ulp error bound where the truncated squarer carries a full ulp — a guard bit's worth of budget, free, whenever the table fits. The cube is even easier: $\tfrac{Z^3}{6}$ occupies $-3\alpha-2-\ell+g$ bits, which by (20.52) is roughly a quarter of the input size plus the guard bits, so for most practical $\ell$ it is simply tabulated. Only at large sizes does FloPoCo build the ad hoc alternative, computing $Z-\tfrac{Z^3}{6}$ inside a single bit heap with only a few bits actually passing through a divide-by-3.

**Count the ulps and $g$ comes out constant — this is the property that distinguishes the architecture, not the speed.** One half-ulp per table, one ulp per `T` truncation box, one ulp per truncated multiplier or squarer, one ulp for the XOR-based $\tfrac14-y$ fold in the argument reduction, and one ulp lumping the higher-order terms and the scaled-down contributions. Composed carefully the architecture loses up to **15 ulps**, so $g=4$ suffices — and

$$g=4\quad\text{does not depend on }\ell .$$

Contrast [[Unrolled CORDIC]], where the rounding error is fed forward through $-\ell+2$ dependent stages and compounds, so $g$ grows like $\log_2$ of the precision. The difference is structural rather than numerical: here the error terms are a fixed, bounded number of *independent* quantities summed once, and there is no recurrence for them to accumulate in. Favourable variants (tabulating rather than computing $\tfrac{Z^2}{2}$ or $\tfrac{Z^3}{6}$) replace a few ulps with half-ulps, but never enough to win a whole guard bit back.

**On an FPGA the block-RAM granularity often hands you a larger $\alpha$ for nothing, and a larger $\alpha$ shrinks the multipliers.** The three sin/cos architectures in this chapter occupy three disjoint parts of the chip, and this one spends the [[Block Memory]] and [[DSP Blocks]] that a rotation engine leaves idle: the multipliers go in logic for small sizes, as truncated DSPs for larger ones, or a mix. Because BRAM comes in fixed granules, the smallest $\alpha$ satisfying (20.52) usually under-fills a block, and raising $\alpha$ to fill it costs nothing — while every extra bit of $\alpha$ pushes $\tfrac{Z^2}{2}$ two bits further down and narrows the multipliers accordingly. Push $\alpha$ far enough and $\tfrac{Z^2}{2}$ falls below the LSB entirely, leaving an order-1 architecture with $\cos Z\approx1$ and two multipliers instead of four. On an ASIC the argument does not transfer: there is no free granule, so $\alpha$ is chosen against the real area of a $2^{\alpha}\times2(-\ell+g)$-bit ROM against that of the multiplier bits it saves.

$$\boxed{\ \sin(\pi Y')\approx\sin\pi A-\sin\pi A\cdot\tfrac{Z^2}{2}+\cos\pi A\cdot\!\left(Z-\tfrac{Z^3}{6}\right),\qquad \alpha>-\tfrac{\ell}{4}-1,\qquad g=4\ }$$

**When it breaks.**

- **Small $\ell$.** Below roughly a dozen bits, "computing just right" means not building this at all. FloPoCo degrades in five steps as the input shrinks: plain table over the whole domain; plain table over an octant after the first reduction; second reduction with the first-order $\sin Z\approx Z$, $\cos Z\approx1$; second order with $\cos Z\approx1-\tfrac{Z^2}{2}$; and only then the third-order architecture above. $g$ is re-derived for each.
- **$\alpha$ chosen below (20.52).** The bound is on the *Taylor* error, which is not amplified but is also not correctable downstream — undersize $\alpha$ and no amount of guard bits restores last-bit accuracy. The fix is a higher-order approximation, not a wider datapath.
- **A reduction that is not an octant.** $Z<2^{-\alpha}$ is what makes the two-term series good enough; the same architecture wrapped around a *quadrant* reduction, as [[Generic Polynomial Sine Evaluator]] uses, faces a wider interval and needs more degree or more segments.
- **Latency-bound rather than throughput-bound designs.** Three logic levels is a *depth* advantage, exploited by pipelining. If one result every several cycles is enough, [[Iterative CORDIC]] is far smaller and the speed here is wasted.
- **No memories or multipliers left.** The entire argument for this architecture is that it spends resources a rotation engine does not touch. On a device whose DSPs and BRAMs are already saturated, or an ASIC flow where a ROM is not cheap, that argument evaporates — see [[Choosing a CORDIC Architecture]].

> [!warning] No synthesis figures are published for this chapter
> Chapter 20 gives cost *formulas* and one measured comparison [DIS13] — with tables and multipliers forced into logic, unrolled CORDIC and this architecture consume very comparable resources while CORDIC is $2\times$ slower at 16 bits and $3\times$ at 32 bits in logic delay. There is no LUT/DSP/BRAM/ns table, and the ASIC comparison against redundant-arithmetic CORDIC is explicitly left open (p. 621). Device-level numbers need outside research.

**RTL (Spade).** The recombination datapath of (20.48)–(20.49): the four truncated multipliers and the two bit heaps, with the tables, the $\times\pi$ and the reconstruction left to their own notes.

```spade
/// Truncated multiplier: form the full 2W-bit product, keep the top W bits.
/// The low half is exactly the part the error analysis argues away.
fn mul_hi<#uint W>(a: uint<W>, b: uint<W>) -> uint<W> {
    let (_lo, hi) = (a * b).as_bits().split_at::<W>();
    hi.as_uint()
}

/// Widen an unsigned intermediate into the signed bit-heap accumulator.
fn lift<#uint W>(x: uint<W>) -> int<{W + 3}> { sext(x.to_int()) }

/// One recombination stage: sin(pi A), cos(pi A), Z^2/2 and Z - Z^3/6 all
/// arrive with LSB weight 2^(l-g); the pair returned is (sin, cos) of pi Y'.
fn recombine<#uint W>(sa: uint<W>, ca: uint<W>, h: uint<W>, t: uint<W>)
    -> (int<{W + 3}>, int<{W + 3}>)
{
    let sah = lift(mul_hi(sa, h));      // sin(pi A) * Z^2/2
    let cah = lift(mul_hi(ca, h));      // cos(pi A) * Z^2/2
    let cat = lift(mul_hi(ca, t));      // cos(pi A) * (Z - Z^3/6)
    let sat = lift(mul_hi(sa, t));      // sin(pi A) * (Z - Z^3/6)
    (lift(sa) -. sah +. cat,
     lift(ca) -. cah -. sat)
}
```

`sa`, `ca`, `h`, `t` are the four buses that cross the middle of the diagram; `mul_hi` is one `×` box together with the `T` on its output, and the two tuple components are the two bit heaps. Every operand is $W$ bits with the *same* LSB weight $2^{\ell-g}$, which is what lets the products be compared at all — `mul_hi` discards the low $W$ bits precisely because $\tfrac{Z^2}{2}$ and $Z-\tfrac{Z^3}{6}$ are fractions, so the product's useful bits are the high half. The accumulator is `int<{W+3}>` and the additions are the wrapping `+.`/`-.`: three extra bits hold the sum of three $W$-bit terms with a sign, and no wrap is reachable. The whole entity is combinational — the diagram's three levels — and the one thing synthesis does differently from the drawing is `mul_hi`: it will not build a $2W$-bit product and throw half away but a genuinely truncated array, or a DSP slice configured to drop its low partial products.

Compiled clean (two iterations; the first tried an `as_bits()[W..{2*W}]` slice, which the type checker rejects — `split_at::<W>()` is the form that takes a generic width) and simulated through a concrete `recombine16` wrapper at $W=16$, i.e. $\ell=-12$, $g=4$: **3009 vectors, zero failures** — nine named plus a 3000-vector random sweep against a behavioural `(a*b)>>16` reference. The named set includes `sa=65535, ca=0` and its swap, which a transposed sine/cosine heap would pass in neither direction, and the asymmetric `sa=1, ca=32768, h=256, t=65535`. One vector is the real algorithm at $\alpha=4$, $Y'=0.2$: $A=12$, $Y_\text{red}=0.0125$, giving $\sin=38521/2^{16}$ against a true $0.5877853$ — $1.4$ ulp of the *intermediate* format, under a tenth of an ulp of the $\ell=-12$ result, exactly the margin $g=4$ is sized to provide.

**Related notes.**

- [[Octant Argument Reduction]] – depends-on: supplies the $Y'\in[0,\tfrac14)$ this note splits a second time, and the $s,q,o$ the reconstruction needs.
- [[Sine-Cosine Octant Reconstruction]] – extends: consumes the two bit-heap outputs and turns them back into $\sin\pi X$, $\cos\pi X$.
- [[Small-Angle Taylor Sine and Cosine]] – supports: the two-term series and their remainders, used here on the tail $Z$.
- [[Table-Based Function Evaluation]] – compares: the plain tabulation this beats by making the address a quarter of the input rather than all of it.
- [[Multipartite Methods]] – compares: the other way to shrink a table, by splitting the *address* instead of the argument.
- [[Truncated Multipliers]] – depends-on: §8.1.3's equal-absolute-precision rule is what fixes every `T` width in the diagram.
- [[Bit Heaps]] – supports: the two summations, including the ad hoc $Z-\tfrac{Z^3}{6}$ heap used at large sizes.
- [[Block Memory]] – supports: the granularity that makes a larger-than-necessary $\alpha$ free on FPGA.
- [[DSP Blocks]] – supports: where the four multipliers go once the operands outgrow LUT logic.
- [[Unrolled CORDIC]] – counter-example: same specification, $g$ growing with $\ell$ because its errors pass through a recurrence rather than being summed once.
- [[Generic Polynomial Sine Evaluator]] – compares: one function at a time over a quadrant, against both functions over an octant here.
- [[Choosing a CORDIC Architecture]] – compares: where this sits against every sibling in the chapter.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §20.5.1, pp. 615–616 — the second argument reduction and Fig. 20.10, p. 615; (20.44)–(20.49).
  - §20.5.1.1, p. 616 — Taylor remainders (20.50)–(20.51) and the constraint (20.52) on $\alpha$.
  - §20.5.2, pp. 616–618 — balancing the truncations, (20.53), and Fig. 20.11, p. 617; Tables 20.2 and 20.3, p. 618.
  - §20.5.3, pp. 618–619 — squarer versus table for $\tfrac{Z^2}{2}$, tabulating $\tfrac{Z^3}{6}$, the single-bit-heap variant and Fig. 20.12, p. 619; FPGA mapping and the free $\alpha$.
  - §20.5.4, p. 619 — the fifteen-ulp count and $g=4$.
  - §20.5.5, p. 620 — the five special cases for small sizes.
  - §20.7, pp. 620–621 — the [DIS13] logic-delay comparison and the open ASIC question.
  - §8.1.3 — the truncated-multiplier constraint (8.10) instantiated in (20.53).
