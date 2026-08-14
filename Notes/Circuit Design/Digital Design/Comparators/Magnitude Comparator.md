---
title: Magnitude Comparator
description: "X<Y as the negated carry-out of X+~Y+1: one adder's leftmost carry path, every sum bit discarded."
kind: circuit
source: "ASA §6.1, §6.1.2, §6.3.1, pp. 145-149"
status: seed
spade: simulated
tags: [digital, comparator, carry, subtraction, prefix, fpga]
aliases:
  - Magnitude Comparators
  - Ordering Comparator
  - Less-Than Comparator
  - Greater-Than Comparator
  - Integer Comparator
---

# Magnitude Comparator

Decides the order of two $w$-bit unsigned integers by running the carry chain of $X+\overline{Y}+1$ and keeping only its leftmost bit — the one comparison predicate that does **not** get cheaper when you ask for less of it.

```tikz title="Magnitude comparison as a subtraction whose sum bits are never built"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node[font=\small] at (0.3,3.4) {$X$};
\node[font=\small] at (4.0,3.4) {$Y$};
\draw[->] (0.3,3.15) -- node[left,font=\tiny]{$w$} (0.3,0.95);
\draw[->] (4.0,3.15) -- node[right,font=\tiny]{$w$} (4.0,2.55);
\node[draw,minimum width=2.0cm,minimum height=0.7cm] (inv) at (4.0,2.2)
  {$w$ inverters};
\draw[->] (inv.south) -- node[right,font=\tiny]{$\overline{Y}$, $w$} (4.0,0.95);
\node[draw,minimum width=6.4cm,minimum height=1.0cm] (add) at (2.15,0.45)
  {carry chain of $X+\overline{Y}+c_0$};
\draw[->] (7.6,0.45) -- node[above,font=\tiny]{$c_0=1$} (add.east);
\draw (add.west) -- (-1.20,0.45);
\node[ocirc,scale=0.8] at (-1.35,0.45) {};
\draw[->] (-1.50,0.45) -- (-3.30,0.45);
\node[anchor=east,font=\small] at (-3.40,0.45) {$X<Y$};
\node[anchor=south,font=\tiny] at (-2.40,0.60) {$c_w=(X\ge Y)$};
\node[anchor=north,font=\tiny] at (-2.40,0.32) {1};
\foreach \x in {-0.6,0.3,1.2,2.1,3.0,3.9,4.8}{
  \draw[dashed,->] (\x,-0.05) -- (\x,-0.75);
}
\node[anchor=north,font=\tiny] at (2.15,-0.85)
  {the $w$ sum bits $s_{w-1..0}$ are never built};
\node[anchor=west,font=\tiny,align=left] at (5.45,1.9)
  {per bit of the chain:\\ $g_i=x_i\wedge\overline{y_i}=[\,x_i>y_i\,]$\\
   $p_i=x_i\oplus\overline{y_i}=[\,x_i=y_i\,]$};
\end{circuitikz}
\end{document}
```

*interface after Fig. 6.1, p. 145; the internal decomposition is the construction of Sect. 6.1.2, p. 146*

**Turn the ordering question into a carry-out.** $X<Y$ is the sign bit of the difference $X-Y$, but a signed difference is an awkward thing to build out of unsigned parts. Push it through the two's-complement identity $-Y=\overline{Y}+1$ instead, where $\overline{Y}$ is the $w$-bit bitwise complement, so $\overline{Y}=2^w-1-Y$ by definition of the complement on $w$ bits:

$$X + \overline{Y} + 1 \;=\; X + (2^w - 1 - Y) + 1 \;=\; 2^w + (X-Y)$$

by associativity and commutativity of integer addition alone — no case split, no sign reasoning. The left-hand side is a sum of two $w$-bit unsigned values and a carry-in, so it lands in $[0,\,2^{w+1}-1]$ and is exactly $w+1$ bits wide; its most significant bit is by construction the carry out $c_w$ of the $w$-bit chain. The right-hand side exceeds $2^w$ precisely when $X-Y\ge 0$. Therefore $c_w=[X\ge Y]$ and, negating, $\overline{c_w}=[X<Y]$ — one inverter on a one-bit signal.

**Read off the other three predicates for free.** $X\ge Y$ is $c_w$ itself, unnegated. $X>Y$ and $X\le Y$ come from the *same* circuit with the operands swapped: $c_w(Y,X)=[Y\ge X]=[X\le Y]$, and its negation is $[X>Y]$. Equality is then $[X\ge Y]\wedge[Y\ge X]$ by antisymmetry of a total order, one AND gate on top of two chains — though if equality is the *only* thing wanted, the dedicated AND-of-XNORs in [[Equality Comparator]] is far cheaper than any carry chain and should be used instead. Nothing here needs a third chain.

**Discard every sum bit — that is the entire saving.** A general-purpose processor answers $X<Y$ by executing a subtraction and testing a flag, which materialises all $w$ sum bits and then throws them away. The application-specific version keeps the carry path and deletes the sum XORs: the recurrence $c_{i+1}=g_i\vee(p_i\wedge c_i)$ never reads $s_i$, so the $w$ output XOR gates are dead logic, and every intermediate carry $c_1\ldots c_{w-1}$ is needed only as an input to the next stage, never as an output. What survives is one $w$-deep dependency chain producing one bit. This is a constant-factor win, not an asymptotic one — the depth is still $\Theta(w)$ for a ripple chain and $\Theta(\log w)$ for a tree, exactly as in [[Adders]].

> [!note] The comparator is a carry chain you refuse to finish
> Instantiate any adder on $X+\overline{Y}+1$ and its per-bit signals come out as $g_i=x_i\wedge\overline{y_i}=[\,x_i>y_i\,]$ and $p_i=x_i\oplus\overline{y_i}=\overline{x_i\oplus y_i}=[\,x_i=y_i\,]$. Generate means "this bit decides, and it says greater"; propagate means "this bit abstains and defers to the bits below it". The adder's carry recurrence *is* the comparison reduction, under a renaming. That is why a magnitude comparator is never dedicated hardware on any real target — it is an adder with its output stage deleted.

**Reuse the leftmost path of a prefix tree, and only that path.** Because $\circ$ is associative — the same proof as in [[Parallel Prefix Adders]], do not re-derive it — $c_w$ is a prefix reduction over $[0,w)$, so any topology from [[Kogge-Stone Tree]] or [[Brent-Kung Tree]] computes it in $O(\log w)$ depth. But a magnitude comparator needs the *single* prefix $[0,w)$, not all $w$ of them, so every part of the tree that exists purely to deliver $c_1\ldots c_{w-1}$ can be pruned away. What is left is a balanced binary reduction of $w-1$ $\circ$-nodes at depth $\lceil\log_2 w\rceil$ — the same shape [[Binary Tree Comparator]] arrives at from divide-and-conquer, and cheaper than any full prefix network. On ASIC that pruned tree is the answer.

**On FPGA the ripple chain wins anyway.** Mapped naively, one bit per LUT feeding the hard carry logic, the construction costs $w$ LUTs — and this is the default synthesis tools already emit for `X < Y` (p. 148). [[Fast Carry Chain Comparator]] halves it to $\lceil w/2\rceil$ by pre-comparing aligned 2-bit chunks in the BLE's two LUTs before the hard full adder ([[Lookup-Tables]]), and up to 64-bit operands that chain also has the *best latency*, beating every tree: the dedicated carry path is fast enough, and the general routing a tree's edges must cross slow enough, that the asymptotics reverse. The ASIC conclusion and the FPGA conclusion genuinely disagree here, and the FPGA one holds across every width you are likely to build.

**Asking for less does not buy less.** For $X=Y$ the reduction collapses to $E_{H:L}=E_H\wedge E_L$, one bit per edge. For $X<Y$ there is no such collapse: every internal node must still distinguish *less*, *equal* and *greater*, because a node that only knows "my chunk is not greater" cannot tell whether the chunks below it matter. Two bits per edge, at every node but the root (p. 147). The magnitude predicate is therefore strictly the expensive member of the comparator family — and it is the one the carry chain was built for.

$$\boxed{\;X+\overline{Y}+1 = 2^{w}+(X-Y)\;\Longrightarrow\; c_w=[\,X\ge Y\,],\quad \overline{c_w}=[\,X<Y\,]\;}$$

**When it breaks.**

- **Signed operands.** The derivation above is unsigned throughout. Two's-complement operands compare correctly only after exchanging the two MSBs — a wire crossing, no logic — see [[Two's-Complement Comparator]].
- **Mismatched formats.** $\mathrm{ufix}(m_X,\ell_X)$ against $\mathrm{ufix}(m_Y,\ell_Y)$ must be zero-padded to a common format *first*. Comparing the raw integers of two different formats is the one way this circuit returns a confidently wrong answer ([[Number Formats]]).
- **When $X-Y$ is wanted anyway.** Absolute difference, or exponent alignment inside [[Floating-Point Operators]]: there the sum bits are not waste, and a plain subtracter beats a comparator plus a subtracter.
- **Past $\approx 64$ bits on FPGA** the $\lceil w/2\rceil$-long carry propagation starts to bind and [[Two-Level Fast Carry Comparator]] takes over — at strictly worse area, so only once latency actually binds.
- **When one operand is constant.** Every leaf collapses to a wire or an inverter and chunks widen to a full LUT input; [[Constant Comparator]] is a free factor of $\alpha/2$ in both area and depth.
- **Degenerate width.** At $w=0$ both operands are $0$ and the seeded $c_0=1$ propagates straight out as $X\ge Y$ — correct, but only because the chain is allowed to have zero stages.

> [!warning] No measured numbers in Chapter 6
> The chapter gives no synthesis table: no ns delays, no slice or FF counts, no device-by-device figures. The LUT-count formulas and the two crossover statements ("best latency up to 64 bits", "several thousand bits") are everything the text supports. Anything more precise needs outside research.

**RTL (Spade).**

```spade
/// Carry-out of X + ~Y + 1, i.e. the Boolean (X >= Y).
fn ge<#uint W>(x: uint<W>, y: uint<W>) -> bool {
    let d: uint<{W + 1}> = trunc((x + ~y) + 1);
    d.msb()
}

/// (X<Y, X=Y, X>Y) from two carry chains and one AND.
fn magcmp<#uint W>(x: uint<W>, y: uint<W>) -> (bool, bool, bool) {
    let xge = ge(x, y);          // c_w of X + ~Y + 1
    let yge = ge(y, x);          // the same chain, operands swapped
    (!xge, xge && yge, !yge)
}
```

`ge` is the box in the diagram: `~y` is the inverter bank, `x + ~y` is the $w$-bit chain widening to $w+1$, the `+ 1` is the carry-in $c_0$, and `d.msb()` taps the leftmost carry $c_w$ — the wire the diagram's bubble hangs off. The `trunc` is provably lossless rather than a real truncation: the second `+` widens to $w+2$, but the value never exceeds $(2^w-1)+(2^w-1)+1 = 2^{w+1}-1$. All of it is combinational, no clock, one bit out per predicate. Synthesis will *not* build what the diagram draws — it recognises the pattern and maps `ge` onto the hard carry chain, deleting the sum XORs and folding the inverters into the LUT masks, which is exactly the point of the construction.

Compiled and simulated at $W=8$ through a concrete `entity magcmp8(x: uint<8>, y: uint<8>) -> uint<3>` returning `[lt, eq, gt].as_uint()`: all $2^{16}$ operand pairs exhaustively, plus 3000 random vectors, plus named asymmetric cases ($1$ vs $128$, $127$ vs $128$, `0xAA` vs `0x55`, and each of those reversed) that a bit-order or operand-order inversion would fail while symmetric vectors would not. Zero mismatches against Verilog `<`, `==`, `>`.

**Related Notes.**

- [[Equality Comparator]] – compares: the sibling predicate, and the only one whose reduction collapses to one bit per edge.
- [[Binary Tree Comparator]] – extends: reaches the same $\lceil\log_2 w\rceil$ reduction from divide-and-conquer instead of from a subtraction.
- [[Fast Carry Chain Comparator]] – extends: halves the LUT count by pre-comparing 2-bit chunks before the hard full adder.
- [[Two-Level Fast Carry Comparator]] – extends: two chains of $\sqrt{w}$ once one chain of $w/2$ is too deep.
- [[Constant Comparator]] – extends: freezing $Y$ collapses every leaf and widens every chunk.
- [[Two's-Complement Comparator]] – depends-on: what must happen to the operands before this derivation is valid at all.
- [[Choosing a Comparator]] – compares: where this sits against every sibling.
- [[RCA, Ripple-Carry Adder]] – supports: the $\Theta(w)$ chain this taps, with its sum stage deleted.
- [[Parallel Prefix Adders]] – supports: associativity of $\circ$, proved once there and reused here.
- [[Kogge-Stone Tree]] – supports: the $O(\log w)$ topology, of which only the leftmost path survives pruning.
- [[Brent-Kung Tree]] – supports: the area-first topology, same pruning argument, fewer nodes.
- [[Adders]] – depends-on: every carry-recurrence result this note assumes without proof.
- [[Floating-Point Operators]] – counter-example: exponent alignment needs the difference itself, so there the sum bits stop being waste.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6 "Fixed-Point Comparison".
  - Sect. 6.1 Introduction and Fig. 6.1 (comparator interface, three mutually exclusive outputs), p. 145
  - Sect. 6.1.2 Area and Delay Considerations — $X<Y$ as the sign bit *and* the carry out of $X-Y$; logarithmic time using only the leftmost tree of any prefix tree of Chap. 5; the other predicates by negation and operand swap, p. 146
  - Sect. 6.2 — two bits per edge for the ordering predicate, one for equality, p. 147
  - Sect. 6.3.1 Exploiting Fast Carry Logic — $w$ LUTs naive, $\lceil w/2\rceil$ improved [PZC10], best latency for sizes up to 64 bits, p. 148
  - Sect. 6.3.3 Comparing to a Constant, p. 149
- [PZC10] Perri, Zicari, Corsonello, "Efficient Absolute Difference Circuits in Virtex-5 FPGAs", *Melecon* 2010, pp. 309–313 — the $w/2$-LUT construction, cited p. 148.
