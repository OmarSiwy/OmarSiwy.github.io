---
title: SquareRich Evaluation
description: Completes the square to trade one multiplier for a cheaper squarer — but after a uniform reduction the squarer runs on a much wider word than the multiplier it replaced.
kind: circuit
source: "ASA §18.3, p. 562"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, squarer, multiplier, fpga]
aliases:
  - SquareRich
  - Square Rich
  - Square-Rich Method
  - Completing the Square
---

# SquareRich Evaluation

A degree-2 polynomial evaluator that completes the square so that one of Horner's two multipliers becomes a squarer — the only algebraic refactoring in Chap. 18 that survives contact with hardware.

```tikz title="SquareRich degree-2 datapath: one adder, one squarer, one adder, one multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \node[draw, minimum width=1.9cm, minimum height=2.4cm, align=center] (tab) at (0,0)
        {coefficient\\table\\$2^{\alpha}$ words};
  \draw[<-] (tab.west) -- ++(-1.3,0) node[anchor=east] {$A$};
  \node[anchor=south] at (-1.6,0.05) {\scriptsize $\alpha$};

  \node[draw, minimum width=1.1cm, minimum height=0.8cm] (a1) at (3.2,-3.0) {$+$};
  \node[draw, minimum width=1.3cm, minimum height=0.8cm] (sqr) at (5.6,-3.0) {$(\cdot)^2$};
  \node[draw, minimum width=1.1cm, minimum height=0.8cm] (a2) at (8.8,-3.0) {$+$};
  \node[draw, minimum width=1.1cm, minimum height=0.8cm] (mul) at (11.0,-3.0) {$\times$};

  \draw[<-] (a1.west) -- ++(-1.6,0) node[anchor=east] {$x$};
  \node[anchor=south] at (1.85,-2.95) {\scriptsize $w_R{-}\alpha$};

  \draw[->] (tab.east) ++(0,0.75) -- (3.2,0.75) -- (a1.north);
  \node[anchor=west] at (1.1,1.05) {\scriptsize $m$, $w_R$ bits};
  \draw[->] (tab.east) ++(0,0.0) -- (8.8,0.0) -- (a2.north);
  \node[anchor=west] at (1.1,0.3) {\scriptsize $n$, $w_R$ bits};
  \draw[->] (tab.east) ++(0,-0.75) -- (11.0,-0.75) -- (mul.north);
  \node[anchor=west] at (1.1,-0.45) {\scriptsize $c_2$, $w_R{-}2\alpha$ bits};

  \draw[->] (a1.east) -- (sqr.west) node[midway,anchor=south] {\scriptsize $w_R{+}1$};
  \draw[->] (sqr.east) -- (a2.west) node[midway,anchor=south] {\scriptsize $w_R$ (trunc.)};
  \draw[->] (a2.east) -- (mul.west) node[midway,anchor=south] {\scriptsize $w_R{+}1$};
  \draw[->] (mul.east) -- ++(1.7,0) node[anchor=west] {$R$};
  \node[anchor=south] at (12.1,-2.95) {\scriptsize $w_R$};
\end{circuitikz}
\end{document}
```

**Complete the square to convert a multiply into a square.** Start from the degree-2 Horner form $C_0 + x(C_1 + xC_2)$ and factor $C_2$ out by distributivity of multiplication over addition:

$$C_0 + x(C_1 + xC_2) \;=\; C_2\left(x^2 + \frac{C_1}{C_2}x + \frac{C_0}{C_2}\right).$$

The bracket is a monic quadratic, so the schoolbook identity $x^2 + 2mx = (x+m)^2 - m^2$ applies with $m = C_1/(2C_2)$, and absorbing the compensating $-m^2$ into the constant gives $n = C_0/C_2 - m^2$:

$$C_0+x(C_1+xC_2)=C_2\left((x+m)^2+n\right),\quad m=\frac{C_1}{2C_2},\ n=\frac{C_0}{C_2}-\frac{C_1^2}{4C_2^2}. \tag{18.31}$$

This is an *exact* identity over the reals — no approximation is introduced by the rewriting itself. What is introduced is that $m$ and $n$ are new numbers that must be computed offline and stored, and the table now holds $(C_2, m, n)$ where [[Horner Evaluation]] held $(C_2, C_1, C_0)$ ([[Polynomial Coefficient Table]]).

**A squarer is roughly half a multiplier, which is where the win is supposed to come from.** The partial-product array of $t \times t$ is symmetric about its diagonal — $t_i t_j$ and $t_j t_i$ are the same bit — so the $2t_it_j$ pairs collapse into a single partial product shifted left by one, and the diagonal terms $t_i t_i = t_i$ need no AND gate at all. Roughly half the array survives ([[Squarers and Integer Powers]]). By operation count alone SquareRich therefore beats Horner in both area and latency: same two multiplicative levels, but one of them is half-price.

**After a uniform range reduction the coefficients are wildly unbalanced, and $m$ is a ratio of two of them.** With uniform piecewise reduction of parameter $\alpha$ ([[Uniform Piecewise Segmentation]]), the reduced argument is normalized to $|x| \le 1$ and the Taylor picture of the stored coefficients is $C_i \approx \frac{f^{(i)}(A)}{i!}2^{-i\alpha}$ — each degree buys about $\alpha$ bits of decay. Substituting into $m = C_1/(2C_2)$, the $2^{-\alpha}$ and $2^{-2\alpha}$ factors do not cancel:

$$m \;=\; \frac{C_1}{2C_2} \;\approx\; \frac{f'(A)\,2^{-\alpha}}{f''(A)\,2^{-2\alpha}} \;=\; \frac{f'(A)}{f''(A)}\,2^{\alpha}.$$

So $m$ sits about $\alpha$ binades *above* $x$'s own range, which is the book's $c_2 \ll c_1 \sim x$, therefore $m \gg x$. The sum $x + m$ is not a balanced addition: $m$ supplies the MSBs, $x$ contributes only to the bottom.

> [!important] The squarer is not the same size as the multiplier it replaced.
> A squarer costs half a multiplier *of the same width*. SquareRich hands it a wider one.

**The width follows from how accurate the bracket has to be.** The product $C_2\cdot\big((x+m)^2+n\big)$ must land within a fraction of $2^{\ell_R}$ of the true value ([[Error Accuracy]]), so the bracket needs absolute accuracy $\approx 2^{\ell_R}/C_2 \approx 2^{\ell_R+2\alpha}$. Its magnitude is dominated by $m^2 \approx 2^{2\alpha}$, so the ratio is $2^{\ell_R}$: the bracket needs $\approx w_R$ significant bits, and since squaring doubles relative error, so does $x+m$. That fixes every format in the diagram — $x+m$ runs from MSB $2^{\alpha}$ down to LSB $2^{\alpha-w_R}$, $w_R{+}1$ bits; only the top $w_R{-}\alpha$ bits of $x$ are ever used; $m$ and $n$ are $w_R$-bit table entries; and the squarer's $2w_R{+}2$-bit output is truncated back to $w_R$ significant bits before the second addition. Horner's inner multiplier at the same operating point sees a $y$ operand of only $\approx w_R - 2\alpha$ bits, because its truncation analysis lets the deep stages throw bits of $y$ away. SquareRich cannot: the $\alpha$ bits it saves nowhere, it spends on the squarer's MSB side.

**Whether that trade nets out is arithmetic, not principle.** Taking the note's own worked operating point for $\log_2(1+X)$ at $w_X = w_R = 24$, $d = 2$, $\alpha = 7$, Horner's two multipliers are $22{\times}13$ and $28{\times}17$, $762$ bit² of partial products. SquareRich replaces them with a $25$-bit squarer ($\approx 25^2/2 \approx 313$ bit²) and one $24{\times}13$ multiply by $C_2$ ($312$ bit²), $\approx 625$ bit² — still a win, but a narrower one than "half a multiplier free" suggests, and it shrinks as $\alpha$ grows because the squarer's width tracks $w_R$ while Horner's operands track $w_R - 2\alpha$. Gains are still reported up to degree 6.

> [!warning] Both the comparison above and the widths it uses are computed here
> Chap. 18 gives no area, LUT, DSP or delay figures for SquareRich, and does not reproduce [XFM14]'s. The bit² counts are raw partial-product areas from the formats derived above, ignoring compression, truncation savings and carry propagation.

> [!warning] The generalization beyond degree 2 is not in the book
> (18.31) is stated only for the degree-2 kernel, and the claim of gains "for degrees up to 6" is attributed to [XFM14] without showing how the completion is applied recursively or what it costs. Reconstructing the degree-$d$ form needs the paper.

**The refactoring reintroduces the error term Horner's analysis was built to avoid.** In the standard flow, coefficient quantization is folded into $\bar\delta_{\text{approx}}$ by construction — the approximation search returns coefficients that are *already* on the storage grid, so there is no separate term. $m$ and $n$ are derived from those coefficients by a division and a squaring, and rounding them to $w_R$ bits perturbs the polynomial being evaluated, which is exactly the objection the book raises against generic refactoring: it changes the coefficients, adds an error term, and may demand more accurate coefficients to start with. [XFM14] does account for the extra term; the chapter does not show how.

**On FPGAs the structural saving can evaporate.** A DSP block bills a multiplication as one block whether or not the two operands are equal, so a squarer that fits a DSP saves nothing over the multiplier it replaced, and $m$'s extra $\alpha$ MSBs push $x+m$ toward *not* fitting one ([[FPGAs]], [[Multipliers]]). The saving is real when the squarer is built in soft logic — a LUT-based or partially tabulated truncated squarer — where the folded array is genuinely half the LUTs. On an ASIC the folding always pays, since there is no fixed-size hard multiplier to waste.

$$\boxed{\ C_0+x(C_1+xC_2)=C_2\left((x+m)^2+n\right),\quad m=\frac{C_1}{2C_2},\quad n=\frac{C_0}{C_2}-\frac{C_1^2}{4C_2^2}\ }$$

**When it breaks.**

- $C_2 = 0$, or $|C_2|$ small enough that $m = C_1/(2C_2)$ overflows the chosen format. Any subinterval where $f'' \to 0$ — an inflection point — is a division by nearly zero, and the format must be sized for the *worst* subinterval, not the typical one.
- Large $\alpha$. The squarer's width is pinned near $w_R$ while Horner's operands shrink like $w_R - 2\alpha$, so a table-heavy design ($d = 1$ or $2$ with big $\alpha$) is where the trade turns against SquareRich first.
- Degree 1. There is nothing to complete; the note applies only from degree 2 up.
- The squarer must fit soft logic. On a DSP-mapped datapath the operation-count argument is void.
- Correct rounding. Once $m$ and $n$ carry their own rounding error, the joint approximation/evaluation formulation of [[ILP-Optimized Polynomial Evaluator]] — which makes the coefficient bits themselves the ILP variables — is the cleaner way to spend the same bits.

**RTL (Spade).** The kernel, untruncated so that the arithmetic is checkable exactly:

```spade
/// SquareRich degree-2 kernel:  R = c2 * ((x + m)^2 + n)
entity square_rich2(x: int<18>, m: int<18>, n: int<38>, c2: int<14>) -> int<78> {
    let t: int<19> = x + m;          // m supplies the MSBs, x only the low w_R - alpha
    let sq: int<38> = t * t;         // the squarer: 2N out of an N-bit operand
    let u: int<39> = sq + n;         // n is tabulated at the scale of the square
    let c2e: int<39> = sext(c2);     // sign-extend, not `as` — `as` is ascription
    c2e * u
}
```

`t` is the `+` block, `sq` the $(\cdot)^2$ block, `u` the second `+`, and the tail is the $\times$: one combinational path, no registers, so `x` to `R` is add → square → add → multiply in a single cycle. Every width is the compiler's own growth rule (`+` gives $N{+}1$, `*` gives $2N$), and the mismatch with the diagram is deliberate: the diagram truncates the square back to $w_R$ significant bits where the entity keeps all $2w_R{+}2$, which is what makes it comparable against an exact reference. Spade's `*` demands equal operand widths, hence `sext(c2)` to 39 bits — synthesis will strip the sign extension back to a $14 \times 39$ rectangular multiplier, and will fold the diagram's truncation into the array as fewer partial-product columns rather than a discarded product.

**Related Notes.**

- [[Horner Evaluation]] – compares: the baseline this refactors, and the source of the truncation analysis whose per-stage narrowing SquareRich forfeits.
- [[Squarers and Integer Powers]] – depends-on: the folded partial-product array that makes the squarer cheaper than the multiplier it replaces.
- [[Multipliers]] – compares: the untruncated cost model both sides of the trade are measured against.
- [[Uniform Piecewise Segmentation]] – depends-on: supplies the $\alpha$ that makes $m \gg x$; without a range reduction the coefficients are balanced and the catch disappears.
- [[Polynomial Coefficient Table]] – supports: the ROM stores $(C_2, m, n)$ instead of $(C_2, C_1, C_0)$, same shape, different contents.
- [[ILP-Optimized Polynomial Evaluator]] – counter-example: rather than refactoring the polynomial after the fact, it optimizes coefficient bits and evaluation jointly and gets correct rounding.
- [[Choosing a Polynomial Evaluator]] – compares: where this sits among the degree-2 options.
- [[Error Accuracy]] – depends-on: the $2^{\ell_R}$ faithful-rounding budget that fixes every width above.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §18.3 "Other evaluation techniques", p. 562 — eq. (18.31), the $c_2 \ll c_1 \sim x$ argument, and the degree-6 claim.
- ibid. §18.3, pp. 555–558 — Horner's truncation analysis (18.24)–(18.29) and the $C_i \approx \frac{f^{(i)}}{i!}2^{-i\alpha}$ coefficient decay used here.
- ibid. p. 572 — [XFM14] Xu, Fahmy & McLoughlin, "SquareRich Fixed Point Polynomial Evaluation on FPGAs", FPGA 2014, pp. 99–108.
- ibid. p. 571 — [Mul16] §3.8 and [Rev09] §5.2, the general refactoring family this one belongs to.
