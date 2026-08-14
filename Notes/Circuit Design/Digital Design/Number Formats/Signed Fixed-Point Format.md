---
title: "Signed Fixed-Point Format"
description: "Negates the weight of the MSB only, so one integer adder serves signed and unsigned alike — at the cost of an asymmetric range with no opposite for -2^m."
kind: concept
source: "ASA §2.1.2-2.1.4 and §2.2.1-2.2.2, pp. 35-41"
status: seed
spade: simulated
tags: [digital, number-formats, twos-complement, fixed-point, overflow]
aliases:
  - sfix
  - Signed Fixed-Point
  - Two's Complement Fixed-Point
  - Two's Complement Fixed-Point Binary Representation
  - Unsigned Fixed-Point Format
  - ufix
---

# Signed Fixed-Point Format

$\mathrm{sfix}(m,\ell)$ is the fixed-point format that negates the weight of the top bit and nothing else, which makes its addition literally the same circuit as unsigned addition — the two formats differ only in how overflow is detected.

```tikz title="The 16 codes of a 4-bit word as the ring Z/16Z, read twice: unsigned inside, two's complement outside, with the two wrap cuts marked"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]

% the 16 codes of a w=4 word, laid on the ring Z/16Z
\foreach \i/\b in {0/0000,1/0001,2/0010,3/0011,4/0100,5/0101,6/0110,7/0111,
                   8/1000,9/1001,10/1010,11/1011,12/1100,13/1101,14/1110,15/1111} {
  \pgfmathsetmacro{\ang}{90-22.5*\i}
  \pgfmathtruncatemacro{\sv}{ifthenelse(\i<8,\i,\i-16)}
  \fill[gray!55] (\ang:2.10) circle (1.1pt);
  \node[font=\tiny] at (\ang:2.48) {$\b$};
  \node[green!35!black] at (\ang:1.74) {$\i$};
  \node[blue!60!black] at (\ang:3.20) {$\sv$};
}
\draw[gray!45] (0,0) circle (2.10);

% the two cuts: the only place the two readings differ
\draw[red!70!black,very thick] (101.25:1.30) -- (101.25:2.90);
\draw[blue!65!black,very thick,dashed] (-78.75:1.30) -- (-78.75:3.55);

\node[red!70!black,align=center,font=\tiny] at (0,3.95)
  {unsigned cut $15\!\to\!0$: carry out of $2^{3}$ discarded};
\node[blue!65!black,align=center,font=\tiny] at (0,-4.05)
  {signed cut $7\!\to\!-8$: signed overflow};

\node[align=center] at (0,0.30) {same 4 wires\\$x_3x_2x_1x_0$};
\node[align=center,font=\tiny] at (0,-0.60) {$+$ steps clockwise\\in both readings};

\node[green!35!black,anchor=north east,align=right,font=\tiny] at (-3.5,4.1)
  {inner ring: $\mathrm{ufix}(3,0)$\\$X=\sum_{i=0}^{3}2^ix_i$\\$X\in[0,15]$};
\node[blue!60!black,anchor=north west,align=left,font=\tiny] at (3.5,4.1)
  {outer ring: $\mathrm{sfix}(3,0)$\\$X=-2^3x_3+\sum_{i=0}^{2}2^ix_i$\\$X\in[-8,7]$};

\end{circuitikz}
\end{document}
```

*after Fig. 2.2, p. 35, relabelled with the bit weights of Fig. 2.6, p. 41.*

**Start from positions, not counts.** A fixed-point format is named by two bit *positions* $m\ge\ell$, both allowed to be negative: bit $x_i$ sits at position $i$ and carries weight $2^{i}$. The unsigned format $\mathrm{ufix}(m,\ell)$ is then $X=\sum_{i=\ell}^{m}2^{i}x_{i}$ (2.6), from which width $w=m-\ell+1$, ulp $2^{\ell}$ and maximum $2^{m+1}-2^{\ell}$ all follow by counting positions and summing a geometric series — details in [[Number Formats]]. The convention is worth the extra abstraction because counts break where positions do not: a signal bounded by $2^{-5}$ lives in $\mathrm{ufix}(-6,-16)$, a format with *minus five* integer bits, which no `Qi.f` name describes honestly (p. 44).

**Negate exactly one weight and inherit everything else.** $\mathrm{sfix}(m,\ell)$ flips the sign of the topmost weight and changes nothing else:

$$X=-2^{m}x_{m}+\sum_{i=\ell}^{m-1}2^{i}x_{i}\tag{2.8}$$

Every derived quantity that depends on the *positions* rather than the *signs* survives untouched: the width is still $w=m-\ell+1$ bits, the ulp is still $2^{\ell}$, and factoring $2^{\ell}$ out of (2.8) still exhibits the value as a $w$-bit integer times the compile-time constant $2^{\ell}$. The scaling factor lives in the wire naming and never in the hardware. Two families are worth naming: $\mathrm{sfix}(w-1,0)$ is the $w$-bit two's complement integer, and $\mathrm{sfix}(0,-w+1)$ covers $[-1,1)$ — sign bit of weight $2^0$, LSB of weight $2^{-w+1}$ — which is the natural home of a normalised signal or a filter coefficient. The degenerate case $m=\ell$ is legal and yields a one-bit signed number taking only $0$ and $-2^{m}$.

**Read the asymmetry straight off the sum.** Setting $x_m=1$ and every other bit to $0$ gives the minimum $-2^{m}$; setting $x_m=0$ and every other bit to $1$ gives the maximum, which by the geometric sum $\sum_{i=\ell}^{m-1}2^{i}=2^{m}-2^{\ell}$ is exactly $2^{m}-2^{\ell}$. So

$$X\in[-2^{m},\;2^{m}-2^{\ell}]$$

is one ulp deeper on the negative side. A counting argument says this is forced rather than chosen: $w$ bits give $2^{w}$ codes, a closed interval symmetric about zero holds an odd number of representable values, and $2^{w}$ is even. Zero must be assigned to one side, it is assigned to the positive side, and the spare code falls to the negative side. **The value $-2^{m}$ therefore has no opposite inside the format**, and that single fact is the source of most two's-complement bugs.

**Bitwise NOT is a subtraction, by the same geometric sum.** The all-ones $w$-bit word is $\sum_{i=0}^{w-1}2^{i}=2^{w}-1$. Complementing bit by bit computes $1-x_i=\overline{x_i}$ in each column independently — no column can borrow, because $1-x_i\ge 0$ always — so complementing the whole word subtracts it from the all-ones word:

$$\overline{X}=(2^{w}-1)-X\tag{2.2}$$

**One increment turns that into negation.** Add $1$ to both sides of (2.2) to get $\overline{X}+1=2^{w}-X$, and $2^{w}\equiv 0 \pmod{2^{w}}$, so

$$-X=\overline{X}+1 \bmod 2^{w}\tag{2.3}$$

Negation is a row of $w$ inverters plus an increment, and the increment is usually free because it is absorbed into the carry-in of whatever adder consumes the result — [[Two's Complement Negator]] is that circuit. Check the fixed points, which is where identities like this fail: $-0$ gives $\overline{0000}+1=1111+1=0000$ ✓, and $-1$ gives $\overline{0001}+1=1110+1=1111$ ✓. The one input it does not handle is $-2^{m}$, whose negation lands back on itself, because the true answer is outside the range established above.

**Closure comes free from a ring homomorphism, and that is what buys the shared adder.** A $w$-bit word cannot hold the sum of two $w$-bit words — $15+2=17$ needs five bits — so the hardware necessarily discards the bit of weight $2^{w}$. What survives is not a mutilated addition but an exact one **in $\mathbb{Z}/2^{w}\mathbb{Z}$**. Unsigned and signed fixed point are two different choices of coset representatives for that same ring, $[0,2^{w}-1]$ and $[-2^{w-1},2^{w-1}-1]$, which is exactly what the two label rings in the diagram are. Reduction mod $2^{w}$ is a ring homomorphism, so addition, subtraction and multiplication descend to the quotient no matter which representatives you name. Worked: $(-2)+(-1)$ on four bits is $1110_2+1111_2$, which the *unsigned* adder reads as $14+15=29=11101_2$; keep four bits and the result is $1101_2=-3$ ✓. Hence one [[RCA, Ripple-Carry Adder]] — or any of its siblings in [[Adders]] — serves both interpretations with no extra gate.

**The only difference is the overflow flag.** Both readings wrap, but at different cuts, so each needs its own detector. Unsigned overflow is the carry out of position $m$, a single wire the adder already produces. Signed overflow cannot be that wire — the diagram's dashed cut sits half a turn from the solid one. It is instead $c_{w}\oplus c_{w-1}$, the disagreement between the carry into the sign column and the carry out of it; equivalently, and more directly in RTL, adding two operands of the *same* sign and getting a result of the *opposite* sign:

$$\mathrm{ovf}_{s}=(x_{m}=y_{m})\wedge(s_{m}\ne x_{m})$$

Operands of opposite sign can never overflow, since there $|x+y|\le\max(|x|,|y|)$. On an FPGA this costs even less than it looks: the hard carry chain is an unsigned adder exposing a carry at every position, both interpretations map onto it identically, and that is why declaring a bus `signed` rather than `unsigned` in an HDL changes not one LUT in an adder. It changes plenty in a comparator or a multiplier.

**Widening and narrowing are where the negated weight stops being invisible.** Right-padding with zeros is still errorless — weight-zero bits contribute nothing to (2.8) — but left-padding with zeros would silently reinterpret the sign bit as $+2^{m}$, so the sign bit is replicated instead ([[Sign Extension]]). Cutting at the top is overflow and cutting at the bottom is rounding, which are [[Fixed-Point Format Narrowing]] and [[Error Accuracy]]; ulp and rounding modes are not re-derived here.

**Why not sign-magnitude.** The alternative $X=(-1)^{s}\sum_{i=\ell}^{m-1}2^{i}x_{i}$ buys a symmetric range and pays for it three times: two encodings of zero, so equality is not bit equality; a different datapath for add and for subtract, selected by a magnitude comparison; and no free widening. It survives only inside floating-point significands, where the sign is a separate field anyway — see [[Sign-Magnitude to Two's Complement Converter]] and [[IEEE 754 Format]].

> [!warning] Source error, printed p. 38
> The book gives the sign-magnitude range as $X\in[-2^{w-1}-1,\,2^{w-1}-1]$ and then states in the next sentence that it is symmetric about zero. Both cannot hold. The magnitude field is $w-1$ bits, so the largest magnitude is $2^{w-1}-1$ and the range is $[-(2^{w-1}-1),\,2^{w-1}-1]$. Counterexample at $w=4$: the most negative code is $1111_2=-7$, whereas the printed formula claims $-2^{3}-1=-9$, which no 4-bit word encodes at all.

$$\boxed{\ X=-2^{m}x_{m}+\sum_{i=\ell}^{m-1}2^{i}x_{i}\in[-2^{m},\,2^{m}-2^{\ell}],\qquad \text{add mod } 2^{w}\ \text{shared with}\ \mathrm{ufix}(m,\ell)\ }$$

**When it breaks.**

- **$-2^{m}$ has no opposite.** Negation, absolute value, and conversion to sign-magnitude all fail on exactly this one code, and they fail silently: $-(-2^{m})$ returns $-2^{m}$. A datapath that negates must widen by one bit first or saturate.
- **The unsigned carry-out is not a signed overflow flag, and vice versa.** $1111_2+1111_2$ carries out but does not overflow as $(-1)+(-1)$; $0111_2+0001_2$ overflows as $7+1$ but produces no carry-out. Reusing the wrong flag is the classic silent bug.
- **Only $+$, $-$ and the *low half* of $\times$ are interpretation-agnostic.** The full $2w$-bit product is not: the homomorphism guarantees agreement mod $2^{w}$, not mod $2^{2w}$. A full-width signed product needs a signed multiplier — Baugh-Wooley sign handling, or [[Booth's Algorithm]].
- **Order is not preserved by reinterpretation.** $1000_2<0111_2$ signed but $>$ unsigned, so a [[Magnitude Comparator]] genuinely differs between the formats even though the adder does not.
- **Zero-extension is a value change, not a no-op**, whenever the source is signed. Mixed-width signed arithmetic is where this format's one asymmetry does the most damage.
- **`>>` is arithmetic and rounds toward $-\infty$, not toward zero.** $-1\gg 1=-1$, not $0$; division by a power of two and an arithmetic right shift are different operators on negative values.

**RTL (Spade).**

```spade
/// One wrapping adder, two interpretations: the sum wires are shared,
/// only the two overflow flags differ.
fn add_mod2w<#uint W>(x: uint<W>, y: uint<W>) -> (uint<W>, bool, bool) {
    let full: uint<{W + 1}> = x + y;          // W+1 bits: the carry-out is full[W]
    let s: uint<W> = trunc(full);             // the shared result, mod 2^W
    let ovf_u = full.msb();                   // unsigned: carry out of position m
    let ovf_s = (x.msb() == y.msb()) && (s.msb() != x.msb());
    (s, ovf_u, ovf_s)
}
```

`x` and `y` are the raw $w$-bit words, deliberately `uint<W>` and not `int<W>`, because the whole claim is that the encoding is a *reading* of the bits and not a property of the wires. `full` is the diagram's full circle before the cut — `uint<{W+1}>`, since Spade's `+` grows by one bit — and `trunc` discards weight $2^{W}$, which is the hardware's mod-$2^{W}$ reduction. `ovf_u` is that discarded bit; `ovf_s` is the sign-agreement test above, so the sign convention costs flag logic and nothing else. Purely combinational, nothing registered. Synthesis will map `s` onto a single carry chain either way, collapsing the drawing's two coloured cuts into these two single-bit outputs.

Concrete wrapper used to force monomorphisation and to give the testbench something to instantiate — not part of the circuit:

```spade
entity sfix_add8(x: uint<8>, y: uint<8>) -> (uint<8>, bool, bool) {
    add_mod2w::<8>(x, y)
}
```

Simulated against a behavioural reference: 7 named vectors — including the asymmetric $1+128$ and its reverse, plus $127+1$ (signed overflow, no carry) and $255+255$ (carry, no signed overflow) — then 4000 random pairs. 4007 of 4007 matched on all three outputs.

**Related notes.**

- [[RCA, Ripple-Carry Adder]] – supports: the one adder both readings share, unchanged.
- [[Two's Complement Negator]] – extends: turns identity (2.3) into inverters plus a carry-in.
- [[Sign Extension]] – extends: widening this format costs fanout of one wire, not gates.
- [[Fixed-Point Format Narrowing]] – extends: what happens when $m$ or $\ell$ moves inward.
- [[Sign-Magnitude to Two's Complement Converter]] – compares: the symmetric-range rival, and the cost of crossing to it.
- [[Magnitude Comparator]] – counter-example: ordering, unlike addition, does not survive reinterpretation.
- [[Booth's Algorithm]] – counter-example: multiplication above the low $w$ bits needs the sign handled explicitly.
- [[Number Formats]] – depends-on: the position-based convention this format inherits.
- [[Error Accuracy]] – depends-on: everything that happens at the $\ell$ end.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §2.1.2 *Signed Integers in Two's Complement Representation*, pp. 35-36 — Fig. 2.2 (the modulo-16 ring, p. 35), Fig. 2.3 (p. 36), the interval $[-2^{w-1},2^{w-1}-1]$ and its asymmetry, and "the management of overflow situations is the only difference between additions in unsigned binary and two's complement".
- §2.1.3 *Sign-Magnitude Representation*, pp. 37-38 — eqs. (2.2), (2.3), (2.4), (2.5).
- §2.1.4 *Conversion Between Sign-Magnitude and Two's Complement*, p. 38 — the failure on $-2^{w-1}$.
- §2.2.1 *Unsigned Fixed-Point Binary Representation*, pp. 38-40 — eqs. (2.6), (2.7), Figs. 2.4 and 2.5, and the "what does precision mean?" box (p. 40); the `Q`-notation breakdown is p. 44.
- §2.2.2 *Two's Complement Fixed-Point Binary Representation*, p. 41 — eq. (2.8), Fig. 2.6 (bit weights of $\mathrm{sfix}(m,\ell)$), Fig. 2.7 ($\mathrm{sfix}(0,-7)$).

> [!warning] Page-offset correction for this chapter
> The shared brief states `PDF page = printed page + 22`. That holds at PDF 129 = printed 107, but **not in Chapter 2**: PDF 63 = printed 40 and PDF 64 = printed 41, so the offset here is `+23`. Every printed page cited above was opened and read at printed-page + 23. An extra page enters somewhere between printed 41 and printed 107.
