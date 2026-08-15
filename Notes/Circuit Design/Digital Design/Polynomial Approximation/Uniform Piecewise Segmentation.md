---
title: Uniform Piecewise Segmentation
description: "Splits the input into 2^alpha equal segments by a pure wire split — alpha bits of address, w_X-alpha bits of reduced argument — buying alpha(d+1) bits of accuracy for a 2^alpha-deep table."
kind: circuit
source: "ASA §18.2.1, pp. 541-544"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, range-reduction, segmentation, table, fpga]
aliases:
  - Uniform Segmentation
  - Uniform Piecewise Splitting
  - Range Reduction by Uniform Piecewise Splitting
  - Uniform Piecewise Decomposition
---

# Uniform Piecewise Segmentation

The range reduction that costs nothing: cutting $[0,1)$ into $2^{\alpha}$ equal
segments makes the segment index and the reduced argument two disjoint fields of
the *same* input word, so the change of variable is a wire split rather than an
operator.

```tikz title="Uniform segmentation: the input word splits into a segment index A and a reduced argument Y, centred by one inverter"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- the input word ----------
\draw[thick] (0,3.0) rectangle (8.4,3.6);
\draw[thick] (2.4,3.0) -- (2.4,3.6);
\draw[thick] (3.0,3.0) -- (3.0,3.6);
\node at (1.2,3.3) {$A$};
\node[font=\tiny] at (2.7,3.3) {$y_{\text{msb}}$};
\node at (5.7,3.3) {$Y$};
\node[anchor=east] at (-0.15,3.3) {$X\ =$};
\draw[<->] (0,3.95) -- node[above,font=\tiny]{$\alpha$ bits} (2.4,3.95);
\draw[<->] (2.4,3.95) -- node[above,font=\tiny]{$w_Y=w_X-\alpha$ bits} (8.4,3.95);
\node[font=\tiny,anchor=west] at (8.55,3.3) {LSB $2^{-w_X}$};

% ---------- A addresses the table ----------
\draw[->,thick] (1.2,3.0) -- (1.2,0.78);

% ---------- Y: MSB through one inverter, the rest untouched ----------
\node[not port,rotate=-90,scale=0.5] (inv) at (2.7,2.40) {};
\draw[thick] (2.7,3.0) -- (inv.in);
\draw[->,thick] (inv.out) -- (2.7,1.75);
\draw[->,thick] (5.7,3.0) -- (5.7,1.75);

% ---------- the reduced, centred word ----------
\draw[thick] (2.4,1.15) rectangle (8.4,1.75);
\draw[thick] (3.0,1.15) -- (3.0,1.75);
\node[font=\tiny] at (2.7,1.45) {$\overline{y_{\text{msb}}}$};
\node at (5.7,1.45) {$Y_s$, two's complement};
\node[anchor=west,font=\tiny] at (8.55,1.45) {$w_Y$};

% ---------- destinations ----------
\node[draw,thick,minimum width=2.3cm,minimum height=0.9cm,align=center] (tab) at (1.15,0.35)
  {coefficient table\\[-2pt]{\tiny $2^{\alpha}$ entries}};
\node[draw,thick,minimum width=2.6cm,minimum height=0.9cm,align=center] (ev) at (5.7,0.35)
  {polynomial evaluator};
\draw[->,thick] (5.7,1.15) -- (ev.north);
\draw[->,thick] (tab.east) -- node[above,font=\tiny]{$C_0\dots C_d$} (ev.west);
\draw[->,thick] (ev.east) -- ++(1.2,0) node[right] {$R$};

% ---------- one subinterval, drawn to scale ----------
\draw[thick] (0,-1.0) -- (8.4,-1.0);
\foreach \x in {0,4.2,8.4}{ \draw[thick] (\x,-1.15) -- (\x,-0.85); }
\node[font=\tiny,anchor=south] at (0.35,-0.85) {$2^{-\alpha}A$};
\node[font=\tiny,anchor=south] at (4.2,-0.85) {midpoint};
\node[font=\tiny,anchor=south] at (7.9,-0.85) {$2^{-\alpha}(A{+}1)$};
\draw[<->] (0,-1.45) -- node[below,font=\tiny]{$Y:\ 0\ \longrightarrow\ 1$} (8.4,-1.45);
\draw[<->] (0,-2.05) -- node[below,font=\tiny]{$Y_s:\ -1\ \longrightarrow\ 0\ \longrightarrow\ 1$} (8.4,-2.05);
\node[font=\tiny,align=left,anchor=west] at (0,-2.75)
  {$X=2^{-\alpha}(A+Y)$ \ (unsigned) \qquad
   $X=2^{-\alpha}\!\left(A+\tfrac12+\tfrac{Y_s}{2}\right)$ \ (centred);\\
   the change of variable is a wire split, the centring is one inverter.};
\end{circuitikz}
\end{document}
```

*after Fig. 18.9, p. 541, in the surrounding datapath of Fig. 18.10, p. 542*

**Make the change of variable a field extraction.** The input is one unsigned
fixed-point word $X$ of $w_X$ bits with LSB $2^{-w_X}$, normalized to $[0,1)$
([[Fixed-Point Representations]]). Cut the interval into $2^{\alpha}$ pieces of
width $2^{-\alpha}$ and index them by $A\in\{0\dots2^{\alpha}-1\}$. Because the
segment boundaries are at multiples of $2^{-\alpha}$ — that is, at every value
whose bottom $w_X-\alpha$ bits are zero — the *positional* structure of the
binary point does the work: reading the top $\alpha$ bits of $X$ as an integer
gives exactly the index, and the remaining bits are exactly the offset inside the
segment. Writing $w_Y=w_X-\alpha$ for that leftover width,

$$X=2^{-\alpha}(A+Y),\qquad Y\in[0,1),\quad A\in\{0,\dots,2^{\alpha}-1\},\tag{18.3}$$

$$f_{u,A}(Y)=f\!\left(2^{-\alpha}(A+Y)\right)\tag{18.4}$$

with $A$ of $\alpha$ bits and $Y$ of $w_Y$ bits, LSB $2^{-w_Y}$. No gate
implements (18.3): it is a renaming of the bits already present. It is also
**exact** — $f_{u,A}(Y)=f(X)$ identically — so unlike a multiplicative or
additive argument reduction it contributes *no term at all* to the error budget
([[Error Accuracy]]).

**Price the split in bits of accuracy.** The whole point of shrinking the
interval is Chebyshev's bound on the minimax error ([[Remez Minimax]]): on an
interval of half-width $h$ the degree-$d$ error obeys
$\bar\delta_{\text{approx}}\le\frac{\|f^{(d+1)}\|_{\infty}}{2^{2d+1}(d+1)!}(2h)^{d+1}\propto h^{d+1}$,
because the extremal monic polynomial of degree $d+1$ scales like $h^{d+1}$.
Dividing the interval by $2^{\alpha}$ therefore divides the error by
$2^{\alpha(d+1)}$:

$$\text{segmentation parameter }\alpha\ \Longrightarrow\ \alpha(d+1)\text{ extra bits of accuracy.}$$

Measured on $\log_2(1+X)$ over the *worst* subinterval — the leftmost, where
$f^{(d+1)}$ is largest — the increment per unit of $\alpha$ climbs to $d+1$ from
below, since the worst subinterval keeps shrinking towards the singular end:

| $d$ | $\alpha=0$ | $1$ | $2$ | $3$ | increments | limit $d+1$ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 4.54 | 6.08 | 7.80 | 9.64 | 1.54, 1.72, 1.84 | 2 |
| 2 | 7.66 | 9.97 | 12.55 | 15.31 | 2.31, 2.58, 2.76 | 3 |
| 3 | 10.62 | 13.69 | 17.13 | 20.82 | 3.07, 3.44, 3.69 | 4 |

**Price it in memory, and the design collapses to one equation.** Each segment
needs its own polynomial, so the [[Polynomial Coefficient Table]] holds
$2^{\alpha}$ entries of $\sum_{i=0}^{d}(m_i-\ell_p)$ bits — the single
exponential resource in the whole operator. Demanding $w_R$ accurate bits gives
$\alpha(d+1)\gtrsim w_R$, hence $\alpha\approx w_R/(d+1)$ and a table of
$\Theta(2^{w_R/(d+1)})$ bits. That exponent is what makes the degree worth
paying for: at $w_X=w_R=24$ for $\log_2(1+X)$, $d=1,2,3,4$ want
$\alpha=12,7,5,3$ and tables of $167\,936$, $7808$, $2496$, $912$ bits — the
first multiplier buys a factor $21$, the next only $3.1$. The trade-off is
one-directional and shallow, and $\alpha$ takes so few useful values that the
generator finds it by trying $\alpha=1,2,3,\dots$ and stopping (p. 542); each
trial is rejected cheaply by testing only the two extremal subintervals $A=0$
and $A=2^{\alpha}-1$, where the approximation error is almost always maximal
(p. 565).

**Centre the reduced argument for one inverter.** $Y\in[0,1)$ places the
expansion point at the *left edge* of the segment, which by the Chebyshev
argument above is the worst place for it. Re-parameterize onto $[-1,1)$:

$$X=2^{-\alpha}\!\left(A+\tfrac12+\tfrac{Y_s}{2}\right),\qquad Y_s\in[-1,1),\tag{18.5}$$

$$f_{s,A}(Y_s)=f\!\left(2^{-\alpha}\!\left(A+\tfrac12+\tfrac{Y_s}{2}\right)\right).\tag{18.6}$$

Comparing with (18.3), $Y_s=2Y-1$. In fixed point that affine map is free.
Let $y$ be the $w_Y$-bit integer with $Y=y\,2^{-w_Y}$. Then
$Y_s=2y\,2^{-w_Y}-1=(y-2^{w_Y-1})\,2^{-(w_Y-1)}$, so the $w_Y$-bit **two's
complement** integer to store is $y-2^{w_Y-1}$ — and by the two's-complement
weighting of the sign bit ($-2^{w_Y-1}$ instead of $+2^{w_Y-1}$, see
[[Number Formats]]), subtracting $2^{w_Y-1}$ from an unsigned word *is* inverting
its MSB and reinterpreting the result as signed. Same $w_Y$ bits, same wires, one
inverter.

> [!note] One inverter for $d(d+1)/2$ bits of every table entry
> Substituting $Y=\frac{1+Y_s}{2}$ into $p_u(Y)=\sum_i C_i^{u}Y^{i}$ and
> re-expanding gives $C_i^{s}=2^{-i}\,p_u^{(i)}(\tfrac12)/i!$: **the degree-$i$
> coefficient is scaled by $2^{-i}$**, so $C_i^{s}$ carries $i$ more leading
> zeros than $C_i^{u}$. Fig. 18.11, p. 544 shows exactly that for $\exp$ on one
> subinterval — leading zeros go $3\to4$ for $C_1$, $9\to11$ for $C_2$,
> $13\to16$ for $C_3$, both polynomials accurate to $10^{-6}$. With a shared LSB
> $\ell_p$ those leading zeros are not stored, so each MSB position $m_i$ drops
> by $i$ and the entry shrinks by up to $\sum_{i=0}^{d}i=d(d+1)/2$ bits — $6$ of
> the $78$ bits per entry at $d=3$, replicated across all $2^{\alpha}$ entries,
> for one gate. [SDP11]'s constrained polynomials are, in the authors' reading,
> a more contrived way of expressing the same effect (p. 543).

**Every downstream width follows from $\alpha$ with no analysis.** This is the
property that distinguishes uniform segmentation from every sibling: the reduced
argument is $w_Y=w_X-\alpha$ bits *exactly and unconditionally*, so
[[Horner Evaluation]]'s multiplier operands are known the moment $\alpha$ is
chosen. [[Logarithmic Segmentation]] cannot promise this — at leading-zero count
$A=0$ nothing is shifted away and $w_Y$ stays at $w_X-1$ — and
[[Dichotomy-Based Segmentation]] only bounds it, $w_X-\alpha<w_Y<w_X$, because
its $Y=X-M_A$ is a real subtraction against a tabulated midpoint rather than a
slice.

**Size the coefficients once, across all segments.** Each subinterval's
polynomial has its own per-coefficient format $(m_i(A),\ell_i(A))$, but all
$2^{\alpha}$ entries share one set of wires into the evaluator, so the stored
format is the worst case over $A$:

$$\forall i\quad m_i=\max_A m_i(A),\qquad \ell_p=\min_A \ell_i(A)\tag{18.7–18.8}$$

with entry width $\sum_i(m_i-\ell_p)$ bits. Taking the min afterwards wastes the
slack on the easy segments, so the better structure is to hoist the loop over $A$
*inside* the coefficient-search algorithm and fit every subinterval to the common
$\ell_p$ from the start: the spare LSBs then hold *more accurate* coefficients
instead of zeros, shrinking $\bar\delta_{\text{approx}}$ and enlarging the
evaluator's error budget at zero hardware cost (p. 544). One further asymmetry
worth exploiting: coefficients of a given degree usually share a sign across all
$A$, in which case that bit is hardwired rather than stored.

$$\boxed{\ X=2^{-\alpha}(A+Y),\quad w_Y=w_X-\alpha\ \Longrightarrow\ \alpha(d+1)\ \text{bits of accuracy for a } 2^{\alpha}\text{-entry table}\ }$$

> [!warning] No synthesis figures in the source
> Chapter 18 reports no LUT, DSP, BRAM or delay numbers for any of its
> architectures. Every quantity above is table bits or a wire width computed
> from the chapter's own equations, not a post-place-and-route measurement.

## When it breaks

- **The degree is set by the worst segment.** Uniform segments are equal in
  *width*, not in difficulty. Where $f^{(d+1)}$ varies by orders of magnitude
  across $I$ — $\sqrt{\cdot}$ or $\log$ near $0$ — one hard segment forces a
  degree that is wasted on all the others. That is the whole case for
  [[Logarithmic Segmentation]].
- **A discontinuity or an infinite derivative inside $I$ is fatal**, not
  expensive: no finite $d$ approximates the segment containing it, whatever
  $\alpha$ is. Logarithmic segmentation survives it because its two leftmost
  intervals degenerate to single points where the polynomial collapses to $C_0$.
- **$\alpha$ is an integer knob with a factor-of-two step.** Each increment
  doubles the table; there is nothing in between, and the granularity coarsens
  as $\alpha$ falls. [[Hierarchical Segmentation]] exists to make the effective
  $\alpha$ vary across the input.
- **At $d=1$ there is no win.** $\alpha\approx w_R/2$ puts the table back at
  $2^{w_R/2}$ entries — the same regime as the table-and-addition methods, and
  measured head-to-head at 16 bits a degree-1 uniform evaluator needs $7936$
  table bits against multipartite's $7808$, plus a multiplier. Degree 2 is what
  breaks out of the $2^{w/2}$ wall ($1408$ bits).
- **The normalization must already be done.** (18.3) assumes $X\in[0,1)$ with
  the binary point at the MSB; a floating-point input, or a fixed-point one with
  an exponent, needs its own reduction first and gets a crude logarithmic
  segmentation for free from its exponent field.

## RTL (Spade)

```spade
/// Uniform piecewise segmentation of a w_X-bit fixed-point X in [0,1).
///   X = 2^-AL * (A + Y)             A: AL bits, Y: WY bits, WX = AL + WY
///   X = 2^-AL * (A + 1/2 + Ys/2)    Ys = 2Y - 1, one inverter on Y's MSB
fn uniform_split<#uint WX, #uint AL, #uint WY, #uint WYM1>(x: uint<WX>)
    -> (uint<AL>, uint<WY>, int<WY>)
where WX == AL + WY else "uniform_split: alpha + w_Y must equal w_X",
      WY == WYM1 + 1 else "uniform_split: w_Y must be at least 1"
{
    let bits = x.as_bits();
    let a: uint<AL>    = bits[WY..WX].as_uint();
    let y: uint<WY>    = bits[0..WY].as_uint();
    let lo: uint<WYM1> = bits[0..WYM1].as_uint();
    let ys: int<WY>    = (!y.msb()).as_uint().concat(lo).as_int();
    (a, y, ys)
}
```

`bits[WY..WX]` is the segment index $A$ — the top $\alpha$ bits, the ROM address
in the diagram; `bits[0..WY]` is the reduced argument $Y$ on the wire feeding the
evaluator. `ys` rebuilds the same $w_Y$ bits with the MSB inverted and
reinterprets the word as `int<WY>`, which is the two's-complement identity above
made structural — note that no `+`, `-` or `*` appears, so no width growth rule
is in play and the three outputs together are exactly the $w_X$ input bits plus
one inversion. It is a `fn`, hence purely combinational: there is no clock and
nothing to register. Synthesis emits *less* than the drawing suggests — the split
is renaming (`assign a = x[11:9]`), and on an FPGA the lone inverter is absorbed
into the LUT that already consumes $Y_s$, or into the sign handling of the DSP
multiplier, so the measured cost of this note's entire circuit is zero.

The concrete instantiation used to force monomorphisation and to drive the
testbench is `uniform_split::<12, 3, 9, 8>` — the book's worked-example geometry,
$w_X=12$, $\alpha=3$, $w_Y=9$.

## Related Notes

- [[Polynomial Coefficient Table]] – depends-on: $A$ is its address and
  $2^{\alpha}$ is its depth, so this note sets the operator's only exponential
  cost.
- [[Horner Evaluation]] – supports: consumes $Y$ (or $Y_s$) with every multiplier
  operand pinned at $w_Y=w_X-\alpha$ bits.
- [[Fixed-Point Representations]] – depends-on: the split is free only because
  $A$ and $Y$ are contiguous fields of one fixed-point word.
- [[Logarithmic Segmentation]] – compares: indexes by leading-zero count instead,
  trading the clean $w_Y$ for the ability to swallow a singularity at $0$.
- [[Dichotomy-Based Segmentation]] – counter-example: balances the error per
  segment optimally, and pays with a comparator search and a subtraction where
  this note pays nothing.
- [[Hierarchical Segmentation]] – extends: stacks a second uniform level so the
  effective $\alpha$ can vary across the input.
- [[Multipartite Methods]] – compares: at degree 1 the two land on the same table
  size, which is the evidence that this scheme only pays from degree 2 upward.
- [[Addition-Theorem Coefficient Generation]] – extends: exploits the smoothness
  of $C_i(A)$ that uniform segmentation produces, computing three coefficient
  tables out of the first.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18
"Polynomial-Based Architectures for Function Evaluation".

- §18.2.1 Range reduction by uniform piecewise splitting, pp. 541–544 — Fig. 18.8
  (segmentation of the input domain) and Fig. 18.9 (input word decomposition),
  p. 541; Fig. 18.10 (uniform segmentation architecture) and the
  memory/arithmetic trade-off, p. 542; Eqs. (18.3)–(18.6) and (18.7)–(18.8),
  pp. 543; Fig. 18.11 (signed versus unsigned reduced argument) and the shared
  $\ell_p$ refinement, p. 544
- §18.2.1.4 Coefficient compression opportunities, pp. 544–547 — coefficient
  smoothness, constant signs
- §18.2.3–18.2.6 Competing reductions, pp. 548–554 — logarithmic, hierarchical,
  dichotomy-based, and the discussion of which to use
- §18.4.2 Generator with uniform piecewise reduction, Fig. 18.23, pp. 565–566 —
  trial-and-error on $\alpha$, extremal-subinterval testing
- Cited works: [Lee+05], [DJP10] (uniform segmentation), [SDP11] (constrained
  polynomials), [Hsi+15] (table compression), [PBM01], [OS05], [Che15], [De+17]
  (evaluators using it)
