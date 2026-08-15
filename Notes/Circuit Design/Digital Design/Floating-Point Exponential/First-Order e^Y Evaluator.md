---
title: "First-Order e^Y Evaluator"
description: "Drops the h box entirely, approximating f(Z) by Z: one e^A table, one small multiplier, one adder, and g=3 still holds — but k must be about (w_F+4)/2, so the table grows as 2^{w_F/2} and it stops at binary16."
kind: circuit
source: "ASA §22.5.2, pp. 659-660"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, exponential, table, multiplier, fpga]
aliases:
  - "First-Order Architecture"
  - "First-Order e^Y Architecture"
  - "First-Order eY Evaluator"
  - "First-Order Exponential Evaluator"
---

# First-Order e^Y Evaluator

The cheapest inner evaluator of a [[FPExp Operator|floating-point exponential]]: it takes the second range reduction $Y=A+Z$ of [[Higher-Order e^Y Evaluator]] but keeps only the *first* Taylor term of $e^Z$, so the transcendental $h$ box disappears and nothing is left but a table, a small truncated multiplier and an adder.

```tikz title="First-order e^Y architecture: one e^A table, one truncated multiplier, one adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- Y in, split by bit position (pure wiring, no hardware)
  \draw[->] (0,7.7) -- (0,7.1);
  \node[anchor=west] at (0.08,7.42) {$Y$\quad\texttt{sfix}$(-1,\ell)$};
  \draw (-2.6,7.1) -- (3.6,7.1);
  \node[anchor=south] at (-2.0,7.14) {$A$};
  \node[anchor=south] at (3.0,7.14) {$Z$};
  \draw[->] (-2.6,7.1) -- (-2.6,6.3);
  \node[anchor=east] at (-2.68,6.72) {\texttt{sfix}$(-1,-k)$};
  \draw[->] (3.6,7.1) -- (3.6,4.0);
  \node[anchor=west] at (3.68,5.7) {\texttt{ufix}$(-k-1,\ell)$};

  % ---- e^A table
  \draw (-3.9,5.4) rectangle (-1.3,6.3);
  \node at (-2.6,5.85) {$e^A$ table};
  \node[anchor=east,font=\tiny] at (-3.96,5.85) {$2^k$ entries};
  \draw[->] (-2.6,5.4) -- (-2.6,2.6);
  \node[anchor=east] at (-2.68,3.5) {$T$};
  \node[anchor=west] at (-2.52,3.5) {\texttt{ufix}$(0,\ell-2)$};

  % ---- T_trunc tap into the multiplier
  \draw (-2.6,4.6) -- (1.8,4.6);
  \draw[->] (1.8,4.6) -- (1.8,4.0);
  \node[anchor=south] at (-0.4,4.68) {$T_{\mathrm{trunc}}$\quad\texttt{ufix}$(0,\ell+k-1)$};

  % ---- truncated multiplier
  \draw (1.2,3.2) rectangle (4.4,4.0);
  \node at (2.8,3.6) {$\times$ \ truncated};
  \draw[->] (2.8,3.2) -- (2.8,2.6);
  \node[anchor=west] at (2.9,2.9) {\texttt{ufix}$(-k,\ell-2)$};

  % ---- adder
  \draw (-3.4,1.8) rectangle (3.6,2.6);
  \node at (0.1,2.2) {$+$};
  \draw[->] (0.1,1.8) -- (0.1,1.2);
  \node[anchor=west] at (0.2,1.5) {$M_{\mathrm{full}}$\quad\texttt{ufix}$(0,\ell-2)$};

  % ---- round by truncation
  \draw (-1.6,0.3) rectangle (1.8,1.2);
  \node at (0.1,0.75) {round by truncation};
  \draw[->] (0.1,0.3) -- (0.1,-0.3);
  \node[anchor=west] at (0.2,-0.05) {$M\approx e^Y$\quad\texttt{ufix}$(0,\ell)$};

  % ---- binary16 instance
  \node[anchor=north west,align=left,font=\footnotesize] at (-4.6,-0.75)
    {binary16: $w_F=10$, $g=3$, $\ell=-13$, $k=7$\\
     $A$: 7 b \ (table address) \quad $Z$: 6 b \quad $T$: 16 b \quad $T_{\mathrm{trunc}}$: 8 b\\
     multiplier $6\times8$, \ $e^A$ table $2^7\times16 = 2$\,Kbit};
\end{circuitikz}
\end{document}
```

*after Fig. 22.7, p. 660; the binary16 sizing is the worked instance of p. 660. Throughout, $\ell=-w_F-g$ is the LSB of the operator's internal datapath and $u=2^{\ell}$ its unit.*

**Keep the linear term of $e^Z$ and throw the rest away.** Both table-plus-multiplier architectures start from the same bit-position split $Y=A+Z$, with $A$ the $k$ MSBs of $Y$ in `sfix`$(-1,-k)$ and $Z$ the remaining $-\ell-k$ bits in `ufix`$(-k-1,\ell)$, so that $0\le Z<2^{-k}$ and, by the exponential's addition law $e^{a+b}=e^ae^b$, $e^Y=e^A e^Z$. The [[Higher-Order e^Y Evaluator|higher-order architecture]] then writes $e^Z=1+Z+h(Z)$ and pays for a small evaluator of $h(Z)=e^Z-1-Z$. The first-order architecture simply deletes that box, taking $f(Z)=e^Z-1\approx Z$. What that costs is the entire neglected Taylor tail, and Taylor's series for $e^Z$ makes it explicit:

$$\delta_{\mathrm{approx},1}(Z) = 1+Z-e^{Z} = -\frac{Z^{2}}{2}-\frac{Z^{3}}{6}-\cdots \qquad (22.30)$$

Every term is negative for $Z\ge0$, so this error is **one-sided**: the first-order evaluator never overestimates $e^Y$. Its magnitude is dominated by the quadratic term, which $0\le Z<2^{-k}$ bounds by $Z^2/2<2^{-2k-1}$, and the remaining terms are a geometric-like tail absorbed by a factor $1+2^{-k}$:

$$\bar\delta_{\mathrm{approx},1} = 2^{-2k-1}\left(1+2^{-k}\right) \qquad (22.31)$$

**The split point $k$ is now fixed by accuracy alone, and that is what kills the architecture.** In the higher-order architecture $k$ was free — larger $k$ meant a bigger $e^A$ table but a proportionally narrower $h$ box, a genuine trade. Here $k$ is the *only* thing holding the approximation error down, so it must satisfy $2^{-2k-1}\lesssim 2^{\ell}$, i.e. $2k+1\gtrsim -\ell = w_F+g$. Taking one extra bit of headroom so the other error terms still fit, and substituting the minimal $g=3$, gives the book's constraint

$$k\ \ge\ \frac{w_F+4}{2}$$

Read that as a growth law and the ceiling is obvious: the $e^A$ table has $2^k\approx 4\cdot 2^{w_F/2}$ entries of $-\ell+3 = w_F+6$ bits each, so **every two extra fraction bits in the format double the table**. Two bits of precision for double the memory is the exchange rate of [[Direct Tabulation Exponential|plain tabulation]] with the exponent stripped off — the first-order architecture has bought a square root on the table size and then stopped improving.

**At binary16 the whole evaluator is a rounding error in the budget.** With $w_F=10$ and $g=3$, $Y$ is a $13$-bit `sfix`$(-1,-13)$, $\ell=-13$, and $k=7$. The split is free wiring: $A$ is bits $-1\ldots-7$ used *directly as the $2^7$-entry table address*, sign bit included — the two's-complement pattern is a perfectly good index, so no negation and no bias adder appear. $Z$ is bits $-8\ldots-13$, six bits, and is **unsigned by construction** because it consists of the low bits of a two's-complement number, whose weights are all positive. The $e^A$ table emits $T$ in `ufix`$(0,\ell-2)$, sixteen bits — internal guard bits $g'=2$, which is what the figure's $\ell-2$ annotations encode — and $T$ is truncated to $T_{\mathrm{trunc}}$ at LSB $2^{\ell+k-1}=2^{-7}$, eight bits. The multiplier is therefore $6\times8$, which is a rounding error next to the $11\times11$ constant multiplier by $\ln 2$ that the [[Reduced Argument Subtractor|range reduction]] in front of it needs, and the table is $2^7\times16=2$ Kbit.

**Every truncation in the datapath is placed by the same balancing argument.** $T_{\mathrm{trunc}}$ exists because $T$'s dropped tail is multiplied by $Z<2^{-k}$, so its contribution shrinks by $k$ bits for free: dropping $T$ down to LSB $2^{\ell+k-1}$ makes $\delta_{\mathrm{trunc}T}=(T_{\mathrm{trunc}}-T)Z < 2^{\ell+k-1}\cdot2^{-k}=2^{\ell-1}$, half an ulp, at a cost of $k-1$ fewer multiplier rows. The multiplier itself is a [[Truncated Multipliers|truncated multiplier]]: its full product has LSB $2^{2\ell+k-1}$ and only the bits down to $2^{\ell-2}$ survive, so the low columns should never be built. Nothing here is a heuristic; each cut is sized so that its error lands one bit below the term it is competing with, which is the standard [[Fixed-Point Function Approximation|fixed-point approximation]] discipline and the reason [[Error Accuracy|error budgeting]] is done before hardware, not after.

**The book leaves the error sum as an exercise; it comes to about $2u$, which is why $g=3$ survives.** Take (22.29) from the higher-order analysis, strike the two terms that belong to the $h$ box ($\delta_H$ and $\delta_{\mathrm{trunc}Z}$ — there is no $h$ and no $Z_{\mathrm{trunc}}$), and add the approximation error, amplified like every other pre-multiplier term by $T\approx e^A<1.65$:

| term | source | bound |
| --- | --- | --- |
| $\delta_T$ | $e^A$ tabulated to nearest at $2^{\ell-2}$, amplified by $e^Z<1.25$ | $2^{\ell-3}\cdot1.25=0.156u$ |
| $T\,\delta_{\mathrm{approx},1}$ | the neglected Taylor tail; at $k=\tfrac{w_F+4}{2}$, $2^{-2k-1}=2^{\ell-2}$ | $1.65\cdot 2^{\ell-2}=0.413u$ |
| $\delta_{\mathrm{trunc}T}$ | $(T_{\mathrm{trunc}}-T)Z$ | $2^{\ell-1}=0.5u$ |
| $\delta_{\mathrm{mult}}$ | the truncated multiplier, faithful at $2^{\ell-2}$ | $2^{\ell-2}=0.25u$ |
| $\delta_{\text{final round}}$ | truncating $M_{\mathrm{full}}$ from $2^{\ell-2}$ to $2^{\ell}$ | $3\cdot2^{\ell-2}=0.75u$ |

Summing, $\bar\delta_{\mathrm{arch}}<2.07u$, comfortably inside the $4u$ that §22.5.1 identifies as the condition for holding $g$ at its minimal value of $3$ — and $g'=2$, not the $3$ that the higher-order variant needs, exactly as Fig. 22.7 draws it. Four of the five terms are **truncations, hence signed**: the architecture is biased low by roughly one ulp and can only exceed $e^Y$ by $\delta_T$. Pre-adding the constant $2^{\ell-1}$ to every $e^A$ table entry — free, it is baked into the ROM contents — turns the final truncation into a round-to-nearest and recentres the whole distribution.

> [!warning] The error sum above is not in the source
> p. 660 ends with *"we leave it as an exercise to the reader, using a simplified version of Eq. (22.29), to show that it fulfills the constraint on $\bar\delta_{\mathrm{arch}}$ that allows for $g=3$."* The table is that exercise worked, using only the book's own per-term bounds from pp. 658–659. It is checked against simulation below, not quoted.

**On an FPGA the whole thing is one memory port and a corner of one DSP, and the coarse granularity is free accuracy.** For binary16 the $e^A$ table is $2$ Kbit against the $18$ or $36$ Kbit of a [[Block Memory|block RAM]], so it can be widened to the memory's full output width at zero cost, shrinking $\delta_T$ to nothing. The $6\times8$ multiplier fits inside a single DSP block many times over, which means the product is computed **exactly** and can be rounded to nearest instead of truncated, killing $\delta_{\mathrm{mult}}$ for the price of one extra bit on the final adder (p. 661). On an ASIC neither gift exists: the table becomes real standard-cell ROM or logic whose area you pay by the bit, and the truncated multiplier's dropped columns are a genuine saving rather than an unused corner of a hard block.

$$\boxed{\ e^{Y}\ \approx\ T + T_{\mathrm{trunc}}\!\cdot Z,\qquad \bar\delta_{\mathrm{approx},1}=2^{-2k-1}\!\left(1+2^{-k}\right),\qquad k\ge\frac{w_F+4}{2}\ }$$

**When it breaks.**

- **Single precision, decisively.** $w_F=23$ forces $k=14$, so the $e^A$ table is $2^{14}$ entries of $29$ bits $\approx 464$ Kbit — thirteen $36$ Kbit BRAMs — where the [[Higher-Order e^Y Evaluator|higher-order architecture]] fits its $e^A$ *and* $h$ tables in one. The multiplier is only $13\times12$, still one DSP; memory is the entire cost, and the book says plainly to switch (p. 660).
- **Anywhere the table is small enough to be tabulated whole.** At BFloat-class precision $Y$ is only $w_F+3=10$ bits and [[Tabulated e^Y]] reads $e^Y$ out of a single $2^{10}\times11$-bit table with no multiplier and no adder at all. The first-order architecture is a *middle* term, and its window is narrow.
- **Double precision and beyond.** Even the higher-order $h$ table stops fitting; the $h$ box becomes a piecewise [[Polynomial Approximation|polynomial evaluator]] and $k$ acquires a companion parameter $d$. First-order has no second parameter to trade in.
- **$Z$ treated as signed.** The bound $0\le Z<2^{-k}$, the one-sidedness of (22.30), and the $\delta_{\mathrm{trunc}T}$ bound all depend on $Z\ge0$. Sign-extend the low bits of $Y$ "for symmetry" and the multiplier becomes signed, the error bound doubles, and the bias analysis inverts on half the inputs.
- **$|Y|\ge\tfrac12$.** $A$ occupies `sfix`$(-1,-k)$ because the [[Reduced Argument Subtractor|range reduction]] guarantees $|Y|<\tfrac12$. A looser reduction needs an extra integer bit on $A$, which doubles the table — the most expensive bit in the operator.
- **$k$ raised above the minimum.** It buys nothing: the multiplier shrinks by one row and one column, the table doubles. The constraint is a floor and the optimum sits on it.

**RTL (Spade).** The binary16 instance of the datapath, with the $e^A$ table modelled as its output port `t` — which is exactly what a BRAM presents.

```spade
/// Split Y into the k = 7 MSBs (used directly as the e^A table address) and
/// the 6 low bits Z. Pure wiring: index 0 of `as_bits` is the LSB.
fn split_y(y: uint<13>) -> (uint<7>, uint<6>) {
    let b = y.as_bits();
    (b[6..13].as_uint(), b[0..6].as_uint())
}

/// First-order e^Y datapath, binary16 sizing: w_F = 10, g = 3, l = -13, k = 7, g' = 2.
///   t : T ~ e^A from the 2^7-entry table,  ufix(0, l-2)  = 16 bits
///   z : the low 6 bits of Y,               ufix(-k-1, l) =  6 bits
///   -> M ~ e^Y,                            ufix(0, l)    = 14 bits
fn exp_y_fo(t: uint<16>, z: uint<6>) -> uint<14> {
    let tt: uint<8>   = trunc(t >> 8);            // T_trunc, ufix(0, l+k-1)
    let raw: uint<16> = tt * zext::<6, 8>(z);     // exact product, LSB 2^(2l+k-1)
    let p: uint<11>   = trunc(raw >> 5);          // truncated multiplier, ufix(-k, l-2)
    let mfull: uint<16> = t +. zext::<11, 16>(p); // M_full < 2, so `+.` cannot wrap
    trunc(mfull >> 2)                             // round by truncation to ufix(0, l)
}
```

`t` is the $T$ wire, `tt` the $T_{\mathrm{trunc}}$ tap, `raw >> 5` is the truncated multiplier's output at `ufix`$(-k,\ell-2)$, and `mfull >> 2` is the final round-by-truncation box — the four shifts are the four format changes in the drawing, nothing more. The width arithmetic carries the correctness argument: `*` doubles the width, so `uint<8> * uint<8>` is the exact $16$-bit product and the truncation is deliberate rather than implicit; `+.` is the wrapping add, legal only because $M_{\mathrm{full}}=T+T_{\mathrm{trunc}}Z<1.65+2^{-6}<2$ is provably in range. Everything is `fn`, hence combinational — the pipeline registers a real operator wants go around this block, not inside it. Synthesis will not build the drawing: the `>> 8` and `>> 5` are free wire selections that vanish, and an FPGA tool will absorb the whole multiply-add into one DSP block, which is precisely why the "free accuracy" remarks above apply.

Simulated with [[Number Formats|fixed-point]] references in Verilog: **12 201 vectors, zero failures**. The sweep is exhaustive over all $2^{13}$ representable reduced arguments $Y$, with the table entry supplied as $T=\lfloor e^{A}\cdot2^{15}\rceil$ computed by `$exp`, checked both against a structural reference and against the analytic bound $|M-e^Y|<4u$; plus nine named asymmetric vectors ($Y=\pm2^{-13}$, the extremes of the `sfix` range, $A=0$ with $Z$ maximal and vice versa) and 4 000 random $(T,Z)$ pairs against a behavioural model of the datapath alone. Observed error range $[-1.784u,\,+0.121u]$ — one-sided as (22.30) predicts, inside the $2.07u$ budget above, and with the positive tail bounded by $\delta_T\le0.156u$ exactly as the table claims.

**Related Notes (with context).**

- [[Higher-Order e^Y Evaluator]] – extends: puts the $h(Z)$ box back, which frees $k$ and makes the table $2^{k}$ shrink faster than the multiplier grows.
- [[Tabulated e^Y]] – compares: below ~$8$ fraction bits the table is small enough to hold $e^Y$ outright, and this architecture's multiplier is pure overhead.
- [[Polynomial h(Z) Evaluator]] – extends: the same skeleton with the neglected tail restored as a piecewise polynomial, for double and beyond.
- [[Choosing an Exponential Architecture]] – compares: where the $k\ge(w_F+4)/2$ window sits against every sibling, by format.
- [[Reduced Argument Subtractor]] – depends-on: produces $Y$ in `sfix`$(-1,\ell)$ with $|Y|<\tfrac12$, the assumption that sizes $A$.
- [[Exponential Normalize-Round-Pack]] – supports: consumes $M$ in `ufix`$(0,\ell)$ and spends the $g$ guard bits this architecture was sized to preserve.
- [[Truncated Multipliers]] – depends-on: the $T_{\mathrm{trunc}}\times Z$ box, whose low columns are never built.
- [[Block Memory]] – depends-on: the $e^A$ table, and the reason widening $T$ costs nothing on an FPGA.
- [[Fixed-Point Function Approximation]] – supports: the balance-every-truncation-against-the-LSB discipline that sizes $t$, $g'$ and $k$.
- [[Polynomial Approximation]] – compares: the generic evaluator that takes over once $2^{k}$ tables stop fitting.
- [[Iterative Table-Based Exponential]] – counter-example: trades this one-shot table-plus-multiplier for $n$ small tables and $n$ cycles, on fabrics with no hard memories.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 22 "Floating-Point Exponential":

- §22.5.2 First-Order Architecture, pp. 659–660 — **Fig. 22.7**, Eqs. (22.30)–(22.31), the constraint $k\ge(w_F+4)/2$, the binary16 ($6\times8$ multiplier) and IEEE single ($k=14$, $13\times12$) sizings, and the exercise left to the reader.
- §22.5.1 Large tables and square multipliers, pp. 655–659 — Eqs. (22.19)–(22.29), the $Y=A+Z$ split and the per-term error bounds reused in the table above.
- §22.5.4 FPGA-specific remarks, p. 661 — free widening of the table output, free relaxation of $t$, and the exact product inside one DSP block.
- §22.5 preamble, pp. 654–655 — the $e^Y$ operator's specification and the direct tabulation of $e^Y$ for BFloat-class formats.
