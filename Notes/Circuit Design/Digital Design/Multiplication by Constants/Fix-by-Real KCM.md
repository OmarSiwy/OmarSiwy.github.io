---
title: "Fix-by-Real KCM"
description: "KCM for an irrational constant: the shift is absorbed into each table's contents, all tables share one LSB, and g > log2(D) guard bits buy faithfulness."
kind: circuit
source: "ASA §12.3.3, pp. 390-395"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, kcm, fixed-point, rounding, fpga]
aliases:
  - FixRealKCM
  - Faithful Fix-by-Real KCM
  - Fix-by-Real KCM Algorithm
  - Real-Constant KCM
---

# Fix-by-Real KCM

A KCM whose $\alpha$-bit tables store the already-shifted, already-rounded value $\lfloor 2^{k\alpha+\ell_X}CX_k\rceil_{\ell_R-g}$ of a *real* constant, so that every table ends at the same LSB and the only thing standing between the architecture and a faithful result is the guard-bit count $g$.

```tikz title="Fix-by-real KCM: three tables sharing one LSB, and the architecture that sums them"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex]
\footnotesize
% ---------------- (a) alignment of the partial products ----------------
% every row is right-aligned on the common LSB l_R-g at x=6.8
\fill[black!12] (2.0,4.58) rectangle (6.8,4.82);
\draw           (2.0,4.58) rectangle (6.8,4.82);
\node[font=\tiny] at (4.4,4.70) {24 bits};
\node[anchor=east,font=\small] at (1.85,4.70) {$T_2(X_2)$};

\fill[black!12] (3.2,4.18) rectangle (6.8,4.42);
\draw           (3.2,4.18) rectangle (6.8,4.42);
\node[font=\tiny] at (5.0,4.30) {18 bits};
\node[anchor=east,font=\small] at (3.05,4.30) {$T_1(X_1)$};

\fill[black!12] (4.4,3.78) rectangle (6.8,4.02);
\draw           (4.4,3.78) rectangle (6.8,4.02);
\node[font=\tiny] at (5.6,3.90) {12 bits};
\node[anchor=east,font=\small] at (4.25,3.90) {$T_0(X_0)$};

\draw[<->] (2.0,5.02) -- node[above,font=\tiny]{$\alpha$} (3.2,5.02);
\draw[<->] (3.2,5.02) -- node[above,font=\tiny]{$\alpha$} (4.4,5.02);
\node[anchor=east,font=\tiny] at (1.9,5.02) {MSBs step by $\alpha$};

\draw[dashed] (6.2,3.35) -- (6.2,4.95);
\draw[dashed] (6.8,3.35) -- (6.8,4.95);
\node[font=\tiny] at (6.2,5.42) {$2^{\ell_R}$};
\node[font=\tiny,anchor=west] at (6.95,5.06) {$2^{\ell_R-g}$ (common LSB)};
\draw[->] (6.92,5.02) -- (6.82,4.94);

\draw (6.4,3.52) circle (0.10) node[font=\tiny] {1};
\node[anchor=east,font=\tiny] at (6.18,3.52) {round bit $+2^{\ell_R-1}$, folded into $T_0$};
\node[font=\tiny] at (3.4,3.06) {(a) the $2^{k\alpha}$ shift lives in the table \emph{content}, so all $D=3$ tables end at one LSB};

% ---------------- (b) architecture ----------------
\draw (0.8,1.92) rectangle (6.8,2.48);
\draw (2.8,1.92) -- (2.8,2.48);
\draw (4.8,1.92) -- (4.8,2.48);
\node[font=\tiny] at (1.8,2.20) {$X_2=x_{17..12}$};
\node[font=\tiny] at (3.8,2.20) {$X_1=x_{11..6}$};
\node[font=\tiny] at (5.8,2.20) {$X_0=x_{5..0}$};
\node[anchor=east,font=\small] at (0.65,2.20) {$2^{-\ell_X}X$};
\node[anchor=west,font=\tiny] at (6.95,2.20) {$18$ bits, $D=\lceil 18/\alpha\rceil=3$};

\draw (1.05,0.90) rectangle (2.55,1.50); \node at (1.8,1.20) {$T_2$};
\draw (3.05,0.90) rectangle (4.55,1.50); \node at (3.8,1.20) {$T_1$};
\draw (5.05,0.90) rectangle (6.55,1.50); \node at (5.8,1.20) {$T_0$};
\draw[->] (1.8,1.92) -- node[left,font=\tiny]{$\alpha{=}6$} (1.8,1.50);
\draw[->] (3.8,1.92) -- node[left,font=\tiny]{$\alpha{=}6$} (3.8,1.50);
\draw[->] (5.8,1.92) -- node[left,font=\tiny]{$\alpha{=}6$} (5.8,1.50);

\draw[->] (1.8,0.90) -- node[anchor=west,font=\tiny]{MSB $m_R$} (1.8,0.30);
\draw[->] (3.8,0.90) -- node[anchor=west,font=\tiny]{MSB $m_R{-}\alpha$} (3.8,0.30);
\draw[->] (5.8,0.90) -- node[anchor=west,font=\tiny]{MSB $m_R{-}2\alpha$} (5.8,0.30);

\draw (0.8,-0.30) rectangle (6.8,0.30);
\node[font=\small] at (3.8,0.0) {$+$ \ \ bit heap of height $D=3$};

\draw[->] (3.8,-0.30) -- node[anchor=west,font=\tiny]{$S(X)$ : $(m_R,\ \ell_R{-}g)$} (3.8,-0.95);
\draw (1.6,-1.55) rectangle (6.0,-0.95);
\node[font=\small] at (3.8,-1.25) {final round: truncate $g$ bits};
\draw[->] (3.8,-1.55) -- node[anchor=west,font=\tiny]{$(m_R,\ \ell_R)$} (3.8,-2.15);
\node[anchor=north,font=\small] at (3.8,-2.20) {$R\approx CX$, faithful when $g>\log_2 D$};
\node[font=\tiny] at (3.4,-2.95) {(b) architecture};
\end{circuitikz}
\end{document}
```

*after Fig. 12.15, pp. 390–391*

**Scale the input to an integer before chunking it, because the chunk count follows from the format, not the width.** Integer KCM ([[KCM, Table-Based Constant Multiplication]]) reads $w_X$ and splits it into $\lceil w_X/\alpha\rceil$ pieces. A fixed-point input carries a format $(m_X,\ell_X)$ instead ([[Fixed-Point Representations]]), so the number of tables is

$$D=\left\lceil\frac{m_X-\ell_X+1}{\alpha}\right\rceil \tag{12.25, p.\,390}$$

and the decomposition is written on the *scaled* integer:

$$2^{-\ell_X}X=\sum_{k=0}^{D-1}2^{k\alpha}X_k,\qquad X_k\in\{0,\dots,2^\alpha-1\} \tag{12.26}$$

— a radix-$2^\alpha$ reading of $X$, hexadecimal when $\alpha=4$. Distributing $C$ over that sum, by distributivity of multiplication over addition and nothing else, gives

$$CX=\sum_{k=0}^{D-1}2^{k\alpha+\ell_X}\,CX_k. \tag{12.27}$$

Each $X_k$ is exactly $\alpha$ bits wide, $\alpha$ being the LUT input count of the target device ([[Lookup-Tables]]); if $\alpha\nmid(m_X-\ell_X+1)$ the top chunk is short and its table simply has fewer entries. In the diagram $X$ is `ufix(17,0)`, so $D=3$ and every $X_k$ is 6 bits.

**Absorb the shift into the table content rather than into the wiring.** The obvious construction is to instantiate a generic multiplier by some fixed-point $\widetilde C\approx C$ and shift its output by $2^{k\alpha}$ on the way into the adder — that is what integer KCM does, and it is right there because the integer product is exact. Here it is wasteful: every table would then be equally wide, and the low tables would store bits far to the right of $\ell_R$ which the final rounding immediately discards (p. 390). Put the shift inside the table instead:

$$T_k(X_k)=\left\lfloor 2^{k\alpha+\ell_X}\,CX_k\right\rceil_{\ell_R-g}$$

The table is an arbitrary function of $\alpha$ bits, so scaling its contents by $2^{k\alpha}$ is free — it changes what is stored, not what is built. The consequence is the staircase in panel (a): table $k$'s **MSB** climbs by $\alpha$ while its LSB stays put, so $T_k$ has format $(m_R-(D-1-k)\alpha,\ \ell_R-g)$ and costs $m_R-(D-1-k)\alpha-\ell_R+g+1$ LUTs, one per output bit. Higher tables store *more significant* bits, not more numerous ones.

**Give every table the same output LSB, because a table more accurate than its siblings is accurate in vain.** $CX_k$ has infinitely many bits whenever $C$ is irrational, so a rounding position must be chosen; it is $\ell_R-g$ for all $D$ of them. The reason is that the $D$ rounding errors simply add. Refining one table shrinks one of $D$ equal terms in a sum dominated by the coarsest of them, so accuracy has to move as a block — $g$ is one number for the whole operator, never one per table.

**Split the error into a table term and a final-rounding term.** Aligned fixed-point addition is errorless, and $m_R$ is chosen so that no overflow occurs, so with $S(X)=\sum_k T_k(X_k)$ (12.30) the only two error sources are the $D$ table roundings and the last one. Inserting and cancelling $S(X)$ — the same telescoping used for [[Faithful Shift-and-Add Real Constant Multiplier]], landing on different terms because there the constant itself was inexact and here it is not:

$$\delta_{\text{total}}(X)=R(X)-CX=\underbrace{\big(R(X)-S(X)\big)}_{\delta_{\text{final round}}}+\underbrace{\big(S(X)-CX\big)}_{\delta_{\text{round}}} \tag{12.31, p.\,392}$$

Substituting (12.27) into $\delta_{\text{round}}$ turns it into a sum of $D$ independent table roundings, each at most half an ulp of $\ell_R-g$:

$$|\delta_{\text{round}}(X)|<D\times2^{\ell_R-g-1}=\overline\delta_{\text{round}} \tag{12.32–12.33}$$

while the final round to nearest contributes $\delta_{\text{final round}}\le2^{\ell_R-1}$ (12.34). Faithfulness is $\overline\delta_{\text{total}}<2^{\ell_R}$, one ulp ([[Rounding]]); dividing (12.35) through by $2^{\ell_R-1}$ collapses it to $1+D\,2^{-g}<2$, i.e.

$$\boxed{\ \overline\delta_{\text{total}}=2^{\ell_R-1}+D\times2^{\ell_R-g-1}<2^{\ell_R}\iff g>\log_2 D\ } \tag{12.35–12.36, p.\,392}$$

$g$ grows only logarithmically in the number of tables, and $D$ itself grows linearly in the input width, so the guard-bit overhead is doubly logarithmic in $w_X$ — in practice two or three bits, forever.

**Round to nearest for free, then truncate.** By the identity $\lfloor x\rceil_{\ell_R}=\lfloor x+2^{\ell_R-1}\rfloor_{\ell_R}$, the final rounding needs no adder: the constant $2^{\ell_R-1}$ is pre-added *offline* into the contents of one table (the circled 1 in panel (a), $T_0$ by convention), and the final round becomes a truncation — $g$ wires cut, zero logic. With half-unit-biased rounding the final error tightens to $2^{\ell_R-1}(1-2^{-g})$ (12.37), relaxing the requirement to $g>\log_2(D-1)$ (12.38, p. 393) and saving one guard bit exactly when $D$ is a power of two; FloPoCo does not implement it.

**Measure each constant's error in gulps so it can be reported before $g$ is known.** The bound $D/2$ half-ulps is generic and pessimistic, and FloPoCo tightens it per constant in units of $2^{\ell_R-g}$ — a *gulp*, the ulp of the guard-extended computation. Expressing errors in gulps is what decouples the per-constant analysis from the choice of $g$, and hence what makes a single global analysis over many constants possible ([[KCM-Based Sum of Products]]). The catalogue (pp. 393–394): $C=0$ contributes $\overline{\delta^{(\text{gulp})}_{\text{round}}}=0$; $|C|=2^n$ is a shift, contributing $0$ if $n+\ell_X\ge\ell_R$ (no bit is lost) and $1$ otherwise; a $C$ that is an integer multiple of $2^{\ell_R-\ell_X}$ produces no bit at all to the right of $2^{\ell_R}$ and contributes $0$ for any $g\ge0$; only the general case costs $D/2$. Fig. 12.16 (p. 394) is the third case done per table: with $C$ fitting on 6 bits each table output is exactly $\alpha+6=12$ bits and only $T_0$ needs rounding, so $\overline\delta_{\text{round}}=2^{\ell_R-g-1}$ instead of $3\times$ that, the heap is only 2 high, and $g$ may be smaller. A table whose MSB falls below $\ell_R-g$ is dropped outright; the analysis survives because a neglected table is a rounding under another name — safe, and merely pessimistic when more than one is dropped.

**Emit bits into a heap; do not compress them.** The $D$ table outputs are nothing but weighted bits ([[Bit Heaps]]), so the rake of adders drawn in most figures is the wrong consumer. FloPoCo's `FixRealKCM` is therefore a *virtual* operator: it writes its bits into a caller-supplied heap and deliberately leaves them uncompressed, so that an enclosing operator — a complex multiplier, an FIR tap — builds one [[Compressor Trees]] over everything at once (pp. 394–395). The saving is not only in compression. Computing $R=C_1X+C_2Y$ naively to last-bit accuracy needs $g=2$ at the top, hence each KCM built to $2^{\ell_R-2}$ with its own $g_i=2$ and tables at $\ell_R-4$, and it commits *two* intermediate roundings on the way. A single global analysis reaches the same accuracy with all six tables rounded at $2^{\ell_R-3}$ and one final round (p. 395).

**Worked example: $C=\pi/4$, $X$ in `ufix(7,0)`, $\ell_R=-4$.** Here $\mathrm{ulp}=2^{-4}=0.0625$ and $m_R=7$ since $255\cdot0.7854=200.3$. Taking $\alpha=4$ gives $D=\lceil(7-0+1)/4\rceil=2$, so $g>\log_2 2=1$ and $g=2$; both tables round at $\ell_R-g=-6$. For $X=173=10101101_2$, i.e. $X_0=1101_2=13$ and $X_1=1010_2=10$:

$$T_0(13)=\left\lfloor\tfrac{\pi}{4}\cdot13\right\rceil_{-6}=\lfloor10.2101761\rceil_{-6}=\tfrac{653}{64},\qquad T_1(10)=\left\lfloor2^4\cdot\tfrac{\pi}{4}\cdot10\right\rceil_{-6}=\lfloor125.6637061\rceil_{-6}=\tfrac{8042}{64}$$

$$S=135.859375,\qquad \delta_{\text{round}}=S-\tfrac{\pi}{4}\cdot173=-0.014507,\qquad |\delta_{\text{round}}|<D\cdot2^{\ell_R-g-1}=2\cdot2^{-7}=0.015625\ \checkmark$$

with little to spare. The half-ulp $2^{-5}$ is pre-added into $T_0$, so the final round is the truncation $R=\lfloor135.890625\rfloor_{-4}=2174/16=135.875$, against an exact $135.8738823$:

$$\delta_{\text{total}}=+1.118\times10^{-3}=0.018\ \text{ulp},\qquad \overline\delta_{\text{total}}=2^{-5}+2\cdot2^{-7}=0.75\ \text{ulp}<1\ \text{ulp}.$$

Cost: $T_0$ spans $\ell=-6$ to $m=3$ (10 LUTs), $T_1$ spans $-6$ to $7$ (14 LUTs), plus a 14-bit adder — about 38 LUTs, one LUT plus one carry chain deep, and the same 38 LUTs for any other real constant of that magnitude. Dropping to $g=1$ would give $\overline\delta_{\text{total}}=2^{-5}+2\cdot2^{-6}=1$ ulp *exactly*, which fails the strict inequality: $g=2$ is the minimum, not slack.

> [!warning] The book presents KCM as an FPGA technique throughout — $\alpha$ is defined as the architectural LUT input count (p. 383) — and gives no ASIC cost model for it. Whether the shift-into-the-table trick still pays when the "table" is synthesised random logic with no natural $\alpha$ is not covered; needs outside research.

**When it breaks.**

- **$g>\log_2 D$ is strict.** At $D=2$, $g=1$ lands on exactly $1$ ulp and is *not* faithful. Every power-of-two $D$ sits on this boundary, which is precisely the case the unimplemented HUB variant (12.38) would rescue.
- **$\alpha$ must be the LUT input count.** One bit past it and each table output bit costs $2^k$ LUTs plus address decoding, the same cliff that killed plain tabulation (p. 383). Wirthlin's $\alpha-1$ split trades one table bit for the fast carry chain on Xilinx parts; Intel LUTs ship with a full adder and need no such trick (p. 385).
- **The additions must stay exact.** The whole budget rests on aligned fixed-point addition being errorless. Truncating the summation to save compressor hardware injects a third error term that (12.35) does not contain, and the two truncations then have to be budgeted together.
- **Small constants invalidate $D$.** When tables are dropped for having their MSB below $\ell_R-g$, the $D$ in (12.33) overcounts. The direction is safe, but a generator that keeps using it buys guard bits it does not need.
- **Faithful is not correctly rounded.** This architecture delivers $<1$ ulp, never $\le\frac12$ ulp. If correct rounding is required, [[Tabulated Perfectly Rounded Constant Multiplier]] gives it with a single rounding — and dies exponentially in $w_X$, which is the reason KCM exists at all.

  > [!warning] §12.3.3 does not say what $g$ and what table precision would make a *fix-by-real KCM* correctly rounded; the $\ell'_{\max}\approx\ell_{\max}-w_X$ rule of p. 389 is stated for the shift-and-add route only. Needs outside research.
- **Signed inputs.** The decomposition (12.26) is written on a non-negative scaled integer. How the top chunk of a two's-complement $X$ is handled — a signed table, or a bias folded into the constant row — is not spelled out here.

  > [!warning] Not covered in §12.3.3 — needs outside research.

**RTL (Spade).**

```spade
// Fix-by-real KCM for C = pi/4.  X is ufix(7,0) (l_X = 0, m_X = 7), result R is
// ufix(7,-4) (l_R = -4).  alpha = 4 => D = 2, so g > log2(2) = 1 and g = 2:
// both tables are rounded to LSB l_R - g = -6 and held as integer gulp counts.

// T_0(X_0) = round(2^{l_X} C X_0) at LSB -6, with the half-ulp round bit
// 2^{l_R-1} = 2^-5 = 2 gulps pre-added for free.
fn t0(x: uint<4>) -> uint<10> {
    match x {
        0  => 2,   1  => 52,  2  => 103, 3  => 153,
        4  => 203, 5  => 253, 6  => 304, 7  => 354,
        8  => 404, 9  => 454, 10 => 505, 11 => 555,
        12 => 605, 13 => 655, 14 => 706, _  => 756,
    }
}

// T_1(X_1) = round(2^{alpha + l_X} C X_1) at LSB -6.  The 2^alpha shift lives in
// the table content, so T_1 shares T_0's LSB and is alpha bits taller.
fn t1(x: uint<4>) -> uint<14> {
    match x {
        0  => 0,     1  => 804,   2  => 1608,  3  => 2413,
        4  => 3217,  5  => 4021,  6  => 4825,  7  => 5630,
        8  => 6434,  9  => 7238,  10 => 8042,  11 => 8847,
        12 => 9651,  13 => 10455, 14 => 11259, _  => 12064,
    }
}

entity fixrealkcm_pi4(x: uint<8>) -> uint<12> {
    let b = x.as_bits();
    let s: uint<14> = zext::<10, 14>(t0(b[0..4].as_uint())) +. t1(b[4..8].as_uint());
    trunc(s >> 2)
}
```

`b[0..4]` and `b[4..8]` are the two chunk taps of panel (b) — `as_bits()` index 0 is the LSB, so `b[0..4]` is $X_0$. The staircase of panel (a) is visible in the return types: `t0` is 10 bits and `t1` is 14, both ending at $\ell_R-g=-6$, and the `zext` to 14 is the right-justification the drawing shows as a shared LSB line. `s` is $S(X)$; `+.` is the wrapping add, safe because $756+12064=12820<2^{14}$. The `>>2` with `trunc` is the final round, dropping $g=2$ bits, and it is a truncation only because the round bit already sits inside `t0`. All combinational — synthesis merges the tables and the adder into one LUT layer plus a carry chain, and a real generator would not add the two table outputs here at all but push them into the caller's bit heap.

Simulated exhaustively over all 256 inputs plus 3000 random draws and 5 named vectors, including the asymmetric pair $X=1$ (low chunk only) and $X=128$ (high chunk only), checked both against a behavioural model of the algorithm in real arithmetic and against the faithfulness predicate $|R-\tfrac{\pi}{4}X|<2^{-4}$. Worst measured error $0.681$ ulp against the analytic bound of $0.75$; $X=173$ reproduces $R=2174$ exactly.

**Related Notes.**

- [[KCM, Table-Based Constant Multiplication]] – extends: the same radix-$2^\alpha$ chunking with an exact integer product; this note adds the format, the guard bits and the two roundings.
- [[Rounding]] – supports: supplies faithfulness, the half-ulp round-bit identity, and the HUB variant that would relax (12.36) by one bit.
- [[Bit Heaps]] – depends-on: the $D$ table outputs are a heap of height $D$, which is what makes the virtual-operator interface possible at all.
- [[Compressor Trees]] – extends: the consumer that replaces the rake of adders once several KCMs share one heap.
- [[Faithful Shift-and-Add Real Constant Multiplier]] – compares: the other route to a real constant, where the error splits into a final round plus $\delta_C X$ rather than a final round plus $D$ table roundings.
- [[Tabulated Perfectly Rounded Constant Multiplier]] – compares: one single rounding and $\frac12$ ulp at a cost exponential in $w_X$; the reference every other technique is measured against.
- [[KCM-Based Sum of Products]] – extends: fuses every table of every tap into one heap so that the per-constant gulp bounds add into a single global $g$.
- [[Rational-Constant KCM Table]] – extends: when $C$ is rational the table contents are themselves periodic, collapsing the per-table LUT count this note treats as $m-\ell+1$.
- [[Floating-Point Exponential]] – supports: a consumer that multiplies by real constants such as $1/\log 2$ under a hard faithfulness budget.
- [[Choosing a Constant Multiplier]] – compares: where this sits against the shift-and-add and DSP-block alternatives.
- [[Lookup-Tables]] – depends-on: fixes $\alpha$, and with it $D$, the table cost and the entire cost model.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 12, "Multiplication by Constants".

- §12.3.3 "Faithful Fix-by-Real KCM Algorithm", pp. 390–391 — decomposition (12.25)–(12.27), the table definition $T_k$, and Fig. 12.15 (alignment and architecture).
- §12.3.3.1 "Error Analysis", pp. 391–393 — (12.28)–(12.36), the truncating final round, and the HUB refinement (12.37)–(12.38).
- §12.3.3.2 "Implementation Considerations", pp. 393–395 — constant-specific error bounding in gulps, Fig. 12.16 (the small-$C$ case), neglected tables, and virtual KCM operators feeding a shared bit heap.
- §12.2 "Integer Constant Multiplication Using Tables", pp. 383–385 — the LUT cost model, $\alpha$, and the Wirthlin split this inherits.
- §12.3.2, pp. 387–389 — the shift-and-add route and (12.16)–(12.24), for contrast.
