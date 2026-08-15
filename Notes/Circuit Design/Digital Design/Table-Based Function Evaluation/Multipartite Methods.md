---
title: Multipartite Methods
description: "Splits the offset table into m tables, each with its own coarser slope index gamma_i, trading m-1 extra additions for an order-of-magnitude smaller table; bipartite is the m=1 case."
kind: circuit
source: "ASA §17.2.4–17.2.6 and §17.2.12, pp. 508–517, 523"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, function-evaluation, rom, multipartite, fpga]
aliases:
  - Multipartite Method
  - Multipartite Tables
  - Multipartite Table Method
  - Generalised Multipartite
  - Generalized Multipartite
---

# Multipartite Methods

A multiplier-free evaluator for $f$ that reads one table of initial values plus $m$ tables of offsets and adds them, where each offset table is allowed its **own** slope resolution $\gamma_i$ — the freedom that separates it from the bipartite ($m=1$) and Schulte–Stine (all $\gamma_i$ equal) special cases.

```tikz title="Generalised multipartite architecture: a 16-bit input word split into A and B_2 B_1 B_0, with nested prefixes C_2 C_1 C_0 of A addressing three offset tables alongside the TIV, all summed and truncated"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- input word: 16 cells of 0.6 ----
\draw[thick] (0,5.0) rectangle (9.6,5.6);
\foreach \i in {1,...,15} \draw[gray!50] (0.6*\i,5.0) -- (0.6*\i,5.6);
\foreach \x in {4.8,6.0,7.8} \draw[very thick] (\x,5.0) -- (\x,5.6);
\node[font=\small,anchor=east] at (-0.15,5.3) {$X=$};
\node[font=\tiny] at (2.4,5.82) {$A$ ($\alpha=8$)};
\foreach \x/\lab/\bet/\pp in {5.4/2/2/6, 6.9/1/3/3, 8.7/0/3/0}{
  \node[font=\tiny] at (\x,5.82) {$B_{\lab}$};
  \node[font=\tiny] at (\x,6.14) {$\beta_{\lab}{=}\bet$};
  \node[font=\tiny] at (\x,6.46) {$p_{\lab}{=}\pp$};
}
% ---- nested prefixes of A ----
\draw[gray,densely dotted,thick] (0,4.15) -- (4.2,4.15);
\draw[gray,densely dotted,thick] (0,4.45) -- (3.6,4.45);
\draw[gray,densely dotted,thick] (0,4.75) -- (2.4,4.75);
\node[font=\tiny,anchor=east] at (-0.15,4.15) {$C_2$ ($\gamma_2{=}7$)};
\node[font=\tiny,anchor=east] at (-0.15,4.45) {$C_1$ ($\gamma_1{=}6$)};
\node[font=\tiny,anchor=east] at (-0.15,4.75) {$C_0$ ($\gamma_0{=}4$)};
% ---- routing: C_i down into its TO_i ----
\draw[->] (4.2,4.15) -- (4.2,3.1);
\draw[->] (3.6,4.45) -- (7.6,4.45) -- (7.6,3.1);
\draw[->] (2.4,4.75) -- (9.8,4.75) -- (9.8,3.1);
% ---- routing: A and B_i straight down ----
\draw[->] (1.5,5.0) -- node[left,font=\tiny,pos=0.8]{$\alpha=8$} (1.5,3.1);
\foreach \x in {5.4,6.9,8.7} \draw[->] (\x,5.0) -- (\x,3.1);
% ---- the m+1 tables ----
\node[draw,thick,minimum width=2.5cm,minimum height=1.2cm,align=center] at (1.5,2.5)
  {TIV\\[-3pt]{\tiny $2^{\alpha}=2^{8}$ entries}\\[-4pt]{\tiny $w_R+g$ bits wide}};
\node[draw,thick,minimum width=2.5cm,minimum height=1.2cm,align=center] at (4.4,2.5)
  {$\mathrm{TO}_2$\\[-3pt]{\tiny $2^{\gamma_2+\beta_2}=2^{9}$}\\[-4pt]{\tiny $m_2-\ell_R+g+1$ b}};
\node[draw,thick,minimum width=2.5cm,minimum height=1.2cm,align=center] at (7.1,2.5)
  {$\mathrm{TO}_1$\\[-3pt]{\tiny $2^{\gamma_1+\beta_1}=2^{9}$}\\[-4pt]{\tiny $m_1-\ell_R+g+1$ b}};
\node[draw,thick,minimum width=2.5cm,minimum height=1.2cm,align=center] at (9.8,2.5)
  {$\mathrm{TO}_0$\\[-3pt]{\tiny $2^{\gamma_0+\beta_0}=2^{7}$}\\[-4pt]{\tiny $m_0-\ell_R+g+1$ b}};
% ---- adder ----
\node[draw,thick,minimum width=10.8cm,minimum height=0.6cm] at (5.65,1.0) {$+$};
\foreach \x in {1.5,4.4,7.1,9.8} \draw[->] (\x,1.9) -- (\x,1.3);
\draw[->] (5.65,0.7) -- node[right,font=\tiny]{$S(X)$ at $(m_R,\,\ell_R-g)$} (5.65,0.05);
\node[draw,thick,minimum width=2.6cm,minimum height=0.55cm,font=\small] at (5.65,-0.3) {truncate $g$ LSBs};
\draw[->] (5.65,-0.6) -- node[right,font=\tiny]{$R(X)$, $w_R$ bits} (5.65,-1.25);
\node[font=\tiny,anchor=north,align=center] at (5.65,-1.5)
  {$m-1=2$ extra additions buy $m$ small tables in place of one of $2^{\gamma+\beta}$ entries\\[-2pt]
   $\gamma_2>\gamma_1>\gamma_0$: the low-order $\mathrm{TO}_i$ get a rougher slope because they contribute less};
\end{circuitikz}
\end{document}
```

*after Fig. 17.9, p. 508 and Fig. 17.11, p. 511*

**Start from the one property the offset table has that the initial-value table does not: linearity.** The bipartite architecture ([[Bipartite Table Method]]) splits the $w_X$-bit input $X$ into an $\alpha$-bit head $A$ and a $\beta$-bit tail $B$, $\alpha+\beta=w_X$, reads $\mathrm{TIV}(A)\approx f(A)$ from a table of $2^\alpha$ entries and $\mathrm{TO}(C,B)\approx s(C)\times B$ from a table of $2^{\gamma+\beta}$ entries, where $C$ is the $\gamma$-bit prefix of $A$. The TIV is an arbitrary sampled function and nothing can be done to it structurally, but the TO is *linear in its second argument by construction*. Split $B$ itself into $m$ sub-words,

$$B=B_0+2^{\beta_0}B_1+\dots+2^{\beta_0+\dots+\beta_{m-2}}B_{m-1},\qquad p_0=0,\ \ p_{i+1}=p_i+\beta_i$$

with $B_i$ on $\beta_i$ bits and $\sum_i\beta_i=\beta$, and **by distributivity of the linear map $s(C)\times{\cdot}$ over that sum**,

$$\mathrm{TO}(C,B)=s(C)\times\sum_{i=0}^{m-1}2^{p_i}B_i=\sum_{i=0}^{m-1}\underbrace{s(C)\times 2^{p_i}B_i}_{\mathrm{TO}_i(C,B_i)}$$

One table of $2^{\gamma+\beta}$ entries becomes $m$ tables of $2^{\gamma+\beta_i}$ entries. Since $\sum_i 2^{\gamma+\beta_i}\ll 2^{\gamma+\sum_i\beta_i}$ for any non-trivial split, this is an exponential-to-linear trade, paid for with $m-1$ extra additions (Eq. (17.2), p. 509).

**The identity is exact, so the whole cost of splitting is discretization.** Nothing above is an approximation — it is one distributive rewrite. What changes is that $m$ tables now each round their contents independently, so $m$ table-filling errors sum where one stood before. That is the accuracy side of the trade-off, and it is answered by widening the tables with guard bits rather than by giving up the split.

**Spend the slack that the low-order tables have.** Comparing $\mathrm{TO}_i$ with $\mathrm{TO}_j$ for $j>i$, the two formulas differ only by the constant factor $2^{p_j-p_i}$: table $i$ contributes a quantity $2^{p_j-p_i}$ times smaller to the result, so its *absolute* accuracy requirement is $2^{p_j-p_i}$ times looser. Held to a common $\gamma$, the low-order tables are far more accurate than they need to be. Buy something with that: give each $\mathrm{TO}_i$ its **own** prefix $C_i$, the $\gamma_i$ most significant bits of $X$, and hence its own slope $s_i(C_i)$ sampled on a coarser grid of $2^{\gamma_i}$ intervals. A rougher slope for the tables that matter less is free accuracy converted into table area — Fig. 17.10, p. 509 draws exactly this for $m=2$, with the small green segments' worse slope producing an error $\delta_0$ still smaller than the large blue segment's $\delta_1$. Each $\mathrm{TO}_i$ then computes

$$\mathrm{TO}_i(C_i,B_i)\approx s_i(C_i)\times 2^{p_i}B_i$$

and is addressed by $\gamma_i+\beta_i$ bits — $C_i$ on $\gamma_i$ bits concatenated with $B_i$ on $\beta_i$ bits. **A decomposition is therefore a tuple, not a formula.**

$$\mathcal{D}=\{\alpha,\beta,m,(\gamma_i,p_i,\beta_i)_{i=0\dots m-1}\}$$

Bipartite is $m=1$; Schulte–Stine is all $\gamma_i$ equal; Muller's variant is all $\gamma_i$ multiples of one integer. de Dinechin and Tisserand's contribution is to observe that these are all points in one space and that **the optimum is usually none of them** (p. 510), which is why the method ships as an exhaustive enumeration of $\mathcal{D}$ rather than as closed-form parameter rules.

**Sizing the tables is then mechanical, once $g$ is known.** The guard-bit count $g$ comes out of the three-way split of the one-ulp budget (§17.2.5.3, Eq. (17.33), p. 516) and every table is filled to precision $\ell_R-g$. The TIV holds $2^\alpha$ entries of $w_R+g$ bits with $w_R=m_R-\ell_R+1$. For $\mathrm{TO}_i$ the entries are signed offsets whose magnitude is bounded by the range of the linear ramp it tabulates, $|s_i(C_i)\Delta_i|$ with $\Delta_i=2^{\ell_X+p_i}(2^{\beta_i}-1)$ the width of the sub-interval $B_i$ sweeps. By convexity of $f$ (assumed throughout, after range reduction) that range is maximal at one end of the $C_i$ axis, so only two evaluations are needed:

$$r_i=\max\!\left(|s_i(0)\,\Delta_i|,\ |s_i(2^{\gamma_i}-1)\,\Delta_i|\right),\qquad m_i=\lceil\log_2 r_i\rceil$$

giving $2^{\gamma_i+\beta_i}\,(m_i-\ell_R+g+1)$ bits per offset table (Eqs. (17.34)–(17.35), pp. 516–517). One bit of that is the sign; the [[Symmetric Table of Offsets|symmetry of each linear segment]] deletes both it and the top address bit, taking the table to $2^{\gamma_i+\beta_i-1}(m_i-\ell_R+g)$ — a 4× reduction for two rows of XOR gates, and it applies independently to every $\mathrm{TO}_i$.

**The $m+1$ operands are not $m$ adders.** Drawing a single `+` box hides where the latency goes: $m+1$ terms of at most $w_R+g$ bits are a [[Bit Heaps|bit heap]], summed by a [[Compressor Trees|compressor tree]] plus one final carry-propagate adder, so the delay grows as $\log m$ rather than $m$ and the "$m-1$ extra additions" cost is mostly area. On an FPGA the offsets are narrow enough that the tree is a few LUT levels; FloPoCo sweeps $m\in[1,7]$ because beyond that the tree costs more than the tables save.

**On FPGAs the bit count is the wrong cost function twice over.** A $2^k\times n$ table costs $2^{\max(k-\lambda,0)}\times n$ [[Lookup-Tables|LUTs]] on a $\lambda$-input device, so any $\mathrm{TO}_i$ with $\gamma_i+\beta_i\le\lambda$ occupies $n$ LUTs no matter how much smaller you make it — shrinking $\gamma_i$ past that point is free real estate the book's bit-count objective cannot see. In the other direction, once the plain table for $f$ fits in spare [[Block Memory|block RAM]] it costs *no* logic at all, and multipartite's advantage collapses into several small tables that no longer match BRAM granularity plus a compressor tree in fabric. On ASIC standard cells the cost model is symmetric in $k$ and $n$, so narrowing the TOs is worth roughly as much as shortening them; on FPGA it is worth much more.

**Why this is close to the best an order-one method can do.** Every linear scheme addressing a TIV with $\alpha$ bits inherits the bound $\alpha\gtrsim w_X/2$, which comes from forcing the Lagrange remainder $\tfrac12(2^{-\alpha}B)^2f''(\xi)$ of the first-order Taylor expansion under half an ulp — a property of Taylor's theorem, not of any architecture, computable exactly per function. Empirically the best decomposition almost always sits at the *smallest* $\alpha$ that still permits faithful rounding, and the TIV, being $2^\alpha(w_R+g)$ bits, is always the dominant term. Put together: multipartite lands near the global optimum of the whole order-one family. The sharpest statement of it is that a **free, perfect multiplier** — which would let you tabulate $f$ and $f'$ and multiply, deleting every $\mathrm{TO}_i$ — removes less than half the total size (p. 523). To do materially better you must change the order, and order two moves the bound to $\alpha\gtrsim w_X/3$: that is [[Polynomial Approximation]].

$$\boxed{\ f(X)\approx\mathrm{TIV}(A)+\sum_{i=0}^{m-1}\mathrm{TO}_i(C_i,B_i),\qquad \mathrm{TO}_i(C_i,B_i)\approx s_i(C_i)\times 2^{p_i}B_i\ }$$

## When it breaks

- **$f''$ unbounded.** The whole construction rests on the Lagrange remainder and on the mean value theorem applied to $f'$. $\sqrt{x}$ on $[0,1)$ has a vertical tangent at $0$, so $\max|f'|$ and $\max|f''|$ are both infinite and no decomposition is faithful. The fix is function-specific range reduction — evaluate $2(\sqrt{1+x}-1)$ on $[0,1)$ instead (Fig. 17.3, p. 503). Multipartite was invented for reciprocal and reciprocal square root, so this is the normal way to use it, not a caveat.
- **$w_X\gtrsim24$.** The TIV is $2^\alpha(w_R+g)$ with $\alpha\gtrsim w_X/2$, exponential again. No choice of $m$ touches that term; move to [[Polynomial Approximation]].
- **$w_X\lesssim10$, or a spare BRAM.** Below that the plain ROM is one cycle, correctly rounded and monotonic for free. Computed here for $f=\sin(\pi x/4)$ at $w_X=w_R=8$, faithful, no symmetry: $m=1$ needs 416 bits, $m=2$ needs 352, $m=3$ needs 360 — the best $m$ is small and the margin over bipartite is 15%, against a factor 70 at 16 bits (p. 520). The exponential has to be big before splitting it pays.
- **Large $m$.** Each extra table adds a term to $\overline{\delta_{\text{tables}}}$, which pushes $g$ up, which widens *every* table including the dominant TIV. There is an $m$ past which splitting costs more than it saves; FloPoCo never looks beyond 7.
- **Monotonicity.** The balanced-error slope that makes the tables small puts the error extremum exactly at a segment boundary, so a monotonic $f$ routinely comes out non-monotonic — see [[Monotonic Multipartite Tables]].

## RTL (Spade)

A concrete $m=2$ instance, $f(x)=\sin(\pi x/4)$ on $[0,1)$, $w_X=w_R=8$, $\ell_X=\ell_R=-8$, $m_R=-1$. The decomposition is $\mathcal{D}=\{\alpha=4,\ \beta=4,\ m=2,\ (\gamma_0{=}1,p_0{=}0,\beta_0{=}2),\ (\gamma_1{=}2,p_1{=}2,\beta_1{=}2)\}$ with $g=3$, so $\gamma_1>\gamma_0$ as the theory predicts: the more significant offset table gets the finer slope.

```spade
/// Generalised multipartite, m = 2, for f(x) = sin(pi*x/4) on [0,1)
/// D = { alpha=4, beta=4, m=2, (g0=1,p0=0,b0=2), (g1=2,p1=2,b1=2) }, g = 3
fn multipartite_sin8(x: uint<8>) -> uint<8> {
    let tiv: [uint<11>; 16] = [51, 151, 252, 351, 450, 547, 643, 738,
                               831, 922, 1010, 1097, 1180, 1261, 1339, 1414];
    let to0: [int<6>; 8]    = [-9, -3, 3, 9, -8, -3, 3, 8];
    let to1: [int<8>; 16]   = [-37, -12, 12, 37, -36, -12, 12, 36,
                               -33, -11, 11, 33, -29, -10, 10, 29];

    let w = x.as_bits();
    let a  = w[4..8].as_uint();   // A,   alpha = 4 : TIV address
    let b0 = w[0..2].as_uint();   // B_0, beta_0 = 2
    let b1 = w[2..4].as_uint();   // B_1, beta_1 = 2
    let c0 = w[7..8].as_uint();   // C_0, gamma_0 = 1
    let c1 = w[6..8].as_uint();   // C_1, gamma_1 = 2

    let e0: int<11> = sext(to0[c0.concat(b0)]);
    let e1: int<11> = sext(to1[c1.concat(b1)]);
    let s: uint<11> = tiv[a] +. e0.as_uint() +. e1.as_uint();
    s.as_bits()[3..11].as_uint()
}
```

`tiv`, `to0`, `to1` are the three boxes of the diagram; `c0.concat(b0)` and `c1.concat(b1)` are the $\gamma_i+\beta_i$-bit address wires, prefix high. Widths follow the sizing rules exactly: $w_R+g=11$ for the TIV, $m_0-\ell_R+g+1=6$ and $m_1-\ell_R+g+1=8$ signed for the offsets, sign-extended to 11 before the sum. `+.` is the wrapping add — the sum cannot overflow $w_R+g$ bits by construction, so the natural $N{+}1$ growth would be dead silicon — and `s.as_bits()[3..11]` is the final truncation of the $g=3$ guard bits, free because $2^{\ell_R-1}$ was pre-added into every TIV entry at fill time. The block is purely combinational; synthesis will not build three separate ROMs and an adder but flatten the whole thing into a LUT cone, which is why the measured LUT count always beats the bit-count estimate.

Exhaustively checked over all $2^8$ inputs plus a 3000-vector random sweep against a `$sin` behavioural reference: maximum error **0.779 ulp**, faithful everywhere. Table cost is $16\times11+8\times6+16\times8=352$ bits against $2^8\times8=2048$ for a plain ROM, a factor 5.8 — and 352 against 416 for the same function at $m=1$, which is the whole point of the extra addition.

## Related Notes

- [[Bipartite Table Method]] – extends: this is the $m=1$ case, with the single $\gamma$ and the single TO.
- [[Symmetric Table of Offsets]] – supports: halves each $\mathrm{TO}_i$ independently, one input bit and one output bit for two XOR rows.
- [[Multipartite with Compressed TIV]] – extends: attacks the $2^\alpha(w_R+g)$ term that dominates every decomposition here, losslessly.
- [[HUB Table Filling]] – supports: the fill rule that makes the final truncation free and the symmetry a pure complement.
- [[Monotonic Multipartite Tables]] – counter-example: the balanced slope that minimises table size is exactly what breaks monotonicity.
- [[ILP-Optimized Multipartite Tables]] – extends: replaces the separately-bounded error analysis with per-entry constraints, reaching correct rounding.
- [[Compressor Trees]] – depends-on: the $m+1$ table outputs are summed as a [[Bit Heaps|bit heap]], not by a chain of adders.
- [[Choosing a Table Method]] – compares: where this sits against a plain ROM, LDTC and ATA.
- [[Polynomial Approximation]] – counter-example: order two relaxes $\alpha\gtrsim w_X/2$ to $\alpha\gtrsim w_X/3$, which is the only way past the TIV wall.
- [[Lookup-Tables]] – depends-on: the LUT cost model that makes a table below $2^\lambda$ entries free.
- [[Block Memory]] – counter-example: above the BRAM crossover the plain table costs no logic and multipartite's advantage collapses.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17 "Function Evaluation Using Tables and Additions".

- Sect. 17.2.1 applicability and range reduction, Fig. 17.3, p. 503
- Sect. 17.2.4 "From Bipartite to Multipartite: Splitting the TO", Eqs. (17.1)–(17.3), Figs. 17.9–17.11, pp. 508–511 — the split of $B$, the two trade-offs, the per-table $\gamma_i$, and the parametric architecture
- Sect. 17.2.6 "Computing the Sizes of the $\mathrm{TO}_i$", Eqs. (17.34)–(17.35), pp. 516–517, including the symmetric size on p. 517
- Sect. 17.2.9, p. 520 — the 16-bit $\sin$ run, $m=3$, 14 784 bits against 1 048 576
- Sect. 17.2.12 "Multipartite Architectures Are Close to Optimal Among Order-One Methods", p. 523
- Sect. 16.4.2 "Actual Cost of a ROM", Eq. (16.1), pp. 491–492 — the ASIC/LUT/BRAM cost models

Cited works: [SS99b] (Schulte–Stine, multiple TOs), [Mul99] (Muller, $\gamma_i$ multiples of an integer), [DT05] (de Dinechin–Tisserand, generalised multipartite), [DM95] (Das Sarma–Matula, bipartite reciprocal).

The 8-bit $m\in\{1,2,3\}$ table-size figures and the 0.779 ulp bound are computed here and verified exhaustively over all $2^8$ inputs, not taken from the book.
