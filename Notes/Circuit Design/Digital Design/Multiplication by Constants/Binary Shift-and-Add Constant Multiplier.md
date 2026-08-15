---
title: "Binary Shift-and-Add Constant Multiplier"
description: "Turns a hard-coded coefficient into nz(C)-1 adders and free wiring, because every partial product is known at synthesis time."
kind: circuit
source: "ASA §12.1, pp. 365-368"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, shift-and-add, adder-graph, fpga]
aliases:
  - "Shift-and-Add"
  - "Binary Shift-and-Add"
  - "Shift-and-Add Constant Multiplier"
  - "Adder Graph"
---

# Binary Shift-and-Add Constant Multiplier

Multiplies $X$ by a compile-time constant $C$ using one adder per nonzero bit of $C$ minus one, and no multiplier hardware at all, because every partial product is either the wire bundle $X$ or nothing.

```tikz title="Binary shift-and-add adder graph for 93X with an 8-bit input, annotated with word widths"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node[font=\small] at (0,0.4) {$X$};
\draw[->] (0,0.15) -- node[right,font=\tiny]{8} (0,-0.7);
\draw (-3.7,-0.7) -- (2.8,-0.7);
\node[draw,minimum width=1.5cm,minimum height=0.6cm] (a24) at (-1.5,-2.2) {$24X$};
\node[draw,minimum width=1.5cm,minimum height=0.6cm] (a5)  at ( 2.0,-2.2) {$5X$};
\node[draw,minimum width=1.5cm,minimum height=0.6cm] (a88) at (-1.5,-4.0) {$88X$};
\node[draw,minimum width=1.7cm,minimum height=0.6cm] (a93) at ( 0.2,-5.8) {$93X$};
\draw[->] (-2.0,-0.7) -- node[left,font=\tiny]{$\ll4$} node[right,font=\tiny]{12} (-2.0,-1.9);
\draw[->] (-1.0,-0.7) -- node[left,font=\tiny]{11} node[right,font=\tiny]{$\ll3$} (-1.0,-1.9);
\draw[->] ( 1.6,-0.7) -- node[left,font=\tiny]{$\ll2$} node[right,font=\tiny]{10} ( 1.6,-1.9);
\draw[->] ( 2.6,-0.7) -- node[left,font=\tiny]{8} node[right,font=\tiny]{$\ll0$} ( 2.6,-1.9);
\draw (-3.7,-0.7) -- node[left,font=\tiny]{$\ll6$} node[right,font=\tiny]{14} (-3.7,-3.7);
\draw[->] (-3.7,-3.7) -- (-1.9,-3.7);
\draw[->] (-1.1,-2.5) -- node[right,font=\tiny]{13} (-1.1,-3.7);
\draw[->] (-1.5,-4.3) -- node[left,font=\tiny]{15} (-1.5,-5.2) -- (-0.1,-5.2) -- (-0.1,-5.5);
\draw[->] ( 2.0,-2.5) -- node[right,font=\tiny]{11} ( 2.0,-5.2) -- ( 0.5,-5.2) -- ( 0.5,-5.5);
\draw[->] (0.2,-6.1) -- node[right,font=\tiny]{15} (0.2,-6.8) node[below,font=\small]{$93X$};
\node[font=\tiny,align=center] at (-0.4,-7.7)
  {$93=1011101_2=2^6+2^4+2^3+2^2+2^0$ \quad ($\mathrm{nz}=5$, so $4$ adders)\\
   $24X=2^4X+2^3X$, \quad $5X=2^2X+X$, \quad $88X=2^6X+24X$, \quad $93X=88X+5X$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.3a, p. 367*

**Expand the constant and push the multiplication inside the sum.** Write the coefficient in binary, $C=(c_{w_C-1}\dots c_1c_0)_2$ with $c_i\in\{0,1\}$. By distributivity of multiplication over addition,

$$X\times C \;=\; X\cdot\left(\sum_{i=0}^{w_C-1}2^ic_i\right) \;=\; \sum_{i=0}^{w_C-1}2^i\,\underbrace{X\cdot c_i}_{\text{partial product}} \tag{12.1, p.\,367}$$

which is the same expansion a generic multiplier performs. The difference is what the $c_i$ *are*. In a generic multiplier they are signals, so $X\cdot c_i$ is a row of $w_X$ AND gates; here they are literals in the source, so $X\cdot c_i$ is decided at elaboration — it is the constant $0$, or it is the $w_X$-bit wire bundle $X$ itself. The zero rows are deleted rather than compressed, and the surviving rows cost nothing to produce.

**A shift is a relabelling, not an operation.** The remaining factor $2^i$ is a left shift by a *constant* amount, which in hardware means bit $j$ of $X$ is called bit $j+i$ of the partial product. No gate, no delay, no routing beyond the wires that had to exist anyway — the free-shift property is the whole reason the technique works, and it is exactly what is lost when the shift amount becomes a signal (see [[Barrel Shifters]]). What survives from (12.1) is a sum of $\mathrm{nz}(C)$ shifted copies of $X$, where $\mathrm{nz}$ is the Hamming weight of $C$, and summing $n$ terms with two-input adders takes $n-1$ of them:

$$N_{\mathrm A}=\mathrm{nz}(C)-1$$

**Name the object, because every later technique is a search over it.** The data-flow graph whose nodes are adders and whose edge weights are shifts is the **adder graph** (p. 367). The diagram above is the adder graph of $93=1011101_2$: five nonzeros, four nodes. Everything that follows in this topic — signed digits, exact minimal-adder search, ternary nodes, multiple-constant sharing — changes which adder graph you build, never the fact that the answer is an adder graph.

**Size every node from the value it carries, not from the operands.** Take $X$ unsigned in $w_X$ bits (formats and the signed case are in [[Number Formats]]). A node holding $kX$ needs $w_X+\lceil\log_2 k\rceil$ bits, since $k(2^{w_X}-1)<k\cdot2^{w_X}$. With $C<2^{w_C}$ the output is

$$w_R = w_X+w_C$$

and for $93X$ with $w_X=8$ that is $8+7=15$ bits, matching $93\cdot255=23715<2^{15}$. The intermediate widths on the diagram follow the same rule: $24X$ needs $8+5=13$, $5X$ needs $8+3=11$, $88X$ needs $8+7=15$. Nothing here truncates, so the result is **exact**, $0$ ulp — the accuracy machinery of [[Error Accuracy]] only becomes relevant once $C$ stops being an integer.

**The adder count is fixed; the shape of the graph is not.** Summing five terms admits many topologies, and they all cost four adders. An LSB-first chain, $5X\to13X\to29X\to93X$, has logic depth $\mathrm{nz}(C)-1=4$ carry-propagate adders. The balanced tree drawn above has depth $\lceil\log_2\mathrm{nz}(C)\rceil=3$. Since a constant multiplier is usually replicated dozens of times inside a filter, depth is what you spend the free choice on — or you pipeline the graph instead, which is [[Pipelined Adder Graph]].

**Count full adders, not adders, and the ranking inverts.** Because the two operands of a node are shifted relative to each other, they overlap only partially: below the overlap the bits of the lower operand pass straight to the output as wires and cost no logic. Normalise a node to $P+2^sQ$ by factoring out the common power of two; if the result is $r$ bits, it costs $r-s$ full-adder equivalents. Apply that to $93X$ at $w_X=8$:

| graph | nodes | full-adder equivalents | depth |
| --- | --- | --- | --- |
| LSB-first chain | $5X,13X,29X,93X$ | $9+9+9+9=36$ | $4$ |
| balanced tree (diagram) | $24X,5X,88X,93X$ | $9+9+9+12=39$ | $3$ |

> [!note] The chain is not accidentally cheap
> In a chain every node has one operand that is still a raw shifted copy of $X$, so the overlap can never exceed $w_X+1$ columns however large the accumulator grows — each adder costs exactly $w_X+1$ cells regardless of the shifts. A tree brings two *already-wide* operands together, and the overlap grows with them. So the tree buys depth by paying area, and the two metrics disagree at equal adder count. That disagreement is the whole subject of [[Minimum Full-Adder Constant Multiplier]].

**Where the mapping differs.** On ASIC each node is a [[Ripple-Carry Adder]] (or a faster sibling) trimmed to its overlap, and the full-adder count above is close to the real gate count, so shift-and-add is simply the right answer (p. 418). On FPGA the node lands on the hard carry chain at one LUT-plus-carry per bit of overlap, so the same count translates into LUTs — but it is measured against a fabric where a table lookup is also free area you have already bought, and [[KCM, Table-Based Constant Multiplication]] usually wins because its cost does not depend on $C$'s bit pattern at all.

$$\boxed{\ CX=\sum_{i\,:\,c_i=1}2^iX,\qquad N_{\mathrm A}=\mathrm{nz}(C)-1,\qquad w_R=w_X+w_C,\qquad \#\mathrm{FA}_{\text{chain}}=\big(\mathrm{nz}(C)-1\big)\,(w_X+1)\ }$$

**When it breaks.**

- $\mathrm{nz}(C)-1$ is an upper bound, never a lower one. $93=3\times31$ needs **two** adders, not four ([[Minimum-Adder Constant Multiplier]]); the true lower bound is $\lceil\log_2\mathrm{nz}(C)\rceil$.
- Runs of ones are the pathological input: $C=2^k-1$ costs $k-1$ adders here and one subtracter in signed-digit form, which is what [[CSD Constant Multiplier]] exists to exploit.
- Cost is a property of the *odd part* of $C$ only. Divide by two until odd, build the graph, left-shift the output: $120=2^3\cdot15$ costs whatever $15$ costs (p. 371).
- $C=0$ and $C=2^k$ need zero adders. A generator that always emits $\mathrm{nz}(C)-1$ nodes emits a graph with $-1$ or $0$ of them, and must special-case both.
- Signed $X$ keeps the free shifts but loses some of the free low bits: every operand must be sign-extended to the node width before the overlap argument applies.
- Depth is linear in $\mathrm{nz}(C)$ in a chain, so a dense $32$-bit constant is a $20$-plus-deep stack of carry-propagate adders. Past roughly $w_C=16$ the graph must be treed or pipelined, not accumulated.
- Non-integer $C$ has no finite binary expansion, so $\mathrm{nz}(C)$ is undefined and the problem becomes *where to stop* — [[Faithful Shift-and-Add Real Constant Multiplier]].

**RTL (Spade).** The graph of the diagram, hard-coded for $C=93$, $w_X=8$:

```spade
// 93X = (2^6 X + (2^4 X + 2^3 X)) + (2^2 X + 2^0 X)
entity mul93(x: uint<8>) -> uint<15> {
    let s3: uint<11> = x.concat(0u3);                 // 2^3 X — pure wiring
    let s4: uint<12> = x.concat(0u4);                 // 2^4 X
    let a24: uint<13> = zext::<11, 12>(s3) + s4;      // 24X
    let s2: uint<10> = x.concat(0u2);                 // 2^2 X
    let a5: uint<11> = zext::<8, 10>(x) + s2;         // 5X
    let s6: uint<14> = x.concat(0u6);                 // 2^6 X
    let a88: uint<15> = zext::<13, 14>(a24) + s6;     // 88X
    a88 +. zext::<11, 15>(a5)                         // 93X
}
```

`x.concat(0u3)` *is* the $\ll3$ edge of the diagram — appending constant zero bits on the right, which emits no logic — and its `uint<11>` result is the width the drawing labels $11$. The four `let`s that use `+` are the four boxes, and Spade's $N\to N+1$ growth on `+` reproduces the node widths without being told them; only the last node uses the truncating `+.`, because $93\cdot255$ provably fits the $15$ bits that $w_R=w_X+w_C$ predicts. The block is purely combinational — no clock port, no register — and synthesis will not build four independent $15$-bit adders from it: the constant-zero and pass-through columns collapse, leaving the $39$ full-adder cells counted above.

**Related Notes.**

- [[CSD Constant Multiplier]] – extends: rewrites runs of ones as signed digits, cutting $\mathrm{nz}(C)$ roughly in half for the constants where this note is worst.
- [[Minimum-Adder Constant Multiplier]] – extends: abandons the bit expansion entirely and searches the space of adder graphs, so $93X$ falls from four adders to two.
- [[Minimum Full-Adder Constant Multiplier]] – counter-example: minimising nodes and minimising full adders are different objectives, as the chain-versus-tree table shows.
- [[KCM, Table-Based Constant Multiplication]] – compares: the FPGA alternative, whose cost is flat in $C$'s bit pattern instead of proportional to $\mathrm{nz}(C)$.
- [[Full Adder]] – supports: the cell this note counts in, and the reason partial overlap is free.
- [[Ripple-Carry Adder]] – depends-on: what each node of the graph actually is once trimmed to its overlap.
- [[Barrel Shifters]] – counter-example: what a shift costs the moment its amount stops being a compile-time literal.
- [[Multipliers]] – compares: the generic operator this specialises, which must compress a full partial-product array because none of its rows is known.
- [[Choosing a Constant Multiplier]] – compares: where this sits against every sibling in the topic.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 12, "Multiplication by Constants".

- §12 chapter opening, Fig. 12.1 black-box interface, Fig. 12.2 generator interface, pp. 365-366
- §12.1 shift-and-add integer constant multiplication, eq. 12.1, adder-graph definition, Fig. 12.3a ($93X$ binary realization), pp. 366-367
- §12.1.1 subtraction costs the same as addition in area, speed and energy, p. 368
- §12.1.3 even coefficients reduce to their odd part, p. 371
- §12.1.6 bit-level cost: partial overlap, pass-through low bits, p. 381
- §12.7 shift-and-add is the ASIC default, p. 418
