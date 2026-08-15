---
title: "First-Order eY Architecture"
description: "Drops the h box entirely by taking f(Z) ~ Z: eA table, one multiplier T_trunc x Z, one adder, truncate. Cheapest eY for binary16 (6x8 multiplier, 2 Kbit table) but the eA table grows as 2^(wF/2) and kills it by single precision."
kind: circuit
source: "ASA §22.5.2, pp. 659-660"
status: seed
spade: simulated
tags: [digital, fixed-point-computation-of-ey, exponential, table, multiplier, fixed-point]
aliases:
  - First-Order Architecture
  - First-Order eY
  - First-Order Exponential Architecture
---

# First-Order eY Architecture

The cheapest table-and-multiplier evaluator of $e^Y$: it truncates the Taylor series of $e^Z$ after its linear term, which deletes the transcendental function evaluator from the datapath entirely and leaves one table, one small multiplier and one adder.

```tikz title="First-order e^Y architecture: e^A table, one truncated multiplier, one adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- Y and the bit-position split ----
  \draw[->] (0,8.5) -- (0,7.3);
  \node[anchor=east,align=right] at (-0.15,8.05) {$Y$\quad\texttt{sfix}$(-1,\ell)$,\ $|\ell|$ bits};
  \draw (-2.6,7.3) -- (3.0,7.3);
  \node[anchor=south] at (-2.0,7.32) {$A$};
  \node[anchor=south] at (2.4,7.32) {$Z$};
  \draw[->] (-2.6,7.3) -- (-2.6,6.6);
  \node[anchor=east,align=right] at (-2.65,6.95) {\texttt{sfix}$(-1,-k)$,\ $k$ bits};
  \draw[->] (3.0,7.3) -- (3.0,4.3);
  \node[anchor=west,align=left] at (3.05,6.4) {\texttt{ufix}$(-k-1,\ell)$\\ $|\ell|-k$ bits};

  % ---- e^A table ----
  \draw (-3.9,5.5) rectangle (-1.3,6.6);
  \node[align=center] at (-2.6,6.05) {$e^A$ table\\ $2^k$ entries};
  \draw[->] (-2.6,5.5) -- (-2.6,2.7);
  \node[anchor=east,align=right] at (-2.65,3.55) {$T$\\ \texttt{ufix}$(0,\ell-2)$\\ $|\ell|+3$ bits};

  % ---- T_trunc tap ----
  \draw (-2.6,4.9) -- (1.0,4.9);
  \draw[->] (1.0,4.9) -- (1.0,4.3);
  \node[anchor=south,align=center] at (0.7,4.95)
    {$T_{\mathrm{trunc}}$\ \ \texttt{ufix}$(0,\ell+t)$\\ $|\ell|-t+1$ bits};

  % ---- multiplier ----
  \draw (0.2,3.5) rectangle (3.8,4.3);
  \node at (2.0,3.9) {$\times$};
  \draw[->] (2.0,3.5) -- (2.0,2.7);
  \node[anchor=west,align=left] at (2.05,3.1) {\texttt{ufix}$(-k,\ell-2)$,\ $|\ell|+2-k$ bits};

  % ---- adder ----
  \draw (-3.4,1.9) rectangle (2.9,2.7);
  \node at (-0.25,2.3) {$+$};
  \draw[->] (-0.25,1.9) -- (-0.25,1.2);
  \node[anchor=west] at (-0.2,1.55) {$M_{\mathrm{full}}$\quad\texttt{ufix}$(0,\ell-2)$,\ $|\ell|+3$ bits};

  % ---- final truncation ----
  \draw (-2.05,0.4) rectangle (1.55,1.2);
  \node at (-0.25,0.8) {round by truncation};
  \draw[->] (-0.25,0.4) -- (-0.25,-0.3);
  \node[anchor=west] at (-0.2,0.05) {$M$\quad\texttt{ufix}$(0,\ell)$,\ $|\ell|+1$ bits};
\end{circuitikz}
\end{document}
```

*After Fig. 22.7, p. 660. $\ell = -w_F-g$ is the LSB of the reduced argument; $k$ is the bit position at which $Y$ is split; $t$ sets how hard the table output is truncated before the multiplier. The figure carries two internal guard bits, so every wire between the table and the final truncation lives at LSB $\ell-2$.*

**Start from the decomposition every $e^Y$ architecture shares.** A second, multiplication-free range reduction splits the reduced argument $Y$ by bit position into $Y = A + Z$, where $A$ is the $k$ most significant bits (positions $-1$ down to $-k$, a signed $k$-bit word) and $Z$ is everything below (positions $-k-1$ down to $\ell$, an unsigned $|\ell|-k$-bit word). The split is exact — no rounding, just a wire cut — so $e^Y = e^{A+Z} = e^A\,e^Z$ holds identically. Writing $f(Z) = e^Z-1$ and distributing $\times$ over $+$ gives the shape drawn above:

$$e^A\times e^Z \;=\; e^A\times\bigl(1+f(Z)\bigr) \;=\; e^A \;+\; e^A\times f(Z)$$

The [[Higher-Order eY Architecture]] evaluates $f$ as $Z + h(Z)$ with $h(Z) = e^Z-Z-1$, and spends a whole function evaluator on $h$.

**Delete the function evaluator by keeping only the linear term.** Since $0\le Z<2^{-k}$, Taylor at $0$ gives $e^Z = 1 + Z + \tfrac{Z^2}{2}+\cdots$, so $f(Z) = Z + O(Z^2)$. The first-order architecture simply sets $h\equiv 0$ and uses $f(Z)\approx Z$. Everything downstream of that choice collapses: there is no $h$ box, no table or polynomial evaluator feeding it, and — because $Z$ now enters the multiplier in full rather than feeding a narrow $h$ — no $Z_{\mathrm{trunc}}$ tap either. What remains is the $e^A$ table, one multiplier, one adder, and a truncation.

**Price the deletion.** The approximation error is the entire neglected tail of the series:

$$\delta_{\mathrm{approx},1}(Z) \;=\; 1+Z-e^Z \;=\; -\frac{Z^2}{2}-\frac{Z^3}{6}-\cdots \qquad (22.30)$$

Every dropped term is negative, so the error is one-signed — the architecture always *undershoots* $e^Z$ — and its magnitude is a little above the leading term $Z^2/2$, which by $Z<2^{-k}$ is bounded by $2^{-2k-1}$. Inflating that leading term by a factor $1+2^{-k}$ is a gross but sound overestimate of the whole tail:

$$\bar\delta_{\mathrm{approx},1} \;=\; 2^{-2k-1}\left(1+2^{-k}\right) \qquad (22.31)$$

The one-signed nature matters: unlike a rounding error this term does not average out across the datapath, and since $T\approx e^A$ multiplies it, it reaches the output amplified by up to $1.65$ — the upper bound on $e^A$ over the operator's input range.

**Choose $k$ by pushing that error under the ulp.** With $u = 2^{\ell}$ the ulp of the result, requiring $2^{-2k-1}\le 2^{\ell-1}$ — a quarter-ulp of headroom, which is what leaves room for the rounding terms below — gives $2k \ge -\ell+1 = w_F+g+1$, so with $g=3$

$$k \;\ge\; \frac{w_F+4}{2}$$

This is the whole cost model of the architecture in one line: **$k$ must grow like $w_F/2$, and the table costs $2^k$ entries.** Square-root growth of the table in the number of fraction bits is exactly why this architecture is excellent at binary16 and hopeless at single precision.

> [!warning] The source states the same constraint two ways and they differ by one
> p. 660 first gives the order-of-magnitude relation $k\approx(\ell+1)/2$ — which is also sign-sloppy, since $\ell<0$ makes the right-hand side negative; read it as $|\ell+1|/2$ — and then states the constraint $k\ge(w_F+4)/2$. The two disagree by $1$ in $k$. The worked examples ($k=7$ for $w_F=10$, $k=14$ for $w_F=23$) follow the *second*, so that is the one used above.

**Size the rest of the datapath around the multiplier.** The $e^A$ table holds $2^k$ entries of `ufix`$(0,\ell-2)$, i.e. $|\ell|+3$ bits each; the two extra low bits are guard bits internal to the $e^Y$ operator, and the half-ulp rounding constant $2^{\ell-1}$ is pre-added to every entry so that the final round-to-nearest costs nothing but a truncation ([[eA Table]], [[Rounding]]). $T$ is then cut to `ufix`$(0,\ell+t)$ — $|\ell|-t+1$ bits — before entering the multiplier. That cut is not thrift for its own sake: $Z$ is only $|\ell|-k$ bits, a full-width $T$ against a short $Z$ is a badly *rectangular* multiplier, and a [[Truncated Multipliers|truncated multiplier]] is cheapest, and its error bound tightest, when its two operands are roughly the same length. Taking $t=k-1$ makes $T_{\mathrm{trunc}}$ exactly $|\ell|-k+2$ bits against $Z$'s $|\ell|-k$, which is as square as this datapath gets.

**The adder is mostly an incrementer.** $T$ is $|\ell|+3$ bits but the product is `ufix`$(-k,\ell-2)$, only $|\ell|+2-k$ bits, aligned at the same LSB. Carry therefore has to propagate across the product's width and then merely ripple through the top $k+1$ bits of $T$, so a [[RCA, Ripple-Carry Adder]] here is a full-adder chain of $|\ell|+2-k$ stages followed by a half-adder chain that has no second operand input at all. On an FPGA with a hard carry chain the distinction is invisible — one carry cell per bit either way — but on ASIC it removes roughly a third of the adder's gates at the binary16 sizing. $M_{\mathrm{full}}$ stays $|\ell|+3$ bits with its MSB at position $0$ because $e^Y<1.65<2$: the sum cannot carry out.

**What survives of the error budget.** Of the seven terms of the general analysis (22.29), the first-order architecture keeps four and zeroes three. $\delta_{\text{final round}}$ is zero, absorbed by the rounding bit pre-added to the table. $\delta_{\mathrm{trunc}Z}$ is zero, because $Z$ is used at full width. The exact-decomposition term was always zero. That leaves $\delta_{\mathrm{mult}}$ (one ulp, for a faithful truncated multiplier), $\delta_{\mathrm{trunc}T}$ (the dropped low bits of $T$, amplified by $Z<2^{-k}$), $\delta_T$ (tabulation of $e^A$, $0.625u$ with round-to-nearest), and — in place of $\delta_H$ — the one-signed $\bar\delta_{\mathrm{approx},1}$ above, amplified by $T$. See [[Error Accuracy]] for how these compose into the faithfulness argument, and [[Number Formats]] for the `sfix`/`ufix` notation.

> [!warning] The source leaves the error proof as an exercise
> p. 660 asserts that a simplified version of (22.29) shows the architecture meets $\bar\delta_{\mathrm{arch}}$ for $g=3$, but does not carry it out, and no term-by-term budget for the first-order variant appears anywhere in §22.5. The simulation below measures the binary16 case instead: worst-case $1.259u$ over all $2^{13}$ reduced arguments, comfortably inside the $g=3$ allowance.

**The two sizings the book works out.** For **binary16** ($w_F=10$, $g=3$, $\ell=-13$): $k=7$, so $Y$ is 13 bits, $A$ is 7, $Z$ is 6, the table is $2^7\times16 = 2$ Kbit, $T$ is truncated to LSB $\ell+k-1=-7$ giving an 8-bit $T_{\mathrm{trunc}}$, and the multiplier is $6\times8$ bits. That is a rounding error in an FPGA's budget — a $2^7\times16$ ROM is 16 bit-planes of a 128-entry lookup, two LUT6s each, so about 32 LUT6 of distributed ROM, and a $6\times8$ multiplier is far too small to justify occupying a DSP block. For **IEEE single** ($w_F=23$): $k=14$ and the multiplier is a still-modest $13\times12$, but the table is now $2^{14}$ entries of $|\ell|+3=29$ bits $\approx 464$ Kbit. The multiplier grew a little and the table grew $128\times$; that is the moment to switch to the [[Higher-Order eY Architecture]], whose $h$ box is $2k$ bits narrower than $e^Z$ and buys back the table growth.

$$\boxed{\;M \;=\; \operatorname{trunc}_{\ell}\!\bigl(T + T_{\mathrm{trunc}}\times Z\bigr),\qquad \bar\delta_{\mathrm{approx},1} = 2^{-2k-1}\bigl(1+2^{-k}\bigr),\qquad k \ge \tfrac{w_F+4}{2}\;}$$

**Where it breaks.**

- **Above about $w_F=16$.** $2^k = 2^{(w_F+4)/2}$ passes a few hundred entries and the $e^A$ table stops fitting in cheap memory long before the multiplier becomes a problem. Single precision needs $2^{14}$ entries; hand over to the [[Higher-Order eY Architecture]].
- **Below about $w_F=8$.** The multiplier and adder stop being worth their routing and their pipeline registers: tabulate $e^Y$ outright ([[Direct eY Table]]), which is also the only variant here that is *correctly* rounded.
- **If the argument range is not the one range reduction guarantees.** The $M_{\mathrm{full}}$ width assumes $e^Y<2$ so the final adder cannot carry out, and the $1.65$ amplification factor assumes $e^Y\le1.65$. Both come from the parent operator's reduced-argument range, not from anything inside this block.
- **When $g$ is held at $3$ and accuracy still misses.** $\bar\delta_{\mathrm{approx},1}$ is one-signed and structural, so unlike the higher-order variant there is no knob that trades it away — the only recovery is a larger $k$, which doubles the table for each extra bit.
- **On a DSP-rich FPGA the asymptotics mislead.** A $13\times12$ multiplier is one DSP block whatever you do to it, so at single precision the multiplier is effectively free and the table is the entire cost; the $t$ knob that balances the two operand widths buys nothing there.

**RTL, binary16 instance.**

```spade
/// First-order e^Y datapath, binary16 instance (w_F = 10, g = 3, l = -13, k = 7).
///   y    : sfix(-1, l)   13 bits — reduced argument; A = y[12:6], Z = y[5:0]
///   tval : ufix(0, l-2)  16 bits — e^A table entry, rounding bit 2^(l-1) pre-added
///   M    : ufix(0, l)    14 bits
entity exp_y_first_order(y: uint<13>, tval: uint<16>) -> uint<14> {
    // Z is the low w_F+g-k = 6 bits of Y; the high k = 7 bits address the e^A table.
    let z: uint<6> = y.as_bits()[0..6].as_uint();
    // T_trunc = T cut to LSB l+t = -7, i.e. the top 8 bits of T.
    let tt: uint<8> = tval.as_bits()[8..16].as_uint();
    // T_trunc x Z is exact in 14 bits (LSB 2^-20); keep it down to LSB l-2 = -15.
    let prod: uint<14> = zext::<8, 14>(tt) *. zext::<6, 14>(z);
    let p: uint<9> = prod.as_bits()[5..14].as_uint();
    // M_full = T + T_trunc*Z, both at LSB l-2; e^Y < 1.65 so no carry out of bit 0.
    let m_full: uint<16> = tval +. zext::<9, 16>(p);
    // Round by truncation: drop the two guard bits.
    m_full.as_bits()[2..16].as_uint()
}
```

`y` is the diagram's $Y$ wire and `tval` its $T$; the $e^A$ lookup itself is [[eA Table]], so the split's high half leaves this entity as the ROM address. Although $Y$ is `sfix`, the entity is entirely unsigned — the sign lives only in $A$, whose only use is as a table address, so everything downstream of the table is `ufix`. The three slices are the three fixed-point cuts of the drawing: `[8..16]` is the $T_{\mathrm{trunc}}$ tap ($t = k-1 = 6$), `[5..14]` truncates the exact product down to LSB $\ell-2$, `[2..16]` is the final round-by-truncation. `+.` is the wrapping add that holds $M_{\mathrm{full}}$ at $|\ell|+3 = 16$ bits, sound only because $e^Y<2$. The block is purely combinational; synthesis will not build the `*.` as the $14\times14$ multiplier it is written as, but as the $6\times8$ array the operand widths imply, and on FPGA both truncations vanish into routing rather than costing logic.

Simulated with the real $e^A$ table computed inside the testbench: 3 named asymmetric vectors (including $Z=1$ against $T_{\mathrm{trunc}}=128$), a 5000-vector random sweep against a bit-level reference model, and an **exhaustive sweep over all $2^{13}$ reduced arguments** against `$exp`. 13195 vectors, worst error $1.259u$ with $u=2^{-13}$.

**Related notes.**

- [[eA Table]] – depends-on: supplies $T$, and pre-adds the rounding bit that turns this note's final truncation into a correct round-to-nearest.
- [[Higher-Order eY Architecture]] – extends: puts the $h(Z)$ box back and pays for it with a $2k$-bit narrower evaluator, which is the right trade from single precision upward.
- [[Direct eY Table]] – counter-example: below about 8 fraction bits the multiplier and adder disappear too, and the result becomes correctly rounded.
- [[Choosing an eY Architecture]] – compares: where the $2^{w_F/2}$ table growth puts this against every sibling.
- [[Truncated Multipliers]] – supports: the $T_{\mathrm{trunc}}\times Z$ product, and the reason the parameter $t$ exists at all.
- [[RCA, Ripple-Carry Adder]] – supports: the final add, degenerating to a half-adder chain over the top $k+1$ bits.
- [[Rounding]] – supports: round-by-truncation made exact by the pre-added table constant.
- [[Multipliers]] – depends-on: the operand-width sizing that fixes $t$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §22.5.2 First-Order Architecture — pp. 659–660 (Fig. 22.7 p. 660; eqs. 22.30–22.31; the binary16 and single-precision sizings)
- §22.5.1 Using large tables and square multipliers — pp. 655–659 (the $Y=A+Z$ split, eqs. 22.19–22.27, and the error decomposition 22.29 this note prunes)
- §22.5.3 Polynomial approximation for large precisions — p. 660 (where the argument for handing over to the higher-order variant lands)
