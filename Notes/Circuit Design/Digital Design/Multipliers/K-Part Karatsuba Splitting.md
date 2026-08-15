---
title: "K-Part Karatsuba Splitting"
description: "Split both operands into K chunks and apply the pairing identity to every same-weight pair, reusing each diagonal sub-product more than once: saves the triangle of K(K-1)/2 multiplications."
kind: circuit
source: "ASA §8.6.4, pp. 246-248"
status: seed
spade: simulated
tags: [digital, multipliers, karatsuba, dsp, tiling, fpga]
aliases:
  - K-Part Splitting
  - Square K-Part Splitting
  - K-Part Karatsuba
  - Multi-Part Karatsuba
---

# K-Part Karatsuba Splitting

The flat generalisation of Karatsuba to $K$ chunks per operand, and the only variant in which a diagonal sub-product $X_iY_i$ is amortised over more than one pairing — which is why its saving grows with $K$ while the two-part split's does not.

```tikz title="Tiling of the square K-part Karatsuba splitting for K=3 and K=4"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.68cm,y=0.68cm,font=\small]
  % ================= K = 3 =================
  \foreach \i in {0,1,2} \foreach \j in {0,1,2}
    \draw[fill=black!7,draw=black!35] ({1.5-\i},{-0.5-\j}) rectangle ({2.5-\i},{0.5-\j});
  \draw[thick] (-0.5,0.5) rectangle (2.5,-2.5);
  % linked pairs (i<j): one multiplier each
  \foreach \i/\j in {0/1,0/2,1/2}
    \draw[thick] ({2-\i},{-\j}) -- ({2-\j},{-\i});
  \foreach \i/\j in {0/1,0/2,1/2} {
    \draw[fill=white] ({2-\i-0.17},{-\j-0.17}) rectangle ({2-\i+0.17},{-\j+0.17});
    \draw[fill=white] ({2-\j-0.17},{-\i-0.17}) rectangle ({2-\j+0.17},{-\i+0.17});
  }
  % reused diagonal products
  \foreach \i in {0,1,2}
    \fill ({2-\i-0.17},{-\i-0.17}) rectangle ({2-\i+0.17},{-\i+0.17});
  \foreach \i in {0,1,2} \node[font=\footnotesize] at ({2-\i},0.95) {$X_\i$};
  \foreach \j in {0,1,2} \node[font=\footnotesize] at (2.95,{-\j}) {$Y_\j$};
  \node[font=\footnotesize] at (1,-4.35) {(a) $K=3$};
  \node[font=\footnotesize] at (1,-5.05) {$3+3=6$ mult.\ (of $9$)};

  % ================= K = 4 =================
  \foreach \i in {0,1,2,3} \foreach \j in {0,1,2,3}
    \draw[fill=black!7,draw=black!35] ({9.5-\i},{-0.5-\j}) rectangle ({10.5-\i},{0.5-\j});
  \draw[thick] (6.5,0.5) rectangle (10.5,-3.5);
  \foreach \i/\j in {0/1,0/2,0/3,1/2,1/3,2/3}
    \draw[thick] ({10-\i},{-\j}) -- ({10-\j},{-\i});
  \foreach \i/\j in {0/1,0/2,0/3,1/2,1/3,2/3} {
    \draw[fill=white] ({10-\i-0.17},{-\j-0.17}) rectangle ({10-\i+0.17},{-\j+0.17});
    \draw[fill=white] ({10-\j-0.17},{-\i-0.17}) rectangle ({10-\j+0.17},{-\i+0.17});
  }
  \foreach \i in {0,1,2,3}
    \fill ({10-\i-0.17},{-\i-0.17}) rectangle ({10-\i+0.17},{-\i+0.17});
  \foreach \i in {0,1,2,3} \node[font=\footnotesize] at ({10-\i},0.95) {$X_\i$};
  \foreach \j in {0,1,2,3} \node[font=\footnotesize] at (10.95,{-\j}) {$Y_\j$};
  \node[font=\footnotesize] at (8.5,-4.35) {(b) $K=4$};
  \node[font=\footnotesize] at (8.5,-5.05) {$6+4=10$ mult.\ (of $16$)};

  % ================= legend =================
  \fill (-0.5,-5.6) rectangle (-0.16,-5.94);
  \node[anchor=west,font=\footnotesize] at (0.1,-5.77)
    {black: diagonal $X_iY_i$, one $w\!\times\!w$ mult., $2w$ bits, reused $K-1$ times};
  \draw[fill=white] (-0.5,-6.6) rectangle (-0.16,-6.94);
  \draw[thick] (-0.16,-6.77) -- (0.55,-6.77);
  \draw[fill=white] (0.55,-6.6) rectangle (0.89,-6.94);
  \node[anchor=west,font=\footnotesize] at (1.15,-6.77)
    {linked pair: one $(w\!+\!1)\!\times\!(w\!+\!1)$ mult., $2w\!+\!2$ bits, $+2$ pre-adds};
  \node[anchor=west,font=\footnotesize] at (-0.5,-7.7)
    {operands $Kw$ bits, product $2Kw$ bits; cells on one link share weight $2^{(i+j)w}$};
\end{circuitikz}
\end{document}
```

*after Fig. 8.27a–b, p. 248.*

**Cut both operands into $K$ chunks and the product becomes a $K\times K$ grid.** Write each $Kw$-bit operand in radix $2^w$, $X=\sum_{i=0}^{K-1}2^{iw}X_i$ and $Y=\sum_{j=0}^{K-1}2^{jw}Y_j$ with every chunk $X_i,Y_j$ on $w$ bits, and apply **distributivity of $\times$ over $+$** once per factor (8.57–8.58, p. 246):

$$X\times Y=\Big(\sum_{i=0}^{K-1}2^{iw}X_i\Big)\times\Big(\sum_{j=0}^{K-1}2^{jw}Y_j\Big)=\sum_{i,j}2^{(i+j)w}X_iY_j$$

That is $K^2$ sub-products, each $w\times w\to 2w$ bits, and a $2Kw$-bit result. Geometrically it is nothing but the $Kw\times Kw$ rectangle of [[Multiplier Tiling]] cut into $K^2$ equal squares — the diagram's grid, with $X$ indexed right-to-left so that column $i$ carries weight $2^{iw}$.

**Same weight is the only condition a pairing needs.** Term $(i,j)$ enters the sum at weight $2^{(i+j)w}$, so two terms may be added *before* multiplication exactly when $i+j=k+\ell$ — a purely geometric statement: cells on a common anti-diagonal of the grid. The transposed pair $(i,j)$ and $(j,i)$ is the cheapest instance, and for it the two-part identity applies verbatim with the indices $0,1$ replaced by $i,j$ (8.59, p. 246):

$$X_iY_j+X_jY_i=(X_i+X_j)(Y_i+Y_j)-X_iY_i-X_jY_j$$

Expanding the right-hand product by distributivity gives $X_iY_i+X_iY_j+X_jY_i+X_jY_j$; the two unwanted terms are precisely the diagonal cells $(i,i)$ and $(j,j)$, so subtracting them leaves the pair. Two multiplications become one, exactly as in [[Karatsuba]].

**The diagonal products amortise — this is the whole gain over $K=2$.** In two-part splitting the corrections $M1$ and $M4$ are each consumed once, by the single pairing, so three multipliers out of four is the end of it. Here the same $X_iY_i$ appears in the correction of every pairing $(i,j)$ with $j\ne i$ — there are $K-1$ of them — yet it is **computed once**. The correction terms therefore cost $K$ multipliers no matter how many pairings are formed, and each of the $\binom{K}{2}$ pairings costs exactly one multiplier of its own:

$$\#\text{mult}=\underbrace{K}_{\text{black squares}}+\underbrace{\frac{K(K-1)}{2}}_{\text{linked pairs}}=\frac{K(K+1)}{2}$$

so $K$-part splitting saves the **triangle** of $K(K-1)/2$ multiplications out of $K^2$: $9\to6$ at $K=3$, $16\to10$ at $K=4$, $36\to21$ at $K=6$ (p. 247).

**Count the picture, not the algebra.** For $K=3$ the expansion (8.60)–(8.62) is still writable by hand: group the nine terms by weight, notice that $2^{w}$, $2^{2w}$ and $2^{3w}$ each carry a transposed pair, and rewrite each pair. Beyond that the algebra becomes unpleasant while the drawing does not, and the book's stated procedure is graphical — *number of sub-multipliers = number of linked pairs + number of black squares* (p. 247). The diagram's two panels are that count performed by eye. It also makes the whole construction a single **multi-part tile** that the tiling ILP can place, rather than a special case bolted onto the multiplier generator.

**The saving saturates at one half, so flat splitting is still quadratic.** The fraction of multipliers kept is

$$\frac{K(K+1)/2}{K^2}=\frac{K+1}{2K}\ \xrightarrow[K\to\infty]{}\ \frac12$$

$3/4$ at $K=2$, $2/3$ at $K=3$, $5/8$ at $K=4$, $7/12$ at $K=6$ — monotonically decreasing but bounded below by $1/2$. Flat $K$-part splitting is therefore $\Theta(K^2)$ sub-multipliers with a constant factor approaching $1/2$, never sub-quadratic; the $\Theta(w^{\log_23})$ exponent only returns when the identity is applied to the sub-multipliers themselves, which is [[Recursive Karatsuba]].

**On an FPGA the DSP efficiency has a closed form, and it says $K=2$ is a loss.** Score the pattern with the tiling metric $E^\mathrm{DSP}$ — area covered per DSP consumed ([[Multiplier Tiling]]). A $K$-part square split built from $w\times w$ tiles covers $(Kw)^2$ bit positions with $K(K+1)/2$ DSPs, so

$$E^\mathrm{DSP}=\frac{(Kw)^2}{K(K+1)/2}=\frac{2Kw^2}{K+1}$$

With $w=17$, i.e. a DSP48E1 forced into a square $17\times17$ shape, this gives $385.3$, $433.5$ and $462.4$ for $K=2,3,4$ — against $408$ for simply using the same block in its native $17\times24$ form (Table 8.5, p. 254). Requiring $2Kw^2/(K+1)>408$ gives $K>408/(2\cdot289-408)=408/170=2.4$, hence $K\ge3$: **two-part Karatsuba on square DSP tiles is worse than not doing Karatsuba at all**, and the smallest square instance that pays is $3\cdot17=51$ bits wide. The ceiling as $K\to\infty$ is $2w^2=578$, a factor $578/408=1.42$ over plain tiling and no more.

> [!important] Squaring a rectangular DSP throws the gain away before Karatsuba starts
> The $17\times17$ figure above already discards $7/24=29\%$ of every DSP block. That loss, not the pairing identity, is what makes $K=2$ negative: the identity removes $25\%$ of the multipliers while the square shaping removes $29\%$ of each one's capacity. Keep the block rectangular and 2-part pairing pays immediately — $E^\mathrm{DSP}=512>408$ at $16\times24$ — which is the entire motivation for [[Rectangular Karatsuba]].

**Pre-additions are the price, and unlike post-additions they cannot be hidden.** Each pairing needs two pre-additions $X_i+X_j$ and $Y_i+Y_j$, so a $K$-part split carries $K(K-1)$ of them: $6$ at $K=3$, $12$ at $K=4$, $30$ at $K=6$, matching the book's counts of $6/6/6$ at $51\times51$, $10/12/22$ at $68\times68$ and $21/30/51$ at $102\times102$ (mult / pre-add / post-add, Table 8.6, p. 254). Post-additions are extra terms dropped into the [[Sums of Weighted Bits|bit heap]] and are absorbed by the compressor tree in carry-save form at near-zero marginal cost — note they grow faster than the multipliers do ($22$ post-adds for $10$ multipliers at $K=4$). Pre-additions sit **in front of** the multiplier and must carry-propagate over $w+1$ bits before the first partial product exists, so they land directly on the critical path ([[Adders]]). What flat splitting buys against recursion is that all $K(K-1)$ of them are **mutually independent** — one pre-adder delay regardless of $K$ — whereas recursive application stacks them in sequence.

**Track the widths or the correction overflows.** $X_i+X_j$ is $w+1$ bits, so the pairing multiplier is $(w+1)\times(w+1)\to2w+2$ bits, one bit wider in each dimension than the $w\times w$ tiles it replaces — the reason a $17\times17$ DSP cannot host a pairing for $w=17$ chunks. The value finally needed, $X_iY_j+X_jY_i\le2(2^w-1)^2<2^{2w+1}$, fits on $2w+1$ bits; the extra bit exists only inside the product, before the two diagonal terms are subtracted. Every quantity here is non-negative, so the datapath is unsigned throughout — swap the pre-additions for pre-subtractions and that spare bit becomes a sign bit instead, which is what [[Subtractive Karatsuba]] exploits on natively-signed [[DSP Blocks]].

$$\boxed{\ XY=\sum_{i=0}^{K-1}2^{2iw}X_iY_i+\sum_{0\le i<j\le K-1}2^{(i+j)w}\Big[(X_i{+}X_j)(Y_i{+}Y_j)-X_iY_i-X_jY_j\Big],\qquad \frac{K(K+1)}{2}\ \text{mult.}\ }$$

**When it breaks.**

- **$K=2$ with square tiles is a net loss** ($E^\mathrm{DSP}=385.3<408$). The method needs $K\ge3$, i.e. $51\times51$ and up, before it beats doing nothing.
- **The gain never exceeds a factor 2.** $(K+1)/2K\ge1/2$ for every $K$, so no amount of flat splitting reaches the $\Theta(w^{1.585})$ that gives Karatsuba its reputation — that needs recursion, and recursion costs sequential pre-adder delay.
- **Post-additions outgrow the multipliers.** $22$ post-adds for $10$ multipliers at $K=4$, $51$ for $21$ at $K=6$. Where LUTs rather than DSPs are the scarce resource, the compressor tree they feed can cost more than the multipliers saved.
- **The pattern demands equal chunks.** $w$ must divide both operand widths; otherwise you pad, and padded chunks make some sub-products structurally zero — at which point a general ILP tiling beats the fixed pattern, because it can place unequal tiles.
- **The pairing multiplier is $(w+1)$-wide.** If $w$ is chosen to saturate a hard multiplier exactly, every pairing overflows it and either spills into logic or forces $w$ down by one, giving back part of the saving.
- **The derivation assumes unsigned chunks.** In a two's-complement split only the top chunk is signed; the identity survives, but the chunk formats and the sign handling of the sub-multipliers do not — see [[Signed DSP Multiplier Packing]].
- **Pre-adder delay is unhidden if the block has no hard pre-adder.** On a DSP48E1 the pre-adder is inside the block and effectively free; on a device without one, $K(K-1)$ carry-propagate adds are built from LUTs and carry chains ahead of the multiplier and dominate the register-to-register path.

**RTL (Spade).**

```spade
/// One Karatsuba pairing (8.59): recovers X_i*Y_j + X_j*Y_i from a single
/// (W+1)x(W+1) multiplier plus the two diagonal products, which are computed
/// once and reused by every pair that touches them.
fn kpair<#uint W>(
    xi: uint<W>, xj: uint<W>,
    yi: uint<W>, yj: uint<W>,
    dii: uint<{2 * W}>, djj: uint<{2 * W}>,
) -> uint<{2 * W + 2}> {
    let m: uint<{2 * W + 2}> = (xi + xj) * (yi + yj);
    let a: uint<{2 * W + 2}> = zext(dii);
    let b: uint<{2 * W + 2}> = zext(djj);
    m -. a -. b
}

/// 3-part square Karatsuba, w = 4: a 12x12 product from six multipliers
/// instead of nine. Eq. (8.62).
fn kara3_12(x: uint<12>, y: uint<12>) -> uint<24> {
    let xb = x.as_bits();
    let yb = y.as_bits();
    let x0 = xb[0..4].as_uint();
    let x1 = xb[4..8].as_uint();
    let x2 = xb[8..12].as_uint();
    let y0 = yb[0..4].as_uint();
    let y1 = yb[4..8].as_uint();
    let y2 = yb[8..12].as_uint();

    // three diagonal products (black squares), each reused by two pairings
    let d0: uint<8> = x0 * y0;
    let d1: uint<8> = x1 * y1;
    let d2: uint<8> = x2 * y2;

    // three pairings (linked squares), one multiplier each
    let p01 = kpair::<4>(x0, x1, y0, y1, d0, d1);
    let p02 = kpair::<4>(x0, x2, y0, y2, d0, d2);
    let p12 = kpair::<4>(x1, x2, y1, y2, d1, d2);

    let t0: uint<24> = zext(d0);
    let t1: uint<24> = zext(p01);
    let t2a: uint<24> = zext(p02);
    let t2b: uint<24> = zext(d1);
    let t3: uint<24> = zext(p12);
    let t4: uint<24> = zext(d2);

    t0 +. (t1 << 4) +. ((t2a +. t2b) << 8) +. (t3 << 12) +. (t4 << 16)
}
```

`d0`,`d1`,`d2` are the diagram's three black squares and `p01`,`p02`,`p12` its three links, so six `*` operators appear where the schoolbook $3\times3$ grid would need nine. Widths follow the text exactly: chunks are `uint<4>`, diagonals `uint<8>` $=2w$, and `kpair` returns `uint<{2*W+2}>` because `xi + xj` widens to $W+1$ and `*` doubles — the two `-.` are the truncating subtractions, safe because the mathematical result is non-negative and needs only $2w+1$ bits. The shifts `<< 4, << 8, << 12, << 16` are the weights $2^{(i+j)w}$, and `t2a +. t2b` is the one column where a pairing and a diagonal collide at $2^{2w}$, exactly as in (8.62). All of it is combinational — these are `fn`s, and Spade forbids `reg` inside one — but synthesis will not build the drawn chain of `+.`: it flattens the five weighted terms into a single [[Sums of Weighted Bits|bit heap]] and compresses them together, so the post-additions cost far less than the source line suggests, while the six `+` pre-additions inside `kpair` stay stubbornly in series with their multipliers.

**Related Notes.**

- [[Karatsuba]] – extends: the $K=2$ case, whose identity this note re-indexes by $(i,j)$ and applies $K(K-1)/2$ times.
- [[Multiplier Tiling]] – depends-on: the $K\times K$ grid is that rectangle cut into squares, and $E^\mathrm{DSP}$ is its cost metric.
- [[Recursive Karatsuba]] – compares: nine multipliers for $4w\times4w$ against ten here, bought with two pre-additions in sequence.
- [[Rectangular Karatsuba]] – extends: lifts the square-tile restriction, so a $17\times24$ DSP is no longer used as $17\times17$ and $K=2$ starts paying.
- [[Subtractive Karatsuba]] – compares: the same pairing with pre-subtractions, turning the extra bit into a sign bit.
- [[Sums of Weighted Bits]] – supports: where the post-additions go for nearly free, and why only the pre-additions show up in the delay.
- [[DSP Blocks]] – depends-on: the $17\times24$ shape and hard pre-adder that decide every number in this note.
- [[Signed DSP Multiplier Packing]] – counter-example: what the unsigned-chunk assumption costs once the top chunk is signed.
- [[Choosing a Multiplier]] – compares: where this sits against plain tiling, Booth recoding and truncation at a given width.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Chapter 8, "Fixed-Point Multiplication":

- §8.6.3 "Tile Representation", p. 246 — black squares and linked empty squares as a tile the tiling approach can place.
- §8.6.4 "Square K-Part Splitting", pp. 246–248 — eqs. (8.57)–(8.58) p. 246, the pairing identity (8.59) p. 246, the 3-part expansion (8.60)–(8.62) p. 247, the graphical counting rule and the $K(K-1)/2$ triangle p. 247, Fig. 8.27 p. 248 ($K=3,4,6$ tilings).
- §8.6.5 "Recursive Karatsuba", pp. 247–248 — nine versus ten multipliers at $4w\times4w$, and pre-additions in sequence.
- §8.6.7 "Karatsuba with Rectangular Sub-multipliers", pp. 249–250 — why a $17\times17$ shaping under-uses a $17\times24$ DSP block.
- Tables 8.5–8.6, p. 254 — $E^\mathrm{DSP}$ of $385.3/433.5/462.4$ for square 2/3/4-part against $408$ for plain DSP tiling, and the multiplier / pre-addition / post-addition counts at $51\times51$, $68\times68$ and $102\times102$.
