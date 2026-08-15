---
title: Multipliers
description: "Map of the 17 Multipliers notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, multipliers, hub]
aliases:
  - Truncated Multipliers
  - Multipliers
  - "2.4) Multipliers"
---

# Multipliers

**Inputs** $X$ in $\mathrm{fix}(m_X,\ell_X)$ on $w_X=m_X-\ell_X+1$ bits and $Y$ in
$\mathrm{fix}(m_Y,\ell_Y)$ on $w_Y$ bits, either signedness — see [[Number Formats]].
**Output** $P$ in $\mathrm{fix}(m_P,\ell_P)$, specified *independently of the inputs*:
that independence is the whole game. The exact product needs $\ell_P=\ell_X+\ell_Y$,
$m_P=m_X+m_Y+1$, hence $w_P=w_X+w_Y$ (p. 207); anything narrower is a truncated
multiplier and buys area with error. **Accuracy promised: last-bit accurate**, error
$<u=2^{\ell_P}$ — faithful, not round-to-nearest at $u/2$ ([[Error Accuracy]]).
**Optimised for area** (LUT and DSP count) at $\mathcal{O}(\log w)$ latency; the
accuracy relaxation is what pays for the area, and a last-bit-accurate operator at
$\ell_P=k$ is in general far cheaper than a nearest-rounded one at $\ell_P=k+1$ (p. 209).

```tikz title="Three-stage parallel multiplier datapath, with the stage each note varies"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm]
  \node (x) at (-1.7,4.5) {$X$};
  \node (y) at (1.7,4.5) {$Y$};
  \node[draw,rounded corners=2pt,minimum width=6.0cm,minimum height=0.9cm] (ppg) at (0,3.2) {partial product generation};
  \node[draw,rounded corners=2pt,minimum width=4.4cm,minimum height=0.9cm] (ct) at (0,1.3) {compressor tree};
  \node[draw,rounded corners=2pt,minimum width=3.2cm,minimum height=0.9cm] (fa) at (0,-0.6) {final adder};
  \node (p) at (0,-2.0) {$P$};
  \draw[->] (x) -- (-1.7,3.65);
  \draw[->] (y) -- (1.7,3.65);
  \draw[->] (0,2.75) -- (0,1.75);
  \draw[->] (0,0.85) -- (0,-0.15);
  \draw[->] (0,-1.05) -- (p);
  \node[left] at (-1.8,4.1) {$w_X$};
  \node[right] at (1.8,4.1) {$w_Y$};
  \node[right,align=left] at (0.2,2.25) {$w_X\!\cdot\!w_Y$ bits, $\;\lfloor w/2\rfloor\!+\!1$ rows if Booth};
  \node[right,align=left] at (0.2,0.35) {$2\times(w_X\!+\!w_Y)$ (carry--save)};
  \node[right] at (0.2,-1.55) {$w_P=w_X+w_Y$};
  \node[align=right,anchor=east] at (-3.3,3.2) {every note below\\varies this box};
  \node[align=right,anchor=east] at (-3.3,1.3) {bit heap};
  \node[align=right,anchor=east] at (-3.3,-0.6) {carry propagation};
\end{circuitikz}
\end{document}
```

*After Fig. 8.5, p. 213.* Generation is constant-time, the tree and the final adder are
each $\mathcal{O}(\log w)$ (pp. 213–214). The lower two boxes belong to
[[Sums of Weighted Bits]] and [[Adders]] and are not re-litigated here — every note in
this topic is a different first box, or a different *shape* of the heap it produces.

- [[Choosing a Multiplier]] — **read this second, before any circuit note.** It holds the
  efficiency table with the book's real LUT/DSP numbers and the crossovers.

### The rectangle, and what signedness costs

- [[Unsigned Array Multiplier]] — the baseline, and the geometry every later note bends.
- [[Baugh-Wooley Multiplier]] — read it for why two's complement is nearly free.
- [[Booth's Algorithm]] — read it when the compressor tree, not the AND array, is what hurts.
- [[Bewick Radix-8 Multiplier]] — read it for why radix above 4 is usually a dead end.

### FPGA: covering the rectangle with heterogeneous resources

- [[Unsigned DSP Multiplier Packing]] — read it first if your multipliers are *smaller* than
  a DSP: two of them share one block for free.
- [[Signed DSP Multiplier Packing]] — the same trick once sign extension makes them overlap.
- [[Multiplier Tiling]] — the framing note for everything after it: cover every position
  exactly once, no overlaps, tiles may hang outside the rectangle.
- [[LUT-Based Multiplier Tiles]] — read it for the small tiles a tiling draws from.
- [[Carry-Chain Multiplier Tile]] — read it for the densest logic-only tile there is.
- [[DSP Super-Tile]] — read it when DSPs are scarce and a pipeline stage is affordable.

### Spending accuracy for area

- [[Correctly Rounded Multiplier]] — read it *before* reaching for truncation; it is nearly
  free, so skipping it is rarely worth it.
- [[Truncated Multipliers]] — read it when the low output bits are not in the specification.

### Sub-quadratic: trading multiplications for additions

- [[Karatsuba]] — read it for the one identity the family rests on.
- [[Subtractive Karatsuba]] — read it if your DSP multipliers are natively signed.
- [[K-Part Karatsuba Splitting]] — read it for the flat generalisation with diagonal reuse.
- [[Recursive Karatsuba]] — read it for the latency-vs-multiplier-count end of the trade.
- [[Rectangular Karatsuba]] — read it last, and only if you intend to build one: it is the
  variant that pays on real DSP aspect ratios.

### Where this topic sits

Feeding in: [[Number Formats]] fixes what $X$, $Y$ and $P$ mean, [[Error Accuracy]] what
"last-bit accurate" buys, [[FPGAs]] the primitives every tile is cut from, and
[[ILP for Arithmetic Design]] the solver that places them. Consuming: the heap goes to
[[Sums of Weighted Bits]] and [[Adders]]; and [[Multiplication by Constants]],
[[Squarers and Integer Powers]] and [[Floating-Point Operators]] all beat a general
multiplier once one operand is known, equal, or normalised.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 8
"Fixed-Point Multiplication", pp. 203–257. Framing above from §8.1 (pp. 203–212) and
§8.2 (Fig. 8.5, pp. 213–214).
