---
title: Recursive Karatsuba
description: "Apply the two-part split to the sub-multipliers themselves — nine small multipliers for 4w x 4w against ten for flat 4-part splitting, at the price of two pre-additions in sequence."
kind: circuit
source: "ASA §8.6.4–8.6.5, pp. 246-248"
status: seed
spade: simulated
tags: [digital, multipliers, karatsuba, recursion, fpga]
aliases:
  - Karatsuba Recursion
  - Recursive Karatsuba Multiplier
---

# Recursive Karatsuba

Re-applying the two-part Karatsuba split to the sub-multipliers it produced, so the multiplier count follows $3^k$ instead of a one-shot constant-factor saving — the only variant of the method that is genuinely sub-quadratic.

```tikz title="One level of the Karatsuba recurrence, and two levels applied to a 4w x 4w product"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\small,
  blk/.style={draw, thick, rectangle, minimum height=8mm, inner xsep=4pt, align=center},
  mul/.style={draw, very thick, rectangle, minimum height=11mm, minimum width=19mm, align=center},
  chunk/.style={draw, rectangle, minimum height=6mm, minimum width=9mm},
  w/.style={-latex, thick}
]

% ---------------- left panel: one level of the recurrence ----------------
\node[chunk] (x1) at (0.4,7.4) {$X_1$};
\node[chunk] (y1) at (1.6,7.4) {$Y_1$};
\node[chunk] (y0) at (5.6,7.4) {$Y_0$};
\node[chunk] (x0) at (6.8,7.4) {$X_0$};
\node[anchor=south] at (3.6,7.8) {$X=2^{W}X_1+X_0$, \ $Y=2^{W}Y_1+Y_0$ \ (chunks are $W$ bits)};

\node[blk] (ax) at (2.9,5.4) {$X_1{+}X_0$};
\node[blk] (ay) at (4.5,5.4) {$Y_1{+}Y_0$};

\node[mul] (mhi)  at (1.3,3.4) {$P_{hi}$\\[-2pt]{\scriptsize $X_1Y_1$}};
\node[mul] (mmid) at (3.7,3.4) {$P_{mid}$\\[-2pt]{\scriptsize $(X_1{+}X_0)(Y_1{+}Y_0)$}};
\node[mul] (mlo)  at (6.2,3.4) {$P_{lo}$\\[-2pt]{\scriptsize $X_0Y_0$}};

\node[blk, minimum width=70mm] (sub) at (3.6,1.6) {$M=P_{mid}-P_{lo}-P_{hi}$};
\node[blk, minimum width=70mm] (fin) at (3.6,0.3) {$P=2^{2W}P_{hi}+2^{W}M+P_{lo}$};

% chunks -> pre-adders
\draw[thick] (x1.south) -- (0.4,6.5) -- (2.5,6.5);
\draw[w] (2.5,6.5) -- (2.5,5.82);
\draw[thick] (x0.south) -- (6.8,6.5) -- (3.3,6.5);
\draw[w] (3.3,6.5) -- (3.3,5.82);
\draw[thick] (y1.south) -- (1.6,6.85) -- (4.1,6.85);
\draw[w] (4.1,6.85) -- (4.1,5.82);
\draw[thick] (y0.south) -- (5.6,6.2) -- (4.9,6.2);
\draw[w] (4.9,6.2) -- (4.9,5.82);

% chunks -> corner multipliers
\draw[thick] (0.4,6.5) -- (0.4,4.4) -- (0.8,4.4);
\draw[w] (0.8,4.4) -- (0.8,3.97);
\draw[thick] (1.6,6.85) -- (1.6,4.4) -- (1.8,4.4);
\draw[w] (1.8,4.4) -- (1.8,3.97);
\draw[thick] (5.6,6.2) -- (5.6,4.4) -- (5.7,4.4);
\draw[w] (5.7,4.4) -- (5.7,3.97);
\draw[thick] (6.8,6.5) -- (6.8,4.4) -- (6.7,4.4);
\draw[w] (6.7,4.4) -- (6.7,3.97);

\node[circ] at (0.4,6.5) {};
\node[circ] at (1.6,6.85) {};
\node[circ] at (5.6,6.2) {};
\node[circ] at (6.8,6.5) {};

% pre-adders -> middle multiplier
\draw[w] (ax.south) -- (2.9,4.4) -- (3.4,4.4) -- (3.4,3.97);
\draw[w] (ay.south) -- (4.5,4.4) -- (4.0,4.4) -- (4.0,3.97);
\node[anchor=east] at (2.8,4.8) {\scriptsize $W{+}1$};
\node[anchor=west] at (4.6,4.8) {\scriptsize $W{+}1$};

% multipliers -> recombination
\draw[w] (mhi.south) -- (1.3,2.02);
\draw[w] (mmid.south) -- (3.7,2.02);
\draw[w] (mlo.south) -- (6.2,2.02);
\node[anchor=west] at (1.4,2.42) {\scriptsize $2W{+}2$};
\node[anchor=west] at (3.8,2.42) {\scriptsize $2W{+}2$};
\node[anchor=west] at (6.3,2.42) {\scriptsize $2W{+}2$};

\draw[w] (sub.south) -- (fin.north);
\draw[w] (fin.south) -- (3.6,-0.4);
\node[anchor=north] at (3.6,-0.45) {$P=XY$ \ ($4W$ bits)};

% ---------------- right panel: two levels of recursion ----------------
\begin{scope}[xshift=95mm]
  \node[blk] (r) at (1.75,7.4) {$4w\times 4w$};
  \node[blk] (c0) at (0.0,5.4) {\scriptsize $(2w{+}1)^2$};
  \node[blk] (c1) at (1.75,5.4) {\scriptsize $(2w{+}1)^2$};
  \node[blk] (c2) at (3.5,5.4) {\scriptsize $(2w{+}1)^2$};
  \draw[w] (r.south) -- (c0.north);
  \draw[w] (r.south) -- (c1.north);
  \draw[w] (r.south) -- (c2.north);
  \foreach \i in {0,...,8} {
    \node[draw, thick, rectangle, minimum size=3.4mm, inner sep=0pt]
      (g\i) at ({0.4375*\i - 0.05},3.5) {};
  }
  \foreach \i in {0,1,2} { \draw[w] (c0.south) -- (g\i.north); }
  \foreach \i in {3,4,5} { \draw[w] (c1.south) -- (g\i.north); }
  \foreach \i in {6,7,8} { \draw[w] (c2.south) -- (g\i.north); }
  \node[anchor=north, align=center] at (1.7,3.0)
    {$9\times(w{+}1)\times(w{+}1)$ multipliers\\[2pt] flat 4-part splitting needs $10$};
  \node[anchor=north, align=left] at (1.7,1.6)
    {\scriptsize $k=\log_2(n/w)$ levels $\Rightarrow$ $3^k$ leaves\\[-1pt]\scriptsize
     and $k$ pre-additions in sequence};
  \node[anchor=west] at (4.5,7.4) {\scriptsize level $0$};
  \node[anchor=west] at (4.5,5.4) {\scriptsize level $1$};
  \node[anchor=west] at (4.5,3.5) {\scriptsize level $2$};
\end{scope}

\end{circuitikz}
\end{document}
```

**Treat the sub-multiplier as another multiplier.** [[Karatsuba]] replaces the middle column of a two-part split by a subtraction, turning one $2W\times 2W$ product into three products of the $W$-bit chunks:

$$X_1Y_0+X_0Y_1=(X_1+X_0)(Y_1+Y_0)-X_0Y_0-X_1Y_1 \tag{8.55, p.\,244}$$

Nothing in that identity requires the chunks to be primitive. Each of the three sub-products is itself a multiplication of two equal-width operands, so the same rewriting applies to it, and to its children. That is the whole content of the method: the split is a *recurrence*, not a one-shot transformation. Applied to a $4w\times 4w$ product it gives three multiplications of up to $(2w+1)\times(2w+1)$, each of which becomes three of up to $(w+1)\times(w+1)$ — **nine small multipliers against the ten that flat 4-part splitting needs** (p. 248).

**Count the leaves.** Let $n=2^k w$ be the operand width and $w$ the width at which the recursion bottoms out — an FPGA DSP block, or the point where a plain [[Unsigned Array Multiplier]] is cheaper than more overhead. Each level replaces one multiplication by three of half the width, so the multiplier count $M$ and the total cost $T$ obey

$$M(n)=3M(n/2),\qquad T(n)=3T(n/2)+\Theta(n)$$

the $\Theta(n)$ being the two pre-additions and the recombination, all linear in the operand width. Unrolling $k=\log_2(n/w)$ times gives $M=3^k$ leaves, and the master theorem gives $T(n)=\Theta(n^{\log_2 3})=\Theta(n^{1.585})$ instead of the $\Theta(n^2)$ of a full partial-product array.

> [!important] Flat $K$-part splitting is not sub-quadratic; only the recursion is
> Splitting into $K$ chunks and pairing every same-weight pair saves the triangle of $K(K-1)/2$ multiplications out of $K^2$, leaving $K(K+1)/2$ — still $\Theta(K^2)$, a constant factor of $2$ and nothing more. Recursion with $K=2^k$ leaves $3^k=K^{\log_2 3}$. The two counts agree closely at small $K$ ($K=2$: 3 vs 3; $K=4$: 9 vs 10) and then diverge: $27$ vs $36$ at $K=8$, $81$ vs $136$ at $K=16$. If you want the asymptotics, you must recurse; if you want one cheap level, [[K-Part Karatsuba Splitting]] is simpler and shares its diagonal products.

**Track the one bit that grows at every level.** The pre-additions $X_1+X_0$ and $Y_1+Y_0$ are $W$-bit adds, so each produces $W+1$ bits — this is why the diagram feeds all three sub-multipliers with $(W{+}1)$-bit operands, zero-extending the two diagonal pairs so that every leaf has the same shape. At level $k$ the operands entering the pre-adder are $n/2^k$ bits and the widest sub-multiplier is $n/2^k+1$ bits wide; the book quotes the uniform figure $(w+1)\times(w+1)$ for the leaves of the $4w$ example, which is the level-1 growth carried down. Widths of one level in the diagram: chunks $W$, pre-adder outputs $W+1$, all three sub-products $2W+2$, the recovered middle column $M=P_{mid}-P_{lo}-P_{hi}$ fits in $2W+1$ bits and is non-negative by construction (it equals $X_1Y_0+X_0Y_1$, a sum of two products of non-negative $W$-bit values), and the final product is $4W$ bits. Sign conventions and the two's-complement forms live in [[Number Formats]]; the method itself is exact, so [[Error Accuracy]] is not in play.

**Pay for it in latency, not in area.** Post-additions are cheap: they are extra terms in the bit heap that the compression tree of the multiplier was going to build anyway, and in carry-save form adding a term is constant time. The pre-additions are the problem — they must carry-propagate *before* the multiplier can start, so they sit in front of the array rather than inside it (p. 245). Recursion stacks $k$ of them in sequence: a depth-$2$ recursion on $4w\times 4w$ puts two full carry-propagate adders ahead of the leaf multipliers, and a depth-$k$ one puts $k$. This is the entire trade. In software the recursion is unconditionally good — GMP uses it, because there a multiplication costs time and an addition costs less time. In hardware the multipliers are spatial and the additions are latency, so the choice between $K$-part splitting and recursion "exposes a trade-off between latency and number of multipliers" (p. 248).

**There is no loop control to pay for.** The recurrence is unrolled in space: each level instantiates three copies of the level below, so a depth-$k$ operator is a $3$-ary tree of $\frac{3^k-1}{2}$ pre-adder/recombiner nodes with $3^k$ leaf multipliers, purely combinational, with $k$ pre-adder delays and $k$ recombination depths on the critical path. Pipelining it is a matter of cutting the tree at chosen levels, and because the tree is balanced the same cut applies to all $3^k$ paths. Time-multiplexing instead — one leaf multiplier, $3^k$ passes — is possible but rarely worth it: the schedule is a depth-$k$ stack walk rather than a counter, and it needs storage for the $k$ levels of pre-added operands, so the control is strictly more expensive than the counter-plus-shift-register of an [[Unsigned Array Multiplier]] doing the same job serially.

**On FPGAs the growing bit is what kills it.** The leaves have to land on DSP blocks, and a DSP48E1 multiplier is $17\times 24$. Every recursion level adds a bit to the pre-added operand, so the leaf width is $n/2^k+1$ rather than $n/2^k$ — a $2$-level recursion on $64\times 64$ produces $17$-bit leaves from $16$-bit chunks, and one more level of growth pushes past the block. Worse, square Karatsuba uses a $17\times 24$ block as $17\times 17$ and throws away a third of it, which is why the book's own recommendation for FPGA targets is [[Rectangular Karatsuba]] rather than deeper recursion. In ASIC flows, where the leaf is a synthesised array and its width is free to grow by one bit, the recursion has no such wall and the pure multiplier count governs.

$$\boxed{\ M(n)=3M(n/2)\ \Longrightarrow\ M(2^k w)=3^k \text{ leaves of } \le (w{+}1) \text{ bits},\ \ 9<10 \text{ at } k=2\ }$$

**When it breaks.**

- **Small $n$.** At $k=1$ the recursion *is* two-part Karatsuba, and at $k=2$ it saves one multiplier out of ten. The overhead — two pre-adders per node, three subtractions per node — swamps that unless the leaf multiplier is genuinely expensive.
- **DSP-targeted designs.** The $+1$ bit per level fails the block-width constraint before the multiplier count matters; see [[Rectangular Karatsuba]] and the crossover numbers in [[Choosing a Multiplier]].
- **Latency-bound designs.** $k$ carry-propagating pre-adders in sequence ahead of the array. If the operator must meet a timing target rather than an area target, stop recursing at $k=1$ or do not recurse at all.
- **Non-power-of-two widths.** The clean $3^k$ count assumes $n=2^k w$. Ragged splits leave odd chunks that either pad (wasting a leaf) or break the uniformity that makes the tree pipelinable.
- **Signed operands.** The recurrence as written is unsigned. The subtractive form of the identity is the one to recurse on when the leaves are natively signed, because it consumes the sign bit that unsigned use would waste — see [[Subtractive Karatsuba]].

**RTL.** One level of the recurrence, generic in the chunk width $W$. Depth-$k$ is built by instantiating this entity in place of the three `*` operators, not by writing a $3^k$-leaf entity by hand.

```spade
/// One level of the Karatsuba recurrence: a 2W x 2W product from three
/// (W+1) x (W+1) sub-products of the operand chunks.
entity kara_level<#uint W>(
    x1: uint<W>, x0: uint<W>, y1: uint<W>, y0: uint<W>
) -> uint<{4 * W}> {
    let a1: uint<{W + 1}> = zext(x1);
    let a0: uint<{W + 1}> = zext(x0);
    let b1: uint<{W + 1}> = zext(y1);
    let b0: uint<{W + 1}> = zext(y0);

    let p_lo: uint<{2 * W + 2}> = a0 * b0;
    let p_hi: uint<{2 * W + 2}> = a1 * b1;
    let sx: uint<{W + 1}> = a0 +. a1;
    let sy: uint<{W + 1}> = b0 +. b1;
    let p_mid: uint<{2 * W + 2}> = sx * sy;

    let mid: uint<{2 * W + 2}> = p_mid -. p_lo -. p_hi;

    let lo: uint<{4 * W}> = zext(p_lo);
    let md: uint<{4 * W}> = zext(mid);
    let hi: uint<{4 * W}> = zext(p_hi);
    lo +. (md << W) +. ((hi << W) << W)
}
```

`x1, x0, y1, y0` are the four chunk boxes at the top of the diagram; `a1..b0` are the zero-extensions that give all three sub-multipliers the identical $(W{+}1)\times(W{+}1)$ shape, so one instantiated entity serves all three positions at the next level down. `sx` and `sy` are the two pre-adder boxes, written with the truncating `+.` because the extension to $W+1$ already made room for the carry. `mid` uses truncating `-.` for the same reason: $M$ is non-negative and fits in $2W+1$ of the $2W+2$ available bits, so no wrap can occur, but plain `-` would widen to $2W+3$ and then $2W+4$ and refuse to type-check. Everything here is combinational; the shifts are wiring, and synthesis will not build the three separate adds of the last line — it merges the shifted terms into one bit heap and one final carry-propagate adder, exactly as [[Multiplier Tiling]] describes for any collection of shifted sub-products.

**Related Notes.**

- [[Karatsuba]] – depends-on: supplies the single-level identity that this note applies to itself.
- [[K-Part Karatsuba Splitting]] – compares: the flat alternative, $K(K+1)/2$ multipliers against $3^k$, with shorter pre-adder chains and reusable diagonal products.
- [[Subtractive Karatsuba]] – extends: the variant to recurse on when the leaf multipliers are natively signed.
- [[Rectangular Karatsuba]] – counter-example: on FPGAs the block shape, not the multiplier count, decides, and recursion's per-level bit growth works against it.
- [[Unsigned Array Multiplier]] – depends-on: the $\Theta(n^2)$ leaf this recursion bottoms out on, and the baseline its $\Theta(n^{1.585})$ is measured against.
- [[Multiplier Tiling]] – supports: the recombination is just another set of shifted sub-products for the ILP to place and the compression tree to absorb.
- [[Choosing a Multiplier]] – compares: where this sits against every sibling, including the crossover widths at which Karatsuba of any form starts to pay.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §8.6 The Karatsuba Method — two-part identity (8.55), p. 244; pre-addition on the critical path, p. 245.
  - §8.6.4 Square $K$-Part Splitting — pp. 246-247, Fig. 8.27 (3-, 4- and 6-part tilings), p. 248.
  - §8.6.5 Recursive Karatsuba — pp. 247-248: nine $(w{+}1)\times(w{+}1)$ multipliers versus ten, and the latency-versus-multiplier-count trade-off.
  - §8.6.7 Karatsuba with Rectangular Sub-multipliers — p. 249, on why square Karatsuba underuses a $17\times 24$ DSP block.
- Long-form note: [[2.4) Multipliers]], "The Karatsuba method".
