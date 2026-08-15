---
title: Square Root Digit Selection Function
description: "A LUT reading 4 truncated bits of the carry-save residual and 4 of the partial root; the redundancy overlap is what lets a truncated, one-sided input still pick a legal digit."
kind: circuit
source: "ASA §19.1.5, pp. 582-587"
status: seed
spade: simulated
tags: [digital, square-root, digit-recurrence, srt, redundant, lut, digit-recurrence-for-algebraic-functions]
aliases:
  - Square Root Digit Selection
  - Square-Root Digit Selection
  - Sqrt Digit Selection Function
  - Square Root P-D Diagram
---

# Square Root Digit Selection Function

The combinational block that picks the next redundant root digit $d_{-i-1}$ from a *truncated* view of the residual and of the partial root, and the only part of an [[SRT Square Root]] whose correctness is not a consequence of the recurrence algebra but of a slack budget you have to spend deliberately.

```tikz title="P-D diagram for radix-4 square root with gamma=2 at iteration 2, showing how truncating the residual shrinks each digit's validity region from above"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % x: S_2 at 3.4 cm per unit (0 .. 2.2).  y: beta*W_2 at 0.34 cm per unit.
  \begin{scope}
    \clip (0,-4.1) rectangle (7.48,4.2);
    % the 2^-4 grid of addressable S_2 columns (t_S = -4): 4 address bits
    \foreach \k in {0,1,...,16} {
      \draw[gray!35,very thin] (3.4+0.2125*\k,-4.1) -- (3.4+0.2125*\k,4.2);}
    % validity band of each digit, after truncation:
    %   L_d = 2(d-rho)S + b^-3 (d-rho)^2   ..   U_d - 2^{t_W}
    \fill[blue!14]  (0, 0.00944) -- (7.48, 2.00410) -- (7.48, 3.98461) -- (0,-0.00472) -- cycle;
    \fill[red!12]   (0, 0.00059) -- (7.48, 0.49926) -- (7.48, 2.46559) -- (0,-0.02774) -- cycle;
    \fill[green!16] (0, 0.00236) -- (7.48,-0.99497) -- (7.48, 0.95719) -- (0,-0.04014) -- cycle;
    \fill[red!12]   (0, 0.01476) -- (7.48,-2.47858) -- (7.48,-0.54058) -- (0,-0.04191) -- cycle;
    \fill[blue!14]  (0, 0.03778) -- (7.48,-3.95156) -- (7.48,-2.02772) -- (0,-0.03306) -- cycle;
    % solid: boundaries actually implemented (truncated).  dashed: before truncation.
    \draw[blue]  (0, 0.00944) -- (7.48, 2.00410);
    \draw[blue]  (0,-0.00472) -- (7.48, 3.98461);
    \draw[blue,dashed] (0, 0.03778) -- (7.48, 4.02711);
    \draw[red]   (0, 0.00059) -- (7.48, 0.49926);
    \draw[red]   (0,-0.02774) -- (7.48, 2.46559);
    \draw[red,dashed]  (0, 0.01476) -- (7.48, 2.50809);
    \draw[green!60!black] (0, 0.00236) -- (7.48,-0.99497);
    \draw[green!60!black] (0,-0.04014) -- (7.48, 0.95719);
    \draw[green!60!black,dashed] (0, 0.00236) -- (7.48, 0.99969);
    \draw[red]   (0, 0.01476) -- (7.48,-2.47858);
    \draw[red]   (0,-0.04191) -- (7.48,-0.54058);
    \draw[red,dashed]  (0, 0.00059) -- (7.48,-0.49808);
    \draw[blue]  (0, 0.03778) -- (7.48,-3.95156);
    \draw[blue]  (0,-0.03306) -- (7.48,-2.02772);
    \draw[blue,dashed] (0, 0.00944) -- (7.48,-1.98522);
    % the overlap that redundancy buys, measured at S_2 = 1.5
    \draw[<->,thick] (5.1,1.3694) -- (5.1,1.6723);
    \node[fill=white,inner sep=1pt] at (4.25, 1.702) {$d_{-3}=2$};
    \node[fill=white,inner sep=1pt] at (4.25, 0.836) {$d_{-3}=1$};
    \node[fill=white,inner sep=1pt] at (4.25,-0.019) {$d_{-3}=0$};
    \node[fill=white,inner sep=1pt] at (4.25,-0.864) {$d_{-3}=-1$};
    \node[fill=white,inner sep=1pt] at (4.25,-1.698) {$d_{-3}=-2$};
  \end{scope}
  \draw (0,-4.1) rectangle (7.48,4.2);
  \foreach \x/\lab in {0/0, 3.4/1, 5.1/1.5, 6.8/2} {
    \draw (\x,-4.1) -- (\x,-4.32); \node[below,font=\footnotesize] at (\x,-4.32) {\lab};}
  \node[below] at (3.74,-4.95) {$S_2$ --- \texttt{ufix(1,-4)}, 4 address bits over $[1,2)$};
  \foreach \y/\lab in {-3.4/-10, -1.7/-5, 0/0, 1.7/5, 3.4/10} {
    \draw (0,\y) -- (-0.22,\y); \node[left,font=\footnotesize] at (-0.22,\y) {\lab};}
  \node[rotate=90] at (-1.3,0) {$\beta\widetilde{W_2}$ --- truncated at $t_W=-3$};
  \node[anchor=north west,align=left,text width=5.4cm] at (8.1,4.1)
    {Solid: the boundaries the LUT implements. Dashed: the same boundary before truncation. Only the \emph{upper} line moves, and only down by $2^{t_W}$ --- the truncation error $\delta\in\{0,-2^{t_W}\}$ is one-sided.};
  \node[anchor=north west,align=left,text width=5.4cm] at (8.1,1.2)
    {Arrow: at $S_2=1.5$ digits 1 and 2 are both legal over a band of width $1.02$, i.e.\ $8$ truncation ulps. Truncation spends $1$; the remaining $7$ are the margin redundancy buys.};
  \draw[->] (8.0,0.9) -- (5.24,1.55);
  \node[anchor=north west,align=left,text width=5.4cm] at (8.1,-1.6)
    {Vertical rules: the only $\widetilde{S_2}$ values the LUT can address. Intercepts $\beta^{-3}(d\pm\rho)^2\le0.11$ are already sub-ulp here, which is why one selection function serves every $i\ge i_0$.};
\end{circuitikz}
\end{document}
```

*after Fig. 19.6, p. 586.*

**Start from the constraint the digit has to satisfy, not from a decision rule.** The [[SRT Square Root]] recurrence maintains the residual $W_i = \beta^i(M-S_i^2)$ inside the band $-2\rho S_i + \rho^2\beta^{-i} \le W_i \le 2\rho S_i + \rho^2\beta^{-i}$, with redundancy factor $\rho = \gamma/(\beta-1)$ for the digit set $\{-\gamma,\dots,\gamma\}$ ([[Redundant Number Systems]]). Imposing that same band on $W_{i+1}$, substituting $W_{i+1} = \beta W_i - 2d_{-i-1}S_i - \beta^{-i-1}d_{-i-1}^2$ and $S_{i+1} = S_i + \beta^{-i-1}d_{-i-1}$, and collecting terms gives a pair of inequalities in the single unknown $d_{-i-1}$:

$$2(d_{-i-1}-\rho)S_i + \beta^{-i-1}(d_{-i-1}-\rho)^2 \;\le\; \beta W_i \;\le\; 2(d_{-i-1}+\rho)S_i + \beta^{-i-1}(d_{-i-1}+\rho)^2$$

Read as a locus in the $(S_i,\ \beta W_i)$ plane these are straight lines in $S_i$ of slope $2(d\pm\rho)$ — this is the P-D diagram of the figure. The selection function is nothing but a decoder for "which stripe am I in".

**Two structural differences from division, and both are visible in the plot.** In [[SRT Division]] the multiplicand is the constant divisor $D$, so the boundary fan is drawn once, before iteration 0, and the abscissa is a fixed input. Here the abscissa is $S_i$, *the result being built*, so the fan is nominally redrawn at every step. Worse, the $\beta^{-i-1}(d\pm\rho)^2$ terms are additive constants, so the lines do not pass through the origin — the diagram is not a pure fan. That second difference is the one that expires: the intercepts decay like $\beta^{-i}$, and once they fall below the resolution the selection function actually sees, all iterations share one function. That threshold is the definition of $i_0$.

**The overlap is a budget, and this is the whole design.** Digit $d$ is legal on $[2(d-\rho)S_i,\ 2(d+\rho)S_i]$ (dropping intercepts) and digit $d+1$ becomes legal at $2(d+1-\rho)S_i$. Subtracting, consecutive digits are *both* legal over a band of width

$$2(d+\rho)S_i - 2(d+1-\rho)S_i = 2S_i(2\rho - 1)$$

which is positive exactly when $\rho > \tfrac12$, i.e. $\gamma > (\beta-1)/2$ — strictly more than minimal redundancy. For $\beta=4,\gamma=2$ this is $\rho=2/3$ and the band is $\tfrac23 S_i$, at worst $2/3$ in $\beta W$ units since $S_i\in[1,2)$. Everything the selection function is allowed to *not know* has to fit inside that $2/3$.

> [!important] Redundancy is not a speed trick applied to the residual; it is the slack that pays for every approximation downstream. Truncating $\beta W_i$, truncating $S_i$, and dropping the intercept terms are three withdrawals from the same account of width $2S_i(2\rho-1)$. Overdraw it and the selected digit violates the invariant, permanently — a digit recurrence has no way to notice or recover.

**Truncating the carry-save residual is one-sided, so it only moves one boundary.** Keeping $W_i$ in carry-save ([[Sums of Weighted Bits]]) is the point of the exercise, and converting only the leading part to standard binary means discarding the carry into position $t_W$. The approximation is therefore $\beta\widetilde{W_i} = \beta W_i + \delta$ with $\delta \in \{0,\,-2^{t_W}\}$: never positive, because a discarded carry can only have been missing weight. Hence $\beta\widetilde{W_i}\le \beta W_i \le \beta\widetilde{W_i}+2^{t_W}$, and substituting the *worst* member into each side of the original constraint is enough:

$$2(d-\rho)S_i + \beta^{-i-1}(d-\rho)^2 \;\le\; \beta\widetilde{W_i}, \qquad \beta\widetilde{W_i} + 2^{t_W} \;\le\; 2(d+\rho)S_i + \beta^{-i-1}(d+\rho)^2$$

The lower line is untouched; the upper line drops by exactly $2^{t_W}$. In the figure the solid upper boundaries sit one $2^{t_W}$ below their dashed originals, and each digit's stripe is one ulp thinner than the algebra allows. This is why a *truncation* is used and not a rounding: a two-sided error would tighten both constraints and cost twice as much slack for the same $t_W$.

**Truncating $S_i$ is the awkward one, because $S_i$ arrives redundant.** The digits produced by this very function are signed, so $S_{i+1}=S_i+\beta^{-i-1}d_{-i-1}$ is a concatenation when $d\ge0$ but a borrow-propagating subtraction when $d<0$; the selection function cannot address a table with a number that has not been converted. On ASICs that is solved by the [[On-the-Fly Converter]], which keeps a pre-decremented copy and turns both cases into concatenations. **On FPGAs the book argues against it**: the subtraction maps onto fast carry logic at a latency comparable to the residual update itself, so paying it every iteration voids radix 4's advantage over the [[Non-Restoring Square Root]] — twice as few iterations, but two adders each. The fix is to convert fully only once at the end and feed the selection a $\widetilde{S_i}$ accurate to $t_S$ only, obtained by summing the truncated redundant digits; the worst-case tail is $\sum_{j\ge t_S/2}2\beta^{-j} = \rho\beta^{-t_S/2}$, so the constraints must additionally hold for every $S_i$ in

$$\widetilde{S_i} - \rho\beta^{-t_S/2} \;<\; S_i \;<\; \widetilde{S_i} + \rho\beta^{-t_S/2}$$

which is a third withdrawal from the same budget and generally forces a larger table.

**The published parameters, and what the two numbers are.** Ercegovac and Lang solve these inequalities for $\beta=4$, $\gamma=2$, $\rho=2/3$ and find a single selection function valid for all $i \ge i_0 = 3$ with $t_W = -4$ and $t_S = -4$: 4 bits of $\widetilde{W_i}$ and the 4 leading fractional bits of $S_i$. The $S_i$ side is exactly 4 address bits — $S_i\in[1,2)$ so the integer bit is a constant 1 and only the fraction varies, which is what the sixteen vertical rules in the figure enumerate. Iterations $i<i_0$ are not covered and are skipped wholesale by the [[Square Root Seed Table]], which tabulates $S_3$ from the 8 leading bits of $M$.

> [!warning] The book's "4 bits of $\widetilde{W_i}$" counts fractional positions only. The invariant gives $|\beta W_i| \le \beta(2\rho\cdot 2 + \rho^2\beta^{-3}) \approx 10.7$, which needs 5 more positions above the point including the sign, so the real address is wider than $t_W$ alone suggests — consistent with the same text stating "a truncation to 5 bits of $W_1$" at $i=1$, where $t_W$ would be $0$. The total address width, and hence the true table size, is not given in the source.

**If you do not trust an analytical derivation, sweep.** The alternative offered is a programmatic search: enumerate candidate pairs $(t_W,t_S)$ by increasing table cost $2^{t_W+t_S}$, break ties toward the smaller $t_W$ because that is the shorter latency, and for each candidate run an exhaustive feasibility check of the two constraints using directed rounding throughout — the book notes in a footnote that the arithmetic engine used to draw its own figures is *not* safe in that sense, so visual inspection of a P-D diagram cannot be trusted at these constant magnitudes. The cost $2^{t_W+t_S}$ is also what caps the radix: both truncation positions must grow with $\beta$, so the table grows exponentially while the iteration count only falls logarithmically.

$$\boxed{\;2(d-\rho)S_i + \beta^{-i-1}(d-\rho)^2 \;\le\; \beta\widetilde{W_i} \;\le\; 2(d+\rho)S_i + \beta^{-i-1}(d+\rho)^2 - 2^{t_W},\qquad \rho=\frac{\gamma}{\beta-1}\;}$$

## When it breaks

- **$\rho \le 1/2$.** The overlap $2S_i(2\rho-1)$ is zero or negative, no truncation is affordable at all, and the selection needs the fully propagated residual — the scheme degenerates to [[Non-Restoring Square Root]] with extra hardware.
- **$i < i_0$.** The intercepts $\beta^{-i-1}(d\pm\rho)^2$ are still larger than an ulp of $\widetilde{W_i}$, so the shared function is simply wrong there. Those iterations must be handled separately, by explicit early-iteration logic or by a seed table.
- **Residual outside the invariant.** The constraints are conditional; a $\beta\widetilde{W_i}$ that has already left the band yields a digit satisfying neither inequality, and every later iteration inherits the violation. There is no self-correction, which is why the seed table's rounding mode is a correctness argument and not a quality-of-result one ([[Rounding]]).
- **Truncated $\widetilde{S_i}$ on FPGA.** The extra $\pm\rho\beta^{-t_S/2}$ uncertainty may make the cheapest analytic $(t_W,t_S)$ infeasible; the book explicitly leaves the full study of this trade-off open.
- **Large radix.** Table cost $2^{t_W+t_S}$ is exponential in the radix, so past $\beta=4$–$8$ the selection function, not the recurrence, is the thing that stops scaling.

## RTL (Spade)

```spade
// Radix-4, gamma=2 square-root digit selection, valid for i >= i0 = 3.
// s = S~_i truncated at t_S = -4, scaled by 2^4:  S_i in [1,2)  ->  s in [16,32)
// w = beta*W~_i truncated at t_W = -4, scaled by 2^4: |beta W_i| < 10.7 -> |w| < 172
// Boundary 2(d-rho)S <= beta W~ with rho = 2/3, cleared of denominators: 3w >= (6d-4)s.
fn sqrt_sel(s: uint<5>, w: int<10>) -> int<3> {
    let sx: int<14> = sext(s.to_int());
    let wx: int<14> = sext(w);
    let w2: int<14> = trunc(wx + wx);
    let w3: int<14> = trunc(w2 + wx);
    let s2: int<14> = trunc(sx + sx);
    let s4: int<14> = trunc(s2 + s2);
    let s8: int<14> = trunc(s4 + s4);
    let s10: int<14> = trunc(s8 + s2);
    if w3 >= s8 { 2 }
    else if w3 >= s2 { 1 }
    else if w3 >= -s4 { 0 }
    else if w3 >= -s10 { -1 }
    else { -2 }
}
```

`s` is the abscissa of the diagram and `w` the ordinate, both as scaled integers so that no fixed-point library is needed: one unit of `w` is one $2^{t_W}=2^{-4}$ ulp of $\beta\widetilde{W_i}$, and the five comparisons are the five solid lower boundaries, evaluated at the current column. Clearing the denominator of $\rho=2/3$ turns each into $3w \ge (6d-4)s$, so the only arithmetic is multiplication by the small constants $3,2,4,8,10$ — shifts and one add, no multiplier, `int<14>` throughout because $|3w| < 516$ and $10s < 320$ both fit. The block is purely combinational; the register that holds $S_i$ and the carry-save residual belongs to the recurrence, not here. Synthesis will not build this comparator chain: with an 8-bit address and a 3-bit output it is 3 eight-input Boolean functions, so an ASIC flow collapses it to two levels of random logic and an FPGA flow to a handful of LUT6s ([[Lookup-Tables]]) — the code above is best read as the *generator* for that table's contents.

The intercept terms $\beta^{-i-1}(d\pm\rho)^2$ are dropped: at $i\ge i_0=3$ their magnitude is at most $(2+\tfrac23)^2/4^4 \approx 0.028$, i.e. $0.44$ ulp of $\widetilde{W_i}$, another withdrawal from the same overlap budget of $\ge 10.7$ ulps.

**Simulation.** Verified with `.zettel/sim.sh` against the *legality property* rather than a reimplementation: for each vector the returned $d$ was checked to satisfy both truncated constraints, $3w \ge (6d-4)s$ and $3(w+1) \le (6d+4)s$, in their intercept-free form. 9 named vectors (including the asymmetric one-ulp boundary pair $s=31,\,w=82 \to 1$ and $s=31,\,w=84 \to 2$, and $s=17,\,w=-1$) plus 5000 random $(s,w)$ of which 3027 fell inside the residual invariant and were checked; 0 failures, 0 digits outside $\{-2,\dots,2\}$. Vectors outside the invariant are deliberately unchecked — see *When it breaks*.

## Related Notes

- [[SRT Square Root]] – depends-on: supplies the recurrence, the invariant and the carry-save residual this function decodes; it is the only consumer.
- [[SRT Division]] – compares: the same overlap argument with a *constant* multiplicand, so the boundary fan is fixed and drawn once — read it first.
- [[Square Root Seed Table]] – supports: covers the iterations $i<i_0$ on which this function is invalid, by tabulating $S_{i_0}$ directly.
- [[On-the-Fly Converter]] – supports: produces the standard-binary $S_i$ this function truncates to $t_S$, without a carry-propagating subtraction per iteration.
- [[Lookup-Tables]] – depends-on: the $2^{t_W+t_S}$ table is the physical realisation, and its size is what caps the usable radix.
- [[Non-Restoring Square Root]] – counter-example: with a non-redundant digit set the overlap vanishes and selection degenerates to reading one sign bit, which is cheaper per step but serialises the carry.
- [[Redundant Number Systems]] – depends-on: $\rho=\gamma/(\beta-1)>1/2$ is a property of the digit set alone, not of the square root.
- [[Error Analysis]] – supports: the one-sided $\delta\in\{0,-2^{t_W}\}$ bound and the $\rho\beta^{-t_S/2}$ tail are ordinary truncation-error accounting.
- [[Choosing a Digit Recurrence]] – compares: where the table cost of this block sits against the other algebraic-function recurrences.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §19.1.5, pp. 582–583 — P-D diagrams for the square root, Figs. 19.4 and 19.5.
  - §19.1.5.3 *Integrating the Error due to Carry-Save Computation*, pp. 585–587 — the one-sided truncation bound, Fig. 19.6 (p. 586), the Ercegovac–Lang parameters $i_0=3$, $t_W=t_S=-4$, and the programmatic $(t_W,t_S)$ sweep.
  - §19.1.5.4 *On-the-Fly Conversion of $S_i$*, p. 587 — the FPGA argument against per-iteration conversion and the $\widetilde{S_i}\pm\rho\beta^{-t_S/2}$ constraint.
- Ercegovac & Lang, *Division and Square Root: Digit-Recurrence Algorithms and Implementations*, Kluwer 1994; *Digital Arithmetic*, Morgan Kaufmann 2004 — cited on pp. 585, 590 as the source of the parameter derivation.
