---
title: "KCM-Based Sum of Products"
description: "Fuses every table of every tap into one bit heap with a single final rounding, so g > log2(ND) guard bits replace one rounding per multiplier."
kind: circuit
source: "ASA §12.5.5, pp. 412-414; §12.3.3.3, pp. 394-395"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, sopc, bit-heap, fpga, rounding, fir]
aliases:
  - KCM-Based SOPC
  - Table-Based Sum of Products
  - Table-Based Sum of Products by Real Constants
  - FixRealSOPC
  - Fused KCM SOPC
---

# KCM-Based Sum of Products

A sum of products by real constants in which all $ND$ KCM tables of all $N$ taps empty into a single bit heap, so the operator performs exactly one rounding instead of $N+1$.

```tikz title="KCM-based SOPC: twelve tables into one bit heap and one final truncation, plus the resulting bit heap"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- (a) KCM-based SOPC architecture, N=4 inputs, D=3 chunks each ----------
\foreach \i/\gx in {0/0, 1/2.7, 2/5.4, 3/8.1} {
  \node[font=\small] at (\gx+0.68,3.75) {$X_\i$};
  \draw (\gx+0.68,3.55) -- (\gx+0.68,3.15);
  \draw (\gx,3.15) -- (\gx+1.36,3.15);
  \foreach \k in {0,1,2} {
     \draw[->] (\gx+\k*0.68,3.15) -- (\gx+\k*0.68,2.55);
     \draw (\gx+\k*0.68-0.32,2.55) rectangle (\gx+\k*0.68+0.32,2.0);
     \node[font=\tiny] at (\gx+\k*0.68,2.28) {$T_{\i\k}$};
     \draw[->] (\gx+\k*0.68,2.0) -- (\gx+\k*0.68,1.35);
  }
}
\node[font=\tiny,anchor=west] at (9.55,3.15) {$\alpha$-bit chunks};
\node[font=\tiny,anchor=west] at (9.55,1.60) {$(m_{ik},\ \ell_R-g)$};
\draw (-0.5,0.7) rectangle (9.4,1.35);
\node[font=\small] at (4.45,1.02) {bit-heap based summation architecture};
\draw[->] (4.45,0.7) -- (4.45,0.09);
\node[font=\small,anchor=west] at (4.55,0.44) {$S$};
\node[font=\tiny,anchor=east] at (4.35,0.44) {$(m_R,\ \ell_R-g)$};
\draw (2.3,-0.6) rectangle (6.6,0.05);
\node[font=\small] at (4.45,-0.28) {final round by truncation};
\draw[->] (4.45,-0.62) -- (4.45,-1.05);
\node[font=\small,anchor=west] at (4.55,-0.82) {$R$};
\node[font=\tiny,anchor=east] at (4.35,-0.82) {$(m_R,\ \ell_R)$};
\node[font=\small] at (4.45,-1.55) {(a) $ND=12$ tables, one bit heap, one rounding};
% ---------- (b) the bit heap itself ----------
\begin{scope}[yshift=-2.5cm,xshift=5.2cm]
  \foreach \r/\len in {0/7,1/7,2/8,3/8,4/12,5/12,6/13,7/13,8/17,9/17,10/18,11/18} {
    \foreach \c in {0,...,\len} { \fill (-\c*0.125,-\r*0.155) circle (0.038); }
  }
  \draw[dashed] (-0.4375,0.28) -- (-0.4375,-2.05);
  \node[font=\tiny,anchor=south] at (-0.4375,0.3) {$\ell_R$};
  \node[font=\tiny,anchor=south] at (-2.25,0.3) {$m_R$};
  \draw[<->] (-0.4375,-2.2) -- (0.0625,-2.2);
  \node[font=\tiny,anchor=west] at (0.14,-2.2) {$g=4$ guard bits};
  \node[font=\small,anchor=north] at (-1.1,-2.6) {(b) its bit heap: $4$-tap half-sine FIR,};
  \node[font=\small,anchor=north] at (-1.1,-2.95) {$m_X=0$, $\ell_X=\ell_R=-12$, $\alpha=5$};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 12.24, p. 412 and Fig. 12.25, p. 413*

**Take the whole sum as the operator, not the multiplier.** The specification is

$$R\approx\sum_{i=0}^{N-1}C_iX_i,\qquad X_i\ \text{an}\ \mathrm{sfix}(m_i,\ell_i)\ \text{number},\ C_i\in\mathbb R \tag{12.47, p.\,412}$$

with one further parameter that is not visible in the formula: the output LSB $\ell_R$, which for a real constant is an *input* to the problem and not a consequence of the input widths (see [[Fix-by-Real KCM]]). Each $X_i$ is $w_i=m_i-\ell_i+1$ bits wide. Building this from $N$ instances of a faithful [[Fix-by-Real KCM]] and one adder tree is correct, and it is what a modular generator does. It is also the thing this note deletes, because that composition commits $N$ intermediate roundings whose only purpose was to give each multiplier a nice interface.

**Expand the chunk decomposition inside the sum and the two summations collapse into one.** Every KCM already reads its input in radix $2^\alpha$, where $\alpha$ is the architectural LUT input count of the target ([[Lookup-Tables]]), giving $D_i=\lceil w_i/\alpha\rceil$ chunks $X_{ik}$ of $\alpha$ bits each. Substituting that decomposition into (12.47) and pushing $C_i$ through by distributivity of multiplication over addition yields a double sum:

$$R\approx\sum_{i=0}^{N-1}\sum_{k=0}^{D_i-1}2^{k\alpha+\ell_i}C_iX_{ik} \tag{12.48, p.\,412}$$

Each summand depends on exactly $\alpha$ bits of input, so it is a table addressed by $X_{ik}$; the alignment shift $2^{k\alpha+\ell_i}$ is *baked into the stored value*, not applied afterwards, so higher-$k$ tables hold more significant — not more numerous — bits. Nothing in that rewriting cares whether the two index ranges belong to one multiplier or to $N$ of them. The double sum is a flat multiset of $\sum_iD_i$ weighted words, and a flat multiset of weighted words is precisely a bit heap.

**One shared output LSB, because a table more accurate than its siblings is accurate in vain.** $C_iX_{ik}$ is real and has infinitely many bits, so each table must be rounded, and the only question is to what. Give the tables different LSBs and the finest of them contributes bits that the coarsest immediately swamps; the error of a sum is dominated by its worst term. So all $ND$ tables round to a common LSB $\ell_R-g$, $g$ **guard bits** below the output LSB:

$$R=\left\lfloor\sum_{i=0}^{N-1}\sum_{k=0}^{D_i-1}2^{k\alpha+\ell_i}T_{ik}\right\rceil_{\ell_R},\qquad T_{ik}(X_{ik})=\left\lfloor2^{k\alpha+\ell_i}C_iX_{ik}\right\rceil_{\ell_R-g} \tag{12.49–12.50, p.\,413}$$

Table $T_{ik}$ is then a word from MSB $m_{ik}$ down to $\ell_R-g$, i.e. $m_{ik}-\ell_R+g+1$ bits, and since its address is $\alpha$ bits wide each of those bits is one LUT (§12.2.1, p. 383). The bit heap is at most $ND$ high in any column — twelve in the figure — and its compression is [[Compressor Trees]]' problem, not this note's.

**The error budget is a sum of $ND$ half-ulps plus one, so $g$ is logarithmic in the operator's size.** Fixed-point addition of aligned words is exact, so the compressor tree introduces no error at all and the entire budget lives in the roundings. Each of the $ND$ tables contributes at most a half-ulp at its own LSB, and the final round contributes a half-ulp at $\ell_R$:

$$|\delta_{\text{round}}|<ND\times2^{\ell_R-g-1},\qquad|\delta_{\text{final}}|\le2^{\ell_R-1}$$

Faithful rounding requires $|\delta_{\text{total}}|<2^{\ell_R}=1\,\mathrm{ulp}$ ([[Error Accuracy]]), so summing the two and dividing through by $2^{\ell_R-1}$ leaves $1+ND\,2^{-g}<2$, that is $ND\,2^{-g}<1$:

$$g>\log_2(ND) \tag{12.51, p.\,413}$$

This is the same argument as the single-multiplier bound $g>\log_2D$ with $D$ replaced by $ND$ — the *only* thing fusion changes is the number of terms under the logarithm. Doubling the tap count buys back one guard bit. The final round to nearest is then free: add the constant $2^{\ell_R-1}$ into the contents of any one table offline and truncate, which is the box labelled "final round by truncation" in the diagram and costs nothing at all in hardware (p. 414).

> [!important]
> The saving is not the deleted adders, it is the deleted roundings. Take $R=C_1X+C_2Y$ with $D=3$ (p. 395). Naively: the final sum needs $g=2$, so each KCM must be last-bit accurate to $2^{\ell_R-2}$, so each computes internally that it needs $g_i=2$ more, so all six tables are built at LSB $\ell_R-4$. Fused, the bound gives $g>\log_2 6\approx2.58$, so $g=3$ and all six tables are built at $\ell_R-3$ — one bit narrower each, and two intermediate roundings that never happen.

**Per-constant analysis tightens the bound, and needs two passes because $g$ is not known yet.** The worst case above assumes every table actually rounds and that all the errors conspire. Many do not: $C_i=0$ and $C_i=\pm2^n$ with no bits shifted out are exact, and a $C_i$ that is an integer multiple of $2^{\ell_R-\ell_i}$ produces nothing below $2^{\ell_R}$ and so is exact too (p. 394). To let a constant report its error *before* $g$ exists, FloPoCo measures in **gulps** — units of $2^{\ell_R-g}$ — the general case costing $D/2$ gulps. Summing the per-constant bounds $\overline{\delta^{(\mathrm{gulp})}_{\text{round}}}$ gives

$$g>1+\log_2\overline{\delta^{(\mathrm{gulp})}_{\text{round}}} \tag{12.52, p.\,414}$$

so the generator runs in two passes: evaluate every constant's gulp count, sum, solve for $g$, then emit the hardware (p. 414–415). A table whose MSB lands below $\ell_R-g-1$ is dropped outright, and the analysis stays safe because the neglected table is charged the same half-ulp it would have cost by rounding (p. 394).

**This is why a KCM generator is written as a virtual operator.** If `FixRealKCM` compressed its own bit heap it could not be fused: the fusion consists exactly of *not* compressing. So the generator takes a bit heap as an argument, emits the table logic, adds the resulting bits to that heap, and returns without touching the compressor — leaving the enclosing operator (an SOPC, a complex constant multiplier, a [[Constant Matrix Multiplier]]) to compress everything once (p. 394). Global optimisation of one heap and global analysis of one error budget are the same refactoring seen from the hardware side and the numeric side. See [[Bit Heaps]] for the framework and [[FloPoCo]] for the generator.

**The gain is FPGA-shaped, and it stacks with the other FPGA-shaped one.** The whole construction is parameterised by $\alpha$, so on an ASIC there is no natural chunk width and the reason to tabulate at all is weaker ([[FPGAs]]). On an FPGA it composes with the orthogonal saving of [[Table-Based Multiple Constant Multiplication]]: table *contents* are quasi-periodic and repeat across constants, so LUTs can be shared between the $T_{ik}$ of different taps (§12.5.2, p. 407) while the fusion here shares the summation and the rounding. The two optimisations touch disjoint parts of the operator. The worked instance in panel (b) is a 4-tap half-sine FIR with $m_X=0$ and $\ell_X=\ell_R=-12$, so $w_X=13$ bits and $D=\lceil13/5\rceil=3$ chunks of $\alpha=5$; $ND=12$ and $\log_2 12\approx3.58$ give $g=4$, the four guard columns bracketed at the right of the heap (p. 413).

$$\boxed{\ R=\left\lfloor\sum_{i=0}^{N-1}\sum_{k=0}^{D_i-1}2^{k\alpha+\ell_i}\left\lfloor2^{k\alpha+\ell_i}C_iX_{ik}\right\rceil_{\ell_R-g}\right\rceil_{\ell_R}\ \text{is faithful iff}\ g>\log_2(ND)\ }$$

**When it breaks.**

- **Recursive filters.** An IIR SOPC feeds $R$ back into its own summation, and the resulting infinite recursion needs an error analysis this construction does not provide — the bound above is finite-sum-only. See [[LTI Filters]].
- **The bound is worst-case.** It charges a half-ulp to every table including the exact ones, and assumes the $ND$ errors align. Eq. 12.52 is the tighter statement; for a coefficient set full of zeros and powers of two the difference is a whole guard bit.
- **The heap, not the tables, eventually dominates.** Table cost grows as $ND$ words and so does heap height, but compressor-tree cost grows faster than linearly in height. Past some $N$ the interesting optimisation moves entirely into [[Compressor Trees]] and the guard-bit accounting stops mattering.
- **Fusion destroys modularity.** $g$ depends on every coefficient, so changing one tap re-derives $g$ and regenerates all $ND$ tables. A composition of independent [[Fix-by-Real KCM]] instances is worse arithmetic and better engineering; this is the trade.
- **Coefficient freedom is not exploited.** A filter is usually specified by a frequency response, which leaves latitude in choosing the $C_i$ themselves — latitude that could be spent making tables exact. That optimisation is out of scope here (p. 414).

> [!warning] Not covered in the source — needs outside research
> §12.5.5 gives no LUT count, delay figure or synthesis result for the fused operator against the naive composition. The one-bit-per-table narrowing is stated qualitatively (p. 395); the actual area saving, and the $N$ at which compressor-tree growth cancels it, are not measured anywhere in the chapter.

```spade
// N=2, D=2, alpha=4, l_X = l_R = -8, C_0 = pi/4, C_1 = ln 2.
// ND = 4, so g > log2(4) = 2; take g = 3, table LSB l_R - g = -11.
// T_ik(X_ik) = round(2^(4k-8) * C_i * X_ik) at LSB -11 = round(C_i * X_ik * 2^(4k+3)).
// The half-ulp 2^(l_R-1) = 4 gulps of the final round-to-nearest is folded into
// t_c0_0, so the final rounding is a bare truncation.
fn t_c0_0(x: uint<4>) -> uint<7> {
    match x { 0 => 4,  1 => 10, 2 => 17, 3 => 23, 4 => 29, 5 => 35, 6 => 42, 7 => 48,
              8 => 54, 9 => 61, 10 => 67, 11 => 73, 12 => 79, 13 => 86, 14 => 92, _ => 98 }
}
fn t_c0_1(x: uint<4>) -> uint<11> {
    match x { 0 => 0,   1 => 101,  2 => 201,  3 => 302,  4 => 402,  5 => 503,  6 => 603,
              7 => 704, 8 => 804,  9 => 905, 10 => 1005, 11 => 1106, 12 => 1206,
              13 => 1307, 14 => 1407, _ => 1508 }
}
fn t_c1_0(x: uint<4>) -> uint<7> {
    match x { 0 => 0,  1 => 6,  2 => 11, 3 => 17, 4 => 22, 5 => 28, 6 => 33, 7 => 39,
              8 => 44, 9 => 50, 10 => 55, 11 => 61, 12 => 67, 13 => 72, 14 => 78, _ => 83 }
}
fn t_c1_1(x: uint<4>) -> uint<11> {
    match x { 0 => 0,   1 => 89,  2 => 177, 3 => 266, 4 => 355, 5 => 444, 6 => 532,
              7 => 621, 8 => 710, 9 => 799, 10 => 887, 11 => 976, 12 => 1065,
              13 => 1153, 14 => 1242, _ => 1331 }
}

entity fix_sopc2(x: uint<8>, y: uint<8>) -> uint<9> {
    let xb = x.as_bits();
    let yb = y.as_bits();
    let a: uint<12> = zext(t_c0_0(xb[0..4].as_uint()));
    let b: uint<12> = zext(t_c0_1(xb[4..8].as_uint()));
    let c: uint<12> = zext(t_c1_0(yb[0..4].as_uint()));
    let d: uint<12> = zext(t_c1_1(yb[4..8].as_uint()));
    let s = a +. b +. c +. d;
    trunc(s >> 3)
}
```

The four `match` tables are the four boxes $T_{ik}$; `xb[0..4]` and `xb[4..8]` are the chunk taps off the input bus at the top of panel (a), index 0 being the LSB. The four `let`s zero-extended to `uint<12>` *are* the bit heap: every one is already aligned to the common LSB $\ell_R-g=-11$, because the shift $2^{k\alpha+\ell_i}$ lives in the table contents, so the summation is a plain add with no shifter anywhere. `+.` rather than `+` because chained `+` widens on every step and would not typecheck; 12 bits is the exact width of the maximum heap total $98+1508+83+1331=3020$. `s >> 3` discards the three guard bits and `trunc` takes the 9-bit result — that shift is the entire "final round by truncation" box, and it is to *nearest* only because the half-ulp is already inside `t_c0_0`. Combinational throughout, no clock. Synthesis will not build this as four LUT arrays plus a 4-input adder: the mapper sees eight 4-input cones and hands the summation to a carry chain, whereas the drawing hands it to a compressor tree — on an FPGA those are genuinely different circuits and the carry chain usually wins at this height.

## Related Notes

- [[Fix-by-Real KCM]] – extends: the single-multiplier operator whose bound $g>\log_2 D$ this generalises to $g>\log_2(ND)$, and the instance whose intermediate rounding fusion deletes.
- [[Bit Heaps]] – depends-on: the double sum is a flat multiset of weighted bits, which is the only reason the two summations can be merged at all.
- [[Compressor Trees]] – depends-on: compresses the fused heap; its cost grows with heap height $ND$ and eventually dominates the tables.
- [[Sum of Constant Products]] – compares: the same $R=\sum C_iX_i$ operator built from shift-and-add graphs by transposing MCM, exact rather than faithful.
- [[Table-Based Multiple Constant Multiplication]] – supports: orthogonal FPGA saving on the same tables, sharing LUT contents across taps while this note shares the summation.
- [[Constant Matrix Multiplier]] – extends: several outputs, each its own fused heap, and the same virtual-operator argument for not compressing early.
- [[Tabulated Perfectly Rounded Constant Multiplier]] – counter-example: one rounding of half an ulp is the accuracy ceiling this operator approaches from above by spending guard bits.
- [[LTI Filters]] – depends-on: the consumer, and the place where the recursive case and the coefficient-choice freedom are actually handled.
- [[Choosing a Constant Multiplier]] – compares: where this sits once $N$, the word sizes and the target are fixed.
- [[FloPoCo]] – supports: `FixRealSOPC`, the two-pass generator that evaluates every constant's gulp count before choosing $g$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §12.5.5 "Table-Based Sum of Products of Fixed-Point Inputs by Real Constants", pp. 412-414 — eqs. 12.47-12.52, Fig. 12.24 (the $N=4$, $D=3$ architecture) and Fig. 12.25 (its bit heap, half-sine FIR, $g=4$), the free half-ulp, and the "Filters and SOPC" box deferring recursive filters to Chap. 23.
  - §12.3.3.3 and the "Bit Heaps and Virtual KCM Operators" box, pp. 394-395 — the per-constant gulp analysis, the dropped-table rule, and the $R=C_1X+C_2Y$ comparison of naive composition against fusion.
  - §12.2.1-12.2.2, pp. 383-385 — one LUT per output bit for an $\alpha$-bit address, and the chunk decomposition the tables inherit.
  - §12.5.2 "Table-Based MCM", pp. 407-408 — the orthogonal saving from shared table contents.
