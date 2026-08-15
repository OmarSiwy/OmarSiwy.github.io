---
title: "LUT-Based Multiplier Tiles"
description: "Small multipliers tabulated straight into LUT6s — 1x1, 1x2, 3x3, and the 2x3 that exploits LUT6-as-two-LUT5 to beat 3x3 on efficiency. The 1x1 exists only to guarantee a tiling always closes."
kind: circuit
source: "ASA §8.4.2, pp. 227-230"
status: seed
spade: simulated
tags: [digital, multipliers, fpga, lut, tiling]
aliases:
  - LUT-Based Sub-multipliers
  - LUT-Based Multiplier Tile
  - Tabulated Multiplier Tile
  - LUT Multiplier Tiles
---

# LUT-Based Multiplier Tiles

A LUT-based tile is an $m\times n$ sub-rectangle of the partial-product board whose product is *tabulated* rather than built, which restricts the family to $m+n\le 6$ inputs and makes fracturability — not area — the thing that decides which shape wins.

```tikz title="The four LUT-based multiplier tile shapes with their LUT cost and efficiency"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.42cm,y=0.42cm,every node/.style={inner sep=1pt}]
  % axis legend, kept clear of the shapes
  \draw[->,>=latex] (-1.2,7.0) -- (2.8,7.0) node[right] {\footnotesize bits of $X$, weight $2^{x}$};
  \draw[->,>=latex] (-1.2,7.0) -- (-1.2,10.5) node[above,anchor=south west] {\footnotesize bits of $Y$, weight $2^{y}$};
  \node[anchor=west] at (-1.2,5.2) {\footnotesize one cell $=$ one partial product $x_i y_j$; a tile's weight is $2^{x+y}$ at its lower-right corner};

  % --- (a) 1x1
  \draw[very thick] (0,0) rectangle (1,1);
  \node at (0.5,-1.8) {\footnotesize (a) $1\times1$};
  \node at (0.5,-3.4) {\scriptsize area 1, 1 LUT};
  \node at (0.5,-4.7) {\scriptsize $E=0.65$};

  % --- (b) 1x2 and 2x1
  \draw[very thick] (6.5,0) rectangle (7.5,2);
  \draw[dashed] (6.5,1) -- (7.5,1);
  \draw[very thick] (9.5,0) rectangle (11.5,1);
  \draw[dashed] (10.5,0) -- (10.5,1);
  \node at (9,-1.8) {\footnotesize (b) $1\times2$, $2\times1$};
  \node at (9,-3.4) {\scriptsize area 2, 1 LUT6};
  \node at (9,-4.7) {\scriptsize as 2 LUT5, $E=0.95$};

  % --- (c) 3x3
  \draw[very thick] (18,0) rectangle (21,3);
  \foreach \k in {1,2}{\draw[dashed] (18,\k) -- (21,\k); \draw[dashed] (18+\k,0) -- (18+\k,3);}
  \node at (19.5,-1.8) {\footnotesize (c) $3\times3$};
  \node at (19.5,-3.4) {\scriptsize area 9, 6 full LUT6};
  \node at (19.5,-4.7) {\scriptsize $E=0.97$};

  % --- (d) 3x2 and 2x3
  \draw[very thick] (28,0) rectangle (31,2);
  \draw[dashed] (28,1) -- (31,1);
  \foreach \k in {1,2}{\draw[dashed] (28+\k,0) -- (28+\k,2);}
  \draw[very thick] (33,0) rectangle (35,3);
  \draw[dashed] (34,0) -- (34,3);
  \foreach \k in {1,2}{\draw[dashed] (33,\k) -- (35,\k);}
  \node at (31.5,-1.8) {\footnotesize (d) $3\times2$, $2\times3$};
  \node at (31.5,-3.4) {\scriptsize area 6, 3 LUT6};
  \node at (31.5,-4.7) {\scriptsize as 5 of 6 LUT5, $E=1.04$};
\end{circuitikz}
\end{document}
```

*after Fig. 8.15, p. 230, annotated with the costs of Table 8.3, p. 229.*

**Replace the sub-multiplier with its truth table.** A $k$-input LUT realises *any* Boolean function of $k$ variables, so it does not care whether that function is a parity, a decoder, or a multiplication. An $m\times n$ unsigned tile has exactly $m+n$ input bits — $x$ on $m$ bits, $y$ on $n$ bits — and produces $w_s$ output bits, each of which is an independent Boolean function of the *same* $m+n$ variables. If $m+n\le 6$ every one of those functions fits a single LUT6, so the tile costs one LUT per output bit and contains no partial products, no adders and no internal compression whatsoever. The whole multiplier collapses into a fan-out of the input bus across $w_s$ LUTs. This is the same move as [[KCM, Table-Based Constant Multiplication]] with the constant relaxed back into a second variable, and it is the reason the family stops abruptly: a $4\times3$ tile would need seven inputs, and no amount of cleverness compresses seven variables into a six-input table.

**Pin down $w_s$, because the whole cost model is proportional to it.** The largest unsigned product is
$$(2^m-1)(2^n-1) = 2^{m+n} - 2^m - 2^n + 1 < 2^{m+n},$$
so $m+n$ bits always suffice — the tile never grows the $2N$ that a same-width multiplier does in [[Number Formats]] terms, because $m$ and $n$ are independent. That bound is *tight* only when the product can reach the top half, i.e. when $2^{m+n-1}\le 2^{m+n}-2^m-2^n+1$, which rearranges to $2^m+2^n-1\le 2^{m+n-1}$ and holds exactly when $\min(m,n)\ge 2$. When one operand is a single bit the product is just a masked copy of the other, so the MSB is dead and
$$w_s = \begin{cases} m+n, & \min(m,n)\ge 2\\ \max(m,n), & \min(m,n)=1.\end{cases}$$
Hence $w_{1\times1}=1$, $w_{1\times2}=2$, $w_{2\times3}=5$, $w_{3\times3}=6$ — the widths implicit in Table 8.3's cost column.

**Fracture the LUT6 and the per-bit cost halves.** A modern AMD LUT6 can be used as two LUT5s *provided the two halves share the same five inputs*, which is precisely the situation in a tabulated multiplier: every output bit reads the identical input bus. So the number of LUTs the multiplier itself consumes is the output width divided by a fracturing factor $f$,
$$\#\mathrm{LUT}^{\mathrm{mult}}_s = \left\lceil \frac{w_s}{f} \right\rceil,\qquad f = \begin{cases}2, & m+n\le 5\\ 1, & m+n=6,\end{cases}$$
because at $m+n=6$ the tile needs all six inputs and the LUT can no longer be split. A $3\times3$ therefore burns six *whole* LUT6s; a $2\times3$ needs $\lceil 5/2\rceil = 3$, one of whose six LUT5 halves sits idle; a $1\times2$ needs one, and a $1\times1$ needs one — it is literally an AND gate.

**Charge each tile for the compression it inflicts downstream.** A tile's $w_s$ output bits do not appear at the multiplier output; they are dropped into the bit heap at weight $2^{x+y}$ and must be summed with everything else, so a tile that emits more bits makes the [[Sums of Weighted Bits]] tree larger. The cost is therefore the tile's own LUTs plus its share of the tree, and the efficiency metric is a benefit-cost ratio with the tile's covered area as benefit:
$$\mathrm{cost}^{\mathrm{LUT}}_s = \#\mathrm{LUT}^{\mathrm{mult}}_s + \#\mathrm{LUT}^{\mathrm{comp}}\cdot w_s, \qquad E^{\mathrm{LUT}}_s = \frac{\mathrm{area}_s}{\mathrm{cost}^{\mathrm{LUT}}_s},$$
with $\#\mathrm{LUT}^{\mathrm{comp}} = 0.55$ LUT/bit on AMD, a linear fit justified in §7.4. The tree cost cannot be exact — it depends on what *else* lands in the heap — but compressor LUT count grows close to linearly with heap height, so a per-bit constant is a defensible approximation.

**The ranking that comes out is not the area ranking.**

| tile | area $mn$ | $w_s$ | $\#\mathrm{LUT}^{\mathrm{mult}}$ | $\mathrm{cost}^{\mathrm{LUT}}$ | $E^{\mathrm{LUT}}$ |
| --- | --- | --- | --- | --- | --- |
| $1\times1$ | 1 | 1 | 1 | 1.55 | 0.65 |
| $1\times2$ | 2 | 2 | 1 | 2.10 | 0.95 |
| $3\times3$ | 9 | 6 | 6 | 9.30 | 0.97 |
| $2\times3$ | 6 | 5 | 3 | 5.75 | **1.04** |

> [!note]
> The $2\times3$ covers a *third fewer* partial products than the $3\times3$ and throws away a LUT5, yet wins. The compression terms are nearly equal ($0.55\cdot 5$ versus $0.55\cdot 6$), so the decision falls entirely to the multiplier term: fracturing gives the $2\times3$ three LUTs for six units of area, $0.50$ LUT per unit, against the $3\times3$'s six LUTs for nine, $0.67$ per unit. Losing one input to gain fracturability is worth more than the ninth partial product. The $2\times3$ is also the only LUT-only tile with $E>1$ — it retires more bits of multiplication work than it consumes LUTs.

**The catalogue is short on purpose, and closed under flipping.** Every entry can be transposed for free — a $2\times3$ instantiated as a $3\times2$ is the same table with the input bus relabelled — which doubles the available shapes at zero cost and is why (b) and (d) each show two rectangles. Two shapes from the literature are then eliminated: a $1\times4$ [KAZ15] decomposes into two $1\times2$ tiles at identical cost and identical efficiency, so the more generic $1\times2$ subsumes it; and a $4\times2$ [Kak+16] scores only $E_{4\times2}\approx 0.8$, while its exact shape is covered by a $3\times2$ plus a $1\times2$ at strictly higher efficiency. The $1\times1$ survives despite the worst efficiency in the table because it is the *unit* tile: any leftover region of any shape is coverable by $1\times1$s, so keeping it in $\mathcal{S}$ guarantees the [[Multiplier Tiling]] problem is always feasible. It is an escape hatch, not a building block — a solver emitting many of them is reporting that the shape did not factor.

**Signedness costs nothing here.** In a signed multiplier only the tiles touching an argument's MSB are signed in that dimension; everything in the interior stays unsigned $\times$ unsigned. Because a tabulated tile *is* a truth table, its signed variant is a different table in the same LUTs — the signed $3\times3$ range $[-12, 16]$ still needs six bits, so the geometry, the LUT count and the efficiency are all unchanged. Contrast this with array or Booth structures, where sign management costs real gates ([[Baugh-Wooley Multiplier]]). Tabulation is where signedness is genuinely free.

$$\boxed{\ E^{\mathrm{LUT}}_{m\times n} = \frac{mn}{\left\lceil w_s/f\right\rceil + 0.55\,w_s},\qquad m+n\le 6\ }$$

with $w_s$ and $f$ as above. This single expression reproduces all four rows of Table 8.3 exactly.

## When it breaks

- **$m+n>6$.** The family simply ends; there is no seven-input LUT. Past that point [[Carry-Chain Multiplier Tile]] takes the rectangle ($2\times k$ for any $k$, reaching $E=1.29$) and [[DSP Super-Tile]] takes the large blocks.
- **Every efficiency sits near 1**, i.e. roughly one LUT per partial product covered. Tabulation is not a *density* win over a plain array multiplier; the win is shape freedom for the tiler and a shallower tree, because $3\times3$ retires nine partial products in one logic level.
- **$0.55$ LUT/bit is an AMD fit.** The margin by which $2\times3$ beats $3\times3$ is 7%, comfortably inside the error of a linear compressor model. On a different fabric the two can swap.
- **The idle LUT5 is only free if the packer cooperates.** The $2\times3$'s three-LUT figure assumes the synthesiser actually merges two LUT5 halves into one LUT6, which requires them to share the full input set. If the tile is instantiated as opaque RTL and the tool infers a DSP or a generic multiplier instead, the count reverts to five LUTs and $E$ drops below the $3\times3$.
- **Tiles may hang outside the rectangle**, which is zero-padding the sub-multiplier's inputs. Free in area terms, but it means a tile's nominal $m\times n$ can exceed the useful area it covers, and the efficiencies above are then optimistic.

> [!warning] Not covered in the source — needs outside research
> The book gives no propagation delay for these tiles, only area and efficiency. A $3\times3$ is one LUT delay and a $2\times3$ is also one, so they tie, but the tiling that follows from them has a delay profile the efficiency metric never sees.

> [!warning] Not covered in the source — needs outside research
> $\#\mathrm{LUT}^{\mathrm{comp}}=0.55$ is derived for AMD fabrics in §7.4. No equivalent constant is given for Intel/Altera ALMs or Lattice fabrics, so Table 8.3's ranking cannot be transferred to them without re-fitting.

## RTL (Spade)

```spade
// One LUT-based multiplier tile: an M x N sub-rectangle of the partial-product
// board, tabulated. The product of an M-bit and an N-bit unsigned value is at
// most 2^(M+N) - 2^M - 2^N + 1, so M+N bits always suffice.
fn tile<#uint M, #uint N>(x: uint<M>, y: uint<N>) -> uint<{M + N}> {
    let xw: uint<{M + N}> = zext(x);
    let yw: uint<{M + N}> = zext(y);
    trunc(xw * yw)
}

entity tile3x3(x: uint<3>, y: uint<3>) -> uint<6> { tile::<3, 3>(x, y) }
entity tile2x3(x: uint<2>, y: uint<3>) -> uint<5> { tile::<2, 3>(x, y) }
// A 1-bit operand only masks the other, so the bound above is one bit slack.
entity tile1x2(x: uint<1>, y: uint<2>) -> uint<2> { trunc(tile::<1, 2>(x, y)) }
entity tile1x1(x: uint<1>, y: uint<1>) -> uint<1> { trunc(tile::<1, 1>(x, y)) }
```

`x` and `y` are the two projections of the tile's extent onto the axes of the diagram; the return value is the tile's contribution to the bit heap, to be shifted by $2^{x+y}$ *outside* this block — the tile itself knows nothing about its position. The widths are the derivation above made executable: `zext` to $M+N$ before multiplying works around Spade's rule that `*` needs equal operand widths and doubles them, and the `trunc` back to $M+N$ is exact, never lossy. The two degenerate wrappers truncate one bit further, which is the $\min(m,n)=1$ case. Everything is combinational, no clock. Synthesis will not build the multiplier the `*` implies: with six or fewer inputs each output bit is const-folded into a LUT init mask, so what lands on the die is $w_s$ independent tables sharing one bus, not a partial-product array.

## Related Notes

- [[Multiplier Tiling]] – depends-on: these are the shapes $\mathcal{S}$ that the coverage-without-overlap problem places, and whose costs the ILP minimises.
- [[Carry-Chain Multiplier Tile]] – extends: escapes the $m+n\le6$ ceiling by summing two bit-product rows on the fast carry chain instead of tabulating, reaching $E=1.29$.
- [[DSP Super-Tile]] – compares: the opposite extreme of the same catalogue, $E^{\mathrm{LUT}}=35$ because the multiplication leaves the fabric entirely.
- [[KCM, Table-Based Constant Multiplication]] – compares: the same tabulate-into-LUTs move with one operand frozen, which buys a far larger table per LUT.
- [[Lookup-Tables]] – depends-on: the LUT6-as-two-LUT5 primitive whose input-sharing constraint is the entire reason $2\times3$ outranks $3\times3$.
- [[Baugh-Wooley Multiplier]] – counter-example: sign management costs real gates there, and nothing at all in a tabulated tile.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §8.4.2 "Multiplier Construction as a Tiling Problem", pp. 227–228 (tiling rules, signed tiles, tiles outside the rectangle).
- §8.4.2.1 "Efficiency Metric", pp. 228–229 (Eqs. 8.39–8.41, $\mathrm{cost}^{\mathrm{LUT}}_s$).
- §8.4.2.2 "LUT-Based Sub-multipliers", pp. 229–230 (LUT6-as-two-LUT5, the $1\times4$ and $4\times2$ eliminations, flipping).
- Table 8.3, p. 229; Fig. 8.15, p. 230.
- §7.4 for the $\#\mathrm{LUT}^{\mathrm{comp}}=0.55$ LUT/bit compressor fit.
