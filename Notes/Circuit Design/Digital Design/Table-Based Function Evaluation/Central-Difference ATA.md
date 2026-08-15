---
title: "Central-Difference ATA"
description: "Three reads of the same table and a centred difference push the error to third order; the same three reads also support a full second-order Taylor form whose extra rounding eats the accuracy it bought."
kind: circuit
source: "ASA §17.3.1, pp. 523-526"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, ata, function-evaluation, interpolation]
aliases:
  - Second-Order ATA
  - Central Difference ATA
  - Wong-Goto Second-Order Method
---

# Central-Difference ATA

Wong and Goto's second-order ATA: the same one-table, one-adder skeleton as [[ATA, Addition-Table-Addition]], but with the derivative estimated from a *centred* difference $f(A{+}B)-f(A{-}B)$ instead of a forward one, which costs a third read of the same table and removes a factor $2^{\beta}$ from the error.

```tikz title="Central-difference ATA: the chord through f(A-B) and f(A+B) supplies the slope, and the datapath that reads it out of one table"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ============ panel 1: the geometry of the central difference =============
\begin{scope}[yshift=-0.2cm]
  \draw[->,gray] (0.2,0) -- (4.2,0) node[right,font=\tiny]{$x$};
  \draw[->,gray] (0.3,-0.1) -- (0.3,2.6);
  \draw[very thick,purple] plot[domain=0.3:3.9,samples=60,smooth] (\x,{2.2*sin(25*\x)});
  \foreach \p in {1.0,1.6,2.2}{ \draw[red!50] (\p,0) -- (\p,2.45); }
  \draw[densely dashed,blue!70] (1.75,0) -- (1.75,2.1);
  \draw[thick,blue] (1.0,0.930) -- (2.2,1.802);
  \draw[thick,orange!90!black] (1.36,1.239) -- (2.02,1.719);
  \fill[green!50!black] (1.0,0.930) circle (1.6pt);
  \fill[green!50!black] (1.6,1.414) circle (1.6pt);
  \fill[green!50!black] (2.2,1.802) circle (1.6pt);
  \fill[orange!90!black] (1.75,1.523) circle (1.4pt);
  % leader lines, labels parked in the empty region under the curve
  \draw[gray,thin] (0.98,0.88) -- (0.78,0.36);
  \node[font=\tiny,anchor=north] at (0.70,0.34) {$f(A{-}B)$};
  \draw[gray,thin] (1.6,1.39) -- (1.35,0.80);
  \node[font=\tiny,anchor=north] at (1.32,0.78) {$f(A)$};
  \draw[gray,thin] (2.2,1.78) -- (2.60,1.35);
  \node[font=\tiny,anchor=west] at (2.58,1.30) {$f(A{+}B)$};
  \draw[gray,thin] (1.77,1.50) -- (2.10,0.95);
  \node[font=\tiny,anchor=west] at (2.06,0.90) {$\tilde f(X)$};
  \node[font=\tiny,anchor=north] at (1.0,-0.05) {$A{-}B$};
  \node[font=\tiny,anchor=north] at (1.62,-0.05) {$A$};
  \node[font=\tiny,anchor=north] at (2.2,-0.05) {$A{+}B$};
  \draw[gray,thin] (1.75,-0.02) -- (2.05,-0.62);
  \node[font=\tiny,anchor=west,blue!70] at (2.03,-0.66) {$X=A+2^{-\beta}B$};
  \node[font=\tiny,align=center] at (2.2,3.15)
    {slope of the blue chord $=\dfrac{f(A{+}B)-f(A{-}B)}{2B}=f'(A)+\dfrac{B^{2}}{6}f'''(A)$\\[2pt]
     the orange line is that slope moved to $A$; $\tilde f(X)$ is read off it};
\end{scope}
% ============ panel 2: the datapath =======================================
\begin{scope}[xshift=7.4cm]
  \draw[thick] (0,3.2) rectangle (3.0,3.7);
  \foreach \i in {0.5,1.0,1.5,2.5} \draw[gray] (\i,3.2) -- (\i,3.7);
  \draw[very thick] (2.0,3.2) -- (2.0,3.7);
  \node[font=\tiny,anchor=east] at (-0.1,3.45) {$X$, $w_X{=}6$};
  \node[font=\tiny] at (1.0,3.92) {$A$ ($\alpha{=}4$)};
  \node[font=\tiny] at (2.5,3.92) {$B$ ($\beta{=}2$)};
  % buses
  \draw (1.0,3.2) -- (1.0,2.85) -- (-0.5,2.85);
  \draw (1.0,2.85) -- (4.3,2.85);
  \draw (2.5,3.2) -- (2.5,2.60) -- (0.1,2.60);
  \draw (2.5,2.60) -- (3.9,2.60);
  \node[font=\tiny,anchor=south] at (0.35,2.86) {$4$};
  \node[font=\tiny,anchor=south] at (1.55,2.61) {$2$};
  % address adders
  \node[draw,thick,minimum width=1.15cm,minimum height=0.45cm,font=\tiny] (am) at (-0.1,2.0) {$A{-}B$};
  \node[draw,thick,minimum width=1.15cm,minimum height=0.45cm,font=\tiny] (ap) at (3.6,2.0) {$A{+}B$};
  \draw[->] (-0.5,2.85) -- (-0.5,2.225);
  \draw[->] (0.1,2.60) -- (0.1,2.225);
  \draw[->] (3.3,2.85) -- (3.3,2.225);
  \draw[->] (3.9,2.60) -- (3.9,2.225);
  % table
  \node[draw,thick,minimum width=4.6cm,minimum height=0.8cm,align=center] (t) at (1.7,1.15)
    {one table, three reads\\[-2pt]{\tiny $2^{\alpha}+2^{\beta+1}-2$ entries of $w_T$ bits}};
  \draw[->] (-0.1,1.775) -- node[left,font=\tiny]{$5$} (-0.1,1.55);
  \draw[->] (3.6,1.775) -- node[right,font=\tiny]{$5$} (3.6,1.55);
  \draw[->] (4.3,2.85) -- (4.3,1.15) -- (4.0,1.15);
  \node[font=\tiny,anchor=west] at (4.35,2.45) {$4$};
  % difference
  \node[draw,thick,minimum width=0.9cm,minimum height=0.45cm,font=\tiny] (sub) at (2.7,-0.15) {$-$};
  \draw[->] (0.8,0.75) -- (0.8,-0.15) -- (2.25,-0.15);
  \draw[->] (3.2,0.75) -- (3.2,0.40) -- (2.7,0.40) -- (2.7,0.075);
  \node[font=\tiny,anchor=west] at (0.85,0.45) {$f(A{-}B)$, $w_T$};
  \node[font=\tiny,anchor=west] at (3.25,0.60) {$f(A{+}B)$, $w_T$};
  % shift
  \node[draw,thick,minimum width=1.4cm,minimum height=0.45cm,font=\tiny] (sh) at (2.7,-1.0) {$\gg(\beta{+}1)$};
  \draw[->] (2.7,-0.375) -- node[right,font=\tiny]{$w_T{+}1$} (2.7,-0.775);
  % final adder
  \node[draw,thick,minimum width=3.4cm,minimum height=0.5cm] (add) at (1.4,-1.9) {$+$};
  \draw[->] (2.7,-1.225) -- (2.7,-1.65);
  \draw[->] (-0.4,0.75) -- (-0.4,-1.9) -- (-0.3,-1.9);
  \node[font=\tiny,anchor=west] at (-0.35,-0.55) {$f(A)$, $w_T$};
  \draw[->] (1.4,-2.15) -- (1.4,-2.75);
  \node[font=\tiny,anchor=north] at (1.4,-2.78) {$\tilde f(X)$ on $w_T{+}2$ bits, truncated to $w_R$};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 17.17, p. 525; the datapath panel is my own construction*

**Fix the decomposition, because everything below turns on which grid $B$ lives on.** As in the [[Bipartite Table Method]] the input word $X\in[0,1)$ of $w_X$ bits is cut into an $\alpha$-bit head and a $\beta$-bit tail, but ATA writes the cut as

$$X = A + 2^{-\beta}B,\qquad \alpha>\beta,\qquad \alpha+\beta = w_X$$

with **both $A$ and $B$ measured on the same $2^{-\alpha}$ grid**. Concretely: if $\hat X$ is the $w_X$-bit integer, $\hat A$ its top $\alpha$ bits and $\hat B$ its bottom $\beta$ bits, then $A = 2^{-\alpha}\hat A$ and $B = 2^{-\alpha}\hat B$, so $2^{-\beta}B = 2^{-w_X}\hat B$ is exactly the low field at its natural weight. That re-scaling is the whole trick of the ATA family: $A\pm B$ is an $\alpha$-bit integer add whose result is a **legal address into the same table** that stores $f$ on the $A$ grid. Format conventions are in [[Number Formats]]; the one-ulp budget the error must fit inside is in [[Error Accuracy]].

**Estimate the slope from a chord centred on $A$, not one hanging off it.** First-order ATA takes the forward difference $f(A{+}B)-f(A)$. By Taylor's theorem about $A$,

$$f(A{+}B)-f(A) = Bf'(A) + \tfrac{B^2}{2}f''(A) + O(B^3)$$

so that estimate of $Bf'(A)$ is wrong at **second** order in $B$. Expand the symmetric pair instead and the even-order terms cancel term by term — $f(A{+}B)$ and $f(A{-}B)$ agree in $f(A)$ and in $\tfrac{B^2}{2}f''(A)$, and differ only in sign on the odd terms:

$$\tfrac12\bigl(f(A{+}B)-f(A{-}B)\bigr) = Bf'(A) + \tfrac{B^3}{6}f'''(A) + O(B^5)$$

The error is now **third** order in $B$, and because the surviving series is odd the next correction after $f'''$ is $f^{(5)}$, not $f^{(4)}$. Substituting this into the first-order Taylor form $f(A+2^{-\beta}B)\approx f(A)+2^{-\beta}Bf'(A)$ and folding the $\tfrac12$ into the shift gives the operator.

**See where the $2^{\beta}$ goes, because that is the entire win.** Write $u = 2^{-\beta}B \in [0,2^{-\alpha})$ for the true offset from $A$, so $B = 2^{\beta}u$. The exact value is $f(A+u) = f(A) + uf'(A) + \tfrac{u^2}{2}f''(A) + O(u^3)$. Substituting $B=2^{\beta}u$ into the forward-difference operator gives

$$\tilde f_{\mathrm{fwd}} = f(A) + uf'(A) + \tfrac{2^{\beta}u^{2}}{2}f''(A) + \cdots,\qquad \tilde f_{\mathrm{fwd}} - f = \tfrac{u^{2}}{2}f''(A)\bigl(2^{\beta}-1\bigr)$$

— the difference formula's $B^2$ error is divided by $2^{\beta}$ once, but it started out $2^{2\beta}$ too large, so it lands **amplified by $2^{\beta}$** relative to the Taylor truncation it was meant to hide under. The centred operator has no quadratic term at all, only a cubic:

$$\tilde f_{\mathrm{ctr}} = f(A) + uf'(A) + \tfrac{2^{2\beta}u^{3}}{6}f'''(A) + \cdots,\qquad \tilde f_{\mathrm{ctr}} - f = -\tfrac{u^{2}}{2}f''(A) + \tfrac{2^{2\beta}u^{3}}{6}f'''(A)$$

Same three-term skeleton, error smaller by roughly $2^{\beta}$, bought with one extra read of a table you already have.

> [!important]
> The name misleads. "Second-order" is the order of the **difference stencil**, not of the interpolant. $\tilde f_{\mathrm{ctr}}$ is $f(A) + uf'(A)$ plus a cubic — it carries **no $u^2$ term**, so it cannot represent $\tfrac{u^2}{2}f''(A)$ and its residual error is $\Theta(2^{-2\alpha})$, exactly the order-one figure. Central-difference ATA therefore inherits the $\alpha\gtrsim w_X/2$ bound that [[Multipartite Methods]] proves for *every* scheme addressing a table of initial values with $\alpha$ bits (p. 523). It is a better order-one method, not an order-two method — which is why it competes with multipartite instead of beating it.

**Spend the third read a second way, and watch rounding take the profit back.** The three values $f(A{-}B), f(A), f(A{+}B)$ are also a second-difference stencil: differencing the two one-sided slope estimates taken at $A\pm B/2$ gives $f''(A)\approx\bigl(f(A{+}B)-2f(A)+f(A{-}B)\bigr)/B^2$. Put that into the genuine second-order Taylor form $f(A+u)\approx f(A)+uf'(A)+\tfrac{u^2}{2}f''(A)$ and substitute $u=2^{-\beta}B$; the $B^2$ in the denominator cancels against the $B^2$ in $u^2$:

$$f(A+2^{-\beta}B)\approx f(A)+2^{-\beta-1}\bigl(f(A{+}B)-f(A{-}B)\bigr)+2^{-2\beta-1}\bigl(f(A{+}B)-2f(A)+f(A{-}B)\bigr)$$

This *is* order two, so on paper it reaches $\alpha\gtrsim w_X/3$. It does not pay: every extra addition truncates, and the book's verdict (p. 526) is that the additional rounding error consumes the accuracy the formula bought. The lesson generalises — an approximation-error improvement is only real if the rounding-error share of the budget in [[Error Accuracy]] has room for it, and by the time you have pushed $\alpha$ down to $w_X/3$ it does not.

**Count the hardware, and note the one cost the book does not.** The book's tally (p. 525) is three reads of one table and 7 additions. Four of them are structural and visible in the datapath above — $A{+}B$ and $A{-}B$ on $\alpha$ bits, the $w_T$-bit difference, and the final $w_T$-bit sum — with the division by $2^{\beta+1}$ free as a hardwired shift. Three reads of one table is the interesting constraint: a true-dual-port [[Block Memory]] yields two per cycle, so you either duplicate the table (two blocks, three of four ports used), sequence the reads over two cycles, or — cheapest when $\alpha$ is small — let the tool replicate it in LUTs, where a third read is a third copy of the logic cone and no routing drama. On an ASIC the third read is just a third decoder over a shared cell array, so the FPGA penalty here is real and the ASIC one is not.

> [!warning] Not covered in the source — the address range
> The book writes $f(A{+}B)$ and $f(A{-}B)$ as though the table were unbounded. It is not: $\hat A\pm\hat B$ ranges over $[-(2^{\beta}-1),\ 2^{\alpha}-1+2^{\beta}-1]$, so the table needs a guard band of $2^{\beta}-1$ entries at each end and holds $2^{\alpha}+2^{\beta+1}-2$ entries, not $2^{\alpha}$. That is what the datapath panel above and the RTL below implement. The alternative — saturating or reflecting the address at the ends — silently changes the function being evaluated in the first and last segments. Neither the guard band nor its cost appears in the book's comparison against multipartite.

$$\boxed{\ \tilde f(X) = f(A) + 2^{-\beta-1}\bigl(f(A{+}B)-f(A{-}B)\bigr),\qquad \tilde f(X)-f(X) = -\tfrac{u^{2}}{2}f''(A) + \tfrac{2^{2\beta}u^{3}}{6}f'''(A),\quad u=2^{-\beta}B\ }$$

**When it breaks.**

- **$f'''$ must be bounded, not just $f''$.** The forward-difference version only needs $f''$; the centred one puts $f'''$ into the error term, so a function with a mild second derivative and a violent third one loses the advantage on exactly the segments where it is needed.
- **The two error terms cross over.** Comparing $\tfrac{u^2}{2}|f''|$ with $\tfrac{2^{2\beta}u^3}{6}|f'''|$ at $u<2^{-\alpha}$, the cubic term dominates once $2^{2\beta-\alpha}\gtrsim 3|f''|/|f'''|$. Pushing $\beta$ up to shrink the table brings the $f'''$ term back; that, not the address width, is the real ceiling on $\beta$.
- **Symmetry does not compose for free.** The $\pm B$ addressing already uses the sign trick that a [[Symmetric Table of Offsets]] spends to halve a table; applying both needs care, and the book only remarks that symmetry "can be used" (p. 526) without giving the construction.
- **It loses on the merits.** Measured on the same functions, ATA and STAM beat the original bipartite method and lose to generalised multipartite ([DT05], p. 526). Build this only when the $\pm B$ structure buys something else — a table shared with another operator, or a function whose table is already sitting in block RAM.
- **Above the LUT/BRAM crossover none of it matters.** If the plain $2^{w_X}\times w_R$ ROM fits in block RAM you are not otherwise using, build the plain ROM.

**RTL (Spade).** A concrete instance: $w_X=6$, $\alpha=4$, $\beta=2$, tabulating $2^{10}\sin(\pi t/4)$ at $t=(k-3)/16$ — the $-3$ is the low guard band, so the address is $k=\hat A\pm\hat B+3$.

```spade
entity ata_cd6(x: uint<6>) -> int<13> {
    let tbl: [int<11>; 32] = [
        -150, -100, -50, 0, 50, 100, 150, 200, 249, 297, 345, 392,
        438, 483, 526, 569, 610, 650, 688, 724, 759, 792, 822, 851,
        878, 903, 926, 946, 964, 980, 993, 1004,
    ];

    let bits = x.as_bits();
    let a: uint<4> = bits[2..6].as_uint();   // A, on the table grid
    let b: uint<2> = bits[0..2].as_uint();   // B, read at A's weight

    let a6: uint<6> = zext(a);
    let b6: uint<6> = zext(b);
    let ac: uint<5> = trunc(a6 +. 3);        // address of f(A)
    let ap: uint<5> = trunc(a6 +. b6 +. 3);  // address of f(A+B)
    let am: uint<5> = trunc(a6 +. 3 -. b6);  // address of f(A-B)

    let diff: int<12> = tbl[ap] - tbl[am];   // signed; `-` grows by one bit
    let term: int<12> = diff >>> 3;          // 2^-(beta+1), arithmetic shift
    sext(tbl[ac]) + term
}
```

`ap` and `am` are the two address adders in the diagram, `ac` the straight-through $f(A)$ path; all three are 5 bits rather than 4 because the guard band pushes the range past $2^{\alpha}$. The table is signed `int<11>` because $f$ dips below zero inside the low guard band and because the difference is signed regardless — hence `>>>`, an arithmetic shift, where a logical `>>` compiles just as cleanly and is wrong for every $X$ on a decreasing stretch of $f$. Widths grow $11\to12$ at the difference and $12\to13$ at the final sum, matching the $w_T{+}2$ in the drawing. The block is entirely combinational; synthesis will *not* build one table with three ports as drawn — it replicates `tbl` into three LUT cones, or, if you force block RAM, into two dual-port blocks.

Checked against a behavioural Verilog reference on **3066 vectors**: all 64 inputs exhaustively, two named asymmetric cases at the extremes ($\hat A{=}0,\hat B{=}3$ and $\hat A{=}15,\hat B{=}3$ — the only vectors that exercise both guard bands), and a 3000-vector random sweep.

**Related Notes**

- [[ATA, Addition-Table-Addition]] – extends: the same skeleton with a forward difference; this note swaps in the centred one and drops a factor $2^{\beta}$ from the error.
- [[STAM, Symmetric Table Addition Method]] – extends: Wong and Goto's actual method, splitting $B=B_1+2^{\beta/2}B_2$ into two centred differences plus a correction table.
- [[Multipartite Methods]] – compares: the winner on the same cost function, and the source of the $\alpha\gtrsim w_X/2$ bound this method cannot escape.
- [[Bipartite Table Method]] – depends-on: supplies the $X=A+2^{-\alpha}B$ input split that ATA re-scales.
- [[Polynomial Approximation]] – extends: the honest route to order two, where the quadratic term is evaluated rather than differenced into existence.
- [[Squarers and Integer Powers]] – counter-example: the multiplier-free way to obtain a real $u^2$ term, which is exactly what the second-order Taylor variant tries and fails to avoid paying for.
- [[Block Memory]] – depends-on: three reads per cycle is one port more than a true-dual-port block gives you.
- [[Choosing a Table Method]] – compares: where this sits against every sibling.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- Sect. 17.3.1 "Addition-Table-Addition Methods", pp. 523–526 — the decomposition $X=A+2^{-\beta}B$ with $\alpha>\beta$ (p. 523); first-order ATA and its cost list, Fig. 17.16 (p. 524); the central-difference extension, Fig. 17.17 and the "three lookups, 7 additions" count (p. 525); the second-order Taylor variant, the $f''$ second-difference derivation, the rounding-error verdict, STAM's 6 tables and 9 additions at 24 bits, and the [DT05] comparison (p. 526).
- Sect. 17.2.12 "Multipartite Architectures Are Close to Optimal Among Order-One Methods", p. 523 — the $\alpha\gtrsim w_X/2$ bound for order one, $w_X/3$ for order two.
- Sect. 16.4.2 "Actual Cost of a ROM", pp. 491–492 — the LUT and block-RAM cost model behind the crossover remark.

Long-form source: [[4.2) Table-Based Function Evaluation]], §"Addition-table-addition (ATA)".
