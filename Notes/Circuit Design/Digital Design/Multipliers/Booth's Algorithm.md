---
title: "Booth's Algorithm"
description: "Modified radix-4 recoding into the redundant digit set {-2..2}: halves the partial-product rows for the price of an OR and an XOR per bit, and never needs 3Y."
kind: circuit
source: "ASA §8.3.2, pp. 216-222 (Fig. 8.8, p. 219; Table 8.2, p. 218)"
status: seed
spade: simulated
tags: [digital, multipliers, booth, recoding, redundant, radix-4, signed]
aliases:
  - Booth Recoding
  - Modified Booth Recoding
  - Modified Booth
  - Booth Encoding
  - Radix-4 Booth
  - Booth Multiplier
---

# Booth's Algorithm

A radix-4 partial-product generator that rewrites the multiplier into the *redundant* digit set $\{-2,-1,0,1,2\}$, so that every one of its $\approx w_X/2$ rows is a shift of $Y$ or of $2Y$, possibly complemented, and never the $3Y$ that a plain radix-4 array would need.

```tikz title="Radix-4 Booth partial-product generation: recoder plus one bit slice of a row"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,font=\small]
  % ---- recoder: 3 consecutive bits of X -> 3 control signals ----
  \draw (0,-1.1) rectangle (4.0,1.1);
  \node[font=\small] at (2.0,0.5) {Booth recoder};
  \node[font=\scriptsize] at (2.0,-0.3) {$Z_j=-2x_{2j+1}+x_{2j}+x_{2j-1}$};
  \node[font=\scriptsize] at (2.0,-0.8) {$Z_j\in\{-2,-1,0,1,2\}$};
  \draw[<-] (0,0.7) -- (-1.3,0.7) node[anchor=east,font=\scriptsize] {$x_{2j+1}$};
  \draw[<-] (0,0.1) -- (-1.3,0.1) node[anchor=east,font=\scriptsize] {$x_{2j}$};
  \draw[<-] (0,-0.5) -- (-1.3,-0.5) node[anchor=east,font=\scriptsize] {$x_{2j-1}$};
  \node[anchor=east,font=\scriptsize,text width=2.1cm,align=right] at (-1.3,-1.5)
    {3 bits of $X$, $m$ digits total};

  % ---- one bit slice of the row ----
  \node[and port,scale=0.9] (a1) at (7.6,2.3) {};
  \node[and port,scale=0.9] (a2) at (7.6,1.3) {};
  \node[or  port,scale=0.9] (o1) at (9.6,1.8) {};
  \node[xor port,scale=0.9] (x1) at (11.6,1.0) {};

  \draw (a1.in 1) -- ++(-0.55,0) node[anchor=east,font=\scriptsize] {$y_{i-1}$};
  \draw (a2.in 1) -- ++(-0.55,0) node[anchor=east,font=\scriptsize] {$y_{i}$};
  \draw (4.0,0.7) node[anchor=north west,font=\scriptsize] {$\mathrm{two}_j$} -- (4.6,0.7) |- (a1.in 2);
  \draw (4.0,0.0) node[anchor=north west,font=\scriptsize] {$\mathrm{one}_j$} -- (4.9,0.0) |- (a2.in 2);
  \draw (4.0,-0.7) node[anchor=north west,font=\scriptsize] {$\mathrm{cpl}_j$} -- (11.0,-0.7) |- (x1.in 2);
  \draw (a1.out) -- ++(0.4,0) |- (o1.in 1);
  \draw (a2.out) -- ++(0.4,0) |- (o1.in 2);
  \draw (o1.out) -- ++(0.4,0) |- (x1.in 1);
  \draw[->] (x1.out) -- ++(1.1,0) node[anchor=west,font=\scriptsize] {$p_{ji}$};

  \node[anchor=south,font=\scriptsize\itshape] at (1.9,3.1) {once per digit ($m$ copies)};
  \node[anchor=south,font=\scriptsize\itshape] at (9.4,3.1) {once per bit of $Y$ ($w_Y+1$ copies)};

  % ---- legend ----
  \node[anchor=west,font=\scriptsize] at (-3.6,-2.5) {$\mathrm{cpl}_j=x_{2j+1}$};
  \node[anchor=west,font=\scriptsize] at (-3.6,-3.1) {$\mathrm{one}_j=x_{2j}\oplus x_{2j-1}$};
  \node[anchor=west,font=\scriptsize] at (-3.6,-3.7) {$\mathrm{two}_j=\overline{x_{2j+1}}\,x_{2j}\,x_{2j-1}\vee x_{2j+1}\,\overline{x_{2j}}\,\overline{x_{2j-1}}$};
  \node[anchor=west,font=\scriptsize] at (6.0,-2.5) {$P_j=Z_jY\in\{\overline{2Y},\overline{Y},0,Y,2Y\}$, $w_Y+1$ bits};
  \node[anchor=west,font=\scriptsize] at (6.0,-3.1) {row weight $4^j$; $\mathrm{cpl}_j$ enters the heap};
  \node[anchor=west,font=\scriptsize] at (6.0,-3.7) {at weight $4^j$ to complete $-z=\bar z+1$};
\end{circuitikz}
\end{document}
```

*After Fig. 8.8, p. 219; the Boolean equations are the book's, the recoder box and the width annotations are added.*

**Halving the rows is the goal, and radix 4 is the obvious way to get it.** Split the $w_X$-bit multiplier $X$ into 2-bit chunks, $X=\sum_j 4^jX_j$ with $X_j\in\{0,1,2,3\}$. The product becomes $\sum_j4^jX_jY$: half as many rows in the array, hence half the [[Bit Heaps|bit heap]] and a shallower [[Compressor Trees|compressor tree]]. The catch is $X_j=3$, which needs $3Y=2Y+Y$ — a real carry-propagate addition, ahead of the tree and on the critical path. That addition gives back most of what halving the array won.

**Escape by making the digit set redundant.** Keep radix 4 but allow the digits to be negative: $Z_j\in\{-2,-1,0,1,2\}$, five values for a radix of four, so the representation is a [[Redundant Number Systems|redundant number system]]. Every one of those five multiples of $Y$ is free — $0$, $\pm Y$ (a wire), $\pm2Y$ (a wire shift), each negated by complement-and-add-one — because $3$ is no longer in the set. The product is

$$X\times Y=\sum_j 4^jZ_jY \tag{8.20, p. 217}$$

and negative rows are no harder than positive ones, because a bit heap already knows how to absorb negatively-weighted terms (see [[Sums of Weighted Bits]]).

**Derive the recoding from one identity, not from a lookup table.** The underlying fact is the geometric series $\sum_{i=a}^{b}2^i=2^{b+1}-2^{a}$, i.e. a run of ones **is** a subtract-add pair; per bit it degenerates to the rewrite $x=2x-x$. Apply that rewrite to every *odd-weight* bit of $X$ and leave the even ones alone:

$$X=\dots+x_52^5+x_42^4+x_32^3+x_22^2+x_12^1+x_0
=\dots+(2x_5-x_5)2^5+x_42^4+(2x_3-x_3)2^3+x_22^2+(2x_1-x_1)2^1+x_0$$

Now **factor $2^{2j}$ out of each group of three consecutive bits** — distributivity of $\times$ over $+$, pulling the common power out:

$$X=\dots+2x_52^5+2^4\underbrace{(-2x_5+x_4+x_3)}_{Z_2}+2^2\underbrace{(-2x_3+x_2+x_1)}_{Z_1}+\underbrace{(-2x_1+x_0)}_{Z_0} \tag{8.21, p. 217}$$

**Pad so that every digit reads exactly three bits.** Append $x_{-1}=0$ on the right, and zeros on the left ($x_{w}=x_{w+1}=0$ for even $w$, $x_{w}=0$ for odd $w$). Synthesis optimises the padding away, so it is free. The recoding is then uniform:

$$X=\sum_{j=0}^{m-1}Z_j2^{2j},\qquad Z_j=-2x_{2j+1}+x_{2j}+x_{2j-1},\qquad m=\left\lfloor\frac{w}{2}\right\rfloor+1 \tag{8.22, p. 218}$$

**The formula is its own proof of the digit range.** $x_{2j}+x_{2j-1}$ is at most $2$ and $-2x_{2j+1}$ is at least $-2$, and $3$ is unreachable because it would need $x_{2j+1}=0$ together with a sum of three from two bits. So $Z_j\in\{-2,\dots,2\}$ by inspection; Table 8.2 (p. 218) is a consequence of (8.22), not a definition of it. Each $Z_j$ reads three bits of $X$ and nothing else, so all $m$ digits are produced **fully in parallel, in constant time** — the recoding is one gate level, not a carry-propagating pass over $X$.

*Check with $X=123_{10}=0\,\underline{01}\,\underline{11}\,\underline{10}\,\underline{11}\!\cdot\!0$:* $Z_0=-1,\,Z_1=-1,\,Z_2=0,\,Z_3=2$, and $-1+4(-1)+16(0)+64(2)=123$ ✓ (p. 218).

**Fuse the recoding with the multiplication so no digit is ever materialised.** You never build $Z_j$ as a number; you build the three control bits that select and sign the row directly (p. 219):

$$\mathrm{cpl}_j=x_{2j+1},\qquad \mathrm{one}_j=x_{2j}\oplus x_{2j-1},\qquad \mathrm{two}_j=\overline{x_{2j+1}}\,x_{2j}\,x_{2j-1}\vee x_{2j+1}\,\overline{x_{2j}}\,\overline{x_{2j-1}}$$

$\mathrm{cpl}_j$ is $1$ when $Z_j\le0$, $\mathrm{one}_j$ when $|Z_j|=1$, $\mathrm{two}_j$ when $|Z_j|=2$; note $\mathrm{cpl}_j$ is literally a wire from $x_{2j+1}$. Bit $i$ of row $j$ is then $p_{ji}=\big((\mathrm{two}_j\wedge y_{i-1})\vee(\mathrm{one}_j\wedge y_i)\big)\oplus\mathrm{cpl}_j$ — the AND pair selects $Y$ or $2Y$ ($2Y$ being $Y$ read one index down), the OR merges them, the XOR bank inverts on $\mathrm{cpl}_j$. The complement is only half of a negation, so $\mathrm{cpl}_j$ itself is dropped into the heap at the LSB position of $4^jZ_jY$, completing $-z=\bar z+1$ (see [[Number Formats]]). Each row is $w_Y+1$ bits wide before sign extension, the extra bit being the possible $\times2$.

**The overhead is exactly one OR and one XOR per bit.** A plain radix-2 array spends two AND gates per bit position across two rows; Booth spends those same two ANDs on one row and adds an OR and an XOR. So the cost is $m\times w_Y$ extra gates plus $m$ copies of the recoder, and the return is an array with $\approx w_X/2$ rows instead of $w_X$ — the tree shrinks by a level of depth and by roughly half its area.

**Negative rows force sign extension even in the unsigned case.** Since any $Z_j$ may be negative, every $Z_jY$ must be sign-extended to the full product width $w_P=w_X+w_Y$, which an unsigned plain array never had to do (p. 219). This is not a real cost: the sign-extension reduction of [[Sums of Weighted Bits]] replaces each run of replicated bits by one complemented bit plus design-time constants, exactly as in the [[Baugh-Wooley Multiplier]]. For a $4\times4$ unsigned Booth multiplier the reduction turns four constant digits into three, at the price of raising the tallest column from three to four, and applying the $x+1$ algebraic transform twice brings it back down to three (Fig. 8.9, p. 220).

**A signed multiplier gets one digit for free, because the MSB is already Booth-encoded.** If $w$ is even, $x_{w-1}$ already carries weight $-2^{w-1}$, so the top three bits $x_{w-1}x_{w-2}x_{w-3}$ satisfy (8.22) as they stand — no left padding, no $x=2x-x$ applied to $x_{w-1}$, and $m=w/2$, one digit *fewer* than unsigned. If $w$ is odd, sign-extend $X$ by one bit to reduce to the even case; $m$ is then the same as unsigned (p. 221). The only other change is that $Y$ must be sign-extended when $\mathrm{one}_j=1$, which the sign-extension reduction was going to handle anyway.

**Worked example, $8\times8$ signed.** $X=11011011_2=-37$, $Y=00110101_2=+53$, $P=-1961$. $w=8$ is even and $X$ is signed, so $m=4$; with $x_{-1}=0$:

| $j$ | $x_{2j+1}x_{2j}x_{2j-1}$ | $Z_j$ | $Z_jY\cdot4^j$ | on 16 bits |
| --- | --- | --- | --- | --- |
| 0 | $110$ | $-1$ | $-53$ | `1111111111001011` |
| 1 | $101$ | $-1$ | $-212$ | `1111111100101100` |
| 2 | $011$ | $+2$ | $+1696$ | `0000011010100000` |
| 3 | $110$ | $-1$ | $-3392$ | `1111001011000000` |

Recoding: $-1+4(-1)+16(2)+64(-1)=-37=X$ ✓. Product: $-53-212+1696-3392=-1961$ ✓. **Four rows instead of eight**, every one a shift of $Y$ or $2Y$, three of them XOR-inverted with their $\mathrm{cpl}_j$ bit injected at weight $4^j$.

**On FPGAs, Booth usually loses; in ASIC flows it usually wins.** The technique attacks array *height*, which is what dominates an ASIC compressor tree. An FPGA has no such tree to shrink: partial products are absorbed by DSP blocks or by LUT and carry-chain tiles whose cost is counted per tile, not per row (see [[Multiplier Tiling]] and [[LUT-Based Multiplier Tiles]]), and the recoder's OR/XOR per bit is real LUT area that buys nothing there. Reach for Booth when you are building the reduction tree yourself and depth is the binding constraint. It does still pay on FPGAs indirectly in one place: a truncated Booth multiplier needs fewer guard bits than a truncated plain one — $g=4$ against $g=5$ at $w=32$ — because it has fewer, larger rows to bound (see [[Truncated Multipliers]]).

$$\boxed{\ X\times Y=\sum_{j=0}^{m-1}4^{j}Z_jY,\qquad Z_j=-2x_{2j+1}+x_{2j}+x_{2j-1}\in\{-2,-1,0,1,2\},\qquad m=\left\lfloor\tfrac{w}{2}\right\rfloor+1\ }$$

with $m=w/2$ when $X$ is signed and $w$ is even.

## When it breaks

- **Small $w$ barely wins.** At $w=4$ the reduction removes exactly one bit of column height (three instead of four after the $x+1$ transform is applied twice, Fig. 8.9c, p. 220). The "array is halved" claim is asymptotic; below $w\approx8$ the recoder and the OR/XOR bank eat the saving.
- **The digit set stops being free above radix 4.** Radix 8 needs $\{-4,\dots,4\}$, which still contains $3$; radix 16 needs $\{-8,\dots,8\}$, containing $3$, $5$ and $7$. Each demands a genuine addition, and a carry-save adder cannot supply it because it returns each product line as *two* lines — negating the point of the higher radix (p. 222). This is the ceiling of the whole idea; [[Bewick Radix-8 Multiplier]] works around it rather than removing it.
- **Unsigned Booth is not free.** Rows can be negative even when both operands are, so an unsigned Booth array needs sign-extension management that an unsigned plain array does not — you pay the [[Baugh-Wooley Multiplier]] machinery in a case where you previously paid nothing.
- **$w$ odd costs a sign extension.** $X$ must be widened by one bit before recoding, which brings $m$ back up to the unsigned count and erases the signed multiplier's one-digit discount.
- **The recoder sits before the tree, not beside it.** Recoding is constant *time* but not zero time: one gate level for $\mathrm{one}_j$/$\mathrm{two}_j$ plus the AND-OR-XOR of the row generator, all ahead of the first compressor stage. On a short multiplier that prologue is a visible fraction of the total delay.
- **A DSP block makes the question moot.** Whenever the operands fit a hard multiplier, the partial-product structure is not yours to choose.

## RTL (Spade)

```spade
/// Radix-4 modified Booth: one digit's partial-product row, fused with the
/// multiplication Z_j*Y.  (x1, x0, xm) = (x_{2j+1}, x_{2j}, x_{2j-1}).
/// Returns the row bits and the cpl bit that completes -z = ~z + 1.
fn booth_row(y: int<8>, x1: bool, x0: bool, xm: bool) -> (uint<16>, bool) {
    let cpl = x1;
    let one = x0 != xm;
    let two = (!x1 && x0 && xm) || (x1 && !x0 && !xm);

    let ys: int<16> = sext(y);
    let yu: uint<16> = ys.as_uint();
    let sel: uint<16> = if two { yu << 1 } else { if one { yu } else { 0 } };
    (if cpl { ~sel } else { sel }, cpl)
}

/// cpl_j dropped into the heap at weight 4^j.
fn at(b: bool, w: uint<16>) -> uint<16> { if b { w } else { 0 } }

/// Signed 8x8 -> 16 radix-4 Booth multiplier: w even, so m = w/2 = 4 digits.
entity booth8(x: int<8>, y: int<8>) -> int<16> {
    let xb = x.as_bits();
    let (r0, c0) = booth_row(y, xb[1], xb[0], false);
    let (r1, c1) = booth_row(y, xb[3], xb[2], xb[1]);
    let (r2, c2) = booth_row(y, xb[5], xb[4], xb[3]);
    let (r3, c3) = booth_row(y, xb[7], xb[6], xb[5]);

    let rows: uint<16> = r0 +. (r1 << 2) +. (r2 << 4) +. (r3 << 6);
    let corr: uint<16> = at(c0, 1) +. at(c1, 4) +. at(c2, 16) +. at(c3, 64);
    (rows +. corr).as_int()
}
```

`booth_row` is the whole diagram: `cpl`/`one`/`two` are the recoder box, `sel` is the AND-OR pair (`yu << 1` is the $2Y$ wire shift, so `sel` bit $i$ is $y_{i-1}$), and `~sel` is the XOR bank with $\mathrm{cpl}_j$ high. The four calls in `booth8` are the four windows $x_{2j+1}x_{2j}x_{2j-1}$ with the hardwired $x_{-1}=0$ — the top window $x_7x_6x_5$ needs no special case precisely because $x_7$ already has negative weight. Every add is the **wrapping** `+.`: the identity is exact on $w_P=16$ bits, and plain `+` would widen to 17 and carry the discarded $2^{16}$ into the result. `corr` is $\sum_j\mathrm{cpl}_j4^j$, the LSB injections drawn as the bottom wire of the figure. The entity is purely combinational. Synthesis will not build it as written: the four `+.` are a *model* of the bit heap, and a real flow merges the four rows and `corr` into one [[Compressor Trees|compressor tree]] with a single carry-propagate adder at the end, which is the entire point of halving the row count.

Verified by simulation: the 9 named vectors (including $-37\times53=-1961$, $1\times-128$ and $-128\times1$ to catch operand swap and bit reversal), 5000 random pairs, and an exhaustive sweep of all $2^{16}$ operand pairs, all against a behavioural `$signed(x)*$signed(y)` reference.

## Related Notes

- [[Redundant Number Systems]] – depends-on: the entire trick is that five digits in radix 4 make $3Y$ unreachable; without redundancy there is no Booth.
- [[Baugh-Wooley Multiplier]] – compares: attacks row *width* (sign extension) where Booth attacks row *count*, and Booth then needs Baugh-Wooley's reduction to clean up its own negative rows.
- [[Bit Heaps]] – supports: the $m$ rows, their sign extensions and the $m$ $\mathrm{cpl}_j$ bits are handed over as ordinary weighted bits, negative terms included.
- [[Compressor Trees]] – extends: halving the number of rows is only worth anything because it shortens this tree by a level.
- [[Unsigned Array Multiplier]] – compares: the radix-2 baseline whose $w_X$ rows and two-ANDs-per-bit this replaces.
- [[Bewick Radix-8 Multiplier]] – extends: pushes past radix 4 by computing the awkward $Z_jY$ in high-radix carry-save form instead of avoiding them.
- [[Truncated Multipliers]] – compares: a Booth-recoded array needs one guard bit fewer than a plain one at $w=32$.
- [[Multiplier Tiling]] – counter-example: on FPGAs the array is bought in tiles, not rows, so halving the row count buys nothing and the recoder is pure overhead.
- [[Choosing a Multiplier]] – compares: where radix-4 Booth sits against plain arrays, DSP tiling and Karatsuba.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Chapter 8, "Fixed-Point Multiplication":

- 8.3.2 Radix-4 Booth Encoding — pp. 216–218 (the $3Y$ problem p. 216, redundant digit set (8.19)–(8.20) p. 217, the $x=2x-x$ rewrite and (8.21) p. 217, padded form (8.22) and the $X=123$ check p. 218, Table 8.2 p. 218)
- 8.3.2.1 Technical Realization — p. 219 (cpl/one/two equations, Fig. 8.8, the OR + XOR overhead accounting)
- 8.3.2.2 Unsigned Radix-4 Booth Partial Product Generation — pp. 219–220 (sign extension of negative rows, Fig. 8.9 and the $4\times4$ height reduction)
- 8.3.2.3 Signed Radix-4 Booth Partial Product Generation — p. 221 (even $w$ gives $m=w/2$, odd $w$ needs a sign extension; Fig. 8.10 p. 222)
- 8.3.3 Higher Radix Multiplication — pp. 221–222 (why radices above 4 reintroduce a real addition; Bewick's radix-8 carry-save variant)
- 8.5 Truncated Multipliers — p. 239 (Table 8.4: guard bits for plain and Booth multipliers)
