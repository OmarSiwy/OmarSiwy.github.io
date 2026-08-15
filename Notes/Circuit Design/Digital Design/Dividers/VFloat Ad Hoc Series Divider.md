---
title: VFloat Ad Hoc Series Divider
description: Splits D = D_H + D_L and tabulates 1/D_H^2 so the table read and the first multiplication run in parallel — attractive only at small precisions where both multipliers fit in DSP blocks.
kind: circuit
source: "ASA §9.5.3, pp. 301-302"
status: seed
spade: simulated
tags: [digital, divider, reciprocal, series, table, fpga, dsp]
aliases:
  - VFloat Divider
  - VFloat Series Divider
  - Ad Hoc Series Expansion
  - Ad Hoc Evaluation of Series Expansion
---

# VFloat Ad Hoc Series Divider

A divider that splits the divisor $D = D_H + D_L$ and tabulates $1/D_H^2$, so that — alone among the multiplicative methods — it runs no iteration at all: one table read hidden under one multiplication, then a second multiplication, and it is finished.

```tikz title="VFloat ad hoc series divider datapath, w = 8 fraction bits, split at k = -6"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex,
  blk/.style={draw, align=center, inner sep=3pt, font=\small},
  w/.style={font=\scriptsize}]

% --- inputs
\node[w] at (-0.6,6.6) {$X$};
\node[w] at (4.3,6.6) {$D$};

% --- boxes
\node[blk, minimum width=2.6cm, minimum height=0.7cm] (sp) at (4.3,5.4)
     {split at $k=-6$};
\node[blk, minimum width=2.4cm, minimum height=0.7cm] (sub) at (2.0,4.1) {$D_H-D_L$};
\node[blk, minimum width=2.4cm, minimum height=0.7cm] (m1)  at (2.0,2.6) {$\times$};
\node[blk, minimum width=2.6cm, minimum height=0.9cm] (rom) at (6.6,2.6)
     {ROM $1/D_H^2$\\[-2pt]{\scriptsize $64\times14$}};
\node[blk, minimum width=2.4cm, minimum height=0.7cm] (m2)  at (4.3,1.1) {$\times$};
\node[blk, minimum width=3.4cm, minimum height=0.7cm] (rd)  at (4.3,0.0)
     {$+2^{-9}$, truncate};

% --- same-cycle box
\draw[dashed,gray] (0.7,2.05) rectangle (8.05,3.15);
\node[anchor=west,font=\scriptsize\itshape,gray] at (2.6,3.42)
     {table read $\parallel$ first product};

% --- D in
\draw[->] (4.3,6.4) -- (sp.north);
\node[w,anchor=west] at (4.4,6.0) {9};

% --- D_H, two stubs of the same bus
\draw[->] (sp.west) -- (1.5,5.4) -- (1.5,4.45);
\node[w,anchor=south] at (2.1,5.45) {$D_H$, 7};
\draw[->] (sp.east) -- (6.6,5.4) -- (6.6,3.05);
\node[w,anchor=west] at (6.7,4.5) {$D_H$, 7};

% --- D_L
\draw[->] (sp.south) -- (4.3,4.6) -- (2.5,4.6) -- (2.5,4.45);
\node[w,anchor=east] at (4.15,4.74) {$D_L<2^{-6}$, 2};

% --- A = D_H - D_L
\draw[->] (sub.south) -- (m1.north);
\node[w,anchor=east] at (1.9,3.4) {9};

% --- X in
\draw[->] (-0.6,6.4) -- (-0.6,2.6) -- (m1.west);
\node[w,anchor=west] at (-0.5,4.5) {9};

% --- P and T into the second multiplier
\draw[->] (m1.south) -- (2.0,1.8) -- (3.7,1.8) -- (3.7,1.45);
\node[w,anchor=north] at (2.7,1.75) {$P$, 18};
\draw[->] (rom.south) -- (6.6,1.8) -- (4.9,1.8) -- (4.9,1.45);
\node[w,anchor=north] at (5.8,1.75) {$T$, 14};

% --- tail
\draw[->] (m2.south) -- (rd.north);
\node[w,anchor=west] at (4.4,0.6) {36};
\draw[->] (rd.south) -- (4.3,-1.0);
\node[w,anchor=west] at (4.4,-0.7) {$Q$, 10};

\end{circuitikz}
\end{document}
```

*Own construction; the book states the architecture (9.106–9.108) in prose only. Widths are the instantiation compiled and simulated below.*

**Split the divisor so that the correction term is first-order.** Take $X$ and $D$ as normalised significands, $1 \le X, D < 2$ on $w_F$ fraction bits ([[Number Formats]]). Pick a negative integer $k$, let $D_H = \lfloor D \rfloor_{k}$ be $D$ truncated to $|k|$ fraction bits, and let $D_L = D - D_H$, so $0 \le D_L < 2^k$ by construction. Dividing numerator and denominator of $X/D$ by $D_H$ — legal because normalisation guarantees $D_H \ge 1$ — gives an exact identity:

$$\frac{X}{D} = \frac{X}{D_H}\cdot\frac{1}{1 + D_L/D_H} \tag{9.106}$$

Because $D_H \ge 1$, the ratio $D_L/D_H < 2^k \ll 1$, so the geometric series $\frac{1}{1+x} = 1 - x + x^2 - x^3 + \cdots$ truncated after its linear term is already a good approximation of the second factor:

$$\frac{X}{D} = \frac{X}{D_H}\Big(1 - \frac{D_L}{D_H} + \delta_{\text{approx}}\Big), \qquad \delta_{\text{approx}} = \Big(\frac{D_L}{D_H}\Big)^{2} - \Big(\frac{D_L}{D_H}\Big)^{3} + \cdots \tag{9.107}$$

**Put the two occurrences of $D_H$ over a common denominator and one table absorbs both.** The leading $1/D_H$ and the correction's $1/D_H$ are different powers of the same quantity, so factoring $D_H^{-2}$ out of $\frac{1}{D_H}(1 - D_L/D_H)$ leaves an integer-grid numerator:

$$\frac{X}{D} = X\,(D_H - D_L)\cdot\frac{1}{D_H^{2}} \;+\; X\delta_{\text{approx}} \tag{9.108}$$

That is the whole trick. No division survives on the right-hand side: $D_H - D_L$ is a subtraction, $X \times (\cdot)$ is a multiplication, and $1/D_H^2$ is a unary function of the $|k|$ bits of $D_H$ and therefore a plain ROM ([[Table-Based Function Evaluation]]). Tabulating $1/D_H^2$ rather than $1/D_H$ is what lets a *single* table serve both roles.

> [!note] The entire architectural gain is one table read hidden under one multiplier
> $X(D_H - D_L)$ depends only on the split, and $1/D_H^2$ depends only on $D_H$'s bits, so the two roots of the dependency graph are independent. The book's parenthesisation $\big(X \times (D_H - D_L)\big) \times \big(\tfrac{1}{D_H^2}\big)$ (p. 302) makes this explicit: the table lookup and the first multiplication issue in the same cycle, and only the second multiplication is serialised behind them. Every other cost in this note is *worse* than the multiplicative siblings — this overlap is the only thing being bought.

**The subtractor is not a full-width one.** $D_H$ carries zeros in the low $w_F - |k|$ bits and $D_L$ is exactly those bits, so the two operands of $D_H - D_L$ occupy disjoint fields of $D$. Writing $D_H = H\cdot 2^{k}$ and $D_L = L\cdot2^{-w_F}$ with $0 < L < 2^{w_F+k}$, the difference is

$$D_H - D_L = (H-1)\cdot2^{k} + \big(2^{w_F+k} - L\big)\cdot2^{-w_F}$$

— the low field is the two's-complement negation $\bar L + 1$ ([[Number Formats]]) and the high field is decremented once. The borrow chain therefore spans the $|k|$ high bits only, never the full significand. Equivalently $D_H - D_L = 2D_H - D$, which is a hard-wired shift of the truncated divisor minus the divisor itself.

**Sizing: $2k < \ell$ pins the table to half the target precision.** For a result accurate to $2^{\ell}$ the approximation error must be smaller than $2^{\ell}$. Since $\delta_{\text{approx}}$ is dominated by its leading term $(D_L/D_H)^2 < 2^{2k}$ and $X < 2$, the condition is $2k < \ell$ (p. 302) — with $k, \ell < 0$ that reads $|k| > |\ell|/2$. Two consequences follow immediately. The ROM is addressed by $D_H$'s $|k|$ fraction bits (the leading $1$ is implicit), so it has $2^{|k|} \approx 2^{|\ell|/2}$ entries; and $1/D_H^2$ must itself be tabulated to at least $2^{\ell}$, so it needs about $|\ell| \approx 2|k|$ output bits — the book's "about twice as many output bits as input bits" (p. 302). The table is the *square root* of a full reciprocal table, which is precisely why the method is a small-precision one: the only accuracy knob is $|k|$, and it costs exponentially.

**Both multipliers must be faithful, and their inputs are wider than significands.** The book requires the two multipliers to be "faithful to a few bits more than $2^{\ell}$, and their inputs are slightly larger than full significands" (p. 302). So [[Truncated Multipliers]] apply, but with guard bits rather than at their most aggressive setting, and each multiplier is a little too wide to be a clean $w_F \times w_F$ tile. On FPGAs that is two [[DSP Blocks]]; the entire case for the operator is that those are already sitting there unused. Once they are not free — no DSP column, or operands that straddle two tiles — the second full-width multiplication is exposed and one-step [[Newton-Raphson Reciprocal]] or the [[Quadratic Series Divider]] win outright, which is also the book's verdict on the overall cost (p. 302).

**The large-precision variant is not a new algorithm.** Jaiswal *et al.* [Jai14] keep the same decomposition but retain more series terms, tabulating $r_0 = 1/D_H$ and writing $e = D_L/D_H$. Since $e = D/D_H - 1 = r_0D - 1$, their (9.110) is *literally* (9.65) — the quadratic series of §9.4 — only with a full-precision $r_0$ tabulation in place of the short [[Reciprocal Seed Table]], and is therefore strictly more expensive (p. 302). The ad hoc split buys nothing beyond first order.

> [!warning] The source gives no area, delay or DSP counts for this operator
> Chapter 9 is architectural throughout: it states the sizing rules ($2k < \ell$, table output width, faithful multipliers) but reports no synthesis results for any divider. "Attractive at small precisions" is the book's judgement, not a measured comparison, and the DSP-tile count above is structural. Sizing this against a FloPoCo `FPDiv` needs outside data.

$$\boxed{\ \frac{X}{D} \;=\; \Big(X\,(D_H - D_L)\Big)\cdot\frac{1}{D_H^{2}} \;+\; X\delta_{\text{approx}}, \qquad \delta_{\text{approx}} \approx \Big(\frac{D_L}{D_H}\Big)^{2}, \qquad 2k < \ell\ }$$

**When it breaks.**

- **Accuracy is exponentially expensive.** $2k < \ell$ forces $|k| > |\ell|/2$, so the ROM grows as $2^{|\ell|/2}$. At single precision ($\ell = -24$) that is a $2^{12}\times 24$-bit table — a handful of block RAMs. At double precision ($\ell = -53$) it is $|k| \ge 27$, a $2^{27}$-entry table. The method is dead well before double.
- **Nothing is self-correcting.** This is one shot: no step recomputes a residual against $D$, so a rounding error anywhere in the datapath survives into the result. [[Newton-Raphson Reciprocal]] annihilates its own earlier errors; here every error budget is a *design-time* budget with no runtime recovery.
- **No exact remainder.** Multiplicative methods give a faithful quotient, not a correctly rounded one, and this one does not even carry a residual you could test. If you need correct rounding or $R = X - QD$, [[SRT Division]] or [[Restoring Division]] are the only options.
- **Normalisation is load-bearing.** Both $D_H \ge 1$ (used to bound $D_L/D_H < 2^k$) and $1/D_H^2 \le 1$ (used to size the table) assume $1 \le D < 2$. Feed an unnormalised divisor and the bound on $\delta_{\text{approx}}$ evaporates while the table range blows up.
- **The obvious extension collapses.** Keeping more series terms turns the method back into the quadratic series with a worse seed table (p. 302), so there is no growth path — you switch algorithms rather than scale this one.

**RTL (Spade).**

```spade
// VFloat ad hoc series divider: X/D = X(D_H - D_L)(1/D_H^2) + X*delta.
// w = 8 fraction bits, split at k = -6.
//   x, d : significands in [1,2) as uint<9>, integer value = 2^8 * X
//   t    : ROM output floor(2^13 / D_H^2) as uint<14>, addressed by D_H's 6
//          fraction bits; a 64 x 14 ROM read in parallel with the first product
entity vfloat_div(x: uint<9>, d: uint<9>, t: uint<14>) -> uint<10> {
    let dh_hi: uint<7> = d.as_bits()[2..9].as_uint();   // table address, |k| = 6 bits
    let dh: uint<9>    = dh_hi.concat(0u2);             // D_H, D truncated to 2^-6
    let dl: uint<9>    = zext(d.as_bits()[0..2].as_uint());   // D_L < 2^-6
    let a: uint<9>     = trunc(dh - dl);                // D_H - D_L = 2D_H - D, exact
    let p: uint<18>    = x * a;                         // exact, scale 2^-16
    let tw: uint<18>   = zext(t);
    let full: uint<36> = p * tw;                        // scale 2^-29
    trunc((full + 0x100000u36) >> 21)                   // round to nearest, scale 2^-8
}
```

`dh_hi` is the 7-bit address bus running to the ROM box, `a` the subtractor output, `p` the left multiplier and `full` the right one; `t` is the ROM's output wire, held as a port because the 64 entries are generated offline rather than described in RTL. Width arithmetic is the book's: $9\times9 \to 18$ exactly, then $18\times18 \to 36$ after zero-extending the 14-bit table word, and the `+0x100000` then `>> 21` is the round-and-truncate block returning the quotient on the $2^{-8}$ grid. The whole entity is combinational — no `reg`, no `inst` — so the drawn dashed box is a *logical* parallelism, not a pipeline stage; a real build registers between the two multipliers and the dashed box becomes stage 1. Synthesis will not build the 36-bit multiplier the types imply: `tw` is a zero-extended 14-bit value, so the array is pruned to $18\times14$ and on FPGA lands in [[DSP Blocks]] rather than LUT logic, and the final shift-and-truncate costs nothing but wiring plus one 36-bit increment.

Simulated with the ROM modelled behaviourally as $\lfloor 2^{13}/D_H^2 \rfloor$: six named vectors (including the asymmetric $1.0 \div 1.90625$ and its reverse $1.90625 \div 1.0$), a 3000-vector random sweep, and an exhaustive sweep of all $256 \times 256 = 65536$ normalised $(X, D)$ pairs against a behavioural $\lfloor 2^8 X/D \rfloor$ reference. Every result is faithful, with a **measured maximum error of 0.612 ulp** at $\ell = -8$. Truncating the last product instead of rounding it loses faithfulness — the measured deficit reached a full ulp below $\lfloor X/D \rfloor$ — which is the concrete form of the book's "a few bits more than $2^{\ell}$" ([[Rounding]], [[Error Accuracy]]).

**Related Notes.**

- [[Quadratic Series Divider]] – compares: the natural extension of this split to more terms collapses exactly onto it, and with a costlier seed table.
- [[Newton-Raphson Reciprocal]] – compares: one Newton step reaches the same accuracy for less, and unlike this one-shot method it repairs its own rounding errors.
- [[Reciprocal Seed Table]] – depends-on: same "tabulate a unary function of the divisor's high bits" primitive, one power up ($1/D_H^2$ instead of $1/D_H$).
- [[Table-Based Function Evaluation]] – depends-on: the $2^{|k|}\times2|k|$ ROM is a plain unary table, and every technique for shrinking one applies here.
- [[Truncated Multipliers]] – supports: both products need only be faithful, so neither multiplier is built at full precision.
- [[DSP Blocks]] – depends-on: the operator is only competitive when both multipliers land in hard tiles.
- [[Karatsuba]] – compares: same $D = D_H + D_L$ operand split, but Karatsuba recombines the low part exactly, whereas here it is carried only to first order and the residue becomes $\delta_{\text{approx}}$.
- [[Division by Reciprocal]] – extends: the general "multiply by an approximate $1/D$" strategy that this note specialises to a two-multiplication, zero-iteration form.
- [[Choosing a Divider]] – compares: where this sits against restoring, SRT and the iterative multiplicative methods.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §9.5.3 "Ad hoc Evaluation of Series Expansion", pp. 301–302 — equations (9.106)–(9.110), the $2k < \ell$ sizing rule, the table output-width rule, and the cost comparison against Newton-Raphson and the quadratic series.
- §9.5.2, p. 301 — the Householder/Halley context immediately preceding this method.
- §9.4, pp. 295–299 — the quadratic series (9.65) that [Jai14] reduces to.
- [WBL06] Wang, Braganza & Leeser, "Advanced Components in the Variable Precision Floating-Point Library", FCCM 2006 — the VFloat library this technique comes from (bibliography, p. 305).
- [Jai14] Jaiswal *et al.*, "Series Expansion based Efficient Architectures for Double Precision Floating Point Division", *CSSP* 33 (2014) — the larger-precision variant (bibliography, p. 304).
