---
title: Truncated Squarer
description: "Drops the low heap columns and injects a compensation constant for a faithful result; because every squarer column is half a multiplier's, it truncates one column further for the same ulp budget."
kind: circuit
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, truncation, rounding, bit-heap]
aliases:
  - Truncated Squarers
  - Faithful Squarer
  - Truncated Squaring
---

# Truncated Squarer

A folded squarer whose low heap columns are deleted before compression and replaced by a constant, so that the delivered result is faithful to $2^{\ell}$ while the hardware for the discarded columns is never built.

```tikz title="Bit heap of a faithful truncated 12-bit squarer: columns below l_ext deleted, t bits removed from column l_ext, three constant ones injected"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
% column w drawn at x = (22-w)*0.40, MSB on the left. Heap grows upward from y=0.
% ---------- deleted region shading ----------
\fill[red!12] ({(22-8)*0.40-0.20},-1.55) rectangle ({(22-0)*0.40+0.20},2.60);
% ---------- deleted columns w = 0..8 (heights 1,0,2,1,3,2,4,3,5) ----------
\foreach \w/\h in {0/1, 2/2, 3/1, 4/3, 5/2, 6/4, 7/3, 8/5}{
  \foreach \k in {1,...,\h}{\draw[gray!65] ({(22-\w)*0.40},{\k*0.30-0.15}) circle (0.105);}}
% ---------- column 9 = l_ext : 4 bits, t = 2 of them deleted ----------
\foreach \k in {1,2}{\fill ({(22-9)*0.40},{\k*0.30-0.15}) circle (0.105);}
\foreach \k in {3,4}{\draw[gray!65] ({(22-9)*0.40},{\k*0.30-0.15}) circle (0.105);}
% ---------- surviving columns w = 10..22 ----------
\foreach \w/\h in {10/6, 11/5, 12/7, 13/5, 14/6, 15/4, 16/5, 17/3, 18/4, 19/2, 20/3, 21/1, 22/2}{
  \foreach \k in {1,...,\h}{\fill ({(22-\w)*0.40},{\k*0.30-0.15}) circle (0.105);}}
% ---------- the three constant ones ----------
\foreach \w in {9,10,11}{\fill[red!80!black] ({(22-\w)*0.40},2.40) circle (0.115);}
\node[font=\scriptsize,red!80!black,anchor=west] at (9.20,2.40) {$C+2^{\ell-1}=3584$};
% ---------- truncation cut ----------
\draw[red!80!black,thick,dashed] ({(22-8.5)*0.40},-1.60) -- ({(22-8.5)*0.40},2.78);
\node[font=\scriptsize,red!80!black,anchor=south east] at ({(22-8.5)*0.40-0.05},2.78)
  {cut at $\ell_{\mathrm{ext}}=\ell-3$};
% ---------- weight axis ----------
\draw[gray!55] (-0.75,-0.30) -- (9.15,-0.30);
\foreach \w in {0,9,12,17,22}{\node[font=\scriptsize] at ({(22-\w)*0.40},-0.55) {\w};}
\node[font=\scriptsize,anchor=west] at (9.20,-0.55) {column $w$};
% ---------- results ----------
\foreach \w in {9,...,22}{\fill ({(22-\w)*0.40},-1.00) circle (0.105);}
\fill (-0.40,-1.00) circle (0.105);
\foreach \w in {12,...,22}{\fill ({(22-\w)*0.40},-1.40) circle (0.105);}
\fill (-0.40,-1.40) circle (0.105);
% ---------- left-hand labels ----------
\node[font=\small,anchor=east] at (-0.70,1.00) {$R^{*}$};
\node[font=\small,anchor=east] at (-0.70,-1.00) {$\tilde R$};
\node[font=\small,anchor=east] at (-0.70,-1.40) {$R$};
\node[font=\scriptsize,anchor=west] at (9.20,-1.00) {$15$ bits};
\node[font=\scriptsize,anchor=west] at (9.20,-1.40) {$12$ bits};
\node[font=\scriptsize,anchor=west] at (-0.65,-1.95)
  {$X\in\mathrm{ufix}(-1,-12)$, $12$ bits\ $\longrightarrow$\ $R\in\mathrm{ufix}(-1,-12)$, $12$ bits;\ \ $\ell=-12$};
\node[font=\scriptsize,anchor=west] at (-0.65,-2.32)
  {kept: $55$ heap bits of $78$, $48$ AND gates of $66$;\ \ worst case $0.87$ ulp};
\node[font=\scriptsize,anchor=west] at (-0.65,-2.69)
  {$\bullet$ built\quad {\color{gray!65}$\circ$} deleted\quad
   {\color{red!80!black}$\bullet$} constant one};
\end{circuitikz}
\end{document}
```

*After Fig. 14.3, p. 447; column heights recomputed from eq. (14.1) and the cut located by Listing 7.1, p. 172.*

**Nothing in the construction is squarer-specific.** Start from the folded heap of the [[Folded Array Squarer]],

$$X^{2}=\sum_{i=0}^{n-1}2^{2i}x_i\;+\!\!\sum_{0\le j<i<n}\!\!2^{i+j+1}\,x_ix_j\tag{14.1}$$

and hand it to the generic two-parameter heap truncation of [[Bit Heaps]] unchanged. That machinery picks $\ell_{\mathrm{ext}}$, the rightmost column still built, and $t$, how many of the $h_{\ell_{\mathrm{ext}}}$ bits in that column are additionally deleted; it bounds the discarded value by $\Delta=t\cdot2^{\ell_{\mathrm{ext}}}+\Delta^{\mathrm{minor}}(\ell_{\mathrm{ext}})$ with $\Delta^{\mathrm{minor}}(p)=\sum_{i<p}h_i2^i$; and it recentres the one-signed error with the constant $C=2^{\ell-1}-2^{\ell_{\mathrm{ext}}}$. The single legality test is inequality (7.24), $(t+1)2^{\ell_{\mathrm{ext}}}+\Delta^{\mathrm{minor}}(\ell_{\mathrm{ext}})<2^{\ell}$. The *only* thing the squarer changes is the vector $h$ of column heights fed into it — which is exactly the point, because that vector is what the fold halved.

**The heights are what buy the extra column.** Folding merged $x_ix_j$ with $x_jx_i$ into a single bit at weight $2^{i+j+1}$, so column $w$ of a squarer carries about half the bits column $w$ of the same-width multiplier carries: for $n=12$ the squarer heights are $1,0,2,1,3,2,4,3,5,4,6,5,7,\dots$ against the multiplier's $1,2,3,4,5,6,7,8,9,10,11,12,11,\dots$. Since a column's contribution to $\Delta^{\mathrm{minor}}$ is (height) $\times$ (weight) and the weights double column by column, halving every height is worth exactly one doubling: whatever $\Delta^{\mathrm{minor}}$ the multiplier reaches at $\ell_{\mathrm{ext}}$, the squarer reaches at $\ell_{\mathrm{ext}}+1$.

> [!important] One column further, on the same error budget
> Run Listing 7.1 on both heaps for the same format — $X,R\in\mathrm{ufix}(-1,-12)$, so $\ell=-12$ and $\ell_{\min}=-24$:
>
> | operator | $\ell_{\mathrm{ext}}$ | $t$ | $\Delta^{\mathrm{minor}}(\ell_{\mathrm{ext}})$ | $C$ | heap bits kept |
> | --- | --- | --- | --- | --- | --- |
> | $12\times12$ multiplier | $\ell-4$ | $7$ | $1793\cdot2^{\ell_{\min}}$ | $1792\cdot2^{\ell_{\min}}$ | $101$ of $144$ |
> | $12$-bit squarer | $\ell-3$ | $2$ | $2049\cdot2^{\ell_{\min}}$ | $1536\cdot2^{\ell_{\min}}$ | $55$ of $78$ |
>
> Same input format, same output format, same algorithm, same faithfulness target — and the squarer's cut sits one full column to the left. The multiplier row reproduces Fig. 7.17, p. 171 exactly, which is what makes the squarer row trustworthy.

**The three constant ones in the figure are two different constants added together.** $C$ compensates the truncation and must be expressible as bits in columns $\ell_{\mathrm{ext}}\dots\ell-2$; here $C=2^{\ell-1}-2^{\ell-3}=3\cdot2^{\ell-3}$, one bit in column $\ell-3$ and one in $\ell-2$. The final round-to-nearest of [[Rounding]] adds its own $2^{\ell-1}$ before the low bits are discarded. Merging them into the heap — they are constants, the compressor tree does not care where a bit came from — gives $C+2^{\ell-1}=7\cdot2^{\ell-3}$, ones in columns $\ell-3,\ell-2,\ell-1$: the three rightmost surviving columns, exactly as drawn. Nothing is spent on this beyond seeding three heap cells that the tree would otherwise have left empty.

> [!warning] The book's $t$ does not survive its own inequality
> p. 447 states $\ell_{\mathrm{ext}}=\ell-3$ and $t=3$ for this example. With the heights of (14.1), $\Delta^{\mathrm{minor}}(\ell-3)=2049\cdot2^{\ell_{\min}}$ and $2^{\ell_{\mathrm{ext}}}=512\cdot2^{\ell_{\min}}$, so (7.24) reads $(t+1)\cdot512+2049<4096$, i.e. $t\le2$. At $t=3$ the left side is $4097$ — over budget by one unit in the last place of the extended format, which is enough to lose faithfulness. $\ell_{\mathrm{ext}}=\ell-3$ is correct and is the load-bearing claim; take $t=2$.

**A 6-bit squarer is small enough to check by hand and shows the same gap.** Take $n=6$, exact product on 12 bits, deliver 9 bits, so $\ell$ sits 3 columns above $\ell_{\min}$. The folded heights are $1,0,2,1,3,2,4,2,3,1,2$ (21 bits, peak 4) against the $6\times6$ multiplier's $1,2,3,4,5,6,5,4,3,2,1$ (36 bits, peak 6):

| | $\ell_{\mathrm{ext}}$ | $t$ | $\Delta$ | $C$ | verdict |
| --- | --- | --- | --- | --- | --- |
| squarer | $\ell-1$ | $0$ | $1\cdot2^{\ell_{\min}}=0.125$ ulp | $0$ | faithful with **no** compensation |
| $6\times6$ multiplier | $\ell-2$ | $2$ | $5\cdot2^{\ell_{\min}}=0.625$ ulp | $2\cdot2^{\ell_{\min}}$ | needs the constant |

The squarer discards columns $\ell_{\min}$ and $\ell_{\min}+1$, whose heights are $1$ and $0$, for a total discarded value of $1$ unit — an eighth of an ulp. Cut the multiplier at the same place and the discarded value is $1+2\cdot2=5$ units, already over half an ulp; the multiplier must keep one more column and then claw back the budget with $C$. One column, both times, for exactly the reason the height table gives.

**Refinements exist, and the generic heuristic is already optimal where it matters.** A linear rather than constant compensation function improves the *statistical* distribution of the residual error [Gar+10], which matters when many truncated squarers feed an accumulation and the biases add. Against the **worst-case** criterion the generic bit-heap truncation heuristic is optimal, so there is nothing to gain from a squarer-specific analysis — see [[Error Analysis]] for why worst-case and mean error lead to different optima.

$$\boxed{\ h^{\mathrm{sqr}}_w\approx\tfrac12 h^{\mathrm{mul}}_w\ \Longrightarrow\ \Delta^{\mathrm{minor}}_{\mathrm{sqr}}(p+1)\approx\Delta^{\mathrm{minor}}_{\mathrm{mul}}(p)\ \Longrightarrow\ \ell^{\mathrm{sqr}}_{\mathrm{ext}}=\ell^{\mathrm{mul}}_{\mathrm{ext}}+1\ }$$

## When it breaks

- **The bound is a worst case that may be unreachable.** It assumes every discarded bit is $1$ simultaneously. A squarer heap is built from $x_ix_j$ terms over a *single* operand, so the discarded bits are heavily correlated — an all-ones discard requires $X$ to have a specific pattern, and for many $X$ the actual loss is far smaller. The truncation is then legal but conservative, the same pessimism flagged for heaps containing both $x$ and $\bar x$ (p. 174).
- **One extra column is a rule of thumb, not an identity.** Odd columns of a squarer heap carry no diagonal bit and even ones do, so $h^{\mathrm{sqr}}_w/h^{\mathrm{mul}}_w$ oscillates around $\tfrac12$ rather than equalling it. At small $n$, or when $\ell$ lands near the ragged low end of the heap, the algorithm can return the same $\ell_{\mathrm{ext}}$ for both operators. Run Listing 7.1; do not assume.
- **It only pays if $\ell$ is well above $\ell_{\min}$.** An exact squarer ($\ell=\ell_{\min}$) admits no truncation at all, and a nearly-exact one saves a handful of AND gates. The 12-bit example deletes 23 of 78 heap bits and 18 of 66 AND gates — a real but not dramatic 29 % — because it keeps 12 of 24 output bits. Ask for 8 output bits and the saving becomes most of the operator.
- **The saving is in the heap, not in the tree depth.** Deleting the low columns removes the shortest columns, so the peak height (7 here, at column $\ell$) is untouched and the compressor tree keeps its depth. Latency improves only through the shorter final carry-propagate adder.
- **On FPGA the accounting changes.** Below the cut you are not deleting AND gates but whole LUTs and, in a tiled implementation, whole DSP blocks; truncation interacts with the tiling problem rather than composing with it, and the ILP formulation of [[Squarer Tiling]] handles truncated squarers directly.
- **Chained operators do not simply add.** A truncated squarer inside the [[Faithful Fixed-Point Power]] recursion is applied to an already-inexact input, so its $<1$ ulp is the *last* error term, not the only one; budget guard bits per stage instead of per operator.

## RTL (Spade)

The book's example, hard-wired: $n=12$, $\ell_{\mathrm{ext}}=\ell-3$, $t=2$, constant $C+2^{\ell-1}=3584$. Each surviving row $i$ of (14.1) contributes $x_i\cdot\big(2^{2i}+2^{i+1}X_{<i}\big)$; masking $X$ before the shift is what deletes heap bits, and rows $i<5$ vanish entirely because every bit they would emit lies below the cut.

```spade
entity trunc_sqr12(x: uint<12>) -> uint<12> {
    let b = x.as_bits();
    let xw: uint<24> = zext(x);
    // row i: diagonal bit at weight 2i, cross bits x_i.x_j at weight i+j+1.
    // the mask keeps only j with i+j+1 >= l_ext = 9; rows 7 and 8 lose one
    // more bit each, which is the t = 2 deletion inside column 9 itself.
    let r5:  uint<24> = if b[5]  { ((xw & 24)   << 6)  +. 1024    } else { 0 };
    let r6:  uint<24> = if b[6]  { ((xw & 60)   << 7)  +. 4096    } else { 0 };
    let r7:  uint<24> = if b[7]  { ((xw & 124)  << 8)  +. 16384   } else { 0 };
    let r8:  uint<24> = if b[8]  { ((xw & 254)  << 9)  +. 65536   } else { 0 };
    let r9:  uint<24> = if b[9]  { ((xw & 511)  << 10) +. 262144  } else { 0 };
    let r10: uint<24> = if b[10] { ((xw & 1023) << 11) +. 1048576 } else { 0 };
    let r11: uint<24> = if b[11] { ((xw & 2047) << 12) +. 4194304 } else { 0 };
    // 3584 = C + 2^(l-1): the three constant ones of the diagram
    let s: uint<24> = r5 +. r6 +. r7 +. r8 +. r9 +. r10 +. r11 +. 3584;
    trunc(s >> 12)
}
```

`b[i]` is the diagram's row selector and `xw & M_i` is the surviving part of that row's cross-product bits, so the seven `if` expressions are the seven rows that still cross the dashed cut. `s` is $\tilde R$ — the 15 meaningful bits of the 24-bit accumulator, columns $9\dots23$ — and `trunc(s >> 12)` is the drop to $R$ on 12 bits; both are combinational, no clock appears. Synthesis will not build the 24-bit adder tree the `+.` chain literally describes: the masked-off low bits are constant zero, so the whole region right of the cut optimises away, which is precisely the cost model the truncation was chosen under. The one thing the drawing shows and the code hides is compression order — the diagram's heap becomes a compressor tree plus one carry-propagate adder, not the linear ripple of seven additions.

Simulated exhaustively over all 4096 inputs plus 3000 random and 12 named vectors (7108 checks, 0 failures) against two independent references: a column-wise reconstruction of the surviving heap bits, and the faithfulness bound $|R\cdot2^{\ell}-X^2|<2^{\ell}$ computed from the exact product. Measured worst case $3568\cdot2^{\ell_{\min}}=0.871$ ulp, error range $[-0.750,+0.871]$ ulp — the recentring is visible in the sign spread, and the margin under $1$ ulp is what $t=3$ would have consumed.

## Related Notes

- [[Truncated Multipliers]] – compares: the same $(\ell_{\mathrm{ext}},t)$ machinery on an unfolded heap; the squarer's advantage is stated relative to it and is exactly one column.
- [[Bit Heaps]] – depends-on: supplies Listing 7.1, the bound $\Delta$, the constant $C$, and inequality (7.24) that this note only specialises.
- [[Rounding]] – depends-on: the final $2^{\ell-1}$ that merges with $C$ into the three constant ones.
- [[Error Analysis]] – supports: why worst-case optimality leaves room for the statistical refinement of [Gar+10].
- [[Folded Array Squarer]] – extends: the exact heap this one deletes columns from; the fold is what halves the heights.
- [[Choosing a Squarer]] – compares: where truncation sits against the high-radix and tiled alternatives.
- [[Squarer Tiling]] – counter-example: on FPGA the unit of deletion is a tile, not a heap bit, and the ILP formulation subsumes this heuristic.
- [[Faithful Fixed-Point Power]] – extends: chains truncated squarers, where this note's $<1$ ulp becomes one term in a longer budget.
- [[Cube Bit Heap]] – extends: the same truncation is what makes a direct cube heap affordable at all.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.2.4 *Truncated Squarers* — Fig. 14.3, the one-extra-column rule, pp. 446–447
- §14.2.1 *Basics* — eq. (14.1) and the exact 12-bit heap of Fig. 14.2, pp. 444–445
- §7.2.4 *Truncating a Bit Heap for Last-Bit Accuracy* — $\Delta$, $\Delta^{\mathrm{minor}}$, $C$, inequality (7.24), Listing 7.1, Fig. 7.17, pp. 171–175
- Table 8.3 heap accounting for the $12\times12$ multiplier comparison, p. 229
- [Gar+10] Garofalo, Petra & Napoli, *A novel truncated squarer with linear compensation function*, ISCAS 2010
