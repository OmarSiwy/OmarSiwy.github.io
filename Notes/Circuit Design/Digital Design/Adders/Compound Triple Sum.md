---
title: Compound Triple Sum
description: "A half-adder row collapses position 0 to a single bit, so one compound adder on the upper bits plus a single mux delivers X+Y, X+Y+1 and X+Y+2 with no second prefix tree."
kind: circuit
source: "ASA §5.3.9, p. 125"
status: seed
spade: simulated
tags: [digital, adders, prefix, floating-point]
aliases:
  - Fast Compound Triple Sum
  - Triple Sum
  - Triple Sum Adder
---

# Compound Triple Sum

An operator that emits $X+Y$, $X+Y+1$ and $X+Y+2$ simultaneously, built from a
single [[Compound Adder]] by first spending one row of half adders to strip the
least-significant bit out of the carry-propagating part.

```tikz title="Compound triple sum: half-adder row, one compound adder, LSB re-attachment"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex, font=\scriptsize,
    blk/.style={draw, thick, minimum height=8mm, align=center},
    lbl/.style={font=\scriptsize, inner sep=1pt}]

  % --- inputs -------------------------------------------------------
  \draw[->] (1.6,6.2) -- (1.6,5.4);
  \draw[->] (4.8,6.2) -- (4.8,5.4);
  \node[lbl, anchor=east] at (1.55,5.9) {$X$ ($w$)};
  \node[lbl, anchor=west] at (4.85,5.9) {$Y$ ($w$)};

  % --- half-adder row ----------------------------------------------
  \draw[thick] (0,4.6) rectangle (6.4,5.4);
  \node[lbl] at (3.2,5.0) {row of $w$ half adders\quad$X+Y=S+C$};

  % --- three buses out of the HA row -------------------------------
  \draw[->] (0.9,4.6) -- (0.9,3.2);
  \draw[->] (3.0,4.6) -- (3.0,3.2);
  \draw     (5.8,4.6) -- (5.8,0.6);
  \draw[->] (5.8,0.6) -- (5.2,0.6);
  \node[lbl, anchor=west] at (0.95,3.95) {$C=X\wedge Y$};
  \node[lbl, anchor=west] at (3.05,3.50) {$S\!\gg\!1$ ($w{-}1$)};
  \node[lbl, anchor=west] at (5.85,3.70) {$s_0$ (1)};

  % --- compound adder ----------------------------------------------
  \draw[thick] (0.3,2.4) rectangle (4.2,3.2);
  \node[lbl] at (2.25,2.8) {compound adder};

  % Z and Z' columns
  \draw (0.7,2.4) -- (0.7,0.95);
  \draw (3.5,2.4) -- (3.5,2.05) -- (4.5,2.05) -- (4.5,0.95);
  \fill (0.7,2.2) circle (1.3pt);
  \fill (3.5,2.2) circle (1.3pt);
  \draw (0.7,2.2) -- (2.2,2.2) -- (2.2,1.9);
  \draw (3.5,2.2) -- (3.0,2.2) -- (3.0,1.9);
  \node[lbl, anchor=west] at (0.75,1.15) {$Z$ ($w{+}1$)};
  \node[lbl, anchor=west] at (4.55,1.15) {$Z'\;{=}\,Z{+}1$};

  % --- multiplexer --------------------------------------------------
  \draw[thick] (1.9,1.35) rectangle (3.3,1.9);
  \node[lbl] at (2.6,1.62) {mux};
  \draw[->] (1.5,1.62) -- (1.9,1.62);
  \node[lbl, anchor=east] at (1.45,1.62) {$s_0$};
  \draw (2.6,1.35) -- (2.6,0.95);

  % --- LSB append ---------------------------------------------------
  \draw[thick] (0.05,0.35) rectangle (1.35,0.85);
  \draw[thick] (1.95,0.35) rectangle (3.25,0.85);
  \draw[thick] (3.85,0.35) rectangle (5.15,0.85);
  \node[lbl] at (0.70,0.60) {LSB $:=s_0$};
  \node[lbl] at (2.60,0.60) {LSB $:=\overline{s_0}$};
  \node[lbl] at (4.50,0.60) {LSB $:=s_0$};

  % --- outputs ------------------------------------------------------
  \draw[->] (0.70,0.35) -- (0.70,-0.05);
  \draw[->] (2.60,0.35) -- (2.60,-0.05);
  \draw[->] (4.50,0.35) -- (4.50,-0.05);
  \node[lbl, anchor=north, align=center] at (0.70,-0.12) {$X{+}Y$\\($w{+}2$)};
  \node[lbl, anchor=north, align=center] at (2.60,-0.12) {$X{+}Y{+}1$\\($w{+}2$)};
  \node[lbl, anchor=north, align=center] at (4.50,-0.12) {$X{+}Y{+}2$\\($w{+}2$)};

\end{circuitikz}
\end{document}
```

*after Fig. 5.22, p. 125, extended with the sum-selection stage of Eq. 5.49.*

**Buy an empty column with a carry-save step.** Take $X,Y$ unsigned on $w$ bits
and pass each column through a [[Half Adder]]: $s_i=x_i\oplus y_i$ and
$c_{i+1}=x_i\wedge y_i$ for $i=0\ldots w-1$. Column $i$ held the value
$x_i+y_i\in\{0,1,2\}$ and now holds $s_i+2c_{i+1}$, which is the same integer,
so $X+Y=S+C$ *exactly* — this is a two-addend [[CSA, Carry-Save Adder]] step,
one gate deep and independent per column. As compression it is worthless (two
vectors in, two vectors out). What it buys is a **hole**: every $c$ bit is
produced at weight $2^{i+1}$, so $C$ has nothing at weight $2^0$, and

$$X+Y \;=\; s_0 \;+\; 2\big(A+B\big),\qquad
A=\textstyle\sum_{i=1}^{w-1}s_i2^{\,i-1},\qquad
B=\textstyle\sum_{i=1}^{w}c_i2^{\,i-1}.$$

Both halvings are wiring, not hardware: $A$ is $S$ read off from bit 1 upward
($w-1$ bits) and $B=C/2$ is literally the bitwise $X\wedge Y$ ($w$ bits), since
dividing the weight-$2^{i+1}$ carry by two puts it at position $i$, exactly
where $x_i\wedge y_i$ was computed.

**Run one prefix tree, harvest two sums.** Zero-extend $A$ to $w$ bits and feed
the pair into a [[Compound Adder]], which duplicates only the $c_0$-dependent
bottom row of its prefix tree and therefore returns $Z=A+B$ and $Z'=Z+1$ for
roughly the price of one adder ([[Parallel Prefix Adders]]). $A+B\le
(2^{w-1}-1)+(2^{w}-1)=3\cdot2^{w-1}-2$, so $Z$ and $Z'$ are both $w+1$ bits and
$Z'$ cannot overflow. Note what $Z'$ means downstream: it is $+1$ *at weight
$2^1$*, i.e. $+2$ in the original scale. That mismatch of scales is the whole
trick — the operator needs increments of $1$ and $2$, and the shifted adder
supplies $2$ for free while the LSB supplies $1$.

**Recover the three sums by choosing an upper part and an LSB.** Writing
$U\!:\!b$ for the $(w+2)$-bit concatenation of a $(w+1)$-bit $U$ with LSB $b$,
we have $U\!:\!b=2U+b$, and by the displayed identity $X+Y=2Z+s_0$. Then
distribute the increment across the two halves by case analysis on $s_0$:

- $X+Y=2Z+s_0=Z\!:\!s_0$ for either value of $s_0$.
- $X+Y+1=2Z+s_0+1$. If $s_0=0$ this is $2Z+1=Z\!:\!1$; if $s_0=1$ it is
  $2Z+2=2Z'=Z'\!:\!0$. Both cases are $(\,s_0\,?\,Z':Z\,)\!:\!\overline{s_0}$.
- $X+Y+2=2Z+s_0+2=2(Z+1)+s_0=Z'\!:\!s_0$, again for either value of $s_0$,
  because the $+2$ lands entirely in the shifted domain and never disturbs the
  LSB.

> [!warning] The book over-counts the multiplexers
> p. 125 first says the triple sum costs "a multiplexer" (singular) and then, one
> paragraph later, states the overhead as "a row of $w$ half adders and three
> $w+2$-bit multiplexers". The singular statement is the correct one. The case
> analysis above shows $X+Y=Z\!:\!s_0$ and $X+Y+2=Z'\!:\!s_0$ with **no
> selection at all** — both are pure wiring, one bus concatenated with one bit,
> identical for $s_0=0$ and $s_0=1$. Concretely at $w=4$, $X=5$, $Y=2$: the HA
> row gives $s_0=1$, $A=3$, $B=0$, so $Z=3$ and $Z'=4$; the book's Eq. 5.49
> "else" branch reads $X+Y=Z1=7$ and $X+Y+2=Z'1=9$, and the "if" branch would
> have read $Z0=6$ and $Z'0=8$ — the two branches differ only in the LSB they
> paste on, which is $s_0$ in both. Only the middle output genuinely switches
> its upper part, so the real cost is **one $(w{+}1)$-bit multiplexer**, plus an
> inverter on $s_0$.

**Delay is one addition plus two gates.** The critical path is one half adder
(one XOR/AND, in parallel), the compound adder's $\log_2 w$ prefix depth, and
one mux level — versus $3\times$ the area and $3\times$ the carry-out fan-in
load if you instantiated three independent adders, or one adder plus two
increment chains if you cascaded them. On an FPGA the arithmetic changes: the
half-adder row costs $w$ LUTs it did not need before, whereas a hardened carry
chain ([[FPGA Hard Carry Chain Adder]]) makes three plain $(w{+}2)$-bit adders
cheap and fast up to $w\approx32$, so the trick only pays once $w$ is large
enough that a prefix tree beats the carry chain, or once the compound adder is
already in the design for [[Rounding]].

$$\boxed{\ Z=\big((X\oplus Y)\!\gg\!1\big)+(X\wedge Y),\quad Z'=Z+1,\quad s_0=x_0\oplus y_0\ }$$
$$\boxed{\ X+Y=Z\!:\!s_0,\qquad X+Y+1=(s_0\,?\,Z':Z)\!:\!\overline{s_0},\qquad X+Y+2=Z'\!:\!s_0\ }$$

**Where it stops working.**

- **Three is the maximum.** From $\{Z,Z'\}\times\{0,1\}$ you can form
  $2Z,2Z+1,2Z+2,2Z+3$, and the answer must be $2Z+s_0+k$ for *both* values of
  $s_0$. That forces $k\in\{0,1,2\}$; $k=3$ needs $2Z+4=2(Z+2)$ when $s_0=1$,
  i.e. a third bottom row producing $Z+2$. The operator is not a general
  "sum plus small constant" engine.
- **Only two addends.** The half-adder row is a $2{:}2$ recoding. If the
  operands already arrive as a carry-save pair (from a multiplier tree), you
  need a $3{:}2$ compressor first and the empty column at position 0 is not
  free.
- **$w=1$ degenerates**: $A$ is zero bits wide and the "prefix tree" is a single
  bit; write the three sums out by hand.
- **Signed operands.** The derivation above is unsigned. Two's-complement
  operands work with sign extension to $w+2$ before the HA row, but then the
  output widths and the "$Z'$ cannot overflow" bound must be re-checked against
  [[Number Formats]].
- The overhead is only worth it when **all three** outputs are consumed. A
  consumer needing just $X+Y$ and $X+Y+1$ should use the plain
  [[Compound Adder]] and skip the half-adder row entirely.

**RTL.**

```spade
fn triple_sum<#uint W>(x: uint<W>, y: uint<W>)
    -> (uint<{W + 2}>, uint<{W + 2}>, uint<{W + 2}>)
{
    let p = x ^ y;              // half-adder sums S      (W bits)
    let g = x & y;              // half-adder carries C/2 (W bits, already halved)
    let s0: uint<1> = trunc(p); // position 0 collapses to one bit
    let odd: bool   = p.lsb();

    let z:  uint<{W + 1}> = (p >> 1) + g;   // Z  = (X + Y - s0) / 2
    let zp: uint<{W + 1}> = trunc(z + 1);   // Z' = Z + 1  (compound adder's 2nd output)

    let mid = if odd { zp } else { z };
    (z.concat(s0), mid.concat(~s0), zp.concat(s0))
}
```

`p` and `g` are the half-adder row's two output buses; `g` needs no shifter
because the carry out of column $i$ is already the weight-$2^{i}$ bit of $B$.
`(p >> 1) + g` is `uint<W> + uint<W>` $\to$ `uint<W+1>`, which is the compound
adder's $Z$; `trunc(z + 1)` is its second row, truncated back to $W+1$ because
`+` widens and the bound $Z<2^{w+1}-1$ guarantees nothing is lost. `concat` on
integers puts its receiver in the **high** position, so `z.concat(s0)` is
$Z\!:\!s_0$, the $(W{+}2)$-bit result. Everything is combinational — a
pipelined version cuts after the prefix tree, before the mux. Synthesis will
not build the `+ 1` as a separate adder as written here; a real compound adder
shares one prefix tree and duplicates only its bottom row, which the `+`/`+1`
spelling leaves to the tool.

Simulated against `x + y` in Icarus with 10 named vectors (including the
asymmetric $1+128$ and $128+1$, which a bit-reversed datapath fails) and a
3000-vector random sweep at $W=8$, checking all three outputs each time:
3010/3010 pass.

**Related notes.**

- [[Compound Adder]] – depends-on: supplies $Z$ and $Z'$ from a single prefix
  tree; this note is that operator plus a half-adder row and one mux.
- [[Half Adder]] – depends-on: the $w$-wide row whose only job is to empty
  column 0 so the LSB can be pasted on afterwards.
- [[CSA, Carry-Save Adder]] – compares: same redundant recoding, but used here
  for its weight structure rather than for compressing addends.
- [[Parallel Prefix Adders]] – supports: the $\log_2 w$ tree whose $c_0$-free
  upper region is what makes the second sum nearly free.
- [[Floating-Point Operators]] – extends: the consumer that wants three
  consecutive sums at once, so rounding can be resolved without a second pass.
- [[FPGA Hard Carry Chain Adder]] – counter-example: where three independent
  adders are cheaper than one shared prefix tree, this construction loses.

> [!warning] Why $+2$? Not covered in the source — needs outside research
> p. 124 justifies the compound adder by rounding ("the rounded significand is
> either a sum or the successor of this sum"), but p. 125 introduces the triple
> sum only as "some fast floating-point adders [Soh+22] require the computation
> of $X+Y$, $X+Y+1$ and $X+Y+2$ in parallel", with no account of which rounding
> or normalisation path produces the third value. Chase [Soh+22] before quoting
> a motivation.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §5.3.9 "Fast Compound
  Triple Sum", p. 125 — Fig. 5.22 (half-adder row rewriting $X+Y=S+C$) and
  Eq. 5.49 (the $s_0$ case split), plus the cost statement contested above.
- Same, §5.3.7 "Compound Fast Adder", p. 123 and Fig. 5.20 — the $Z$/$Z'$ block.
- Same, §5.4, p. 125-128 — hardened carry chains, for the FPGA trade-off.
