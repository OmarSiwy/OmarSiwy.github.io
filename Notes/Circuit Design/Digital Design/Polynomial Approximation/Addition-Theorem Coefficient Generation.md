---
title: "Addition-Theorem Coefficient Generation"
description: "Computes C1..C3 from a single tabulated C0 by constant multiplications, exploiting sin(a+b) — three coefficient tables collapse into one, paid for with three constant multipliers and one extra bit of segmentation."
kind: circuit
source: "ASA §18.2.1.4, pp. 545-547"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, sine, table, constant-multiplier]
aliases:
  - Addition Theorem Coefficient Generation
  - Coefficient Generation by Addition Theorem
  - Function-Specific Coefficient Generation
---

# Addition-Theorem Coefficient Generation

A coefficient supply for piecewise-polynomial $\sin(\frac{\pi}{2}X)$ that stores only the degree-0 table and derives $C_1,C_2,C_3$ from it by multiplication by three compile-time constants — the only scheme here whose higher-degree coefficients cost gates instead of memory.

```tikz title="One sine table feeds all four coefficients through three constant multipliers"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
% ---- input A and its negated copy -------------------------------------
\node[anchor=east] at (-1.7,2.6) {$A$};
\draw[thick,->] (-1.65,2.6) -- (2.3,2.6);
\node[font=\tiny,anchor=south] at (-1.0,2.65) {$\alpha$};
\draw[thick] (-0.6,2.6) -- (-0.6,1.0);
\draw[thick,->] (-0.6,1.0) -- (0.0,1.0);
\draw[thick] (0.0,0.6) rectangle (1.5,1.4);
\node at (0.75,1.0) {$2^{\alpha}\!-\!A$};
\draw[thick,->] (1.5,1.0) -- (2.3,1.0);
\node[font=\tiny,anchor=south] at (1.9,1.06) {$\alpha$};
% ---- the single table --------------------------------------------------
\draw[very thick] (2.3,0.4) rectangle (4.5,3.2);
\node[align=center,font=\footnotesize] at (3.4,1.8)
  {$C_0$ table\\[2pt]$\sin\!\left(\tfrac{\pi}{2}2^{-\alpha}A\right)$\\[2pt]$2^{\alpha}\times w_0$};
% ---- constant multipliers ---------------------------------------------
\draw[thick] (5.9,2.25) rectangle (7.4,2.95);
\node at (6.65,2.6) {$\times K_2$};
\draw[thick] (5.9,0.65) rectangle (7.4,1.35);
\node at (6.65,1.0) {$\times K_1$};
\draw[thick] (8.3,-0.35) rectangle (9.8,0.35);
\node at (9.05,0.0) {$\times K_3$};
% ---- upper path : C0 -> C2, and C0 straight out ------------------------
\draw[thick,->] (4.5,2.6) -- (5.9,2.6);
\node[font=\tiny,anchor=south] at (5.6,2.66) {$w_0$};
\draw[thick] (5.1,2.6) -- (5.1,3.65);
\draw[thick,->] (5.1,3.65) -- (10.6,3.65);
\node[anchor=west,font=\footnotesize] at (10.7,3.65) {$C_0=\sin a$ \; [$w_0$]};
\draw[thick,->] (7.4,2.6) -- (10.6,2.6);
\node[anchor=west,font=\footnotesize] at (10.7,2.6) {$-C_2$ \; [$w_0\!-\!2\alpha\!+\!1$]};
% ---- lower path : cos a -> C1 -> C3 ------------------------------------
\draw[thick,->] (4.5,1.0) -- (5.9,1.0);
\node[font=\tiny,anchor=south] at (5.2,1.06) {$\cos a$, $w_0$};
\draw[thick,->] (7.4,1.0) -- (10.6,1.0);
\node[anchor=west,font=\footnotesize] at (10.7,1.0) {$C_1$ \; [$w_0\!-\!\alpha\!+\!1$]};
\draw[thick] (8.0,1.0) -- (8.0,0.0);
\draw[thick,->] (8.0,0.0) -- (8.3,0.0);
\draw[thick,->] (9.8,0.0) -- (10.6,0.0);
\node[anchor=west,font=\footnotesize] at (10.7,0.0) {$-C_3$ \; [$w_0\!-\!3\alpha$]};
% ---- constants ---------------------------------------------------------
\node[font=\footnotesize,anchor=west,align=left] at (-1.7,-1.5)
 {$K_1=\tfrac{\pi}{2}2^{-\alpha}$\qquad
  $K_2=\tfrac{\pi^2}{8}2^{-2\alpha}$\qquad
  $K_3=\tfrac{\pi^2}{24}2^{-2\alpha}$\\[3pt]
  $C_2$ and $C_3$ are negative for every $A$, so the sign bit is not stored and the\\
  multipliers carry magnitudes only. Both table reads hit the same $2^{\alpha}\times w_0$ ROM.};
\end{circuitikz}
\end{document}
```

*Own construction; the coefficient relations are Eqs. 18.12-18.15, p. 547, and the coefficient magnitudes it sizes against are Fig. 18.12, p. 545.*

**Start from the observation the tables are begging you to make.** Plot the tabulated $C_i$ against the subinterval index $A$ (Fig. 18.12, p. 545) and every curve is smooth — visibly a sampled elementary function, not arbitrary data. A [[Polynomial Coefficient Table]] that stores $2^\alpha$ samples of a smooth function is storing something a small circuit could have *computed*. For a general $f$ nothing more can be said, but for $\sin$ the smoothness has a closed-form cause, and exploiting it is pure algebra rather than curve-fitting.

**Split the argument with the addition theorem instead of a change of variable.** Uniform segmentation writes $X = 2^{-\alpha}(A+Y)$ with $A$ the top $\alpha$ bits and $Y\in[0,1)$ the bottom $w_X-\alpha$ (see [[Polynomial Approximation]]). Substituting into the target function and applying $\sin(a+b)=\sin a\cos b+\cos a\sin b$ gives, with

$$a=\frac{\pi}{2}2^{-\alpha}A \in [0,\tfrac{\pi}{2}),\qquad b=\frac{\pi}{2}2^{-\alpha}Y \in [0,\kappa),\qquad \kappa \equiv \frac{\pi}{2}2^{-\alpha},$$

the exact identity $\sin(\frac{\pi}{2}X)=\sin a\cos b+\cos a\sin b$ (Eq. 18.9, p. 545). Nothing is approximated yet. The split is the *same* split the segmentation already performed — $a$ depends only on the table address, $b$ only on the reduced argument — so the addition theorem costs nothing to apply; it merely reorganises which parts of the answer depend on which wires.

**Truncate only the small factor.** $a$ spans the whole first quadrant and must stay exact, but $b<\kappa=\frac{\pi}{2}2^{-\alpha}$ is genuinely small, so a degree-3 Taylor series about $0$ is enough for it: $\sin b\approx b-\frac{b^3}{6}$ and $\cos b\approx 1-\frac{b^2}{2}$ (Eqs. 18.10-18.11, p. 545). Substituting and collecting powers of $Y$ — using $b=\kappa Y$, so $b^i=\kappa^i Y^i$ — turns the identity into a cubic in $Y$:

$$\sin(\tfrac{\pi}{2}X)\approx \underbrace{\sin a}_{Y^0}+\underbrace{\kappa\cos a}_{Y^1}\,Y-\underbrace{\tfrac{\kappa^2}{2}\sin a}_{Y^2}\,Y^2-\underbrace{\tfrac{\kappa^3}{6}\cos a}_{Y^3}\,Y^3 .$$

**Fold every coefficient back onto the two it already has.** Read off $C_0=\sin a$ and $C_1=\kappa\cos a$. The $Y^2$ coefficient is $-\frac{\kappa^2}{2}\sin a$, which is $-\frac{\kappa^2}{2}C_0$ by substitution. The $Y^3$ coefficient is $-\frac{\kappa^3}{6}\cos a$; eliminating $\cos a$ via $\cos a = C_1/\kappa$ cancels one factor of $\kappa$ and leaves $-\frac{\kappa^2}{6}C_1$. So $C_2$ and $C_3$ are each *one constant multiplication* away from a value already on a wire, and neither needs a table.

> [!warning] Eq. 18.15 on p. 547 is wrong twice
> The book prints it as "$C_2(A) = \frac{\pi^3}{2^3}\frac{2^{-3\alpha}}{6}C_1(A)$". Its left-hand side should be $C_3$ (18.14 already defined $C_2$), and the right-hand side keeps a factor $\kappa^3$ where the substitution $\cos a=C_1/\kappa$ leaves only $\kappa^2$; the sign is dropped as well. The correct relation is $C_3=-\frac{\kappa^2}{6}C_1 = -\frac{\pi^2}{24}2^{-2\alpha}C_1$. Fig. 18.12 corroborates both corrections: its $C_3$ panel is entirely negative, and the plotted $C_3/C_1$ ratio differs from $-\frac{\kappa^2}{6}$ by exactly a factor of 4 — a format-scaling power of two — whereas $-\frac{\kappa^3}{6}$ misses by a factor of $5$, which no fixed-point format can produce.

**Get $\cos a$ from the sine table by negating the address.** $C_1$ needs a cosine, and a second table would defeat the purpose. Use the reflection identity $\cos x=\sin(\frac{\pi}{2}-x)$: since $\frac{\pi}{2}-a=\frac{\pi}{2}2^{-\alpha}(2^\alpha-A)$, the cosine of subinterval $A$ is the *sine* entry at address $2^\alpha-A$. The hardware is an $\alpha$-bit two's-complement negation of the address, $2^\alpha - A = \overline{A}+1 \bmod 2^\alpha$ (see [[Number Formats]]) — one incrementer, or one row of inverters if you accept the off-by-one and re-index the table. All that remains is a second read port on the same $2^\alpha\times w_0$ ROM: a true dual-port block RAM on FPGA at no extra cost, versus a genuine second decoder or a second cycle on ASIC, where dual-porting an SRAM is roughly a doubling of bit-cell area.

**Size the four buses from the magnitudes, not from the table.** Let the $C_0$ entries carry LSB weight $2^{-w_0}$, so $C_0\in[0,1)$ occupies $w_0$ bits with MSB weight $2^{-1}$. Then $|C_1|\le\kappa<2^{1-\alpha}$, $|C_2|\le\frac{\kappa^2}{2}<2^{1-2\alpha}$ and $|C_3|\le\frac{\kappa^3}{6}<2^{-3\alpha}$, so at the shared LSB the buses are $w_0-\alpha+1$, $w_0-2\alpha+1$ and $w_0-3\alpha$ bits wide. This is Law 2 made mechanical: each extra degree buys $\alpha$ leading zeros, because each extra degree carries one more factor of $\kappa\approx2^{-\alpha}$. It also sizes the multipliers — $K_3$ is only $\lceil\log_2(\kappa^2/6\cdot2^{w_0})\rceil = 13$ bits at $\alpha=5,w_0=24$, so the last constant multiplier is the cheapest of the three.

**Both signs are constant, so neither is stored or computed.** On $[0,\frac{\pi}{2})$ we have $\sin a\ge 0$ and $\cos a>0$, hence $C_2<0$ and $C_3<0$ for every $A$ (§18.2.1.5, p. 547). The datapath therefore carries magnitudes and the *evaluator* hard-wires the subtraction — a Horner stage becomes $C_1 - Y(|C_2| \cdots)$ rather than a signed add. One bit saved per coefficient, and, more usefully, the constant multipliers stay unsigned.

**The cost trade, at the operating point of Fig. 18.12.** A 24-bit degree-3 approximation with $\alpha=5$ tabulates $32\times(24+20+15+9)=2176$ bits across four tables. Generating instead needs $2^\alpha w_0$ bits, three constant multipliers, an $\alpha$-bit negater and a second read port. Each multiplier is a [[Multiplication by Constants]] instance — a [[Shift-and-Add]] network of a couple of adders after canonical-signed-digit recoding, not an array multiplier — so on the arithmetic side the scheme is genuinely cheap. On FPGA the second read port and the recoded adders both land in resources the table was not using (the block RAM's B port, the fabric LUTs), which makes the trade one-sided; on ASIC the dual port is a real area line item and the comparison is closer.

**But the approximation is Taylor, not minimax, and that costs a bit of $\alpha$.** The tabulated version fits each subinterval with `fpminimax`, which is near-optimal; the generated version is stuck with a Taylor series expanded at the *left edge* of the subinterval. The first omitted term is $\sin a\cdot\frac{b^4}{24}$, so the approximation error is bounded by $\kappa^4/24 = 0.254\cdot2^{-4\alpha}$, i.e. $2^{-22.0}$ at $\alpha=5$ and $2^{-26.0}$ at $\alpha=6$. A 24-bit target needs $\alpha=6$. The honest comparison is therefore $64\times24=1536$ generated bits against $2176$ tabulated ones — a 30% memory saving, not a 4$\times$ one, plus three multipliers. See [[Error Accuracy]] for how this term enters the global budget alongside the rounding of the generated coefficients themselves.

$$\boxed{\ C_0=\sin a,\quad C_1=\kappa\cos a=\kappa\,C_0\!\left[2^\alpha\!-\!A\right],\quad C_2=-\tfrac{\kappa^2}{2}C_0,\quad C_3=-\tfrac{\kappa^2}{6}C_1,\quad \kappa=\tfrac{\pi}{2}2^{-\alpha}\ }$$

**When it breaks.**

- **$A=0$ overflows the reflected address.** $2^\alpha-A$ lands on $2^\alpha$, one past the last table entry, where the value is $\sin\frac{\pi}{2}=1$ — not representable in a $[0,1)$ format. Either widen $C_0$ by one integer bit, saturate the reflected address and special-case $\cos 0=1$, or shift the segmentation to a signed reduced argument so the endpoint is never hit.
- **Degree 4 and above stops folding.** The $Y^4$ coefficient is $+\frac{\kappa^4}{24}\sin a=\frac{\kappa^4}{24}C_0$ and folds fine, but each new degree needs its own constant multiplier while the table it would have replaced is already shrinking as $w_0-i\alpha$. The saving per added degree goes to zero; past degree 3 or 4 the tabulated form wins again.
- **It is not generic.** There is no addition theorem for $\log$, $\sqrt{\cdot}$ or an inverse CDF; $\exp$ has a multiplicative one ($e^{a+b}=e^ae^b$) which needs a full multiplier, not a constant one. Every other function falls back to a [[Polynomial Coefficient Table]].
- **It does not compose with Hsiao differential compression.** Differential compression already removes most of the redundancy in the $C_1,C_2,C_3$ tables at the price of one addition each, and those additions merge into a bit heap for free. Where that applies, the generated scheme's advantage over the compressed tables is much smaller than over the raw ones.

> [!warning] No area or delay figures in the source
> §18.2.1.4 presents the coefficient relations and stops; it quotes no LUT counts, no critical path and no synthesis comparison against the four-table baseline, deferring the whole question to the dedicated sine/cosine architecture of Chap. 20. The bit counts above are derived from the coefficient magnitudes, not measured. A real comparison needs outside research or a FloPoCo run.

**RTL (Spade).** Instantiated at $\alpha=5$, $w_0=24$: a shared LSB weight of $2^{-24}$ turns every constant multiplication into an integer multiply-and-shift, $K_i^{\text{int}}=\operatorname{round}(K_i\cdot2^{24})$.

```spade
/// alpha = 5, w0 = 24. All coefficients share the LSB weight 2^-24, so each
/// constant multiplication is an integer multiply keeping the high half.
/// The multiplier operand is a compile-time constant: synthesis turns each of
/// these into a shift-and-add network, not an array multiplier.
fn mulk(x: uint<24>, kc: uint<24>) -> uint<24> {
    (x * kc).as_bits()[24..48].as_uint()
}

entity addthm_coefs(c0: uint<24>, cc: uint<24>) -> (uint<20>, uint<15>, uint<9>) {
    let c1 = mulk(cc, 823550);   // K1 = (pi/2) * 2^-5   * 2^24
    let c2 = mulk(c0, 20213);    // K2 = (pi^2/8) * 2^-10 * 2^24
    let c3 = mulk(c1, 6738);     // K3 = (pi^2/24) * 2^-10 * 2^24
    (trunc(c1), trunc(c2), trunc(c3))
}
```

`c0` is the upper table read and `cc` the reflected one, so the table and the $2^\alpha-A$ negater sit *outside* this entity — it is exactly the three multiplier boxes in the diagram, purely combinational, no clock. The width arithmetic is the one trap: `x * kc` is `uint<48>` by the doubling rule, and `.as_bits()[24..48]` is the arithmetic right shift by 24 that restores the shared LSB weight, with index 0 = LSB. The final `trunc` calls drop bits that the magnitude bounds prove are always zero — $c_1<2^{20}$, $c_2<2^{15}$, $c_3<2^{9}$ — which is where the $w_0-i\alpha$ sizing above becomes real hardware. Synthesis will not build three multipliers: with one constant operand each `*` collapses to two or three adders after CSD recoding, and the `>> 24` is free wiring.

Verified by simulation against a behavioural `(x*K)>>24` reference: 4005 vectors, including the asymmetric pair $(c_0,c_c)=(1,2^{23})$ and its swap, which is what catches a crossed table read — the two inputs feed *different* constants, so swapping them changes the answer.

**Related Notes (with context).**

- [[Polynomial Coefficient Table]] – compares: the general alternative this replaces; its smooth $C_i(A)$ curves are the observation that motivates generating instead of storing.
- [[Multiplication by Constants]] – depends-on: each $\times K_i$ box is one instance, and its cost decides whether the trade pays.
- [[Shift-and-Add]] – depends-on: the concrete form the constant multipliers take once $K_i$ is CSD-recoded.
- [[CORDIC]] – compares: the rival way to get $\sin$ with no coefficient table at all, trading these three parallel constant multipliers for a serial recurrence.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §18.2.1.4 "Coefficient Compression Opportunities", pp. 544-547 — Fig. 18.12 (p. 545), the addition-theorem split (Eq. 18.9, p. 545), the degree-3 Taylor of the small argument (Eqs. 18.10-18.11, p. 545), the coefficient relations (Eqs. 18.12-18.15, p. 547) and the reflection $\cos x=\sin(\frac{\pi}{2}-x)$ (p. 547).
  - §18.2.1.5 "Coefficients with Constant Signs", p. 547 — the constant-sign argument.
  - §18.2.1 "Range Reduction by Uniform Piecewise Splitting", pp. 540-544 — the change of variable $X=2^{-\alpha}(A+Y)$ the split reuses.
