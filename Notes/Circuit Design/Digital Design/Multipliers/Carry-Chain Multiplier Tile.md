---
title: "Carry-Chain Multiplier Tile"
description: "A Baugh-Wooley row mapped onto an FPGA slice: two bit-products per LUT summed directly by the fast carry chain, giving a 2xk tile whose efficiency passes every LUT-only tile at k=6 and tends to 1.29."
kind: circuit
source: "ASA §8.4.2.3, p. 231 (Fig. 8.16); Table 8.3, p. 229"
status: seed
spade: simulated
tags: [digital, multipliers, fpga, tiling, carry-chain]
aliases:
  - 2xk Tile
  - 2xk Multiplier Tile
  - Carry-Chain Tile
  - LUT+Carry-Chain Sub-multiplier
---

# Carry-Chain Multiplier Tile

A $2\times k$ sub-multiplier that spends one LUT6 and one carry-chain stage per bit position, and is the only tile in the AMD library whose efficiency keeps rising with its own size instead of saturating.

```tikz title="Slice mapping of a 2xk multiplier tile: one LUT6 and one carry stage per bit position"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % ---- y rails ----
  \draw (-1.30,4.90) -- (10.10,4.90);
  \draw (-1.30,4.60) -- (10.10,4.60);
  \node[anchor=east,font=\small] at (-1.32,4.90) {$y_0$};
  \node[anchor=east,font=\small] at (-1.32,4.60) {$y_1$};

  % ---- dashed carry-chain region ----
  \draw[dashed] (-0.55,0.15) rectangle (10.00,1.95);
  \node[anchor=west,font=\tiny,align=left] at (10.15,1.05)
    {fast carry chain:\\one CARRY4/CARRY8\\column, $k+1$ stages};

  % ---- three stages: i=0, i=1, i=k ----
  \foreach \X/\xa/\xb/\pl in {0/{$x_0$}/{$0$}/{$p_0$},
                              3.0/{$x_1$}/{$x_0$}/{$p_1$},
                              7.2/{$0$}/{$x_{k-1}$}/{$p_k$}}{
    % LUT6
    \draw (\X+0.05,2.40) rectangle (\X+2.35,3.90);
    \node[font=\tiny] at (\X+1.20,3.55) {LUT6};
    \node[font=\tiny] at (\X+1.20,3.10) {$O6=a\oplus b$};
    \node[font=\tiny] at (\X+1.20,2.72) {$O5=a$};
    % inputs
    \draw (\X+0.45,3.90) -- (\X+0.45,5.35);
    \node[anchor=south,font=\tiny] at (\X+0.45,5.36) {\xa};
    \draw (\X+1.45,3.90) -- (\X+1.45,5.35);
    \node[anchor=south,font=\tiny] at (\X+1.45,5.36) {\xb};
    \draw (\X+0.95,3.90) -- (\X+0.95,4.90);
    \fill (\X+0.95,4.90) circle (1.6pt);
    \draw (\X+1.95,3.90) -- (\X+1.95,4.60);
    \fill (\X+1.95,4.60) circle (1.6pt);
    % D_i = a  -> mux data input "0"
    \draw (\X+1.05,2.40) -- (\X+1.05,0.95) -- (\X+1.45,0.95);
    % S_i = a xor b -> sum xor, and mux select
    \draw (\X+0.60,2.40) -- (\X+0.60,0.79);
    \fill (\X+0.60,1.85) circle (1.6pt);
    \draw (\X+0.60,1.85) -- (\X+1.62,1.85) -- (\X+1.62,1.60);
    % mux
    \draw (\X+1.45,0.70) -- (\X+1.45,1.60) -- (\X+1.80,1.45) -- (\X+1.80,0.85) -- cycle;
    \node[anchor=west,font=\tiny] at (\X+1.47,1.30) {1};
    \node[anchor=west,font=\tiny] at (\X+1.47,0.98) {0};
    % sum xor
    \node[circle,draw,inner sep=0.6pt,font=\tiny] (xr) at (\X+0.60,0.58) {$\oplus$};
    \draw[->] (\X+0.60,0.40) -- (\X+0.60,-0.35);
    \node[anchor=north,font=\tiny] at (\X+0.60,-0.37) {\pl};
    % carry in of this stage: rail + tap to the xor
    \draw (\X-0.30,1.30) -- (\X+1.45,1.30);
    \fill (\X-0.05,1.30) circle (1.6pt);
    \draw (\X-0.05,1.30) -- (\X-0.05,0.58) -- (\X+0.42,0.58);
  }

  % ---- carry routing between stages ----
  \draw (1.80,1.15) -- (2.55,1.15) -- (2.55,1.30) -- (2.70,1.30);
  \draw (4.80,1.15) -- (5.55,1.15) -- (5.55,1.30) -- (5.90,1.30);
  \draw (6.55,1.30) -- (6.90,1.30);
  \node[font=\small] at (6.22,1.30) {$\cdots$};
  \node[font=\small] at (6.22,3.15) {$\cdots$};
  % c_in = 0 at the LSB end
  \draw (-0.30,1.30) -- (-1.45,1.30);
  \node[anchor=east,font=\tiny] at (-1.47,1.30) {$c_{\mathrm{in}}=0$};
  % c_out at the MSB end
  \draw[->] (9.00,1.15) -- (9.75,1.15) -- (9.75,-0.35);
  \node[anchor=north,font=\tiny] at (9.75,-0.37) {$p_{k+1}=c_{\mathrm{out}}$};

  % ---- width annotations ----
  \node[anchor=west,font=\tiny,align=left] at (10.20,4.75)
    {$Y$: 2 bits};
  \node[anchor=west,font=\tiny,align=left] at (10.20,5.36)
    {$X$: $k$ bits};
  \draw[|-|] (-0.20,-1.05) -- (9.95,-1.05)
    node[midway,below,font=\tiny] {$P=X\cdot Y$ on $k+2$ bits, for $k+1$ LUT6 and $k+1$ carry stages};
  \node[font=\tiny] at (4.90,-1.75)
    {stage $i$: $a=x_iy_0$, $b=x_{i-1}y_1$, $p_i=a\oplus b\oplus c_i$, $c_{i+1}=(a\oplus b)\ ?\ c_i:a$};
\end{circuitikz}
\end{document}
```

*after Fig. 8.16, p. 231; tile shape as in Fig. 8.15(e), p. 230.*

**Reduce the tile to an addition of exactly two rows.** Take $X$ on $w_X=k$ bits and $Y$ on $w_Y=2$ bits, both unsigned. Expanding $Y=y_0+2y_1$ and applying **distributivity of $\times$ over $+$** to the double sum of [[Unsigned Array Multiplier]] leaves only two partial-product rows,

$$P=X\cdot Y=\sum_{i=0}^{k-1}2^i x_i y_0\;+\;\sum_{i=0}^{k-1}2^{i+1} x_i y_1 ,$$

so re-indexing the second sum with $i\mapsto i-1$ collects both rows column by column:

$$P=\sum_{i=0}^{k}2^i\big(a_i+b_i\big),\qquad a_i=x_iy_0,\quad b_i=x_{i-1}y_1,$$

with the two out-of-range bits pinned to zero, $x_{-1}=x_k=0$. There are $k+1$ columns, $i=0\dots k$, each holding exactly **two** bits — which is the whole point. A $2\times k$ rectangle of partial products never needs compression, because the tallest column is already of height 2, and a height-2 heap is by definition an addition. The result spans $0\le P\le 3(2^k-1)<2^{k+2}$, so $w_P=k+2$ bits.

**Recognise the LUT and the carry cell in the full-adder identity.** Column $i$ of that addition is a full adder on $(a_i,b_i,c_i)$, whose two outputs are $p_i=a_i\oplus b_i\oplus c_i$ and $c_{i+1}=\mathrm{maj}(a_i,b_i,c_i)$. Write $S_i=a_i\oplus b_i$ and split the majority on $S_i$: if $S_i=1$ then exactly one of $a_i,b_i$ is set, so the majority is decided by the third input and $c_{i+1}=c_i$; if $S_i=0$ then $a_i=b_i$ and they outvote $c_i$, so $c_{i+1}=a_i$. Hence

$$p_i=S_i\oplus c_i,\qquad c_{i+1}=\begin{cases}c_i,&S_i=1\\ a_i,&S_i=0\end{cases}$$

and that second line **is** the AMD carry cell: a 2:1 multiplexer selected by a propagate signal, with the LUT supplying the data input. This is the same $(S,DI)$ interface that [[RCA, Ripple-Carry Adder]] presents to a CARRY4/CARRY8 column; the tile is not borrowing an adder, it is an adder whose operands happen to be AND gates.

> [!important] The tile costs one LUT per bit, not two, because both carry-cell inputs are functions of the same four variables
> Stage $i$ must produce $S_i=x_iy_0\oplus x_{i-1}y_1$ *and* $D_i=x_iy_0$. Both depend on $\{x_i,x_{i-1},y_0,y_1\}$ and on nothing else — four variables, well under the six a LUT6 addresses. A LUT6 fed with $\le5$ distinct inputs fractures into two LUT5s sharing those inputs ([[Lookup-Tables]], §4.1.2), so $O6$ can carry $S_i$ and $O5$ can carry $D_i$ out of a **single** LUT6. Without that fracture the tile would cost $2(k+1)$ LUTs, its efficiency would top out below $2/2.55\approx0.78$, and it would lose to every tile in the table.

**Price the tile the way the tiler does.** A tile's cost is not only what it occupies but the compression its output row causes downstream, since the $w_s$ result bits must still be merged into the multiplier's bit heap (8.40, p. 229):

$$\mathrm{cost}^\mathrm{LUT}_s=\#\mathrm{LUT}^\mathrm{mult}_s+\#\mathrm{LUT}^\mathrm{comp}\cdot w_s,\qquad \#\mathrm{LUT}^\mathrm{comp}=0.55\ \text{LUT/bit on AMD}.$$

Here $\#\mathrm{LUT}^\mathrm{mult}=k+1$ and $w_s=k+2$, so $\mathrm{cost}^\mathrm{LUT}_{2\times k}=(k+1)+0.55(k+2)=1.55k+2.1$, and $\mathrm{cost}^\mathrm{DSP}=0$. The area is the tile's bit count, $2k$. With $E_s=\mathrm{area}_s/\mathrm{cost}_s$ (8.41, p. 229):

$$E_{2\times k}=\frac{2k}{(k+1)+(k+2)\cdot0.55}=\frac{2k}{1.55k+2.1}.$$

**Find where it overtakes the LUT-only tiles.** The best LUT-only shape is the $2\times3$, at $E=1.04$ — it beats the $3\times3$'s $0.97$ because the $3\times3$ burns one LUT6 per output bit while the $2\times3$ packs three LUT6 as pairs of LUT5 ([[LUT-Based Multiplier Tiles]]). Setting $2k>1.04(1.55k+2.1)$ gives $0.388k>2.184$, i.e. $k>5.63$, so **$k=6$ is the first carry-chain tile worth using**: $E_{2\times6}=12/11.4\approx1.05$. Below that the chain is a liability — $E_{2\times5}\approx1.02$, $E_{2\times3}\approx0.89$ — because the two constants $+1$ LUT and $+2$ output bits are amortised over too few columns. Above it $E$ rises monotonically ($\mathrm{d}E/\mathrm{d}k=4.2/(1.55k+2.1)^2>0$) toward

$$\lim_{k\to\infty}E_{2\times k}=\frac{2}{1.55}=1.29,$$

the ratio of two area bits per column to the $1+0.55$ LUTs a column costs. A $2\times24$ tile, the shape FloPoCo picks to fill the strip under a DSP in a $24\times24$ multiplier, already reaches $48/39.3\approx1.22$.

**The signed case is where the name Baugh–Wooley earns itself.** In [[Multiplier Tiling]] only the tiles touching an operand's MSB are signed in that dimension; every interior tile multiplies unsigned by unsigned, and the entity below is that interior case. A tile that does touch the MSB needs the [[Baugh-Wooley Multiplier]] treatment in that dimension — the affected bit-products are complemented by the identity $-z=\bar z+1$ and the resulting constants are folded into the heap ([[Number Formats]] for the two's-complement basis). Complementing costs nothing here: $\overline{x_iy_0}$ is still a function of the same four variables, so it is absorbed into the same LUT6 truth table, and only the constant-one corrections reach the bit heap.

**On ASIC the same drawing is a bad idea.** Strip the FPGA and this structure is a $(k+1)$-bit [[RCA, Ripple-Carry Adder]] fed by $2k$ AND gates — one row-pair of an array multiplier, with $\Theta(k)$ carry-propagation delay sitting in front of the compressor tree. That is exactly what an ASIC multiplier is built to avoid: it keeps every partial product in carry-save form and defers all propagation to a single final adder. The tile is worth building only because $\tau_{CC}\ll\tau_L$ on an FPGA, so its delay is roughly $\tau_L+(k+1)\tau_{CC}$ — about one LUT delay plus a chain traversal that is cheap by construction. **This tile is an FPGA artefact, not an arithmetic discovery.**

$$\boxed{\ \mathrm{cost}^\mathrm{LUT}_{2\times k}=1.55k+2.1,\qquad E_{2\times k}=\frac{2k}{1.55k+2.1},\qquad E_{2\times 6}\approx1.05\ \nearrow\ 1.29\ }$$

**When it breaks.**

- **$k\le5$ loses to the LUT-only tiles.** The $+1$ LUT for the extra column and the $+2$ output bits are fixed overheads; at $k=1$ the tile costs $3.65$ LUT for area 2, an efficiency of $0.55$, worse than the $1\times1$ gap-filler.
- **$E$ has no maximum, and the cost model has no delay term.** Because $E_{2\times k}$ increases in $k$ without bound below $1.29$, a tiling ILP given the shape family unconstrained will always prefer the widest tile that fits. Nothing in the objective penalises the $(k+1)$-stage chain that widening buys.
- **The chain is not routable anywhere.** $k+1$ carry stages must occupy $\lceil (k+1)/4\rceil$ contiguous CARRY4 blocks in **one** slice column, so a wide tile is a hard placement constraint, not just an area number. A $2\times k$ and its transpose $k\times2$ are the same cost but not the same floorplan.
- **The chain is a contended resource.** The final adder, the sign-extension logic and any carry-chain compressor in the same design want the same columns; the tiler's cost model prices LUTs and DSPs, not chains.
- **$0.55$ LUT/bit is an AMD measurement.** Intel ALMs fracture differently and offer shared-arithmetic mode; the crossover $k=6$ and the limit $1.29$ both move with $\#\mathrm{LUT}^\mathrm{comp}$, and both are meaningless on a device without a fast carry chain.
- **A Booth-based $2\times k$ tile exists and leaves the chain free.** Mapping the recoding and the partial-product generation into one LUT per bit ([[Booth's Algorithm]]; [Wal14; KAZ15; Wal16], p. 231) realises the same shape without the carry chain, which matters precisely when the chain is the contended resource.

**The RTL states the two-row addition; the mapping is the vendor tool's job.** The entity below is the interior (unsigned $\times$ unsigned) tile, generic in $k$.

```spade
/// A 2 x k multiplier tile: X on k bits times Y on 2 bits, k+2 bits out.
/// Column i of the sum has input cone {x_i, x_{i-1}, y_0, y_1} -- one LUT6 --
/// and the addition itself is the fast carry chain.
fn tile2k<#uint K>(x: uint<K>, y: uint<2>) -> uint<{K + 2}> {
    let yb = y.as_bits();
    let m0: uint<K> = if yb[0] { x } else { 0 };
    let m1: uint<K> = if yb[1] { x } else { 0 };
    let r0: uint<{K + 2}> = zext(m0);
    let m1z: uint<{K + 2}> = zext(m1);
    r0 +. (m1z << 1)
}
```

`m0` is the row $a_{k-1}\dots a_0$ of the diagram and `m1z << 1` is the row $b_k\dots b_1$ already shifted into its column, so the single `+.` is the whole dashed carry-chain box: $k+1$ mux/XOR stages, with $c_{\mathrm{in}}$ tied to $0$ by construction. The widths are forced rather than grown — both rows are zero-extended to $K+2$ first and the truncating `+.` keeps them there, which is safe because $3(2^K-1)<2^{K+2}$, whereas the widening `+` would have produced a spurious $K+3$-rd bit. Everything is combinational: a `fn` cannot contain `reg`, and the tile has no state. What synthesis does differently from the drawing is the entire mapping — nothing here names a LUT6 or a CARRY8, and the $\mathrm{if}$/`+.` pair is what the vendor tool is expected to recognise as one LUT and one carry stage per column; whether it actually spends $k+1$ LUTs or $2(k+1)$ is exactly what $E_{2\times k}$ is asserting.

**Related notes.**

- [[Multiplier Tiling]] – depends-on: supplies the rectangle, the coverage-without-overlap rule and the ILP that this tile is a shape in.
- [[LUT-Based Multiplier Tiles]] – compares: the $1\times1$, $1\times2$, $2\times3$ and $3\times3$ tiles this one has to beat, and the $E=1.04$ bar it clears at $k=6$.
- [[Lookup-Tables]] – depends-on: the LUT6-as-two-LUT5 fracture is what makes the tile cost $k+1$ LUTs instead of $2(k+1)$.
- [[RCA, Ripple-Carry Adder]] – extends: the tile is an RCA whose operands are AND gates, presenting the same $(S,DI)$ interface to the carry chain.
- [[Baugh-Wooley Multiplier]] – extends: supplies the complemented bit-products and constant corrections a tile needs once it touches an operand's MSB.
- [[Unsigned Array Multiplier]] – depends-on: the double sum whose $2\times k$ sub-rectangle this tile computes.
- [[Booth's Algorithm]] – counter-example: a $2\times k$ tile of the same shape that does *not* use the carry chain, which is preferable when the chain is contended.
- [[DSP Super-Tile]] – compares: the other end of the library, where efficiency is bought with hard blocks instead of slices.
- [[Truncated Multipliers]] – extends: the refined truncated-tiling model exists largely so that efficient $2\times k$ tiles can replace wasteful $1\times1$s inside the kept region.
- [[Choosing a Multiplier]] – compares: where a LUT+carry-chain construction sits against DSP and Karatsuba constructions.
- [[FPGAs]] – depends-on: the fast carry chain and the $\tau_{CC}\ll\tau_L$ inequality are the tile's entire reason to exist.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 8.

- §8.4.2.1 Cost and efficiency, p. 229 — (8.40) $\mathrm{cost}^\mathrm{LUT}_s$, (8.41) $E_s$, $\#\mathrm{LUT}^\mathrm{comp}=0.55$ LUT/bit on AMD.
- §8.4.2.2 LUT-based sub-multipliers, pp. 229–230 — Table 8.3 (the $2\times k$ row), Fig. 8.15(e) tile shape, the $2\times3$ at $E=1.04$.
- §8.4.2.3 Multiplier tiles utilizing the fast carry chain, p. 231 — Fig. 8.16 slice mapping, $E_{2\times k}=2k/(1.55k+2.1)$, $E=1.05$ at $k=6$, $E\to1.29$, the Booth-based alternative [Wal14; KAZ15; Wal16].
- §8.4.3 Solving the tiling problem, pp. 233–236 — the ILP the tile is a shape in; Fig. 8.20, p. 237 uses three $2\times24$ tiles.
- §8.5.2 Optimal tiling for truncated multipliers, pp. 241–243 — $2\times k$ tiles replacing $1\times1$s in the refined model.
