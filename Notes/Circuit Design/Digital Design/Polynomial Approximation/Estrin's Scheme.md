---
title: "Estrin's Scheme"
description: "Recursive odd/even split p(x)=p_e(x^2)+x*p_o(x^2): halves Horner's latency at the cost of precomputing x^2 and a little accuracy."
kind: circuit
source: "ASA §18.3.3, pp. 561-562; §18.3.2, pp. 558-561"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, evaluation, latency, tree]
aliases:
  - Estrin
  - Estrin Scheme
  - Estrin's Method
  - Estrin Evaluation
  - Odd/Even Split
  - Odd-Even Polynomial Split
---

# Estrin's Scheme

Evaluate $p$ by recursively splitting it on the parity of the exponent, turning Horner's chain of $d$ multiply-adds into a balanced binary tree of depth $\lceil\log_2(d+1)\rceil$ — the only member of the parallel-evaluation family that keeps the multiply-add as its atom and the coefficients untouched.

```tikz title="Estrin's binary evaluation tree for a degree-7 polynomial, with the squaring chain that feeds it"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  blk/.style={draw,thick,rounded corners=1pt,minimum width=2.3cm,minimum height=0.62cm,font=\small,fill=blue!5},
  sq/.style={draw,thick,minimum width=1.05cm,minimum height=0.62cm,font=\small,fill=orange!15},
  w/.style={font=\tiny,inner sep=1.4pt},
  ar/.style={-latex,thick},
  pw/.style={-latex,thick,orange!75!black}]
\footnotesize
% ---------------- Y distribution rail ----------------
\node[anchor=east,font=\small] at (-3.55,6.05) {$Y$};
\draw[thick] (-3.4,6.05) -- (9.4,6.05);
\foreach \cx in {0.4,3.4,6.4,9.4}{ \draw[ar] (\cx,6.05) -- (\cx,5.32); }
\draw[pw] (-2.95,6.05) -- (-2.95,5.32);
\node[w,anchor=south] at (-1.7,6.09) {$w$ bits, $|Y|<1$};
% ---------------- coefficient stubs -------------------
\foreach \cx/\la/\lb in {0.4/{C_0}/{C_1}, 3.4/{C_2}/{C_3}, 6.4/{C_4}/{C_5}, 9.4/{C_6}/{C_7}}{
  \draw[ar] (\cx-0.75,6.60) -- (\cx-0.75,5.32);
  \draw[ar] (\cx+0.75,6.60) -- (\cx+0.75,5.32);
  \node[w,anchor=south] at (\cx-0.75,6.63) {$\la$};
  \node[w,anchor=south] at (\cx+0.75,6.63) {$\lb$};}
% ---------------- level 1: four leaf multiply-adds ----
\foreach \cx/\lab in {0.4/{C_0+C_1Y}, 3.4/{C_2+C_3Y}, 6.4/{C_4+C_5Y}, 9.4/{C_6+C_7Y}}{
  \node[blk] at (\cx,5.0) {$\lab$};}
\node[sq] at (-2.95,5.0) {$Y^{2}$};
% ---------------- leaf outputs, jogged into the subtrees
\foreach \cx/\tx/\nm in {0.4/1.1/{T_0}, 3.4/2.7/{T_1}, 6.4/7.1/{T_2}, 9.4/8.7/{T_3}}{
  \draw[thick] (\cx,4.69) -- (\cx,4.20) -- (\tx,4.20);
  \draw[ar] (\tx,4.20) -- (\tx,3.62);
  \node[w,anchor=south] at (\cx,4.24) {$\nm$, $2w$};}
% ---------------- Y^2 fan-out ------------------------
\draw[pw] (-2.95,4.69) -- (-2.95,3.80) -- (1.9,3.80) -- (1.9,3.62);
\draw[pw] (1.9,3.80) -- (7.9,3.80) -- (7.9,3.62);
\node[w,anchor=south,orange!75!black] at (-1.55,3.83) {$Y^{2}$, $2w$};
% ---------------- level 2: two degree-3 subtrees ------
\node[blk] at (1.9,3.3) {$T_0+Y^{2}T_1$};
\node[blk] at (7.9,3.3) {$T_2+Y^{2}T_3$};
\node[sq] at (-2.95,3.3) {$Y^{4}$};
\draw[pw] (-2.95,3.80) -- (-2.95,3.62);
% ---------------- subtree outputs, jogged into the root
\foreach \cx/\tx/\nm in {1.9/3.9/{U_0}, 7.9/5.9/{U_1}}{
  \draw[thick] (\cx,2.99) -- (\cx,2.50) -- (\tx,2.50);
  \draw[ar] (\tx,2.50) -- (\tx,1.92);
  \node[w,anchor=south] at (\cx,2.54) {$\nm$, $4w$};}
% ---------------- Y^4 fan-out ------------------------
\draw[pw] (-2.95,2.99) -- (-2.95,2.10) -- (4.9,2.10) -- (4.9,1.92);
\node[w,anchor=south,orange!75!black] at (-1.55,2.13) {$Y^{4}$, $4w$};
% ---------------- level 3: the root -------------------
\node[blk,minimum width=2.9cm] at (4.9,1.6) {$U_0+Y^{4}U_1$};
\draw[ar] (4.9,1.29) -- (4.9,0.66);
\node[w,anchor=west] at (4.98,0.98) {$8w$};
\node[anchor=north,font=\small] at (4.9,0.64) {$R=p(Y)$};
% ---------------- depth ruler -------------------------
\node[w,anchor=west,gray] at (11.0,5.0) {depth 1};
\node[w,anchor=west,gray] at (11.0,3.3) {depth 2};
\node[w,anchor=west,gray] at (11.0,1.6) {depth 3};
\node[font=\tiny,align=left,anchor=west] at (-4.4,0.90)
  {$d=7$: $\lceil\log_2(d{+}1)\rceil=3$ multiply-add levels\\[-1pt]
   against Horner's $7$. Each $Y^{2^k}$ (orange) is\\[-1pt]
   ready at exactly the level that consumes it.\\[-1pt]
   Widths are the exact ones; every one is truncated\\[-1pt]
   in a computing-just-right design.};
\end{circuitikz}
\end{document}
```

**Split the sum on the parity of the exponent.** Horner factors the developed form by pulling $Y$ out of every term above the constant; Estrin instead partitions the *index set*. Sorting the monomials by $i\bmod 2$ — a reordering of a finite sum, legal by commutativity and associativity of $+$ — and then factoring one $Y$ out of the odd part by distributivity gives

$$p(Y)=\sum_{i=0}^{d}C_iY^{i}=\underbrace{\sum_{j}C_{2j}\left(Y^{2}\right)^{j}}_{p_e(Y^{2})}\;+\;Y\underbrace{\sum_{j}C_{2j+1}\left(Y^{2}\right)^{j}}_{p_o(Y^{2})},$$

with $\deg p_e=\lfloor d/2\rfloor$ and $\deg p_o=\lfloor(d-1)/2\rfloor$. One squaring buys two sub-polynomials of half the degree that share no data and can be evaluated concurrently, so a single split already replaces a length-$d$ chain by two length-$d/2$ chains plus one combining multiply-add.

**Recurse, and the chain becomes a tree.** $p_e$ and $p_o$ are ordinary polynomials in the variable $u=Y^{2}$, so the same split applies to them, needing $u^{2}=Y^{4}$; applying it $k$ times leaves $2^{k}$ sub-polynomials of degree $\approx d/2^{k}$ in the variable $Y^{2^{k}}$. This recursive application of the odd/even split is Estrin's scheme (p. 562, citing [Mul16] §3.8.2). The recursion bottoms out at degree-1 leaves, which is the form drawn above: pair the coefficients into linear forms $T_j=C_{2j}+C_{2j+1}Y$ and combine them upward with $Y^{2},Y^{4},Y^{8},\dots$ For $d=7$,

$$p(Y)=\underbrace{\left(C_0+C_1Y\right)+Y^{2}\left(C_2+C_3Y\right)}_{U_0}\;+\;Y^{4}\left[\underbrace{\left(C_4+C_5Y\right)+Y^{2}\left(C_6+C_7Y\right)}_{U_1}\right].$$

> [!note] Only associativity was used, so the coefficients are the ones Remez gave you
> Every step above is a reassociation of the *same* sum of the *same* monomials — the $C_i$ are never recombined. In exact arithmetic Estrin and Horner return bit-identical results, and $\bar\delta_{\text{approx}}$ from [[Remez Minimax]] carries over untouched. That is what separates Estrin from the rest of the sub-$d$-multiplication refactoring family (p. 562, [Rev09] §5.2), which buys its speed by *changing* the coefficients and therefore injects a fresh error term, needs more accurate coefficients to start with, and has an unclear interaction with range reduction. [[SquareRich Evaluation]] is the one member of that family that survives contact with hardware.

**Count the depth, and notice the powers are free.** A tree over $d+1$ coefficients that consumes two operands per node has $\lceil\log_2(d+1)\rceil$ levels, each one multiply-add delay, against Horner's $d$. The squaring chain looks like it should be added to that, but it is not: $Y^{2^{k}}$ is the result of $k$ chained squarings and so is available after $k$ multiplier delays, while the tree level that consumes it is level $k+1$, which cannot start earlier than $k$ multiply-add delays in. **The powering chain is exactly as deep as the tree it feeds and therefore never lengthens the critical path** — it is drawn as the orange column above, running alongside rather than in front.

**Count the multipliers, and see what the latency cost.** For a full tree, $d=2^{k}-1$: the leaf level holds $2^{k-1}$ products $C_{2j+1}Y$, the next $2^{k-2}$ products $Y^{2}T_j$, and so on, summing to $2^{k}-1=d$ multiplications inside the tree — the same count as Horner, since both use $d$ multiplies and $d$ adds for the polynomial proper. The extra hardware is only the chain $Y^{2},Y^{4},\dots,Y^{2^{k-1}}$, which is $k-1$ squarings:

$$\#\times\;=\;d+\lceil\log_2(d+1)\rceil-1,\qquad \#+\;=\;d,\qquad \text{depth}=\lceil\log_2(d+1)\rceil .$$

$\Theta(d)$ latency traded for $\Theta(\log d)$ extra operators, and those extra operators are *squarers*, roughly half the area of a multiplier of the same width ([[Squarers and Integer Powers]]). Compare the fully developed form, which needs all $d$ powers and $d$ full-width products to reach the same $O(\log d)$ depth ([[Parallel Polynomial Evaluator]]): Estrin is the cheapest point on that latency curve.

**Watch the widths double instead of creeping.** With $Y$ and every $C_i$ on $w$ bits, the exact widths are $|T_j|\le 2^{2w}$, $|U_j|\le 2^{4w}$, $|R|\le 2^{8w}$ — one doubling per tree level, versus Horner where the accumulator grows by only $w$ bits per stage and one multiplier operand is *always* the $w$-bit $Y$. Left exact this is ruinous, but it is not what a computing-just-right design does. $|Y|\le1$ by normalization ([[Number Formats]]), so $|Y^{2^{k}}|\le1$ and $|U_j|$ is bounded by the largest coefficient inside its subtree; after a range reduction of parameter $\alpha$ the coefficients decay by about $\alpha$ bits per degree, so a subtree rooted at index $i$ carries a value of magnitude $\approx|C_i|$ and both operands of the multiplier above it can be truncated to about the width of $C_i$. This is the first of the three hardware observations the book makes about parallel evaluation (p. 559) — *the powers are cheap exactly where they are used most* — and it applies verbatim to Estrin's tree, because the tree's subtree values are the same partial sums.

**Pay for the powers in accuracy.** Horner's error obeys a recurrence, $\delta_{\text{eval},i}=\delta_{\text{multadd},i}+\delta_{Y,i}\widetilde S_{i+1}+Y\delta_{\text{eval},i+1}$, which does not amplify because $|Y|\le1$ ([[Horner Evaluation]]). Estrin has no recurrence at all — the book notes that this makes the parallel error analysis *simpler* than Horner's (p. 561) — but it introduces rounding points Horner does not have. Each squaring is one: writing $\widetilde{Y^{2^{k+1}}}=\left[\widetilde{Y^{2^{k}}}\times\widetilde{Y^{2^{k}}}\right]_{\ell}$ and expanding,

$$\widetilde{Y^{2^{k+1}}}-Y^{2^{k+1}}=2\,Y^{2^{k}}\delta_{2^{k}}+\delta_{2^{k}}^{2}+\delta_{\text{sq}},\qquad\text{so}\qquad \bar\delta_{2^{k+1}}\le 2\bar\delta_{2^{k}}+2^{\ell}$$

to first order, since $|Y^{2^k}|\le1$. Unrolling from $\bar\delta_{2}=2^{\ell}$ gives $\bar\delta_{2^{k}}\le(2^{k}-1)2^{\ell}$: **at most one bit lost per level of the squaring chain**, so $\lceil\log_2 d\rceil-1$ bits in the worst case, each then attenuated by the small subtree value it multiplies. That is the "slightly degraded accuracy" of p. 562 — real, bounded, and cheap to buy back with one more bit in the squarers.

**On FPGAs the trade can reverse.** Horner's chain is a chain of multiply-accumulates, which is precisely the shape DSP slices are cascaded for: the dedicated accumulator route between vertically adjacent DSP blocks carries the partial sum with no general routing and no extra logic, so a Horner evaluator's "long" chain is largely hardened silicon ([[FPGAs]]). Estrin's tree cannot use that path — its operands arrive from siblings, not from the block below — so every tree edge is general interconnect, and it also cannot reuse a DSP's built-in post-adder for the leaf multiply-adds without the same routing. The asymptotics still favour the tree, but the crossover degree moves up, in the same way the [[Adders]] asymptotics reverse once a carry chain is hardened.

$$\boxed{\ p(Y)=p_e(Y^{2})+Y\,p_o(Y^{2})\ \xrightarrow{\ \text{recurse}\ }\ \text{depth}=\lceil\log_2(d+1)\rceil,\quad \#\times=d+\lceil\log_2(d+1)\rceil-1\ }$$

**When it breaks.**

- **Below degree 4 there is nothing to win.** $\lceil\log_2(d+1)\rceil$ equals $d$ for $d\le2$ and is $2$ against $3$ for $d=3$ — one multiply-add level saved, paid for with a squarer that is on the critical path anyway at that size. The recursion is only genuinely recursive from $d=4$ up.
- **Hardware never gets to degree 4.** The coefficient table is $\Theta\!\left(2^{w_R/(d+1)}\right)$, so the first multiplier is worth a large factor and the third almost nothing ([[Remez Minimax]]); every published evaluator sits at degree 2 or 3 (p. 560). The book states outright that Estrin "is useful only for large degrees, which probably explains why it has not been used in hardware to the authors' knowledge" (p. 562).
- **It forfeits the single bit heap.** The strongest argument for parallel evaluation is that *all* the additions merge into one compressor tree, the whole evaluator becoming a single bit heap fed with the bit-level expansion of $C_iY^{i}=\left(\sum_j2^{j}c_{i,j}\right)\left(\sum_k2^{k}y_k\right)^{i}$, with everything below $2^{\ell_R}$ discarded (p. 559, [[Sums of Weighted Bits]]). Estrin cannot: each $U_j$ is a multiplier *operand* at the level above, and a multiplier needs a resolved binary number, not a heap. Keeping the multiply-add as the atom is what makes Estrin cheap in operator count and what stops it from being cheap in the way [[Parallel Polynomial Evaluator]] is.
- **Pipelining erases the benefit.** A function evaluator that produces one result per cycle has its depth amortised into pipeline stages, at which point only area and register count matter — and Horner wins both. Estrin pays off only when latency is the constraint: a feedback loop around the evaluator, or a low-rate design that cannot afford the registers.
- **The squarings must actually be squarers.** Synthesised as general multipliers with tied inputs, the $k-1$ extra operators cost full multiplier area and the "$\Theta(\log d)$ cheap extras" accounting stops holding.

> [!warning] No hardware error budget and no FPGA data for Estrin — needs outside research
> The book leaves the parallel evaluator's error analysis "as an exercise for the reader" because it is architecture-dependent (p. 561), and it never sizes an Estrin tree at all — no $\ell$ per level, no truncation algorithm to match Horner's Algorithm 18.2, no synthesis results, and no FPGA mapping. The per-level bound derived above is mine, not the book's, and the DSP-cascade argument is general FPGA canon rather than anything measured here.

**RTL (Spade).**

```spade
entity estrin8(x: uint<8>,
               c0: uint<8>, c1: uint<8>, c2: uint<8>, c3: uint<8>,
               c4: uint<8>, c5: uint<8>, c6: uint<8>, c7: uint<8>) -> uint<64> {
    // level 0: four leaf multiply-adds and the first squaring, all concurrent
    let t0: uint<16> = trunc(zext::<8, 16>(c0) + c1 * x);
    let t1: uint<16> = trunc(zext::<8, 16>(c2) + c3 * x);
    let t2: uint<16> = trunc(zext::<8, 16>(c4) + c5 * x);
    let t3: uint<16> = trunc(zext::<8, 16>(c6) + c7 * x);
    let q:  uint<16> = x * x;
    // level 1: two degree-3 subtrees, plus the second squaring
    let u0: uint<32> = trunc(zext::<16, 32>(t0) + q * t1);
    let u1: uint<32> = trunc(zext::<16, 32>(t2) + q * t3);
    let r:  uint<32> = q * q;
    // level 2: the root
    trunc(zext::<32, 64>(u0) + r * u1)
}
```

`t0`–`t3` are the four leaf boxes, `q` and `r` the orange $Y^{2}$ and $Y^{4}$, `u0`/`u1` the two degree-3 subtrees, and the tail expression the root — the diagram read top to bottom with $w=8$. Every `trunc` here discards *nothing*: $\sum_{i=0}^{7}255\cdot255^{i}=17\,948\,489\,581\,465\,697\,280<2^{64}$, and the same slack holds at each level, so the widths $16/32/64$ are the exact ones and the block is bit-exact against a real polynomial. The `trunc`s exist only because Spade's `+` returns $N{+}1$ bits and `*` returns $2N$; a computing-just-right instance replaces them with truncations to a per-level $\ell$ and needs the error analysis above. Purely combinational and unclocked — a real evaluator registers between the three levels, which is exactly when Horner catches back up. Synthesis will also not preserve the drawing's adders: each node's `+` becomes a carry-propagate adder because its result is a multiplier operand at the next level, and only the root is free to stay in carry-save until the final rounding.

**Related Notes**

- [[Horner Evaluation]] – compares: the chain this tree reassociates; identical coefficients and identical exact value, $\Theta(d)$ depth against $\Theta(\log d)$, and the per-stage truncation theory Estrin still lacks.
- [[Parallel Polynomial Evaluator]] – extends: takes the same idea to the fully developed form, where every product lands in one bit heap — the trick Estrin's resolved intermediate sums forfeit.
- [[Squarers and Integer Powers]] – depends-on: the $Y^{2^{k}}$ column is a chain of squarers, and the whole $\Theta(\log d)$ overhead argument rests on a squarer being cheaper than a multiplier.
- [[SquareRich Evaluation]] – compares: the other refactoring in §18.3.3, which does the opposite trade — it *changes* the coefficients to buy a squarer, so it pays an error term Estrin does not.
- [[Remez Minimax]] – depends-on: the degree-versus-table law that pins hardware at $d\le3$ and so denies Estrin the large degrees it needs.
- [[Choosing a Polynomial Evaluator]] – compares: where this sits against Horner and the bit-heap evaluator once latency, area and pipelining are all on the table.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18 "Polynomial-Based Architectures for Function Evaluation".

- §18.3.2 parallel evaluation, the three hardware observations, and the bit-heap formulation of $C_iY^{i}$, pp. 558-559
- Fig. 18.20, generic parallel evaluation architecture, p. 560
- Fig. 18.21, the three realisations of a $\left[C_ix^{i}\right]$ box, and the note that the parallel error analysis is left as an exercise, p. 561
- §18.3.3 the odd/even split, Estrin as its recursive application, and the coefficient-changing refactoring family, pp. 561-562

Cited works: [Mul16] §3.8.2 (Estrin), [Rev09] §5.2 (refactoring in a fixed-point software context), [XFM14] (SquareRich), [DD05] (HOTBM), [Che15].
