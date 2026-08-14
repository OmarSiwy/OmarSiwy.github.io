---
title: Absolute Difference Operator
description: "One compound prefix tree over (X, ~Y) yields both X-Y and Y-X because Y-X = ~(X+~Y); a constant-time mux picks, and one NOR gives an equality flag cheaper than a comparator."
kind: circuit
source: "ASA §5.3.8, p. 124 (with §5.3.7, p. 123)"
status: seed
spade: simulated
tags: [digital, adder, subtraction, prefix, comparator, twos-complement, fpga]
aliases:
  - Fast Absolute Difference Operator
  - Fast Absolute Difference
  - Absolute Difference
  - Absolute Difference Unit
  - AbsDiff
---

# Absolute Difference Operator

A [[Compound Adder]] run on $(X,\overline{Y})$ instead of $(X,Y)$, which makes its two outputs the two differences $Y-X$ and $X-Y$ rather than a sum and its successor — so $|X-Y|$ costs one prefix tree, not two.

```tikz title="Absolute difference from one compound prefix adder over (X, ~Y), with the equality NOR"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize,
  blk/.style={draw,fill=gray!8,align=center,inner sep=3pt}]

  % ---- inputs
  \draw[very thick,->] (2.4,6.05) -- (2.4,5.25);
  \node[anchor=south] at (2.4,6.08) {$X$ \;($w$)};
  \draw[very thick,->] (4.4,6.05) -- (4.4,5.25);
  \node[anchor=south] at (4.4,6.08) {$\overline{Y}$ \;($w$)};

  % ---- one prefix tree, shared
  \node[blk,minimum width=3.7cm,minimum height=1.0cm] (T) at (3.4,4.75)
       {parallel prefix\\tree};
  \draw[very thick] (3.4,4.25) -- (3.4,3.62);
  \draw[very thick] (1.1,3.62) -- (5.6,3.62);
  \draw[very thick,->] (1.1,3.62) -- (1.1,3.32);
  \draw[very thick,->] (5.6,3.62) -- (5.6,3.32);
  \node[anchor=east] at (3.18,3.76) {$(g_i,a_i)_{i<w}$ \;($2w$)};

  % ---- the compound adder: the bottom row duplicated for c_0 = 0 and c_0 = 1
  \node[blk,minimum width=3.0cm,minimum height=0.8cm] (L) at (1.1,2.94)
       {sum completion\\(bitwise negated)};
  \node[blk,minimum width=2.6cm,minimum height=0.8cm] (R) at (5.6,2.94)
       {sum completion};
  \draw[->] (-1.35,3.14) -- (-0.42,3.14);
  \node[anchor=east] at (-1.38,3.14) {$c_0\!=\!0$};
  \draw[->] (8.05,3.14) -- (6.92,3.14);
  \node[anchor=west] at (8.08,3.14) {$c_0\!=\!1$};

  % ---- both differences, into the multiplexer
  \draw[very thick,->] (1.1,2.54) -- (1.1,1.70) -- (2.6,1.70) -- (2.6,1.33);
  \node[anchor=west] at (1.34,2.34) {$\overline{X+\overline{Y}}=Y-X$};
  \node[anchor=west] at (1.34,2.04) {($w$)};
  \draw[very thick,->] (5.6,2.54) -- (5.6,1.70) -- (4.2,1.70) -- (4.2,1.33);
  \node[anchor=west] at (5.82,2.34) {$X+\overline{Y}+1$};
  \node[anchor=west] at (5.82,2.04) {$=X-Y$ \;($w$)};

  % ---- constant-time selection
  \draw[fill=gray!8] (2.0,1.30) -- (4.8,1.30) -- (4.4,0.80) -- (2.4,0.80) -- cycle;
  \node[anchor=north west] at (2.42,1.28) {\tiny $0$};
  \node[anchor=north east] at (4.38,1.28) {\tiny $1$};
  \draw[very thick,->] (3.4,0.80) -- (3.4,0.28);
  \node[anchor=west] at (3.52,0.42) {$|X-Y|$ \;($w$)};

  % ---- the two sign bits: one selects, both feed the equality NOR
  \draw[->] (-0.42,2.74) -- (-1.55,2.74) -- (-1.55,1.05) -- (2.20,1.05);
  \node[anchor=west] at (-1.40,1.92) {$\mathrm{sign}(Y\!-\!X)=c_w$};
  \node[anchor=west] at (-1.40,1.62) {\tiny $1$ bit};
  \node[nor port,scale=0.55] (N) at (9.00,0.15) {};
  \draw (-1.55,1.05) |- (N.in 2);
  \draw (6.92,2.74) -- (8.35,2.74) |- (N.in 1);
  \node[anchor=west] at (8.42,1.90) {$\mathrm{sign}(X\!-\!Y)$};
  \draw[->] (N.out) -- (9.80,0.15);
  \node[anchor=west] at (9.83,0.15) {$X=Y$};

\end{circuitikz}
\end{document}
```

*after Fig. 5.21, p. 124; the second sign bit and the equality NOR are drawn from the text on the same page rather than from the figure, which shows only $\mathrm{sign}(Y-X)$.*

**Make both differences functions of the same sum.** Let $X,Y$ be $w$-bit unsigned integers, so $|X-Y| \le 2^w-1$ and the result still fits in $w$ bits. The naive operator instantiates two subtractors, or a comparator followed by one subtractor with its operands swapped. Neither is necessary, because both differences are readings of a *single* addition. By the **two's-complement identity** $-Y = \overline{Y}+1$,

$$X - Y = X + \overline{Y} + 1,$$

and the book's footnote 5 on p. 124 supplies the companion: from $X-Y-1 = X+\overline{Y}$, negate both sides with the same identity, $-(X-Y-1) = \overline{X+\overline{Y}}+1$, so $Y-X+1 = \overline{X+\overline{Y}}+1$ and therefore

$$Y - X = \overline{X+\overline{Y}}.$$

Write $T = X + \overline{Y}$ as an integer, split as $T = 2^w c_w + S$ with $S$ its low $w$ bits and $c_w$ the carry-out. Then $S+1$ is $X-Y$ and $\overline{S}$ is $Y-X$ — **the same $w$-bit sum vector, read once complemented and once incremented**. All the operator has to do is produce $S$ and $S+1$ and pick.

**Charge both negations to gates that already exist.** $\overline{Y}$ is not an inverter row in front of the adder: in a [[Parallel Prefix Adders|prefix adder]] the first level already computes $g_i = x_i \wedge y_i$ and $a_i = x_i \vee y_i$ from the primary inputs, so complementing $Y$ only changes those two functions to $g_i = x_i \wedge \overline{y_i}$ and $a_i = x_i \vee \overline{y_i}$ — still one gate level, and in CMOS the complemented input is free. The trailing $\overline{\;\cdot\;}$ is absorbed at the other end: sum completion is $s_i = p_i \oplus c_i$, so $\overline{s_i} = \overline{p_i \oplus c_i}$ is an XNOR where the plain row has an XOR, **by De Morgan applied to the XOR's dual form** — the same cell, one output polarity apart. Neither negation adds a level to the critical path, which is the whole reason this identity is worth using.

**Get the incremented copy from the compound adder, not from a second tree.** Everything above the bottom row of a prefix adder computes prefixes of $(g_i,a_i)$ and is independent of $c_0$; only the final row of simplified nodes touches the carry-in, and that row is linear in $w$. Duplicating that one row for $c_0=0$ and $c_0=1$ is the [[Compound Adder]] of §5.3.7, and it hands over $T$ and $T+1$ simultaneously. So the operator is: one prefix tree over $(X,\overline{Y})$ — $2w$ wires out — feeding two sum-completion rows of $w$ bits each, one bitwise negated with $c_0=0$ and one plain with $c_0=1$. The tree, which is the $O(\log w)$-depth and $O(w\log w)$-area part, is paid for **once**.

**Read the selector off a carry-out that is already there.** $T = X - Y - 1 + 2^w$, so $c_w = 1$ exactly when $X-Y-1 \ge 0$, i.e. exactly when $X > Y$; equivalently $c_w = \mathrm{sign}(Y-X)$, the sign bit the figure exports from the negated row. The three cases close cleanly:

- $X > Y$: $c_w = 1$, $S = X-Y-1$, so the wanted value is $S+1$.
- $X < Y$: $c_w = 0$, $S = T \le 2^w-2$, so $\overline{S} = 2^w-1-T = Y-X$.
- $X = Y$: $T = 2^w-1$, so $c_w = 0$, $S$ is all ones, $\overline{S} = 0$ **and** $S+1 = 0$ — the select is a don't-care and either input is correct.

One $w$-bit 2:1 multiplexer driven by $c_w$ therefore completes the operator in constant time, independent of $w$. Note what has been obtained on the side: $c_w$ *is* a [[Magnitude Comparator]] result, computed by hardware that was going to run anyway. Anywhere a design already subtracts, the comparison is free; that is the general lesson, not a fact about this operator.

**Turn the disagreement of the two sign bits into an equality flag.** The second row's carry-out $c_w'$ is the carry-out of $X+\overline{Y}+1$, which is $1$ iff $X \ge Y$, so $\mathrm{sign}(X-Y) = \overline{c_w'}$. Comparing the two exported sign bits, $\mathrm{sign}(Y-X) = [X>Y]$ and $\mathrm{sign}(X-Y) = [X<Y]$: they are complementary in every case **except** $X=Y$, where both are $0$ — the trichotomy law, spelled in hardware. Hence

$$[X=Y] \;=\; \overline{\mathrm{sign}(X-Y) \vee \mathrm{sign}(Y-X)} \;=\; c_w' \wedge \overline{c_w},$$

one 2-input NOR. A standalone [[Equality Comparator]] costs a $w$-wide XOR row plus a $w$-input NOR tree of depth $\Theta(\log w)$; here the tree has already been built by the adder and the flag is a single gate. The saving is real only because the difference was wanted anyway — this is not an argument for computing $|X-Y|$ in order to test equality.

**On FPGAs the sharing that pays for this disappears.** §5.4 changes the ground rules twice (p. 125): carry propagation runs on hardened, non-programmable carry logic that no prefix tree can beat, and arbitrary logic merges into the LUT in front of the chain for free. The second fact keeps $\overline{Y}$ free — it folds into the LUT that already computes $p_i$. The first fact removes the compound adder's leverage: there is no "bottom row" to duplicate inside a hard carry chain, so $T$ and $T+1$ mean *two* carry chains started with different carry-ins, i.e. twice the area for the same delay, rather than one tree plus a linear row. See [[FPGA Hard Carry Chain Adder]] and [[LUT-Merged Adder]].

> [!warning] The book does not cost this operator on FPGA
> §5.3.8 is a VLSI section and §5.4 never revisits the absolute-difference operator. The paragraph above is the consequence of §5.4's two stated facts, not a measurement; no LUT count or delay figure for an FPGA $|X-Y|$ appears in the source, and none should be quoted from here.

$$\boxed{\ T = X+\overline{Y} = 2^w c_w + S \;\Longrightarrow\; |X-Y| = \begin{cases} S+1 & c_w = 1\\ \overline{S} & c_w = 0\end{cases}, \qquad [X=Y] = c_w' \wedge \overline{c_w}\ }$$

**When it breaks.**

- **Signed inputs.** The construction assumes $X,Y \ge 0$ (the book says so explicitly). For $w$-bit *signed* operands the difference ranges over $[-(2^w-1), 2^w-1]$, so both the internal sum and the result need $w+1$ bits; sign-extend both operands by one and run the identical structure one bit wider. Truncating instead silently returns $|X-Y| \bmod 2^w$. See [[Number Formats]].
- **Dropping the second carry-out.** $c_w'$ is not needed for $|X-Y|$ — only $c_w$ selects — so it is the obvious wire to prune. Prune it and the equality flag goes with it; the $X=Y$ case is precisely the one where $c_w$ alone carries no information.
- **Select fan-out.** "Constant time" for the multiplexer assumes its select drives $w$ pass structures from one net. Above a few dozen bits that needs a buffer tree, and the buffer delay lands *after* the tree, on the critical path — the same caveat as `sub` fan-out in [[Two's Complement Adder-Subtractor]].
- **Redundant inputs.** If $Y$ arrives in carry-save form the identity fails at step one: complementing a carry-save pair is not a bitwise operation. Convert out of [[CSA, Carry-Save Adder]] form first.
- **When only $|X-Y|$ is wanted, on a small $w$.** The whole structure exists to amortize one $O(\log w)$ tree. At widths where a [[RCA, Ripple-Carry Adder]] or a hard carry chain is already fast enough, a plain subtract plus a conditional negate is smaller and the extra sum-completion row is waste — see [[Choosing an Adder]].

**RTL (Spade).**

```spade
entity abs_diff<#uint W>(x: uint<W>, y: uint<W>) -> (uint<W>, bool, bool) {
    let t: uint<{W + 1}> = x + ~y;          // T = X + ~Y; the MSB is the carry-out c_w
    let tp: uint<{W + 1}> = trunc(t + 1);   // the c_0 = 1 row of the same prefix tree
    let s: uint<W> = trunc(t);
    let gt = t.msb();                       // sign(Y - X) = c_w : 1 iff X > Y
    let ge = tp.msb();                      // c_w' = NOT sign(X - Y) : 1 iff X >= Y
    let d: uint<W> = if gt { trunc(tp) } else { ~s };
    (d, gt, ge && !gt)
}
```

`t` is the whole left-hand column of the diagram — the prefix tree plus the $c_0=0$ sum completion — with the `+` rule widening $w+w$ to $W{+}1$ bits so that `t.msb()` *is* $c_w$ and needs no separate extraction. `tp` is the duplicated bottom row; `trunc` back to $W{+}1$ is safe because $T+1 \le 2^{W+1}-1$. The `if` is the multiplexer and `~s` is the negated sum completion, so no arm of it costs an adder. Everything is combinational — no `reg`, no clock port — and synthesis will not build two adders from `t` and `tp`: it will share the prefix logic exactly as the drawing says, or, on FPGA, ignore the drawing and lay down two carry chains.

Simulated with iverilog at $W=8$ against a behavioural $|x-y|$ reference: 4524 vectors, 0 failures — 12 named (including the asymmetric $|1-128|$ and $|128-1|$, and all four of $\{0,255\}^2$), 4000 random pairs, and both full sweeps $i$ vs $128$ that walk the selector across the $X=Y$ boundary in each direction.

**Related notes.**

- [[Compound Adder]] – depends-on: supplies $T$ and $T+1$ from one tree; this operator is that circuit with $\overline{Y}$ on the second input.
- [[Parallel Prefix Adders]] – depends-on: why only the bottom row depends on $c_0$, and where $(g_i,a_i)$ come from.
- [[Two's Complement Adder-Subtractor]] – depends-on: the identity $-Y=\overline{Y}+1$ and the free carry-in slot, used here twice.
- [[Magnitude Comparator]] – compares: $c_w$ delivers $[X>Y]$ for nothing, so a separate comparator in front of a subtractor is redundant work.
- [[Equality Comparator]] – compares: a standalone $[X=Y]$ costs a XOR row and a $\log w$ NOR tree; here it is one gate, but only because the subtraction was already paid for.
- [[Compound Triple Sum]] – extends: the same duplicate-the-cheap-row trick pushed to $X+Y$, $X+Y+1$, $X+Y+2$.
- [[Sign-Configurable Adder-Subtractor]] – extends: makes the sign of *both* operands runtime-selectable, which needs a carry-in of $2$ and therefore a different kernel.
- [[Choosing an Adder]] – compares: which tree goes in the box, and at what $w$ the box stops being worth it.
- [[FPGA Hard Carry Chain Adder]] – counter-example: the hard chain has no duplicable bottom row, so the cost argument inverts.
- [[Floating-Point Operators]] – supports: the significand and exponent datapaths of a float adder both want an absolute difference with the comparison attached.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §5.3.8 *Fast Absolute Difference Operator*, p. 124 (Fig. 5.21, footnote 5 for the proof of $Y-X=\overline{X+\overline{Y}}$).
  - §5.3.7 *Compound Fast Adder*, p. 123 (Fig. 5.20).
  - §5.3.1-5.3.6 *Parallel prefix adders*, pp. 117-123 ($(g_i,a_i)$ generation, simplified bottom row, tree depth).
  - §5.4 *Adders on FPGAs*, pp. 125-126 (hard carry logic; free LUT layer in front of the chain).
