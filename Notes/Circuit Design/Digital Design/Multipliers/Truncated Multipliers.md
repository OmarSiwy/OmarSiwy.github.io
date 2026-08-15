---
title: Truncated Multipliers
description: "Never compute the low partial products at all: keep g guard columns below l_P, drop the rest, compensate with a constant, and stay faithful. Booth recoding buys one extra truncated column."
kind: circuit
source: "ASA §8.5, pp. 237-243"
status: seed
spade: simulated
tags: [digital, multipliers, truncation, faithful-rounding, bit-heap, guard-bits, fpga]
aliases:
  - Truncated Multiplier
  - Truncated Multiplication
  - Faithful Truncated Multiplier
  - Booth Truncated Multiplier
  - Guard Bits
---

# Truncated Multipliers

A multiplier whose specification asks for fewer output bits than the exact product carries, built by *not generating* the partial products that only influence the discarded bits — the only multiplier in this topic whose correctness argument is an error bound rather than an identity.

```tikz title="8x8 truncated multiplier: the partial products below l_ext are never built"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.45cm,y=0.45cm]
  % dropped region: every partial product of column weight < l_ext
  \fill[black!8] (-0.55,0.55) -- (4.55,0.55) -- (4.55,-4.55) -- cycle;
  \foreach \j in {0,...,7}{\foreach \i in {0,...,7}{
    \pgfmathtruncatemacro{\w}{\i+\j}
    \ifnum\w<5
      \draw[black!45] (\i+\j,-\j) circle (1.7pt);
    \else
      \fill (\i+\j,-\j) circle (1.7pt);
    \fi
  }}
  \draw[dashed] (4.5,1.3) -- (4.5,-8.4);
  \draw[dashed] (7.5,1.3) -- (7.5,-8.4);
  \node[anchor=north east] at (4.3,-8.4) {$\ell_{\mathrm{ext}}=5$};
  \node[anchor=north west] at (7.7,-8.4) {$\ell_{P}=8$};
  \node[below] at (0,-8.4) {$2^{0}$};
  \node[below] at (14,-8.4) {$2^{14}$};
  \draw[|-|] (0,1.9) -- (7,1.9) node[midway,above] {$w_X=8$};
  \draw[|-|] (15.6,0) -- (15.6,-7) node[midway,right] {$w_Y=8$};
  \node[anchor=west] at (-0.6,-10.6)
    {\small $\circ$ = 15 AND gates never built, $\overline{\delta}_{\mathrm{tiling}}=129$};
  \node[anchor=west] at (-0.6,-11.9)
    {\small $\bullet$ = 49 kept, of which $g=3$ guard columns lie below $\ell_P$};
  \node[anchor=west] at (-0.6,-13.2)
    {\small constant $C=64$ and round bit $2^{7}$ enter the heap here};
\end{circuitikz}
\end{document}
```

*after Figs. 8.21–8.22, pp. 238–240.*

**Separate the two things "truncated" can mean.** The exact product of $X$ on $w_X$ bits and $Y$ on $w_Y$ bits has $\ell_P=\ell_X+\ell_Y$ ([[Unsigned Array Multiplier]]). A specification asking for $\ell_P>\ell_X+\ell_Y$ — the common case being a square multiplier whose output has the same format as its inputs, $w_X=w_Y=w_P=w$ — declares some low output bits unwanted, and there are two levels of aggression (p. 237):

1. **Correctly rounded.** Build the exact multiplier, drop a single constant $1$ into the bit array at position $\ell_P-1$, and truncate the compressed result at $\ell_P$. Because $\lfloor (P+2^{\ell_P-1})/2^{\ell_P}\rfloor$ *is* round-to-nearest-ties-up by definition, this delivers correct rounding for the price of **one constant bit** — same area and delay as exact, to within that bit. See [[Correctly Rounded Multiplier]].
2. **Truncated.** Relax the specification from correctly rounded to *faithful* ([[Rounding]]) and then do not compute the low partial products at all. This is what the name normally denotes, and it saves resources, delay and energy rather than adding a bit.

**Recognise the circuit as an instance, not a new construction.** A truncated multiplier is a [[Bit Heaps|bit heap]] with its low columns deleted, and nothing about the deletion is specific to multiplication: keep $g=\ell_P-\ell_\mathrm{ext}$ **guard columns** below the output LSB, drop every column of weight below $2^{\ell_\mathrm{ext}}$, and add a compensation constant $C$ to the heap. The book makes exactly this point — the basic truncated multiplier was the worked example when the general truncated heap was introduced, so the generic truncation algorithm applies verbatim (p. 238). Two consequences follow immediately. First, deleting a column is not a modification of the compressor tree, it is a smaller heap fed to the *same* tree, so nothing downstream needs redesign. Second, the error is one-signed: every deleted bit is non-negative, so the delivered $\widetilde P$ is always $\le P$, and the constant $C$ exists solely to recentre that bias — by **linearity of the heap sum**, adding $C$ shifts the whole error distribution without touching its width, which is why it can halve the worst case.

**Read the guard-bit count off a table, and know the closed form behind it.** For a faithful truncated unsigned multiplier on $\mathrm{ufix}(-1,\ell_P)$, Table 8.4 (p. 239) gives $g=\ell-\ell_\mathrm{ext}$:

| guard bits $g$ | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| plain, $-\ell_P=w$ | 3–5 | 6–10 | 11–19 | 20–36 | 37–69 | 70–134 | 135–263 | 264–520 |
| Booth, $-\ell_P=w$ | 3–6 | 7–15 | 16–32 | 33–65 | 66–130 | 131–259 | 260–516 | 517–1029 |

The plain row is summarised by the empirical closed form (OEIS [A005126]) that $g$ guard bits suffice whenever

$$w<2^{g}+g$$

so $g$ grows like $\log_2 w$ while the deleted triangle grows like $w^2$ — the reason the technique gets *better* with width, not worse. The table is valid for **signed and unsigned alike**, which is not a coincidence to be checked case by case: signedness changes only the *leading* bits of the array (sign extension, one negated row — see [[Baugh-Wooley Multiplier]]), and truncation touches only trailing bits, so the two modifications act on disjoint column ranges and cannot interact (p. 238).

**Booth recoding buys exactly one extra truncated column.** Compare the two heaps of Fig. 8.21 (p. 238): the plain radix-2 heap has $w$ rows, the radix-4 Booth heap of [[Booth's Algorithm]] has $\lceil w/2\rceil$. Truncation error is governed by $\Delta^{minor}$, the weighted sum of the bits in the truncated part; halving the number of rows halves the number of bits in every column and therefore halves $\Delta^{minor}$. Halving an error budget is worth exactly $\log_2 2=1$ column of weight, which is why the Booth row of Table 8.4 is the plain row shifted by one $g$ — $g=3$ covers $w\le10$ plain but $w\le15$ with Booth. The gain is one column of a triangle, not a constant factor, so it matters most where $w$ is small enough that one column is a visible fraction of the array.

**Work the arithmetic once at $8\times8$ and the general case follows.** Take $A=219$, $B=53$, $A\times B=11607$, output truncated to 8 bits, so $\ell_P=8$ and one ulp is $u=2^{8}=256$. Table 8.4 at $w=8$ (range 6–10) gives $g=3$, hence $\ell_\mathrm{ext}=\ell_P-g=5$: the columns of weight $2^0\dots2^4$ are not computed at all — the 15 open circles in the diagram, $23\%$ of the 64 AND gates, plus all the compression they would have caused. The worst case they could have contributed is the weighted column count

$$\overline{\delta}_\mathrm{tiling}=1\!\cdot\!2^0+2\!\cdot\!2^1+3\!\cdot\!2^2+4\!\cdot\!2^3+5\!\cdot\!2^4=129$$

against a budget of $\overline{\delta}_{\tilde P}=2^{\ell_P-1}=128$, so $C=0$ fails **by one**. Taking $C=64$ — a single constant bit, legally placed since $\ell_\mathrm{ext}\le 6\le \ell_P-2$ — gives $\max|C-\delta_\mathrm{tiling}|=\max(64,\,129-64)=65\le128$. For these particular operands the bits actually lost are $\delta_\mathrm{tiling}=\sum_{i+j\le4}a_ib_j2^{i+j}=1+2+4+16+32=55$, so the heap holds $11607-55=11552$; add $C=64$ and the round bit $2^{\ell_P-1}=128$ to get $11744$, and truncate: $\lfloor 11744/256\rfloor=45$.

$$\text{delivered }45\times256=11520,\qquad \text{exact }11607,\qquad \text{error}=\tfrac{87}{256}=0.34\ \text{ulp}$$

The bound, not the sample: the dropped bits contribute at most $65$ and the final truncation at most $255$, so the total error stays strictly inside one ulp — **faithful**, and never correctly rounded. Exhaustive evaluation of all $2^{16}$ input pairs (below) hits a worst case of $192/256=0.75$ ulp.

**On an FPGA the guard-bit shape is a starting point, not the answer.** Truncating by guard bits turns the partial-product rectangle into the triangular *tiling area* of Fig. 8.22b (p. 240), and feeding that shape as the coverage mask $M_{x,y}$ to the ILP of [[Multiplier Tiling]] solves the problem with no new machinery. It is guaranteed to meet the error constraint but it is not optimal, for two reasons the book names (p. 239): it never truncates anything from the rightmost column, and a sub-multiplier tile that *overhangs* the required area still produces bits that partially compensate the error of bits removed inside it. The fix is to let the ILP choose the uncovered set: relax coverage from $=1$ to $=b_{x,y}$ with $b_{x,y}\in\{0,1\}$ (still no overlaps, C1). An uncovered position contributes a negative error $\overline{\delta}_{x,y}=(1-b_{x,y})2^{x+y}$ (8.43), summing to $\overline{\delta}_\mathrm{tiling}$ (8.44), and faithfulness is the single nonlinear condition $|C-\delta_\mathrm{tiling}|\le\overline{\delta}_{\tilde P}=2^{\ell_P-1}$ (8.45). Splitting on the sign of $C-\delta_\mathrm{tiling}$ — the two extremes being $\delta_\mathrm{tiling}=0$ and $\delta_\mathrm{tiling}=\overline{\delta}_\mathrm{tiling}$ — linearises it into

$$\text{C2:}\ \ C<\overline{\delta}_{\tilde P}\qquad\qquad \text{C3:}\ \ \sum_{x}\sum_{y}(1-b_{x,y})2^{x+y}-C<\overline{\delta}_{\tilde P}$$

with $C=\sum_{i=\ell_\mathrm{ext}}^{\ell-2}2^ic_i$, $c_i\in\{0,1\}$ (C4), each nonzero $c_i$ charged $\#\mathrm{LUT}^\mathrm{comp}$ in the objective (pp. 241–242). The book's instance is a $32\times32$ multiplier truncated to 32 output bits (Fig. 8.24, p. 243): $C=2\,013\,265\,920$, i.e. four constant ones in the heap; $\delta_\mathrm{tiling}=4\,152\,360\,961$; $|C-\delta_\mathrm{tiling}|=1\,954\,545\,664$, just under $\overline{\delta}_{\tilde P}=2^{31}=2\,147\,483\,648$, and shortening any $2\times k$ tile further would add at least $2^{27}+2^{28}=402\,653\,184$ and break the bound. The refined model lands on roughly the same outer silhouette as the guard-bit version but covers and uncovers positions *inside* it so that efficient $2\times k$ carry-chain tiles replace the wasteful $1\times1$s of the naive solution.

$$\boxed{\ \ell_\mathrm{ext}=\ell_P-g,\quad g=\min\{g: w<2^{g}+g\},\quad \bigl|C-\delta_\mathrm{tiling}\bigr|\le\overline{\delta}_{\tilde P}=2^{\ell_P-1}\ }$$

**When it breaks.**

- **Faithful is not deterministic in the way a specification usually means.** Two truncated multipliers meeting the same $g$ can return different results for the same inputs. Anything requiring bit-exact reproducibility against a reference implementation — regression tests, conformance suites, replay — needs the correctly rounded variant instead, which costs one constant bit.
- **The bound is per-operation.** Each product may be off by up to $1$ ulp with a *fixed sign structure*, so a dot product of $n$ truncated products can drift by $\mathcal{O}(n)$ ulp, and the residual bias left by an integer $C$ does not cancel over a long accumulation. Budget it with [[Error Analysis]] before chaining these.
- **Below $w\approx16$ the saving is not worth the argument.** At $w=8$ it is 15 of 64 AND gates. The deleted triangle is $\Theta(\ell_\mathrm{ext}^2)$ against a $\Theta(w^2)$ rectangle, so it only becomes a large fraction once $w\ge32$ (Fig. 8.21, p. 238, is drawn at $w=24$ for that reason).
- **Booth's extra column is not free.** It is only available if you were already paying for the recoder and its correction bits; at small $w$ the recoder can cost more than the column it buys, and on FPGAs LUT tiling usually beats Booth regardless — see [[Choosing a Multiplier]].
- **Table 8.4 stops.** It runs to $w=520$ plain and $w=1029$ Booth; past that use $w<2^g+g$ directly. Below $w=3$ there is no row, because there is nothing left to truncate.
- **Change the shape and the table no longer applies.** $g$ from Table 8.4 certifies the *standard guard-bit shape*. Any hand-edited tiling — an overhanging tile, an extra uncovered position, an asymmetric $w_X\ne w_Y$ — invalidates it, and faithfulness must be re-established through $|C-\delta_\mathrm{tiling}|\le2^{\ell_P-1}$ on the actual mask.
- **Saturation is a separate problem.** The book sidesteps it by taking $X,Y,P$ all in $[0,1)$ (p. 237); with a format that can overflow, truncation interacts with the MSB decision and the two must be sized together.

> [!warning] Not covered in the source — needs outside research
> §8.5 quantifies the *cost* of truncation only through the one $32\times32$ ILP instance. There is no area or delay figure comparing a truncated multiplier against the exact multiplier of the same width, so the "saves resources, delay and energy" claim of p. 237 has no number attached in this book at any width.

**RTL (Spade).**

```spade
/// One partial-product row of a truncated multiplier.
/// `mask` deletes the AND gates whose column weight falls below l_ext,
/// so those gates are never generated rather than generated and discarded.
fn kept_row(xi: bool, y: uint<8>, mask: uint<8>) -> uint<8> {
    if xi { y & mask } else { 0 }
}

/// Unsigned 8x8 truncated to its 8 high bits: l_P = 8, g = 3, l_ext = 5.
fn trunc_mul8(x: uint<8>, y: uint<8>) -> uint<8> {
    let xb = x.as_bits();
    let r0: uint<16> = zext(kept_row(xb[0], y, 0xE0));
    let r1: uint<16> = zext(kept_row(xb[1], y, 0xF0)) << 1;
    let r2: uint<16> = zext(kept_row(xb[2], y, 0xF8)) << 2;
    let r3: uint<16> = zext(kept_row(xb[3], y, 0xFC)) << 3;
    let r4: uint<16> = zext(kept_row(xb[4], y, 0xFE)) << 4;
    let r5: uint<16> = zext(kept_row(xb[5], y, 0xFF)) << 5;
    let r6: uint<16> = zext(kept_row(xb[6], y, 0xFF)) << 6;
    let r7: uint<16> = zext(kept_row(xb[7], y, 0xFF)) << 7;
    let heap: uint<16> = r0 +. r1 +. r2 +. r3 +. r4 +. r5 +. r6 +. r7
                            +. 64            // compensation constant C
                            +. 128;          // round bit at 2^(l_P - 1)
    trunc(heap >> 8)
}
```

Row $i$ of the diagram is `kept_row(xb[i], y, mask_i) << i`; `as_bits()` indexes from the LSB, so `xb[0]` is $x_0$ and the shift is the diagram's shear. The masks *are* the dropped triangle read row by row — row $i$ keeps $y_j$ only where $i+j\ge\ell_\mathrm{ext}=5$, giving `0xE0, 0xF0, 0xF8, 0xFC, 0xFE` and then `0xFF` from row 5 up, 49 mask bits set out of 64. Widths: operands 8 bits, a row 8 bits, the heap 16 bits, the result 8 bits; every `+.` is the wrapping same-width add, safe because the largest heap value is $65025+64+128=65217<2^{16}$. All combinational — these are `fn`s, and Spade forbids `reg` and `inst` inside one. Synthesis will do two things the drawing does not: the masked-off AND gates vanish entirely (a `& 0xE0` on a mask-generated row is constant-folded, not gated), and the eight chained `+.` are retimed into a compressor tree, so the $\mathcal{O}(w)$ chain written here is not the $\mathcal{O}(\log w)$ circuit that comes out.

Simulated with iverilog: 6 named vectors including $219\times53\to45$ and the asymmetric $1\times128$, a 5000-vector random sweep, and an exhaustive sweep of all $65536$ input pairs checking $|256\widetilde P-XY|<256$ — all pass, worst observed error $192/256=0.75$ ulp, matching the analytic bound $\overline{\delta}_\mathrm{tiling}-C+2^{\ell_P}-1-2^{\ell_P-1}$.

**Related Notes.**

- [[Bit Heaps]] – depends-on: truncation is a heap operation, and everything here is that operation specialised to a partial-product rectangle.
- [[Rounding]] – depends-on: the faithful-rounding definition the whole error argument is measured against, and the reason $2^{\ell_P-1}$ is the budget.
- [[Error Analysis]] – supports: how a $1$ ulp per-operation bound propagates once these products are summed or chained.
- [[Booth's Algorithm]] – extends: halving the rows halves $\Delta^{minor}$ and buys one more truncated column, for the price of a recoder.
- [[Correctly Rounded Multiplier]] – compares: the same output width for one constant bit instead of a deleted triangle, when faithful is not good enough.
- [[Unsigned Array Multiplier]] – depends-on: the exact rectangle this deletes from, and the baseline the saving is quoted against.
- [[Baugh-Wooley Multiplier]] – supports: why signedness leaves Table 8.4 unchanged — it edits leading bits, truncation edits trailing ones.
- [[Multiplier Tiling]] – extends: the ILP that turns the truncated shape, or the free choice of uncovered positions, into an actual FPGA cover.
- [[Carry-Chain Multiplier Tile]] – supports: the efficient $2\times k$ tiles the refined ILP is trying to make room for.
- [[Choosing a Multiplier]] – compares: where truncation sits against Booth, tiling and Karatsuba as a width-reduction strategy.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Chapter 8, "Fixed-Point Multiplication":

- §8.5 "Truncated Multipliers", p. 237 — the $\ell_P>\ell_X+\ell_Y$ definition, the square $\mathrm{ufix}(-1,\ell_P)$ setting, and the correctly rounded architecture as one constant bit at $\ell_P-1$.
- §8.5.1 "Plain or Booth Truncated Multipliers", pp. 237–239 — truncated multipliers as an instance of the truncated bit heap of §7.2.4 (Fig. 7.17), Fig. 8.21 p. 238 (24-bit faithful truncated multipliers, plain and Booth), Table 8.4 p. 239 (guard bits $g=\ell-\ell_\mathrm{ext}$), the $w<2^g+g$ closed form and the $\Delta^{minor}$ halving argument p. 238.
- §8.5.2 "Tiling for Optimal Truncated Multipliers on FPGAs", pp. 239–243 — Fig. 8.22 p. 240 (partial-product alignment and resulting tiling area), the two suboptimalities of the guard-bit shape p. 239, Fig. 8.23 p. 241, eqs. (8.43)–(8.50) and constraints C1–C4 pp. 241–242, Fig. 8.24 and the $32\times32$ numbers p. 243.
