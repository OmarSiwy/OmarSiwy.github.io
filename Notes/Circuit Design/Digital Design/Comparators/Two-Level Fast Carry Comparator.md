---
title: "Two-Level Fast Carry Comparator"
description: "Parallel k-bit chunk comparisons re-encoded as two synthetic integers and compared again on a second carry chain: two chains of sqrt(w) instead of one of w/2, at strictly worse area."
kind: circuit
source: "ASA §6.3.2, pp. 148-149"
status: seed
spade: simulated
tags: [digital, comparators, carry, fpga]
aliases:
  - Two-Level Tree of Fast Carry Logic
  - Two-Level Comparator
  - Two-Level Tree Comparator
  - Two-Level Fast Carry Comparators
---

# Two-Level Fast Carry Comparator

A comparator that compares $k$-bit chunks of $X$ and $Y$ in parallel, re-encodes each chunk's verdict as one bit of each of two synthetic $k'$-bit integers, and compares *those* on a second fast carry chain — trading area for a delay of $\sqrt{w}$ carry stages instead of $w/2$.

```tikz title="Two-level comparator: parallel k-bit chunk comparisons re-encoded into two synthetic integers and compared on a second fast carry chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\foreach \i/\x in {0/7.6, 1/5.1, 2/2.6, 3/0.1}{
  \node[draw,minimum width=1.9cm,minimum height=0.9cm] (u\i) at (\x,2.2) {cmp$_{\i}$ ($k$ bits)};
  \draw[<-] ([xshift=-6mm]u\i.north) -- node[left,font=\tiny]{$k$} ++(0,0.9)
        node[above,font=\small]{$X_{\i}$};
  \draw[<-] ([xshift=6mm]u\i.north) -- node[right,font=\tiny]{$k$} ++(0,0.9)
        node[above,font=\small]{$Y_{\i}$};
  \draw[->] ([xshift=-6mm]u\i.south) -- ++(0,-0.75) node[pos=0.45,left,font=\tiny]{$x'_{\i}$};
  \draw[->] ([xshift=6mm]u\i.south) -- ++(0,-0.75) node[pos=0.45,right,font=\tiny]{$y'_{\i}$};
}
\node[draw,minimum width=9.9cm,minimum height=1.0cm] (lvl2) at (3.85,0.7)
      {level 2: carry-out of $X'+\overline{Y'}+1$ over $k'$ chunks};
\draw[->] (lvl2.west) -- node[above,font=\tiny]{1} ++(-1.9,0)
      node[left,font=\small]{$X<Y$};
\node[font=\tiny,align=center] at (3.85,-0.35)
     {$X'=x'_{k'-1}\!\ldots x'_0$ and $Y'=y'_{k'-1}\!\ldots y'_0$ are $k'$-bit synthetic integers
      (Table 6.2);\\
      $kk'\ge w$, balanced at $k\approx k'\approx\sqrt{w}$};
\end{circuitikz}
\end{document}
```

*after Sect. 6.3.2 and Table 6.2, pp. 148–149*

**Identify the one resource that stops scaling.** The [[Fast Carry Chain Comparator]] packs two aligned 2-bit chunks into each basic logic element, so a $w$-bit comparison is a single carry propagation of length $\lceil w/2\rceil$. Every LUT in it evaluates in parallel; the only serial resource is the carry itself. At $w=64$ that chain is still faster than any tree built out of general routing, which is why it is the default. At $w=4000$ it is 2000 carry stages deep and nothing about the LUTs has got worse — only the chain. The fix must therefore shorten the chain without abandoning it.

**Cut the operand into chunks and compare them all at once.** Split $X$ and $Y$ into $k'$ aligned chunks of $k$ bits, $kk'\ge w$, and compare each pair $(X_i,Y_i)$ independently — $k'$ comparisons that share no signal, hence run concurrently on $k'$ short carry chains of $\lceil k/2\rceil$ stages each. What comes out is $k'$ three-valued verdicts, and the whole construction turns on how they are encoded.

**Re-encode each verdict as one bit of each of two integers.** Use the encoding of Table 6.2, the same two bits the single-level comparator emits per 2-bit chunk:

| | $X_i<Y_i$ | $X_i=Y_i$ | $X_i>Y_i$ |
| --- | --- | --- | --- |
| $x'_i$ | 0 | 0 | 1 |
| $y'_i$ | 1 | 0 | 0 |

Collect the $x'_i$ into a $k'$-bit integer $X'$ and the $y'_i$ into a $k'$-bit integer $Y'$, chunk $i$ landing at bit position $i$. Then compare $X'$ and $Y'$ with an ordinary fast carry comparison — one chain of $\lceil k'/2\rceil$ stages.

**Prove the second comparison answers the first.** Unsigned order is decided at the most significant differing bit position: if $j$ is the largest index with $x'_j \ne y'_j$ then $X'<Y'$ iff $y'_j=1$. By the table, $x'_i \ne y'_i$ exactly when $X_i \ne Y_i$, and $x'_i = y'_i = 0$ whenever $X_i = Y_i$. So $j$ is the index of the most significant differing *chunk*, and there $y'_j=1$ says $X_j<Y_j$. Positional weight then gives the result: with all chunks above $j$ equal, $X<Y \iff X_j<Y_j$. Hence

$$X<Y \;\Longleftrightarrow\; X'<Y'$$

exactly. This is not a coincidence of the encoding — $(x'_i, y'_i)$ *is* the generate/kill pair $(G_i, \overline{G_i \vee E_i})$ of the prefix formulation in [[Binary Tree Comparator]], and comparing $X'$ against $Y'$ applies the same associative $\circ$ operator one level up. The construction is a two-level regrouping of one associative reduction, which is why it composes with no glue logic.

**Balance the two chains, and the optimum falls out of AM–GM.** Level 1 costs $\lceil k/2\rceil$ carry stages, level 2 costs $\lceil k'/2\rceil$, and they are serial, so the delay is $D \approx (k+k')/2$ subject to $kk'\ge w$. By the arithmetic–geometric mean inequality $k+k' \ge 2\sqrt{kk'} \ge 2\sqrt{w}$, with equality iff $k=k'$. Hence

$$k \approx k' \approx \sqrt{w}, \qquad D \approx \sqrt{w}$$

against $w/2$ for the single chain — the crossover the book reports at "several thousand bits" (p. 149), not at the $w>4$ the asymptotics alone would suggest, because the boundary between the levels crosses general routing and one such crossing costs many dedicated carry stages. Same argument as the one that kills the tree comparator on FPGA; here it is paid once instead of $\log_2 w$ times, which is exactly why two levels are affordable and $\log_2 w$ levels are not.

**Count the area honestly — it is worse, not better.** Level 1 still performs a full $w$-bit comparison, just chopped up: $\lceil k/2\rceil$ LUTs per chunk $\times\ k'$ chunks $= w/2$ LUTs, the entire cost of the single-level solution. On top of that, each chunk must produce an explicit *equality* bit, which the single-level version never materialises (equality is implicit in the full adder's propagate). A LUT6 compares 3 bits of $X_i$ against 3 of $Y_i$, so that is a further $w/3$ LUTs ([[Equality Comparator]]). Level 2 adds about $\sqrt{w}/2$. The total is roughly $0.83w$ LUTs — "much higher than the $w/2$ LUTs of the plain fast carry solution" (p. 149), and the reason the two-level tree is a latency instrument only.

**Two knobs the book leaves open.** In a pipelined design the objective is not minimum delay but *filling the stage you already have*: [[FloPoCo]] picks $k$ so that level 1 consumes the delay remaining in the current pipeline stage and level 2 starts fresh in the next, which pushes $k$ away from $\sqrt{w}$ in whichever direction the stage boundary sits. And the two-level split generalises — a LUT6 supports a ternary comparison tree rather than the binary one, and fast carry logic supports a $p$-level tree of $\sqrt[p]{w}$-bit comparators, mixable and matchable. For practical sizes none of these beats plain fast carry on area.

$$\boxed{\ D \approx \tfrac{k+k'}{2}\ \text{carry stages},\quad kk'\ge w \;\Rightarrow\; k=k'=\sqrt{w},\ D\approx\sqrt{w};\qquad A \approx \tfrac{w}{2}+\tfrac{w}{3}+\tfrac{\sqrt{w}}{2}\ \text{LUTs}\ }$$

**When it breaks.**

- Below a few thousand bits it simply loses: at $w=64$ the single chain is 32 stages and already the latency optimum (p. 148), and the two-level version pays $+w/3$ LUTs plus a routing hop to save nothing.
- If only $X=Y$ is wanted, do not build this. Equality is an AND-reduction, $\lceil w/3\rceil$ LUT6s and a balanced tree of depth $\lceil\log_3 w\rceil$ — already logarithmic, and the two-level construction is pure overhead.
- The $\sqrt{w}$ figure assumes both levels are dedicated carry chains with a single routing hop between them. If the synthesiser refuses to keep the chunk comparators in adjacent slices, the inter-level routing dominates and the model is worthless.
- $k$ and $k'$ are not free once pipelined: filling a stage beats minimising raw delay, and the two objectives coincide only by accident.
- AMD tooling will not infer this — the plain comparator is what synthesis emits from `x < y`. Generating it means asking for it: `flopoco IntComparator w=1000` builds the two-level version, each level on fast carry logic (p. 149).

```spade
/// Table 6.2 (p. 148): encode one chunk comparison as the pair (x'_i, y'_i).
fn verdict<#uint K>(xi: uint<K>, yi: uint<K>) -> (bool, bool) {
    (xi > yi, xi < yi)
}

/// w = 16 split as k = k' = 4: four 4-bit chunks compared in parallel,
/// re-encoded into two synthetic 4-bit integers, compared on a second chain.
entity cmp2_16(x: uint<16>, y: uint<16>) -> bool {
    let xb = x.as_bits();
    let yb = y.as_bits();
    let (g0, l0) = verdict(xb[0..4].as_uint(),   yb[0..4].as_uint());
    let (g1, l1) = verdict(xb[4..8].as_uint(),   yb[4..8].as_uint());
    let (g2, l2) = verdict(xb[8..12].as_uint(),  yb[8..12].as_uint());
    let (g3, l3) = verdict(xb[12..16].as_uint(), yb[12..16].as_uint());

    let xp = [g0, g1, g2, g3].as_uint();
    let yp = [l0, l1, l2, l3].as_uint();
    let s: uint<6> = (xp + ~yp) + 1;
    !s.as_bits()[4]
}
```

`xb[4i..4i+4]` is chunk $i$ — `as_bits()` puts index 0 at the LSB, and `[bool; 4]` packs element 0 low, so array position and bit weight agree in both directions. `(g0..g3)` and `(l0..l3)` are the $x'$ and $y'$ wires of the diagram; `xp`/`yp` are $X'$ and $Y'$, `uint<4>` because $k'=4$. The level-2 line is the synthetic subtraction spelled out: `uint<4> + uint<4>` grows to `uint<5>`, `+1` to `uint<6>`, and bit 4 of that sum is the carry out of $X'+\overline{Y'}+1$, i.e. $[X'\ge Y']$ — so the negation is $X<Y$. Everything is combinational; there is no register in the block, and in a real design the pipeline cut goes on `xp`/`yp`, between the levels. Synthesis will not draw it as two blocks: each `>`/`<` inside `verdict` becomes its own short carry chain, and the level-2 adder a fourth, so the placer sees five chains and the $\sqrt{w}$ delay claim survives only if it keeps them adjacent.

**Related Notes.**

- [[Fast Carry Chain Comparator]] – depends-on: both levels are instances of it, and its $w/2$-LUT cost is the baseline this is measured against.
- [[Binary Tree Comparator]] – extends: the same associative $\circ$ reduction, regrouped into 2 levels of $\sqrt{w}$ instead of $\log_2 w$ levels of 2.
- [[Equality Comparator]] – supports: supplies the per-chunk equality bit, the $w/3$ LUTs that make this construction cost more than the plain chain.
- [[Choosing a Comparator]] – compares: where this sits against every sibling, and the width at which it starts to win.
- [[Lookup-Tables]] – depends-on: the BLE structure $\mathrm{FA}(p,q,c_i)$ that lets one chunk verdict cost half a LUT pair.
- [[FloPoCo]] – supports: `IntComparator` generates it, and chooses $k$ to fill the pipeline stage rather than to minimise delay.
- [[Constant Comparator]] – counter-example: when one operand is fixed, widening the chunks beats adding a level.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6 "Fixed-Point Comparison".
  - Sect. 6.3.1 Exploiting Fast Carry Logic and Table 6.2, p. 148 — the two-bit chunk encoding, the $\lceil w/2\rceil$ and $\lceil w/3\rceil$ costs, and "best possible latency for sizes up to 64 bits"
  - Sect. 6.3.2 Two-Level Tree of Fast Carry Logic, pp. 148–149 — the construction, $k\approx k'\approx\sqrt{w}$, the FloPoCo pipeline argument, the cost breakdown and the $p$-level generalisation
  - Sect. 5.4 (BLE structure), p. 125, cited from p. 148
