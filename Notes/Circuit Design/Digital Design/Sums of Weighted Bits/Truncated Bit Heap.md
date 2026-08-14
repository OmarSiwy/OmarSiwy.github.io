---
title: Truncated Bit Heap
description: "Two parameters (ℓ_ext, t) delete the cheapest bits from the right of an exact heap while staying faithful to 2^ℓ, and a correction constant C=2^(ℓ−1)−2^(ℓ_ext) recentres the one-signed error on zero, doubling how much you may drop; costs you a worst-case bound that can be pessimistic when the heap holds both x and x̄."
kind: circuit
source: "ASA §7.2.4, pp. 167-175"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, truncation, rounding, error]
aliases:
  - Truncated Bit Heaps
  - Bit Heap Truncation
  - Correction Constant
---

# Truncated Bit Heap

A bit heap whose low-order bits have been deleted before any hardware is built, chosen by two integers $(\ell_{\text{ext}}, t)$ and paid for with a constant that recentres the resulting error on zero — the one optimization that is stated on the heap itself and therefore applies to every operator and every target technology at once.

```tikz title="Truncated 6x6 unsigned heap: kept bits filled, deleted bits open, correction constant on top"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex]
  % ---- exact heap R* : columns -2 (left) .. -12 (right), heights 1..6..1
  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/5,5/6,6/5}
    \foreach \k in {1,...,\h} { \fill (\c*0.55,\k*0.3) circle (2.4pt); }
  \foreach \c/\h in {7/4,8/3,9/2,10/1}
    \foreach \k in {1,...,\h} { \draw[gray] (\c*0.55,\k*0.3) circle (2.4pt); }
  \node[anchor=east] at (-0.35,0.95) {$R^*$};

  % ---- constant row: round bit at -7, C = ones at -8 and -9
  \foreach \c in {5,6,7} { \draw (\c*0.55,2.25) circle (3.2pt) node {\tiny 1}; }
  \draw[->] (2.05,2.85) -- (2.65,2.42);
  \node[anchor=east] at (2.1,2.9) {\scriptsize round bit $2^{\ell-1}$};
  \draw (3.15,2.62) -- (3.15,2.78) -- (3.95,2.78) -- (3.95,2.62);
  \draw (3.55,2.78) -- (3.9,3.25);
  \node[anchor=west] at (3.85,3.35) {\scriptsize $C=2^{\ell-1}-2^{\ell_{\mathrm{ext}}}$};

  % ---- delta-minor triangle
  \node[anchor=south] at (5.3,1.0) {\scriptsize $\Delta^{\mathrm{minor}}(\ell_{\mathrm{ext}})$};
  \draw[gray,->] (5.3,0.95) -- (5.05,0.74);
  \node[anchor=west] at (4.65,2.3) {\scriptsize $t=4$ bits dropped};
  \draw[gray,->] (4.6,2.25) -- (3.95,1.35);

  % ---- column boundaries
  \draw[dashed] (2.475,-0.95) -- (2.475,2.55);
  \draw[dashed] (4.125,-0.95) -- (4.125,2.55);
  \node[anchor=north] at (2.475,-1.0) {$\ell=-6$};
  \node[anchor=north] at (4.125,-1.0) {$\ell_{\mathrm{ext}}=-9$};

  % ---- compressed heap and final result
  \draw (-0.45,-0.15) -- (6.0,-0.15);
  \foreach \c in {-1,0,1,2,3,4,5,6,7} { \fill (\c*0.55,-0.42) circle (2.4pt); }
  \node[anchor=east] at (-0.85,-0.42) {$\tilde R$ \scriptsize (9 bits, $-1..-9$)};
  \foreach \c in {-1,0,1,2,3,4} { \fill (\c*0.55,-0.8) circle (2.4pt); }
  \node[anchor=east] at (-0.85,-0.8) {$R$ \scriptsize (6 bits, $-1..-6$)};

  % ---- position axis
  \node[anchor=south] at (0,0.45) {\scriptsize $-2$};
  \draw[dotted] (5.5,0.2) -- (5.5,-0.3);
  \node[anchor=north] at (5.5,-0.3) {\scriptsize $\ell_{\min}=-12$};
\end{circuitikz}
\end{document}
```

*after Fig. 7.17, p. 171, redrawn for the $6\times6$ example worked below.*

**Split the faithfulness budget in two before deleting anything.** Let $R^*$ be the exact value of the heap and $R$ what the operator delivers, so $\delta_R=R-R^*$ (7.9); faithfulness to an output format of LSB $\ell$ is $\bar\delta_R<2^{\ell}$ (7.10), one ulp, defined in [[Rounding]]. Insert the intermediate value $\tilde R$ — the truncated heap, compressed and summed but not yet rounded — and the error splits by adding and subtracting it:

$$\delta_R=\underbrace{(R-\tilde R)}_{\delta_{\text{final round}}}+\underbrace{(\tilde R-R^*)}_{\delta_{\tilde R}},\qquad \bar\delta_R\le\bar\delta_{\text{final round}}+\bar\delta_{\tilde R}$$

by the triangle inequality (7.11)–(7.13). The final rounding uses the identity $\lfloor x\rceil=\lfloor x+1/2\rfloor$: a constant $1$ enters the heap at position $\ell-1$ and everything below $\ell$ is discarded at the end, so $\bar\delta_{\text{final round}}=2^{\ell-1}$ exactly. Substituting into (7.10) leaves the whole truncation budget as

$$\bar\delta_{\tilde R}<2^{\ell-1}\qquad(7.14),$$

half an ulp — the round bit has already spent the other half. This is the same decomposition as [[Error Analysis]]; nothing here re-derives it.

**The candidate bits are totally ordered by what deleting them costs.** Removing the bit at position $i$ subtracts $2^i$ from $\tilde R$ for at least one input vector, so no bit at position $\ge\ell-1$ may ever go: a single one of them reaches $2^{\ell-1}$ and violates (7.14) on its own. Among the rest the rightmost are the cheapest, since one bit at $\ell-2$ costs as much error as two at $\ell-3$ or four at $\ell-4$. Assume every bit costs the same hardware — a hypothesis, discussed under *When it breaks* — and the greedy order is fixed: delete right to left. That total order is the whole reason a two-integer parameterisation is not a loss of generality.

**Two parameters describe every sensible truncation.** $\ell_{\text{ext}}$ is the rightmost column the truncated heap keeps, and $t$ is how many bits are removed from that column. Nothing between the two is worth doing: truncating a bit in column $\ell_{\text{ext}}+1$ saves one bit at the error cost of two bits in $\ell_{\text{ext}}$, and computing a bit in column $\ell_{\text{ext}}-1$ while bits in $\ell_{\text{ext}}$ are being truncated is strictly less accurate for the same price than the reverse. The truncated weight is

$$\Delta(\ell_{\text{ext}},t)=t\cdot2^{\ell_{\text{ext}}}+\Delta^{\text{minor}}(\ell_{\text{ext}}),\qquad \Delta^{\text{minor}}(p)=\sum_{i=\ell_{\min}}^{p-1}h_i2^i$$

(7.19)–(7.20), with $h_i$ the height of column $i$ and $\ell_{\min}$ the heap's LSB. $\Delta^{\text{minor}}$ does not depend on $t$, which is what lets the search be two independent loops. $\ell_{\text{ext}}$ also has a purely architectural reading: it is the LSB of the heap the compressor tree actually sees, so if the heap spans up to column $m$, the compressed $\tilde R$ and the final adder are $m-\ell_{\text{ext}}+1$ bits wide while $R$ is $m-\ell+1$ bits — in the diagram, 9 bits and 6 bits.

**An infinite heap still has a finite $\Delta^{\text{minor}}$.** $\ell_{\min}$ may be $-\infty$: dividing by $3$ inside a heap uses $1/3=0.010101\ldots_2=\sum_{j\le-1}2^{2j}$, and polynomial evaluation ([[Fixed-Point Function Approximation]]) produces such rows routinely. Convergence comes from the geometric sum $\sum_{i<p}2^i=2^p$: an entire infinite tail below position $p$ weighs no more than one single bit at $p$. The implementation exploits exactly that — pre-truncate each infinite row at some position far enough to the right, replacing its tail by one bit of weight $2^p$ (the eight extra dots in the rightmost column of the heap in Fig. 7.18, p. 173), then run the loops on the now-finite heap.

**Recentre the one-signed error and you may delete twice as much.** Truncation only ever removes positive weight, so $\delta_{\tilde R}\in[-\Delta,0]$ and $\bar\delta_{\tilde R}=\Delta$ — half the interval is wasted, because the bound is two-sided but the error is not. Adding a constant $\Delta/2$ back into the heap would centre it on $[-\Delta/2,\Delta/2]$, halving $\bar\delta_{\tilde R}$ and hence doubling the $\Delta$ that (7.14) permits. In practice the constant can only be a sum of bits in columns $\ell-2$ down to $\ell_{\text{ext}}$: a bit at $\ell-1$ is the round bit's slot and would immediately break (7.14), and a bit right of $\ell_{\text{ext}}$ would re-enlarge the very heap you are shrinking. The largest such string of ones is, by the geometric sum again,

$$C=\sum_{i=\ell_{\text{ext}}}^{\ell-2}2^i=2^{\ell-1}-2^{\ell_{\text{ext}}}\qquad(7.21),$$

giving $\delta_{\tilde R}\in[C-\Delta,\;C]$ (7.22). The upper end satisfies (7.14) for free since $C<2^{\ell-1}$; the lower end, substituting (7.19) and $C$, is $t\cdot2^{\ell_{\text{ext}}}+\Delta^{\text{minor}}(\ell_{\text{ext}})-2^{\ell-1}+2^{\ell_{\text{ext}}}<2^{\ell-1}$, and collecting the two $2^{\ell-1}$ terms leaves one inequality in the two unknowns.

$$\boxed{\ (t+1)\cdot2^{\ell_{\text{ext}}}+\Delta^{\text{minor}}(\ell_{\text{ext}})<2^{\ell}\ }\qquad(7.24)$$

**The generator is two `while` loops, and that is the point.** Listing 7.1 (p. 172) starts at $\ell_{\text{ext}}=\ell_{\min}$, $t=0$, pushes $\ell_{\text{ext}}$ one column left while (7.24) still holds there at $t=0$, then increments $t$ while (7.24) still holds. Scaling every weighted sum by $2^{-\ell_{\min}}$ turns both loops into arbitrary-precision integer arithmetic, which is why the implementation is a dozen lines. Closed forms exist for the triangular multiplier heap — (7.16)–(7.18), resting on $\sum_{i=0}^{n-1}(i+1)2^i=(n-1)2^n+1$ — and the book derives one only to show it is useless: it computes $\Delta$ for a given $(\ell_{\text{ext}},t)$, not the maximal pair, and it holds for one heap shape. The loops work on any shape, which is the whole reason truncation is expressed on the heap rather than inside each operator generator.

**The correction constant's granularity is what makes the heuristic locally optimal.** The second loop moves the error in steps of $2^{\ell_{\text{ext}}}$, which is also the ulp of $C$. Shrinking $C$ below that granularity requires lowering $\ell_{\text{ext}}$, i.e. adding back one *computed* bit — non-constant, therefore more expensive than the constant bit it replaces. So there is no local trade left. It stays a heuristic only because the cost of the constant bits themselves is not modelled, and because of the equal-cost assumption above.

**Worked example — the $6\times6$ unsigned multiplier.** Read both operands as `ufix(-1,-6)`, so $X,Y\in[0,1)$ are 6 bits and the output format is also `ufix(-1,-6)`: $\ell=-6$, one ulp $=2^{-6}$. The partial-product heap $\sum 2^{i+j}x_iy_j$ spans columns $-12$ to $-2$ with heights $1,2,3,4,5,6,5,4,3,2,1$ — 36 bits, $\ell_{\min}=-12$. Working in units of $2^{-12}$, $\Delta^{\text{minor}}(-11)=1$, $\Delta^{\text{minor}}(-10)=5$, $\Delta^{\text{minor}}(-9)=17$, $\Delta^{\text{minor}}(-8)=49$, and $2^{\ell}=64$. First loop: $2{+}1=3$, $4{+}5=9$, $8{+}17=25$ all pass (7.24); $16{+}49=65\not<64$ stops it, so $\ell_{\text{ext}}=-9$. Second loop: $2(8){+}17=33$, $3(8){+}17=41$, $4(8){+}17=49$, $5(8){+}17=57$ pass, $6(8){+}17=65$ fails, so $t=4$ — the entire height of column $-9$. Then

$$\Delta=4\cdot2^{-9}+17\cdot2^{-12}=49\cdot2^{-12},\qquad C=2^{-7}-2^{-9}=24\cdot2^{-12}=0.000000011_2,$$
$$\delta_{\tilde R}\in[-25\cdot2^{-12},\,24\cdot2^{-12}],\qquad \bar\delta_{\tilde R}=25\cdot2^{-12}<32\cdot2^{-12}=2^{\ell-1}\ \checkmark$$

Adding $\bar\delta_{\text{final round}}=2^{-7}=32\cdot2^{-12}$ gives $\bar\delta_R\le57\cdot2^{-12}<64\cdot2^{-12}=1$ ulp: **faithful at 0.89 ulp worst case, having built 26 of the 36 AND gates.** The algorithm deliberately stops at $\ell_{\text{ext}}=-9$ rather than $-8$ so that $C$ has finer granularity ($24$ against $16$ units); at $\ell_{\text{ext}}=-8$ the bound would be $33\cdot2^{-12}\ge2^{-7}$ and the truncation would be illegal. Column $-9$ survives in the architecture holding nothing but a constant bit. The same procedure on the book's `ufix(-1,-12)` multiplier reproduces Fig. 7.17: $\ell_{\text{ext}}=\ell-4=-16$, $t=7$, $\Delta^{\text{minor}}(-16)=1793\cdot2^{-24}$, $C=1792\cdot2^{-24}$, $\delta_{\tilde R}\in[-1793\cdot2^{-24},1792\cdot2^{-24}]$, $\bar\delta_{\tilde R}<2^{-13}$.

> [!important]
> A fused operator and a composition of smaller ones must be compared **on their truncated heaps, not their exact ones** (p. 174). The exact heaps of $X-X^3/6$ and of two chained multipliers say one thing; after each has been truncated with equal care they can say the opposite, because truncation deletes a different fraction of each. The same re-reading changes the division-by-3 decision of Fig. 7.16: its infinite tail looked expensive on the exact heap, but only a flat triangle peaking at height 3 — not 8 — survives truncation.

## When it breaks

- **Signed heaps at small output widths.** If $\Delta^{\text{minor}}(\ell_{\text{ext}})$ covers sign-extension bits, those have negative weight, the truncation error turns *positive*, and $C$ must be smaller — possibly zero. (7.24) no longer applies; the loops must test the general form (7.23) instead (p. 172). See [[Constant-One Sign Extension]] for where those bits come from.
- **Correlated bits.** $\Delta$ assumes every truncated bit can be $1$ simultaneously. In the heap for $Z-Z^3/6$ the minus signs become complemented bits, so a heap holding both $x_i$ and $\overline{x_i}$ can never set all truncated bits — there the worst case is at $X=0$. The bound stays *safe*, just pessimistic. Worse, correlation can destroy the lexicographic order in $(\ell_{\text{ext}},t)$ that justifies two loops, forcing an exhaustive search (p. 175).
- **Unequal bit costs.** The greedy right-to-left order assumes all bits cost the same. False as soon as bits come from different producers — an AND gate versus a bit synthesised by a divide-by-3 row (footnote, p. 169).
- **MSB growth.** $C$ can push the result's MSB one position above the untruncated case. Provably harmless for unsigned multipliers and squarers (largest product $1-2\cdot2^{\ell}+2^{2\ell}$ against an error bound $2^{\ell}$) and for signed ones (the MSB serves only $-1\times-1$).

  > [!warning] The general case is not covered — the book says only that "similar proof may be conducted for more complex truncated bit heaps, sometimes taking the value of the correction constant into account" (p. 174), and gives none. Needs outside research before trusting $C$ on an arbitrary heap.
- **Data-dependent correction terms.** The truncated-multiplier literature replaces the constant $C$ with an input-dependent one, improving *statistical* error. It does not fit a worst-case budget, and it forfeits the constant's structural advantage: constants from several sub-operators pre-add into one row of the shared heap, diluting their cost to nothing (p. 175). See [[Truncated Multipliers]].
- **Shallow heaps.** The saving scales with how much of the heap lies below $\ell$. For $X-X^3/6$ faithful to $2^{-16}$ (Fig. 7.18, $\ell_{\text{ext}}=-22$) more bits remain to the right of $\ell$ than to the left, and the bulk of the computation vanishes; a heap already narrow at the bottom, such as a plain adder's, has nothing to give.

## RTL (Spade)

```spade
// Truncated 6x6 unsigned heap. Inputs and output ufix(-1,-6):
// l = -6, l_min = -12, l_ext = -9, t = 4.  Row j keeps only x_i with i+j >= 4.
fn row(x: uint<6>, yj: bool, keep: uint<6>) -> uint<13> {
    if yj { zext(x & keep) } else { 0 }
}

entity trunc_mult6(x: uint<6>, y: uint<6>) -> uint<6> {
    let b = y.as_bits();
    // 26 AND gates instead of 36; +56 = correction constant C (24) + round bit (32)
    let s = row(x, b[0], 0b110000)
        +. (row(x, b[1], 0b111000) << 1)
        +. (row(x, b[2], 0b111100) << 2)
        +. (row(x, b[3], 0b111110) << 3)
        +. (row(x, b[4], 0b111111) << 4)
        +. (row(x, b[5], 0b111111) << 5)
        +. 56;
    trunc(s >> 6)
}
```

Each `row` is one row of dots in the diagram: `keep` is the mask that deletes the open circles from that row, so the six masks hold $2+3+4+5+6+6=26$ ones — exactly the AND gates that survive. `s` is the compressed heap $\tilde R$ in units of $2^{-12}$; `+.` is the wrapping add, safe because the maximum is $63\cdot63+56=4025<2^{13}$. The literal `56` is $C+2^{\ell-1}=24+32$, the three circled ones on top of the diagram, and `>> 6` with `trunc` is the final discard of everything below $\ell$. All combinational — the drawing shows a heap, but synthesis will build a compressor tree plus a final adder over columns $-9$ to $-1$ ([[Compressor Trees]]), never the row-by-row ripple this code literally spells.

Simulated exhaustively over all 4096 input pairs plus 3000 random and 6 named asymmetric vectors, against both a behavioural model of the truncated heap and the faithfulness predicate $|R-XY|<2^{-6}$. Measured worst case $49\cdot2^{-12}=0.77$ ulp against the analytic bound of $57\cdot2^{-12}=0.89$ ulp — a small live instance of the pessimism noted above, since the worst-case input for $\Delta$ and the worst-case input for the final rounding are not the same one.

## Related Notes

- [[Bit Heaps]] – depends-on: the exact heap $R^*$ that this deletes from, and the closure properties that make an infinite $\ell_{\min}$ possible in the first place.
- [[Error Analysis]] – supports: supplies the decomposition $\delta_R=\delta_{\text{final round}}+\delta_{\tilde R}$ that splits the budget.
- [[Rounding]] – supports: defines faithfulness and the half-ulp round bit that spends the other half of $2^{\ell}$.
- [[Compressor Trees]] – depends-on: $\ell_{\text{ext}}$ fixes the LSB of the heap the tree is asked to compress, so truncation is what sets the tree's problem size.
- [[Truncated Multipliers]] – extends: the same two parameters specialised to a triangular partial-product array, where Booth recoding buys one further column.
- [[Fixed-Point Function Approximation]] – compares: the source of infinite heaps, and where truncating the heap replaces truncating each intermediate operator.
- [[Constant-One Sign Extension]] – counter-example: the sign-extension bits it injects carry negative weight and invalidate the simplified constraint (7.24).

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §7.2.4 Truncating a bit heap, pp. 167–175 — error decomposition (7.9)–(7.14), p. 168; ordering of removable bits, p. 169; parameters $(\ell_{\text{ext}},t)$ and (7.15)–(7.20), pp. 169–170; Fig. 7.17, p. 171; constant correction (7.21)–(7.24) and Listing 7.1, pp. 171–172; infinite heaps and Fig. 7.18, p. 173; MSB considerations, p. 174; refinements, pp. 174–175.
- §3.1.8 faithful rounding and §3.3 error decomposition (cited from p. 168).
- §7.3 Compressor tree synthesis, pp. 175–194 — what consumes the truncated heap.
