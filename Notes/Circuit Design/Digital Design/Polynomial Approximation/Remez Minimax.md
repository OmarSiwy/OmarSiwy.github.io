---
title: Remez Minimax
description: "Equioscillating coefficients that beat edge-Taylor by 2^(2d+1) — the same accuracy for d+1 fewer bits of table, at zero hardware cost."
kind: concept
source: "ASA §18.1, pp. 530-537, 542"
status: seed
spade: n/a
tags: [digital, polynomial-approximation, approximation, minimax, error]
aliases:
  - Remez
  - Remez Algorithm
  - Remez Exchange Algorithm
  - Minimax Approximation
  - Minimax
  - Equioscillation
  - Chebyshev Alternation
---

# Remez Minimax

The degree-$d$ polynomial whose error *equioscillates* across the whole interval — the unique minimizer of the sup norm, and the only approximation whose accuracy is not wasted at one end.

```tikz title="Taylor error versus equioscillating Remez error for a degree-4 approximation of exp on [0,1]"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ================= left panel: Taylor at the left endpoint =================
\node[anchor=west,font=\small] at (0.35,2.55) {Taylor at $X_0=0$, $d=4$};
\draw[thick,->] (0,0) -- (5.4,0) node[right,font=\tiny]{$X$};
\draw[thick,->] (0,-1.75) -- (0,1.95) node[above left,font=\tiny]{$\delta_{\text{approx}}$};
\draw[dashed,gray] (0,1.25) -- (5.1,1.25);
\draw[dashed,gray] (0,-1.25) -- (5.1,-1.25);
\node[anchor=east,font=\tiny] at (-0.06,1.25) {$+\bar\delta$};
\node[anchor=east,font=\tiny] at (-0.06,-1.25) {$-\bar\delta$};
\node[anchor=east,font=\tiny] at (-0.06,0) {$0$};
\draw[very thick,blue] plot[domain=0:5,samples=90] (\x,{1.25*pow(\x/5,5)});
\draw[fill=blue] (5,1.25) circle (1.6pt);
\draw[fill=blue] (0,0) circle (1.6pt);
\node[anchor=east,font=\tiny,blue] at (4.95,1.62) {the only max};
\node[anchor=west,font=\tiny,blue] at (0.15,-0.35) {zero of order $d{+}1$};
\node[font=\tiny,align=center] at (2.55,-2.35)
  {$\delta\propto(X-X_0)^{5}$: touches $\pm\bar\delta$ once.\\[-1pt]
   $\bar\delta=0.0099\approx2^{-6}$ for $e^{X}$ on $[0,1]$};
% ================= right panel: Remez minimax =================
\begin{scope}[xshift=7.4cm]
\node[anchor=west,font=\small] at (0.35,2.55) {Remez minimax, $d=4$};
\draw[thick,->] (0,0) -- (5.4,0) node[right,font=\tiny]{$X$};
\draw[thick,->] (0,-1.75) -- (0,1.95) node[above left,font=\tiny]{$\delta_{\text{approx}}$};
\draw[dashed,gray] (0,1.25) -- (5.1,1.25);
\draw[dashed,gray] (0,-1.25) -- (5.1,-1.25);
\node[anchor=east,font=\tiny] at (-0.06,1.25) {$+\bar\delta$};
\node[anchor=east,font=\tiny] at (-0.06,-1.25) {$-\bar\delta$};
\node[anchor=east,font=\tiny] at (-0.06,0) {$0$};
\draw[very thick,red] plot[domain=0.004:4.996,samples=200]
  (\x,{1.25*cos(5*acos(2*\x/5-1))});
\foreach \p/\s/\anc/\dy/\lab in {0/-1/{north west}/-0.10/{x_0},0.48/1/{south}/0.10/{x_1},
   1.73/-1/{north}/-0.10/{x_2},3.27/1/{south}/0.10/{x_3},4.52/-1/{north}/-0.10/{x_4},
   5/1/{south}/0.10/{x_5}}{
  \draw[fill=red] (\p,{1.25*\s}) circle (1.6pt);
  \node[font=\tiny,red,anchor=\anc] at (\p,{1.25*\s+\dy}) {$\lab$}; }
\node[font=\tiny,align=center] at (2.55,-2.35)
  {$\delta\propto T_{5}$: $d+2=6$ alternations.\\[-1pt]
   $\bar\delta=2.7\!\times\!10^{-5}\approx2^{-15}$, same $f$, same $d$};
\end{scope}
% ================= shared footer =================
\node[font=\tiny,align=center] at (6.0,-3.15)
  {vertical scales differ: the two $\bar\delta$ bands stand in the ratio $2^{2d+1}=2^{9}$};
\end{circuitikz}
\end{document}
```

*after Fig. 18.2b, p. 532 and Fig. 18.3, p. 533*

**Collapse "quality of fit" into one number.** A degree-$d$ polynomial $p(X)=C_0+C_1X+\dots+C_dX^d$ needs only adds and multiplies, which is the entire reason it is here. What separates two candidates is the **error function** and its sup norm on the interval $I$:

$$\delta_{\text{approx}}(X)=p(X)-f(X),\qquad \bar\delta_{\text{approx}}=\|f-p\|_{I,\infty}=\max_{X\in I}|f(X)-p(X)| .$$

The useful form for hardware is $\log_2\bar\delta_{\text{approx}}$, the **accuracy in bits**: a polynomial with $\bar\delta_{\text{approx}}=2^{-15}$ can drive an operator faithful to no LSB smaller than $\ell_R=-15$, because a faithful result must fit its whole error under one ulp and this term is only one of four ([[Error Analysis]]).

**Normalize the interval so the datapath alignment is free.** $I$ is always mapped to $[0,1)$ or $[-1,1)$, and that is not cosmetic. Since $|X|\le1$ implies $|C_iX^i|\le|C_i|$, **the MSB of every monomial is the MSB of its coefficient**. The alignment of the summands is therefore read straight off the coefficient table's formats $(m_i,\ell_p)$ with no interval-dependent analysis (Fig. 18.6, p. 537) — see [[Number Formats]] for what those two numbers mean. The normalization itself is the job of [[Fixed-Point Function Approximation]].

**See why Taylor spends its accuracy in the wrong place.** Taylor at $X_0$ truncated at degree $d$ has Lagrange remainder

$$f(X)-T_d(X)=\frac{f^{(d+1)}(\xi)}{(d+1)!}(X-X_0)^{d+1},$$

so to leading order the error is a *single monomial*: a zero of multiplicity $d+1$ at $X_0$, growing monotonically away from it. On $[0,1]$ expanded at $0$ it is exactly zero at one end and maximal at the other — the left panel above. All the accuracy is spent where nobody asked for it. For $e^X$ on $[0,1]$, from Table 18.3 (p. 534):

| degree | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- |
| $\bar\delta_{\text{Taylor}}$ (at $X_0=0$) | $0.22\ (2^{-2})$ | $0.052\ (2^{-4})$ | $0.0099\ (2^{-6})$ | $0.0016\ (2^{-9})$ |
| $\bar\delta_{\text{Remez}}$ | $0.0088\ (2^{-6.8})$ | $0.00054\ (2^{-10.8})$ | $0.000027\ (2^{-15.2})$ | $0.0000011\ (2^{-19.8})$ |
| ratio | $25$ | $96$ | $367$ | $1454$ |

**Demand equioscillation instead of a high-order zero.** Chebyshev's alternation theorem: $p$ is the unique degree-$d$ minimax approximation of $f$ on $I$ iff there exist $d+2$ points $x_0<\dots<x_{d+1}$ in $I$ with

$$f(x_j)-p(x_j)=(-1)^{j}\sigma\bar\delta_{\text{approx}},\qquad \sigma=\pm1 .$$

The error must hit its bound $d+2$ times with alternating sign — the six marked points in the right panel. The intuition for uniqueness is a counting argument: if some other $q$ were uniformly better, $p-q$ would have to change sign between consecutive alternation points, giving a degree-$d$ polynomial with $d+1$ roots, which forces $p-q\equiv0$.

**Run the characterisation as a fixed point.** Remez's 1934 algorithm [Rem34] takes the theorem literally: guess $d+2$ points, solve the **linear** system in the $d+2$ unknowns $C_0,\dots,C_d,E$

$$\sum_{i=0}^{d}C_i x_j^{\,i}+(-1)^jE=f(x_j),\qquad j=0\dots d+1,$$

then replace each $x_j$ by the nearest local extremum of the resulting error and repeat. Note what the $(-1)^jE$ column buys: the alternating sign is a *linear* unknown, so each exchange step is one matrix solve, not an optimization. Convergence is quadratic and two or three exchanges is typical. In practice this is one line — `p = remez(f, d, [a;b])` in Sollya, and `sup(infnorm(f-p,[a;b]))` for the bound (p. 534).

**Count the gain in bits.** Write the error as $\frac{f^{(d+1)}}{(d+1)!}q(X)$ with $q$ monic of degree $d+1$. Taylor picks $q(X)=(X-X_0)^{d+1}$, whose sup norm on an interval of half-width $h$ is $h^{d+1}$ if $X_0$ is the centre and $(2h)^{d+1}$ if $X_0$ is an endpoint. Minimax picks the monic polynomial of least sup norm, which by the extremal property of the **Chebyshev polynomial** is $2^{-d}h^{d+1}T_{d+1}$, of sup norm $h^{d+1}/2^{d}$. Against edge-Taylor,

$$\frac{\bar\delta_{\text{Taylor}}}{\bar\delta_{\text{Remez}}}\approx\frac{(2h)^{d+1}}{h^{d+1}/2^{d}}=2^{2d+1}$$

— $d+1$ bits for moving the expansion point to the centre, $d$ more for equioscillation. Predicted $32,128,512,2048$ against the measured $25,96,367,1454$ in the table above; the residual factor $\approx1.35$ is $f^{(d+1)}$ not being constant across the interval, which is exactly the assumption the factorisation made. **The cost of those $2d+1$ bits is zero gates** — same degree, same multipliers, same table shape, different numbers in the ROM.

> [!note] Taylor is not always wrong
> Taylor coefficients are often exactly $0$, $1$ or $1/2$ (p. 539), and a coefficient that is a power of two costs *nothing* in the datapath — no multiplier, just a shift. That can outweigh the worse error, as in [Che15]'s degree-3 evaluator. Taylor is also the right tool when coefficients are *derived analytically* rather than tabulated, as in [[Addition-Theorem Coefficient Generation]].

**Law 1 — accuracy is linear in the degree.** Each extra degree buys a fixed, function-dependent number of bits, so the error falls geometrically (Fig. 18.4, p. 535). Rule of thumb: **to double the number of accurate bits, double the degree.** For $\log_2(1+X)$ on $[0,1)$, $d=1,2,3\Rightarrow2^{-4.54},2^{-7.66},2^{-10.62}$, i.e. $\approx3.1$ bits per degree.

> [!warning] Law 1 is empirical in the source
> Fig. 18.4 plots exactly two functions, $e^X$ and $\sin(\frac\pi2X)$. The book gives no bound on the per-degree constant, and no analytic justification for linearity — unlike Law 2, which follows from the Chebyshev bound below. Treat the slope as something to measure per function, never to assume.

**Law 2 — accuracy is linear in the log of the interval size, with slope $d+1$.** The same Chebyshev bound, applied to an interval of width $2h$ (Fig. 18.5, pp. 535-536):

$$\bar\delta_{\text{approx}}\le\frac{\|f^{(d+1)}\|_{\infty}}{2^{2d+1}(d+1)!}\,(2h)^{d+1}\ \propto\ h^{d+1}.$$

Shrink the interval by $2^{k}$ and the error falls by $2^{-k(d+1)}$. Verified for $\log_2(1+X)$ on the *worst* subinterval as the segmentation parameter goes $\alpha=0\to3$ (bits of accuracy):

| $d$ | $\alpha=0$ | $1$ | $2$ | $3$ | increments | $d+1$ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 4.54 | 6.08 | 7.80 | 9.64 | 1.54, 1.72, 1.84 | 2 |
| 2 | 7.66 | 9.97 | 12.55 | 15.31 | 2.31, 2.58, 2.76 | 3 |
| 3 | 10.62 | 13.69 | 17.13 | 20.82 | 3.07, 3.44, 3.69 | 4 |

Convergence to $d+1$ is from below because the worst subinterval is the one nearest $0$, where $f^{(d+1)}$ is largest — the bound uses a global $\|f^{(d+1)}\|_\infty$ that is increasingly pessimistic on a shrinking interval.

**The two laws set every downstream width.** To reach $w_R$ accurate bits with degree $d$ over $2^{\alpha}$ segments, the two contributions add in bits: $\alpha(d+1)+\beta_f\,d\gtrsim w_R$, so $\alpha\approx w_R/(d+1)$ minus a function-dependent bonus. The coefficient table holds $2^{\alpha}$ entries of $\sum_i(m_i-\ell_p)$ bits, so its size is $\Theta\!\left(2^{w_R/(d+1)}\right)$ — **exponential in $1/(d+1)$**, and the only exponential resource in the whole operator. Measured at $w_X=w_R=24$ for $\log_2(1+X)$: $d=1\Rightarrow\alpha=12$ (exactly $w_R/2$), $d=2\Rightarrow\alpha=7$, $d=3\Rightarrow\alpha=5$; the table falls $167\,936\to7808\to2496$ bits. The first multiplier is worth $\times21$, the second only $\times3.1$ — quadratically diminishing, because the marginal exponent saving is $\frac{w_R}{d+1}-\frac{w_R}{d+2}=\frac{w_R}{(d+1)(d+2)}$ while each degree costs one more multiplier forever (p. 542). That asymmetry is why every published evaluator sits at degree 2 or 3.

On FPGAs this lands well: the exponential resource is a wide, shallow ROM, which is the natural block-RAM shape, so $\alpha$ is chosen to fit the BRAM you already have and the $2^{2d+1}$ from Remez is what keeps that choice at one block instead of two ([[FPGAs]]). On an ASIC the same bits are a synthesized ROM with no such quantum, so the trade is smooth and the temptation to spend a degree is stronger.

$$\boxed{\ \frac{\bar\delta_{\text{Taylor}}}{\bar\delta_{\text{Remez}}}\approx2^{2d+1}\qquad\text{and}\qquad\bar\delta_{\text{approx}}\propto h^{\,d+1}\ \Longrightarrow\ \text{shrinking }I\text{ by }2^{k}\text{ buys }k(d+1)\text{ bits}\ }$$

**When it breaks.**

- **The coefficients are reals.** Rounding them to LSB $\ell_p$ gives a *different* polynomial, and there is no reason the rounded minimax is the best polynomial with representable coefficients. Sollya's `fpminimax` searches the constrained set directly; this is the boundary where [[Polynomial Coefficient Table]] takes over.
- **The $2^{2d+1}$ is against *edge*-Taylor.** Against a Taylor expansion at the interval centre the advantage is only $2^{d}$, and a centred expansion is what a signed reduced argument $Y_s\in[-1,1)$ gives you for the price of one inverter.
- **$f^{(d+1)}$ must be bounded and non-oscillating on $I$** for the factorisation to be predictive. It also must exist: a singularity inside $I$ (as $\tan$ or $\sqrt{\cdot}$ at $0$) breaks the Lagrange form entirely, and the fix is a range reduction that moves the singularity to a segment boundary — [[Logarithmic Segmentation]] — not a higher degree.
- **Degenerate segments.** Once segmentation shrinks a subinterval to a single point the polynomial collapses to $C_0$ and minimax says nothing; that is a table entry, not an approximation.
- **Below $w_X\approx16$ the whole family loses.** At degree 1 the table is stuck at $2^{w_R/2}$ — the same regime as [[Multipartite Methods]], which reaches it with no multiplier at all.

> [!warning] No guidance on conditioning at high degree — needs outside research
> The exchange step solves a Vandermonde-like system, which is notoriously ill-conditioned as $d$ grows, yet the book gives no working degree limit, no recommendation on interpolation basis, and no failure mode for `remez()`. It does not bite in this chapter because hardware never goes past $d\approx6$.

**RTL (Spade).** None. Remez is a numerical exchange algorithm run *at generate time*, in Sollya or Maple, on real arithmetic with an iteration count that depends on the function; its output — the coefficients — is what becomes hardware, in [[Polynomial Coefficient Table]] and [[Horner Evaluation]]. There is nothing in this note a synthesizer could consume.

**Related Notes**

- [[Error Analysis]] – depends-on: $\bar\delta_{\text{approx}}$ is one of the four terms that must jointly fit under one ulp, and the only one settled before any hardware exists.
- [[Fixed-Point Function Approximation]] – supports: supplies the normalization to $[0,1)$ or $[-1,1)$ that makes coefficient MSBs the monomial MSBs.
- [[Polynomial Coefficient Table]] – extends: turns these real coefficients into a rounded, worst-cased, shared-$\ell_p$ ROM.
- [[Uniform Piecewise Segmentation]] – extends: Law 2 built as hardware, where $\alpha$ is a wire split and each segment gets its own minimax fit.
- [[Horner Evaluation]] – supports: the evaluator that consumes the coefficients, and whose own error budget is whatever $\bar\delta_{\text{approx}}$ leaves behind.
- [[Multipartite Methods]] – compares: matches a degree-1 minimax evaluator on table bits with zero multipliers, and is the reason degree 1 is never the answer above 16 bits.
- [[Choosing a Polynomial Evaluator]] – compares: where the degree these laws recommend sits against latency and multiplier budget.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18 "Polynomial-Based Architectures for Function Evaluation".

- §18.1 primer and error function, pp. 530-531
- §18.1.1 Taylor approximation, Eq. (18.1) and Fig. 18.2, pp. 531-532
- §18.1.2 Remez minimax, Fig. 18.3, Tables 18.2-18.3, pp. 533-534 — including the Sollya `remez` / `infnorm` / `supnorm` usage
- §18.1.3 degree versus accuracy, Fig. 18.4, p. 535
- §18.1.4 interval size versus accuracy, Fig. 18.5, pp. 535-536
- §18.1.5 machine-efficient approximation and monomial alignment, Fig. 18.6, pp. 536-537
- §18.2.1.1 the memory/arithmetic trade-off, p. 542

Cited works: [Rem34] (Remez), [Mul16] (Muller), [BC07], [CJL10] (`fpminimax`, Sollya), [Che+11] (`supnorm`), [Che15].
