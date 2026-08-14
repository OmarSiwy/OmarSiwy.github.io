---
title: Compressor Trees
description: "Any heap becomes a height-2 heap in Θ(log_1.5 h) combinational levels with no carry propagation inside the tree — only the final adder propagates; costs wide irregular interconnect and a final adder whose length the schedule decides."
kind: circuit
source: "ASA §7.1.1, pp. 153-156; §7.3.1, pp. 175-180"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, compressor, carry-save, multiplier, fpga]
aliases:
  - "Compressor Tree"
  - "Compressor"
  - "Compressors"
  - "Compression Tree"
  - "Reduction Tree"
  - "Partial Product Reduction Tree"
  - "Partial Product Reduction"
---

# Compressor Trees

A network of sum-preserving cells that reduces a [[Bit Heaps|bit heap]] of height $h$ to height 2 in $\Theta(\log_{1.5}h)$ combinational levels, deferring *all* carry propagation to one final adder behind the tree.

```tikz title="Greedy compression of a 4x4 multiplier bit heap: three full-adder levels then a 6-bit final adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % --- compressor highlights, drawn first so dots sit on top ---
  % stage 1: FA on columns 2,3,4   stage 2: FA on columns 3,5   stage 3: FA on column 4
  \foreach \c/\dy in {2/0, 3/0, 4/0, 3/-2.0, 5/-2.0, 4/-4.0}
    \draw[rounded corners=3pt,fill=black!12,draw=black!35]
      (-0.5*\c-0.16,\dy+0.14) rectangle (-0.5*\c+0.16,\dy+1.06);
  % final adder spans columns 1..6 of the height-2 heap
  \draw[rounded corners=3pt,fill=black!8,draw=black!45]
      (-3.16,-5.86) rectangle (-0.34,-5.24);

  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/3,5/2,6/1}
    \foreach \r in {1,...,\h} \fill (-0.5*\c,0.30*\r) circle (2.4pt);
  \foreach \c/\h in {0/1,1/2,2/1,3/3,4/2,5/3,6/1}
    \foreach \r in {1,...,\h} \fill (-0.5*\c,-2.0+0.30*\r) circle (2.4pt);
  \foreach \c/\h in {0/1,1/2,2/1,3/1,4/3,5/1,6/2}
    \foreach \r in {1,...,\h} \fill (-0.5*\c,-4.0+0.30*\r) circle (2.4pt);
  \foreach \c/\h in {0/1,1/2,2/1,3/1,4/1,5/2,6/2}
    \foreach \r in {1,...,\h} \fill (-0.5*\c,-6.0+0.30*\r) circle (2.4pt);
  \foreach \c in {0,...,7} \fill (-0.5*\c,-7.5) circle (2.4pt);

  \foreach \dy/\lbl in {%
      0/{$\mathcal{B}_0$: 16 bits\, $h_{\max}=4$ \ --- stage 1 places 3 FA},
      -2.0/{$\mathcal{B}_1$: 13 bits\, $h_{\max}=3$ \ --- stage 2 places 2 FA},
      -4.0/{$\mathcal{B}_2$: 11 bits\, $h_{\max}=3$ \ --- stage 3 places 1 FA},
      -6.0/{$\mathcal{B}_3$: 10 bits\, $h_{\max}=2$ \ --- final adder over cols 1--6\, carry out to col 7},
      -7.5/{$P=X\times Y$\, 8 bits}}
    \node[anchor=west] at (0.55,\dy+0.45) {\lbl};

  \foreach \c in {0,...,7} \node[anchor=north,font=\tiny] at (-0.5*\c,-7.62) {\c};
  \node[anchor=north] at (-1.75,-8.05)
    {column $c$ (weight $2^c$); every shaded box is one compressor and preserves $V(\mathcal{B})$};
  \node[anchor=east] at (-3.8,0.55) {AND array of $X\!\times\!Y$, $4\times4$};
  \node at (-1.75,-6.85) {$\Downarrow$};
\end{circuitikz}
\end{document}
```

*after Fig. 7.6 and Fig. 7.7, p. 156.*

**Reduce multiplication to a heap so that the only hard problem left is summation.** Expand the product of two unsigned integers $X$ of $w_X$ bits and $Y$ of $w_Y$ bits and apply **distributivity of $\times$ over $+$** twice:

$$X\times Y=\Big(\sum_{i=0}^{w_X-1}2^ix_i\Big)\Big(\sum_{j=0}^{w_Y-1}2^jy_j\Big)=\sum_{i=0}^{w_X-1}\sum_{j=0}^{w_Y-1}2^{i+j}\,x_iy_j .$$

Every term $x_iy_j$ is one bit of weight $2^{i+j}$ produced by one AND gate, so the $w_Xw_Y$ partial-product bits are generated in a single gate delay, in parallel, with no carries anywhere. What remains is a pure summation problem over a multiset of weighted bits — column $c$ holds $\#\{(i,j):i+j=c\}$ bits, giving the triangular profile $1,2,\dots,w,\dots,2,1$ for $w_X=w_Y=w$. All the architectural difficulty of a multiplier is now downstream of that AND array.

**Fix the correctness condition before choosing any cell.** A *compressor* is any combinational circuit that maps input bits at positions $p_k$ to output bits at positions $q_k$ such that

$$\sum_{k}2^{p_k}\,\mathrm{in}_k=\sum_{k}2^{q_k}\,\mathrm{out}_k\qquad\text{for every input assignment.}$$

That is the entire specification — nothing about latency, fan-in, or which column a bit "belongs" to. By **associativity and commutativity of $+$ in $\mathbb{Z}$**, replacing any sub-multiset of $\mathcal{B}$ by a compressor's outputs leaves $V(\mathcal{B})=\sum 2^ib_i$ invariant, so a tree of such cells is correct by construction regardless of how the cells are scheduled. Scheduling is therefore a pure cost problem, and every note in this topic is a different answer to it.

**Take the full adder as the smallest useful compressor.** A [[Full Adder]] consumes $a_k,b_k,c_k$ of weight $2^k$ and emits $s_k$ of weight $2^k$ and $c_{k+1}$ of weight $2^{k+1}$: three bits in, two bits out, one bit of heap removed per cell. It is exact because $a+b+c\in\{0,1,2,3\}$ and the 2-bit value $2c_{k+1}+s_k$ spans exactly that range. A [[Half Adder]] is the $(2;2)$ degenerate case — it removes *no* bits, so it is never a compressor in the counting sense, but it moves a bit from column $k$ to column $k+1$, which is how a schedule reshapes a heap it cannot yet shrink.

**Keep the carries inside the tree instead of resolving them.** A full adder's carry out is not wired to a neighbouring cell's carry in; it is simply dropped into column $k+1$ as another dot, to be consumed by some later level or by the final adder. This is [[Carry-Save Adder|carry-save arithmetic]] generalised from a rectangle to an arbitrary heap shape: the tree contains no carry chain at all, so its delay is the number of levels times one FA delay, independent of the heap's width. The alternative — a cascade of [[Ripple-Carry Adder|ripple-carry adders]], one per row of the paper-and-pencil algorithm — pays $O(w)$ carry propagation per row and $O(w)$ rows.

**Bound the number of levels.** One level of full adders turns three rows into two, so a level can compress height by at most a factor $\tfrac32$. Running that backwards from the output, where by definition the height is 2, lets $m_l$ denote the largest heap height that $l$ levels can still reduce to 2:

$$m_l=\lfloor 1.5\,m_{l-1}\rfloor,\qquad m_0=2 .$$

| $l$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $m_l$ | 2 | 3 | 4 | 6 | 9 | 13 | 19 | 28 | 42 | 63 | 94 | 141 | 211 | 316 | 474 |

*Table 7.1, p. 176.* The level count is $L=\min\{l:m_l\ge h_{\max}\}$. Since $m_l\approx 2\cdot1.5^l$, this is $L\approx\log_{1.5}(h_{\max}/2)$, **logarithmic in heap height and completely independent of heap width**. That asymmetry is what makes merging a whole polynomial or a whole FIR tap set into one heap nearly free in depth: doubling the number of summands costs about $1.7$ extra levels, while doubling the word length costs none.

**The greedy schedule in the drawing is already suboptimal, which is why the sequence matters.** The diagram applies the book's introductory rule — place a full adder wherever a column holds three or more bits — and needs three levels and 6 FAs on a heap of $h_{\max}=4$. But $m_2=4\ge4$, so the bound says two levels suffice. Scheduling *as late as possible* against $m_l$ instead ([[Dadda Tree]]) reaches height 2 in two levels using 4 FA and 2 HA. Greedy compression burns cells reducing columns further than the next level needs them reduced.

**Nothing in the tree produces a number.** Its output is a height-2 heap, i.e. two vectors in carry-save form, and a conventional adder must still combine them; a ternary adder relaxes the target to height 3. The final adder is on the critical path and is usually the single largest block, so its *length* is a first-class objective of the schedule, not an afterthought — the $8\times8$ example of Figs. 7.19–7.20 needs a 14-bit final adder under Dadda and a 10-bit one under [[Reduced Area Compressor Tree|Reduced Area]], on the identical heap. Columns that reach height 1 early leave the adder entirely; column 0 of a multiplier heap always has height 1, so $p_0$ bypasses both tree and adder.

**On FPGA the cell that defines the tree is the wrong cell to build it from.** A $(3;2)$ full adder consumes a whole 6-input LUT to remove one bit. The same LUT fabric tabulates any compressor of fewer than six inputs outright, and the hard carry chain can be recruited inside a compressor, so a [[Generalized Parallel Counter|GPC]] such as $(6,0,7;5)$ removes 8 bits for 4 LUT6 — twice the efficiency per LUT. Minimising FA count therefore stops being the same objective as minimising area, and the $m_l$ recurrence, which counts only FA levels, stops predicting anything on [[FPGAs]]. ASIC keeps FA count meaningful because a full adder is genuinely cheap in standard cells.

$$\boxed{\ V(\mathcal{B})\ \text{invariant},\qquad m_l=\lfloor1.5\,m_{l-1}\rfloor,\ m_0=2,\qquad L=\min\{l:m_l\ge h_{\max}\}=\Theta(\log_{1.5}h_{\max})\ }$$

**When it breaks.**

- $h_{\max}\le2$ already: the tree is empty and the whole cost is the final adder. Below $h_{\max}=4$ or so the $\Theta(\log_{1.5}h)$ argument has no room to pay for the irregular routing it causes.
- The bound counts *levels of full adders*, not delay. With larger compressors a level is deeper than one FA, so fewer levels can be slower; with FPGA carry-chain GPCs a level is deeper still but the chain is nearly free.
- Wiring, not cells, dominates at scale. A tall heap keeps columns tall for many levels, and the interconnect between levels is wide, irregular and unroutable-looking — the reason [[Pipelined Compressor Tree|pipelining]] a tall tree costs so many flip-flops.
- The tree assumes all bits are available simultaneously. They are not: a triangular multiplier heap finishes its extreme columns first and its middle last, so a uniform fast final adder is wasted and a [[Split Final Adder]] wins.
- Correctness is preserved *exactly*, so nothing here licenses dropping bits. Deleting bits for accuracy is a separate, error-analysed step — see [[Truncated Bit Heap]] and [[Error Accuracy]].

**RTL (Spade).** The compressor tree of the diagram, unrolled: an unsigned $4\times4$ multiplier, 16 partial products, 6 full adders in 3 levels, then one 6-bit final adder.

```spade
fn fa(a: bool, b: bool, c: bool) -> (bool, bool) {
    (a ^^ b ^^ c, (a && b) || (a && c) || (b && c))
}

entity mult4(x: uint<4>, y: uint<4>) -> uint<8> {
    let xb = x.as_bits();
    let yb = y.as_bits();

    let p00 = xb[0] && yb[0];
    let p01 = xb[0] && yb[1]; let p10 = xb[1] && yb[0];
    let p02 = xb[0] && yb[2]; let p11 = xb[1] && yb[1]; let p20 = xb[2] && yb[0];
    let p03 = xb[0] && yb[3]; let p12 = xb[1] && yb[2];
    let p21 = xb[2] && yb[1]; let p30 = xb[3] && yb[0];
    let p13 = xb[1] && yb[3]; let p22 = xb[2] && yb[2]; let p31 = xb[3] && yb[1];
    let p23 = xb[2] && yb[3]; let p32 = xb[3] && yb[2];
    let p33 = xb[3] && yb[3];

    // level 1: columns 2, 3, 4 -- sum stays, carry falls into the next column
    let (s2a, k3a) = fa(p02, p11, p20);
    let (s3a, k4a) = fa(p03, p12, p21);
    let (s4a, k5a) = fa(p13, p22, p31);

    // level 2: columns 3 and 5
    let (s3b, k4b) = fa(s3a, p30, k3a);
    let (s5b, k6b) = fa(p23, p32, k5a);

    // level 3: column 4 -- heap is now height 2
    let (s4c, k5c) = fa(s4a, k4a, k4b);

    let rowa: uint<6> = [p01, s2a, s3b, s4c, s5b, p33].as_uint();
    let rowb: uint<6> = [p10, false, false, false, k5c, k6b].as_uint();
    let hi: uint<7> = rowa + rowb;
    hi.concat(p00.as_uint())
}
```

`rowa` and `rowb` are the two shaded rows of $\mathcal{B}_3$, columns 1–6, so `[bool; 6]` element 0 is column 1 — array index 0 is the LSB. The `+` is the only carry propagation in the entity and widens $6\to7$ by the rule for `+`; `hi.concat(p00.as_uint())` prepends the bypassed column-0 bit as the LSB (for *integers* `concat` puts the left operand high, the opposite of the array convention), giving `uint<8>`. Everything is combinational — `fa` is a `fn`, so it cannot hold a register even by accident. The three `false` entries in `rowb` are the columns that reached height 1, and synthesis will delete their final-adder cells outright, which is exactly the "shorter final adder" that the [[Reduced Area Compressor Tree|RA]] schedule spends half adders to buy; a real generator emits the shortened adder rather than trusting the optimiser.

> [!warning] Table 7.2, p. 180 is misprinted, and so is one sentence of p. 177
> Table 7.2 lists FA $=0$, HA $=0$ and FF $=-80$ for **both** Dadda and RA, which contradicts the surrounding prose ("the Dadda tree requires fewer full adders and half adders, the RA tree requires the smaller final adder and a significant lower amount of FFs"). The same corruption reaches the text on p. 177, which ends the worked Dadda example with "As a result, 0 full adders and 0 half adders are necessary for this example" — Fig. 7.19 on the facing page visibly contains roughly thirty shaded compressor groups. Only the final-adder lengths, 14 for Dadda against 10 for RA, are usable numbers from that comparison.

**Related Notes.**

- [[Bit Heaps]] – depends-on: supplies the multiset $\mathcal{B}$ and the invariant $V(\mathcal{B})$ that every compressor here must preserve.
- [[Full Adder]] – depends-on: the $(3;2)$ cell the level bound $\lfloor1.5m_{l-1}\rfloor$ is derived from.
- [[Half Adder]] – supports: removes no bits, but moves one from column $k$ to $k{+}1$, which is how a schedule reshapes a heap it cannot shrink.
- [[Carry-Save Adder]] – extends: the tree is carry-save generalised from a rectangular three-vector row to an arbitrary heap shape.
- [[Ripple-Carry Adder]] – counter-example: the row-by-row bracketing this replaces, and still the cell of choice for the final adder's early-arriving LSBs.
- [[Dadda Tree]] – extends: schedules the same cells as late as possible against $m_l$, minimising FA and HA count.
- [[Wallace Tree]] – extends: the classic as-soon-as-possible pole, the historical name for the greedy schedule drawn above.
- [[Reduced Area Compressor Tree]] – compares: same asymptotics, spends extra half adders to shorten the final adder from 14 bits to 10.
- [[Generalized Parallel Counter]] – extends: widens the cell library past $(3;2)$, which is what makes trees efficient on FPGA.
- [[4-2 Compressor]] – extends: a row compressor usable down to the last level, unlike a tall counter.
- [[Split Final Adder]] – supports: exploits the non-uniform arrival profile the tree leaves behind.
- [[Pipelined Compressor Tree]] – extends: registers between levels, where the interconnect width of a tall schedule becomes a flip-flop bill.
- [[Choosing a Compressor Tree]] – compares: where this sits against every scheduling alternative in this topic.
- [[Multipliers]] – supports: the operator this note reduces to a summation problem.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 7.

- §7.1.1 A multiplier as a compressor tree, pp. 153–156 — (7.2)–(7.3), Figs. 7.2–7.7.
- §7.3 Compressor tree synthesis, pp. 175–176 — statement of the height-2 target.
- §7.3.1 Basic compression algorithms, pp. 176–180 — (7.25), Table 7.1, Figs. 7.19–7.20, Table 7.2.
- §7.3.2.4 Generalized parallel counters for FPGAs, pp. 182–184 — why FA count stops being the FPGA objective.
