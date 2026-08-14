---
title: "Baugh-Wooley Multiplier"
description: "Two's-complement radix-2 array: sign-extend every row, negate the top row, then collapse all the sign-extension runs into a handful of constant bits — signedness for almost free."
kind: circuit
source: "ASA §8.3.1, pp. 214-216 (Fig. 8.7, p. 216)"
status: seed
spade: simulated
tags: [digital, multipliers, signed, twos-complement, array-multiplier]
aliases:
  - Baugh-Wooley
  - Baugh-Wooley Array
  - Baugh-Wooley Multiplication
  - Signed Array Multiplier
---

# Baugh-Wooley Multiplier

A signed radix-2 array multiplier that costs the same compressor tree as the unsigned one, because every sign-extension run in the partial-product array is algebraically traded for a single complemented bit plus a design-time constant.

```tikz title="Baugh-Wooley partial-product array for a 4x4 signed multiplier, before and after sign-extension reduction"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm]
  \fill[black!10] (-0.45,0.26) rectangle (4.35,-0.26);
  \fill[black!10] (-0.45,-0.36) rectangle (3.05,-0.88);
  \fill[black!10] (-0.45,-0.98) rectangle (1.75,-1.50);
  \fill[black!10] (-0.45,-1.60) rectangle (0.45,-2.12);
  \node[font=\scriptsize\itshape,anchor=west] at (-0.45,0.68) {shaded: sign-extension cells};
  \node[font=\scriptsize] at (0.00,0.00) {$x_0y_3$};
  \node[font=\scriptsize] at (1.30,0.00) {$x_0y_3$};
  \node[font=\scriptsize] at (2.60,0.00) {$x_0y_3$};
  \node[font=\scriptsize] at (3.90,0.00) {$x_0y_3$};
  \node[font=\scriptsize] at (5.20,0.00) {$x_0y_3$};
  \node[font=\scriptsize] at (6.50,0.00) {$x_0y_2$};
  \node[font=\scriptsize] at (7.80,0.00) {$x_0y_1$};
  \node[font=\scriptsize] at (9.10,0.00) {$x_0y_0$};
  \node[font=\scriptsize] at (0.00,-0.62) {$x_1y_3$};
  \node[font=\scriptsize] at (1.30,-0.62) {$x_1y_3$};
  \node[font=\scriptsize] at (2.60,-0.62) {$x_1y_3$};
  \node[font=\scriptsize] at (3.90,-0.62) {$x_1y_3$};
  \node[font=\scriptsize] at (5.20,-0.62) {$x_1y_2$};
  \node[font=\scriptsize] at (6.50,-0.62) {$x_1y_1$};
  \node[font=\scriptsize] at (7.80,-0.62) {$x_1y_0$};
  \node[font=\scriptsize] at (0.00,-1.24) {$x_2y_3$};
  \node[font=\scriptsize] at (1.30,-1.24) {$x_2y_3$};
  \node[font=\scriptsize] at (2.60,-1.24) {$x_2y_3$};
  \node[font=\scriptsize] at (3.90,-1.24) {$x_2y_2$};
  \node[font=\scriptsize] at (5.20,-1.24) {$x_2y_1$};
  \node[font=\scriptsize] at (6.50,-1.24) {$x_2y_0$};
  \node[font=\scriptsize] at (0.00,-1.86) {$\overline{x_3y_3}$};
  \node[font=\scriptsize] at (1.30,-1.86) {$\overline{x_3y_3}$};
  \node[font=\scriptsize] at (2.60,-1.86) {$\overline{x_3y_2}$};
  \node[font=\scriptsize] at (3.90,-1.86) {$\overline{x_3y_1}$};
  \node[font=\scriptsize] at (5.20,-1.86) {$\overline{x_3y_0}$};
  \node[font=\scriptsize,red!70!black] at (5.20,-2.48) {$1$};
  \node[font=\scriptsize] at (-1.05,-0.62) {$+$};
  \node[font=\scriptsize] at (-1.05,-1.24) {$+$};
  \node[font=\scriptsize] at (-1.05,-1.86) {$+$};
  \node[font=\scriptsize] at (-1.05,-2.48) {$+$};
  \draw (-1.35,-2.82) -- (9.65,-2.82);
  \node[font=\scriptsize] at (0.00,-3.19) {$p_{7}$};
  \node[font=\scriptsize] at (1.30,-3.19) {$p_{6}$};
  \node[font=\scriptsize] at (2.60,-3.19) {$p_{5}$};
  \node[font=\scriptsize] at (3.90,-3.19) {$p_{4}$};
  \node[font=\scriptsize] at (5.20,-3.19) {$p_{3}$};
  \node[font=\scriptsize] at (6.50,-3.19) {$p_{2}$};
  \node[font=\scriptsize] at (7.80,-3.19) {$p_{1}$};
  \node[font=\scriptsize] at (9.10,-3.19) {$p_{0}$};
  \node[font=\scriptsize] at (-1.05,-3.19) {$=$};
  \node[font=\small,anchor=north] at (4.55,-3.69) {(a) $w=4$ signed array: every row sign-extended to $w_P=8$};
  \node[font=\scriptsize,red!70!black] at (3.90,-5.05) {$1$};
  \node[font=\scriptsize] at (5.20,-5.05) {$\overline{x_0y_3}$};
  \node[font=\scriptsize] at (6.50,-5.05) {$x_0y_2$};
  \node[font=\scriptsize] at (7.80,-5.05) {$x_0y_1$};
  \node[font=\scriptsize] at (9.10,-5.05) {$x_0y_0$};
  \node[font=\scriptsize] at (3.90,-5.67) {$\overline{x_1y_3}$};
  \node[font=\scriptsize] at (5.20,-5.67) {$x_1y_2$};
  \node[font=\scriptsize] at (6.50,-5.67) {$x_1y_1$};
  \node[font=\scriptsize] at (7.80,-5.67) {$x_1y_0$};
  \node[font=\scriptsize,red!70!black] at (0.00,-6.29) {$1$};
  \node[font=\scriptsize,red!70!black] at (1.30,-6.29) {$1$};
  \node[font=\scriptsize] at (2.60,-6.29) {$\overline{x_2y_3}$};
  \node[font=\scriptsize] at (3.90,-6.29) {$x_2y_2$};
  \node[font=\scriptsize] at (5.20,-6.29) {$x_2y_1$};
  \node[font=\scriptsize] at (6.50,-6.29) {$x_2y_0$};
  \node[font=\scriptsize] at (0.00,-6.91) {$\overline{x_3y_3}$};
  \node[font=\scriptsize] at (1.30,-6.91) {$\overline{x_3y_3}$};
  \node[font=\scriptsize] at (2.60,-6.91) {$\overline{x_3y_2}$};
  \node[font=\scriptsize] at (3.90,-6.91) {$\overline{x_3y_1}$};
  \node[font=\scriptsize] at (5.20,-6.91) {$\overline{x_3y_0}$};
  \node[font=\scriptsize] at (-1.05,-5.67) {$+$};
  \node[font=\scriptsize] at (-1.05,-6.29) {$+$};
  \node[font=\scriptsize] at (-1.05,-6.91) {$+$};
  \draw (-1.35,-7.25) -- (9.65,-7.25);
  \node[font=\scriptsize] at (0.00,-7.62) {$p_{7}$};
  \node[font=\scriptsize] at (1.30,-7.62) {$p_{6}$};
  \node[font=\scriptsize] at (2.60,-7.62) {$p_{5}$};
  \node[font=\scriptsize] at (3.90,-7.62) {$p_{4}$};
  \node[font=\scriptsize] at (5.20,-7.62) {$p_{3}$};
  \node[font=\scriptsize] at (6.50,-7.62) {$p_{2}$};
  \node[font=\scriptsize] at (7.80,-7.62) {$p_{1}$};
  \node[font=\scriptsize] at (9.10,-7.62) {$p_{0}$};
  \node[font=\scriptsize] at (-1.05,-7.62) {$=$};
  \node[font=\small,anchor=north] at (4.55,-8.12) {(c) reduced: 4 rows, constant $2^7\!+\!2^6\!+\!2^4$ (red)};
\end{circuitikz}
\end{document}
```

*After Fig. 8.7 (a) and (c), p. 216; the book's intermediate panel (b) is the constant-collecting step described below.*

**Substitute the two's-complement value of the multiplier and distribute.** For $X$ on $w$ bits in two's complement, $X=-2^{w-1}x_{w-1}+\sum_{i=0}^{w-2}2^ix_i$ (see [[Two's Complement]]); multiplying by $Y$ and applying **distributivity of $\times$ over $+$**,

$$X\times Y=\left(-2^{w-1}x_{w-1}+\sum_{i=0}^{w-2}2^ix_i\right)Y=-2^{w-1}x_{w-1}Y+\sum_{i=0}^{w-2}2^ix_iY$$

Each of the $w$ terms is still one AND-gate row, exactly as in the [[Unsigned Array Multiplier]] — $x_i\wedge y_j$ for all $i,j$, so $w^2$ gates. Two things change, and only two.

**Every row must be sign-extended, because $Y$ is itself signed.** The row $x_iY$ is $0$ or $Y$, and $Y$ is a $w$-bit two's-complement number whose value only equals its bit pattern when the pattern is replicated up to the full product width $w_P=2w$. So row $i$ carries its real bits at weights $2^i\ldots2^{i+w-1}$ and then the bit $x_iy_{w-1}$ repeated at every weight from $2^{i+w-1}$ up to $2^{2w-1}$. Panel (a) of the diagram is that array: $w$ rows, the shaded staircase is pure replication. The bit count has grown from $w^2$ to $\sum_{i=0}^{w-1}(2w-i)\approx\tfrac32 w^2$, and worse, the tallest column now has $w$ entries *of extension alone* — this is what would make signedness expensive if you stopped here.

**The top row is subtracted, not added, so negate it.** By the two's-complement identity $-z=\bar z+1$, replace $2^{w-1}x_{w-1}Y$ by the bitwise complement of its (sign-extended) $2w$-bit pattern and inject a $1$ at that row's LSB, weight $2^{w-1}$. The complement of the all-zero tail below weight $2^{w-1}$ is all ones, and adding $1$ there carries straight up into $2^{w-1}$, which is why the negation touches only the row's own $w+1$ cells — that is the bottom row of panel (a), $\overline{x_3y_j}$ with the red $1$ at $p_3$.

**Trade each extension run for one complemented bit plus a constant.** A sign bit $s$ at weight $2^n$ replicated up to $2^{N-1}$ contributes exactly $-2^ns$ to an $N$-bit sum. Substituting $s=1-\bar s$ gives $-2^ns=2^n\bar s-2^n$, and $-2^n\equiv\sum_{k=n}^{N-1}2^k \pmod{2^N}$, so

$$\underbrace{s\,s\,\cdots\,s}_{\text{weights }2^{N-1}\ldots2^{n}}\ \equiv\ \bar s\ \text{at }2^n\ +\ \underbrace{1\,1\,\cdots\,1}_{\text{weights }2^{N-1}\ldots2^{n}}\pmod{2^N}$$

This is the **sign-extension reduction** of [[Sums of Weighted Bits]] applied per row: the whole run of $2w-1-i$ replicated bits becomes one inverted bit — the AND gate becomes a NAND gate, free — plus a run of *constants*, which are not signals at all. Row $i\le w-2$ therefore shrinks back to exactly $w$ cells at weights $2^i\ldots2^{i+w-1}$, its top one inverted.

**Add all the constants at design time; three bits survive.** The constants from the $w-1$ positive rows are $\sum_{i=0}^{w-2}\left(2^{2w}-2^{i+w-1}\right)$, and the negated top row adds its $+1$ at $2^{w-1}$. Since $\sum_{i=0}^{w-2}2^{i+w-1}=2^{2w-2}-2^{w-1}$, the total collapses to

$$C=-\left(2^{2w-2}-2^{w-1}\right)+2^{w-1}=2^{w}-2^{2w-2}\equiv 2^{2w-1}+2^{2w-2}+2^{w}\pmod{2^{2w}}$$

**Three constant bits, independent of $w$.** For $w=4$ that is $2^7+2^6+2^4=208$, exactly the three red $1$s of panel (c) — the figure is arithmetic, not decoration.

**The compressor tree is the unsigned one, unchanged.** Panel (c) has $w$ rows of $w$ cells (the top row keeps one duplicated $\overline{x_{w-1}y_{w-1}}$, so $w^2+1$ in the book's arrangement) and a maximum column height of $w$ — identical to the unsigned array. Of the $w^2$ gates, $2(w-1)$ are NAND instead of AND, which in static CMOS is *cheaper*, not dearer. Folding the top-left corner as well — keep $x_{w-1}y_{w-1}$ uncomplemented at $2^{2w-2}$ instead of complementing it twice — removes the duplicate and drops the constant to two bits, $2^{2w-1}+2^{w}$; that is the form usually printed as "the" Baugh-Wooley identity and the one boxed below.

> [!note]
> The constants are not free bits in the [[Bit Heaps|bit heap]] so much as a free *addend*: they enter as literal $1$s at three fixed columns, so a column that was not already at compressor capacity absorbs them at zero depth, and in practice they are folded into the constant input of the final carry-propagate adder. The whole cost of signedness in a radix-2 multiplier is those bits and $2(w-1)$ inverters.

**On FPGAs the question mostly evaporates, but not entirely.** DSP blocks (`DSP48`, `DSP58`) are natively signed, so a multiplier that fits one tile never sees this identity. It comes back the moment you build the array out of LUTs, or pack two small signed multiplications into one DSP, where the sign rows of the packed operands collide — see [[Signed DSP Multiplier Packing]] and [[LUT-Based Multiplier Tiles]]. ASIC flows use it unconditionally: it is the reason a signed array multiplier and an unsigned one have the same area to within a rounding error.

For rectangular operands $w_X\ne w_Y$ the same derivation runs unchanged and the constant becomes $2^{w_X+w_Y-1}+2^{w_X-1}+2^{w_Y-1}$, which degenerates correctly to $2^{2w-1}+2^{w}$ when $w_X=w_Y=w$.

$$\boxed{\ X Y \equiv \sum_{i,j=0}^{w-2}2^{i+j}x_iy_j\;+\;\sum_{k=0}^{w-2}2^{w-1+k}\!\left(\overline{x_{w-1}y_k}+\overline{x_ky_{w-1}}\right)\;+\;2^{2w-2}x_{w-1}y_{w-1}\;+\;2^{2w-1}+2^{w}\pmod{2^{2w}}\ }$$

Verified exhaustively for $w=4,5,8$ over all $2^{2w}$ operand pairs, and in simulation below for $w=8$.

## When it breaks

- **The identity is modular, not exact.** It holds $\bmod\ 2^{2w}$; the $2^{2w-1}$ term is a carry out of the top column that you must *discard*, not widen the adder to keep. Build a $2w+1$-bit final adder "to be safe" and every product comes out wrong by $2^{2w-1}$.
- **Mixed signedness needs a different constant.** Signed $\times$ unsigned has only one sign row and one sign column disappears; re-derive rather than reuse. The all-unsigned case is the plain [[Unsigned Array Multiplier]] with $C=0$.
- **$w=1$ is degenerate.** A 1-bit two's-complement number is $\{0,-1\}$; the inner sum is empty and the identity reduces to $x_0y_0$ at $2^0$, which is $(-x_0)(-y_0)$ only because $2^{2w-2}=2^0$. Do not generate hardware from the formula at $w<2$.
- **It saves array size, never depth.** The column height is still $w$, so the compressor tree is still $O(\log w)$ levels deep. Halving the *row count* is [[Booth's Algorithm|Booth recoding]]'s job, and Booth needs its own sign management (Fig. 8.9, p. 220) which Baugh-Wooley does not supply.
- **Truncation interacts.** Two of the three constant bits sit at the very top of the array, so they always survive; the low one at $2^{w}$ sits inside the columns [[Truncated Multipliers]] may delete, and it must then be merged into that scheme's correction constant $C$ rather than dropped.
- **DSP-based designs get it for free**, so the technique only pays where you are building the array yourself out of logic.

## RTL (Spade)

```spade
/// Baugh-Wooley signed 8x8 -> 16.
/// One unsigned 7x7 core, two complemented sign rows, the corner term,
/// and the single constant 2^15 + 2^8.
entity bw8(x: int<8>, y: int<8>) -> int<16> {
    let xb = x.as_bits();
    let yb = y.as_bits();
    let xl: uint<7> = xb[0..7].as_uint();
    let yl: uint<7> = yb[0..7].as_uint();

    let pcore: uint<14> = xl * yl;
    let srow:  uint<7>  = ~(if xb[7] { yl } else { 0 });
    let scol:  uint<7>  = ~(if yb[7] { xl } else { 0 });
    let corner: uint<16> = if xb[7] && yb[7] { 1 << 14 } else { 0 };

    let sum: uint<16> = zext::<14, 16>(pcore)
        +. (zext::<7, 16>(srow) << 7)
        +. (zext::<7, 16>(scol) << 7)
        +. corner
        +. 0x8100;
    sum.as_int()
}
```

`pcore` is the unshaded $7\times7$ block of panel (c) — the ordinary unsigned array, $x_iy_j$ for $i,j\le6$. `srow` and `scol` are the two complemented sign lines $\overline{x_7y_k}$ and $\overline{x_ky_7}$, each `uint<7>` and each entering at weight $2^7$, which is the `<< 7`. `corner` is the single uncomplemented $x_7y_7$ at $2^{14}$, and `0x8100` is $2^{15}+2^{8}$ — the boxed constant, a literal, costing nothing. Every `+.` is the **wrapping** add: that is the $\bmod\ 2^{16}$ of the identity made explicit, and using plain `+` here would widen to 17 bits and be wrong. The whole entity is combinational. Synthesis will not build it as drawn: `*` becomes whatever the target prefers (a DSP tile on FPGA, a Wallace or Dadda tree in ASIC), and the four `+.` are merged into that tree's bit heap rather than four separate adders — the drawing shows the *weights*, not the adder count.

> [!warning] Spade trap, not in the cheat sheet
> Naming a local `core` shadows the `core::` namespace and breaks the compiler's own prelude with `error: Use of undeclared name core::ops` pointing inside `core/prelude.spade`. Hence `pcore`.

## Related Notes

- [[Unsigned Array Multiplier]] – extends: this is that array with $2(w-1)$ ANDs swapped for NANDs and one constant addend; the compressor tree is bit-for-bit identical.
- [[Two's Complement]] – depends-on: the entire construction is the identity $-z=\bar z+1$ plus the negatively-weighted MSB, applied twice.
- [[Bit Heaps]] – supports: the reduced array and its three constant bits are handed to the heap as ordinary weighted bits, which is why the constants cost no depth.
- [[Sums of Weighted Bits]] – depends-on: supplies the sign-extension reduction that turns each replication run into one inverted bit plus constants.
- [[Booth's Algorithm]] – compares: attacks the row *count* rather than the row *width*, halving the tree at the price of its own recoding and sign handling.
- [[Signed DSP Multiplier Packing]] – counter-example: on FPGAs the DSP is natively signed, so the win disappears — except when packing several signed products into one tile, where the sign rows collide again.
- [[Truncated Multipliers]] – compares: also rewrites the array as "fewer bits plus a constant", but its constant buys error compensation rather than signedness, and the two constants must be merged.
- [[Choosing a Multiplier]] – compares: where a signed radix-2 array sits against Booth, tiling and Karatsuba.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Chapter 8, "Fixed-Point Multiplication":

- 8.3 Partial Product Generation and Sign Management — pp. 214–216 (unsigned double sum p. 214, signed radix-2 expansion (8.16) p. 215, sign-extension replacement and constant compression Fig. 8.7 p. 216)
- 8.3.2 Radix-4 Booth Encoding — pp. 216–221 (contrast: row-count reduction and its own sign management, Fig. 8.9 p. 220)
- 8.4 Multiplier Construction for FPGAs — pp. 222–231 (why DSP tiles make the question moot, LUT tiles where it does not)
