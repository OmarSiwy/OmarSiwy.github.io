---
title: Karatsuba
description: "Recovers the middle column of a two-part split by subtraction instead of multiplication: three sub-multipliers instead of four, paid for with two pre-additions on the critical path."
kind: circuit
source: "ASA §8.6.1-8.6.3, pp. 244-246"
status: seed
spade: simulated
tags: [digital, multipliers, karatsuba, dsp, fpga]
aliases:
  - Karatsuba Multiplication
  - Karatsuba Multiplier
  - Karatsuba's Method
  - Two-Part Splitting
---

# Karatsuba

The first sub-quadratic multiplication method: it computes the middle column of a
two-part split by *subtracting* two products that were already going to be
computed, so three sub-multipliers do the work of four.

```tikz title="Two-part Karatsuba: operand split, the four sub-products, and the linked tile that replaces two of them"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.5cm,y=0.5cm]
  % ---------- (a) two-part splitting of both operands ----------
  \draw (0,15) rectangle (8,16);  \draw (4,15) -- (4,16);
  \draw (0,13) rectangle (8,14);  \draw (4,13) -- (4,14);
  \node at (2,15.5) {$X_1$};  \node at (6,15.5) {$X_0$};
  \node at (2,13.5) {$Y_1$};  \node at (6,13.5) {$Y_0$};
  \node[left] at (-0.3,15.5) {$X$};
  \node[left] at (-0.3,13.5) {$Y$};
  \draw[|-|] (0,16.8) -- (4,16.8) node[midway,above] {\small $w$};
  \draw[|-|] (4,16.8) -- (8,16.8) node[midway,above] {\small $w$};
  \node[right] at (8.6,15.5) {\small $=2^{w}X_1+X_0$};
  \node[right] at (8.6,13.5) {\small $=2^{w}Y_1+Y_0$};
  \node at (7,11.9) {\small (a) split both $2w$-bit operands};

  % ---------- (b) the four sub-products as tiles ----------
  \draw[very thick] (0,3) rectangle (6,9);
  \draw (3,3) -- (3,9);  \draw (0,6) -- (6,6);
  \node at (1.5,7.5) {M3};  \node at (4.5,7.5) {M1};
  \node at (1.5,4.5) {M4};  \node at (4.5,4.5) {M2};
  \node at (1.5,9.5) {$X_1$};  \node at (4.5,9.5) {$X_0$};
  \node[right] at (6.2,7.5) {$Y_0$};  \node[right] at (6.2,4.5) {$Y_1$};
  \node at (3,2.1) {\small (b) four $w\times w$ multipliers};

  % ---------- (c) the Karatsuba tile ----------
  \draw[very thick] (11,3) rectangle (17,9);
  \draw (14,3) -- (14,9);  \draw (11,6) -- (17,6);
  \draw (12.05,7.05) rectangle (12.95,7.95);
  \fill (15.05,7.05) rectangle (15.95,7.95);
  \fill (12.05,4.05) rectangle (12.95,4.95);
  \draw (15.05,4.05) rectangle (15.95,4.95);
  \draw (12.5,7.05) .. controls (13.6,6.3) and (14.4,5.7) .. (15.5,4.95);
  \node at (12.5,9.5) {$X_1$};  \node at (15.5,9.5) {$X_0$};
  \node[right] at (17.2,7.5) {$Y_0$};  \node[right] at (17.2,4.5) {$Y_1$};
  \node at (14,2.1) {\small (c) three multipliers};

  % ---------- legend ----------
  \draw (0.05,-0.25) rectangle (0.95,0.65);
  \node[anchor=west] at (1.4,0.2)
    {\small linked pair M2,M3 $\to$ one $(w{+}1)\times(w{+}1)$ multiplier, fed by $X_0{+}X_1$ and $Y_0{+}Y_1$};
  \fill (0.05,-1.85) rectangle (0.95,-0.95);
  \node[anchor=west] at (1.4,-1.4)
    {\small diagonal products M1$=X_0Y_0$, M4$=X_1Y_1$ reused as the two post-subtractions};
\end{circuitikz}
\end{document}
```

*After Figs. 8.25 and 8.26, pp. 244-245.*

**Split each operand at its midpoint and the product becomes four products.**
Take $X$ and $Y$ on $2w$ bits each and cut both in half, $X_1,X_0,Y_1,Y_0$ all
$w$ bits unsigned, so that $X=2^wX_1+X_0$ and $Y=2^wY_1+Y_0$. The cut is pure
wiring — it renames bits, it does not compute. Expanding the product by
distributivity of multiplication over addition,

$$X\times Y=\underbrace{X_1Y_1}_{M4}2^{2w}+(\underbrace{X_1Y_0}_{M3}+\underbrace{X_0Y_1}_{M2})2^{w}+\underbrace{X_0Y_0}_{M1}
\tag{8.54, p. 244}$$

Four $w\times w$ multipliers, each producing $2w$ bits, placed at weights
$2^{2w}$, $2^{w}$, $2^{w}$, $2^{0}$ — panel (b) of the diagram, and exactly the
$2\times2$ tiling of [[Multiplier Tiling]]. Nothing has been saved yet; this is
just long multiplication in radix $2^w$.

**The middle column is the sum of two terms, and a single product already
contains both.** Expand $(X_0+X_1)(Y_0+Y_1)$, again by distributivity:

$$(X_0+X_1)(Y_0+Y_1)=X_0Y_0+X_0Y_1+X_1Y_0+X_1Y_1$$

Two of those four terms are precisely the middle column $M2+M3$; the other two
are $M1$ and $M4$, which (8.54) requires anyway for the outer columns. Subtract
what is not wanted:

$$X_1Y_0+X_0Y_1=(X_0+X_1)(Y_0+Y_1)-\underbrace{X_0Y_0}_{M1}-\underbrace{X_1Y_1}_{M4}
\tag{8.55, p. 244}$$

**The middle column is recovered by subtraction rather than by multiplication.**
That single sentence is the whole method, and the condition for it to be free is
that $M1$ and $M4$ are *reused*, not recomputed — they were already being built
for the top and bottom columns. Three multipliers, panel (c).

**Count the widths, because the replacement multiplier is not the one it
replaces.** $X_0+X_1$ and $Y_0+Y_1$ are $w+1$ bits each — the carry-out of a
$w$-bit addition, per the standard growth rule of [[Number Formats]] — so the
one multiplier that stands in for two is $(w+1)\times(w+1)$, producing $2w+2$
bits. The recovered middle column is bounded by
$X_1Y_0+X_0Y_1\le 2(2^w-1)^2<2^{2w+1}$, so it lands on $2w+1$ bits, one wider
than the $2w$-bit product it would have had. The final product is $4w$ bits, as
for any $2w\times2w$ multiplication. The extra bit on each pre-addition is the
cost hiding in plain sight: a $w\times w$ multiplier and a
$(w+1)\times(w+1)$ multiplier are the same thing in an ASIC standard-cell flow
and are emphatically not the same thing on an FPGA, where a $17\times17$ DSP
tile fed 18-bit operands stops being one tile.

**Asymptotically this is the point.** Applied recursively, the recurrence is
$T(2w)=3T(w)+\Theta(w)$ — three sub-problems of half size plus linear
pre/post-addition — and the master theorem gives
$T(w)=\Theta(w^{\log_2 3})=\Theta(w^{1.585})$ in place of $\Theta(w^2)$. In
software that exponent is the entire story. In hardware it is not, because the
$\Theta(w)$ term is not a constant-factor detail: it is carry propagation, and
where it sits decides whether the circuit is any good.

> [!important] Karatsuba improves area and degrades timing
> The two **post**-subtractions are harmless: they are two more terms dropped
> into the compression of [[Bit Heaps]], and in the redundant representation of
> [[CSA, Carry-Save Adder]] they cost constant time and a row of the tree. The
> two **pre**-additions are the problem. They are ordinary carry-propagate
> additions sitting *in front of* the multiplier, on the critical path, before
> any partial product exists to hide them behind (p. 245).

**In the tiling picture Karatsuba is just another tile.** Panel (c) draws the
replaced pair M2, M3 as two **linked empty squares** and the reused diagonal
products M1, M4 as **black squares** (Fig. 8.26b, p. 245). Read that way the
method stops being an algebraic identity and becomes a shape the tiling ILP can
place: a non-connected, three-multiplier tile with a stated cost. The count is
graphical — number of sub-multipliers = linked pairs + black squares — and every
generalization is derived by moving squares around rather than by re-deriving
(8.55): more parts in [[K-Part Karatsuba Splitting]], non-square tiles in
[[Rectangular Karatsuba]], splitting the sub-multipliers again in
[[Recursive Karatsuba]].

**Signedness decides which of the two formulas you use.** The alternative
rewriting $X_1Y_0+X_0Y_1=(X_0-X_1)(Y_1-Y_0)+M1+M4$ (8.56, p. 245) replaces the
pre-additions with pre-*subtractions* at identical hardware cost, and also adds
one bit — but that bit is a **sign** bit. On [[DSP Blocks]] whose multipliers are
natively signed, unsigned use wastes the sign bit by forcing it to zero, so the
subtractive form consumes a bit that was being thrown away and the operands stay
inside the native tile. That is [[Subtractive Karatsuba]], and on such a device it
is the default rather than the variant.

$$\boxed{\ X_1Y_0+X_0Y_1=(X_0+X_1)(Y_0+Y_1)-X_0Y_0-X_1Y_1\ }$$

**When it breaks.**

- **Two-part square splitting on an FPGA is a net loss.** With $17\times17$
  square tiles the book's efficiency metric gives $E^\mathrm{DSP}=385.3$ against
  $408$ for plain tiling — worse than not doing Karatsuba at all. It only starts
  paying at 3-part splitting ($433.5$), i.e. from $51\times51$ upward (p. 254).
  The 2-part case earns its place as the derivation, not as a design.
- **The $w{+}1$ growth versus a fixed tile.** The moment the pre-added operand no
  longer fits the native multiplier, the "one multiplier" is two, and the saving
  inverts. This is the entire motivation for [[Rectangular Karatsuba]], where the
  spare dimension of a $17\times24$ DSP absorbs the extra bit.
- **Latency.** One level costs one pre-adder delay ahead of the multiply;
  [[Recursive Karatsuba]] stacks them **in sequence**, trading nine small
  multipliers against ten for two serial carry propagations (p. 248).
- **Small $w$.** Three $(w{+}1)$-bit multipliers plus four adders lose to four
  $w$-bit multipliers whenever the adders are a comparable fraction of the
  multiplier — below roughly a DSP's worth of operand, an
  [[Unsigned Array Multiplier]] or a LUT tile wins outright.
- **When DSPs are not the scarce resource.** Karatsuba spends LUTs to save
  multipliers: $E^\mathrm{LUT}$ falls from $18.13$ to $9.7$–$12.2$ because of the
  extra adders (p. 254). If the design is LUT-bound, this is the wrong direction.
- **Accuracy is not a corner case.** (8.55) is an exact integer identity; every
  intermediate, including the $2w{+}1$-bit middle column, is representable. There
  is no error term to analyse ([[Error Accuracy]]) — only the widths to get right.

```spade
/// One level of two-part Karatsuba: a 2W x 2W product from three (W+1)-bit multiplies.
fn karatsuba<#uint W>(x: uint<{2 * W}>, y: uint<{2 * W}>) -> uint<{4 * W}> {
    let (x0b, x1b) = x.as_bits().split_at::<W>();
    let (y0b, y1b) = y.as_bits().split_at::<W>();
    let x0 = x0b.as_uint();   let x1 = x1b.as_uint();
    let y0 = y0b.as_uint();   let y1 = y1b.as_uint();

    let m1: uint<{2 * W}>     = x0 * y0;                 // M1, the low diagonal
    let m4: uint<{2 * W}>     = x1 * y1;                 // M4, the high diagonal
    let m:  uint<{2 * W + 2}> = (x0 + x1) * (y0 + y1);   // the (W+1)x(W+1) multiply

    let d1:  uint<{2 * W + 2}> = trunc(m - zext::<{2 * W}, {2 * W + 2}>(m1));
    let mid: uint<{2 * W + 1}> = trunc(d1 - zext::<{2 * W}, {2 * W + 2}>(m4));

    let zeros: uint<W> = 0;
    let diag:    uint<{4 * W}>     = m4.concat(m1);      // M4 at 2^{2W}, M1 at 2^0
    let shifted: uint<{3 * W + 1}> = mid.concat(zeros);  // middle column at 2^W
    trunc(diag + zext::<{3 * W + 1}, {4 * W}>(shifted))
}
```

`split_at::<W>` is panel (a): array element 0 is the LSB, so the first half is
$X_0$ and no logic is emitted. `m1`, `m4`, `m` are the three black-and-linked
squares of panel (c); `(x0 + x1)` widens to $W{+}1$ by Spade's own growth rule,
which is why `m` is declared $2W{+}2$. The two `trunc`ed subtractions are the
post-additions, and `m4.concat(m1)` is free — $M4$ and $M1$ occupy disjoint bit
fields, so weighting by $2^{2W}$ is concatenation, not an adder. Everything is
combinational. Synthesis will not build it as drawn: the three `*` become DSP
tiles or compressor trees, and the final `+` is merged into the last tree's bit
heap rather than existing as its own adder — but the two pre-adders inside
`(x0 + x1)` cannot be merged into anything, which is the timing cost this note
keeps pointing at.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024),
Chapter 8, "Fixed-Point Multiplication":

- §8.6 *The Karatsuba Method*, p. 244 (sub-quadratic complexity, multiplications
  traded for additions).
- §8.6.1 *Two-Part Splitting*, pp. 244–245, eqs. (8.53)–(8.55), Fig. 8.25 p. 244
  (operand split) and Fig. 8.26 p. 245 (tiling), plus the area-versus-timing
  paragraph on p. 245.
- §8.6.2 *Subtractive Karatsuba Formula*, p. 245, eq. (8.56).
- §8.6.3 *Tile Representation*, p. 246 (linked empty squares and black squares).
- §8.6.5 *Recursive Karatsuba*, p. 248 (serial pre-adders, 9 versus 10
  multipliers).
- §8.6.8, Tables 8.5–8.6, p. 254 ($E^\mathrm{DSP}$ 385.3 / 433.5 / 462.4 against
  408 plain; $E^\mathrm{LUT}$ 18.13 → 9.7–12.2).

- [[Multiplier Tiling]] – depends-on: supplies the $2\times2$ tiling that (8.54)
  is written on, and the ILP that decides whether the Karatsuba tile is worth
  placing at all.
- [[Bit Heaps]] – supports: absorbs the two post-subtractions into the existing
  compression, which is why only the pre-additions cost anything.
- [[CSA, Carry-Save Adder]] – supports: makes the post-additions constant-time by
  deferring carry propagation to the single final adder.
- [[DSP Blocks]] – counter-example: fixed $17\times17$ / $17\times24$ tiles are
  what turn the harmless $w\to w{+}1$ growth into a hard cliff.
- [[Subtractive Karatsuba]] – extends: same identity with pre-subtractions, so
  the extra bit is a sign bit the DSP already has.
- [[K-Part Karatsuba Splitting]] – extends: applies (8.55) across all
  $K(K-1)/2$ same-weight pairs instead of the single pair here.
- [[Recursive Karatsuba]] – extends: applies the split to the sub-multipliers,
  buying multiplier count with serial pre-adder delay.
- [[Rectangular Karatsuba]] – extends: pairs tiles of non-square shape so the
  $w{+}1$ operand still fits the DSP.
- [[Unsigned Array Multiplier]] – compares: the $\Theta(w^2)$ baseline that
  Karatsuba beats asymptotically and loses to at every small width.
- [[Choosing a Multiplier]] – compares: where this sits against Booth, tiling and
  truncation once the resource budget is named.
