---
title: "Function-Value Interpolation"
description: "Tabulates function values instead of coefficients and derives the polynomial from neighbours — saves the higher-degree tables but scales backwards with degree, so it loses to tabulated polynomials."
kind: circuit
source: "ASA §18.2.2, pp. 547-548"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, interpolation, table, segmentation]
aliases:
  - Interpolation
  - Linear Interpolation
  - Table Interpolation
  - Interpolation-Based Function Evaluation
  - Newton Forward-Difference Interpolation
---

# Function-Value Interpolation

A piecewise polynomial evaluator whose ROM holds *samples of $f$* rather than coefficients, so the polynomial is reconstructed at runtime from the neighbouring samples instead of being fitted offline.

```tikz title="Degree-1 function-value interpolation with a split even/odd table, against the tabulated-coefficient evaluator of the same segmentation"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% =============== panel (a): interpolation ===============
\node[anchor=west,font=\small] at (-1.5,6.15) {(a) function-value interpolation, degree 1};
\node[draw,thick,minimum width=0.55cm,minimum height=0.55cm] (ah) at (0.15,3.95) {$A$};
\node[draw,thick,minimum width=0.55cm,minimum height=0.55cm] (yl) at (0.15,3.05) {$Y$};
\draw[<-] (-0.45,3.5) -- (-1.45,3.5) node[left]{$X$, $14$};
\draw (-0.45,3.5) -- (-0.32,3.5);
\draw (-0.32,3.95) -- (-0.32,3.05);
\draw (-0.32,3.95) -- (-0.12,3.95);
\draw (-0.32,3.05) -- (-0.12,3.05);
\node[font=\tiny,anchor=south] at (0.15,4.25) {$\alpha=6$};
\node[font=\tiny,anchor=west] at (0.45,2.95) {$w_Y=8$};
\node[draw,thick,minimum width=1.35cm,minimum height=1.0cm,align=center] (ag) at (1.95,3.95)
  {{\tiny $\lceil A/2\rceil$}\\[-2pt]{\tiny $\lfloor A/2\rfloor$}};
\draw[->] (0.43,3.95) -- (1.27,3.95);
\node[draw,thick,minimum width=1.6cm,minimum height=0.9cm,align=center] (be) at (4.25,4.75)
  {{\tiny even bank}\\[-2pt]{\tiny $33\times16$}};
\node[draw,thick,minimum width=1.6cm,minimum height=0.9cm,align=center] (bo) at (4.25,3.15)
  {{\tiny odd bank}\\[-2pt]{\tiny $32\times16$}};
\draw[->] (2.63,4.2) -- (3.05,4.2) -- (3.05,4.75) -- node[above,font=\tiny,pos=0.3]{$6$} (3.45,4.75);
\draw[->] (2.63,3.7) -- (3.05,3.7) -- (3.05,3.15) -- node[below,font=\tiny,pos=0.3]{$5$} (3.45,3.15);
\node[draw,thick,minimum width=0.7cm,minimum height=1.7cm,align=center] (sw) at (6.35,3.95)
  {{\tiny s}\\[-2pt]{\tiny w}\\[-2pt]{\tiny a}\\[-2pt]{\tiny p}};
\draw[->] (5.05,4.75) -- (6.0,4.75) -- (6.0,4.45);
\draw[->] (5.05,3.15) -- (6.0,3.15) -- (6.0,3.45);
\draw[->] (6.35,2.6) node[below,font=\tiny]{$A_0$} -- (6.35,3.1);
\node[draw,thick,minimum width=0.6cm,minimum height=0.95cm] (sub) at (8.9,4.35) {$-$};
\draw[->] (6.7,4.6) -- node[above,font=\tiny,pos=0.46]{$T[A{+}1]$, $16$} (8.6,4.6);
\draw[->] (6.7,4.1) -- node[below,font=\tiny,pos=0.46]{$T[A]$, $16$} (8.6,4.1);
\draw (8.35,4.1) -- (8.35,5.55) -- node[above,font=\tiny,pos=0.62]{$T[A]$, $16$} (12.8,5.55);
\draw[->] (12.8,5.55) -- (12.8,4.28);
\node[draw,thick,minimum width=0.6cm,minimum height=0.95cm] (mul) at (10.5,4.35) {$\times$};
\draw[->] (9.2,4.35) -- node[above,font=\tiny]{$\Delta$, $17$} (10.2,4.35) -- (10.2,4.6);
\draw[thick] (0.15,1.75) -- (9.85,1.75);
\draw[->] (0.15,2.77) -- (0.15,1.75);
\draw[->] (9.85,1.75) -- (9.85,4.1) -- (10.2,4.1);
\node[font=\tiny,anchor=west] at (9.92,3.35) {$8$};
\node[draw,thick,minimum width=0.75cm,minimum height=0.55cm] (tr) at (11.7,4.35) {{\tiny $\gg8$}};
\draw[->] (10.8,4.35) -- node[above,font=\tiny]{$25$} (11.32,4.35);
\node[draw,thick,minimum width=0.6cm,minimum height=0.95cm] (add) at (12.8,3.8) {$+$};
\draw[->] (12.08,4.35) -- node[above,font=\tiny,pos=0.6]{$17$} (12.5,4.35) -- (12.5,3.8);
\draw[->] (13.1,3.8) -- (13.95,3.8) node[right]{$R$, $16$};
\node[font=\tiny,anchor=west] at (2.05,2.15) {table bits $=(2^{\alpha}{+}1)\cdot16=1040$};
% =============== panel (b): tabulated polynomial ===============
\node[anchor=west,font=\small] at (-1.5,0.55) {(b) tabulated degree-1 polynomial, same $\alpha$};
\node[draw,thick,minimum width=1.9cm,minimum height=1.2cm,align=center] (ct) at (4.25,-0.85)
  {{\tiny coeff.\ table}\\[-2pt]{\tiny $64\times(16{+}10)$}};
\draw[->] (0.8,-0.85) node[left]{$A$, $6$} -- (3.3,-0.85);
\node[draw,thick,minimum width=0.6cm,minimum height=0.95cm] (mul2) at (10.5,-1.35) {$\times$};
\node[draw,thick,minimum width=0.6cm,minimum height=0.95cm] (add2) at (12.8,-1.35) {$+$};
\draw (5.2,-0.5) -- node[above,font=\tiny,pos=0.66]{$C_0$, $16$} (12.8,-0.5);
\draw[->] (12.8,-0.5) -- (12.8,-0.87);
\draw[->] (5.2,-1.1) -- node[below,font=\tiny,pos=0.28]{$C_1$, $10$} (10.2,-1.1);
\draw[thick] (0.8,-2.85) -- (9.85,-2.85);
\node[left] at (0.8,-2.85) {$Y$, $8$};
\draw[->] (9.85,-2.85) -- (9.85,-1.6) -- (10.2,-1.6);
\node[font=\tiny,anchor=west] at (9.92,-2.15) {$8$};
\draw[->] (10.8,-1.35) -- node[above,font=\tiny]{$18$} (12.5,-1.35);
\draw[->] (13.1,-1.35) -- (13.95,-1.35) node[right]{$R$, $16$};
\node[font=\tiny,anchor=west] at (5.6,-2.3) {table bits $=2^{\alpha}\cdot26=1664$};
% =============== footer ===============
\node[font=\tiny,align=left,anchor=north west] at (-1.9,-3.35)
  {(a) stores one value per entry, and pays a subtractor, a swap mux and split even/odd addressing to see two neighbours at once.\\
   (b) stores two coefficients per entry and drives the multiplier directly. At $d=1$, (a) wins $1.6\times$ on table bits and loses\\
   exactly $1$ bit of approximation accuracy; at degree $d$ it needs $d{+}1$ banks and $d(d{+}1)/2$ subtractors, and loses more bits.};
\end{circuitikz}
\end{document}
```

*Own construction. §18.2.2 carries no figure; the parameters are those of the Spade block below.*

**Move the fitting from generate time to run time.** Every other architecture in [[Polynomial Approximation]] runs [[Remez Minimax]] offline, once per subinterval, and burns the resulting $C_0\dots C_d$ into a ROM. Interpolation [Lee+08] burns $T[A]=f(2^{-\alpha}A)$ instead — the function itself, sampled on the segmentation grid — and reconstructs a degree-$d$ polynomial from $d+1$ consecutive samples in the datapath. The reduction is the wire split of [[Uniform Piecewise Segmentation]]: $X=2^{-\alpha}(A+Y)$ with $A$ the top $\alpha$ bits and $Y\in[0,1)$ the bottom $w_Y=w_X-\alpha$. Only degree-0 data is ever stored, which is the entire attraction.

**Newton's forward-difference form is the one that costs nothing to build.** The interpolating polynomial through $T[A],\dots,T[A+d]$ is unique, so any basis gives the same $p$; the choice is purely about which one the hardware can assemble. Lagrange needs $d+1$ full multiplications by node-dependent constants. Newton's forward form needs only *differences*, because on an equispaced grid the divided differences collapse: the $k$-th divided difference over nodes spaced $h$ is $\Delta^k T/(k!\,h^k)$, and the $h^k$ cancels against the $h^k$ in the node product. Writing $\Delta T[A]=T[A+1]-T[A]$ and $\Delta^{k}=\Delta(\Delta^{k-1})$,

$$p(Y)=\sum_{k=0}^{d}\binom{Y}{k}\Delta^{k}T[A],\qquad \binom{Y}{k}=\frac{Y(Y-1)\cdots(Y-k+1)}{k!} .$$

Factoring by distributivity in reverse — the same manoeuvre as [[Horner Evaluation]], but with the multiplier input shifted by an integer at each stage:

$$p(Y)=T[A]+Y\!\left[\Delta T+\tfrac{Y-1}{2}\!\left[\Delta^{2}T+\tfrac{Y-2}{3}\big[\cdots\big]\right]\right].$$

Each stage is one multiply and one add, exactly as in Horner, plus one *constant* subtraction $Y-k$ and one division by the constant $k$. At $d=1$ every one of those extras vanishes and the whole thing is

$$p(Y)=T[A]+Y\,\big(T[A+1]-T[A]\big),$$

one subtractor ahead of an ordinary multiply-add. Panel (a) is that expression.

**Reading two neighbours is the real architectural cost, and banking is what makes it affordable.** A single-port ROM delivers one word per cycle, so $T[A]$ and $T[A+1]$ need either two cycles, a duplicated ROM — which throws away the entire saving — or a **split into even and odd banks**: entry $A$ lives in bank $A\bmod 2$ at address $\lfloor A/2\rfloor$, so any two consecutive entries are always in *different* banks and can be read simultaneously with no duplication. The addresses are not the same, though. Reading $T[A]$ and $T[A+1]$ needs

$$\text{even bank addr}=\lceil A/2\rceil,\qquad \text{odd bank addr}=\lfloor A/2\rfloor,$$

which in hardware is $(A+1)\gg1$ and $A\gg1$: one incrementer of $\alpha$ bits. The two outputs then arrive in an order that depends on the parity of $A$, so a $w_T$-bit two-way swap mux steered by $A_0$ restores $(T[A],T[A+1])$. Generalising to degree $d$ costs $d+1$ banks, a mod-$(d+1)$ address generator — no longer a shift, a real small divider or a $(d+1)$-way rotate — and a $(d+1)$-way barrel rotation of the outputs.

**The stored values need guard bits, and the amount is a Lebesgue constant.** Writing $\widetilde T=T+e$ for the rounded table, linearity of interpolation gives $\tilde p(Y)-p(Y)=\sum_k L_k(Y)\,e_k$ with $L_k$ the Lagrange basis on the node offsets, so the worst-case amplification of a table entry's rounding error is $\Lambda_d=\max_{Y\in[0,1)}\sum_k|L_k(Y)|$. At $d=1$, $L_0=1-Y$ and $L_1=Y$ are both non-negative and sum to $1$ — the result is a **convex combination** of the two entries, so $\Lambda_1=1$ exactly and interpolation needs *no* guard bits over a tabulated $C_0$. At $d=2$ on nodes $\{0,1,2\}$ the basis is $L_0=\frac{(Y-1)(Y-2)}{2}$, $L_1=-Y(Y-2)$, $L_2=\frac{Y(Y-1)}{2}$, worst at $Y=\frac12$ where $|L|$ sums to $1.25$: $\log_2 1.25=0.32$ bits of guard. The book's claim that "the hardware computing the coefficients needs to be even more accurate" (p. 548) is therefore true but *quantitatively mild* — the amplification is fractions of a bit, not the catastrophic cancellation the phrase suggests. The formats themselves are the usual ones ([[Number Formats]]), and the term joins the four-way ulp split of [[Error Accuracy]].

> [!important] The real penalty is approximation error, not rounding error
> Interpolation does not get to choose its polynomial. It is pinned to the one that passes exactly through $d+1$ grid points, which is *not* the minimax polynomial on the segment, and the gap is the whole story of this note.

**Price the pinned polynomial against the free one.** For $p$ interpolating $f$ at nodes $x_k$, the Newton remainder is

$$f(x)-p(x)=\frac{f^{(d+1)}(\xi)}{(d+1)!}\prod_{k=0}^{d}(x-x_k),\qquad \xi\in I .$$

Substituting $x=2^{-\alpha}(A+Y)$ and nodes at integer offsets $k$ in $Y$-units pulls out $h^{d+1}$ with $h=2^{-\alpha}$:

$$\bar\delta_{\text{interp}}=\frac{\|f^{(d+1)}\|_{\infty}}{(d+1)!}\;h^{d+1}\max_{Y\in[0,1)}\prod_{k\in\mathcal N}|Y-k| .$$

The minimax polynomial on the same segment is bounded by the same prefactor times the sup norm of the monic Chebyshev polynomial of degree $d+1$ scaled to width $h$, which is $2(h/4)^{d+1}$ ([[Remez Minimax]]). The $f^{(d+1)}$ and the factorial cancel, and the ratio is pure combinatorics of the node set:

$$\boxed{\ \rho_d=\frac{\bar\delta_{\text{interp}}}{\bar\delta_{\text{minimax}}}=\frac{4^{\,d+1}}{2}\;\max_{Y\in[0,1)}\prod_{k\in\mathcal N}|Y-k|\ }$$

with $\mathcal N$ the $d+1$ integer node offsets, chosen as symmetrically about $[0,1)$ as parity allows:

| $d$ | $\mathcal N$ | $\max\prod\lvert Y-k\rvert$ | $\rho_d$ | bits lost |
| --- | --- | --- | --- | --- |
| 1 | $\{0,1\}$ | $1/4$ at $Y=\tfrac12$ | $2$ | $1.00$ |
| 2 | $\{0,1,2\}$ | $0.3849$ at $Y=1-\tfrac{1}{\sqrt3}$ | $12.32$ | $3.62$ |
| 3 | $\{-1,0,1,2\}$ | $0.5625$ at $Y=\tfrac12$ | $72.0$ | $6.17$ |

At degree 1 the loss is *exactly one bit*, and the $\frac{h^2}{8}\|f''\|$ bound this reproduces is the classical linear-interpolation error. Beyond that it worsens by roughly $2.6$ bits per degree, because the extra nodes are pushed further outside the segment being evaluated while Chebyshev is free to place its nodes inside it.

**Now settle the trade, because both effects touch the same table.** By Law 2 the error scales as $h^{d+1}$, so recovering $b_d$ lost bits means shrinking $h$ by $2^{b_d/(d+1)}$, i.e. spending $\Delta\alpha=b_d/(d+1)$ more address bits — and the table is exponential in $\alpha$. Against that, the table saving: a tabulated degree-$d$ entry holds $C_0$ at $w_R$ bits plus $C_i$ at roughly $w_R-i\alpha$ bits each (coefficient $i$ has MSB near $-i\alpha$ since $|C_iY^i|\le|C_i|$ and $Y<1$), while interpolation holds one $w_R$-bit word. Taking $\alpha\approx w_R/(d+1)$ from the same law, with $w_R=16$:

| $d$ | $\alpha$ | tabulated bits/entry | saving | $\times$ from $\Delta\alpha$ | net |
| --- | --- | --- | --- | --- | --- |
| 1 | $8$ | $16+8=24$ | $1.50$ | $2^{0.50}=1.41$ | $1.06$ |
| 2 | $5$ | $16+11+6=33$ | $2.06$ | $2^{1.21}=2.31$ | $0.89$ |
| 3 | $4$ | $16+12+8+4=40$ | $2.50$ | $2^{1.54}=2.91$ | $0.86$ |

The nominal saving grows with degree — and so does the accuracy debt, faster. Beyond degree 1 interpolation ends up with a *larger* table than the architecture it was supposed to shrink, on top of the extra banks and the $d(d+1)/2$ subtractors of the difference triangle. That reproduces [Lee+08]'s measured verdict from the error bounds alone, and it is the precise sense in which the technique "scales backwards with degree": with tabulated polynomials the table shrinks as the arithmetic grows, here they grow together.

**Degree 1 is the only survivor, and it is a 6% win.** A $1.06\times$ table saving bought with a $w_T$-bit subtractor in front of the multiplier, an $\alpha$-bit incrementer, a $w_T$-bit swap mux and a banked ROM is not obviously worth having, and it costs one extra adder delay on the critical path. Which is why the honest comparison at degree 1 is not against tabulated polynomials at all but against [[Multipartite Methods]], which reach the same accuracy class with **no multiplier whatsoever** [DT05] — and that is where the technique loses outright.

**On FPGAs the banking is nearly free and the extra entry is not.** Block RAMs are natively dual-port, so on Xilinx or Intel silicon the "two banks" are one BRAM read through both ports, the address incrementer is a handful of LUTs, and the swap mux disappears into the LUTs already feeding the subtractor ([[FPGAs]]). But the table needs $2^\alpha+d$ entries, not $2^\alpha$ — and if $2^\alpha$ already exactly fills a BRAM, the $d$ overflow words cost a second block, doubling the memory for a fraction of a percent more data. On an ASIC the synthesized ROM absorbs the odd size smoothly but the second read port is a genuine area adder, so the two technologies penalise opposite ends of the same structure.

**When it breaks.**

- **Non-uniform segmentation.** [[Logarithmic Segmentation]] and [[Dichotomy-Based Segmentation]] produce unequally spaced nodes, so the $h^k$ no longer cancels and every stage needs a per-segment reciprocal $1/(x_j-x_k)$ — which must itself be tabulated, restoring exactly the coefficient table interpolation set out to delete. Interpolation is welded to uniform splitting.
- **The node span reaches past the segment.** Degree $d$ needs $f$ to be $(d+1)$-times differentiable across $d$ segments *beyond* the one being evaluated, so a discontinuity or an unbounded derivative poisons the $d$ segments to its left as well as its own. Tabulated polynomials are per-segment and confine the damage to one.
- **Table edges.** The last $d$ segments index past $2^\alpha-1$. Either extend the table by $d$ entries (the non-power-of-two wart above) or fall back to a lower degree there, which means a second datapath.
- **Above degree 1 it loses to [[Polynomial Coefficient Table]]; at degree 1 it loses to [[Multipartite Methods]].** There is no $(d,\alpha)$ where it is the best answer on area alone.
- **Where it still wins:** when $T$ is not yours to precompute. Remez cannot run in hardware, but a subtraction can — so if the samples are written at runtime (a calibration LUT, a user-supplied transfer curve, a shared sine ROM already present for another operator) interpolation is the only member of this family that applies at all. That is the "specific situation" p. 548 gestures at without naming.

**RTL (Spade).**

```spade
/// addresses of T[A] and T[A+1] in the even/odd bank pair
fn bank_addrs(a: uint<6>) -> (uint<6>, uint<5>) {
    let ae: uint<7> = (a + 1) >> 1;
    (trunc(ae), trunc(a >> 1))
}

/// degree-1 Newton interpolation:  T[A] + Y*(T[A+1] - T[A]),  Y = y/2^8
fn lerp16(t0: int<16>, t1: int<16>, y: uint<8>) -> int<17> {
    let d:   int<17> = t1 - t0;
    let yv:  int<17> = sext(y.to_int());
    let p:   int<34> = d * yv;
    let q:   int<17> = trunc(p >>> 8);
    let t0e: int<17> = sext(t0);
    trunc(t0e + q)
}

entity interp1(a: uint<6>, y: uint<8>, be: int<16>, bo: int<16>) -> int<17> {
    let (t0, t1) = if a.as_bits()[0] { (bo, be) } else { (be, bo) };
    lerp16(t0, t1, y)
}
```

`be`/`bo` are the two bank outputs of panel (a), already registered by the ROM; `a.as_bits()[0]` is $A_0$ and the `if` is the swap mux, so `interp1` is combinational from the bank outputs to $R$ and the whole operator is one ROM stage plus this. `d` is the subtractor and grows to $17$ bits as $\Delta$ must, since $T[A+1]-T[A]$ spans the full signed range of a $16$-bit difference; `>>> 8` is the fixed binary point of $Y$, arithmetic so that a decreasing $f$ floors toward $-\infty$ rather than toward zero. Two things synthesis does differently from the drawing: Spade's `*` demands equal operand widths, so the source says $17\times17\to34$ where the diagram says $17\times8\to25$ — the nine sign-extension bits of `yv` are constant and a synthesizer trims them; and the $17$-bit output is one bit wider than it needs to be, because $T[A]+\lfloor Y\Delta\rfloor$ is a convex combination of two $16$-bit entries and provably fits in $16$.

Compiled clean first try, and `.zettel/sim.sh` passes $5007$ vectors on `interp1` — seven named cases including $Y=0$, $Y\to1$, the asymmetric pair $T[A]=1,\ T[A+1]=128$ at both parities of $A$, a full-scale negative slope and a floor-rounding case, plus a $5000$-vector random sweep against `t0 + ((t1-t0)*y >>> 8)`. Mutating the swap mux to ignore $A_0$ makes it fail, so the check has teeth. `bank_addrs` is exercised separately over all $64$ values of $A$ against $\lceil A/2\rceil,\lfloor A/2\rfloor$.

**Related Notes**

- [[Polynomial Coefficient Table]] – compares: stores $d+1$ fitted coefficients per entry instead of one sample, and wins everywhere above degree 1.
- [[Uniform Piecewise Segmentation]] – depends-on: supplies the equispaced grid without which the divided differences do not collapse.
- [[Multipartite Methods]] – counter-example: takes degree 1, the only case interpolation wins, and does it with no multiplier at all.
- [[Table-Based Function Evaluation]] – extends: the $d=0$ limit of this note, one entry per input and no arithmetic between neighbours.
- [[Remez Minimax]] – compares: the offline fit interpolation declines to perform, and the $\rho_d$ it pays for declining.
- [[Horner Evaluation]] – supports: the Newton form is Horner with the multiplier input offset by an integer at each stage.
- [[Logarithmic Segmentation]] – counter-example: unequal node spacing, where every stage would need a tabulated reciprocal.
- [[Choosing a Polynomial Evaluator]] – compares: where a $1.06\times$ table saving at one extra adder delay actually sits.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18 "Polynomial-Based Architectures for Function Evaluation".

- §18.2.2 Interpolation, pp. 547-548 — the four objections and the [Lee+08] verdict
- §18.2.1 uniform piecewise splitting, Eqs. (18.3)-(18.4), pp. 541-543 — the wire-split reduction and coefficient formats used here
- §18.1.4 interval size versus accuracy, pp. 535-536 — Law 2, which converts lost bits into extra address bits

Cited works: [Lee+08] (interpolation, and the quantitative comparison against tabulated polynomials), [DT05] (multipartite beats degree-1 interpolation).

The remainder formula, the Lebesgue constants $\Lambda_1=1$ and $\Lambda_2=1.25$, the table of $\rho_d$ and the net-area table are derived here from the Newton remainder and the Chebyshev bound of §18.1; the book states the conclusions qualitatively without them.
