---
title: "DSP Super-Tile"
description: "Two 17x24 DSP blocks chained through the dedicated post-adder routing — legal only at relative shifts of 0 or 17 bits — doubling LUT efficiency at the cost of one pipeline stage."
kind: circuit
source: "ASA §8.4.2.4, pp. 231-233 (Fig. 8.17 and Table 8.3, p. 229)"
status: seed
spade: simulated
tags: [digital, multipliers, fpga, dsp, tiling]
aliases:
  - Super-Tile
  - Super-tile
  - Supertile
  - DSP Supertile
  - DSP Super-tile
---

# DSP Super-Tile

A super-tile is two DSP blocks fused into a single tile by the dedicated
`PCOUT`→`PCIN` cascade between them, which makes it the only multi-DSP tile
whose partial products never touch the fabric.

```tikz title="The two legal DSP super-tile geometries: relative shift 0 and relative shift 17"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[x=0.13cm,y=0.13cm]

  % ---- (a) shift 0 : two portrait 17x24 tiles ----
  \begin{scope}
    \fill[black!8] (0,0) rectangle (17,24);
    \draw[thick]   (0,0) rectangle (17,24);
    \fill[black!8] (17,-17) rectangle (34,7);
    \draw[thick]   (17,-17) rectangle (34,7);
    \node at (8.5,12)   {\small $17\!\times\!24$};
    \node at (25.5,-5)  {\small $17\!\times\!24$};
    \node at (8.5,8)    {\scriptsize 41 b};
    \node at (25.5,-9)  {\scriptsize 41 b};
    \draw[->,>=latex,dashed] (17,24) -- (34,7);
    \fill (17,24) circle (0.9); \fill (34,7) circle (0.9);
    \node[anchor=west] at (26,18) {\scriptsize $(17,-17)$};
    \node at (17,-25) {\small (a)\ \ $\Delta x+\Delta y=0$};
    \node at (17,-30) {\small aligned post-add, $w_R=42$ b};
  \end{scope}

  % ---- (f) shift 17 : two landscape 24x17 tiles ----
  \begin{scope}[xshift=5.9cm]
    \fill[black!8] (0,0) rectangle (24,17);
    \draw[thick]   (0,0) rectangle (24,17);
    \fill[black!8] (24,-7) rectangle (48,10);
    \draw[thick]   (24,-7) rectangle (48,10);
    \node at (12,9)   {\small $24\!\times\!17$};
    \node at (36,3)   {\small $24\!\times\!17$};
    \node at (12,5)   {\scriptsize 41 b};
    \node at (36,-1)  {\scriptsize 41 b};
    \draw[->,>=latex,dashed] (24,17) -- (48,10);
    \fill (24,17) circle (0.9); \fill (48,10) circle (0.9);
    \node[anchor=south] at (37,14) {\scriptsize $(24,-7)$};
    \node at (24,-25) {\small (f)\ \ $\Delta x+\Delta y=17$};
    \node at (24,-30) {\small $17$-bit cascade shift, $w_s=58$ b};
  \end{scope}

  % ---- axes legend ----
  \path (0,29);
  \draw[->,>=latex] (0,-48) -- (14,-48) node[right] {\small $x$: bit index in $X$};
  \draw[->,>=latex] (0,-48) -- (0,-38) node[above] {\small $y$: bit index in $Y$};

\end{circuitikz}
\end{document}
```

*After Fig. 8.17, p. 232 — panels (a) and (f) of the twelve, the one representative
of each legal shift.*

**Turn "can these two DSPs be chained?" into a lattice condition.** In
[[Multiplier Tiling]] a tile placed on the partial-product board contributes its
sub-product at weight $2^{x+y}$, where $(x,y)$ is its corner. Two tiles $A$ and
$B$ therefore differ in output weight by exactly $2^{\Delta x+\Delta y}$, where
$(\Delta x,\Delta y)$ is the vector between their two corresponding corners — the
book measures it upper-right to upper-right (p. 232). Adding the two sub-products
inside the DSPs means the second product must enter the first one's post-adder
already shifted by $\Delta x+\Delta y$ bits. The geometry of the placement and the
shift the hardware must perform are the *same number*, which is why the legality
test is purely a picture: in Fig. 8.17a the vector is $(17,-17)$ and the sum is
$0$; in Fig. 8.17f it is $(24,-7)$ and the sum is $17$.

**Why the alphabet of legal shifts has exactly two letters.** The AMD DSP48E1
cascade path carries the 48-bit `PCOUT` of one slice into the `PCIN` of the next,
and the only thing that path can do to the value on the way is a hardwired
right-shift of 17 (see [[DSP Blocks]]). It is a dedicated route, not fabric: there
is no shifter to program, so $\Delta x+\Delta y \in \{0,17\}$ and nothing else
(p. 232). Any other relative placement of two DSP tiles is still a valid *tiling* —
it is simply not a super-tile, and its two 41-bit products go out to the
compressor tree separately. Fig. 8.17 enumerates all twelve two-DSP shapes that
pass the test: (a)–(d) at shift $0$, (e)–(l) at shift $17$.

**Read the output widths off the same picture.** A DSP48E1 is a signed
$25\times18$ multiplier, so used unsigned it is a $24\times17$ tile and each
product is $w=41$ bits. At shift $0$ the two products are aligned and one carry
bit appears: $w_R = 17+24+1 = 42$. At shift $17$ the products span bit $0$ up to
bit $57$, so $w_s = 17+17+24 = 58$ (p. 232). That the shifted case needs *no*
extra carry bit is worth checking rather than assuming, because the naive bound
fails: if each product could reach $2^{41}-1$, the sum $(2^{41}-1)(2^{17}+1)$
would exceed $2^{58}$ and demand 59 bits. It cannot. The largest unsigned
$24\times17$ product is
$$P_{\max}=(2^{24}-1)(2^{17}-1)=2^{41}-2^{24}-2^{17}+1,$$
by expanding the product, and the worst-case super-tile output is therefore
$$P_{\max}\,(2^{17}+1)=2^{58}-2^{34}-2^{24}+1\;<\;2^{58}$$
— the $2^{24}+2^{17}$ deficit the multiplier's own range leaves is more than
enough to absorb the carry. 58 bits is tight, not lucky.

**Account for the tile in the ILP's currency, and the doubling appears.** The
tiling cost model of [[Multiplier Tiling]] charges a tile
$\mathrm{cost}^\mathrm{LUT}_s=\#\mathrm{LUT}^\mathrm{mult}_s+\#\mathrm{LUT}^\mathrm{comp}\cdot w_s$
with $\#\mathrm{LUT}^\mathrm{comp}=0.55$ LUT/bit on AMD (p. 229). A DSP tile has
$\#\mathrm{LUT}^\mathrm{mult}=0$: every LUT it costs is compression of its own
output bits. A lone $24\times17$ tile emits 41 bits for $0.55\cdot41=22.55$ LUT
over an area of $408$. A super-tile emits **one** vector instead of two, because
the post-add already happened inside silicon — $0.55\cdot42=23.1$ LUT at shift
$0$, $0.55\cdot58=31.9$ at shift $17$ — over an area of $816$. The area doubled
and the LUT bill barely moved:

| tile | area | $\mathrm{cost}^\mathrm{LUT}$ | $\mathrm{cost}^\mathrm{DSP}$ | $E^\mathrm{LUT}$ | $E^\mathrm{DSP}$ |
| --- | --- | --- | --- | --- | --- |
| $24\times17$ | 408 | 22.55 | 1 | 18.13 | 408 |
| super-tile (a)–(d) | 816 | 23.1 | 2 | 35.32 | 408 |
| super-tile (e)–(l) | 816 | 31.9 | 2 | 25.58 | 408 |

*Table 8.3, p. 229.* Only the compression is charged, so $E^\mathrm{LUT}$ nearly
doubles for the aligned shapes — 82 bits into the compressor tree become 42.
$E^\mathrm{DSP}$ is unchanged at $408$: each DSP contributes the same area
whether it is chained or not (p. 233), so a super-tile never saves a DSP. It buys
**fabric**, which is why it only matters when the ILP is run in the practical
mode — cap `maxDSP`, minimise the remaining logic.

> [!warning] Table 8.3 prints $E^\mathrm{LUT}_{24\times17}=18.13$, but its own
> model gives $408/22.55=18.09$. The two super-tile rows are exact
> ($816/23.1=35.32$, $816/31.9=25.58$), so the single-tile entry looks like a
> transposed typo. Use $18.09$ if you are reproducing the crossover arithmetic.

**Pay for it in latency, once per link.** The cascade is the DSP's registered
`P`/`PCIN` path; using it means the second block's output arrives one clock after
the first's, so every chain link adds a pipeline stage (p. 232). The cost is
linear in chain length while the LUT saving is not — the second DSP removes 41
bits from the compressor tree, a third removes only its own 41 from an already
cheap total — so the book caps super-tiles at two DSPs and lets the ILP place
several independent super-tiles instead of one long chain. On an ASIC none of
this exists: there is no dedicated cascade, so two sub-products are simply two
more rows in the compressor tree and the whole notion of a legal shift set
evaporates.

**Signedness is inherited from position, not chosen.** Only the tiles that touch
an argument's MSB are signed in that dimension; interior tiles are unsigned
$\times$ unsigned regardless of the multiplier's signedness. A super-tile that
straddles the boundary therefore has one signed member and one unsigned member,
and the sign extension of the low product into the high product's field must be
handled before the post-adder — the same $Q=Q'+p_{w_P-1}$ correction used for DSP
sharing (pp. 225–226).

$$\boxed{\ \Delta x+\Delta y\in\{0,17\}\ \Longrightarrow\ E^\mathrm{LUT}=\frac{816}{0.55\,w_s},\quad w_s\in\{42,58\}\ }$$

**When it breaks.**

- Three or more DSPs in one chain: legal, but latency grows linearly while the
  marginal LUT saving shrinks. Two is the book's stopping point (p. 232).
- Any $\Delta x+\Delta y \notin \{0,17\}$: not a super-tile at all. Do not try to
  emulate the shift in fabric — you pay a shifter *and* still compress both
  vectors, which is strictly worse than two independent DSP tiles.
- Latency-critical combinational paths: the cascade register is not optional in
  practice. A purely combinational chain gives up the DSP's timing closure.
- Device drift: $17$ and $24\times17$ are DSP48E1 numbers. A different family
  (or an Intel/Altera DSP) has a different native tile and a different cascade
  shift, and every efficiency figure above moves with it.
- Small multipliers, $w_X,w_Y \lesssim 17$: the whole board fits in one DSP, or
  the $2\times k$ carry-chain tiles win outright. Super-tiles are a large-operand
  device.

**RTL.**

```spade
/// One AMD DSP48E1 used as an unsigned 24x17 tile: the product fits on 41 bits.
fn dsp_tile(x: uint<24>, y: uint<17>) -> uint<41> {
    let p: uint<48> = x * zext::<17, 24>(y);
    trunc(p)
}

/// Two DSP tiles chained through the dedicated post-adder path.
/// SH is the relative weight of the second tile: 0 or 17, nothing else routes.
/// W is the exact output width: 42 for SH=0, 58 for SH=17.
entity super_tile<#uint SH, #uint W>(
    clk: clock,
    xa: uint<24>, ya: uint<17>,
    xb: uint<24>, yb: uint<17>,
) -> uint<W> {
    let pa: uint<{SH + 42}> = zext(dsp_tile(xa, ya));
    let pb: uint<{SH + 42}> = zext(dsp_tile(xb, yb));
    let sh: uint<{SH + 42}> = SH;
    reg(clk) p: uint<W> = trunc(pa +. (pb << sh));
    p
}
```

`pa` is the left tile of each panel above, `pb` the right one, and `sh` is the
dashed corner vector's coordinate sum — the *only* free parameter the geometry
leaves. `SH` is a const generic, so `pb << sh` is a constant shift: synthesis
emits no barrel shifter, and on a real DSP48E1 it is not even wires but the
hardwired `PCIN` path. The single `reg(clk)` is the DSP's `P` register, the one
pipeline stage the chain costs. The width bookkeeping is where the drawing lies:
the internal sum is computed at $\mathrm{SH}+42$ bits and `trunc`'d to `W`, which
is safe only because of the $P_{\max}(2^{17}+1)<2^{58}$ bound derived above —
`trunc` would silently wrap otherwise.

**Related Notes.**

- [[DSP Blocks]] – depends-on: the `PCOUT`→`PCIN` cascade, its 17-bit hardwired
  shift and its `P` register are what make a super-tile a tile at all.
- [[Multiplier Tiling]] – extends: adds a two-DSP, sometimes non-rectangular
  shape to the ILP's tile set $\mathcal{S}$, with $\mathrm{cost}^\mathrm{DSP}=2$.
- [[Multipliers]] – compares: where DSP tiling sits against LUT tiles, Booth
  recoding and Karatsuba for a given operand width.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §8.4.2.1 Tile cost and efficiency metric — p. 229, eqs. (8.40)–(8.41), Table 8.3.
- §8.4.2.4 DSP-Based Sub-multipliers — pp. 231–233, Fig. 8.17 (all twelve
  two-DSP super-tiles), shift condition and output word sizes p. 232,
  $E^\mathrm{DSP}$ invariance p. 233.
- §8.4.2 DSP sharing and the sign correction $Q=Q'+p_{w_P-1}$ — pp. 225–226.
- §8.4.3 Solving the Tiling Problem — pp. 233–235, the `#DSP` constraint (8.42).
