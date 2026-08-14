---
title: Parallel Counter
description: "A (p;q) cell turns a column of p bits into a row of q=⌈log2(p+1)⌉ bits; compression per output bit peaks at p=2^q−1, giving (7;3) and (15;4), but it is dead weight once the heap is shorter than p and only wins if hand-optimised below gate level."
kind: circuit
source: "ASA §7.3.2.1, p. 180; Table 7.3, p. 184"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, compressor, counter, fpga]
aliases:
  - Parallel Counters
  - Counter (compressor)
  - "(p;q) counter"
  - "(7;3) counter"
  - Multicolumn counter
---

# Parallel Counter

A $(p;q)$ parallel counter is the compressor that consumes $p$ bits **all of the
same weight** and emits their population count on $q$ bits, so it is the only
compressor family whose shape is fixed entirely by one integer.

```tikz title="The (7;3) parallel counter: dot transformation and its four-full-adder realisation"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]

% ---------------- (a) the (7;3) dot transformation ----------------
\foreach \y in {3.4,3.1,2.8,2.5,2.2,1.9,1.6} { \fill (-1.8,\y) circle (2.2pt); }
\draw[->,thick] (-1.8,1.42) -- (-1.8,1.08);
\fill (-2.3,0.85) circle (2.2pt);
\fill (-1.8,0.85) circle (2.2pt);
\fill (-1.3,0.85) circle (2.2pt);
\node at (-1.8,3.85) {\tiny $p=7$ bits, all of weight $2^{k}$};
\node at (-1.8,0.45) {\tiny $q=3$ bits: $2^{k+2},2^{k+1},2^{k}$};
\node at (-1.8,0.05) {$(7;3)$};
\node at (-1.8,-1.62) {(a) dot transformation};

% ---------------- (b) four full adders, three levels ----------------
\node[draw,minimum width=1.2cm,minimum height=0.5cm,inner sep=1pt] (A) at (1.30,2.8) {FA};
\node[draw,minimum width=1.2cm,minimum height=0.5cm,inner sep=1pt] (B) at (3.90,2.8) {FA};
\node[draw,minimum width=1.2cm,minimum height=0.5cm,inner sep=1pt] (C) at (2.60,1.6) {FA};
\node[draw,minimum width=1.2cm,minimum height=0.5cm,inner sep=1pt] (D) at (2.60,0.35) {FA};

% level-1 inputs
\foreach \x in {0.85,1.30,1.75} { \draw[->] (\x,3.60) -- (\x,3.05); }
\foreach \x in {3.45,3.90,4.35} { \draw[->] (\x,3.60) -- (\x,3.05); }
\node[anchor=south] at (0.85,3.62) {$x_0$};
\node[anchor=south] at (1.30,3.62) {$x_1$};
\node[anchor=south] at (1.75,3.62) {$x_2$};
\node[anchor=south] at (3.45,3.62) {$x_3$};
\node[anchor=south] at (3.90,3.62) {$x_4$};
\node[anchor=south] at (4.35,3.62) {$x_5$};

% x6 straight into level 2
\draw[->] (2.60,3.60) -- (2.60,1.85);
\node[anchor=south] at (2.60,3.62) {$x_6$};

% level-1 sums -> level 2
\draw[->] (1.75,2.55) -- (1.75,2.15) -- (2.25,2.15) -- (2.25,1.85);
\draw[->] (3.45,2.55) -- (3.45,2.05) -- (2.95,2.05) -- (2.95,1.85);
\node[anchor=west] at (1.80,2.36) {\tiny $s_A$};
\node[anchor=east] at (3.40,2.32) {\tiny $s_B$};

% level-1 carries -> level 3
\draw[->] (0.85,2.55) -- (0.85,0.95) -- (2.25,0.95) -- (2.25,0.60);
\draw[->] (4.35,2.55) -- (4.35,0.85) -- (2.95,0.85) -- (2.95,0.60);
\node[anchor=east] at (0.80,1.80) {\tiny $c_A$};
\node[anchor=west] at (4.40,1.80) {\tiny $c_B$};

% level-2 carry -> level 3
\draw[->] (2.60,1.35) -- (2.60,0.60);
\node[anchor=west] at (2.64,1.00) {\tiny $c_C$};

% level-2 sum -> z0
\draw[->] (3.20,1.60) -- (5.00,1.60) -- (5.00,-0.45);
\node[anchor=south] at (3.75,1.63) {\tiny $s_C$};

% level-3 outputs
\draw[->] (2.25,0.10) -- (2.25,-0.45);
\draw[->] (2.95,0.10) -- (2.95,-0.45);
\node[anchor=north] at (2.25,-0.47) {$z_2$};
\node[anchor=north] at (2.95,-0.47) {$z_1$};
\node[anchor=north] at (5.00,-0.47) {$z_0$};
\node[anchor=north] at (2.25,-0.92) {\tiny $2^{k+2}$};
\node[anchor=north] at (2.95,-0.92) {\tiny $2^{k+1}$};
\node[anchor=north] at (5.00,-0.92) {\tiny $2^{k}$};

\node at (2.90,-1.62) {(b) four (3;2) counters in three levels};

\end{circuitikz}
\end{document}
```

*Panel (a) after the $(7;3)$ transformation in Fig. 7.23, p. 185, in the dot
convention of Fig. 7.3, p. 154. Panel (b) is my own construction of the exercise
left to the reader on p. 180.*

**Fix the output width from the input count.** A $(p;q)$ counter takes $p$
one-bit inputs $x_0,\dots,x_{p-1}$, all of weight $2^k$, and outputs
$\sum_j x_j$ as a $q$-bit unsigned integer. The sum ranges over
$0\dots p$, which is $p+1$ distinct values, so the smallest binary encoding
needs

$$q=\lceil\log_2(p+1)\rceil$$

bits, of weights $2^k,2^{k+1},\dots,2^{k+q-1}$. In [[Bit Heaps|dot-diagram]]
terms this is the whole story: the cell **removes a column of $p$ dots and
replaces it with a row of $q$ dots** — panel (a). The [[Full Adder]] is the
$(3;2)$ instance and the [[Half Adder]] is $(2;2)$, so both are members of this
family rather than a separate species.

**Find where the definition stops wasting an output bit.** Because $q$ is a
ceiling, every $p$ in the interval $2^{q-1}\le p\le 2^{q}-1$ costs the *same* $q$
output bits. Compression is the difference $\delta = p-q$, so within a fixed $q$
you should always take $p$ to the top of its interval: one more input bit is free
until the range overflows, at which point $p=2^q$ needs $q+1$ bits to express a
single extra unit. The maximal-compression family is therefore
$p=2^{q}-1$ — the $(3;2)$, the $(7;3)$, the $(15;4)$, the $(31;5)$ — with
$\delta = 2^q-1-q$ growing exponentially in $q$ against a linear output width.
That is the entire argument for building large counters at all.

**Build the $(7;3)$ out of the atom you already have.** Panel (b) realises it
with four full adders in three levels, using nothing but the full-adder identity
$a+b+c = s + 2c_{\text{out}}$ (all one-bit) and associativity of integer
addition. Level 1 splits the first six inputs into two independent triples,

$$x_0+x_1+x_2 = s_A + 2c_A,\qquad x_3+x_4+x_5 = s_B + 2c_B,$$

level 2 folds the leftover $x_6$ into the two weight-$2^k$ sum bits,

$$s_A+s_B+x_6 = z_0 + 2c_C,$$

and level 3 collects the three weight-$2^{k+1}$ carries,

$$c_A+c_B+c_C = z_1 + 2z_2 .$$

Substituting upward and reassociating,

$$\sum_{j=0}^{6}x_j = z_0 + 2(c_A+c_B+c_C) = z_0 + 2z_1 + 4z_2,$$

which is exactly the 3-bit binary encoding of the population count. Every signal
here is 1 bit wide; the "3-bit output" is the concatenation $z_2z_1z_0$, never a
carry-propagating word.

> [!important] The $(7;3)$ built this way is not a new circuit.
> Four full adders in three levels is precisely what an FA-only schedule
> ([[Dadda Tree]] or [[Reduced Area Compressor Tree]]) would already produce for
> a column of seven. Naming it a $(7;3)$ buys nothing at the gate netlist level.
> A large counter is only a win when it is designed *below* the full-adder
> abstraction — hand-optimised at gate level [JS94; FF17] or at transistor level
> [Swa04; Vee+07] on ASIC, or mapped onto an FPGA primitive that a full adder
> cannot exploit. Absent that, prefer the scheduler.

**Respect the height precondition.** A $(p;q)$ counter is only applicable while
the column it targets still holds at least $p$ bits, so it is structurally
unusable in the last compression stages, where every column is already two or
three high. Large counters therefore pay off in exact proportion to how tall the
[[Bit Heaps|heap]] is — a $2048$-term dot product, not a $6\times6$ multiplier.
This is the sharp contrast with the [[4-2 Compressor]]: a row compressor
absorbs a fixed small number of bits per column and passes a lateral signal
sideways, so it stays legal down to the final stage.

**Redo the accounting on FPGA, where the cost model inverts.** A 6-input LUT
tabulates any compressor of fewer than six inputs outright, so on AMD parts the
LUT-only $(6;3)$ costs 3 LUT6 and the $(3;2)$ full adder costs 1 (Table 7.3,
p. 184). Quality is measured by efficiency
$E=(b_i-b_o)/k=\delta/k$ with $k$ the LUT6 count, and on that scale the plain
full adder scores $E=1$ — the *worst* entry in the table. The $(7;3)$ improves on
it by recruiting the fast carry chain rather than more LUTs, and the family that
beats both mixes weights, which is the [[Generalized Parallel Counter]].

> [!warning] Table 7.3, p. 184, is internally inconsistent for the $(7;3)$ row
> Every other row satisfies Eq. (7.27), $E=\delta/k$: $(6;3)$ gives $3/3=1$,
> $(1,4,0,7;5)$ gives $7/4=1.75$, $(6,0,7;5)$ gives $8/4=2$. The $(7;3)$ row
> prints $k=2$ and $E=1.33$, but $\delta = 7-3 = 4$, so $4/2 = 2 \ne 1.33$;
> $1.33 = 4/3$ requires $k=3$. Either the LUT count or the efficiency is
> mistyped, and the book does not say which. The qualitative conclusion is
> unaffected — the $(7;3)$ beats the full adder's $E=1$ on either reading — but
> do not quote the number. Resolving it needs [Yua+19] directly.

$$\boxed{\ q=\lceil\log_2(p+1)\rceil,\qquad \delta=p-q\ \text{ maximised at }\ p=2^{q}-1\ }$$

**Where it stops paying.**

- **Column height below $p$.** The counter cannot be placed at all; it has no
  partially-filled mode. This rules it out of the last two or three stages of
  every tree, and out of short heaps entirely.
- **Small heaps.** For a $6\times6$ multiplier the tallest column is 6, so a
  $(15;4)$ never becomes legal and even the $(7;3)$ fires at most once.
- **No gate-level optimisation.** Built from full adders it *is* a full-adder
  subtree, so it adds a scheduling constraint and removes a scheduling freedom
  for zero gain. The win is an ASIC cell library or an FPGA primitive, not an
  RTL decision.
- **Uniform weight assumed.** The moment the bits you want to absorb sit in
  different columns, the $(p;q)$ shape cannot express it and the
  [[Generalized Parallel Counter]] takes over.
- **Depth.** The FA realisation is $\lceil\log_{1.5}\cdot\rceil$-ish only in
  aggregate; a single $(7;3)$ is 3 FA levels deep, so on a heap of height 7 it
  is no faster than the scheduler's own 3 levels — it is an area argument, not a
  delay argument.

**RTL.**

```spade
/// (3;2) counter — the full adder, the atom every larger counter is built from.
fn fa(a: bool, b: bool, c: bool) -> (bool, bool) {
    (a ^^ b ^^ c, (a && b) || (c && (a ^^ b)))
}

/// (7;3) parallel counter: four (3;2) counters in three levels.
fn counter7(x: uint<7>) -> uint<3> {
    let b = x.as_bits();
    let (s0, c0) = fa(b[0], b[1], b[2]);
    let (s1, c1) = fa(b[3], b[4], b[5]);
    let (z0, c2) = fa(s0, s1, b[6]);
    let (z1, z2) = fa(c0, c1, c2);
    [z0, z1, z2].as_uint()
}
```

`x: uint<7>` is the column of panel (a), one bit per dot, `as_bits()[0]` being
$x_0$; `(s0,c0)` and `(s1,c1)` are the level-1 pair $(s_A,c_A)$, $(s_B,c_B)$.
The `[z0, z1, z2].as_uint()` at the end is the *only* place a weight appears —
array element 0 is the LSB in Spade, so this packs $z_0$ at $2^k$ and $z_2$ at
$2^{k+2}$, matching the output row. Every operator is 1 bit wide and no `+` is
used anywhere, which is the point: a counter never propagates a carry across a
word, and there is no register, so the whole cell is combinational with a
critical path of three full adders. Synthesis will not preserve that structure —
a 7-input, 3-output truth table fits three LUT6 on FPGA and ASIC tools will
flatten and re-map it, which is exactly the sub-full-adder optimisation the note
argues is the only reason to name the cell at all.

**Related notes.**

- [[Full Adder]] – depends-on: the $(3;2)$ instance and the building block of the
  $(7;3)$ realisation above.
- [[Half Adder]] – compares: the $(2;2)$ member, the one counter with $\delta=0$
  that compresses nothing and exists only to move a bit up a column.
- [[Generalized Parallel Counter]] – extends: drops the equal-weight restriction,
  which is what makes the family competitive on FPGA.
- [[4-2 Compressor]] – counter-example: a row compressor has no height
  precondition, so it stays usable in the last stage where a counter cannot.
- [[Bit Heaps]] – depends-on: column height is the quantity that decides whether
  a given $p$ is legal at all.
- [[Efficiency-Driven Compression Heuristic]] – supports: how a counter actually
  gets selected once the library is bigger than {FA, HA}.
- [[Leading Zero Counters]] – compares: also reduces a bit vector to a small
  integer, but reports the position of the first one rather than the population.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §7.1, Fig. 7.3, p. 154 — the dot-transformation convention.
  - §7.3.2, §7.3.2.1 *Counters*, p. 180 — $(p;q)$ definition, $q=\lceil\log_2(p+1)\rceil$,
    the $2^q-1$ family, the $(7;3)$-from-4-FAs exercise, the height precondition.
  - §7.3.2.2 *Row Compressors*, pp. 181–182 — the contrast used above.
  - §7.3.2.4 and Table 7.3, pp. 182–184 — LUT tabulation, efficiency $E=\delta/k$.
  - Fig. 7.23, p. 185 — dot transformations of the counter and GPC library.
