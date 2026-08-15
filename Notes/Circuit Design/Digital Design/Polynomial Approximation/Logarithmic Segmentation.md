---
title: Logarithmic Segmentation
description: "Indexes the coefficient table by leading-zero count, absorbing a discontinuity or infinite derivative at zero — at the price of an LZC, a shifter and an unreduced w_Y."
kind: circuit
source: "ASA §18.2.3, pp. 548-551"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, range-reduction, lzc, shifter]
aliases:
  - "Logarithmic Piecewise Splitting"
  - "Logarithmic Piecewise Segmentation"
  - "Logarithmic Segmentation"
  - "Leading-Zero-Count Segmentation"
---

# Logarithmic Segmentation

A piecewise polynomial range reduction whose subinterval index is the **leading-zero count** of the input rather than its top bits, so the segments halve in width as they approach $0$ — the only generic segmentation that survives a discontinuity or an infinite derivative at the origin.

```tikz title="Logarithmic segmentation: dyadic intervals indexed by leading-zero count, and the resulting datapath"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]

  % ---- the segmentation: dyadic intervals of [0,1), indexed by the leading-zero count ----
  \begin{scope}[yshift=3.3cm]
    \draw[->,thick] (-0.4,0) -- (9.0,0) node[right] {$X$};
    \foreach \x in {0,0.25,0.5,1,2,4,8} { \draw (\x,-0.12) -- (\x,0.5); }
    \node[anchor=south] at (8,0.5) {$1$};
    \node[anchor=south] at (4,0.5) {$2^{-1}$};
    \node[anchor=south] at (2,0.5) {$2^{-2}$};
    \node[anchor=south] at (1,0.5) {$2^{-3}$};
    \node[anchor=south,xshift=-6pt] at (0,0.5) {$0$};
    \draw[<->] (4.06,-0.45) -- (7.94,-0.45); \node[anchor=north,fill=white,inner sep=1.5pt] at (6,-0.36) {$A=0$};
    \draw[<->] (2.06,-0.45) -- (3.94,-0.45); \node[anchor=north,fill=white,inner sep=1.5pt] at (3,-0.36) {$A=1$};
    \draw[<->] (1.06,-0.45) -- (1.94,-0.45); \node[anchor=north] at (1.5,-0.62) {$A=2$};
    \node[anchor=north west,align=left] at (1.9,-1.05)
      {$w_X$ leading zeros $\Rightarrow$ interval width halves per unit of $A$;\\
       saturating $A$ at $\alpha-1$ merges everything left of $2^{-\alpha+1}$ into one segment};
  \end{scope}

  % ---- the architecture (Fig. 18.16) ----
  \node[draw,fill=gray!8,minimum width=2.6cm,minimum height=0.9cm] (lzc) at (0.6,0)
       {LZC / left shifter};
  \draw[->] (-2.9,0) -- (lzc.west) node[midway,above] {$X$} node[midway,below] {$w_X$};

  \node[draw,fill=gray!8,minimum width=2.4cm,minimum height=1.5cm] (tab) at (0.6,-2.8)
       {\begin{tabular}{c}coefficient\\table\end{tabular}};
  \node[draw,fill=gray!8,minimum width=2.4cm,minimum height=1.5cm] (ev) at (5.4,-2.8)
       {\begin{tabular}{c}polynomial\\evaluator\end{tabular}};

  \draw[->] (lzc.south) -- (tab.north);
  \node[anchor=east] at (0.5,-1.4) {$A$};
  \node[anchor=west] at (0.7,-1.4) {$\alpha$};

  \draw[->] (lzc.east) -- (5.4,0) -- (ev.north);
  \node[anchor=south] at (3.3,0.08) {$Y=\lfloor X_{\text{shifted}}\rfloor$};
  \node[anchor=west] at (5.5,-1.2) {$w_Y$};

  \draw[->] (1.8,-2.35) -- (4.2,-2.35) node[midway,above] {$C_0$};
  \draw[->] (1.8,-2.80) -- (4.2,-2.80) node[midway,above] {$\vdots$};
  \draw[->] (1.8,-3.25) -- (4.2,-3.25) node[midway,below] {$C_d$};

  \draw[->] (ev.east) -- ++(1.7,0) node[midway,above] {$R$} node[midway,below] {$w_R$};
\end{circuitikz}
\end{document}
```

*after Figs. 18.15 and 18.16, p. 549.*

**A uniform split spends its degree where the function is easiest.** [[Uniform Piecewise Segmentation]] cuts $I=[0,1)$ into $2^{\alpha}$ equal pieces addressed by the top $\alpha$ bits of $X$. One degree $d$ and one set of formats then serve every piece, so $d$ is fixed by the *hardest* subinterval. For $f=\sqrt{\cdot}$ (Fig. 18.15, p. 549) the derivative blows up as $X\to0$: the leftmost piece needs a high degree while the rightmost is nearly linear, and the polynomials on the right are "vastly more accurate than needed" (p. 548) — accuracy paid for in multipliers and never collected. The mismatch is not a tuning failure. It is structural: uniform pieces are equal in *width* while the difficulty is distributed by *scale*.

**Match the segmentation to the scale by indexing on the exponent.** Let $X$ be a $w_X$-bit unsigned fixed-point number in $[0,1)$, i.e. $\text{ufix}(-1,-w_X)$ in the notation of [[Number Formats]], and let $A$ be its leading-zero count, an $\alpha$-bit unsigned integer. $A=k$ says exactly that $X\in[2^{-k-1},2^{-k})$, so the segment boundaries are the dyadic points $2^{-k}$ and the segment containing $X$ is read straight off the exponent. On that segment $X$ normalises to a mantissa: shifting left by $A$ places the leading $1$ at the MSB, and that bit is constant over the whole segment, so it carries no information and is dropped. What is left is the reduced argument $Y\in[0,1)$, giving the change of variable (18.16, p. 548)

$$X=2^{-A-1}(1+Y),\qquad f_{u,A}(Y)=f\!\left(2^{-A-1}(1+Y)\right).$$

Concretely, for $X=.00101$: $A=2$; shifting left by $2$ gives $10100$; dropping the constant leading $1$ gives $Y=.0100$. Two functions of $A$ are then tabulated — one polynomial $C_0(A),\ldots,C_d(A)$ per segment — and the evaluator computes $R\approx f_{u,A}(Y)$ in $w_R$ bits. The whole reduction is one **combined LZC-and-shifter** ([[Leading Zero Counters]], [[Barrel Shifters]], and the [[Normalizers|normaliser]] that fuses them, §10.3), the same block a floating-point adder uses for post-normalisation.

**A signed reduced argument shrinks the coefficients for free.** Centring $Y$ on its interval rather than starting it at $0$ halves $|Y|$, and the Taylor coefficients $C_i\approx f^{(i)}/i!\cdot(\text{interval width})^i$ shrink with it. The centred change of variable is (18.17, p. 549)

$$X=2^{-A-2}(3+Y_s),\qquad f_{s,A}(Y_s)=f\!\left(2^{-A-2}(3+Y_s)\right),$$

which places $Y_s\in[-1,1)$ around the midpoint $3\cdot2^{-A-2}$ of the segment $[2^{-A-1},2^{-A})$. The hardware cost is nil — the constant $3$ is two hard-wired bits, and the sign of $Y_s$ is a bit of the shifted word — while every $|C_i|$, $i\ge1$, loses about a bit. This is the same trick, and the same reason, as centring in uniform segmentation; see [[Error Accuracy]] for why an error bound halves when the interval does.

**The reduced argument is not narrowed, and that is what the scheme costs.** In a uniform split of parameter $\alpha$ the top $\alpha$ bits *become* the address, so $Y$ is literally the remaining $w_X-\alpha$ bits and the evaluator's multipliers shrink accordingly. Here the shift is by a *variable* amount: at $A=0$ there is no shift at all, so all of $X$ survives except the one constant leading bit, and $w_Y=w_X-1$ in the worst case (§18.2.3.1, p. 549). The multipliers inside the evaluator are therefore wider than a uniform segmentation's for the same $\alpha$ — the reduction bought a better fit and paid for it in datapath width. The mitigation is $Y=\lfloor X_{\text{shifted}}\rfloor$, shaving LSBs off the shifted word (p. 550). It works because the wide $A=0$ interval is exactly where $f$ has small slope: several consecutive inputs there round to the same output, so their low bits are already dead. Removing $k$ LSBs can only damage the $k$ rightmost intervals — on every other interval the left shifter injected zeros into those positions anyway. There is no closed form for the right $k$; treat $w_Y$ as a search parameter, start at $w_X-1$ and decrement until the target accuracy breaks.

> [!important] The degenerate leftmost intervals are the point of the whole construction
> The two leftmost intervals of Fig. 18.15 are **single points** ($X=0$ and $X=2^{-w_X}$). On a one-point interval the approximation problem is trivial: $C_0$ is the exact function value and $C_1,\ldots,C_d$ are all $0$. So a value of $f$ that no polynomial can chase — a jump, or the vertical tangent of $\sqrt{\cdot}$ at the origin — is simply *tabulated*, and the discontinuity never enters the approximation error at all. Uniform segmentation cannot do this: its leftmost interval has width $2^{-\alpha}$ and contains the singularity together with a whole neighbourhood of it. This, not the balanced degree, is the reason to reach for logarithmic segmentation.

**Saturating the count restores the missing knob.** As stated the scheme has no $\alpha$: the number of segments is $w_X+1$, dictated by the input width, with nothing to trade table size against multiplier count (§18.2.3.2, p. 550). Worse, $w_X+1$ is not a power of two, so the address decoder and the table are awkwardly sized. Both problems fall to one fix — **cap** $A$ at $\alpha$ bits, saturating rather than wrapping, which merges every interval left of $2^{-\alpha+1}$ into a single segment. The default is $\alpha=\lceil\log_2 2w_X\rceil$, and smaller values are legal: with $w_X=5$, choosing $\alpha=2$ caps $A$ at $3$ and merges the three leftmost intervals of Fig. 18.15 into one. Whether that is affordable is function-dependent, and the trade is legible: merging costs accuracy because the merged segment is nearest the singularity, and saves nothing on the evaluator because the polynomial hardware was already over-dimensioned on the left, where the shift has filled the low bits of $Y$ with zeros (p. 551).

**Which end you normalise against is a free choice.** Counting leading *zeros* clusters the segments at the left end of $I$ and is for functions singular at $0$. Counting leading *ones* clusters them at the right end, for a discontinuity at the top of the interval. Counting leading *sign* bits — the two's-complement version, identical hardware — clusters at both ends and is for functions singular at both (p. 550). The datapath above is unchanged in all three; only the count's definition moves.

$$\boxed{\ A=\mathrm{lzc}(X),\quad X=2^{-A-1}(1+Y),\quad Y=\lfloor X\ll A\rfloor_{w_Y},\qquad w_Y\le w_X-1\ }$$

## When it breaks

- **No singularity, no win.** If $f$ is smooth and its derivative varies mildly across $I$, uniform segmentation is strictly better: its reduction is pure wiring, its $Y$ is $w_X-\alpha$ bits, and it needs neither LZC nor shifter. Logarithmic segmentation only earns its keep against a discontinuity or an unbounded derivative.
- **The evaluator dominates.** The scheme trades a cheap reduction for narrower coefficients. Once the polynomial evaluator's multipliers are the area budget, the unreduced $w_Y$ eats the saving, and the answer is the LU hierarchical scheme — logarithmic first, uniform inside each resulting interval — where the per-interval $\alpha_2(A_1)$ *is* the knob this scheme lacks (see [[Hierarchical Segmentation]]).
- **$\alpha$ is a constrained knob.** Saturation is the only parameter, it moves table size only in powers of two, and it does so by degrading exactly the segments the scheme exists to serve.
- **The $w_Y$ search is empirical.** The LSB-shaving argument is a heuristic about small slope on the widest interval; how many bits survive depends on $f$ and on the input/output resolutions, so it must be found by decrementing $w_Y$ and re-running the error analysis, not by a formula.
- **Latency.** The reduction is now a serial LZC followed by a $\lceil\log_2 w_X\rceil$-stage barrel shifter *before* the table lookup can start, whereas uniform segmentation's address is available at the input pins. On a latency-critical path that prologue may cost more than the degree it saves.
- **Wrong end.** A leading-zero count is blind to a discontinuity at the right of $I$: there the segments are at their widest. Use the leading-one or leading-sign variant.

## RTL (Spade)

```spade
/// Saturating increment: holds at 2^N - 1 instead of wrapping.
fn inc_sat<#uint N>(v: uint<N>) -> uint<N> {
    let zero: uint<N> = 0;
    let ones = ~zero;
    if v == ones { v } else { trunc(v + 1) }
}

/// Leading-zero count of an MSB-first bit vector, saturated at 2^ALPHA - 1.
fn lzc_sat<#uint W, #uint ALPHA>(b: [bool; W]) -> uint<ALPHA> {
    gen if W == 0 {
        let zero: uint<ALPHA> = 0;
        ~zero
    } else {
        if b[0] { 0 } else { inc_sat(lzc_sat::<{W - 1}, ALPHA>(b[1..W])) }
    }
}

/// Range reduction X = 2^-(A+1) (1 + Y): normalise, drop the constant leading 1,
/// keep the WY most significant bits of what is left.
fn logseg<#uint W, #uint ALPHA, #uint WY>(x: uint<W>) -> (uint<ALPHA>, uint<WY>) {
    let a: uint<ALPHA> = lzc_sat(x.as_bits().reversed());
    let norm: uint<W> = x << zext(a);
    let k: uint<W> = W - WY;
    (a, trunc((norm << 1) >> k))
}
```

`logseg` is the `LZC / left shifter` box and nothing else — the coefficient table and the evaluator are the neighbouring notes. `x` is the $w_X$-bit input, `a` the $\alpha$-bit address, and the returned `uint<WY>` is $Y$; widths are const generics so the caller fixes $(w_X,\alpha,w_Y)$ at monomorphisation. `reversed()` is what makes the recursion scan from the MSB, since index $0$ of `as_bits()` is the LSB. `norm << 1` is the drop of the constant leading $1$ — a truncating $W$-bit shift, so the bit falls off the top rather than growing the word — and `>> k` then keeps the top $w_Y$ bits, `trunc` taking the low $w_Y$ of that. All three are `fn`, hence combinational: no clock, no state. Saturation lives in `inc_sat`, so the all-zero input and $X=2^{-w_X}$ collapse into the same address, which is §18.2.3.2's merge rather than an overflow bug. Synthesis will not build the linear recursion: an FPGA tool maps the count onto a LUT-based priority encoder and the shift onto a $\lceil\log_2 W\rceil$-stage barrel shifter, so read the recursion as the *specification* of $A$, not as its depth.

Simulated at $w_X=8$, $\alpha=3$, $w_Y=4$ through a concrete `entity logseg8(x: uint<8>) -> uint<7>` returning `a.concat(y)`: 8 named vectors — including the book's $.00101$ and the deliberately asymmetric $00010001$, whose bit-reversal lands in a different segment — plus a 3000-vector random sweep against a behavioural leading-zero-count reference, 3008/3008 matching.

## Related Notes (with context)

- [[Uniform Piecewise Segmentation]] – compares: the sibling this one exists to fix, and the one to prefer whenever $f$ has no singularity.
- [[Leading Zero Counters]] – depends-on: computes the segment index $A$; the whole scheme is this block plus a table.
- [[Barrel Shifters]] – depends-on: performs the variable left shift by $A$ that produces the reduced argument.
- [[Normalizers]] – depends-on: the fused count-and-shift block the architecture actually instantiates.
- [[Hierarchical Segmentation]] – extends: LU stacks a uniform level inside each logarithmic segment, supplying the memory/arithmetic knob this scheme lacks.
- [[Dichotomy-Based Segmentation]] – counter-example: drops all structure to balance the error exactly, and pays with a dichotomic search instead of an LZC.
- [[Polynomial Coefficient Table]] – depends-on: the table addressed by $A$, one polynomial per segment.
- [[Horner Evaluation]] – supports: the evaluator downstream, whose per-stage widths are sized from $w_Y$ and the coefficient magnitudes.
- [[Number Formats]] – depends-on: the $\text{ufix}$ conventions and the normalised-mantissa reading of $X=2^{-A-1}(1+Y)$.
- [[Error Accuracy]] – supports: the budget that decides how far $w_Y$ can be shaved.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 18 "Polynomial-Based Architectures for Function Evaluation":

- §18.2.2 Interpolation, pp. 547-548 — the contrast with tabulating polynomials.
- §18.2.3 Logarithmic piecewise splitting, pp. 548-549 — **Fig. 18.15** (segmentation of $\sqrt{\cdot}$ by leading-zero count), **Fig. 18.16** (architecture), Eqs. 18.16-18.17.
- §18.2.3.1 Size of the reduced argument, pp. 549-550 — $w_Y$ is not reduced; the LSB-shaving argument; the degenerate one-point intervals and the leading-one / leading-sign variants.
- §18.2.3.2 Saturating the leading bit count, pp. 550-551 — $\alpha=\lceil\log_2 2w_X\rceil$ and the merged leftmost segment.
- §18.2.4 Hierarchical segmentation, p. 551 — LU as the generic way to give this scheme a knob.
