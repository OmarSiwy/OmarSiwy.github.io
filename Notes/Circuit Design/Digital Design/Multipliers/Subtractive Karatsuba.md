---
title: Subtractive Karatsuba
description: "Same three-multiplier structure with pre-subtractions instead of pre-additions: the extra bit becomes a sign bit, so natively-signed DSP multipliers stop wasting theirs on a forced zero."
kind: circuit
source: "ASA §8.6.2, p. 245"
status: seed
spade: simulated
tags: [digital, multipliers, karatsuba, dsp, fpga]
aliases:
  - Subtractive Karatsuba Formula
  - Karatsuba Subtractive Form
  - Subtractive Karatsuba Multiplier
---

# Subtractive Karatsuba

The two-part Karatsuba split rewritten so that the one saved multiplication is a
**signed** $(w{+}1)\times(w{+}1)$ product instead of an unsigned one, which is
free on a DSP block whose multiplier was signed all along.

```tikz title="Subtractive Karatsuba datapath: two pre-subtractors, three sub-multipliers, weighted recombination"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\footnotesize,
  blk/.style={draw, thick, align=center, minimum height=0.6cm},
  cell/.style={draw, minimum width=1.6cm, minimum height=0.6cm}]

  % ---- operand split bars -------------------------------------------------
  \node[anchor=west] at (0,6.0) {each chunk is $w$ bits; $X=2^wX_1+X_0$, $Y=2^wY_1+Y_0$};
  \node[cell] (X1) at (0.8,5.2) {$X_1$};
  \node[cell] (X0) at (2.4,5.2) {$X_0$};
  \node[cell] (Y1) at (5.6,5.2) {$Y_1$};
  \node[cell] (Y0) at (7.2,5.2) {$Y_0$};
  \node[anchor=east] at (-0.05,5.2) {$X$};
  \node[anchor=east] at (4.75,5.2) {$Y$};

  % ---- pre-subtractions ---------------------------------------------------
  \node[blk, minimum width=1.7cm] (SX) at (2.8,3.6) {$X_0-X_1$};
  \node[blk, minimum width=1.7cm] (SY) at (5.2,3.6) {$Y_1-Y_0$};

  % ---- three sub-multipliers ----------------------------------------------
  \node[blk, minimum width=2.0cm, minimum height=1.0cm] (M4) at (1.0,2.0)
       {$M4=X_1Y_1$\\[1pt] unsigned $w\times w$};
  \node[blk, minimum width=3.0cm, minimum height=1.0cm] (MM) at (4.0,2.0)
       {$(X_0{-}X_1)(Y_1{-}Y_0)$\\[1pt] \textbf{signed} $(w{+}1)\times(w{+}1)$};
  \node[blk, minimum width=2.0cm, minimum height=1.0cm] (M1) at (7.0,2.0)
       {$M1=X_0Y_0$\\[1pt] unsigned $w\times w$};

  % ---- recombination ------------------------------------------------------
  \node[blk, minimum width=8.0cm, minimum height=0.7cm] (ADD) at (4.0,0.4)
       {shift \& add: \; $P=2^{2w}M4+2^{w}\big[(X_0{-}X_1)(Y_1{-}Y_0)+M1+M4\big]+M1$};

  % ---- wiring -------------------------------------------------------------
  \draw[->, thick] (0.8,4.9) -- (0.8,2.5);
  \draw[->, thick] (5.6,4.9) -- (5.6,4.45) -- (1.5,4.45) -- (1.5,2.5);
  \draw[->, thick] (2.4,4.9) -- (2.4,4.25) -- (6.6,4.25) -- (6.6,2.5);
  \draw[->, thick] (7.2,4.9) -- (7.2,2.5);

  \draw[->, thick] (0.8,4.05) -- (2.15,4.05) -- (2.15,3.9);
  \draw[->, thick] (3.3,4.25) -- (3.3,3.9);
  \draw[->, thick] (4.6,4.45) -- (4.6,3.9);
  \draw[->, thick] (7.2,4.05) -- (5.8,4.05) -- (5.8,3.9);
  \fill (0.8,4.05) circle (1.6pt);
  \fill (3.3,4.25) circle (1.6pt);
  \fill (4.6,4.45) circle (1.6pt);
  \fill (7.2,4.05) circle (1.6pt);

  \draw[->, thick] (2.8,3.3) -- (2.8,2.5);
  \draw[->, thick] (5.2,3.3) -- (5.2,2.5);
  \node[anchor=west] at (2.9,2.95) {$w{+}1$};
  \node[anchor=west] at (5.3,2.95) {$w{+}1$};

  \draw[->, thick] (1.0,1.5) -- (1.0,0.75);
  \draw[->, thick] (4.0,1.5) -- (4.0,0.75);
  \draw[->, thick] (7.0,1.5) -- (7.0,0.75);
  \node[anchor=west] at (1.1,1.12) {$2w$};
  \node[anchor=west] at (4.1,1.12) {$2w{+}2$};
  \node[anchor=west] at (7.1,1.12) {$2w$};

  \draw[->, thick] (4.0,0.05) -- (4.0,-0.7);
  \node[anchor=west] at (4.1,-0.35) {$4w$};
  \node[anchor=north] at (4.0,-0.75) {$P=X\times Y$};
\end{circuitikz}
\end{document}
```

*Own construction; the block structure follows the two-part splitting of Fig. 8.25, p. 244 and the identity (8.56), p. 245.*

**Get the middle column from a product of differences.** Start where [[Karatsuba]]
starts: $X=2^wX_1+X_0$ and $Y=2^wY_1+Y_0$ with all four chunks $w$-bit unsigned,
so $X,Y$ are $2w$-bit and $P=X\times Y$ is $4w$-bit. Expand the product of
differences by **distributivity of multiplication over subtraction**:

$$(X_0-X_1)(Y_1-Y_0)=X_0Y_1-X_0Y_0-X_1Y_1+X_1Y_0$$

The two unwanted terms are $-M1=-X_0Y_0$ and $-M4=-X_1Y_1$, and those are exactly
the two diagonal sub-products the split already computes for the $2^0$ and
$2^{2w}$ columns. Move them to the other side:

$$X_1Y_0+X_0Y_1=(X_0-X_1)(Y_1-Y_0)+M1+M4 \tag{8.56, p. 245}$$

This is the same trick as the additive identity (8.55) — recover the middle
column by one multiplication plus reuse — with the signs flipped so the
corrections are **added** rather than subtracted. Note the deliberate asymmetry
$(X_0-X_1)$ against $(Y_1-Y_0)$: the two negations must land on opposite operands
or the cross-terms come out with the wrong sign.

**Both forms grow one bit; only the subtractive one grows a useful bit.** In the
additive form $X_0+X_1\in[0,2^{w+1}-2]$ is $(w{+}1)$-bit **unsigned**, and the
middle product is an unsigned $(w{+}1)\times(w{+}1)$. In the subtractive form
$X_0-X_1\in[-(2^w-1),\,2^w-1]$, which is a $(w{+}1)$-bit **two's-complement**
value — the range is symmetric so no extra headroom is wasted, and by the
two's-complement conventions in [[Number Formats]] the new MSB is a sign bit
rather than a magnitude bit. Same adder width, same carry-propagate cost
(the book equates pre-subtraction and pre-addition cost via §5.2.4). The product
is $(2w{+}2)$-bit signed by the usual $N\times N\to 2N$ growth, though its true
range $|(X_0-X_1)(Y_1-Y_0)|\le(2^w-1)^2$ only needs $2w{+}1$ bits.

> [!important] The saving is one bit of DSP port, and that bit is the whole point
> A DSP48E1 multiplier is $18\times25$ **signed**; used unsigned it costs a
> forced-zero sign bit on each port, leaving $17\times24$. Under the additive
> form all three sub-multipliers are unsigned, so the middle one needs
> $w{+}1\le17$, i.e. $w\le16$. Under the subtractive form the middle product is
> natively signed, so $w{+}1\le18$, i.e. $w\le17$ — the same bound the two
> unsigned diagonals already impose. One chunk bit, but it is the bit that
> decides whether three DSPs buy you a $32\times32$ multiplier or a
> $34\times34$ one.

**Nothing else in the cost model moves.** Three sub-multipliers instead of four,
two pre-operations, two post-operations — identical to [[Karatsuba]], and the
asymptotic $T(2w)=3T(w)+\Theta(w)\Rightarrow\Theta(w^{\log_23})$ is untouched
because the recurrence never cared about signedness. The timing objection is
also unchanged: the pre-subtractors are carry-propagate adders sitting *in front
of* the multiplier, on the critical path, whereas the post-additions merge into
the final compression heap of [[Sums of Weighted Bits]] at near-zero cost. The
choice between (8.55) and (8.56) is therefore purely a question of which kind of
spare bit your sub-multiplier resource has, which is why [[K-Part Karatsuba Splitting]],
[[Recursive Karatsuba]] and [[Rectangular Karatsuba]] all admit a subtractive
variant and the book derives them with the additive one only for readability.

**The recombination stays non-negative, so the final sum is unsigned.** Writing
$\mathrm{mid}=X_1Y_0+X_0Y_1$, the identity guarantees
$0\le\mathrm{mid}\le 2(2^w-1)^2<2^{2w+1}$, so the signed intermediate
$(2w{+}2)$-bit product plus the two $2w$-bit diagonals lands in $2w{+}1$ unsigned
bits every time. Assemble the final product as
$P=2^{2w}M4+2^{w}\mathrm{mid}+M1$, three terms in a $4w$-bit heap. Only the
middle term of the *pre*-compression heap is signed; the output is not.

> [!warning] Not covered in the source — needs outside research
> The book asserts pre-subtraction and pre-addition cost the same, but does not
> price the **sign extension** of the $(2w{+}2)$-bit signed middle product into
> the $4w$-bit post-addition heap. On an ASIC compressor tree that is the usual
> constant-plus-inverted-MSB trick and is nearly free; on an FPGA where the DSP's
> own post-adder absorbs the term it may be free outright. Neither case is
> quantified in §8.6.

$$\boxed{\ X_1Y_0+X_0Y_1=(X_0-X_1)(Y_1-Y_0)+M1+M4\ }$$

**When it breaks.**

- If your chunk width is not pinned against the sub-multiplier's port width, the
  two forms are interchangeable and this note buys nothing — the gain is exactly
  one bit of one port.
- On LUT-based sub-multipliers ([[LUT-Based Multiplier Tiles]]) there is no
  wasted sign bit to reclaim, so the additive form is simpler and equally good.
- The middle product's operands are signed, so a sub-multiplier hardened for
  unsigned operation only (or a tile packed by [[Unsigned DSP Multiplier Packing]])
  cannot take it at all; you need [[Signed DSP Multiplier Packing]].
- The pre-subtractors still carry-propagate ahead of the multiplier. Subtractive
  Karatsuba does not repair Karatsuba's timing regression, it only changes the
  operand encoding.
- Below the crossover where Karatsuba pays at all — roughly $51\times51$ with
  square tiles, $64\times72$ with rectangular ones — neither form is worth
  building; see [[Choosing a Multiplier]].

**RTL (Spade).**

```spade
/// Subtractive Karatsuba, two-part splitting.
/// X = 2^W*x1 + x0, Y = 2^W*y1 + y0, both 2W-bit unsigned; result 4W-bit.
fn karatsuba_sub<#uint W>(
    x1: uint<W>, x0: uint<W>,
    y1: uint<W>, y0: uint<W>,
) -> uint<{4 * W}> {
    // two unsigned W x W diagonal products, reused twice each
    let m1 = x0 * y0;                 // uint<2W>  = X0*Y0
    let m4 = x1 * y1;                 // uint<2W>  = X1*Y1

    // pre-subtractions: (W+1)-bit SIGNED, the extra bit is a sign bit
    let dx: int<{W + 1}> = trunc(x0.to_int() - x1.to_int());
    let dy: int<{W + 1}> = trunc(y1.to_int() - y0.to_int());

    // the one signed sub-multiplier: (W+1) x (W+1)
    let mprod = dx * dy;              // int<2W+2>

    // (8.56): X1Y0 + X0Y1 = (X0-X1)(Y1-Y0) + M1 + M4, fits in 2W+1 unsigned bits
    let a: int<{2 * W + 3}> = sext(mprod);
    let b: int<{2 * W + 3}> = sext(m1.to_int());
    let c: int<{2 * W + 3}> = sext(m4.to_int());
    let mids: int<{2 * W + 1}> = trunc((a +. b) +. c);
    let mid = mids.as_uint();         // uint<2W+1>

    // weighted recombination: m4<<2W + mid<<W + m1, all inside 4W bits
    let zw: uint<W> = 0;
    let z2w: uint<{2 * W}> = 0;
    let t0: uint<{4 * W}> = zext(m1);
    let t1: uint<{4 * W}> = zext(mid.concat(zw));
    let t2: uint<{4 * W}> = zext(m4.concat(z2w));
    (t0 +. t1) +. t2
}
```

`m1` and `m4` are the two black-square multipliers of the drawing, `mprod` the
linked-pair one; `dx`, `dy` are the two pre-subtractor outputs, and `to_int`
(value-preserving, $N\to N{+}1$) is what makes the sign bit appear — `trunc` back
to $W{+}1$ is exact because the difference cannot reach $\pm2^w$. The shifts are
written as `concat` with a zero pad because that is what the hardware is: pure
wiring, no logic. Everything here is combinational; the `+.` chain draws a
carry-propagate adder per term, whereas a real implementation would drop all
three terms into one compression tree and propagate a carry only once, and on an
FPGA would let each DSP's own post-adder swallow its neighbour's term.

Compiled with `spade 0.19.0` and simulated at $W=8$ (a $16\times16$ multiplier):
4010 vectors — 10 named, including $1\times32768$ and both extreme-difference
corners, plus a 4000-vector random sweep against a behavioural `x*y` — all match.

**Related Notes.**

- [[Karatsuba]] – compares: the additive form (8.55) this replaces, with the same
  three-multiplier structure and an unsigned middle product.
- [[Signed DSP Multiplier Packing]] – depends-on: the signed sub-multiplier this
  form exists to feed.
- [[Unsigned DSP Multiplier Packing]] – counter-example: the forced-zero sign bit
  whose waste motivates (8.56) in the first place.
- [[DSP Blocks]] – supports: the $18\times25$ signed multiplier whose port widths
  make the one-bit saving worth having.
- [[K-Part Karatsuba Splitting]] – extends: the same substitution applied to every
  same-weight pair of a $K$-way split.
- [[Rectangular Karatsuba]] – extends: subtractive pairing on non-square tiles,
  where DSP port asymmetry is exploited on both axes at once.
- [[Recursive Karatsuba]] – extends: stacks the pre-subtractions in sequence to
  trade latency for multiplier count.
- [[Choosing a Multiplier]] – compares: where any Karatsuba variant sits against
  plain tiling and Booth recoding.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §8.6.2 *Subtractive Karatsuba Formula*, p. 245 — eq. (8.56), the sign-bit
    argument for natively-signed DSP multipliers.
  - §8.6.1 *Two-Part Splitting*, p. 244 — eqs. (8.53)–(8.55), Fig. 8.25, the
    $(w{+}1)\times(w{+}1)$ width growth and the pre-/post-addition terminology.
  - §8.6.3 *Tile Representation*, Fig. 8.26, p. 245 — linked empty squares for
    the paired multiplier, black squares for the reused diagonals.
  - §5.2.4 — cited by the book as the cost equivalence between adders and
    subtractors (page not consulted).
